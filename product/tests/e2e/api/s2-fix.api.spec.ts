// E2E API – Sprint 2, bước Phản hồi & sửa: hành vi đổi/thêm theo ARC s2-contract (OpenAPI 0.3.5), DOM s2 (BR v0.3.2),
// PO s2 (US-017 AC9). TC: TC-L2-080 (người chốt + listCloserCandidates), TC-L2-081 (CAPACITY_EXCEEDED_WARNING – A-20),
// TC-L2-082 (BR-107 tính lại khi đổi số đêm – A-22), TC-L2-053 (b) (hủy → đảo folio – FB-R2-DOM-BE-01),
// TC-L5-050 (HOLD_LIMIT_REACHED – A-26, BR-302-03), TC-L5-051 (dryRun bị từ chối ở thao tác ghi – SEC-BE-21),
// TC-L5-017 (d) (extendQuote báo giá còn hiệu lực → 409 – A-18). Phần gia hạn báo giá hết hạn: clock/hold-expiry.
// A-13 (confirmDeposit thiếu tiền → 200) sửa ngay ở TC-L5-032 (quotes-holds.api.spec.ts).
import { expect, test } from '@playwright/test';
import {
  activateUser,
  call,
  createThrowawayUser,
  expectProblem,
  isAvailable,
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
  cleanupTracked,
  createHold,
  createReservation,
  fieldCodes,
  freeWindow,
  getReservation,
  isRoomFree,
  makeHold,
  needFutureDate,
  newGuest,
  nightsOf,
  oracle,
  oracleNum,
  quoteInput,
  reservationBody,
  room,
  s2Context,
  saveQuote,
  statusOf,
  track,
  type ProblemFields,
  type Reservation,
} from '../support/s2.js';
import { moveAcked } from '../support/s4-money.js';

test.describe.configure({ mode: 'parallel' });

interface FolioLine {
  category: string;
  amountVnd: number;
  serviceDate?: string;
  reversalOfId?: string;
}
interface Folio {
  lines?: FolioLine[];
  totals?: { roomVnd?: number; balanceDueVnd?: number; paidVnd?: number; creditVnd?: number };
}

const sumOf = (lines: FolioLine[], cat: string) =>
  lines.filter((l) => l.category === cat).reduce((s, l) => s + l.amountVnd, 0);

