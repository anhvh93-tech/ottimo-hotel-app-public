// E2E API – Sprint 2 EP02: đặt phòng mới, kiểm tra dữ liệu, idempotency, hủy, đơn dài hạn nhập tay (US-017 AC5a).
// TC: tests/test-cases/r1-main-flows.md 3.2, 3.4. Số liệu: fixtures/br-examples.json (oracle()).
// Mỗi ca tự chọn khoảng đêm trống (support/s2.ts freeWindow/bookFree) và hủy đơn đã tạo ở afterEach.
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  uuid,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  bookFree,
  cleanupTracked,
  createReservation,
  fieldCodes,
  freeRoom,
  freeWindow,
  getReservation,
  isRoomFree,
  minStayFor,
  withDeposit,
  newGuest,
  isSpecialDate,
  nextWeekday,
  oracle,
  oracleNum,
  reservationBody,
  room,
  s2Context,
  statusOf,
  track,
  type Reservation,
  type ProblemFields,
} from '../support/s2.js';

test.describe.configure({ mode: 'parallel' });

test.describe('L2 3.2 – đặt phòng mới (US-017, US-018)', { tag: ['@api', '@sprint2'] }, () => {
  test.beforeEach(() => needSeedPassword());
  test.afterEach(async ({ request }) => cleanupTracked(request));

  test('TC-L2-010 đơn Booking.com nhập tay → confirmed, OTM-xxxxx, giữ giá đêm', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-010', [EP.createReservation, EP.getReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '203');
    const w = await freeWindow(request, fd, rm, 3, { today });
    const guestId = await newGuest(request, fd);
    const rates = [0, 1, 2].map((i) => ({ date: addDays(w.arrival, i), amountVnd: 820000 }));
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        ...w,
        kind: 'booking',
        guestId,
        extra: { otaRef: '4021788113', nightlyRates: rates, paymentModel: 'ota_prepaid' },
      }),
    );
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    track('reservation', r.body.id);
    expect(r.body.status).toBe('confirmed');
    expect(r.body.code).toMatch(/^OTM-\d{5}$/);
    expect(r.body.conflictState).toBe('none');
    const got = await getReservation(request, fd, r.body.id);
    expect(got.status).toBe(200);
    const nightly = (got.body.nightlyRates as Array<{ date: string; amountVnd: number }>) ?? [];
    expect(nightly.map((n) => n.amountVnd)).toEqual([820000, 820000, 820000]);
    expect(got.body.otaRef).toBe('4021788113');
  });

  test('TC-L2-011 kênh Trực tiếp/CTV bắt buộc SĐT; Airbnb thì không', async ({ request }) => {
    await requireEndpoints(request, 'TC-L2-011', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '101');
    const guestId = await newGuest(request, fd, { withPhone: false });
    const w = await freeWindow(request, fd, rm, 2, { today });
    for (const kind of ['direct', 'agent'] as const) {
      const r = await createReservation(
        request,
        fd,
        reservationBody(c, { room: rm, ...w, kind, guestId }),
      );
      expectProblem(r, 422, 'PHONE_REQUIRED');
    }
    const ok = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, ...w, kind: 'airbnb', guestId }),
    );
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    track('reservation', ok.body.id);
  });

  test('TC-L2-012 (b) đơn Booking.com bỏ trống giá → giá mặc định theo lịch giá OTA (870.000 T6/T7, 760.000 CN)', async ({
    request,
  }) => {
    test.info().annotations.push({
      type: 'bug',
      description:
        'hồi quy BUG-R2-017: OTA bỏ trống giá → giá mặc định theo lịch giá OTA nhóm (EP02 3.2)',
    });
    // hồi quy BUG-R2-017 (Fixed – BE-A s2-be-a-fix)
    await requireEndpoints(request, 'TC-L2-012', [EP.createReservation, EP.getReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '203');
    const w = await freeWindow(request, fd, rm, 3, { today, dow: 5 }); // T6 → CN
    const otaBase = Number(oracle('BR-105-01').input.otaBaseRateVnd); // 760.000 nhóm Lầu 1–2
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        ...w,
        kind: 'booking',
        guestId: await newGuest(request, fd),
        extra: { nightlyRates: undefined },
      }),
    );
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    track('reservation', r.body.id);
    const got = await getReservation(request, fd, r.body.id);
    const nightly = (got.body.nightlyRates as Array<{ amountVnd: number }> | undefined) ?? [];
    // OTA làm tròn 10.000 (BR-005): 760.000 × 1,15 = 874.000 → 870.000
    expect(nightly.map((n) => n.amountVnd)).toEqual([870000, 870000, otaBase]);
  });

  test('TC-L2-013 giá đêm ngoài sàn–trần nhóm Lầu 1–2 (BR-105) → RATE_OUT_OF_RANGE', async ({
    request,
  }) => {
    test.info().annotations.push({
      type: 'bug',
      description: 'hồi quy BUG-R2-018: sàn–trần BR-105 theo giá nền nhóm (530.000–1.900.000)',
    });
    // hồi quy BUG-R2-018 (Fixed – BE-A s2-be-a-fix)
    await requireEndpoints(request, 'TC-L2-013', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const floor = oracleNum('BR-105-01', 'floorVnd');
    const ceiling = oracleNum('BR-105-01', 'ceilingVnd');
    const rm = room(c, '203');
    const guestId = await newGuest(request, fd);
    const w = await freeWindow(request, fd, rm, 1, { today });
    const body = (amountVnd: number) =>
      reservationBody(c, {
        room: rm,
        ...w,
        guestId,
        extra: { nightlyRates: [{ date: w.arrival, amountVnd }] },
      });
    for (const v of [0, floor - 1000, ceiling + 1000]) {
      const r = await createReservation(request, fd, body(v));
      expect(r.status, `${v}: ${JSON.stringify(r.body)}`).toBe(422);
      const code = (r.body as ProblemFields).code;
      expect(
        code === 'RATE_OUT_OF_RANGE' || (v === 0 && code === 'VALIDATION_FAILED'),
        `${v}: ${code}`,
      ).toBe(true);
    }
    for (const v of [floor, ceiling]) {
      const r = await createReservation(request, fd, body(v));
      expect(r.status, `${v}: ${JSON.stringify(r.body)}`).toBe(201);
      track('reservation', r.body.id);
      const cancel = await action(request, fd, r.body.id, 'cancel', {
        reasonCode: 'other',
        note: 'E2E dọn dữ liệu',
      });
      expect(cancel.status, statusOf(cancel)).toBe(200);
    }
  });

  test('TC-L2-014 cửa sổ đặt phòng 365 ngày (BR-112), ngày đã qua, 0 đêm', async ({ request }) => {
    await requireEndpoints(request, 'TC-L2-014', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    // oracle BR-112-01: hôm nay 15/10/2026 → ngày đến muộn nhất 14/10/2027 = hôm nay + 364
    const o = oracle('BR-112-01');
    const span =
      (Date.parse(String(o.expected.lastBookableArrivalDate)) - Date.parse(String(o.input.today))) /
      864e5;
    const last = addDays(today, span);
    const lastNights = minStayFor(last); // ngày cuối rơi T6/T7 → ở tối thiểu 2 đêm (BR-113)
    const guestId = await newGuest(request, fd);
    const rm = await freeRoom(request, fd, c.rooms, last, addDays(last, lastNights));
    const ok = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: last,
        departure: addDays(last, lastNights),
        guestId,
      }),
    );
    expect(ok.status, `ngày đến ${last}: ${JSON.stringify(ok.body)}`).toBe(201);
    track('reservation', ok.body.id);

    const beyond = addDays(last, 1);
    const r1 = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: beyond, departure: addDays(beyond, 2), guestId }),
    );
    expectProblem(r1, 422, 'OUTSIDE_BOOKING_WINDOW');

    const yesterday = addDays(today, -1);
    const r2 = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: yesterday, departure: today, guestId }),
    );
    expect(r2.status, JSON.stringify(r2.body)).toBe(422);
    expect(JSON.stringify((r2.body as ProblemFields).errors ?? [])).toContain('arrivalDate');

    const d = addDays(today, 40);
    const r3 = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: d, departure: d, guestId }),
    );
    expect(r3.status, JSON.stringify(r3.body)).toBe(422);
  });

  test('TC-L2-015 ngắn ngày 27 đêm được; 28 đêm → LONG_STAY_REQUIRES_CONTRACT (BR-108)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-015', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '102');
    const guestId = await newGuest(request, fd);
    const w = await freeWindow(request, fd, rm, 28, { today });
    const r28 = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: w.arrival, departure: w.departure, guestId }),
    );
    expect(r28.status, JSON.stringify(r28.body)).toBe(422);
    expect(fieldCodes(r28.body as ProblemFields).join(',')).toContain(
      'LONG_STAY_REQUIRES_CONTRACT',
    );
    const r27 = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: w.arrival,
        departure: addDays(w.arrival, 27),
        guestId,
      }),
    );
    expect(r27.status, JSON.stringify(r27.body)).toBe(201);
    track('reservation', r27.body.id);
    expect(r27.body.stayType).toBe('short');
  });

  test('TC-L2-016 SAL, CTV không tạo đơn trực tiếp → 403 FORBIDDEN_ACTION', async ({ request }) => {
    await requireEndpoints(request, 'TC-L2-016', [EP.createReservation]);
    const c = await s2Context(request);
    const today = await stackToday(request);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const guestId = await newGuest(request, fd);
    const rm = room(c, '101');
    for (const who of ['qa.sal', 'qa.ctv1']) {
      const s = await sessionOrSkip(request, who);
      const d = addDays(today, 200);
      const r = await createReservation(
        request,
        s,
        reservationBody(c, { room: rm, arrival: d, departure: addDays(d, 2), guestId }),
      );
      expectProblem(r, 403, 'FORBIDDEN_ACTION');
    }
  });

  test('TC-NT-008 qa.hk tạo đơn → 403 FORBIDDEN_ACTION, không tạo đơn, có audit access.denied (createReservation)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-008', [EP.createReservation, EP.listAuditEvents]);
    const hk = await sessionOrSkip(request, 'qa.hk');
    const owner = await sessionOrSkip(request, 'qa.owner');
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '101');
    const guestId = await newGuest(request, fd);
    const w = await freeWindow(request, fd, rm, 1, { today });
    const r = await createReservation(request, hk, reservationBody(c, { room: rm, ...w, guestId }));
    expectProblem(r, 403, 'FORBIDDEN_ACTION');
    expect(await isRoomFree(request, fd, rm, w.arrival, w.departure)).toBe(true);
    const a = await call<{ data?: Array<Record<string, unknown>> }>(
      request,
      'GET',
      `/v1/properties/${propertyIdOf(owner)}/audit-events`,
      { session: owner, query: { limit: 100, category: 'access', actorUserId: hk.me.id } },
    );
    expect(a.status).toBe(200);
    const hit = (a.body.data ?? []).find((e) => JSON.stringify(e).includes('createReservation'));
    expect(hit, 'có dòng access.denied cho createReservation của qa.hk').toBeTruthy();
    expect(JSON.stringify(hit)).toContain('access.denied');
  });

  test('TC-L2-018 Idempotency-Key: phát lại, dùng lại khác body, thiếu khóa', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-018', [EP.createReservation, EP.listReservations]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '103');
    const guestId = await newGuest(request, fd);
    const w = await freeWindow(request, fd, rm, 2, { today });
    const key = uuid();
    // cùng body cho cả 3 lần gửi → kèm sẵn cọc BR-305 (EP02 3.2 initialPayment)
    const body = await withDeposit(request, fd, reservationBody(c, { room: rm, ...w, guestId }));
    const first = await createReservation(request, fd, body, key);
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    track('reservation', first.body.id);
    const replay = await createReservation(request, fd, body, key);
    expect(replay.status).toBe(201);
    expect(replay.body.id).toBe(first.body.id);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    const reused = await createReservation(request, fd, { ...body, adults: 1 }, key);
    expectProblem(reused, 422, 'IDEMPOTENCY_KEY_REUSED');
    const noKey = await createReservation(request, fd, body, false);
    expectProblem(noKey, 428, 'PRECONDITION_REQUIRED');
    // chỉ 1 đơn cho khách này
    const list = await call<{ data: Array<{ id: string }> }>(
      request,
      'GET',
      `/v1/properties/${propertyIdOf(fd)}/reservations`,
      { session: fd, query: { stayFrom: w.arrival, stayTo: w.departure } },
    );
    expect(list.status).toBe(200);
    const mine = list.body.data.filter((x) => x.id === first.body.id);
    expect(mine).toHaveLength(1);
  });

  test('TC-L2-079 ở tối thiểu cuối tuần BR-113: FD bị chặn, FDL vượt có lý do, ngày thường được', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-079', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const fdl = await sessionOrSkip(request, 'qa.fdl');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const o = oracle('BR-113-01');
    const rm = room(c, '101');
    const guestId = await newGuest(request, fd);
    // Thứ Bảy có cả đêm trước và đêm sau trống → không rơi vào ngoại lệ "đêm lẻ" (BR-113-02)
    const w = await freeWindow(request, fd, rm, 3, { today, dow: 5 }); // T6 → CN
    const sat = addDays(w.arrival, 1);
    const one = { room: rm, arrival: sat, departure: addDays(sat, 1), guestId };
    // (b) FD: chặn tối thiểu 2 đêm
    const b = await createReservation(request, fd, reservationBody(c, one));
    expect(b.status, JSON.stringify(b.body)).toBe(422);
    expect(fieldCodes(b.body as ProblemFields).join(',')).toContain('MIN_STAY_NOT_MET');
    expect(o.expected.minStayNights).toBe(2);
    // FD gửi lý do vượt → 403 (chỉ FDL+)
    const bf = await createReservation(
      request,
      fd,
      reservationBody(c, { ...one, extra: { minStayOverrideReason: 'Khach quen E2E' } }),
    );
    expectProblem(bf, 403, 'FORBIDDEN_ACTION');
    // (c) FDL vượt được, có lý do
    const cc = await createReservation(
      request,
      fdl,
      reservationBody(c, { ...one, extra: { minStayOverrideReason: 'Khach quen E2E' } }),
    );
    expect(cc.status, JSON.stringify(cc.body)).toBe(201);
    track('reservation', cc.body.id);
    // (e) thứ Năm 1 đêm: nhận
    // Thứ Năm không phải ngày đặc biệt (BR-104 special_dates) – nếu không BR-113 vẫn đòi 2 đêm
    let thu = nextWeekday(addDays(today, 60), 4);
    while (isSpecialDate(thu)) thu = addDays(thu, 7);
    const rm2 = await freeRoom(request, fd, c.rooms, thu, addDays(thu, 1));
    const e = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm2, arrival: thu, departure: addDays(thu, 1), guestId }),
    );
    expect(e.status, JSON.stringify(e.body)).toBe(201);
    track('reservation', e.body.id);
  });

  // TC-L2-079 (a1–a3) viết lại theo ARC s2-contract 3.3 → api/s3-kickoff.api.spec.ts
});

