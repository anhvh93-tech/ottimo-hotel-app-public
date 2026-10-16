-- 0005 (custom, hand-written – erd 16; BE-B Sprint 1): RLS + grants for the room catalogue and guest
-- profiles (0004), trigram search index (US-073), auth_resolve_session with idle_expires_at + user_status
-- (erd 2.4 decision 0.3.2), technical identity parameters (SR-SES-03, SR-AUTH-04). Runs as ottimo_owner.

-- ───────────── Trigram search on guest names (US-073: "do mai anh" finds "Đỗ Mai Anh") ─────────────
-- pg_trgm is a trusted extension: the database owner (ottimo_owner) may create it, no superuser needed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX guest_name_search_trgm_idx ON guest USING gin (name_search gin_trgm_ops);
--> statement-breakpoint

-- ───────────── Row Level Security (erd 2.3) ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['room_group', 'room', 'room_list_price', 'guest'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- Property-level catalogue.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['room_group', 'room', 'room_list_price'] LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- Guest profiles are organisation-level (erd 2.6: shared by the properties of one organisation).
CREATE POLICY tenant_isolation ON guest
  USING (organization_id = app_current_org()) WITH CHECK (organization_id = app_current_org());
--> statement-breakpoint
-- No DELETE: business rows are never hard-deleted (erd 1 "Xóa"); anonymisation is an UPDATE (T05/T06).
GRANT SELECT, INSERT, UPDATE ON room_group, room, room_list_price, guest TO ottimo_app;
--> statement-breakpoint

-- ───────────── auth_resolve_session 0.3.2 (erd 2.4) ─────────────
-- Adds idle_expires_at (idle timeout checked on every request without a second pre-context query) and
-- user_status (second line of defence: a disabled/locked user is refused even if a session was missed).
-- Changing the result type needs DROP + CREATE (0001 is never edited).
DROP FUNCTION auth_resolve_session(text);
--> statement-breakpoint
CREATE FUNCTION auth_resolve_session(p_sid_hash text)
  RETURNS TABLE (session_id text, user_id uuid, organization_id uuid, active_property_id uuid,
                 expires_at timestamptz, idle_expires_at timestamptz, revoked_at timestamptz,
                 roles_version integer, user_status text, trusted_device_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
  SELECT s.id, s.user_id, s.organization_id, s.active_property_id, s.expires_at, s.idle_expires_at,
         s.revoked_at, u.roles_version, u.status, s.trusted_device_id
    FROM user_session s
    JOIN app_user u ON u.id = s.user_id AND u.organization_id = s.organization_id
   WHERE s.id = p_sid_hash
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION auth_resolve_session(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION auth_resolve_session(text) TO ottimo_app;
--> statement-breakpoint

-- ───────────── Technical identity parameters (owner only; erd 9.3 style) ─────────────
-- session_policy: SR-SES-03 (admin-web 30 min idle / 12 h max; staff PWA 72 h idle / 30 days max).
-- login_lockout: SR-AUTH-04 (5 consecutive failures → 15 min; 3rd lock within 24 h → locked until OWN unlocks).
-- Not security parameters of setParameter.x-security-parameters (no SEC hard bounds yet): structure and
-- ranges are checked by the setParameter use case (platform). Proposed to ARC/SEC for x-security-parameters.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('session_policy', 'json', '{owner}', 'SR-SES-03', false, NULL,
   '{"admin":{"idleMinutes":30,"maxHours":12},"staff_pwa":{"idleMinutes":4320,"maxHours":720}}'::jsonb),
  ('login_lockout', 'json', '{owner}', 'SR-AUTH-04', false, NULL,
   '{"maxFailures":5,"lockMinutes":15,"hardLockAfterLocks":3,"lockWindowHours":24}'::jsonb);
