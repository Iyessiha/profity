-- ============================================================================
-- 0011 — Retirer l'exécution anonyme du quota d'analyses
-- ============================================================================
-- EXECUTE est accordé à PUBLIC par défaut : révoquer seulement anon ne suffit
-- pas. On retire PUBLIC et anon, puis on réaccorde explicitement à
-- authenticated (appel normal de l'app) et au service_role. Les rôles Supabase
-- ne sont pas toujours présents (tests locaux) : on ne touche que ceux qui
-- existent.

revoke execute on function analyses_used_this_month(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function analyses_used_this_month(uuid) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function analyses_used_this_month(uuid) to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function analyses_used_this_month(uuid) to service_role;
  end if;
end $$;
