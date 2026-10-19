// E2E API Sprint 4 – S4-06 (BR-522 v0.3.4 bổ sung, v0.3.8 DOM-S4-14): đơn hủy còn tiền dư → hệ thống TỰ tạo MỘT yêu
// cầu hoàn = phần dư sau phí và sau khi đảo dịch vụ, mở "Cần chú ý" `closed_reservation_credit` (đóng khi chi đủ hoặc
// khách để lại tiền). Cơ sở phí hủy = min(cọc đã thu, cọc yêu cầu, giá trị đơn) (BR-309 v0.3.8). Yêu cầu hoàn đang mở:
// thiếu → tạo yêu cầu bổ sung; thừa → yêu cầu CHỜ DUYỆT tự hủy (`autoCancelReason`) và tạo lại đúng số.
// Oracle: BR-309-10, BR-522-05 (a)(b)(c). Ý (d) (thừa nhưng vẫn còn dư → tự hủy `superseded` rồi tạo lại) dựng từ
// số của BR-309-10 + quy tắc DOM-S4-14 (chưa có dòng oracle riêng – DOM thêm BR-522-06 nếu cần).
// No-show cùng quy tắc (BR-311-03) ở `clock/refund-credit.s4.clock.spec.ts` (cần đồng hồ ảo).
// Tiền điều kiện "yêu cầu hoàn đang mở TRƯỚC khi hủy" (BR-522-05) KHÔNG dựng được qua API công khai: createRefundRequest
// chỉ cho hoàn phần tiền thừa chưa có yêu cầu (`unhandledCreditVnd`), đơn chưa đến không có tiền thừa. BE dựng bằng
// `approvals.submit` (test/integration/close-stay-dom-s4.test.ts); ca này chèn MỘT dòng `approval_request` bằng SQL trên
// stack dùng một lần (E2E_COMPOSE_CONTROL=1), cùng cột như ApprovalService.submit – không phải đối tượng kiểm.
// TC: product/tests/test-cases/r1-main-flows.md – TC-L2-104, TC-L2-105.
import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import {
  action,
  addDays,
  cleanupTracked,
  createReservation,
  getReservation,
  isRoomFree,
  newGuest,
  isSpecialDate,
  nightsOf,
  oracle,
  reservationBody,
  room,
  s2Context,
  track,
  type Reservation,
  type S2Context,
} from '../support/s2.js';
import { approvalsOf, type Approval } from '../support/s3-stay.js';
import { getFolio, liveLines, stackSql } from '../support/s3.js';

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;
const COMPOSE_CONTROL = process.env.E2E_COMPOSE_CONTROL === '1';

test.afterEach(async ({ request }) => cleanupTracked(request));

/**
 * Đơn Trực tiếp đến hôm nay + `notice` ngày, 3 đêm × giá đêm của ví dụ (giá ghi rõ → tổng 2.376.000, cọc BR-305
 * 700.000), cọc đã thu `paid` tiền mặt (có thể vượt cọc yêu cầu). Căn 202 của ví dụ nếu trống, không thì căn Lầu 1–2.
 */
async function bookPaid(
  request: APIRequestContext,
  fd: StaffSession,
  c: S2Context,
  input: Json,
  notice: number,
  paid: number,
): Promise<Reservation & { folioId: string }> {
  const today = await stackToday(request);
  const arrival = addDays(today, notice);
  const nights = nightsOf(String(input.arrivalDate), String(input.departureDate ?? '')).length || 3;
  const departure = addDays(arrival, nights);
  // C10 (cổng QC S4 mục 6): ngày đến = hôm nay + số ngày báo trước của ví dụ; nếu khoảng ở có đêm đặc biệt DS-E thì
  // BR-309 cao điểm không hoàn cọc – số của ví dụ (ngày thường) không còn đúng. Không dời được ngày (số ngày báo trước
  // cố định) → bỏ qua có lý do; luật cao điểm do TC-L2-053 (BR-309-08) kiểm.
  test.skip(
    nightsOf(arrival, departure).some(isSpecialDate),
    `ngày: ${arrival}→${departure} có đêm đặc biệt (BR-104) – ví dụ ${String(input.arrivalDate)} là ngày thường`,
  );
  const rate = num(input.roomTotalVnd) / nights;
  const prefer = room(c, String(input.roomNo));
  const l12 = [
    prefer,
    ...c.rooms.filter(
      (x) => x.id !== prefer.id && ['101', '102', '103', '201', '203'].includes(x.roomNo),
    ),
  ];
  const guestId = await newGuest(request, fd);
  for (const rm of l12) {
    if ((await isRoomFree(request, fd, rm, arrival, departure)) === false) continue;
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival,
        departure,
        guestId,
        extra: {
          nightlyRates: nightsOf(arrival, departure).map((date) => ({ date, amountVnd: rate })),
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: paid },
        },
      }),
    );
    if (r.status === 409) continue;
    expect(r.status, `createReservation ${rm.roomNo} ${arrival}: ${JSON.stringify(r.body)}`).toBe(
      201,
    );
    track('reservation', r.body.id);
    return r.body as Reservation & { folioId: string };
  }
  test.skip(true, `môi trường: Lầu 1–2 kín ${arrival}→${departure}`);
  throw new Error('unreachable');
}

