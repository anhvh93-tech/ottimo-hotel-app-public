-- 0017 (drizzle-kit draft – BE-A Sprint 2 response & fix, OpenAPI 0.3.5 §8.3): capacity conflict of OTA bookings
-- (A-20, DOM D-1), stay_night.calendar_rate_vnd (A-22, DOM D-8), incident source no_show_restore (A-21),
-- MoveReasonCode CHECK (A-19).
ALTER TABLE "overbooking_incident" DROP CONSTRAINT "overbooking_incident_source_check";--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "capacity_conflict_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "capacity_ack_reason" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "capacity_ack_by" uuid;--> statement-breakpoint
ALTER TABLE "stay_night" ADD COLUMN "calendar_rate_vnd" bigint;--> statement-breakpoint
ALTER TABLE "overbooking_incident" ADD CONSTRAINT "overbooking_incident_source_check" CHECK ("overbooking_incident"."source" IN ('desk', 'channel_sync', 'no_show_restore'));--> statement-breakpoint
ALTER TABLE "reservation_segment" ADD CONSTRAINT "reservation_segment_reason_check" CHECK ("reservation_segment"."change_reason_code" IS NULL OR "reservation_segment"."change_reason_code" IN ('guest_request', 'property_fault', 'overbooking', 'upgrade', 'inventory_optimize', 'force_majeure', 'other'));--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_capacity_ack_by_fk" FOREIGN KEY ("organization_id","capacity_ack_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;
