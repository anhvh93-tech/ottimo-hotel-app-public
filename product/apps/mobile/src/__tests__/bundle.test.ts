// @vitest-environment node
// The built PWA (production mode, same vite.config.ts): ADR-005 first-load budget, B0 + B1 in the same
// build (JetBrains Mono self-hosted next to Lora / Be Vietnam Pro – S4-49, no CDN), no mock in the output,
// service worker stamped with the build id (SR-PWA-02).
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
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

describe('built OTTIMO Staff (ADR-005, S4-49 B0 + B1)', () => {
  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'ottimo-staff-'));
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

  it('first load (index.html scripts + CSS) ≤ 180 KB gzip', () => {
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map(
      (m) => m[1]!,
    );
    expect(refs.length).toBeGreaterThan(0);
    const gz = refs.reduce((n, r) => n + gzipSync(readFileSync(join(out, r))).length, 0);
    expect(gz).toBeLessThanOrEqual(180 * 1024);
  });

  it('fonts are self-hosted: Lora, Be Vietnam Pro and JetBrains Mono woff2 in the build, no font CDN', () => {
    const names = files(out).map((f) => f.slice(out.length));
    expect(names.some((n) => /jetbrains-mono.*\.woff2$/.test(n))).toBe(true);
    expect(names.some((n) => /lora.*\.woff2$/.test(n))).toBe(true);
    expect(names.some((n) => /be-vietnam-pro.*\.woff2$/.test(n))).toBe(true);
    const text = files(out)
      .filter((f) => /\.(css|js|html)$/.test(f))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(text).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com/);
  });

  it('ships no mock (worker, data, dev password) and a stamped service worker', () => {
    expect(existsSync(join(out, 'mockServiceWorker.js'))).toBe(false);
    const js = files(out)
      .filter((f) => f.endsWith('.js') && !f.endsWith('sw.js'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(js).not.toContain('change_me_mock_dev_only');
    expect(js).not.toMatch(/setupWorker/);
    const sw = readFileSync(join(out, 'sw.js'), 'utf8');
    expect(sw).not.toContain('__BUILD_ID__');
    expect(sw).toMatch(/ottimo-staff-[0-9a-f]{12}/);
    expect(sw).toContain("startsWith('/v1/')"); // API is never cached by the worker
  });

  it('ships only the string keys the source names (no Desk money / C3 wording)', () => {
    const js = files(out)
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(js).toContain('hk.status.VC');
    expect(js).not.toContain('refund.account_no');
    expect(js).not.toContain('ci.photo_deleted');
  });
});
