// E2E API – Sprint 2 khóa phòng bảo trì (OOO, SM-02) chặn bán: US-019, US-061 (phần khối khóa), TC-L2-023 (7)(8).
// Khối nửa mở [startDate, endDatePlanned) – endDatePlanned = ngày mở bán lại (oracle BR-804-01, BR-804-02).
// Khối dùng ngày tương lai ngẫu nhiên, hủy ở afterEach (transitionRoomBlock cancel) để không giữ tồn trên stack dùng chung.
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type Problem,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  bookFree,
  cleanupTracked,
  createReservation,
  createRoomBlock,
  freeWindow,
  isRoomFree,
  newGuest,
  nightsOf,
  oracle,
  quoteInput,
  reservationBody,
  room,
  s2Context,
  saveQuote,
  createHold,
  track,
  type ProblemFields,
} from '../support/s2.js';

test.describe.configure({ mode: 'parallel' });

test.describe('OOO chặn bán (US-019, US-061)', { tag: ['@api', '@sprint2'] }, () => {
  test.beforeEach(() => needSeedPassword());
  test.afterEach(async ({ request }) => cleanupTracked(request));

  test('TC-L2-030 khối planned chặn tạo đơn, giữ chỗ, báo giá → ROOM_BLOCKED', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-030', [
      EP.createRoomBlock,
      EP.createReservation,
      EP.calculateQuote,
      EP.saveQuote,
      EP.createHoldFromQuote,
    ]);
    const mt = await sessionOrSkip(request, 'qa.mt');
    const fd = await sessionOrSkip(request, 'qa.fd');
    const sal = await sessionOrSkip(request, 'qa.sal');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '401');
    const w = await freeWindow(request, fd, rm, 3, { today, minOffset: 40, dow: 1 }); // T2: đêm giữa là T3
    const blk = await createRoomBlock(request, mt, {
      roomId: rm.id,
      startDate: w.arrival,
      endDatePlanned: w.departure,
      reason: 'E2E TC-L2-030 hỏng bình nóng lạnh',
    });
    expect(blk.status, JSON.stringify(blk.body)).toBe(201);
    expect(blk.body.status).toBe('planned');
    const mid = addDays(w.arrival, 1);
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: mid,
        departure: addDays(mid, 1),
        guestId: await newGuest(request, fd),
      }),
    );
    expectProblem(r, 409, 'ROOM_BLOCKED');
    const calc = await call<{ availability?: { available?: boolean }; warnings?: string[] }>(
      request,
      'POST',
      `/v1/properties/${propertyIdOf(sal)}/quotes/calculate`,
      { session: sal, body: quoteInput(c, { room: rm, arrival: mid, nights: 1 }) },
    );
    expect(calc.status, JSON.stringify(calc.body)).toBe(200);
    expect(calc.body.availability?.available).toBe(false);
    const q = await saveQuote(request, sal, {
      ...quoteInput(c, { room: rm, arrival: mid, nights: 1 }),
      guestId: await newGuest(request, sal),
    });
    expect(q.status, JSON.stringify(q.body)).toBe(201);
    const h = await createHold(request, sal, q.body.id, 24);
    expectProblem(h, 409, 'ROOM_BLOCKED');
  });

  test('TC-L2-031 + TC-L2-032 khối nửa mở: tìm phòng trống bỏ căn khóa; ngày mở bán lại bán được', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-032', [
      EP.createRoomBlock,
      EP.createReservation,
      EP.searchAvailability,
      EP.getRack,
    ]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const o = oracle('BR-804-02'); // khối [15/10, 17/10) chặn 2 đêm, không trùng đơn từ 17/10
    expect(o.expected.blockedNights).toBe(2);
    const rm = room(c, '401');
    const w = await freeWindow(request, fd, rm, 4, { today, minOffset: 40, dow: 1 }); // [T2, T6) – 1 đêm T2/T4 không vướng BR-113
    const start = addDays(w.arrival, 1);
    const reopen = addDays(start, 2);
    const blk = await createRoomBlock(request, fd, {
      roomId: rm.id,
      startDate: start,
      endDatePlanned: reopen,
      reason: 'E2E TC-L2-032',
    });
    expect(blk.status, JSON.stringify(blk.body)).toBe(201);
    const guestId = await newGuest(request, fd);
    // (a) đến start+1, 1 đêm → bị khóa
    const a = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: addDays(start, 1), departure: reopen, guestId }),
    );
    expect(a.status, JSON.stringify(a.body)).toBe(409);
    expect(['ROOM_BLOCKED', 'ROOM_UNAVAILABLE']).toContain((a.body as ProblemFields).code);
    // (b) đến ngày mở bán lại → được
    const b = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: reopen, departure: addDays(reopen, 1), guestId }),
    );
    expect(b.status, JSON.stringify(b.body)).toBe(201);
    // (c) đi = ngày bắt đầu khối → được
    const cc = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: addDays(start, -1), departure: start, guestId }),
    );
    expect(cc.status, JSON.stringify(cc.body)).toBe(201);
    track('reservation', b.body.id);
    track('reservation', cc.body.id);
    // TC-L2-031: tìm phòng trống không trả 401 cho đêm khóa; rack có thanh "ooo"
    expect(await isRoomFree(request, fd, rm, start, addDays(start, 1))).toBe(false);
    const av = await call<{ alternatives: Array<{ roomNo: string; available: boolean }> }>(
      request,
      'GET',
      `/v1/properties/${propertyIdOf(fd)}/availability`,
      { session: fd, query: { arrival: start, departure: reopen } },
    );
    expect(av.status).toBe(200);
    expect(av.body.alternatives.filter((x) => x.roomNo === '401' && x.available)).toHaveLength(0);
    const rack = await call<{
      rooms: Array<{ roomNo: string; bars: Array<{ kind: string; from: string; to: string }> }>;
    }>(request, 'GET', `/v1/properties/${propertyIdOf(fd)}/rack`, {
      session: fd,
      query: { from: addDays(start, -1), days: 14 },
    });
    expect(rack.status).toBe(200);
    const ooo = rack.body.rooms
      .find((x) => x.roomNo === '401')
      ?.bars.filter((x) => x.kind === 'ooo');
    expect(
      ooo?.some((x) => x.from === start && x.to === reopen),
      JSON.stringify(ooo),
    ).toBe(true);
  });

  test('TC-L2-033 qa.mt tạo khối theo ngày xong + 1 (BR-804-01): chặn đúng các đêm, mở bán từ ngày mở lại', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-033', [EP.createRoomBlock, EP.searchAvailability]);
    const mt = await sessionOrSkip(request, 'qa.mt');
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const o = oracle('BR-804-01'); // bắt đầu 15/10, xong 17/10 → [15/10, 18/10), 3 đêm
    const span =
      (Date.parse(String(o.input.expectedDoneDate)) - Date.parse(String(o.input.startDate))) /
      864e5;
    const rm = room(c, '401');
    const w = await freeWindow(request, fd, rm, span + 2, { today, minOffset: 40 });
    const start = w.arrival;
    const done = addDays(start, span);
    const reopen = addDays(done, 1);
    const blk = await createRoomBlock(request, mt, {
      roomId: rm.id,
      startDate: start,
      endDatePlanned: reopen,
      reason: 'E2E TC-L2-033',
    });
    expect(blk.status, JSON.stringify(blk.body)).toBe(201);
    expect(nightsOf(start, reopen)).toHaveLength((o.expected.blockedNights as string[]).length);
    // lý do căn không trống (searchAvailability.requestedRoom.reason): đêm khóa = `blocked`; ngày mở bán lại không
    // còn bị khối chặn (có thể `booked` nếu ca song song vừa đặt 401 – không phải lỗi của khối)
    const reason = async (n: string) => {
      const r = await call<{ requestedRoom?: { available?: boolean; reason?: string } }>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(fd)}/availability`,
        { session: fd, query: { arrival: n, departure: addDays(n, 1), roomId: rm.id } },
      );
      expect(r.status).toBe(200);
      return r.body.requestedRoom?.available ? 'free' : (r.body.requestedRoom?.reason ?? '?');
    };
    for (const n of nightsOf(start, reopen)) expect(await reason(n), n).toBe('blocked');
    expect(await reason(reopen)).not.toBe('blocked');
  });

  test('TC-L6-041 + TC-L2-023 (7)(8) khối trùng đơn → 409 kèm danh sách đơn; MGR xác nhận → lưu; kéo dài vào đêm có đơn → 409', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L6-041', [
      EP.createRoomBlock,
      EP.updateRoomBlock,
      EP.createReservation,
    ]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const mt = await sessionOrSkip(request, 'qa.mt');
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '402');
    const res = await bookFree(request, fd, c, { room: rm, nights: 2, today });
    // (7) tạo khối trùng đêm có đơn → 409 + conflicts[] có mã đơn
    const b1 = await createRoomBlock(request, mt, {
      roomId: rm.id,
      startDate: addDays(res.arrivalDate, -1),
      endDatePlanned: addDays(res.arrivalDate, 1),
      reason: 'E2E TC-L6-041',
    });
    const p = expectProblem(b1, 409, 'ROOM_UNAVAILABLE');
    // MT: conflicts[] nêu đêm/căn nhưng không lộ mã đơn, tên khách (SEC-23, BE-A s2-be-a-fix); FD+ thấy mã
    expect(JSON.stringify(p.conflicts ?? [])).toContain(addDays(res.arrivalDate, 0));
    expect(JSON.stringify(p.conflicts ?? [])).not.toContain(res.code);
    // MGR xác nhận đã có phương án dời: chỉ ghi nhận, không vượt chống trùng – khoảng khóa trùng đơn luôn 409
    // (ARC s2-contract A-03, OpenAPI 0.3.5 `affectedReservationsAcknowledged`; TC-L6-041 v0.3.4)
    const b2 = await createRoomBlock(request, mgr, {
      roomId: rm.id,
      startDate: addDays(res.arrivalDate, -1),
      endDatePlanned: addDays(res.arrivalDate, 1),
      reason: 'E2E TC-L6-041 đã có phương án dời',
      affectedReservationsAcknowledged: true,
    });
    expectProblem(b2, 409, 'ROOM_UNAVAILABLE');
    // dời đơn đi (hủy) rồi tạo khối → được
    const off = await action(request, fd, res.id, 'cancel', { reasonCode: 'date_change' });
    expect(off.status, JSON.stringify(off.body)).toBe(200);
    const b3ok = await createRoomBlock(request, mgr, {
      roomId: rm.id,
      startDate: addDays(res.arrivalDate, -1),
      endDatePlanned: addDays(res.arrivalDate, 1),
      reason: 'E2E TC-L6-041 sau khi dời đơn',
    });
    expect(b3ok.status, JSON.stringify(b3ok.body)).toBe(201);

    // (8) khối trước đơn, kéo dài vào đêm có đơn → 409
    const rm2 = room(c, '301');
    const res2 = await bookFree(request, fd, c, { room: rm2, nights: 2, today });
    const before = addDays(res2.arrivalDate, -2);
    if ((await isRoomFree(request, fd, rm2, before, res2.arrivalDate)) === false) {
      test.skip(true, 'môi trường: 2 đêm trước đơn của 301 không trống');
    }
    const b3 = await createRoomBlock(request, mt, {
      roomId: rm2.id,
      startDate: before,
      endDatePlanned: res2.arrivalDate,
      reason: 'E2E TC-L2-023 (8)',
    });
    expect(b3.status, JSON.stringify(b3.body)).toBe(201);
    const up = await call<Problem>(
      request,
      'PATCH',
      `/v1/properties/${propertyIdOf(mt)}/room-blocks/${b3.body.id}`,
      {
        session: mt,
        ifMatch: `"${b3.body.version}"`,
        body: { endDatePlanned: addDays(res2.arrivalDate, 1) },
      },
    );
    expectProblem(up, 409, 'ROOM_UNAVAILABLE');
  });
});
