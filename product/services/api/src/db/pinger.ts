import { Pool } from 'pg';

export const DB_PINGER = Symbol('DB_PINGER');

export interface DbPinger {
  /** Resolves true when the database answers SELECT 1 within the timeout. */
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

export class PgPinger implements DbPinger {
  private readonly pool: Pool;
  private closed = false;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 2,
      connectionTimeoutMillis: 2_000,
      idleTimeoutMillis: 10_000,
    });
    // Never crash the process on an idle client error; health will report db: down.
    this.pool.on('error', () => undefined);
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.pool.end();
  }
}
