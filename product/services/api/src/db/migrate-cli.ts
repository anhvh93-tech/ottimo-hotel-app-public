/**
 * `pnpm db:migrate` (dev, ts-node) / `node dist/db/migrate-cli.js` (image): apply pending migrations.
 * Reads only MIGRATION_DATABASE_URL (or MIGRATION_DATABASE_URL_FILE) – never DATABASE_URL.
 */
import { resolveFileSecrets } from '../config';
import { runMigrations } from './migrate';

async function main(): Promise<void> {
  const env = resolveFileSecrets(process.env);
  const url = env.MIGRATION_DATABASE_URL ?? '';
  if (!url) throw new Error('MIGRATION_DATABASE_URL is required (role ottimo_migrator)');
  await runMigrations(url);
  console.log(JSON.stringify({ level: 'info', msg: 'migrations applied' }));
}

main().catch((err: unknown) => {
  // Message only: pg errors do not include the password; never print the URL.
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
