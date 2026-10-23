-- 0083 (BE-D, R3 Sprint 1 – R3-Q15, release v1.0; number per ORC 23/10: 2FA 0079, BE-C q17 0081 (on main), BE-B step 4 0082 –
-- not on main yet: journal `when` = 0081 + 2000 leaves room; ORC re-chains snapshot prevId after 0082 at merge). T13 (US-109 AC3, US-110 AC4, SEC s1 B.7, DRA T13 12 months): `guest_request.note_purged_at`,
-- index of requests still carrying text (job `guest_request.purge`; also `online_checkin.arrival_note`, SEC BED-01/02), CHECK `declined_other` relaxed once the
-- text is purged, catalogue key `retention.guest_request_months` (OWN only – retention.*). Drafted by drizzle-kit
-- from the .ts schema (head snapshot 0083). Runs as ottimo_owner inside the migrator's single transaction.
ALTER TABLE "guest_request" DROP CONSTRAINT "guest_request_declined_other_check";--> statement-breakpoint
ALTER TABLE "guest_request" ADD COLUMN "note_purged_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "guest_request_t13_idx" ON "guest_request" USING btree ("property_id","closed_at","created_at") WHERE "guest_request"."note" IS NOT NULL OR "guest_request"."reply_note" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_declined_other_check" CHECK ("guest_request"."declined_reason_code" IS DISTINCT FROM 'other' OR "guest_request"."note_purged_at" IS NOT NULL OR ("guest_request"."reply_note" IS NOT NULL AND btrim("guest_request"."reply_note") <> ''));
--> statement-breakpoint
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('retention.guest_request_months', 'int', '{owner}', 'T13', false, '{"min":1,"max":12}'::jsonb, '12'::jsonb)
ON CONFLICT (key) DO NOTHING;
