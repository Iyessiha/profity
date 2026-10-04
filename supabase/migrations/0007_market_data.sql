-- ============================================================================
-- 0007 — Market data
-- ============================================================================
-- Shared reference data pulled from outside: the economic calendar, plus the
-- per-user overlays that turn it into something actionable.
-- ============================================================================

create table economic_events (
  id           uuid primary key default gen_random_uuid(),

  -- The upstream calendar's own identifier. Refreshes upsert on it, so a
  -- revised forecast updates the row instead of duplicating the release.
  external_id  text not null unique,

  title        text not null,
  country      char(2) not null,
  currency     text not null,

  scheduled_at timestamptz not null,
  impact       event_impact not null,

  forecast     text,
  previous     text,
  -- Null until the release lands. The moment it is set is the moment a
  -- news signal becomes possible.
  actual       text,

  fetched_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index economic_events_schedule_idx on economic_events (scheduled_at);
create index economic_events_upcoming_idx
  on economic_events (scheduled_at)
  where impact = 'high' and actual is null;

create trigger economic_events_updated_at
  before update on economic_events
  for each row execute function set_updated_at();

comment on index economic_events_upcoming_idx is
  'Drives pre-release alerts: high impact, not yet published.';

-- ── Watchlist ───────────────────────────────────────────────────────────────

create table watchlist_items (
  user_id    uuid not null references profiles (id) on delete cascade,
  symbol     text not null check (symbol ~ '^[A-Z0-9]{2,12}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  primary key (user_id, symbol)
);

create index watchlist_items_user_idx on watchlist_items (user_id, sort_order);

-- ── Price alerts ────────────────────────────────────────────────────────────

create table price_alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,

  symbol       text not null check (symbol ~ '^[A-Z0-9]{2,12}$'),
  direction    text not null check (direction in ('above', 'below')),
  target_price numeric(18, 6) not null check (target_price > 0),

  -- An alert fires once. Re-arming is an explicit act, so a price oscillating
  -- around the level cannot send a hundred notifications.
  triggered_at timestamptz,
  expires_at   timestamptz,

  created_at   timestamptz not null default now()
);

create index price_alerts_armed_idx
  on price_alerts (symbol)
  where triggered_at is null;

create index price_alerts_user_idx on price_alerts (user_id, created_at desc);

-- ============================================================================
-- Row level security
-- ============================================================================

alter table economic_events enable row level security;
alter table watchlist_items enable row level security;
alter table price_alerts    enable row level security;

-- The calendar is the same for everyone and the public calendar page reads it
-- before sign-in.
create policy "the calendar is public"
  on economic_events for select using (true);

create policy "own watchlist"
  on watchlist_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own price alerts"
  on price_alerts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
