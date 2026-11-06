/**
 * `rate_limit_counter` (migration 0086, erd 4.14) – the ONE atomic UPSERT of the PostgreSQL fixed-window counters
 * (SEC 07/11 on BE C0313-24 "no copy of the SQL in a second module"; ARC contract 0.3.13 1.26: a shared function,
 * the caller picks the transaction). Callers:
 * - public-site (SR-RL-11, `PublicBookingService.bumpAt`) – inside its request transaction;
 * - identity `CallerPasswordMatch` (SR-RL-15, `setPropertyWifi`) – in its OWN transaction, committed before the
 *   comparison and before any 422.
 * No RLS on the table: a bucket key holds a limit code and HMACs/ids only (`webreq:ip:<hmac>:h`,
 * `wifi_pw_cmp:<user_id>`), never an IP, phone, e-mail or name. `public_site.cleanup` deletes rows whose
 * `expires_at` (= end of the window) has passed.
 */
import type { Tx } from '../db/database';

/** Count one event in the window starting at `windowStart`; returns the count including this one. */
export async function bumpRateLimitCounter(
  q: Pick<Tx, 'query'>,
  bucketKey: string,
  windowStart: Date,
  windowMs: number,
): Promise<number> {
  const { rows } = await q.query<{ count: number }>(
    `INSERT INTO rate_limit_counter (bucket_key, window_start, count, expires_at) VALUES ($1, $2, 1, $3)
     ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = rate_limit_counter.count + 1
     RETURNING count`,
    [bucketKey, windowStart, new Date(windowStart.getTime() + windowMs)],
  );
  return Number(rows[0]?.count ?? 0);
}
