// Sprint 4 – ca tiền tự động tầng API (project "api": đơn confirmed ngày xa, không tua đồng hồ).
// Kế hoạch: rounds/round-02/qa/s4-test-plan.md mục 4–6 (T1, T2). Hợp đồng: docs/api/openapi.yaml 0.3.7 (đóng băng D1).
// Oracle: fixtures/br-examples.json (BR v0.3.6) – mọi số tiền đọc từ oracle(), cửa sổ ngày cùng thứ với ví dụ BR
// (support/s4-money.ts mapper()).
//
// Lỗi đã biết → knownBug() ở DÒNG ĐẦU ca (support/known-bugs.ts); dững dữ liệu trong precondition() nên hỏng ở đó
// là đỏ thật (bài học BUG-R2-064). PR sửa lỗi xóa mã của nó trong OPEN thì ca chuyển xanh.
//
// TC (product/tests/test-cases/r1-main-flows.md): TC-L2-084, 087, 088, 089, 091, 092, 093, 095, 099, 100;
// TC-NT-045…049 phần không cần đồng hồ; BR-434-06/07/08/09/10/11/12, BR-433-03, BUG-R2-055; B-6 `expectedVersion`.
// Phần cần đồng hồ (đang ở, no-show, trả muộn, hạn mức tháng): e2e/clock/money-s4.clock.spec.ts.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  sessionOrSkip,
  stackToday,
  uuid,
  type StaffSession,
} from '../support/api.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  action,
  addDays,
  cleanupTracked,
  fieldCodes,
  getReservation,
  nightsOf,
  oracle,
  room,
  s2Context,
  weekday,
  type Reservation,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  approve,
  dev,
  getFolio,
  liveLines,
  needDevice,
  p3,
  recordPayment,
} from '../support/s3.js';
import { patchReservation } from '../support/s3-checkin.js';
import { adjustLine } from '../support/s3-stay.js';
import {
  approvalById,
  approvedReduction,
  bookMoney,
  decideWith,
  lineOn,
  mapper,
  moneyActionSet,
  moneyEventsOf,
  move,
  moveAcked,
  myNotifications,
  nightNet,
  previewMove,
  previewThenMove,
  reductionOn,
  remap,
  requestReduction,
  sum,
  totalOf,
  type MoneyBooking,
} from '../support/s4-money.js';

// Chạy TUẦN TỰ trong tệp (một worker, theo thứ tự, ca đỏ không bỏ ca sau): nhiều ca cùng đổi sang các căn đích 101/302/401
// trong cửa sổ hôm nay + 200…360 ngày – chạy song song thì hai ca có thể giành cùng căn đích giữa lúc kiểm trống và
// lúc đổi (BE-A 17/10: TC-L2-095 và TC-L2-099 trùng 101/401). Các tệp khác vẫn song song với tệp này.
test.describe.configure({ mode: 'default' });

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;

interface Ctx {
  c: S2Context;
  today: string;
  fd: StaffSession;
  fdl: StaffSession;
  mgr: StaffSession;
}

async function ctxOf(request: APIRequestContext): Promise<Ctx> {
  const c = await s2Context(request);
  return {
    c,
    today: await stackToday(request),
    fd: await sessionOrSkip(request, 'qa.fd'),
    fdl: await sessionOrSkip(request, 'qa.fdl'),
    mgr: await sessionOrSkip(request, 'qa.mgr'),
  };
}

const roomIdOf = (r: Reservation) => r.segments?.at(-1)?.roomId;
const folioOf = (request: APIRequestContext, s: StaffSession, b: MoneyBooking) =>
  getFolio(request, s, b.folioId);
const roomTotal = (f: Awaited<ReturnType<typeof getFolio>>) => totalOf(f, 'room');

/** `PaymentCreate` cọc đúng số của ví dụ BR (tiền mặt). */
const deposit = (amountVnd: number) => ({
  initialPayment: { type: 'deposit', method: 'cash', amountVnd },
});

