// E2E UI – kiểm lại bản sửa FE Sprint 3 của các lỗi Open từ Sprint 2 (project desk-chromium, web + API thật):
//   BUG-R2-026 (P2, ĐK-S2-3): 503 SERVICE_UNAVAILABLE khi lưu → câu riêng + tự thử lại theo Retry-After (DS 6.21),
//              không "Máy chủ đang gặp sự cố"; dữ liệu form giữ nguyên, lần thử lại thành công. 503 được tạo bằng cách
//              chặn đúng 1 lần POST …/reservations ở trình duyệt (page.route) – máy chủ thật xử lý lần thử lại.
//   BUG-R2-028 (P3): tạo nhanh khách có SĐT trong form Đặt phòng mới → form không hỏi lại SĐT, không PATCH hồ sơ.
//   BUG-R2-029 (P3): Sơ đồ phòng không hiện "Đang kết nối lại…" khi luồng SSE chưa từng rớt.
import { expect, test } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import { cleanupTracked, freeWindow, room, s2Context, track } from '../support/s2.js';
import { UI, fakePhone, lettersOnly, openRack, signIn, stem, t } from './helpers.js';

test.describe(
  'UI – kiểm lại BUG-R2-026/028/029 (FE Sprint 3)',
  { tag: ['@ui', '@sprint3', '@retest'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('BUG-R2-026 + BUG-R2-028 (TC-L2-021 E biến thể 503) Đặt phòng mới: 503 → tự thử lại, đơn tạo; khách tạo nhanh không bị hỏi lại SĐT', async ({
      page,
      request,
    }) => {
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const { arrival, departure } = await freeWindow(request, fd, room(c, '202'), 2, {
        today: await stackToday(request),
        dow: 2,
      });
      await signIn(page, 'qa.fd');
      test.skip(!(await openRack(page)), 'Chưa có màn Sơ đồ phòng trên admin-web');
      const writes: string[] = [];
      page.on('request', (r) => {
        if (r.method() !== 'GET' && /\/v1\/properties\//.test(r.url()))
          writes.push(`${r.method()} ${new URL(r.url()).pathname.split('/').slice(4).join('/')}`);
      });
      page.on('response', (r) => {
        if (
          r.request().method() === 'POST' &&
          /\/reservations$/.test(r.url()) &&
          r.status() === 201
        )
          void r
            .json()
            .then((j: { id?: string }) => j.id && track('reservation', j.id))
            .catch(() => undefined);
      });
      // form Đặt phòng mới + tạo nhanh khách có SĐT
      await page
        .getByRole('button', { name: t('booking.new.title') })
        .first()
        .click();
      const d = page.getByRole('dialog', { name: t('booking.new.title') });
      await d.getByRole('textbox', { name: 'Ngày đến' }).fill(arrival);
      await d.getByRole('textbox', { name: 'Ngày đi' }).fill(departure);
      const roomSel = d.getByRole('combobox', { name: t('booking.field.room'), exact: true });
      const label = (await roomSel.locator('option').allTextContents()).find((o) =>
        o.startsWith('202 '),
      );
      expect(label, 'căn 202 trống').toBeTruthy();
      await roomSel.selectOption({ label: label! });
      const guestName = `Khach Etoe ${lettersOnly()}`;
      await d.getByRole('combobox', { name: t('booking.field.guest') }).fill(guestName);
      await page.getByRole('option', { name: /Tạo nhanh/ }).click();
      const g = page.getByRole('dialog', { name: 'Hồ sơ khách mới' });
      await g.getByRole('textbox', { name: 'Số điện thoại / Zalo' }).fill(fakePhone());
      await g.getByRole('button', { name: 'Lưu hồ sơ' }).click();
      await expect(g).toBeHidden();
      // BUG-R2-028: khách vừa tạo đã có SĐT → form không hiện lại ô SĐT bắt buộc
      await expect(d.getByRole('textbox', { name: t('booking.field.phone') })).toBeHidden();

      // BUG-R2-026: lần POST đầu → 503 SERVICE_UNAVAILABLE + Retry-After: 2; lần sau đi tới máy chủ thật
      let blocked = 0;
      await page.route(/\/v1\/properties\/[^/]+\/reservations$/, async (route) => {
        if (route.request().method() === 'POST' && blocked === 0) {
          blocked++;
          await route.fulfill({
            status: 503,
            headers: { 'content-type': 'application/problem+json', 'retry-after': '2' },
            body: JSON.stringify({
              type: '/problems/service-unavailable',
              title: 'Service unavailable',
              status: 503,
              code: 'SERVICE_UNAVAILABLE',
              requestId: 'e2e-503',
            }),
          });
          return;
        }
        await route.continue();
      });
      await d.getByRole('button', { name: t('booking.create'), exact: true }).click();
      // câu riêng của 503 / đếm ngược thử lại – không phải error.server
      await expect(
        page
          .getByText(stem('error.SERVICE_UNAVAILABLE'))
          .or(page.getByText(stem('retry.countdown')))
          .first(),
      ).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(stem('error.server'))).toHaveCount(0);
      // form giữ nguyên trong lúc chờ
      await expect(d.getByRole('combobox', { name: t('booking.field.guest') })).toHaveValue(
        guestName,
      );
      // tự gửi lại → đơn được tạo
      await expect(page.getByText(stem('booking.toast.created')).first()).toBeVisible({
        timeout: 15_000,
      });
      expect(blocked).toBe(1);
      // BUG-R2-028: không có PATCH hồ sơ khách sau khi tạo nhanh
      expect(
        writes.filter((w) => /^PATCH guests\//.test(w)),
        writes.join(', '),
      ).toEqual([]);
    });

    test('BUG-R2-029 Sơ đồ phòng không báo "Đang kết nối lại…" khi luồng chưa rớt', async ({
      page,
    }) => {
      await signIn(page, 'qa.fd');
      test.skip(!(await openRack(page)), 'Chưa có màn Sơ đồ phòng trên admin-web');
      await page.waitForTimeout(5_000);
      await expect(page.getByText(/Đang kết nối lại/)).toHaveCount(0);
    });
  },
);
