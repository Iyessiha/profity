-- ============================================================================
-- PROFITY V2 — schéma complet
--
-- Généré depuis supabase/migrations/. Ne pas éditer ici : modifiez la
-- migration concernée puis relancez  npm run db:bundle
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 0001_foundation.sql
-- ─────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 0001 — Foundation: extensions, enumerated domains, shared helpers
-- ============================================================================
-- Conventions applied throughout this schema:
--
--   * Money is stored as an integer count of minor units (`amount_minor`)
--     alongside its currency, never as a float. XOF and XAF have no minor unit,
--     so 9 000 XOF is stored as 9000 while 14.35 USD is stored as 1435. Binary
--     floating point cannot represent a cent exactly and this is a billing
--     system, so the type has to make the error impossible rather than rare.
--
--   * Prices are `numeric`, not `double precision`. A stop loss that shifts by
--     a rounding error is a real loss.
--
--   * Every table carries row level security with no permissive default. A new
--     table is unreadable until a policy says otherwise, so forgetting a policy
--     fails closed.
-- ============================================================================

create extension if not exists "pgcrypto";     -- gen_random_uuid()
create extension if not exists "citext";       -- case-insensitive email

-- ── Enumerated domains ──────────────────────────────────────────────────────
-- These are closed sets the application branches on. Keeping them as enums
-- means a typo is rejected by the database rather than silently stored.

create type locale_code as enum ('fr', 'en', 'ar', 'pt');

create type currency_code as enum ('XOF', 'XAF', 'USD', 'EUR', 'GHS', 'NGN', 'MAD');

create type subscription_tier as enum ('free', 'pro', 'elite');

create type market_direction as enum ('LONG', 'SHORT', 'NEUTRAL');

create type order_kind as enum (
  'BUY_LIMIT', 'SELL_LIMIT',
  'BUY_STOP',  'SELL_STOP',
  'MARKET_BUY','MARKET_SELL',
  'WAIT'
);

create type confidence_level as enum ('HIGH', 'MEDIUM', 'LOW');

create type market_phase as enum (
  'accumulation', 'distribution', 'markup', 'markdown', 'ranging'
);

create type market_trend as enum ('BULLISH', 'BEARISH', 'RANGING');

-- `pending` is the initial state; everything else is terminal.
create type trade_outcome as enum (
  'pending', 'tp1', 'tp2', 'tp3', 'stopped', 'breakeven', 'cancelled'
);

create type event_impact as enum ('high', 'medium', 'low', 'holiday');

create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'cancelled', 'expired'
);

create type payment_status as enum (
  'pending', 'succeeded', 'failed', 'refunded', 'abandoned'
);

-- Processors serving the francophone and anglophone African markets.
create type payment_provider as enum (
  'cinetpay', 'paystack', 'geniuspay', 'manual'
);

create type challenge_status as enum (
  'active', 'passed', 'breached', 'abandoned'
);

create type notification_channel as enum (
  'in_app', 'push', 'email', 'telegram', 'whatsapp'
);

-- ── updated_at maintenance ──────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Authorisation helpers ───────────────────────────────────────────────────
-- The two policy helpers, is_admin() and current_tier(), are NOT defined here.
-- Postgres validates the body of a `language sql` function when it is created,
-- so each one has to be declared after the table it reads:
--
--   is_admin()      with profiles,      in 0002
--   current_tier()  with subscriptions, in 0003
--
-- Both are STABLE, so they are evaluated once per statement rather than once
-- per row, and both are SECURITY DEFINER, so a policy can consult a table the
-- caller cannot read — otherwise "is this user an admin" would itself need a
-- policy to answer.


-- ─────────────────────────────────────────────────────────────────────────
-- 0002_identity.sql
-- ─────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 0002 — Identity
-- ============================================================================
-- The v1 `profiles` table carried identity, roles, billing tier, display
-- preferences, usage counters and gamification in one row of some 25 columns.
-- Every one of those concerns changed on a different schedule and every write
-- touched the same row, so a streak update and an admin flag contended for the
-- same lock and the same cache entry.
--
-- Split here by rate of change and by who may write it:
--
--   profiles           identity and access. Rarely written, read constantly.
--   user_preferences   the user's own display and trading settings.
--   user_stats         counters the application derives. Written on every
--                      rated signal, read on leaderboards.
--
-- Billing tier is deliberately absent: it lives in subscriptions and is read
-- through current_tier(). See 0001.
-- ============================================================================

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,

  -- Shown in URLs (/u/:public_id) and shared cards, so it is separate from the
  -- primary key: a user may change it without breaking foreign keys.
  public_id   citext not null unique
              check (public_id ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),

  email       citext not null unique,
  display_name text check (char_length(display_name) between 1 and 80),
  phone       text check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  country     char(2),

  is_admin    boolean not null default false,
  suspended   boolean not null default false,
  -- Set when an admin suspends the account, so support can answer "why".
  suspended_reason text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_email_idx on profiles (email);