test.describe(
  'S4 tiền – B7 đổi căn/đổi ngày, FOC theo số đã duyệt, ESC-019 A (API)',
  { tag: ['@api', '@sprint4', '@money'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    // ───────────── S4-07 / BUG-R2-058 – phụ thu người khi B7 đổi căn khác định mức (BR-429-08) ─────────────

    test('TC-L2-084 (a) BR-429-08 kịch bản 1: FDL nâng hạng 202 → 302 (upgrade) – phụ thu người 300.000 → 0 (S4-07)', async ({
      request,
    }) => {
      knownBug('BUG-R2-058');
      const ex = oracle('BR-429-08');
      const sc = (ex.input.scenarios as Json[])[0]!;
      const { fdl, b, to } = await precondition('đơn 202, 3 người lớn, 2 đêm thường', async () => {
        const k = await ctxOf(request);
        const from = room(k.c, String(sc.fromRoomNo));
        const to = room(k.c, String(sc.toRoomNo));
        const b = await bookMoney(request, k.c, k.fd, {
          room: from,
          alsoFree: [to],
          today: k.today,
          dow: 2,
          nights: num(ex.input.nights),
          adults: num(ex.input.adults),
        });
        const f = await folioOf(request, k.fd, b);
        expect(totalOf(f, 'extra_person'), 'phụ thu người trước khi đổi').toBe(
          (ex.expected.extraPersonTotalBeforeVnd as number[])[0],
        );
        return { ...k, b, to };
      });
      const before = roomTotal(await folioOf(request, fdl, b));
      const r = await moveAcked(request, fdl, b.id, {
        roomId: to.id,
        reasonCode: String(sc.cause),
      });
      expect(r.status, `moveReservation upgrade: ${JSON.stringify(r.body)}`).toBe(200);
      expect(roomIdOf(r.body)).toBe(to.id);
      const f = await folioOf(request, fdl, b);
      expect(
        totalOf(f, 'extra_person'),
        'phụ thu người sau nâng hạng (BR-429 do OTTIMO: min)',
      ).toBe((ex.expected.extraPersonTotalAfterVnd as number[])[0]);
      expect(roomTotal(f), 'giá đêm giữ nguyên (BR-106)').toBe(before);
    });

    test('TC-L2-084 (c) BR-429-08 kịch bản 3: OTTIMO dời 302 → 202 vì sự cố – phụ thu người giữ 0 (hồi quy)', async ({
      request,
    }) => {
      const ex = oracle('BR-429-08');
      const sc = (ex.input.scenarios as Json[])[2]!;
      const k = await ctxOf(request);
      const from = room(k.c, String(sc.fromRoomNo));
      const to = room(k.c, String(sc.toRoomNo));
      const b = await bookMoney(request, k.c, k.fd, {
        room: from,
        alsoFree: [to],
        today: k.today,
        dow: 2,
        nights: num(ex.input.nights),
        adults: num(ex.input.adults),
      });
      const f0 = await folioOf(request, k.fd, b);
      expect(totalOf(f0, 'extra_person')).toBe(
        (ex.expected.extraPersonTotalBeforeVnd as number[])[2],
      );
      const r = await moveAcked(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: String(sc.cause),
      });
      expect(r.status, `moveReservation property_fault: ${JSON.stringify(r.body)}`).toBe(200);
      const f = await folioOf(request, k.fd, b);
      expect(totalOf(f, 'extra_person')).toBe(
        (ex.expected.extraPersonTotalAfterVnd as number[])[2],
      );
      expect(roomTotal(f), 'giữ giá đã chốt (BR-429 (b))').toBe(roomTotal(f0));
    });

    test('TC-L2-084 (b) + TC-L2-090 (a) BR-429-08 kịch bản 2: khách xin 302 → 202 – phụ thu người 0 → 300.000, giá căn mới (S4-07 + S4-21)', async ({
      request,
    }) => {
      knownBug('BUG-R2-058', 'S4-21');
      const ex = oracle('BR-429-08');
      const sc = (ex.input.scenarios as Json[])[1]!;
      const ex6 = oracle('BR-434-06');
      const k = await precondition('đơn 302, 3 người lớn, 2 đêm thường', async () => {
        const k = await ctxOf(request);
        const to = room(k.c, String(sc.toRoomNo));
        const b = await bookMoney(request, k.c, k.fd, {
          room: room(k.c, String(sc.fromRoomNo)),
          alsoFree: [to],
          today: k.today,
          dow: 2,
          nights: num(ex.input.nights),
          adults: num(ex.input.adults),
        });
        expect(totalOf(await folioOf(request, k.fd, b), 'extra_person')).toBe(
          (ex.expected.extraPersonTotalBeforeVnd as number[])[1],
        );
        return { ...k, b, to };
      });
      const { preview } = await previewThenMove(request, k.fd, k.b.id, {
        roomId: k.to.id,
        reasonCode: String(sc.cause),
      });
      const after = (ex.expected.extraPersonTotalAfterVnd as number[])[1]!;
      expect(preview.pricingBasis).toBe('new_room_rate');
      expect(preview.extraPersonNewVnd, 'MovePreview.extraPersonNewVnd').toBe(after);
      const f = await folioOf(request, k.fd, k.b);
      expect(totalOf(f, 'extra_person'), 'phụ thu người theo định mức căn mới').toBe(after);
      // giá Trực tiếp hiện hành 202 (BR-434-06 oldNightRateVnd) cho mọi đêm
      expect(roomTotal(f)).toBe(num(ex.input.nights) * num(ex6.input.oldNightRateVnd));
    });

    // ───────────── S4-21 – ESC-019 A: khách tự xin đổi căn trước ngày đến → giá căn mới (BR-429 v0.3.5/0.3.6) ─────────────

    test('TC-L2-087 BR-429-03 khách xin 101 → 401: xem trước 3.126.000, thiếu applyDifference 422, lưu, gửi lại cùng khóa, audit (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-03');
      const { k, b, to, map } = await precondition(
        'đơn 101 3 đêm thường, cọc 600.000; 401 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.toRoomNo));
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.fromRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
            extra: deposit(num(ex.input.depositPaidVnd)),
          });
          expect(roomTotal(await folioOf(request, k.fd, b))).toBe(
            num(ex.expected.bookedRoomTotalVnd),
          );
          return { k, b, to, map: mapper(String(ex.input.arrivalDate), b.arrivalDate) };
        },
      );
      const newRates = remap(ex.expected.newNightRatesVnd as Record<string, number>, map);
      // 1. xem trước – không ghi gì
      const v0 = (await getReservation(request, k.fd, b.id)).body.version;
      const lines0 = (await folioOf(request, k.fd, b)).lines.length;
      const p = await previewMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      expect(p.status, `previewMoveReservation: ${JSON.stringify(p.body)}`).toBe(200);
      expect(p.body.pricingBasis).toBe('new_room_rate');
      expect(Object.fromEntries((p.body.nights ?? []).map((n) => [n.date, n.newRateVnd]))).toEqual(
        newRates,
      );
      expect(p.body.roomTotalOldVnd).toBe(num(ex.expected.bookedRoomTotalVnd));
      expect(p.body.roomTotalNewVnd).toBe(num(ex.expected.newRoomTotalVnd));
      expect(p.body.folioDeltaVnd).toBe(num(ex.expected.differenceVnd));
      expect(p.body.depositPaidVnd).toBe(num(ex.expected.depositAfterMoveVnd));
      expect(p.body.balanceDueAfterVnd).toBe(num(ex.expected.balanceDueAtCheckInVnd));
      expect((await getReservation(request, k.fd, b.id)).body.version, 'xem trước không ghi').toBe(
        v0,
      );
      expect((await folioOf(request, k.fd, b)).lines.length).toBe(lines0);
      // 3. thiếu / false "Đã báo khách" → 422 REQUIRED (field applyDifference), đơn giữ 101
      for (const body of [
        { roomId: to.id, reasonCode: 'guest_request' },
        { roomId: to.id, reasonCode: 'guest_request', applyDifference: false },
      ]) {
        const r = await move(request, k.fd, b.id, body);
        expect(r.status, `thiếu applyDifference: ${JSON.stringify(r.body)}`).toBe(422);
        expect(fieldCodes(r.body)).toContain('applyDifference:REQUIRED');
      }
      expect(roomIdOf((await getReservation(request, k.fd, b.id)).body)).not.toBe(to.id);
      // 4. lưu với expectedDeltaVnd = folioDeltaVnd, khóa K1; 5. gửi lại y hệt
      const key = uuid();
      const version = (await getReservation(request, k.fd, b.id)).body.version;
      const body = {
        roomId: to.id,
        reasonCode: 'guest_request',
        applyDifference: true,
        expectedDeltaVnd: p.body.folioDeltaVnd,
      };
      const w = await move(request, k.fd, b.id, body, { idempotencyKey: key, version });
      expect(w.status, `moveReservation: ${JSON.stringify(w.body)}`).toBe(200);
      expect(w.body.status).toBe('confirmed');
      expect(roomIdOf(w.body)).toBe(to.id);
      const f1 = await folioOf(request, k.fd, b);
      const again = await move(request, k.fd, b.id, body, { idempotencyKey: key, version });
      expect(again.status, 'gửi lại cùng Idempotency-Key').toBe(200);
      const f = await folioOf(request, k.fd, b);
      expect(f.lines.length, 'gửi lại không ghi folio lần hai').toBe(f1.lines.length);
      expect(roomTotal(f)).toBe(num(ex.expected.newRoomTotalVnd));
      for (const [d, v] of Object.entries(newRates)) expect(lineOn(f, 'room', d).amountVnd).toBe(v);
      expect(f.totals.paidVnd, 'cọc giữ nguyên, không đòi cọc bổ sung').toBe(
        num(ex.expected.depositAfterMoveVnd),
      );
      expect(f.totals.balanceDueVnd).toBe(num(ex.expected.balanceDueAtCheckInVnd));
      // 6. audit money reservation.room_change_repriced (tập đóng)
      const ev = await moneyEventsOf(request, k.mgr, b.code, { from: k.today });
      expect(ev.map((e) => e.action)).toContain('reservation.room_change_repriced');
      for (const e of ev) expect(moneyActionSet().has(e.action), e.action).toBe(true);
    });

    test('TC-L2-088 (a) BR-429-04 khách xin xuống 401 → 101: −1.125.000, cọc 900.000 giữ, còn thu 1.101.000 (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-04');
      const { k, b, to } = await precondition(
        'đơn 401 3 đêm thường, cọc 900.000; 101 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.toRoomNo));
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.fromRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
            extra: deposit(num(ex.input.depositPaidVnd)),
          });
          expect(roomTotal(await folioOf(request, k.fd, b))).toBe(
            num(ex.expected.bookedRoomTotalVnd),
          );
          return { k, b, to };
        },
      );
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      expect(preview.folioDeltaVnd).toBe(num(ex.expected.differenceVnd));
      expect(preview.balanceDueAfterVnd).toBe(num(ex.expected.balanceDueAtCheckInVnd));
      const f = await folioOf(request, k.fd, b);
      expect(roomTotal(f)).toBe(num(ex.expected.newRoomTotalVnd));
      expect(f.totals.paidVnd).toBe(num(ex.expected.depositAfterMoveVnd));
      expect(f.totals.balanceDueVnd).toBe(num(ex.expected.balanceDueAtCheckInVnd));
    });

    test('TC-L2-089 BR-429-05 đơn 7 đêm 202 → 302: lịch giá 302 rồi áp lại −10 % → 6.025.000 (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-05');
      const { k, b, to, map } = await precondition(
        'đơn 202 7 đêm (có T6, T7) = 5.205.000; 302 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.toRoomNo));
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.fromRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
          });
          expect(roomTotal(await folioOf(request, k.fd, b))).toBe(num(ex.input.bookedRoomTotalVnd));
          return { k, b, to, map: mapper(String(ex.input.arrivalDate), b.arrivalDate) };
        },
      );
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      const newRates = remap(ex.expected.newNightRatesVnd as Record<string, number>, map);
      expect(preview.roomTotalNewVnd).toBe(num(ex.expected.newRoomTotalVnd));
      expect(preview.folioDeltaVnd).toBe(num(ex.expected.differenceVnd));
      const f = await folioOf(request, k.fd, b);
      for (const [d, v] of Object.entries(newRates))
        expect(lineOn(f, 'room', d).amountVnd, d).toBe(v);
      expect(roomTotal(f)).toBe(num(ex.expected.newRoomTotalVnd));
    });

    test('TC-L2-091 (a)(d) xem trước rồi số đổi: lưu với số cũ → 409 SURCHARGE_CHANGED; thiếu expectedDeltaVnd → 422 (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-03');
      const { k, b, to } = await precondition('đơn 101 3 đêm thường; 401 trống', async () => {
        const k = await ctxOf(request);
        const to = room(k.c, String(ex.input.toRoomNo));
        const b = await bookMoney(request, k.c, k.fd, {
          room: room(k.c, String(ex.input.fromRoomNo)),
          alsoFree: [to],
          today: k.today,
          dow: weekday(String(ex.input.arrivalDate)),
          nights: 3,
        });
        return { k, b, to };
      });
      const v0 = (await getReservation(request, k.fd, b.id)).body.version;
      const stale = await move(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
        applyDifference: true,
        expectedDeltaVnd: num(ex.expected.differenceVnd) - 125000,
      });
      expect(stale.status, `số cũ: ${JSON.stringify(stale.body)}`).toBe(409);
      expect(stale.body.code).toBe('SURCHARGE_CHANGED');
      expect((stale.body as Json).surchargeVnd).toBe(num(ex.expected.differenceVnd));
      const noExpected = await move(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
        applyDifference: true,
      });
      expect(noExpected.status, `thiếu expectedDeltaVnd: ${JSON.stringify(noExpected.body)}`).toBe(
        422,
      );
      expect(fieldCodes(noExpected.body).some((x) => x.endsWith(':REQUIRED'))).toBe(true);
      const cur = (await getReservation(request, k.fd, b.id)).body;
      expect(cur.version, 'không ghi gì').toBe(v0);
      expect(roomIdOf(cur)).not.toBe(to.id);
    });

    test('TC-L2-091 (c) khách xin 202 → 203 giá bằng nhau: applyDifference vẫn bắt buộc khi chênh 0 (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const { k, b, to } = await precondition('đơn 202 2 đêm thường; 203 trống', async () => {
        const k = await ctxOf(request);
        const to = room(k.c, '203');
        const b = await bookMoney(request, k.c, k.fd, {
          room: room(k.c, '202'),
          alsoFree: [to],
          today: k.today,
          dow: 2,
          nights: 2,
        });
        return { k, b, to };
      });
      const r = await move(request, k.fd, b.id, { roomId: to.id, reasonCode: 'guest_request' });
      expect(r.status, JSON.stringify(r.body)).toBe(422);
      expect(fieldCodes(r.body)).toContain('applyDifference:REQUIRED');
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      expect(preview.folioDeltaVnd).toBe(0);
    });

    test('TC-L2-092 (a) BR-429-06 OTTIMO dời 202 → 401 (property_fault): giữ 2.376.000, không dòng nào ghi lại (hồi quy)', async ({
      request,
    }) => {
      const ex = oracle('BR-429-06');
      const k = await ctxOf(request);
      const to = room(k.c, String(ex.input.toRoomNo));
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, String(ex.input.fromRoomNo)),
        alsoFree: [to],
        today: k.today,
        dow: weekday(String(ex.input.arrivalDate)),
        nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
      });
      const f0 = await folioOf(request, k.fd, b);
      const ids0 = liveLines(f0, 'room')
        .map((l) => l.id)
        .sort();
      const r = await moveAcked(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: String(ex.input.cause),
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(roomIdOf(r.body)).toBe(to.id);
      const f = await folioOf(request, k.fd, b);
      expect(roomTotal(f)).toBe(num(ex.expected.newRoomTotalVnd));
      expect(
        liveLines(f, 'room')
          .map((l) => l.id)
          .sort(),
        'không dòng phòng nào bị đảo/ghi lại',
      ).toEqual(ids0);
    });

    test('TC-L2-092 (a)(c) BR-429-06 xem trước lý do do OTTIMO: keep_booked_rate, chênh 0 – lưu không cần tick; expectedDeltaVnd gửi sai → 409 SURCHARGE_CHANGED (S4-21, DOM-S4-19)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-06');
      const { k, b, to, map } = await precondition('đơn 202 3 đêm thường; 401 trống', async () => {
        const k = await ctxOf(request);
        const to = room(k.c, String(ex.input.toRoomNo));
        const b = await bookMoney(request, k.c, k.fd, {
          room: room(k.c, String(ex.input.fromRoomNo)),
          alsoFree: [to],
          today: k.today,
          dow: weekday(String(ex.input.arrivalDate)),
          nights: 3,
        });
        return { k, b, to, map: mapper(String(ex.input.arrivalDate), b.arrivalDate) };
      });
      const p = await previewMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'property_fault',
      });
      expect(p.status, JSON.stringify(p.body)).toBe(200);
      expect(p.body.pricingBasis).toBe('keep_booked_rate');
      expect(p.body.folioDeltaVnd).toBe(num(ex.expected.differenceVnd));
      const booked = remap(ex.input.bookedNightRatesVnd as Record<string, number>, map);
      for (const n of p.body.nights ?? []) {
        expect(n.oldRateVnd).toBe(booked[n.date]);
        expect(n.newRateVnd).toBe(booked[n.date]);
      }
      // (c) DOM-S4-19 (OpenAPI moveReservation 0.3.8): `expectedDeltaVnd` đã gửi thì LUÔN được so, kể cả khi không
      // bắt buộc tick – số lệch (1.125.000 của khách tự xin) → 409 SURCHARGE_CHANGED, đơn giữ căn cũ
      const stale = await move(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'property_fault',
        applyDifference: true,
        expectedDeltaVnd: 1125000,
      });
      expect(stale.status, `expectedDeltaVnd lệch: ${JSON.stringify(stale.body)}`).toBe(409);
      expect(stale.body.code).toBe('SURCHARGE_CHANGED');
      expect(roomIdOf((await getReservation(request, k.fd, b.id)).body)).not.toBe(to.id);
      // chênh 0, lý do do OTTIMO: không tick vẫn lưu được ("applyDifference bỏ qua" chỉ còn đúng khi chênh 0)
      const w = await move(request, k.fd, b.id, { roomId: to.id, reasonCode: 'property_fault' });
      expect(w.status, `property_fault chênh 0, không tick: ${JSON.stringify(w.body)}`).toBe(200);
      expect(roomTotal(await folioOf(request, k.fd, b))).toBe(num(ex.expected.newRoomTotalVnd));
    });

    test('TC-L2-093 (a)(c)(e) quyền và lý do khi đổi căn: FD upgrade 403, other không ghi chú 422, other sang căn rẻ hơn giữ giá (hồi quy)', async ({
      request,
    }) => {
      const k = await ctxOf(request);
      const ex = oracle('BR-429-06');
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '202'),
        alsoFree: [room(k.c, '401'), room(k.c, '101')],
        today: k.today,
        dow: 2,
        nights: 3,
      });
      const up = await move(request, k.fd, b.id, {
        roomId: room(k.c, '401').id,
        reasonCode: 'upgrade',
      });
      expect(up.status, JSON.stringify(up.body)).toBe(403);
      expect(up.body.code).toBe('FORBIDDEN_ACTION');
      const noNote = await move(request, k.fd, b.id, {
        roomId: room(k.c, '101').id,
        reasonCode: 'other',
      });
      expect(noNote.status, JSON.stringify(noNote.body)).toBe(422);
      expect(JSON.stringify(noNote.body)).toContain('REASON_REQUIRED');
      const cheaper = await moveAcked(request, k.fd, b.id, {
        roomId: room(k.c, '101').id,
        reasonCode: 'other',
        note: 'Khach doi y, OTTIMO sap lai can',
      });
      expect(cheaper.status, JSON.stringify(cheaper.body)).toBe(200);
      expect(roomTotal(await folioOf(request, k.fd, b)), 'other giữ giá (không giảm)').toBe(
        num(ex.expected.newRoomTotalVnd),
      );
    });

    test('TC-L2-093 (b) FD `other` sang căn giá cao hơn → 403 cả xem trước và lưu (chỉ FDL+ như upgrade) (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const { k, b, to } = await precondition('đơn 202 3 đêm thường; 401 trống', async () => {
        const k = await ctxOf(request);
        const to = room(k.c, '401');
        const b = await bookMoney(request, k.c, k.fd, {
          room: room(k.c, '202'),
          alsoFree: [to],
          today: k.today,
          dow: 2,
          nights: 3,
        });
        return { k, b, to };
      });
      const p = await previewMove(request, k.fd, b.id, { roomId: to.id, reasonCode: 'other' });
      expect(p.status, JSON.stringify(p.body)).toBe(403);
      const w = await move(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'other',
        note: 'Khach muon can rong hon',
      });
      expect(w.status, JSON.stringify(w.body)).toBe(403);
      expect(w.body.code).toBe('FORBIDDEN_ACTION');
      const ok = await moveAcked(request, k.fdl, b.id, {
        roomId: to.id,
        reasonCode: 'other',
        note: 'Khach muon can rong hon',
      });
      expect(ok.status, `FDL: ${JSON.stringify(ok.body)}`).toBe(200);
    });

    test('TC-L2-095 BR-429-07 Agoda 203 khách nhắn OTTIMO xin 401 → 302 → 101: chênh lệch 500.000 → 250.000 → 0, không cộng dồn (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-07');
      const seq = ex.input.moveSequence as string[];
      const { k, b } = await precondition(
        'đơn Agoda trả trước căn 203, 2 đêm thường; 401, 302, 101 trống',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.originRoomNo)),
            alsoFree: seq.map((n) => room(k.c, n)),
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
            kind: 'agoda',
          });
          return { k, b };
        },
      );
      const f0 = await folioOf(request, k.fd, b);
      const otaRoom = roomTotal(f0);
      const otaPaid = f0.totals.paidViaOtaVnd ?? f0.totals.paidVnd;
      const diffs = ex.expected.differenceAfterEachMoveVnd as number[];
      for (const [i, no] of seq.entries()) {
        const { preview } = await previewThenMove(request, k.fd, b.id, {
          roomId: room(k.c, no).id,
          reasonCode: 'guest_request',
        });
        expect(preview.roomChangeDifferenceVnd, `xem trước ${no}`).toBe(diffs[i]);
        const f = await folioOf(request, k.fd, b);
        expect(totalOf(f, 'room_change_difference'), `chênh lệch sống sau khi sang ${no}`).toBe(
          diffs[i],
        );
        expect(roomTotal(f), 'tiền phòng OTA không đổi').toBe(otaRoom);
        expect(f.totals.paidViaOtaVnd ?? f.totals.paidVnd, '"Đã thu qua OTA" không đổi').toBe(
          otaPaid,
        );
        for (const l of liveLines(f, 'room_change_difference')) {
          expect(l.revenueGroup, 'BR-904 doanh thu phòng').toBe(String(ex.expected.revenueGroup));
        }
      }
    });

    test('TC-L2-099 (a)(b) BR-429-09 giá thỏa thuận 600.000 căn 101, khách xin 401 → lịch giá 401 = 3.126.000, không tự mang giá thỏa thuận (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-09');
      const g = ex.expected.guestRequest as Json;
      const { k, b, to, map } = await precondition(
        'đơn 101 3 đêm giá thỏa thuận 600.000, cọc 500.000; 401 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.toRoomNo));
          const rates = Object.values(ex.input.bookedNightRatesVnd as Record<string, number>);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.fromRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: rates.length,
            rate: rates[0],
            extra: deposit(num(ex.input.depositPaidVnd)),
          });
          expect(roomTotal(await folioOf(request, k.fd, b))).toBe(
            num(ex.expected.bookedRoomTotalVnd),
          );
          return { k, b, to, map: mapper(String(ex.input.arrivalDate), b.arrivalDate) };
        },
      );
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      const newRates = remap(g.newNightRatesVnd as Record<string, number>, map);
      expect(preview.pricingBasis).toBe('new_room_rate');
      expect(Object.fromEntries((preview.nights ?? []).map((n) => [n.date, n.newRateVnd]))).toEqual(
        newRates,
      );
      expect(preview.folioDeltaVnd).toBe(num(g.differenceVnd));
      expect(preview.balanceDueAfterVnd).toBe(num(g.balanceDueAtCheckInVnd));
      const f = await folioOf(request, k.fd, b);
      expect(roomTotal(f)).toBe(num(g.newRoomTotalVnd));
      expect(f.totals.balanceDueVnd).toBe(num(g.balanceDueAtCheckInVnd));
    });

    test('TC-L2-099 (c) BR-429-09 OTTIMO giữ ưu đãi: lễ tân sửa giá đêm căn mới 937.000 (adjustFolioLine) → 2.811.000 (S4-21 + S4-35)', async ({
      request,
    }) => {
      // S4-35 (setNightRate, BE-A phần A + BE-B phần B) đã xanh trên cây làm việc 17/10 20:18 – QA bỏ khỏi ca; dòng S4-35
      // còn trong OPEN chỉ để patch B-6 áp đúng ngữ cảnh, ORC/BE-B xóa sau khi áp
      knownBug('S4-21');
      const ex = oracle('BR-429-09');
      const keep = ex.expected.deskKeepsDeal as Json;
      const { k, b, to } = await precondition(
        'đơn 101 giá thỏa thuận 600.000, cọc 500.000; 401 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.toRoomNo));
          const rates = Object.values(ex.input.bookedNightRatesVnd as Record<string, number>);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.fromRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: rates.length,
            rate: rates[0],
            extra: deposit(num(ex.input.depositPaidVnd)),
          });
          return { k, b, to };
        },
      );
      await previewThenMove(request, k.fd, b.id, { roomId: to.id, reasonCode: 'guest_request' });
      for (const line of liveLines(await folioOf(request, k.fd, b), 'room')) {
        const r = await adjustLine(request, k.fd, b.folioId, line.id, {
          newUnitPriceVnd: num(keep.nightRateVnd),
          reason: 'Giu uu dai thoa thuan',
        });
        expect(r.status, `adjustFolioLine ${line.serviceDate}: ${JSON.stringify(r.body)}`).toBe(
          201,
        );
      }
      const f = await folioOf(request, k.fd, b);
      expect(roomTotal(f)).toBe(num(keep.newRoomTotalVnd));
      expect(f.totals.balanceDueVnd).toBe(num(keep.balanceDueAtCheckInVnd));
    });

    test('TC-L2-099 (d) BR-429-09 OTTIMO dời 101 → 401 (property_fault): giữ giá thỏa thuận 1.800.000 (hồi quy)', async ({
      request,
    }) => {
      const ex = oracle('BR-429-09');
      const o = ex.expected.ottimoCause as Json;
      const k = await ctxOf(request);
      const to = room(k.c, String(ex.input.toRoomNo));
      const rates = Object.values(ex.input.bookedNightRatesVnd as Record<string, number>);
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, String(ex.input.fromRoomNo)),
        alsoFree: [to],
        today: k.today,
        dow: weekday(String(ex.input.arrivalDate)),
        nights: rates.length,
        rate: rates[0],
      });
      const r = await moveAcked(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: String(o.cause),
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(roomTotal(await folioOf(request, k.fd, b))).toBe(num(o.newRoomTotalVnd));
    });

    test('TC-L2-100 BR-429-10 đơn dài hạn nhập tay 202 → 302 (guest_request): external_contract, chênh 0, giữ 9.500.000/tháng (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-429-10');
      const { k, b, to } = await precondition(
        'đơn nhập tay 202 01/11–01/12, 9.500.000/tháng; 302 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.toRoomNo));
          const nights = nightsOf(
            String(ex.input.arrivalDate),
            String(ex.input.departureDate),
          ).length;
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.fromRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights,
            extra: {
              manualLongStay: {
                monthlyRentVnd: num(ex.input.monthlyAmountVnd),
                externalContractRef: 'HĐ-2026-031',
                depositHeldVnd: num(ex.input.monthlyAmountVnd),
              },
            },
          });
          expect(b.stayType).toBe('long');
          return { k, b, to };
        },
      );
      const lines0 = (await folioOf(request, k.fd, b)).lines.length;
      const p = await previewMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      expect(p.status, JSON.stringify(p.body)).toBe(200);
      expect(p.body.pricingBasis).toBe('external_contract');
      expect(p.body.folioDeltaVnd).toBe(num(ex.expected.previewDifferenceVnd));
      expect((p.body.warnings ?? []).map((w) => w.code)).not.toContain('MANUAL_RATE_REPRICED');
      const w = await move(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
        applyDifference: true,
        expectedDeltaVnd: 0,
      });
      expect(w.status, JSON.stringify(w.body)).toBe(200);
      expect(w.body.stayType).toBe('long');
      expect((w.body.manualLongStay as Json | undefined)?.monthlyRentVnd).toBe(
        num(ex.expected.monthlyAmountAfterMoveVnd),
      );
      const f = await folioOf(request, k.fd, b);
      expect(f.lines.length, 'không dòng room/room_change_difference mới').toBe(lines0);
      const noReason = await action(request, k.fd, b.id, 'move', {
        roomId: room(k.c, String(ex.input.fromRoomNo)).id,
      });
      expect(noReason.status, `reasonCode vẫn bắt buộc: ${JSON.stringify(noReason.body)}`).toBe(
        422,
      );
    });

    // ───────────── BR-434-06 – FOC đi theo khi B7 đổi căn (S4-21) ─────────────

    test('BR-434-06 B7 khách xin 202 → 302 có FOC 100 % 792.000: FOC giữ 792.000, khách trả 125.000, xem trước = lệnh ghi (S4-21)', async ({
      request,
    }) => {
      knownBug('S4-21');
      const ex = oracle('BR-434-06');
      const { k, b, to, night, focId } = await precondition(
        'đơn 202 1 đêm thường, FOC 100 % đã duyệt; 302 trống',
        async () => {
          const k = await ctxOf(request);
          const to = room(k.c, String(ex.input.newRoomNo));
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.oldRoomNo)),
            alsoFree: [to],
            today: k.today,
            dow: 2,
            nights: 1,
          });
          const night = b.arrivalDate;
          const f = await folioOf(request, k.fd, b);
          expect(lineOn(f, 'room', night).amountVnd).toBe(num(ex.input.oldNightRateVnd));
          const a = await approvedReduction(
            request,
            k.fd,
            k.mgr,
            b.folioId,
            lineOn(f, 'room', night).id,
            {
              amountVnd: num(ex.input.focApprovedVnd),
            },
          );
          return { k, b, to, night, focId: a.id };
        },
      );
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'guest_request',
      });
      const n = (preview.nights ?? []).find((x) => x.date === night);
      expect(n?.newRateVnd).toBe(num(ex.input.newNightRateVnd));
      expect(n?.focVnd).toBe(num(ex.expected.b7GuestRequestFocVnd));
      const f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc')).toBe(num(ex.expected.b7GuestRequestFocVnd));
      expect(nightNet(f, night)).toBe(num(ex.expected.b7GuestRequestRoomPayableVnd));
      const a = await approvalById(request, k.mgr, focId);
      expect(a.status, 'không duyệt lại').toBe('approved');
      expect.soft(a.focState).toBe('applied');
    });

    test('BR-434-06 B7 OTTIMO dời 202 → 302 (property_fault) có FOC 100 %: FOC giữ, khách trả 0, không dòng nào đổi (hồi quy)', async ({
      request,
    }) => {
      const ex = oracle('BR-434-06');
      const k = await ctxOf(request);
      const to = room(k.c, String(ex.input.newRoomNo));
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, String(ex.input.oldRoomNo)),
        alsoFree: [to],
        today: k.today,
        dow: 2,
        nights: 1,
      });
      const night = b.arrivalDate;
      const f0 = await folioOf(request, k.fd, b);
      await approvedReduction(request, k.fd, k.mgr, b.folioId, lineOn(f0, 'room', night).id, {
        amountVnd: num(ex.input.focApprovedVnd),
      });
      const ids0 = (await folioOf(request, k.fd, b)).lines.map((l) => l.id).sort();
      const r = await moveAcked(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'property_fault',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc')).toBe(num(ex.expected.b7OttimoCauseFocVnd));
      expect(nightNet(f, night)).toBe(num(ex.expected.b7OttimoCauseRoomPayableVnd));
      expect(f.lines.map((l) => l.id).sort(), 'không dòng nào đổi').toEqual(ids0);
    });

    // ───────────── S4-02 / BUG-R2-056 – FOC theo số ĐÃ DUYỆT (BR-434-07/08) ─────────────

    test('TC-NT-047 phần S4-02 BR-434-07 FOC 100 % đêm 402: giá 1.000.000 → 900.000 (7 đêm) → 1.000.000 (6 đêm) – FOC khôi phục theo số đã duyệt (S4-02)', async ({
      request,
    }) => {
      knownBug('BUG-R2-056');
      const ex = oracle('BR-434-07');
      const rates = ex.input.nightRateSequenceVnd as number[];
      const focs = ex.expected.focSequenceVnd as number[];
      const { k, b, night, focId } = await precondition(
        'đơn 402 6 đêm từ thứ Hai, FOC 1.000.000 đêm thứ Ba đã duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            today: k.today,
            dow: 1,
            nights: 6,
            span: 7,
          });
          const night = addDays(b.arrivalDate, 1);
          const f = await folioOf(request, k.fd, b);
          expect(lineOn(f, 'room', night).amountVnd).toBe(rates[0]);
          const a = await approvedReduction(
            request,
            k.fd,
            k.mgr,
            b.folioId,
            lineOn(f, 'room', night).id,
            {
              amountVnd: num(ex.input.approvedFocVnd),
            },
          );
          return { k, b, night, focId: a.id };
        },
      );
      const steps = [addDays(b.arrivalDate, 7), addDays(b.arrivalDate, 6)];
      for (const [i, departureDate] of steps.entries()) {
        const r = await moveAcked(request, k.fd, b.id, {
          departureDate,
          reasonCode: 'guest_request',
        });
        expect(r.status, `đổi ngày đi ${departureDate}: ${JSON.stringify(r.body)}`).toBe(200);
        const f = await folioOf(request, k.fd, b);
        expect(lineOn(f, 'room', night).amountVnd, `giá đêm bước ${i + 1}`).toBe(rates[i + 1]);
        expect(reductionOn(f, 'room', night, 'foc'), `FOC bước ${i + 1}`).toBe(focs[i + 1]);
        expect(nightNet(f, night), 'khách trả 0 cho đêm FOC').toBe(
          (ex.expected.guestPaysSequenceVnd as number[])[i + 1],
        );
        const a = await approvalById(request, k.mgr, focId);
        expect(a.status, 'không duyệt lại').toBe('approved');
        expect(a.amountVnd, 'số đã duyệt không đổi').toBe(num(ex.input.approvedFocVnd));
        expect.soft(a.focState).toBe('applied');
        expect.soft(a.effectiveAmountVnd, 'effectiveAmountVnd = số đang áp').toBe(focs[i + 1]);
      }
    });

    test('BUG-R2-055 (S4-01) đơn CTV có người chốt, FOC 1.000.000 > giá đêm mới 900.000 sau khi kéo 7 đêm: 200, FOC 900.000, không 500', async ({
      request,
    }) => {
      knownBug('BUG-R2-055');
      const ex = oracle('BR-434-07');
      const { k, b, night } = await precondition(
        'đơn CTV 402 6 đêm, người chốt qa.ctv1, FOC 100 % đêm thứ Ba',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            today: k.today,
            dow: 1,
            nights: 6,
            span: 7,
            kind: 'agent',
          });
          const night = addDays(b.arrivalDate, 1);
          const f = await folioOf(request, k.fd, b);
          await approvedReduction(request, k.fd, k.mgr, b.folioId, lineOn(f, 'room', night).id, {
            amountVnd: num(ex.input.approvedFocVnd),
          });
          return { k, b, night };
        },
      );
      const r = await moveAcked(request, k.fd, b.id, {
        departureDate: addDays(b.arrivalDate, 7),
        reasonCode: 'guest_request',
      });
      expect(r.status, `kéo 7 đêm (không 500 INTERNAL_ERROR): ${JSON.stringify(r.body)}`).toBe(200);
      const f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc')).toBe(
        (ex.expected.focSequenceVnd as number[])[1],
      );
      expect(nightNet(f, night)).toBe(0);
    });

    test('TC-NT-049 (2) BR-434-08 FOC phụ thu người căn 302: 4 NL → 3 NL + 1 trẻ → 2 NL (ngủ) → 4 NL (khôi phục 150.000) (S4-02)', async ({
      request,
    }) => {
      knownBug('BUG-R2-056');
      const ex = oracle('BR-434-08');
      const per = ex.expected.extraPersonPerNightSequenceVnd as number[];
      const focs = ex.expected.focOnJan20SequenceVnd as number[];
      const states = ex.expected.focStateSequence as string[];
      const totals = ex.expected.totalSequenceVnd as number[];
      const parties = [
        { adults: 4, children6to11: 0 },
        { adults: 3, children6to11: 1 },
        { adults: 2, children6to11: 0 },
        { adults: 4, children6to11: 0 },
      ];
      const { k, b, night, focId } = await precondition(
        'đơn 302 3 đêm thường, 4 người lớn, FOC 150.000 phụ thu đêm giữa',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
            adults: 4,
          });
          const map = mapper(String(ex.input.arrivalDate), b.arrivalDate);
          const [focDate, focVnd] = Object.entries(
            ex.input.focApprovedByDateVnd as Record<string, number>,
          )[0]!;
          const night = map(focDate);
          const f = await folioOf(request, k.fd, b);
          expect(lineOn(f, 'extra_person', night).amountVnd).toBe(per[0]);
          expect(f.totals.totalVnd, 'tổng trước FOC').toBe(totals[0]! + focVnd);
          const a = await approvedReduction(
            request,
            k.fd,
            k.mgr,
            b.folioId,
            lineOn(f, 'extra_person', night).id,
            {
              amountVnd: focVnd,
            },
          );
          expect((await folioOf(request, k.fd, b)).totals.totalVnd).toBe(totals[0]);
          return { k, b, night, focId: a.id };
        },
      );
      for (let i = 1; i < parties.length; i++) {
        const cur = (await getReservation(request, k.fd, b.id)).body;
        const r = await patchReservation(request, k.fd, b.id, cur.version, parties[i]!);
        expect(
          r.status,
          `sửa số khách ${JSON.stringify(parties[i])}: ${JSON.stringify(r.body)}`,
        ).toBe(200);
        const f = await folioOf(request, k.fd, b);
        const extra = liveLines(f, 'extra_person').filter((l) => l.serviceDate === night);
        expect(sum(extra.map((l) => l.amountVnd)), `phụ thu người đêm FOC – bước ${i}`).toBe(
          per[i],
        );
        expect(reductionOn(f, 'extra_person', night, 'foc'), `FOC – bước ${i}`).toBe(focs[i]);
        expect(f.totals.totalVnd, `tổng – bước ${i}`).toBe(totals[i]);
        const a = await approvalById(request, k.mgr, focId);
        expect(a.status).toBe('approved');
        expect.soft(a.focState, `focState – bước ${i}`).toBe(states[i]);
      }
      const ev = (await moneyEventsOf(request, k.mgr, b.code, { from: k.today })).map(
        (e) => e.action,
      );
      expect(ev).toContain('folio.foc_dormant');
      expect(ev).toContain('folio.foc_restored');
    });

    // ───────────── S4-18 / BUG-R2-059 – FOC chờ duyệt khi dòng bị ghi lại; FOC hủy theo quy tắc ─────────────

    test('TC-NT-046 phần B7 BR-434-09 FOC 300.000 chờ duyệt, kéo 203 thành 7 đêm (−10 %): yêu cầu đi theo dòng mới, duyệt → 4.905.000 (S4-18)', async ({
      request,
    }) => {
      knownBug('BUG-R2-059');
      const ex = oracle('BR-434-09');
      const { k, b, night, reqId, map } = await precondition(
        'đơn 203 3 đêm từ thứ Hai, FOC 300.000 đêm thứ Ba chờ duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            today: k.today,
            dow: weekday((ex.input.from as Json).arrivalDate as string),
            nights: 3,
            span: 7,
          });
          const map = mapper((ex.input.from as Json).arrivalDate as string, b.arrivalDate);
          const night = map(String(ex.input.requestNight));
          const f = await folioOf(request, k.fd, b);
          const q = await requestReduction(request, k.fd, b.folioId, lineOn(f, 'room', night).id, {
            amountVnd: num(ex.input.requestedFocVnd),
          });
          expect(q.status, JSON.stringify(q.body)).toBe(201);
          expect(q.body.status).toBe('pending');
          return { k, b, night, reqId: q.body.id, map };
        },
      );
      const r = await moveAcked(request, k.fd, b.id, {
        departureDate: map((ex.input.to as Json).departureDate as string),
        reasonCode: 'guest_request',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const f1 = await folioOf(request, k.fd, b);
      for (const [d, v] of Object.entries(
        remap(ex.input.nightRatesAfterVnd as Record<string, number>, map),
      )) {
        expect(lineOn(f1, 'room', d).amountVnd, `giá đêm ${d} sau khi kéo 7 đêm`).toBe(v);
      }
      const pend = await approvalById(request, k.mgr, reqId);
      expect(pend.status, 'yêu cầu đi theo dòng mới, vẫn chờ duyệt').toBe('pending');
      expect.soft(pend.effectiveAmountVnd).toBe(num(ex.expected.focAppliedVnd));
      const note = ex.expected.requestNoteRateVnd as Json;
      expect.soft(pend.lineChangedNote?.oldLineVnd).toBe(num(note.old));
      expect.soft(pend.lineChangedNote?.newLineVnd).toBe(num(note.new));
      const a = await approve(request, k.mgr, reqId);
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      expect(a.body.status).toBe(String(ex.expected.requestStatus));
      const f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc'), 'FOC áp trên dòng mới').toBe(
        num(ex.expected.focAppliedVnd),
      );
      expect(f.totals.totalVnd).toBe(num(ex.expected.roomPayableVnd));
      expect.soft((await approvalById(request, k.mgr, reqId)).focState).toBe('applied');
    });

    test('TC-NT-046 phần B7 + xem trước BR-434-09: pendingFocVnd 300.000 không vào folioDeltaVnd; lưu không 409; duyệt → 4.905.000 (S4-18 + S4-21/S4-04)', async ({
      request,
    }) => {
      knownBug('BUG-R2-059', 'S4-21');
      const ex = oracle('BR-434-09');
      const { k, b, night, reqId, map } = await precondition(
        'đơn 203 3 đêm từ thứ Hai, FOC 300.000 chờ duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            today: k.today,
            dow: weekday((ex.input.from as Json).arrivalDate as string),
            nights: 3,
            span: 7,
          });
          const map = mapper((ex.input.from as Json).arrivalDate as string, b.arrivalDate);
          const night = map(String(ex.input.requestNight));
          const f = await folioOf(request, k.fd, b);
          const q = await requestReduction(request, k.fd, b.folioId, lineOn(f, 'room', night).id, {
            amountVnd: num(ex.input.requestedFocVnd),
          });
          expect(q.status, JSON.stringify(q.body)).toBe(201);
          return { k, b, night, reqId: q.body.id, map };
        },
      );
      const total0 = (await folioOf(request, k.fd, b)).totals.totalVnd;
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        departureDate: map((ex.input.to as Json).departureDate as string),
        reasonCode: 'guest_request',
      });
      expect((preview.nights ?? []).find((n) => n.date === night)?.pendingFocVnd).toBe(
        num(ex.expected.focAppliedVnd),
      );
      const f1 = await folioOf(request, k.fd, b);
      expect(f1.totals.totalVnd - total0, 'số ghi = số xem trước (từng đồng)').toBe(
        preview.folioDeltaVnd,
      );
      expect(f1.totals.totalVnd, 'FOC chờ duyệt không vào folio').toBe(
        num(ex.expected.wrongRoomPayableVnd),
      );
      const a = await approve(request, k.mgr, reqId);
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      expect((await folioOf(request, k.fd, b)).totals.totalVnd).toBe(
        num(ex.expected.roomPayableVnd),
      );
    });

    test('TC-NT-049 (6) BR-434-10 FOC 792.000 chờ duyệt trên đêm bị bỏ (03–06/12 → 04–06/12): yêu cầu tự hủy, báo người gửi, folio 1.822.000 (S4-18)', async ({
      request,
    }) => {
      knownBug('BUG-R2-059');
      const ex = oracle('BR-434-10');
      const { k, b, reqId, map } = await precondition(
        'đơn 203 3 đêm từ thứ Năm, FOC 792.000 đêm đầu chờ duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.roomNo)),
            today: k.today,
            dow: weekday((ex.input.from as Json).arrivalDate as string),
            nights: 3,
          });
          const map = mapper((ex.input.from as Json).arrivalDate as string, b.arrivalDate);
          const f = await folioOf(request, k.fd, b);
          const q = await requestReduction(
            request,
            k.fd,
            b.folioId,
            lineOn(f, 'room', map(String(ex.input.requestNight))).id,
            {
              amountVnd: num(ex.input.requestedFocVnd),
            },
          );
          expect(q.status, JSON.stringify(q.body)).toBe(201);
          return { k, b, reqId: q.body.id, map };
        },
      );
      const r = await moveAcked(request, k.fd, b.id, {
        arrivalDate: map((ex.input.to as Json).arrivalDate as string),
        departureDate: map((ex.input.to as Json).departureDate as string),
        reasonCode: 'guest_request',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const a = await approvalById(request, k.mgr, reqId);
      expect(a.status).toBe(String(ex.expected.requestStatus));
      expect(a.autoCancelReason).toBe('line_removed');
      expect((await folioOf(request, k.fd, b)).totals.totalVnd).toBe(
        num(ex.expected.roomPayableVnd),
      );
      const notes = await myNotifications(request, k.fd);
      expect(
        notes.some(
          (n) => n.kind === 'approval_cancelled' && (n.refId === reqId || n.refCode === b.code),
        ),
        'người gửi nhận approval_cancelled',
      ).toBe(true);
      const ev = (await moneyEventsOf(request, k.mgr, b.code, { from: k.today })).map(
        (e) => e.action,
      );
      expect(ev).toContain('approval.cancelled');
      for (const x of [
        'folio.foc_cancelled',
        'folio.foc_dormant',
        'folio.foc_suspended',
        'folio.foc_restored',
      ]) {
        expect(ev, `không có ${x} cho yêu cầu chưa duyệt`).not.toContain(x);
      }
    });

    test('TC-NT-049 (4) BR-433-03 giảm giá đặc biệt 300.000 đã duyệt trên đêm bị bỏ: focState cancelled (night_removed), audit folio.foc_cancelled, folio 1.822.000 (S4-18)', async ({
      request,
    }) => {
      knownBug('BUG-R2-059');
      const ex = oracle('BR-433-03');
      const { k, b, approvalId, map } = await precondition(
        'đơn 203 3 đêm từ thứ Năm, giảm giá đặc biệt 300.000 đêm đầu đã duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, '203'),
            today: k.today,
            dow: weekday((ex.input.from as Json).arrivalDate as string),
            nights: 3,
          });
          const map = mapper((ex.input.from as Json).arrivalDate as string, b.arrivalDate);
          const f = await folioOf(request, k.fd, b);
          const a = await approvedReduction(
            request,
            k.fd,
            k.mgr,
            b.folioId,
            lineOn(f, 'room', map(String(ex.input.approvedNight))).id,
            {
              kind: 'special_discount',
              amountVnd: num(ex.input.approvedVnd),
              reasonCode: 'regular_vip',
            },
          );
          return { k, b, approvalId: a.id, map };
        },
      );
      const r = await moveAcked(request, k.fd, b.id, {
        arrivalDate: map((ex.input.to as Json).arrivalDate as string),
        departureDate: map((ex.input.to as Json).departureDate as string),
        reasonCode: 'guest_request',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const a = await approvalById(request, k.mgr, approvalId);
      expect(a.status).toBe('approved');
      expect(a.focState).toBe('cancelled');
      expect(a.focCancelReason).toBe('night_removed');
      expect((await folioOf(request, k.fd, b)).totals.totalVnd).toBe(
        num(ex.expected.folioRoomTotalVnd),
      );
      const ev = await moneyEventsOf(request, k.mgr, b.code, { from: k.today });
      const cancelled = ev.find((e) => e.action === String(ex.expected.auditEvent));
      expect(cancelled, 'audit folio.foc_cancelled').toBeTruthy();
      expect(cancelled!.entityType).toBe('approval_request');
      expect(cancelled!.after?.approvalRequestId).toBe(approvalId);
      expect(cancelled!.after?.serviceDate).toBe(map(String(ex.input.approvedNight)));
      expect(cancelled!.after?.amountVnd).toBe(num(ex.input.approvedVnd));
      expect(cancelled!.after?.reason).toBe('night_removed');
    });

    test('TC-NT-049 (5) hủy đơn có FOC đã duyệt: focState cancelled (reservation_cancelled), audit folio.foc_cancelled (S4-18)', async ({
      request,
    }) => {
      knownBug('BUG-R2-059');
      const ex = oracle('BR-434-06');
      const { k, b, approvalId } = await precondition(
        'đơn 202 1 đêm, FOC 100 % đã duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, String(ex.input.oldRoomNo)),
            today: k.today,
            dow: 2,
            nights: 1,
          });
          const f = await folioOf(request, k.fd, b);
          const a = await approvedReduction(
            request,
            k.fd,
            k.mgr,
            b.folioId,
            lineOn(f, 'room', b.arrivalDate).id,
            {
              amountVnd: num(ex.input.focApprovedVnd),
            },
          );
          return { k, b, approvalId: a.id };
        },
      );
      const r = await action(request, k.mgr, b.id, 'cancel', {
        reasonCode: 'other',
        note: 'E2E S4 huy don co FOC',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const a = await approvalById(request, k.mgr, approvalId);
      expect(a.focState).toBe('cancelled');
      expect(a.focCancelReason).toBe('reservation_cancelled');
      const ev = await moneyEventsOf(request, k.mgr, b.code, { from: k.today });
      expect(ev.find((e) => e.action === 'folio.foc_cancelled')?.after?.reason).toBe(
        'reservation_cancelled',
      );
    });

    // ───────────── S4-23 – nhiều khoản giảm trên một khóa, thứ tự lúc duyệt (BR-434-11/12) ─────────────

    test('TC-NT-047 BR-434-11 giảm giá đặc biệt 250.000 (trước) + FOC 792.000 (sau) đêm 401, khách đổi 401 → 302 → 101 → 401 (S4-23 + S4-21)', async ({
      request,
    }) => {
      knownBug('S4-23', 'S4-21');
      const ex = oracle('BR-434-11');
      const rs = ex.input.roomSequence as string[];
      const { k, b, night, ids } = await precondition(
        'đơn 401 2 đêm, hai khoản giảm đã duyệt theo thứ tự',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, rs[0]!),
            alsoFree: rs.slice(1).map((n) => room(k.c, n)),
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: nightsOf(String(ex.input.arrivalDate), String(ex.input.departureDate)).length,
          });
          const night = mapper(
            String(ex.input.arrivalDate),
            b.arrivalDate,
          )(String(ex.input.reductionNight));
          const ids: string[] = [];
          for (const red of (ex.input.reductions as Json[]).sort(
            (x, y) => num(x.order) - num(y.order),
          )) {
            const f = await folioOf(request, k.fd, b);
            const a = await approvedReduction(
              request,
              k.fd,
              k.mgr,
              b.folioId,
              lineOn(f, 'room', night).id,
              {
                kind: red.kind as 'foc' | 'special_discount',
                amountVnd: num(red.approvedVnd),
                reasonCode: String(red.reasonCode),
              },
            );
            ids.push(a.id);
          }
          return { k, b, night, ids };
        },
      );
      const sd = ex.expected.specialDiscountAppliedSequenceVnd as number[];
      const foc = ex.expected.focAppliedSequenceVnd as number[];
      const tot = ex.expected.roomTotalSequenceVnd as number[];
      const check = async (i: number) => {
        const f = await folioOf(request, k.fd, b);
        expect(reductionOn(f, 'room', night, 'discount'), `giảm giá đặc biệt – ${rs[i]}`).toBe(
          sd[i],
        );
        expect(reductionOn(f, 'room', night, 'foc'), `FOC – ${rs[i]}`).toBe(foc[i]);
        expect(nightNet(f, night), `đêm ròng – ${rs[i]}`).toBe(
          (ex.expected.reductionNightNetSequenceVnd as number[])[i],
        );
        const night2 = nightsOf(b.arrivalDate, b.departureDate).find((d) => d !== night)!;
        expect(nightNet(f, night2), 'không trừ lẹm sang đêm kia').toBe(
          lineOn(f, 'room', night2).amountVnd,
        );
        expect(nightNet(f, night) + lineOn(f, 'room', night2).amountVnd, `tổng – ${rs[i]}`).toBe(
          tot[i],
        );
        for (const [j, id] of ids.entries()) {
          const a = await approvalById(request, k.mgr, id);
          expect(a.status).toBe('approved');
          expect.soft(a.focState).toBe('applied');
          expect.soft(a.effectiveAmountVnd).toBe(j === 0 ? sd[i] : foc[i]);
        }
      };
      await check(0);
      for (let i = 1; i < rs.length; i++) {
        await previewThenMove(request, k.fd, b.id, {
          roomId: room(k.c, rs[i]!).id,
          reasonCode: 'guest_request',
        });
        await check(i);
      }
    });

    test('TC-NT-047 bước 5 BR-434-11 đảo thứ tự duyệt (FOC trước): ở 302 FOC 792.000, giảm giá 125.000, tổng vẫn 917.000 (S4-23 + S4-21)', async ({
      request,
    }) => {
      knownBug('S4-23', 'S4-21');
      const ex = oracle('BR-434-11');
      const split = ex.expected.reversedOrderSplitAt302Vnd as Json;
      const { k, b, night } = await precondition(
        'đơn 401 2 đêm, FOC duyệt trước giảm giá đặc biệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, '401'),
            alsoFree: [room(k.c, '302')],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: 2,
          });
          const night = b.arrivalDate;
          for (const red of (ex.input.reductions as Json[]).sort(
            (x, y) => num(y.order) - num(x.order),
          )) {
            const f = await folioOf(request, k.fd, b);
            await approvedReduction(request, k.fd, k.mgr, b.folioId, lineOn(f, 'room', night).id, {
              kind: red.kind as 'foc' | 'special_discount',
              amountVnd: num(red.approvedVnd),
              reasonCode: String(red.reasonCode),
            });
          }
          return { k, b, night };
        },
      );
      await previewThenMove(request, k.fd, b.id, {
        roomId: room(k.c, '302').id,
        reasonCode: 'guest_request',
      });
      const f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc')).toBe(num(split.foc));
      expect(reductionOn(f, 'room', night, 'discount')).toBe(num(split.specialDiscount));
      expect(f.totals.totalVnd).toBe(num(ex.expected.reversedOrderRoomTotalAt302Vnd));
    });

    test('TC-NT-048 BR-434-12 FOC 792.000 chờ duyệt, khách đổi 401 → 302: "khi duyệt sẽ áp 667.000", duyệt → 917.000, về 401 → 792.000 (S4-23 + S4-18 + S4-21)', async ({
      request,
    }) => {
      knownBug('S4-23', 'BUG-R2-059', 'S4-21');
      const ex = oracle('BR-434-12');
      const { k, b, night } = await precondition(
        'đơn 401 2 đêm, giảm giá đặc biệt 250.000 đã duyệt',
        async () => {
          const k = await ctxOf(request);
          const b = await bookMoney(request, k.c, k.fd, {
            room: room(k.c, '401'),
            alsoFree: [room(k.c, '302')],
            today: k.today,
            dow: weekday(String(ex.input.arrivalDate)),
            nights: 2,
          });
          const night = b.arrivalDate;
          const f = await folioOf(request, k.fd, b);
          const sd = (ex.input.approved as Json[])[0]!;
          await approvedReduction(request, k.fd, k.mgr, b.folioId, lineOn(f, 'room', night).id, {
            kind: 'special_discount',
            amountVnd: num(sd.approvedVnd),
            reasonCode: 'regular_vip',
          });
          return { k, b, night };
        },
      );
      const line = async () => lineOn(await folioOf(request, k.fd, b), 'room', night).id;
      const pend = ex.input.pending as Json;
      const over = await requestReduction(request, k.fd, b.folioId, await line(), {
        amountVnd: num(ex.expected.maxRequestAt401Vnd) + 1000,
      });
      expect(
        over.status,
        `vượt trần ${num(ex.expected.maxRequestAt401Vnd)}: ${JSON.stringify(over.body)}`,
      ).toBe(422);
      expect(fieldCodes(over.body).some((x) => x.startsWith('amountVnd:'))).toBe(true);
      const q = await requestReduction(request, k.fd, b.folioId, await line(), {
        amountVnd: num(pend.requestedVnd),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      expect.soft(q.body.effectiveAmountVnd).toBe(num(ex.expected.maxRequestAt401Vnd));
      const { preview } = await previewThenMove(request, k.fd, b.id, {
        roomId: room(k.c, '302').id,
        reasonCode: 'guest_request',
      });
      const note = ex.expected.queueNoteVnd as Json;
      expect((preview.nights ?? []).find((n) => n.date === night)?.pendingFocVnd).toBe(
        num(note.willApply),
      );
      const p = await approvalById(request, k.mgr, q.body.id);
      expect(p.status).toBe('pending');
      expect(p.amountVnd).toBe(num(pend.requestedVnd));
      expect.soft(p.effectiveAmountVnd).toBe(num(note.willApply));
      expect.soft(p.lineChangedNote?.oldLineVnd).toBe(num(note.oldLine));
      expect.soft(p.lineChangedNote?.newLineVnd).toBe(num(note.newLine));
      const a = await approve(request, k.mgr, q.body.id);
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      let f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc')).toBe(
        num(ex.expected.focAppliedAfterApprovalVnd),
      );
      expect(nightNet(f, night) + nightNet(f, addDays(night, 1))).toBe(
        num(ex.expected.roomTotalAfterApprovalVnd),
      );
      const none = await requestReduction(request, k.fd, b.folioId, await line(), {
        amountVnd: 1000,
      });
      expect(none.status, 'trần 0 – dòng đã được miễn/giảm hết').toBe(422);
      await previewThenMove(request, k.fd, b.id, {
        roomId: room(k.c, '401').id,
        reasonCode: 'guest_request',
      });
      f = await folioOf(request, k.fd, b);
      expect(reductionOn(f, 'room', night, 'foc')).toBe(
        num(ex.expected.focAppliedAfterReturnTo401Vnd),
      );
      expect(f.totals.totalVnd).toBe(num(ex.expected.roomTotalAfterReturnTo401Vnd));
      expect((await approvalById(request, k.mgr, q.body.id)).status).toBe(
        String(ex.expected.requestStatus),
      );
    });
  },
);

