// E2E a11y – axe-core on admin-web H01–H12 (project desk-chromium, 1366×768, web + API thật).
// Ngưỡng (QC Sprint 2, ĐK-S2-4): 0 vi phạm mức critical/serious theo WCAG 2.1 A/AA. Vi phạm moderate/minor
// được ghi vào annotation + file đính kèm (không làm đỏ) để FE/UXD xử lý dần.
// TC: TC-X-040 (E – axe trên màn L1–L2, sáng/tối), TC-NT-026 (phần axe của hộp thoại). Màn H01–H12 theo
// design/hifi/index.html. Không thay được kiểm tay VoiceOver/zoom 200 % (phần M của TC-X-040, TC-NT-026).
import { expect, test } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import { bookFree, cleanupTracked, room, s2Context } from '../support/s2.js';
import { go, scan } from './axe.js';
import { UI, hasLoginForm, signIn, t } from './helpers.js';

test.describe('a11y axe – admin-web H01–H12', { tag: ['@ui', '@a11y'] }, () => {
  test.skip(!UI, 'Chạy với E2E_UI=1');
  test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

  test.afterEach(async ({ request }) => cleanupTracked(request));

  test('TC-X-040 H01 Đăng nhập (chưa đăng nhập)', async ({ page }, info) => {
    test.skip(!(await hasLoginForm(page)), 'Chưa có form đăng nhập');
    await scan(page, info, 'H01-login');
  });

  test('TC-X-040 H02 + H03 khung điều hướng theo vai + Hôm nay (qa.fd)', async ({ page }, info) => {
    await signIn(page, 'qa.fd');
    await go(page, '/today');
    await scan(page, info, 'H02-H03-today');
  });

  test('TC-X-040 H04 Danh mục căn + H05 Tham số quy tắc (qa.owner)', async ({ page }, info) => {
    await signIn(page, 'qa.owner');
    await go(page, '/settings/rooms');
    await scan(page, info, 'H04-rooms');
    await go(page, '/settings/parameters');
    await scan(page, info, 'H05-params');
  });

  test('TC-X-040 H06 Khách hàng + form hồ sơ khách (qa.fd)', async ({ page }, info) => {
    await signIn(page, 'qa.fd');
    await go(page, '/guests');
    await scan(page, info, 'H06-guests');
    const add = page.getByRole('button', { name: /Thêm khách|Khách mới|Tạo hồ sơ/ }).first();
    if (await add.isVisible().catch(() => false)) {
      await add.click();
      await page.getByRole('dialog').first().waitFor();
      await scan(page, info, 'H06-guest-form');
    } else info.annotations.push({ type: 'note', description: 'H06: không thấy nút tạo hồ sơ' });
  });

  test('TC-X-040 H07 Người dùng & vai + Thiết bị (qa.owner)', async ({ page }, info) => {
    await signIn(page, 'qa.owner');
    await go(page, '/settings/users');
    await scan(page, info, 'H07-users');
    await go(page, '/settings/devices');
    await scan(page, info, 'H07-devices');
  });

  test('TC-X-040 H08 Sơ đồ phòng + H09 Đặt phòng mới + H10 Đơn dài hạn nhập tay (qa.fd)', async ({
    page,
  }, info) => {
    await signIn(page, 'qa.fd');
    await go(page, '/rack');
    await page.getByRole('grid').first().waitFor();
    await scan(page, info, 'H08-rack');
    await page
      .getByRole('button', { name: t('booking.new.title') })
      .first()
      .click();
    await page.getByRole('dialog', { name: t('booking.new.title') }).waitFor();
    await scan(page, info, 'H09-booking');
    await page.keyboard.press('Escape');
    await page
      .getByRole('dialog')
      .first()
      .waitFor({ state: 'hidden' })
      .catch(() => undefined);
    const longStay = page.getByRole('button', { name: /Đơn dài hạn nhập tay/ }).first();
    await longStay.click();
    await page.getByRole('dialog').first().waitFor();
    await scan(page, info, 'H10-long-stay-manual');
  });

  test('TC-X-040 giao diện tối: H03 + H08 + H09 (qa.fd)', async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await signIn(page, 'qa.fd');
    await go(page, '/today');
    await scan(page, info, 'H03-today-dark');
    await go(page, '/rack');
    await page.getByRole('grid').first().waitFor();
    await scan(page, info, 'H08-rack-dark');
    await page
      .getByRole('button', { name: t('booking.new.title') })
      .first()
      .click();
    await page.getByRole('dialog', { name: t('booking.new.title') }).waitFor();
    await scan(page, info, 'H09-booking-dark');
  });

  test('TC-X-040 H11 Chi tiết đơn (drawer, qa.fd)', async ({ page, request }, info) => {
    const fd = await session(request, 'qa.fd');
    const c = await s2Context(request);
    const res = await bookFree(request, fd, c, {
      room: room(c, '102'),
      nights: 2,
      today: await stackToday(request),
    });
    await signIn(page, 'qa.fd');
    await go(page, `/reservations/${res.id}`);
    await expect(page.getByText(res.code).first()).toBeVisible({ timeout: 10_000 });
    await scan(page, info, 'H11-reservation');
  });

  test('TC-X-040 H12 Báo giá & giữ chỗ (qa.sal)', async ({ page }, info) => {
    await signIn(page, 'qa.sal');
    await go(page, '/quotes');
    await scan(page, info, 'H12-quotes');
    // H12 luồng sale: tìm căn trống (mặc định khoảng ngày của form) → "Báo giá" trên một căn → hộp báo giá
    await page
      .getByRole('main')
      .getByRole('button', { name: t('shell.search_label'), exact: true })
      .click();
    const add = page.getByRole('button', { name: t('sale.quote_title') }).first();
    if (await add.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await scan(page, info, 'H12-availability');
      await add.click();
      await page.getByRole('dialog').first().waitFor();
      await scan(page, info, 'H12-quote-form');
    } else
      info.annotations.push({
        type: 'note',
        description: 'H12: không có căn trống/nút Báo giá cho khoảng ngày mặc định',
      });
  });
});
