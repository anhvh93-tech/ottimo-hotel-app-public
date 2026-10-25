// LP-v1 – page structure of mock v1.2.1 (concept 3.1, 3.3, 5.5, 6; FB-INV-002 points 1, 3, 4). Production build:
// the booking form is off, so "Request to book" leads to the Zalo/call block.
// Test ids (QA 17/10): TC-LP-011 sections, TC-LP-012 header, TC-LP-013 phone bar, TC-LP-014 no JS.
import { expect, test } from '@playwright/test';
import { PAGES, type Lang } from './helpers.js';

const SECTIONS = ['why', 'rooms', 'amenities', 'location', 'book', 'faq', 'contact'];

for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`TC-LP-011 LP-v1.2.1 ${lang.toUpperCase()}: 8 sections in order, #book is the Zalo/call block, other channels folded`, async ({
    page,
  }) => {
    await page.goto(PAGES[lang]);
    const ids = await page
      .locator('main > section')
      .evaluateAll((ss) => ss.map((s) => s.id || (s.classList.contains('hero') ? 'hero' : '')));
    expect(ids).toEqual(['hero', ...SECTIONS]);
    // every "Plan your stay" goes to #book (hero, header, menu, phone bar); room links and "Ask us about your dates"
    // (Location) too; "See the rooms" under the two cards goes to #rooms (CPY concept B, 24/10)
    const toBook = await page.locator('a[href$="#book"]').count();
    expect(toBook).toBeGreaterThanOrEqual(1 + 1 + 1 + 1 + 4 + 1);
    await expect(page.locator('#location a.link[href="#book"]')).toHaveCount(1);
    await expect(page.locator('#why a.link[href="#rooms"]')).toHaveCount(1);
    // form off (concept 5.5 "chat"): no form, a filled Zalo button + a call button in #book
    await expect(page.locator('#book form')).toHaveCount(0);
    await expect(
      page.locator('#book .chat-fallback a.btn-primary[href^="https://zalo.me/"]'),
    ).toHaveCount(1);
    await expect(page.locator('#book .chat-fallback a[href="tel:+84844440909"]')).toHaveCount(1);
    // WhatsApp/Telegram/Viber only inside the closed "Other channels" (the one place)
    const other = page.locator('a[href*="wa.me/"], a[href*="t.me/"], a[href^="viber:"]');
    await expect(other).toHaveCount(3);
    expect(
      await other.evaluateAll((as) => as.every((a) => a.closest('details.more:not([open])'))),
    ).toBe(true);
    // Facebook is a plain link (contact + footer), the address appears once (Location)
    await expect(page.locator('a[href^="https://www.facebook.com/"]')).toHaveCount(2);
    await expect(page.locator('address')).toHaveCount(1);
    // no room count anywhere a visitor reads (FB-INV-002 point 1)
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/\bten (rooms|apartments)\b|mười căn|apartment|căn hộ/i);
  });
}

test('TC-LP-012 LP-v1.2.1 header from 768 px: "Chat on Zalo" link + outline "Request to book"; not on phones', async ({
  browser,
}) => {
  for (const [width, visible] of [
    [375, false],
    [768, true],
    [1280, true],
  ] as const) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    await page.goto('/');
    const zalo = page.locator('header .h-zalo');
    if (visible) {
      await expect(zalo).toBeVisible();
      expect((await zalo.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await expect(page.locator('header a.btn-ghost[href="#book"]')).toBeVisible();
      await expect(page.locator('header .btn-primary')).toHaveCount(0); // never a filled button in the header
    } else await expect(zalo).toBeHidden();
    await context.close();
  }
});

test('TC-LP-013 LP-v1.2.1 phone bar: hidden over the hero, #book, #contact and the footer; shown in between (concept 3.3)', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  const bar = page.locator('#stickybar');
  const hiddenAt = async (selector: string) => {
    await page
      .locator(selector)
      .first()
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    return bar.getAttribute('data-hidden');
  };
  await expect.poll(() => bar.getAttribute('data-hidden')).toBe('true'); // hero buttons on screen
  await expect.poll(() => hiddenAt('#rooms h2')).toBe('false');
  await expect(bar.locator('a').first()).toHaveAttribute('href', '#book'); // Request to book first, filled
  await expect(bar.locator('a').nth(1)).toHaveAttribute('href', /zalo\.me/);
  await expect.poll(() => hiddenAt('#location h2')).toBe('false');
  await expect.poll(() => hiddenAt('#book h2')).toBe('true');
  await expect.poll(() => hiddenAt('#contact h2')).toBe('true');
  await expect.poll(() => hiddenAt('footer .f-base')).toBe('true');
  await context.close();
});

test('TC-LP-014 LP-v1.2.1 without JavaScript: the phone bar shows, no form, every action is a real link', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#stickybar')).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('#book .chat-fallback')).toBeVisible();
  await context.close();
});
