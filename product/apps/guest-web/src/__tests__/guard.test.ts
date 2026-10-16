// SEC s3-checklist G1/G3/G8 over the guest-web source; the built bundle is checked in bundle.test.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectUsedKeys } from '../../build/used-keys';
import { hasGuestKey } from '../app/i18n';

const SRC = join(__dirname, '..');

function files(dir: string, skip: string[] = []): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return skip.includes(f) ? [] : files(p, skip);
    return /\.(tsx?|js)$/.test(f) ? [p] : [];
  });
}

const appFiles = () => files(SRC, ['__tests__', 'mocks', 'test']);
const appSource = () =>
  appFiles()
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

/** ĐK-6 – strings UXD marked "not used in R2". */
export const FORBIDDEN_KEYS = [
  /guest\.verify\./,
  /guest\.door_code/,
  /guest\.late\.(done_title|code_|how_|prompt|arrival_hint)/,
  /guest\.tab\.bill/,
  /guest\.bill\./,
  /guest\.after_checkout\.body/,
];
/** ĐK-1 – level-2 operations. */
export const FORBIDDEN_PATHS = [
  '/v1/guest/sessions/otp',
  '/v1/guest/sessions/verify',
  '/v1/guest/folio',
  '/withdraw',
  'guest-verification-code',
];
/** ĐK-3 – no client-side persistence of anything. */
const FORBIDDEN_STORAGE = [
  /localStorage/,
  /sessionStorage/,
  /indexedDB/,
  /caches\./,
  /serviceWorker/,
];

describe('guest-web R2 guard rails', () => {
  it('uses no level-2 string, endpoint or storage API in app code', () => {
    const src = appSource();
    for (const re of FORBIDDEN_KEYS) expect(src, String(re)).not.toMatch(re);
    for (const p of FORBIDDEN_PATHS) expect(src, p).not.toContain(p);
    for (const re of FORBIDDEN_STORAGE) expect(src, String(re)).not.toMatch(re);
  });

  it('the shipped dictionary has no ĐK-6 key (filtered at build time)', () => {
    expect(hasGuestKey('guest.verify.title', 'vi')).toBe(false);
    expect(hasGuestKey('guest.bill.title', 'en')).toBe(false);
    expect(hasGuestKey('guest.oci.done_body', 'vi')).toBe(true);
  });

  it('every key the source names exists in VI and EN (and in the shipped dictionary)', () => {
    const used = collectUsedKeys(SRC);
    expect(used.exact.size).toBeGreaterThan(60);
    for (const locale of ['vi', 'en'] as const) {
      expect(
        [...used.exact].filter((k) => !hasGuestKey(k, locale)),
        locale,
      ).toEqual([]);
    }
    // Template keys (`gw.doc.${type}` …) must stay narrow – a whole family is not a prefix.
    expect(used.prefixes.sort()).toEqual(['gw.doc.', 'gw.doc_hint.']);
  });

  it('ships only named keys: unused staff/level-2 wording is not in the dictionary (SEC MOB-01 (2))', () => {
    expect(hasGuestKey('error.GUEST_STAY_ENDED', 'en')).toBe(false); // "…only shows your bill"
    expect(hasGuestKey('guest.req.fee_notice', 'vi')).toBe(false);
    expect(hasGuestKey('error.INVALID_TRANSITION', 'vi')).toBe(false);
    expect(hasGuestKey('guest.lang.ru_soon', 'ru')).toBe(false);
  });
});
