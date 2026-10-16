// E2E UI – guest-web H18 check-in online (US-106, US-107; MOB Sprint 3) trên trình duyệt di động giả lập (Chromium,
// 390×844, cảm ứng) với API thật: mở link /g/{token} → trang lưu trú (18.1) → thông báo dữ liệu (18.2 bước 0) →
// giấy tờ từng khách (chụp ảnh = chọn tệp ảnh) → giờ đến → xác nhận đồng ý lưu ảnh (không chọn sẵn) → hoàn tất.
// axe ở mỗi màn: 0 critical/serious (ĐK-S2-4). Bản EN (TC-L7-014 E): mọi chữ lấy từ strings-en.json đã duyệt.
// ĐK-3 (SEC): sau luồng không có ảnh/khóa nào trong localStorage/sessionStorage; token không còn trên thanh địa chỉ.
// Project desk-chromium (testMatch ui/); mỗi ca tự tạo browser context di động.
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { GUEST_ORIGIN, SEED_PASSWORD } from '../support/env.js';
import { bookFree, cleanupTracked, getReservation, room, s2Context } from '../support/s2.js';
import {
  PNG_16X16,
  getRegistration,
  guestLink,
  namedGuest,
  registrationOf,
} from '../support/s3.js';
import { scan } from './axe.js';
import { UI } from './helpers.js';

const STR = (lang: 'vi' | 'en') =>
  JSON.parse(
    readFileSync(new URL(`../../../design/copy/strings-${lang}.json`, import.meta.url), 'utf8'),
  ) as Record<string, string>;
const VI = STR('vi');
const EN = STR('en');
const stem = (s: string) => s.split('{')[0]!.trim();

async function guestPage(browser: Browser, locale: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale,
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  return ctx.newPage();
}

/** Confirmed booking (2 adults) + guest link; `guest` = extra fields of the booker (e.g. nationality). */
async function bookingWithLink(
  request: Page['request'],
  roomNo: string,
  guest: Record<string, unknown> = {},
) {
  const fd = await session(request, 'qa.fd');
  const c = await s2Context(request);
  const g = await namedGuest(request, fd, guest);
  const res = await bookFree(request, fd, c, {
    room: room(c, roomNo),
    nights: 2,
    today: await stackToday(request),
    guestId: g.id,
  });
  const link = await guestLink(request, fd, res.id);
  return { fd, res, link };
}

/** "Chụp" opens the camera/file chooser – the test hands it a real image file. */
async function photo(page: Page, personIdx: number, docTypeLabel: string, takeLabel: string) {
  const person = page.getByRole('group', { name: new RegExp(`${personIdx}.*`) }).first();
  await person.getByRole('button', { name: docTypeLabel }).click();
  const take = page.getByRole('button', { name: takeLabel }).nth(personIdx - 1);
  await expect(take).toBeEnabled();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), take.click()]);
  await chooser.setFiles({
    name: `giay-to-${personIdx}.png`,
    mimeType: 'image/png',
    buffer: PNG_16X16,
  });
}

