-- 0053 (hand-written – ARC s3-contract 4.2/4.2a; BE-C Sprint 3, step "Phản hồi & sửa"):
-- SEC FB-R2-SEC-BE-32/38/46/49/51, ARC FB-R2-ARC-BE-S3-17/22/27, SEC ĐK-2 17/10 (consent retention days),
-- DOM S3-5 (portal formats). Schema: src/db/schema/{crypto,files,registration,guest-portal}.ts; head snapshot
-- meta/0053_snapshot.json (4.2a-2b).
CREATE TABLE "blob_pending_delete" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blob_pending_delete_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"blob_key" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"policy_key" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_purge_reason_check";--> statement-breakpoint
ALTER TABLE "document_image" DROP CONSTRAINT "document_image_delete_reason_check";--> statement-breakpoint
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_data_key_fk";--> statement-breakpoint
ALTER TABLE "document_image" DROP CONSTRAINT "document_image_data_key_fk";--> statement-breakpoint
ALTER TABLE "guest_document" DROP CONSTRAINT "guest_document_data_key_fk";--> statement-breakpoint
ALTER TABLE "guest_session" DROP CONSTRAINT "guest_session_token_fk";--> statement-breakpoint
DROP INDEX "attachment_purge_idx";--> statement-breakpoint
ALTER TABLE "consent_record" ADD COLUMN "retention_days" smallint;--> statement-breakpoint
ALTER TABLE "registration" ADD COLUMN "stay_ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blob_pending_delete" ADD CONSTRAINT "blob_pending_delete_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blob_pending_delete_property_idx" ON "blob_pending_delete" USING btree ("property_id","id");--> statement-breakpoint
ALTER TABLE "data_key" ADD CONSTRAINT "data_key_property_id_key" UNIQUE("property_id","id");--> statement-breakpoint
ALTER TABLE "guest_access_token" ADD CONSTRAINT "guest_access_token_property_id_key" UNIQUE("property_id","id");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_data_key_fk" FOREIGN KEY ("property_id","data_key_id") REFERENCES "public"."data_key"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_image" ADD CONSTRAINT "document_image_data_key_fk" FOREIGN KEY ("property_id","data_key_id") REFERENCES "public"."data_key"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_document" ADD CONSTRAINT "guest_document_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_document" ADD CONSTRAINT "guest_document_party_member_fk" FOREIGN KEY ("property_id","party_member_id") REFERENCES "public"."reservation_guest"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_document" ADD CONSTRAINT "guest_document_data_key_fk" FOREIGN KEY ("property_id","data_key_id") REFERENCES "public"."data_key"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_session" ADD CONSTRAINT "guest_session_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_session" ADD CONSTRAINT "guest_session_token_fk" FOREIGN KEY ("property_id","token_id") REFERENCES "public"."guest_access_token"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachment_retention_idx" ON "attachment" USING btree ("property_id","retention_anchor_at") WHERE "attachment"."purged_at" IS NULL;--> statement-breakpoint
CREATE INDEX "attachment_unbound_idx" ON "attachment" USING btree ("property_id","uploaded_at") WHERE "attachment"."purged_at" IS NULL AND "attachment"."bound_ref_id" IS NULL;--> statement-breakpoint
CREATE INDEX "document_image_registration_idx" ON "document_image" USING btree ("registration_id");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_purge_reason_check" CHECK ("attachment"."purge_reason" IS NULL OR "attachment"."purge_reason" IN ('retention', 'manual', 'unbound'));--> statement-breakpoint
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_retention_days_check" CHECK ("consent_record"."retention_days" IS NULL OR "consent_record"."retention_days" BETWEEN 1 AND 365);--> statement-breakpoint
ALTER TABLE "document_image" ADD CONSTRAINT "document_image_delete_reason_check" CHECK ("document_image"."delete_reason" IS NULL OR "document_image"."delete_reason" IN ('retention', 'no_consent', 'consent_withdrawn', 'guest_request', 'void', 'replaced', 'party_removed', 'unconfirmed'));--> statement-breakpoint

-- ───────────── RLS + grants of the new queue (property-level, erd 2.3) ─────────────
ALTER TABLE blob_pending_delete ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE blob_pending_delete FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON blob_pending_delete USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
-- Technical queue: a row disappears once its file is deleted (the purge itself is in purge_journal).
GRANT SELECT, INSERT, DELETE ON blob_pending_delete TO ottimo_app;
--> statement-breakpoint
GRANT USAGE ON SEQUENCE blob_pending_delete_id_seq TO ottimo_app;
--> statement-breakpoint

