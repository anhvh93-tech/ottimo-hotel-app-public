// "Thu công nợ" trên Desk (ARC 16.26, BR-525 thu công nợ (a)–(b); FE-A `DebtCollectDialog`) với API thật, ngày ảo
// (project desk-clock). Oracle BR-525-07, BR-525-08 (`pendingFix` BUG-R2-200). Phần API: `e2e/clock/debt-collect.s5.clock.spec.ts`.
import { expect, test, type APIRequestContext } from '@playwright/test';
import { needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { precondition } from '../support/known-bugs.js';
import { addDays, cleanupTracked, oracle, s2Context, vnTime } from '../support/s2.js';
import {
  addLine,
  cleanRooms,
  getFolio,
  inHouse,
  readyRooms,
  useVirtualDevice,
  virtualDay,
  type Stay,
} from '../support/s3.js';
import { checkOut, minibarCheck } from '../support/s3-stay.js';
import { scan } from '../ui/axe.js';
import { desk } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const DEBT = 100_000;
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
async function debtStay(request: APIRequestContext): Promise<{ A: string; st: Stay }> {
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
    unitPriceVnd: DEBT,
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
  return { A, st };
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
  },
);
