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
