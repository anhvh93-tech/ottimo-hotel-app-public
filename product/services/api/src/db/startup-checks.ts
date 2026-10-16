/**
 * Startup checks against the database, run by api and worker before serving (SR-SECR-05(d), erd 2.1, G4).
 * A failure stops the process (exit 1); the messages never contain credentials.
 */
import type { Pool } from 'pg';
import type { AppEnv } from '../config';
import { pgCode } from './database';

export class StartupCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StartupCheckError';
  }
}

interface RoleRow {
  rolname: string;
  rolsuper: boolean;
  rolbypassrls: boolean;
  owner_member: boolean;
}

/**
 * The connection role must not be a superuser, must not bypass RLS and must not be (a member of)
 * the schema owner: any of these makes every RLS policy and REVOKE meaningless (erd 2.1).
 */
export async function assertSafeDbRole(pool: Pool): Promise<void> {
  const { rows } = await pool.query<RoleRow>(
    `SELECT r.rolname, r.rolsuper, r.rolbypassrls,
            EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles o ON o.oid = m.roleid
                     WHERE m.member = r.oid AND o.rolname = 'ottimo_owner') AS owner_member
       FROM pg_roles r WHERE r.rolname = current_user`,
  );
  const role = rows[0];
  if (!role) throw new StartupCheckError('database role of DATABASE_URL not found in pg_roles');
  if (role.rolsuper) {
    throw new StartupCheckError(
      `DATABASE_URL role ${role.rolname} is a superuser – use ottimo_app (erd 2.1)`,
    );
  }
  if (role.rolbypassrls) {
    throw new StartupCheckError(
      `DATABASE_URL role ${role.rolname} has BYPASSRLS – use ottimo_app (erd 2.1)`,
    );
  }
  if (role.rolname === 'ottimo_owner' || role.owner_member) {
    throw new StartupCheckError(
      `DATABASE_URL role ${role.rolname} is the schema owner or a member of it – use ottimo_app (erd 2.1)`,
    );
  }
}

/**
 * Production: the fake clock must be impossible – CLOCK_MODE is checked by config.ts, and the shared
 * dev_clock table must be empty (SR-SECR-05, ADR-008). An unmigrated schema is also fatal in production.
 */
export async function assertProductionClock(pool: Pool, appEnv: AppEnv): Promise<void> {
  if (appEnv !== 'production') return;
  try {
    const { rows } = await pool.query<{ n: number }>('SELECT count(*)::int AS n FROM dev_clock');
    if ((rows[0]?.n ?? 0) > 0) {
      throw new StartupCheckError('dev_clock has a row in production – fake time is forbidden');
    }
  } catch (err) {
    if (pgCode(err) === '42P01') {
      throw new StartupCheckError('schema not migrated (dev_clock missing) – run db:migrate first');
    }
    throw err;
  }
}
