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
