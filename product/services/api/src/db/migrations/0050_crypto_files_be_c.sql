-- 0050 (hand-written – ARC s3-contract 4.2; BE-C Sprint 3): crypto (ADR-013) + files (B-01).
-- data_key, purge_journal, retention_run, attachment; RLS + grants; retention/notice parameters (SEC I5,
-- E06-06). Runs as ottimo_owner (SET ROLE by src/db/migrate.ts). Schema: src/db/schema/{crypto,files}.ts.
CREATE TABLE "data_key" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"wrapped_key" "bytea",
	"kek_version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"destroyed_at" timestamp with time zone,
	CONSTRAINT "data_key_purpose_check" CHECK ("data_key"."purpose" IN ('guest_document', 'document_image', 'door_credential', 'payee', 'child_data', 'mfa_secret', 'refund_account', 'push_keys', 'attachment')),
	CONSTRAINT "data_key_destroyed_check" CHECK (("data_key"."destroyed_at" IS NULL) = ("data_key"."wrapped_key" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "purge_journal" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "purge_journal_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"policy_key" text NOT NULL,
	"action" text NOT NULL,
	"purged_at" timestamp with time zone NOT NULL,
	CONSTRAINT "purge_journal_action_check" CHECK ("purge_journal"."action" IN ('destroy_dek', 'delete_blob', 'null_columns', 'anonymize'))
);
--> statement-breakpoint
CREATE TABLE "retention_run" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"policy_key" text NOT NULL,
	"items_count" integer NOT NULL,
	"status" text NOT NULL,
	"error" text,
	CONSTRAINT "retention_run_status_check" CHECK ("retention_run"."status" IN ('done', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"reservation_id" uuid,
	"bound_ref_type" text,
	"bound_ref_id" uuid,
	"blob_key" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"ciphertext_sha256" text NOT NULL,
	"data_key_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_by_role" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"retention_anchor_at" timestamp with time zone,
	"purge_after" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"purge_reason" text,
	CONSTRAINT "attachment_purpose_check" CHECK ("attachment"."purpose" IN ('work_order', 'inspection', 'penalty_evidence', 'deposit_receipt', 'meter', 'refund_proof')),
	CONSTRAINT "attachment_reservation_check" CHECK ("attachment"."purpose" NOT IN ('deposit_receipt', 'penalty_evidence') OR "attachment"."reservation_id" IS NOT NULL),
	CONSTRAINT "attachment_mime_check" CHECK ("attachment"."mime" IN ('image/jpeg', 'image/webp')),
	CONSTRAINT "attachment_purge_reason_check" CHECK ("attachment"."purge_reason" IS NULL OR "attachment"."purge_reason" IN ('retention', 'manual'))
);
--> statement-breakpoint
ALTER TABLE "data_key" ADD CONSTRAINT "data_key_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purge_journal" ADD CONSTRAINT "purge_journal_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retention_run" ADD CONSTRAINT "retention_run_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_data_key_fk" FOREIGN KEY ("data_key_id") REFERENCES "public"."data_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_key_subject_idx" ON "data_key" USING btree ("property_id","subject_id");--> statement-breakpoint
CREATE INDEX "data_key_kek_version_idx" ON "data_key" USING btree ("kek_version") WHERE "data_key"."destroyed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "purge_journal_property_purged_idx" ON "purge_journal" USING btree ("property_id","purged_at");--> statement-breakpoint
CREATE INDEX "retention_run_property_run_idx" ON "retention_run" USING btree ("property_id","policy_key","run_at");--> statement-breakpoint
CREATE INDEX "attachment_uploader_idx" ON "attachment" USING btree ("property_id","uploaded_by","uploaded_at");--> statement-breakpoint
CREATE INDEX "attachment_reservation_idx" ON "attachment" USING btree ("property_id","reservation_id");--> statement-breakpoint
CREATE INDEX "attachment_purge_idx" ON "attachment" USING btree ("property_id","purge_after") WHERE "attachment"."purged_at" IS NULL;--> statement-breakpoint

-- ───────────── RLS (erd 2.3): every table is property-level ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['data_key', 'purge_journal', 'retention_run', 'attachment'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- data_key: rows are never deleted; only wrapped_key/kek_version (re-wrap on KEK rotation) and destroyed_at
-- (crypto-shredding) change. Only CryptoService touches it (SR-KEY-02).
GRANT SELECT, INSERT ON data_key TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (wrapped_key, kek_version, destroyed_at) ON data_key TO ottimo_app;
--> statement-breakpoint
-- Append-only journals (SR-RET-03): INSERT + SELECT only.
GRANT SELECT, INSERT ON purge_journal, retention_run TO ottimo_app;
--> statement-breakpoint
GRANT USAGE ON SEQUENCE purge_journal_id_seq TO ottimo_app;
--> statement-breakpoint
-- attachment: metadata immutable except binding, retention anchor and purge.
GRANT SELECT, INSERT ON attachment TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (bound_ref_type, bound_ref_id, retention_anchor_at, purge_after, purged_at, purge_reason)
  ON attachment TO ottimo_app;
--> statement-breakpoint

-- ───────────── Parameters (erd 9, SEC I5; E06-06 notice version) ─────────────
-- Retention of operational attachments (OWN edits, bounds by SEC I5; defaults until ESC-001 sub-question).
-- privacy_notice_version: the data-processing notice currently shown (guest-web step 0, Desk consent) –
-- noticeAccepted is true only for this version (E06-06, R-CON-02).
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('deposit_receipt_retention_days', 'int', '{owner}', 'SEC-I5', false, '{"min":30,"max":365}'::jsonb, '90'::jsonb),
  ('attachment_ops_retention_months', 'int', '{owner}', 'SEC-I5', false, '{"min":3,"max":24}'::jsonb, '12'::jsonb),
  ('privacy_notice_version', 'text', '{owner}', 'R-CON-02', false, NULL, '"privacy-2026-10-v1"'::jsonb)
ON CONFLICT (key) DO NOTHING;
