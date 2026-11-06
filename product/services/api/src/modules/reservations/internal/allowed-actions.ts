/**
 * `Reservation.allowedActions` (US-020 AC2, EP02 spec 5.2): the transitions valid for the CURRENT state AND
 * the caller's roles. The server re-checks everything when the action is called; this list only drives the
 * buttons. Event/transition codes from state-machines.md section 18; `action` = path segment.
 */
import type { ChannelGroup, ReservationStatus } from '../../../db/schema';
import { isCheckoutDay } from '../../../shared/business-day';
import { type LocalDate, addDays } from '../../../shared/time';

export interface AllowedAction {
  event: string;
  transition: string;
  action: string;
  requiresApproval?: boolean;
  requiresTrustedDevice?: boolean;
}

export const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'] as const;
export const FDL_PLUS = ['owner', 'manager', 'front_desk_lead'] as const;
export const MGR_PLUS = ['owner', 'manager'] as const;

export const hasAny = (roles: readonly string[], set: readonly string[]): boolean =>
  roles.some((r) => set.includes(r));

export interface ActionContext {
  status: ReservationStatus;
  conflictState: 'none' | 'open' | 'resolved';
  /** A-20: OTA booking above capacity – check-in blocked (`capacity_within_max`). */
  capacityConflict?: boolean;
  channelGroup: ChannelGroup;
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** Business date (BR-010). */
  today: LocalDate;
  /**
   * 0.3.13 (V5-10, BE C0313-09): calendar date at the same instant – `check_out` from 00:00 of the departure day
   * (post-midnight window, BUG-R4-036). Absent = no window (calendar date = business date).
   */
  calendarDate?: LocalDate;
  holdExpired: boolean;
  holdExtendedCount: number;
  /**
   * v1.0.4 P4-10 (BUG-R3-042): money received on the hold's folio (`Reservation.depositPaidVnd`). Past the deadline,
   * B4 is offered only to FD+ and only when > 0 (BR-303 (1)); an unpaid overdue hold is not offered B4 (US-085 AC4 –
   * J1 cancels it). Absent = 0.
   */
  depositPaidVnd?: number;
  /** Booking created/closed by the caller (SAL/CTV scope `own`). */
  own: boolean;
  /** now ≥ no_show_mark_time on the arrival day (BR-311). */
  noShowMarkable: boolean;
  /** BR-315: still the business day of the arrival night and the room is free. */
  restoreWithinRules: boolean;
  rescheduleCount: number;
  rescheduleMaxTimes: number;
  /**
   * OpenAPI 0.3.9 add 1: departure of the whole stay (primary + extension children) – absent on a child booking.
   * B16 is offered only while a valid new departure exists: max(today, arrival + 1) < stayDepartureDate.
   */
  stayDepartureDate?: LocalDate;
}

/**
 * 0.3.13 (V5-10, BE C0313-09): B18 is offered on the stay's EFFECTIVE departure (`stayDepartureDate` – the primary
 * booking + its extension children, BR-422; absent on a child, which B18 refuses) at the business date or from 00:00 of
 * that calendar day – the shared rule of the server (shared/business-day.ts `isCheckoutDay`).
 */
export function checkOutOpen(c: ActionContext): boolean {
  if (!c.stayDepartureDate) return false;
  return isCheckoutDay(
    { today: c.today, calendarDate: c.calendarDate ?? c.today },
    c.stayDepartureDate,
  );
}

/** B16 new-departure window [max(today, arrival + 1), stayDepartureDate − 1] is not empty (same rule as the server). */
export function earlyDepartureOpen(c: ActionContext): boolean {
  if (!c.stayDepartureDate) return false;
  const next = addDays(c.arrivalDate, 1);
  const from = c.today > next ? c.today : next;
  return from < c.stayDepartureDate;
}

export function allowedActions(roles: readonly string[], c: ActionContext): AllowedAction[] {
  const fd = hasAny(roles, FD_PLUS);
  const mgr = hasAny(roles, MGR_PLUS);
  const sal = roles.includes('sales_staff') && c.own;
  const ctv = roles.includes('collaborator') && c.own;
  const out: AllowedAction[] = [];
  switch (c.status) {
    case 'hold':
      // Same rule as the server (deposits.service overdueHoldAccepts): past the deadline FD+ only, money received.
      if (c.holdExpired ? fd && (c.depositPaidVnd ?? 0) > 0 : fd || sal)
        out.push({ event: 'confirm_deposit', transition: 'B4', action: 'confirm-deposit' });
      if ((fd || sal || ctv) && c.holdExtendedCount === 0 && !c.holdExpired) {
        out.push({ event: 'extend_hold', transition: 'B3', action: 'extend-hold' });
      }
      if (fd || sal || ctv) out.push({ event: 'cancel_hold', transition: 'B5', action: 'cancel' });
      break;
    case 'confirmed':
      if (fd && c.conflictState === 'open') {
        out.push({ event: 'assign_room', transition: 'B7a', action: 'assign-room' });
      }
      if (fd && c.conflictState !== 'open' && !c.capacityConflict && c.today === c.arrivalDate) {
        out.push({
          event: 'check_in',
          transition: 'B9',
          action: 'check-in',
          requiresTrustedDevice: true,
        });
      }
      if (fd) out.push({ event: 'move', transition: 'B7', action: 'move' });
      if (
        mgr &&
        (c.channelGroup === 'direct' || c.channelGroup === 'agent') &&
        c.rescheduleCount < c.rescheduleMaxTimes
      ) {
        out.push({ event: 'postpone', transition: 'B8', action: 'move' });
      }
      if (fd || (sal && c.channelGroup === 'direct')) {
        out.push({ event: 'cancel', transition: 'B10', action: 'cancel' });
      }
      if (fd && c.noShowMarkable) {
        out.push({ event: 'mark_no_show', transition: 'B11', action: 'mark-no-show' });
      }
      break;
    case 'in_house':
      if (fd) {
        out.push({ event: 'extend_stay', transition: 'B13', action: 'extend' });
        out.push({ event: 'change_room', transition: 'B14', action: 'change-room' });
        out.push({ event: 'set_late_checkout', transition: 'B15', action: 'late-checkout' });
        if (earlyDepartureOpen(c)) {
          out.push({ event: 'early_departure', transition: 'B16', action: 'early-departure' });
        }
        if (checkOutOpen(c)) {
          out.push({ event: 'check_out', transition: 'B18', action: 'check-out' });
        }
      }
      if (mgr) out.push({ event: 'undo_check_in', transition: 'B17', action: 'undo-check-in' });
      break;
    case 'no_show':
      if (fd) {
        out.push({
          event: 'restore_no_show',
          transition: 'B12',
          action: 'restore-no-show',
          ...(!mgr && !c.restoreWithinRules ? { requiresApproval: true } : {}),
        });
      }
      break;
    default:
      break;
  }
  return out;
}
