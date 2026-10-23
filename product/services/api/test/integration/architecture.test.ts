/**
 * Architecture tests after migrating an empty DB (erd 16 point 6a, coding-standards 6):
 * every public table has RLS enabled + forced (closed exception list), K8 grants, entry functions
 * return only the listed columns, startup role checks (G4), migrations re-run cleanly.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { OPENAPI_META } from '../../src/generated/openapi-meta';
import { runMigrations } from '../../src/db/migrate';
import {
  StartupCheckError,
  assertProductionClock,
  assertSafeDbRole,
} from '../../src/db/startup-checks';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

/** Tables without RLS, each with its reason (erd 2.3). Adding one = review by SEC. */
const RLS_EXCEPTIONS: Record<string, string> = {
  config_parameter_def: 'global parameter catalogue, no tenant data',
  dev_clock: 'fake clock for dev/test/staging, no tenant data',
};

describe.skipIf(!HAS_DB)('schema architecture (erd 2.3, 16)', () => {
  let db: Database;
  beforeAll(() => {
    db = appDatabase(2);
  });
  afterAll(async () => db.close());

  it('every table in public has RLS enabled AND forced, except the documented list', async () => {
    const { rows } = await db.pool.query<{ relname: string; on: boolean; forced: boolean }>(
      `SELECT c.relname, c.relrowsecurity AS on, c.relforcerowsecurity AS forced
         FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p')`,
    );
    expect(rows.length).toBeGreaterThan(15);
    const missing = rows
      .filter((r) => !(r.on && r.forced) && !(r.relname in RLS_EXCEPTIONS))
      .map((r) => r.relname);
    expect(missing).toEqual([]);
    for (const t of Object.keys(RLS_EXCEPTIONS)) expect(rows.map((r) => r.relname)).toContain(t);
  });

  it('every table with property_id/organization_id has a tenant_isolation policy', async () => {
    const { rows } = await db.pool.query<{ table_name: string }>(
      `SELECT DISTINCT c.table_name FROM information_schema.columns c
         JOIN pg_class k ON k.relname = c.table_name AND k.relnamespace = 'public'::regnamespace
        WHERE c.table_schema = 'public' AND c.column_name IN ('property_id', 'organization_id')
          AND k.relkind IN ('r', 'p') AND NOT k.relispartition`,
    );
    const { rows: pol } = await db.pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_policies WHERE schemaname = 'public' AND policyname = 'tenant_isolation'`,
    );
    const withPolicy = new Set(pol.map((p) => p.tablename));
    expect(rows.map((r) => r.table_name).filter((t) => !withPolicy.has(t))).toEqual([]);
  });

  it('append-only tables give ottimo_app no UPDATE/DELETE/TRUNCATE (K8)', async () => {
    const { rows } = await db.pool.query<{
      t: string;
      u: boolean;
      d: boolean;
      tr: boolean;
      i: boolean;
    }>(
      `SELECT t, has_table_privilege('ottimo_app', t, 'UPDATE') AS u,
              has_table_privilege('ottimo_app', t, 'DELETE') AS d,
              has_table_privilege('ottimo_app', t, 'TRUNCATE') AS tr,
              has_table_privilege('ottimo_app', t, 'INSERT') AS i
         FROM unnest(ARRAY['audit_event', 'c3_access_log']) AS t`,
    );
    for (const r of rows) expect(r).toEqual({ t: r.t, u: false, d: false, tr: false, i: true });
  });

  it('logs are partitioned monthly with a DEFAULT partition (BE-ARC-18)', async () => {
    const { rows } = await db.pool.query<{ parent: string; n: number }>(
      `SELECT p.relname AS parent, count(*)::int AS n FROM pg_inherits i
         JOIN pg_class p ON p.oid = i.inhparent WHERE p.relname IN ('audit_event', 'c3_access_log')
        GROUP BY p.relname ORDER BY 1`,
    );
    expect(rows.map((r) => r.parent)).toEqual(['audit_event', 'c3_access_log']);
    for (const r of rows) expect(r.n).toBeGreaterThanOrEqual(16);
  });

  it('the security parameter bounds in the catalogue equal OpenAPI x-security-parameters', async () => {
    const { rows } = await db.pool.query<{
      key: string;
      bounds: unknown;
      default_value: unknown;
      edit_roles: string[];
    }>(
      `SELECT key, bounds, default_value, edit_roles FROM config_parameter_def WHERE is_security ORDER BY key`,
    );
    expect(rows.map((r) => r.key)).toEqual(Object.keys(OPENAPI_META.securityParameters).sort());
    for (const r of rows) {
      const {
        default: dflt,
        ref: _ref,
        description: _description, // prose only (0.3.4 object keys) – not stored in bounds
        ...bounds
      } = OPENAPI_META.securityParameters[r.key] as unknown as Record<string, unknown>;
      void _ref;
      void _description;
      expect(r.bounds).toEqual(bounds);
      expect(r.default_value).toEqual(dflt);
      expect(r.edit_roles).toEqual(['owner']);
    }
  });

  it('erd 9.1a bounds are filled for the business keys (0003)', async () => {
    const { rows } = await db.pool.query<{ key: string; bounds: unknown }>(
      `SELECT key, bounds FROM config_parameter_def WHERE key IN ('vat_rate', 'quote_validity_days', 'idempotency_ttl_hours')
        ORDER BY key`,
    );
    expect(rows).toEqual([
      { key: 'idempotency_ttl_hours', bounds: { min: 24, max: 720 } },
      { key: 'quote_validity_days', bounds: { min: 1, max: 30 } },
      { key: 'vat_rate', bounds: { allowed: [0, 5, 8, 10] } },
    ]);
  });

  it('migrations are forward-only and re-running them is a no-op', async () => {
    await runMigrations(
      process.env.MIGRATION_DATABASE_URL as string,
      join(__dirname, '..', '..', 'src', 'db', 'migrations'),
    );
    const mig = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL, max: 1 });
    try {
      // The migrator holds no privileges of its own (NOINHERIT): it must SET ROLE, like the runner does.
      await mig.query('SET ROLE ottimo_owner');
      const { rows } = await mig.query<{ n: number }>(
        'SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations',
      );
      const journal = JSON.parse(
        readFileSync(
          join(__dirname, '..', '..', 'src', 'db', 'migrations', 'meta', '_journal.json'),
          'utf8',
        ),
      ) as { entries: unknown[] };
      expect(rows[0]?.n).toBe(journal.entries.length);
    } finally {
      await mig.end();
    }
  });

  it('there is no drizzle-kit push script anywhere (erd 16 point 3)', () => {
    const pkg = readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8');
    expect(pkg).not.toMatch(/drizzle-kit\s+push/);
  });
});

describe.skipIf(!HAS_DB)('SECURITY DEFINER entry functions (erd 2.4)', () => {
  let db: Database;
  let t: TestTenant;
  beforeAll(async () => {
    db = appDatabase(2);
    t = await createTenant(db, { users: { fd: ['front_desk'] } });
  });
  afterAll(async () => db.close());

  const columns = async (fn: string) => {
    const { rows } = await db.pool.query<{ name: string }>(
      `SELECT unnest(p.proargnames[p.pronargs + 1:]) AS name FROM pg_proc p WHERE p.proname = $1`,
      [fn],
    );
    return rows.map((r) => r.name);
  };

  it('return exactly the listed columns, run as the owner with a fixed search_path', async () => {
    expect(await columns('auth_find_user')).toEqual([
      'user_id',
      'organization_id',
      'password_hash',
      'status',
      'locked_until',
      'failed_login_count',
      'must_change_password',
      'mfa_enabled',
    ]);
    expect(await columns('auth_resolve_session')).toEqual([
      'session_id',
      'user_id',
      'organization_id',
      'active_property_id',
      'expires_at',
      'idle_expires_at',
      'revoked_at',
      'roles_version',
      'user_status',
      'trusted_device_id',
      // 0.3.4 (0009_identity_hardening_be_b, FB-R2-ARC-BE-05): one session read per request.
      'client_origin',
      'last_active_at',
      'must_change_password',
      // 0.3.8 (0079_mfa_two_factor, US-143): second-factor state for the restricted-session guard.
      'mfa_at',
      'enrollment_only',
      'mfa_enabled',
      'mfa_required',
    ]);
    expect(await columns('auth_resolve_device')).toEqual([
      'device_id',
      'property_id',
      'organization_id',
      'expires_at',
      'revoked_at',
    ]);
    expect(await columns('worker_list_properties')).toEqual([
      'property_id',
      'organization_id',
      'timezone',
    ]);
    const { rows } = await db.pool.query<{
      proname: string;
      secdef: boolean;
      owner: string;
      config: string[];
    }>(
      `SELECT proname, prosecdef AS secdef, pg_get_userbyid(proowner) AS owner, proconfig AS config FROM pg_proc
        WHERE proname IN ('auth_find_user', 'auth_resolve_session', 'auth_resolve_device', 'worker_list_properties')`,
    );
    for (const r of rows) {
      expect(r.secdef).toBe(true);
      expect(r.owner).toBe('ottimo_owner');
      expect(r.config).toContain('search_path=pg_catalog, public, pg_temp');
    }
  });

  it('every SECURITY DEFINER function puts pg_temp last in search_path (FB-R2-SEC-BE-10)', async () => {
    const { rows } = await db.pool.query<{ proname: string; config: string[] | null }>(
      `SELECT p.proname, p.proconfig AS config FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef ORDER BY p.proname`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(5);
    for (const r of rows) {
      const sp = (r.config ?? []).find((c) => c.startsWith('search_path='));
      expect({ fn: r.proname, sp }).toEqual({
        fn: r.proname,
        sp: expect.stringMatching(/, pg_temp$/),
      });
    }
  });

  it('PUBLIC cannot execute them; ottimo_app can', async () => {
    const { rows } = await db.pool.query<{ pub: boolean; app: boolean }>(
      `SELECT bool_or(has_function_privilege('public', p.oid, 'EXECUTE')) AS pub,
              bool_and(has_function_privilege('ottimo_app', p.oid, 'EXECUTE')) AS app
         FROM pg_proc p WHERE p.proname IN ('auth_find_user', 'auth_resolve_session', 'auth_resolve_device', 'worker_list_properties')`,
    );
    expect(rows[0]).toEqual({ pub: false, app: true });
  });

  it('resolve a user (case-insensitive username) and a session without any tenant context', async () => {
    const fd = t.users.fd!;
    const res = await db.entry(async (tx) => {
      const u = await tx.query('SELECT * FROM auth_find_user($1)', [fd.username.toUpperCase()]);
      const s = await tx.query('SELECT * FROM auth_resolve_session($1)', [
        sha256Hex(fd.sessionToken),
      ]);
      const none = await tx.query('SELECT * FROM auth_resolve_session($1)', [sha256Hex('nope')]);
      return { u: u.rows, s: s.rows, none: none.rows };
    });
    expect(res.u).toHaveLength(1);
    expect(res.u[0]).toMatchObject({
      user_id: fd.id,
      organization_id: t.organizationId,
      status: 'active',
    });
    expect(res.s[0]).toMatchObject({ user_id: fd.id, roles_version: 1, revoked_at: null });
    expect(res.none).toEqual([]);
  });

  it('a revoked session is returned with revoked_at (caller refuses it)', async () => {
    const fd = t.users.fd!;
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE user_session SET revoked_at = $2, revoked_reason = 'logout' WHERE user_id = $1`,
        [fd.id, T0],
      ),
    );
    const s = await db.entry((tx) =>
      tx.query('SELECT * FROM auth_resolve_session($1)', [sha256Hex(fd.sessionToken)]),
    );
    expect(s.rows[0]?.revoked_at).not.toBeNull();
  });

  it('worker_list_properties lists active properties of every organisation', async () => {
    const r = await db.entry((tx) =>
      tx.query<{ property_id: string }>('SELECT * FROM worker_list_properties()'),
    );
    expect(r.rows.map((x) => x.property_id)).toContain(t.propertyIds[0]);
  });
});

