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
