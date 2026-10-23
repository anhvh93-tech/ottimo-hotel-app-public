/**
 * BE-C R3 Sprint 1 – units without a database: TOTP against the RFC 6238 vectors, window/anti-replay,
 * recovery codes (entropy, format, normalisation), the otpauth URI (SEC 06.8), secret fields (SEC 06.22),
 * the S2 operation list against OpenAPI `x-strong-reauth`, the restricted-session allowlist (SEC 06.4).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { STRONG_REAUTH_OPERATIONS } from '../src/modules/identity/public/strong-reauth';
import {
  base32Decode,
  base32Encode,
  matchTotp,
  newRecoveryCodes,
  normaliseRecoveryCode,
  otpauthUri,
  recoveryCodeHash,
  totpAt,
  totpStep,
} from '../src/modules/identity/public/totp';
import { SECRET_BODY_FIELDS, withoutSecrets } from '../src/shared/secret-fields';
import { MFA_ENROLLMENT_OPERATIONS } from '../src/shared/http/auth.guard';

const RFC_SECRET = Buffer.from('12345678901234567890', 'ascii');

describe('TOTP (RFC 6238 SHA-1, 6 digits, 30 s)', () => {
  it('matches the RFC 6238 appendix B vectors (last 6 of the 8 digits)', () => {
    const vectors: Array<[number, string]> = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1111111111, '14050471'],
      [1234567890, '89005924'],
      [2000000000, '69279037'],
      [20000000000, '65353130'],
    ];
    for (const [t, eight] of vectors) {
      expect(totpAt(RFC_SECRET, Math.floor(t / 30), 8)).toBe(eight);
      expect(totpAt(RFC_SECRET, Math.floor(t / 30))).toBe(eight.slice(2));
    }
  });

  it('accepts steps −1, 0, +1 and refuses −2, +2 (SEC A.7 case 3)', () => {
    const now = new Date(1_800_000_000_000);
    const s = totpStep(now);
    for (const d of [-1, 0, 1]) {
      expect(matchTotp(RFC_SECRET, totpAt(RFC_SECRET, s + d), now, null)).toBe(s + d);
    }
    for (const d of [-2, 2])
      expect(matchTotp(RFC_SECRET, totpAt(RFC_SECRET, s + d), now, null)).toBeNull();
  });

  it('anti-replay: a code of a step ≤ the last used step is refused like a wrong code', () => {
    const now = new Date(1_800_000_000_000);
    const s = totpStep(now);
    const code = totpAt(RFC_SECRET, s);
    expect(matchTotp(RFC_SECRET, code, now, s)).toBeNull();
    expect(matchTotp(RFC_SECRET, code, now, s - 1)).toBe(s);
    expect(matchTotp(RFC_SECRET, totpAt(RFC_SECRET, s - 1), now, s - 1)).toBeNull();
    expect(matchTotp(RFC_SECRET, 'abcdef', now, null)).toBeNull();
  });

  it('base32 round trip', () => {
    const b = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 7]);
    expect(base32Decode(base32Encode(b))).toEqual(b);
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
  });
});

describe('recovery codes (SEC 06.12)', () => {
  it('10 distinct codes, 16 Crockford characters (80 bit) shown 4-4-4-4', () => {
    const codes = newRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const c of codes) expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
  });

  it('normalises dashes, spaces, case and Crockford aliases; hash is SHA-256 hex', () => {
    const [c] = newRecoveryCodes(1);
    const n = normaliseRecoveryCode(c as string) as string;
    expect(normaliseRecoveryCode((c as string).toLowerCase().replace(/-/g, ' '))).toBe(n);
    expect(normaliseRecoveryCode('O0O0-I1L1-0000-0000')).toBe('0000111100000000');
    expect(normaliseRecoveryCode('short')).toBeNull();
    expect(normaliseRecoveryCode('UUUU-UUUU-UUUU-UUUU')).toBeNull();
    expect(recoveryCodeHash(n)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('otpauth URI (SEC 06.8)', () => {
  it('label OTTIMO:<username>, issuer OTTIMO, nothing else about the person', () => {
    const uri = otpauthUri('minh.own', RFC_SECRET);
    expect(uri.startsWith('otpauth://totp/OTTIMO%3Aminh.own?')).toBe(true);
    const q = new URL(uri.replace('otpauth://', 'https://')).searchParams;
    expect(q.get('issuer')).toBe('OTTIMO');
    expect(base32Decode(q.get('secret') as string)).toEqual(RFC_SECRET);
    expect([...q.keys()].sort()).toEqual(['algorithm', 'digits', 'issuer', 'period', 'secret']);
  });
});

describe('secrets never kept (SEC 06.22)', () => {
  it('mfaToken, recoveryCode(s), otpauthUri, totpCode are secret body fields at any depth', () => {
    for (const f of ['mfaToken', 'recoveryCode', 'recoveryCodes', 'otpauthUri', 'totpCode']) {
      expect(SECRET_BODY_FIELDS.has(f)).toBe(true);
    }
    expect(
      withoutSecrets({
        reauth: { password: 'x', totpCode: '123456', recoveryCode: 'AAAA' },
        reason: 'r',
      }),
    ).toEqual({
      reauth: { password: '[secret]', totpCode: '[secret]', recoveryCode: '[secret]' },
      reason: 'r',
    });
  });
});

describe('contract lists', () => {
  const spec = parse(
    readFileSync(join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml'), 'utf8'),
  ) as {
    paths: Record<string, Record<string, { operationId?: string; 'x-strong-reauth'?: unknown }>>;
  };
  const ops = Object.values(spec.paths).flatMap((p) => Object.values(p));

  it('STRONG_REAUTH_OPERATIONS equals the operations marked x-strong-reauth (ARC 1.2)', () => {
    const marked = ops
      .filter((o) => o && typeof o === 'object' && o['x-strong-reauth'] !== undefined)
      .map((o) => o.operationId as string)
      .sort();
    expect([...STRONG_REAUTH_OPERATIONS].sort()).toEqual(marked);
  });

  it('restricted session allowlist = SEC 06.4 / OpenAPI login description', () => {
    expect([...MFA_ENROLLMENT_OPERATIONS].sort()).toEqual(
      ['confirmMy2fa', 'getMe', 'getMy2fa', 'logout', 'startMy2faSetup'].sort(),
    );
  });
});
