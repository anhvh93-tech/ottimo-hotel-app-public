// Thu công nợ sau trả phòng (BR-525 "Thu công nợ" (a)–(d), DOM 18/10; ARC 16.25–16.26; `recordPayment` 0.3.7 bổ sung 4) –
// ca API trên ngày ảo (project "clock"). Oracle BR-525-06…BR-525-12 (`pendingFix` BUG-R2-200).
// - TC-L4-146: đảo khoản chuyển khoản sau trả phòng → công nợ; thu đủ hôm sau nữa → 201, folio giữ `settled`, hết nợ, mục
//   "Cần chú ý" `checkout_debt` hết (BR-525-06, BR-525-11).
// - TC-L4-147: công nợ ghi lúc trả phòng; thu một phần → còn nợ đúng số còn lại, giữ hạn cũ (BR-525-07); thu nốt → hết.
// - TC-L4-148: thu vượt → 422 `AMOUNT_EXCEEDS_BALANCE`; SAL, CTV → 403; hết nợ thì folio khóa lại → 409 `FOLIO_LOCKED`
//   (BR-525-08, BR-525-09, BR-525-12).
// Hoa hồng đạt lại khi thu đủ và đã đối soát (BR-525-10) cần đơn CTV + đối soát – kiểm ở tích hợp BE-A/BE-B.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  sessionOrSkip,
  stackToday,
  type ApiResult,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  oracle,
  s2Context,
  vnTime,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  addLine,
  cleanRooms,
  getFolio,
  inHouse,
  p3,
  readyRooms,
  recordPayment,
  useVirtualDevice,
  virtualDay,
  type Stay,
} from '../support/s3.js';
import { attention } from '../support/s3-checkin.js';
import { checkOut, checkoutSummary, minibarCheck } from '../support/s3-stay.js';

type Json = Record<string, unknown>;
const DEBT = 100_000;

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

/** Mục "Cần chú ý" `checkout_debt` của MGR (gộp: `count`, `dueAt` = hạn sớm nhất). */
async function debtItem(request: APIRequestContext) {
  const mgr = await sessionOrSkip(request, 'qa.mgr');
  return (await attention(request, mgr)).find((x) => x.kind === 'checkout_debt');
}

/**
 * Đơn 1 đêm (đến A, đi A+1) có công nợ 100.000 sau trả phòng:
 * - `reversal`: dòng F&B 100.000 trả bằng chuyển khoản, B18 A+1 còn phải thu 0; A+2 MGR đảo khoản chuyển khoản (G-4);
 * - `checkout`: dòng F&B 100.000 chưa thu, B18 A+1 MGR ghi công nợ hạn A+4 (A19).
 */
