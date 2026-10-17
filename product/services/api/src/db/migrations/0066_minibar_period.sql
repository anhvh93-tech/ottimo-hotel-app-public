-- 0066 (drizzle draft from schema/inventory.ts, completed by hand – BE-B, R2 Sprint 4 tuần Ổn định, Phản hồi & sửa
-- vòng 4; number from ORC 18/10). Kỳ nạp (ARC `openapi-0.3.7.md` 16.2 R1/R6/R7/R9, 16.13; erd 4.10; BUG-R2-144,
-- DOM BR-703-02): every count belongs to ONE period of its fridge (`minibar_check.fill_id` = the fill that opened
-- it); a count replaces only the live count of the same (stay, room, period); `carry` = a period opened when the
-- stay goes on in a counted fridge not refilled yet (mark = what was left, 0 allowed). Existing counts get the
-- fill in force when they were taken. Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's
-- single transaction.
ALTER TABLE "minibar_fill" DROP CONSTRAINT "minibar_fill_source_check";--> statement-breakpoint
ALTER TABLE "minibar_fill_line" DROP CONSTRAINT "minibar_fill_line_qty_check";--> statement-breakpoint
DROP INDEX "minibar_check_live_checkout_key";--> statement-breakpoint
ALTER TABLE "minibar_check" ADD COLUMN "fill_id" uuid;--> statement-breakpoint
ALTER TABLE "minibar_check" ADD CONSTRAINT "minibar_check_fill_fk" FOREIGN KEY ("property_id","fill_id") REFERENCES "public"."minibar_fill"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Back-fill (pattern 0060/0065): FORCE RLS binds the owner too, so RLS is off for it only.
ALTER TABLE minibar_check NO FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE minibar_check DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE minibar_fill DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- The period of an existing count = the latest fill of its fridge at the time it was taken.
UPDATE minibar_check c
   SET fill_id = (SELECT f.id FROM minibar_fill f
                   WHERE f.reservation_id = c.reservation_id AND f.room_id = c.room_id AND f.filled_at <= c.created_at
                   ORDER BY f.filled_at DESC, f.id DESC LIMIT 1)
 WHERE c.fill_id IS NULL;--> statement-breakpoint
ALTER TABLE minibar_fill ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE minibar_check ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE minibar_check FORCE ROW LEVEL SECURITY;--> statement-breakpoint
-- ARC 16.15: NULLS NOT DISTINCT (PostgreSQL 15+) – a fridge without a fill yet (fill_id NULL) still has ONE live
-- count; drizzle cannot express it on an index (the snapshot keeps the plain index – same name).
CREATE UNIQUE INDEX "minibar_check_live_checkout_key" ON "minibar_check" USING btree ("reservation_id","room_id","fill_id") NULLS NOT DISTINCT WHERE "minibar_check"."mode" = 'checkout' AND "minibar_check"."replaced_by_check_id" IS NULL;--> statement-breakpoint
ALTER TABLE "minibar_fill" ADD CONSTRAINT "minibar_fill_source_check" CHECK ("minibar_fill"."source" IN ('check_in', 'refill', 'backfill', 'carry'));--> statement-breakpoint
ALTER TABLE "minibar_fill_line" ADD CONSTRAINT "minibar_fill_line_qty_check" CHECK ("minibar_fill_line"."qty" >= 0);
