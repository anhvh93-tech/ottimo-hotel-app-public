// FB-INV-012 go-live fix (ARC contract §12): Desk helpers for the backdated stay (A127), "Paid outside Desk" (A128),
// the property contact (A129) and the catch-up reading (A130). The server is the judge of every rule; these only
// set the date pickers and say why a button is missing. Unknown action codes are ignored (FE-7).
import {
  GO_LIVE_RESERVATION_ACTION,
  GO_LIVE_STATEMENT_ACTION,
  type Reservation,
  type Role,
} from '@ottimo/api-client';
import { addDays } from './reservations';
import type { BillingPeriod } from './statements';

/**
 * Parts of §12 the BE deferred out of OpenAPI 0.3.15 / v1.0.7 (PR #197): 12.4 cleaning price by room
 * (`getChargeCatalog?folioId`, `priceSource`, editing `long_stay_cleaning_fee_by_room`) and 12.5 `catchUp`.
 * Off = the UI is unreachable and nothing is sent; the code stays for the follow-up PR, which flips these on.
 * Mutable only so tests can exercise the parked UI against the mock.
 */
export const goLiveDeferred = { cleaningByRoom: false, catchUp: false };

/** §12.1: 45 days, a constant of the server (not a parameter). */
export const BACKDATE_MAX_DAYS = 45;

export const isOwnerOrManager = (roles: readonly Role[]) =>
  roles.some((r) => r === 'owner' || r === 'manager');

/** Arrival bounds of a backdated booking on business day `today`: [today − 45, today − 1]. */
export function backdateBounds(today: string): { earliest: string; latest: string } {
  return { earliest: addDays(today, -BACKDATE_MAX_DAYS), latest: addDays(today, -1) };
}

/** `Reservation` fields of 0.3.15 the generated type does not have yet. */
export type ReservationGoLive = Reservation & { checkinBackdatedOn?: string | null };

/** The server offers the backdated check-in (OWN/MGR, confirmed manual long stay, arrival before today). */
export const canCheckInBackdated = (r: Reservation | null | undefined) =>
  !!r?.allowedActions?.some((a) => (a.event as string) === GO_LIVE_RESERVATION_ACTION);

export const backdatedOn = (r: Reservation | null | undefined) =>
  (r as ReservationGoLive | null | undefined)?.checkinBackdatedOn ?? null;

/** S16: "Paid outside Desk" only when `availableActions` lists it. */
export const canSettleOutsideDesk = (p: BillingPeriod | null | undefined) =>
  !!p?.availableActions.some((a) => (a as string) === GO_LIVE_STATEMENT_ACTION);

/** §12.2 `reference`: ≤ 64 of `[A-Za-z0-9 ./-]`. */
export const REFERENCE_RE = /^[A-Za-z0-9 ./-]{1,64}$/;
/** BE #197: a run of 9 or more numerals (account or card number) → 422 `reference: NOT_ALLOWED`. */
export const REFERENCE_LONG_NUMBER_RE = /\d{9,}/;

/** §12.3 checks, mirrored so the owner sees the problem before saving (the server re-checks). */
// C0/C1 controls, bidi marks and zero-width characters (SEC 12-04 (b)) – escapes kept readable on purpose.
const UNSAFE_TEXT = new RegExp(
  // eslint-disable-next-line no-control-regex -- the point is to find them
  '[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u2069]',
);

export function contactIssues(addressLine: string, hotline: string) {
  const a = addressLine.trim();
  const h = hotline.trim();
  return {
    address: !!a && (a.length < 5 || a.length > 200 || UNSAFE_TEXT.test(a)),
    hotline: !!h && !/^\+?[0-9][0-9 .-]{7,19}$/.test(h),
  };
}

/** The one-line statement footer: address · hotline (plain text – React escapes it, SEC 12-04 (c)). */
export const contactFooter = (c: { addressLine: string | null; hotline: string | null }) =>
  [c.addressLine, c.hotline].filter((x): x is string => !!x && !!x.trim()).join(' · ');