create index profiles_admin_idx on profiles (id) where is_admin;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

comment on column profiles.public_id is
  'Handle used in public URLs. Lowercase, 3-30 chars, changeable without touching foreign keys.';

-- Defined here rather than in 0001 because a `language sql` body is validated
-- at creation time and this one reads profiles. See the note in 0001.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ── Preferences ─────────────────────────────────────────────────────────────

create table user_preferences (
  user_id          uuid primary key references profiles (id) on delete cascade,

  locale           locale_code   not null default 'fr',
  currency         currency_code not null default 'XOF',
  timezone         text          not null default 'UTC',

  -- Shapes what the analysis engine emphasises, not what it is allowed to say.
  trading_style    text check (trading_style in ('scalping', 'intraday', 'swing', 'position')),
  preferred_broker text,
  risk_per_trade   numeric(5, 2) check (risk_per_trade > 0 and risk_per_trade <= 100),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger user_preferences_updated_at
  before update on user_preferences
  for each row execute function set_updated_at();

comment on column user_preferences.risk_per_trade is
  'Percent of account risked per position. Drives lot sizing suggestions.';

-- ── Derived counters ────────────────────────────────────────────────────────

create table user_stats (
  user_id         uuid primary key references profiles (id) on delete cascade,

  signals_rated   integer not null default 0 check (signals_rated >= 0),
  signals_won     integer not null default 0 check (signals_won >= 0),
  signals_lost    integer not null default 0 check (signals_lost >= 0),

  current_streak  integer not null default 0 check (current_streak >= 0),
  longest_streak  integer not null default 0 check (longest_streak >= 0),
  total_xp        integer not null default 0 check (total_xp >= 0),

  last_activity_at timestamptz,
  updated_at       timestamptz not null default now(),

  -- Wins and losses are a partition of what was rated; anything else means a
  -- counter update was lost and the leaderboard is already lying.
  constraint rated_accounts_for_outcomes
    check (signals_won + signals_lost <= signals_rated)
);

-- Leaderboards read this ordering directly.
create index user_stats_xp_idx on user_stats (total_xp desc, user_id);

create trigger user_stats_updated_at
  before update on user_stats
  for each row execute function set_updated_at();

-- ── Provisioning ────────────────────────────────────────────────────────────
-- A user with no preferences row is a user whose settings page crashes, so the
-- three rows are created together the moment auth creates the account.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  handle citext;
begin
  -- Derive a handle from the email local part, then disambiguate if taken.
  handle := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_-]', '', 'g');
  if char_length(handle) < 3 then
    handle := 'trader' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if exists (select 1 from profiles where public_id = handle) then
    handle := handle || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;

  insert into profiles (id, email, public_id)
  values (new.id, new.email, handle);

  insert into user_preferences (user_id) values (new.id);
  insert into user_stats (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Admin audit trail ───────────────────────────────────────────────────────

create table admin_actions (
  id          bigint generated always as identity primary key,
  actor_id    uuid not null references profiles (id) on delete restrict,
  action      text not null,
  subject_id  uuid references profiles (id) on delete set null,
  -- Enough context to reconstruct what changed without joining elsewhere.
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index admin_actions_actor_idx   on admin_actions (actor_id, created_at desc);
create index admin_actions_subject_idx on admin_actions (subject_id, created_at desc);

comment on table admin_actions is
  'Append-only record of privileged actions. No update or delete policy exists by design.';

-- ============================================================================
-- Row level security
-- ============================================================================

alter table profiles         enable row level security;
alter table user_preferences enable row level security;
alter table user_stats       enable row level security;
alter table admin_actions    enable row level security;

-- Profiles ------------------------------------------------------------------

create policy "read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "admins read every profile"
  on profiles for select
  using (is_admin());

-- A user may edit their own profile but may not grant themselves a role or
-- lift their own suspension, so those two columns are pinned to their current
-- value for self-updates.
create policy "update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and is_admin  = (select p.is_admin  from profiles p where p.id = auth.uid())
    and suspended = (select p.suspended from profiles p where p.id = auth.uid())
  );

create policy "admins update any profile"
  on profiles for update
  using (is_admin())
  with check (is_admin());

-- Preferences ----------------------------------------------------------------

create policy "read own preferences"
  on user_preferences for select
  using (user_id = auth.uid());

create policy "update own preferences"
  on user_preferences for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admins read preferences"
  on user_preferences for select
  using (is_admin());

-- Stats ----------------------------------------------------------------------
-- Readable by everyone because leaderboards and public profiles show them.
-- Writable by no one through this API: only trusted server code holding the
-- service role updates counters, which is what keeps a leaderboard honest.

create policy "stats are public"
  on user_stats for select
  using (true);

-- Admin actions ---------------------------------------------------------------

create policy "admins read the audit trail"
  on admin_actions for select
  using (is_admin());

create policy "admins append to the audit trail"
  on admin_actions for insert
  with check (is_admin() and actor_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────
-- 0003_billing.sql
-- ─────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 0003 — Billing
-- ============================================================================
-- Money moves through three African processors plus manual entry, all of which
-- retry webhooks. Two rules make that safe and both are enforced here rather
-- than in application code:
--
--   1. Every processor callback is recorded before it is acted on, keyed by the
--      processor's own event id. A retry hits a unique constraint instead of
--      granting a second month or a second credit pack.
--
--   2. A credit balance is never written directly. It is maintained by trigger
--      from an append-only ledger, so the balance and its history cannot
--      disagree — the usual way a credit system quietly leaks value.
-- ============================================================================

-- ── Subscriptions ───────────────────────────────────────────────────────────

create table subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,

  tier          subscription_tier   not null,
  status        subscription_status not null default 'active',

  amount_minor  bigint        not null check (amount_minor >= 0),
  currency      currency_code not null,

  current_period_start timestamptz not null,
  current_period_end   timestamptz not null,
  cancelled_at         timestamptz,

  provider      payment_provider not null,
  -- The processor's own subscription or transaction reference, for reconciling
  -- against their dashboard when a user disputes a charge.
  provider_ref  text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint period_is_forward check (current_period_end > current_period_start)
);

-- current_tier() runs on nearly every authenticated request, so it gets an
-- index shaped exactly like its lookup.
create index subscriptions_entitlement_idx
  on subscriptions (user_id, current_period_end desc)
  where status in ('trialing', 'active');

create index subscriptions_provider_ref_idx
  on subscriptions (provider, provider_ref)
  where provider_ref is not null;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

/**
 * The tier a user is entitled to right now.
 *
 * Derived from this table rather than cached on the profile: a stored tier
 * drifts the moment a period lapses without a webhook arriving, and that drift
 * hands out paid features for free. Reading it costs one indexed lookup, which
 * is cheaper than being wrong.
 *
 * Defined here rather than in 0001 because a `language sql` body is validated
 * at creation time and this one reads subscriptions. See the note in 0001.
 */
create or replace function current_tier(for_user uuid default auth.uid())
returns subscription_tier
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.tier
      from subscriptions s
      where s.user_id = for_user
        and s.status in ('trialing', 'active')
        and s.current_period_end > now()
      order by
        case s.tier when 'elite' then 2 when 'pro' then 1 else 0 end desc
      limit 1
    ),
    'free'::subscription_tier
  );