test.describe(
  'L2 3.4 – chi tiết đơn, sửa, hủy (US-020, US-021)',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L2-042 chuyển không hợp lệ → 409 INVALID_TRANSITION, dữ liệu không đổi', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-042', [
        EP.createReservation,
        EP.confirmDeposit,
        EP.cancelReservation,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const res = await bookFree(request, fd, c, { room: room(c, '201'), nights: 2, today });
      // xác nhận cọc đơn đã confirmed
      const r1 = await action(request, fd, res.id, 'confirm-deposit', {
        payment: { type: 'deposit', method: 'cash', amountVnd: 100000 },
      });
      expectProblem(r1, 409, 'INVALID_TRANSITION');
      // hủy rồi hủy lại
      const r2 = await action(request, fd, res.id, 'cancel', { reasonCode: 'guest_changed_mind' });
      expect(r2.status, statusOf(r2)).toBe(200);
      const r3 = await action(request, fd, res.id, 'cancel', { reasonCode: 'guest_changed_mind' });
      expectProblem(r3, 409, 'INVALID_TRANSITION');
      const after = await getReservation(request, fd, res.id);
      expect(after.body.status).toBe('cancelled');
    });

    test('TC-L2-043 If-Match cũ → 412 VERSION_CONFLICT; thiếu If-Match → 428', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-043', [EP.createReservation, EP.updateReservation]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const fdl = await sessionOrSkip(request, 'qa.fdl');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const res = await bookFree(request, fd, c, { room: room(c, '202'), nights: 2, today });
      const path = `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}`;
      const v0 = `"${res.version}"`;
      const a = await call<Reservation>(request, 'PATCH', path, {
        session: fd,
        ifMatch: v0,
        body: { internalNote: 'E2E sửa lần 1' },
      });
      expect(a.status, JSON.stringify(a.body)).toBe(200);
      const b = await call(request, 'PATCH', path, {
        session: fdl,
        ifMatch: v0,
        body: { internalNote: 'E2E sửa lần 2 (bản cũ)' },
      });
      expectProblem(b, 412, 'VERSION_CONFLICT');
      const n = await call(request, 'PATCH', path, { session: fd, body: { internalNote: 'x' } });
      expectProblem(n, 428, 'PRECONDITION_REQUIRED');
    });

    test('TC-L2-052 hủy đơn confirmed → cancelled, căn trống lại ngay, rack không còn thanh', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-052', [
        EP.createReservation,
        EP.cancelReservation,
        EP.getRack,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '203');
      const res = await bookFree(request, fd, c, { room: rm, nights: 2, today });
      const r = await action<{ reservation: Reservation; cancellation: Record<string, unknown> }>(
        request,
        fd,
        res.id,
        'cancel',
        { reasonCode: 'guest_changed_mind', note: 'E2E TC-L2-052' },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body.reservation.status).toBe('cancelled');
      expect(r.body.reservation.cancellation?.reasonCode).toBe('guest_changed_mind');
      const rack = await call<{
        rooms: Array<{ roomId: string; bars: Array<{ reservationId?: string }> }>;
      }>(request, 'GET', `/v1/properties/${propertyIdOf(fd)}/rack`, {
        session: fd,
        query: { from: res.arrivalDate, days: 14 },
      });
      expect(rack.status).toBe(200);
      const bars = rack.body.rooms.find((x) => x.roomId === rm.id)?.bars ?? [];
      expect(bars.some((b) => b.reservationId === res.id)).toBe(false);
      // căn trống lại: tạo lại đúng khoảng cũ được
      const again = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival: res.arrivalDate,
          departure: res.departureDate,
          guestId: await newGuest(request, fd),
        }),
      );
      expect(again.status, JSON.stringify(again.body)).toBe(201);
      track('reservation', again.body.id);
    });

    for (const [days, ex] of [
      [7, 'BR-309-03'],
      [5, 'BR-309-02'],
      [3, 'BR-309-05'],
      [2, 'BR-309-06'],
    ] as const) {
      test(`TC-L2-053 phí hủy đơn Trực tiếp báo trước ${days} ngày (dryRun, oracle ${ex})`, async ({
        request,
      }) => {
        await requireEndpoints(request, 'TC-L2-053', [EP.createReservation, EP.cancelReservation]);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const c = await s2Context(request);
        const today = await stackToday(request);
        const deposit = oracleNum('BR-309-01', 'depositVnd');
        const o = oracle(ex);
        const arrival = addDays(today, days);
        const departure = addDays(arrival, 3);
        const l12 = c.rooms.filter((x) =>
          ['101', '102', '103', '201', '202', '203'].includes(x.roomNo),
        );
        const guestId = await newGuest(request, fd);
        // đêm gần hôm nay: các project song song cũng đặt → thử lần lượt các căn Lầu 1–2 khi gặp 409
        let created: Awaited<ReturnType<typeof createReservation>> | null = null;
        for (const rm of l12) {
          if ((await isRoomFree(request, fd, rm, arrival, departure)) === false) continue;
          created = await createReservation(
            request,
            fd,
            reservationBody(c, {
              room: rm,
              arrival,
              departure,
              guestId,
              extra: {
                nightlyRates: [0, 1, 2].map((i) => ({
                  date: addDays(arrival, i),
                  amountVnd: 820000,
                })),
                initialPayment: { type: 'deposit', method: 'bank_transfer', amountVnd: deposit },
              },
            }),
          );
          if (created.status !== 409) break;
        }
        test.skip(
          !created || created.status === 409,
          `môi trường: Lầu 1–2 kín ${arrival}→${departure}`,
        );
        created = created!;
        expect(created.status, JSON.stringify(created.body)).toBe(201);
        track('reservation', created.body.id);
        expect(created.body.depositRequiredVnd).toBe(deposit);
        // dryRun: không cần Idempotency-Key/If-Match, không ghi gì
        const dry = await call<{ cancellation: { refundableVnd: number; retainedVnd: number } }>(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(fd)}/reservations/${created.body.id}/actions/cancel`,
          { session: fd, body: { reasonCode: 'guest_changed_mind', dryRun: true } },
        );
        expect(dry.status, JSON.stringify(dry.body)).toBe(200);
        expect(dry.body.cancellation.refundableVnd).toBe(o.expected.refundVnd);
        expect(dry.body.cancellation.retainedVnd).toBe(o.expected.cancelFeeVnd);
        const still = await getReservation(request, fd, created.body.id);
        expect(still.body.status).toBe('confirmed');
      });
    }
  },
);

test.describe('L2 – đơn dài hạn nhập tay (US-017 AC5a)', { tag: ['@api', '@sprint2'] }, () => {
  test.beforeEach(() => needSeedPassword());
  test.afterEach(async ({ request }) => cleanupTracked(request));

  const manual = {
    monthlyRentVnd: 9500000,
    externalContractRef: 'HĐ-2026-031',
    depositHeldVnd: 9500000,
  };

  test('TC-L2-076 + TC-L2-077 đơn nhập tay 30 đêm: confirmed, long, cờ HĐ ngoài; chiếm tồn; biên', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-076', [
      EP.createReservation,
      EP.getReservation,
      EP.listReservations,
    ]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '203');
    const guestId = await newGuest(request, fd);
    const w = await freeWindow(request, fd, rm, 30, { today });
    const r = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, ...w, guestId, extra: { manualLongStay: manual } }),
    );
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    track('reservation', r.body.id);
    expect(r.body.status).toBe('confirmed');
    expect(r.body.stayType).toBe('long');
    expect(r.body.externalContract).toBe(true);
    expect(r.body.code).toMatch(/^OTM-\d{5}$/);
    const list = await call<{ data: Array<{ id: string }> }>(
      request,
      'GET',
      `/v1/properties/${propertyIdOf(fd)}/reservations`,
      { session: fd, query: { externalContract: true, stayFrom: w.arrival, stayTo: w.departure } },
    );
    expect(list.status).toBe(200);
    expect(list.body.data.some((x) => x.id === r.body.id)).toBe(true);

    // TC-L2-077 (a) đơn ngắn ngày chen vào giữa → 409
    const mid = addDays(w.arrival, 24);
    const a = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, arrival: mid, departure: addDays(mid, 2), guestId }),
    );
    expectProblem(a, 409, 'ROOM_UNAVAILABLE');
    // (b) đơn nhập tay thứ hai chồng lấn → 409
    const b = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: addDays(w.arrival, 14),
        departure: addDays(w.arrival, 44),
        guestId,
        extra: { manualLongStay: manual },
      }),
    );
    expectProblem(b, 409, 'ROOM_UNAVAILABLE');
  });

  test('TC-L2-077 (c)(d)(e) dưới ngưỡng / kèm nightlyRates / 28 đêm không nhập tay → 422', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-L2-077', [EP.createReservation]);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const today = await stackToday(request);
    const rm = room(c, '202');
    const guestId = await newGuest(request, fd);
    const w = await freeWindow(request, fd, rm, 28, { today });
    const d27 = addDays(w.arrival, 27);
    const cRes = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        arrival: w.arrival,
        departure: d27,
        guestId,
        extra: { manualLongStay: manual },
      }),
    );
    expect(cRes.status, JSON.stringify(cRes.body)).toBe(422);
    expect(fieldCodes(cRes.body as ProblemFields).join(',')).toContain(
      'MANUAL_LONG_STAY_BELOW_THRESHOLD',
    );
    const dRes = await createReservation(
      request,
      fd,
      reservationBody(c, {
        room: rm,
        ...w,
        guestId,
        extra: {
          manualLongStay: manual,
          nightlyRates: [{ date: w.arrival, amountVnd: 792000 }],
        },
      }),
    );
    expect(dRes.status, JSON.stringify(dRes.body)).toBe(422);
    const eRes = await createReservation(
      request,
      fd,
      reservationBody(c, { room: rm, ...w, guestId }),
    );
    expect(eRes.status, JSON.stringify(eRes.body)).toBe(422);
    expect(fieldCodes(eRes.body as ProblemFields).join(',')).toContain(
      'LONG_STAY_REQUIRES_CONTRACT',
    );
  });

  test('TC-L2-078 SAL, CTV gửi manualLongStay → 403 FORBIDDEN_ACTION', async ({ request }) => {
    await requireEndpoints(request, 'TC-L2-078', [EP.createReservation]);
    const c = await s2Context(request);
    const today = await stackToday(request);
    const fd = await sessionOrSkip(request, 'qa.fd');
    const guestId = await newGuest(request, fd);
    const rm = room(c, '202');
    const arrival = addDays(today, 250);
    for (const who of ['qa.sal', 'qa.ctv1']) {
      const s = await sessionOrSkip(request, who);
      const r = await createReservation(
        request,
        s,
        reservationBody(c, {
          room: rm,
          arrival,
          departure: addDays(arrival, 30),
          guestId,
          kind: 'direct',
          extra: { manualLongStay: manual },
        }),
      );
      expectProblem(r, 403, 'FORBIDDEN_ACTION');
    }
  });
});
