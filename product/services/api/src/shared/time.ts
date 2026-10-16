/**
 * Instant ↔ local date/time conversions in the property time zone (ADR-008, coding-standards 5).
 * Uses the IANA database built into Node (Intl), so a property in another zone needs no code change.
 * Three types, never mixed: Instant (Date, UTC), LocalDate ('YYYY-MM-DD'), LocalTime ('HH:mm').
 */
export type LocalDate = string;
export type LocalTime = string;

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

export function zonedParts(instant: Date, tz: string): ZonedParts {
  const parts: Record<string, number> = {};
  for (const p of formatter(tz).formatToParts(instant)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

/** Offset of `tz` from UTC at `instant`, in minutes (Asia/Ho_Chi_Minh → 420). */
export function offsetMinutes(instant: Date, tz: string): number {
  const p = zonedParts(instant, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const truncated = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - truncated) / 60_000);
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Calendar date at `instant` in `tz` (no business-day rollover). */
export function localDate(instant: Date, tz: string): LocalDate {
  const p = zonedParts(instant, tz);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  assertLocalDate(date);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/**
 * Business date (BR-010): before `rollover` (parameter business_day_rollover, 06:00 by default in DS-E)
 * the local time still belongs to the previous day. Legal deadlines use real time, not this.
 */
export function businessDate(instant: Date, tz: string, rollover: LocalTime): LocalDate {
  assertLocalTime(rollover);
  const p = zonedParts(instant, tz);
  const [rh, rm] = rollover.split(':').map(Number) as [number, number];
  const today = localDate(instant, tz);
  return p.hour * 60 + p.minute < rh * 60 + rm ? addDays(today, -1) : today;
}

/** Instant of local `date` + `time` in `tz` (e.g. hold deadline 12:00 on arrival day). */
export function atLocal(date: LocalDate, time: LocalTime, tz: string): Date {
  assertLocalDate(date);
  assertLocalTime(time);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle zones with DST transitions; Vietnam has none but chains may (ADR-008 point 6).
  let guess = wall - offsetMinutes(new Date(wall), tz) * 60_000;
  guess = wall - offsetMinutes(new Date(guess), tz) * 60_000;
  return new Date(guess);
}

/** ISO-8601 with the property offset, e.g. 2026-10-15T14:00:00.000+07:00 (API format). */
export function toZonedIso(instant: Date, tz: string): string {
  const off = offsetMinutes(instant, tz);
  const shifted = new Date(instant.getTime() + off * 60_000);
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${shifted.toISOString().replace('Z', '')}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function assertLocalDate(v: string): asserts v is LocalDate {
  if (!LOCAL_DATE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
    throw new RangeError(`not a LocalDate (YYYY-MM-DD): ${v}`);
  }
}

export function assertLocalTime(v: string): asserts v is LocalTime {
  if (!LOCAL_TIME.test(v)) throw new RangeError(`not a LocalTime (HH:mm): ${v}`);
}