$$;

comment on function current_tier(uuid) is
  'Entitlement in force now, derived from active subscriptions. Never cached on profiles.';

-- ── Payments ────────────────────────────────────────────────────────────────

create table payments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete restrict,

  amount_minor  bigint        not null check (amount_minor > 0),
  currency      currency_code not null,
  status        payment_status not null default 'pending',

  provider      payment_provider not null,
  provider_ref  text,
  -- Mobile money, card, bank transfer — as reported by the processor.
  method_label  text,

  -- What the payment bought. Exactly one is set.
  subscription_id uuid references subscriptions (id) on delete set null,
  credit_pack_id  uuid,

  failure_reason text,
  paid_at        timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint paid_at_matches_status
    check ((status = 'succeeded') = (paid_at is not null))
);

create unique index payments_provider_ref_idx
  on payments (provider, provider_ref)
  where provider_ref is not null;

create index payments_user_idx on payments (user_id, created_at desc);

create trigger payments_updated_at
  before update on payments
  for each row execute function set_updated_at();

-- ── Checkout intents ────────────────────────────────────────────────────────
-- Opened when a user starts paying and left behind when they do not finish.
-- The abandoned-checkout reminder reads exactly that gap.

create table checkout_intents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,

  tier         subscription_tier,
  credit_pack_id uuid,
  amount_minor bigint        not null check (amount_minor > 0),
  currency     currency_code not null,
  provider     payment_provider not null,

  completed_at timestamptz,
  reminded_at  timestamptz,

  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null
);

