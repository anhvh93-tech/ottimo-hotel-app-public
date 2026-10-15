import { Pool } from 'pg';
import { describe, expect, it } from 'vitest';

// FB-R1-SEC-OPS-01 / FB-R1-BE-ARC-03: tests must run as the application role, otherwise RLS and
// REVOKE checks prove nothing. CI sets DATABASE_URL to ottimo_app (see docs/dev-setup.md).
describe.skipIf(!process.env.DATABASE_URL)('database role used by the app and tests', () => {
  it('is not a superuser and cannot bypass RLS', async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    try {
      const { rows } = await pool.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
        'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
      );
      expect(rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
    } finally {
      await pool.end();
    }
  });
});
