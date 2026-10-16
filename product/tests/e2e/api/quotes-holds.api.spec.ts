// E2E API – Sprint 2 EP11 phần R2: báo giá ngắn ngày, giữ chỗ, gia hạn, xác nhận cọc, báo đã chuyển cọc (CTV),
// hành động theo vai trên chi tiết đơn, hủy giữ chỗ. TC: r1-main-flows.md 6.1, 6.2, 3.4 (TC-L2-040, 050, 051, 057).
// Giờ thật (project api): ca phụ thuộc mốc giờ chính xác (hết hạn, nhắc, biên BR-302) nằm ở clock/*.clock.spec.ts.
// Giá theo thứ trong tuần dùng NGÀY CỐ ĐỊNH của oracle (chỉ calculateQuote, không giữ tồn).
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  calculateQuote,
  cleanupTracked,
  createHold,
  getReservation,
  isRoomFree,
  makeHold,
  minStayFor,
  weekdayArrival,
  fieldCodes,
  ms,
  needFutureDate,
  newGuest,
  nextWeekday,
  oracle,
  oracleNum,
  paxOf,
  quoteInput,
  room,
  s2Context,
  saveQuote,
  stackNow,
  statusOf,
  vnTime,
  type Reservation,
  type ProblemFields,
} from '../support/s2.js';

test.describe.configure({ mode: 'parallel' });

const HOUR = 3_600_000;
const TOL = 120_000; // 2 phút: thời điểm tạo do server lấy, test chỉ biết khoảng trước/sau