create index checkout_intents_abandoned_idx
  on checkout_intents (created_at)
  where completed_at is null and reminded_at is null;

-- ── Invoices ────────────────────────────────────────────────────────────────

create table invoices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles (id) on delete restrict,
  payment_id     uuid references payments (id) on delete set null,

  -- Sequential, human-quotable, and required to be stable once issued.
  invoice_number text not null unique,

  -- Billing identity is copied, not joined: an invoice must keep showing the
  -- name and address that were true when it was issued.
  client_name    text not null,
  client_email   citext not null,
  client_address text,

  description    text not null,
  amount_minor   bigint        not null check (amount_minor >= 0),
  currency       currency_code not null,
  -- Settlement value at the time of issue, for accounts kept in dollars.
  amount_usd_minor bigint check (amount_usd_minor >= 0),

  status         payment_status not null default 'pending',

  -- Lets a client open their invoice without an account. High entropy because
  -- it is the only thing protecting the document.
  access_token   text not null unique default encode(gen_random_bytes(32), 'hex'),

  issued_at      timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index invoices_user_idx on invoices (user_id, issued_at desc);

comment on column invoices.access_token is
  '256-bit token for unauthenticated invoice access. Sole protection on that route.';

-- ── Credit packs and wallet ─────────────────────────────────────────────────

create table credit_packs (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  label        text not null,
  credits      integer       not null check (credits > 0),
  amount_minor bigint        not null check (amount_minor >= 0),
  currency     currency_code not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table credit_wallets (
  user_id      uuid primary key references profiles (id) on delete cascade,
  -- Maintained by trigger from credit_ledger. Never written directly.
  balance      integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0 check (total_earned >= 0),
  total_spent  integer not null default 0 check (total_spent >= 0),
  updated_at   timestamptz not null default now()
);

create table credit_ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references profiles (id) on delete cascade,

  -- Positive grants, negative spends. Zero would record nothing.
  amount      integer not null check (amount <> 0),
  reason      text not null,
  payment_id  uuid references payments (id) on delete set null,
  -- Set by an admin adjustment, so a manual correction is always attributable.
  actor_id    uuid references profiles (id) on delete set null,

  created_at  timestamptz not null default now()
);

create index credit_ledger_user_idx on credit_ledger (user_id, created_at desc);

comment on table credit_ledger is
  'Append-only. The wallet balance is derived from it by trigger, never set by hand.';

/**
 * Apply one ledger entry to the wallet.
 *
 * The wallet row is created on demand and locked by the update itself, so two
 * concurrent spends serialise rather than both reading the same stale balance.
 * The non-negative check on balance then rejects the second one outright,
 * which is the behaviour we want: refuse the spend rather than go overdrawn.
 */
create or replace function apply_credit_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into credit_wallets (user_id) values (new.user_id)
  on conflict (user_id) do nothing;

  update credit_wallets
  set balance      = balance + new.amount,
      total_earned = total_earned + greatest(new.amount, 0),
      total_spent  = total_spent  + greatest(-new.amount, 0),
      updated_at   = now()
  where user_id = new.user_id;

  return new;
end;
$$;

create trigger credit_ledger_applies_to_wallet
  after insert on credit_ledger
  for each row execute function apply_credit_entry();

-- ── Processor callbacks ─────────────────────────────────────────────────────

create table webhook_events (
  id           bigint generated always as identity primary key,
  provider     payment_provider not null,

  -- The processor's own event identifier. The unique constraint below is what
  -- makes a retried callback a no-op instead of a double charge.
  external_id  text not null,

  event_type   text not null,
  payload      jsonb not null,
  signature_ok boolean not null,

  processed_at timestamptz,
  error        text,

  received_at  timestamptz not null default now()
);

