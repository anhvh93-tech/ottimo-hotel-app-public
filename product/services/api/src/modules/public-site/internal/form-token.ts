/**
 * Signed one-time form token (OpenAPI getPublicFormToken; ADR-014 4.4 tầng 1; SEC ARC-23):
 *   token = "v1." + base64url( issuedAt (8 bytes, ms, big endian) | nonce (16 bytes CSPRNG) | HMAC-SHA256 (32) )
 *   HMAC key = PUBLIC_FORM_SIGNING_KEY (from PUBLIC_FORM_SIGNING_KEY_FILE – bootstrap reads X_FILE secrets);
 *   HMAC input = `${propertyId}|${issuedAt}|${nonceHex}`.
 * Usable in [issuedAt + 3 s, issuedAt + 2 h) and ONCE (the nonce hash goes into public_form_nonce at use).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const FORM_TOKEN_MIN_DELAY_SECONDS = 3;
export const FORM_TOKEN_TTL_MS = 2 * 60 * 60_000;

export interface IssuedFormToken {
  token: string;
  issuedAt: Date;
  notBefore: Date;
  expiresAt: Date;
}

export function issueFormToken(key: string, propertyId: string, now: Date): IssuedFormToken {
  const issued = now.getTime();
  const nonce = randomBytes(16);
  const head = Buffer.alloc(8);
  head.writeBigUInt64BE(BigInt(issued));
  const mac = sign(key, propertyId, issued, nonce);
  return {
    token: `v1.${Buffer.concat([head, nonce, mac]).toString('base64url')}`,
    issuedAt: new Date(issued),
    notBefore: new Date(issued + FORM_TOKEN_MIN_DELAY_SECONDS * 1000),
    expiresAt: new Date(issued + FORM_TOKEN_TTL_MS),
  };
}

export type FormTokenCheck =
  | { ok: true; nonceHash: Buffer; expiresAt: Date }
  | { ok: false; reason: 'format' | 'signature' | 'too_early' | 'expired' };

/** Signature, property, time window. The one-time use is the caller's INSERT of `nonceHash`. */
export function verifyFormToken(
  key: string,
  propertyId: string,
  token: string,
  now: Date,
): FormTokenCheck {
  if (!token.startsWith('v1.')) return { ok: false, reason: 'format' };
  let raw: Buffer;
  try {
    raw = Buffer.from(token.slice(3), 'base64url');
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (raw.length !== 8 + 16 + 32) return { ok: false, reason: 'format' };
  const issued = Number(raw.readBigUInt64BE(0));
  const nonce = raw.subarray(8, 24);
  const mac = raw.subarray(24);
  const expected = sign(key, propertyId, issued, nonce);
  if (!timingSafeEqual(mac, expected)) return { ok: false, reason: 'signature' };
  const t = now.getTime();
  if (t < issued + FORM_TOKEN_MIN_DELAY_SECONDS * 1000) return { ok: false, reason: 'too_early' };
  if (t >= issued + FORM_TOKEN_TTL_MS) return { ok: false, reason: 'expired' };
  return {
    ok: true,
    nonceHash: createHash('sha256').update(nonce).digest(),
    expiresAt: new Date(issued + FORM_TOKEN_TTL_MS),
  };
}

function sign(key: string, propertyId: string, issued: number, nonce: Buffer): Buffer {
  return createHmac('sha256', key)
    .update(`${propertyId}|${issued}|${nonce.toString('hex')}`, 'utf8')
    .digest();
}
