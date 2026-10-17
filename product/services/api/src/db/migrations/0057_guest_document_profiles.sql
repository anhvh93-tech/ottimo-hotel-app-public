-- 0057 (custom, hand-written – erd 16, ARC s3-contract 4.2a; BE-C, R2 Sprint 4 – number from ORC 17/10):
-- (1) OpenAPI 0.3.7 nhóm D mục A (S4-11, S4-32 – profiles "from documents", SEC s3 mục 7): the flag
--     `guest_document.possible_returning_guest` (name + date of birth match a profile OUTSIDE the booking – the
--     desk confirms, BR-952; computed when the document is entered, the date of birth stays encrypted);
-- (2) A.3 – security parameter `document_profile_retention_months` (1–12, default 12, OWN only; SEC s3 7.2 / T05
--     – J25 anonymises `document` profiles without P05 this long after their last check-out), enabled in
--     OpenAPI setParameter.x-security-parameters in the same change (architecture.test.ts compares both);
-- The cross-module FKs of the guest requests (hk_task / work_order ↔ guest_request) are in 0058, which creates
-- guest_request and runs after this migration (ORC integration 17/10: journal in prefix order).
-- Columns `guest.source`, `id_doc_hmac` v1 CHECK, CHECK 1–3, `last_stay_checkout_at` are in the shared 0055.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.

ALTER TABLE "guest_document" ADD COLUMN "possible_returning_guest" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('document_profile_retention_months', 'security', '{owner}', 'T05', true,
   '{"type":"integer","minimum":1,"maximum":12}'::jsonb, '12'::jsonb)
ON CONFLICT (key) DO NOTHING;
