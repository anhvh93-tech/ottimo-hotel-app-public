-- BE-B, Round 2 Sprint 1 review fixes (custom SQL, runs as ottimo_owner). Never edit 0001/0005.

-- ───────────── auth_resolve_session 0.3.4 (FB-R2-ARC-BE-05) ─────────────
-- One session read per request: the guard now also gets client_origin, last_active_at and
-- must_change_password, so the session-policy interceptor no longer opens its own transaction to re-read
-- user_session ⋈ app_user. Result type changes → DROP + CREATE (same grants as 0005).
DROP FUNCTION auth_resolve_session(text);
--> statement-breakpoint
CREATE FUNCTION auth_resolve_session(p_sid_hash text)
  RETURNS TABLE (session_id text, user_id uuid, organization_id uuid, active_property_id uuid,
                 expires_at timestamptz, idle_expires_at timestamptz, revoked_at timestamptz,
                 roles_version integer, user_status text, trusted_device_id uuid,
                 client_origin text, last_active_at timestamptz, must_change_password boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT s.id, s.user_id, s.organization_id, s.active_property_id, s.expires_at, s.idle_expires_at,
         s.revoked_at, u.roles_version, u.status, s.trusted_device_id,
         s.client_origin, s.last_active_at, u.must_change_password
    FROM public.user_session s
    JOIN public.app_user u ON u.id = s.user_id AND u.organization_id = s.organization_id
   WHERE s.id = p_sid_hash
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION auth_resolve_session(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION auth_resolve_session(text) TO ottimo_app;
--> statement-breakpoint

-- ───────────── pg_temp last in every SECURITY DEFINER search_path (FB-R2-SEC-BE-10) ─────────────
-- Without pg_temp in search_path PostgreSQL searches the session's temporary schema FIRST for tables, so a
-- role with TEMPORARY could shadow app_user/user_session inside a function running as ottimo_owner.
-- Applies to every SECURITY DEFINER function in schema public that exists now (0001, 0005, 0007…);
-- test/integration/identity-hardening.test.ts fails for any later function without it.
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public, pg_temp', f);
  END LOOP;
END $$;
--> statement-breakpoint

-- ───────────── session_policy, login_lockout → security parameters (SEC s1-decisions 1, OpenAPI 0.3.4) ─────────────
-- Owner only, SEC hard bounds = setParameter.x-security-parameters (without default/ref/description),
-- audit category security. Cross rule idleMinutes ≤ maxHours × 60 stays in parameter-rules.ts.
-- Values already stored outside the new bounds keep working until changed (read path takes the
-- strictest value across the user's properties – identity/public/identity-params.ts).
UPDATE config_parameter_def SET is_security = true, value_schema = 'security',
  bounds = '{"type":"object","required":["admin","staff_pwa"],"properties":{"admin":{"type":"object","required":["idleMinutes","maxHours"],"properties":{"idleMinutes":{"type":"integer","minimum":5,"maximum":30,"default":30},"maxHours":{"type":"integer","minimum":1,"maximum":12,"default":12}}},"staff_pwa":{"type":"object","required":["idleMinutes","maxHours"],"properties":{"idleMinutes":{"type":"integer","minimum":60,"maximum":4320,"default":4320},"maxHours":{"type":"integer","minimum":24,"maximum":720,"default":720}}}}}'::jsonb,
  default_value = '{"admin":{"idleMinutes":30,"maxHours":12},"staff_pwa":{"idleMinutes":4320,"maxHours":720}}'::jsonb
 WHERE key = 'session_policy';
--> statement-breakpoint
UPDATE config_parameter_def SET is_security = true, value_schema = 'security',
  bounds = '{"type":"object","required":["maxFailures","lockMinutes","hardLockAfterLocks","lockWindowHours"],"properties":{"maxFailures":{"type":"integer","minimum":3,"maximum":5,"default":5},"lockMinutes":{"type":"integer","minimum":15,"maximum":60,"default":15},"hardLockAfterLocks":{"type":"integer","minimum":2,"maximum":3,"default":3},"lockWindowHours":{"type":"integer","minimum":24,"maximum":72,"default":24}}}'::jsonb,
  default_value = '{"maxFailures":5,"lockMinutes":15,"hardLockAfterLocks":3,"lockWindowHours":24}'::jsonb
 WHERE key = 'login_lockout';
