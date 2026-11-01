// LP-v2 (R4) – Korean / Simplified Chinese / Russian landing and the estimated price in the "Plan your stay" form
// (FB-INV-008, FB-INV-009; ARC rounds/round-04/outputs/ARC/lp-v2-design.md 2.7–2.8, UXD lp-v2-design 3, CPY lp-v2 2).
// Runs on the live-form test build (dist-booking-live: LANDING_BOOKING_FORM=true, slug dl01, same-origin API). The
// public API – getPublicFormToken, createWebsiteBookingRequest and the new getPublicPriceEstimate (OpenAPI
// 0.3.9-draft) – is answered by page.route on the landing origin, where the landing Caddy proxies it, so the real CSP
// (connect-src 'self') applies. All numbers and names are made up (no guest data).
// Test ids: TC-LP-050…059 price estimate, TC-LP-060 ko/zh/ru form, TC-LP-061 screenshots for UXD/QA review.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page, type Route } from '@playwright/test';
import {
  HTML_LANG,
  LIVE_URL,
  LOCALE,
  PAGES,
  axeViolations,
  cspViolations,
  horizontalOverflow,
  recordCsp,
  watchErrors,
  watchForeignRequests,
  type Lang,
} from './helpers.js';

test.use({ baseURL: LIVE_URL });

const API = '/v1/public/properties/dl01';
const SHOTS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../rounds/round-04/outputs/FE/screenshots',
);
const TOKEN = {
  token: `v1.${'e2e'.padEnd(40, 'x')}`,
  notBefore: '2026-10-24T00:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  minDelaySeconds: 0,
};
/** Made-up listed rate of the mock (not a Desk price). */
const NIGHT = 733_667;

interface Mock {
  estimates: URL[];
  posts: Record<string, unknown>[];
}

type EstimateAnswer = { status: number; body?: unknown; delay?: number };

/** Answer of the mock price API for a query: a fake but contract-shaped PublicPriceEstimate. */
function priced(url: URL): unknown {
  const q = url.searchParams;
  const arrival = q.get('arrival')!;
  const departure = q.get('departure');
  const base = {
    estimate: true,
    currency: 'VND',
    taxIncluded: true,
    roomType: q.get('roomType'),
    arrival,
    priceAvailable: true,
    notes: [],
    computedAt: '2026-11-03T10:00:00+07:00',
    estimateToken: `pe1.${Buffer.from(url.search).toString('base64url')}.c2lnbmF0dXJl`,
    expiresAt: '2099-01-01T00:00:00+07:00',
  };
  // contract lp-v2-be 63c5731e (ESC-043): by the month, or from the BR-108 threshold by the night (30 nights – INV
  // 01/11) → no figure, no token
  const monthlyOffer = (extra: object = {}) => ({
    ...base,
    stayKind: 'long',
    priceAvailable: false,
    unavailableReason: 'monthly_offer',
    estimateToken: undefined,
    expiresAt: undefined,
    ...extra,
  });
  if (!departure) return monthlyOffer();
  const nights = Math.round((Date.parse(departure) - Date.parse(arrival)) / 864e5);
  if (nights >= 30) return monthlyOffer({ departure, notes: [{ code: 'long_stay_required' }] });
  const subtotal = NIGHT * nights;
  const pct = nights >= 14 ? 15 : nights >= 7 ? 10 : 0;
  const disc = Math.round((subtotal * pct) / 100);
  return {
    ...base,
    departure,
    stayKind: 'short',
    shortStay: {
      nights,
      roomSubtotalVnd: subtotal,
      upliftNights: 0,
      losDiscountPct: pct,
      losDiscountVnd: disc,
      extraPersonFeeVnd: 0,
      totalVnd: subtotal - disc,
      nightlyAvgVnd: Math.round((subtotal - disc) / nights),
    },
  };
}

