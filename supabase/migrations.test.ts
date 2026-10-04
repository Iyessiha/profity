import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";

/*
 * The migrations run against a real Postgres (compiled to WebAssembly) rather
 * than being eyeballed. This catches the syntax errors, but more importantly it
 * exercises the constraints and triggers, which is where this schema keeps its
 * business rules — a rule that is not tested is a rule that is not enforced.
 *
 * Supabase supplies the `auth` schema in production; it is stubbed here so the
 * migrations can reference auth.users and auth.uid() unchanged.
 */

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

let db: PGlite;

/** Run the rest of the test as this user, the way a request would. */
async function actingAs(userId: string | null) {
  await db.exec(
    `select set_config('request.jwt.claim.sub', ${
      userId === null ? "''" : `'${userId}'`
    }, false);`,
  );
}

async function newUser(email: string): Promise<string> {
  const res = await db.query<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [email],
  );
  return res.rows[0].id;
}

beforeAll(async () => {
  db = new PGlite({ extensions: { citext, pgcrypto } });

  await db.exec(`
    create schema if not exists auth;
    create extension if not exists pgcrypto;

    create table auth.users (
      id    uuid primary key default gen_random_uuid(),
      email text not null unique
    );

    create or replace function auth.uid()
    returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);

  const files = (await readdir(MIGRATIONS))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS, file), "utf8");
    try {
      await db.exec(sql);
    } catch (cause) {
      throw new Error(`migration ${file} failed: ${(cause as Error).message}`, {
        cause,
      });
    }
  }
}, 120_000);

describe("migrations", () => {
  it("applies every file in order", async () => {
    const files = (await readdir(MIGRATIONS)).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it("leaves no table without row level security", async () => {
    const res = await db.query<{ tablename: string }>(`
      select tablename
      from pg_tables
      where schemaname = 'public'
        and not rowsecurity
      order by tablename
    `);
    expect(res.rows.map((r) => r.tablename)).toEqual([]);
  });
});

describe("provisioning", () => {
  it("creates a profile, preferences and stats with the account", async () => {
    const id = await newUser("amadou@example.com");

    const profile = await db.query<{ public_id: string }>(
      `select public_id from profiles where id = $1`,
      [id],
    );
    expect(profile.rows[0].public_id).toBe("amadou");

    const prefs = await db.query(
      `select 1 from user_preferences where user_id = $1`,
      [id],
    );
    const stats = await db.query(`select 1 from user_stats where user_id = $1`, [
      id,
    ]);
    expect(prefs.rows).toHaveLength(1);
    expect(stats.rows).toHaveLength(1);
  });

  it("disambiguates a handle that is already taken", async () => {
    const first = await newUser("fatou@example.com");
    const second = await newUser("fatou@autre.com");

    const rows = await db.query<{ public_id: string }>(
      `select public_id from profiles where id in ($1, $2) order by created_at`,
      [first, second],
    );
    const handles = rows.rows.map((r) => r.public_id);
    expect(handles[0]).toBe("fatou");
    expect(handles[1]).not.toBe("fatou");
  });
});

describe("entitlements", () => {
  it("falls back to free with no subscription", async () => {
    const id = await newUser("libre@example.com");
    const res = await db.query<{ tier: string }>(`select current_tier($1) as tier`, [id]);
    expect(res.rows[0].tier).toBe("free");
  });

  it("reads the tier from an active subscription", async () => {
    const id = await newUser("pro@example.com");
    await db.query(
      `insert into subscriptions
         (user_id, tier, amount_minor, currency,
          current_period_start, current_period_end, provider)
       values ($1, 'pro', 9000, 'XOF', now() - interval '1 day',
               now() + interval '29 days', 'cinetpay')`,
      [id],
    );
    const res = await db.query<{ tier: string }>(`select current_tier($1) as tier`, [id]);
    expect(res.rows[0].tier).toBe("pro");
  });

  it("drops back to free once the period lapses", async () => {
    const id = await newUser("lapsed@example.com");
    await db.query(
      `insert into subscriptions
         (user_id, tier, amount_minor, currency,
          current_period_start, current_period_end, provider)
       values ($1, 'pro', 9000, 'XOF', now() - interval '40 days',
               now() - interval '10 days', 'cinetpay')`,
      [id],
    );
    const res = await db.query<{ tier: string }>(`select current_tier($1) as tier`, [id]);
    expect(res.rows[0].tier).toBe("free");
  });
});

describe("credits", () => {
  it("maintains the wallet from the ledger", async () => {
    const id = await newUser("credits@example.com");

    await db.query(
      `insert into credit_ledger (user_id, amount, reason) values ($1, 40, 'pack')`,
      [id],
    );
    await db.query(
      `insert into credit_ledger (user_id, amount, reason) values ($1, -15, 'analysis')`,
      [id],
    );

    const res = await db.query<{
      balance: number;
      total_earned: number;
      total_spent: number;
    }>(`select balance, total_earned, total_spent from credit_wallets where user_id = $1`, [id]);

    expect(res.rows[0]).toEqual({
      balance: 25,
      total_earned: 40,
      total_spent: 15,
    });
  });

  it("refuses to go overdrawn", async () => {
    const id = await newUser("overdrawn@example.com");
    await db.query(
      `insert into credit_ledger (user_id, amount, reason) values ($1, 5, 'pack')`,
      [id],
    );

    await expect(
      db.query(
        `insert into credit_ledger (user_id, amount, reason) values ($1, -10, 'analysis')`,
        [id],
      ),
    ).rejects.toThrow();
  });
});

describe("webhook idempotency", () => {
  it("rejects a replayed processor event", async () => {
    const insert = `
      insert into webhook_events (provider, external_id, event_type, payload, signature_ok)
      values ('paystack', 'evt_7781', 'charge.success', '{}'::jsonb, true)
    `;
    await db.exec(insert);
    await expect(db.exec(insert)).rejects.toThrow();
  });
});

describe("signals", () => {
  async function aSignal(userId: string, overrides = "") {
    return db.query<{ id: string }>(
      `insert into signals
         (user_id, symbol, timeframe, direction, order_type,
          entry, stop_loss, take_profits, reward_risk, conclusion ${overrides ? "," + overrides.split("=")[0] : ""})
       values ($1, 'XAUUSD', 'H4', 'LONG', 'BUY_LIMIT',
               2418.60, 2404.15, array[2447.90], 2.8, 'Retour sur OB'
               ${overrides ? "," + overrides.split("=")[1] : ""})
       returning id`,
      [userId],
    );
  }

  it("refuses a long whose stop sits above its entry", async () => {
    const id = await newUser("badstop@example.com");
    await expect(
      db.query(
        `insert into signals
           (user_id, symbol, timeframe, direction, order_type,
            entry, stop_loss, take_profits, reward_risk, conclusion)
         values ($1, 'XAUUSD', 'H4', 'LONG', 'BUY_LIMIT',
                 2404.15, 2418.60, array[2447.90], 2.8, 'incoherent')`,
        [id],
      ),
    ).rejects.toThrow();
  });

  it("refuses an outcome without a resolution date", async () => {
    const id = await newUser("noresolve@example.com");
    const signal = await aSignal(id);
    await expect(
      db.query(`update signals set outcome = 'tp1' where id = $1`, [
        signal.rows[0].id,
      ]),
    ).rejects.toThrow();
  });

  it("freezes an outcome once it is recorded", async () => {
    const id = await newUser("frozen@example.com");
    const signal = await aSignal(id);
    const sid = signal.rows[0].id;

    await db.query(
      `update signals set outcome = 'stopped', resolved_at = now() where id = $1`,
      [sid],
    );

    await expect(
      db.query(`update signals set outcome = 'tp3' where id = $1`, [sid]),
    ).rejects.toThrow(/already recorded/);
  });
});

describe("journal", () => {
  it("refuses a trade closed without a result", async () => {
    const id = await newUser("halfclosed@example.com");
    await expect(
      db.query(
        `insert into journal_entries
           (user_id, symbol, direction, entry_price, size, opened_at, closed_at)
         values ($1, 'EURUSD', 'LONG', 1.0850, 0.5, now() - interval '2 hours', now())`,
        [id],
      ),
    ).rejects.toThrow();
  });

  it("accepts a fully closed trade", async () => {
    const id = await newUser("closed@example.com");
    const res = await db.query(
      `insert into journal_entries
         (user_id, symbol, direction, entry_price, exit_price, size,
          profit_loss_minor, opened_at, closed_at)
       values ($1, 'EURUSD', 'LONG', 1.0850, 1.0910, 0.5,
               30000, now() - interval '2 hours', now())
       returning id`,
      [id],
    );
    expect(res.rows).toHaveLength(1);
  });
});

describe("prop firm headroom", () => {
  async function aChallenge(userId: string, basis: "static" | "trailing") {
    const res = await db.query<{ id: string }>(
      `insert into challenges
         (user_id, firm_name, phase, account_size_minor, currency,
          daily_loss_limit_minor, max_drawdown_minor, profit_target_minor,
          drawdown_basis, peak_equity_minor)
       values ($1, 'FTMO', 'Phase 1', 10000000, 'USD',
               500000, 1000000, 1000000, $2, 10000000)
       returning id`,
      [userId, basis],
    );
    return res.rows[0].id;
  }

  it("measures a static drawdown from the starting balance", async () => {
    const user = await newUser("static@example.com");
    const id = await aChallenge(user, "static");

    // Equity has climbed to 10.5M. The floor stays at 10M - 1M = 9M.
    const res = await db.query<{ drawdown_room_minor: string }>(
      `select drawdown_room_minor from challenge_headroom($1, 10500000, 0)`,
      [id],
    );
    expect(Number(res.rows[0].drawdown_room_minor)).toBe(1_500_000);
  });

  it("follows the peak when the drawdown trails", async () => {
    const user = await newUser("trailing@example.com");
    const id = await aChallenge(user, "trailing");

    await db.query(`update challenges set peak_equity_minor = 10500000 where id = $1`, [id]);

    // Same equity as the static case, but the floor has risen to 10.5M - 1M.
    // The trader is in profit and has less room, which is the trap.
    const res = await db.query<{ drawdown_room_minor: string }>(
      `select drawdown_room_minor from challenge_headroom($1, 10500000, 0)`,
      [id],
    );
    expect(Number(res.rows[0].drawdown_room_minor)).toBe(1_000_000);
  });

  it("reports a breached daily limit as negative room", async () => {
    const user = await newUser("breached@example.com");
    const id = await aChallenge(user, "static");

    const res = await db.query<{ daily_room_minor: string }>(
      `select daily_room_minor from challenge_headroom($1, 9400000, -600000)`,
      [id],
    );
    expect(Number(res.rows[0].daily_room_minor)).toBeLessThan(0);
  });
});

describe("referrals", () => {
  it("refuses a self referral", async () => {
    const id = await newUser("self@example.com");
    await expect(
      db.query(
        `insert into referrals (referrer_id, referred_id) values ($1, $1)`,
        [id],
      ),
    ).rejects.toThrow();
  });

  it("lets a user be referred only once", async () => {
    const a = await newUser("ref-a@example.com");
    const b = await newUser("ref-b@example.com");
    const c = await newUser("ref-c@example.com");

    await db.query(
      `insert into referrals (referrer_id, referred_id) values ($1, $2)`,
      [a, c],
    );
    await expect(
      db.query(
        `insert into referrals (referrer_id, referred_id) values ($1, $2)`,
        [b, c],
      ),
    ).rejects.toThrow();
  });
});

describe("row level security", () => {
  it("hides another user's signals", async () => {
    const owner = await newUser("owner@example.com");
    const stranger = await newUser("stranger@example.com");

    await db.query(
      `insert into signals
         (user_id, symbol, timeframe, direction, order_type,
          entry, stop_loss, take_profits, reward_risk, conclusion)
       values ($1, 'EURUSD', 'H1', 'LONG', 'MARKET_BUY',
               1.0850, 1.0800, array[1.0950], 2.0, 'prive')`,
      [owner],
    );

    // PGlite connects as superuser, which bypasses RLS; force it off so the
    // policies are actually exercised.
    await db.exec(`
      create role app_reader nologin;
      grant usage on schema public to app_reader;
      grant select on all tables in schema public to app_reader;
      set role app_reader;
    `);

    await actingAs(stranger);
    const hidden = await db.query(`select id from signals`);
    expect(hidden.rows).toHaveLength(0);

    await actingAs(owner);
    const visible = await db.query(`select id from signals`);
    expect(visible.rows).toHaveLength(1);

    await db.exec(`reset role;`);
  });
});
