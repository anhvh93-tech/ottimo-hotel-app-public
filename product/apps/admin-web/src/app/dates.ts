/**
 * CALENDAR day as YYYY-MM-DD in the property time zone – the day of an instant (a time stamp, "updated at").
 * Not the business day: from 00:00 to the rollover (BR-010, 06:00) the business day is still the day before.
 * For "today" in a form or a request use `useBusinessDay()` (app/businessDay.ts) – BUG-R2-211.
 */
export function todayLocal(timeZone = 'Asia/Ho_Chi_Minh', now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

export function timeHHmm(d: Date, timeZone = 'Asia/Ho_Chi_Minh'): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function weekdayDate(
  locale: 'vi' | 'en',
  timeZone = 'Asia/Ho_Chi_Minh',
  now = new Date(),
): string {
  const tag = locale === 'vi' ? 'vi-VN' : 'en-GB';
  const weekday = new Intl.DateTimeFormat(tag, { timeZone, weekday: 'long' }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date}`;
}

/** Default `business_day_rollover` (BR-010, DS-E). The API's `ctx.today` uses the property's parameter. */
export const DEFAULT_ROLLOVER = '06:00';

/**
 * BR-010 business day of `now` in `timeZone`: before `rollover` the local time still belongs to the day before
 * (same rule as the API `shared/time.ts businessDate`). Only an estimate on the client – the server's
 * `BookingRules.businessDate` / `Rack.today` win (`useBusinessDay`). The time zones served have no DST.
 */
export function businessDayLocal(
  timeZone = 'Asia/Ho_Chi_Minh',
  now = new Date(),
  rollover = DEFAULT_ROLLOVER,
): string {
  const [h, m] = rollover.split(':').map(Number) as [number, number];
  return todayLocal(timeZone, new Date(now.getTime() - (h * 60 + m) * 60_000));
}

/** The instant `iso` falls on business day `day` (BR-010) – e.g. an approval "of today" (BUG-R2-211). */
export function onBusinessDay(
  iso: string,
  day: string,
  timeZone?: string,
  rollover = DEFAULT_ROLLOVER,
): boolean {
  return businessDayLocal(timeZone, new Date(iso), rollover) === day;
}

/** `day` (YYYY-MM-DD) plus `n` days. */
export function shiftDay(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * V5-11 (OpenAPI 0.3.13 bổ sung 1 `earlyDeparture`; DOM rules-v1.0.5 2.1 (2)): the earliest new departure date of
 * Trả sớm (B16). From 00:00 to the rollover the night of business day D is a night the guest has already slept, so
 * the floor is the CALENDAR day D + 1; from the rollover on it is the business day.
 * ARC review #142 §3 (FB-R5-ARC-FE-142-03): the same formula as the server's `minCalendarDate`
 * (`shared/business-day.ts`) – max(business day, calendar day), no rollover. `businessDay` is the server-anchored day
 * (`useBusinessDay`). A Desk estimate – a 409 `INVALID_TRANSITION` + `minNewDepartureDate` still wins.
 * - 03:00 on 21/10, business day 20/10 → 21/10. 06:00 (business day 21/10) → 21/10. 23:00 on 20/10 → 20/10.
 * - FB-R5-DOM-FE-142-01: the server already at 06:01 (business day 21/10), the desk clock 2 min slow → 21/10, never
 *   22/10 (the Desk must not block a date the server takes). A business day a day behind still gives the calendar day.
 */
export function minCalendarDay(
  businessDay: string,
  timeZone = 'Asia/Ho_Chi_Minh',
  now = new Date(),
): string {
  const calendar = todayLocal(timeZone, now);
  return calendar > businessDay ? calendar : businessDay;
}

/**
 * V5-11 W (UXD 9.13, DOM-142-01, ARC review #142 §3 (2); server `inEarlyHours`): from 00:00 to the rollover with the
 * business day still before the calendar day – BOTH, so a business day a day behind after 06:00, or a desk clock a
 * little slow at 05:59, is not W (no "after midnight" lines).
 */
export function inEarlyHours(
  businessDay: string,
  timeZone = 'Asia/Ho_Chi_Minh',
  now = new Date(),
  rollover = DEFAULT_ROLLOVER,
): boolean {
  // Some ICU builds write midnight as 24:00 even with hour12 false.
  const hhmm = timeHHmm(now, timeZone).replace(/^24:/, '00:');
  return hhmm < rollover.slice(0, 5) && businessDay < todayLocal(timeZone, now);
}

/**
 * BUG-R4-050 (ARC-on-v104-bug050-rule.md mục 1, FB-R4-ARC-FE-PR86-01): the instant of a check-out time `hhmm` typed
 * on H16, for the reads that take an instant (`createVietQr.checkoutAt`: the typed extra-night rate probe and the
 * check-out VietQR). B18 keeps sending `checkoutTime` only (BR-416) – never this instant.
 * The server reads `checkoutTime` on the business-day axis of the click (`businessMinutes`, the post-midnight window
 * by the click), so the Desk builds the same instant: before `rollover` the time is on the day after `businessDay`,
 * from `rollover` on it is on `businessDay` – never chosen from the booking's departure date (the old "departure
 * date + time" was 24 h early after midnight: VietQR capped at 0 đ). Outside what the server takes for
 * `checkoutAt` – `[stayDeparture 00:00, stayDeparture + 1 rollover)` – nothing: the server uses its clock, as B18.
 * - 00:20 at 00:20 the day after the departure (business day = departure) → that day; 00:25 typed then → that day too.
 * - 04:30 typed at 06:10 on the departure day → the day after, as B18 reads it. The PR #68 case ("left 04:30,
 *   checked out from 06:00") cannot hold while B18 sends `checkoutTime` only (ARC mục 2) – v1.0.5 sends one
 *   `checkoutAt` to the summary, the VietQR and B18.
 * `businessDay` = `useBusinessDay()` of the click; `stayDeparture` = `stayDepartureDate ?? departureDate` (a stay
 * extended by a child booking); `offset` = the property's UTC offset (Asia/Ho_Chi_Minh, no DST).
 */
export function checkoutInstant(
  hhmm: string,
  businessDay: string,
  stayDeparture: string,
  rollover = DEFAULT_ROLLOVER,
  offset = '+07:00',
): string | undefined {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return undefined;
  const R = rollover.slice(0, 5);
  const day = hhmm < R ? shiftDay(businessDay, 1) : businessDay;
  const iso = `${day}T${hhmm}:00${offset}`;
  const t = Date.parse(iso);
  const from = Date.parse(`${stayDeparture}T00:00:00${offset}`);
  const to = Date.parse(`${shiftDay(stayDeparture, 1)}T${R}:00${offset}`);
  return t >= from && t < to ? iso : undefined;
}

/** Whole days from `a` to `b` (YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Offset of `timeZone` from UTC at `now`, in ms (wall clock − UTC). */
function zoneOffsetMs(timeZone: string, now: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const wall = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  return wall - Math.floor(now.getTime() / 1000) * 1000;
}

/**
 * R3-Q36: milliseconds from `now` to the next business-day rollover (BR-010) in `timeZone` – the Desk
 * moves "today" at that instant instead of keeping D-1 until the next render. Time zones served have no DST.
 */
export function msUntilNextRollover(
  timeZone = 'Asia/Ho_Chi_Minh',
  rollover = DEFAULT_ROLLOVER,
  now = new Date(),
): number {
  const [h, m] = rollover.split(':').map(Number) as [number, number];
  const next = shiftDay(businessDayLocal(timeZone, now, rollover), 1);
  const [y, mo, d] = next.split('-').map(Number) as [number, number, number];
  const wall = Date.UTC(y, mo - 1, d, h, m);
  return Math.max(0, wall - zoneOffsetMs(timeZone, now) - now.getTime());
}
