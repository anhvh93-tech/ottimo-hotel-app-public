-- 0000_foundation – drafted by `drizzle-kit generate`, edited by hand (erd 16): extensions, monthly
-- partitioning of the append-only logs (BE-ARC-18). RLS, grants and SECURITY DEFINER entry functions
-- are in 0001 (custom). Runs as ottimo_migrator after SET ROLE ottimo_owner (src/db/migrate.ts).
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "audit_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"property_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_type" text NOT NULL,
	"actor_user_id" uuid,
	"category" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"request_id" text,
	"ip_hmac" text,
	"session_id" text,
	"trusted_device_id" uuid,
	CONSTRAINT "audit_event_pkey" PRIMARY KEY("id","occurred_at"),
	CONSTRAINT "audit_event_actor_type_check" CHECK ("audit_event"."actor_type" IN ('user', 'guest', 'system')),
	CONSTRAINT "audit_event_category_check" CHECK ("audit_event"."category" IN ('money', 'state', 'config', 'access', 'security', 'data'))
) PARTITION BY RANGE ("occurred_at");
--> statement-breakpoint
CREATE TABLE "c3_access_log" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "c3_access_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_type" text NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"trusted_device_id" uuid,
	"ip_hmac" text,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"reservation_id" uuid,
	"action" text NOT NULL,
	"reason_code" text,
	"request_id" text,
	CONSTRAINT "c3_access_log_pkey" PRIMARY KEY("id","occurred_at"),
	CONSTRAINT "c3_access_log_actor_type_check" CHECK ("c3_access_log"."actor_type" IN ('user', 'guest', 'system')),
	CONSTRAINT "c3_access_log_subject_type_check" CHECK ("c3_access_log"."subject_type" IN ('guest_document', 'document_image', 'door_credential', 'payee_account', 'portal_data', 'mfa_secret')),
	CONSTRAINT "c3_access_log_action_check" CHECK ("c3_access_log"."action" IN ('view', 'create', 'update', 'copy', 'delete', 'purge'))
) PARTITION BY RANGE ("occurred_at");
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"username" "citext" NOT NULL,
	"email" "citext",
	"display_name" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"password_changed_at" timestamp with time zone,
	"approval_pin_hash" text,
	"approval_pin_failed_count" integer DEFAULT 0 NOT NULL,
	"approval_pin_locked_until" timestamp with time zone,
	"roles_version" integer DEFAULT 1 NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret_enc" "bytea",
	"mfa_recovery_codes_hash" text[],
	"status" text DEFAULT 'active' NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"lock_count_24h" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "app_user_username_unique" UNIQUE("username"),
	CONSTRAINT "app_user_org_id_key" UNIQUE("organization_id","id"),
	CONSTRAINT "app_user_status_check" CHECK ("app_user"."status" IN ('active', 'locked', 'disabled'))
);
--> statement-breakpoint
CREATE TABLE "trusted_device" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text NOT NULL,
	"device_kind" text NOT NULL,
	"token_hash" text NOT NULL,
	"hardening_checklist_version" text,
	"checklist_confirmed_by" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"revoke_reason" text,
	CONSTRAINT "trusted_device_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "trusted_device_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "trusted_device_kind_check" CHECK ("trusted_device"."device_kind" IN ('desk', 'facility_mobile')),
	CONSTRAINT "trusted_device_mobile_max_30d" CHECK ("trusted_device"."device_kind" <> 'facility_mobile' OR "trusted_device"."expires_at" <= "trusted_device"."created_at" + interval '30 days')
);
--> statement-breakpoint
CREATE TABLE "user_property_role" (
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "user_property_role_pkey" PRIMARY KEY("user_id","property_id","role"),
	CONSTRAINT "user_property_role_role_check" CHECK ("user_property_role"."role" IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'housekeeping', 'maintenance', 'sales_staff', 'collaborator'))
);
--> statement-breakpoint
CREATE TABLE "user_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"active_property_id" uuid,
	"client_origin" text NOT NULL,
	"trusted_device_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"ip_hmac" text,
	"user_agent" text,
	"stepup_until" timestamp with time zone,
	CONSTRAINT "user_session_origin_check" CHECK ("user_session"."client_origin" IN ('admin', 'staff_pwa')),
	CONSTRAINT "user_session_revoked_reason_check" CHECK ("user_session"."revoked_reason" IS NULL OR "user_session"."revoked_reason" IN ('logout', 'role_changed', 'disabled', 'password_reset', 'password_changed', 'mfa_disabled', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "idempotency_key" (
	"principal_type" text NOT NULL,
	"principal_id" uuid NOT NULL,
	"key" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"request_hash" text NOT NULL,
	"state" text NOT NULL,
	"response_status" smallint,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_key_pkey" PRIMARY KEY("principal_type","principal_id","key"),
	CONSTRAINT "idempotency_key_principal_type_check" CHECK ("idempotency_key"."principal_type" IN ('user', 'guest_session')),
	CONSTRAINT "idempotency_key_state_check" CHECK ("idempotency_key"."state" IN ('in_progress', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "inbox_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid,
	"provider" text NOT NULL,
	"external_event_id" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signature_valid" boolean NOT NULL,
	"filtered_payload" jsonb,
	"card_fields_dropped" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	CONSTRAINT "inbox_message_provider_event_key" UNIQUE("provider","external_event_id"),
	CONSTRAINT "inbox_message_status_check" CHECK ("inbox_message"."status" IN ('received', 'processed', 'ignored', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "job_run" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"job_key" text NOT NULL,
	"business_date" date NOT NULL,
	"slot" text NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"stats" jsonb,
	CONSTRAINT "job_run_slot_key" UNIQUE("job_key","property_id","business_date","slot"),
	CONSTRAINT "job_run_status_check" CHECK ("job_run"."status" IN ('done', 'skipped_catchup'))
);
--> statement-breakpoint
CREATE TABLE "outbox_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid,
	"topic" text NOT NULL,
	"payload" jsonb NOT NULL,
	"dedupe_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispatched_at" timestamp with time zone,
	CONSTRAINT "outbox_message_dedupe_key_unique" UNIQUE("dedupe_key"),
	CONSTRAINT "outbox_message_status_check" CHECK ("outbox_message"."status" IN ('pending', 'in_flight', 'done', 'failed', 'dead'))
);
--> statement-breakpoint
CREATE TABLE "config_parameter" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"effective_from" date NOT NULL,
	"status_label" text,
	"reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "config_parameter_property_key_from_key" UNIQUE("property_id","key","effective_from"),
	CONSTRAINT "config_parameter_status_label_check" CHECK ("config_parameter"."status_label" IS NULL OR "config_parameter"."status_label" ~ '^[A-Z0-9-]{1,16}(\+[A-Z0-9-]{1,16}){0,3}$')
);
--> statement-breakpoint
CREATE TABLE "config_parameter_def" (
	"key" text PRIMARY KEY NOT NULL,
	"value_schema" text NOT NULL,
	"edit_roles" text[] NOT NULL,
	"br_ref" text,
	"snapshot_into" text,
	"is_security" boolean DEFAULT false NOT NULL,
	"bounds" jsonb,
	"default_value" jsonb,
	CONSTRAINT "config_parameter_def_edit_roles_check" CHECK ("config_parameter_def"."edit_roles" <@ ARRAY['owner', 'manager']::text[] AND cardinality("config_parameter_def"."edit_roles") > 0),
	CONSTRAINT "config_parameter_def_security_owner_only" CHECK (NOT "config_parameter_def"."is_security" OR "config_parameter_def"."edit_roles" = ARRAY['owner']::text[])
);
--> statement-breakpoint
CREATE TABLE "dev_clock" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"offset_ms" bigint DEFAULT 0 NOT NULL,
	"frozen_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "dev_clock_single_row" CHECK ("dev_clock"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "doc_sequence" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid,
	"doc_type" text NOT NULL,
	"period_key" text NOT NULL,
	"prefix" text NOT NULL,
	"pad_width" smallint NOT NULL,
	"next_value" bigint NOT NULL,
	CONSTRAINT "doc_sequence_next_value_check" CHECK ("doc_sequence"."next_value" >= 1),
	CONSTRAINT "doc_sequence_pad_width_check" CHECK ("doc_sequence"."pad_width" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "organization_code_unique" UNIQUE("code"),
	CONSTRAINT "organization_status_check" CHECK ("organization"."status" IN ('active', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "property" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"map_url" text,
	"phone_public" text,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"currency" char(3) DEFAULT 'VND' NOT NULL,
	"month_close_day" smallint,
	"house_rules_i18n" jsonb,
	"wifi_info_i18n" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "property_org_code_key" UNIQUE("organization_id","code"),
	CONSTRAINT "property_org_id_key" UNIQUE("organization_id","id"),
	CONSTRAINT "property_status_check" CHECK ("property"."status" IN ('active', 'inactive')),
	CONSTRAINT "property_currency_check" CHECK ("property"."currency" = 'VND'),
	CONSTRAINT "property_month_close_day_check" CHECK ("property"."month_close_day" BETWEEN 1 AND 28)
);
--> statement-breakpoint
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_device" ADD CONSTRAINT "trusted_device_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_property_role" ADD CONSTRAINT "user_property_role_user_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_property_role" ADD CONSTRAINT "user_property_role_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_trusted_device_id_trusted_device_id_fk" FOREIGN KEY ("trusted_device_id") REFERENCES "public"."trusted_device"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_property_fk" FOREIGN KEY ("organization_id","active_property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_key" ADD CONSTRAINT "idempotency_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_message" ADD CONSTRAINT "inbox_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_message" ADD CONSTRAINT "inbox_message_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_run" ADD CONSTRAINT "job_run_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_message" ADD CONSTRAINT "outbox_message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_message" ADD CONSTRAINT "outbox_message_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_parameter" ADD CONSTRAINT "config_parameter_key_config_parameter_def_key_fk" FOREIGN KEY ("key") REFERENCES "public"."config_parameter_def"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_parameter" ADD CONSTRAINT "config_parameter_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_sequence" ADD CONSTRAINT "doc_sequence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_sequence" ADD CONSTRAINT "doc_sequence_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_event_property_category_idx" ON "audit_event" USING btree ("property_id","category","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_event_entity_idx" ON "audit_event" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "c3_access_log_property_occurred_idx" ON "c3_access_log" USING btree ("property_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "c3_access_log_subject_idx" ON "c3_access_log" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "user_property_role_property_idx" ON "user_property_role" USING btree ("property_id","role");--> statement-breakpoint
CREATE INDEX "user_session_user_idx" ON "user_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_session_expires_idx" ON "user_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idempotency_key_created_idx" ON "idempotency_key" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_run_property_run_at_idx" ON "job_run" USING btree ("property_id","run_at");--> statement-breakpoint
CREATE INDEX "outbox_message_pending_idx" ON "outbox_message" USING btree ("status","next_attempt_at") WHERE "outbox_message"."status" IN ('pending', 'failed');--> statement-breakpoint
CREATE UNIQUE INDEX "doc_sequence_property_uk" ON "doc_sequence" USING btree ("property_id","doc_type","period_key") WHERE "doc_sequence"."property_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "doc_sequence_org_uk" ON "doc_sequence" USING btree ("organization_id","doc_type","period_key") WHERE "doc_sequence"."property_id" IS NULL;
