/**
 * Migration runner (erd 16 point 5): a separate step before a new api starts. Logs in as
 * ottimo_migrator (MIGRATION_DATABASE_URL) and runs every migration after SET ROLE ottimo_owner, so the
 * objects are owned by the NOLOGIN owner and the role switch is visible in the PostgreSQL log.
 * The api/worker never migrate. Forward-only; applied files are tracked in drizzle.__drizzle_migrations.
 */
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';

/** Arbitrary constant: serialises concurrent migrate runs (two deploys, CI retries). */
const MIGRATION_LOCK_KEY = 72_310_016;

export const MIGRATIONS_FOLDER = join(__dirname, 'migrations');

export async function runMigrations(
  migrationDatabaseUrl: string,
  migrationsFolder: string = MIGRATIONS_FOLDER,
): Promise<void> {
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
      await migrate(drizzle(client), { migrationsFolder, migrationsSchema: 'drizzle' });
      await client.query('RESET ROLE');
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
    }
  } finally {
    await client.end();
  }
}