/** Một yêu cầu hoàn CHỜ DUYỆT gắn với đơn (tiền điều kiện BR-522-05 – xem đầu tệp), người gửi = `by`. */
function openRefundBySql(res: Reservation, by: StaffSession, amountVnd: number): string {
  const id = randomUUID();
  const who = by.me.id.replace(/[^0-9a-f-]/gi, '');
  stackSql(
    `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
       target_code, amount_vnd, reason_code, reason_note, requested_by, requested_at, required_role,
       created_at, created_by, updated_at)
     SELECT '${id}', r.organization_id, r.property_id, 'refund', 'pending', 'reservation', r.id, r.code,
       ${Math.trunc(amountVnd)}, 'overpayment', 'E2E: yeu cau hoan mo truoc khi huy (BR-522-05)', '${who}', now(),
       'manager', now(), '${who}', now()
       FROM reservation r WHERE r.id = '${res.id.replace(/[^0-9a-f-]/gi, '')}';`,
  );
  return id;
}

async function cancel(request: APIRequestContext, fd: StaffSession, id: string) {
  const r = await action<
    Reservation & { cancellation?: { retainedVnd: number; refundableVnd: number } }
  >(request, fd, id, 'cancel', { reasonCode: 'guest_changed_mind' });
  expect(r.status, `cancelReservation: ${JSON.stringify(r.body)}`).toBe(200);
  expect((await getReservation(request, fd, id)).body.status).toBe('cancelled');
  return r.body;
}

