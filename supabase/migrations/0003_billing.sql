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
