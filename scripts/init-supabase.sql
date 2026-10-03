-- ============================================================================
-- Initialize Supabase Database for ProfityX
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- ── Webhook Events Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  signature_ok BOOLEAN,
  processed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(provider, external_id)
);

-- ── Checkout Intents Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkout_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT,
  amount_minor INTEGER,
  currency TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- ── Payments Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_minor INTEGER,
  currency TEXT,
  status TEXT,
  provider TEXT,
  provider_ref TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- ── Subscriptions Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT,
  status TEXT,
  amount_minor INTEGER,
  currency TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  provider TEXT,
  provider_ref TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- ── Indexes for Performance ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id
  ON webhook_events(provider, external_id);

CREATE INDEX IF NOT EXISTS idx_checkout_intents_user_id
  ON checkout_intents(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
  ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own checkout intents" ON checkout_intents
  FOR SELECT USING (auth.uid() = user_id);

-- Service role (used by API) bypasses RLS automatically
-- Webhooks are insert-only, restricted by signature verification

-- ============================================================================
-- DONE: Database is ready for ProfityX
-- ============================================================================
