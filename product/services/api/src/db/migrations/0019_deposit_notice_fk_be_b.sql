-- 0019 (drizzle-kit + hand-written, BE-B Sprint 2 response & fix – FB-R2-ARC-BE-S2-09, BR-527 v0.3.2):
-- staff_payment_backdate_max_hours catalogue key; deposit_notice → the receipt that
-- handled it, as a tenant pair. attachment_id waits for the attachment table (Sprint 3).
ALTER TABLE "deposit_notice" ADD CONSTRAINT "deposit_notice_handled_payment_fk" FOREIGN KEY ("property_id","handled_payment_id") REFERENCES "public"."payment"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- BR-527 v0.3.2 (SEC BE-22, DOM decision): how far back a sale/CTV may date a receipt they record.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('staff_payment_backdate_max_hours', 'int', '{owner,manager}', 'BR-527', false,
        '{"min": 0, "max": 72}'::jsonb, '24'::jsonb)
ON CONFLICT (key) DO NOTHING;
