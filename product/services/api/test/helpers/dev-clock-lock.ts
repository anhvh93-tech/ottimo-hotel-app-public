/**
 * S4-20 (BE-D Sprint 4): `dev_clock` is ONE row shared by every process on the database (ADR-008) – and vitest
 * runs test files in parallel workers. platform.test.ts (api ↔ worker NOTIFY) and http-foundation.test.ts
 * (test-support clock + "run a job now") both move it; when one moved it between the other's two job calls the
 * business date – hence the job slot – changed and `skipped_already_ran` came back `done` (flaky CI).
 * Every test that WRITES dev_clock, or needs it to stay still, runs its section under this cross-process lock
 * (PostgreSQL session advisory lock on a dedicated connection – no table, no grant needed).
 */
import { Client } from 'pg';

/** Arbitrary constant shared by the test files that touch dev_clock ("dev clock" in ASCII-ish hex). */
const DEV_CLOCK_LOCK_KEY = 0x0de7c10c;

export async function withDevClockLock<T>(fn: () => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [DEV_CLOCK_LOCK_KEY]);
    try {
      return await fn();
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [DEV_CLOCK_LOCK_KEY]);
    }
  } finally {
    await client.end();
  }
}
