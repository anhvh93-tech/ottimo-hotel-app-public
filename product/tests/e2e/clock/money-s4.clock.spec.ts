// Sprint 4 – ca tiền tự động cần đồng hồ giả (project "clock": tuần tự, sau mọi project dùng API).
// Kế hoạch: rounds/round-02/qa/s4-test-plan.md mục 4–6 (T1). Hợp đồng 0.3.7 (đóng băng D1). Oracle: br-examples.json v0.3.6.
// Mỗi ca một NGÀY ẢO riêng (support/s3.ts virtualDay); ca kiểm số dư hạn mức tháng BR-433 dùng ngày đầu của một tháng
// lịch mới (ownMonthDay, như approvals-foc.s3.clock.spec.ts) để hạn mức của qa.fdl bắt đầu từ 0.
// Lỗi đã biết: knownBug() ở DÒNG ĐẦU ca, dựng dữ liệu trong precondition() (support/known-bugs.ts – bài học BUG-R2-064).
//
// TC (r1-main-flows.md): TC-NT-045 (a)(b), TC-NT-046 (a), TC-NT-049 (3) + (4) phần hạn mức, TC-L3-078 (BR-402-01),
// TC-L4-097 (BR-424-04, S4-05), TC-L4-098 (B14 xem trước = lệnh ghi, BR-434-06 / S4-04).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { needSeedPassword, sessionOrSkip, stackToday, type StaffSession } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  action,
  addDays,
  cleanupTracked,
  oracle,
  room,
  s2Context,
  vnTime,
  weekday,
  type ProblemFields,
  type Reservation,
  type S2Context,
} from '../support/s2.js';
import {
  approve,
  checkIn,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  makeStay,
  needCleanRooms,
  preview,
  stayAction,
  useVirtualDevice,
  virtualDay,
  type Folio,
  type Stay,
} from '../support/s3.js';
import {
  approvalById,
  approvedReduction,
  daysBetween,
  lineOn,
  linesOn,
  moneyEventsOf,
  nightNet,
  reductionOn,
  reductionsOf,
  remainingMonthly,
  requestReduction,
  sum,
  totalOf,
} from '../support/s4-money.js';

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;

// ───────────────────────── ngày ảo, tháng lịch riêng (BR-433) ─────────────────────────

