-- ============================================================================
-- 0012 — Retirer les objets présents en production mais absents du dépôt
-- ============================================================================
-- Ces politiques et index ont été créés à la main sur la base de production.
-- Ils dupliquent des objets déjà définis dans les migrations 0002 à 0008 :
--   - "Users can read own …" = "read own …" (même condition, auth.uid()).
--   - idx_payments_user_id       couvert par payments_user_idx (user_id, …).
--   - idx_webhook_events_provider_id  identique à webhook_events_identity_idx.
--   - idx_checkout_intents_user_id, idx_subscriptions_user_id : sans
--     équivalent dans le dépôt.
-- IF EXISTS : la migration reste rejouable sur une base construite du dépôt.

drop policy if exists "Users can read own checkout intents" on checkout_intents;
drop policy if exists "Users can read own payments"         on payments;
drop policy if exists "Users can read own subscriptions"    on subscriptions;

drop index if exists idx_checkout_intents_user_id;
drop index if exists idx_payments_user_id;
drop index if exists idx_subscriptions_user_id;
drop index if exists idx_webhook_events_provider_id;
