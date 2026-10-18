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
// Hoa hồng (BR-525-10, BR-525-14: 408.400) cần đơn CTV + đối soát – kiểm ở tích hợp BE-A/BE-B.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
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
  oracle,
  s2Context,
  vnTime,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  addLine,
  approve,
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
  },
);
