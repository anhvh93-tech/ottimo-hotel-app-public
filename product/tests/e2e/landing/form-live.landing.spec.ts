// LP-v1 / US-155 v1.0 – the LIVE booking-request form (apps/landing-web/dist-booking-live: LANDING_BOOKING_FORM=true,
// slug dl01, same-origin API). The public endpoints of OpenAPI 0.3.7 add-on 2 (getPublicFormToken,
// createWebsiteBookingRequest) are answered by page.route on the landing origin – exactly where the landing Caddy
// proxies them in production – so the real CSP (connect-src 'self') is exercised while BE-D's server is rebuilt.
// Test ids: TC-LP-030 sent + thank-you, TC-LP-031 switch off (404), TC-LP-032 PUBLIC_FORM_NOT_READY, TC-LP-033 server
// field error, TC-LP-034 privacy notice pages, TC-LP-035 production build unchanged (no form, no privacy page).
import { expect, test, type Page, type Route } from '@playwright/test';
import {
  LIVE_URL,
  axeViolations,
  cspViolations,
  recordCsp,
  watchErrors,
  watchForeignRequests,
} from './helpers.js';

test.use({ baseURL: LIVE_URL });

const API = '/v1/public/properties/dl01';
const NOTICE_VERSION = '2026-10-24';
const TOKEN = {
  token: `v1.${'e2e'.padEnd(40, 'x')}`,
  notBefore: '2026-10-24T00:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  minDelaySeconds: 1,
};

interface Api {
  tokens: number;
  posts: Array<{ body: Record<string, unknown>; headers: Record<string, string> }>;
}

/** Answers the two public endpoints; `post` decides the createWebsiteBookingRequest answer. */
async function mockApi(
  page: Page,
  opts: { token?: number; post?: (n: number) => { status: number; body?: unknown } } = {},
): Promise<Api> {
  const api: Api = { tokens: 0, posts: [] };
  await page.route(`**${API}/form-token`, (route: Route) => {
    api.tokens += 1;
    const status = opts.token ?? 200;
    return route.fulfill({
      status,
      contentType: status === 200 ? 'application/json' : 'application/problem+json',
      headers: { 'Cache-Control': 'no-store' },
      body: JSON.stringify(status === 200 ? TOKEN : { code: 'NOT_FOUND', status }),
    });
  });
  await page.route(`**${API}/booking-requests`, (route: Route) => {
    const req = route.request();
    api.posts.push({ body: req.postDataJSON() as Record<string, unknown>, headers: req.headers() });
    const answer = opts.post?.(api.posts.length) ?? {
      status: 202,
      body: {
        refCode: 'K7Q2M9XD',
        promise: { kind: 'within_minutes', minutes: 60, by: '2026-10-24T03:00:00Z' },
      },
    };
    return route.fulfill({
      status: answer.status,
      contentType: answer.status === 202 ? 'application/json' : 'application/problem+json',
      body: answer.body === undefined ? '' : JSON.stringify(answer.body),
    });
  });
  return api;
}

