// Pure logic of the booking-request form (concept 5.2–5.4) – no DOM, unit-tested in booking-logic.test.ts.
// Payload keys follow `WebsiteBookingRequestInput` (OpenAPI 0.3.7 add-on 2 – SEC UXD-07: never invent key names).
import type { components } from '../../../../packages/api-client/src/generated/openapi';

export type BookingInput = components['schemas']['WebsiteBookingRequestInput'];
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

/** Date as written in the page language: VI 31/12/2026, EN 31 Dec 2026. */
export function fmtDate(iso: string, lang: 'en' | 'vi'): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  if (lang === 'vi') return `${d}/${m}/${y}`;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
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
  locale: 'en' | 'vi';
  search: string;
  pathname: string;
  referrer: string;
  ownHost: string;
  consentVersion: string;
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

/** Thank-you sentences from the 202 `promise` (BR-912 (4)). */
export function promiseText(
  p: BookingPromise,
  strings: {
    withinMinutes: (m: number, open: string, close: string) => string;
    nextMorning: (by: string, open: string) => string;
    callNow: (m: number) => string;
  },
  hours: { tz: string; open: string; close: string },
): PromiseText {
  const by = hhmm(p.by, hours.tz);
  if (p.kind === 'next_morning')
    return { when: strings.nextMorning(by, hours.open), by, callNow: false };
  if (p.kind === 'call_now') return { when: strings.callNow(p.minutes ?? 30), by, callNow: true };
  return {
    when: strings.withinMinutes(p.minutes ?? 60, hours.open, hours.close),
    by,
    callNow: false,
  };
}
