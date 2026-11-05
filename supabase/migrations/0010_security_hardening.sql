-- ============================================================================
-- 0010 — Durcissement de sécurité (retours du conseiller Supabase)
-- ============================================================================

-- 1. Quota d'analyses : un utilisateur ne peut lire que son propre compteur.
--    Les admins gardent l'accès à tous les comptes. Le client appelle la
--    fonction avec son propre user.id, donc aucun appel existant ne casse.
create or replace function analyses_used_this_month(for_user uuid default auth.uid())
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when for_user is not distinct from auth.uid() or is_admin()
      then (
        select count(*)::integer
        from analysis_usage
        where user_id = for_user
          and created_at >= date_trunc('month', now())
      )
    else 0
  end;
$$;

-- 2. Retirer l'exécution par RPC aux rôles exposés par l'API.
--    Les rôles anon / authenticated n'existent que sous Supabase : on ne
--    révoque que ceux qui sont présents, pour que la migration reste
--    rejouable sur un Postgres nu (tests locaux).
--    - analyses_used_this_month : anon uniquement (authenticated doit rester
--      autorisé, c'est l'appel normal de l'app).
--    - fonctions de trigger : jamais appelées en RPC ; le moteur de triggers
--      ne vérifie pas EXECUTE au déclenchement, donc on peut tout retirer.
do $$
declare
  r text;
begin
  -- analyses_used_this_month : seulement anon
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function analyses_used_this_month(uuid) from anon;
  end if;

  -- fonctions de trigger
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on function handle_new_user() from %I', r);
      execute format('revoke execute on function apply_credit_entry() from %I', r);
      execute format('revoke execute on function set_updated_at() from %I', r);
      execute format('revoke execute on function freeze_resolved_outcome() from %I', r);
    end if;
  end loop;
end $$;

revoke execute on function handle_new_user()         from public;
revoke execute on function apply_credit_entry()      from public;
revoke execute on function set_updated_at()          from public;
revoke execute on function freeze_resolved_outcome() from public;

-- 3. search_path figé sur les fonctions qui ne l'avaient pas.
alter function set_updated_at()                 set search_path = public;
alter function freeze_resolved_outcome()        set search_path = public;
alter function challenge_headroom(uuid, bigint, bigint) set search_path = public;

-- is_admin() et current_tier() restent exécutables : les politiques RLS les
-- évaluent avec le rôle de l'utilisateur. Elles ne renvoient que des booléens
-- ou un palier, et n'exposent aucune donnée d'autrui.
