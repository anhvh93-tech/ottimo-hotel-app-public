// E2E UI – admin-web H16 Trả phòng 3 bước (minibar → phụ phí → bill & thu tiền) trên Chromium 1366×768, API thật,
// project desk-clock (MutableClock, tuần tự, sau project clock): nhận phòng ngày ảo D (API) → tua sang D+1 11:00 →
// lễ tân (máy quầy được cấp – thiết bị ảo, support/s3.ts useVirtualDevice) làm trả phòng trên giao diện.
// axe mỗi bước + hộp xác nhận: 0 critical/serious (ĐK-S2-4). TC-L4-040 (E), TC-L4-053 (E), TC-X-040 (H16).
import { expect, test } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { addDays, cleanupTracked, getReservation, room, s2Context, vnTime } from '../support/s2.js';
import {
  DEVICE_COOKIE,
  activeDeviceToken,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { scan } from '../ui/axe.js';
import { UI, signIn, t } from '../ui/helpers.js';

// Mỗi ca chạy trên ngày ảo riêng, độc lập: KHÔNG dùng mode 'serial' (một ca đỏ sẽ bỏ qua mọi ca sau và CI chạy
// lại cả file). Thứ tự tuần tự đã do project clock/desk-clock bảo đảm (workers 1, fullyParallel false).
test.describe.configure({ mode: 'default' });
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'UI H16 – Trả phòng 3 bước (MutableClock)',
  { tag: ['@ui', '@sprint3', '@clock'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L4-053 (E) + TC-L4-040 (E) H16: minibar dùng 2 bia → phụ phí đúng giờ → thu tiền mặt → hoàn tất; axe 3 bước', async ({
      page,
      request,
    }, info) => {
      test.slow();
      needClock('TC-L4-053 (E)');
      const D = virtualDay(await stackToday(request), 3);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
      cleanRooms();
      const c = await s2Context(request);
      const st = await inHouse(request, c, await session(request, 'qa.fd'), {
        room: room(c, '203'),
        alternatives: c.rooms, // stack dùng lại: ngày ảo trùng lượt trước → căn khác
        arrival: D,
        nights: 1,
      });
      // ngày đi D+1 11:00 – trước giờ trả chuẩn, không phụ thu trả muộn
      const departure = addDays(D, 1);
      await setClock(request, vnTime(departure, '11:00'));
      const fd = await session(request, 'qa.fd');
      await page.context().addCookies([
        {
          name: DEVICE_COOKIE,
          value: activeDeviceToken()!,
          url: WEB_URL,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-out`);
      // bước 1 minibar: bảng chuẩn của căn, nút +/− không vượt 0…chuẩn (BR-702)
      const minibar = page.getByRole('table', { name: t('checkout.step.minibar') });
      await expect(minibar).toBeVisible({ timeout: 15_000 });
      const beer = minibar.getByRole('row', { name: /Bia/ }).first();
      await expect(beer.getByRole('button', { name: t('rooms.inc') })).toBeDisabled();
      await scan(page, info, 'H16-1-minibar');
      await beer.getByRole('button', { name: t('rooms.dec') }).click();
      await beer.getByRole('button', { name: t('rooms.dec') }).click();
      const beerPrice = Number(
        ((await beer.getByRole('rowheader').innerText()).match(/([\d.]+)\s*$/)?.[1] ?? '0').replace(
          /\./g,
          '',
        ),
      );
      expect(beerPrice, 'giá bia DS-E').toBeGreaterThan(0);
      await expect(
        page.getByText(new RegExp(`${(2 * beerPrice).toLocaleString('vi-VN')}`)).first(),
      ).toBeVisible();
      await page.getByRole('button', { name: t('co.go_extras') }).click();
      // bước 2 phụ phí: giờ trả thực tế mặc định, 11:00 trước giờ chuẩn → không phụ thu
      await expect(page.getByText(t('checkout.departure_time')).first()).toBeVisible({
        timeout: 10_000,
      });
      await scan(page, info, 'H16-2-extras');
      await page.getByRole('button', { name: t('co.go_bill') }).click();
      // bước 3 bill & thu tiền: còn phải thu = 2 bia (tiền phòng đã thu khi nhận phòng)
      await expect(page.getByText(t('bill.total')).first()).toBeVisible({ timeout: 10_000 });
      await scan(page, info, 'H16-3-bill');
      const due = 2 * beerPrice;
      const f0 = await getFolio(request, fd, st.res.folioId!);
      expect(
        liveLines(f0, 'minibar').reduce((s, l) => s + l.amountVnd, 0),
        'dòng minibar',
      ).toBe(due);
      expect(f0.totals.balanceDueVnd).toBe(due);
      await page
        .getByRole('button', { name: t('pay.cash') })
        .first()
        .click();
      const record = page.getByRole('button', { name: new RegExp(stem('pay.record')) }).first();
      if (await record.isVisible().catch(() => false)) {
        const cashIn = page.getByLabel(t('co.cash_received')).first();
        if (await cashIn.isVisible().catch(() => false)) await cashIn.fill(String(due));
        await record.click();
        await expect
          .poll(async () => (await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd, {
            timeout: 10_000,
          })
          .toBe(0);
      }
      const complete = page.getByRole('button', { name: /hoàn tất/i }).last();
      await complete.click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await scan(page, info, 'H16-confirm');
      await dialog
        .getByRole('button', { name: /hoàn tất|Trả phòng/i })
        .last()
        .click();
      await expect(page.getByText(new RegExp(stem('checkout.done'))).first()).toBeVisible({
        timeout: 15_000,
      });
      // API: checked_out, folio settled + số bill F{yy}-nnnnnn (BR-007), minibar = 2 bia
      const after = await getReservation(request, fd, st.res.id);
      expect(after.body.status).toBe('checked_out');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.status).toBe('settled');
      expect(f.billNo).toMatch(/^F\d{2}-\d{6,}$/);
      expect(f.totals.balanceDueVnd).toBe(0);
    });
  },
);

function stem(key: string): string {
  return t(key).split('{')[0]!.trim();
}
