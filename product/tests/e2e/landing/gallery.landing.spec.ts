// R3-Q52 (INV 22/10 + 23/10) – hero slideshow and room photo viewer on the production build.
// TC-LP-019 slideshow: next photo every 3 s, swipe/keys/dots, pause button, never with reduced motion or a hidden tab,
//   first photo only without JavaScript.
// TC-LP-020 viewer: "n photos" opens a modal dialog, keys ← → Home End, buttons wrap, Tab stays inside, Esc closes and
//   gives focus back, axe 0 with the dialog open, alt text on every photo, nothing from another origin.
import { expect, test, type Page } from '@playwright/test';
import {
  PAGES,
  axeViolations,
  cspViolations,
  recordCsp,
  watchErrors,
  watchForeignRequests,
  type Lang,
} from './helpers.js';

const PHONE = { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true };
const currentDot = (page: Page) =>
  page
    .locator('[data-car-dot]')
    .evaluateAll((ds) => ds.findIndex((d) => d.getAttribute('aria-current') === 'true'));
/** Index of the slide that fills the track (what the guest sees). */
const visibleSlide = (page: Page) =>
  page.locator('[data-car-track]').evaluate((t) => Math.round(t.scrollLeft / t.clientWidth));
/** Hero photos = HERO_PICKS in landing-web src/content/hero.ts (INV may send another set: 6 since 24/10). */
const SLIDES = 6;

test.describe('TC-LP-019 hero slideshow (R3-Q52)', () => {
  test('advances on its own every 3 s after load; the next photo loads only shortly before', async ({
    browser,
  }) => {
    const context = await browser.newContext(PHONE);
    const page = await context.newPage();
    const errors = watchErrors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // first view: only the facade is rendered, the other slides wait (budget concept 11.2)
    await expect(page.locator('[data-car-slide]')).toHaveCount(SLIDES);
    await expect(page.locator('[data-car-slide].is-pending')).toHaveCount(SLIDES - 1);
    await expect(page.locator('[data-car-ctrl]')).toBeVisible();
    await page.waitForLoadState('load');
    const t0 = Date.now();
    await expect.poll(() => currentDot(page), { timeout: 6000 }).toBe(1);
    const elapsed = Date.now() - t0;
    expect(elapsed, 'first step ≈ 3 s after load').toBeGreaterThan(2000);
    await expect.poll(() => visibleSlide(page)).toBe(1);
    await expect.poll(() => currentDot(page), { timeout: 5000 }).toBe(2);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('swipe, arrow keys and dots move it; the dots follow', async ({ browser }) => {
    const context = await browser.newContext(PHONE);
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const track = page.locator('[data-car-track]');
    // swipe = horizontal scroll of the snap row after a touch (the first touch reveals every photo)
    await track.dispatchEvent('touchstart');
    await expect(page.locator('[data-car-slide].is-pending')).toHaveCount(0);
    await track.evaluate((t) => t.scrollTo({ left: t.clientWidth * 3, behavior: 'auto' }));
    await expect.poll(() => currentDot(page)).toBe(3);
    await track.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => currentDot(page)).toBe(2);
    await expect.poll(() => visibleSlide(page)).toBe(2);
    await page.keyboard.press('End');
    await expect.poll(() => visibleSlide(page)).toBe(SLIDES - 1);
    await page.locator('[data-car-dot="1"]').click();
    await expect.poll(() => visibleSlide(page)).toBe(1);
    await expect.poll(() => currentDot(page)).toBe(1);
    await context.close();
  });

  test('the pause button stops it and says "Play"; pressing again resumes', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const toggle = page.locator('[data-car-toggle]');
    await expect(toggle).toHaveAttribute('aria-label', 'Pause the slideshow');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Play the slideshow');
    await page.mouse.move(1270, 790); // pointer off the hero, focus out: only the button holds it now
    await page.locator('h1').click();
    await page.waitForTimeout(4000);
    expect(await currentDot(page)).toBe(0);
    await toggle.click();
    await page.mouse.move(1270, 790);
    await page.locator('h1').click();
    await expect.poll(() => currentDot(page), { timeout: 6000 }).toBe(1);
    await context.close();
  });

  test('prefers-reduced-motion: never moves on its own, no pause button, swipe still works', async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...PHONE, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/vi/', { waitUntil: 'load' });
    await expect(page.locator('[data-car-toggle]')).toBeHidden();
    await page.waitForTimeout(4000);
    expect(await currentDot(page)).toBe(0);
    await expect(page.locator('[data-car-slide].is-pending')).toHaveCount(SLIDES - 1);
    await page.locator('[data-car-dot="2"]').click();
    await expect.poll(() => visibleSlide(page)).toBe(2);
    await context.close();
  });

  test('hidden tab: no step while the page is in the background', async ({ browser }) => {
    const context = await browser.newContext(PHONE);
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(4000);
    expect(await currentDot(page)).toBe(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => currentDot(page), { timeout: 6000 }).toBe(1);
    await context.close();
  });

  // (Browsers ignore loading="lazy" when JavaScript is off, so bytes are not checked here – TC-LP-009 measures the
  // real first view with JavaScript.)
  test('without JavaScript: the facade only, no slideshow controls, no gallery button', async ({
    browser,
  }) => {
    const context = await browser.newContext({ ...PHONE, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('[data-car-ctrl]')).toBeHidden();
    await expect(page.locator('[data-car-slide]').first()).toBeVisible();
    for (const s of await page.locator('[data-car-slide].is-pending').all())
      await expect(s).toBeHidden();
    for (const b of await page.locator('.gal-open').all()) await expect(b).toBeHidden();
    await context.close();
  });
});

