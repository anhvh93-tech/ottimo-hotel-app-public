// E2E UI – V5-58 Desk Wi-Fi (BUG-R3-021 phần Desk, OpenAPI 0.3.13 `getPropertyWifi` / `setPropertyWifi`, S36).
// T58-10 (SEC ARC-04, hợp đồng 1.23): hộp "Nhập tên mạng và mật khẩu Wi-Fi" mở ra với hai ô TRỐNG, ô chữ thường
// (không `type="password"`), `autocomplete="off"` ở form và cả hai ô, tên/id ô không có user/login/pass/email –
// trình duyệt không có chỗ để tự điền mật khẩu đăng nhập Desk. Bước xem lại: mật khẩu rỗng ghi "Mạng mở, không có
// mật khẩu" (DOM FB-R5-DOM-UXD-120-03 ý 1). FDL/FD chỉ đọc (không có nút sửa).
//
// Không ghi gì lên stack dùng chung: ca này dừng ở bước xem lại rồi bỏ (không bấm "Lưu Wi-Fi"); phần lưu, 422 và
// nhật ký nằm ở Vitest (`v5-58-wifi-fe2.test.tsx`, mock theo PR #120). Kiểm tay trên staging (QA): Chrome/Safari có
// mật khẩu Desk đã lưu không gợi ý điền vào hai ô này. Giá trị gõ là giá trị thử, không phải mạng thật.
// Máy chủ Wi-Fi ở PR #120 ("gộp sau #120"). Tới khi stack đang test có `getPropertyWifi`, lệnh GET đó được
// `page.route` trả đúng dạng hợp đồng "chưa nhập" (`{ configured: false }`, như cách V5-46 làm) – CI không cho ca UI
// skip. Mọi lệnh khác (đăng nhập, quyền S36, nhật ký `listAuditEvents`) chạy với stack thật; có endpoint thì không
// chặn gì. axe: 0 critical/serious trên trang và bước xem lại. Project desk-chromium (testMatch ui/).
import { expect, test, type Page } from '@playwright/test';
import { isAvailable } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import { go, scan } from './axe.js';
import { UI, signIn, t } from './helpers.js';

const PATH = '/settings/wifi';
const NETWORK = 'OTTIMO E2E Test';
const PHRASE = 'test-wifi-0000';
const WIFI = /\/v1\/properties\/[^/]+\/wifi$/;

/** Contract shape of `getPropertyWifi` before anything is entered – only while the stack lacks the endpoint. */
async function stubWifiUntilServer(page: Page): Promise<void> {
  if (await isAvailable(page.context().request, 'GET', '/v1/properties/{propertyId}/wifi')) return;
  await page.route(WIFI, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'cache-control': 'no-store' },
          body: JSON.stringify({ configured: false }),
        })
      : route.continue(),
  );
}

test.describe('V5-58 Desk Wi-Fi (S36)', { tag: ['@ui', '@r5'] }, () => {
  test.skip(!UI, 'Chạy với E2E_UI=1');
  test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

  test.beforeEach(async ({ page }) => {
    await stubWifiUntilServer(page);
  });

  test('T58-10 OWN: hai ô trống, không tự điền, bước xem lại mạng mở – không lưu', async ({
    page,
  }, info) => {
    await signIn(page, 'qa.owner');
    await page
      .getByRole('link', { name: t('nav.wifi') })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: t('wifi.current_title') })).toBeVisible();
    await scan(page, info, 'S36-wifi');

    const open = page.getByRole('button', {
      name: new RegExp(`^(${t('wifi.edit')}|${t('wifi.enter')})$`),
    });
    await open.click();
    const dialog = page.getByRole('dialog', { name: t('wifi.form_title') });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[type="password"]')).toHaveCount(0);
    await expect(dialog.locator('form')).toHaveAttribute('autocomplete', 'off');

    const ssid = dialog.getByLabel(new RegExp(`^${t('wifi.ssid')}`));
    const phrase = dialog.getByLabel(new RegExp(`^${t('wifi.password')}`));
    // Give a password manager the chance to fill (it acts after load / focus) before reading the boxes.
    await ssid.focus();
    await page.waitForTimeout(500);
    for (const box of [ssid, phrase]) {
      await expect(box).toHaveValue('');
      await expect(box).toHaveAttribute('type', 'text');
      await expect(box).toHaveAttribute('autocomplete', 'off');
      const name = (await box.getAttribute('name')) ?? '';
      const id = (await box.getAttribute('id')) ?? '';
      expect(`${name} ${id}`).not.toMatch(/user|login|pass|email/i);
    }

    // Open network: the review step says it in words, with the router note.
    await ssid.fill(NETWORK);
    await dialog.getByRole('button', { name: t('wifi.review') }).click();
    const review = page.getByRole('dialog', { name: t('wifi.review_title') });
    await expect(review.getByText(NETWORK, { exact: true })).toBeVisible();
    await expect(review.getByText(t('wifi.open_network'), { exact: true })).toBeVisible();
    await expect(review.getByText(t('wifi.review_open_note'), { exact: true })).toBeVisible();
    await scan(page, info, 'S36-wifi-review');

    // With a password: shown as typed (spaces kept), no open-network note.
    await review.getByRole('button', { name: t('common.edit_back') }).click();
    await phrase.fill(PHRASE);
    await dialog.getByRole('button', { name: t('wifi.review') }).click();
    await expect(review.getByText(PHRASE, { exact: true })).toBeVisible();
    await expect(review.getByText(t('wifi.review_open_note'), { exact: true })).toHaveCount(0);

    // Leave without saving (shared stack): × → "Bỏ các thay đổi chưa lưu?" → discard.
    await review.getByRole('button', { name: t('common.close') }).click();
    await page.getByRole('button', { name: t('common.unsaved_discard') }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('T58-10 FD: đọc được, không có nút sửa, không có nhật ký', async ({ page }) => {
    await signIn(page, 'qa.fd');
    await go(page, PATH);
    await expect(page.getByRole('heading', { name: t('wifi.current_title') })).toBeVisible();
    await expect(
      page.getByRole('button', { name: new RegExp(`^(${t('wifi.edit')}|${t('wifi.enter')})$`) }),
    ).toHaveCount(0);
    await expect(page.getByText(t('wifi.read_help'), { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: t('wifi.log_title') })).toHaveCount(0);
  });
});