describe.skipIf(!HAS_DB)('startup checks (G4, SR-SECR-05)', () => {
  it('accept ottimo_app', async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    try {
      await expect(assertSafeDbRole(pool)).resolves.toBeUndefined();
      await expect(assertProductionClock(pool, 'production')).resolves.toBeUndefined();
    } finally {
      await pool.end();
    }
  });

  it('refuse the migrator (member of the schema owner)', async () => {
    const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL, max: 1 });
    try {
      await expect(assertSafeDbRole(pool)).rejects.toThrow(/schema owner/);
    } finally {
      await pool.end();
    }
  });

  it('refuse a superuser or BYPASSRLS role (simulated pg_roles answer)', async () => {
    const fake = (row: Record<string, unknown>) =>
      ({ query: async () => ({ rows: [row] }) }) as unknown as Pool;
    const base = { rolname: 'x', rolsuper: false, rolbypassrls: false, owner_member: false };
    await expect(assertSafeDbRole(fake({ ...base, rolsuper: true }))).rejects.toThrow(
      StartupCheckError,
    );
    await expect(assertSafeDbRole(fake({ ...base, rolbypassrls: true }))).rejects.toThrow(
      /BYPASSRLS/,
    );
    await expect(assertSafeDbRole(fake(base))).resolves.toBeUndefined();
  });

  it('production refuses a dev_clock row', async () => {
    const fake = { query: async () => ({ rows: [{ n: 1 }] }) } as unknown as Pool;
    await expect(assertProductionClock(fake, 'production')).rejects.toThrow(/dev_clock/);
    await expect(assertProductionClock(fake, 'staging')).resolves.toBeUndefined();
  });
});
