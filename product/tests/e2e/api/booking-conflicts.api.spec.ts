// E2E API – Sprint 2 chống đặt trùng (US-018) và đơn OTA nhập tay vào căn đã kín (US-139).
// TC: r1-main-flows.md 3.3. Trùng đêm theo khoảng nửa mở [đến, đi) – BR-002 (oracle BR-002-01).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  bookFree,
  cleanupTracked,
  conflictNights,
  createReservation,
  freeWindow,
  getReservation,
  isRoomFree,
  newGuest,
  oracle,
  reservationBody,
  room,
  s2Context,
  statusOf,
  track,
  type Reservation,
  type S2Context,
} from '../support/s2.js';

test.describe.configure({ mode: 'parallel' });

const L12 = ['101', '102', '103', '201', '202', '203'];

test.describe('L2 3.3 – chống đặt trùng (US-018)', { tag: ['@api', '@sprint2'] }, () => {
  test.beforeEach(() => needSeedPassword());
  test.afterEach(async ({ request }) => cleanupTracked(request));

  test('TC-L2-020 đơn chồng 1 đêm → 409 ROOM_UNAVAILABLE + conflicts[] đúng đêm + gợi ý', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-020', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '201');
    const a = await bookFree(request, fd, c, { room: rm, nights: 2, today }); // [D, D+2)
    const arrival = addDays(a.arrivalDate, 1);
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival,
        departure: addDays(arrival, 2),
        guestId: await newGuest(request, fd),
      }),
    );
    const p = expectProblem(r, 409, 'ROOM_UNAVAILABLE');
    expect(conflictNights(p)).toEqual([arrival]);
    expect(JSON.stringify(p.conflicts)).toContain(a.code);
    expect(Array.isArray(p.suggestions), JSON.stringify(p)).toBe(true);
    for (const sgt of (p.suggestions as Array<{ roomNo: string }>) ?? []) {
      expect(sgt.roomNo).not.toBe(rm.roomNo);
    }
  });

  test('TC-L2-020 (thứ tự kiểm EP02 3.4) trùng đêm mà chưa kèm cọc → vẫn 409 ROOM_UNAVAILABLE (chống trùng trước tiền)', async ({
    request,
  }) => {
    test.fail(true, 'BUG-R2-019 (Open) – server kiểm cọc trước khối OOO/chống trùng; xem bug-list');
    await requireEndpoints(request, 'TC-L2-020', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '201');
    const a = await bookFree(request, fd, c, { room: rm, nights: 2, today });
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: a.arrivalDate,
        departure: a.departureDate,
        guestId: await newGuest(request, fd),
      }),
      true,
      { autoDeposit: false },
    );
    expectProblem(r, 409, 'ROOM_UNAVAILABLE');
  });

  test('TC-L2-024 (gợi ý) căn trống thay thế: cùng nhóm hoặc nhóm cao hơn, không gợi ý nhóm thấp hơn (BR-312, OpenAPI suggestions)', async ({
    request,
  }) => {
    test.fail(
      true,
      'BUG-R2-020 (Open) – gợi ý gồm cả nhóm thấp hơn, gắn upgrade=true; xem bug-list',
    );
    await requireEndpoints(request, 'TC-L2-024', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '402'); // NPLUS – nhóm cao nhất (sortOrder 3 của DS-E)
    const a = await bookFree(request, fd, c, { room: rm, nights: 2, today });
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: a.arrivalDate,
        departure: a.departureDate,
        guestId: await newGuest(request, fd),
      }),
    );
    const p = expectProblem(r, 409, 'ROOM_UNAVAILABLE');
    const sug = (p.suggestions as Array<{ roomNo: string; roomGroupCode?: string }>) ?? [];
    expect(
      sug.filter((x) => x.roomGroupCode !== 'NPLUS').map((x) => `${x.roomNo}/${x.roomGroupCode}`),
    ).toEqual([]);
  });

  test('TC-L2-022 ngày đi của A = ngày đến của B được; chồng 1 đêm thì không (BR-002 nửa mở)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-022', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const o = oracle('BR-002-01'); // 19→22/10 = 3 đêm 19, 20, 21
    expect(o.expected.nights).toBe(3);
    const rm = room(c, '201');
    const w = await freeWindow(request, fd, rm, 5, { today });
    const guestId = await newGuest(request, fd);
    const A = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: w.arrival,
        departure: addDays(w.arrival, 3),
        guestId,
      }),
    );
    expect(A.status, JSON.stringify(A.body)).toBe(201);
    track('reservation', A.body.id);
    const B = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: addDays(w.arrival, 3),
        departure: addDays(w.arrival, 5),
        guestId,
      }),
    );
    expect(B.status, JSON.stringify(B.body)).toBe(201);
    track('reservation', B.body.id);
    const C = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: addDays(w.arrival, 2),
        departure: addDays(w.arrival, 3),
        guestId,
      }),
    );
    const p = expectProblem(C, 409, 'ROOM_UNAVAILABLE');
    expect(conflictNights(p)).toEqual([addDays(w.arrival, 2)]);
  });

  test('TC-L2-023 (4) đổi căn/ngày vào đêm đã có đơn → 409, đơn nguồn giữ nguyên', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-023', [EP.createReservation, EP.moveReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const target = await bookFree(request, fd, c, { room: room(c, '201'), nights: 2, today });
    const w = { arrival: target.arrivalDate, departure: target.departureDate };
    const src = room(c, '102');
    if ((await isRoomFree(request, fd, src, w.arrival, w.departure)) === false) {
      test.skip(true, 'môi trường: căn nguồn 102 không trống cùng khoảng');
    }
    const s = await createReservation(
      request,
      fd,
      reservationBody(c, { room: src, ...w, guestId: await newGuest(request, fd) }),
    );
    expect(s.status, JSON.stringify(s.body)).toBe(201);
    track('reservation', s.body.id);
    const mv = await action(request, fd, s.body.id, 'move', {
      roomId: room(c, '201').id,
      reasonCode: 'guest_request',
    });
    expectProblem(mv, 409, 'ROOM_UNAVAILABLE');
    const after = await getReservation(request, fd, s.body.id);
    expect(after.body.version).toBe(s.body.version);
    expect(after.body.segments?.[0]?.roomId).toBe(src.id);
  });
});

