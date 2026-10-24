/**
 * Pure rules of the website booking requests (US-155; OpenAPI 0.3.7 bổ sung 2 / 0.3.8; BR-911…914 v0.4.0; SEC
 * ARC-04, 07, 13, 14, 15, 21; ADR-014 mục 4) – no I/O, unit-tested in test/be-d-r3-s1-units.test.ts.
 */
import { createHmac, randomBytes } from 'node:crypto';
import {
  type LocalDate,
  type LocalTime,
  addDays,
  atLocal,
  localDate,
  toZonedIso,
} from '../../../shared/time';

// ───────────────────────── reference codes (Crockford base32, 40 bit) ─────────────────────────

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const REF_CODE = /^[0-9A-HJKMNP-TV-Z]{8}$/;

/** 8 random Crockford base32 characters (40 bit, CSPRNG, never sequential – ARC-04). */
export function newRefCode(): string {
  const b = randomBytes(5);
  let bits = 0n;
  for (const x of b) bits = (bits << 8n) | BigInt(x);
  let out = '';
  for (let i = 7; i >= 0; i -= 1) out += CROCKFORD[Number((bits >> BigInt(i * 5)) & 31n)];
  return out;
}

/** UXD-07: what the guest typed ("w7k3-qx9p", "W7K3 QX9P", O/I/L look-alikes) → canonical code, or null. */
export function normalizeRefCode(raw: string): string | null {
  const v = raw.replace(/[\s-]/g, '').toUpperCase().replace(/[IL]/g, '1').replace(/O/g, '0');
  return REF_CODE.test(v) ? v : null;
}

// ───────────────────────── text (ARC-21, V-09, SR-LOG-04) ─────────────────────────

const FORMAT_CHARS = /[\p{Cc}‎‏‪-‮⁦-⁩]/gu;

/** NFC + no control (Cc) / direction-format characters, trimmed – BEFORE the length checks (ARC-21). */
export function normalizeFreeText(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(FORMAT_CHARS, (c) => (c === '\n' ? '\n' : ''))
    .trim();
}

/** Luhn-valid 13–19 digit run (spaces / dashes between digits) – the V-09 card rule. */
export function looksLikeCard(text: string): boolean {
  const candidates = text.match(/\d(?:[ -]?\d){12,18}/g) ?? [];
  for (const c of candidates) {
    const d = c.replace(/[ -]/g, '');
    for (let len = 13; len <= Math.min(19, d.length); len += 1) {
      for (let s = 0; s + len <= d.length; s += 1) if (luhn(d.slice(s, s + len))) return true;
    }
  }
  return false;
}

function luhn(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (dbl) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/**
 * SR-LOG-04 / ARC-08: an identity document number – CCCD (12 digits), old CMND (9 digits), passport style
 * (1–2 capital letters + 7–8 digits). Phone numbers (10–11 digits, or with +) do not match.
 */
export function looksLikeIdNumber(text: string): boolean {
  if (/(?<![\d+])\d{12}(?!\d)/.test(text)) return true;
  if (/(?<![\d+])\d{9}(?!\d)/.test(text)) return true;
  return /\b[A-Z]{1,2}\d{7,8}\b/.test(text);
}

export function containsUrl(text: string): boolean {
  return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|vn|io|xyz|info|top|link|me)\b)/i.test(
    text,
  );
}

/** Characters outside the scripts of the three site languages (Latin incl. Vietnamese, Cyrillic) + common marks. */
export function hasUnexpectedScript(text: string): boolean {
  return /[^\p{Script=Latin}\p{Script=Cyrillic}\p{M}\p{N}\p{P}\p{Zs}\n\p{S}]/u.test(text);
}

// ───────────────────────── source (DirectSubSource, BR-911) ─────────────────────────

export type SubSource = 'facebook' | 'instagram' | 'google' | 'zalo' | 'qr' | 'other';

const hostIs = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

/**
 * OpenAPI DirectSubSource / BR-911 (2): `utm.medium = qr` → qr; utm.source mapped; else the referrer host; the
 * site's own host (and www.) or nothing → null ("không rõ").
 */
export function subSourceOf(
  utm: { source?: string; medium?: string } | undefined,
  refHost: string | undefined,
  ownHost: string | null,
): SubSource | null {
  const medium = utm?.medium?.toLowerCase();
  const source = utm?.source?.toLowerCase();
  if (medium === 'qr') return 'qr';
  if (source) {
    if (['facebook', 'fb', 'm.facebook.com', 'l.facebook.com'].includes(source)) return 'facebook';
    if (['instagram', 'ig'].includes(source)) return 'instagram';
    if (source === 'google') return 'google';
    if (source === 'zalo') return 'zalo';
    return 'other';
  }
  const host = refHost?.toLowerCase();
  if (!host) return null;
  if (ownHost) {
    const own = ownHost.toLowerCase().replace(/^www\./, '');
    if (hostIs(host.replace(/^www\./, ''), own)) return null;
  }
  if (['facebook.com', 'fb.com', 'fb.me', 'messenger.com'].some((d) => hostIs(host, d))) {
    return 'facebook';
  }
  if (hostIs(host, 'instagram.com')) return 'instagram';
  if (/(^|\.)google\.[a-z.]{2,}$/.test(host)) return 'google';
  if (hostIs(host, 'zalo.me') || hostIs(host, 'zalo.vn')) return 'zalo';
  return 'other';
}

