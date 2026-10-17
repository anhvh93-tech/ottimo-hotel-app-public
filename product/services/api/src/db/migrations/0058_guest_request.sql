-- 0058 (hand-written – BE-D, R2 Sprint 4; number from ORC 17/10): guest requests of the guest app (erd 4.11
-- `guest_request`, SM-15; OpenAPI 0.3.6 B-14…B-16 + 0.3.7: fee snapshot, declined reason code, reply note,
-- updatedAt) + the catalogue key of the map pin (S4-51, P-S4-7 – one source for US-108 / US-148 / US-162).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
-- Also the cross-module FKs hk_task.guest_request_id / work_order.guest_request_id → guest_request and
-- guest_request.work_order_id → work_order (work_order is created by BE-C's 0056, which runs first – moved here
-- from 0057 at ORC integration 17/10 so the journal applies in prefix order).

CREATE TABLE "guest_request" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"room_id" uuid,
	"type" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'new' NOT NULL,
	"routed_to" text NOT NULL,
	"ack_due_at" timestamp with time zone NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by" uuid,
	"auto_replied_at" timestamp with time zone,
	"hk_task_id" uuid,
	"work_order_id" uuid,
	"fee_vnd_snapshot" bigint,
	"fee_accepted_at" timestamp with time zone,
	"fee_folio_line_id" uuid,
	"declined_reason_code" text,
	"reply_note" text,
	"overdue_notified_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"purge_after" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "guest_request_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "guest_request_type_check" CHECK ("guest_request"."type" IN ('extra_cleaning', 'amenities', 'report_issue', 'transport_tour', 'late_checkout', 'other')),
	CONSTRAINT "guest_request_status_check" CHECK ("guest_request"."status" IN ('new', 'acknowledged', 'in_progress', 'done', 'declined')),
	CONSTRAINT "guest_request_routed_to_check" CHECK ("guest_request"."routed_to" IN ('housekeeping', 'maintenance', 'front_desk')),
	CONSTRAINT "guest_request_note_check" CHECK ("guest_request"."note" IS NULL OR char_length("guest_request"."note") <= 500),
	CONSTRAINT "guest_request_reply_note_check" CHECK ("guest_request"."reply_note" IS NULL OR char_length("guest_request"."reply_note") <= 300),
	CONSTRAINT "guest_request_declined_reason_check" CHECK ("guest_request"."declined_reason_code" IS NULL OR "guest_request"."declined_reason_code" IN ('not_available_now', 'outside_service_hours', 'needs_front_desk', 'duplicate', 'other')),
	CONSTRAINT "guest_request_declined_check" CHECK (("guest_request"."status" = 'declined') = ("guest_request"."declined_reason_code" IS NOT NULL)),
	CONSTRAINT "guest_request_declined_other_check" CHECK ("guest_request"."declined_reason_code" IS DISTINCT FROM 'other' OR ("guest_request"."reply_note" IS NOT NULL AND btrim("guest_request"."reply_note") <> '')),
	CONSTRAINT "guest_request_fee_check" CHECK ("guest_request"."fee_vnd_snapshot" IS NULL OR ("guest_request"."fee_vnd_snapshot" > 0 AND "guest_request"."fee_accepted_at" IS NOT NULL)),
	CONSTRAINT "guest_request_ack_check" CHECK ("guest_request"."acknowledged_by" IS NULL OR "guest_request"."acknowledged_at" IS NOT NULL),
	CONSTRAINT "guest_request_closed_check" CHECK (("guest_request"."closed_at" IS NOT NULL) = ("guest_request"."status" IN ('done', 'declined')))
);
--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_hk_task_fk" FOREIGN KEY ("property_id","hk_task_id") REFERENCES "public"."hk_task"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_fee_line_fk" FOREIGN KEY ("property_id","fee_folio_line_id") REFERENCES "public"."folio_line"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_ack_by_fk" FOREIGN KEY ("organization_id","acknowledged_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_closed_by_fk" FOREIGN KEY ("organization_id","closed_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_request_open_idx" ON "guest_request" USING btree ("property_id","ack_due_at") WHERE "guest_request"."status" IN ('new', 'acknowledged', 'in_progress');--> statement-breakpoint
CREATE INDEX "guest_request_reservation_idx" ON "guest_request" USING btree ("reservation_id","created_at");--> statement-breakpoint

-- ───────────── RLS (erd 2.3): property-level; no DELETE (T13 empties `note`, keeps the row) ─────────────
ALTER TABLE "guest_request" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "guest_request" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "guest_request" USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "guest_request" TO ottimo_app;
--> statement-breakpoint

-- ───────────── S4-51 / P-S4-7: the map pin of the property (US-108 "Chỉ đường") ─────────────
-- OWN edits it in Tham số (setParameter; host allow-list SEC E14-08 checked there – 422 NOT_IN_LIST). The
-- catalogue default is the pin INV sent on 17/10 for OTTIMO (R2 = one property) [GIẢ ĐỊNH BE-D – OWN đổi ở Tham số].
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('property_map_url', 'text', '{owner}', NULL, false, NULL,
        '"https://maps.app.goo.gl/oYos42G5YvUEcDCc6"'::jsonb)
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- ───────────── 0.3.7 bổ sung 1 (P-S4-10; erd guest_session): the guest picked the session language ─────────────
-- setGuestLocale stamps it; openGuestSession keeps the newest choice of the same booking (re-opened / re-issued
-- link – revoked sessions included, hence the index without the revoked_at filter). Not the guest profile.
ALTER TABLE "guest_session" ADD COLUMN "locale_chosen_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "guest_session_locale_chosen_idx" ON "guest_session" USING btree ("reservation_id","locale_chosen_at" DESC NULLS LAST) WHERE "guest_session"."locale_chosen_at" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "hk_task" ADD CONSTRAINT "hk_task_guest_request_fk" FOREIGN KEY ("property_id","guest_request_id") REFERENCES "public"."guest_request"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_guest_request_fk" FOREIGN KEY ("property_id","guest_request_id") REFERENCES "public"."guest_request"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_request" ADD CONSTRAINT "guest_request_work_order_fk" FOREIGN KEY ("property_id","work_order_id") REFERENCES "public"."work_order"("property_id","id") ON DELETE no action ON UPDATE no action;
