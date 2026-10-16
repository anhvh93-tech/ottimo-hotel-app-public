/**
 * `pnpm seed:ds-e [--file <ds-e.json>] [--allow-code-drift]` – load DS-E into a freshly migrated DB.
 * Needs DATABASE_URL (ottimo_app), QA_SEED_PASSWORD, APP_ENV ≠ production. Prints a JSON report; device
 * tokens go to tests/fixtures/seed/.out/ds-e.map.json (gitignored, 0600) – never to stdout.
 */
import { MutableClock, SystemClock, type Clock } from '../../clock';
import { resolveFileSecrets } from '../../config';
import { PgClockStore } from '../clock-store';
import { Database, pgCode } from '../database';
import { createPool } from '../pool';
import { assertSafeDbRole } from '../startup-checks';
import { DEFAULT_FIXTURE, DEFAULT_OUT_DIR, readFixture, seedDsE } from './ds-e';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const env = resolveFileSecrets(process.env);
  if (!env.APP_ENV || env.APP_ENV === 'production') {
    throw new Error('seed:ds-e runs only with APP_ENV=dev|test|staging (fake data)');
  }
  const url = env.DATABASE_URL ?? '';
  if (!url) throw new Error('DATABASE_URL (ottimo_app) is required');
  const password = env.QA_SEED_PASSWORD ?? '';
  if (!password) throw new Error('QA_SEED_PASSWORD is required (see product/.env.example)');
  const file = arg('--file') ?? DEFAULT_FIXTURE;

  const pool = createPool(url, { max: 2 });
  try {
    await assertSafeDbRole(pool);
    let clock: Clock = new SystemClock();
    if (env.CLOCK_MODE === 'mutable') {
      const m = new MutableClock(new PgClockStore(pool, url));
      await m.refresh(); // one read of dev_clock, no LISTEN for a one-shot tool
      clock = m;
    }
    const report = await seedDsE({
      database: new Database(pool),
      clock,
      fixture: readFixture(file),
      password,
      allowCodeDrift: process.argv.includes('--allow-code-drift'),
      outDir: DEFAULT_OUT_DIR(file),
    });
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    if (pgCode(err) === '23505') {
      throw new Error(
        'DS-E is already loaded in this database (load it into a freshly migrated DB)',
      );
    }
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
