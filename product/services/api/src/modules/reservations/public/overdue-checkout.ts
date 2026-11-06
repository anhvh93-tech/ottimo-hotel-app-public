/**
 * V5-15 – check-out of a stay past its departure ("Trả phòng quá ngày đi"): OpenAPI 0.3.13 `checkOut` (bổ sung 1,
 * bổ sung 1d), contract 0.3.13 1.4 + 1.18, DOM rules-v1.0.5 7.1 (a), BR-421 v0.5.7, BR-433 / ESC-007 A.
 *
 * One definition for B18 (`checkOut` and its `lateFeeInsteadOfNight` precheck), the check-out VietQR cap
 * (`createVietQr purpose = check_out`), `getCheckoutSummary` and `Reservation.allowedActions`:
 * - overdue = the business day NOW is after the EFFECTIVE departure of the stay (`stayDepartureDate` – primary +
 *   extension children in force, BR-422; BE C0313-09). The post-midnight window (business day = departure − 1) and
 *   the departure business day itself are not overdue.
 * - `nightsNotBilled` = business day at the click (server clock – `dryRun` and previews too) − effective departure.
 *   Never from `checkoutAt`: that is the time the recorder states, the very number under review (DOM 7.1, bổ sung 1d).
 * - roles: OWN always; MGR while `nightsNotBilled` ≤ 1 (a manager waives at most one night's price per time –
 *   ESC-007 A; a constant, not a parameter – a new key needs a migration); FDL/FD never. An account with several
 *   roles passes when one role does (union, as `x-roles`).
 * - refusal: 403 FORBIDDEN_ACTION – MGR over the cap with ONLY `requiredRole: owner` and `nightsNotBilled`, FDL/FD
 *   without any extension member; `auditReason` OVERDUE_CHECKOUT_DENIED so the controller writes one
 *   `access.denied` after the rollback (SEC ARC-02, H-01…H-04, H-09).
 * Pure functions: no I/O, no clock – the callers pass the business day they computed.
 */
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';

/** BR-433 / ESC-007 A (DOM 7.1 (a)): the most nights a manager records as not billed on an overdue check-out. */
export const MGR_OVERDUE_MAX_NIGHTS = 1;

/** `ProblemError.options.auditReason` of the 403 of this path (written as `access.denied.reason`). */
export const OVERDUE_CHECKOUT_DENIED = 'OVERDUE_CHECKOUT';

function dayNumber(d: LocalDate): number {
  return Math.round(Date.parse(`${d}T00:00:00Z`) / 86_400_000);
}

/** Business day `today` is after the effective departure (outside the post-midnight window by construction). */
export function isOverdue(today: LocalDate, stayDepartureDate: LocalDate): boolean {
  return today > stayDepartureDate;
}

/** Nights the room stood "in house" past the departure without being billed (≥ 1 when overdue, else 0). */
export function nightsNotBilled(today: LocalDate, stayDepartureDate: LocalDate): number {
  return Math.max(0, dayNumber(today) - dayNumber(stayDepartureDate));
}

/** OWN always; MGR while `nights` ≤ MGR_OVERDUE_MAX_NIGHTS; nobody else (union of the caller's roles). */
export function canCheckOutOverdue(roles: readonly string[], nights: number): boolean {
  if (roles.includes('owner')) return true;
  return roles.includes('manager') && nights <= MGR_OVERDUE_MAX_NIGHTS;
}

/**
 * The role gate of the overdue path – called before the body is read (contract order: Idempotency-Key → booking
 * without a lock → this → body, locks, money). Throws the contract's 403; returns when the caller may go on.
 */
export function assertOverdueCheckoutRole(roles: readonly string[], nights: number): void {
  if (canCheckOutOverdue(roles, nights)) return;
  if (roles.includes('manager')) {
    throw problem('FORBIDDEN_ACTION', {
      extras: { requiredRole: 'owner', nightsNotBilled: nights },
      auditReason: OVERDUE_CHECKOUT_DENIED,
    });
  }
  throw problem('FORBIDDEN_ACTION', { auditReason: OVERDUE_CHECKOUT_DENIED });
}
