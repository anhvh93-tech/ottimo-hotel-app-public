// S4-33 (NÊN-ÔĐ) + FB-R2-DOM-BE-22 – ca bổ sung cần đồng hồ ảo (project "clock", tuần tự):
// - TC-L2-026 [PO C1] US-139/AC3: đơn OTA xung đột chưa gán căn (`conflictState=open`) đến hôm nay → nhận phòng 409
//   `RESERVATION_UNASSIGNED`; xem trước nhận phòng có `unmet` = `not_unassigned`.
// - TC-L2-068 [PO C1] US-024/AC4: B14 sang căn `VD` → 409 `ROOM_NOT_READY`; sang căn đang khóa OOO → 409; không lý do →
//   422; đơn giữ nguyên; căn dọn xong → B14 được.
// - TC-L2-056 US-021/AC6: đơn `in_house` → hủy 409 `INVALID_TRANSITION`.
// - TC-L3-086 BR-602-05 / BR-417-03 (FB-R2-DOM-BE-22): hạn khai báo 23:00 cùng ngày nhận phòng thật; ngày đến trên khai
//   báo = ngày nhận phòng thật (khách tới 01:30 hôm sau; khách tới 04:40 nhận thêm đêm trước – B9a).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import {
  action,
  addDays,
  cleanupTracked,
  createReservation,
  createRoomBlock,
  getReservation,
  newGuest,
  oracle,
  reservationBody,
  room,
  s2Context,
  track,
  vnTime,
  type ProblemFields,
  type Room,
} from '../support/s2.js';
import {
  EP3,
  checkIn,
  dev,
  cleanRooms,
  inHouse,
  makeStay,
  p3,
  portalDate,
  stayAction,
  stepUp,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { toScanned } from '../support/s3-checkin.js';
import { checkOut } from '../support/s3-stay.js';

type Json = Record<string, unknown>;

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

/** Ngày đến trên dữ liệu khai báo (portal data, máy quầy được cấp + step-up) – BR-602, BR-417 (4). */
async function portalArrival(
  request: APIRequestContext,
  regId: string,
): Promise<string | undefined> {
  const fd = await sessionOrSkip(request, 'qa.fd');
  await toScanned(request, fd, regId);
  await stepUp(request, fd);
  const pd = await call<{ people: Array<{ fields: Array<{ label: string; value: string }> }> }>(
    request,
    'GET',
    p3(EP3.getPortalData, fd, { registrationId: regId }),
    dev(fd),
  );
  expect(pd.status, `getPortalData: ${JSON.stringify(pd.body).slice(0, 200)}`).toBe(200);
  return pd.body.people[0]?.fields.find((f) => f.label === 'reg.field.arrival_date')?.value;
}

async function statusOf(request: APIRequestContext, rm: Room): Promise<string | undefined> {
  const s = await sessionOrSkip(request, 'qa.fd');
  const r = await call<{ data: Array<{ roomId: string; status: string }> }>(
    request,
    'GET',
    p3(EP3.listRoomStatuses, s),
    { session: s },
  );
  return r.body.data.find((x) => x.roomId === rm.id)?.status;
}

test.describe(
  'S4-33 – ca bổ sung (NÊN-ÔĐ) và hạn khai báo 23:00 (FB-R2-DOM-BE-22)',
  { tag: ['@clock', '@sprint4'] },
  () => {
    test('TC-L2-026 (A) [PO C1] US-139/AC3: đơn OTA xung đột chưa gán căn (`conflictState=open`) đến hôm nay → xem trước nhận phòng có `not_unassigned`; nhận phòng 409 RESERVATION_UNASSIGNED, đơn giữ `confirmed`', async ({
      request,
    }) => {
      needClock('TC-L2-026');
      const D = virtualDay(realToday, 2);
      await at(request, D, '10:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const rm = room(c, '203');
      const w = { arrival: D, departure: addDays(D, 1) };
      const first = await createReservation(
        request,
        fd,
        reservationBody(c, { room: rm, ...w, guestId: await newGuest(request, fd) }),
      );
      expect(first.status, JSON.stringify(first.body).slice(0, 200)).toBe(201);
      track('reservation', first.body.id);
      const ota = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          ...w,
          kind: 'booking',
          guestId: await newGuest(request, fd),
          extra: { allowUnassigned: true },
        }),
      );
      expect(ota.status, JSON.stringify(ota.body).slice(0, 300)).toBe(201);
      track('reservation', ota.body.id);
      expect(ota.body.conflictState).toBe('open');
      await at(request, D, '14:00');
      const fd2 = await sessionOrSkip(request, 'qa.fd');
      const pv = await call<Json & { unmet?: string[] }>(
        request,
        'GET',
        p3(EP3.previewCheckIn, fd2, { reservationId: ota.body.id }),
        { session: fd2 },
      );
      expect(pv.status, JSON.stringify(pv.body).slice(0, 300)).toBe(200);
      expect(JSON.stringify(pv.body), 'xem trước nêu điều kiện chưa gán căn').toContain(
        'not_unassigned',
      );
      const ci = await checkIn(request, fd2, ota.body.id);
      expect(ci.status, JSON.stringify(ci.body).slice(0, 300)).toBe(409);
      expect((ci.body as ProblemFields).code).toBe('RESERVATION_UNASSIGNED');
      expect((await getReservation(request, fd2, ota.body.id)).body.status).toBe('confirmed');
    });

    test('TC-L2-068 (A) [PO C1] US-024/AC4 BR-424, BR-803: đơn đang ở; B14 sang 202 `VD` → 409 ROOM_NOT_READY (`roomStatus` VD); sang 401 đang khóa OOO → 409; sang căn khác không lý do → 422; đơn giữ nguyên căn; 202 dọn xong → B14 200', async ({
      request,
    }) => {
      needClock('TC-L2-068');
      const D = virtualDay(realToday, 4);
      // 202 có khách đêm D−1, trả sáng D → `VD`
      await at(request, addDays(D, -1), '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const prev = await inHouse(request, c, fd, {
        room: room(c, '202'),
        arrival: addDays(D, -1),
        nights: 1,
      });
      await at(request, D, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd');
      const std = await call<{
        items: Array<{ itemId: string; standardQty: number }>;
        periodId?: string | null;
      }>(request, 'GET', p3(EP3.getMinibarStandard, fd, { reservationId: prev.res.id }), {
        session: fd,
        query: { roomId: prev.room.id },
      });
      const mb = await call(
        request,
        'POST',
        p3(EP3.recordMinibarCheck, fd, { reservationId: prev.res.id }),
        {
          session: fd,
          idempotencyKey: true,
          body: {
            mode: 'checkout',
            roomId: prev.room.id,
            periodId: std.body.periodId ?? null,
            lines: std.body.items.map((i) => ({ itemId: i.itemId, remainingQty: i.standardQty })),
          },
        },
      );
      expect(mb.status, JSON.stringify(mb.body).slice(0, 200)).toBe(201);
      const out = await checkOut(request, fd, prev.res.id, { checkoutTime: '09:00' });
      expect(out.status, JSON.stringify(out.body).slice(0, 200)).toBe(200);
      expect(await statusOf(request, room(c, '202')), '202 cần dọn').toBe('VD');
      // đơn đang ở (203), 401 khóa OOO hôm nay
      await at(request, D, '14:00');
      fd = await sessionOrSkip(request, 'qa.fd');
      const st = await inHouse(request, c, fd, { room: room(c, '203'), arrival: D, nights: 2 });
      const mt = await sessionOrSkip(request, 'qa.mt');
      const blk = await createRoomBlock(request, mt, {
        roomId: room(c, '401').id,
        startDate: D,
        endDatePlanned: addDays(D, 2),
        reason: 'E2E TC-L2-068 sua dieu hoa',
      });
      expect(blk.status, JSON.stringify(blk.body).slice(0, 200)).toBe(201);
      fd = await sessionOrSkip(request, 'qa.fd');
      const move = (to: Room, extra: Json = {}) =>
        stayAction<Json & ProblemFields>(request, fd, st.res.id, 'change-room', {
          newRoomId: to.id,
          effectiveDate: D,
          cause: 'property_fault',
          reason: 'Dieu hoa hong',
          ...extra,
        });
      const vd = await move(room(c, '202'));
      expect(vd.status, `sang 202 VD: ${JSON.stringify(vd.body).slice(0, 200)}`).toBe(409);
      expect(vd.body.code).toBe('ROOM_NOT_READY');
      expect(vd.body.roomStatus).toBe('VD');
      const ooo = await move(room(c, '401'));
      expect(ooo.status, `sang 401 OOO: ${JSON.stringify(ooo.body).slice(0, 200)}`).toBe(409);
      expect(String(ooo.body.code)).toMatch(/ROOM_BLOCKED|ROOM_NOT_READY|ROOM_UNAVAILABLE/);
      const noReason = await stayAction<Json & ProblemFields>(
        request,
        fd,
        st.res.id,
        'change-room',
        {
          newRoomId: room(c, '302').id,
          effectiveDate: D,
          cause: 'property_fault',
        },
      );
      expect(noReason.status, `không lý do: ${JSON.stringify(noReason.body).slice(0, 200)}`).toBe(
        422,
      );
      const cur = await getReservation(request, fd, st.res.id);
      expect(cur.body.segments?.at(-1)?.roomId, 'đơn giữ nguyên căn').toBe(st.room.id);
      // 202 dọn xong → B14 được
      for (const [event, from] of [
        ['start_cleaning', 'VD'],
        ['finish_cleaning', 'CL'],
      ] as const) {
        const r = await call(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(fd)}/rooms/${room(c, '202').id}/status-transitions`,
          {
            session: fd,
            idempotencyKey: true,
            body: { event, expectedFrom: from, performedAt: vnTime(D, '14:00') },
          },
        );
        expect(r.status, `${event}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
      }
      const pv = await stayAction<Json & ProblemFields>(
        request,
        fd,
        st.res.id,
        'change-room',
        {
          newRoomId: room(c, '202').id,
          effectiveDate: D,
          cause: 'property_fault',
          reason: 'Dieu hoa hong',
        },
        { dryRun: true },
      );
      const delta = Number(pv.body.folioDeltaVnd ?? 0);
      const ok = await move(
        room(c, '202'),
        delta !== 0 ? { applyDifference: true, expectedDeltaVnd: delta } : {},
      );
      expect(ok.status, `202 sạch: ${JSON.stringify(ok.body).slice(0, 200)}`).toBe(200);
    });

    test('TC-L2-056 (A) US-021/AC6: đơn `in_house` gọi hủy → 409 INVALID_TRANSITION, đơn vẫn `in_house` (hướng sang trả sớm)', async ({
      request,
    }) => {
      needClock('TC-L2-056');
      const D = virtualDay(realToday, 2);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const st = await inHouse(request, c, fd, {
        room: room(c, '301'),
        alternatives: c.rooms,
        arrival: D,
        nights: 1,
      });
      const r = await action<Json & ProblemFields>(request, fd, st.res.id, 'cancel', {
        reasonCode: 'found_other',
        note: 'Khach doi y',
      });
      expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(409);
      expect(r.body.code).toBe('INVALID_TRANSITION');
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('in_house');
    });

    test('TC-L3-086 (A) BR-602-05 / BR-417-03 (FB-R2-DOM-BE-22): (a) khách VN của đơn đến D tới quầy 01:30 ngày D+1 → hạn khai báo 23:00 ngày D+1, ngày đến trên khai báo D+1; (b) đơn Trực tiếp 201 đến D, khách tới 04:40 ngày D (đêm trước trống, B9a thêm đêm) → đơn thành D−1…, ngày đến trên khai báo D, hạn 23:00 ngày D', async ({
      request,
    }) => {
      needClock('TC-L3-086');
      const o5 = oracle('BR-602-05');
      const o3 = oracle('BR-417-03');
      const D = virtualDay(realToday, 4);
      await at(request, addDays(D, -1), '20:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      // (a) đơn đến D (VN) – khách tới 01:30 ngày D+1 (ngày nghiệp vụ vẫn D)
      const a = await makeStay(request, c, fd, {
        room: room(c, '203'),
        arrival: D,
        nights: 2,
        adults: 1,
      });
      // (b) đơn Trực tiếp 201 đến D – đêm D−1 trống
      const b = await makeStay(request, c, fd, {
        room: room(c, String(o3.input.room)),
        arrival: D,
        nights: 1,
        adults: 1,
      });
      // ── (b) 04:40 ngày D: B9a thêm đêm trước ──
      await at(request, D, String(o3.input.checkinAt).slice(11, 16));
      fd = await sessionOrSkip(request, 'qa.fd');
      const pv = await call<Json>(
        request,
        'GET',
        p3(EP3.previewCheckIn, fd, { reservationId: b.res.id }),
        {
          session: fd,
        },
      );
      expect(pv.status, JSON.stringify(pv.body).slice(0, 300)).toBe(200);
      const prior = (pv.body.priorNight ?? {}) as Json;
      expect(prior.available, 'đêm trước trống').toBe(true);
      const cb = await checkIn(request, fd, b.res.id, {
        addPriorNight: true,
        ...(prior.defaultRateVnd !== undefined
          ? { expectedSurchargeVnd: Number(prior.defaultRateVnd) }
          : {}),
      });
      expect(cb.status, `B9a: ${JSON.stringify(cb.body).slice(0, 300)}`).toBe(200);
      const bNow = (await getReservation(request, fd, b.res.id)).body;
      expect(bNow.arrivalDate, 'đơn Trực tiếp thành D−1').toBe(addDays(D, -1));
      const regB = await call<Json>(
        request,
        'GET',
        p3(EP3.getRegistration, fd, { registrationId: b.regId }),
        {
          session: fd,
        },
      );
      expect(regB.status).toBe(200);
      expect(regB.body.arrivalDate, 'danh sách khai báo: ngày đến của đơn (D−1)').toBe(
        addDays(D, -1),
      );
      expect(new Date(String(regB.body.deadlineAt)).getTime(), 'hạn 23:00 ngày D (BR-417-03)').toBe(
        new Date(vnTime(D, String(o3.expected.registrationDeadline).slice(11, 16))).getTime(),
      );
      // ── (a) 01:30 ngày D+1 ──
      const d1 = addDays(D, 1);
      await at(request, d1, String(o5.input.arrivedAt).slice(11, 16));
      fd = await sessionOrSkip(request, 'qa.fd');
      const ca = await checkIn(request, fd, a.res.id);
      expect(ca.status, `nhận phòng 01:30: ${JSON.stringify(ca.body).slice(0, 300)}`).toBe(200);
      const regA = await call<Json>(
        request,
        'GET',
        p3(EP3.getRegistration, fd, { registrationId: a.regId }),
        {
          session: fd,
        },
      );
      expect(regA.status).toBe(200);
      expect(
        await portalArrival(request, a.regId),
        'ngày đến trên khai báo = ngày tới quầy (BR-602-05)',
      ).toBe(portalDate(d1));
      expect(
        await portalArrival(request, b.regId),
        'ngày đến trên khai báo = ngày nhận phòng thật (BR-417-03)',
      ).toBe(portalDate(D));
      expect(
        new Date(String(regA.body.deadlineAt)).getTime(),
        'hạn 23:00 ngày D+1 (BR-602-05)',
      ).toBe(new Date(vnTime(d1, String(o5.expected.deadline).slice(11, 16))).getTime());
    });
  },
);
