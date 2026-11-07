// E2E UI – v1.0.5 V5-24 (copy-v1.0.5 5.1, 5.2; BUG-R4-017): the Russian guest page under the PRODUCTION CSP.
// The CI stack serves guest-web through Caddyfile.dev (no CSP header), so this case adds the exact production policy
// of guest-web (Caddyfile.prod, worker-src 'none' – the same value infra/caddy/expected-headers.sh pins) to the
// document response. Then:
//   - the CSP header is on the document response, and a canary `data:` font is blocked exactly once (SEC 167-01);
//   - 0 CSP violations of any directive (before the fix: 6 `font-src` per load – the small faces were `data:`; 167-02);
//   - every JetBrains Mono face the page asks for loads (Cyrillic, Cyrillic-ext, Vietnamese, Latin; 400 and 500), so
//     Russian in the code and Wi-Fi boxes is JetBrains Mono, not the fallback font;
//   - the stay text says "номер", never the banned "апартаменты" (CPY C1);
//   - axe: 0 critical/serious.
// Fake data only. Project desk-chromium (testMatch ui/).
import { readFileSync } from 'node:fs';
import { expect, test, type BrowserContext } from '@playwright/test';
import { resetRateLimits, session, stackToday } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import { bookFree, cleanupTracked, room, s2Context } from '../support/s2.js';
import { guestLink, namedGuest } from '../support/s3.js';
import { scan } from './axe.js';
import { UI } from './helpers.js';

const RU = JSON.parse(
  readFileSync(new URL('../../../design/copy/strings-ru.json', import.meta.url), 'utf8'),
) as Record<string, string>;

/** guest-web CSP exactly as Caddyfile.prod sends it (`import app guest-web no-referrer no-store 'none'`). */
function productionGuestCsp(): string {
  const caddy = readFileSync(
    new URL('../../../infra/caddy/Caddyfile.prod', import.meta.url),
    'utf8',
  );
  const m = /header \?Content-Security-Policy "([^"]+)"/.exec(caddy);
  expect(m, 'Caddyfile.prod has the SPA CSP line').not.toBeNull();
  const csp = m![1]!.replace('{args[3]}', "'none'");
  expect(csp).toContain("font-src 'self';");
  expect(csp).not.toMatch(/font-src[^;]*data:/);
  return csp;
}

/** One glyph per JetBrains Mono subset (unicode-range of @fontsource/jetbrains-mono 5.2.8). */
const GLYPHS = 'AЖѢạ'; // latin, cyrillic, cyrillic-ext (U+0462), vietnamese