create unique index webhook_events_identity_idx
  on webhook_events (provider, external_id);

create index webhook_events_unprocessed_idx
  on webhook_events (received_at)
  where processed_at is null;

comment on index webhook_events_identity_idx is
  'Idempotency key. A replayed callback collides here instead of granting a second period.';

-- ============================================================================
-- Row level security
-- ============================================================================

alter table subscriptions     enable row level security;
alter table payments          enable row level security;
alter table checkout_intents  enable row level security;
alter table invoices          enable row level security;
alter table credit_packs      enable row level security;
alter table credit_wallets    enable row level security;
alter table credit_ledger     enable row level security;
alter table webhook_events    enable row level security;

-- Users may look at their own money, and at nothing else. Every write below is
-- absent on purpose: subscriptions, payments, invoices, ledger entries and
-- webhook rows are created only by server code holding the service role, which
-- bypasses RLS. A client that could insert a subscription could grant itself
-- Elite, so no insert policy exists for it to use.

create policy "read own subscriptions"
  on subscriptions for select using (user_id = auth.uid());

create policy "read own payments"
  on payments for select using (user_id = auth.uid());

create policy "read own checkout intents"
  on checkout_intents for select using (user_id = auth.uid());

create policy "read own invoices"
  on invoices for select using (user_id = auth.uid());

create policy "read own wallet"
  on credit_wallets for select using (user_id = auth.uid());

create policy "read own credit history"
  on credit_ledger for select using (user_id = auth.uid());

-- The price list is public: the pricing page is read before signing up.
create policy "credit packs are public"
  on credit_packs for select using (active);

-- Admin oversight -------------------------------------------------------------

create policy "admins read subscriptions"
  on subscriptions for select using (is_admin());

create policy "admins read payments"
  on payments for select using (is_admin());

create policy "admins read invoices"
  on invoices for select using (is_admin());

create policy "admins read credit history"
  on credit_ledger for select using (is_admin());

