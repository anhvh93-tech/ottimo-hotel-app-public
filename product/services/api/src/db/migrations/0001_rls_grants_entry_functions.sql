-- 0001 (custom, hand-written – erd 16): Row Level Security, grants for ottimo_app, monthly log partitions,
-- SECURITY DEFINER entry functions (erd 2.3, 2.4, K8). Runs as ottimo_owner (SET ROLE by src/db/migrate.ts).

-- ───────────── RLS context helpers (erd 2.3) ─────────────
-- A reused pooled connection returns '' (not NULL) after a transaction that used set_config(..., true):
-- NULLIF turns that into NULL so policies match 0 rows instead of failing on ''::uuid.
CREATE FUNCTION app_current_property() RETURNS uuid LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT NULLIF(current_setting('app.property_id', true), '')::uuid $$;
--> statement-breakpoint
CREATE FUNCTION app_current_org() RETURNS uuid LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT NULLIF(current_setting('app.organization_id', true), '')::uuid $$;
--> statement-breakpoint
CREATE FUNCTION app_current_user_id() RETURNS uuid LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_current_property(), app_current_org(), app_current_user_id() TO ottimo_app;
--> statement-breakpoint

-- ───────────── Enable + force RLS on every tenant table ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organization', 'property', 'app_user', 'user_property_role', 'user_session', 'trusted_device',
    'config_parameter', 'doc_sequence', 'audit_event', 'c3_access_log', 'job_run',
    'outbox_message', 'inbox_message', 'idempotency_key'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- Organisation itself: visible only inside its own context.
CREATE POLICY tenant_isolation ON organization
  USING (id = app_current_org()) WITH CHECK (id = app_current_org());
--> statement-breakpoint
-- Organisation-level tables (erd 2.3). property and user_property_role are organisation-level on purpose:
-- login must list the properties/roles of a user before a property is chosen; property filtering of roles
-- is done in SQL by the guard (BE decision R2 W1, decision-log).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['property', 'app_user', 'user_property_role', 'user_session', 'idempotency_key'] LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (organization_id = app_current_org()) '
      'WITH CHECK (organization_id = app_current_org())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- Property-level tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['trusted_device', 'config_parameter', 'c3_access_log', 'job_run'] LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- Tables that hold both organisation-level (property_id NULL) and property-level rows (erd 2.3 doc_sequence).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['doc_sequence', 'audit_event', 'outbox_message', 'inbox_message'] LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I '
      'USING (organization_id = app_current_org() AND (property_id IS NULL OR property_id = app_current_property())) '
      'WITH CHECK (organization_id = app_current_org() AND (property_id IS NULL OR property_id = app_current_property()))', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- The SECURITY DEFINER entry functions below run as ottimo_owner, which FORCE RLS also restricts.
-- These SELECT-only policies apply to ottimo_owner alone (never to ottimo_app) so the functions can
-- resolve a user/session/device/property before any tenant context exists (erd 2.4).
CREATE POLICY entry_function_read ON app_user FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
CREATE POLICY entry_function_read ON user_session FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
CREATE POLICY entry_function_read ON trusted_device FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
CREATE POLICY entry_function_read ON property FOR SELECT TO ottimo_owner USING (true);
--> statement-breakpoint
-- config_parameter_def (global catalogue) and dev_clock (fake clock, dev/test/staging) hold no tenant
-- data: documented RLS exceptions (erd 2.3); test/architecture.test.ts keeps the list closed.

-- ───────────── Grants for ottimo_app (no default DML grant – 02-roles.sh) ─────────────
GRANT SELECT, INSERT, UPDATE ON organization, property, app_user, user_property_role, trusted_device,
  config_parameter, doc_sequence, job_run, outbox_message, inbox_message TO ottimo_app;
--> statement-breakpoint
-- Technical tables the app may purge (erd 2.1): sessions, idempotency keys, fake clock.
GRANT SELECT, INSERT, UPDATE, DELETE ON user_session, idempotency_key, dev_clock TO ottimo_app;
--> statement-breakpoint
-- Append-only logs (K8): INSERT + SELECT only – no UPDATE, no DELETE.
GRANT SELECT, INSERT ON audit_event, c3_access_log TO ottimo_app;
--> statement-breakpoint
GRANT USAGE ON SEQUENCE audit_event_id_seq, c3_access_log_id_seq TO ottimo_app;
--> statement-breakpoint
GRANT SELECT ON config_parameter_def TO ottimo_app;
--> statement-breakpoint