// ───────────── tập đóng AuditEvent.action (category money) – TC-NT-049 (1) phần A ─────────────

test.describe(
  'S4 tiền – tập đóng AuditEvent.action (money)',
  { tag: ['@api', '@sprint4', '@money'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-NT-049 (1) mọi bản ghi `money` (của một luồng đặt – cọc – FOC – đổi căn và 500 bản ghi mới nhất) thuộc tập đóng của hợp đồng 0.3.7', async ({
      request,
    }) => {
      const set = moneyActionSet();
      for (const a of [
        'folio.foc_cancelled',
        'folio.foc_dormant',
        'folio.foc_suspended',
        'folio.foc_restored',
      ]) {
        expect(set.has(a), `0.3.7 D1: ${a} trong tập đóng`).toBe(true);
      }
      const k = await ctxOf(request);
      const ex = oracle('BR-434-06');
      const to = room(k.c, String(ex.input.newRoomNo));
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, String(ex.input.oldRoomNo)),
        alsoFree: [to],
        today: k.today,
        dow: 2,
        nights: 1,
      });
      const f = await folioOf(request, k.fd, b);
      await approvedReduction(
        request,
        k.fd,
        k.mgr,
        b.folioId,
        lineOn(f, 'room', b.arrivalDate).id,
        {
          amountVnd: 100000,
        },
      );
      const pay = await recordPayment(request, k.fd, b.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 100000,
      });
      expect(pay.status, JSON.stringify(pay.body)).toBe(201);
      const r = await moveAcked(request, k.fd, b.id, {
        roomId: to.id,
        reasonCode: 'property_fault',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const mine = await moneyEventsOf(request, k.mgr, b.code, { from: k.today });
      const actions = mine.map((e) => e.action);
      for (const a of ['payment.recorded', 'folio.foc_requested', 'approval.approved'])
        expect(actions).toContain(a);
      const outside = mine.filter((e) => !set.has(e.action)).map((e) => e.action);
      expect(outside, 'mã money ngoài tập đóng (đơn này)').toEqual([]);
      // 500 bản ghi money mới nhất của cả cơ sở (mọi luồng của lượt chạy)
      const all: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 5; page++) {
        const x = await call<{
          data: Array<{ action: string }>;
          page?: { nextCursor?: string | null };
        }>(request, 'GET', `/v1/properties/${k.c.propertyId}/audit-events`, {
          session: k.mgr,
          query: { category: 'money', limit: 100, cursor },
        });
        expect(x.status).toBe(200);
        all.push(...x.body.data.map((e) => e.action));
        cursor = x.body.page?.nextCursor ?? undefined;
        if (!cursor) break;
      }
      expect(
        [...new Set(all.filter((a) => !set.has(a)))],
        'mã money ngoài tập đóng (toàn cơ sở)',
      ).toEqual([]);
    });
  },
);

