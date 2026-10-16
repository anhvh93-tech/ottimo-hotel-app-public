/**
 * Reservation jobs (architecture 9.1 – job keys as in the table: J1 `hold.expire`, J9 `ooo.activate`;
 * FB-R2-ARC-BE-S2-03, BUG-R2-021) – registered by the reservations module (api and the test-support job
 * endpoint) and by the worker.
 *
 * - `hold.expire` (J1, B6, BR-303, US-085): every tick. Exactly once per hold is guaranteed by the ROW
 *   conditions, not by a slot: `status = 'hold' AND hold_expires_at <= $now … FOR UPDATE SKIP LOCKED`,
 *   re-checked under the lock, so overlapping or repeated runs never cancel a hold twice; a late run still
 *   cancels (catch-up); a hold with money received is not cancelled but pushed (DOM D-9).
 * - `ooo.activate` (J9, O2): planned OOO blocks whose start date has come become active.
 * Time comes from the injected Clock through JobRunner (`ctx.now`), never from SQL now(); the business date
 * uses `business_day_rollover` through ParameterService (BR-010, 06:00) – a missing parameter is an error,
 * never a guess (FB-R2-ARC-BE-S2-08).
 */
import type { Tx } from '../db/database';
import type { ParameterService } from '../modules/platform/public/parameter.service';
import { type LocalTime, businessDate } from '../shared/time';
import type { JobDefinition } from './job-runner';

export const HOLD_EXPIRY_JOB_KEY = 'hold.expire';
export const ROOM_BLOCK_ACTIVATION_JOB_KEY = 'ooo.activate';

export interface HoldExpirer {
  expireHolds(
    tx: Tx,
    now: Date,
    tz: string,
    today: string,
  ): Promise<{ expired: number; keptPaid: number; failed: number }>;
}

export interface BlockActivator {
  activateDue(tx: Tx, today: string, now: Date): Promise<number>;
}

async function today(
  params: ParameterService,
  tx: Tx,
  now: Date,
  tz: string,
  local: string,
): Promise<string> {
  const rollover = await params.get<LocalTime>(tx, 'business_day_rollover', local);
  return businessDate(now, tz, rollover);
}

export function holdExpiryJob(expirer: HoldExpirer, params: ParameterService): JobDefinition {
  return {
    key: HOLD_EXPIRY_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      const d = await today(params, tx, ctx.now, ctx.timezone, ctx.date);
      return { ...(await expirer.expireHolds(tx, ctx.now, ctx.timezone, d)) };
    },
  };
}

export function roomBlockActivationJob(
  activator: BlockActivator,
  params: ParameterService,
): JobDefinition {
  return {
    key: ROOM_BLOCK_ACTIVATION_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      const d = await today(params, tx, ctx.now, ctx.timezone, ctx.date);
      return { activated: await activator.activateDue(tx, d, ctx.now) };
    },
  };
}
