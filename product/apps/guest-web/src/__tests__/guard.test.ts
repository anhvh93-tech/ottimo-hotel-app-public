// SEC s3-checklist G1/G3/G8 as CI tests over the guest-web source (and dist when built).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasGuestKey } from '../app/i18n';

const SRC = join(__dirname, '..');
const DIST = join(__dirname, '..', '..', 'dist');

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
const FORBIDDEN_KEYS = [
  /guest\.verify\./,
  /guest\.door_code/,
  /guest\.late\.(done_title|code_|how_|prompt|arrival_hint)/,
  /guest\.tab\.bill/,
  /guest\.bill\./,
  /guest\.after_checkout\.body/,
];
/** ĐK-1 – level-2 operations. */
const FORBIDDEN_PATHS = [
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

  it('every literal t("…") key exists in VI and EN', () => {
    const used = new Set<string>();
    for (const m of appSource().matchAll(/\bt\(\s*'([a-z_]+\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(40);
    for (const locale of ['vi', 'en'] as const) {
      expect(
        [...used].filter((k) => !hasGuestKey(k, locale)),
        locale,
      ).toEqual([]);
    }
  });

  it.skipIf(!existsSync(DIST))('built bundle has no forbidden key / path / mock worker', () => {
    const bundle = files(join(DIST, 'assets'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    for (const p of FORBIDDEN_PATHS) expect(bundle, p).not.toContain(p);
    for (const re of FORBIDDEN_KEYS) expect(bundle, String(re)).not.toMatch(re);
    expect(bundle).not.toContain('demo-guest-link');
    expect(existsSync(join(DIST, 'mockServiceWorker.js'))).toBe(false);
  });
});
