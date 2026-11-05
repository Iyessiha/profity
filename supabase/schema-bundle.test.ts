import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { describe, expect, it } from "vitest";
import { buildBundle } from "../scripts/bundle-schema.mjs";

const BUNDLE = join(process.cwd(), "supabase", "schema.sql");

describe("bundled schema", () => {
  it("matches the migrations it is generated from", async () => {
    const onDisk = await readFile(BUNDLE, "utf8");
    const fresh = await buildBundle();
    expect(
      onDisk,
      "supabase/schema.sql is stale — run `npm run db:bundle`",
    ).toBe(fresh);
  });

  it("applies to an empty database in one pass", async () => {
    const db = new PGlite({ extensions: { citext, pgcrypto } });

    // Supabase supplies these in production.
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

    await db.exec(await readFile(BUNDLE, "utf8"));

    const tables = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_tables where schemaname = 'public'`,
    );
    expect(tables.rows[0].n).toBeGreaterThanOrEqual(20);

    const unprotected = await db.query<{ tablename: string }>(
      `select tablename from pg_tables
       where schemaname = 'public' and not rowsecurity`,
    );
    expect(unprotected.rows).toEqual([]);

    await db.close();
  }, 120_000);
});
