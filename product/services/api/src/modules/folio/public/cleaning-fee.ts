/**
 * FB-INV-012 contract §12.4 (H3, BR-LS-07 / BR-506): the ONE price of an ad-hoc (extra) clean.
 * - A long stay (`reservation.stay_type = 'long'`) whose room on `onDate` is in `long_stay_cleaning_fee_by_room`
 *   (value in force on `onDate`) → that price, `source = 'long_stay_room'`;
 * - anything else (short stay, room not in the table, empty table, a broken stored value) → `adhoc_cleaning_fee`,
 *   `source = 'default'`. Short stays never read the table.
 * Readers: addFolioLine (`chargeCode = adhoc_cleaning_fee`), getChargeCatalog?folioId, the guest app's request
 * options (the price shown, snapshotted on the request and charged when the work is done).
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export const LONG_STAY_CLEANING_FEE_KEY = 'long_stay_cleaning_fee_by_room';
export const ADHOC_CLEANING_FEE_KEY = 'adhoc_cleaning_fee';

export type CleaningFeeSource = 'long_stay_room' | 'default';

/** What the price reads: one parameter value in force on a day, null when no row is in force. */
export type ParamOnDay = (key: string, day: LocalDate) => Promise<unknown>;

/** A stored table value for one room – a positive whole VND amount, else ignored (never fails the reader). */
export function roomPriceOf(table: unknown, roomNo: string | null): number | null {
  if (!roomNo || !table || typeof table !== 'object' || Array.isArray(table)) return null;
  const v = (table as Record<string, unknown>)[roomNo];
  return Number.isSafeInteger(v) && (v as number) > 0 ? (v as number) : null;
}

/**
 * Stay type of the booking and the room it holds on `onDate`: the segment containing `onDate`; none (a day outside
 * the stay) → the latest segment starting on or before `onDate`; none either (a day before the arrival) → the LAST
 * segment (ARC-BE-200-S1). A mid-stay room change therefore prices each clean by the room of its day.
 */
async function stayRoomOn(
  tx: Tx,
  reservationId: string,
  onDate: LocalDate,
): Promise<{ stayType: string; roomNo: string | null } | null> {
  const { rows } = await tx.query<{ stay_type: string; room_no: string | null }>(
    `SELECT r.stay_type, (
        SELECT rm.room_no FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
         WHERE s.reservation_id = r.id AND s.active
         ORDER BY (s.from_date <= $2::date AND $2::date < s.to_date) DESC,
                  (s.from_date <= $2::date) DESC, s.from_date DESC, s.id
         LIMIT 1) AS room_no
       FROM reservation r WHERE r.id = $1`,
    [reservationId, onDate],
  );
  const r = rows[0];
  return r ? { stayType: r.stay_type, roomNo: r.room_no } : null;
}

/**
 * §12.4 `cleaningFeeFor`. `feeVnd` null only when `adhoc_cleaning_fee` itself has no row in force (callers keep
 * their existing behaviour for that case: no catalogue item / no fee).
 */
export async function cleaningFeeFor(
  tx: Tx,
  param: ParamOnDay,
  input: { reservationId: string | null; onDate: LocalDate },
): Promise<{ feeVnd: number | null; source: CleaningFeeSource }> {
  if (input.reservationId) {
    const stay = await stayRoomOn(tx, input.reservationId, input.onDate);
    if (stay?.stayType === 'long') {
      const price = roomPriceOf(await param(LONG_STAY_CLEANING_FEE_KEY, input.onDate), stay.roomNo);
      if (price !== null) return { feeVnd: price, source: 'long_stay_room' };
    }
  }
  const fee = await param(ADHOC_CLEANING_FEE_KEY, input.onDate);
  return { feeVnd: typeof fee === 'number' ? fee : null, source: 'default' };
}
