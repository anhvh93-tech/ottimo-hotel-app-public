-- 0091 (BE, R4 gói LP-v2 – FB-INV-008 + FB-INV-009; OpenAPI 0.3.10-draft; ARC rounds/round-04/outputs/ARC/lp-v2-design.md
-- 2.7, 3.4, 4.1 BE-4…BE-6; DOM BR-115/116 v0.5.0; SEC lp-v2-privacy-and-api SR-LC-01, SR-PE-08).
-- Number (ARC FB-R4-ARC-BE-LPV2-01, decision-log 30/10): 0089 = BE-A v1.0.1 (`0089_simulation_guard_room_price_cancel`),
-- 0090 = reserved for PN-01 (privacy_notice_version append-only) → LP-v2 takes 0091; journal `when` = 0088 + 6 s
-- (= 0089 + 4 s = PN-01 + 2 s), so it stays the newest after both land on main first. On this branch the journal
-- idx is its array position (test migrations-journal); when main brings 0089/0090, the journal entry moves after
-- them and the snapshot is regenerated (rounds/round-04/outputs/BE/lp-v2-be.md, "Gộp migration").
-- Widen only, no data change:
--   * CHECK locale of `privacy_notice_version` and `website_booking_request` + 'ko', 'zh' (LandingLocale; 'ru' was
--     already allowed);
--   * `website_booking_request.price_estimate jsonb NULL` – what the guest saw on the form (verified token) + the
--     server recomputation at submit; NOT C2 (kept after the C2 purge, for DATA);
--   * catalogue keys: `public_show_prices` (OWN only, default false – the price block stays hidden until OWN turns
--     it on; audited `security` by ParametersService – SEC SR-PE-08) and `web_estimate.open_until` (BR-115 (6)).
--     INV 01/11 (one price for every channel – BR-116 v0.5.0, ARC FB-R4-ARC-BE-LPV2-04): NO `web_estimate.parity_mode`
--     (the web number is the Desk direct quote, no OTA floor). `web_estimate.honor_hours` is not created either (no
--     code reads it yet – ARC FB-R4-ARC-BE-LPV2-07; the Desk quote rule comes with its own migration). ESC-043 câu 2:
--     the web shows NO monthly price → no `web_estimate.show_foreigner_monthly`.
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
  ('web_estimate.open_until', 'text', '{owner,manager}', 'BR-115', false, NULL, '"2027-01-01"'::jsonb)
ON CONFLICT (key) DO NOTHING;
