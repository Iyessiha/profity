-- ============================================================================
-- 0006 — Prop firm challenges
-- ============================================================================
-- A challenge is not won by making money; it is lost by touching a limit. The
-- schema therefore models the limits first and the progress second.
--
-- The distinction that matters most is how drawdown is measured:
--
--   static    measured from the starting balance. The floor never moves.
--   trailing  measured from the highest equity reached. The floor rises behind
--             every new peak, so a trader in profit can still be closer to
--             failing than when they started.
--
-- Most candidates who fail a challenge fail on a trailing drawdown they were
-- tracking as if it were static, which is precisely what this product exists to
-- prevent. Storing the mode per challenge is what makes the warning correct.
-- ============================================================================

create type drawdown_mode as enum ('static', 'trailing');

-- ── Firms and their published rule sets ─────────────────────────────────────

create table prop_firms (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  website    text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table challenge_presets (
  id                 uuid primary key default gen_random_uuid(),
  firm_id            uuid not null references prop_firms (id) on delete cascade,

  label              text not null,
  phase              text not null,

  account_size_minor bigint        not null check (account_size_minor > 0),
  currency           currency_code not null,

  -- Stored as basis points so a 5 % limit is 500 and no rounding is involved.
  daily_loss_bps     integer not null check (daily_loss_bps between 0 and 10000),
  max_drawdown_bps   integer not null check (max_drawdown_bps between 0 and 10000),
  profit_target_bps  integer not null check (profit_target_bps >= 0),

  drawdown_basis     drawdown_mode not null,
  min_trading_days   integer not null default 0 check (min_trading_days >= 0),
  max_days           integer check (max_days > 0),

  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

create index challenge_presets_firm_idx on challenge_presets (firm_id) where active;

comment on column challenge_presets.daily_loss_bps is
  'Basis points of account size. 500 means 5 %. Integers avoid rounding a limit.';

-- ── A user's challenge ──────────────────────────────────────────────────────

create table challenges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  account_id    uuid references trading_accounts (id) on delete set null,

  -- Copied from the preset rather than joined: a firm may change its published
  -- rules, and a challenge must keep being judged by the rules it started under.
  firm_name     text not null,
  phase         text not null,
  preset_id     uuid references challenge_presets (id) on delete set null,

  account_size_minor bigint        not null check (account_size_minor > 0),
  currency           currency_code not null,

  daily_loss_limit_minor bigint not null check (daily_loss_limit_minor >= 0),
  max_drawdown_minor     bigint not null check (max_drawdown_minor >= 0),
  profit_target_minor    bigint not null check (profit_target_minor >= 0),
  drawdown_basis         drawdown_mode not null,

  min_trading_days integer not null default 0 check (min_trading_days >= 0),

  -- Highest equity reached. Under a trailing basis this is what the floor
  -- follows, so it is maintained even when the mode is static: a trader may
  -- discover mid-challenge that their firm trails.
  peak_equity_minor bigint not null,

  status        challenge_status not null default 'active',
  breach_reason text,

  started_at    timestamptz not null default now(),
  ends_at       timestamptz,
  closed_at     timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint closed_challenges_have_a_date
    check ((status = 'active') = (closed_at is null)),
  constraint breaches_are_explained
    check (status <> 'breached' or breach_reason is not null)
);

create index challenges_user_idx   on challenges (user_id, started_at desc);
create index challenges_active_idx on challenges (user_id) where status = 'active';

create trigger challenges_updated_at
  before update on challenges
  for each row execute function set_updated_at();

-- ── Events worth keeping ────────────────────────────────────────────────────

create table challenge_events (
  id           bigint generated always as identity primary key,
  challenge_id uuid not null references challenges (id) on delete cascade,

  kind         text not null check (kind in (
                 'started', 'day_closed', 'limit_warning',
                 'breached', 'target_reached', 'passed', 'abandoned'
               )),
  message      text not null,
  details      jsonb not null default '{}'::jsonb,

  occurred_at  timestamptz not null default now()
);

create index challenge_events_idx on challenge_events (challenge_id, occurred_at desc);

-- ── Live standing ───────────────────────────────────────────────────────────

/**
 * How much room is left before each limit, given today's equity.
 *
 * Returns the distance to the daily floor and to the drawdown floor in minor
 * units. A negative number means the limit is already breached. The drawdown
 * floor is computed from peak equity under a trailing basis and from the
 * starting balance under a static one — the whole reason the mode is stored.
 */
create or replace function challenge_headroom(
  challenge uuid,
  equity_minor bigint,
  day_result_minor bigint
)
returns table (
  daily_room_minor    bigint,
  drawdown_room_minor bigint,
  target_room_minor   bigint
)
language sql
stable
as $$
  select
    c.daily_loss_limit_minor + least(day_result_minor, 0),
    equity_minor - (
      case c.drawdown_basis
        when 'trailing' then greatest(c.peak_equity_minor, equity_minor)
        else c.account_size_minor
      end - c.max_drawdown_minor
    ),
    greatest(
      c.account_size_minor + c.profit_target_minor - equity_minor,
      0
    )
  from challenges c
  where c.id = challenge;
$$;

comment on function challenge_headroom(uuid, bigint, bigint) is
  'Distance to each limit in minor units. Negative means already breached.';

-- ============================================================================
-- Row level security
-- ============================================================================

alter table prop_firms        enable row level security;
alter table challenge_presets enable row level security;
alter table challenges        enable row level security;
alter table challenge_events  enable row level security;

-- The firm catalogue is reference data shown during onboarding, before the
-- user has committed to anything.
create policy "firms are public"
  on prop_firms for select using (active);

create policy "presets are public"
  on challenge_presets for select using (active);

create policy "own challenges"
  on challenges for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own challenge history"
  on challenge_events for select
  using (
    challenge_id in (select id from challenges where user_id = auth.uid())
  );

create policy "admins read challenges"
  on challenges for select using (is_admin());
