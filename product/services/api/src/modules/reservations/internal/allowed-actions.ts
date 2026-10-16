/**
 * `Reservation.allowedActions` (US-020 AC2, EP02 spec 5.2): the transitions valid for the CURRENT state AND
 * the caller's roles. The server re-checks everything when the action is called; this list only drives the
 * buttons. Event/transition codes from state-machines.md section 18; `action` = path segment.
 */
import type { ChannelGroup, ReservationStatus } from '../../../db/schema';
import type { LocalDate } from '../../../shared/time';

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
  today: LocalDate;
  holdExpired: boolean;
  holdExtendedCount: number;
  /** Booking created/closed by the caller (SAL/CTV scope `own`). */
  own: boolean;
  /** now ≥ no_show_mark_time on the arrival day (BR-311). */
  noShowMarkable: boolean;
  /** BR-315: still the business day of the arrival night and the room is free. */
  restoreWithinRules: boolean;
  rescheduleCount: number;
  rescheduleMaxTimes: number;
}

export function allowedActions(roles: readonly string[], c: ActionContext): AllowedAction[] {
  const fd = hasAny(roles, FD_PLUS);
  const mgr = hasAny(roles, MGR_PLUS);
  const sal = roles.includes('sales_staff') && c.own;
  const ctv = roles.includes('collaborator') && c.own;
  const out: AllowedAction[] = [];
  switch (c.status) {
    case 'hold':
      if (fd || sal)
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
        out.push({ event: 'early_departure', transition: 'B16', action: 'early-departure' });
        if (c.today === c.departureDate) {
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
