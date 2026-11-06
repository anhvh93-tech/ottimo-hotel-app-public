/**
 * V5-10 – ONE departure instant for the check-out summary, its VietQR and B18 (OpenAPI 0.3.13 `checkOut` "Quy đổi giờ
 * trả"; contract 0.3.13 1.1, 1.19; BUG-R4-036, BUG-R4-051; BE C0313-01, 07, 08). Pure (no I/O): CheckoutService reads
 * the parameters and the stay, then every path calls `resolveCheckoutAt` with them.
 *
 * - `checkoutAt` sent → used as is. Its business date must be the departure, or it lies in the departure's
 *   post-midnight window; or – only while the server clock is in that window – it is the evening before (business
 *   date = departure − 1) (C0313-07). Never before the actual check-in, on every path (SEC FB-R5-SEC-BE-A1A-01:
 *   the guest cannot leave before arriving; after PR-A1b this instant is the actual departure). Anything else →
 *   `null` (422 DATE_INVALID).
 * - Nothing sent → the time `t` (typed `checkoutTime` ?? agreed late time ?? `checkout_time`) on these candidates:
 *   (departure, t); (departure + 1, t) when t < rollover; (departure − 1, t) only when t was TYPED, t ≥ rollover and
 *   the server clock is in the departure's post-midnight window (C0313-07; DOM FB-R5-DOM-BE-PR106-01: the agreed and
 *   the standard time are times of the departure day – "left the evening before" exists only when the desk types it).
 *   A candidate before the actual check-in is dropped (A1A-01); none left → `null` (422 DATE_INVALID). The LATEST
 *   candidate not after server time + `manual_time_tolerance_minutes` wins; none fits → the earliest (B18 / QR then
 *   answer TIME_AFTER_ACTION).
 * Example (departure 23/11, rollover 06:00): 07:00 on 23/11 typing 05:30 → 23/11 05:30 (was read as 24/11 05:30 and
 * refused – BUG-R4-051); 01:05 on 24/11 typing 01:00 → 24/11 01:00 (after the last tier → extra night).
 */
import { dayClock, inPostMidnightWindow } from '../../../shared/business-day';
import { type LocalDate, type LocalTime, addDays, atLocal } from '../../../shared/time';
import { minutesOf } from '../public/stay-rules';

export interface CheckoutAtInput {
  /** Effective departure of the stay (primary + its in-house children – BR-422). */
  departureDate: LocalDate;
  /** Server clock. */
  now: Date;
  tz: string;
  /** `business_day_rollover`. */
  rollover: LocalTime;
  /** `manual_time_tolerance_minutes` (E03-07). */
  toleranceMinutes: number;
  /** `checkoutAt` sent by the desk – used as is (only checked). */
  sent?: Date | undefined;
  /** Used when nothing was sent: typed `checkoutTime` ?? agreed late check-out time ?? `checkout_time`. */
  time: LocalTime;
  /** `time` is a typed `checkoutTime` (not the agreed / standard time): only then the evening before (PR106-01). */
  typed: boolean;
  /** Actual check-in of the stay: the departure instant is never earlier (C0313-07, A1A-01). Null = no bound. */
  checkedInAt: Date | null;
}

export interface ResolvedCheckoutAt {
  /** The departure instant every number of the summary, the QR cap and B18 use. */
  at: Date;
  /** `checkoutAt` was sent (else resolved from a time). */
  sent: boolean;
  /**
   * No BR-412 surcharge (DOM S3-9 b): `at` is in the departure's post-midnight window, or it is the evening before while
   * the server clock is in that window (C0313-07 – the guest left the evening before, the desk records it at night).
   */
  postMidnight: boolean;
  /** `at` > server time + tolerance → B18 / QR `check_out` 422 TIME_AFTER_ACTION (`CheckoutSummary.checkoutAtAfterNow`). */
  afterNow: boolean;
  /** `at` < server time − tolerance → B18 needs `checkoutTimeNote` (`CheckoutSummary.checkoutTimeNoteRequired`). */
  noteRequired: boolean;
}

/** The evening before the departure is accepted only while the server clock is in the departure's post-midnight window. */
function eveningBeforeAllowed(i: CheckoutAtInput): boolean {
  return inPostMidnightWindow(dayClock(i.now, i.tz, i.rollover), i.departureDate);
}

/** A1A-01: no departure instant before the actual check-in (no check-in recorded = no bound). */
function notBeforeCheckIn(i: CheckoutAtInput, at: Date): boolean {
  return !i.checkedInAt || at.getTime() >= i.checkedInAt.getTime();
}

/**
 * Departure instant of a stay (see the file header); `null` = a sent `checkoutAt` on a day B18 does not accept, or
 * before the actual check-in; or no candidate of the time is at or after the actual check-in.
 */
export function resolveCheckoutAt(i: CheckoutAtInput): ResolvedCheckoutAt | null {
  const dep = i.departureDate;
  const eve = addDays(dep, -1);
  let at: Date;
  if (i.sent) {
    at = i.sent;
    const c = dayClock(at, i.tz, i.rollover);
    const ok =
      c.today === dep ||
      inPostMidnightWindow(c, dep) ||
      (c.today === eve && eveningBeforeAllowed(i));
    if (!ok || !notBeforeCheckIn(i, at)) return null;
  } else {
    const t = i.time;
    const early = minutesOf(t) < minutesOf(i.rollover);
    const all: Date[] = [];
    if (!early && i.typed && eveningBeforeAllowed(i)) all.push(atLocal(eve, t, i.tz));
    all.push(atLocal(dep, t, i.tz));
    if (early) all.push(atLocal(addDays(dep, 1), t, i.tz));
    const candidates = all.filter((c) => notBeforeCheckIn(i, c));
    if (candidates.length === 0) return null;
    const limit = i.now.getTime() + i.toleranceMinutes * 60_000;
    const fit = candidates.filter((c) => c.getTime() <= limit);
    at = (fit.length > 0 ? fit[fit.length - 1] : candidates[0]) as Date;
  }
  const c = dayClock(at, i.tz, i.rollover);
  const postMidnight = inPostMidnightWindow(c, dep) || c.today === eve;
  const diff = at.getTime() - i.now.getTime();
  const tolerance = i.toleranceMinutes * 60_000;
  return {
    at,
    sent: !!i.sent,
    postMidnight,
    afterNow: diff > tolerance,
    noteRequired: -diff > tolerance,
  };
}