/** Book every room for [arrival, departure) (409 = already full – fine). Returns what we created. */
async function fillAllRooms(
  ctx: APIRequestContext,
  fd: StaffSession,
  c: S2Context,
  arrival: string,
  departure: string,
): Promise<Map<string, Reservation>> {
  const guestId = await newGuest(ctx, fd);
  const mine = new Map<string, Reservation>();
  for (const rm of c.rooms) {
    const r = await createReservation(
      ctx,
      fd,
      reservationBody(c, { room: rm, arrival, departure, guestId }),
    );
    if (r.status === 201) {
      track('reservation', r.body.id);
      mine.set(rm.roomNo, r.body);
    } else {
      expect([409], `lấp căn ${rm.roomNo}: ${statusOf(r)}`).toContain(r.status);
    }
  }
  return mine;
}

test.describe(
  'L2 3.3 – đơn OTA nhập tay vào căn kín (US-018 AC5, US-139)',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L2-024 (1)(2) OTA vào căn đã có đơn → 409 + gợi ý cùng nhóm; gán căn gợi ý → conflictState none', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-024', [EP.createReservation]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '203');
      const direct = await bookFree(request, fd, c, { room: rm, nights: 2, today });
      const w = { arrival: direct.arrivalDate, departure: direct.departureDate };
      const guestId = await newGuest(request, fd);
      const r1 = await createReservation(
        request,
        fd,
        reservationBody(c, { room: rm, ...w, guestId, kind: 'booking' }),
      );
      const p = expectProblem(r1, 409, 'ROOM_UNAVAILABLE');
      const sug =
        (p.suggestions as Array<{ roomId: string; roomNo: string; upgrade: boolean }>) ?? [];
      expect(sug.length, JSON.stringify(p)).toBeGreaterThan(0);
      const same = sug.filter((x) => !x.upgrade);
      // cùng nhóm đứng trước nhóm cao hơn
      if (same.length > 0) expect(sug[0]!.upgrade).toBe(false);
      for (const x of same) expect(L12).toContain(x.roomNo);
      const pick = sug[0]!;
      const r2 = await createReservation(
        request,
        fd,
        reservationBody(c, { room: room(c, pick.roomNo), ...w, guestId, kind: 'booking' }),
      );
      expect(r2.status, JSON.stringify(r2.body)).toBe(201);
      track('reservation', r2.body.id);
      expect(r2.body.conflictState).toBe('none');
    });

    test('TC-L2-024 (3) + TC-L2-027 + TC-L2-028 mọi căn kín: OTA → Chưa gán căn; Trực tiếp không được; gán căn khi trống', async ({
      request,
    }) => {
      test.slow();
      await requireEndpoints(request, 'TC-L2-024', [
        EP.createReservation,
        EP.listOverbookingIncidents,
        EP.assignRoom,
        EP.getRack,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const w = await freeWindow(request, fd, room(c, '203'), 2, { today, minOffset: 120 });
      const mine = await fillAllRooms(request, fd, c, w.arrival, w.departure);
      test.skip(mine.size === 0, 'môi trường: không lấp được căn nào trong khoảng đã chọn');
      const guestId = await newGuest(request, fd);
      const pid = propertyIdOf(fd);

      // TC-L2-027 (a): OTA không allowUnassigned → 409, gợi ý rỗng
      const a = await createReservation(
        request,
        fd,
        reservationBody(c, { room: room(c, '203'), ...w, guestId, kind: 'booking' }),
      );
      const pa = expectProblem(a, 409, 'ROOM_UNAVAILABLE');
      expect((pa.suggestions as unknown[] | undefined) ?? []).toHaveLength(0);
      // TC-L2-027 (b): Trực tiếp có allowUnassigned → 422
      const b = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: room(c, '203'),
          ...w,
          guestId,
          extra: { allowUnassigned: true },
        }),
      );
      expect(b.status, JSON.stringify(b.body)).toBe(422);

      // TC-L2-024 (3): OTA + allowUnassigned → confirmed, conflictState open, chưa gán căn
      const u = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: room(c, '203'),
          ...w,
          guestId,
          kind: 'booking',
          extra: { allowUnassigned: true },
        }),
      );
      expect(u.status, JSON.stringify(u.body)).toBe(201);
      track('reservation', u.body.id);
      expect(u.body.status).toBe('confirmed');
      expect(u.body.conflictState).toBe('open');
      expect((u.body.segments ?? []).every((sg) => sg.roomId === null)).toBe(true);
      const inc = await call<{ data: Array<{ reservationId: string; status: string }> }>(
        request,
        'GET',
        `/v1/properties/${pid}/overbooking-incidents`,
        { session: fd, query: { status: 'open' } },
      );
      expect(inc.status).toBe(200);
      expect(inc.body.data.some((x) => x.reservationId === u.body.id)).toBe(true);
      const rack = await call<{ unassigned?: Array<{ reservationId?: string }> }>(
        request,
        'GET',
        `/v1/properties/${pid}/rack`,
        { session: fd, query: { from: w.arrival, days: 14 } },
      );
      expect(rack.status).toBe(200);
      expect((rack.body.unassigned ?? []).some((x) => x.reservationId === u.body.id)).toBe(true);

      // TC-L2-028 (a): gán vào căn vẫn kín → 409
      const [fullNo, filler] = [...mine.entries()][0]!;
      const fa = await action(request, fd, u.body.id, 'assign-room', {
        roomId: room(c, fullNo).id,
        resolution: 'reassigned_same_group',
      });
      expectProblem(fa, 409, 'ROOM_UNAVAILABLE');
      // (b): giải phóng căn đó rồi gán → resolved
      const cancel = await action(request, fd, filler.id, 'cancel', {
        reasonCode: 'other',
        note: 'E2E dọn dữ liệu',
      });
      expect(cancel.status, statusOf(cancel)).toBe(200);
      const fb = await action(request, fd, u.body.id, 'assign-room', {
        roomId: room(c, fullNo).id,
        resolution: 'reassigned_same_group',
      });
      expect(fb.status, JSON.stringify(fb.body)).toBe(200);
      const after = await getReservation(request, fd, u.body.id);
      expect(after.body.conflictState).toBe('resolved');
      expect(after.body.segments?.[0]?.roomId).toBe(room(c, fullNo).id);
      const inc2 = await call<{
        data: Array<{ reservationId: string; status: string; resolution?: string }>;
      }>(request, 'GET', `/v1/properties/${pid}/overbooking-incidents`, { session: fd });
      const mineInc = inc2.body.data.find((x) => x.reservationId === u.body.id);
      expect(mineInc?.status).toBe('resolved');
      expect(mineInc?.resolution).toBe('reassigned_same_group');
    });
  },
);
