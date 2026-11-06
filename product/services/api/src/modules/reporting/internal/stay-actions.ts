/**
 * `allowedActions` of a "Hôm nay" row (OpenAPI 0.3.7 B-20, BA E01-03): only the button the row may show –
 * `check_in` (B9) on an arrival, `check_out` (B18) on a departure – when the CALLER can do it NOW. Empty = the
 * row only opens the booking. The server still checks everything when the action is called (409/422).
 *
 * Same rules as `Reservation.allowedActions` of the reservations module (internal/allowed-actions.ts – a
 * parity test keeps them aligned), including the post-midnight check-out window of B18 (0.3.7: "gồm cửa sổ sau
 * nửa đêm" – business date = departure − 1 while the calendar date is the departure day, DOM S3-9). 0.3.13 (V5-10):
 * both read that window from shared/business-day.ts; `departureDate` is the stay's effective departure.
 */
import { isCheckoutDay } from '../../../shared/business-day';
import type { LocalDate } from '../../../shared/time';

export interface RowAction {
  event: string;
  transition: string;
  action: string;
  requiresTrustedDevice?: boolean;
}

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const fdPlus = (roles: readonly string[]) => roles.some((r) => FD_PLUS.includes(r));

export function checkInAction(
  roles: readonly string[],
  b: {
    status: string;
    conflictState: string;
    capacityConflict: boolean;
    arrivalDate: LocalDate;
    today: LocalDate;
  },
): RowAction[] {
  if (!fdPlus(roles) || b.status !== 'confirmed') return [];
  if (b.conflictState === 'open' || b.capacityConflict || b.today !== b.arrivalDate) return [];
  return [{ event: 'check_in', transition: 'B9', action: 'check-in', requiresTrustedDevice: true }];
}

export function checkOutAction(
  roles: readonly string[],
  b: { status: string; departureDate: LocalDate; today: LocalDate; calendarDate: LocalDate },
): RowAction[] {
  if (!fdPlus(roles) || b.status !== 'in_house') return [];
  // 0.3.13 (V5-10): the one clock rule of B18 (shared/business-day.ts – also `Reservation.allowedActions` and B18).
  if (!isCheckoutDay({ today: b.today, calendarDate: b.calendarDate }, b.departureDate)) return [];
  return [{ event: 'check_out', transition: 'B18', action: 'check-out' }];
}
