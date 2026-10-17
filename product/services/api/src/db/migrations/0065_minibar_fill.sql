-- 0065 (drizzle draft from schema/inventory.ts + schema/folio.ts, completed by hand – BE-B, R2 Sprint 4 tuần Ổn định,
-- Phản hồi & sửa vòng 3; number from ORC 18/10). Mô hình minibar M-1 (ARC `openapi-0.3.7.md` mục 16, erd 4.6/4.10;
-- BUG-R2-135…138, 140; BR-434-15/16, BR-702-02/03, BR-703-01) + DOM (f) QR context (ARC D7):
-- - minibar_fill / minibar_fill_line: the level and price of each item put in a fridge (R2–R5); INSERT-only;
-- - minibar_check: one live `checkout` count per fridge = (stay, room) – B14 leaves two fridges (R1);
-- - folio_line.charge_code = item.code on every minibar line (FOC key `item:minibar:<code>` – R8), back-filled;
-- - a `backfill` fill for the fridges of the stays in house that already have a count (mark/price of that count);
-- - payment.qr_purpose / qr_context: what a VietQR was for and the inputs of its cap (confirmation, D7).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
CREATE TABLE "minibar_fill" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"source" text NOT NULL,
	"filled_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "minibar_fill_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "minibar_fill_source_check" CHECK ("minibar_fill"."source" IN ('check_in', 'refill', 'backfill'))
);
--> statement-breakpoint
CREATE TABLE "minibar_fill_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"fill_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"qty" integer NOT NULL,
	"unit_price_vnd_snapshot" bigint,
	"unit_cost_vnd_snapshot" bigint,
	CONSTRAINT "minibar_fill_line_item_key" UNIQUE("fill_id","item_id"),
	CONSTRAINT "minibar_fill_line_qty_check" CHECK ("minibar_fill_line"."qty" >= 1),
	CONSTRAINT "minibar_fill_line_price_check" CHECK (("minibar_fill_line"."unit_price_vnd_snapshot" IS NULL OR "minibar_fill_line"."unit_price_vnd_snapshot" >= 0) AND ("minibar_fill_line"."unit_cost_vnd_snapshot" IS NULL OR "minibar_fill_line"."unit_cost_vnd_snapshot" >= 0))
);
--> statement-breakpoint
DROP INDEX "minibar_check_live_checkout_key";--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "qr_purpose" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "qr_context" jsonb;--> statement-breakpoint
ALTER TABLE "minibar_fill" ADD CONSTRAINT "minibar_fill_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minibar_fill" ADD CONSTRAINT "minibar_fill_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minibar_fill" ADD CONSTRAINT "minibar_fill_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minibar_fill" ADD CONSTRAINT "minibar_fill_created_by_fk" FOREIGN KEY ("organization_id","created_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minibar_fill_line" ADD CONSTRAINT "minibar_fill_line_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minibar_fill_line" ADD CONSTRAINT "minibar_fill_line_fill_fk" FOREIGN KEY ("property_id","fill_id") REFERENCES "public"."minibar_fill"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minibar_fill_line" ADD CONSTRAINT "minibar_fill_line_item_fk" FOREIGN KEY ("property_id","item_id") REFERENCES "public"."item"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "minibar_fill_fridge_idx" ON "minibar_fill" USING btree ("property_id","reservation_id","room_id","filled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "minibar_check_live_checkout_key" ON "minibar_check" USING btree ("reservation_id","room_id") WHERE "minibar_check"."mode" = 'checkout' AND "minibar_check"."replaced_by_check_id" IS NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_qr_purpose_check" CHECK ("payment"."qr_purpose" IS NULL OR ("payment"."method" = 'vietqr' AND "payment"."qr_purpose" IN ('deposit', 'balance', 'check_in', 'check_out', 'billing_period')));--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_qr_context_check" CHECK ("payment"."qr_context" IS NULL OR jsonb_typeof("payment"."qr_context") = 'object');
--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['minibar_fill', 'minibar_fill_line'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- A fill is a record (like a count): never changed.
GRANT SELECT, INSERT ON minibar_fill, minibar_fill_line TO ottimo_app;
--> statement-breakpoint
-- Back-fills (pattern 0016/0055/0060): FORCE RLS binds the owner too, so RLS is off for them only.
ALTER TABLE folio_line NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE item NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE item DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- charge_code of a counted minibar line = the code of its item (immutable – NOT_EDITABLE) …
UPDATE folio_line f
   SET charge_code = i.code
  FROM minibar_check_line l JOIN item i ON i.id = l.item_id
 WHERE l.folio_line_id = f.id AND f.category = 'minibar' AND f.charge_code IS NULL;
--> statement-breakpoint
-- … inherited by its replacements (adjustFolioLine / recount chains) and its reversal rows.
DO $$
DECLARE n integer;
BEGIN
  LOOP
    UPDATE folio_line c
       SET charge_code = p.charge_code
      FROM folio_line p
     WHERE c.category = 'minibar' AND c.charge_code IS NULL
       AND p.category = 'minibar' AND p.charge_code IS NOT NULL
       AND (c.related_line_id = p.id OR c.reversal_of_id = p.id);
    GET DIAGNOSTICS n = ROW_COUNT;
    EXIT WHEN n = 0;
  END LOOP;
END $$;
--> statement-breakpoint
-- Fridges of the stays in house that already have a live count: their fill = the mark and price of that count,
-- dated just before the first count of the fridge (the next count of the same level is a re-count, R6).
INSERT INTO minibar_fill (id, organization_id, property_id, reservation_id, room_id, source, filled_at, created_by,
  created_at)
SELECT gen_random_uuid(), c.organization_id, c.property_id, c.reservation_id, c.room_id, 'backfill',
       (SELECT min(k.created_at) FROM minibar_check k
         WHERE k.reservation_id = c.reservation_id AND k.room_id = c.room_id AND k.mode = 'checkout')
         - interval '1 millisecond',
       NULL, now()
  FROM minibar_check c JOIN reservation r ON r.id = c.reservation_id
 WHERE c.mode = 'checkout' AND c.replaced_by_check_id IS NULL AND r.status = 'in_house';
--> statement-breakpoint
INSERT INTO minibar_fill_line (id, organization_id, property_id, fill_id, item_id, qty, unit_price_vnd_snapshot,
  unit_cost_vnd_snapshot)
SELECT gen_random_uuid(), l.organization_id, l.property_id, f.id, l.item_id, l.standard_qty,
       l.unit_price_vnd_snapshot, l.unit_cost_vnd_snapshot
  FROM minibar_fill f
  JOIN minibar_check c ON c.reservation_id = f.reservation_id AND c.room_id = f.room_id
   AND c.mode = 'checkout' AND c.replaced_by_check_id IS NULL
  JOIN minibar_check_line l ON l.check_id = c.id
 WHERE f.source = 'backfill' AND l.standard_qty >= 1;
--> statement-breakpoint
ALTER TABLE minibar_fill ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE item ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE item FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_line FORCE ROW LEVEL SECURITY;
