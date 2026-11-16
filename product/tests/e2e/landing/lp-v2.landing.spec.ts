// LP-v2 (R4) – Korean / Simplified Chinese / Russian landing – and, since FB-INV-010 Dot 1 (R5), the MONTHLY price of
// the "Plan your stay" form and of the room cards (CPY rounds/round-05/fb-inv-010/CPY-copy.md, INV 16/11: the landing
// sells long stays only). Runs on the live-form test build (dist-booking-live: LANDING_BOOKING_FORM=true, slug dl01,
// same-origin API). The public API – getPublicFormToken, createWebsiteBookingRequest, getPublicPriceEstimate
// (stayType=long&months=n) and getPublicMonthlyRates (OpenAPI 0.3.13) – is answered by page.route on the landing
// origin, where the landing Caddy proxies it, so the real CSP (connect-src 'self') applies. All numbers and names are
// made up (no guest data, no Desk price).
// Test ids: TC-LP-050…056 monthly price box, TC-LP-070…071 "From X / month" on the room cards, TC-LP-060 ko/zh/ru
// form, TC-LP-061 screenshots for UXD/QA review, TC-LP-062 buttons, TC-LP-063 price note at 360 px in every language.
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
// review shots stay out of git (test-results is ignored): QA checks them before any image is committed
const SHOTS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../test-results/landing-shots/fb-inv-010',
);
const TOKEN = {
  token: `v1.${'e2e'.padEnd(40, 'x')}`,
  notBefore: '2026-10-24T00:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  minDelaySeconds: 0,
};
/** Made-up listed monthly rate of the mock price-estimate answer (not a Desk price). */
const MONTH = 9_000_000;
/** Made-up "from" figures of the mock getPublicMonthlyRates (signature left out: "Monthly rate on request"). */
const FROM: Record<string, number> = {
  'standard-studio-city-view': 8_000_000,
  'standard-studio-garden-view': 8_500_000,
  'premium-one-bedroom-1': 12_000_000,
};
const ROOM = 'standard-studio-garden-view';

interface Mock {
  estimates: URL[];
  rates: number;
  posts: Record<string, unknown>[];
}

type Answer = { status: number; body?: unknown; delay?: number };

/** Answer of the mock price API for a query: a fake but contract-shaped PublicPriceEstimate (stayType=long). */
function priced(url: URL): unknown {
  const q = url.searchParams;
  const months = Number(q.get('months'));
  return {
    estimate: true,
    currency: 'VND',
    taxIncluded: true,
    roomType: q.get('roomType'),
    stayKind: 'long',
    arrival: q.get('arrival')!,
    priceAvailable: true,
    longStay: { months, monthlyFromVnd: MONTH, totalVnd: MONTH * months },
    notes: [],
    computedAt: '2026-11-16T10:00:00+07:00',
    estimateToken: `pe1.${Buffer.from(url.search).toString('base64url')}.c2lnbmF0dXJl`,
    expiresAt: '2099-01-01T00:00:00+07:00',
  };
}

function monthlyRates(from: Record<string, number> = FROM): unknown {
  return {
    estimate: true,
    currency: 'VND',
    taxIncluded: true,
    roomTypes: Object.entries(from).map(([roomType, monthlyFromVnd]) => ({
      roomType,
      label: roomType,
      monthlyFromVnd,
    })),
    computedAt: '2026-11-16T10:00:00+07:00',
  };
}

