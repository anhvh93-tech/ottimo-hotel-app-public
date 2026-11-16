// Pure logic of the booking-request form (concept 5.2–5.4) – no DOM, unit-tested in booking-logic.test.ts.
// Payload keys follow `WebsiteBookingRequestInput` (OpenAPI 0.3.7 add-on 2 – SEC UXD-07: never invent key names).
import type { components } from '../../../../packages/api-client/src/generated/openapi';
import { INTL_LOCALE, type Lang } from '../lib/langs';
import type { EstimateStrings } from './booking-strings/types';

/**
 * OpenAPI 0.3.9-draft (LP-v2) adds to `WebsiteBookingRequestInput`: `locale` ∈ `LandingLocale` (en, vi, ko, zh, ru) and
 * the optional `priceEstimateToken`. Typed here until BE regenerates packages/api-client (BE-1, branch lp-v2-be); then
 * this widening is a no-op.
 */
export type BookingInput = Omit<
  components['schemas']['WebsiteBookingRequestInput'],
  'locale' | 'priceEstimateToken'
> & { locale: Lang; priceEstimateToken?: string };
export type BookingAccepted = components['schemas']['WebsiteBookingRequestAccepted'];
export type PublicFormToken = components['schemas']['PublicFormToken'];
export type BookingPromise = BookingAccepted['promise'];
/** Everything but the form token, which the transport adds (ADR-014 4.4). */
export type BookingDraft = Omit<BookingInput, 'formToken'>;

/** Request number of the server: Crockford base32, 8 characters (SEC UXD-07). */
export const REF_CODE = /^[0-9A-HJKMNP-TV-Z]{8}$/;

/** Today (YYYY-MM-DD) in the property time zone (ADR-008). */
export function todayIn(tz: string, now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
}

/**
 * Date as written in the page language (CPY lp-v2 1.3): VI 31/12/2026, EN 31 Dec 2026, KO 2026년 12월 31일 (목),
 * ZH 2026年12月31日周四, RU чт, 31 декабря 2026 г.
 */
