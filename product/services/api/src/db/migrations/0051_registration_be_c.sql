-- 0051 (hand-written – ARC s3-contract 4.2; BE-C Sprint 3): registration (erd 4.7, SM-05, EP06 v0.2).
-- registration, registration_portal_submission, guest_document (C3 columns *_enc under the row DEK),
-- document_image (blob per image, own DEK), consent_record (append-only, R-CON-02); RLS + grants.
-- guest_document.party_member_id: FK to the party table is added once BE-A's table is on main (rule 6).
CREATE TABLE "registration" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"status" text DEFAULT 'none' NOT NULL,
	"kind" text,
	"required_count" smallint NOT NULL,
	"submitted_count" smallint DEFAULT 0 NOT NULL,
	"pre_submitted_at" timestamp with time zone,
	"actual_checkin_at" timestamp with time zone,
	"actual_checkout_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"deadline_basis" text,
	"sent_at" timestamp with time zone,
	"sent_by" uuid,
	"portal_reference" text,
	"confirmed_at" timestamp with time zone,
	"rejected_reason" text,
	"needs_update_reason" text,
	"updated_at_portal" timestamp with time zone,
	"actual_departure_date" date,
	"image_retention_until" timestamp with time zone,
	"legal_hold" boolean DEFAULT false NOT NULL,
	"blocks_door_code" boolean DEFAULT false NOT NULL,
	"images_purge_scheduled_at" timestamp with time zone,
	"images_purged_at" timestamp with time zone,
	"images_purge_reason" text,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "registration_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "registration_reservation_key" UNIQUE("reservation_id"),
	CONSTRAINT "registration_status_check" CHECK ("registration"."status" IN ('none', 'pre', 'partial', 'review', 'scanned', 'sent', 'confirmed', 'needs_update', 'updated', 'void')),
	CONSTRAINT "registration_kind_check" CHECK ("registration"."kind" IS NULL OR "registration"."kind" IN ('vn_citizen_stay', 'foreigner_temp_residence', 'mixed')),
	CONSTRAINT "registration_deadline_basis_check" CHECK ("registration"."deadline_basis" IS NULL OR "registration"."deadline_basis" IN ('vn_2300', 'vn_0800_next', 'foreigner_hours', 'foreigner_earlier_of')),
	CONSTRAINT "registration_purge_reason_check" CHECK ("registration"."images_purge_reason" IS NULL OR "registration"."images_purge_reason" IN ('retention', 'no_consent', 'consent_withdrawn', 'guest_request', 'void')),
	CONSTRAINT "registration_counts_check" CHECK ("registration"."required_count" >= 0 AND "registration"."submitted_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "registration_portal_submission" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"reference" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"sent_by" uuid NOT NULL,
	CONSTRAINT "registration_portal_submission_kind_key" UNIQUE("registration_id","kind"),
	CONSTRAINT "registration_portal_submission_kind_check" CHECK ("registration_portal_submission"."kind" IN ('foreigner_temp_residence', 'vn_citizen_stay'))
);
--> statement-breakpoint
CREATE TABLE "guest_document" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"party_member_id" uuid,
	"person_index" smallint,
	"guest_id" uuid,
	"doc_type" text NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"is_foreigner" boolean DEFAULT false NOT NULL,
	"is_minor_data" boolean DEFAULT false NOT NULL,
	"full_name_on_doc" text,
	"nationality_code" text,
	"gender" text,
	"doc_number_enc" "bytea",
	"doc_number_last4" text,
	"doc_number_hmac" text,
	"date_of_birth_enc" "bytea",
	"passport_issue_date_enc" "bytea",
	"passport_expiry_date_enc" "bytea",
	"issuing_place_enc" "bytea",
	"visa_kind_enc" "bytea",
	"visa_number_enc" "bytea",
	"visa_valid_until_enc" "bytea",
	"entry_date_enc" "bytea",
	"entry_port_enc" "bytea",
	"entry_purpose_enc" "bytea",
	"no_entry_record_enc" "bytea",
	"address_enc" "bytea",
	"check_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visa_alert_on" date,
	"capture_method" text NOT NULL,
	"data_key_id" uuid NOT NULL,
	"fields_purge_after" timestamp with time zone,
	"purged_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "guest_document_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "guest_document_doc_type_check" CHECK ("guest_document"."doc_type" IN ('cccd', 'passport', 'child_personal_id', 'other')),
	CONSTRAINT "guest_document_capture_check" CHECK ("guest_document"."capture_method" IN ('qr_cccd', 'mrz', 'manual', 'guest_upload')),
	CONSTRAINT "guest_document_gender_check" CHECK ("guest_document"."gender" IS NULL OR "guest_document"."gender" IN ('male', 'female', 'other')),
	CONSTRAINT "guest_document_person_index_check" CHECK ("guest_document"."person_index" IS NULL OR "guest_document"."person_index" >= 1)
);
--> statement-breakpoint
CREATE TABLE "document_image" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"guest_document_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"blob_key" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"ciphertext_sha256" text NOT NULL,
	"data_key_id" uuid NOT NULL,
	"uploaded_via" text NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp with time zone NOT NULL,
	"delete_after" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"delete_reason" text,
	CONSTRAINT "document_image_via_check" CHECK ("document_image"."uploaded_via" IN ('desk', 'guest_app')),
	CONSTRAINT "document_image_mime_check" CHECK ("document_image"."mime" IN ('image/jpeg', 'image/webp')),
	CONSTRAINT "document_image_delete_reason_check" CHECK ("document_image"."delete_reason" IS NULL OR "document_image"."delete_reason" IN ('retention', 'no_consent', 'consent_withdrawn', 'guest_request', 'void', 'replaced', 'party_removed'))
);
--> statement-breakpoint
CREATE TABLE "consent_record" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"guest_document_id" uuid,
	"party_member_id" uuid,
	"person_index" smallint,
	"purpose" text NOT NULL,
	"decision" text NOT NULL,
	"notice_version" text NOT NULL,
	"locale" text NOT NULL,
	"channel" text NOT NULL,
	"recorded_by_type" text NOT NULL,
	"recorded_by" uuid,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "consent_record_purpose_check" CHECK ("consent_record"."purpose" IN ('P02B_ID_IMAGE_RETENTION', 'P05_CRM', 'P06_MARKETING', 'P07_REVIEW')),
	CONSTRAINT "consent_record_decision_check" CHECK ("consent_record"."decision" IN ('granted', 'refused')),
	CONSTRAINT "consent_record_channel_check" CHECK ("consent_record"."channel" IN ('guest_app', 'desk', 'paper')),
	CONSTRAINT "consent_record_locale_check" CHECK ("consent_record"."locale" IN ('vi', 'en', 'ru')),
	CONSTRAINT "consent_record_by_check" CHECK ("consent_record"."recorded_by_type" IN ('user', 'guest'))
);
--> statement-breakpoint
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_registration_fk" FOREIGN KEY ("property_id","registration_id") REFERENCES "public"."registration"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_image" ADD CONSTRAINT "document_image_document_fk" FOREIGN KEY ("property_id","guest_document_id") REFERENCES "public"."guest_document"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_image" ADD CONSTRAINT "document_image_data_key_fk" FOREIGN KEY ("data_key_id") REFERENCES "public"."data_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_document" ADD CONSTRAINT "guest_document_registration_fk" FOREIGN KEY ("property_id","registration_id") REFERENCES "public"."registration"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_document" ADD CONSTRAINT "guest_document_data_key_fk" FOREIGN KEY ("data_key_id") REFERENCES "public"."data_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_portal_submission" ADD CONSTRAINT "registration_portal_submission_registration_fk" FOREIGN KEY ("property_id","registration_id") REFERENCES "public"."registration"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_record_registration_idx" ON "consent_record" USING btree ("registration_id","recorded_at");--> statement-breakpoint
CREATE INDEX "document_image_document_idx" ON "document_image" USING btree ("guest_document_id");--> statement-breakpoint
CREATE INDEX "document_image_purge_idx" ON "document_image" USING btree ("property_id","delete_after") WHERE "document_image"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "guest_document_registration_idx" ON "guest_document" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "guest_document_visa_alert_idx" ON "guest_document" USING btree ("property_id","visa_alert_on") WHERE "guest_document"."visa_alert_on" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "registration_property_status_idx" ON "registration" USING btree ("property_id","status","deadline_at");--> statement-breakpoint

-- ───────────── RLS (erd 2.3): property-level ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['registration', 'registration_portal_submission', 'guest_document',
                           'document_image', 'consent_record'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- Business rows: never DELETE (erd 1). Purge = destroy DEK + NULL the *_enc columns (UPDATE).
GRANT SELECT, INSERT, UPDATE ON registration, registration_portal_submission, guest_document,
  document_image TO ottimo_app;
--> statement-breakpoint
-- Consent evidence is append-only (R-CON-02): a change of mind is a new row.
GRANT SELECT, INSERT ON consent_record TO ottimo_app;
