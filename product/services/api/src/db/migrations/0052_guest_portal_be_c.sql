-- 0052 (hand-written – ARC s3-contract 4.2; BE-C Sprint 3): guest-portal (ADR-006, erd 4.11, SR-GST-01…05).
-- guest_access_token (SHA-256 of the link token only), guest_session (SHA-256 of the cookie), online_checkin;
-- RLS + grants; entry functions guest_resolve_token / guest_resolve_session (erd 2.4: before any context).
CREATE TABLE "guest_access_token" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	CONSTRAINT "guest_access_token_hash_key" UNIQUE("token_hash"),
	CONSTRAINT "guest_access_token_revoked_reason_check" CHECK ("guest_access_token"."revoked_reason" IS NULL OR "guest_access_token"."revoked_reason" IN ('reissued', 'revoked', 'cancelled', 'no_show', 'relocated'))
);
--> statement-breakpoint
CREATE TABLE "guest_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"sid_hash" text NOT NULL,
	"token_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"locale" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "guest_session_sid_key" UNIQUE("sid_hash"),
	CONSTRAINT "guest_session_level_check" CHECK ("guest_session"."level" IN (1, 2)),
	CONSTRAINT "guest_session_locale_check" CHECK ("guest_session"."locale" IN ('vi', 'en', 'ru'))
);
--> statement-breakpoint
CREATE TABLE "online_checkin" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"current_step" text DEFAULT 'notice' NOT NULL,
	"eta_time" time,
	"late_arrival" boolean DEFAULT false NOT NULL,
	"arrival_note" text,
	"deferred_people" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"notice_version" text,
	"notice_locale" text,
	"notice_accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"write_count" smallint DEFAULT 0 NOT NULL,
	"write_count_date" date,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "online_checkin_reservation_key" UNIQUE("reservation_id"),
	CONSTRAINT "online_checkin_step_check" CHECK ("online_checkin"."current_step" IN ('notice', 'documents', 'eta', 'consent', 'done')),
	CONSTRAINT "online_checkin_note_check" CHECK ("online_checkin"."arrival_note" IS NULL OR char_length("online_checkin"."arrival_note") <= 300)
);
--> statement-breakpoint
ALTER TABLE "guest_access_token" ADD CONSTRAINT "guest_access_token_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_session" ADD CONSTRAINT "guest_session_token_fk" FOREIGN KEY ("token_id") REFERENCES "public"."guest_access_token"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "online_checkin" ADD CONSTRAINT "online_checkin_reservation_fk" FOREIGN KEY ("property_id","reservation_id") REFERENCES "public"."reservation"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_access_token_reservation_idx" ON "guest_access_token" USING btree ("reservation_id") WHERE "guest_access_token"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "guest_session_reservation_idx" ON "guest_session" USING btree ("reservation_id") WHERE "guest_session"."revoked_at" IS NULL;--> statement-breakpoint

-- ───────────── RLS (erd 2.3): property-level ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['guest_access_token', 'guest_session', 'online_checkin'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- The SECURITY DEFINER entry functions below run as ottimo_owner (FORCE RLS applies to it too): SELECT-only
-- policies for the owner, never for ottimo_app (same pattern as 0001 for user_session/trusted_device).
CREATE POLICY entry_function_read ON guest_access_token FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
CREATE POLICY entry_function_read ON guest_session FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON guest_access_token, guest_session, online_checkin TO ottimo_app;
--> statement-breakpoint
-- Expired sessions/tokens are technical rows (erd 12 last line): the app may purge them.
GRANT DELETE ON guest_session TO ottimo_app;
--> statement-breakpoint

-- ───────────── Entry functions (erd 2.4) ─────────────
-- Time checks (expires_at, revoked_at) are done by the caller with Clock – never now() here (ADR-008).
CREATE FUNCTION guest_resolve_token(p_token_hash text)
  RETURNS TABLE (token_id uuid, reservation_id uuid, property_id uuid, organization_id uuid,
                 expires_at timestamptz, revoked_at timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT t.id, t.reservation_id, t.property_id, t.organization_id, t.expires_at, t.revoked_at
    FROM public.guest_access_token t
   WHERE t.token_hash = p_token_hash
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION guest_resolve_token(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION guest_resolve_token(text) TO ottimo_app;
--> statement-breakpoint
-- Every guest request: cookie hash → session + its token (one call, like auth_resolve_session).
CREATE FUNCTION guest_resolve_session(p_sid_hash text)
  RETURNS TABLE (session_id uuid, token_id uuid, reservation_id uuid, property_id uuid,
                 organization_id uuid, level smallint, locale text, expires_at timestamptz,
                 revoked_at timestamptz, token_expires_at timestamptz, token_revoked_at timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT s.id, s.token_id, s.reservation_id, s.property_id, s.organization_id, s.level, s.locale,
         s.expires_at, s.revoked_at, t.expires_at, t.revoked_at
    FROM public.guest_session s
    JOIN public.guest_access_token t ON t.id = s.token_id
   WHERE s.sid_hash = p_sid_hash
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION guest_resolve_session(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION guest_resolve_session(text) TO ottimo_app;