/** "Cần chú ý" `closed_reservation_credit` đang mở cho đơn (theo id hoặc mã đơn). */
async function creditAttention(
  request: APIRequestContext,
  s: StaffSession,
  res: Reservation,
): Promise<Json[]> {
  const r = await call<{ data: Json[] }>(
    request,
    'GET',
    `/v1/properties/${propertyIdOf(s)}/attention`,
    { session: s },
  );
  expect(r.status, `listAttentionItems: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body.data.filter(
    (x) =>
      x.kind === 'closed_reservation_credit' &&
      (x.refCode === res.code ||
        ((x.reservationIds as string[] | undefined) ?? []).includes(res.id)),
  );
}

const refunds = (xs: Approval[]) => xs.filter((a) => a.type === 'refund');
const live = (xs: Approval[]) =>
  xs.filter((a) => ['pending', 'escalated', 'approved'].includes(a.status));

test.describe(
  'S4-06 – đơn hủy còn tiền dư: tự tạo yêu cầu hoàn + "Cần chú ý" closed_reservation_credit (BR-522, BR-309 v0.3.8, DOM-S4-14)',
  { tag: ['@api', '@sprint4', '@money'] },
  () => {
    test('TC-L2-104 BR-309-10 hủy trước 2 ngày, cọc thu 1.000.000 > cọc yêu cầu 700.000: phí = 700.000 (cơ sở min), dư 300.000 → MỘT yêu cầu hoàn 300.000 chờ duyệt + "Cần chú ý" closed_reservation_credit (S4-06)', async ({
      request,
    }) => {
      const ex = oracle('BR-309-10');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const b = await bookPaid(
        request,
        fd,
        c,
        ex.input,
        num(ex.expected.noticeDays),
        num(ex.input.depositPaidVnd),
      );
      expect(b.depositRequiredVnd, 'cọc yêu cầu BR-305 của đơn 2.376.000').toBe(
        num(ex.input.depositRequiredVnd),
      );
      expect(b.totalRoomVnd).toBe(num(ex.input.roomTotalVnd));
      const out = await cancel(request, fd, b.id);
      expect(
        out.cancellation?.retainedVnd,
        'phí hủy = 100 % × min(1.000.000, 700.000, 2.376.000)',
      ).toBe(num(ex.expected.cancellationFeeVnd));
      expect(out.cancellation?.refundableVnd, 'tiền dư phải hoàn').toBe(
        num(ex.expected.excessRefundVnd),
      );
      const f = await getFolio(request, fd, b.folioId);
      expect(liveLines(f, 'cancellation_fee').map((l) => l.amountVnd)).toEqual([
        num(ex.expected.cancellationFeeVnd),
      ]);
      expect(f.totals.balanceDueVnd).toBe(0);
      expect(f.totals.creditVnd).toBe(num(ex.expected.excessRefundVnd));
      const rq = refunds(await approvalsOf(request, mgr, b.code));
      expect(
        rq.map((a) => [a.status, a.amountVnd]),
        'đúng MỘT yêu cầu hoàn tự tạo',
      ).toEqual([['pending', num(ex.expected.excessRefundVnd)]]);
      expect(rq[0]!.requiredRole, 'hoàn do quản lý trở lên duyệt (BR-522)').toBe('manager');
      expect(
        await creditAttention(request, fd, b),
        '"Cần chú ý" closed_reservation_credit mở cho đơn',
      ).toHaveLength(1);
    });

    test('TC-L2-105 (a)(b)(c) BR-522-05 đã có yêu cầu hoàn mở trước khi hủy: (a) hủy trước 5 ngày → phí 350.000, dư 650.000, mở 300.000 → bổ sung 350.000; (b) trước 2 ngày → phí 700.000, dư 300.000 → không tạo thêm; (c) cọc 700.000, mở 700.000, dư 0 → yêu cầu tự hủy, không "Cần chú ý" (DOM-S4-14)', async ({
      request,
    }) => {
      test.skip(
        !COMPOSE_CONTROL,
        'tiền điều kiện dựng bằng SQL – cần E2E_COMPOSE_CONTROL=1 (stack dùng một lần)',
      );
      const ex = oracle('BR-522-05');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const fee = ex.expected.feeVnd as Record<string, number>;
      const excess = ex.expected.excessAfterFeeVnd as Record<string, number>;
      const added = ex.expected.newRefundRequestVnd as Record<string, number>;
      const autoCancelled = ex.expected.openRequestAutoCancelled as Record<string, boolean>;
      const arrival = String(ex.input.arrivalDate);
      for (const k of ex.input.cases as Json[]) {
        const key = String(k.key);
        // số ngày báo trước của ví dụ: hủy lúc `cancelledAt` cho đơn đến `arrivalDate`
        const notice = nightsOf(String(k.cancelledAt).slice(0, 10), arrival).length;
        const b = await bookPaid(request, fd, c, ex.input, notice, num(k.depositPaidVnd));
        expect(b.depositRequiredVnd, `(${key}) cọc yêu cầu`).toBe(num(ex.input.depositRequiredVnd));
        const openId = openRefundBySql(b, fd, num(k.openRefundVnd));
        const out = await cancel(request, fd, b.id);
        expect(out.cancellation?.retainedVnd, `(${key}) phí hủy – cơ sở theo cọc yêu cầu`).toBe(
          fee[key],
        );
        const f = await getFolio(request, fd, b.folioId);
        expect(f.totals.creditVnd, `(${key}) tiền dư sau phí`).toBe(excess[key]);
        const rq = refunds(await approvalsOf(request, mgr, b.code));
        const open = rq.find((a) => a.id === openId);
        expect(open, `(${key}) yêu cầu mở trước khi hủy`).toBeTruthy();
        if (autoCancelled[key]) {
          expect(open!.status, `(${key}) yêu cầu chờ duyệt vượt dư → tự hủy`).toBe('cancelled');
          expect(open!.autoCancelReason, `(${key}) hủy do hệ thống`).toBeTruthy();
        } else {
          expect(open!.status, `(${key}) yêu cầu mở giữ nguyên`).toBe('pending');
        }
        const created = rq.filter((a) => a.id !== openId);
        expect(
          created.map((a) => a.amountVnd),
          `(${key}) yêu cầu hệ thống tạo thêm`,
        ).toEqual(added[key] ? [added[key]] : []);
        expect(
          live(rq).reduce((a, r) => a + num(r.amountVnd), 0),
          `(${key}) tổng yêu cầu hoàn còn hiệu lực = tiền dư`,
        ).toBe(excess[key]);
        expect(
          (await creditAttention(request, fd, b)).length,
          `(${key}) "Cần chú ý" chỉ khi còn dư`,
        ).toBe((excess[key] ?? 0) > 0 ? 1 : 0);
      }
    });

    test('TC-L2-105 (d) DOM-S4-14 yêu cầu hoàn mở 700.000 vượt tiền dư 300.000 (số BR-309-10): yêu cầu chờ duyệt tự hủy `superseded`, hệ thống tạo lại đúng 300.000', async ({
      request,
    }) => {
      test.skip(
        !COMPOSE_CONTROL,
        'tiền điều kiện dựng bằng SQL – cần E2E_COMPOSE_CONTROL=1 (stack dùng một lần)',
      );
      const ex = oracle('BR-309-10');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const b = await bookPaid(
        request,
        fd,
        c,
        ex.input,
        num(ex.expected.noticeDays),
        num(ex.input.depositPaidVnd),
      );
      const openId = openRefundBySql(b, fd, num(ex.input.depositRequiredVnd));
      const out = await cancel(request, fd, b.id);
      expect(out.cancellation?.retainedVnd).toBe(num(ex.expected.cancellationFeeVnd));
      const rq = refunds(await approvalsOf(request, mgr, b.code));
      const open = rq.find((a) => a.id === openId)!;
      expect(open.status).toBe('cancelled');
      expect(open.autoCancelReason).toBe('superseded');
      expect(
        live(rq).map((a) => a.amountVnd),
        'tạo lại MỘT yêu cầu đúng tiền dư',
      ).toEqual([num(ex.expected.excessRefundVnd)]);
      expect(await creditAttention(request, fd, b)).toHaveLength(1);
    });
  },
);