-- ───────────── Monthly partitions of the logs (BE-ARC-18) ─────────────
-- Creates the partition for p_month (first day of month) if missing; RLS forced on it and no grant for
-- ottimo_app, so the partition can only be read through the parent (parent policy applies). J16 calls it
-- for next month; the DEFAULT partition catches anything outside the created range.
CREATE FUNCTION log_ensure_month_partition(p_table text, p_month date) RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_from date := date_trunc('month', p_month)::date;
  v_to date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_name text := format('%s_p%s', p_table, to_char(v_from, 'YYYYMM'));
BEGIN
  IF p_table NOT IN ('audit_event', 'c3_access_log') THEN
    RAISE EXCEPTION 'log_ensure_month_partition: table % is not a partitioned log', p_table;
  END IF;
  IF to_regclass(format('public.%I', v_name)) IS NULL THEN
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
                   v_name, p_table, v_from, v_to);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', v_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM ottimo_app', v_name);
  END IF;
  RETURN v_name;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION log_ensure_month_partition(text, date) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION log_ensure_month_partition(text, date) TO ottimo_app;
--> statement-breakpoint
DO $$
DECLARE t text; m date;
BEGIN
  FOREACH t IN ARRAY ARRAY['audit_event', 'c3_access_log'] LOOP
    -- 2026-10 (first R2 data) … 2027-12; J16 adds the following months.
    FOR m IN SELECT generate_series(date '2026-10-01', date '2027-12-01', interval '1 month')::date LOOP
      PERFORM log_ensure_month_partition(t, m);
    END LOOP;
    EXECUTE format('CREATE TABLE public.%I PARTITION OF public.%I DEFAULT', t || '_pdefault', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t || '_pdefault');
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t || '_pdefault');
  END LOOP;
END $$;
--> statement-breakpoint

-- ───────────── Entry functions before a tenant context exists (erd 2.4, BE-ARC-01) ─────────────
-- Owner = ottimo_owner, fixed search_path, only the listed columns, EXECUTE for ottimo_app only.
-- Time checks (expires_at, locked_until) are done by the caller with Clock – never now() here (ADR-008).
-- guest_resolve_token, webhook_resolve_property, public_resolve_unit are created with their tables
-- (guest_access_token, channel_mapping, room) in the migrations of those modules.
CREATE FUNCTION auth_find_user(p_username text)
  RETURNS TABLE (user_id uuid, organization_id uuid, password_hash text, status text,
                 locked_until timestamptz, failed_login_count integer, must_change_password boolean,
                 mfa_enabled boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
  SELECT u.id, u.organization_id, u.password_hash, u.status, u.locked_until, u.failed_login_count,
         u.must_change_password, u.mfa_enabled
    FROM app_user u
   WHERE u.username = p_username::citext
$$;
--> statement-breakpoint
CREATE FUNCTION auth_resolve_session(p_sid_hash text)
  RETURNS TABLE (session_id text, user_id uuid, organization_id uuid, active_property_id uuid,
                 expires_at timestamptz, revoked_at timestamptz, roles_version integer,
                 trusted_device_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
  SELECT s.id, s.user_id, s.organization_id, s.active_property_id, s.expires_at, s.revoked_at,
         u.roles_version, s.trusted_device_id
    FROM user_session s
    JOIN app_user u ON u.id = s.user_id AND u.organization_id = s.organization_id
   WHERE s.id = p_sid_hash
$$;
--> statement-breakpoint
CREATE FUNCTION auth_resolve_device(p_did_hash text)
  RETURNS TABLE (device_id uuid, property_id uuid, organization_id uuid, expires_at timestamptz,
                 revoked_at timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
  SELECT d.id, d.property_id, d.organization_id, d.expires_at, d.revoked_at
    FROM trusted_device d
   WHERE d.token_hash = p_did_hash
$$;
--> statement-breakpoint
CREATE FUNCTION worker_list_properties()
  RETURNS TABLE (property_id uuid, organization_id uuid, timezone text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
  SELECT p.id, p.organization_id, p.timezone FROM property p WHERE p.status = 'active' ORDER BY p.id
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION auth_find_user(text), auth_resolve_session(text), auth_resolve_device(text),
  worker_list_properties() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION auth_find_user(text), auth_resolve_session(text), auth_resolve_device(text),
  worker_list_properties() TO ottimo_app;
