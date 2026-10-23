// TOTP for the US-143 E2E cases (RFC 6238: HMAC-SHA-1, 6 digits, 30 s – SEC 06.1, ARC s1-contracts 1.1).
// The secret is read from the otpauth URI the stack returns ONCE (startMy2faSetup) and lives only in test memory:
// never logged, never in an assertion message, never written to a file (SEC 06.22, A.7 #12).
import { createHmac } from 'node:crypto';
import { expect } from '@playwright/test';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(s: string): Buffer {
  const clean = s.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error('otpauth secret: not base32');
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Secret of an `otpauth://totp/…?secret=…` URI (checks the label rules of SEC 06.8 on the way). */
export function secretOfUri(uri: string): Buffer {
  expect(uri.startsWith('otpauth://totp/'), 'otpauth URI').toBe(true);
  const u = new URL(uri.replace('otpauth://', 'https://'));
  expect(u.searchParams.get('issuer')).toBe('OTTIMO');
  const secret = u.searchParams.get('secret');
  expect(secret, 'otpauth URI has a secret').toBeTruthy();
  const key = base32Decode(secret!);
  expect(key.length * 8, 'SEC 06.7: secret ≥ 160 bit').toBeGreaterThanOrEqual(160);
  return key;
}

export const stepOf = (ms: number): number => Math.floor(ms / 30_000);

export function totpAt(key: Buffer, step: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', key).update(msg).digest();
  const off = h[h.length - 1]! & 0x0f;
  const bin = (h.readUInt32BE(off) & 0x7fffffff) % 1_000_000;
  return String(bin).padStart(6, '0');
}

/**
 * Anti-replay (SEC 06.18): the server refuses a code whose step ≤ the last step used by that USER (any secret).
 * Tracks the last step this test used per user and waits for the next 30 s step when needed (real clock – the api
 * project does not move the MutableClock). Returns a code of the current step.
 */
export class TotpUser {
  private lastStep = -1;
  constructor(public key: Buffer) {}

  async next(): Promise<string> {
    let step = stepOf(Date.now());
    if (step <= this.lastStep) {
      const waitMs = (this.lastStep + 1) * 30_000 - Date.now() + 300;
      await new Promise((r) => setTimeout(r, Math.max(0, waitMs)));
      step = stepOf(Date.now());
    }
    this.lastStep = step;
    return totpAt(this.key, step);
  }

  /** A code for the step the user is at now WITHOUT marking it used (for "old secret refused" checks). */
  peek(key: Buffer = this.key): string {
    return totpAt(key, stepOf(Date.now()));
  }

  /** Another secret shares the user's anti-replay step (re-enrolment): keep the counter, swap the key. */
  rekey(key: Buffer): void {
    this.key = key;
  }
}