test.describe(
  'L5 6.1 – báo giá ngắn ngày (US-080, US-082, US-083)',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-L2-012 giá đề xuất theo lịch giá BR-103/104 (T6, T7 +15%; ngày đặc biệt +30%) cho Trực tiếp và Booking.com', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-012', [EP.calculateQuote]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '203');
      // T6 không chạm ngày đặc biệt của DS-E (special_dates nửa mở)
      const special = (
        JSON.parse(
          readFileSync(new URL('../../fixtures/seed/ds-e.json', import.meta.url), 'utf8'),
        ) as { parameters: Array<{ param: string; value: unknown }> }
      ).parameters.find((x) => x.param === 'special_dates')?.value as Array<{
        from: string;
        to: string;
      }>;
      const isSpecial = (d: string) => special.some((x) => d >= x.from && d < x.to);
      let fri = nextWeekday(addDays(today, 30), 5);
      while ([0, 1, 2].some((i) => isSpecial(addDays(fri, i)))) fri = addDays(fri, 7);
      const weekday = oracleNum('BR-104-01', 'rateVnd');
      const weekend = oracleNum('BR-104-02', 'rateVnd');
      // Báo giá chỉ nhận kênh Trực tiếp/CTV (EP02 10.1 `channelId`); giá OTA mặc định kiểm ở reservations.api.spec.ts
      const rates = async (kind: 'direct' | 'agent', arrival: string, nights: number) => {
        const r = await calculateQuote(
          request,
          fd,
          quoteInput(c, { room: rm, arrival, nights, kind }),
        );
        expect(r.status, `${kind}: ${JSON.stringify(r.body)}`).toBe(200);
        return (r.body.nightlyRates ?? []).map((n) => n.amountVnd);
      };
      expect(await rates('direct', fri, 3)).toEqual([weekend, weekend, weekday]);
      expect(await rates('agent', fri, 3)).toEqual([weekend, weekend, weekday]); // lịch giá áp mọi kênh (BR-104 v0.3)
      // ngày đặc biệt (BR-104-03, BR-104-04): 31/12/2026 +30%
      const o3 = oracle('BR-104-03');
      const sd = String(o3.input.nightDate);
      if (sd > today) {
        // 31/12 và 1/1 đều là ngày đặc biệt → ở tối thiểu 2 đêm (BR-113); oracle BR-104-03, BR-104-05
        expect(await rates('direct', sd, 2)).toEqual([
          o3.expected.rateVnd,
          oracle('BR-104-05').expected.rateVnd,
        ]);
      }
    });

    test('TC-L5-001 CTV báo giá 202 7 đêm: giảm 10%, tổng, cọc, hoa hồng (BR-107-01, BR-305-01, BR-903-01)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-001', [EP.calculateQuote]);
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const c = await s2Context(request);
      const o = oracle('BR-107-01');
      needFutureDate(String(o.input.arrivalDate), await stackToday(request), 'TC-L5-001');
      const body = quoteInput(c, {
        room: room(c, String(o.input.roomNo)),
        arrival: String(o.input.arrivalDate),
        nights: Number(o.input.nights),
      });
      const r = await calculateQuote(request, ctv, body);
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect((r.body.nightlyRates ?? []).map((n) => n.amountVnd)).toEqual(
        o.expected.discountedNightlyRatesVnd,
      );
      expect(r.body.totalVnd).toBe(o.expected.roomTotalVnd);
      expect(r.body.depositVnd).toBe(oracleNum('BR-305-01', 'depositVnd'));
      expect(r.body.commission?.amountVnd).toBe(oracleNum('BR-903-01', 'commissionVnd'));
      // mã khách quay lại không cộng dồn với giảm theo số đêm
      const r2 = await calculateQuote(request, ctv, { ...body, returnGuestCode: 'OTTIMO-BACK5' });
      expect(r2.status, JSON.stringify(r2.body)).toBe(200);
      expect(r2.body.totalVnd).toBe(o.expected.roomTotalVnd);
    });

    test('TC-L5-002 biên giảm theo số đêm 6/7/13/14 đêm và kênh OTA không giảm (BR-107-02)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-002', [EP.calculateQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const o = oracle('BR-107-02');
      const arrival = String(o.input.arrivalDate);
      needFutureDate(arrival, await stackToday(request), 'TC-L5-002');
      const rm = room(c, '202');
      const total = async (nights: number, kind: 'direct' = 'direct') => {
        const r = await calculateQuote(
          request,
          sal,
          quoteInput(c, { room: rm, arrival, nights, kind }),
        );
        expect(r.status, `${nights} đêm ${kind}: ${JSON.stringify(r.body)}`).toBe(200);
        return r.body;
      };
      // số mong đợi của 6 và 13 đêm: QA tính từ bảng giá đêm của BR-107-02 (cùng lịch giá) – TC-L5-002
      const list = o.input.nightlyRatesVnd as number[];
      const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
      expect((await total(6)).totalVnd).toBe(sum(list.slice(0, 6)));
      expect((await total(7)).totalVnd).toBe(oracle('BR-107-01').expected.roomTotalVnd);
      expect((await total(13)).totalVnd).toBe(9697000);
      expect((await total(14)).totalVnd).toBe(o.expected.roomTotalVnd);
      // kênh OTA không báo giá được (EP02 10.1: chỉ direct/agent) → 422 NOT_IN_LIST tại channelId
      const ota = await calculateQuote(
        request,
        sal,
        quoteInput(c, { room: rm, arrival, nights: 7, kind: 'agoda' }),
      );
      expect(ota.status, JSON.stringify(ota.body)).toBe(422);
      expect(fieldCodes(ota.body).join(',')).toContain('channelId:NOT_IN_LIST');
    });

    test('TC-L5-003 CTV không thấy "OTTIMO còn lại"; SAL thấy', async ({ request }) => {
      await requireEndpoints(request, 'TC-L5-003', [EP.calculateQuote]);
      const c = await s2Context(request);
      const today = await stackToday(request);
      const body = quoteInput(c, { room: room(c, '202'), arrival: addDays(today, 60), nights: 7 });
      const ctv = await calculateQuote(request, await sessionOrSkip(request, 'qa.ctv1'), body);
      expect(ctv.status, JSON.stringify(ctv.body)).toBe(200);
      expect(ctv.body).not.toHaveProperty('ottimoRemainingVnd');
      expect(ctv.body.commission?.amountVnd).toBeGreaterThan(0);
      const sal = await calculateQuote(request, await sessionOrSkip(request, 'qa.sal'), body);
      expect(sal.status).toBe(200);
      expect(sal.body).toHaveProperty('ottimoRemainingVnd');
      const fd = await calculateQuote(request, await sessionOrSkip(request, 'qa.fd'), body);
      expect(fd.status).toBe(200);
      expect(fd.body).not.toHaveProperty('commission'); // FD/FDL không nhận hoa hồng (SR-AZ-04)
    });

    test('TC-L5-004 ngưỡng so sánh thuê tháng (BR-108-01): 14 không, 15 có, 20 đêm số liệu, 28 bắt buộc HĐ', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-004', [EP.calculateQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const o = oracle('BR-108-01');
      const arrival = String(o.input.arrivalDate);
      needFutureDate(arrival, await stackToday(request), 'TC-L5-004');
      const rm = room(c, '202');
      const q = async (nights: number) => {
        const r = await calculateQuote(request, sal, {
          ...quoteInput(c, { room: rm, arrival, nights }),
          guestCategory: 'vn',
        });
        expect(r.status, `${nights}: ${JSON.stringify(r.body)}`).toBe(200);
        return r.body;
      };
      expect((await q(14)).longStayAlternative).toBeUndefined();
      expect((await q(15)).longStayAlternative).toBeDefined();
      const d20 = await q(Number(o.input.nights));
      expect(d20.totalVnd).toBe(o.expected.shortStayTotalVnd);
      expect(d20.longStayAlternative?.totalVnd).toBe(o.expected.oneMonthRentPlusServiceVnd);
      // 28 đêm: báo giá ngắn ngày không nhận (EP02 10.1 nights 1…short_stay_max_nights) → hướng sang dài hạn
      const r28 = await calculateQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival, nights: 28 }),
        guestCategory: 'vn',
      });
      expect(r28.status, JSON.stringify(r28.body)).toBe(422);
      expect(fieldCodes(r28.body).join(',')).toContain('nights:LONG_STAY_REQUIRES_CONTRACT');
    });

    test('TC-L5-005 vượt sức chứa, ngày đã qua, ngoài cửa sổ đặt → 422 tại ô', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-005', [EP.calculateQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '202');
      const o = oracle('BR-110-05'); // 202, 4 người lớn → chặn
      const cap = await calculateQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival: weekdayArrival(addDays(today, 30)), nights: 1 }),
        ...paxOf(o.input),
      });
      expectProblem(cap, 422, 'CAPACITY_EXCEEDED');
      const past = await calculateQuote(
        request,
        sal,
        quoteInput(c, { room: rm, arrival: addDays(today, -1), nights: 1 }),
      );
      expect(past.status, JSON.stringify(past.body)).toBe(422);
      expect(JSON.stringify((past.body as ProblemFields).errors ?? [])).toContain('arrivalDate');
      const far = await calculateQuote(
        request,
        sal,
        quoteInput(c, { room: rm, arrival: addDays(today, 365), nights: 1 }),
      );
      expectProblem(far, 422, 'OUTSIDE_BOOKING_WINDOW');
    });

    for (const ex of ['BR-110-01', 'BR-110-02', 'BR-110-03', 'BR-110-06', 'BR-110-08']) {
      test(`TC-L5-006 phụ thu người vượt định mức cộng vào báo giá (oracle ${ex})`, async ({
        request,
      }) => {
        await requireEndpoints(request, 'TC-L5-006', [EP.calculateQuote]);
        const sal = await sessionOrSkip(request, 'qa.sal');
        const c = await s2Context(request);
        const today = await stackToday(request);
        const o = oracle(ex);
        const rm = room(c, String(o.input.roomNo));
        const nights = Number(o.input.nights);
        const arrival = weekdayArrival(addDays(today, 45));
        const base = await calculateQuote(request, sal, {
          ...quoteInput(c, { room: rm, arrival, nights }),
          adults: Math.min(Number(o.input.adults), rm.baseOccupancy ?? 2),
          children6to11: 0,
          childrenUnder6: 0,
        });
        const withPax = await calculateQuote(request, sal, {
          ...quoteInput(c, { room: rm, arrival, nights }),
          ...paxOf(o.input),
        });
        expect(base.status, JSON.stringify(base.body)).toBe(200);
        expect(withPax.status, JSON.stringify(withPax.body)).toBe(200);
        expect((withPax.body.totalVnd ?? 0) - (base.body.totalVnd ?? 0)).toBe(
          o.expected.extraPersonFeeVnd,
        );
      });
    }

    test('TC-L5-036 rút báo giá: active → withdrawn; converted → 409; người khác → 404', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-036', [
        EP.saveQuote,
        EP.withdrawQuote,
        EP.createHoldFromQuote,
      ]);
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const pid = propertyIdOf(ctv);
      const guestId = await newGuest(request, ctv);
      const q1 = await saveQuote(request, ctv, {
        ...quoteInput(c, { room: room(c, '101'), arrival: addDays(today, 70), nights: 2 }),
        guestId,
      });
      expect(q1.status, JSON.stringify(q1.body)).toBe(201);
      expect(q1.body.code).toMatch(/^BG-\d{5}$/);
      expect(q1.body.status).toBe('active');
      const wOther = await call(
        request,
        'POST',
        `/v1/properties/${pid}/quotes/${q1.body.id}/actions/withdraw`,
        {
          session: sal,
          idempotencyKey: true,
          ifMatch: `"${q1.body.version}"`,
          body: {},
        },
      );
      expect(wOther.status, statusOf(wOther)).toBe(404);
      const w1 = await call<{ status: string }>(
        request,
        'POST',
        `/v1/properties/${pid}/quotes/${q1.body.id}/actions/withdraw`,
        { session: ctv, idempotencyKey: true, ifMatch: `"${q1.body.version}"`, body: {} },
      );
      expect(w1.status, JSON.stringify(w1.body)).toBe(200);
      expect(w1.body.status).toBe('withdrawn');
      const { quote } = await makeHold(request, ctv, c, {
        rooms: c.rooms,
        arrival: addDays(today, 75 + Math.floor(Math.random() * 100)),
        nights: 1,
        holdHours: 24,
        guestId,
      });
      const conv = await call<{ status: string; version: number }>(
        request,
        'GET',
        `/v1/properties/${pid}/quotes/${quote.id}`,
        { session: ctv },
      );
      expect(conv.body.status).toBe('converted');
      const w3 = await call(
        request,
        'POST',
        `/v1/properties/${pid}/quotes/${quote.id}/actions/withdraw`,
        {
          session: ctv,
          idempotencyKey: true,
          ifMatch: `"${conv.body.version}"`,
          body: {},
        },
      );
      expectProblem(w3, 409, 'INVALID_TRANSITION');
      await cleanupTracked(request);
    });
  },
);

