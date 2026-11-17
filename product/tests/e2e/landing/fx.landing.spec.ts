// FB-INV-011 (R5) – estimate in the currency of the page language (contract rounds/round-05/fb-inv-011/contract.md):
// en → USD, ko → KRW, zh → CNY, ru → RUB, vi → none. The optional `fx` block of getPublicMonthlyRates gives the VND
// for one unit; the page shows "≈ …" + the rate date under the VND figure on the room cards and in the form box. No
// fx → exactly the VND page of FB-INV-010. Runs on the live-form test build (dist-booking-live, slug dl01); the public
// API is answered by page.route on the landing origin (real CSP, connect-src 'self'). All rates and prices are made up.
// Test ids: TC-LP-080 cards + box with fx (5 languages, 360 px, axe 0), TC-LP-081 without fx / stale / odd rate.
import { expect, test, type Page, type Route } from '@playwright/test';
import {
  LIVE_URL,
  LOCALE,
  PAGES,
  axeViolations,
  cspViolations,
  horizontalOverflow,
  recordCsp,
  watchErrors,
  type Lang,
} from './helpers.js';

test.use({ baseURL: LIVE_URL });

const API = '/v1/public/properties/dl01';
const ROOM = 'standard-studio-garden-view';
/** Made-up figures (not Desk prices / not real rates). */
const FROM = { 'standard-studio-city-view': 8_000_000, [ROOM]: 8_500_000 };
const MONTH = 9_000_000;
const RATES = { USD: 25450, KRW: 18.2, CNY: 3520, RUB: 290 };

