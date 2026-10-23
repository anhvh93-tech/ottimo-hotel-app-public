-- 0082 (drizzle draft from schema/folio.ts + schema/reservations.ts + schema/frontdesk.ts, completed by hand – BE-B,
-- R3 Sprint 1 lượt kiểm tiền bước 4 + Phản hồi & sửa). Number from ORC 23/10 (ARC S1-14): next after 0081 on `main`
-- (0079 2FA, 0081 BE-C q17; 0080 left empty), journal `when` after 0081, snapshot regenerated on 0081 (prevId).
-- - foc_stay_alert (BR-433 (c) v0.4.0, ESC-026 A, erd 4.15): one row per stay whose waivers went above the threshold;
--   FK to the stay root booking (ARC S1-12);
-- - staff_notification kind `foc_stay_total_exceeded`. ARC S1-09: the CHECK list = the list on `main` at rebase +
--   the new kind ONLY (test/notification-kinds.test.ts compares this SQL with STAFF_NOTIFICATION_KINDS);
-- - BR-433 (d) v0.4.1 (FB-R3-SEC-BE-B-07, ARC S1-08): protected limit basis – stay_night.reference_rate_vnd (system
--   price paths only), folio_line.limit_ref_vnd (required on night lines – fail closed), folio.limit_basis_checkout_vnd
--   (captured by settle); back-filled from the current prices (demo/QA data only – staging starts empty, OPS C2);
-- - catalogue key `stay_waiver_review_hours` (BR-433 (c) (3)).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
CREATE TABLE "foc_stay_alert" (
	"stay_root_reservation_id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"first_alerted_at" timestamp with time zone NOT NULL,
	"last_alerted_at" timestamp with time zone NOT NULL,
	"alert_count" integer NOT NULL,
	"attention_event_id" uuid,
	CONSTRAINT "foc_stay_alert_count_check" CHECK ("foc_stay_alert"."alert_count" >= 1)
);
--> statement-breakpoint
ALTER TABLE "staff_notification" DROP CONSTRAINT "staff_notification_kind_check";--> statement-breakpoint
ALTER TABLE "folio" ADD COLUMN "limit_basis_checkout_vnd" bigint;--> statement-breakpoint
ALTER TABLE "folio_line" ADD COLUMN "limit_ref_vnd" bigint;--> statement-breakpoint
ALTER TABLE "stay_night" ADD COLUMN "reference_rate_vnd" bigint;--> statement-breakpoint
ALTER TABLE "foc_stay_alert" ADD CONSTRAINT "foc_stay_alert_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foc_stay_alert" ADD CONSTRAINT "foc_stay_alert_reservation_fk" FOREIGN KEY ("property_id","stay_root_reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio" ADD CONSTRAINT "folio_limit_basis_checkout_check" CHECK ("folio"."limit_basis_checkout_vnd" IS NULL OR "folio"."limit_basis_checkout_vnd" >= 0);--> statement-breakpoint
ALTER TABLE "folio_line" ADD CONSTRAINT "folio_line_limit_ref_check" CHECK ("folio_line"."limit_ref_vnd" IS NULL OR "folio_line"."limit_ref_vnd" >= 0);--> statement-breakpoint
ALTER TABLE "stay_night" ADD CONSTRAINT "stay_night_reference_rate_check" CHECK ("stay_night"."reference_rate_vnd" >= 0);--> statement-breakpoint
ALTER TABLE "staff_notification" ADD CONSTRAINT "staff_notification_kind_check" CHECK ("staff_notification"."kind" IN ('hold_expired', 'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new', 'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection', 'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded', 'foc_stay_total_exceeded'));

--> statement-breakpoint
-- Back-fills (pattern 0016/0055/0060/0065): FORCE RLS binds the owner too, so RLS is off for them only.
ALTER TABLE stay_night NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE stay_night SET reference_rate_vnd = room_revenue_gross_vnd WHERE reference_rate_vnd IS NULL;
--> statement-breakpoint
UPDATE folio_line l SET limit_ref_vnd = COALESCE(
         (SELECT n.reference_rate_vnd FROM stay_night n WHERE n.id = l.stay_night_id),
         CASE WHEN l.charge_code = 'late_fee_as_night' THEN abs(l.amount_vnd) ELSE abs(l.unit_price_vnd) END)
 WHERE (l.category = 'room' OR l.charge_code = 'late_fee_as_night') AND l.limit_ref_vnd IS NULL;
--> statement-breakpoint
ALTER TABLE stay_night ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stay_night" ALTER COLUMN "reference_rate_vnd" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "folio_line" ADD CONSTRAINT "folio_line_limit_ref_required_check" CHECK (("folio_line"."category" <> 'room' AND "folio_line"."charge_code" IS DISTINCT FROM 'late_fee_as_night') OR "folio_line"."limit_ref_vnd" IS NOT NULL);
--> statement-breakpoint
ALTER TABLE foc_stay_alert ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE foc_stay_alert FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON foc_stay_alert USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT ON foc_stay_alert TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (last_alerted_at, alert_count, attention_event_id) ON foc_stay_alert TO ottimo_app;
--> statement-breakpoint
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('stay_waiver_review_hours', 'int', '{owner}', 'BR-433', false, '{"min":1,"max":168}'::jsonb, '24'::jsonb)
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
-- ARC S1-11: the open "Cần chú ý" item of a stay takes its new count (EventsService.updateAttentionParams).
GRANT UPDATE (details) ON attention_event TO ottimo_app;
