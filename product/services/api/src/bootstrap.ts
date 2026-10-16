/**
 * Process wiring shared by api and worker: config → pool → DB startup checks (G4) → Clock.
 */
import type { Pool } from 'pg';
import { type Clock, MutableClock, SystemClock } from './clock';
import { type AppConfig, loadConfig, resolveFileSecrets } from './config';
import { PgClockStore } from './db/clock-store';
import { Database } from './db/database';
import { createPool } from './db/pool';
import { assertProductionClock, assertSafeDbRole } from './db/startup-checks';

export interface Runtime {
  env: NodeJS.ProcessEnv;
  config: AppConfig;
  pool: Pool;
  database: Database;
  clock: Clock;
  shutdown(): Promise<void>;
}

export async function createRuntime(
  log: (msg: string) => void,
  processEnv: NodeJS.ProcessEnv = process.env,
): Promise<Runtime> {
  // Fails fast (exit 1) on weak/missing secrets, bad APP_ENV, TRUST_PROXY, clock/test settings.
  const env = resolveFileSecrets(processEnv);
  const config = loadConfig(env);
  const pool = createPool(config.databaseUrl);
  try {
    await assertSafeDbRole(pool); // superuser / BYPASSRLS / owner → refuse to run (erd 2.1, G4)
    await assertProductionClock(pool, config.appEnv);
  } catch (err) {
    await pool.end();
    throw err;
  }

  let clock: Clock = new SystemClock();
  let stopClock = async (): Promise<void> => undefined;
  if (config.clockMode === 'mutable') {
    const mutable = new MutableClock(
      new PgClockStore(pool, config.databaseUrl, log),
      new SystemClock(),
      1_000,
      (err) => log(`clock refresh failed: ${err instanceof Error ? err.message : String(err)}`),
    );
    await mutable.start();
    clock = mutable;
    stopClock = () => mutable.stop();
  }
  const database = new Database(pool);
  return {
    env,
    config,
    pool,
    database,
    clock,
    async shutdown() {
      await stopClock();
      await pool.end().catch(() => undefined);
    },
  };
}
