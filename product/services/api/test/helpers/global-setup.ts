import { join } from 'node:path';
import { runMigrations } from '../../src/db/migrate';

/** Migrate the test DB once (forward-only, idempotent). Skipped when no database is configured. */
export default async function setup(): Promise<void> {
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url || !process.env.DATABASE_URL) return;
  await runMigrations(url, join(__dirname, '..', '..', 'src', 'db', 'migrations'));
}