async function mockApi(
  page: Page,
  opts: {
    estimate?: (n: number, url: URL) => EstimateAnswer;
    post?: (n: number) => { status: number; body?: unknown };
  } = {},
): Promise<Mock> {
  const m: Mock = { estimates: [], posts: [] };
  await page.route(`**${API}/form-token`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TOKEN) }),
  );
  await page.route(`**${API}/price-estimate?*`, async (route: Route) => {
    const url = new URL(route.request().url());
    m.estimates.push(url);
    const a = opts.estimate?.(m.estimates.length, url) ?? { status: 200, body: priced(url) };
    if (a.delay) await new Promise((r) => setTimeout(r, a.delay));
    await route
      .fulfill({
        status: a.status,
        contentType: a.status === 200 ? 'application/json' : 'application/problem+json',
        headers: { 'Cache-Control': 'private, max-age=60' },
        body: JSON.stringify(a.body ?? { code: 'X', status: a.status }),
      })
      .catch(() => undefined); // aborted by the page (a newer request)
  });
  await page.route(`**${API}/booking-requests`, (route: Route) => {
    m.posts.push(route.request().postDataJSON() as Record<string, unknown>);
    const a = opts.post?.(m.posts.length) ?? {
      status: 202,
      body: {
        refCode: 'K7Q2M9XD',
        promise: { kind: 'within_minutes', minutes: 60, by: '2026-11-03T03:00:00Z' },
      },
    };
    return route.fulfill({
      status: a.status,
      contentType: a.status === 202 ? 'application/json' : 'application/problem+json',
      body: JSON.stringify(a.body ?? {}),
    });
  });
  return m;
}

