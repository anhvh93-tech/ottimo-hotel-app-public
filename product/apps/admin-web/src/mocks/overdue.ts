// Dev/test only – never bundled (main.tsx imports mocks dynamically).
/**
 * V5-15 – check-out of a stay past its departure ("Trả phòng quá ngày đi"): the mock's copy of the server's pure rules
 * (services/api reservations/public/overdue-checkout.ts; OpenAPI 0.3.13 `checkOut` bổ sung 1, contract 1.4 + 1.18,
 * DOM rules-v1.0.5 7.1 (a)). One definition for `allowedActions`, the summary, B18 and the check-out VietQR:
 * - overdue = the business day now is after the EFFECTIVE departure (`stayDepartureDate` – child extensions included);
 * - `nightsNotBilled` = business day − effective departure (never from the `checkoutAt` the recorder states);
 * - OWN always; MGR while `nightsNotBilled` ≤ 1 (BR-433 / ESC-007 A – a constant); FDL/FD never;
 * - refusal: 403 FORBIDDEN_ACTION – MGR past the cap with ONLY `requiredRole: owner` and `nightsNotBilled`, FDL/FD with
 *   no extension member.
 */

/** BR-433 / ESC-007 A: the most nights a manager records as not billed on an overdue check-out. */
export const MGR_OVERDUE_MAX_NIGHTS = 1;

const dayNumber = (d: string) => Math.round(Date.parse(`${d}T00:00:00Z`) / 86_400_000);

/** Nights the room stood "in house" past the effective departure at `businessDay` (0 = not overdue). */
export function overdueNights(businessDay: string, stayDepartureDate: string): number {
  return Math.max(0, dayNumber(businessDay) - dayNumber(stayDepartureDate));
}

/** OWN always; MGR while `nights` ≤ 1; nobody else (union of the caller's roles, as `x-roles`). */
export function canCheckOutOverdue(roles: readonly string[], nights: number): boolean {
  if (roles.includes('owner')) return true;
  return roles.includes('manager') && nights <= MGR_OVERDUE_MAX_NIGHTS;
}

/** The 403 body extras of the overdue path, or `null` when the caller may go on. */
export function overdueRefusal(
  roles: readonly string[],
  nights: number,
): { extras: Record<string, unknown> } | null {
  if (canCheckOutOverdue(roles, nights)) return null;
  return roles.includes('manager')
    ? { extras: { requiredRole: 'owner', nightsNotBilled: nights } }
    : { extras: {} };
}
