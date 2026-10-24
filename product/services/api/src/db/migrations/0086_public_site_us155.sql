-- 0086 (BE-D, R3 – US-155 into v1.0 per INV 24/10, decision-log). Number per ORC 24/10: main has up to 0084, BE-B
-- 0085 merged 24/10 (5b282db) → this file is 0086, journal and snapshot chained after 0085 (`when` = 0085 + 2 s).
-- Replaces the old branch's `0079_public_site_t13` (rounds/round-03/outputs/BE/s1-be-d-us155.md): the T13
-- part is already on main as 0083 and is NOT repeated here.
-- Drafted by drizzle-kit from the .ts schema (head snapshot 0086), hand-completed below (cross-module FKs, RLS,
-- entry function, catalogue).
-- US-155 Desk + public form (R3-Q06, erd 4.14, OpenAPI 0.3.7 bổ sung 2 / 0.3.8): module `public-site` –
--   `website_booking_request`, `privacy_notice_version`, `public_form_nonce`, `rate_limit_counter`; entry function
--   `public_resolve_property(slug)`; `quote.website_booking_request_id`, `reservation.direct_sub_source`;
--   `idempotency_key.principal_type` + `public_site`; staff inbox kinds `website_request_*`, `public_booking_toggled`
--   + refType `website_booking_request` (kind CHECK = the set on main incl. 0082 `foc_stay_total_exceeded` + the 5
--   new kinds – add only, ARC S1-09; test/integration/public-site-r3-bed.test.ts compares the sets);
--   `purge_journal.action` + `delete_row` (spam rows deleted whole after retention.web_request_spam_days – the
--   restore runbook deletes the row again; erd 4.14 / SR-BAK-06); catalogue keys (9 security keys enabled in OpenAPI
--   setParameter.x-security-parameters in the same change – architecture.test.ts compares both – and the
--   BR-912/914 v0.3.8 business keys). The public form stays OFF: `public_booking_requests_enabled` = false.
-- NOTE for the merge: BE-A's US-164 migration also rewrites `staff_notification_kind_check` (manager_confirmation_*)
-- – the later of the two must carry the union of both lists.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
CREATE TABLE "privacy_notice_version" (
	"organization_id" uuid NOT NULL,
	"version" text NOT NULL,
	"locale" text NOT NULL,
	"body_sha256" text NOT NULL,
	"url_path" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"superseded_at" timestamp with time zone,
	CONSTRAINT "privacy_notice_version_pkey" PRIMARY KEY("organization_id","version","locale"),
	CONSTRAINT "privacy_notice_version_locale_check" CHECK ("privacy_notice_version"."locale" IN ('vi', 'en', 'ru')),
	CONSTRAINT "privacy_notice_version_version_check" CHECK ("privacy_notice_version"."version" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[0-9]{1,2})?$'),
	CONSTRAINT "privacy_notice_version_sha_check" CHECK ("privacy_notice_version"."body_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "public_form_nonce" (
	"nonce_hash" "bytea" PRIMARY KEY NOT NULL,
	"property_id" uuid NOT NULL,
	"used_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_counter" (
	"bucket_key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_counter_pkey" PRIMARY KEY("bucket_key","window_start"),
	CONSTRAINT "rate_limit_counter_key_check" CHECK (char_length("rate_limit_counter"."bucket_key") <= 200)
);
--> statement-breakpoint
CREATE TABLE "website_booking_request" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"ref_code" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"arrival_date" date NOT NULL,
	"departure_date" date,
	"stay_kind" text NOT NULL,
	"stay_months" smallint,
	"adults" smallint NOT NULL,
	"children" smallint DEFAULT 0 NOT NULL,
	"infants" smallint DEFAULT 0 NOT NULL,
	"room_type_slug" text,
	"locale" text NOT NULL,
	"preferred_channel" text NOT NULL,
	"guest_name" text,
	"phone_e164" text,
	"email" text,
	"note" text,
	"contact_hmac" text,
	"alias_ref_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"related_request_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"consent_version" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"ref_host" text,
	"landing_path" text,
	"sub_source" text,
	"suspicious_flags" text[] DEFAULT '{}'::text[] NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"last_duplicate_at" timestamp with time zone,
	"ip_hmac" "bytea",
	"reply_by" timestamp with time zone NOT NULL,
	"overdue_notified_at" timestamp with time zone,
	"assigned_user_id" uuid,
	"claimed_at" timestamp with time zone,
	"decline_reason_code" text,
	"decline_note" text,
	"quote_id" uuid,
	"reservation_id" uuid,
	"converted_at" timestamp with time zone,
	"converted_by" uuid,
	"offer_snapshot" jsonb,
	"last_activity_at" timestamp with time zone NOT NULL,
	"pii_purged_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "website_booking_request_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "website_booking_request_ref_code_key" UNIQUE("property_id","ref_code"),
	CONSTRAINT "website_booking_request_status_check" CHECK ("website_booking_request"."status" IN ('new', 'in_progress', 'converted', 'declined', 'spam')),
	CONSTRAINT "website_booking_request_ref_code_check" CHECK ("website_booking_request"."ref_code" ~ '^[0-9A-HJKMNP-TV-Z]{8}$'),
	CONSTRAINT "website_booking_request_stay_kind_check" CHECK ("website_booking_request"."stay_kind" IN ('short', 'long')),
	CONSTRAINT "website_booking_request_months_check" CHECK ("website_booking_request"."stay_months" IS NULL OR ("website_booking_request"."stay_kind" = 'long' AND "website_booking_request"."stay_months" BETWEEN 1 AND 24)),
	CONSTRAINT "website_booking_request_departure_check" CHECK (("website_booking_request"."departure_date" IS NULL AND "website_booking_request"."stay_kind" = 'long') OR ("website_booking_request"."departure_date" > "website_booking_request"."arrival_date" AND "website_booking_request"."departure_date" <= "website_booking_request"."arrival_date" + 366)),
	CONSTRAINT "website_booking_request_party_check" CHECK ("website_booking_request"."adults" BETWEEN 1 AND 12 AND "website_booking_request"."children" BETWEEN 0 AND 8 AND "website_booking_request"."infants" BETWEEN 0 AND 8),
	CONSTRAINT "website_booking_request_locale_check" CHECK ("website_booking_request"."locale" IN ('vi', 'en', 'ru')),
	CONSTRAINT "website_booking_request_channel_check" CHECK ("website_booking_request"."preferred_channel" IN ('zalo', 'whatsapp', 'telegram', 'viber', 'phone', 'email')),
	CONSTRAINT "website_booking_request_sub_source_check" CHECK ("website_booking_request"."sub_source" IS NULL OR "website_booking_request"."sub_source" IN ('facebook', 'instagram', 'google', 'zalo', 'qr', 'other')),
	CONSTRAINT "website_booking_request_text_check" CHECK (("website_booking_request"."guest_name" IS NULL OR char_length("website_booking_request"."guest_name") <= 80) AND ("website_booking_request"."note" IS NULL OR char_length("website_booking_request"."note") <= 500) AND ("website_booking_request"."decline_note" IS NULL OR char_length("website_booking_request"."decline_note") <= 300)),
	CONSTRAINT "website_booking_request_contact_check" CHECK ("website_booking_request"."pii_purged_at" IS NOT NULL OR ("website_booking_request"."guest_name" IS NOT NULL AND ("website_booking_request"."phone_e164" IS NOT NULL) <> ("website_booking_request"."email" IS NOT NULL) AND "website_booking_request"."contact_hmac" IS NOT NULL)),
	CONSTRAINT "website_booking_request_assigned_check" CHECK ("website_booking_request"."status" <> 'in_progress' OR "website_booking_request"."assigned_user_id" IS NOT NULL),
	CONSTRAINT "website_booking_request_declined_check" CHECK ("website_booking_request"."status" <> 'declined' OR "website_booking_request"."decline_reason_code" IS NOT NULL),
	CONSTRAINT "website_booking_request_decline_reason_check" CHECK ("website_booking_request"."decline_reason_code" IS NULL OR "website_booking_request"."decline_reason_code" IN ('no_availability', 'price_not_accepted', 'guest_unreachable', 'guest_not_proceeding', 'duplicate', 'policy_mismatch', 'stale', 'erased_on_request', 'other')),
	CONSTRAINT "website_booking_request_converted_check" CHECK (("website_booking_request"."status" = 'converted') = ("website_booking_request"."reservation_id" IS NOT NULL)),
	CONSTRAINT "website_booking_request_alias_check" CHECK (cardinality("website_booking_request"."alias_ref_codes") <= 5)
);
--> statement-breakpoint
ALTER TABLE "idempotency_key" DROP CONSTRAINT "idempotency_key_principal_type_check";--> statement-breakpoint
ALTER TABLE "staff_notification" DROP CONSTRAINT "staff_notification_kind_check";--> statement-breakpoint
ALTER TABLE "staff_notification" DROP CONSTRAINT "staff_notification_ref_type_check";--> statement-breakpoint
ALTER TABLE "purge_journal" DROP CONSTRAINT "purge_journal_action_check";--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "website_booking_request_id" uuid;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "direct_sub_source" text;--> statement-breakpoint
ALTER TABLE "privacy_notice_version" ADD CONSTRAINT "privacy_notice_version_org_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_consent_fk" FOREIGN KEY ("organization_id","consent_version","locale") REFERENCES "public"."privacy_notice_version"("organization_id","version","locale") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_assigned_fk" FOREIGN KEY ("organization_id","assigned_user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_converted_by_fk" FOREIGN KEY ("organization_id","converted_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_form_nonce_expires_idx" ON "public_form_nonce" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "rate_limit_counter_expires_idx" ON "rate_limit_counter" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "website_booking_request_queue_idx" ON "website_booking_request" USING btree ("property_id","status","reply_by");--> statement-breakpoint
CREATE INDEX "website_booking_request_contact_idx" ON "website_booking_request" USING btree ("property_id","contact_hmac","created_at") WHERE "website_booking_request"."contact_hmac" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "website_booking_request_assigned_idx" ON "website_booking_request" USING btree ("property_id","assigned_user_id") WHERE "website_booking_request"."status" = 'in_progress';--> statement-breakpoint
ALTER TABLE "idempotency_key" ADD CONSTRAINT "idempotency_key_principal_type_check" CHECK ("idempotency_key"."principal_type" IN ('user', 'guest_session', 'public_site'));--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_direct_sub_source_check" CHECK ("reservation"."direct_sub_source" IS NULL OR ("reservation"."direct_source" = 'website' AND "reservation"."direct_sub_source" IN ('facebook', 'instagram', 'google', 'zalo', 'qr', 'other')));--> statement-breakpoint
ALTER TABLE "staff_notification" ADD CONSTRAINT "staff_notification_kind_check" CHECK ("staff_notification"."kind" IN ('hold_expired', 'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new', 'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection', 'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded', 'foc_stay_total_exceeded', 'website_request_new', 'website_request_cap_reached', 'website_request_overdue', 'website_request_linked_hold', 'public_booking_toggled'));--> statement-breakpoint
ALTER TABLE "staff_notification" ADD CONSTRAINT "staff_notification_ref_type_check" CHECK ("staff_notification"."ref_type" IS NULL OR "staff_notification"."ref_type" IN ('reservation', 'guest_request', 'work_order', 'approval_request', 'registration', 'user', 'payment', 'property', 'hk_task', 'website_booking_request'));--> statement-breakpoint
ALTER TABLE "purge_journal" ADD CONSTRAINT "purge_journal_action_check" CHECK ("purge_journal"."action" IN ('destroy_dek', 'delete_blob', 'null_columns', 'anonymize', 'delete_row'));
--> statement-breakpoint
-- ───────────── cross-module FKs (SQL only – schema-parity CROSS_MODULE_FKS) ─────────────
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_quote_fk" FOREIGN KEY ("property_id","quote_id") REFERENCES "public"."quote"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "website_booking_request" ADD CONSTRAINT "website_booking_request_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_website_request_fk" FOREIGN KEY ("property_id","website_booking_request_id") REFERENCES "public"."website_booking_request"("property_id","id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
-- ───────────── RLS + grants (erd 2.3, K8) ─────────────
ALTER TABLE "website_booking_request" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "website_booking_request" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "website_booking_request" USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
-- Rows are deleted only for `spam` past retention.web_request_spam_days (erd 4.14 T19).
GRANT SELECT, INSERT, UPDATE, DELETE ON "website_booking_request" TO ottimo_app;
--> statement-breakpoint
ALTER TABLE "public_form_nonce" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public_form_nonce" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "public_form_nonce" USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON "public_form_nonce" TO ottimo_app;
--> statement-breakpoint
-- Published privacy notices: policy of the ORGANISATION (no guest data). Append-only for the app (SELECT only):
-- rows are written by the landing release (OPS data migration, owner role) – erd 4.14, SEC C-3.
ALTER TABLE "privacy_notice_version" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "privacy_notice_version" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "privacy_notice_version" USING (organization_id = app_current_org());
--> statement-breakpoint
GRANT SELECT ON "privacy_notice_version" TO ottimo_app;
--> statement-breakpoint
-- rate_limit_counter: no tenant data (bucket keys = limit code + HMAC/id only) – documented RLS exception
-- (erd 4.14; test/integration/architecture.test.ts RLS_EXCEPTIONS).
GRANT SELECT, INSERT, UPDATE, DELETE ON "rate_limit_counter" TO ottimo_app;
--> statement-breakpoint
-- ───────────── entry function (erd 2.4 pattern, SEC ARC-06) ─────────────
-- Slug = lower(property.code). The form switch is a parameter of the property (read in the tenant transaction
-- right after – ParameterService), so the function only answers "active property with this slug".
CREATE FUNCTION public_resolve_property(p_slug text)
  RETURNS TABLE (organization_id uuid, property_id uuid, timezone text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT p.organization_id, p.id, p.timezone
    FROM property p
   WHERE lower(p.code) = p_slug AND p.status = 'active'
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public_resolve_property(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public_resolve_property(text) TO ottimo_app;
--> statement-breakpoint
-- ───────────── catalogue ─────────────
-- Security keys (OWN only, SEC hard bounds = OpenAPI x-security-parameters without default/ref).
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('public_booking_requests_enabled', 'security', '{owner}', 'SEC ARC-17', true,
   '{"type":"boolean"}'::jsonb, 'false'::jsonb),
  ('public_booking_request_daily_cap', 'security', '{owner}', 'SEC ARC-02', true,
   '{"type":"integer","minimum":50,"maximum":500}'::jsonb, '100'::jsonb),
  ('public_booking_request_spam_pow_threshold_per_week', 'security', '{owner}', 'SEC ARC-20', true,
   '{"type":"integer","minimum":5,"maximum":50}'::jsonb, '10'::jsonb),
  ('public_booking_request_pow_enabled', 'security', '{owner}', 'SEC ARC-22', true,
   '{"type":"boolean"}'::jsonb, 'false'::jsonb),
  ('retention.web_request_stale_days', 'security', '{owner}', 'T19', true,
   '{"type":"integer","minimum":7,"maximum":60}'::jsonb, '30'::jsonb),
  ('retention.web_request_declined_days', 'security', '{owner}', 'T19', true,
   '{"type":"integer","minimum":30,"maximum":90}'::jsonb, '90'::jsonb),
  ('retention.web_request_spam_days', 'security', '{owner}', 'T19', true,
   '{"type":"integer","minimum":1,"maximum":7}'::jsonb, '7'::jsonb),
  ('retention.web_request_max_age_days', 'security', '{owner}', 'T19', true,
   '{"type":"integer","minimum":90,"maximum":180}'::jsonb, '180'::jsonb),
  ('retention.web_request_ip_hmac_days', 'security', '{owner}', 'SEC ARC-03', true,
   '{"type":"integer","minimum":7,"maximum":30}'::jsonb, '30'::jsonb)
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
-- Business keys (erd 9.3; defaults DOM BR-912/914 v0.3.8).
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('web_request_response_minutes', 'int', '{owner,manager}', 'BR-912', false, '{"min":5,"max":240}'::jsonb, '15'::jsonb),
  ('web_request_escalate_minutes', 'int', '{owner,manager}', 'BR-912', false, '{"min":10,"max":480}'::jsonb, '30'::jsonb),
  ('web_request_public_promise_minutes', 'int', '{owner,manager}', 'BR-912', false, '{"min":15,"max":240}'::jsonb, '60'::jsonb),
  ('web_request_public_promise_next_morning_by', 'time', '{owner,manager}', 'BR-912', false, NULL, '"09:00"'::jsonb),
  ('web_request_public_promise_call_now_minutes', 'int', '{owner,manager}', 'BR-912', false, '{"min":5,"max":240}'::jsonb, '60'::jsonb),
  ('web_request_same_day_after_hours_minutes', 'int', '{owner,manager}', 'BR-912', false, '{"min":5,"max":240}'::jsonb, '30'::jsonb),
  ('web_request_duplicate_window_hours', 'int', '{owner,manager}', 'BR-914', false, '{"min":1,"max":168}'::jsonb, '24'::jsonb)
ON CONFLICT (key) DO NOTHING;
