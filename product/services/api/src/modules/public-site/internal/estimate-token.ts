/**
 * Website price-estimate token `pe1` (OpenAPI 0.3.10 getPublicPriceEstimate.estimateToken; ARC lp-v2-design 2.7):
 *   `pe1.` + base64url(payload JSON) + `.` + base64url(HMAC-SHA256(K, `pe1|<propertyId>|<payload base64url>`))
 * K = the HKDF sub-key `keyedHash('public_estimate', …)` of the existing ID hash key – no new secret, no .env change.
 * The payload holds the normalised inputs, the number shown, `priceVersion`, `iat` and `exp` (24 h) – no personal
 * data and no property id (the property is in the signed message only). Pure: the signer is passed in.
 */
import { timingSafeEqual } from 'node:crypto';

export const ESTIMATE_TOKEN_TTL_SECONDS = 24 * 3600;
export const ESTIMATE_TOKEN = /^pe1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Payload keys (short – the token stays < 400 bytes). */
export interface EstimatePayload {
  /** roomType slug */
  rt: string;
  /** stayType of the form (short | long) */
  st: 'short' | 'long';
  /** arrival */
  a: string;
  /** departure (short) or null */
  d: string | null;
  /** months (long) or null */
  m: number | null;
  ad: number;
  c: number;
  i: number;
  /** total of the "from" room (short stay) */
  tot?: number;
  /** nights (short) */
  n?: number;
  /** BR-107 % shown */
  los?: number;
  /** extra-person fee shown */
  xp?: number;
  /** priceVersion */
  pv: string;
  /** issued / computed at (unix s) */
  iat: number;
  /** expires (unix s) */
  exp: number;
}

/** HMAC of the signed message, hex (CryptoService.keyedHash('public_estimate', message)). */
export type EstimateSigner = (message: string) => string;

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');

function signature(sign: EstimateSigner, propertyId: string, body: string): string {
  return Buffer.from(sign(`pe1|${propertyId}|${body}`), 'hex').toString('base64url');
}

export function issueEstimateToken(
  sign: EstimateSigner,
  propertyId: string,
  payload: EstimatePayload,
): string {
  const body = b64(JSON.stringify(payload));
  return `pe1.${body}.${signature(sign, propertyId, body)}`;
}

export type EstimateCheck =
  | { ok: true; payload: EstimatePayload }
  | { ok: false; reason: 'format' | 'signature' | 'expired' };

const isInt = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v);

function wellFormed(p: unknown): p is EstimatePayload {
  const o = p as Record<string, unknown> | null;
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  return (
    typeof o.rt === 'string' &&
    (o.st === 'short' || o.st === 'long') &&
    typeof o.a === 'string' &&
    (o.d === null || typeof o.d === 'string') &&
    (o.m === null || isInt(o.m)) &&
    isInt(o.ad) &&
    isInt(o.c) &&
    isInt(o.i) &&
    (o.tot === undefined || isInt(o.tot)) &&
    typeof o.pv === 'string' &&
    isInt(o.iat) &&
    isInt(o.exp)
  );
}

/** Signature (constant time), then expiry. Never throws. */
export function verifyEstimateToken(
  sign: EstimateSigner,
  propertyId: string,
  token: unknown,
  now: Date,
): EstimateCheck {
  if (typeof token !== 'string' || token.length > 600 || !ESTIMATE_TOKEN.test(token)) {
    return { ok: false, reason: 'format' };
  }
  const [, body, sig] = token.split('.') as [string, string, string];
  const expected = Buffer.from(signature(sign, propertyId, body), 'utf8');
  const given = Buffer.from(sig, 'utf8');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'signature' };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (!wellFormed(payload)) return { ok: false, reason: 'format' };
  if (Math.floor(now.getTime() / 1000) >= payload.exp) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
}

/** The request the token was computed for = the request being submitted (every input, ARC 2.7). */
export function tokenMatches(
  p: EstimatePayload,
  r: {
    roomType: string | null;
    stayType: 'short' | 'long';
    arrival: string;
    departure: string | null;
    months: number | null;
    adults: number;
    children: number;
    infants: number;
  },
): boolean {
  return (
    r.roomType !== null &&
    p.rt === r.roomType &&
    p.st === r.stayType &&
    p.a === r.arrival &&
    p.d === (r.stayType === 'short' ? r.departure : null) &&
    p.m === (r.stayType === 'long' ? r.months : null) &&
    p.ad === r.adults &&
    p.c === r.children &&
    p.i === r.infants
  );
}