const GARDEN = '[data-gallery-open="gal-standard-studio-garden-view"]';

for (const lang of Object.keys(PAGES) as Lang[]) {
  for (const width of [375, 1280]) {
    test(`TC-LP-020 room gallery ${lang.toUpperCase()} ${width}px: open, keys, buttons, focus trap, Esc, axe 0`, async ({
      browser,
      baseURL,
    }, info) => {
      const context = await browser.newContext(
        width < 768 ? PHONE : { viewport: { width, height: 800 } },
      );
      const page = await context.newPage();
      await recordCsp(page);
      const errors = watchErrors(page);
      const foreign = watchForeignRequests(page, baseURL!);
      await page.goto(PAGES[lang], { waitUntil: 'load' });

      // one button per room type, the number of photos in its text
      await expect(page.locator('.gal-open')).toHaveCount(4);
      const open = page.locator(GARDEN);
      await expect(open).toHaveText(lang === 'en' ? '6 photos' : '6 ảnh');
      await open.scrollIntoViewIfNeeded();
      await open.click();

      const dialog = page.locator('#gal-standard-studio-garden-view');
      await expect(dialog).toHaveJSProperty('open', true);
      await expect(page.locator('html')).toHaveClass(/lb-open/);
      await expect(dialog.locator('[data-lb-close]')).toBeFocused();
      const count = dialog.locator('[data-lb-count]');
      await expect(count).toHaveText('1 / 6');
      // the first photo really shows (lazy image inside the dialog loads on open)
      await expect
        .poll(() =>
          dialog
            .locator('.lb-slide img')
            .first()
            .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
        )
        .toBe(true);
      // every photo has alt text and a visible caption
      const alts = await dialog
        .locator('.lb-slide img')
        .evaluateAll((is) => is.map((i) => i.getAttribute('alt') ?? ''));
      expect(alts).toHaveLength(6);
      for (const a of alts) expect(a.trim().length).toBeGreaterThan(5);

      await page.keyboard.press('ArrowRight');
      await expect(count).toHaveText('2 / 6');
      await expect(dialog.locator('[data-lb-count-sr]')).toHaveText(
        lang === 'en' ? 'Photo 2 of 6' : 'Ảnh 2 trên 6',
      );
      await page.keyboard.press('End');
      await expect(count).toHaveText('6 / 6');
      await dialog.locator('[data-lb-next]').click(); // wraps to the first
      await expect(count).toHaveText('1 / 6');
      await dialog.locator('[data-lb-prev]').click(); // and back to the last
      await expect(count).toHaveText('6 / 6');
      await page.keyboard.press('Home');
      await expect(count).toHaveText('1 / 6');
      // swipe = scroll of the snap row
      await dialog
        .locator('[data-lb-track]')
        .evaluate((t) => t.scrollTo({ left: t.clientWidth * 2, behavior: 'auto' }));
      await expect(count).toHaveText('3 / 6');

      // focus never leaves the dialog
      for (const key of [
        'Tab',
        'Tab',
        'Tab',
        'Tab',
        'Tab',
        'Shift+Tab',
        'Shift+Tab',
        'Shift+Tab',
      ]) {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(
          true,
        );
      }

      const v = await axeViolations(page, info, `gallery-${lang}-${width}`);
      expect(v, JSON.stringify(v, null, 2)).toEqual([]);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveJSProperty('open', false);
      await expect(page.locator('html')).not.toHaveClass(/lb-open/);
      await expect(open).toBeFocused();

      // the other rooms open their own photos
      await page.locator('[data-gallery-open="gal-premium-one-bedroom-1"]').click();
      await expect(page.locator('#gal-premium-one-bedroom-1 [data-lb-count]')).toHaveText('1 / 3');
      await page.locator('#gal-premium-one-bedroom-1 [data-lb-close]').click();
      await expect(page.locator('#gal-premium-one-bedroom-1')).toHaveJSProperty('open', false);

      expect(errors, errors.join('\n')).toEqual([]);
      expect(await cspViolations(page)).toEqual([]);
      expect(foreign, foreign.join('\n')).toEqual([]);
      await context.close();
    });
  }
}
