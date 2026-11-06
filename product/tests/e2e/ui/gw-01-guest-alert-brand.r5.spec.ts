// E2E UI – FB-R5-UXD-FE-GW-01 (UXD-on-fe-prs-98-102-107 mục 4): the info alert on the guest pages uses the OTTIMO
// palette, no blue – Cream #EDE6D8 background, Sage #8A9079 border, Ink #2B2B28 text and icon. Only one info alert
// today: "Lễ tân trả lời từ 07:00" on tab Yêu cầu after hours (22:00–07:00 Đà Lạt). jsdom does not resolve `var()`,
// so the colours are read here with getComputedStyle in a real browser. The page clock is fixed at 23:30 of the
// stack's day (client only – `isAfterHours` reads the device clock); link, session and options come from the real
// stack. axe: 0 critical/serious. Fake data only. Project desk-chromium (testMatch ui/).
import { readFileSync } from 'node:fs';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { resetRateLimits, session, stackToday } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import { bookFree, cleanupTracked, room, s2Context } from '../support/s2.js';
import { guestLink, namedGuest } from '../support/s3.js';
import { scan } from './axe.js';
import { UI } from './helpers.js';

const VI = JSON.parse(
  readFileSync(new URL('../../../design/copy/strings-vi.json', import.meta.url), 'utf8'),
) as Record<string, string>;

/** Brand palette (00-brief/context/brand/brand-guidelines.md) as the browser reports it. */
const CREAM = 'rgb(237, 230, 216)';
const SAGE = 'rgb(138, 144, 121)';
const INK = 'rgb(43, 43, 40)';

/** Confirmed booking (2 adults) + guest link (same set-up as ui/guest-web.h18.spec.ts). */
async function bookingWithLink(request: Page['request'], roomNo: string) {
  const fd = await session(request, 'qa.fd');
  const c = await s2Context(request);
  const g = await namedGuest(request, fd, {});
  const today = await stackToday(request);
  const res = await bookFree(request, fd, c, {
    room: room(c, roomNo),
    nights: 2,
    today,
    guestId: g.id,
  });
  return { link: await guestLink(request, fd, res.id), today };
}

test.describe(
  'UI guest-web GW-01 – khung thông tin trên trang khách theo bảng màu OTTIMO',
  { tag: ['@ui', '@r5', '@guest'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));
    // a failed case must not leave its guest page open
    let ctx: BrowserContext | undefined;
    test.afterEach(async () => {
      await ctx?.close().catch(() => undefined);
      ctx = undefined;
    });

    test('GW-01 (E) tab Yêu cầu sau 22:00: khung "Lễ tân trả lời từ 07:00" nền Cream, viền Sage, chữ và icon Ink, không xanh lam + axe', async ({
      browser,
      request,
    }, info) => {
      const { link, today } = await bookingWithLink(request, '301');
      ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh',
      });
      const page = await ctx.newPage();
      await page.clock.setFixedTime(new Date(`${today}T23:30:00+07:00`));
      // The page opens its own session (POST /v1/guest/sessions): guest-open is 10/min per IP and every E2E call
      // comes from one IP → clear the limiter first, as `openGuest` does on a 429 (CI #112 / #126, V5-46-2).
      await resetRateLimits(request, 'GW-01: trang khách tự mở phiên (guest-open 10/phút/IP)');
      await page.goto(link.url);
      await page
        .getByRole('button', { name: VI['guest.tab.requests']!, exact: true })
        .first()
        .click({ timeout: 15_000 });
      await page.getByRole('button', { name: VI['gw.req.new']!, exact: true }).click();
      await page.getByRole('button', { name: new RegExp(`^${VI['guest.req.other']!}`) }).click();

      const alert = page
        .locator('.alert.info')
        .filter({ hasText: VI['gw.req.after_hours_title']! });
      await expect(alert).toBeVisible({ timeout: 15_000 });
      const colours = await alert.evaluate((el) => {
        const c = getComputedStyle(el);
        const icon = el.querySelector('.ico');
        const title = el.querySelector('.txt b');
        return {
          background: c.backgroundColor,
          border: c.borderTopColor,
          icon: icon ? getComputedStyle(icon).color : null,
          title: title ? getComputedStyle(title).color : null,
        };
      });
      expect(colours).toEqual({ background: CREAM, border: SAGE, icon: INK, title: INK });
      await scan(page, info, 'GW-01-request-after-hours');
      await ctx.close();
    });
  },
);
