// LP-v1 – layout, a11y and SEC C-1 on 320/375/768/1280 px × EN/VI (concept 12.1, sprint-4-plan T11, US-153 AC4/AC6/AC8):
// no horizontal scroll (before and after scrolling through), exactly one H1, axe 0 violations (FAQ opened),
// no duplicate id, no console/CSP error, 0 requests to another origin, every visible glyph drawn by the
// self-hosted fonts (no fallback to Arial/Georgia).
import { expect, test } from '@playwright/test';
import { knownBug } from '../support/known-bugs.js';
import {
  PAGES,
  WIDTHS,
  axeViolations,
  cspViolations,
  horizontalOverflow,
  recordCsp,
  scrollThrough,
  watchErrors,
  watchForeignRequests,
  type Lang,
} from './helpers.js';

for (const lang of Object.keys(PAGES) as Lang[]) {
  for (const width of WIDTHS) {
    test(`TC-LP-001 LP-v1 ${lang.toUpperCase()} ${width}px: no overflow, one H1, axe 0, CSP clean, no third party`, async ({
      browser,
      baseURL,
    }, info) => {
      const context = await browser.newContext({
        viewport: { width, height: width < 768 ? 812 : 800 },
        locale: lang === 'vi' ? 'vi-VN' : 'en-US', // matches the page: no suggestion strip
      });
      const page = await context.newPage();
      await recordCsp(page);
      const errors = watchErrors(page);
      const foreign = watchForeignRequests(page, baseURL!);

      const res = await page.goto(PAGES[lang], { waitUntil: 'networkidle' });
      expect(res?.status()).toBe(200);
      expect(await page.locator('html').getAttribute('lang')).toBe(lang);
      expect(await horizontalOverflow(page), 'horizontal scroll at the top').toBeLessThanOrEqual(0);
      await expect(page.locator('h1')).toHaveCount(1);

      await scrollThrough(page);
      expect(
        await horizontalOverflow(page),
        'horizontal scroll after scrolling',
      ).toBeLessThanOrEqual(0);

      const dupIds = await page.evaluate(() => {
        const seen = new Map<string, number>();
        document.querySelectorAll('[id]').forEach((e) => seen.set(e.id, (seen.get(e.id) ?? 0) + 1));
        return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
      });
      expect(dupIds).toEqual([]);

      // Open every disclosure of the page content (FAQ…) – closed content is invisible to axe otherwise.
      await page.evaluate(() =>
        document
          .querySelectorAll('main details')
          .forEach((d) => ((d as HTMLDetailsElement).open = true)),
      );
      // axe target-size coi phần bị đầu trang/thanh cố định che là "quá nhỏ": đo ở đầu trang (ảnh đã tải hết khi cuộn),
      // không ở vị trí cuộn bất kỳ – nếu không, kết quả phụ thuộc chỗ dừng cuộn (QA 17/10: 3/42 lượt ở 768 px)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
      const violations = await axeViolations(page, info, `${lang}-${width}`);
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
      if (width < 1024) {
        await page.locator('details.menu summary').click();
        await expect(page.locator('.menu-panel')).toBeVisible();
        // axe đo kích thước/khoảng cách vùng chạm: chờ hiệu ứng mở menu chạy xong (target-size chập chờn khi đo
        // giữa chừng – QA 17/10, 1/26 lượt)
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
        );
        expect(await horizontalOverflow(page), 'overflow with the menu open').toBeLessThanOrEqual(
          0,
        );
        const menuViolations = await axeViolations(page, info, `${lang}-${width}-menu`);
        expect(menuViolations, JSON.stringify(menuViolations, null, 2)).toEqual([]);
      }

      expect(errors, errors.join('\n')).toEqual([]);
      expect(await cspViolations(page)).toEqual([]);
      expect(foreign, foreign.join('\n')).toEqual([]);
      await context.close();
    });
  }
}

for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`TC-LP-002 LP-v1 ${lang.toUpperCase()}: every visible glyph comes from Lora or Be Vietnam Pro (concept 3.3)`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    await page.goto(PAGES[lang], { waitUntil: 'networkidle' });
    await scrollThrough(page);
    await page.evaluate(() => document.fonts.ready);
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: 'body *',
    });
    const fallback = new Map<string, number>();
    for (const nodeId of nodeIds) {
      const { fonts } = await cdp
        .send('CSS.getPlatformFontsForNode', { nodeId })
        .catch(() => ({ fonts: [] as { familyName: string; glyphCount: number }[] }));
      for (const f of fonts)
        if (!/^(Lora|Be Vietnam Pro)/.test(f.familyName))
          fallback.set(f.familyName, (fallback.get(f.familyName) ?? 0) + f.glyphCount);
    }
    expect(Object.fromEntries(fallback)).toEqual({});
    await context.close();
  });
}

test('TC-LP-003 LP-v1 404 pages: status 404, one H1, axe 0, page language from the path', async ({
  browser,
}, info) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await context.newPage();
  for (const [path, lang] of [
    ['/no-such-page/', 'en'],
    ['/vi/no-such-page/', 'vi'],
  ] as const) {
    const res = await page.goto(path, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(404);
    expect(await page.locator('html').getAttribute('lang')).toBe(lang);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const v = await axeViolations(page, info, `404-${lang}`);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
  }
  await context.close();
});

