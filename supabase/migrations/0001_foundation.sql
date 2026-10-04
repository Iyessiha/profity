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
