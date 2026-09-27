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
