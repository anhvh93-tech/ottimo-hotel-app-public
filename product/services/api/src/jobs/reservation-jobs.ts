/**
 * Reservation jobs (architecture 9.1 J1; SM-01 B6, SM-02 O2) – registered by the reservations module (api and
 * the test-support job endpoint) and by the worker.
 *
 * - `reservation.hold_expiry` (J1, B6, BR-303, US-085): every tick. Exactly once per hold is guaranteed by the
 *   ROW conditions, not by a slot: `status = 'hold' AND hold_expires_at <= $now … FOR UPDATE SKIP LOCKED`,
 *   re-checked under the lock, so overlapping or repeated runs never cancel a hold twice; a late run still
 *   cancels (catch-up) and a hold whose deposit succeeded is left for the desk (US-085 AC4).
 * - `room_block.activation` (O2): planned OOO blocks whose start date has come become active.
 * Time comes from the injected Clock through JobRunner (`ctx.now`), never from SQL now().
 */
import type { Tx } from '../db/database';
import { businessDate } from '../shared/time';
import type { JobDefinition } from './job-runner';

export const HOLD_EXPIRY_JOB_KEY = 'reservation.hold_expiry';
export const ROOM_BLOCK_ACTIVATION_JOB_KEY = 'room_block.activation';

export interface HoldExpirer {
  expireHolds(
    tx: Tx,
    now: Date,
    tz: string,
    today: string,
  ): Promise<{ expired: number; keptPaid: number }>;
}

export interface BlockActivator {
  activateDue(tx: Tx, today: string, now: Date): Promise<number>;
}

/** Business date of the property (BR-010) from the rollover parameter. */
async function today(tx: Tx, now: Date, tz: string, local: string): Promise<string> {
  const { rows } = await tx.query<{ value: string }>(
    `SELECT value #>> '{}' AS value FROM config_parameter
      WHERE property_id = $1 AND key = 'business_day_rollover' AND effective_from <= $2
      ORDER BY effective_from DESC LIMIT 1`,
    [tx.ctx.propertyId, local],
  );
  return businessDate(now, tz, rows[0]?.value ?? '00:00');
}

export function holdExpiryJob(expirer: HoldExpirer): JobDefinition {
  return {
    key: HOLD_EXPIRY_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      const d = await today(tx, ctx.now, ctx.timezone, ctx.date);
      return expirer.expireHolds(tx, ctx.now, ctx.timezone, d);
    },
  };
}

export function roomBlockActivationJob(activator: BlockActivator): JobDefinition {
  return {
    key: ROOM_BLOCK_ACTIVATION_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      const d = await today(tx, ctx.now, ctx.timezone, ctx.date);
      return { activated: await activator.activateDue(tx, d, ctx.now) };
    },
  };
}
