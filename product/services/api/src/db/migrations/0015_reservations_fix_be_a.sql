-- 0015 (drizzle-kit draft, hand-ordered – erd 16; BE-A Sprint 2 response & fix):
-- conflict kind (DOM D-1/D-3), rack window index (ARC-BE-S2-11), stay_night (property_id, id) target for the
-- tenant-pair FK of folio_line (SEC-BE-30), user FKs of room_block. folio_id NOT NULL + backfill in 0016.
ALTER TABLE "reservation" ADD COLUMN "conflict_kind" text;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_conflict_kind_check" CHECK ("reservation"."conflict_kind" IS NULL OR "reservation"."conflict_kind" IN ('unassigned', 'capacity'));--> statement-breakpoint
ALTER TABLE "room_block" ADD CONSTRAINT "room_block_ack_by_fk" FOREIGN KEY ("organization_id","affected_reservation_ack_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_block" ADD CONSTRAINT "room_block_released_by_fk" FOREIGN KEY ("organization_id","released_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservation_segment_window_idx" ON "reservation_segment" USING btree ("property_id","to_date","from_date") WHERE "reservation_segment"."active";--> statement-breakpoint
ALTER TABLE "stay_night" ADD CONSTRAINT "stay_night_property_id_key" UNIQUE("property_id","id");
