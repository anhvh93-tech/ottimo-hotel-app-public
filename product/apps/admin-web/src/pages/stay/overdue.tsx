import { isApiError, type Reservation } from '@ottimo/api-client';
import type { Args } from '@ottimo/i18n';
import { api } from '../../app/api';
import { timeHHmm, todayLocal } from '../../app/dates';
import { useResource } from '../../hooks/useResource';

type T = (key: string, args?: Args) => string;

/**
 * V5-15 – check-out of a stay past its departure ("Trả phòng quá ngày đi", OpenAPI 0.3.13 `checkOut` bổ sung 1, contract
 * 1.4 + 1.18, DOM rules-v1.0.5 7.1, 15.3, 15.4, 15.7). Who may record it is the SERVER's answer – never guessed here
 * from the roles on the session:
 * - the booking offers `check_out` with `overdue: true` (`Reservation.allowedActions`) → the overdue box of H16;
 * - otherwise the summary's `nightsNotBilled` says whom the desk calls (1 → a manager, ≥ 2 → the owner);
 * - B18 answering 403 FORBIDDEN_ACTION with `requiredRole: owner` (a manager past the cap of 1 night) → the owner.
 */

/**
 * DOM 7.1 ý 1: the three suggested reasons; the server takes free text (3–500 characters). The first two fill the box
 * and leave the cursor at its end, to add how the time is known (DOM 145-04, UXD 145-05) – no comma added.
 */
export const OVERDUE_REASONS = [
  { value: 'no_notice', key: 'checkout.overdue_reason.no_notice', fills: true },
  { value: 'desk_forgot', key: 'checkout.overdue_reason.desk_forgot', fills: true },
  { value: 'other', key: 'checkout.overdue_reason.other', fills: false },
] as const;
export type OverdueReasonPick = (typeof OVERDUE_REASONS)[number]['value'];

/** The property-local day and time of the server's `checkoutAt` (what the confirmation says is recorded). */
export function localDayTime(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  return { day: todayLocal('Asia/Ho_Chi_Minh', d), time: timeHHmm(d) };
}

/** The booking offers B18 on the overdue path to this caller (server – OWN; MGR while ≤ 1 night). */
export function overdueCheckOutAllowed(r: Reservation | undefined): boolean {
  return !!r?.allowedActions?.some((a) => a.event === 'check_out' && a.overdue === true);
}

/** Whom to call, in the desk's words (UXD-on-fe-prs-125-128 mục 3). */
export function overdueNeedText(t: T, nights: number, requiredRole?: unknown): string {
  return requiredRole === 'owner' || nights >= 2
    ? t('checkout.overdue_need_owner', { n: nights })
    : t('checkout.overdue_need_manager');
}

/** The server offers this caller Gia hạn (B13) on the booking. */
export function canExtendStay(r: Reservation | undefined): boolean {
  return !!r?.allowedActions?.some((a) => a.event === 'extend_stay');
}

/**
 * DOM 145-03 (copy-v1.0.5 9.15 bảng B, FB-R5-UXD-FE-145-02 (b)): after the whom-to-call sentence, the reminder that the
 * desk can extend the stay itself – only for a viewer the server offers Gia hạn (never a button they do not have).
 */
export function overdueGuidanceText(t: T, need: string, canExtend: boolean): string {
  return canExtend ? `${need} ${t('checkout.overdue_extend_hint')}` : need;
}

/**
 * DOM 145-02 / ARC review 145-146 mục 3.4 (FB-R5-FE-ARC-V515-01): past the departure's last tier on an overdue stay, the
 * SERVER put the typed time on a later day than the effective departure (v1.0.5 reads a time before the rollover as the
 * early hours of the next day) – the day and time of that `checkoutAt`, else `null`. Never the typed time compared with
 * the rollover here: once the server reads it on the departure day (v1.0.6), this is `null` with no change on the Desk.
 */
export function overdueEarlyAt(
  overdueAfterLimit: boolean,
  checkoutAt: string | undefined,
  stayDeparture: string,
): { day: string; time: string } | null {
  if (!overdueAfterLimit || !checkoutAt) return null;
  const at = localDayTime(checkoutAt);
  return at.day !== stayDeparture ? at : null;
}

/** B18 / the check-out QR refused the overdue path (403): the role and nights the server named, if any. */
export function overdueDenial(
  e: unknown,
  fallbackNights: number,
): { nights: number; requiredRole?: string } | null {
  if (!isApiError(e) || e.code !== 'FORBIDDEN_ACTION') return null;
  const p = e.problem as Record<string, unknown>;
  const n = Number(p.nightsNotBilled);
  return {
    nights: Number.isInteger(n) && n > 0 ? n : fallbackNights,
    requiredRole: typeof p.requiredRole === 'string' ? p.requiredRole : undefined,
  };
}

/**
 * Ngăn đơn (DOM 15.7): an in-house primary stay past its effective departure (business day) that offers this FD+ caller
 * no `check_out` – the summary (FD+ reads it) says whether the server counts it overdue and how many nights. `null` =
 * nothing to say (not overdue, not read yet, read failed – the button is then simply absent, as before).
 */
export function useOverdueNeed(
  propertyId: string,
  r: Reservation | undefined,
  fd: boolean,
  businessDay: string,
): number | null {
  const want =
    !!r &&
    fd &&
    r.status === 'in_house' &&
    !r.parentReservationId &&
    !!r.stayDepartureDate &&
    r.stayDepartureDate < businessDay &&
    !r.allowedActions?.some((a) => a.event === 'check_out');
  const id = r?.id;
  const version = r?.version;
  const sum = useResource(
    async () =>
      want && id ? (await api.getCheckoutSummary({ propertyId, reservationId: id })).data : null,
    [propertyId, id, version, want],
  );
  const s = want ? sum.state.data : null;
  return s?.overdue ? (s.nightsNotBilled ?? 1) : null;
}
