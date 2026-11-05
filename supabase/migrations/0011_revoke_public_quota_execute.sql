-- ============================================================================
-- 0011 — Retirer l'exécution anonyme du quota d'analyses
-- ============================================================================
-- EXECUTE est accordé à PUBLIC par défaut : révoquer seulement anon ne suffit
-- pas. On retire PUBLIC et anon, puis on réaccorde explicitement à
-- authenticated (appel normal de l'app) et au service_role.

revoke execute on function analyses_used_this_month(uuid) from public, anon;
grant execute on function analyses_used_this_month(uuid) to authenticated, service_role;
