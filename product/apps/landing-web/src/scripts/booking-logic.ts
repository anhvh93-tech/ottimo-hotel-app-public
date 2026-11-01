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
  stayType: 'short' | 'long';
  checkIn: string;
  checkOut: string;
  arrival: string;
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
 * The request body (minus the form token), built only after the form validated (consent ticked): one way to reach the guest (SEC ARC-14 – phone XOR email), stayType +
 * departure or months (null = "Not sure yet"), children/infants by age group, contract key names only.
 */
export function buildDraft(v: FormValues): BookingDraft {
  const draft: BookingDraft = {
    stayType: v.stayType,
    arrival: v.stayType === 'short' ? v.checkIn : v.arrival,
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
  if (v.stayType === 'short') draft.departure = v.checkOut;
  else draft.months = v.months ? Number(v.months) : null;
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

// ---------- Price estimate in the form (LP-v2, FB-INV-009; OpenAPI 0.3.9 getPublicPriceEstimate) ----------

/**
 * `PublicPriceEstimate` of OpenAPI 0.3.9-draft as fixed on lp-v2-be (63c5731e, ESC-043): no monthly figure at all –
 * `stayType = long` or a short stay over the monthly threshold → `priceAvailable: false` + `monthly_offer`
 * (allowlist – nothing else is ever read).
 */
export interface PublicPriceEstimate {
  estimate: true;
  currency: 'VND';
  taxIncluded: boolean;
  roomType: string;
  stayKind: 'short' | 'long';
  arrival: string;
  departure?: string;
  priceAvailable: boolean;
  /** party_exceeds_room and on_request win over monthly_offer (BE). */
  unavailableReason?: 'on_request' | 'party_exceeds_room' | 'monthly_offer';
  shortStay?: {
    nights: number;
    roomSubtotalVnd: number;
    upliftNights: number;
    losDiscountPct: number;
    losDiscountVnd: number;
    extraPersonFeeVnd: number;
    totalVnd: number;
    nightlyAvgVnd: number;
  };
  notes: { code: string; minNights?: number }[];
  computedAt: string;
  estimateToken?: string;
  expiresAt?: string;
}

/** Query of getPublicPriceEstimate – inputs only, no personal data (ARC lp-v2 2.2). */
export interface EstimateQuery {
  roomType: string;
  stayType: 'short' | 'long';
  arrival: string;
  departure?: string;
  months?: number;
  adults: number;
  children: number;
  infants: number;
}

/**
 * Why there is no query: S0 (dates/room missing or invalid), S1 ("Any room"), or a stay by the month
 * (ESC-043: no figure for monthly stays – the box invites to a monthly offer, nothing is asked).
 */
export type EstimateWait = 'idle' | 'any-room' | 'monthly';

/**
 * When the form may ask for an estimate (UXD lp-v2 3.2, ARC 2.8): a room type + valid dates (or an arrival date by the
 * month) + a party the room can sleep. Same window rules as the form checks; never called on page load.
 */
export function estimateQuery(
  v: Pick<
    FormValues,
    | 'stayType'
    | 'checkIn'
    | 'checkOut'
    | 'arrival'
    | 'months'
    | 'adults'
    | 'children'
    | 'infants'
    | 'roomType'
  >,
  ctx: { today: string; max: string; capacity: number | null },
): EstimateQuery | EstimateWait {
  const inWindow = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= ctx.today && d <= ctx.max;
  const datesOk =
    v.stayType === 'short'
      ? inWindow(v.checkIn) && /^\d{4}-\d{2}-\d{2}$/.test(v.checkOut) && v.checkOut > v.checkIn
      : inWindow(v.arrival);
  if (!datesOk) return 'idle';
  // By the month: never a figure (ESC-043) – the box shows the offer (asking once only while the page does not know
  // whether prices are on: monthlyProbeQuery). A long stay BY THE NIGHT is asked: the API owns the monthly threshold
  // (BR-108 – 30 nights from INV 01/11) and answers monthly_offer, so the price box has no copy of that number.
  if (v.stayType === 'long') return 'monthly';
  if (!v.roomType) return 'any-room';
  if (overCapacity(ctx.capacity, v.adults, v.children)) return 'idle';
  const q: EstimateQuery = {
    roomType: v.roomType,
    stayType: v.stayType,
    arrival: v.stayType === 'short' ? v.checkIn : v.arrival,
    adults: v.adults,
    children: v.children,
    infants: v.infants,
  };
  q.departure = v.checkOut;
  return q;
}

/**
 * FB-R4-UXD-FE-01: a guest who opens "By the month" first must still see the monthly invitation. While the page does
 * not know yet whether prices are on (no 200 so far), it asks ONCE with `stayType=long` (no departure, no months –
 * OpenAPI 0.3.9: `departure` with `long` = NOT_ALLOWED): 200 `monthly_offer` → the invitation, 404 → the box stays off
 * (ARC 2.8). Same inputs as any estimate (room type, arrival, party – no personal data). "Any room" asks with the
 * first room type of the list: the answer only says whether prices are on, the invitation names no room.
 */
export function monthlyProbeQuery(
  v: Pick<FormValues, 'arrival' | 'adults' | 'children' | 'infants' | 'roomType'>,
  fallbackRoom: string,
): EstimateQuery | null {
  const roomType = v.roomType || fallbackRoom;
  if (!roomType || !/^\d{4}-\d{2}-\d{2}$/.test(v.arrival)) return null;
  return {
    roomType,
    stayType: 'long',
    arrival: v.arrival,
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
  if (q.departure) p.set('departure', q.departure);
  if (q.months !== undefined) p.set('months', String(q.months));
  p.set('adults', String(q.adults));
  p.set('children', String(q.children));
  p.set('infants', String(q.infants));
  return p.toString();
}

/**
 * Amount as the page writes it (CPY lp-v2 2.3): whole dong, digits grouped the way of the page language, "VND" after
 * the number, never "₫" or a converted currency – en/ko/zh 2,363,000 VND · vi 2.363.000 VND · ru 2 363 000 VND.
 */
export function formatVnd(n: number, lang: Lang): string {
  const num = new Intl.NumberFormat(INTL_LOCALE[lang], { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
  return `${num}\u00a0VND`;
}

/** Minimal shape check of a 200 body – anything else is treated as an error (the box shows no number). */
export function isEstimate(body: unknown): body is PublicPriceEstimate {
  const b = body as PublicPriceEstimate | null;
  if (!b || b.estimate !== true || typeof b.priceAvailable !== 'boolean' || !Array.isArray(b.notes))
    return false;
  if (!b.priceAvailable) return true;
  const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x > 0;
  if (b.stayKind === 'short')
    return !!b.shortStay && num(b.shortStay.totalVnd) && b.shortStay.nights >= 1;
  return b.stayKind === 'long'; // shown as the monthly offer, no figure (ESC-043)
}

/** What the estimate box shows for a 200 answer (UXD lp-v2 3.3 S3–S6, CPY lp-v2 2). */
export interface EstimateView {
  /** price = S3; offer = S4/S5 monthly invitation without a figure (ESC-043); unavailable = S6 */
  kind: 'price' | 'offer' | 'unavailable';
  /** Main line, split around the amount: [before, amount, after] (the amount is drawn in Lora). */
  main?: [string, string, string];
  /** Numeric value of the amount (<data value>). */
  value?: number;
  lines: string[];
  note: string[];
  /** role=status sentence. */
  live: string;
  /** Thank-you line "Estimated rate: …" when the estimate is sent with the request. */
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

export function estimateView(
  r: PublicPriceEstimate,
  S: {
    estimate: Pick<
      EstimateStrings,
      | 'final'
      | 'total'
      | 'longStay'
      | 'unavailable'
      | 'currency'
      | 'taxIn'
      | 'taxOut'
      | 'extraGuest'
      | 'live'
      | 'done'
      | 'minStay'
    >;
    nights: (n: number) => string;
    e: { cap: (n: string) => string };
    priceMonthlyOffer: { label: string; text: string; live: string };
  },
  lang: Lang,
  opts: { capacity?: number | null } = {},
): EstimateView {
  const E = S.estimate;
  const sep = lang === 'zh' ? '：' : ': ';
  // ESC-043 (INV 01/11): by the month, or over the monthly threshold, no number – only the monthly offer
  if (r.unavailableReason === 'monthly_offer') return monthlyOfferView(S);
  if (!r.priceAvailable) {
    const minStay = r.notes.find((n) => n.code === 'min_stay');
    const live =
      r.unavailableReason === 'party_exceeds_room' && opts.capacity
        ? S.e.cap(String(opts.capacity))
        : minStay
          ? E.minStay(minStay.minNights ?? 2)
          : E.unavailable;
    return { kind: 'unavailable', lines: [], note: [], live, done: '' };
  }
  if (r.stayKind === 'long') return monthlyOfferView(S); // never a monthly figure, whatever the body says
  if (!r.shortStay)
    return { kind: 'unavailable', lines: [], note: [], live: E.unavailable, done: '' };
  const st = r.shortStay;
  const amount = formatVnd(st.totalVnd, lang);
  const nights = S.nights(st.nights);
  // no average a night (DOM: weekend/special nights differ – BE lp-v2 6), a sentence for the discount, no amount
  const lines: string[] = [];
  if (st.losDiscountPct > 0 || st.losDiscountVnd > 0) lines.push(E.longStay);
  if (st.extraPersonFeeVnd > 0) lines.push(E.extraGuest);
  return {
    kind: 'price',
    // the amount stands on its own line; the nights phrase is the line above (ko/zh) or below (en/vi/ru) – UXD FE-04
    // (nights(n) already holds U+00A0 between the number and the word – CPY 13.5)
    main: split(E.total(MARK, nights), amount),
    value: st.totalVnd,
    lines,
    note: [...(lang === 'vi' ? [] : [E.currency]), r.taxIncluded ? E.taxIn : E.taxOut, E.final],
    live: E.live(amount, nights),
    done: `${E.done}${sep}${E.total(amount, nights)}`,
  };
}

/**
 * ESC-043 (INV 01/11): a stay by the month – or a stay by the night from the monthly threshold on (BR-108, 30 nights
 * from INV 01/11; the API decides) – shows no figure, only the invitation to a monthly offer in our quote (CPY
 * lp-v2-copy 12.1 `priceMonthlyOffer`); the "Estimated rate" title is hidden. The spoken line is CPY's own sentence
 * `priceMonthlyOffer.live` (13.2 – zh with "。", never a code-made "label. text" – FB-R4-UXD-FE-08).
 */
export function monthlyOfferView(S: {
  priceMonthlyOffer: { label: string; text: string; live: string };
}): EstimateView {
  return { kind: 'offer', lines: [], note: [], live: S.priceMonthlyOffer.live, done: '' };
}
