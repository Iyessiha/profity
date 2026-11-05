-- ============================================================================
-- 0004 — Signals
-- ============================================================================
-- A signal is the product. Two things shape this table:
--
--   * Levels are always complete. Tier gates the reasoning, never the trade.
--     A free signal is fully tradable; the Smart Money analysis that justifies
--     it is what Pro pays for. So the level columns are NOT NULL and the
--     reasoning columns are nullable, which is the opposite of how a paywall is
--     usually modelled and is the point.
--
--   * A published signal is a claim about the future. Once the market resolves
--     it, that outcome is the basis of every public win rate we show, so it is
--     recorded once and the honest ordering is enforced by constraint.
-- ============================================================================

create table signals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,

  symbol       text not null check (symbol ~ '^[A-Z0-9]{2,12}$'),
  timeframe    text not null check (timeframe in ('M5','M15','M30','H1','H4','D1','W1')),

  direction    market_direction not null,
  order_type   order_kind       not null,

  -- Levels — always present, whatever the tier.
  entry        numeric(18, 6) not null check (entry > 0),
  stop_loss    numeric(18, 6) not null check (stop_loss > 0),
  take_profits numeric(18, 6)[] not null check (array_length(take_profits, 1) between 1 and 3),
  reward_risk  numeric(6, 2)  not null check (reward_risk > 0),

  conclusion   text not null,

  -- Reasoning — Pro and above.
  confidence   confidence_level,
  trend        market_trend,
  phase        market_phase,
  confluences  text[],
  reasoning    text,

  -- Structure — Elite. Shapes rather than columns because the engine emits a
  -- variable set of zones per analysis and we never filter on their interior.
  structure    jsonb not null default '{}'::jsonb,

  outcome      trade_outcome not null default 'pending',
  resolved_at  timestamptz,

  -- Set when the user shares the signal publicly; null keeps it private.
  share_slug   text unique,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- A stop on the wrong side of entry is not a trade, it is a data error.
  constraint stop_sits_below_entry_when_long
    check (direction <> 'LONG' or stop_loss < entry),
  constraint stop_sits_above_entry_when_short
    check (direction <> 'SHORT' or stop_loss > entry),

  constraint resolved_at_matches_outcome
    check ((outcome = 'pending') = (resolved_at is null))
);

create index signals_user_idx    on signals (user_id, created_at desc);
create index signals_symbol_idx  on signals (symbol, created_at desc);
create index signals_pending_idx on signals (created_at) where outcome = 'pending';
create index signals_shared_idx  on signals (share_slug) where share_slug is not null;

create trigger signals_updated_at
  before update on signals
  for each row execute function set_updated_at();

comment on column signals.take_profits is
  'Ordered targets, nearest first. One to three; tier decides how many are shown.';

comment on column signals.structure is
  'Elite Smart Money detail: order blocks, fair value gaps, BOS/CHoCH levels, liquidity pools.';

/**
 * An outcome is written once.
 *
 * Public win rates are computed from this column, so letting a resolved signal
 * be re-rated would let anyone groom their own statistics.
 *
 * Note this is a trigger and not a policy. The service role bypasses row level
 * security but not triggers, so server code is held to the rule too. Correcting
 * a genuinely mis-recorded outcome means dropping this trigger deliberately,
 * which is the friction we want around rewriting published history.
 */
create or replace function freeze_resolved_outcome()
returns trigger
language plpgsql
as $$
begin
  if old.outcome <> 'pending' and new.outcome <> old.outcome then
    raise exception
      'signal %: outcome already recorded as %, refusing to change it to %',
      old.id, old.outcome, new.outcome
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger signals_outcome_is_final
  before update on signals
  for each row execute function freeze_resolved_outcome();

-- ── News signals ────────────────────────────────────────────────────────────
-- Generated from an economic release rather than a chart, and not owned by any
-- one user: they are broadcast to everyone entitled to them.

