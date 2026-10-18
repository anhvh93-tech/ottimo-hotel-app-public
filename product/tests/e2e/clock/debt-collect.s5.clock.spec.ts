// Thu công nợ sau trả phòng (BR-525 "Thu công nợ" (a)–(d), DOM 18/10; ARC 16.25–16.26; `recordPayment` 0.3.7 bổ sung 4) –
// ca API trên ngày ảo (project "clock"). Oracle BR-525-06…BR-525-15, BR-427-02.
// - TC-L4-146: đảo khoản chuyển khoản sau trả phòng → công nợ; thu đủ hôm sau nữa → 201, folio giữ `settled`, hết nợ, mục
//   "Cần chú ý" `checkout_debt` hết (BR-525-06, BR-525-11).
// - TC-L4-147: công nợ ghi lúc trả phòng; thu một phần → còn nợ đúng số còn lại, giữ hạn cũ (BR-525-07); thu nốt → hết.
// - TC-L4-148: thu vượt → 422 `AMOUNT_EXCEEDS_BALANCE`; SAL, CTV → 403; hết nợ thì folio khóa lại → 409 `FOLIO_LOCKED`
//   (BR-525-08, BR-525-09, BR-525-12).
// - TC-L4-149: J15 `folio.close` ở trả phòng + 24 giờ ± 1 phút với khoản phát sinh 70.000 chưa thu (BR-525-13, R7LOCK-01).
// - TC-L4-150: J15 bỏ qua folio còn yêu cầu hoàn mở (BR-427-02).
// - TC-L4-151: xóa công nợ bằng FOC `debt_write_off` – vai, ghi chú, trần, `kind`, MGR vượt giá 1 đêm chờ OWN (BR-525-15).
// - TC-L4-152: folio đang thừa 30.000 (yêu cầu hoàn mở) → đảo 100.000 → công nợ 70.000 = phần tăng, yêu cầu hoàn tự hủy
//   `superseded`; thu 70.000 → hết nợ (BR-525-03, recheck7 R7ALL-02).
// - TC-L4-153: N-7 / SEC BE-81 – còn công nợ thì MGR, OWN void/giảm dòng → 409; tăng dòng vẫn được, phần tăng là khoản
//   trong cửa sổ – công nợ đang mở giữ 100.000 (BR-525-16, DOM khối lần 8).
// - TC-L4-154: N-6 – A32 trên version cũ sau lần thu nợ → 412; đọc lại → 201 (BR-525-17).
// - TC-L4-155…157: SEC BE-80 (BUG-R2-206, BE-B vòng sửa 8) – yêu cầu xóa nợ chờ OWN mà khách đã trả / hai yêu cầu /
//   đua duyệt ‖ thu: không bao giờ dư thừa vì xóa nợ (BR-525-18…20).
// - TC-L4-158: AN-50 (G-5) – dời hẳn ngày đơn thỏa thuận rồi B13 → 650.000 (BR-417-24).
// Hoa hồng (BR-525-10, BR-525-14: 408.400) cần đơn CTV + đối soát – kiểm ở tích hợp BE-A/BE-B.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  versionTag,
  sessionOrSkip,
  stackToday,
  type ApiResult,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, runJob, setClock } from '../support/clock.js';
import { precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  s2Context,
  vnTime,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  addLine,
  approve,
  checkIn,
  makeStay,
  nightRate,
  stayAction,
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
import { attention } from '../support/s3-checkin.js';
import {
  adjustLine,
  approvalsOf,
  checkOut,
  checkoutSummary,
  minibarCheck,
} from '../support/s3-stay.js';
import { moveAcked } from '../support/s4-money.js';

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
  expect(line.status, `addFolioLine: ${JSON.stringify(line.body).slice(0, 200)}`).toBe(201);
  let transferId = '';
  if (via === 'reversal') {
    const pay = await recordPayment(request, fd, st.res.folioId!, {
      type: 'charge',
      method: 'bank_transfer',
      amountVnd,
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
  expect(f.totals.balanceDueVnd, 'còn phải thu sau trả phòng = công nợ').toBe(amountVnd);
  return { A, st, lineId: liveLines(line.body, 'fnb').at(-1)!.id };
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

/** Yêu cầu xóa nợ `debt_write_off` của MGR (vượt giá 1 đêm → chờ OWN). */
async function writeOffRequest(
  request: APIRequestContext,
  st: Stay,
  lineId: string,
  amountVnd: number,
): Promise<ApiResult<Json & ProblemFields>> {
  const mgr = await sessionOrSkip(request, 'qa.mgr');
  return call<Json & ProblemFields>(
    request,
    'POST',
    p3(EP3.requestFoc, mgr, { folioId: st.res.folioId!, lineId }),
    {
      session: mgr,
      idempotencyKey: true,
      body: { kind: 'foc', reasonCode: 'debt_write_off', amountVnd, note: 'No kho doi' },
    },
  );
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

    test('TC-L4-149 (A) BR-525-13 / BR-427 (d) R7LOCK-01: trả phòng đủ lúc 10:00, 15:00 ghi khoản phát sinh 70.000 chưa thu; J15 `folio.close` lúc 09:59 hôm sau → chưa gì (folio `settled`, không công nợ); 10:01 → folio `closed`, công nợ 70.000, mục "Cần chú ý" mở; thu 70.000 → 201, mục hết', async ({
      request,
    }) => {
      needClock('TC-L4-149');
      const ex = oracle('BR-525-13');
      const exp = ex.expected as Json;
      const A = virtualDay(realToday, 6);
      const st = await precondition(
        'đơn 1 đêm, B18 đủ 10:00, 15:00 khoản phát sinh 70.000',
        async () => {
          await at(request, A, '14:00');
          cleanRooms();
          const c = await s2Context(request);
          let fd = await sessionOrSkip(request, 'qa.fd');
          const [rm] = await readyRooms(request, fd, c.rooms);
          expect(rm, 'một căn sẵn sàng').toBeTruthy();
          const st = await inHouse(request, c, fd, { room: rm!, arrival: A, nights: 1 });
          await at(request, addDays(A, 1), '10:00');
          fd = await sessionOrSkip(request, 'qa.fd');
          expect((await minibarCheck(request, fd, st.res.id)).status).toBe(201);
          const out = await checkOut(request, fd, st.res.id, { checkoutTime: '10:00' });
          expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
          await at(request, addDays(A, 1), '15:00');
          fd = await sessionOrSkip(request, 'qa.fd');
          const add = await addLine(request, fd, st.res.folioId!, {
            category: 'fnb',
            description: 'Phat sinh sau tra phong',
            quantity: 1,
            unitPriceVnd: Number(((ex.input as Json).postCheckoutLine as Json).amountVnd),
            serviceDate: addDays(A, 1),
          });
          expect(add.status, `khoản sau trả phòng: ${JSON.stringify(add.body).slice(0, 300)}`).toBe(
            201,
          );
          return st;
        },
      );
      const due = Number(((ex.input as Json).postCheckoutLine as Json).amountVnd);
      const count0 = (await debtItem(request))?.count ?? 0;
      // 1 phút trước mốc
      await at(request, addDays(A, 2), '09:59');
      await runJob(request, 'folio.close');
      let fd = await sessionOrSkip(request, 'qa.fd');
      const f0 = await getFolio(request, fd, st.res.folioId!);
      expect(f0.status, 'trước mốc: folio còn mở cửa sổ').toBe(
        String((exp.before as Json).folioStatus),
      );
      expect((await debtItem(request))?.count ?? 0, 'trước mốc: chưa công nợ').toBe(count0);
      // 1 phút sau mốc
      await at(request, addDays(A, 2), '10:01');
      await runJob(request, 'folio.close');
      fd = await sessionOrSkip(request, 'qa.fd');
      const f1 = await getFolio(request, fd, st.res.folioId!);
      expect(f1.status, 'hết cửa sổ: folio đóng').toBe(String((exp.after as Json).folioStatus));
      expect(f1.totals.balanceDueVnd, 'công nợ = còn phải thu').toBe(due);
      const item = await debtItem(request);
      expect(item?.count ?? 0, 'mục `checkout_debt` thêm đơn này').toBe(count0 + 1);
      // `dueAt` của mục gộp = hạn SỚM NHẤT mọi công nợ – chỉ so khi trước đó không có công nợ nào
      if (count0 === 0 && item?.dueAt)
        expect.soft(String(item.dueAt), 'hạn +3 ngày').toContain(addDays(A, 5));
      const paid = await collect(request, fd, st, due);
      expect(paid.status, `thu công nợ sau J15: ${JSON.stringify(paid.body).slice(0, 300)}`).toBe(
        201,
      );
      expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd).toBe(0);
      expect((await debtItem(request))?.count ?? 0, 'mục hết').toBe(count0);
    });

    test('TC-L4-150 (A) BR-427-02 / R7LOCK-01: trả phòng thừa 30.000 → yêu cầu hoàn 30.000 chờ chi; hết cửa sổ 24 giờ, J15 bỏ qua folio này (giữ `settled`, không công nợ)', async ({
      request,
    }) => {
      needClock('TC-L4-150');
      const ex = oracle('BR-427-02');
      const credit = Number((ex.input as Json).creditVnd);
      const A = virtualDay(realToday, 4);
      const st = await precondition('đơn 1 đêm trả thừa 30.000, B18 tạo yêu cầu hoàn', async () => {
        await at(request, A, '14:00');
        cleanRooms();
        const c = await s2Context(request);
        let fd = await sessionOrSkip(request, 'qa.fd');
        const [rm] = await readyRooms(request, fd, c.rooms);
        expect(rm, 'một căn sẵn sàng').toBeTruthy();
        const st = await inHouse(request, c, fd, { room: rm!, arrival: A, nights: 1 });
        const extra = await recordPayment(request, fd, st.res.folioId!, {
          type: 'charge',
          method: 'cash',
          amountVnd: credit,
          note: 'Khach tra thua de hoan',
        });
        expect(extra.status, `thu thừa: ${JSON.stringify(extra.body).slice(0, 300)}`).toBe(201);
        await at(request, addDays(A, 1), '10:00');
        fd = await sessionOrSkip(request, 'qa.fd');
        expect((await minibarCheck(request, fd, st.res.id)).status).toBe(201);
        const out = await checkOut(request, fd, st.res.id, {
          checkoutTime: '10:00',
          overpaymentHandling: { mode: 'refund_request', reason: 'Hoan tien khach tra thua' },
        });
        expect(out.status, `B18 kèm yêu cầu hoàn: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(
          200,
        );
        return st;
      });
      await at(request, addDays(A, 2), '10:01');
      await runJob(request, 'folio.close');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.status, 'J15 bỏ qua folio còn yêu cầu hoàn mở').toBe(
        String((ex.expected as Json).folioStatusAfterJ15),
      );
      expect(f.totals.balanceDueVnd, 'không có công nợ').toBeLessThanOrEqual(0);
    });

    test('TC-L4-151 (A) BR-525-15 / R7LOCK-02: xóa công nợ bằng FOC `debt_write_off` – FD → 403; MGR thiếu ghi chú → 422 `REASON_REQUIRED`; vượt còn phải thu → 422 `AMOUNT_EXCEEDS_BALANCE`; `kind` khác `foc` → 422; MGR xóa 2.000.000 (vượt giá 1 đêm) → chờ OWN, công nợ giữ nguyên; OWN duyệt → hết nợ; folio không còn công nợ → 409 `FOLIO_LOCKED`', async ({
      request,
    }) => {
      test.slow();
      needClock('TC-L4-151');
      const ex = oracle('BR-525-15');
      const exp = ex.expected as Json;
      const big = 2_000_000; // > giá 1 đêm của mọi căn DS-E (BR-433: MGR tự áp tới giá 1 đêm)
      const { A, st, lineId } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 2.000.000', () =>
        debtStay(request, 'checkout', big),
      );
      await at(request, addDays(A, 2), '10:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const owner = await sessionOrSkip(request, 'qa.owner');
      const wo = (s: StaffSession, body: Json) =>
        call<Json & ProblemFields>(
          request,
          'POST',
          p3(EP3.requestFoc, s, { folioId: st.res.folioId!, lineId }),
          {
            session: s,
            idempotencyKey: true,
            body: { kind: 'foc', reasonCode: 'debt_write_off', ...body },
          },
        );
      const byFd = await wo(fd, { amountVnd: 100_000, note: 'Khong thu duoc' });
      expect(byFd.status, `FD: ${JSON.stringify(byFd.body).slice(0, 200)}`).toBe(
        Number((exp.frontDesk as Json).status),
      );
      const noNote = await wo(mgr, { amountVnd: 100_000 });
      expect(noNote.status, `thiếu ghi chú: ${JSON.stringify(noNote.body).slice(0, 200)}`).toBe(
        422,
      );
      expect(JSON.stringify(noNote.body)).toContain(String((exp.noNote as Json).code));
      const tooMuch = await wo(mgr, { amountVnd: big + 1, note: 'Khong thu duoc' });
      expect(tooMuch.status, `vượt: ${JSON.stringify(tooMuch.body).slice(0, 200)}`).toBe(422);
      expect(JSON.stringify(tooMuch.body)).toContain('AMOUNT_EXCEEDS_BALANCE');
      const other = await wo(mgr, {
        kind: 'special_discount',
        amountVnd: 100_000,
        note: 'Khong thu duoc',
      });
      expect(other.status, `kind khác: ${JSON.stringify(other.body).slice(0, 200)}`).toBe(422);
      expect(JSON.stringify(other.body)).toContain('NOT_ALLOWED');
      expect(
        (await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd,
        'chưa ghi gì',
      ).toBe(big);
      // MGR vượt giá 1 đêm → chờ OWN
      const pending = await wo(mgr, { amountVnd: big, note: 'No kho doi' });
      expect(
        pending.status,
        `MGR vượt hạn mức: ${JSON.stringify(pending.body).slice(0, 300)}`,
      ).toBe(201);
      expect(pending.body.status, 'chờ duyệt').toBe('pending');
      expect(pending.body.requiredRole).toBe('owner');
      expect(
        (await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd,
        'công nợ giữ nguyên khi chờ',
      ).toBe(big);
      const ok = await approve(request, owner, String(pending.body.id), 'Dong y xoa no');
      expect(ok.status, `OWN duyệt: ${JSON.stringify(ok.body).slice(0, 300)}`).toBe(200);
      expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd, 'hết nợ').toBe(0);
      const again = await wo(mgr, { amountVnd: 1_000, note: 'Khong thu duoc' });
      expect(again.status, `không còn công nợ: ${JSON.stringify(again.body).slice(0, 200)}`).toBe(
        Number((exp.noOpenDebt as Json).status),
      );
      expect(again.body.code).toBe(String((exp.noOpenDebt as Json).code));
    });

    test('TC-L4-152 (A) BR-525-03 / BR-525 G-4 (ii): folio đang thừa 30.000 (trả phòng tạo yêu cầu hoàn 30.000); hôm sau MGR đảo khoản chuyển khoản 100.000 → công nợ 70.000 = phần tăng (không 100.000), yêu cầu hoàn tự hủy `superseded`, "Cần chú ý" thêm đơn này; thu 70.000 → hết nợ', async ({
      request,
    }) => {
      needClock('TC-L4-152');
      const ex = oracle('BR-525-03');
      const exp = ex.expected as Json;
      const credit = -Number((ex.input as Json).balanceBeforeVnd);
      const reversal = Number(((ex.input as Json).reversal as Json).paymentVnd);
      const A = virtualDay(realToday, 4);
      const { st, transferId } = await precondition(
        'đơn 1 đêm: F&B 100.000 trả chuyển khoản + thu thừa 30.000; B18 tạo yêu cầu hoàn 30.000',
        async () => {
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
            unitPriceVnd: reversal,
            serviceDate: A,
          });
          expect(line.status, JSON.stringify(line.body).slice(0, 200)).toBe(201);
          const transfer = await recordPayment(request, fd, st.res.folioId!, {
            type: 'charge',
            method: 'bank_transfer',
            amountVnd: reversal,
          });
          expect(transfer.status, JSON.stringify(transfer.body).slice(0, 200)).toBe(201);
          const extra = await recordPayment(request, fd, st.res.folioId!, {
            type: 'charge',
            method: 'cash',
            amountVnd: credit,
            note: 'Khach tra thua de hoan',
          });
          expect(extra.status, `thu thừa: ${JSON.stringify(extra.body).slice(0, 200)}`).toBe(201);
          await at(request, addDays(A, 1), '10:00');
          fd = await sessionOrSkip(request, 'qa.fd');
          expect((await minibarCheck(request, fd, st.res.id)).status).toBe(201);
          const out = await checkOut(request, fd, st.res.id, {
            checkoutTime: '10:00',
            overpaymentHandling: { mode: 'refund_request', reason: 'Hoan tien khach tra thua' },
          });
          expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
          const f0 = await getFolio(request, fd, st.res.folioId!);
          expect(f0.totals.balanceDueVnd, 'không còn phải thu').toBe(0);
          expect((f0.totals as unknown as Json).creditVnd, 'thừa 30.000').toBe(credit);
          return { st, transferId: String(transfer.body.id) };
        },
      );
      const count0 = (await debtItem(request))?.count ?? 0;
      await at(request, addDays(A, 2), '10:00');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const rev = await call<Json & ProblemFields>(
        request,
        'POST',
        p3(EP3.reversePayment, mgr, { paymentId: transferId }),
        { session: mgr, idempotencyKey: true, body: { reason: 'Chuyen khoan khong ve' } },
      );
      expect(rev.status, `reversePayment: ${JSON.stringify(rev.body).slice(0, 300)}`).toBe(200);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.totals.balanceDueVnd, 'công nợ = phần tăng (70.000, không 100.000)').toBe(
        Number(exp.debtAddedVnd),
      );
      expect((await debtItem(request))?.count ?? 0, 'mục `checkout_debt` thêm đơn này').toBe(
        count0 + 1,
      );
      const refunds = await approvalsOf(request, mgr, st.res.code, 'refund');
      expect(refunds.length, 'có yêu cầu hoàn 30.000 của B18').toBeGreaterThan(0);
      for (const r of refunds) {
        expect.soft(r.status, 'yêu cầu hoàn tự hủy').toBe('cancelled');
        expect.soft((r as Json).autoCancelReason).toBe('superseded');
      }
      const paid = await collect(request, fd, st, Number(exp.amountDueAfterVnd));
      expect(paid.status, `thu 70.000: ${JSON.stringify(paid.body).slice(0, 300)}`).toBe(201);
      expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd).toBe(0);
      expect((await debtItem(request))?.count ?? 0, 'mục hết').toBe(count0);
    });

    test('TC-L4-153 (A) BR-525-16 / N-7, SEC BE-81: đơn còn công nợ 100.000 – MGR rồi OWN void dòng, giảm giá dòng → 409 `FOLIO_LOCKED`, nợ giữ nguyên; MGR tăng dòng 100.000 → 120.000 → 201', async ({
      request,
    }) => {
      needClock('TC-L4-153');
      const ex = oracle('BR-525-16');
      const exp = ex.expected as Json;
      const { A, st, lineId } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 100.000', () =>
        debtStay(request, 'checkout'),
      );
      // Trả phòng A+1 10:00 → cửa sổ 24 giờ tới A+2 10:00; làm mọi bước trong cửa sổ (BR-525 (ii)).
      await at(request, addDays(A, 2), '09:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      for (const who of ['qa.mgr', 'qa.owner']) {
        const s = await sessionOrSkip(request, who);
        for (const body of [{ voidLine: true }, { newUnitPriceVnd: 60_000 }]) {
          const r = await adjustLine(request, s, st.res.folioId!, lineId, {
            ...body,
            reason: 'Sua sai sau tra phong',
          });
          expect(
            r.status,
            `${who} ${JSON.stringify(body)}: ${JSON.stringify(r.body).slice(0, 200)}`,
          ).toBe(Number((exp.reduceOrVoid as Json).status));
          expect(r.body.code).toBe(String((exp.reduceOrVoid as Json).code));
        }
      }
      expect(
        (await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd,
        'nợ giữ nguyên',
      ).toBe(DEBT);
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const up = await adjustLine(request, mgr, st.res.folioId!, lineId, {
        newUnitPriceVnd: 120_000,
        reason: 'Tinh thieu mon',
      });
      expect(up.status, `tăng dòng: ${JSON.stringify(up.body).slice(0, 200)}`).toBe(201);
      // BR-525 (ii), DOM khối lần 8: phần A32 tăng là khoản trong cửa sổ – còn phải thu 120.000, công nợ đang mở giữ 100.000;
      // hết cửa sổ (trả phòng + 24 giờ) mới thành công nợ 120.000.
      const inc = exp.increase as Json;
      const inWin = inc.inWindow as Json;
      const afterWin = inc.afterWindow as Json;
      const after = await getFolio(request, fd, st.res.folioId!);
      expect(after.totals.balanceDueVnd, 'còn phải thu').toBe(Number(inc.amountDueVnd));
      // Công nợ đang mở đọc qua trần `debt_write_off` (min(dòng, công nợ đang mở − đang chờ)); 422 không tạo yêu cầu.
      const live = liveLines(after, 'fnb').at(-1)!;
      const cap = await writeOffRequest(request, st, live.id, 99_000_000);
      expect(cap.status, `trần xóa nợ: ${JSON.stringify(cap.body).slice(0, 200)}`).toBe(422);
      expect(
        Number(cap.body.max),
        'trong cửa sổ: trần = công nợ đang mở, không gồm phần tăng',
      ).toBe(Number(inWin.writeOffCapVnd));
      await at(request, addDays(A, 2), '10:01');
      const capLate = await writeOffRequest(request, st, live.id, 99_000_000);
      expect(capLate.status, `trần xóa nợ: ${JSON.stringify(capLate.body).slice(0, 200)}`).toBe(
        422,
      );
      expect(Number(capLate.body.max), 'hết cửa sổ: phần tăng thành công nợ').toBe(
        Number(afterWin.writeOffCapVnd),
      );
    });

    test('TC-L4-154 (A) BR-525-17 / N-6, ARC 16.29: MGR đọc folio (version v); FD thu nợ 50.000 → 201, version tăng; MGR gửi A32 với If-Match v → 412 `VERSION_CONFLICT`; đọc lại → 201', async ({
      request,
    }) => {
      needClock('TC-L4-154');
      const { A, st, lineId } = await precondition('đơn 1 đêm, B18 MGR ghi công nợ 100.000', () =>
        debtStay(request, 'checkout'),
      );
      await at(request, addDays(A, 2), '10:00');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const v = (await getFolio(request, mgr, st.res.folioId!)).version;
      const paid = await collect(request, fd, st, 50_000);
      expect(paid.status, JSON.stringify(paid.body).slice(0, 200)).toBe(201);
      const v2 = (await getFolio(request, mgr, st.res.folioId!)).version;
      expect(v2, 'thu nợ tăng version (N-6)').toBeGreaterThan(v);
      const stale = await call<Json & ProblemFields>(
        request,
        'POST',
        p3(EP3.adjustFolioLine, mgr, { folioId: st.res.folioId!, lineId }),
        {
          session: mgr,
          idempotencyKey: true,
          ifMatch: versionTag(v),
          body: { newUnitPriceVnd: 120_000, reason: 'Tinh thieu mon' },
        },
      );
      expect(stale.status, `A32 trên số cũ: ${JSON.stringify(stale.body).slice(0, 200)}`).toBe(412);
      expect(stale.body.code).toBe('VERSION_CONFLICT');
      const ok = await adjustLine(request, mgr, st.res.folioId!, lineId, {
        newUnitPriceVnd: 120_000,
        reason: 'Tinh thieu mon',
      });
      expect(ok.status, `A32 đọc lại: ${JSON.stringify(ok.body).slice(0, 200)}`).toBe(201);
      expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd).toBe(70_000);
    });

    test('TC-L4-155 (A) BR-525-18 / SEC BE-80 ca A (BUG-R2-206): nợ 5.000.000; MGR xin xóa 5.000.000 → chờ OWN; khách trả đủ → 201; OWN duyệt → 200, yêu cầu tự hủy `debt_cleared`, không FOC, dư thừa 0', async ({
      request,
    }) => {
      needClock('TC-L4-155');
      const ex = oracle('BR-525-18');
      const exp = ex.expected as Json;
      const big = Number((ex.input as Json).debtVnd);
      const { st, req } = await precondition(
        'nợ 5.000.000, yêu cầu xóa chờ OWN, khách trả đủ',
        async () => {
          const { A, st, lineId } = await debtStay(request, 'checkout', big);
          await at(request, addDays(A, 2), '10:00');
          const r = await writeOffRequest(request, st, lineId, big);
          expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(201);
          expect(r.body.status).toBe('pending');
          const fd = await sessionOrSkip(request, 'qa.fd');
          const paid = await collect(request, fd, st, big);
          expect(paid.status, JSON.stringify(paid.body).slice(0, 200)).toBe(201);
          return { st, req: String(r.body.id) };
        },
      );
      const owner = await sessionOrSkip(request, 'qa.owner');
      const dec = await approve(request, owner, req, 'Dong y xoa no');
      expect(dec.status, `OWN duyệt: ${JSON.stringify(dec.body).slice(0, 200)}`).toBe(
        Number(exp.approveStatus),
      );
      expect(dec.body.status, 'yêu cầu tự hủy').toBe(String((exp.request as Json).status));
      expect(dec.body.autoCancelReason).toBe(String((exp.request as Json).autoCancelReason));
      expect(Number(dec.body.effectiveAmountVnd ?? 0), 'không áp gì').toBe(0);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.totals.creditVnd ?? 0, 'không dư thừa vì xóa nợ').toBe(Number(exp.creditVnd));
      expect(f.totals.balanceDueVnd).toBe(0);
      // dòng FOC chờ duyệt của yêu cầu chuyển `rejected` – không có dòng FOC nào được ghi (posted)
      expect(liveLines(f, 'foc'), 'không ghi dòng FOC').toHaveLength(Number(exp.focLinesWritten));
    });

    test('TC-L4-156 (A) BR-525-19 / SEC BE-80 ca B (BUG-R2-206): nợ 8.000.000, thu 3.000.000 (còn 5.000.000); MGR xin xóa 5.000.000 → chờ OWN; xin thêm 3.000.000 → 422 `AMOUNT_EXCEEDS_BALANCE` `max` 0; khách trả thêm 2.000.000; OWN duyệt 5.000.000 → áp 3.000.000 (`effectiveAmountVnd`), dư thừa 0, hết nợ', async ({
      request,
    }) => {
      needClock('TC-L4-156');
      const ex = oracle('BR-525-19');
      const exp = ex.expected as Json;
      const second = exp.secondRequest as Json;
      const ap = exp.approve as Json;
      const { st, lineId, req } = await precondition(
        'nợ 8.000.000, thu 3.000.000, yêu cầu xóa 5.000.000 chờ OWN',
        async () => {
          const { A, st, lineId } = await debtStay(request, 'checkout', 8_000_000);
          await at(request, addDays(A, 2), '10:00');
          const fd = await sessionOrSkip(request, 'qa.fd');
          const paid = await collect(request, fd, st, 3_000_000);
          expect(paid.status, JSON.stringify(paid.body).slice(0, 200)).toBe(201);
          const r1 = await writeOffRequest(request, st, lineId, 5_000_000);
          expect(r1.status, JSON.stringify(r1.body).slice(0, 200)).toBe(201);
          expect(r1.body.status).toBe('pending');
          return { st, lineId, req: String(r1.body.id) };
        },
      );
      const r2 = await writeOffRequest(request, st, lineId, 3_000_000);
      expect(r2.status, `yêu cầu thứ hai: ${JSON.stringify(r2.body).slice(0, 300)}`).toBe(
        Number(second.status),
      );
      expect(JSON.stringify(r2.body.errors ?? [])).toContain(String(second.fieldCode));
      expect(Number(r2.body.max), '`max` = 0 (yêu cầu đang chờ giữ hết phần nợ)').toBe(
        Number(second.maxVnd),
      );
      const fd = await sessionOrSkip(request, 'qa.fd');
      const more = await collect(request, fd, st, Number((ex.input as Json).thenGuestPaysVnd));
      expect(more.status, JSON.stringify(more.body).slice(0, 200)).toBe(201);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const dec = await approve(request, owner, req, 'Dong y xoa no');
      expect(dec.status, `OWN duyệt: ${JSON.stringify(dec.body).slice(0, 300)}`).toBe(
        Number(ap.status),
      );
      expect(dec.body.status).toBe(String(ap.requestStatus));
      expect(Number(dec.body.amountVnd), 'số xin giữ nguyên (SM-10)').toBe(Number(ap.amountVnd));
      expect(Number(dec.body.effectiveAmountVnd), 'chỉ áp phần nợ còn mở').toBe(
        Number(ap.effectiveAmountVnd),
      );
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.totals.creditVnd ?? 0, 'dư thừa 0').toBe(Number(exp.creditVnd));
      expect(f.totals.balanceDueVnd, 'hết nợ').toBe(Number(exp.debtOpenVnd));
    });

    test('TC-L4-157 (A) BR-525-20 / SEC BE-80 (BUG-R2-206): đua OWN duyệt yêu cầu xóa nợ 5.000.000 ‖ FD thu nợ 5.000.000 (gửi cùng lúc) → kết quả của một thứ tự tuần tự: duyệt trước → thu 409; thu trước → yêu cầu tự hủy `debt_cleared`; không dư thừa, hết nợ', async ({
      request,
    }) => {
      needClock('TC-L4-157');
      const exp = oracle('BR-525-20').expected as Json;
      const big = 5_000_000;
      const { st, req } = await precondition('nợ 5.000.000, yêu cầu xóa chờ OWN', async () => {
        const { A, st, lineId } = await debtStay(request, 'checkout', big);
        await at(request, addDays(A, 2), '10:00');
        const r = await writeOffRequest(request, st, lineId, big);
        expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(201);
        expect(r.body.status).toBe('pending');
        return { st, req: String(r.body.id) };
      });
      const owner = await sessionOrSkip(request, 'qa.owner');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const [dec, paid] = await Promise.all([
        approve(request, owner, req, 'Dong y xoa no'),
        collect(request, fd, st, big),
      ]);
      expect(dec.status, `OWN duyệt: ${JSON.stringify(dec.body).slice(0, 200)}`).toBe(200);
      const first = exp.approve_first as Json;
      const second = exp.collect_first as Json;
      if (dec.body.status === 'approved') {
        expect(paid.status, 'duyệt trước → thu 409').toBe(Number(first.collect));
        expect(paid.body.code).toBe(String(first.collectCode));
      } else {
        expect(paid.status, 'thu trước → 201').toBe(Number(second.collect));
        expect(dec.body.status).toBe(String(second.requestStatus));
        expect(dec.body.autoCancelReason).toBe(String(second.autoCancelReason));
      }
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.totals.creditVnd ?? 0, 'không dư thừa vì xóa nợ').toBe(0);
      expect(f.totals.balanceDueVnd).toBe(0);
    });

    test('TC-L4-158 (A) BR-417-24 / AN-50 (G-5): đơn 202 thỏa thuận 650.000 × 2 dời hẳn ngày (không chồng, giữ căn) → đêm dời 650.000, chênh 0; nhận phòng rồi B13 thêm 1 đêm → 650.000 (không lịch)', async ({
      request,
    }) => {
      needClock('TC-L4-158');
      const ex = oracle('BR-417-24');
      const fixed = (process.env.E2E_FIXED_BUGS ?? '').split(',').map((x) => x.trim());
      const pending = (ex as unknown as Json).pendingFix;
      test.skip(
        !!pending && !fixed.includes(String(pending)),
        `BR-417-24 còn pendingFix ${String(pending)} (BE-A chưa sửa G-5)`,
      );
      const agreed = Number((ex.input as Json).agreedNightVnd);
      const D = virtualDay(realToday, 8);
      await at(request, D, '10:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const [rm] = await readyRooms(request, fd, c.rooms);
      const nights = [D, addDays(D, 1)];
      const st = await makeStay(request, c, fd, {
        room: rm!,
        arrival: D,
        nights: 2,
        extra: { nightlyRates: nights.map((date) => ({ date, amountVnd: agreed })) },
      });
      const arrival = addDays(D, 3);
      const mv = await moveAcked(request, fd, st.res.id, {
        arrivalDate: arrival,
        departureDate: addDays(arrival, 2),
        mode: 'change',
        reasonCode: 'guest_request',
      });
      expect(mv.status, `dời hẳn ngày: ${JSON.stringify(mv.body).slice(0, 300)}`).toBe(200);
      expect(nightRate(mv.body, arrival), 'đêm dời kế thừa thỏa thuận').toBe(agreed);
      expect(nightRate(mv.body, addDays(arrival, 1))).toBe(agreed);
      await at(request, arrival, '14:00');
      cleanRooms();
      fd = await sessionOrSkip(request, 'qa.fd');
      const ci = await checkIn(request, fd, st.res.id, {});
      expect(ci.status, `nhận phòng: ${JSON.stringify(ci.body).slice(0, 300)}`).toBe(200);
      const ext = await stayAction<Json & ProblemFields>(request, fd, st.res.id, 'extend', {
        nights: 1,
      });
      expect(ext.status, `B13: ${JSON.stringify(ext.body).slice(0, 300)}`).toBe(200);
      const res = (await getReservation(request, fd, st.res.id)).body;
      expect(
        nightRate(res, addDays(arrival, 2)),
        `B13 đêm thêm = ${agreed} (không lịch ${String((ex.expected as Json).notCalendarVnd)})`,
      ).toBe(Number((ex.expected as Json).b13NightVnd));
    });
  },
);