/** Today in the property time zone, like the page (todayIn Asia/Ho_Chi_Minh). */
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
const daysAgo = (n: number) =>
  new Date(Date.parse(`${today()}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);

const fxBlock = (over: Record<string, unknown> = {}) => ({
  base: 'VND',
  source: 'vietcombank',
  asOf: today(),
  rates: RATES,
  ...over,
});

function monthlyRates(fx?: unknown): unknown {
  return {
    estimate: true,
    currency: 'VND',
    taxIncluded: true,
    roomTypes: Object.entries(FROM).map(([roomType, monthlyFromVnd]) => ({
      roomType,
      label: roomType,
      monthlyFromVnd,
    })),
    computedAt: '2026-11-17T10:00:00+07:00',
    ...(fx === undefined ? {} : { fx }),
  };
}

async function mockApi(page: Page, fx?: unknown) {
  await page.route(`**${API}/monthly-rates`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Cache-Control': 'no-store' },
      body: JSON.stringify(monthlyRates(fx)),
    }),
  );
  await page.route(`**${API}/form-token`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: `v1.${'e2e'.padEnd(40, 'x')}`,
        notBefore: '2026-10-24T00:00:00Z',
        expiresAt: '2099-01-01T00:00:00Z',
        minDelaySeconds: 0,
      }),
    }),
  );
  await page.route(`**${API}/price-estimate?*`, (route: Route) => {
    const q = new URL(route.request().url()).searchParams;
    const months = Number(q.get('months'));
    return route
      .fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          estimate: true,
          currency: 'VND',
          taxIncluded: true,
          roomType: q.get('roomType'),
          stayKind: 'long',
          arrival: q.get('arrival'),
          priceAvailable: true,
          longStay: { months, monthlyFromVnd: MONTH, totalVnd: MONTH * months },
          notes: [],
          computedAt: '2026-11-17T10:00:00+07:00',
          // made-up, built at run time like lp-v2.landing.spec.ts (a quoted literal trips gitleaks generic-api-key)
          estimateToken: `pe1.${Buffer.from(q.toString()).toString('base64url')}.c2lnbmF0dXJl`,
          expiresAt: '2099-01-01T00:00:00+07:00',
        }),
      })
      .catch(() => undefined);
  });
}

const sp = (s: string | null) => (s ?? '').replace(/[\u00a0\u202f]/g, ' ');

/** What each page shows for 8,500,000 VND (card) and 9,000,000 VND (form box) with RATES. */
const EXPECT: Record<Exclude<Lang, 'vi'>, { card: string; box: string; note: RegExp }> = {
  en: {
    card: '≈ US$334 / month',
    box: '≈ US$354 / month',
    note: /^Estimate at the .+ rate\. Payment in VND\.$/,
  },
  ko: {
    card: '≈ 월 ₩468,000',
    box: '≈ 월 ₩495,000',
    note: /환율 기준 예상 금액입니다\. 결제는 VND로 진행됩니다\.$/,
  },
  zh: {
    card: '≈ 每月 ¥2,415',
    box: '≈ 每月 ¥2,557',
    note: /^按.+汇率估算。以越南盾（VND）付款。$/,
  },
  ru: {
    card: '≈ 29 400 ₽ в месяц',
    box: '≈ 31 100 ₽ в месяц',
    note: /^Оценка по курсу на \d\d\.\d\d\.\d{4}\. Оплата в VND\.$/,
  },
};

for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`TC-LP-080 ${lang.toUpperCase()} fx: room card + form box show the estimate under VND (vi: none), 360 px no overflow, axe 0`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      locale: LOCALE[lang],
      viewport: { width: 360, height: 800 },
    });
    const page = await context.newPage();
    await recordCsp(page);
    const errors = watchErrors(page);
    await mockApi(page, fxBlock());
    await page.goto(`${PAGES[lang]}#rooms`, { waitUntil: 'networkidle' });
    const card = page.locator(`[data-room-price="${ROOM}"]`);
    await expect(card.locator('.rp-main:visible')).toContainText('8');
    // VND stays the price
    await expect(card.locator('data.rp-amt')).toHaveAttribute('value', '8500000');
    if (lang === 'vi') {
      await expect(page.locator('.rp-fx, .rp-fx-note')).toHaveCount(0);
      expect(await card.innerText()).not.toContain('≈');
    } else {
      const e = EXPECT[lang];
      expect(sp(await card.locator('.rp-fx').textContent())).toBe(e.card);
      expect(sp(await card.locator('.rp-fx-note').textContent())).toMatch(e.note);
      await expect(page.locator('.rp-fx')).toHaveCount(2);
    }
    // the form box with a move-in date and months
    await page.goto(`${PAGES[lang]}#book`, { waitUntil: 'networkidle' });
    await expect(page.locator('#bk-form')).toBeVisible();
    const min = (await page.locator('#f-arr').getAttribute('min'))!;
    const arr = new Date(Date.parse(`${min}T00:00:00Z`) + 20 * 864e5).toISOString().slice(0, 10);
    await page.locator('#f-room').selectOption(ROOM);
    await page.locator('#f-arr').fill(arr);
    await page.locator('#f-months').selectOption('6');
    const box = page.locator('#bk-est');
    await expect(box.locator('data.est-amt')).toHaveAttribute('value', String(MONTH));
    if (lang === 'vi') {
      await expect(box.locator('.est-fx, .est-fx-note')).toHaveCount(0);
    } else {
      const e = EXPECT[lang];
      await expect(box.locator('.est-fx')).toBeVisible();
      expect(sp(await box.locator('.est-fx').textContent())).toBe(e.box);
      expect(sp(await box.locator('.est-fx-note').textContent())).toMatch(e.note);
    }
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    // nothing in the box runs out of it at 360 px
    const spill = await box.evaluate((b) => {
      const r = b.getBoundingClientRect();
      return Array.from(b.querySelectorAll('*')).filter(
        (n) => n.getBoundingClientRect().right > r.right + 0.5,
      ).length;
    });
    expect(spill).toBe(0);
    await page.locator('#rooms').scrollIntoViewIfNeeded();
    const v = await axeViolations(page, info, `fx-${lang}`);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

for (const [name, fx] of [
  ['no fx block', undefined],
  ['fx null', null],
  ['a rate older than 7 days', fxBlock({ asOf: daysAgo(8) })],
  ['USD missing', fxBlock({ rates: { KRW: 18.2 } })],
  ['an odd USD rate (0)', fxBlock({ rates: { ...RATES, USD: 0 } })],
  ['an odd USD rate (text)', fxBlock({ rates: { ...RATES, USD: '25450' } })],
] as const) {
  test(`TC-LP-081 EN with ${name}: VND only, no "≈" anywhere`, async ({ page }) => {
    const errors = watchErrors(page);
    await mockApi(page, fx);
    await page.goto('/#rooms', { waitUntil: 'networkidle' });
    const card = page.locator(`[data-room-price="${ROOM}"]`);
    await expect(card.locator('.rp-main:visible')).toHaveText('From 8,500,000 VND / month');
    await expect(page.locator('.rp-fx, .rp-fx-note')).toHaveCount(0);
    await page.locator('#f-room').selectOption(ROOM);
    await expect(page.locator('#bk-est .est-main')).toHaveText('From 8,500,000 VND / month');
    await expect(page.locator('#bk-est .est-fx, #bk-est .est-fx-note')).toHaveCount(0);
    expect(await page.locator('main').innerText()).not.toContain('≈');
    expect(errors).toEqual([]);
  });
}
