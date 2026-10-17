// E2E UI Sprint 4 – S4-28 VietQR cọc H12/H11 BẤM THẬT tới API thật (QC-S3-09; sprint-4-plan mục 4 bước 1).
// Viết bởi FE-A (17/10) trong ui/desk-writes.s4.spec.ts; QA chuyển sang project desk-clock (17/10): VietQR cần tài khoản
// nhận (US-120 AC2) mà tham số này chỉ được đặt cho NGÀY ẢO – trên ngày thật TC-L4-065 kiểm "chưa cấu hình" song song.
//   - S4-28 / TC-L5-025 (a) (US-084 AC4, US-120; BUG-R2-062): H12 giữ chỗ → mã VietQR cọc vẽ ngay, số = cọc BR-305
//     (oracle BR-305-01: 202, 7 đêm thứ Hai → 5.205.000 → cọc 1.600.000), nội dung chuyển khoản = mã đơn;
//     H11 "Xác nhận cọc": xác nhận chính giao dịch QR đã gửi khách (confirmPaymentReceived → confirmDeposit
//     existingPaymentId), không ghi khoản thứ hai.
import { expect, test } from '@playwright/test';
import { call, propertyIdOf, session, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  newGuest,
  oracleNum,
  quoteInput,
  room,
  s2Context,
  saveQuote,
  track,
  vnTime,
  weekday,
} from '../support/s2.js';
import { getFolio, useVirtualDevice, virtualDay } from '../support/s3.js';
import { ensureReceivingAccount } from '../support/s3-stay.js';
import { UI, signIn, t } from '../ui/helpers.js';
import { recordWrites, trustedDesk, vnd, waitWrite } from '../ui/write-steps.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

