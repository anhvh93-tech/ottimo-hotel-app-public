// E2E UI – V5-48 Desk (OpenAPI 0.3.13 add. 1, SEC B002-01; UXD copy-v1.0.5 9.1a; Desk part of FB-R5-SEC-QA-B002-06 (h4)).
// Xác nhận cọc is open on a hold; the hold is cancelled meanwhile (another tab, B5). The front desk then presses
// "Tạo VietQR". The server (#105) answers 409 INVALID_TRANSITION + `reservationStatus` after 403/404 and before every
// other check, PAYMENT_NOT_CONFIGURED included, so the stack needs no receiving account. The box shows the 9.1a
// sentence with "Đã hủy" – never the "reload" sentence, never "Try again" – and locks its main button; no QR is
// made (read back by API). axe on that state: 0 critical/serious.
// Project desk-chromium (testMatch ui/), real clock. Data by API (hold from a quote, cancel); the step under test is
// clicked in the browser. Written by FE-3 (07/11), for QA to take into the v1.0.5 run.
import { expect, test } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import {
  action,
  cleanupTracked,
  freeWindow,
  getReservation,
  makeHold,
  s2Context,
} from '../support/s2.js';
import { getFolio } from '../support/s3.js';
import { go, scan } from './axe.js';
import { UI, signIn, t } from './helpers.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

test.describe(
  'UI round 5 – V5-48: Xác nhận cọc on a booking that closed under the box',
  { tag: ['@ui', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('V5-48 (h4) Desk: hold cancelled while Xác nhận cọc is open → Tạo VietQR says 9.1a ("Đã hủy"), no Try again, box locked, no QR made', async ({
      page,
      request,
    }, info) => {
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = c.rooms[Math.floor(Math.random() * c.rooms.length)]!;
      const w = await freeWindow(request, fd, rm, 1, { today });
      const { hold } = await makeHold(request, fd, c, {
        rooms: [rm, ...c.rooms.filter((x) => x.id !== rm.id)],
        arrival: w.arrival,
        nights: 1,
        holdHours: 24,
      });
      expect(hold.folioId, 'giữ chỗ có folio (VietQR cọc tạo trên folio)').toBeTruthy();
      expect(hold.depositRequiredVnd ?? 0, 'giữ chỗ còn thiếu cọc').toBeGreaterThan(0);

      await signIn(page, 'qa.fd');
      await go(page, `/reservations/${hold.id}`);
      await expect(page.getByText(hold.code).first()).toBeVisible({ timeout: 10_000 });
      await page
        .getByRole('button', { name: t('drawer.action.confirm_deposit') })
        .first()
        .click();
      const box = page.getByRole('dialog', { name: tf('rsv.deposit_title', { code: hold.code }) });
      const create = box.getByRole('button', { name: /^Tạo VietQR/ });
      await expect(create).toBeVisible({ timeout: 10_000 });

      // Another tab cancels the hold (B5) while this box is open.
      const cancel = await action(request, fd, hold.id, 'cancel', {
        reasonCode: 'guest_changed_mind',
      });
      expect(cancel.status, JSON.stringify(cancel.body)).toBe(200);
      // B5 answers { reservation, cancellation } – read the booking back rather than the answer's shape
      expect((await getReservation(request, fd, hold.id)).body.status).toBe('cancelled');

      const answers: Array<{ status: number; body: Record<string, unknown> }> = [];
      page.on('response', async (res) => {
        if (res.request().method() === 'POST' && /\/folios\/[^/]+\/vietqr$/.test(res.url()))
          answers.push({
            status: res.status(),
            body: (await res.json().catch(() => ({}))) as Record<string, unknown>,
          });
      });
      await create.click();

      const sentence = tf('error.closed_booking_payment', {
        status: t('status.booking.cancelled'),
      });
      await expect(box.getByText(sentence)).toBeVisible({ timeout: 10_000 });
      // the server's answer is the V5-48 one (the Desk reads `reservationStatus`, not `currentState`)
      expect(answers.at(-1)?.status).toBe(409);
      expect(answers.at(-1)?.body).toMatchObject({
        code: 'INVALID_TRANSITION',
        reservationStatus: 'cancelled',
      });
      await expect(
        box.getByText(tf('rsv.transition_changed', { status: t('status.booking.cancelled') })),
      ).toHaveCount(0);
      await expect(box.getByRole('button', { name: t('common.retry') })).toHaveCount(0);
      await expect(box.getByRole('button', { name: /^Tạo VietQR/ })).toHaveCount(0);
      await expect(box.getByRole('button', { name: t('rsv.deposit_submit') })).toBeDisabled();
      // nothing was made: no VietQR on the folio
      const f = await getFolio(request, fd, hold.folioId!);
      expect(f.payments.filter((p) => p.method === 'vietqr')).toHaveLength(0);
      await scan(page, info, 'V5-48 Xác nhận cọc – đơn đã đóng');
    });
  },
);