async function openForm(page: Page, lang: Lang = 'en') {
  await page.goto(`${PAGES[lang]}#book`, { waitUntil: 'networkidle' });
  await expect(page.locator('#bk-form')).toBeVisible();
  const today = (await page.locator('#f-in').getAttribute('min'))!;
  const d = new Date(`${today}T00:00:00Z`);
  return (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
}

async function pickStay(page: Page, iso: (n: number) => string, nights = 3, from = 20) {
  await page.locator('#f-in').fill(iso(from));
  await page.locator('#f-out').fill(iso(from + nights));
  await page.locator('#f-room').selectOption('standard-studio-garden-view');
}

async function fillContact(page: Page) {
  await page.locator('#f-name').fill('Test Guest');
  await page.locator('#f-phone').fill('+84 912 000 000');
  await page.locator('#f-consent').check();
}

const box = (page: Page) => page.locator('#bk-est');

test('TC-LP-050 estimate shown (S3): total, nights, average, VAT + final-rate line, status line; token sent; thank-you line', async ({
  page,
}, info) => {
  await recordCsp(page);
  const errors = watchErrors(page);
  const foreign = watchForeignRequests(page, LIVE_URL);
  const m = await mockApi(page);
  const iso = await openForm(page);
  await expect(box(page)).toBeHidden(); // nothing asked on page load (SEC SR-PE-15)
  expect(m.estimates).toHaveLength(0);
  await pickStay(page, iso);
  await expect(box(page)).toBeVisible();
  await expect(box(page).locator('.est-lbl')).toHaveText('Estimated rate');
  // FB-R4-UXD-FE-04: the amount alone on its line, the nights phrase a quieter line below it
  await expect(box(page).locator('.est-main')).toHaveText('2,201,001 VND');
  await expect(box(page).locator('.est-main + .est-nights')).toHaveText('for 3 nights');
  await expect(box(page).locator('data.est-amt')).toHaveAttribute('value', '2201001');
  await expect(box(page).locator('.est-line')).toHaveCount(0); // no average a night (DOM, BE lp-v2 6)
  await expect(box(page).locator('.est-note')).toHaveText(
    'Rates in Vietnamese dong (VND). Taxes included. Your final rate is in the quote we send.',
  );
  await expect(page.locator('#bk-est-live')).toHaveText(
    'Estimated rate updated: 2,201,001 VND for 3 nights',
  );
  await expect(page.locator('#bk-est-sent')).toBeVisible();
  // only the inputs of the contract, no personal data, one call per settled change
  expect(m.estimates).toHaveLength(1);
  expect([...m.estimates[0]!.searchParams.keys()]).toEqual([
    'roomType',
    'stayType',
    'arrival',
    'departure',
    'adults',
    'children',
    'infants',
  ]);
  const v = await axeViolations(page, info, 'estimate-en');
  expect(v, JSON.stringify(v, null, 2)).toEqual([]);
  await fillContact(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(m.posts[0]!.priceEstimateToken).toMatch(/^pe1\./);
  expect(m.posts[0]!.locale).toBe('en');
  await expect(page.locator('#bk-done-estimate')).toHaveText(
    'Estimated rate: 2,201,001 VND for 3 nights',
  );
  // nothing kept in the browser but the language choice (SEC SR-PE-11)
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((k) => k !== 'ottimo.lang')),
  ).toEqual([]);
  expect(await page.evaluate(() => document.cookie)).toBe('');
  // FB-R4-SEC-FE-03: nor in sessionStorage or IndexedDB ("we only remember your language")
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  expect(await page.evaluate(async () => (await indexedDB.databases()).length)).toBe(0);
  expect(await cspViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

test('TC-LP-051 prices off (404): the box never shows, no more calls, the form sends without a token', async ({
  page,
}) => {
  const m = await mockApi(page, { estimate: () => ({ status: 404 }) });
  const iso = await openForm(page);
  await pickStay(page, iso);
  await expect.poll(() => m.estimates.length).toBe(1);
  await page.waitForTimeout(600);
  await expect(box(page)).toBeHidden();
  await page.locator('#f-out').fill(iso(25));
  await page.waitForTimeout(700);
  expect(m.estimates).toHaveLength(1);
  await fillContact(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(m.posts[0]).not.toHaveProperty('priceEstimateToken');
  await expect(page.locator('#bk-done-estimate')).toBeHidden();
});

test('TC-LP-052 errors after a price (503, timeout): neutral S7 line, no number, no token; 429 stops further calls', async ({
  page,
}) => {
  const m = await mockApi(page, {
    estimate: (n, url) =>
      n === 1
        ? { status: 200, body: priced(url) }
        : n === 2
          ? { status: 503 }
          : n === 3
            ? { status: 200, body: priced(url), delay: 3500 } // > 3 s
            : { status: 429 },
  });
  const iso = await openForm(page);
  await pickStay(page, iso);
  await expect(box(page).locator('.est-main')).toBeVisible();
  await page.locator('#f-out').fill(iso(24));
  await expect(box(page).locator('.est-msg')).toHaveText(
    'We could not load an estimate just now. Your quote will include the rate.',
  );
  await expect(box(page).locator('.est-amt')).toHaveCount(0);
  await page.locator('#f-out').fill(iso(25));
  await expect.poll(() => m.estimates.length).toBe(3); // answered after 3.5 s – the page gives up at 3 s
  await page.waitForTimeout(3200);
  await expect(box(page).locator('.est-msg')).toBeVisible();
  await expect(box(page).locator('.est-amt')).toHaveCount(0);
  await page.locator('#f-out').fill(iso(26));
  await expect.poll(() => m.estimates.length).toBe(4);
  await page.locator('#f-out').fill(iso(27));
  await page.waitForTimeout(800);
  expect(m.estimates).toHaveLength(4); // 429: no call until reload
  await fillContact(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(m.posts[0]).not.toHaveProperty('priceEstimateToken');
});

test('TC-LP-053 a late answer never overwrites a newer one; a changed date drops the token; sending never waits for a price', async ({
  page,
}) => {
  const m = await mockApi(page, {
    // the 3-night answer is late (1.5 s), the 6-night one hangs (4 s) – keyed on the query, not the call number:
    // the contact fields fire `change` too, and may or may not add a call for the same dates before (timing)
    estimate: (n, url) => {
      const q = url.searchParams;
      const nights = (Date.parse(q.get('departure')!) - Date.parse(q.get('arrival')!)) / 864e5;
      return { status: 200, body: priced(url), delay: n === 1 ? 1500 : nights === 6 ? 4000 : 0 };
    },
  });
  const iso = await openForm(page);
  await pickStay(page, iso, 3);
  await expect.poll(() => m.estimates.length).toBe(1);
  await page.locator('#f-out').fill(iso(25)); // 5 nights, answered at once
  await expect(box(page).locator('.est-nights')).toHaveText('for 5 nights');
  await page.waitForTimeout(1600); // the 3-night answer arrives late
  await expect(box(page).locator('.est-nights')).toHaveText('for 5 nights');
  // change the dates and send before the new answer: no wait, no token of the old dates
  await fillContact(page);
  await page.locator('#f-out').fill(iso(26));
  await page.waitForTimeout(450); // request 3 in flight (4 s)
  const t0 = Date.now();
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(3000);
  expect(m.posts[0]).not.toHaveProperty('priceEstimateToken');
});

test('TC-LP-054 S1 "Any room", S0 missing dates, S6 no online figure, S4/S5 monthly offer without a figure (ESC-043)', async ({
  page,
}) => {
  const m = await mockApi(page, {
    estimate: (_n, url) =>
      url.searchParams.get('roomType') === 'signature-two-bedrooms'
        ? {
            status: 200,
            body: {
              ...(priced(url) as object),
              priceAvailable: false,
              unavailableReason: 'on_request',
              shortStay: undefined,
              estimateToken: undefined,
            },
          }
        : { status: 200, body: priced(url) },
  });
  const iso = await openForm(page);
  await pickStay(page, iso);
  await expect(box(page).locator('.est-main')).toBeVisible();
  await page.locator('#f-room').selectOption('');
  await expect(box(page).locator('.est-idle')).toHaveText(
    'Choose a room to see an estimate, or let us suggest one in your quote.',
  );
  await page.locator('#f-room').selectOption('signature-two-bedrooms');
  await expect(box(page).locator('.est-msg')).toHaveText(
    'No online estimate for these dates. We will include the rate in your quote.',
  );
  await page.locator('#f-room').selectOption('standard-studio-garden-view');
  // ESC-043 (INV 01/11): 30+ nights by the night (API answers monthly_offer – it owns the threshold) or by the month
  // (not asked once prices are known to be on) – no figure, no "Estimated rate", no token sent
  const offer = async () => {
    await expect(box(page).locator('.est-lbl')).toHaveText('A special offer for longer stays');
    await expect(box(page).locator('.est-msg')).toHaveText(
      'For a month or longer, we prepare a rate around your dates. You will find it in the quote we send.',
    );
    await expect(box(page).locator('.est-amt')).toHaveCount(0);
    expect(await box(page).innerText()).not.toMatch(/\d|Estimated rate/);
  };
  await page.locator('#f-out').fill(iso(49)); // 29 nights: still a price by the night, hint = nights only
  await expect(box(page).locator('.est-nights')).toHaveText('for 29 nights');
  await expect(page.locator('#f-nights')).toHaveText('29 nights');
  await page.locator('#f-out').fill(iso(50)); // 30 nights by the night
  await offer();
  expect(m.estimates.at(-1)!.searchParams.get('departure')).toBe(iso(50));
  // FB-R4-UXD-FE-10: the hint under the dates says the same as the box
  await expect(page.locator('#f-nights')).toHaveText(
    '30 nights. We will quote our long-stay rate.',
  );
  const before = m.estimates.length;
  await page.locator('input[name="stayType"][value="long"]').check({ force: true });
  await page.locator('#f-arr').fill(iso(30));
  await offer();
  await expect(page.locator('#bk-est-live')).toHaveText(
    'A special offer for longer stays. For a month or longer, we prepare a rate around your dates. You will find it in the quote we send.',
  );
  await page.waitForTimeout(500);
  expect(m.estimates.length).toBe(before);
  await page.locator('#f-arr').fill('');
  await expect(box(page).locator('.est-idle')).toHaveText(
    'Choose a room and your dates to see an estimate.',
  );
});

// FB-R4-UXD-FE-01: the long-stay guest opens "By the month" first – before any price was shown
for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`TC-LP-056 ${lang.toUpperCase()} by the month first: one call with stayType=long, then the invitation (no figure)`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: LOCALE[lang],
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const m = await mockApi(page);
    const iso = await openForm(page, lang);
    await page.locator('input[name="stayType"][value="long"]').dispatchEvent('click'); // the radio is drawn as a tab: click it directly at any width
    await page.locator('#f-room').selectOption('standard-studio-garden-view');
    await page.locator('#f-arr').fill(iso(30));
    await expect(box(page)).toBeVisible();
    await expect(box(page)).toHaveAttribute('data-state', 'offer');
    await expect(box(page).locator('.est-amt')).toHaveCount(0);
    expect(await box(page).innerText()).not.toMatch(/\d/);
    expect(m.estimates).toHaveLength(1);
    const q = m.estimates[0]!.searchParams;
    expect([...q.keys()]).toEqual([
      'roomType',
      'stayType',
      'arrival',
      'adults',
      'children',
      'infants',
    ]);
    expect(q.get('stayType')).toBe('long');
    // prices are known to be on now: more month changes ask nothing
    await page.locator('#f-arr').fill(iso(33));
    await page.waitForTimeout(600);
    expect(m.estimates).toHaveLength(1);
    await expect(box(page)).toHaveAttribute('data-state', 'offer');
    // nothing is sent with the request by the month (no token – ESC-043)
    await fillContact(page);
    await page.locator('#bk-submit').click();
    await expect(page.locator('#bk-done')).toBeVisible();
    expect(m.posts[0]).not.toHaveProperty('priceEstimateToken');
    await context.close();
  });
}

test('TC-LP-056b by the month first with prices off (404): the box stays hidden, nothing more is asked', async ({
  page,
}) => {
  const m = await mockApi(page, { estimate: () => ({ status: 404 }) });
  const iso = await openForm(page);
  await page.locator('input[name="stayType"][value="long"]').check({ force: true });
  await page.locator('#f-arr').fill(iso(30)); // "Any room": asked with the first room type of the list
  await expect.poll(() => m.estimates.length).toBe(1);
  expect(m.estimates[0]!.searchParams.get('roomType')).toMatch(/^[a-z0-9-]+$/);
  await page.waitForTimeout(600);
  await expect(box(page)).toBeHidden();
  await page.locator('input[name="stayType"][value="short"]').check({ force: true });
  await pickStay(page, iso, 3);
  await page.waitForTimeout(700);
  expect(m.estimates).toHaveLength(1);
  await expect(box(page)).toBeHidden();
  // prices off: the hint under the dates uses the page threshold (shortMaxNights 29 → long from 30 nights)
  await page.locator('#f-out').fill(iso(49));
  await expect(page.locator('#f-nights')).toHaveText('29 nights');
  await page.locator('#f-out').fill(iso(50));
  await expect(page.locator('#f-nights')).toHaveText(
    '30 nights. We will quote our long-stay rate.',
  );
});

test('TC-LP-055 the form is not taking requests (NOTICE_VERSION_INVALID on send): Zalo/call line, price box hidden (ARC 2.8)', async ({
  page,
}) => {
  await mockApi(page, {
    post: () => ({
      status: 422,
      body: {
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'consentVersion', code: 'NOTICE_VERSION_INVALID' }],
      },
    }),
  });
  const iso = await openForm(page);
  await pickStay(page, iso);
  await expect(box(page)).toBeVisible();
  await fillContact(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-status')).toContainText('Online requests are paused right now.');
  await expect(page.locator('#bk-status a[href^="https://zalo.me/"]')).toHaveCount(1);
  await expect(box(page)).toBeHidden();
});

for (const lang of ['ko', 'zh', 'ru'] as const) {
  test(`TC-LP-060 ${lang.toUpperCase()} form: page-language dates, plural, amount format, locale "${lang}" sent, hotline +84, axe 0`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      locale: LOCALE[lang],
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await recordCsp(page);
    const errors = watchErrors(page);
    const m = await mockApi(page);
    const iso = await openForm(page, lang);
    await expect(page.locator('html')).toHaveAttribute('lang', HTML_LANG[lang]);
    await expect(page.locator('#f-note-lang')).toBeVisible();
    await pickStay(page, iso, 3);
    // FB-R4-UXD-FE-04: amount alone; nights line above it (ko/zh word order) or below it (ru)
    const main = box(page).locator('.est-main');
    if (lang === 'ru') await expect(main).toHaveText(/^2\s201\s001\sVND$/);
    else await expect(main).toHaveText('2,201,001 VND');
    const nightsLine = box(page).locator(
      lang === 'ru' ? '.est-main + .est-nights' : '.est-nights:has(+ .est-main)',
    );
    await expect(nightsLine).toHaveText({ ko: '3박 기준', zh: '3 晚，共', ru: 'за 3 ночи' }[lang]);
    // the number never leaves its word (U+00A0 – CPY 13.5)
    if (lang !== 'ko') expect(await nightsLine.textContent()).toMatch(/3\u00a0/);
    if (lang === 'ru') await expect(page.locator('#f-nights')).toHaveText('3 ночи');
    if (lang === 'zh')
      await expect(box(page).locator('.est-note')).toHaveText(
        '价格以越南盾（VND）计。含税。最终价格以我们发送的报价为准。',
      );
    const v = await axeViolations(page, info, `estimate-${lang}`);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    await page.locator('#bk-submit').click(); // empty name → the form's own errors, in the page language
    await expect(page.locator('#bk-summary-h')).toHaveText(
      { ko: '3개 항목을 확인해 주세요', zh: '请检查 3 项内容', ru: 'Проверьте 3 поля' }[lang],
    );
    await fillContact(page);
    await page.locator('#bk-submit').click();
    await expect(page.locator('#bk-done')).toBeVisible();
    expect(m.posts[0]).toMatchObject({ locale: lang, consentVersion: '2026-11-01' });
    expect(m.posts[0]!.priceEstimateToken).toMatch(/^pe1\./);
    await expect(page.locator('#bk-done-fallback a')).toHaveText('+84 84 444 0909');
    expect(await cspViolations(page)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

// FB-R4-UXD-FE-02/03: no label spills out of its button – phone bar at 320/360/375 px, header at 1024 px – in every
// language (CPY 13.1 short Russian/Vietnamese labels). The header CTA stays on one line at 1024 px and the wordmark
// keeps its breathing space before the first menu item (logo clear space, guideline p12).
for (const lang of Object.keys(PAGES) as Lang[]) {
  for (const width of [320, 360, 375, 1024]) {
    test(`TC-LP-062 ${lang.toUpperCase()} ${width}px: no button text overflows (phone bar, header), no horizontal scroll`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        locale: LOCALE[lang],
        viewport: { width, height: width < 768 ? 812 : 800 },
      });
      const page = await context.newPage();
      await page.goto(PAGES[lang], { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 1500)); // the phone bar shows once the hero buttons are gone
      await page.waitForTimeout(400);
      const spill = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            '.stickybar .sb, .site-h .h-zalo, .site-h .only-d, .site-h .nav-d a, .site-h summary, .hero a.btn',
          ),
        )
          .filter((e) => e.checkVisibility({ visibilityProperty: true }))
          .map((e) => ({
            text: (e.textContent ?? '').trim().replace(/\s+/g, ' '),
            over: e.scrollWidth - e.clientWidth,
          }))
          .filter((x) => x.over > 0),
      );
      expect(spill, JSON.stringify(spill)).toEqual([]);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      if (width < 768) {
        await expect(page.locator('#stickybar')).toHaveAttribute('data-hidden', 'false');
        for (const b of await page.locator('.stickybar .sb').all()) {
          const h = (await b.boundingBox())!.height;
          expect(h).toBeGreaterThanOrEqual(48);
        }
      } else {
        const row = await page.evaluate(() => {
          const r = document.querySelector('.h-row')!;
          const cta = document.querySelector<HTMLElement>('.site-h .only-d')!;
          const brand = document.querySelector('.site-h .brand')!.getBoundingClientRect();
          const first = document.querySelector('.nav-d a')!.getBoundingClientRect();
          return {
            over: r.scrollWidth - r.clientWidth,
            ctaTextHeight: cta.getBoundingClientRect().height,
            gap: first.left - brand.right,
          };
        });
        expect(row.over, 'header row overflow').toBeLessThanOrEqual(0);
        expect(row.ctaTextHeight, 'header CTA on one line').toBeLessThanOrEqual(48);
        expect(row.gap, 'space between the wordmark and the menu').toBeGreaterThanOrEqual(24);
      }
      await context.close();
    });
  }
}

