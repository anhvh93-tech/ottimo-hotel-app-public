/**
 * TOTP (RFC 6238 over RFC 4226 HOTP) and recovery codes for US-143 / SR-AUTH-06 – no third-party library
 * (ARC s1-contracts 1.3: BE-C chooses, ARC reviews the PR). Pure functions, no I/O, no logging.
 * - TOTP: HMAC-SHA-1, 6 digits, 30-second step, window ± 1 step (SEC 06.1, 06.18). Test vectors of RFC 6238
 *   appendix B are in test/be-c-r3-s1-units.test.ts.
 * - Secret: 20 random bytes (160 bit, SEC 06.7), Base32 RFC 4648 without padding in the otpauth URI.
 * - Recovery codes: 16 characters of Crockford Base32 (80 bit), shown 4-4-4-4; stored as SHA-256 hex of the
 *   normalised code (SEC 06.12 – high entropy, so an unsalted hash is acceptable).
 * Comparisons of codes are constant-time (timingSafeEqual).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
/** Accepted clock drift in steps on each side (SEC 06.18). */
export const TOTP_WINDOW = 1;
export const TOTP_SECRET_BYTES = 20;
export const RECOVERY_CODE_COUNT = 10;
/** ≤ this many unused codes → `Me.recoveryCodesLow` (SEC 06.15). */
export const RECOVERY_CODES_LOW = 3;

const RFC4648 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function base32Encode(buf: Buffer, alphabet = RFC4648): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = RFC4648.indexOf(ch);
    if (idx < 0) throw new Error('invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function newTotpSecret(): Buffer {
  return randomBytes(TOTP_SECRET_BYTES);
}

/** 30-second step of an instant (Unix time / 30, floor). */
export function totpStep(now: Date): number {
  return Math.floor(now.getTime() / 1000 / TOTP_STEP_SECONDS);
}

/** HOTP value of `step` (RFC 4226 dynamic truncation), `digits` digits with leading zeros. */
export function totpAt(secret: Buffer, step: number, digits = TOTP_DIGITS): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac('sha1', secret).update(counter).digest();
  const offset = (mac[mac.length - 1] as number) & 0x0f;
  const bin =
    (((mac[offset] as number) & 0x7f) << 24) |
    ((mac[offset + 1] as number) << 16) |
    ((mac[offset + 2] as number) << 8) |
    (mac[offset + 3] as number);
  return String(bin % 10 ** digits).padStart(digits, '0');
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Step that `code` matches within now ± TOTP_WINDOW and strictly after `lastUsedStep` (anti-replay – a code of
 * a step ≤ the last accepted one is refused like a wrong code). null = no match. Every candidate is computed
 * (no early exit on the first comparison) so the time does not depend on which step matched.
 */
export function matchTotp(
  secret: Buffer,
  code: string,
  now: Date,
  lastUsedStep: number | null,
): number | null {
  if (!/^[0-9]{6}$/.test(code)) return null;
  const current = totpStep(now);
  let found: number | null = null;
  for (let d = -TOTP_WINDOW; d <= TOTP_WINDOW; d++) {
    const step = current + d;
    const ok = safeEqual(totpAt(secret, step), code);
    if (ok && found === null && (lastUsedStep === null || step > lastUsedStep)) found = step;
  }
  return found;
}

/** otpauth URI (SEC 06.8): label `OTTIMO:<username>`, issuer OTTIMO – no email, phone or property name. */
export function otpauthUri(username: string, secret: Buffer): string {
  const label = encodeURIComponent(`OTTIMO:${username}`);
  const params = new URLSearchParams({
    secret: base32Encode(secret),
    issuer: 'OTTIMO',
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** One recovery code: 10 random bytes = 80 bit = 16 Crockford characters, displayed XXXX-XXXX-XXXX-XXXX. */
export function newRecoveryCode(): string {
  const raw = base32Encode(randomBytes(10), CROCKFORD);
  return raw.match(/.{4}/g)!.join('-');
}

export function newRecoveryCodes(n = RECOVERY_CODE_COUNT): string[] {
  const out = new Set<string>();
  while (out.size < n) out.add(newRecoveryCode());
  return [...out];
}

/**
 * Normalise what the user typed: drop `-`/spaces, upper case, Crockford aliases (O→0, I/L→1). Returns null
 * when it cannot be a code (wrong length / characters).
 */
export function normaliseRecoveryCode(input: string): string | null {
  const s = input.replace(/[-\s]/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  if (s.length !== 16) return null;
  for (const ch of s) if (!CROCKFORD.includes(ch)) return null;
  return s;
}

/** SHA-256 hex of the normalised code (DB value; app_user.mfa_recovery_codes_hash). */
export function recoveryCodeHash(normalised: string): string {
  return createHash('sha256').update(`ottimo-recovery:${normalised}`).digest('hex');
}

export function hashRecoveryCodes(codes: readonly string[]): string[] {
  return codes.map((c) => recoveryCodeHash(normaliseRecoveryCode(c) as string));
}
