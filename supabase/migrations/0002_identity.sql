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