// ───────────── nhóm D #6 (B-6) – expectedVersion khi duyệt/từ chối hoàn tiền ─────────────

test.describe(
  'S4 – B-6 expectedVersion duyệt/từ chối yêu cầu refund (T2)',
  { tag: ['@api', '@sprint4', '@money'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    /** Folio trả dư 200.000 tiền mặt + yêu cầu hoàn tay do qa.fd tạo (MGR+ duyệt – BR-522). */
    async function refundRequest(
      request: APIRequestContext,
      k: Ctx,
    ): Promise<{ id: string; version: number }> {
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '102'),
        today: k.today,
        dow: 2,
        nights: 1,
      });
      const f = await folioOf(request, k.fd, b);
      const pay = await recordPayment(request, k.fd, b.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: f.totals.balanceDueVnd + 200000,
        note: 'Khach tra du – E2E B-6',
      });
      expect(pay.status, JSON.stringify(pay.body)).toBe(201);
      const r = await call<{ id: string; version?: number; type: string }>(
        request,
        'POST',
        p3(EP3.createRefundRequest, k.fd, { folioId: b.folioId }),
        {
          session: k.fd,
          idempotencyKey: true,
          body: { amountVnd: 200000, reason: 'Hoan tien tra du E2E' },
        },
      );
      expect(r.status, `createRefundRequest: ${JSON.stringify(r.body)}`).toBe(201);
      expect(r.body.type).toBe('refund');
      return {
        id: r.body.id,
        version: (await approvalById(request, k.mgr, r.body.id)).version ?? -1,
      };
    }

    test('B-6 duyệt hoàn: thiếu expectedVersion → 422 REQUIRED; nơi nhận đổi sau khi mở → phiên bản cũ 412 VERSION_CONFLICT; đúng phiên bản → 200', async ({
      request,
    }) => {
      knownBug('B-6');
      const { k, req } = await precondition('yêu cầu refund 200.000 chờ duyệt', async () => {
        needDevice('B-6');
        const k = await ctxOf(request);
        return { k, req: await refundRequest(request, k) };
      });
      expect
        .soft(req.version, 'ApprovalRequest.version có trong phản hồi')
        .toBeGreaterThanOrEqual(0);
      const missing = await decideWith(request, k.mgr, req.id, 'approve', {});
      expect(missing.status, `thiếu expectedVersion: ${JSON.stringify(missing.body)}`).toBe(422);
      expect(fieldCodes(missing.body)).toContain('expectedVersion:REQUIRED');
      const dest = await call(
        request,
        'PUT',
        p3(EP3.setRefundDestination, k.fd, { approvalId: req.id }),
        {
          ...dev(k.fd),
          idempotencyKey: true,
          body: { method: 'cash' },
        },
      );
      expect(dest.status, `setRefundDestination: ${JSON.stringify(dest.body)}`).toBe(200);
      const v1 = (await approvalById(request, k.mgr, req.id)).version!;
      expect(v1, 'version tăng khi đổi nơi nhận').toBeGreaterThan(req.version);
      const stale = await decideWith(request, k.mgr, req.id, 'approve', {
        expectedVersion: req.version,
      });
      expect(stale.status, `phiên bản cũ: ${JSON.stringify(stale.body)}`).toBe(412);
      expect(stale.body.code).toBe('VERSION_CONFLICT');
      expect((await approvalById(request, k.mgr, req.id)).status, 'không duyệt khi lệch').toBe(
        'pending',
      );
      const ok = await decideWith(request, k.mgr, req.id, 'approve', { expectedVersion: v1 });
      expect(ok.status, JSON.stringify(ok.body)).toBe(200);
      expect(ok.body.status).toBe('approved');
    });

    test('B-6 từ chối hoàn: thiếu expectedVersion → 422; lệch → 412; đúng → 200 rejected', async ({
      request,
    }) => {
      knownBug('B-6');
      const { k, req } = await precondition('yêu cầu refund 200.000 chờ duyệt', async () => {
        const k = await ctxOf(request);
        return { k, req: await refundRequest(request, k) };
      });
      const missing = await decideWith(request, k.mgr, req.id, 'reject', {});
      expect(missing.status, JSON.stringify(missing.body)).toBe(422);
      expect(fieldCodes(missing.body)).toContain('expectedVersion:REQUIRED');
      const stale = await decideWith(request, k.mgr, req.id, 'reject', {
        expectedVersion: req.version + 7,
      });
      expect(stale.status, JSON.stringify(stale.body)).toBe(412);
      expect(stale.body.code).toBe('VERSION_CONFLICT');
      const ok = await decideWith(request, k.mgr, req.id, 'reject', {
        expectedVersion: req.version,
      });
      expect(ok.status, JSON.stringify(ok.body)).toBe(200);
      expect(ok.body.status).toBe('rejected');
    });

    test('B-6 duyệt FOC không cần expectedVersion (tùy chọn với loại khác refund) (hồi quy)', async ({
      request,
    }) => {
      const k = await ctxOf(request);
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '103'),
        today: k.today,
        dow: 2,
        nights: 1,
      });
      const f = await folioOf(request, k.fd, b);
      const q = await requestReduction(
        request,
        k.fd,
        b.folioId,
        lineOn(f, 'room', b.arrivalDate).id,
        { amountVnd: 100000 },
      );
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const ok = await decideWith(request, k.mgr, q.body.id, 'approve', {});
      expect(ok.status, `FOC không gửi expectedVersion: ${JSON.stringify(ok.body)}`).toBe(200);
      expect(ok.body.status).toBe('approved');
    });
  },
);