test.describe(
  'L5 6.2 – giữ chỗ, gia hạn, cọc (US-084, US-085, US-086)',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L5-021 CTV tạo giữ chỗ: hold, hạn = min(tạo + giờ giữ, 12:00 ngày đến), căn bị chặn bán, báo giá converted', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-021', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.getQuote,
        EP.searchAvailability,
      ]);
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const arrival = addDays(today, 1);
      const t0 = ms(await stackNow(request));
      const {
        hold,
        quote,
        room: rm,
      } = await makeHold(request, ctv, c, {
        rooms: c.rooms,
        arrival,
        nights: 1,
        holdHours: 24,
      });
      const t1 = ms(await stackNow(request));
      expect(hold.status).toBe('hold');
      const cap = ms(vnTime(arrival, '12:00'));
      const exp = ms(hold.hold?.expiresAt ?? '');
      const lo = Math.min(t0 + 24 * HOUR, cap) - TOL;
      const hi = Math.min(t1 + 24 * HOUR, cap) + TOL;
      expect(exp, `hold.expiresAt=${hold.hold?.expiresAt}`).toBeGreaterThanOrEqual(lo);
      expect(exp, `hold.expiresAt=${hold.hold?.expiresAt}`).toBeLessThanOrEqual(hi);
      expect(exp).toBeLessThanOrEqual(cap);
      expect(await isRoomFree(request, fd, rm, arrival, addDays(arrival, 1))).toBe(false);
      const q = await call<{ status: string; convertedReservationId?: string }>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(ctv)}/quotes/${quote.id}`,
        { session: ctv },
      );
      expect(q.body.status).toBe('converted');
      expect(q.body.convertedReservationId).toBe(hold.id);
    });

    test('TC-L5-023 giữ chỗ cho ngày đến hôm nay → 422 HOLD_NOT_ALLOWED_TODAY (BR-302-02)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-023', [EP.saveQuote, EP.createHoldFromQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      expect(oracle('BR-302-02').expected.holdAllowed).toBe(false);
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: room(c, '101'), arrival: today, nights: minStayFor(today) }),
        guestId: await newGuest(request, sal),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const h = await createHold(request, sal, q.body.id, 24);
      expectProblem(h, 422, 'HOLD_NOT_ALLOWED_TODAY');
    });

    test('TC-L5-024 khách chưa có SĐT → 422 PHONE_REQUIRED khi tạo giữ chỗ', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-024', [EP.saveQuote, EP.createHoldFromQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, {
          room: room(c, '102'),
          arrival: weekdayArrival(addDays(today, 80)),
          nights: 1,
        }),
        guestId: await newGuest(request, sal, { withPhone: false }),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const h = await createHold(request, sal, q.body.id, 24);
      expectProblem(h, 422, 'PHONE_REQUIRED');
    });

    test('TC-L5-025 (a) giữ chỗ 202 7 đêm 9/11–16/11 cần cọc 1.600.000 (BR-305-01)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-025', [EP.saveQuote, EP.createHoldFromQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const o = oracle('BR-107-01');
      const arrival = String(o.input.arrivalDate);
      needFutureDate(arrival, await stackToday(request), 'TC-L5-025');
      const rm = room(c, '202');
      const free = await isRoomFree(request, sal, rm, arrival, addDays(arrival, 7));
      test.skip(
        free === false,
        'môi trường: 202 đã có đơn trong 9/11–16/11 (dữ liệu lần chạy khác)',
      );
      const { hold } = await makeHold(request, sal, c, {
        rooms: [rm],
        arrival,
        nights: Number(o.input.nights),
        holdHours: 24,
      });
      expect(hold.depositRequiredVnd).toBe(oracleNum('BR-305-01', 'depositVnd'));
    });

    test('TC-L5-029 gia hạn giữ chỗ 1 lần (≤ +24 giờ, không vượt 12:00 ngày đến); lần 2 bị chặn', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-029', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.extendHold,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 30 + Math.floor(Math.random() * 60)),
        nights: 1,
        holdHours: 24,
      });
      const before = ms(hold.hold?.expiresAt ?? '');
      const e1 = await action(
        request,
        sal,
        hold.id,
        'extend-hold',
        { extraHours: 24 },
        {
          version: hold.version,
        },
      );
      expect(e1.status, JSON.stringify(e1.body)).toBe(200);
      const after = await getReservation(request, sal, hold.id);
      const cap = ms(vnTime(hold.arrivalDate, '12:00'));
      expect(ms(after.body.hold?.expiresAt ?? '')).toBe(Math.min(before + 24 * HOUR, cap));
      expect(after.body.hold?.extendedCount).toBe(1);
      const e2 = await action(
        request,
        sal,
        hold.id,
        'extend-hold',
        { extraHours: 1 },
        {
          version: after.body.version,
        },
      );
      expect(e2.status, statusOf(e2)).toBe(409);
    });

    test('TC-L5-031 SAL ghi cọc đủ và xác nhận → confirmed, hết hạn giữ chỗ bị bỏ', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-031', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 2,
        holdHours: 24,
      });
      const amount = hold.depositRequiredVnd ?? 0;
      expect(amount).toBeGreaterThan(0);
      const r = await action(
        request,
        sal,
        hold.id,
        'confirm-deposit',
        { payment: { type: 'deposit', method: 'bank_transfer', amountVnd: amount } },
        { version: hold.version },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const after = await getReservation(request, sal, hold.id);
      expect(after.body.status).toBe('confirmed');
      expect(after.body.hold?.expiresAt ?? null).toBeNull();
    });

    test('TC-L5-032 cọc thiếu: giao dịch được ghi → 200, đơn vẫn hold, depositPaidVnd = số đã thu (A-13)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-032', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 2,
        holdHours: 24,
      });
      const required = hold.depositRequiredVnd ?? 0;
      const r = await action(
        request,
        sal,
        hold.id,
        'confirm-deposit',
        { payment: { type: 'deposit', method: 'cash', amountVnd: Math.floor(required / 2) } },
        { version: hold.version },
      );
      // ARC s2-contract A-13 (OpenAPI 0.3.5): đã ghi tiền thì không trả 4xx – 200 + Reservation (status hold)
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body.status).toBe('hold');
      const after = await getReservation(request, sal, hold.id);
      expect(after.body.status).toBe('hold');
      expect(after.body.depositPaidVnd).toBe(Math.floor(required / 2));
    });

    test('TC-L5-034 CTV không xác nhận cọc (403) – gửi "Báo đã chuyển cọc" (202), đơn vẫn hold', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-034', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
        EP.createDepositNotice,
      ]);
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, ctv, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 1,
        holdHours: 24,
      });
      const amount = hold.depositRequiredVnd ?? 500000;
      const r = await action(
        request,
        ctv,
        hold.id,
        'confirm-deposit',
        { payment: { type: 'deposit', method: 'bank_transfer', amountVnd: amount } },
        { version: hold.version },
      );
      expectProblem(r, 403, 'FORBIDDEN_ACTION');
      const n = await call(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(ctv)}/reservations/${hold.id}/deposit-notices`,
        {
          session: ctv,
          idempotencyKey: true,
          body: { amountVnd: amount, note: 'E2E đã chuyển khoản' },
        },
      );
      expect(n.status, JSON.stringify(n.body)).toBe(202);
      expect((await getReservation(request, ctv, hold.id)).body.status).toBe('hold');
    });
  },
);