async function debtStay(
  request: APIRequestContext,
  via: 'reversal' | 'checkout',
): Promise<{ A: string; st: Stay }> {
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
  expect(line.status, `addFolioLine: ${JSON.stringify(line.body).slice(0, 200)}`).toBe(201);
  let transferId = '';
  if (via === 'reversal') {
    const pay = await recordPayment(request, fd, st.res.folioId!, {
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: DEBT,
    });
    expect(pay.status, `chuyển khoản: ${JSON.stringify(pay.body).slice(0, 200)}`).toBe(201);
    transferId = String(pay.body.id);
  }
  const d1 = addDays(A, 1);
  await at(request, d1, '10:00');
  fd = await sessionOrSkip(request, 'qa.fd');
  const mb = await minibarCheck(request, fd, st.res.id);
  expect(mb.status, `đếm minibar: ${JSON.stringify(mb.body).slice(0, 200)}`).toBe(201);
  const sum = await checkoutSummary(request, fd, st.res.id, { checkoutTime: '10:00' });
  expect(sum.status).toBe(200);
  if (via === 'reversal') {
    const out = await checkOut(request, fd, st.res.id, { checkoutTime: '10:00' });
    expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
    await at(request, addDays(A, 2), '10:00');
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const rev = await call<Json & ProblemFields>(
      request,
      'POST',
      p3(EP3.reversePayment, mgr, { paymentId: transferId }),
      { session: mgr, idempotencyKey: true, body: { reason: 'Chuyen khoan khong ve' } },
    );
    expect(rev.status, `reversePayment: ${JSON.stringify(rev.body).slice(0, 300)}`).toBe(200);
  } else {
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const out = await checkOut(request, mgr, st.res.id, {
      checkoutTime: '10:00',
      debt: { dueDate: addDays(A, 4), reason: 'Khach hen chuyen khoan' },
    });
    expect(out.status, `B18 ghi công nợ: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
  }
  fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
  const f = await getFolio(request, fd, st.res.folioId!);
  expect(f.totals.balanceDueVnd, 'còn phải thu sau trả phòng = công nợ').toBe(DEBT);
  return { A, st };
}

function collect(
  request: APIRequestContext,
  s: StaffSession,
  st: Stay,
  amountVnd: number,
  extra: Json = {},
): Promise<ApiResult<Json & ProblemFields>> {
  return recordPayment(request, s, st.res.folioId!, {
    type: 'charge',
    method: 'cash',
    amountVnd,
    ...extra,
  }) as Promise<ApiResult<Json & ProblemFields>>;
}

test.describe(
  'BR-525 – thu công nợ sau trả phòng (ARC 16.26)',
  { tag: ['@clock', '@sprint4', '@money'] },
  () => {
    test('TC-L4-146 (A) BR-525-06, BR-525-11 / ARC 16.26: trả phòng đủ, hôm sau MGR đảo khoản chuyển khoản 100.000 → công nợ, MGR thấy "Cần chú ý" `checkout_debt` (FD không thấy); hai ngày sau FD thu 100.000 tiền mặt → 201, folio giữ `settled`, còn phải thu 0, mục chú ý hết', async ({
      request,
    }) => {
      needClock('TC-L4-146');
      const ex = oracle('BR-525-06');
      const { A, st } = await precondition('đơn 1 đêm, B18 đủ, MGR đảo 100.000 (G-4)', () =>
        debtStay(request, 'reversal'),
      );
      const before = await debtItem(request);
      expect(before, 'MGR thấy mục `checkout_debt`').toBeTruthy();
      const fdItems = await attention(request, await sessionOrSkip(request, 'qa.fd'));
      expect(
        fdItems.some((x) => x.kind === 'checkout_debt'),
        'FD không thấy mục (MGR+)',
      ).toBe(false);
      await at(request, addDays(A, 4), '10:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const r = await collect(request, fd, st, Number((ex.input as Json).debtVnd));
      expect(r.status, `thu công nợ: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(
        Number((ex.expected as Json).status),
      );
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.totals.balanceDueVnd, 'hết nợ').toBe(0);
      expect(f.status, 'folio giữ trạng thái').toBe(String((ex.expected as Json).folioStatus));
      const after = await debtItem(request);
      expect(after?.count ?? 0, 'mục `checkout_debt` bớt đúng đơn này').toBe(
        (before?.count ?? 1) - 1,
      );
    });

    test('TC-L4-147 (A) BR-525-07 / BR-525 thu công nợ (b): MGR ghi công nợ 100.000 lúc trả phòng (hạn A+4); A+3 FD thu 60.000 tiền mặt → 201, còn nợ 40.000, mục chú ý còn, giữ hạn cũ; A+4 thu 40.000 chuyển khoản → hết nợ, mục chú ý hết', async ({
      request,
    }) => {
      needClock('TC-L4-147');
      const ex = oracle('BR-525-07');
      const { A, st } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 100.000', () =>
        debtStay(request, 'checkout'),
      );
      const before = await debtItem(request);
      expect(before, 'mục `checkout_debt` có').toBeTruthy();
      await at(request, addDays(A, 3), '10:00');
      let fd = await sessionOrSkip(request, 'qa.fd');
      const part = await collect(
        request,
        fd,
        st,
        Number(((ex.input as Json).collect as Json).amountVnd),
      );
      expect(part.status, `thu một phần: ${JSON.stringify(part.body).slice(0, 300)}`).toBe(201);
      const f1 = await getFolio(request, fd, st.res.folioId!);
      expect(f1.totals.balanceDueVnd, 'còn nợ').toBe(
        Number((ex.expected as Json).amountDueAfterVnd),
      );
      const mid = await debtItem(request);
      expect(mid, 'công nợ vẫn mở').toBeTruthy();
      if (before?.dueAt) expect(mid?.dueAt, 'giữ hạn cũ').toBe(before.dueAt);
      await at(request, addDays(A, 4), '10:00');
      fd = await sessionOrSkip(request, 'qa.fd');
      const rest = await collect(request, fd, st, f1.totals.balanceDueVnd, {
        method: 'bank_transfer',
      });
      expect(rest.status, `thu nốt: ${JSON.stringify(rest.body).slice(0, 300)}`).toBe(201);
      expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd).toBe(0);
      expect((await debtItem(request))?.count ?? 0, 'mục chú ý bớt đơn này').toBe(
        (mid?.count ?? 1) - 1,
      );
    });

    test('TC-L4-148 (A) BR-525-08, BR-525-09, BR-525-12 / ARC 16.26: công nợ 100.000 – thu 150.000 → 422 `AMOUNT_EXCEEDS_BALANCE` (`max` 100.000); SAL, CTV thu → 403; không ghi gì; FD thu đủ → 201; sau đó `charge` hoặc `deposit` trên folio đã khóa → 409 `FOLIO_LOCKED`', async ({
      request,
    }) => {
      needClock('TC-L4-148');
      const over = oracle('BR-525-08');
      const locked = oracle('BR-525-12');
      const { A, st } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 100.000', () =>
        debtStay(request, 'checkout'),
      );
      await at(request, addDays(A, 2), '10:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const tooMuch = await collect(
        request,
        fd,
        st,
        Number(((over.input as Json).collect as Json).amountVnd),
      );
      expect(tooMuch.status, `thu vượt: ${JSON.stringify(tooMuch.body).slice(0, 300)}`).toBe(422);
      const errs = JSON.stringify(tooMuch.body.errors ?? []);
      expect(errs).toContain('AMOUNT_EXCEEDS_BALANCE');
      expect(errs).toContain('amountVnd');
      expect(JSON.stringify(tooMuch.body), '`max` = còn phải thu').toContain(
        String((over.expected as Json).maxVnd),
      );
      for (const who of ['qa.sal', 'qa.ctv1']) {
        const s = await sessionOrSkip(request, who);
        const r = await collect(request, s, st, DEBT);
        expect(r.status, `${who} thu công nợ: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(403);
      }
      expect(
        (await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd,
        'không ghi gì',
      ).toBe(DEBT);
      const ok = await collect(request, fd, st, DEBT);
      expect(ok.status, `FD thu đủ: ${JSON.stringify(ok.body).slice(0, 300)}`).toBe(201);
      for (const type of ['charge', 'deposit']) {
        const r = await collect(request, fd, st, 50_000, { type });
        expect(r.status, `${type} sau khi hết nợ: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(
          Number((locked.expected as Json).status),
        );
        expect(r.body.code).toBe(String((locked.expected as Json).code));
      }
    });
  },
);
