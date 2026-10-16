/**
 * dev_clock storage for MutableClock (ADR-008): one row shared by api and worker, NOTIFY clock_changed on
 * every write, a dedicated LISTEN connection outside the pool that reconnects with capped back-off
 * (erd 2.5: max 30 s) and refetches after reconnecting.
 * dev_clock is a documented RLS exception (no tenant data), so no tenant context is needed here.
 */
import { Client, type Pool } from 'pg';
import type { ClockState, ClockStateStore } from '../clock';
import { pgCode } from './database';

export const CLOCK_CHANNEL = 'clock_changed';

export class PgClockStore implements ClockStateStore {
  constructor(
    private readonly pool: Pool,
    private readonly listenUrl: string,
    private readonly log: (msg: string) => void = () => undefined,
  ) {}

  async load(): Promise<ClockState | null> {
    try {
      const { rows } = await this.pool.query<{ offset_ms: number; frozen_at: Date | null }>(
        'SELECT offset_ms, frozen_at FROM dev_clock WHERE id = 1',
      );
      const row = rows[0];
      return row ? { offsetMs: Number(row.offset_ms), frozenAt: row.frozen_at } : null;
    } catch (err) {
      // Schema not migrated yet (fresh dev stack): behave as system time instead of failing requests.
      if (pgCode(err) === '42P01') return null;
      throw err;
    }
  }

  async save(state: ClockState | null): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (state) {
        await client.query(
          `INSERT INTO dev_clock (id, offset_ms, frozen_at, updated_at) VALUES (1, $1, $2, now())
           ON CONFLICT (id) DO UPDATE SET offset_ms = EXCLUDED.offset_ms, frozen_at = EXCLUDED.frozen_at,
                                          updated_at = EXCLUDED.updated_at`,
          [state.offsetMs, state.frozenAt],
        );
      } else {
        await client.query('DELETE FROM dev_clock');
      }
      await client.query(`SELECT pg_notify('${CLOCK_CHANNEL}', '')`);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  async subscribe(onChange: () => void): Promise<() => Promise<void>> {
    let client: Client | null = null;
    let stopped = false;
    let delay = 1_000;
    let timer: NodeJS.Timeout | null = null;

    const connect = async (): Promise<void> => {
      if (stopped) return;
      const c = new Client({ connectionString: this.listenUrl });
      c.on('error', () => undefined);
      c.on('notification', (n) => {
        if (n.channel === CLOCK_CHANNEL) onChange();
      });
      c.on('end', () => {
        if (stopped) return;
        client = null;
        schedule();
      });
      try {
        await c.connect();
        await c.query(`LISTEN ${CLOCK_CHANNEL}`);
        client = c;
        delay = 1_000;
        onChange(); // refetch after (re)connecting: a NOTIFY may have been missed
      } catch {
        await c.end().catch(() => undefined);
        schedule();
      }
    };
    const schedule = (): void => {
      if (stopped || timer) return;
      this.log(`clock LISTEN connection lost, retrying in ${delay} ms`);
      timer = setTimeout(() => {
        timer = null;
        void connect();
      }, delay);
      delay = Math.min(delay * 2, 30_000);
    };

    await connect();
    return async () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      await (client as Client | null)?.end().catch(() => undefined);
    };
  }
}