test.describe(
  'L2 3.4 – hành động theo vai và hủy giữ chỗ (US-020, US-021)',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    const acts = (r: Reservation) => (r.allowedActions ?? []).map((a) => a.action);

    test('TC-L2-040 allowedActions của giữ chỗ do CTV tạo theo vai; SAL khác người tạo → 404', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-040', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.getReservation,
        EP.extendHold,
      ]);
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, ctv, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 1,
        holdHours: 24,
      });
      const asFd = await getReservation(request, fd, hold.id);
      expect(asFd.status).toBe(200);
      expect(acts(asFd.body)).toEqual(
        expect.arrayContaining(['confirm-deposit', 'extend-hold', 'cancel']),
      );
      const asSal = await getReservation(request, sal, hold.id);
      expect(asSal.status, statusOf(asSal)).toBe(404);
      const asCtv = await getReservation(request, ctv, hold.id);
      expect(asCtv.status).toBe(200);
      expect(acts(asCtv.body)).not.toContain('confirm-deposit');
      const e = await action(
        request,
        fd,
        hold.id,
        'extend-hold',
        { extraHours: 12 },
        {
          version: asFd.body.version,
        },
      );
      expect(e.status, statusOf(e)).toBe(200);
      expect(acts((await getReservation(request, fd, hold.id)).body)).not.toContain('extend-hold');
    });

    test('TC-L2-050 + TC-L2-051 hủy giữ chỗ: thiếu lý do → 422; dryRun nêu hoàn 0/giữ 0 không ghi; có lý do → cancelled', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-050', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.cancelReservation,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold, room: rm } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 2,
        holdHours: 24,
      });
      const path = `/v1/properties/${propertyIdOf(fd)}/reservations/${hold.id}/actions/cancel`;
      const noReason = await call(request, 'POST', path, {
        session: fd,
        idempotencyKey: true,
        ifMatch: `"${hold.version}"`,
        body: {},
      });
      expectProblem(noReason, 422, 'VALIDATION_FAILED');
      const dry = await call<{ cancellation: { refundableVnd: number; retainedVnd: number } }>(
        request,
        'POST',
        path,
        { session: fd, body: { reasonCode: 'guest_changed_mind', dryRun: true } },
      );
      expect(dry.status, JSON.stringify(dry.body)).toBe(200);
      expect(dry.body.cancellation.refundableVnd).toBe(0);
      expect(dry.body.cancellation.retainedVnd).toBe(0);
      expect((await getReservation(request, fd, hold.id)).body.status).toBe('hold');
      const ok = await action(request, fd, hold.id, 'cancel', { reasonCode: 'guest_changed_mind' });
      expect(ok.status, statusOf(ok)).toBe(200);
      expect(await isRoomFree(request, fd, rm, hold.arrivalDate, hold.departureDate)).toBe(true);
    });

    test('TC-L2-057 SAL hủy đơn mình chốt; CTV hủy giữ chỗ của mình; CTV hủy đơn confirmed → 403', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-057', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
        EP.cancelReservation,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const arr = () => addDays(today, 40 + Math.floor(Math.random() * 200));
      // SAL: giữ chỗ → xác nhận cọc → hủy
      const s1 = (
        await makeHold(request, sal, c, {
          rooms: c.rooms,
          arrival: arr(),
          nights: 1,
          holdHours: 24,
        })
      ).hold;
      const conf = await action(
        request,
        sal,
        s1.id,
        'confirm-deposit',
        { payment: { type: 'deposit', method: 'cash', amountVnd: s1.depositRequiredVnd ?? 0 } },
        { version: s1.version },
      );
      expect(conf.status, statusOf(conf)).toBe(200);
      const sc = await action(request, sal, s1.id, 'cancel', { reasonCode: 'guest_changed_mind' });
      expect(sc.status, statusOf(sc)).toBe(200);
      // CTV: hủy giữ chỗ của mình
      const h2 = (
        await makeHold(request, ctv, c, {
          rooms: c.rooms,
          arrival: arr(),
          nights: 1,
          holdHours: 24,
        })
      ).hold;
      const cc = await action(request, ctv, h2.id, 'cancel', { reasonCode: 'guest_changed_mind' });
      expect(cc.status, statusOf(cc)).toBe(200);
      // CTV: đơn đã confirmed (FD xác nhận cọc) → 403
      const h3 = (
        await makeHold(request, ctv, c, {
          rooms: c.rooms,
          arrival: arr(),
          nights: 1,
          holdHours: 24,
        })
      ).hold;
      const fc = await action(
        request,
        fd,
        h3.id,
        'confirm-deposit',
        {
          payment: {
            type: 'deposit',
            method: 'bank_transfer',
            amountVnd: h3.depositRequiredVnd ?? 0,
          },
        },
        { version: h3.version },
      );
      expect(fc.status, statusOf(fc)).toBe(200);
      const c3 = await action(request, ctv, h3.id, 'cancel', { reasonCode: 'guest_changed_mind' });
      expectProblem(c3, 403, 'FORBIDDEN_ACTION');
    });
  },
);