test.describe(
  'UI guest-web V5-24 – trang khách tiếng Nga dưới CSP production: font chữ Nga, chữ "номер"',
  { tag: ['@ui', '@r5', '@guest'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));
    let ctx: BrowserContext | undefined;
    test.afterEach(async () => {
      await ctx?.close().catch(() => undefined);
      ctx = undefined;
    });

    test('V5-24-1 (E) BUG-R4-017: RU, CSP font-src self – 0 lỗi font-src, mọi mặt JetBrains Mono tải được (Ж, Ѣ, ạ), chữ "номер" không "апартаменты" + axe', async ({
      browser,
      request,
    }, info) => {
      const csp = productionGuestCsp();
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const g = await namedGuest(request, fd, { preferredLocale: 'ru' });
      const res = await bookFree(request, fd, c, {
        room: room(c, '202'),
        nights: 2,
        today: await stackToday(request),
        guestId: g.id,
      });
      const link = await guestLink(request, fd, res.id);

      ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        locale: 'ru-RU',
        timezoneId: 'Asia/Ho_Chi_Minh',
      });
      const page = await ctx.newPage();
      // Collect every CSP violation the page reports (before any page script runs).
      await page.addInitScript(() => {
        const w = window as unknown as { __csp: { directive: string; uri: string }[] };
        w.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) =>
          w.__csp.push({ directive: e.effectiveDirective, uri: e.blockedURI.slice(0, 40) }),
        );
      });
      const consoleCsp: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' && /Content Security Policy/i.test(m.text()))
          consoleCsp.push(m.text().slice(0, 160));
      });
      const guestOrigin = new URL(link.url).origin;
      await page.route(
        (u) => u.origin === guestOrigin && u.pathname.startsWith('/g/'),
        async (route) => {
          if (route.request().resourceType() !== 'document') return route.continue();
          const resp = await route.fetch();
          await route.fulfill({
            response: resp,
            headers: { ...resp.headers(), 'content-security-policy': csp },
          });
        },
      );

      // The page opens its own session (guest-open 10/min per IP) – clear the limiter first (CI #112 / #126).
      await resetRateLimits(request, 'V5-24: trang khách tự mở phiên (guest-open 10/phút/IP)');
      const nav = await page.goto(link.url);
      // SEC 167-01: prove the policy reached the page – the header on the document response…
      expect(nav?.headers()['content-security-policy'], 'production CSP on the guest page').toBe(
        csp,
      );
      const checkin = RU['guest.stay.checkin_time']!;
      expect(checkin).toContain('номер');
      await expect(
        page.getByText(new RegExp(`^${checkin.split('{time}')[0]!}\\d{2}:\\d{2}`)).first(),
        'RU theo hồ sơ khách, dòng giờ nhận phòng',
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('main')).not.toContainText(/апартамент|квартир|посуточн/i);
      await expect(page.locator('.gw-code').first()).toHaveCSS('font-family', /^"JetBrains Mono"/);

      // Ask for every subset in both weights the DS uses (`.mono` 400, 500), then read each face's status.
      const faces = await page.evaluate(async (glyphs) => {
        for (const w of ['400', '500']) {
          await document.fonts.load(`${w} 16px "JetBrains Mono"`, glyphs).catch(() => []);
        }
        await document.fonts.ready;
        const out: { weight: string; range: string; status: string }[] = [];
        document.fonts.forEach((f) => {
          if (f.family.replace(/["']/g, '') === 'JetBrains Mono')
            out.push({ weight: f.weight, range: f.unicodeRange.slice(0, 14), status: f.status });
        });
        const checks = Object.fromEntries(
          ['400', '500'].flatMap((w) =>
            [...glyphs].map((ch) => [
              `${w} ${ch}`,
              document.fonts.check(`${w} 16px "JetBrains Mono"`, ch),
            ]),
          ),
        );
        return { out, checks };
      }, GLYPHS);
      expect(faces.out.length, 'JetBrains Mono @font-face rules in the CSS').toBeGreaterThanOrEqual(
        8,
      );
      expect(
        faces.out.filter((f) => f.status === 'error'),
        'no JetBrains Mono face failed to load',
      ).toEqual([]);
      expect(Object.values(faces.checks).every(Boolean), JSON.stringify(faces.checks)).toBe(true);

      type Violation = { directive: string; uri: string };
      const readViolations = () =>
        page.evaluate(() => (window as unknown as { __csp: Violation[] }).__csp);
      // Every violation fails the case (SEC 167-02): this is the only CI run of the real guest page under the
      // production CSP. Check before the canary, so the canary is the only expected one.
      expect(await readViolations(), 'CSP violations on the guest page').toEqual([]);
      expect(consoleCsp, 'CSP errors in the console').toEqual([]);

      // SEC 167-01: …and a canary `data:` font is blocked, exactly once – the CSP is enforced, not just sent.
      await page.evaluate(() =>
        new FontFace('csp-canary', 'url(data:font/woff2;base64,AAAA)').load().catch(() => null),
      );
      await expect
        .poll(readViolations, { message: 'canary data: font blocked by font-src' })
        .toEqual([{ directive: 'font-src', uri: expect.stringMatching(/^data/) }]);

      await scan(page, info, 'V5-24-ru-csp');
      await ctx.close();
    });
  },
);
