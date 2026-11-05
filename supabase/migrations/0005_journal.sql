-- ============================================================================
-- 0005 — Trading accounts and journal
-- ============================================================================
-- A journal is only worth keeping if its arithmetic is trustworthy, so profit
-- and loss is stored in minor units of the account currency and the open and
-- closed states are kept consistent by constraint rather than by convention.
-- ============================================================================

create table trading_accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,

  label        text not null check (char_length(label) between 1 and 60),
  broker       text,
  -- Free text because a login is a broker's identifier, not ours.
  account_ref  text,

  currency     currency_code not null,
  starting_balance_minor bigint not null check (starting_balance_minor >= 0),

  is_demo      boolean not null default false,
  archived_at  timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index trading_accounts_user_idx
  on trading_accounts (user_id)
  where archived_at is null;

create trigger trading_accounts_updated_at
  before update on trading_accounts
  for each row execute function set_updated_at();

-- ── Journal entries ─────────────────────────────────────────────────────────

create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  account_id  uuid references trading_accounts (id) on delete set null,

  -- Set when the trade came from one of our signals, which is how we measure
  -- whether following the product actually helped.
  signal_id   uuid references signals (id) on delete set null,

  symbol      text not null check (symbol ~ '^[A-Z0-9]{2,12}$'),
  direction   market_direction not null,

  entry_price numeric(18, 6) not null check (entry_price > 0),
  exit_price  numeric(18, 6) check (exit_price > 0),
  stop_loss   numeric(18, 6) check (stop_loss > 0),
  size        numeric(14, 4) not null check (size > 0),

  profit_loss_minor bigint,

  opened_at   timestamptz not null,
  closed_at   timestamptz,

  -- The part that makes a journal useful: why the trade was taken, in the
  -- trader's own words, written while it was still open.
  notes       text,
  tags        text[] not null default '{}',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint closed_trades_are_complete
    check (
      (closed_at is null and exit_price is null and profit_loss_minor is null)
      or
      (closed_at is not null and exit_price is not null and profit_loss_minor is not null)
    ),
  constraint closes_after_it_opens
    check (closed_at is null or closed_at >= opened_at)
);

create index journal_entries_user_idx   on journal_entries (user_id, opened_at desc);
create index journal_entries_open_idx   on journal_entries (user_id) where closed_at is null;
create index journal_entries_signal_idx on journal_entries (signal_id) where signal_id is not null;
create index journal_entries_tags_idx   on journal_entries using gin (tags);

create trigger journal_entries_updated_at
  before update on journal_entries
  for each row execute function set_updated_at();

comment on constraint closed_trades_are_complete on journal_entries is
  'A trade is either open with no result, or closed with an exit and a result. Never half.';

-- ── Equity curve ────────────────────────────────────────────────────────────
-- One row per account per day. Prop firm drawdown rules are evaluated against
-- daily equity, so this is not a nicety — it is the evidence a challenge is
-- still alive.

create table equity_snapshots (
  account_id   uuid not null references trading_accounts (id) on delete cascade,
  as_of        date not null,

  equity_minor  bigint not null,
  balance_minor bigint not null,
  -- Realised over that day alone, so a daily loss limit can be checked without
  -- re-summing the whole history.
  day_result_minor bigint not null default 0,

  created_at   timestamptz not null default now(),

  primary key (account_id, as_of)
);

create index equity_snapshots_recent_idx on equity_snapshots (account_id, as_of desc);

-- ============================================================================
-- Row level security
-- ============================================================================

alter table trading_accounts enable row level security;
alter table journal_entries  enable row level security;
alter table equity_snapshots enable row level security;

create policy "own trading accounts"
  on trading_accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own journal"
  on journal_entries for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Reached through the account, so ownership is checked there. The subquery is
-- indexed by trading_accounts' primary key.
create policy "own equity history"
  on equity_snapshots for all
  using (
    account_id in (select id from trading_accounts where user_id = auth.uid())
  )
  with check (
    account_id in (select id from trading_accounts where user_id = auth.uid())
  );
