// @vitest-environment node
// FB-R2-SEC-MOB-01: the ĐK-6 / G8 scan of the *built* bundle must run on every `pnpm test`, in CI too.
// It no longer depends on a `dist/` left by an earlier step: the test builds guest-web itself (same
// vite.config.ts, production mode) into a temp folder and scans that output.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const APP = join(__dirname, '..', '..');
let out = '';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** ĐK-6 keys (same list as guard.test.ts / build/used-keys.ts). */
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

describe('built guest-web bundle (s3-checklist G8, ĐK-1/3/6)', () => {
  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'ottimo-guest-web-'));
    // Vitest sets NODE_ENV=test, which Vite would treat as a dev build (import.meta.env.DEV = true →
    // MSW mocks bundled). Build exactly like `pnpm build`.
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await build({
        root: APP,
        configFile: join(APP, 'vite.config.ts'),
        mode: 'production',
        logLevel: 'silent',
        build: { outDir: out, emptyOutDir: true },
      });
    } finally {
      process.env.NODE_ENV = prev;
    }
  }, 120_000);
  afterAll(() => {
    if (out) rmSync(out, { recursive: true, force: true });
  });

  it('has no level-2 key, level-2 endpoint, mock data or service worker', () => {
    const js = files(out)
      .filter((f) => f.endsWith('.js') || f.endsWith('.html'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(js.length).toBeGreaterThan(10_000);
    for (const re of FORBIDDEN_KEYS) expect(js, String(re)).not.toMatch(re);
    for (const p of FORBIDDEN_PATHS) expect(js, p).not.toContain(p);
    expect(js).not.toContain('demo-guest-link'); // MSW mock is dev-only
    expect(js).not.toMatch(/setupWorker|serviceWorker\.register/);
    expect(existsSync(join(out, 'mockServiceWorker.js'))).toBe(false);
  });

  it('ships only the keys the source names (no unused staff wording)', () => {
    const js = files(out)
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(js).toContain('gw.notice_body');
    expect(js).not.toContain('error.GUEST_STAY_ENDED');
    expect(js).not.toContain('guest.req.fee_notice');
    expect(js).not.toContain('error.INVALID_TRANSITION');
  });
});