async function mockApi(
  page: Page,
  opts: {
    estimate?: (n: number, url: URL) => Answer;
    rates?: () => Answer;
    post?: (n: number) => { status: number; body?: unknown };
  } = {},
): Promise<Mock> {
  const m: Mock = { estimates: [], rates: 0, posts: [] };
  const fulfill = (route: Route, a: Answer) =>
    route
      .fulfill({
        status: a.status,
        contentType: a.status === 200 ? 'application/json' : 'application/problem+json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify(a.body ?? { code: 'X', status: a.status }),
      })
      .catch(() => undefined); // aborted by the page (a newer request)
  await page.route(`**${API}/form-token`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TOKEN) }),
  );
  await page.route(`**${API}/monthly-rates`, async (route: Route) => {
    m.rates += 1;
    const a = opts.rates?.() ?? { status: 200, body: monthlyRates() };
    if (a.delay) await new Promise((r) => setTimeout(r, a.delay));
    await fulfill(route, a);
  });
  await page.route(`**${API}/price-estimate?*`, async (route: Route) => {
    const url = new URL(route.request().url());
    m.estimates.push(url);
    const a = opts.estimate?.(m.estimates.length, url) ?? { status: 200, body: priced(url) };
    if (a.delay) await new Promise((r) => setTimeout(r, a.delay));
    await fulfill(route, a);
  });
  await page.route(`**${API}/booking-requests`, (route: Route) => {
    m.posts.push(route.request().postDataJSON() as Record<string, unknown>);
    const a = opts.post?.(m.posts.length) ?? {
      status: 202,
      body: {
        refCode: 'K7Q2M9XD',
        promise: { kind: 'within_minutes', minutes: 60, by: '2026-11-16T03:00:00Z' },
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
  const today = (await page.locator('#f-arr').getAttribute('min'))!;
  const d = new Date(`${today}T00:00:00Z`);
  return (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
}

/** Room type, move-in date and months (FB-INV-010: the form sells long stays only). */
async function pickStay(page: Page, iso: (n: number) => string, months = '6', from = 20) {
  await page.locator('#f-room').selectOption(ROOM);
  await page.locator('#f-arr').fill(iso(from));
  await page.locator('#f-months').selectOption(months);
}

async function fillContact(page: Page) {
  await page.locator('#f-name').fill('Test Guest');
  await page.locator('#f-phone').fill('+84 912 000 000');
  await page.locator('#f-consent').check();
}

const box = (page: Page) => page.locator('#bk-est');
const NOTE_EN =
  'Taxes included. Rates in Vietnamese dong (VND). Final rate confirmed when we contact you. Electricity and water billed on actual use. No room is held yet. Your room is confirmed once your deposit is received.';

test('TC-LP-050 monthly price (S3): "From X / month", total for the months, note, status line; stayType=long&months=n; token sent; thank-you line', async ({
  page,
}, info) => {
  await recordCsp(page);
  const errors = watchErrors(page);
  const foreign = watchForeignRequests(page, LIVE_URL);
  const m = await mockApi(page);
  const iso = await openForm(page);
  // page load: the room cards' monthly rates once, no price estimate (SEC SR-PE-15)
  expect(m.rates).toBe(1);
  expect(m.estimates).toHaveLength(0);
  await pickStay(page, iso);
  await expect(box(page)).toBeVisible();
  await expect(box(page).locator('.est-lbl')).toHaveText('Monthly rate');
  await expect.poll(() => m.estimates.length).toBe(1);
  await expect(box(page).locator('.est-main')).toHaveText('From 9,000,000 VND / month');
  await expect(box(page).locator('data.est-amt')).toHaveAttribute('value', '9000000');
  await expect(box(page).locator('.est-line')).toHaveText('For 6 months: from 54,000,000 VND');
  await expect(box(page).locator('.est-note')).toHaveText(NOTE_EN);
  await expect(page.locator('#bk-est-live')).toHaveText(
    'Monthly rate updated: from 9,000,000 VND a month',
  );
  await expect(page.locator('#bk-est-sent')).toBeVisible();
  // only the inputs of the contract, no personal data, one call per settled change
  const q = m.estimates.at(-1)!.searchParams;
  expect([...q.keys()]).toEqual([
    'roomType',
    'stayType',
    'arrival',
    'months',
    'adults',
    'children',
    'infants',
  ]);
  expect([q.get('stayType'), q.get('months'), q.get('roomType')]).toEqual(['long', '6', ROOM]);
  // the total follows the months; one month = the monthly figure alone
  await page.locator('#f-months').selectOption('12');
  await expect(box(page).locator('.est-line')).toHaveText('For 1 year: from 108,000,000 VND');
  await page.locator('#f-months').selectOption('1');
  await expect(box(page).locator('.est-line')).toHaveCount(0);
  await expect(box(page).locator('.est-main')).toHaveText('From 9,000,000 VND / month');
  await page.locator('#f-months').selectOption('6');
  await expect(box(page).locator('.est-line')).toHaveText('For 6 months: from 54,000,000 VND');
  const v = await axeViolations(page, info, 'estimate-en');
  expect(v, JSON.stringify(v, null, 2)).toEqual([]);
  await fillContact(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(m.posts[0]).toMatchObject({ stayType: 'long', months: 6, roomType: ROOM, locale: 'en' });
  expect(m.posts[0]).not.toHaveProperty('departure');
  expect(m.posts[0]!.priceEstimateToken).toMatch(/^pe1\./);
  await expect(page.locator('#bk-done-estimate')).toHaveText(
    'Monthly rate: From 9,000,000 VND / month',
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

test('TC-LP-070 room cards: "From X / month" + taxes line from getPublicMonthlyRates (once); a type without a figure keeps "Monthly rate on request"', async ({
  page,
}, info) => {
  await recordCsp(page);
  const errors = watchErrors(page);
  const m = await mockApi(page, {
    // a 0 is never shown: that room type keeps the static line like a missing one
    rates: () => ({
      status: 200,
      body: monthlyRates({ ...FROM, 'premium-one-bedroom-1': 0 }),
    }),
  });
  await page.goto('/#rooms', { waitUntil: 'networkidle' });
  const card = (slug: string) => page.locator(`[data-room-price="${slug}"]`);
  const shown = (slug: string) => card(slug).locator('.rp-main:visible');
  await expect(shown('standard-studio-city-view')).toHaveText('From 8,000,000 VND / month');
  await expect(card('standard-studio-city-view').locator('data.rp-amt')).toHaveAttribute(
    'value',
    '8000000',
  );
  await expect(shown('standard-studio-garden-view')).toHaveText('From 8,500,000 VND / month');
  await expect(card('standard-studio-garden-view').locator('.rp-note:visible')).toHaveText(
    /^Taxes included\. /,
  );
  for (const slug of ['premium-one-bedroom-1', 'signature-two-bedrooms']) {
    await expect(shown(slug)).toHaveText('Monthly rate on request');
    await expect(card(slug).locator('.rp-note:visible')).toHaveCount(0);
    expect(await card(slug).innerText()).not.toMatch(/\d/);
  }
  expect(m.rates).toBe(1);
  expect(m.estimates).toHaveLength(0);
  // the form box, before a move-in date: the same "From" figure of the chosen type, no call, no token
  await page.locator('#f-room').selectOption(ROOM);
  await expect(box(page).locator('.est-main')).toHaveText('From 8,500,000 VND / month');
  await expect(box(page).locator('.est-line')).toHaveCount(0);
  await expect(page.locator('#bk-est-sent')).toBeHidden();
  await page.waitForTimeout(600);
  expect(m.estimates).toHaveLength(0);
  const v = await axeViolations(page, info, 'room-prices-en');
  expect(v, JSON.stringify(v, null, 2)).toEqual([]);
  expect(await cspViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

for (const [name, answer] of [
  ['404 (prices off)', { status: 404 }],
  ['503', { status: 503 }],
  ['a slow answer (> 3 s)', { status: 200, body: monthlyRates(), delay: 3500 }],
  ['a body off the contract', { status: 200, body: { roomTypes: 'x' } }],
] as const) {
  test(`TC-LP-071 room cards with ${name}: every card keeps "Monthly rate on request", never a 0 or an empty "From"`, async ({
    page,
  }) => {
    const m = await mockApi(page, { rates: () => answer });
    await page.goto('/#rooms', { waitUntil: 'networkidle' });
    await page.waitForTimeout(name.startsWith('a slow') ? 3800 : 300);
    expect(m.rates).toBe(1);
    const cards = page.locator('[data-room-price]');
    await expect(cards).toHaveCount(4);
    for (const c of await cards.all()) {
      await expect(c.locator('.rp-main:visible')).toHaveText('Monthly rate on request');
      expect(await c.innerText()).not.toMatch(/\d|From/);
    }
    await expect(box(page)).toBeHidden();
  });
}

test('TC-LP-051 prices off (404): the box never shows, no more calls, the form sends without a token', async ({
  page,
}) => {
  const m = await mockApi(page, {
    rates: () => ({ status: 404 }),
    estimate: () => ({ status: 404 }),
  });
  const iso = await openForm(page);
  await pickStay(page, iso);
  await expect.poll(() => m.estimates.length).toBe(1);
  await page.waitForTimeout(600);
  await expect(box(page)).toBeHidden();
  await page.locator('#f-months').selectOption('12');
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
  await expect(box(page).locator('.est-line')).toBeVisible();
  await page.locator('#f-months').selectOption('12');
  await expect(box(page).locator('.est-msg')).toHaveText(
    'We could not load the rate just now. Your quote will include it.',
  );
  await expect(box(page).locator('.est-amt')).toHaveCount(0);
  await page.locator('#f-months').selectOption('24');
  await expect.poll(() => m.estimates.length).toBe(3); // answered after 3.5 s – the page gives up at 3 s
  await page.waitForTimeout(3200);
  await expect(box(page).locator('.est-msg')).toBeVisible();
  await expect(box(page).locator('.est-amt')).toHaveCount(0);
  await page.locator('#f-months').selectOption('3');
  await expect.poll(() => m.estimates.length).toBe(4);
  await page.locator('#f-months').selectOption('2');
  await page.waitForTimeout(800);
  expect(m.estimates).toHaveLength(4); // 429: no call until reload
  await fillContact(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(m.posts[0]).not.toHaveProperty('priceEstimateToken');
});

test('TC-LP-053 a late answer never overwrites a newer one; changed months drop the token; sending never waits for a price', async ({
  page,
}) => {
  const m = await mockApi(page, {
    // the 6-month answer is late (1.5 s), the 24-month one hangs (4 s) – keyed on the query, not the call number:
    // the contact fields fire `change` too, and may or may not add a call for the same values before (timing)
    estimate: (n, url) => {
      const months = url.searchParams.get('months');
      return {
        status: 200,
        body: priced(url),
        delay: n === 1 ? 1500 : months === '24' ? 4000 : 0,
      };
    },
  });
  const iso = await openForm(page);
  await pickStay(page, iso, '6');
  await expect.poll(() => m.estimates.length).toBe(1);
  await page.locator('#f-months').selectOption('12'); // answered at once
  await expect(box(page).locator('.est-line')).toHaveText('For 1 year: from 108,000,000 VND');
  await page.waitForTimeout(1600); // the 6-month answer arrives late
  await expect(box(page).locator('.est-line')).toHaveText('For 1 year: from 108,000,000 VND');
  // change the months and send before the new answer: no wait, no token of the old values
  await fillContact(page);
  await page.locator('#f-months').selectOption('24');
  await page.waitForTimeout(450); // the 24-month request in flight (4 s)
  const t0 = Date.now();
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(3000);
  expect(m.posts[0]).not.toHaveProperty('priceEstimateToken');
  expect(m.posts[0]).toMatchObject({ months: 24 });
});

test('TC-LP-054 S1 "Any room", no move-in date (monthly-rates figure or prompt), S6 no online figure', async ({
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
              longStay: undefined,
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
    'Choose a room to see its monthly rate, or let us suggest one in your quote.',
  );
  await page.locator('#f-room').selectOption('signature-two-bedrooms');
  await expect(box(page).locator('.est-msg')).toHaveText(
    'No online rate for this room just now. We will include it in your quote.',
  );
  await expect(box(page).locator('.est-amt')).toHaveCount(0);
  // no move-in date: the card figure of the room type (no call), or the prompt for a type without one
  const before = m.estimates.length;
  await page.locator('#f-arr').fill('');
  await expect(box(page).locator('.est-idle')).toHaveText('Choose a room to see its monthly rate.');
  await page.locator('#f-room').selectOption(ROOM);
  await expect(box(page).locator('.est-main')).toHaveText('From 8,500,000 VND / month');
  await expect(box(page).locator('.est-line')).toHaveCount(0);
  await page.waitForTimeout(600);
  expect(m.estimates.length).toBe(before);
  // a move-in date again: the estimate at that date (with the total)
  await page.locator('#f-arr').fill(iso(25));
  await expect(box(page).locator('.est-line')).toHaveText('For 6 months: from 54,000,000 VND');
});

// FB-INV-010: one form for every guest – months 1, 2, 3, 6, 12, 24 in every language, no by-the-night fields
for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`TC-LP-056 ${lang.toUpperCase()} long stay only: move-in date + months, one call with stayType=long&months=n, no by-the-night field`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: LOCALE[lang],
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const m = await mockApi(page);
    const iso = await openForm(page, lang);
    await expect(page.locator('#f-in, #f-out, #f-nights, input[name="stayType"]')).toHaveCount(0);
    expect(
      await page
        .locator('#f-months option')
        .evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value)),
    ).toEqual(['1', '2', '3', '6', '12', '24']);
    await expect(page.locator('#f-months-hint')).toBeVisible();
    await pickStay(page, iso, '12', 30);
    await expect(box(page)).toHaveAttribute('data-state', 'price');
    await expect(box(page).locator('.est-line')).toHaveCount(1);
    const q = m.estimates.at(-1)!.searchParams;
    expect([q.get('stayType'), q.get('months'), q.get('arrival')]).toEqual(['long', '12', iso(30)]);
    await fillContact(page);
    await page.locator('#bk-submit').click();
    await expect(page.locator('#bk-done')).toBeVisible();
    expect(m.posts[0]).toMatchObject({ stayType: 'long', months: 12, locale: lang });
    expect(m.posts[0]!.priceEstimateToken).toMatch(/^pe1\./);
    await context.close();
  });
}

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
    await pickStay(page, iso, '6');
    // FB-INV-010 (CPY Dot 1 section 7): the same words as the room card, the total for the months below it
    const main = box(page).locator('.est-main');
    await expect(main).toHaveText(
      {
        ko: /^월 9,000,000\u00a0VND부터$/,
        zh: /^每月 9,000,000\u00a0VND 起$/,
        ru: /^От 9\s000\s000\sVND в\u00a0месяц$/,
      }[lang],
    );
    await expect(box(page).locator('.est-line')).toHaveText(
      {
        ko: /^6개월 기준 54,000,000\u00a0VND부터$/,
        zh: /^6\s个月：54,000,000\u00a0VND 起$/,
        ru: /^За 6 месяцев: от 54\s000\s000\sVND$/,
      }[lang],
    );
    if (lang === 'zh')
      await expect(box(page).locator('.est-note')).toHaveText(
        /^含税。价格以越南盾（VND）计。最终价格在我们联系您时确认。水电按实际用量计费。尚未为您保留房间。/,
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
    expect(m.posts[0]).toMatchObject({ locale: lang, consentVersion: '2026-11-04' });
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

// BUG-R4-003 (US-131 AC4, AC13) with the FB-INV-010 note (CPY Dot 1 section 7): the note under the figure in every
// language at 360 px – the taxes line first, "no room held" last; the note is never smaller than the form's own text
// (field labels); no horizontal scroll, nothing spills out of the box, with the longest figure (24 months, ru the
// longest text). Box height and a shot of the box for UXD/QA.
const TAX_IN: Record<Lang, string> = {
  en: 'Taxes included.',
  vi: 'Đã gồm thuế.',
  ko: '세금 포함.',
  zh: '含税。',
  ru: 'Налоги включены.',
};
const NO_ROOM_HELD: Record<Lang, string> = {
  en: 'No room is held yet.',
  vi: 'Chưa giữ phòng cho bạn.',
  ko: '객실은 아직 확보되지 않았습니다.',
  zh: '尚未为您保留房间。',
  ru: 'Это ещё не бронирование.',
};
for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`TC-LP-063 ${lang.toUpperCase()} 360px: price note = taxes … no room held, not smaller than the form text, no overflow (BUG-R4-003)`, async ({
    browser,
  }, info) => {
    mkdirSync(SHOTS, { recursive: true });
    const context = await browser.newContext({
      locale: LOCALE[lang],
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await recordCsp(page);
    const errors = watchErrors(page);
    const m = await mockApi(page);
    const iso = await openForm(page, lang);
    await page.locator('#f-infants').selectOption('1');
    await pickStay(page, iso, '24');
    const note = box(page).locator('.est-note');
    await expect(note).toBeVisible();
    const text = (await note.textContent())!;
    expect(text.startsWith(TAX_IN[lang])).toBe(true);
    expect(text).toContain(NO_ROOM_HELD[lang]);
    expect(text).not.toMatch(/Your final rate is in the quote we send/);
    // the party travels in the query (adults 2 + children 0 + infants 1)
    const q = m.estimates.at(-1)!.searchParams;
    expect([q.get('adults'), q.get('children'), q.get('infants')]).toEqual(['2', '0', '1']);
    const sizes = await page.evaluate(() => {
      // CSS pixels, not money: "15px" → 15
      const px = (sel: string) =>
        Number(getComputedStyle(document.querySelector(sel)!).fontSize.replace('px', ''));
      const lines = Array.from(document.querySelectorAll('#bk-est .est-line'));
      return {
        note: px('#bk-est .est-note'),
        // BUG-R4-006: the "Estimated rate" title is idea (1) of AC4 – same floor as the note
        title: px('#bk-est .est-lbl'),
        // FB-R4-UXD-FE-16: every line explaining the figure reads at one size
        lines: lines.map((e) => Number(getComputedStyle(e).fontSize.replace('px', ''))),
        label: px('.f-label, .field > label'),
        hint: px('.hint'),
      };
    });
    expect(sizes.note).toBeGreaterThanOrEqual(sizes.label);
    expect(sizes.note).toBeGreaterThanOrEqual(sizes.hint);
    expect(sizes.title).toBeGreaterThanOrEqual(sizes.label);
    expect(sizes.lines.length).toBeGreaterThan(0);
    for (const l of sizes.lines) expect(l).toBe(sizes.note);
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('.site-h')?.style.setProperty('position', 'static');
      document.querySelector<HTMLElement>('.stickybar')?.style.setProperty('display', 'none');
    });
    await page.evaluate(() => document.fonts.ready);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    const fit = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('#bk-est, #bk-est > *')).map((e) => ({
        cls: e.className,
        over: e.scrollWidth - e.clientWidth,
      })),
    );
    expect(fit.filter((f) => f.over > 0)).toEqual([]);
    const h = await box(page).evaluate((e) => Math.round(e.getBoundingClientRect().height));
    const noteH = await note.evaluate((e) => Math.round(e.getBoundingClientRect().height));
    await info.attach(`estimate-height-${lang}-360.json`, {
      body: JSON.stringify({ lang, width: 360, boxHeight: h, noteHeight: noteH, ...sizes }),
      contentType: 'application/json',
    });
    console.log(
      `[TC-LP-063] ${lang} 360px box ${h}px, note ${noteH}px, note ${sizes.note}px / label ${sizes.label}px`,
    );
    await box(page).scrollIntoViewIfNeeded();
    await box(page).screenshot({ path: path.join(SHOTS, `fb010-estimate-${lang}-360.png`) });
    expect(await cspViolations(page)).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}

// FB-R4-UXD-FE-12 / FB-INV-010: screenshots at 360/390/1024/1280 px for UXD/QA review – the top of the page, the room
// cards with "From X / month" and the form with a monthly price (made-up figures). The form shot hides the sticky
// header and the phone bar (CSS added in the test only) so neither covers the box.
for (const lang of Object.keys(PAGES) as Lang[]) {
  for (const width of [360, 390, 1024, 1280]) {
    test(`TC-LP-061 screenshots ${lang.toUpperCase()} ${width}px: top of the page, room cards, the form with a monthly price (made-up data)`, async ({
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
      await page.screenshot({ path: path.join(SHOTS, `fb010-${lang}-${width}-top.png`) });
      await page.keyboard.press('Escape');
      await page.locator('.room-price .rp-amt').first().waitFor();
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('.site-h')?.style.setProperty('position', 'static');
        document.querySelector<HTMLElement>('.stickybar')?.style.setProperty('display', 'none');
      });
      await page.locator('#rooms').screenshot({
        path: path.join(SHOTS, `fb010-${lang}-${width}-rooms.png`),
      });
      const iso = await openForm(page, lang);
      await pickStay(page, iso, '6');
      await expect(box(page).locator('.est-main')).toBeVisible();
      // CSSOM, not a <style> tag: the real CSP of the page stays on
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('.site-h')?.style.setProperty('position', 'static');
        document.querySelector<HTMLElement>('.stickybar')?.style.setProperty('display', 'none');
      });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#bk-est').scrollIntoViewIfNeeded();
      await page.locator('.bk-card').screenshot({
        path: path.join(SHOTS, `fb010-${lang}-${width}-form.png`),
      });
      await context.close();
    });
  }
}
