import { Pool } from 'pg';
import { describe, expect, it } from 'vitest';

// Database role model of erd.md 2.1 (FB-R1-SEC-OPS-01, FB-R1-BE-ARC-03, BUG-R1-SEC-06).
// Tests must run as the application role, otherwise RLS and REVOKE checks prove nothing.
// CI sets DATABASE_URL to ottimo_app and MIGRATION_DATABASE_URL to ottimo_migrator (docs/dev-setup.md).

async function withPool<T>(url: string, fn: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

describe.skipIf(!process.env.DATABASE_URL)('database role used by the app and tests', () => {
  const url = process.env.DATABASE_URL as string;

  it('is not a superuser and cannot bypass RLS', async () => {
    const { rows } = await withPool(url, (pool) =>
      pool.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
        'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
      ),
    );
    expect(rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it('is not a member of ottimo_owner and owns nothing', async () => {
    const { rows } = await withPool(url, (pool) =>
      pool.query<{ member: boolean; owns_db: boolean }>(
        `SELECT pg_has_role(current_user, 'ottimo_owner', 'MEMBER') AS member,
                EXISTS (SELECT 1 FROM pg_database d WHERE d.datname = current_database()
                          AND d.datdba = (SELECT oid FROM pg_roles WHERE rolname = current_user)) AS owns_db`,
      ),
    );
    expect(rows[0]).toEqual({ member: false, owns_db: false });
  });

  it('sees ottimo_owner as NOLOGIN and the 4 roles exist with the erd 2.1 attributes', async () => {
    const { rows } = await withPool(url, (pool) =>
      pool.query<{
        rolname: string;
        rolcanlogin: boolean;
        rolsuper: boolean;
        rolbypassrls: boolean;
      }>(
        `SELECT rolname, rolcanlogin, rolsuper, rolbypassrls FROM pg_roles
          WHERE rolname IN ('ottimo_owner', 'ottimo_migrator', 'ottimo_app', 'ottimo_readonly')
          ORDER BY rolname`,
      ),
    );
    expect(rows).toEqual([
      { rolname: 'ottimo_app', rolcanlogin: true, rolsuper: false, rolbypassrls: false },
      { rolname: 'ottimo_migrator', rolcanlogin: true, rolsuper: false, rolbypassrls: false },
      { rolname: 'ottimo_owner', rolcanlogin: false, rolsuper: false, rolbypassrls: false },
      // Login for ottimo_readonly is enabled only temporarily through the runbook (SR-OPS-04).
      { rolname: 'ottimo_readonly', rolcanlogin: false, rolsuper: false, rolbypassrls: true },
    ]);
  });
});

describe.skipIf(!process.env.MIGRATION_DATABASE_URL)('migration role (ottimo_migrator)', () => {
  const url = process.env.MIGRATION_DATABASE_URL as string;

  it('logs in as ottimo_migrator, not as the NOLOGIN owner', async () => {
    const { rows } = await withPool(url, (pool) =>
      pool.query<{ user: string; rolsuper: boolean; rolbypassrls: boolean }>(
        `SELECT current_user AS user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`,
      ),
    );
    expect(rows[0]).toEqual({ user: 'ottimo_migrator', rolsuper: false, rolbypassrls: false });
  });

  it('gets owner rights only after SET ROLE ottimo_owner (no inherited privileges)', async () => {
    await withPool(url, async (pool) => {
      const client = await pool.connect();
      try {
        const before = await client.query<{ can_create: boolean }>(
          `SELECT has_schema_privilege('public', 'CREATE') AS can_create`,
        );
        expect(before.rows[0]?.can_create).toBe(false);
        await client.query('BEGIN');
        await client.query('SET LOCAL ROLE ottimo_owner');
        const after = await client.query<{ user: string; can_create: boolean }>(
          `SELECT current_user AS user, has_schema_privilege('public', 'CREATE') AS can_create`,
        );
        expect(after.rows[0]).toEqual({ user: 'ottimo_owner', can_create: true });
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });
});
