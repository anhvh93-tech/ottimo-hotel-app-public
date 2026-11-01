-- 0090 (BE, R4 gói LP-v2 – FB-INV-008 + FB-INV-009; OpenAPI 0.3.9-draft; ARC rounds/round-04/outputs/ARC/lp-v2-design.md
-- 2.7, 3.4, 4.1 BE-4…BE-6; DOM BR-115/116 v0.4.9; SEC lp-v2-privacy-and-api SR-LC-01, SR-PE-08).
-- Number: 0089 is taken by BE-A v1.0.1 (`0089_simulation_guard_room_price_cancel`, branch be-a-v1.0.1, not on main
-- yet) → this file is 0090, journal `when` = 0089 + 2 s. Snapshot drafted by drizzle-kit from 0088 (+ this change
-- only): whoever merges second re-chains `prevId` of 0090_snapshot.json to 0089 (no other conflict – different
-- tables).
-- Widen only, no data change:
--   * CHECK locale of `privacy_notice_version` and `website_booking_request` + 'ko', 'zh' (LandingLocale; 'ru' was
--     already allowed);
--   * `website_booking_request.price_estimate jsonb NULL` – what the guest saw on the form (verified token) + the
--     server recomputation at submit; NOT C2 (kept after the C2 purge, for DATA);
--   * catalogue keys: `public_show_prices` (OWN only, default false – the price block stays hidden until OWN turns
--     it on; audited `security` by ParametersService – SEC SR-PE-08) and three `web_estimate.*` keys of BR mục 13
--     (parity mode `ota_floor` – kept as the default by INV ESC-043 câu 1 = C). ESC-043 câu 2 (INV 01/11): the web shows
--     NO monthly price → `web_estimate.show_foreigner_monthly` is not created.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
ALTER TABLE "privacy_notice_version" DROP CONSTRAINT "privacy_notice_version_locale_check";--> statement-breakpoint
ALTER TABLE "website_booking_request" DROP CONSTRAINT "website_booking_request_locale_check";--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD COLUMN "price_estimate" jsonb;--> statement-breakpoint
ALTER TABLE "privacy_notice_version" ADD CONSTRAINT "privacy_notice_version_locale_check" CHECK ("privacy_notice_version"."locale" IN ('vi', 'en', 'ru', 'ko', 'zh'));--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_price_estimate_check" CHECK ("website_booking_request"."price_estimate" IS NULL OR jsonb_typeof("website_booking_request"."price_estimate") = 'object');--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_locale_check" CHECK ("website_booking_request"."locale" IN ('vi', 'en', 'ru', 'ko', 'zh'));
--> statement-breakpoint
-- ───────────── catalogue (erd 9.3) ─────────────
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('public_show_prices', 'bool', '{owner}', 'BR-115', false, NULL, 'false'::jsonb),
  ('web_estimate.parity_mode', 'text', '{owner}', 'BR-116', false,
   '{"allowed":["ota_floor","direct"]}'::jsonb, '"ota_floor"'::jsonb),
  ('web_estimate.open_until', 'text', '{owner,manager}', 'BR-115', false, NULL, '"2027-01-01"'::jsonb),
  ('web_estimate.honor_hours', 'int', '{owner}', 'BR-115', false, '{"min":0,"max":168}'::jsonb, '48'::jsonb)
ON CONFLICT (key) DO NOTHING;