async function fillValid(page: Page, opts: { note?: string } = {}) {
  await page.goto('/#book', { waitUntil: 'networkidle' });
  await expect(page.locator('#bk-form')).toBeVisible();
  const today = await page.locator('#f-in').getAttribute('min');
  const d = new Date(`${today}T00:00:00Z`);
  const iso = (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  await page.locator('#f-in').fill(iso(20));
  await page.locator('#f-out').fill(iso(23));
  await page.locator('#f-name').fill('Anna');
  await page.locator('#f-phone').fill('+7 912 345 6789');
  if (opts.note) await page.locator('#f-note').fill(opts.note);
  await page.locator('#f-consent').check();
}

test('TC-LP-030 live form EN: token on first touch, one POST to the same origin, thank-you with the request number', async ({
  page,
}, info) => {
  await recordCsp(page);
  const errors = watchErrors(page);
  const foreign = watchForeignRequests(page, LIVE_URL);
  const api = await mockApi(page);
  await fillValid(page, { note: 'Late arrival around 22:00' });
  expect(api.tokens).toBe(1);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-done')).toBeVisible();
  await expect(page.locator('#bk-done-h')).toBeFocused();
  await expect(page.locator('#bk-ref')).toHaveText('K7Q2M9XD');
  await expect(page.locator('#bk-done-when')).toContainText('within 1 hour');
  expect(api.posts).toHaveLength(1);
  const { body, headers } = api.posts[0]!;
  expect(headers['idempotency-key']).toBeTruthy();
  expect(headers['content-type']).toContain('application/json');
  expect(body).toMatchObject({
    formToken: TOKEN.token,
    stayType: 'short',
    adults: 2,
    guestName: 'Anna',
    preferredChannel: 'zalo',
    phone: '+7 912 345 6789',
    locale: 'en',
    consent: true,
    consentVersion: NOTICE_VERSION,
    landingPath: '/',
  });
  expect(body.email).toBeUndefined();
  expect('website' in body).toBe(false);
  // the request number never goes into the URL or the title (SEC UXD-08)
  expect(page.url()).not.toContain('K7Q2');
  expect(await page.title()).not.toContain('K7Q2');
  expect(await cspViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
  const v = await axeViolations(page, info, 'live-thank-you');
  expect(v, JSON.stringify(v, null, 2)).toEqual([]);
});

test('TC-LP-031 server switch off (404): the page says so at first touch and points to Zalo or a call; nothing posted', async ({
  page,
}) => {
  const api = await mockApi(page, { token: 404 });
  await fillValid(page);
  const status = page.locator('#bk-status');
  await expect(status).toContainText('Online requests are paused right now');
  await expect(status.getByRole('link', { name: 'Zalo' })).toHaveAttribute(
    'href',
    'https://zalo.me/0844440909',
  );
  await expect(status.getByRole('link', { name: '08.4444.0909' })).toHaveAttribute(
    'href',
    /^tel:\+84844440909$/,
  );
  await page.locator('#bk-submit').click();
  await expect(status).toContainText('Online requests are paused right now');
  await expect(page.locator('#bk-done')).toBeHidden();
  expect(api.posts).toHaveLength(0);
  expect(api.tokens).toBe(2);
});

test('TC-LP-032 422 PUBLIC_FORM_NOT_READY on send: Zalo / call line, no fake thank-you', async ({
  page,
}) => {
  await mockApi(page, {
    post: () => ({
      status: 422,
      body: { code: 'PUBLIC_FORM_NOT_READY', missing: ['privacy_notice_en'] },
    }),
  });
  await fillValid(page);
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-status')).toContainText('Online requests are paused right now');
  await expect(page.locator('#bk-done')).toBeHidden();
});

test('TC-LP-033 VI: the server refuses an ID number in the note – message at the field, summary focused', async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: 'vi-VN',
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();
  await mockApi(page, {
    post: () => ({
      status: 422,
      body: {
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'note', code: 'ID_NUMBER_DETECTED' }],
      },
    }),
  });
  await page.goto('/vi/#book', { waitUntil: 'networkidle' });
  await expect(page.locator('#bk-form')).toBeVisible();
  const today = await page.locator('#f-in').getAttribute('min');
  const d = new Date(`${today}T00:00:00Z`);
  const iso = (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  await page.locator('#f-in').fill(iso(5));
  await page.locator('#f-out').fill(iso(7));
  await page.locator('#f-name').fill('An');
  await page.locator('#f-phone').fill('0912 345 678');
  await page.locator('#f-note').fill('CCCD 079123456789');
  await page.locator('#f-consent').check();
  await page.locator('#bk-submit').click();
  await expect(page.locator('#f-note-err')).toContainText('Không cần gửi số giấy tờ');
  await expect(page.locator('#f-note')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#bk-summary')).toBeFocused();
  await expect(page.locator('#bk-done')).toBeHidden();
  await context.close();
});

for (const [path, anchor, h1] of [
  ['/privacy/', 'booking-requests', 'Privacy notice'],
  ['/vi/privacy/', 'yeu-cau-dat-phong', 'Thông báo xử lý dữ liệu'],
] as const)
  test(`TC-LP-034 privacy notice ${path}: one H1, version, reached from the form and the footer, axe 0, CSP clean`, async ({
    page,
  }, info) => {
    await recordCsp(page);
    const errors = watchErrors(page);
    await page.goto(path.startsWith('/vi/') ? '/vi/' : '/');
    // footer link on the home page of the same language (the language strip may cover it – no click needed)
    await expect(page.locator('footer').getByRole('link', { name: h1 })).toHaveAttribute(
      'href',
      path,
    );
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(h1);
    await expect(page.locator(`#${anchor}`)).toContainText(NOTICE_VERSION);
    await expect(page.locator('form')).toHaveCount(0);
    const v = await axeViolations(page, info, `privacy-${anchor}`);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
    expect(errors).toEqual([]);
    // the consent note links to the right anchor of the notice
    await page.goto(`${path.replace('privacy/', '')}#book`);
    await expect(page.locator('.consent-note a')).toHaveAttribute('href', `${path}#${anchor}`);
  });

test('TC-LP-035 production build (form off): no form, no privacy page, Zalo/call block as today', async ({
  page,
}) => {
  // the default server = the production build (apps/landing-web/dist)
  const base = `http://127.0.0.1:${Number(process.env.LANDING_PORT ?? 5186)}`;
  const res = await page.goto(`${base}/privacy/`);
  expect(res?.status()).toBe(404);
  await page.goto(`${base}/#book`);
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('#book .chat-fallback')).toBeVisible();
  await expect(page.locator('footer a[href="/privacy/"]')).toHaveCount(0);
});
