-- 0079 (BE-C, R3 Sprint 1 – US-143 / SR-AUTH-06, OpenAPI 0.3.8, erd 4.15). Number = next on main at rebase
-- (ARC s1-contracts 7). Two-step login for owner/manager: pending secret + anti-replay step on app_user,
-- second-factor state on user_session (mfa_at, amr, enrollment_only – restricted session SEC 06.4),
-- mfa_login_challenge (SHA-256 of mfaToken, single use, 5 min). No data backfill (columns start NULL/false).
CREATE TABLE "mfa_login_challenge" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"client_origin" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"failed_count" smallint DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "mfa_login_challenge_origin_check" CHECK ("mfa_login_challenge"."client_origin" IN ('admin', 'staff_pwa'))
);
--> statement-breakpoint
ALTER TABLE "user_session" DROP CONSTRAINT "user_session_revoked_reason_check";--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_pending_secret_enc" "bytea";--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_pending_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_data_key_id" uuid;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_key_property_id" uuid;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_last_used_step" bigint;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_enrolled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_user" ADD COLUMN "mfa_reset_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_session" ADD COLUMN "mfa_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_session" ADD COLUMN "amr" text;--> statement-breakpoint
ALTER TABLE "user_session" ADD COLUMN "enrollment_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mfa_login_challenge" ADD CONSTRAINT "mfa_login_challenge_user_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mfa_login_challenge_user_idx" ON "mfa_login_challenge" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mfa_login_challenge_expires_idx" ON "mfa_login_challenge" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_amr_check" CHECK ("user_session"."amr" IS NULL OR "user_session"."amr" IN ('pwd', 'totp', 'recovery_code'));--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_revoked_reason_check" CHECK ("user_session"."revoked_reason" IS NULL OR "user_session"."revoked_reason" IN ('logout', 'role_changed', 'disabled', 'password_reset', 'password_changed', 'mfa_disabled', 'mfa_enrolled', 'mfa_reset', 'admin'));
--> statement-breakpoint
-- ───────────── RLS: mfa_login_challenge is organisation-level (erd 2.3) ─────────────
-- [BE-C] erd 4.15 said "only SECURITY DEFINER functions": the token is resolved to (user, organisation) by the
-- entry function below; the row is then locked/updated under RLS in the user's organisation, like user_session.
ALTER TABLE mfa_login_challenge ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE mfa_login_challenge FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON mfa_login_challenge
  USING (organization_id = app_current_org()) WITH CHECK (organization_id = app_current_org());
--> statement-breakpoint
CREATE POLICY entry_function_read ON mfa_login_challenge FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_login_challenge TO ottimo_app;
--> statement-breakpoint
CREATE FUNCTION auth_mfa_challenge_resolve(p_token_hash text)
  RETURNS TABLE (user_id uuid, organization_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT c.user_id, c.organization_id FROM public.mfa_login_challenge c WHERE c.token_hash = p_token_hash
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION auth_mfa_challenge_resolve(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION auth_mfa_challenge_resolve(text) TO ottimo_app;
--> statement-breakpoint
-- ───────────── auth_resolve_session 0.3.8: second-factor state for the guard (SEC 06.4, 06.29) ─────────────
-- mfa_required = a live owner/manager role at any property (SEC 06.2) – with MFA_ENFORCED the guard restricts a
-- session of such a user without 2FA even when the session was opened before the flag was switched on.
CREATE POLICY entry_function_read ON user_property_role FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
DROP FUNCTION auth_resolve_session(text);
--> statement-breakpoint
CREATE FUNCTION auth_resolve_session(p_sid_hash text)
  RETURNS TABLE (session_id text, user_id uuid, organization_id uuid, active_property_id uuid,
                 expires_at timestamptz, idle_expires_at timestamptz, revoked_at timestamptz,
                 roles_version integer, user_status text, trusted_device_id uuid,
                 client_origin text, last_active_at timestamptz, must_change_password boolean,
                 mfa_at timestamptz, enrollment_only boolean, mfa_enabled boolean, mfa_required boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT s.id, s.user_id, s.organization_id, s.active_property_id, s.expires_at, s.idle_expires_at,
         s.revoked_at, u.roles_version, u.status, s.trusted_device_id,
         s.client_origin, s.last_active_at, u.must_change_password,
         s.mfa_at, s.enrollment_only, u.mfa_enabled,
         EXISTS (SELECT 1 FROM public.user_property_role r
                  WHERE r.user_id = u.id AND r.revoked_at IS NULL AND r.role IN ('owner', 'manager'))
    FROM public.user_session s
    JOIN public.app_user u ON u.id = s.user_id AND u.organization_id = s.organization_id
   WHERE s.id = p_sid_hash
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION auth_resolve_session(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION auth_resolve_session(text) TO ottimo_app;
