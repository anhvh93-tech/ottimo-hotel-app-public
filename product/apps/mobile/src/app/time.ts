// Times on the PWA are shown in the property time zone (BR-001: Asia/Ho_Chi_Minh), whatever the phone says.
export const PROPERTY_TZ = 'Asia/Ho_Chi_Minh';

function parts(value: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(value);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return {
    y: get('year'),
    m: get('month'),
    d: get('day'),
    hh: get('hour') === '24' ? '00' : get('hour'),
    mm: get('minute'),
  };
}

function toDate(value: string | number | Date | undefined | null): Date | undefined {
  if (value === undefined || value === null) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** ISO instant / epoch → "10:42". */
export function hhmm(
  value: string | number | Date | undefined | null,
  timeZone = PROPERTY_TZ,
): string {
  const d = toDate(value);
  if (!d) return '';
  const p = parts(d, timeZone);
  return `${p.hh}:${p.mm}`;
}

/** ISO instant / epoch → "15/10". */
export function ddmm(
  value: string | number | Date | undefined | null,
  timeZone = PROPERTY_TZ,
): string {
  const d = toDate(value);
  if (!d) return '';
  const p = parts(d, timeZone);
  return `${p.d}/${p.m}`;
}

/**
 * CALENDAR date `YYYY-MM-DD` of an instant in the property time zone (changes at 00:00). Not "today" for the
 * hotel: screens and lists use `businessDate` (BR-010). Kept for wall-clock needs only (legal deadlines
 * BR-602/603, quote validity BR-304) – the HK/MT PWA has none today (BUG-R2-211).
 */
export function localDate(value: number | Date = Date.now(), timeZone = PROPERTY_TZ): string {
  const d = toDate(value) ?? new Date();
  const p = parts(d, timeZone);
  return `${p.y}-${p.m}-${p.d}`;
}

/**
 * Default of `business_day_rollover` (BR-010, BR mục 13; DS-E). HK/MT may not read the parameter
 * (`getBookingRules` is not in their `x-roles`), so the PWA uses the default for what it only SHOWS or
 * pre-checks; the server keeps the real value (`ctx.today`) and lists without `date` follow it.
 */
export const BUSINESS_DAY_ROLLOVER = '06:00';

/**
 * Business date (BR-010) `YYYY-MM-DD`: before the rollover (06:00) the local time still belongs to the
 * previous day – 02:40 on 20/10 is business day 19/10. Same rule as the API `businessDate` (shared/time.ts).
 */
export function businessDate(
  value: number | Date = Date.now(),
  timeZone = PROPERTY_TZ,
  rollover = BUSINESS_DAY_ROLLOVER,
): string {
  const d = toDate(value) ?? new Date();
  const p = parts(d, timeZone);
  const day = `${p.y}-${p.m}-${p.d}`;
  const [rh, rm] = rollover.split(':').map(Number) as [number, number];
  return Number(p.hh) * 60 + Number(p.mm) < rh * 60 + rm ? addDays(day, -1) : day;
}

/** `YYYY-MM-DD` → "17/10" (no time-zone shift). */
export function shortLocalDate(value: string | undefined | null): string {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return m ? `${m[3]}/${m[2]}` : (value ?? '');
}

/** `YYYY-MM-DD` + n days. */
export function addDays(date: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n));
  return d.toISOString().slice(0, 10);
}

/** Whole minutes from now until `iso` (negative = overdue). */
export function minutesUntil(iso: string | undefined | null, now = Date.now()): number | undefined {
  const d = toDate(iso);
  return d ? Math.round((d.getTime() - now) / 60_000) : undefined;
}
