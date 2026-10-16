import { Pool, type PoolConfig, types } from 'pg';

/**
 * int8 → number, refusing values beyond 2^53 instead of silently losing precision
 * (money is integer VND – coding-standards 4.2a, ADR-002).
 */
export function parseSafeBigint(value: string): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new RangeError('int8 value exceeds Number.MAX_SAFE_INTEGER');
  return n;
}

types.setTypeParser(20, parseSafeBigint);

/** Pool for the application role (DATABASE_URL = ottimo_app). */
export function createPool(connectionString: string, extra: PoolConfig = {}): Pool {
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    ...extra,
  });
  // An idle client error must not crash the process; the next checkout gets a new client.
  pool.on('error', () => undefined);
  return pool;
}
