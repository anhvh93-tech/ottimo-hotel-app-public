// RFC 6238 TOTP (SHA-1, 6 digits, 30 s) for the MSW mock and the tests only – the real check lives on the
// server (SEC 06.18). Never imported by app code: the Desk only shows the secret the server sent.

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(input: string): Uint8Array {
  const clean = input.replace(/[\s=-]/g, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const v = B32.indexOf(ch);
    if (v < 0) throw new Error('bad base32');
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function randomBase32(chars: number): string {
  const bytes = new Uint8Array(chars);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => B32[b % 32]).join('');
}

export const STEP_SECONDS = 30;

export function stepAt(ms = Date.now()): number {
  return Math.floor(ms / 1000 / STEP_SECONDS);
}

/** 6-digit code of `secret` for time step `step` (RFC 4226 dynamic truncation). */
export async function totpAt(secret: string, step: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(step / 2 ** 32));
  view.setUint32(4, step >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const off = mac[mac.length - 1]! & 0x0f;
  const bin =
    ((mac[off]! & 0x7f) << 24) | (mac[off + 1]! << 16) | (mac[off + 2]! << 8) | mac[off + 3]!;
  return String(bin % 1_000_000).padStart(6, '0');
}

/** Current code (tests). */
export function totpNow(secret: string, ms = Date.now()): Promise<string> {
  return totpAt(secret, stepAt(ms));
}

/** Step of `code` within ±1 of now, or null (SEC 06.18). */
export async function matchStep(
  secret: string,
  code: string,
  ms = Date.now(),
): Promise<number | null> {
  const now = stepAt(ms);
  for (const s of [now - 1, now, now + 1]) if ((await totpAt(secret, s)) === code) return s;
  return null;
}

/** Secret of an `otpauth://totp/…?secret=…` URI. */
export function secretOfUri(uri: string): string {
  return new URL(uri).searchParams.get('secret') ?? '';
}
