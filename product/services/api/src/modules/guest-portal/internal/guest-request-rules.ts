/**
 * Pure rules of guest requests (EP14 3–4; BR-811, BR-506 + ESC-016 A, BR-809; OpenAPI 0.3.6 B-14…B-16, 0.3.7) –
 * no database, unit-tested in test/be-d-s4-units.test.ts.
 */
import type { GuestRequestType } from '../../../db/schema/guest-requests';
import { type LocalTime, addDays, atLocal, localDate, toZonedIso } from '../../../shared/time';

export type RoutedTo = 'housekeeping' | 'maintenance' | 'front_desk';

/** BR-811 (BL 5.19): who handles a type. */
export function routeOf(type: GuestRequestType): RoutedTo {
  if (type === 'extra_cleaning' || type === 'amenities') return 'housekeeping';
  if (type === 'report_issue') return 'maintenance';
  return 'front_desk';
}

/** EP14 3.2 [GIẢ ĐỊNH BA]: the department must know what is broken / what to book / what is asked. */
export function noteRequired(type: GuestRequestType): boolean {
  return type === 'report_issue' || type === 'transport_tour' || type === 'other';
}

/** EP14 3.1 (DOM D-13 a): before arrival only the front-desk types (airport pick-up, early/late, other). */
export function needsInHouse(type: GuestRequestType): boolean {
  return routeOf(type) !== 'front_desk';
}

export interface DeskHours {
  from: LocalTime;
  to: LocalTime;
}

/** `front_desk_hours` is stored as ["07:00","22:00"] (DS-E) or {from, to} (erd 9). */
export function deskHoursOf(raw: unknown): DeskHours {
  if (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'string') {
    return { from: raw[0], to: raw[1] };
  }
  const o = raw as { from?: unknown; to?: unknown } | null;
  if (o && typeof o.from === 'string' && typeof o.to === 'string')
    return { from: o.from, to: o.to };
  throw new Error('front_desk_hours has an unknown shape');
}

/**
 * BR-811 (DOM D-13 c): within [from, to) – `to` excluded – the desk answers within `minutes`; outside, the
 * request is auto-answered at once and due `minutes` after the next opening. Examples: 21:59 → 22:09;
 * 22:00 → 07:10 next day; 06:30 → 07:10 the same day.
 */
export function ackDueOf(
  now: Date,
  tz: string,
  hours: DeskHours,
  minutes: number,
): { ackDueAt: Date; inHours: boolean; opensAt: Date } {
  const day = localDate(now, tz);
  const local = toZonedIso(now, tz).slice(11, 16);
  if (local >= hours.from && local < hours.to) {
    return {
      ackDueAt: new Date(now.getTime() + minutes * 60_000),
      inHours: true,
      opensAt: atLocal(day, hours.from, tz),
    };
  }
  const opensAt = atLocal(local < hours.from ? day : addDays(day, 1), hours.from, tz);
  return { ackDueAt: new Date(opensAt.getTime() + minutes * 60_000), inHours: false, opensAt };
}

// BR-506 "lần dọn đầy đủ" task types (FULL_CLEAN_TASK_TYPES) moved to housekeeping/public/guest-request-work.port.ts
// with the read `lastFullCleanAt` (ARC FB-R2-ARC-BE-S4-09 – housekeeping owns its task types).

/**
 * BR-811 v0.3.8 (DOM-S4-10, oracle BR-811-04): who is told that a guest request is still unanswered after its
 * deadline – the department it is routed to, the desk (FD, FDL) and, as the escalation step, the MANAGER. The
 * owner is not notified.
 */
export function overdueRecipients(routed: RoutedTo): string[] {
  return [...(routed === 'front_desk' ? [] : [routed]), 'front_desk', 'front_desk_lead', 'manager'];
}

/**
 * Out-of-hours auto reply (US-112, EP14 3.3; UXD `guest.req.auto_reply`, params {time} {open_time} {phone}).
 * A property without a public phone (`property.phone_public` empty) gets the text WITHOUT the sentence holding
 * {phone} – never a blank number, never an invented fallback (ORC 17/10).
 */
export function renderAutoReply(
  template: string,
  v: { time: string; openTime: string; phone: string | null },
): string {
  const phone = v.phone?.trim();
  const text = phone
    ? template.replace('{phone}', phone)
    : template.replace(/\s*[^.!?]*\{phone\}[^.!?]*[.!?]?/u, '');
  return text.replace('{time}', v.time).replace('{open_time}', v.openTime).trim();
}

