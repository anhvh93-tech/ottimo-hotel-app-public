// "Thu công nợ" trên Desk (ARC 16.26, BR-525 thu công nợ (a)–(b); FE-A `DebtCollectDialog`) với API thật, ngày ảo
// (project desk-clock). Oracle BR-525-07, BR-525-08; H17/H24 câu áp một phần và tự đóng của yêu cầu xóa nợ (SEC BE-80 –
// BR-525-18, BR-525-19); "Xóa công nợ" (R7LOCK-02, ARC 16.27, FE-A `DebtWriteOffDialog`) – BR-525-15.
// Phần API: `e2e/clock/debt-collect.s5.clock.spec.ts`.
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { precondition } from '../support/known-bugs.js';
import { addDays, cleanupTracked, oracle, s2Context, vnTime } from '../support/s2.js';
import {
  EP3,
  addLine,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  p3,
  readyRooms,
  recordPayment,
  useVirtualDevice,
  virtualDay,
  type Stay,
} from '../support/s3.js';
import { checkOut, minibarCheck } from '../support/s3-stay.js';
import { scan } from '../ui/axe.js';
import { desk } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { dialogs, recordWrites, vnd, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const DEBT = 100_000;
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string) => t(key).split('{')[0]!.trim();

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<void> {
  await useVirtualDevice(request, await setClock(request, vnTime(date, hhmm)));
}