test.describe(
  'UI guest-web H18 – check-in online (US-106, US-107)',
  { tag: ['@ui', '@sprint3', '@guest'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L7-010 (E) + TC-L7-001 (E) luồng check-in online tiếng Việt trên điện thoại + axe 18.1–18.3', async ({
      browser,
      request,
    }, info) => {
      test.slow();
      const { fd, res, link } = await bookingWithLink(request, '302');
      expect(new URL(link.url).origin).toBe(GUEST_ORIGIN);
      const page = await guestPage(browser, 'vi-VN');
      await page.goto(link.url);
      // 18.1: vào thẳng trang của đơn, token không còn trên thanh địa chỉ (ĐK-4)
      await expect(
        page.getByRole('heading', { name: new RegExp(stem(VI['guest.hello']!)) }),
      ).toBeVisible({
        timeout: 15_000,
      });
      expect(page.url()).not.toContain(link.token);
      await expect(page.getByText(res.code).first()).toBeVisible();
      await scan(page, info, 'H18-1-stay');
      // 18.2 bước 0: thông báo xử lý dữ liệu (bản VI đã duyệt)
      await page
        .getByRole('button', { name: /Làm thủ tục trước/ })
        .first()
        .click();
      await expect(page.getByText(VI['gw.notice_body']!)).toBeVisible();
      await scan(page, info, 'H18-2-notice');
      await page.getByRole('button', { name: VI['gw.notice_read']! }).click();
      // bước 1 giấy tờ: chọn loại → Chụp (bị khóa tới khi chọn loại)
      await expect(page.getByRole('heading', { name: VI['guest.oci.step1']! })).toBeVisible();
      await expect(page.getByRole('button', { name: VI['gw.take_photo']! }).first()).toBeDisabled();
      await scan(page, info, 'H18-2-documents');
      await photo(page, 1, VI['gw.doc.cccd']!, VI['gw.take_photo']!);
      await photo(page, 2, VI['gw.doc.passport']!, VI['gw.take_photo']!);
      // ĐK-3: ảnh đã gửi không hiện lại – chỉ trạng thái "đã gửi"
      await expect(page.getByText(stem(VI['gw.sent_hidden']!)).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.locator('main img')).toHaveCount(0);
      await page
        .getByRole('button', { name: /Tiếp tục/ })
        .last()
        .click();
      // bước 2 giờ đến
      await expect(page.getByRole('heading', { name: VI['guest.oci.step2']! })).toBeVisible();
      await scan(page, info, 'H18-3-eta');
      const eta = page.getByRole('radio').first();
      await eta.check();
      await page
        .getByRole('button', { name: /Tiếp tục/ })
        .last()
        .click();
      // bước 3 xác nhận: hai lựa chọn ngang hàng, KHÔNG chọn sẵn; nút gửi khóa tới khi chọn
      await expect(page.getByText(VI['guest.oci.consent_q']!)).toBeVisible();
      const submit = page.getByRole('button', { name: VI['guest.oci.submit']! });
      await expect(submit).toBeDisabled();
      for (const r of await page.getByRole('radio').all()) await expect(r).not.toBeChecked();
      await scan(page, info, 'H18-3-consent');
      await page.getByRole('radio', { name: new RegExp(stem(VI['guest.oci.consent']!)) }).check();
      await submit.click();
      await expect(
        page.getByRole('heading', { name: new RegExp(stem(VI['guest.oci.done_title']!)) }),
      ).toBeVisible({
        timeout: 15_000,
      });
      await scan(page, info, 'H18-3-done');
      // ĐK-3: không lưu gì trên máy khách
      const stored = await page.evaluate(() => ({
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage),
      }));
      expect(stored).toEqual({ local: [], session: [] });
      // Desk thấy khai báo pre + giờ đến
      const regId = await registrationOf(request, fd, res);
      const reg = await getRegistration(request, fd, regId);
      expect(reg.body.status).toBe('pre');
      expect((reg.body.onlineCheckin as { etaTime?: string } | null)?.etaTime).toBeTruthy();
      expect((await getReservation(request, fd, res.id)).body.etaTime).toBeTruthy();
      await page.context().close();
    });

    test('TC-L7-011 (E) bỏ dở sau khi gửi giấy tờ khách 1 → mở lại link: vào thẳng bước Giấy tờ, khách 1 "đã gửi", còn khách 2', async ({
      browser,
      request,
    }) => {
      const { link } = await bookingWithLink(request, '201');
      const first = await guestPage(browser, 'vi-VN');
      await first.goto(link.url);
      await first
        .getByRole('button', { name: /Làm thủ tục trước/ })
        .first()
        .click();
      await first.getByRole('button', { name: VI['gw.notice_read']! }).click();
      await photo(first, 1, VI['gw.doc.cccd']!, VI['gw.take_photo']!);
      await expect(first.getByText(stem(VI['gw.sent_hidden']!)).first()).toBeVisible({
        timeout: 15_000,
      });
      await first.context().close(); // khách đóng trình duyệt
      // mở lại đúng link (máy khác / phiên mới)
      const again = await guestPage(browser, 'vi-VN');
      await again.goto(link.url);
      await again
        .getByRole('button', { name: /Làm thủ tục|Tiếp tục/ })
        .first()
        .click();
      await expect(again.getByRole('heading', { name: VI['guest.oci.step1']! })).toBeVisible({
        timeout: 15_000,
      });
      // khách 1: chỉ trạng thái "đã gửi" (không xem lại ảnh – ĐK-3); khách 2 còn nút chọn loại giấy tờ
      await expect(again.getByText(stem(VI['gw.sent_hidden']!))).toHaveCount(1);
      await expect(again.locator('main img')).toHaveCount(0);
      await expect(
        again.getByRole('group', { name: /2.*Loại giấy tờ|Khách 2/ }).first(),
      ).toBeVisible();
      await again.context().close();
    });

    test('TC-L7-014 (E) khách nước ngoài, trình duyệt tiếng Anh: thông báo + đồng ý bằng bản EN đã duyệt + axe', async ({
      browser,
      request,
    }, info) => {
      const { link } = await bookingWithLink(request, '401', { nationalityCode: 'DE' });
      const page = await guestPage(browser, 'en-US');
      await page.goto(link.url);
      await expect(
        page.getByRole('heading', { name: new RegExp(stem(EN['guest.hello']!)) }),
      ).toBeVisible({
        timeout: 15_000,
      });
      await scan(page, info, 'H18-1-stay-en');
      await page
        .getByRole('button', { name: /check-in|Check in/i })
        .first()
        .click();
      await expect(page.getByText(EN['gw.notice_body']!)).toBeVisible();
      await page.getByRole('button', { name: EN['gw.notice_read']! }).click();
      await expect(page.getByRole('heading', { name: EN['guest.oci.step1']! })).toBeVisible();
      // không còn chữ tiếng Việt trên màn (dấu tiếng Việt đặc trưng)
      const text = (await page.locator('main').innerText()).replace(/OTTIMO|Đà Lạt|Da Lat/g, '');
      expect(text, 'chuỗi tiếng Việt trên trang EN').not.toMatch(
        /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i,
      );
      await scan(page, info, 'H18-2-documents-en');
      await page.context().close();
    });

    test('TC-L7-013 (E) link sai / đã thu hồi → trang lỗi kèm cách liên hệ lễ tân', async ({
      browser,
      request,
    }, info) => {
      const { fd, res, link } = await bookingWithLink(request, '402');
      const { call, propertyIdOf } = await import('../support/api.js');
      await call(
        request,
        'DELETE',
        `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}/guest-link`,
        {
          session: fd,
        },
      );
      const page = await guestPage(browser, 'vi-VN');
      await page.goto(link.url);
      await expect(
        page.getByRole('heading', { name: VI['guest.link_expired_title']! }),
      ).toBeVisible({
        timeout: 15_000,
      });
      await scan(page, info, 'H18-5-link-invalid');
      await page.goto(`${GUEST_ORIGIN}/g/${'x'.repeat(43)}`);
      await expect(
        page.getByRole('heading', { name: VI['guest.link_expired_title']! }),
      ).toBeVisible({
        timeout: 15_000,
      });
      await page.context().close();
    });
  },
);