create policy "admins read webhook events"
  on webhook_events for select using (is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 0004_signals.sql
-- ─────────────────────────────────────────────────────────────────────────

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


-- ─────────────────────────────────────────────────────────────────────────
-- 0005_journal.sql
-- ─────────────────────────────────────────────────────────────────────────

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


-- ─────────────────────────────────────────────────────────────────────────
-- 0006_propfirm.sql
-- ─────────────────────────────────────────────────────────────────────────

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


-- ─────────────────────────────────────────────────────────────────────────
-- 0007_market_data.sql
-- ─────────────────────────────────────────────────────────────────────────

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


-- ─────────────────────────────────────────────────────────────────────────
-- 0008_engagement.sql
-- ─────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 0008 — Notifications, referrals and system settings
-- ============================================================================
-- Profity reaches users on five channels. Two of them, WhatsApp and Telegram,
-- are messaging platforms a person has to opt into and can withdraw from, so
-- consent is stored as a fact with a timestamp rather than inferred from the
-- presence of an address. An address without consent is a channel we may not
-- use, and the schema keeps those two things separate on purpose.
-- ============================================================================

create table notification_channels (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  channel      notification_channel not null,

  -- Chat id, phone number or endpoint, depending on the channel.
  address      text not null,

  verified_at  timestamptz,
  consented_at timestamptz,
  revoked_at   timestamptz,

  created_at   timestamptz not null default now(),

  unique (user_id, channel, address)
);

-- The only lookup that matters at send time: channels we are allowed to use.
create index notification_channels_sendable_idx
  on notification_channels (user_id, channel)
  where consented_at is not null and revoked_at is null;

comment on table notification_channels is
  'An address is not permission. Consent is recorded separately and can be revoked.';

-- ── Web push ────────────────────────────────────────────────────────────────

create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,

  endpoint    text not null unique,
  p256dh_key  text not null,
  auth_key    text not null,
  user_agent  text,

  -- Set when the push service reports the subscription gone, so a dead
  -- endpoint stops being retried without losing the record of it.
  expired_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index push_subscriptions_live_idx
  on push_subscriptions (user_id)
  where expired_at is null;

-- ── In-app notifications ────────────────────────────────────────────────────

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,

  kind       text not null,
  title      text not null,
  body       text,
  action_url text,

  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_unread_idx
  on notifications (user_id, created_at desc)
  where read_at is null;

create index notifications_user_idx on notifications (user_id, created_at desc);

-- ── Outbound log ────────────────────────────────────────────────────────────
-- One row per attempt on an external channel. Without it there is no answer to
-- "did the user actually get the signal", which is the first question asked
-- whenever someone disputes a missed trade.

create table message_deliveries (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references profiles (id) on delete cascade,
  channel      notification_channel not null,

  subject      text,
  reference    text,

  status       text not null check (status in ('queued', 'sent', 'delivered', 'failed')),
  error        text,

  queued_at    timestamptz not null default now(),
  sent_at      timestamptz
);

create index message_deliveries_user_idx on message_deliveries (user_id, queued_at desc);
create index message_deliveries_failed_idx on message_deliveries (queued_at) where status = 'failed';

-- ── Broadcasts ──────────────────────────────────────────────────────────────

create table broadcasts (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid not null references profiles (id) on delete restrict,

  title         text not null,
  body          text not null,
  channels      notification_channel[] not null,
  -- Null targets everyone; otherwise only these tiers.
  target_tiers  subscription_tier[],

  recipients    integer not null default 0 check (recipients >= 0),
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- ── Referrals ───────────────────────────────────────────────────────────────

create table referrals (
  id             uuid primary key default gen_random_uuid(),

  referrer_id    uuid not null references profiles (id) on delete cascade,
  -- Unique: a person can be referred once, by one person, ever. Without this
  -- the reward is farmable by deleting and recreating the referred account.
  referred_id    uuid not null unique references profiles (id) on delete cascade,

  -- Credits granted, paid out only once the referred user converts.
  reward_credits integer not null default 0 check (reward_credits >= 0),
  rewarded_at    timestamptz,

  created_at     timestamptz not null default now(),

  constraint no_self_referral check (referrer_id <> referred_id)
);

create index referrals_referrer_idx on referrals (referrer_id, created_at desc);

-- ── System settings ─────────────────────────────────────────────────────────

create table system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

create trigger system_settings_updated_at
  before update on system_settings
  for each row execute function set_updated_at();

-- ============================================================================
-- Row level security
-- ============================================================================

alter table notification_channels enable row level security;
alter table push_subscriptions    enable row level security;
alter table notifications         enable row level security;
alter table message_deliveries    enable row level security;
alter table broadcasts            enable row level security;
alter table referrals             enable row level security;
alter table system_settings       enable row level security;

create policy "own notification channels"
  on notification_channels for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "read own notifications"
  on notifications for select
  using (user_id = auth.uid());

-- Marking as read is the only change a user makes to a notification.
create policy "mark own notifications read"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "read own delivery history"
  on message_deliveries for select
  using (user_id = auth.uid());

-- A user sees who they referred, but not the other direction: revealing who
-- referred you exposes someone else's activity.
create policy "read own referrals"
  on referrals for select
  using (referrer_id = auth.uid());

create policy "admins read broadcasts"
  on broadcasts for select using (is_admin());

create policy "admins send broadcasts"
  on broadcasts for insert
  with check (is_admin() and actor_id = auth.uid());

create policy "admins read settings"
  on system_settings for select using (is_admin());

create policy "admins change settings"
  on system_settings for update
  using (is_admin()) with check (is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 0009_admin_setup.sql
-- ─────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 0009 — Admin setup helpers
-- ============================================================================
-- To grant admin rights to a user, run:
--
--   SELECT grant_admin('email@example.com');
--
-- To revoke:
--
--   SELECT revoke_admin('email@example.com');
-- ============================================================================

-- RLS on subscriptions for admins (if not already present)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'admins read every subscription'
  ) then
    execute $p$
      create policy "admins read every subscription"
        on subscriptions for select
        using (is_admin())
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'admins update any subscription'
  ) then
    execute $p$
      create policy "admins update any subscription"
        on subscriptions for update
        using (is_admin())
        with check (is_admin())
    $p$;
  end if;
end;
$$;

-- Helper function to promote a user by email
create or replace function grant_admin(target_email citext)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set is_admin = true where email = target_email;
  if not found then
    raise exception 'User % not found', target_email;
  end if;
end;
$$;

-- Helper function to revoke admin by email
create or replace function revoke_admin(target_email citext)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set is_admin = false where email = target_email;
  if not found then
    raise exception 'User % not found', target_email;
  end if;
end;
$$;