/** Đơn 1 đêm (đến A, đi A+1): dòng F&B 100.000 chưa thu, B18 A+1 MGR ghi công nợ hạn A+4. */
async function debtStay(
  request: APIRequestContext,
  amountVnd = DEBT,
): Promise<{ A: string; st: Stay; lineId: string }> {
  const A = virtualDay(realToday, 6);
  await at(request, A, '14:00');
  cleanRooms();
  const c = await s2Context(request);
  let fd = await sessionOrSkip(request, 'qa.fd');
  const [rm] = await readyRooms(request, fd, c.rooms);
  expect(rm, 'một căn sẵn sàng').toBeTruthy();
  const st = await inHouse(request, c, fd, { room: rm!, arrival: A, nights: 1 });
  const line = await addLine(request, fd, st.res.folioId!, {
    category: 'fnb',
    description: 'Tiec nho',
    quantity: 1,
    unitPriceVnd: amountVnd,
    serviceDate: A,
  });
  expect(line.status, JSON.stringify(line.body).slice(0, 200)).toBe(201);
  await at(request, addDays(A, 1), '10:00');
  fd = await sessionOrSkip(request, 'qa.fd');
  expect((await minibarCheck(request, fd, st.res.id)).status).toBe(201);
  const mgr = await sessionOrSkip(request, 'qa.mgr');
  const out = await checkOut(request, mgr, st.res.id, {
    checkoutTime: '10:00',
    debt: { dueDate: addDays(A, 4), reason: 'Khach hen chuyen khoan' },
  });
  expect(out.status, `B18 ghi công nợ: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
  return { A, st, lineId: liveLines(line.body, 'fnb').at(-1)!.id };
}

test.describe(
  'UI – Thu công nợ sau trả phòng (ARC 16.26)',
  { tag: ['@ui', '@sprint4', '@clock', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-X-081 (E) BR-525-07, BR-525-08 / ARC 16.26 FE-A: drawer đơn đã trả còn công nợ 100.000 có nút "Thu công nợ" (lễ tân); hộp thu điền sẵn số còn phải thu, gõ 150.000 → báo lỗi và không gửi được; thu 60.000 tiền mặt → `recordPayment` `charge` 201, còn 40.000; thu nốt 40.000 chuyển khoản → hết nợ, nút "Thu công nợ" mất + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-081');
      const part = oracle('BR-525-07');
      const over = oracle('BR-525-08');
      const { A, st } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 100.000', () =>
        debtStay(request),
      );
      await at(request, addDays(A, 3), '10:00');
      const page = await desk(browser, 'qa.fd', vnTime(addDays(A, 3), '10:05'));
      try {
        const pays = recordWrites(page, 'POST', /\/folios\/[^/]+\/payments$/);
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        const open = page.getByRole('button', { name: t('debt.collect'), exact: true });
        await expect(open, 'nút "Thu công nợ" của đơn đã trả còn nợ').toBeVisible({
          timeout: 20_000,
        });
        await open.click();
        const dlg = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('debt.collect_title'))}`),
        });
        await expect(dlg).toBeVisible({ timeout: 15_000 });
        const amount = dlg.getByLabel(new RegExp(`^${esc(t('co.amount'))}`));
        await expect(amount, 'điền sẵn số còn phải thu').toHaveValue(/100[.,]000/);
        const submit = dlg.getByRole('button', {
          name: new RegExp(`^${esc(stem('debt.collect_submit'))}`),
        });
        // thu vượt: báo lỗi, không gửi được
        await amount.fill(String(((over.input as Json).collect as Json).amountVnd));
        await expect(dlg.getByText(stem('field_error.value_out_of_range'))).toBeVisible();
        await expect(submit).toBeDisabled();
        await scan(page, test.info(), 'H11-debt-collect');
        // thu một phần 60.000 tiền mặt
        const firstVnd = Number(((part.input as Json).collect as Json).amountVnd);
        await amount.fill(String(firstVnd));
        await dlg.getByRole('button', { name: t('pay.cash'), exact: true }).click();
        await submit.click();
        const w1 = await waitWrite(pays, 'recordPayment thu công nợ (một phần)', 201);
        expect(w1.request).toMatchObject({ type: 'charge', method: 'cash', amountVnd: firstVnd });
        const fd = await sessionOrSkip(request, 'qa.fd');
        const f1 = await getFolio(request, fd, st.res.folioId!);
        expect(f1.totals.balanceDueVnd, 'còn nợ').toBe(
          Number((part.expected as Json).amountDueAfterVnd),
        );
        expect(f1.status, 'folio giữ trạng thái').toBe('settled');
        // thu nốt bằng chuyển khoản
        await expect(open, 'còn nợ → nút vẫn còn').toBeVisible({ timeout: 15_000 });
        await open.click();
        await expect(dlg).toBeVisible({ timeout: 15_000 });
        await expect(amount).toHaveValue(/40[.,]000/);
        await dlg.getByRole('button', { name: t('pay.bank_transfer'), exact: true }).click();
        await submit.click();
        const w2 = await waitWrite(pays, 'recordPayment thu công nợ (thu nốt)', 201, (s) =>
          JSON.stringify(s.request).includes('bank_transfer'),
        );
        expect(w2.request).toMatchObject({
          type: 'charge',
          method: 'bank_transfer',
          amountVnd: f1.totals.balanceDueVnd,
        });
        expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd).toBe(0);
        await expect(open, 'hết nợ → không còn nút').toHaveCount(0, { timeout: 15_000 });
      } finally {
        await page.context().close();
      }
    });

    test('TC-X-082 (E) BR-525-15 / R7LOCK-02 FE-A: "Xóa công nợ" chỉ OWN/MGR – lễ tân có "Thu công nợ" nhưng không có nút xóa; quản lý mở hộp, chọn khoản 100.000, chưa ghi chú thì nút xóa tắt; ghi chú → `requestFoc` `debt_write_off` 201 tự áp (≤ giá 1 đêm), hết nợ, nút mất + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-082');
      const { A, st, lineId } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 100.000', () =>
        debtStay(request),
      );
      await at(request, addDays(A, 2), '10:00');
      const fdPage = await desk(browser, 'qa.fd', vnTime(addDays(A, 2), '10:05'));
      try {
        await fdPage.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await expect(
          fdPage.getByRole('button', { name: t('debt.collect'), exact: true }),
        ).toBeVisible({ timeout: 20_000 });
        await expect(
          fdPage.getByRole('button', { name: t('debt.write_off'), exact: true }),
          'lễ tân không có nút xóa công nợ',
        ).toHaveCount(0);
      } finally {
        await fdPage.context().close();
      }
      const page = await desk(browser, 'qa.mgr', vnTime(addDays(A, 2), '10:10'));
      try {
        const focs = recordWrites(page, 'POST', /\/folios\/[^/]+\/lines\/[^/]+\/foc$/);
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        const open = page.getByRole('button', { name: t('debt.write_off'), exact: true });
        await expect(open, 'nút "Xóa công nợ" của quản lý').toBeVisible({ timeout: 20_000 });
        await open.click();
        const dlg = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('debt.write_off_title'))}`),
        });
        await expect(dlg).toBeVisible({ timeout: 15_000 });
        await expect(
          dlg.getByText(t('debt.write_off_limit')),
          'MGR thấy câu hạn mức',
        ).toBeVisible();
        const submit = dlg.getByRole('button', {
          name: new RegExp(`^${esc(stem('debt.write_off_submit'))}`),
        });
        await expect(submit, 'chưa chọn khoản').toBeDisabled();
        await dlg
          .locator('label')
          .filter({ hasText: /100[.,]000/ })
          .getByRole('radio')
          .first()
          .check();
        await expect(
          dlg.getByRole('textbox', { name: new RegExp(`^${esc(t('co.amount'))}`) }),
        ).toHaveValue(/100[.,]000/);
        await expect(submit, 'chưa ghi chú').toBeDisabled();
        await dlg
          .getByLabel(new RegExp(`^${esc(t('debt.write_off_note'))}`))
          .fill('Khach khong lien lac duoc');
        // R3-Q25 (BUG-R3-001 đã sửa): người xin nhập lại mật khẩu của chính mình (S1) mới gửi được.
        await expect(submit, 'chưa nhập mật khẩu').toBeDisabled();
        await dlg.getByLabel(new RegExp(`^${esc(t('ci.stepup_label'))}`)).fill(SEED_PASSWORD!);
        await expect(submit).toBeEnabled();
        await scan(page, test.info(), 'H11-debt-write-off');
        await submit.click();
        const w = await waitWrite(focs, 'requestFoc debt_write_off', 201);
        expect(w.request).toMatchObject({
          kind: 'foc',
          reasonCode: 'debt_write_off',
          amountVnd: DEBT,
          authMethod: 'password',
        });
        expect(w.path, 'đúng khoản đã chọn').toContain(lineId);
        expect((JSON.parse(w.body) as Json).status, 'MGR tự áp (≤ giá 1 đêm)').toBe('approved');
        const fd = await sessionOrSkip(request, 'qa.fd');
        expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd, 'hết nợ').toBe(
          0,
        );
        await expect(open, 'hết nợ → không còn nút').toHaveCount(0, { timeout: 15_000 });
      } finally {
        await page.context().close();
      }
    });

    test('TC-X-083 (E) BR-525-18, BR-525-19 / SEC BE-80 (BUG-R2-206) FE-A: H17 chủ đầu tư duyệt yêu cầu xóa nợ – (a) khách đã trả bớt → câu "Đã xóa công nợ 3.000.000 đ (yêu cầu 5.000.000 đ)…", (b) khách đã trả đủ → câu "Công nợ đã thu đủ nên yêu cầu xóa công nợ tự đóng…" + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-083');
      const money = (n: number): string => tf('common.currency_vnd', { amount: vnd(n) });
      const wo = async (st: Stay, lineId: string, amountVnd: number) => {
        const mgr = await sessionOrSkip(request, 'qa.mgr');
        const r = await call<Json>(
          request,
          'POST',
          p3(EP3.requestFoc, mgr, { folioId: st.res.folioId!, lineId }),
          {
            session: mgr,
            idempotencyKey: true,
            // R3-Q25: người xin xóa nợ xác thực lại (S1); thiếu → 422 `secret` REQUIRED
            body: {
              kind: 'foc',
              reasonCode: 'debt_write_off',
              amountVnd,
              note: 'No kho doi',
              authMethod: 'password',
              secret: SEED_PASSWORD,
            },
          },
        );
        expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(201);
        expect(r.body.status).toBe('pending');
      };
      const pay = async (st: Stay, amountVnd: number) => {
        const fd = await sessionOrSkip(request, 'qa.fd');
        const r = await recordPayment(request, fd, st.res.folioId!, {
          type: 'charge',
          method: 'cash',
          amountVnd,
        });
        expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(201);
      };
      // (a) nợ 8.000.000 → thu 3.000.000 → xin xóa 5.000.000 → thu thêm 2.000.000 (còn 3.000.000)
      const a = await precondition(
        '(a) nợ còn 3.000.000, yêu cầu xóa 5.000.000 chờ OWN',
        async () => {
          const { A, st, lineId } = await debtStay(request, 8_000_000);
          await at(request, addDays(A, 2), '10:00');
          await pay(st, 3_000_000);
          await wo(st, lineId, 5_000_000);
          await pay(st, 2_000_000);
          return st;
        },
      );
      // (b) nợ 5.000.000 → xin xóa 5.000.000 → khách trả đủ
      const { B, b } = await precondition(
        '(b) yêu cầu xóa 5.000.000 chờ OWN, khách trả đủ',
        async () => {
          const { A, st, lineId } = await debtStay(request, 5_000_000);
          await at(request, addDays(A, 2), '10:00');
          await wo(st, lineId, 5_000_000);
          await pay(st, 5_000_000);
          return { B: addDays(A, 2), b: st };
        },
      );
      const capped = tf('approval.applied_capped', {
        amount: money(3_000_000),
        requested: money(5_000_000),
      });
      const own = await desk(browser, 'qa.owner', vnTime(B, '10:05'));
      try {
        const decisions = recordWrites(
          own,
          'POST',
          /\/approval-requests\/[^/]+\/actions\/approve$/,
        );
        await own.goto(`${WEB_URL}/approvals`);
        for (const [st, expected] of [
          [a, capped],
          [b, t('approval.auto_cancel.debt_cleared')],
        ] as const) {
          const n0 = decisions.length;
          const card = own.getByRole('listitem').filter({ hasText: st.res.code });
          await expect(card, `thẻ yêu cầu ${st.res.code}`).toBeVisible({ timeout: 15_000 });
          await card.getByRole('button', { name: t('approval.approve'), exact: true }).click();
          const dlg = dialogs(own).filter({ has: own.getByLabel(t('approval.pin_label')) });
          await dlg.getByLabel(t('approval.pin_label')).fill(SEED_PASSWORD!);
          await dlg.getByRole('button', { name: t('approval.approve'), exact: true }).click();
          await expect
            .poll(() => decisions.length, {
              timeout: 15_000,
              message: `approveRequest ${st.res.code}`,
            })
            .toBeGreaterThan(n0);
          expect(decisions.at(-1)!.status, `approveRequest ${st.res.code}`).toBe(200);
          await expect(own.getByText(expected, { exact: true }).first(), expected).toBeVisible({
            timeout: 15_000,
          });
        }
        await scan(own, test.info(), 'H17-debt-write-off-capped');
      } finally {
        await own.context().close();
      }
      const fd = await sessionOrSkip(request, 'qa.fd');
      for (const st of [a, b]) {
        const f = await getFolio(request, fd, st.res.folioId!);
        expect(f.totals.balanceDueVnd, `${st.res.code} hết nợ`).toBe(0);
        expect(f.totals.creditVnd ?? 0, `${st.res.code} không dư thừa`).toBe(0);
      }
      // H24 "Yêu cầu của tôi" chỉ có ở Tổng quan của lễ tân; yêu cầu xóa nợ chỉ MGR/OWN gửi nên câu áp một phần ở H24
      // không có người xem – QA ghi Note cho FE-A/UXD (18/10), không kiểm ở đây.
    });
  },
);
