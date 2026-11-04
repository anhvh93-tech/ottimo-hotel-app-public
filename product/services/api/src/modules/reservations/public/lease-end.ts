/**
 * v1.0.4 P4-11 – `manualLongStay.leaseEndDate` (ARC plan v1.0.4 decision 6.1; FB-R4-DOM-FE-A-01 rest + FB-R4-DOM-BE-A-04).
 *
 * The end date of the paper lease of a manual long stay (US-017 AC5a). B13 on such a booking moves
 * `reservation.departure_date` itself (no child booking), so after B13 the departure is no longer the lease end.
 * The lease end is therefore frozen at check-in: B9/B9a write the key `lease_end_date` (= `departure_date` at that
 * moment) into the jsonb `reservation.manual_long_stay`, in the check-in transaction; B17 (undo check-in) removes it.
 * No column, no migration; B13/B16 never touch the key.
 *
 * Read order (one definition for the DTO and the B16 rule – `frontdesk/public/stay-rules.ts` earlyDepartureRuleOf):
 * 1. the key `lease_end_date` in `manual_long_stay`;
 * 2. not checked in yet (`actual_checkin_at` null) → `departure_date`;
 * 3. otherwise (checked in before v1.0.4, no key) → `booked_departure_date`, else `departure_date`.
 * Known limit (ARC 6.1) – empty in practice: B7 `move` refuses new dates on a manual long stay (`prepareMove`) and
 * PATCH has no date field, so before check-in `departure_date` = `booked_departure_date`. OPS still runs the runbook
 * count (rounds/round-04/outputs/BE/v104-be-lease-prices.md).
 *
 * Plain function, no I/O – the front desk (B16) and the reservation DTO import it.
 */
import type { LocalDate } from '../../../shared/time';

/** The jsonb key in `reservation.manual_long_stay` (snake_case like the other keys of that object). */
export const LEASE_END_DATE_KEY = 'lease_end_date';

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface LeaseEndSource {
  stay_type: 'short' | 'long';
  external_contract: boolean;
  manual_long_stay: Record<string, unknown> | null;
  actual_checkin_at: Date | null;
  departure_date: LocalDate;
  booked_departure_date?: LocalDate | null;
}

/** Lease end of a manual long stay; null for any other booking (short stay, long stay without manual data). */
export function leaseEndDateOf(row: LeaseEndSource): LocalDate | null {
  if (row.stay_type !== 'long' || !row.external_contract || !row.manual_long_stay) return null;
  const stored = row.manual_long_stay[LEASE_END_DATE_KEY];
  if (typeof stored === 'string' && LOCAL_DATE.test(stored)) return stored;
  if (row.actual_checkin_at === null) return row.departure_date;
  return row.booked_departure_date ?? row.departure_date;
}
