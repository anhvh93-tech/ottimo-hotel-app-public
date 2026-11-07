// E2E UI – v1.0.5 V5-15 "Trả phòng quá ngày đi" trên H16 (Chromium 1366×768, API thật, project desk-clock – MutableClock,
// tuần tự). Nhận phòng ngày ảo D, ngày đi D+1, không ai bấm Trả phòng → tua sang D+2 09:00 (ngày nghiệp vụ D+2, quá 1 đêm):
// - lễ tân (FD): màn Trả phòng chỉ nói "cần quản lý hoặc chủ đầu tư", không có bước nào, không ghi gì (DOM 15.7);
// - quản lý (MGR, ≤ 1 đêm – BR-433 / ESC-007 A): hộp quá ngày đi, giờ chuẩn 12:00 của ngày đi (DOM 15.3), lý do gợi ý
//   → Hoàn tất → API: checked_out, `actualCheckoutAt` = D+1 12:00 (giờ khách rời, không phải lúc bấm).
// Hợp đồng 0.3.13 bổ sung 1 (1.4, 1.18), BE #99. axe bước 2 + hộp xác nhận: 0 critical/serious (ĐK-S2-4).
import { expect, test } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { addDays, cleanupTracked, getReservation, room, s2Context, vnTime } from '../support/s2.js';
import { checkoutSummary } from '../support/s3-stay.js';
import { cleanRooms, getFolio, inHouse, useVirtualDevice, virtualDay } from '../support/s3.js';
import { scan } from '../ui/axe.js';
import { desk, openCheckOut } from '../ui/flows.js';
import { UI, stem, t } from '../ui/helpers.js';

test.describe.configure({ mode: 'default' });
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'UI H16 – Trả phòng quá ngày đi (V5-15, MutableClock)',
  { tag: ['@ui', '@r5', '@clock'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('V5-15 (T15-x DOM 7.1): quá 1 đêm – FD được chỉ gọi quản lý, MGR ghi giờ 12:00 của ngày đi + lý do → checked_out', async ({
      browser,
      request,
    }, info) => {
      test.slow();
      needClock('V5-15 overdue');
      const D = virtualDay(await stackToday(request), 4);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
      cleanRooms();
      const c = await s2Context(request);
      const st = await inHouse(request, c, await session(request, 'qa.fd'), {
        room: room(c, '203'),
        alternatives: c.rooms,
        arrival: D,
        nights: 1,
      });
      const departure = addDays(D, 1);
      // D+2 09:00: ngày nghiệp vụ D+2 – quá ngày đi 1 đêm (đêm D+1 chưa ai thu)
      const now = vnTime(addDays(D, 2), '09:00');
      await setClock(request, now);

      // API: máy chủ nói quá ngày đi và số đêm; chỉ MGR được mời B18 (allowedActions overdue)
      const fd = await session(request, 'qa.fd');
      const mgr = await session(request, 'qa.mgr');
      const sum = await checkoutSummary(request, fd, st.res.id);
      expect(sum.status, JSON.stringify(sum.body).slice(0, 300)).toBe(200);
      // 0.3.13 bổ sung 1 – fields not in support/s3-stay.ts' CheckoutSummary yet
      const v515 = sum.body as {
        overdue?: boolean;
        nightsNotBilled?: number;
        checkoutTimeNoteRequired?: boolean;
      };
      expect(v515.overdue).toBe(true);
      expect(v515.nightsNotBilled).toBe(1);
      expect(v515.checkoutTimeNoteRequired).toBe(false);
      const asFd = await getReservation(request, fd, st.res.id);
      expect(asFd.body.allowedActions?.some((a) => a.event === 'check_out')).toBe(false);
      const asMgr = await getReservation(request, mgr, st.res.id);
      expect(
        (asMgr.body.allowedActions?.find((a) => a.event === 'check_out') as { overdue?: boolean })
          ?.overdue,
        'MGR ≤ 1 đêm',
      ).toBe(true);

      // FD: chỉ dẫn, không bước nào
      const fdPage = await desk(browser, 'qa.fd', now);
      await fdPage.goto(`${WEB_URL}/reservations/${st.res.id}/check-out`);
      await expect(fdPage.getByText(t('checkout.overdue_need_manager'))).toBeVisible({
        timeout: 15_000,
      });
      await expect(fdPage.getByRole('button', { name: t('co.go_extras') })).toHaveCount(0);
      await fdPage.context().close();

      // MGR: hộp quá ngày đi
      const page = await desk(browser, 'qa.mgr', now);
      await openCheckOut(page, st.res.id);
      await expect(page.getByText(t('checkout.overdue_title')).first()).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('button', { name: t('co.go_extras') }).click();
      const time = page.getByLabel(new RegExp(t('checkout.departure_time')));
      await expect(time).toHaveValue('12:00', { timeout: 10_000 });
      await expect(page.getByText(t('checkout.overdue_reason_help'))).toBeVisible();
      await page.getByRole('button', { name: t('checkout.overdue_reason.no_notice') }).click();
      await expect(
        page.getByLabel(new RegExp(`^${t('checkout.overdue_reason_label')}`)),
      ).toHaveValue(t('checkout.overdue_reason.no_notice'));
      await scan(page, info, 'H16-2-overdue');
      await page.getByRole('button', { name: t('co.go_bill') }).click();
      await expect(page.getByText(t('bill.total')).first()).toBeVisible({ timeout: 10_000 });
      const f0 = await getFolio(request, mgr, st.res.folioId!);
      if ((f0.totals.balanceDueVnd ?? 0) > 0) {
        await page
          .getByRole('button', { name: t('pay.cash') })
          .first()
          .click();
        await page
          .getByRole('button', { name: new RegExp(stem('pay.record')) })
          .first()
          .click();
        await expect
          .poll(async () => (await getFolio(request, mgr, st.res.folioId!)).totals.balanceDueVnd, {
            timeout: 10_000,
          })
          .toBe(0);
      }
      await page
        .getByRole('button', { name: /hoàn tất/i })
        .last()
        .click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(new RegExp(stem('checkout.overdue_effect')))).toBeVisible();
      await scan(page, info, 'H16-overdue-confirm');
      await dialog
        .getByRole('button', { name: /hoàn tất/i })
        .last()
        .click();
      await expect(page.getByText(new RegExp(stem('checkout.done'))).first()).toBeVisible({
        timeout: 15_000,
      });
      const after = await getReservation(request, mgr, st.res.id);
      expect(after.body.status).toBe('checked_out');
      // DOM 15.4 ý 1: giờ khách rời (ngày đi 12:00), không phải lúc bấm
      expect(Date.parse(String(after.body.actualCheckoutAt))).toBe(
        Date.parse(vnTime(departure, '12:00')),
      );
      await page.context().close();
    });
  },
);
