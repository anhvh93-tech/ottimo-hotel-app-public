/**
 * Migration runner (erd 16 point 5): a separate step before a new api starts. Logs in as
 * ottimo_migrator (MIGRATION_DATABASE_URL) and runs every migration after SET ROLE ottimo_owner, so the
 * objects are owned by the NOLOGIN owner and the role switch is visible in the PostgreSQL log.
 * The api/worker never migrate. Forward-only; applied files are tracked in drizzle.__drizzle_migrations.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

/** Arbitrary constant: serialises concurrent migrate runs (two deploys, CI retries). */
const MIGRATION_LOCK_KEY = 72_310_016;

/**
 * FB-INV-012 contract §12.6 (QC condition 10, OPS §18.3): a migration never waits forever on a table lock held by the
 * running api (ALTER TABLE takes ACCESS EXCLUSIVE). After the advisory lock (two deploys still wait for each other)
 * every statement of the migrate transaction waits at most this long for a lock; then Postgres raises 55P03
 * lock_not_available, the whole transaction rolls back (no file recorded in __drizzle_migrations), the process exits
 * ≠ 0 and deploy.sh stops before replacing the containers. Override: env MIGRATION_LOCK_TIMEOUT = "<1–120>s".
 */
export const MIGRATION_LOCK_TIMEOUT = '10s';

/** `MIGRATION_LOCK_TIMEOUT` from the environment (`^\d{1,3}s$`, 1–120 s) or the default; anything else throws. */
export function migrationLockTimeout(
  raw: string | undefined = process.env.MIGRATION_LOCK_TIMEOUT,
): string {
  if (raw === undefined || raw === '') return MIGRATION_LOCK_TIMEOUT;
  const m = /^(\d{1,3})s$/.exec(raw);
  const seconds = m ? Number(m[1]) : NaN;
  if (!m || seconds < 1 || seconds > 120) {
    throw new Error('MIGRATION_LOCK_TIMEOUT must be 1s–120s (e.g. "10s")');
  }
  return `${seconds}s`;
}

/** The lock wait ran out (55P03): the message names the pending migration and says to retry off-peak. */
export class MigrationLockTimeoutError extends Error {
  constructor(pending: string | null, timeout: string) {
    super(
      `migration ${pending ?? '(unknown)'} could not take a table lock within ${timeout} (55P03 lock_not_available) – ` +
        'nothing was applied; retry off-peak',
    );
    this.name = 'MigrationLockTimeoutError';
  }
}

export const MIGRATIONS_FOLDER = join(__dirname, 'migrations');

export async function runMigrations(
  migrationDatabaseUrl: string,
  migrationsFolder: string = MIGRATIONS_FOLDER,
  opts: { lockTimeout?: string } = {},
): Promise<void> {
  const lockTimeout = migrationLockTimeout(opts.lockTimeout);
  const client = new Client({ connectionString: migrationDatabaseUrl });
  await client.connect();
  try {
    const who = await client.query<{ user: string; rolsuper: boolean }>(
      'SELECT current_user AS user, rolsuper FROM pg_roles WHERE rolname = current_user',
    );
    const login = who.rows[0];
    if (!login || login.rolsuper) {
      throw new Error('MIGRATION_DATABASE_URL must use ottimo_migrator, not a superuser (erd 2.1)');
    }
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
    try {
      await client.query('SET ROLE ottimo_owner');
      await client.query("SET TIME ZONE 'UTC'");
      // §12.6: after the advisory lock, before migrate (the value is validated above – never user text in SQL).
      await client.query(`SET lock_timeout = '${lockTimeout}'`);
      try {
        await migrate(drizzle(client), { migrationsFolder, migrationsSchema: 'drizzle' });
      } catch (err) {
        if (pgCode(err) === '55P03') {
          throw new MigrationLockTimeoutError(
            await firstPending(client, migrationsFolder),
            lockTimeout,
          );
        }
        throw err;
      }
      await client.query('RESET lock_timeout');
      await client.query('RESET ROLE');
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
    }
  } finally {
    await client.end();
  }
}

function pgCode(err: unknown): string | undefined {
  let e: unknown = err;
  for (let i = 0; i < 3 && e && typeof e === 'object'; i++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === 'string') return code;
    e = (e as { cause?: unknown }).cause;
  }
  return undefined;
}

/** Tag of the first journal entry newer than the last applied migration (for the error message only). */
async function firstPending(client: Client, migrationsFolder: string): Promise<string | null> {
  try {
    const journal = JSON.parse(
      readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8'),
    ) as { entries: Array<{ when: number; tag: string }> };
    const { rows } = await client.query<{ created_at: string | null }>(
      'SELECT max(created_at)::text AS created_at FROM drizzle.__drizzle_migrations',
    );
    const last = Number(rows[0]?.created_at ?? 0);
    return journal.entries.find((e) => e.when > last)?.tag ?? null;
  } catch {
    return null;
  }
}