// FB-R4-UXD-FE-12: screenshots at 360/390/1024/1280 px for UXD/QA review. The form shot hides the sticky header and
// the phone bar (CSS added in the test only) so neither covers the box; the box shows a made-up estimate.
for (const lang of Object.keys(PAGES) as Lang[]) {
  for (const width of [360, 390, 1024, 1280]) {
    test(`TC-LP-061 screenshots ${lang.toUpperCase()} ${width}px: top of the page with the language list, the form with an estimate (made-up data)`, async ({
      browser,
    }) => {
      mkdirSync(SHOTS, { recursive: true });
      const context = await browser.newContext({
        locale: LOCALE[lang],
        viewport: { width, height: width < 768 ? 844 : 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await mockApi(page);
      await page.goto(PAGES[lang], { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('details.lang-pick summary').click();
      await page.screenshot({ path: path.join(SHOTS, `lp-v2-${lang}-${width}-top.png`) });
      await page.keyboard.press('Escape');
      const iso = await openForm(page, lang);
      await pickStay(page, iso, 3);
      await expect(box(page).locator('.est-main')).toBeVisible();
      // CSSOM, not a <style> tag: the real CSP of the page stays on
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('.site-h')?.style.setProperty('position', 'static');
        document.querySelector<HTMLElement>('.stickybar')?.style.setProperty('display', 'none');
      });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#bk-est').scrollIntoViewIfNeeded();
      await page.locator('.bk-card').screenshot({
        path: path.join(SHOTS, `lp-v2-${lang}-${width}-form.png`),
      });
      await context.close();
    });
  }
}