create table news_signals (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid,

  event_title    text not null,
  country        char(2) not null,
  symbol         text not null,

  direction      market_direction not null,
  entry          numeric(18, 6) not null check (entry > 0),
  stop_loss      numeric(18, 6) not null check (stop_loss > 0),
  take_profits   numeric(18, 6)[] not null check (array_length(take_profits, 1) between 1 and 3),
  reward_risk    numeric(6, 2) not null check (reward_risk > 0),

  interpretation text not null,
  forecast       text,
  actual         text,

  -- Lowest tier allowed to see it, so a release can be held back for Pro.
  min_tier       subscription_tier not null default 'pro',

  outcome        trade_outcome not null default 'pending',
  resolved_at    timestamptz,

  created_at     timestamptz not null default now()
);

create index news_signals_recent_idx on news_signals (created_at desc);

-- ── Engine usage and cost ───────────────────────────────────────────────────
-- Each analysis calls a paid model. Recording tokens and cost per call is what
-- makes it possible to answer whether a tier is priced above what it costs to
-- serve — the question that decides whether the business works.

create table analysis_usage (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references profiles (id) on delete cascade,
  signal_id     uuid references signals (id) on delete set null,

  model         text not null,
  input_tokens  integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  -- Micro-dollars: an analysis can cost a fraction of a cent and rounding it
  -- to cents would report most calls as free.
  cost_micros   bigint not null check (cost_micros >= 0),

  tier_at_time  subscription_tier not null,
  created_at    timestamptz not null default now()
);

create index analysis_usage_user_idx  on analysis_usage (user_id, created_at desc);
create index analysis_usage_month_idx on analysis_usage (created_at);

comment on column analysis_usage.cost_micros is
  'Model cost in millionths of a dollar. Cents would round most calls to zero.';

-- ── Monthly allowance ───────────────────────────────────────────────────────

create table tier_allowances (
  tier             subscription_tier primary key,
  analyses_monthly integer not null check (analyses_monthly >= 0),
  updated_at       timestamptz not null default now()
);

insert into tier_allowances (tier, analyses_monthly) values
  ('free',   5),
  ('pro',   40),
  ('elite', 200);

/**
 * Analyses the user has consumed in the current calendar month.
 *
 * Counted from the usage log rather than kept as a counter on the profile: a
 * counter drifts when a call fails midway and then either grants free analyses
 * or charges for one that never ran.
 */
create or replace function analyses_used_this_month(for_user uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from analysis_usage
  where user_id = for_user
    and created_at >= date_trunc('month', now());
$$;

-- ============================================================================
-- Row level security
-- ============================================================================

alter table signals         enable row level security;
alter table news_signals    enable row level security;
alter table analysis_usage  enable row level security;
alter table tier_allowances enable row level security;

create policy "read own signals"
  on signals for select
  using (user_id = auth.uid());

-- A shared signal is readable by anyone holding the link, which is what
-- sharing means. Only the columns the client selects are exposed, and the API
-- layer narrows those for public views.
create policy "read shared signals"
  on signals for select
  using (share_slug is not null);

create policy "create own signals"
  on signals for insert
  with check (user_id = auth.uid());

-- Users may share, unshare and rate their own signals. The outcome trigger
-- above still refuses to rewrite a recorded result.
create policy "update own signals"
  on signals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own signals"
  on signals for delete
  using (user_id = auth.uid());

create policy "admins read signals"
  on signals for select
  using (is_admin());

-- News signals are gated by tier, evaluated per row against the entitlement in
-- force right now rather than a cached one.
create policy "read news signals for my tier"
  on news_signals for select
  using (
    case min_tier
      when 'free'  then true
      when 'pro'   then current_tier() in ('pro', 'elite')
      when 'elite' then current_tier() = 'elite'
    end
  );

create policy "read own usage"
  on analysis_usage for select
  using (user_id = auth.uid());

create policy "admins read all usage"
  on analysis_usage for select
  using (is_admin());

-- The pricing page states these limits, so they are public.
create policy "allowances are public"
  on tier_allowances for select
  using (true);