// ───────────────────────── reply deadline + public promise (BR-912 v0.4.0) ─────────────────────────

export interface DeskHours {
  from: LocalTime;
  to: LocalTime;
}

/** `front_desk_hours` is stored as ["07:00","22:00"] (DS-E) or {from, to} (erd 9). */
export function deskHoursOf(raw: unknown): DeskHours {
  if (Array.isArray(raw) && typeof raw[0] === 'string' && typeof raw[1] === 'string') {
    return { from: raw[0] as LocalTime, to: raw[1] as LocalTime };
  }
  const o = raw as { from?: unknown; to?: unknown } | null;
  if (o && typeof o.from === 'string' && typeof o.to === 'string') {
    return { from: o.from as LocalTime, to: o.to as LocalTime };
  }
  throw new Error('front_desk_hours has an unknown shape');
}

/** BR-973 call window (`guest_msg.send_window` [08:00, 21:00) – no catalogue key yet: constant). */
export const CALL_WINDOW: DeskHours = { from: '08:00', to: '21:00' };

export interface ReplyParams {
  hours: DeskHours;
  responseMinutes: number;
  sameDayAfterHoursMinutes: number;
  promiseMinutes: number;
  promiseNextMorningBy: LocalTime;
  promiseCallNowMinutes: number;
}

export interface ReplyPlan {
  inHours: boolean;
  replyBy: Date;
  promise: { kind: 'within_minutes' | 'next_morning' | 'call_now'; by: string; minutes?: number };
}

const hhmm = (d: Date, tz: string) => toZonedIso(d, tz).slice(11, 16);
const within = (t: string, w: DeskHours) => t >= w.from && t < w.to;
const plus = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

/** Next instant at local `time` strictly after-or-at `now` (today when still ahead, else tomorrow). */
function nextAt(now: Date, time: LocalTime, tz: string): Date {
  const day = localDate(now, tz);
  const today = atLocal(day, time, tz);
  return today.getTime() >= now.getTime() ? today : atLocal(addDays(day, 1), time, tz);
}

/**
 * BR-912: in hours → received + 15; out of hours → next opening + 15; phone as the only way → not before the
 * next call-window opening + 15 (08:15); arrival = business date and out of hours → received + 30.
 * Public promise (4): in hours → within 60 min; out of hours → before 09:00 next morning; arriving tonight out of
 * hours → call_now (60 min, with the phone number on the page).
 */
export function replyPlan(
  now: Date,
  tz: string,
  arrival: LocalDate,
  businessToday: LocalDate,
  channel: string,
  p: ReplyParams,
): ReplyPlan {
  const local = hhmm(now, tz);
  const inHours = within(local, p.hours);
  const tonight = arrival === businessToday;
  let replyBy: Date;
  if (inHours) replyBy = plus(now, p.responseMinutes);
  else if (tonight) replyBy = plus(now, p.sameDayAfterHoursMinutes);
  else replyBy = plus(nextAt(now, p.hours.from, tz), p.responseMinutes);
  if (channel === 'phone' && !(inHours && within(local, CALL_WINDOW)) && !tonight) {
    const callOpen = plus(nextAt(now, CALL_WINDOW.from, tz), p.responseMinutes);
    if (callOpen.getTime() > replyBy.getTime()) replyBy = callOpen;
  }
  let promise: ReplyPlan['promise'];
  if (inHours) {
    promise = {
      kind: 'within_minutes',
      by: toZonedIso(plus(now, p.promiseMinutes), tz),
      minutes: p.promiseMinutes,
    };
  } else if (tonight) {
    promise = {
      kind: 'call_now',
      by: toZonedIso(plus(now, p.promiseCallNowMinutes), tz),
      minutes: p.promiseCallNowMinutes,
    };
  } else {
    promise = { kind: 'next_morning', by: toZonedIso(nextAt(now, p.promiseNextMorningBy, tz), tz) };
  }
  return { inHours, replyBy, promise };
}

// ───────────────────────── dates ─────────────────────────

/** `date` + `months` calendar months (end of month clamps: 31/01 + 1 → 28/02). */
export function addMonths(date: LocalDate, months: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(d, last);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(target.getUTCFullYear(), 4)}-${pad(target.getUTCMonth() + 1)}-${pad(day)}`;
}

export function nightsBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Room type label → slug ("Standard Studio · Garden View" → standard-studio-garden-view). */
export function slugOf(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ───────────────────────── IP keys (SR-RL-10/11, SR-SECR-07) ─────────────────────────

/** IPv4 as is; IPv6 → its /64 (and /48 for the range limit). */
export function ipBuckets(ip: string): { host: string; range48: string | null } {
  const v = ip.replace(/^::ffff:/i, '');
  if (!v.includes(':')) return { host: v, range48: null };
  const groups = expandIpv6(v);
  return {
    host: `${groups.slice(0, 4).join(':')}::/64`,
    range48: `${groups.slice(0, 3).join(':')}::/48`,
  };
}

function expandIpv6(ip: string): string[] {
  const [head, tail] = ip.split('::') as [string, string | undefined];
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const fill = Array(Math.max(0, 8 - h.length - t.length)).fill('0');
  return [...h, ...(tail !== undefined ? fill : []), ...t].map((g) => g.toLowerCase() || '0');
}

export function hmacHex(key: string, value: string): string {
  return createHmac('sha256', key).update(value, 'utf8').digest('hex');
}
