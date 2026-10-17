-- 0056 (custom, hand-written from a drizzle draft – erd 16, ARC s3-contract 4.2a; BE-C, R2 Sprint 4 – number from
-- ORC 17/10): housekeeping + maintenance tables of OpenAPI 0.3.7 nhóm H (erd 4.8 `inspection`, 4.9 `work_order`)
-- + the property's inspection checklist (BR-808 "cấu hình được"), RLS, grants, the FK room_block.work_order_id →
-- work_order (cross-module, SQL only – 4.2a-2e) and the catalogue key wo_done_photo_required_severities (BR-809,
-- DOM D-15). `room_status` / `hk_task` already exist (0030 / 0013 + 0055). The history of a work order is read
-- back from state_transition (SM-04) + audit_event – no table (erd 4.9). Schema: src/db/schema/housekeeping.ts.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
CREATE TABLE "inspection" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"result" text NOT NULL,
	"self_inspection" boolean DEFAULT false NOT NULL,
	"inspected_by" uuid NOT NULL,
	"inspected_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"checklist_version" integer NOT NULL,
	"items" jsonb NOT NULL,
	"photo_attachment_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"room_status_after" text NOT NULL,
	"redo_task_id" uuid,
	CONSTRAINT "inspection_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "inspection_result_check" CHECK ("inspection"."result" IN ('pass', 'fail')),
	CONSTRAINT "inspection_items_check" CHECK (jsonb_typeof("inspection"."items") = 'array'),
	CONSTRAINT "inspection_room_status_after_check" CHECK ("inspection"."room_status_after" IN ('VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO')),
	CONSTRAINT "inspection_photos_check" CHECK (cardinality("inspection"."photo_attachment_ids") <= 4)
);
--> statement-breakpoint
CREATE TABLE "inspection_checklist" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"items" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "inspection_checklist_items_check" CHECK (jsonb_typeof("inspection_checklist"."items") = 'array'),
	CONSTRAINT "inspection_checklist_version_check" CHECK ("inspection_checklist"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "work_order" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"code" text NOT NULL,
	"room_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text NOT NULL,
	"reported_by" uuid,
	"assignee_user_id" uuid,
	"accepted_at" timestamp with time zone,
	"ack_due_at" timestamp with time zone,
	"resolve_due_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"parts_note" text,
	"parts_expected_date" date,
	"result_note" text,
	"photo_attachment_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"done_photo_attachment_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"cancel_reason" text,
	"reopened_count" smallint DEFAULT 0 NOT NULL,
	"block_requested" boolean DEFAULT false NOT NULL,
	"overdue_notified_at" timestamp with time zone,
	"remedy_suggested_at" timestamp with time zone,
	"guest_request_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "work_order_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "work_order_code_key" UNIQUE("property_id","code"),
	CONSTRAINT "work_order_status_check" CHECK ("work_order"."status" IN ('new', 'in_progress', 'waiting_parts', 'done', 'cancelled')),
	CONSTRAINT "work_order_severity_check" CHECK ("work_order"."severity" IN ('high', 'medium', 'low')),
	CONSTRAINT "work_order_category_check" CHECK ("work_order"."category" IN ('hot_water', 'power', 'leak', 'door_lock', 'wifi', 'broken_item', 'drain', 'other')),
	CONSTRAINT "work_order_source_check" CHECK ("work_order"."source" IN ('housekeeping', 'front_desk', 'maintenance', 'guest_app', 'system')),
	CONSTRAINT "work_order_title_check" CHECK (char_length("work_order"."title") BETWEEN 1 AND 120),
	CONSTRAINT "work_order_description_check" CHECK (char_length("work_order"."description") BETWEEN 1 AND 2000),
	CONSTRAINT "work_order_result_note_check" CHECK ("work_order"."status" <> 'done' OR ("work_order"."result_note" IS NOT NULL AND char_length(btrim("work_order"."result_note")) >= 3)),
	CONSTRAINT "work_order_cancel_reason_check" CHECK ("work_order"."status" <> 'cancelled' OR ("work_order"."cancel_reason" IS NOT NULL AND char_length(btrim("work_order"."cancel_reason")) >= 3)),
	CONSTRAINT "work_order_photos_check" CHECK (cardinality("work_order"."photo_attachment_ids") <= 4 AND cardinality("work_order"."done_photo_attachment_ids") <= 8)
);
--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_inspected_by_fk" FOREIGN KEY ("organization_id","inspected_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_redo_task_fk" FOREIGN KEY ("property_id","redo_task_id") REFERENCES "public"."hk_task"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_checklist" ADD CONSTRAINT "inspection_checklist_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_room_fk" FOREIGN KEY ("property_id","room_id") REFERENCES "public"."room"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_reported_by_fk" FOREIGN KEY ("organization_id","reported_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_assignee_fk" FOREIGN KEY ("organization_id","assignee_user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_room_idx" ON "inspection" USING btree ("room_id","inspected_at");--> statement-breakpoint
CREATE INDEX "work_order_status_idx" ON "work_order" USING btree ("property_id","status");--> statement-breakpoint
CREATE INDEX "work_order_room_idx" ON "work_order" USING btree ("room_id","created_at");
--> statement-breakpoint

-- ───────────── room_block.work_order_id → work_order (0013 left the column without FK: "added by the maintenance module") ─────────────
ALTER TABLE "room_block" ADD CONSTRAINT "room_block_work_order_fk" FOREIGN KEY ("property_id","work_order_id") REFERENCES "public"."work_order"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ───────────── RLS (erd 2.3): every new table is property-level ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['work_order', 'inspection', 'inspection_checklist'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- ───────────── Grants: business rows never DELETEd (erd 1); an inspection is a record (append-only) ─────────────
GRANT SELECT, INSERT, UPDATE ON work_order TO ottimo_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON inspection TO ottimo_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON inspection_checklist TO ottimo_app;
--> statement-breakpoint

-- ───────────── Catalogue (erd 9.3, BR-809, DOM D-15, OpenAPI 0.3.7 B-10): severities that need an after-repair photo ─────────────
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('wo_done_photo_required_severities', 'json', '{owner,manager}', 'BR-809', false, NULL, '["high","medium"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