/**
 * SEC B-15 (`replyNote`, shown to anyone holding the link) – SEC decision V2 (reviews/s4-SEC.md C.6, FB-R2-SEC-BE-77):
 * a run of ≥ 6 digits blocks door codes, ID numbers and guests' phone numbers, but a PRICE WITH ITS UNIT and a DATE
 * NEAR TODAY may be written (EP14 3.2: the desk tells the guest the price and day of a car or tour):
 * 1. (Luhn is checked on the original text before – `containsCardNumber`.)
 * 2. Checked on `text.normalize('NFKC')` (full-width digits → ASCII; only for the check, never stored).
 * 3. Tokens replaced by `|` (never by a space – two separate numbers must not join):
 *    - a date `d{1,2}[./-]d{1,2}[./-]yyyy` (one separator), a real calendar day, year within ±1 of the property's
 *      current year (a birth date – C3 – stays blocked);
 *    - VND money: first digit 1–9, thousands grouped by ONE of `.` `,` space or not grouped, ≤ 10 digits, the unit
 *      right after (`đ`, `₫`, `VND`, `VNĐ`, `đồng`, any case), no letter/digit glued before; ≥ 6 digits must end in
 *      `000` (`Mã cửa 482913đ` stays blocked; Vietnamese phone/ID numbers start with 0 – never money).
 * 3b. (SEC s7, 18/10) a comma / semicolon FOLLOWED BY WHITESPACE is a list boundary → `|` (`Phòng 202, 203, 204`
 *    passes; `202,203,204`, `202 203 204`, `482,913` stay blocked). Thousands separators never have a space after.
 * 4. Separators `[\s.,\-_+()]` and Unicode dashes removed (`/` kept). 5. Any `\p{Nd}{6,}` blocks – except the
 *    property's PUBLIC hotline (compared on its last 9 digits, so 0263…, 84263…, +84 263… are the same number).
 * Staff `replyNote` only: the guest's own `note` is checked for card numbers (Luhn), never by this rule.
 * Accepted by SEC as blocked: `350.000 đến 450.000đ`, `350.000 dong`, `350.000d`, ISO `2026-10-18`, a price not in
 * whole thousands, a date beyond ±1 year, `VND 350.000` (the Desk hint says "Ghi giá kèm đ/VND, ví dụ 350.000 đ").
 */
// `(?<!\p{Nd}[.,…])`: not the tail of a longer grouped number (`0912.345.000đ`) – stricter than C.6, never looser.
const B15_DATE = /(?<!\p{Nd}|\p{Nd}[./-])(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?!\p{Nd})/gu;
const B15_MONEY =
  /(?<![\p{L}\p{Nd}]|\p{Nd}[.,])([1-9]\d{0,2}(?:([.,\s])\d{3}(?:\2\d{3})*)?|[1-9]\d{3,9})\s?(?:đồng|vnđ|vnd|đ|₫)(?![\p{L}\p{Nd}])/giu;

function isNearDate(day: number, month: number, year: number, currentYear: number): boolean {
  if (Math.abs(year - currentYear) > 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function hasSensitiveDigits(
  text: string,
  publicPhone: string | null,
  currentYear: number,
): boolean {
  const checked = text
    .normalize('NFKC')
    .replace(B15_DATE, (all, d: string, _sep: string, m: string, y: string) =>
      isNearDate(Number(d), Number(m), Number(y), currentYear) ? '|' : all,
    )
    .replace(B15_MONEY, (all, amount: string) => {
      const digits = amount.replace(/\D/g, '');
      return digits.length <= 10 && (digits.length < 6 || digits.endsWith('000')) ? '|' : all;
    })
    .replace(/[,;]\s+/gu, '|');
  const compact = checked.replace(/[\s.,\-_+()\p{Pd}]/gu, '');
  const runs = compact.match(/\p{Nd}{6,}/gu) ?? [];
  const hotline = (publicPhone ?? '').replace(/\D/g, '');
  const tail = (s: string) => s.slice(-9);
  return runs.some(
    (run) => !(hotline.length >= 9 && run.length >= 9 && tail(run) === tail(hotline)),
  );
}

export interface CleaningFeeInput {
  stayType: 'short' | 'long';
  /** BR-506 fee (`adhoc_cleaning_fee`). */
  feeVnd: number;
  /** HH:mm of the last FULL clean done today for this stay (null = none). */
  lastFullCleanTime: string | null;
}

/**
 * BR-506 (ESC-016 A, DOM D-13 b/D-15): long stay – every ad-hoc clean is charged; short stay – the clean that
 * replaces a skipped daily clean is free, the SECOND full clean of the same day is charged.
 */
export function cleaningFee(i: CleaningFeeInput): {
  feeVnd: number | null;
  feeReason: 'long_stay_adhoc' | 'second_full_clean' | null;
  lastFullCleanTime: string | null;
} {
  if (i.stayType === 'long') {
    return { feeVnd: i.feeVnd, feeReason: 'long_stay_adhoc', lastFullCleanTime: null };
  }
  if (i.lastFullCleanTime) {
    return {
      feeVnd: i.feeVnd,
      feeReason: 'second_full_clean',
      lastFullCleanTime: i.lastFullCleanTime,
    };
  }
  return { feeVnd: null, feeReason: null, lastFullCleanTime: null };
}

/** SR-RL-05: requests per booking and business day. */
export const GUEST_REQUESTS_PER_DAY = 20;
/** B-16: open paid requests per booking. */
export const OPEN_PAID_REQUESTS_MAX = 3;