export function fmtDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  if (lang === 'vi') return `${d}/${m}/${y}`;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (lang === 'en')
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return date.toLocaleDateString(INTL_LOCALE[lang], {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** HH:MM of an instant in the property time zone. */
export function hhmm(instant: string | Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(typeof instant === 'string' ? new Date(instant) : instant);
}

/** Phone as typed (V-02): 8–15 digits, optional leading +, spaces/dots/dashes/brackets ignored. */
export function validPhone(value: string): boolean {
  return /^\+?\d{8,15}$/.test(value.replace(/[\s().-]/g, ''));
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** 13–19 digits in a row (spaces or dashes allowed) = a card number: never sent (SR-PAY-09). */
export function looksLikeCard(text: string): boolean {
  return /(?:\d[ -]?){13,19}/.test(text);
}

/** Guests counted against the room capacity: adults + children 6–11; under-6s are not counted (BR-110). */
export function overCapacity(capacity: number | null, adults: number, children: number): boolean {
  return capacity !== null && adults + children > capacity;
}

/**
 * UTM of the page URL (WebsiteUtm): lower case, characters outside [a-z0-9._-] → "-", at most 64, empty dropped.
 * Read from the address bar only – no cookie, no storage.
 */
export function utmOf(search: string): NonNullable<BookingInput['utm']> {
  const q = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const k of ['source', 'medium', 'campaign'] as const) {
    const v = (q.get(`utm_${k}`) ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .slice(0, 64);
    if (v && /[a-z0-9]/.test(v)) out[k] = v;
  }
  return out;
}

/** Host of the referrer when it is another site (refHost), never a path or query; own site → undefined. */
export function refHostOf(referrer: string, ownHost: string): string | undefined {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host || host === ownHost.toLowerCase() || !/^[a-z0-9.-]{1,100}$/.test(host))
      return undefined;
    return host;
  } catch {
    return undefined;
  }
}

export interface FormValues {
  /** Move-in date (FB-INV-010: the landing sells long stays only – no by-the-night dates). */
  arrival: string;
  /** Number of months, one of MONTH_CHOICES (required). */
  months: string;
  adults: number;
  children: number;
  infants: number;
  roomType: string;
  guestName: string;
  preferredChannel: 'zalo' | 'whatsapp' | 'phone' | 'email';
  phone: string;
  email: string;
  note: string;
  consent: boolean;
  website: string;
  locale: Lang;
  search: string;
  pathname: string;
  referrer: string;
  ownHost: string;
  consentVersion: string;
  /**
   * `PublicPriceEstimate.estimateToken` of the number on screen – only when it was computed for exactly the room,
   * dates and party of this request (price-estimate.ts tokenFor); never while the estimate is loading (ARC lp-v2 2.7).
   */
  priceEstimateToken?: string;
}

/**
 * The request body (minus the form token), built only after the form validated (consent ticked): one way to reach
 * the guest (SEC ARC-14 – phone XOR email), always `stayType = long` + `months` (FB-INV-010 Dot 1: the landing sells
 * long stays only, a number of months is required), children/infants by age group, contract key names only.
 */
export function buildDraft(v: FormValues): BookingDraft {
  const months = Number(v.months);
  const draft: BookingDraft = {
    stayType: 'long',
    arrival: v.arrival,
    months: Number.isInteger(months) && months >= 1 ? months : null,
    adults: v.adults,
    children: v.children,
    infants: v.infants,
    guestName: v.guestName.trim(),
    preferredChannel: v.preferredChannel,
    locale: v.locale,
    consent: true,
    consentVersion: v.consentVersion,
    utm: utmOf(v.search),
    landingPath: v.pathname.slice(0, 200),
  };
  if (v.roomType) draft.roomType = v.roomType;
  if (v.preferredChannel === 'email') draft.email = v.email.trim();
  else draft.phone = v.phone.trim();
  const note = v.note.trim();
  if (note) draft.note = note;
  if (v.website) draft.website = v.website;
  if (v.priceEstimateToken) draft.priceEstimateToken = v.priceEstimateToken;
  const refHost = refHostOf(v.referrer, v.ownHost);
  if (refHost) draft.refHost = refHost;
  return draft;
}

export interface PromiseText {
  when: string;
  /** HH:MM for the way-out line "If you have not heard from us by …" (SEC UXD-05) – the public promise, not replyBy. */
  by: string;
  callNow: boolean;
}

/** Thank-you sentences from the 202 `promise` (BR-912 (4) v0.3.8). `minutes` comes from the server; the page
 *  parameters (site.json `booking`) are only the fallback when the field is missing. */
export function promiseText(
  p: BookingPromise,
  strings: {
    withinMinutes: (m: number, open: string, close: string) => string;
    nextMorning: (by: string, open: string) => string;
    callNow: (m: number) => string;
  },
  cfg: { tz: string; open: string; close: string; withinMinutes: number; callNowMinutes: number },
): PromiseText {
  const by = hhmm(p.by, cfg.tz);
  if (p.kind === 'next_morning')
    return { when: strings.nextMorning(by, cfg.open), by, callNow: false };
  if (p.kind === 'call_now')
    return { when: strings.callNow(p.minutes ?? cfg.callNowMinutes), by, callNow: true };
  return {
    when: strings.withinMinutes(p.minutes ?? cfg.withinMinutes, cfg.open, cfg.close),
    by,
    callNow: false,
  };
}

// ---------- Monthly price (FB-INV-010 Dot 1; OpenAPI 0.3.13 add-on 2) ----------
// The landing sells long stays only (INV 16/11). Two public reads, same origin through the landing proxy:
//  - getPublicMonthlyRates – once on page load: "From X / month" per room type on the room cards (and in the form
//    box while no move-in date is chosen);
//  - getPublicPriceEstimate with stayType=long&months=n – in the form: the monthly rate at the move-in date and the
//    total for the months chosen (listed monthly rate × months; final rate in the quote).
// A figure is drawn only when the API gave a positive whole number for that room type – never a 0, never a guess.

export type PublicPriceEstimate = components['schemas']['PublicPriceEstimate'];
export type PublicMonthlyRates = components['schemas']['PublicMonthlyRates'];

/** Query of getPublicPriceEstimate by the month – inputs only, no personal data (ARC lp-v2 2.2). */
export interface EstimateQuery {
  roomType: string;
  stayType: 'long';
  arrival: string;
  months: number;
  adults: number;
  children: number;
  infants: number;
}

/**
 * Why there is no query: S0 `idle` (nothing to price, or a party the room cannot sleep), S1 `any-room`, or
 * `no-date` – a room type is chosen but no valid move-in date yet: the box may show that type's "From X / month" from
 * getPublicMonthlyRates (no token, no total) instead of asking.
 */
export type EstimateWait = 'idle' | 'any-room' | 'no-date';

/** Months the form offers (CPY Dot 1, INV 16/11). */
export const MONTH_CHOICES = [1, 2, 3, 6, 12, 24] as const;

const isMoney = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x > 0;

/**
 * When the form may ask for a price (UXD lp-v2 3.2, ARC 2.8): a room type + a move-in date in the booking window +
 * a number of months + a party the room can sleep. Never called on page load.
 */
export function estimateQuery(
  v: Pick<FormValues, 'arrival' | 'months' | 'adults' | 'children' | 'infants' | 'roomType'>,
  ctx: { today: string; max: string; capacity: number | null },
): EstimateQuery | EstimateWait {
  if (!v.roomType) return 'any-room';
  if (overCapacity(ctx.capacity, v.adults, v.children)) return 'idle';
  const dateOk =
    /^\d{4}-\d{2}-\d{2}$/.test(v.arrival) && v.arrival >= ctx.today && v.arrival <= ctx.max;
  if (!dateOk) return 'no-date';
  const months = Number(v.months);
  if (!(MONTH_CHOICES as readonly number[]).includes(months)) return 'idle';
  return {
    roomType: v.roomType,
    stayType: 'long',
    arrival: v.arrival,
    months,
    adults: v.adults,
    children: v.children,
    infants: v.infants,
  };
}

/** Query string in a fixed order (cache key in the page, URL of the request). */
export function estimateSearch(q: EstimateQuery): string {
  const p = new URLSearchParams();
  p.set('roomType', q.roomType);
  p.set('stayType', q.stayType);
  p.set('arrival', q.arrival);
  p.set('months', String(q.months));
  p.set('adults', String(q.adults));
  p.set('children', String(q.children));
  p.set('infants', String(q.infants));
  return p.toString();
}

/**
 * Amount as the page writes it (CPY lp-v2 2.3): whole dong, digits grouped the way of the page language, "VND" after
 * the number, never "₫" or a converted currency – en/ko/zh 9,000,000 VND · vi 9.000.000 VND · ru 9 000 000 VND.
 */
export function formatVnd(n: number, lang: Lang): string {
  const num = new Intl.NumberFormat(INTL_LOCALE[lang], { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
  return `${num}\u00a0VND`;
}

/**
 * Minimal shape check of a 200 price-estimate body – anything else is treated as an error (the box shows no number).
 * With a price, only the monthly answer is accepted: a positive monthly figure, and a total that is null or positive.
 */
export function isEstimate(body: unknown): body is PublicPriceEstimate {
  const b = body as PublicPriceEstimate | null;
  if (!b || b.estimate !== true || typeof b.priceAvailable !== 'boolean' || !Array.isArray(b.notes))
    return false;
  if (!b.priceAvailable) return true;
  const ls = b.longStay;
  return (
    b.stayKind === 'long' &&
    !!ls &&
    isMoney(ls.monthlyFromVnd) &&
    (ls.totalVnd === null || ls.totalVnd === undefined || isMoney(ls.totalVnd))
  );
}

/** Shape check of a 200 monthly-rates body (allowlist of what the page reads). */
export function isMonthlyRates(body: unknown): body is PublicMonthlyRates {
  const b = body as PublicMonthlyRates | null;
  return (
    !!b && b.estimate === true && typeof b.taxIncluded === 'boolean' && Array.isArray(b.roomTypes)
  );
}

/**
 * "From" figure per room-type slug. Entries without a positive whole number are dropped (the card keeps its
 * "Monthly rate on request" text); a slug listed twice keeps the lower figure.
 */
export function monthlyFromBySlug(body: PublicMonthlyRates): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of body.roomTypes) {
    if (!r || typeof r.roomType !== 'string' || !isMoney(r.monthlyFromVnd)) continue;
    const prev = out.get(r.roomType);
    out.set(r.roomType, prev === undefined ? r.monthlyFromVnd : Math.min(prev, r.monthlyFromVnd));
  }
  return out;
}

/** What the price box shows (UXD lp-v2 3.3 S3/S6, CPY Dot 1 section 7). */
export interface EstimateView {
  /** price = a monthly figure; unavailable = S6 (no online figure for this request). */
  kind: 'price' | 'unavailable';
  /** Main line, split around the amount: [before, amount, after] (the amount is drawn in Lora). */
  main?: [string, string, string];
  /** Numeric value of the amount (<data value>). */
  value?: number;
  /** Total for the months chosen (from 2 months on). */
  lines: string[];
  note: string[];
  /** role=status sentence. */
  live: string;
  /** Thank-you line "Monthly rate: From X / month" when the rate is sent with the request. */
  done: string;
}

/**
 * Sentences of one block written one after the other (FB-R4-UXD-FE-08): Chinese closes each sentence with "。" and
 * puts no space after it; the other languages separate sentences with a space.
 */
export function joinSentences(parts: readonly string[], lang: Lang): string {
  return parts.join(lang === 'zh' ? '' : ' ');
}

const MARK = '\u0001';
const split = (sentence: string, amount: string): [string, string, string] => {
  const [a = '', b = ''] = sentence.split(MARK);
  return [a, amount, b];
};

export interface ViewStrings {
  estimate: Pick<
    EstimateStrings,
    | 'fromMonth'
    | 'note'
    | 'total'
    | 'final'
    | 'unavailable'
    | 'currency'
    | 'taxIn'
    | 'taxOut'
    | 'live'
    | 'done'
  >;
  e: { cap: (n: string) => string };
}

/**
 * The monthly figure (from the estimate, or from monthly-rates while no move-in date is chosen). Note order (CPY Dot 1
 * section 7, INV 16/11 "Taxes included"): taxIn/taxOut → currency (not vi) → note → final.
 */
export function monthlyView(
  monthlyFromVnd: number,
  taxIncluded: boolean,
  S: ViewStrings,
  lang: Lang,
  total?: { vnd: number; months: number; label: string },
): EstimateView {
  const E = S.estimate;
  const sep = lang === 'zh' ? '：' : ': ';
  const amount = formatVnd(monthlyFromVnd, lang);
  const lines =
    total && total.months > 1 && isMoney(total.vnd) && total.label
      ? [E.total(formatVnd(total.vnd, lang), total.label)]
      : [];
  return {
    kind: 'price',
    main: split(E.fromMonth(MARK), amount),
    value: monthlyFromVnd,
    lines,
    note: [
      taxIncluded ? E.taxIn : E.taxOut,
      ...(lang === 'vi' ? [] : [E.currency]),
      E.note,
      E.final,
    ],
    live: E.live(amount),
    done: `${E.done}${sep}${E.fromMonth(amount)}`,
  };
}

/** The view of a 200 price-estimate answer by the month. */
export function estimateView(
  r: PublicPriceEstimate,
  S: ViewStrings,
  lang: Lang,
  /** capacity: data-cap of the room type (S6 party message); monthsLabel: label of the chosen months option. */
  opts: { capacity?: number | null; monthsLabel?: string } = {},
): EstimateView {
  const E = S.estimate;
  const ls = r.longStay;
  if (!r.priceAvailable || r.stayKind !== 'long' || !ls || !isMoney(ls.monthlyFromVnd)) {
    const live =
      r.unavailableReason === 'party_exceeds_room' && opts.capacity
        ? S.e.cap(String(opts.capacity))
        : E.unavailable;
    return { kind: 'unavailable', lines: [], note: [], live, done: '' };
  }
  const total =
    ls.months && ls.totalVnd
      ? { vnd: ls.totalVnd, months: ls.months, label: opts.monthsLabel ?? '' }
      : undefined;
  return monthlyView(ls.monthlyFromVnd, r.taxIncluded, S, lang, total);
}
