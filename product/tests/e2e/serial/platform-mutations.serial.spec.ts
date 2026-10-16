// E2E API – EP00 cases that change LIVE shared state (parameter effective today, room price, sellable flag,
// capacity). They run in project `serial` (one worker, after every API/UI project, before `clock`), so no
// parallel booking test sees a changed price/capacity, and every case restores what it changed (finally).
// TC: TC-NT-011 (US-005 AC1), TC-NT-018 (US-004 AC1), TC-NT-019 (US-004 AC2), TC-NT-039 / TC-NT-040 (a–d)
// (US-004 AC3, BUG-R2-025). Un-skipped at Sprint 3 kickoff (PO acceptance N-1): the endpoints are on the build.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type Problem,
  type StaffSession,
} from '../support/api.js';
import {
  EP,
  addDays,
  calculateQuote,
  cleanupTracked,
  createReservation,
  freeWindow,
  getReservation,
  newGuest,
  quoteInput,
  reservationBody,
  room,
  s2Context,
  saveQuote,
  track,
  type Reservation,
} from '../support/s2.js';

const R = '/v1/properties/{propertyId}';
const SET: [string, string, string] = ['PUT', `${R}/parameters/{key}`, 'setParameter'];
const UPDATE_ROOM: [string, string, string] = ['PATCH', `${R}/rooms/{roomId}`, 'updateRoom'];

interface RoomRow {
  id: string;
  roomNo: string;
  baseOccupancy: number;
  maxOccupancy: number;
  isSellable?: boolean;
  version: number;
  currentListPrice?: { monthlyListPriceVnd?: number; nightlyListPriceVnd?: number };
}

function list<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  for (const v of Object.values((body ?? {}) as Record<string, unknown>))
    if (Array.isArray(v)) return v as T[];
  return [];
}

async function getRoom(ctx: APIRequestContext, s: StaffSession, roomNo: string): Promise<RoomRow> {
  const r = await call(ctx, 'GET', `/v1/properties/${propertyIdOf(s)}/rooms`, { session: s });
  const rm = list<RoomRow>(r.body).find((x) => x.roomNo === roomNo);
  if (!rm) throw new Error(`listRooms: không có căn ${roomNo}`);
  return rm;
}

async function patchRoom(
  ctx: APIRequestContext,
  s: StaffSession,
  roomNo: string,
  body: Record<string, unknown>,
) {
  const rm = await getRoom(ctx, s, roomNo);
  return call<RoomRow & Problem>(ctx, 'PATCH', `/v1/properties/${propertyIdOf(s)}/rooms/${rm.id}`, {
    session: s,
    ifMatch: `"${rm.version}"`,
    body,
  });
}

async function setParamToday(
  ctx: APIRequestContext,
  s: StaffSession,
  key: string,
  value: unknown,
  today: string,
) {
  return call<Problem>(ctx, 'PUT', `/v1/properties/${propertyIdOf(s)}/parameters/${key}`, {
    session: s,
    body: { value, effectiveFrom: today, reason: 'E2E QA – TC-NT-011 (khôi phục ngay sau ca)' },
  });
}