test.describe(
  'Sprint 2 – Phản hồi & sửa (OpenAPI 0.3.5, BR v0.3.2)',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L2-080 người chốt bắt buộc với kênh CTV / nguồn sales_staff; listCloserCandidates chỉ trả tên (US-017 AC9)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-080', [EP.createReservation, EP.listCloserCandidates]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const pid = propertyIdOf(fd);

      // (h) danh sách người chốt
      const list = async (kind: string) => {
        const r = await call<{ data: Array<Record<string, unknown>> }>(
          request,
          'GET',
          `/v1/properties/${pid}/closer-candidates`,
          { session: fd, query: { kind } },
        );
        expect(r.status, JSON.stringify(r.body)).toBe(200);
        return r.body.data;
      };
      const agents = await list('agent');
      const staff = await list('staff');
      expect(agents.map((x) => x.userId)).toContain(ctv.me.id);
      expect(agents.map((x) => x.userId)).not.toContain(sal.me.id);
      expect(staff.map((x) => x.userId)).toContain(sal.me.id);
      expect(staff.map((x) => x.userId)).not.toContain(ctv.me.id);
      for (const x of [...agents, ...staff]) {
        expect(Object.keys(x).sort(), JSON.stringify(x)).toEqual(['displayName', 'kind', 'userId']);
      }
      for (const who of [sal, ctv]) {
        const r = await call(request, 'GET', `/v1/properties/${pid}/closer-candidates`, {
          session: who,
        });
        expectProblem(r, 403, 'FORBIDDEN_ACTION');
      }

      const rm = room(c, '101');
      const guestId = await newGuest(request, fd);
      const body = async (extra: Record<string, unknown>, kind: 'agent' | 'direct') => {
        const w = await freeWindow(request, fd, rm, 2, { today });
        return reservationBody(c, { room: rm, ...w, guestId, kind, extra });
      };
      const expectField = (r: { status: number; body: ProblemFields }, code: string) => {
        expect(r.status, JSON.stringify(r.body)).toBe(422);
        expect(fieldCodes(r.body)).toContain(`closerUserId:${code}`);
      };
      // (a) CTV không người chốt; (b) người chốt là sale
      expectField(
        await createReservation(request, fd, await body({ closerUserId: undefined }, 'agent')),
        'REQUIRED',
      );
      expectField(
        await createReservation(request, fd, await body({ closerUserId: sal.me.id }, 'agent')),
        'NOT_IN_LIST',
      );
      // (c) người chốt là CTV
      const okAgent = await createReservation(
        request,
        fd,
        await body({ closerUserId: ctv.me.id }, 'agent'),
      );
      expect(okAgent.status, JSON.stringify(okAgent.body)).toBe(201);
      track('reservation', okAgent.body.id);
      expect(okAgent.body.closerUserId).toBe(ctv.me.id);
      // (d)(e)(f) Trực tiếp nguồn sales_staff
      expectField(
        await createReservation(request, fd, await body({ directSource: 'sales_staff' }, 'direct')),
        'REQUIRED',
      );
      expectField(
        await createReservation(
          request,
          fd,
          await body({ directSource: 'sales_staff', closerUserId: ctv.me.id }, 'direct'),
        ),
        'NOT_IN_LIST',
      );
      const okSale = await createReservation(
        request,
        fd,
        await body({ directSource: 'sales_staff', closerUserId: sal.me.id }, 'direct'),
      );
      expect(okSale.status, JSON.stringify(okSale.body)).toBe(201);
      track('reservation', okSale.body.id);
      expect(okSale.body.closerUserId).toBe(sal.me.id);
      // (g) nguồn khác: không bắt buộc
      const okZalo = await createReservation(request, fd, await body({}, 'direct'));
      expect(okZalo.status, JSON.stringify(okZalo.body)).toBe(201);
      track('reservation', okZalo.body.id);
    });

    test('TC-L2-081 OTA vượt sức chứa: 422 CAPACITY_EXCEEDED_WARNING (+max); có lý do → 201, capacityConflict; Trực tiếp → CAPACITY_EXCEEDED (A-20)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-081', [EP.createReservation, EP.getReservation]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '202'); // tối đa 3 (BR-110-05: 4 người lớn → vượt)
      const o = oracle('BR-110-05');
      const guestId = await newGuest(request, fd);
      const w = await freeWindow(request, fd, rm, 2, { today });
      const base = { room: rm, ...w, guestId, adults: Number(o.input.adults) };
      const warn = await createReservation(
        request,
        fd,
        reservationBody(c, { ...base, kind: 'booking' }),
      );
      expect(warn.status, JSON.stringify(warn.body)).toBe(422);
      expect(fieldCodes(warn.body).join(',')).toContain('CAPACITY_EXCEEDED_WARNING');
      expect((warn.body as unknown as Problem).max).toBe(rm.maxOccupancy ?? 3);
      const ok = await createReservation(
        request,
        fd,
        reservationBody(c, {
          ...base,
          kind: 'booking',
          extra: { capacityWarningAckReason: 'OTA nhận 4 khách – sẽ đổi căn lớn hơn' },
        }),
      );
      expect(ok.status, JSON.stringify(ok.body)).toBe(201);
      track('reservation', ok.body.id);
      expect(ok.body.capacityConflict).toBe(true);
      const direct = await createReservation(
        request,
        fd,
        reservationBody(c, { ...base, kind: 'direct' }),
      );
      expect(direct.status, JSON.stringify(direct.body)).toBe(422);
      expect(`${direct.body.code} ${fieldCodes(direct.body).join(',')}`).toContain(
        'CAPACITY_EXCEEDED',
      );
      expect(fieldCodes(direct.body).join(',')).not.toContain('CAPACITY_EXCEEDED_WARNING');
    });

    test('TC-L2-082 đổi số đêm → tính lại bậc giảm BR-107 trên giá lịch (oracle BR-107-03, BR-107-04; A-22)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-082', [
        EP.createReservation,
        EP.moveReservation,
        EP.getReservation,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const o5 = oracle('BR-107-03'); // 5 đêm 9/11–14/11: 4.079.000 (không giảm)
      const o7 = oracle('BR-107-04'); // 7 đêm 9/11–16/11: 5.205.000 (−10%)
      const arrival = String(o7.input.arrivalDate);
      needFutureDate(arrival, await stackToday(request), 'TC-L2-082');
      const rm = room(c, String(o7.input.roomNo));
      test.skip(
        (await isRoomFree(request, fd, rm, arrival, addDays(arrival, 7))) === false,
        'môi trường: 202 đã có đơn trong 9/11–16/11 (dữ liệu lần chạy khác)',
      );
      const r = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival,
          departure: addDays(arrival, Number(o5.input.nights)),
          guestId: await newGuest(request, fd),
        }),
      );
      expect(r.status, JSON.stringify(r.body)).toBe(201);
      track('reservation', r.body.id);
      const rates = (x: Reservation) =>
        ((x.nightlyRates as Array<{ amountVnd: number }> | undefined) ?? []).map(
          (n) => n.amountVnd,
        );
      expect(r.body.totalRoomVnd).toBe(o5.expected.roomTotalVnd);

      const move = async (nights: number) => {
        // BR-429 (d1) v0.3.8 (DOM-S4-06): thêm/bớt đêm có chênh → xem trước, tick + số chênh (như Desk)
        const m = await moveAcked(request, fd, r.body.id, {
          departureDate: addDays(arrival, nights),
          reasonCode: 'guest_request',
        });
        expect(m.status, JSON.stringify(m.body)).toBe(200);
        return (await getReservation(request, fd, r.body.id)).body;
      };
      const seven = await move(Number(o7.input.nights));
      expect(rates(seven)).toEqual(o7.expected.discountedNightlyRatesVnd);
      expect(seven.totalRoomVnd).toBe(o7.expected.roomTotalVnd);
      const cal = (
        (seven.nightlyRates as Array<{ calendarRateVnd?: number }> | undefined) ?? []
      ).map((n) => n.calendarRateVnd);
      expect(cal).toEqual(o7.input.nightlyRatesVnd);
      const five = await move(Number(o5.input.nights));
      expect(rates(five)).toEqual(o5.expected.discountedNightlyRatesVnd);
      expect(five.totalRoomVnd).toBe(o5.expected.roomTotalVnd);
      if (five.folioId && (await isAvailable(request, 'GET', EP.getFolio[1]))) {
        const f = await call<Folio>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/folios/${five.folioId}`,
          {
            session: fd,
          },
        );
        expect(sumOf(f.body.lines ?? [], 'room'), JSON.stringify(f.body.lines)).toBe(
          o5.expected.roomTotalVnd,
        );
      }
    });

    test('TC-L2-053 (b) hủy thật đơn đã cọc 5 ngày trước: folio đảo tiền phòng, 1 dòng phí hủy 350.000, còn phải thu 0 (BR-309-02, FB-R2-DOM-BE-01)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-053', [
        EP.createReservation,
        EP.cancelReservation,
        EP.getFolio,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const o = oracle('BR-309-02');
      const deposit = oracleNum('BR-309-01', 'depositVnd');
      const arrival = addDays(today, Number(o.expected.noticeDays));
      const departure = addDays(arrival, 3);
      const l12 = c.rooms.filter((x) =>
        ['101', '102', '103', '201', '202', '203'].includes(x.roomNo),
      );
      const guestId = await newGuest(request, fd);
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
              nightlyRates: nightsOf(arrival, departure).map((date) => ({
                date,
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
      expect(created!.status, JSON.stringify(created!.body)).toBe(201);
      const res = created!.body;
      track('reservation', res.id);
      const cancel = await action<{ cancellation: { refundableVnd: number; retainedVnd: number } }>(
        request,
        fd,
        res.id,
        'cancel',
        { reasonCode: 'guest_changed_mind' },
      );
      expect(cancel.status, JSON.stringify(cancel.body)).toBe(200);
      expect(cancel.body.cancellation.retainedVnd).toBe(o.expected.cancelFeeVnd);
      expect(cancel.body.cancellation.refundableVnd).toBe(o.expected.refundVnd);
      const f = await call<Folio>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(fd)}/folios/${res.folioId}`,
        {
          session: fd,
        },
      );
      expect(f.status, JSON.stringify(f.body)).toBe(200);
      const lines = f.body.lines ?? [];
      expect(sumOf(lines, 'room'), JSON.stringify(lines)).toBe(0); // đảo hết tiền phòng (BR-008: dòng đảo, không sửa số)
      expect(lines.filter((l) => l.category === 'room' && l.reversalOfId).length).toBe(3);
      expect(
        lines.filter((l) => l.category === 'cancellation_fee').map((l) => l.amountVnd),
      ).toEqual([o.expected.cancelFeeVnd]);
      expect(f.body.totals?.roomVnd).toBe(0);
      // OpenAPI 0.3.6 (A-34, BE-B S3): tiền khách trả thừa không còn là còn-phải-thu âm mà nằm ở `creditVnd`
      // = đã thu − tổng − đã hoàn = 700.000 − 350.000 = 350.000 (khoản hoàn BR-522); `balanceDueVnd` không âm và
      // không cùng > 0 với `creditVnd` → khách không còn nợ (0), OTTIMO nợ khách 350.000
      expect(f.body.totals?.balanceDueVnd).toBe(0);
      expect(f.body.totals?.creditVnd).toBe(Number(o.expected.refundVnd));
    });

    test('TC-L5-050 CTV đã có 3 giữ chỗ đang mở → giữ chỗ thứ 4: 422 HOLD_LIMIT_REACHED (max 3); xác nhận cọc 1 đơn → giữ được (BR-302-03, A-26)', async ({
      request,
    }) => {
      test.slow();
      await requireEndpoints(request, 'TC-L5-050', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
      ]);
      const o = oracle('BR-302-03');
      const owner = await sessionOrSkip(request, 'qa.owner');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      // CTV riêng của ca (qa.ctv1 dùng chung với các ca song song – số giữ chỗ đang mở không xác định)
      const u = await createThrowawayUser(request, owner, 'collaborator');
      const { session: ctv } = await activateUser(request, u);
      const max = Number(o.input.openHolds);
      const holds: Reservation[] = [];
      for (let i = 0; i < max; i++) {
        const { hold } = await makeHold(request, ctv, c, {
          rooms: c.rooms,
          arrival: addDays(today, 60 + i * 9 + Math.floor(Math.random() * 5)),
          nights: 2,
          holdHours: 24,
        });
        holds.push(hold);
      }
      const arrival = addDays(today, 120 + Math.floor(Math.random() * 60));
      const q = await saveQuote(request, ctv, {
        ...quoteInput(c, { room: room(c, '103'), arrival, nights: 2 }),
        guestId: await newGuest(request, ctv),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const blocked = await createHold(request, ctv, q.body.id, 24);
      expect(blocked.status, JSON.stringify(blocked.body)).toBe(422);
      expect(fieldCodes(blocked.body)).toContain(`holdHours:${String(o.expected.errorCode)}`);
      expect((blocked.body as unknown as Problem).max).toBe(max);
      // một giữ chỗ được xác nhận cọc → không còn "đang mở"
      const h0 = holds[0]!;
      const conf = await action(
        request,
        fd,
        h0.id,
        'confirm-deposit',
        {
          payment: {
            type: 'deposit',
            method: 'bank_transfer',
            amountVnd: h0.depositRequiredVnd ?? 0,
          },
        },
        { version: h0.version },
      );
      expect(conf.status, statusOf(conf)).toBe(200);
      const again = await createHold(request, ctv, q.body.id, 24);
      if (again.status === 409) test.skip(true, 'môi trường: căn 103 đã bị chiếm trong lúc chạy');
      expect(again.status, JSON.stringify(again.body)).toBe(201);
      track('reservation', again.body.id);
      expect(o.expected.holdAllowedAfterOneConfirmed).toBe(true);
    });

    test('TC-L5-051 dryRun gửi vào thao tác ghi tiền/báo giá → 422 dryRun:NOT_ALLOWED, không ghi gì (FB-R2-SEC-BE-21)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-051', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 50 + Math.floor(Math.random() * 150)),
        nights: 2,
        holdHours: 24,
      });
      const r = await action(
        request,
        sal,
        hold.id,
        'confirm-deposit',
        {
          payment: { type: 'deposit', method: 'cash', amountVnd: hold.depositRequiredVnd ?? 0 },
          dryRun: true,
        },
        { version: hold.version },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(422);
      expect(fieldCodes(r.body)).toContain('dryRun:NOT_ALLOWED');
      const after = await getReservation(request, sal, hold.id);
      expect(after.body.status).toBe('hold');
      expect(after.body.depositPaidVnd ?? 0).toBe(0);
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: room(c, '101'), arrival: addDays(today, 90), nights: 2 }),
        guestId: await newGuest(request, sal),
        dryRun: true,
      });
      expect(q.status, JSON.stringify(q.body)).toBe(422);
      expect(fieldCodes(q.body)).toContain('dryRun:NOT_ALLOWED');
    });

    test('TC-L2-020 (c) conflicts[] không lộ mã đơn/tên khách với SAL, CTV, MT; FD thấy (SEC-23, BE-A s2-be-a-fix)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-020', [
        EP.createReservation,
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.createRoomBlock,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '201');
      const w = await freeWindow(request, fd, rm, 2, { today });
      const a = await createReservation(
        request,
        fd,
        reservationBody(c, { room: rm, ...w, guestId: await newGuest(request, fd) }),
      );
      expect(a.status, JSON.stringify(a.body)).toBe(201);
      track('reservation', a.body.id);
      const hidden = (p: ProblemFields, who: string) => {
        const list = (p.conflicts as Array<Record<string, unknown>> | undefined) ?? [];
        expect(list.length, `${who}: ${JSON.stringify(p)}`).toBeGreaterThan(0);
        for (const x of list) {
          expect(x, who).not.toHaveProperty('reservationCode');
          expect(x, who).not.toHaveProperty('guestDisplayName');
        }
        expect(JSON.stringify(p), who).not.toContain(a.body.code);
      };
      // FD thấy mã đơn
      const f = await createReservation(
        request,
        fd,
        reservationBody(c, { room: rm, ...w, guestId: await newGuest(request, fd) }),
      );
      const pf = expectProblem(f, 409, 'ROOM_UNAVAILABLE');
      expect(JSON.stringify(pf.conflicts)).toContain(a.body.code);
      // SAL, CTV: giữ chỗ từ báo giá trùng đêm
      for (const who of ['qa.sal', 'qa.ctv1']) {
        const s = await sessionOrSkip(request, who);
        const q = await saveQuote(request, s, {
          ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 2 }),
          guestId: await newGuest(request, s),
        });
        expect(q.status, JSON.stringify(q.body)).toBe(201);
        const h = await createHold(request, s, q.body.id, 24);
        hidden(expectProblem(h, 409, 'ROOM_UNAVAILABLE') as unknown as ProblemFields, who);
      }
      // MT: khối OOO trùng đơn
      const mt = await sessionOrSkip(request, 'qa.mt');
      const b = await call<ProblemFields>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(mt)}/room-blocks`,
        {
          session: mt,
          idempotencyKey: true,
          body: {
            roomId: rm.id,
            startDate: w.arrival,
            endDatePlanned: w.departure,
            reason: 'E2E TC-L2-020 (c)',
          },
        },
      );
      hidden(expectProblem(b, 409, 'ROOM_UNAVAILABLE') as unknown as ProblemFields, 'qa.mt');
    });

    test('TC-L5-051 (b) dryRun ở operation không khai báo (createReservation) → 422 dryRun:NOT_ALLOWED, không tạo đơn', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-051', [EP.createReservation]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '102');
      const w = await freeWindow(request, fd, rm, 2, { today });
      const r = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          ...w,
          guestId: await newGuest(request, fd),
          extra: { dryRun: true },
        }),
        true,
        { autoDeposit: false },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(422);
      expect(fieldCodes(r.body)).toContain('dryRun:NOT_ALLOWED');
      expect(await isRoomFree(request, fd, rm, w.arrival, w.departure)).toBe(true);
    });

    test('TC-L5-017 (d) gia hạn báo giá còn hiệu lực → 409 INVALID_TRANSITION + currentState (A-18)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-017', [EP.saveQuote, EP.extendQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: room(c, '102'), arrival: addDays(today, 70), nights: 2 }),
        guestId: await newGuest(request, sal),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const r = await call<Problem>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(mgr)}/quotes/${q.body.id}/actions/extend`,
        { session: mgr, idempotencyKey: true, ifMatch: `"${q.body.version}"`, body: {} },
      );
      const p = expectProblem(r, 409, 'INVALID_TRANSITION');
      expect(p.currentState).toBe('active');
    });
  },
);