-- ───────────── Least privilege on the C3 rows (SEC BE-51 (4), ARC S3-22) ─────────────
-- document_image: only the deletion columns move; blob_key / data_key_id / metadata are immutable.
REVOKE UPDATE ON document_image FROM ottimo_app;
--> statement-breakpoint
GRANT UPDATE (delete_after, deleted_at, delete_reason) ON document_image TO ottimo_app;
--> statement-breakpoint
-- guest_document: everything the desk may correct, never the DEK reference or the registration links.
REVOKE UPDATE ON guest_document FROM ottimo_app;
--> statement-breakpoint
GRANT UPDATE (party_member_id, doc_type, is_main, is_foreigner, is_minor_data, full_name_on_doc,
  nationality_code, gender, doc_number_enc, doc_number_last4, doc_number_hmac, date_of_birth_enc,
  passport_issue_date_enc, passport_expiry_date_enc, issuing_place_enc, visa_kind_enc, visa_number_enc,
  visa_valid_until_enc, entry_date_enc, entry_port_enc, entry_purpose_enc, no_entry_record_enc, address_enc,
  check_results, visa_alert_on, fields_purge_after, purged_at, removed_at, updated_at)
  ON guest_document TO ottimo_app;
--> statement-breakpoint
-- No "un-delete": a destroyed DEK, a deleted image, a purged or removed document stays so (crypto-shredding
-- must be irreversible, also against an application bug).
CREATE FUNCTION c3_no_resurrection() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'data_key' THEN
    IF OLD.destroyed_at IS NOT NULL AND (NEW.destroyed_at IS NULL OR NEW.wrapped_key IS NOT NULL) THEN
      RAISE EXCEPTION 'data_key % is destroyed', OLD.id USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'document_image' THEN
    IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      RAISE EXCEPTION 'document_image % is deleted', OLD.id USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'guest_document' THEN
    IF (OLD.purged_at IS NOT NULL AND NEW.purged_at IS NULL)
       OR (OLD.removed_at IS NOT NULL AND NEW.removed_at IS NULL) THEN
      RAISE EXCEPTION 'guest_document % is purged/removed', OLD.id USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER data_key_no_resurrection BEFORE UPDATE ON data_key
  FOR EACH ROW EXECUTE FUNCTION c3_no_resurrection();
--> statement-breakpoint
CREATE TRIGGER document_image_no_resurrection BEFORE UPDATE ON document_image
  FOR EACH ROW EXECUTE FUNCTION c3_no_resurrection();
--> statement-breakpoint
CREATE TRIGGER guest_document_no_resurrection BEFORE UPDATE ON guest_document
  FOR EACH ROW EXECUTE FUNCTION c3_no_resurrection();
--> statement-breakpoint

-- ───────────── Parameters ─────────────
-- SR-RET-02 / BR-609: the safety-net ceiling of the immediate purge is 24 h, not 72 (SEC BE-49).
UPDATE config_parameter_def SET bounds = '{"min":1,"max":24}'::jsonb WHERE key = 'id_image_purge_max_hours';
--> statement-breakpoint
-- SEC BE-32: images of a declaration that never reached `confirmed` – at most N days after the stay ended
-- (SR-RET-02 "tối đa 7 ngày"). SEC BE-38: an uploaded attachment never bound to a record – N days.
-- DOM S3-5 [GIẢ ĐỊNH – chờ INV, ESC-018]: date and nationality format of the portal data (one implementation,
-- ARC FB-S3-20).
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('id_image_unconfirmed_max_days', 'int', '{owner}', 'SR-RET-02', false, '{"min":1,"max":7}'::jsonb, '7'::jsonb),
  ('attachment_unbound_days', 'int', '{owner}', 'SEC-I5', false, '{"min":1,"max":7}'::jsonb, '7'::jsonb),
  ('portal_date_format', 'text', '{owner,manager}', 'BR-606', false, '{"allowed":["dd/MM/yyyy","yyyy-MM-dd"]}'::jsonb, '"dd/MM/yyyy"'::jsonb),
  ('portal_nationality_format', 'text', '{owner,manager}', 'BR-606', false, '{"allowed":["name_vi_alpha3","alpha3"]}'::jsonb, '"name_vi_alpha3"'::jsonb)
ON CONFLICT (key) DO NOTHING;
