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

/** Business date `YYYY-MM-DD` of an instant in the property time zone. */
export function localDate(value: number | Date = Date.now(), timeZone = PROPERTY_TZ): string {
  const d = toDate(value) ?? new Date();
  const p = parts(d, timeZone);
  return `${p.y}-${p.m}-${p.d}`;
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