function firstOfNextMonth(d: string): string {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

/** Ngày ảo đầu tiên được dùng của một tháng lịch mới; phần còn lại của tháng được giữ (không ca nào khác dùng). */
function ownMonthDay(realToday: string, span: number): string {
  const d0 = virtualDay(realToday, 0);
  virtualDay(realToday, daysBetween(d0, firstOfNextMonth(d0)));
  const D = virtualDay(realToday, span);
  virtualDay(realToday, daysBetween(D, firstOfNextMonth(D)));
  expect(D.slice(0, 7) > d0.slice(0, 7), `ngày ảo ${D} phải ở tháng sau ${d0}`).toBe(true);
  return D;
}

/** Đồng hồ ở D hh:mm (đóng băng), thiết bị quầy ảo, mọi căn VC – chỉ gọi trước khi nhận phòng trong ngày. */
async function startDay(ctx: APIRequestContext, D: string, hhmm: string): Promise<void> {
  const now = await setClock(ctx, vnTime(D, hhmm));
  await useVirtualDevice(ctx, now);
  cleanRooms();
}

/** Tua đồng hồ trong ca – phiên cũ hết hạn, gọi lại people(). */
async function moveTo(ctx: APIRequestContext, date: string, hhmm: string): Promise<void> {
  await useVirtualDevice(ctx, await setClock(ctx, vnTime(date, hhmm)));
}

interface People {
  c: S2Context;
  fd: StaffSession;
  fdl: StaffSession;
  mgr: StaffSession;
}
async function people(request: APIRequestContext): Promise<People> {
  return {
    c: await s2Context(request),
    fd: await sessionOrSkip(request, 'qa.fd'),
    fdl: await sessionOrSkip(request, 'qa.fdl'),
    mgr: await sessionOrSkip(request, 'qa.mgr'),
  };
}

let realToday = '';
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

// ───────────────────────── trả muộn (BR-412) ─────────────────────────

/** Giá đêm của các ví dụ BR-412 (700.000) – đơn đặt đúng giá này để phụ thu khớp oracle. */
const RATE = oracle('BR-412-01').input.lastNightRateVnd as number;

/** Đơn Trực tiếp 1 đêm ngày D giá RATE, trả đủ tiền phòng, đang ở. */
async function lateStay(
  request: APIRequestContext,
  k: People,
  roomNo: string,
  D: string,
): Promise<Stay> {
  return inHouse(request, k.c, k.fd, {
    room: room(k.c, roomNo),
    arrival: D,
    nights: 1,
    extra: { nightlyRates: [{ date: D, amountVnd: RATE }] },
  });
}

/** setLateCheckout `time`; phụ thu 0 → không ghi (applySurcharge false khi server đòi quyết định). */
async function setLate(
  request: APIRequestContext,
  fd: StaffSession,
  reservationId: string,
  time: string,
  surchargeVnd: number,
): Promise<void> {
  const body: Json = { checkoutTime: time };
  if (surchargeVnd > 0)
    Object.assign(body, { applySurcharge: true, expectedSurchargeVnd: surchargeVnd });
  let r = await stayAction<Json & ProblemFields>(request, fd, reservationId, 'late-checkout', body);
  if (r.status === 422 && surchargeVnd === 0) {
    r = await stayAction<Json & ProblemFields>(request, fd, reservationId, 'late-checkout', {
      ...body,
      applySurcharge: false,
    });
  }
  expect(r.status, `setLateCheckout ${time}: ${JSON.stringify(r.body)}`).toBe(200);
}

/** Phụ thu trả muộn sống, FOC sống trên nó, phần còn phải thu. */
function lateOf(f: Folio): { line: number; foc: number; net: number } {
  const ls = liveLines(f, 'late_checkout');
  const line = sum(ls.map((l) => l.amountVnd));
  const foc = sum(ls.flatMap((l) => reductionsOf(f, l.id, 'foc')));
  return { line, foc, net: line - foc };
}

test.describe(
  'S4 tiền – FOC trả muộn, no-show, hạn mức, B14 (MutableClock)',
  { tag: ['@clock', '@sprint4', '@money'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-NT-045 (a) BR-412-15 FOC 210.000 đã duyệt trên trả muộn 15:00 → đổi 12:30 (FOC ngủ) → đổi lại 15:00: FOC tự khôi phục, còn phải thu 0 (S4-34)', async ({
      request,
    }) => {
      knownBug('BUG-R2-061');
      needClock('TC-NT-045');
      const ex = oracle('BR-412-15');
      const times = ex.input.checkoutTimeSequence as string[];
      const sur = ex.expected.surchargeSequenceVnd as number[];
      const focs = ex.expected.focSequenceVnd as number[];
      const states = ex.expected.focStateSequence as string[];
      const { k, st, focId } = await precondition(
        'đơn 1 đêm 700.000 đang ở, hẹn trả 15:00, FOC 210.000 đã duyệt',
        async () => {
          const D = virtualDay(realToday, 2);
          await startDay(request, D, '14:30');
          const k = await people(request);
          const st = await lateStay(request, k, '201', D);
          await setLate(request, k.fd, st.res.id, times[0]!, sur[0]!);
          const line = liveLines(
            await getFolio(request, k.fd, st.res.folioId!),
            'late_checkout',
          )[0]!;
          expect(line.amountVnd).toBe(sur[0]);
          const a = await approvedReduction(request, k.fd, k.fdl, st.res.folioId!, line.id, {
            amountVnd: num(ex.input.approvedFocVnd),
            reasonCode: 'regular_vip',
          });
          return { k, st, focId: a.id };
        },
      );
      for (let i = 1; i < times.length; i++) {
        await setLate(request, k.fd, st.res.id, times[i]!, sur[i]!);
        const l = lateOf(await getFolio(request, k.fd, st.res.folioId!));
        expect(l.line, `phụ thu trả muộn ${times[i]}`).toBe(sur[i]);
        expect(l.foc, `FOC sau khi đổi giờ trả ${times[i]}`).toBe(focs[i]);
        const a = await approvalById(request, k.mgr, focId);
        expect(a.status, 'không duyệt lại').toBe('approved');
        expect.soft(a.focState, `focState ${times[i]}`).toBe(states[i]);
      }
      expect(lateOf(await getFolio(request, k.fd, st.res.folioId!)).net).toBe(
        num(ex.expected.finalGuestPaysVnd),
      );
    });

    test('TC-NT-045 (b) BR-412-16 FOC 350.000 đã duyệt trên trả muộn 17:00 → 15:00 (FOC 210.000) → 17:00: FOC 350.000 theo số đã duyệt (S4-34)', async ({
      request,
    }) => {
      knownBug('BUG-R2-061');
      needClock('TC-NT-045');
      const ex = oracle('BR-412-16');
      const times = ex.input.checkoutTimeSequence as string[];
      const sur = ex.expected.surchargeSequenceVnd as number[];
      const focs = ex.expected.focSequenceVnd as number[];
      const { k, st, focId } = await precondition(
        'đơn 1 đêm 700.000 đang ở, hẹn trả 17:00, FOC 350.000 quản lý duyệt',
        async () => {
          const D = virtualDay(realToday, 2);
          await startDay(request, D, '14:30');
          const k = await people(request);
          const st = await lateStay(request, k, '201', D);
          await setLate(request, k.fd, st.res.id, times[0]!, sur[0]!);
          const line = liveLines(
            await getFolio(request, k.fd, st.res.folioId!),
            'late_checkout',
          )[0]!;
          const a = await approvedReduction(request, k.fd, k.mgr, st.res.folioId!, line.id, {
            amountVnd: num(ex.input.approvedFocVnd),
            reasonCode: 'regular_vip',
          });
          return { k, st, focId: a.id };
        },
      );
      for (let i = 1; i < times.length; i++) {
        await setLate(request, k.fd, st.res.id, times[i]!, sur[i]!);
        const l = lateOf(await getFolio(request, k.fd, st.res.folioId!));
        expect(l.line, `phụ thu ${times[i]}`).toBe(sur[i]);
        expect(l.foc, `FOC ${times[i]}`).toBe(focs[i]);
        expect((await approvalById(request, k.mgr, focId)).status).toBe('approved');
      }
      expect(lateOf(await getFolio(request, k.fd, st.res.folioId!)).net).toBe(
        num(ex.expected.finalGuestPaysVnd),
      );
    });

    test('TC-NT-046 (a) BR-412-17 FOC 210.000 CHỜ DUYỆT (15:00) → đổi 17:00 → lễ tân trưởng duyệt: áp 210.000, còn thu 140.000, hạn mức còn 1.290.000 (S4-34 + S4-18)', async ({
      request,
    }) => {
      knownBug('BUG-R2-061', 'BUG-R2-059');
      needClock('TC-NT-046');
      const ex = oracle('BR-412-17');
      const times = ex.input.checkoutTimeSequence as string[];
      const { k, st, reqId } = await precondition(
        'đơn 1 đêm đang ở (tháng lịch mới), hẹn 15:00, FOC 210.000 chờ duyệt',
        async () => {
          const D = ownMonthDay(realToday, 2);
          await startDay(request, D, '14:30');
          const k = await people(request);
          const st = await lateStay(request, k, '201', D);
          const first = oracle('BR-412-01');
          await setLate(request, k.fd, st.res.id, times[0]!, num(first.expected.surchargeVnd));
          const line = liveLines(
            await getFolio(request, k.fd, st.res.folioId!),
            'late_checkout',
          )[0]!;
          const q = await requestReduction(request, k.fd, st.res.folioId!, line.id, {
            amountVnd: num(ex.input.requestedFocVnd),
            reasonCode: 'regular_vip',
          });
          expect(q.status, JSON.stringify(q.body)).toBe(201);
          expect(q.body.requiredRole).toBe(String(ex.input.approverRole));
          return { k, st, reqId: q.body.id };
        },
      );
      const second = oracle('BR-412-02');
      await setLate(request, k.fd, st.res.id, times[1]!, num(second.expected.surchargeVnd));
      const pend = await approvalById(request, k.fdl, reqId);
      expect(pend.status, 'yêu cầu đi theo dòng mới, vẫn chờ duyệt').toBe('pending');
      expect.soft(pend.effectiveAmountVnd).toBe(num(ex.expected.focAppliedVnd));
      expect.soft(pend.lineChangedNote?.cause).toBe('checkout_time_change');
      const a = await approve(request, k.fdl, reqId);
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      expect(a.body.status).toBe(String(ex.expected.requestStatus));
      const l = lateOf(await getFolio(request, k.fd, st.res.folioId!));
      expect(l.foc, 'FOC áp trên dòng mới (không "duyệt mà không áp")').toBe(
        num(ex.expected.focAppliedVnd),
      );
      expect(l.net, 'còn phải thu phần trả muộn').toBe(num(ex.expected.guestPaysVnd));
      expect(
        await remainingMonthly(request, k.fdl),
        'hạn mức tháng còn lại của lễ tân trưởng',
      ).toBe(num(ex.expected.approverRemainingVnd));
    });

    // ───────────── S4-22 / BUG-R2-060 – B12 khôi phục no-show đưa FOC về (BR-315-06) ─────────────

    test('TC-NT-049 (3) BR-315-06 FOC 300.000 đã duyệt → no-show 23:30 (tạm dừng, trả hạn mức) → khôi phục 01:30: FOC quay lại, 1.200.000, hạn mức trừ lại (S4-22)', async ({
      request,
    }) => {
      knownBug('BUG-R2-060');
      needClock('TC-NT-049');
      const ex = oracle('BR-315-06');
      const nights = Object.keys(ex.input.nightRatesVnd as Json).length;
      const [focDateO, focVnd] = Object.entries(
        ex.input.focApprovedByDateVnd as Record<string, number>,
      )[0]!;
      const { res, D, focId, remain0 } = await precondition(
        'đơn 103 2 đêm đến hôm nay (tháng lịch mới), FOC 300.000 đêm đầu đã duyệt',
        async () => {
          const D = ownMonthDay(realToday, nights + 1);
          await startDay(request, D, '10:00');
          const k = await people(request);
          const st = await makeStay(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            arrival: D,
            nights,
            pay: 'deposit',
            doc: false,
          });
          const night = addDays(D, daysBetween(String(ex.input.arrivalDate), focDateO));
          const f = await getFolio(request, k.fd, st.res.folioId!);
          const a = await approvedReduction(
            request,
            k.fd,
            k.fdl,
            st.res.folioId!,
            lineOn(f, 'room', night).id,
            {
              amountVnd: focVnd,
              reasonCode: 'service_recovery',
            },
          );
          expect((await getFolio(request, k.fd, st.res.folioId!)).totals.totalVnd).toBe(
            num(ex.expected.totalBeforeNoShowVnd),
          );
          return { res: st.res, D, focId: a.id, remain0: await remainingMonthly(request, k.fdl) };
        },
      );
      await moveTo(request, D, '23:30');
      let fd = await sessionOrSkip(request, 'qa.fd');
      const m = await action(request, fd, res.id, 'mark-no-show', {
        contactAttemptNote: 'Da goi 3 lan khong nghe may',
      });
      expect(m.status, JSON.stringify(m.body)).toBe(200);
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const fdl = await sessionOrSkip(request, 'qa.fdl');
      const sus = await approvalById(request, mgr, focId);
      expect(sus.status).toBe('approved');
      expect.soft(sus.focState).toBe(String(ex.expected.focWhileNoShow));
      expect(await remainingMonthly(request, fdl), 'no-show: FOC tạm dừng không tính hạn mức').toBe(
        (remain0 ?? 0) + focVnd,
      );
      await moveTo(request, addDays(D, 1), '01:30');
      fd = await sessionOrSkip(request, 'qa.fd');
      const r = await action(request, fd, res.id, 'restore-no-show', {
        reason: 'Khach den 01:30, phong con trong',
      });
      expect(r.status, `khôi phục trong ngày nghiệp vụ: ${JSON.stringify(r.body)}`).toBe(200);
      const f = await getFolio(request, fd, res.folioId!);
      const night = addDays(D, daysBetween(String(ex.input.arrivalDate), focDateO));
      expect(reductionOn(f, 'room', night, 'foc'), 'FOC đã duyệt quay lại').toBe(
        num((ex.expected.focByDateVnd as Json)[focDateO]),
      );
      expect(
        sum(
          (ex.expected.restoredNightDates as string[]).map((d) =>
            nightNet(f, addDays(D, daysBetween(String(ex.input.arrivalDate), d))),
          ),
        ),
        'tiền phòng phải trả sau khôi phục',
      ).toBe(num(ex.expected.roomPayableAfterRestoreVnd));
      const back = await approvalById(request, await sessionOrSkip(request, 'qa.mgr'), focId);
      expect(back.status, 'không duyệt lại').toBe(String(ex.expected.focApprovalStatus));
      expect.soft(back.focState).toBe('applied');
      expect(
        await remainingMonthly(request, await sessionOrSkip(request, 'qa.fdl')),
        'khôi phục: tính lại hạn mức',
      ).toBe(remain0);
      const ev = await moneyEventsOf(request, await sessionOrSkip(request, 'qa.mgr'), res.code, {
        from: D,
      });
      expect(ev.map((e) => e.action)).toContain('folio.foc_suspended');
      expect(ev.find((e) => e.action === 'folio.foc_restored')?.after?.from).toBe('suspended');
    });

    test('TC-NT-049 (4) BR-433-03 phần hạn mức: lễ tân trưởng duyệt giảm giá đặc biệt 300.000 (còn 1.200.000) → khách dời bỏ đêm đó → trả lại hạn mức (còn 1.500.000) (S4-18 + BUG-R2-104)', async ({
      request,
    }) => {
      knownBug('BUG-R2-059', 'BUG-R2-104');
      needClock('TC-NT-049');
      const ex = oracle('BR-433-03');
      const from = ex.input.from as Json;
      const to = ex.input.to as Json;
      const { k, res, map } = await precondition(
        'đơn 203 3 đêm từ thứ Năm (tháng lịch mới)',
        async () => {
          const D = ownMonthDay(realToday, 8);
          await startDay(request, D, '10:00');
          const k = await people(request);
          let A = addDays(D, 1);
          while (weekday(A) !== weekday(String(from.arrivalDate))) A = addDays(A, 1);
          const map = (d: string) => addDays(A, daysBetween(String(from.arrivalDate), d));
          const st = await makeStay(request, k.c, k.fd, {
            room: room(k.c, '203'),
            arrival: A,
            nights: daysBetween(String(from.arrivalDate), String(from.departureDate)),
            pay: 'deposit',
            doc: false,
          });
          return { k, res: st.res, map };
        },
      );
      // BUG-R2-104: lễ tân trưởng duyệt giảm giá đặc biệt trong hạn mức lần/tháng (BR-431 "cùng cơ chế duyệt", BR-433, rbac A36 ²⁵)
      const f = await getFolio(request, k.fd, res.folioId!);
      const q = await requestReduction(
        request,
        k.fd,
        res.folioId!,
        lineOn(f, 'room', map(String(ex.input.approvedNight))).id,
        {
          kind: 'special_discount',
          amountVnd: num(ex.input.approvedVnd),
          reasonCode: 'regular_vip',
        },
      );
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      expect(q.body.requiredRole, 'định tuyến tới vai thấp nhất đủ hạn mức (BR-432)').toBe(
        String(ex.input.approverRole),
      );
      const a = await approve(request, k.fdl, q.body.id);
      expect(a.status, `lễ tân trưởng duyệt 300.000: ${JSON.stringify(a.body)}`).toBe(200);
      expect(await remainingMonthly(request, k.fdl)).toBe(
        num(ex.expected.remainingAfterApprovalVnd),
      );
      const r = await action(request, k.fd, res.id, 'move', {
        arrivalDate: map(String(to.arrivalDate)),
        departureDate: map(String(to.departureDate)),
        reasonCode: 'guest_request',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect((await getFolio(request, k.fd, res.folioId!)).totals.totalVnd).toBe(
        num(ex.expected.folioRoomTotalVnd),
      );
      expect(await remainingMonthly(request, k.fdl), 'FOC hủy theo quy tắc trả lại hạn mức').toBe(
        num(ex.expected.remainingAfterMoveVnd),
      );
    });

    // ───────────── S4-10 / BUG-R2-038 – BR-402 v0.3.6: "đã thu đủ" sau phụ thu, FOC chờ duyệt không phải thu (BR-402-01) ─────────────

    test('TC-L3-078 BR-402-01 nhận sớm 11:00 + xin FOC phụ thu (chờ duyệt): phải thu 1.500.000 (không 1.710.000), thu trong B9 bằng checkIn.payment; duyệt → còn 0 (S4-10)', async ({
      request,
    }) => {
      knownBug('BUG-R2-038');
      needClock('TC-L3-078');
      const ex = oracle('BR-402-01');
      const foc = ex.input.focRequest as Json;
      const time = String(ex.input.checkinTime);
      const { k, st } = await precondition(
        'đơn 201 3 đêm × 700.000 đến hôm nay, cọc 600.000, có giấy tờ',
        async () => {
          const D = virtualDay(realToday, 4);
          await startDay(request, D, time);
          const k = await people(request);
          const nights = Object.keys(ex.input.nightRatesVnd as Json).length;
          const st = await makeStay(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            arrival: D,
            nights,
            pay: 'deposit',
            extra: {
              nightlyRates: Object.values(ex.input.nightRatesVnd as Record<string, number>).map(
                (v, i) => ({
                  date: addDays(D, i),
                  amountVnd: v,
                }),
              ),
              initialPayment: {
                type: 'deposit',
                method: 'cash',
                amountVnd: num(ex.input.depositPaidVnd),
              },
            },
          });
          return { k, st };
        },
      );
      const pv = await preview(request, k.fd, st.res.id, time);
      expect(pv.status, JSON.stringify(pv.body)).toBe(200);
      expect((pv.body.earlyCheckinSurcharge as Json).amountVnd).toBe(
        num(ex.input.earlySurchargeVnd),
      );
      expect(pv.body.balanceDueVnd).toBe(num(ex.expected.balanceDueBeforeCheckinVnd));
      expect(pv.body.amountDueAtCheckinVnd).toBe(num(ex.expected.amountDueAtCheckinVnd));
      const body = (payVnd: number) => ({
        checkinTime: time,
        applyEarlySurcharge: true,
        expectedSurchargeVnd: num(ex.input.earlySurchargeVnd),
        requestFocForSurcharge: {
          kind: 'foc',
          amountVnd: num(foc.requestedVnd),
          reasonCode: String(foc.reasonCode),
        },
        payment: { type: 'charge', method: 'cash', amountVnd: payVnd },
      });
      const lines0 = (await getFolio(request, k.fd, st.res.folioId!)).lines.length;
      const short = await checkIn(
        request,
        k.fd,
        st.res.id,
        body(num(ex.expected.requiredForBalancePaidVnd) - 100000),
      );
      expect(short.status, `thu thiếu: ${JSON.stringify(short.body)}`).toBe(409);
      expect(short.body.code).toBe('CHECKIN_CONDITIONS_NOT_MET');
      expect(
        (await getFolio(request, k.fd, st.res.folioId!)).lines.length,
        'không ghi gì (kể cả khoản thu)',
      ).toBe(lines0);
      const ok = await checkIn(
        request,
        k.fd,
        st.res.id,
        body(num(ex.expected.suggestedPaymentVnd)),
      );
      expect(ok.status, `thu đúng số phải thu: ${JSON.stringify(ok.body)}`).toBe(200);
      expect(ok.body.status).toBe('in_house');
      const f1 = await getFolio(request, k.fd, st.res.folioId!);
      expect(totalOf(f1, 'early_checkin')).toBe(num(ex.input.earlySurchargeVnd));
      const q = await approvalById(
        request,
        k.mgr,
        String(
          f1.lines.find((l) => l.category === 'foc' && l.approvalRequestId)?.approvalRequestId ??
            '',
        ),
      );
      expect(q.status).toBe('pending');
      const a = await approve(request, k.fdl, q.id);
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      expect((await getFolio(request, k.fd, st.res.folioId!)).totals.balanceDueVnd).toBe(
        num(ex.expected.afterApproveBalanceDueVnd),
      );
    });

    // ───────────── S4-05 / BUG-R2-057 – B14 đơn OTA đổi nhiều lần so căn gốc (BR-424-04) ─────────────

    test('TC-L4-097 BR-424-04 Agoda 203 đang ở, khách xin đổi 203 → 401 → 203 (ngày 2) → 401 (ngày 3): chênh lệch so căn gốc, đảo rồi ghi lại → 250.000 (S4-05)', async ({
      request,
    }) => {
      knownBug('BUG-R2-057');
      needClock('TC-L4-097');
      needCleanRooms('TC-L4-097');
      const ex = oracle('BR-424-04');
      const moves = ex.input.moves as Json[];
      const oA = String(ex.input.arrivalDate);
      const nights = daysBetween(oA, String(ex.input.departureDate));
      const { D, res } = await precondition(
        'đơn Agoda trả trước căn 203, 3 đêm thường, đang ở',
        async () => {
          const D = virtualDay(realToday, nights + 1);
          await startDay(request, D, '14:30');
          const k = await people(request);
          const st = await inHouse(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.originRoomNo)),
            arrival: D,
            nights,
            kind: 'agoda',
          });
          return { D, res: st.res };
        },
      );
      const map = (d: string) => addDays(D, daysBetween(oA, d));
      for (const mv of moves) {
        const day = map(String(mv.fromNight));
        await moveTo(request, day, '10:00');
        cleanRooms();
        const fd = await sessionOrSkip(request, 'qa.fd');
        const c = await s2Context(request);
        const base = {
          newRoomId: room(c, String(mv.toRoomNo)).id,
          effectiveDate: day,
          cause: 'guest_request',
          reason: 'Khach xin doi phong',
        };
        const pv = await stayAction<Json & ProblemFields>(
          request,
          fd,
          res.id,
          'change-room',
          base,
          { dryRun: true },
        );
        expect(pv.status, `changeRoom dryRun → ${mv.toRoomNo}: ${JSON.stringify(pv.body)}`).toBe(
          200,
        );
        const w = await stayAction<Reservation & ProblemFields>(
          request,
          fd,
          res.id,
          'change-room',
          {
            ...base,
            applyDifference: true,
            expectedDeltaVnd: num(pv.body.folioDeltaVnd ?? 0),
          },
        );
        expect(w.status, `changeRoom → ${mv.toRoomNo}: ${JSON.stringify(w.body)}`).toBe(200);
      }
      const fd = await sessionOrSkip(request, 'qa.fd');
      const f = await getFolio(request, fd, res.folioId!);
      for (const [d, v] of Object.entries(
        ex.expected.differenceByDateVnd as Record<string, number>,
      )) {
        expect(
          sum(linesOn(f, 'room_change_difference', map(d)).map((l) => l.amountVnd)),
          `chênh lệch đêm ${map(d)}`,
        ).toBe(v);
      }
      expect(totalOf(f, 'room_change_difference'), 'tổng chênh lệch (không cộng dồn)').toBe(
        num(ex.expected.totalDifferenceVnd),
      );
      for (const l of liveLines(f, 'room_change_difference'))
        expect(l.revenueGroup).toBe(String(ex.expected.revenueGroup));
    });

    // ───────────── S4-04 – B14 xem trước (dryRun) = lệnh ghi; FOC đi theo = min(số đã duyệt, giá mới) ─────────────

    async function b14WithFoc(
      request: APIRequestContext,
      fromNo: string,
      toNo: string,
      focVnd: number,
    ): Promise<{ res: Reservation; night: string; delta: number; before: number; after: Folio }> {
      const { D, res } = await precondition(
        `đơn ${fromNo} 2 đêm đang ở, FOC ${focVnd} đêm 2 đã duyệt`,
        async () => {
          const D = virtualDay(realToday, 3);
          await startDay(request, D, '14:30');
          const k = await people(request);
          const st = await inHouse(request, k.c, k.fd, {
            room: room(k.c, fromNo),
            arrival: D,
            nights: 2,
          });
          const f = await getFolio(request, k.fd, st.res.folioId!);
          await approvedReduction(
            request,
            k.fd,
            k.mgr,
            st.res.folioId!,
            lineOn(f, 'room', addDays(D, 1)).id,
            {
              amountVnd: focVnd,
            },
          );
          return { D, res: st.res };
        },
      );
      const night = addDays(D, 1);
      await moveTo(request, night, '10:00');
      cleanRooms();
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const before = (await getFolio(request, fd, res.folioId!)).totals.totalVnd;
      const base = {
        newRoomId: room(c, toNo).id,
        effectiveDate: night,
        cause: 'guest_request',
        reason: 'Khach xin doi phong',
      };
      const pv = await stayAction<Json & ProblemFields>(request, fd, res.id, 'change-room', base, {
        dryRun: true,
      });
      expect(pv.status, `changeRoom dryRun: ${JSON.stringify(pv.body)}`).toBe(200);
      const delta = num(pv.body.folioDeltaVnd);
      expect(typeof delta, 'ChangeRoomPreview.folioDeltaVnd').toBe('number');
      const w = await stayAction<Reservation & ProblemFields>(request, fd, res.id, 'change-room', {
        ...base,
        applyDifference: true,
        expectedDeltaVnd: delta,
      });
      expect(
        w.status,
        `changeRoom (xem trước = lệnh ghi, không 409 SURCHARGE_CHANGED): ${JSON.stringify(w.body)}`,
      ).toBe(200);
      return { res, night, delta, before, after: await getFolio(request, fd, res.folioId!) };
    }

    test('TC-L4-098 (a) BR-434-06 B14 khách xin 202 → 302 có FOC 100 % 792.000: FOC giữ 792.000, khách trả 125.000; dryRun = lệnh ghi (hồi quy)', async ({
      request,
    }) => {
      needClock('TC-L4-098');
      needCleanRooms('TC-L4-098');
      const ex = oracle('BR-434-06');
      const r = await b14WithFoc(
        request,
        String(ex.input.oldRoomNo),
        String(ex.input.newRoomNo),
        num(ex.input.focApprovedVnd),
      );
      expect(lineOn(r.after, 'room', r.night).amountVnd).toBe(num(ex.input.newNightRateVnd));
      expect(reductionOn(r.after, 'room', r.night, 'foc')).toBe(num(ex.expected.focVnd));
      expect(nightNet(r.after, r.night)).toBe(num(ex.expected.roomPayableVnd));
      expect(r.after.totals.totalVnd - r.before, 'số ghi = số xem trước').toBe(r.delta);
    });

    test('TC-L4-098 (b) B14 khách xin 302 → 202 có FOC 917.000 > giá mới 792.000: FOC = 792.000, khách trả 0; dryRun = lệnh ghi (S4-04)', async ({
      request,
    }) => {
      knownBug('S4-04');
      needClock('TC-L4-098');
      needCleanRooms('TC-L4-098');
      const ex = oracle('BR-434-06');
      // số lấy từ BR-434-06 (derived-table): 302 = 917.000, 202 = 792.000; FOC 100 % giá đêm 302
      const r = await b14WithFoc(
        request,
        String(ex.input.newRoomNo),
        String(ex.input.oldRoomNo),
        num(ex.input.newNightRateVnd),
      );
      expect(lineOn(r.after, 'room', r.night).amountVnd).toBe(num(ex.input.oldNightRateVnd));
      expect(reductionOn(r.after, 'room', r.night, 'foc'), 'FOC = min(số đã duyệt, giá mới)').toBe(
        num(ex.input.oldNightRateVnd),
      );
      expect(nightNet(r.after, r.night)).toBe(0);
      expect(r.after.totals.totalVnd - r.before, 'số ghi = số xem trước').toBe(r.delta);
    });
  },
);
