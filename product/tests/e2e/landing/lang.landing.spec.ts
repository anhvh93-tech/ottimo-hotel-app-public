// LP-v1 – language rule (ADR-014 3.2–3.3, US-152 AC2): English at /, Vietnamese at /vi/, never a redirect by
// browser language; only a dismissible suggestion strip; the guest's choice is kept in localStorage `ottimo.lang`.
import { expect, test } from '@playwright/test';
import { axeViolations } from './helpers.js';

test('TC-LP-006 GET / with Accept-Language: vi → 200 English page, no redirect, no Vary: Accept-Language, no cookie', async ({
  request,
}) => {
  const res = await request.get('/', {
    headers: { 'Accept-Language': 'vi-VN,vi;q=0.9' },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<html lang="en"');
  expect(res.headers()['vary'] ?? '').not.toMatch(/accept-language/i);
  expect(res.headers()['set-cookie']).toBeUndefined();
});

test('TC-LP-007 every published page declares en, vi, ko, zh, ru and x-default (= English) two-way', async ({
  page,
}) => {
  for (const path of ['/', '/vi/', '/ko/', '/zh/', '/ru/']) {
    await page.goto(path);
    const alt = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((ls) =>
        ls.map((l) => [l.getAttribute('hreflang'), new URL(l.getAttribute('href')!).pathname]),
      );
    expect(alt).toEqual([
      ['en', '/'],
      ['vi', '/vi/'],
      ['ko', '/ko/'],
      ['zh', '/zh/'],
      ['ru', '/ru/'],
      ['x-default', '/'],
    ]);
  }
});

test('TC-LP-040 LP-v2 browser language → suggestion: ko-KR → /ko/, zh-CN → /zh/, ru-RU → /ru/; zh-TW / zh-HK → none (ARC lp-v2 3.1)', async ({
  browser,
}) => {
  for (const [locale, want] of [
    ['ko-KR', 'ko'],
    ['zh-CN', 'zh'],
    ['zh-SG', 'zh'],
    ['ru-RU', 'ru'],
    ['zh-TW', null],
    ['zh-HK', null],
  ] as const) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto('/');
    expect(page.url(), 'no redirect').toMatch(/\/$/);
    const visible = await page
      .locator('[data-suggest]:not([hidden])')
      .evaluateAll((s) => s.map((x) => x.getAttribute('data-suggest')));
    expect(visible, locale).toEqual(want ? [want] : []);
    if (want) {
      const strip = page.locator(`[data-suggest="${want}"]`);
      await expect(strip.locator('a')).toHaveAttribute('href', `/${want}/`);
      await expect(strip).toHaveAttribute('lang', want === 'zh' ? 'zh-Hans' : want);
    }
    await context.close();
  }
});

test('TC-LP-041 LP-v2 language list: globe + code, 5 names in their own language, plain links, keyboard and Escape (UXD lp-v2 2.2)', async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto('/');
  const summary = page.locator('details.lang-pick summary');
  await expect(summary).toHaveAttribute('aria-label', 'EN – Language: English');
  await expect(summary).toHaveText('EN');
  await expect(page.locator('.lp-panel')).toBeHidden();
  await summary.focus();
  await page.keyboard.press('Enter');
  const links = page.locator('.lp-panel a');
  await expect(links).toHaveText(['English', 'Tiếng Việt', '한국어', '简体中文', 'Русский']);
  expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual([
    '/',
    '/vi/',
    '/ko/',
    '/zh/',
    '/ru/',
  ]);
  expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('lang')))).toEqual([
    'en',
    'vi',
    'ko',
    'zh-Hans',
    'ru',
  ]);
  await page.keyboard.press('Escape');
  await expect(page.locator('.lp-panel')).toBeHidden();
  await expect(summary).toBeFocused();
  // opening the language list closes the phone menu and the other way round
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('details.menu summary').click();
  await summary.click();
  await expect(page.locator('details.menu')).not.toHaveAttribute('open', '');
  await page.locator('.lp-panel a[hreflang="ko"]').click();
  await expect(page).toHaveURL(/\/ko\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('details.lang-pick summary')).toHaveAttribute(
    'aria-label',
    'KO – 언어: 한국어',
  );
  expect(await page.evaluate(() => localStorage.getItem('ottimo.lang'))).toBe('ko');
  await context.close();
});

test('TC-LP-042 LP-v2 the language list works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/zh/');
  await page.locator('details.lang-pick summary').click();
  await page.locator('.lp-panel a[hreflang="ru"]').click();
  await expect(page).toHaveURL(/\/ru\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await context.close();
});

test('TC-LP-008 (a) Vietnamese browser on the English page: strip suggests /vi/; closing keeps English after reload', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    locale: 'vi-VN',
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto('/');
  expect(page.url()).toMatch(/\/$/); // no redirect
  const strip = page.locator('[data-suggest="vi"]');
  await expect(strip).toBeVisible();
  await expect(strip.locator('a')).toHaveAttribute('href', '/vi/');
  await expect(strip).toHaveAttribute('lang', 'vi');
  // Fixed strip never covers the sticky contact bar
  const [s, bar] = await Promise.all([
    strip.boundingBox(),
    page.locator('.stickybar').boundingBox(),
  ]);
  expect(s!.y + s!.height).toBeLessThanOrEqual(bar!.y + 0.5);
  const v = await axeViolations(page, info, 'suggest-vi');
  expect(v, JSON.stringify(v, null, 2)).toEqual([]);

  await strip.getByRole('button').click();
  await expect(strip).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('ottimo.lang'))).toBe('en');
  await page.reload();
  await expect(page.locator('[data-suggest]')).toHaveCount(4); // one hidden strip per other language (LP-v2)
  await expect(page.locator('[data-suggest]:not([hidden])')).toHaveCount(0);
  await expect(strip).toBeHidden();
  await context.close();
});

test('TC-LP-008 (b) English browser on /vi/: strip suggests English; choosing EN in the header lands on / with no strip', async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto('/vi/');
  const strip = page.locator('[data-suggest="en"]');
  await expect(strip).toBeVisible();
  await expect(strip.locator('a')).toHaveAttribute('href', '/');
  // Header "Request to book" stays clickable (strip is at the bottom)
  const [s, book] = await Promise.all([
    strip.boundingBox(),
    page.locator('.site-h a.only-d[href$="#book"]').boundingBox(),
  ]);
  expect(book!.y + book!.height).toBeLessThan(s!.y);

  await page.locator('details.lang-pick summary').click();
  await page.locator('.lp-panel a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-suggest="vi"]')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('ottimo.lang'))).toBe('en');
  await context.close();
});

test('TC-LP-008 (c) a browser in an unpublished language (fr) gets no strip on / and the English suggestion on /vi/', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'fr-FR' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-suggest="vi"]')).toBeHidden();
  await page.goto('/vi/');
  await expect(page.locator('[data-suggest="en"]')).toBeVisible();
  await context.close();
});

test('TC-LP-008 (d) the guest who chose Vietnamese sees the Vietnamese suggestion on the English page (reminder only)', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-suggest="vi"]')).toBeHidden();
  await page.locator('details.lang-pick summary').click();
  await page.locator('.lp-panel a[hreflang="vi"]').click();
  await expect(page).toHaveURL(/\/vi\/$/);
  await expect(page.locator('[data-suggest="en"]')).toBeHidden(); // choice beats the browser language
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en'); // never switched automatically
  await expect(page.locator('[data-suggest="vi"]')).toBeVisible();
  await context.close();
});
