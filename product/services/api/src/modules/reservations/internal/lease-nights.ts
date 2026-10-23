/**
 * A7-01 (ARC `openapi-0.3.7.md` 16.21, US-017 AC5a; DATA Q-10, BR-215, BR-209, BR-210): the nights of a MANUAL
 * long stay (`external_contract`, `manual_long_stay`) in `stay_night` – Q-02, one source of nights for the KPIs.
 * - `stay_type = long`, `rate_source = lease_allocation`, `calendar_rate_vnd` NULL, no discount (DOM D-A7-1: a
 *   departure on start + n months − 1 day = n whole months; D-A7-2: odd days rounded to the nearest 1.000);
 *   `room_revenue_gross_vnd = room_revenue_vnd` = the Q-10 allocation of `monthly_rent_vnd`: each CONTRACT month
 *   k = [arrival + (k−1) months, arrival + k months) (BR-209, from the arrival – never chained) split over its
 *   nights, whole đồng, the remainder on the last night of the month (Σ month = rent); the nights after the last
 *   whole contract month are odd days at the nightly equivalent (BR-210: rent ÷ `long_stay_daily_divisor`).
 * - **Not money**: a lease night never makes a folio line (the rent is posted by hand – contract
 *   `extendStay.nightlyRates`, "no room line"). Every money reader of `stay_night` in this module leaves
 *   `lease_allocation` out (`confirmedStay`, `liveNightRows`, `liveNights`, `nightFees`, the move planner).
 * One writer (`syncLeaseNights`): B2, B7, B12, B13, B14, K12 and the back-fill job call it after their own
 * writes; B16 / cancellation / no-show void nights as for any booking.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { type LocalDate, addDays } from '../../../shared/time';
import { nightDates } from '../public/pricing';
import { type ReservationRow, activeSegments } from './reservation-store';

export const LEASE_RATE_SOURCE = 'lease_allocation';

/** Calendar months from `date` (end of month clamped: 31/01 + 1 → 28/02 – BR-209). */
function plusMonths(date: LocalDate, months: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/**
 * Q-10: the amount of every night of [arrival, departure) – whole contract months split (remainder on the
 * month's last night), then the odd days at `oddNightVnd`.
 */
export function leaseNightAmounts(
  arrival: LocalDate,
  departure: LocalDate,
  monthlyRentVnd: number,
  oddNightVnd: number,
): Array<{ date: LocalDate; amountVnd: number }> {
  const out: Array<{ date: LocalDate; amountVnd: number }> = [];
  let start = arrival;
  for (let k = 1; start < departure; k += 1) {
    let end = plusMonths(arrival, k);
    // DOM D-A7-1 (BR-102, BR-215, 19/10): a departure one day before the month mark (start + n months − 1 day)
    // still counts n whole contract months – the last one split over its own nights (OTM-0108: 29 nights,
    // 324.482 × 28 + 324.504). Any other short end: the nights after the last mark are odd days (BR-210).
    if (end > departure && addDays(departure, 1) === end) end = departure;
    if (end > departure) {
      for (const date of nightDates(start, departure)) out.push({ date, amountVnd: oddNightVnd });
      break;
    }
    const dates = nightDates(start, end);
    const per = Math.floor(monthlyRentVnd / dates.length);
    dates.forEach((date, i) =>
      out.push({
        date,
        amountVnd: i === dates.length - 1 ? monthlyRentVnd - per * (dates.length - 1) : per,
      }),
    );
    start = end;
  }
  return out;
}

const LIVE_STATES = ['confirmed', 'in_house', 'checked_out'];

/**
 * Brings the lease nights of a manual long stay in line with its dates and segments (idempotent): missing
 * nights inserted (`sold`), amount / room / segment corrected, nights outside [arrival, departure) voided
 * (`date_change`). Any other booking, or a manual long stay not confirmed yet / closed: nothing.
 * Returns the number of rows written.
 */
export async function syncLeaseNights(
  tx: Tx,
  row: Pick<
    ReservationRow,
    | 'id'
    | 'status'
    | 'external_contract'
    | 'manual_long_stay'
    | 'channel_id'
    | 'arrival_date'
    | 'departure_date'
  >,
  now: Date,
  oddNightVnd: (monthlyRentVnd: number) => number,
): Promise<number> {
  if (!row.external_contract || !LIVE_STATES.includes(row.status)) return 0;
  const rent = (row.manual_long_stay as { monthly_rent_vnd?: number } | null)?.monthly_rent_vnd;
  if (!rent || rent <= 0) return 0;
  const want = leaseNightAmounts(row.arrival_date, row.departure_date, rent, oddNightVnd(rent));
  const segs = await activeSegments(tx, row.id);
  const segOf = (d: LocalDate) => segs.find((s) => s.from_date <= d && d < s.to_date) ?? null;
  const { rows: have } = await tx.query<{
    id: string;
    date: string;
    room_id: string | null;
    seg: string | null;
    gross: string;
  }>(
    `SELECT id, stay_date::text AS date, room_id, reservation_segment_id AS seg,
            room_revenue_gross_vnd::text AS gross
       FROM stay_night
      WHERE reservation_id = $1 AND night_state <> 'void' AND rate_source = $2`,
    [row.id, LEASE_RATE_SOURCE],
  );
  const byDate = new Map(have.map((n) => [n.date, n]));
  let written = 0;
  for (const w of want) {
    const seg = segOf(w.date);
    const n = byDate.get(w.date);
    if (!n) {
      await tx.query(
        `INSERT INTO stay_night (id, organization_id, property_id, reservation_id, reservation_segment_id, room_id,
           stay_date, night_state, room_revenue_gross_vnd, discount_vnd, room_revenue_vnd, sold_at,
           is_complimentary, rate_source, channel_id, stay_type, created_at, updated_at, calendar_rate_vnd,
           reference_rate_vnd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'sold', $8, 0, $8, $9, false, $10, $11, 'long', $9, $9, NULL, $8)`,
        [
          uuidv7(),
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          row.id,
          seg?.id ?? null,
          seg?.room_id ?? null,
          w.date,
          w.amountVnd,
          now,
          LEASE_RATE_SOURCE,
          row.channel_id,
        ],
      );
      written += 1;
      continue;
    }
    byDate.delete(w.date);
    if (
      Number(n.gross) !== w.amountVnd ||
      n.room_id !== (seg?.room_id ?? null) ||
      n.seg !== (seg?.id ?? null)
    ) {
      await tx.query(
        `UPDATE stay_night SET room_revenue_gross_vnd = $2::bigint, room_revenue_vnd = $2::bigint - discount_vnd,
                reference_rate_vnd = $2::bigint, room_id = $3, reservation_segment_id = $4, updated_at = $5
          WHERE id = $1`,
        [n.id, w.amountVnd, seg?.room_id ?? null, seg?.id ?? null, now],
      );
      written += 1;
    }
  }
  const stale = [...byDate.values()].map((n) => n.id);
  if (stale.length > 0) {
    await tx.query(
      `UPDATE stay_night SET prev_state = night_state, night_state = 'void', voided_at = $2,
              void_reason = 'date_change', updated_at = $2
        WHERE id = ANY($1::uuid[])`,
      [stale, now],
    );
    written += stale.length;
  }
  return written;
}

/** DATA / OPS check (16.21): Σ lease nights of each contract month = the monthly rent (whole months only). */
export function contractMonthTotals(
  arrival: LocalDate,
  nights: ReadonlyArray<{ date: LocalDate; amountVnd: number }>,
): Array<{ from: LocalDate; to: LocalDate; totalVnd: number }> {
  const out: Array<{ from: LocalDate; to: LocalDate; totalVnd: number }> = [];
  const last = nights[nights.length - 1]?.date;
  if (!last) return out;
  for (let k = 1; ; k += 1) {
    const from = plusMonths(arrival, k - 1);
    const to = plusMonths(arrival, k);
    if (from > last) break;
    out.push({
      from,
      to,
      totalVnd: nights
        .filter((n) => n.date >= from && n.date < to)
        .reduce((a, n) => a + n.amountVnd, 0),
    });
    if (to > addDays(last, 1)) break;
  }
  return out;
}