// Structural, layout-independent: survives the content/layout rework of mock v1.2 (FB-INV-002). Card order and
// sticky-bar order are content decisions, checked in apps/landing-web/src/content/copy.test.ts.
const ALLOWED_LINKS = [
  /^https:\/\/(zalo\.me|oa\.zalo\.me)\/\S+$/, // Zalo (OA once verified – ESC-021)
  /^https:\/\/wa\.me\/84844440909(\?text=\S*)?$/,
  /^https:\/\/t\.me\/\+84844440909$/,
  /^viber:\/\/chat\?number=%2B84844440909$/,
  /^tel:\+84844440909$/,
  /^mailto:info@ottimo\.vn(\?subject=\S*)?$/, // shared mailbox on the OTTIMO domain only
  /^https:\/\/maps\.app\.goo\.gl\/oYos42G5YvUEcDCc6$/, // INV's pin (P-S4-7)
  /^https:\/\/(www\.)?facebook\.com\/\S+$/, // fanpage – plain link (FB-INV-002 point 4)
];

test('TC-LP-004 LP-v1 links: only the allowed contact channels, Zalo and phone on every page, no OTA, no form while off', async ({
  page,
}) => {
  for (const path of ['/', '/vi/']) {
    await page.goto(path);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
    const outside = hrefs.filter((h) => !h.startsWith('/') && !h.startsWith('#'));
    for (const h of outside)
      expect(
        ALLOWED_LINKS.some((r) => r.test(h)),
        `${path}: unexpected link ${h}`,
      ).toBe(true);
    expect(
      outside.some((h) => /zalo\.me\//.test(h)),
      `${path}: no Zalo link`,
    ).toBe(true);
    expect(outside, `${path}: no phone link`).toContain('tel:+84844440909');
    // External pages open only on a tap: no target-less window.open, every new-tab link is noopener
    const newTabs = await page
      .locator('a[target="_blank"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('rel') ?? ''));
    for (const rel of newTabs) expect(rel).toContain('noopener');
    // Booking request form not built yet (FB-INV-002, ESC-020 L7): no form or input of any kind
    await expect(page.locator('form, input, textarea, select')).toHaveCount(0);
  }
});

// Mock v1.2.1: "Copy address" in Location; a link to #faq-long opens the long-stay answer.
test('TC-LP-005 LP-v1 keyboard: skip link reaches main; Copy address reports in the page language', async ({
  browser,
}) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  await page.goto('/vi/');
  await page.keyboard.press('Tab');
  await expect(page.locator('a.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await page.locator('#copy-addr').click();
  await expect(page.locator('#copy-status')).toHaveText('Đã chép địa chỉ.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '30/3 Triệu Việt Vương, Phường Xuân Hương, Đà Lạt, Lâm Đồng',
  );
  // A link to a FAQ entry opens it (e.g. /#faq-long – "How do long stays work?")
  await page.goto('/#faq-long');
  await expect(page.locator('#faq-long')).toHaveAttribute('open', '');
  await context.close();
});

// US-151 AC7 + US-146 AC2 (FB-INV-002 ý 4, mock v1.2): thanh nút cố định (điện thoại) và đầu trang (máy tính) chỉ có
// "Đặt phòng" và "Chat Zalo", Zalo đứng đầu cả bản EN; WhatsApp · Telegram · Viber chỉ nằm trong "Kênh khác" thu gọn
// (một lần bấm) ở phần Liên hệ. Đạt từ bản dựng v1.2.1 (FE-LP 17/10) – US-151/AC7 đã xóa khỏi OPEN.
test('TC-LP-010 US-151/AC7 thanh cố định và đầu trang chỉ "Đặt phòng" + "Chat Zalo"; WhatsApp/Telegram/Viber chỉ trong "Kênh khác" thu gọn', async ({
  browser,
}) => {
  knownBug('US-151/AC7');
  const OTHER = 'a[href*="wa.me/"], a[href*="t.me/"], a[href^="viber:"]';
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await context.newPage();
    for (const path of ['/', '/vi/']) {
      await page.goto(path, { waitUntil: 'networkidle' });
      // không kênh phụ nào ở thanh cố định, đầu trang hay menu chính
      const misplaced = await page
        .locator(OTHER)
        .evaluateAll((as) =>
          as
            .filter((a) => a.closest('header, nav, .stickybar, .menu-panel'))
            .map((a) => a.getAttribute('href') ?? ''),
        );
      expect(misplaced, `${path} ${width}px: kênh phụ ngoài "Kênh khác"`).toEqual([]);
      // mọi kênh phụ nằm trong một khối thu gọn (details đóng) – cần một lần bấm
      const exposed = await page.locator(OTHER).evaluateAll((as) =>
        as
          .filter((a) => {
            const d = a.closest('details');
            return !d || d.open;
          })
          .map((a) => a.getAttribute('href') ?? ''),
      );
      expect(exposed, `${path} ${width}px: kênh phụ hiện sẵn, không thu gọn`).toEqual([]);
      // Zalo là nút chat đầu tiên của thanh cố định / đầu trang ở mọi ngôn ngữ
      const firstChat = await page
        .locator('header a[href*="zalo.me"], .stickybar a, header a[href*="wa.me"]')
        .first()
        .getAttribute('href');
      expect(firstChat ?? '', `${path} ${width}px: kênh chat đầu tiên`).toMatch(/zalo\.me/);
    }
    await context.close();
  }
});
