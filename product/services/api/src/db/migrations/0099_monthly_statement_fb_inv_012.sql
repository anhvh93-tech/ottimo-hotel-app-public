-- 0099 (BE, R5 – FB-INV-012 monthly statement of a long stay, INV 17/11; contract rounds/round-05/fb-inv-012/contract.md
-- mục 2–3, DOM BR-LS-01…16). ADDITIVE ONLY: three new tables + three catalogue keys – no UPDATE/DELETE of existing rows,
-- no existing CHECK changed. Drafted by drizzle-kit from src/db/schema/billing.ts (head snapshot 0098 → prevId), completed
-- by hand (RLS, grants, parameters). Apply order = merge order: a PR merged after this one takes idx = 74,
-- when = this when + 2000 and regenerates its snapshot from main (rule of 0098).
-- - meter_reading: one reading of both meters of a room. INV 17/11 (bổ sung): the OPENING reading of each period is typed
--   by the desk (`period_start`, `checkin`, `room_change_in`); the previous closing is only a reference
--   (`previous_reading_id`) and opening − previous closing is the vacancy gap (`*_gap`, not billed, shown to OWN).
--   Live-row unique index: (reservation, room, kind, COALESCE(period_month, read_on)) WHERE not voided – a period kind
--   is unique per month, the other kinds per day.
-- - billing_period: the statement (ERD 4.11). One live statement per booking, month and kind. `payment.billing_period_id`
--   (exists since 0012) points at it – FK `payment_billing_period_fk` added (ARC BE-190-05; a constraint only, no data change).
-- - billing_period_line: lines frozen at issue, one live statement per folio line (`active`).
CREATE TABLE "billing_period" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"folio_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"lease_contract_id" uuid,
	"code" text,
	"statement_month" date NOT NULL,
	"kind" text NOT NULL,
	"rent_period_from" date,
	"rent_period_to" date,
	"utility_period_from" date,
	"utility_period_to" date,
	"service_period_from" date,
	"service_period_to" date,
	"due_date" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"excluded_folio_line_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"prior_adjustment_vnd" bigint,
	"prior_adjustment_reason" text,
	"note" text,
	"replaces_id" uuid,
	"rates_snapshot" jsonb,
	"net_vnd" bigint,
	"vat_vnd" bigint,
	"rounding_vnd" bigint,
	"total_vnd" bigint,
	"paid_vnd" bigint DEFAULT 0 NOT NULL,
	"issued_at" timestamp with time zone,
	"issued_by" uuid,
	"paid_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "billing_period_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "billing_period_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "billing_period_kind_check" CHECK ("billing_period"."kind" IN ('regular', 'final')),
	CONSTRAINT "billing_period_status_check" CHECK ("billing_period"."status" IN ('draft', 'issued', 'partially_paid', 'paid', 'void')),
	CONSTRAINT "billing_period_month_check" CHECK (extract(day FROM "billing_period"."statement_month") = 1),
	CONSTRAINT "billing_period_code_check" CHECK (("billing_period"."status" = 'draft' AND "billing_period"."code" IS NULL AND "billing_period"."issued_at" IS NULL) OR ("billing_period"."status" IN ('issued', 'partially_paid', 'paid') AND "billing_period"."code" IS NOT NULL AND "billing_period"."issued_at" IS NOT NULL) OR "billing_period"."status" = 'void'),
	CONSTRAINT "billing_period_void_check" CHECK (("billing_period"."status" = 'void') = ("billing_period"."voided_at" IS NOT NULL) AND ("billing_period"."void_reason" IS NULL OR char_length("billing_period"."void_reason") BETWEEN 3 AND 300)),
	CONSTRAINT "billing_period_prior_adjustment_check" CHECK (("billing_period"."prior_adjustment_vnd" IS NULL) = ("billing_period"."prior_adjustment_reason" IS NULL) AND ("billing_period"."prior_adjustment_reason" IS NULL OR char_length("billing_period"."prior_adjustment_reason") BETWEEN 3 AND 300)),
	CONSTRAINT "billing_period_note_check" CHECK ("billing_period"."note" IS NULL OR char_length("billing_period"."note") BETWEEN 3 AND 300),
	CONSTRAINT "billing_period_rates_snapshot_check" CHECK ("billing_period"."rates_snapshot" IS NULL OR jsonb_typeof("billing_period"."rates_snapshot") = 'object'),
	CONSTRAINT "billing_period_paid_check" CHECK ("billing_period"."paid_vnd" >= 0)
);
--> statement-breakpoint
CREATE TABLE "billing_period_line" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"billing_period_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"folio_line_id" uuid NOT NULL,
	"posted_by_statement" boolean NOT NULL,
	"meter_from_reading_id" uuid,
	"meter_to_reading_id" uuid,
	"room_id" uuid,
	"quantity" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"unit_price_net_vnd" bigint NOT NULL,
	"vat_rate_pct" numeric(5, 2),
	"net_vnd" bigint NOT NULL,
	"vat_vnd" bigint NOT NULL,
	"amount_vnd" bigint NOT NULL,
	"label_key" text NOT NULL,
	"label_params" jsonb,
	"details" jsonb,
	"sort_order" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "billing_period_line_kind_check" CHECK ("billing_period_line"."kind" IN ('rent', 'electricity', 'water', 'service', 'rounding', 'prior_adjustment')),
	CONSTRAINT "billing_period_line_unit_check" CHECK ("billing_period_line"."unit" IN ('month', 'day', 'kwh', 'm3', 'item')),
	CONSTRAINT "billing_period_line_amount_check" CHECK ("billing_period_line"."amount_vnd" = "billing_period_line"."net_vnd" + "billing_period_line"."vat_vnd"),
	CONSTRAINT "billing_period_line_details_check" CHECK (("billing_period_line"."details" IS NULL OR jsonb_typeof("billing_period_line"."details") = 'object') AND ("billing_period_line"."label_params" IS NULL OR jsonb_typeof("billing_period_line"."label_params") = 'object'))
);
--> statement-breakpoint
CREATE TABLE "meter_reading" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"period_month" date,
	"read_on" date NOT NULL,
	"electricity_value" numeric(10, 0) NOT NULL,
	"water_value" numeric(10, 1) NOT NULL,
	"electricity_exception" jsonb,
	"water_exception" jsonb,
	"previous_reading_id" uuid,
	"electricity_gap" numeric(10, 0),
	"water_gap" numeric(10, 1),
	"photo_attachment_id" uuid,
	"photo_waived_by" uuid,
	"exception_approved_by" uuid,
	"note" text,
	"read_by" uuid NOT NULL,
	"read_by_role" text NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "meter_reading_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "meter_reading_kind_check" CHECK ("meter_reading"."kind" IN ('checkin', 'period_start', 'period_end', 'room_change_out', 'room_change_in', 'checkout')),
	CONSTRAINT "meter_reading_period_month_check" CHECK (("meter_reading"."kind" IN ('period_start', 'period_end')) = ("meter_reading"."period_month" IS NOT NULL) AND ("meter_reading"."period_month" IS NULL OR extract(day FROM "meter_reading"."period_month") = 1)),
	CONSTRAINT "meter_reading_values_check" CHECK ("meter_reading"."electricity_value" >= 0 AND "meter_reading"."water_value" >= 0),
	CONSTRAINT "meter_reading_exception_check" CHECK (("meter_reading"."electricity_exception" IS NULL OR jsonb_typeof("meter_reading"."electricity_exception") = 'object') AND ("meter_reading"."water_exception" IS NULL OR jsonb_typeof("meter_reading"."water_exception") = 'object')),
	CONSTRAINT "meter_reading_photo_check" CHECK ("meter_reading"."photo_attachment_id" IS NOT NULL OR "meter_reading"."photo_waived_by" IS NOT NULL),
	CONSTRAINT "meter_reading_exception_approved_check" CHECK (("meter_reading"."electricity_exception" IS NULL AND "meter_reading"."water_exception" IS NULL) OR "meter_reading"."exception_approved_by" IS NOT NULL),
	CONSTRAINT "meter_reading_note_check" CHECK ("meter_reading"."note" IS NULL OR char_length("meter_reading"."note") BETWEEN 3 AND 300),
	CONSTRAINT "meter_reading_void_check" CHECK (("meter_reading"."voided_at" IS NULL) = ("meter_reading"."void_reason" IS NULL) AND ("meter_reading"."void_reason" IS NULL OR char_length("meter_reading"."void_reason") BETWEEN 3 AND 300)),
	CONSTRAINT "meter_reading_read_by_role_check" CHECK ("meter_reading"."read_by_role" IN ('owner', 'manager', 'front_desk_lead', 'front_desk'))
);
--> statement-breakpoint
ALTER TABLE "billing_period" ADD CONSTRAINT "billing_period_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period" ADD CONSTRAINT "billing_period_folio_fk" FOREIGN KEY ("property_id","folio_id") REFERENCES "public"."folio"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period" ADD CONSTRAINT "billing_period_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period" ADD CONSTRAINT "billing_period_replaces_fk" FOREIGN KEY ("property_id","replaces_id") REFERENCES "public"."billing_period"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period_line" ADD CONSTRAINT "billing_period_line_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period_line" ADD CONSTRAINT "billing_period_line_period_fk" FOREIGN KEY ("property_id","billing_period_id") REFERENCES "public"."billing_period"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period_line" ADD CONSTRAINT "billing_period_line_folio_line_fk" FOREIGN KEY ("property_id","folio_line_id") REFERENCES "public"."folio_line"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period_line" ADD CONSTRAINT "billing_period_line_from_fk" FOREIGN KEY ("property_id","meter_from_reading_id") REFERENCES "public"."meter_reading"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_period_line" ADD CONSTRAINT "billing_period_line_to_fk" FOREIGN KEY ("property_id","meter_to_reading_id") REFERENCES "public"."meter_reading"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_previous_fk" FOREIGN KEY ("property_id","previous_reading_id") REFERENCES "public"."meter_reading"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_photo_fk" FOREIGN KEY ("photo_attachment_id") REFERENCES "public"."attachment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- ARC BE-190-03 (late reading, FDL+ with a reason) and BE-190-05 (statement payment → statement of the same
-- property; every payment row before 0099 has billing_period_id NULL, so the FK is added validated).
ALTER TABLE "meter_reading" ADD COLUMN "late_reason" text;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD COLUMN "late_approved_by" uuid;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_billing_period_fk" FOREIGN KEY ("property_id","billing_period_id") REFERENCES "public"."billing_period"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_late_check" CHECK (("meter_reading"."late_reason" IS NULL) = ("meter_reading"."late_approved_by" IS NULL) AND ("meter_reading"."late_reason" IS NULL OR char_length("meter_reading"."late_reason") BETWEEN 3 AND 300));--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_read_by_fk" FOREIGN KEY ("organization_id","read_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_period_live_key" ON "billing_period" USING btree ("reservation_id","statement_month","kind") WHERE "billing_period"."status" <> 'void';--> statement-breakpoint
CREATE INDEX "billing_period_due_idx" ON "billing_period" USING btree ("property_id","status","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_period_line_live_folio_line_key" ON "billing_period_line" USING btree ("folio_line_id") WHERE "billing_period_line"."active";--> statement-breakpoint
CREATE INDEX "billing_period_line_period_idx" ON "billing_period_line" USING btree ("billing_period_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "meter_reading_live_key" ON "meter_reading" USING btree ("reservation_id","room_id","kind",COALESCE("period_month", "read_on")) WHERE "meter_reading"."voided_at" IS NULL;--> statement-breakpoint
CREATE INDEX "meter_reading_reservation_idx" ON "meter_reading" USING btree ("reservation_id","room_id","read_on");
--> statement-breakpoint
ALTER TABLE meter_reading ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE meter_reading FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON meter_reading USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
-- A wrong reading is voided and typed again – never rewritten (contract 2.1): UPDATE only on the void columns.
GRANT SELECT, INSERT ON meter_reading TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (voided_at, voided_by, void_reason, updated_at, version) ON meter_reading TO ottimo_app;
--> statement-breakpoint
ALTER TABLE billing_period ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE billing_period FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON billing_period USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT ON billing_period TO ottimo_app;
--> statement-breakpoint
-- The identity of a statement (booking, folio, month, kind, replaced statement) is written at INSERT only.
GRANT UPDATE (code, rent_period_from, rent_period_to, utility_period_from, utility_period_to, service_period_from,
  service_period_to, due_date, status, excluded_folio_line_ids, prior_adjustment_vnd, prior_adjustment_reason, note,
  rates_snapshot, net_vnd, vat_vnd, rounding_vnd, total_vnd, paid_vnd, issued_at, issued_by, paid_at, voided_at,
  voided_by, void_reason, updated_at, version) ON billing_period TO ottimo_app;
--> statement-breakpoint
ALTER TABLE billing_period_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE billing_period_line FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON billing_period_line USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
-- Frozen lines: only `active` changes (false when the statement is voided).
GRANT SELECT, INSERT ON billing_period_line TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (active) ON billing_period_line TO ottimo_app;
--> statement-breakpoint
-- Contract mục 3: three OWN-only keys (effective-dated like every key), each with a catalogue default – the production
-- bootstrap writes no row (production-defaults.ts unchanged). Values checked by the billing module's setParameter hooks.
--   * utility_unit_price – before VAT (INV 17/11): electricity 4.000 đ/kWh, water 25.000 đ/m³ (BR-LS-07; replaces the
--     reading of BR-501 `electricity_price` / `water_price`, which stay in the catalogue, unread).
--   * utility_vat_rate – % per meter (INV 17/11: electricity 8 % – 10 % from 01/01/2027, to be scheduled by OWN; water
--     5 %; awaiting the accountant). Rent and services are prices including VAT (BR-LS-08).
--   * monthly_statement_rules – BR-LS-01/02/03/09/10; partialFirstMonthRent `at_checkin` (INV 17/11).
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('utility_unit_price', 'json', '{owner}', 'BR-LS-07', false, NULL,
    '{"electricityVndPerKwh": 4000, "waterVndPerM3": 25000}'::jsonb),
  ('utility_vat_rate', 'json', '{owner}', 'BR-LS-08', false, NULL, '{"electricity": 8, "water": 5}'::jsonb),
  ('monthly_statement_rules', 'json', '{owner}', 'BR-LS-01', false, NULL,
    '{"rentTiming": "advance", "dueDay": 5, "totalRoundingVnd": 1000, "partialFirstMonthRent": "at_checkin", "readingWindow": {"daysBeforeMonthEnd": 0, "daysAfter": 1, "lateMaxDays": 10}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