let realToday = '';
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'UI Sprint 4 – FE-A bước ghi tiền bấm thật: VietQR cọc H12/H11 (S4-28)',
  { tag: ['@ui', '@sprint4', '@clock', '@write'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('S4-28 / TC-L5-025 (a) US-084/AC4: giữ chỗ → VietQR cọc BR-305 nội dung = mã đơn; H11 xác nhận đúng giao dịch QR', async ({
      page,
      request,
    }) => {
      test.slow();
      needClock('TC-L5-025 (a)');
      // Ngày ảo riêng D (giữ D…D+16): tài khoản nhận VietQR chỉ đặt cho ngày ảo – ngày thật phải giữ "chưa cấu hình"
      // cho TC-L4-065 (PAYMENT_NOT_CONFIGURED) ở project api chạy song song (QA rà 17/10).
      const D = virtualDay(realToday, 14);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '09:00')));
      await ensureReceivingAccount(request, D);
      await page.clock.setFixedTime(new Date(vnTime(D, '09:00')));
      const sal = await session(request, 'qa.sal');
      const c = await s2Context(request);
      const rm = room(c, '202');
      // Oracle BR-107-01 / BR-305-01: 202, 7 đêm bắt đầu thứ Hai (có T6, T7) → 5.205.000 → cọc 1.600.000.
      // Thứ Hai đầu tiên sau D nằm trong khoảng ngày ảo đã giữ (D là thứ Hai–thứ Tư).
      let arrival = addDays(D, 1);
      while (weekday(arrival) !== 1) arrival = addDays(arrival, 1);
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival, nights: 7 }),
        guestId: await newGuest(request, sal),
      });
      expect(q.status, `saveQuote: ${JSON.stringify(q.body)}`).toBe(201);
      const deposit = oracleNum('BR-305-01', 'depositVnd');
      expect(q.body.depositVnd, 'cọc của báo giá theo BR-305-01').toBe(deposit);

      // ── H12 (sale): mở báo giá → Khách đồng ý → Tạo giữ chỗ (bấm thật) ──
      await signIn(page, 'qa.sal');
      const holds = recordWrites(page, 'POST', /\/quotes\/[^/]+\/actions\/create-hold$/);
      const qrs = recordWrites(page, 'POST', /\/folios\/[^/]+\/vietqr$/);
      await page.goto(`${WEB_URL}/quotes`);
      await page.getByRole('tab', { name: t('nav.my_quotes') }).click();
      await page.getByRole('button', { name: q.body.code as string, exact: true }).click();
      const send = page.getByRole('dialog', { name: new RegExp(q.body.code as string) });
      await send.getByRole('button', { name: t('sale.to_hold') }).click();
      const hold = page.getByRole('dialog', { name: t('sale.hold_title') });
      await expect(hold.getByText(t('sale.qr_after'))).toBeVisible();
      await hold.getByRole('button', { name: t('sale.create_hold'), exact: true }).click();
      const created = await waitWrite(holds, 'createHoldFromQuote', 201);
      const res = JSON.parse(created.body) as { id: string; code: string; folioId: string };
      track('reservation', res.id);
      // createVietQr do màn gửi ngay sau giữ chỗ: purpose=deposit, số = cọc BR-305 (không gõ tay – SEC F1)
      const qr = await waitWrite(qrs, 'createVietQr purpose=deposit', 201);
      expect(qr.request).toMatchObject({ purpose: 'deposit', amountVnd: deposit });
      const ref = res.code.replace(/-/g, '');
      const qrBody = JSON.parse(qr.body) as { transferContent: string; payment: { id: string } };
      expect(qrBody.transferContent, 'nội dung chuyển khoản = mã đơn bỏ gạch (BR-521)').toBe(ref);
      await expect(
        hold.getByRole('img', {
          name: tf('pay.qr_label', { amount: `${vnd(deposit)} đ`, ref }),
        }),
      ).toBeVisible();

      // ── H11 (lễ tân): Xác nhận cọc → xác nhận chính giao dịch QR, B4 bằng existingPaymentId ──
      const fdPage = await page.context().browser()!.newPage();
      await fdPage.clock.setFixedTime(new Date(vnTime(D, '09:30')));
      await trustedDesk(fdPage);
      await signIn(fdPage, 'qa.fd');
      const received = recordWrites(
        fdPage,
        'POST',
        /\/payments\/[^/]+\/actions\/confirm-received$/,
      );
      const b4 = recordWrites(fdPage, 'POST', /\/reservations\/[^/]+\/actions\/confirm-deposit$/);
      await fdPage.goto(`${WEB_URL}/reservations/${res.id}`);
      await fdPage
        .getByRole('button', { name: t('rsv.deposit_submit') })
        .first()
        .click();
      const dlg = fdPage.getByRole('dialog', { name: tf('rsv.deposit_title', { code: res.code }) });
      await expect(dlg.getByText(/chờ khách chuyển/)).toBeVisible({ timeout: 15_000 });
      await dlg.getByRole('button', { name: t('rsv.deposit_submit') }).click();
      const conf = await waitWrite(received, 'confirmPaymentReceived (giao dịch QR cọc)', 200);
      expect(conf.path).toContain(qrBody.payment.id);
      const dep = await waitWrite(b4, 'confirmDeposit existingPaymentId', 200);
      expect(dep.request).toEqual({ existingPaymentId: qrBody.payment.id });

      const fd = await session(request, 'qa.fd');
      const r = await call<{ status: string; depositPaidVnd: number }>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}`,
        { session: fd },
      );
      expect(r.body.status).toBe('confirmed');
      expect(r.body.depositPaidVnd).toBe(deposit);
      const folio = await getFolio(request, fd, res.folioId);
      const pays = (folio.payments ?? []).filter((p) => p.status === 'succeeded');
      expect(pays, 'một khoản cọc duy nhất – chính giao dịch QR').toHaveLength(1);
      expect(pays[0]).toMatchObject({ id: qrBody.payment.id, method: 'vietqr', type: 'deposit' });
    });
  },
);
