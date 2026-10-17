// LP-v1 – booking-request form (concept 5.2–5.4, US-155, SEC UXD-04…08) on the REVIEW build (dist-booking-preview,
// never deployed): the feature flag stays off in production, and the review build never sends anything.
// Test ids: QA to assign (TC-LP-0xx) – titles start with "LP-v1.2.1 form".
import { expect, test, type Page } from '@playwright/test';
import { FORM_URL, axeViolations, watchErrors, watchForeignRequests } from './helpers.js';

test.use({ baseURL: FORM_URL });

async function openForm(page: Page, path = '/') {
  await page.goto(`${path}#book`, { waitUntil: 'networkidle' });
  await expect(page.locator('#bk-form')).toBeVisible();
}

for (const width of [375, 1280]) {
  test(`LP-v1.2.1 form ${width}px EN: empty submit → summary of 5 errors (focused), axe 0, nothing sent`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en-US' });
    const page = await context.newPage();
    const errors = watchErrors(page);
    const foreign = watchForeignRequests(page, FORM_URL);
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await openForm(page);
    await page.locator('#bk-submit').click();
    const summary = page.locator('#bk-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page.locator('#bk-summary-h')).toHaveText('Please check 5 fields');
    await expect(page.locator('#f-in')).toHaveAttribute('aria-invalid', 'true');
    const v = await axeViolations(page, info, `form-errors-${width}`);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
    expect(requests.filter((u) => u.includes('/v1/'))).toEqual([]);
    await context.close();
  });
}

test('LP-v1.2.1 form: capacity (under-6s not counted), by the month, email channel, room preselect', async ({
  page,
}) => {
  await openForm(page);
  // "Request this room" on the Signature card preselects it with its sleeps hint
  await page.locator('a[data-room="signature-two-bedrooms"]').click();
  await expect(page.locator('#f-room')).toHaveValue('signature-two-bedrooms');
  await expect(page.locator('#f-room-hint')).toHaveText(
    'Sleeps 4–5. The higher number uses the sofa.',
  );
  // Studio: 3 adults + 2 under 6 = fine; 4 adults = over capacity
  await page.locator('#f-room').selectOption('standard-studio-city-view');
  await page.locator('#f-adults').selectOption('3');
  await page.locator('#f-infants').selectOption('2');
  await page.locator('#bk-submit').click();
  await expect(page.locator('#f-guests-err')).toBeEmpty();
  await page.locator('#f-adults').selectOption('4');
  await expect(page.locator('#f-guests-err')).toContainText('up to 3');
  // By the month: arrival + months, check-in/out disabled
  await page.locator('label:has(input[value="long"])').click();
  await expect(page.locator('#f-arr')).toBeEnabled();
  await expect(page.locator('#f-months')).toBeEnabled();
  await expect(page.locator('#f-in')).toBeDisabled();
  // Email: the phone field goes away (one way to reach the guest – SEC ARC-14)
  await page.locator('label:has(input[value="email"])').click();
  await expect(page.locator('#f-email')).toBeVisible();
  await expect(page.locator('#f-phone')).toBeDisabled();
});

test('LP-v1.2.1 form VI: a valid request is NOT sent in the review build; honeypot off screen; consent unticked', async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: 'vi-VN',
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') posts.push(r.url());
  });
  await openForm(page, '/vi/');
  await expect(page.locator('#f-consent')).not.toBeChecked();
  const hp = await page.locator('#f-website').boundingBox();
  expect(hp === null || hp.x < -1000).toBe(true);
  const today = await page.locator('#f-in').getAttribute('min');
  const d = new Date(`${today}T00:00:00Z`);
  const iso = (n: number) => new Date(d.getTime() + n * 864e5).toISOString().slice(0, 10);
  await page.locator('#f-in').fill(iso(10));
  await page.locator('#f-out').fill(iso(13));
  await expect(page.locator('#f-nights')).toHaveText('3 đêm');
  await page.locator('#f-name').fill('An');
  await page.locator('#f-phone').fill('0912 345 678');
  await page.locator('#f-consent').check();
  await page.locator('#bk-submit').click();
  await expect(page.locator('#bk-status')).toContainText('chưa được gửi');
  await expect(page.locator('#bk-done')).toBeHidden();
  expect(posts).toEqual([]);
  await context.close();
});

test('LP-v1.2.1 form without JavaScript: the form stays hidden and has no action (SEC UXD-08)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/#book');
  const form = page.locator('#bk-form');
  await expect(form).toBeHidden();
  expect(await form.getAttribute('action')).toBeNull();
  await expect(page.locator('#book noscript, #book .bk-card')).not.toHaveCount(0);
  await context.close();
});