test.describe(
  'L1 – thay đổi cấu hình đang hiệu lực (chạy tuần tự)',
  { tag: ['@api', '@serial'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-NT-011 đổi hold_hours_default 24 → 12 chỉ áp cho giữ chỗ mới (snapshot BR-006)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-011', [
        SET,
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.getReservation,
      ]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      // "không chọn mức" = form lấy mặc định từ getBookingRules.holdHoursDefault (createHoldFromQuote bắt buộc
      // holdHours – OpenAPI 0.3.5); server phải trả mặc định mới ngay sau khi đổi tham số.
      const rulesDefault = async () =>
        (
          await call<{ holdHoursDefault?: number }>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(sal)}/booking-rules`,
            { session: sal },
          )
        ).body.holdHoursDefault;
      const hold = async (roomNo: string) => {
        const rm = room(c, roomNo);
        const w = await freeWindow(request, sal, rm, 2, { today, minOffset: 20, maxOffset: 200 });
        const q = await saveQuote(request, sal, {
          ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 2 }),
          guestId: await newGuest(request, sal),
        });
        expect(q.status, JSON.stringify(q.body)).toBe(201);
        const h = await call<Reservation>(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(sal)}/quotes/${q.body.id}/actions/create-hold`,
          { session: sal, idempotencyKey: true, body: { holdHours: await rulesDefault() } },
        );
        expect(h.status, JSON.stringify(h.body)).toBe(201);
        track('reservation', h.body.id);
        return h.body;
      };
      const h1 = await hold('301');
      try {
        const set = await setParamToday(request, owner, 'hold_hours_default', 12, today);
        expect(set.status, JSON.stringify(set.body)).toBe(200);
        expect(await rulesDefault(), 'getBookingRules trả mặc định mới').toBe(12);
        const h2 = await hold('401');
        expect(h2.hold?.hours, 'H2 dùng mặc định mới 12 giờ').toBe(12);
        const h1After = await getReservation(request, sal, h1.id);
        expect(h1After.body.hold?.hours, 'H1 giữ mức cũ (snapshot)').toBe(h1.hold?.hours);
        expect(h1After.body.hold?.expiresAt).toBe(h1.hold?.expiresAt);
      } finally {
        await setParamToday(request, owner, 'hold_hours_default', 24, today);
      }
    });

    test('TC-NT-018 đổi giá niêm yết không đổi báo giá/đơn đã lưu', async ({ request }) => {
      await requireEndpoints(request, 'TC-NT-018', [
        UPDATE_ROOM,
        EP.calculateQuote,
        EP.saveQuote,
        EP.getQuote,
      ]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '203');
      const before = await getRoom(request, owner, '203');
      const oldMonthly = before.currentListPrice?.monthlyListPriceVnd ?? 9_500_000;
      // weekday night, no special date: price = list price (BR-101: monthly ÷ 12, rounded 1.000)
      const w = await freeWindow(request, fd, rm, 1, {
        today,
        minOffset: 20,
        maxOffset: 200,
        dow: 2,
      });
      const q1 = await saveQuote(request, fd, {
        ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 1 }),
        guestId: await newGuest(request, fd),
      });
      expect(q1.status, JSON.stringify(q1.body)).toBe(201);
      const r1 = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival: w.arrival,
          departure: w.departure,
          guestId: await newGuest(request, fd),
        }),
      );
      expect(r1.status, JSON.stringify(r1.body)).toBe(201);
      track('reservation', r1.body.id);
      const q1Total = q1.body.totalVnd;
      const r1Total = r1.body.totalRoomVnd;
      try {
        const up = await patchRoom(request, owner, '203', {
          listPrice: {
            effectiveFrom: today,
            monthlyListPriceVnd: 10_200_000,
            reason: 'E2E TC-NT-018',
          },
        });
        expect(up.status, JSON.stringify(up.body)).toBe(200);
        const calc = await calculateQuote(
          request,
          fd,
          quoteInput(c, { room: rm, arrival: w.arrival, nights: 1 }),
        );
        expect(calc.status, JSON.stringify(calc.body)).toBe(200);
        expect(calc.body.nightlyRates?.[0]?.amountVnd, 'giá đêm mới = 10.200.000 ÷ 12').toBe(
          850_000,
        );
        const q1After = await call<{ totalVnd?: number }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/quotes/${q1.body.id}`,
          { session: fd },
        );
        expect(q1After.body.totalVnd, 'báo giá đã lưu giữ giá cũ').toBe(q1Total);
        const r1After = await getReservation(request, fd, r1.body.id);
        expect(r1After.body.totalRoomVnd, 'đơn đã lưu giữ giá cũ').toBe(r1Total);
      } finally {
        await patchRoom(request, owner, '203', {
          listPrice: {
            effectiveFrom: today,
            monthlyListPriceVnd: oldMonthly,
            reason: 'E2E TC-NT-018 khôi phục',
          },
        });
      }
    });

    test('TC-NT-019 căn ngừng bán → createReservation 409 ROOM_NOT_SELLABLE; rack có cờ ngừng bán', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-019', [UPDATE_ROOM, EP.createReservation, EP.getRack]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '402');
      const w = await freeWindow(request, fd, rm, 2, { today, minOffset: 20, maxOffset: 200 });
      try {
        const off = await patchRoom(request, owner, '402', { isSellable: false });
        expect(off.status, JSON.stringify(off.body)).toBe(200);
        const r = await createReservation(
          request,
          fd,
          reservationBody(c, {
            room: rm,
            arrival: w.arrival,
            departure: w.departure,
            guestId: await newGuest(request, fd),
          }),
        );
        if (r.status === 201) track('reservation', r.body.id);
        expectProblem(r, 409, 'ROOM_NOT_SELLABLE');
        const rack = await call(request, 'GET', `/v1/properties/${propertyIdOf(fd)}/rack`, {
          session: fd,
          query: { from: today, days: 14 },
        });
        expect(rack.status).toBe(200);
        const row = JSON.stringify(rack.body).match(/\{[^{}]*"roomNo":"402"[^{}]*\}/)?.[0] ?? '';
        expect(row, 'dòng 402 trên rack mang cờ ngừng bán').toMatch(
          /"isSellable":false|"sellable":false|not_sellable/,
        );
      } finally {
        await patchRoom(request, owner, '402', { isSellable: true });
      }
    });

    test.describe('US-004 AC3 – CAPACITY_BELOW_BOOKINGS (BUG-R2-025)', () => {
      // BUG-R2-025 (QC-S2-01, ĐK-S2-2): BE-A nối ReservationCapacityCheck vào ROOM_CAPACITY_CHECK (Sprint 3). Ca của
      // BE-A ở api/room-capacity.api.spec.ts chỉ kiểm 409; ở đây là TC đầy đủ (bằng số khách, trẻ < 6, conflicts[]).
      test('TC-NT-039 giảm sức chứa dưới số khách của đơn tương lai → 409 CAPACITY_BELOW_BOOKINGS; hủy đơn → 200', async ({
        request,
      }) => {
        await requireEndpoints(request, 'TC-NT-039', [
          UPDATE_ROOM,
          EP.createReservation,
          EP.cancelReservation,
        ]);
        const owner = await sessionOrSkip(request, 'qa.owner');
        const fd = await sessionOrSkip(request, 'qa.fd');
        const c = await s2Context(request);
        const today = await stackToday(request);
        const rm = room(c, '302'); // định mức 3, tối đa 4
        const base = await getRoom(request, owner, '302');
        const w = await freeWindow(request, fd, rm, 2, { today, minOffset: 20, maxOffset: 200 });
        // 2 người lớn + 2 trẻ 6–11 → 4 người tính sức chứa (BR-110)
        const r = await createReservation(
          request,
          fd,
          reservationBody(c, {
            room: rm,
            arrival: w.arrival,
            departure: w.departure,
            adults: 2,
            children6to11: 2,
            guestId: await newGuest(request, fd),
          }),
        );
        expect(r.status, JSON.stringify(r.body)).toBe(201);
        track('reservation', r.body.id);
        try {
          const down = await patchRoom(request, owner, '302', {
            maxOccupancy: base.maxOccupancy - 1,
          });
          const p = expectProblem(down, 409, 'CAPACITY_BELOW_BOOKINGS');
          const conflicts = JSON.stringify(
            (p as Problem & { conflicts?: unknown }).conflicts ?? '',
          );
          expect(conflicts).toContain(r.body.code);
          expect(conflicts).toContain(w.arrival);
          expect((await getRoom(request, owner, '302')).maxOccupancy).toBe(base.maxOccupancy);
          // (a) bằng số khách → 200 (không phải "dưới")
          const same = await patchRoom(request, owner, '302', { maxOccupancy: base.maxOccupancy });
          expect(same.status, JSON.stringify(same.body)).toBe(200);
          // sau khi hủy đơn → giảm được
          const cur = await getReservation(request, owner, r.body.id);
          await call(
            request,
            'POST',
            `/v1/properties/${propertyIdOf(owner)}/reservations/${r.body.id}/actions/cancel`,
            {
              session: owner,
              idempotencyKey: true,
              ifMatch: `"${cur.body.version}"`,
              body: { reasonCode: 'other', note: 'E2E TC-NT-039' },
            },
          );
          const ok = await patchRoom(request, owner, '302', {
            maxOccupancy: base.maxOccupancy - 1,
          });
          expect([200, 409]).toContain(ok.status); // 409 chỉ khi stack còn đơn khác của 302 (stack dùng chung)
        } finally {
          await patchRoom(request, owner, '302', { maxOccupancy: base.maxOccupancy });
        }
      });

      test('TC-NT-040(b)(c) trẻ dưới 6 không tính; đơn 3 người lớn chặn giảm 3 → 2 và conflicts[] chỉ có đơn đó', async ({
        request,
      }) => {
        await requireEndpoints(request, 'TC-NT-040', [UPDATE_ROOM, EP.createReservation]);
        const owner = await sessionOrSkip(request, 'qa.owner');
        const fd = await sessionOrSkip(request, 'qa.fd');
        const c = await s2Context(request);
        const today = await stackToday(request);
        const rm = room(c, '202'); // định mức 2, tối đa 3
        const base = await getRoom(request, owner, '202');
        const w = await freeWindow(request, fd, rm, 4, { today, minOffset: 20, maxOffset: 200 });
        const mid = addDays(w.arrival, 2);
        const kid = await createReservation(
          request,
          fd,
          reservationBody(c, {
            room: rm,
            arrival: w.arrival,
            departure: mid,
            adults: 2,
            childrenUnder6: 1,
            guestId: await newGuest(request, fd),
          }),
        );
        expect(kid.status, JSON.stringify(kid.body)).toBe(201);
        track('reservation', kid.body.id);
        try {
          // (b) 2 người lớn + 1 trẻ 4 tuổi = 2 người tính → giảm 3 → 2 được
          const b = await patchRoom(request, owner, '202', { maxOccupancy: 2 });
          expect(b.status, JSON.stringify(b.body)).toBe(200);
          await patchRoom(request, owner, '202', { maxOccupancy: base.maxOccupancy });
          // (c) thêm đơn 3 người lớn → giảm 3 → 2 bị chặn, conflicts[] chỉ có đơn 3 người lớn
          const three = await createReservation(
            request,
            fd,
            reservationBody(c, {
              room: rm,
              arrival: mid,
              departure: w.departure,
              adults: 3,
              guestId: await newGuest(request, fd),
            }),
          );
          expect(three.status, JSON.stringify(three.body)).toBe(201);
          track('reservation', three.body.id);
          const cc = await patchRoom(request, owner, '202', { maxOccupancy: 2 });
          const p = expectProblem(cc, 409, 'CAPACITY_BELOW_BOOKINGS');
          const conflicts = JSON.stringify(
            (p as Problem & { conflicts?: unknown }).conflicts ?? '',
          );
          expect(conflicts).toContain(three.body.code);
          expect(conflicts).not.toContain(kid.body.code);
        } finally {
          await patchRoom(request, owner, '202', { maxOccupancy: base.maxOccupancy });
        }
      });
    });
  },
);
