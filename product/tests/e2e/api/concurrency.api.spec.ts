// E2E API – đồng thời chống đặt trùng (BR-906, ERD K1 exclusion constraint, ADR-009) và xác nhận cọc đồng thời.
// TC: TC-L2-021 (S), TC-X-001 (S), TC-X-002 (S), TC-X-003 (S). Oracle BR-906-01: 2 yêu cầu → 1 thành công, 1 ROOM_UNAVAILABLE.
//
// Mỗi vòng: chọn một căn – đêm còn trống, bắn N yêu cầu createReservation SONG SONG (nhiều phiên khác nhau,
// Idempotency-Key khác nhau) → đúng 1 `201`, N−1 `409 ROOM_UNAVAILABLE`, 0 lỗi 5xx; căn – đêm không còn trống;
// sau đó hủy đơn thắng (dọn tồn). Tham số: E2E_DOUBLE_BOOK_N (mặc định 8), E2E_DOUBLE_BOOK_ROUNDS (mặc định 20),
// E2E_DOUBLE_BOOK_N_X001 (mặc định 50 – TC-X-001).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type ApiResult,
  type StaffSession,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  cleanupTracked,
  createReservation,
  createRoomBlock,
  freeWindow,
  getReservation,
  isRoomFree,
  makeHold,
  newGuest,
  oracle,
  quoteInput,
  reservationBody,
  room,
  s2Context,
  saveQuote,
  track,
  withDeposit,
  WindowTakenError,
  type ProblemFields,
  type Reservation,
  type S2Context,
} from '../support/s2.js';

const N = Number(process.env.E2E_DOUBLE_BOOK_N ?? 8);
const ROUNDS = Number(process.env.E2E_DOUBLE_BOOK_ROUNDS ?? 20);
const N_X001 = Number(process.env.E2E_DOUBLE_BOOK_N_X001 ?? 50);
const BOOKERS = ['qa.fd', 'qa.fdl', 'qa.mgr', 'qa.owner'];

interface RaceOutcome {
  winners: Array<ApiResult<Reservation & ProblemFields>>;
  losers: Array<ApiResult<Reservation & ProblemFields>>;
  other: Array<ApiResult<Reservation & ProblemFields>>;
}

/**
 * Bên thua hợp lệ: `409 ROOM_UNAVAILABLE` (EXCLUDE ADR-009) hoặc `409 CONCURRENT_UPDATE` kèm `Retry-After`
 * (chờ khóa quá `lock_timeout`/deadlock – BE-A s2-be-a-fix, SEC-25). 503 (statement_timeout) và 5xx khác là lỗi.
 */
export function isLoser(r: ApiResult<ProblemFields>): boolean {
  if (r.status !== 409) return false;
  if (r.body?.code === 'ROOM_UNAVAILABLE') return true;
  return r.body?.code === 'CONCURRENT_UPDATE' && !!r.headers['retry-after'];
}

function tally(rs: Array<ApiResult<Reservation & ProblemFields>>): RaceOutcome {
  return {
    winners: rs.filter((r) => r.status === 201),
    losers: rs.filter(isLoser),
    other: rs.filter((r) => r.status !== 201 && !isLoser(r)),
  };
}

function describeOutcome(o: RaceOutcome): string {
  const other = o.other.map((r) => `${r.status} ${r.body?.code ?? ''}`).join(', ');
  const conc = o.losers.filter((r) => r.body?.code === 'CONCURRENT_UPDATE').length;
  return `201×${o.winners.length}, 409×${o.losers.length} (CONCURRENT_UPDATE ${conc})${other ? `, khác: ${other}` : ''}`;
}

/** N parallel createReservation on the same room-night window, from several sessions. */
async function race(
  ctx: APIRequestContext,
  sessions: StaffSession[],
  c: S2Context,
  roomNo: string,
  arrival: string,
  departure: string,
  n: number,
  guestId: string,
): Promise<RaceOutcome> {
  const rm = room(c, roomNo);
  // cùng một body (kèm sẵn cọc BR-305 – EP02 3.2) cho mọi yêu cầu; không tự gửi lại khi thiếu cọc
  const body = await withDeposit(
    ctx,
    sessions[0]!,
    reservationBody(c, { room: rm, arrival, departure, guestId }),
  );
  const calls = Array.from({ length: n }, (_, i) =>
    createReservation(ctx, sessions[i % sessions.length]!, body, true, {
      autoDeposit: false,
      concurrentRetry: false,
    }),
  );
  const rs = await Promise.all(calls);
  const o = tally(rs);
  for (const w of o.winners) track('reservation', w.body.id);
  return o;
}

/** Chọn đêm trống rồi đua; nếu lần dò cọc thấy đêm vừa bị ca song song chiếm (WindowTakenError) thì chọn đêm khác. */
async function raceOnFreeNight(
  pick: () => Promise<{ arrival: string; departure: string }>,
  run: (w: { arrival: string; departure: string }) => Promise<RaceOutcome>,
): Promise<{ w: { arrival: string; departure: string }; o: RaceOutcome }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const w = await pick();
    try {
      return { w, o: await run(w) };
    } catch (e) {
      if (!(e instanceof WindowTakenError)) throw e;
    }
  }
  test.skip(true, 'môi trường: đêm trống liên tục bị ca song song chiếm');
  throw new Error('unreachable');
}

test.describe(
  'Đồng thời – chống đặt trùng (US-018 AC2)',
  { tag: ['@api', '@sprint2', '@concurrency'] },
  () => {
    test.describe.configure({ mode: 'serial' }); // trong file chạy tuần tự để số yêu cầu song song là của MỘT ca
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test(`TC-L2-021 ${N} yêu cầu song song cùng căn – đêm × ${ROUNDS} vòng → mỗi vòng đúng 1 thành công`, async ({
      request,
    }) => {
      test.setTimeout(240_000);
      await requireEndpoints(request, 'TC-L2-021', [EP.createReservation, EP.searchAvailability]);
      const o906 = oracle('BR-906-01');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const sessions = await Promise.all(BOOKERS.map((u) => sessionOrSkip(request, u)));
      const fd = sessions[0]!;
      const guestId = await newGuest(request, fd);
      const rm = room(c, String(o906.input.room)); // 203
      const results: string[] = [];
      for (let round = 0; round < ROUNDS; round++) {
        const { w, o } = await raceOnFreeNight(
          () => freeWindow(request, fd, rm, 1, { today, minOffset: 20, maxOffset: 340 }),
          (w) => race(request, sessions, c, rm.roomNo, w.arrival, w.departure, N, guestId),
        );
        results.push(`${w.arrival}: ${describeOutcome(o)}`);
        const log = results.join('\n');
        expect(o.other.filter((r) => r.status >= 500).length, log).toBe(0);
        expect(o.winners.length, log).toBe(1);
        expect(o.losers.length, log).toBe(N - 1);
        // thông điệp/thân lỗi của bên thua (BR-906-01 message "Căn vừa được đặt")
        // (tiêu đề theo Accept-Language – chỉ ghi lại, không chặn: phần chữ kiểm ở UI smoke)
        const p = o.losers[0]!.body;
        if (round === 0) {
          test.info().annotations.push({
            type: 'loser-title',
            description: `${p.title ?? ''} (oracle: ${String(o906.expected.message)})`,
          });
        }
        // căn – đêm đã kín sau vòng
        expect(await isRoomFree(request, fd, rm, w.arrival, w.departure)).toBe(false);
        // dọn: hủy đơn thắng → căn – đêm mở lại
        const win = o.winners[0]!.body;
        const cancel = await action(request, fd, win.id, 'cancel', {
          reasonCode: 'other',
          note: 'E2E dọn dữ liệu',
        });
        expect(cancel.status, JSON.stringify(cancel.body)).toBe(200);
        expect(await isRoomFree(request, fd, rm, w.arrival, w.departure)).toBe(true);
      }
      test.info().annotations.push({ type: 'rounds', description: results.join(' | ') });
    });

    test(`TC-X-001 ${N_X001} yêu cầu song song cùng căn 203 một đêm → 1 × 201, ${N_X001 - 1} × 409, 0 × 5xx`, async ({
      request,
    }) => {
      test.setTimeout(120_000);
      await requireEndpoints(request, 'TC-X-001', [EP.createReservation, EP.searchAvailability]);
      const c = await s2Context(request);
      const today = await stackToday(request);
      const sessions = await Promise.all(BOOKERS.map((u) => sessionOrSkip(request, u)));
      const guestId = await newGuest(request, sessions[0]!);
      const rm = room(c, '203');
      const { o } = await raceOnFreeNight(
        () => freeWindow(request, sessions[0]!, rm, 1, { today, minOffset: 20 }),
        (w) => race(request, sessions, c, rm.roomNo, w.arrival, w.departure, N_X001, guestId),
      );
      const msg = describeOutcome(o);
      test.info().annotations.push({ type: 'outcome', description: msg });
      expect(o.other.filter((r) => r.status >= 500).length, msg).toBe(0);
      expect(o.winners.length, msg).toBe(1);
      expect(o.losers.length, msg).toBe(N_X001 - 1);
      // đơn thắng có mã hợp lệ; bên thua không trả đơn nào (không có id – `code` của bên thua là mã lỗi)
      expect(o.winners[0]!.body.code).toMatch(/^OTM-\d{5}$/);
      for (const l of o.losers) expect((l.body as Partial<Reservation>).id).toBeUndefined();
    });

    test('TC-X-002 song song createReservation + createHoldFromQuote + createRoomBlock cùng căn – đêm → đúng 1 thành công', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-X-002', [
        EP.createReservation,
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.createRoomBlock,
      ]);
      const c = await s2Context(request);
      const today = await stackToday(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const mt = await sessionOrSkip(request, 'qa.mt');
      const rm = room(c, '203');
      const w = await freeWindow(request, fd, rm, 1, { today, minOffset: 20 });
      const fdGuest = await newGuest(request, fd);
      const salGuest = await newGuest(request, sal);
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 1 }),
        guestId: salGuest,
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const pid = propertyIdOf(fd);
      const resBody = await withDeposit(
        request,
        fd,
        reservationBody(c, { room: rm, ...w, guestId: fdGuest }),
      );
      const [res, hold, block] = await Promise.all([
        createReservation(request, fd, resBody, true, {
          autoDeposit: false,
          concurrentRetry: false,
        }),
        call<Reservation & ProblemFields>(
          request,
          'POST',
          `/v1/properties/${pid}/quotes/${q.body.id}/actions/create-hold`,
          { session: sal, idempotencyKey: true, body: { holdHours: 24 } },
        ),
        createRoomBlock(request, mt, {
          roomId: rm.id,
          startDate: w.arrival,
          endDatePlanned: w.departure,
          reason: 'E2E TC-X-002 song song',
        }),
      ]);
      if (res.status === 201) track('reservation', res.body.id);
      if (hold.status === 201) track('reservation', hold.body.id);
      const all = [
        ['createReservation', res],
        ['createHoldFromQuote', hold],
        ['createRoomBlock', block],
      ] as const;
      const msg = all
        .map(([n, r]) => `${n}: ${r.status} ${(r.body as ProblemFields)?.code ?? ''}`)
        .join('; ');
      expect(
        all.filter(([, r]) => r.status >= 500),
        msg,
      ).toHaveLength(0);
      expect(
        all.filter(([, r]) => r.status === 201),
        msg,
      ).toHaveLength(1);
      for (const [, r] of all.filter(([, r]) => r.status !== 201)) {
        expect(r.status, msg).toBe(409);
        expect(['ROOM_UNAVAILABLE', 'ROOM_BLOCKED', 'CONCURRENT_UPDATE'], msg).toContain(
          (r.body as ProblemFields).code,
        );
        if ((r.body as ProblemFields).code === 'CONCURRENT_UPDATE')
          expect(r.headers['retry-after'], msg).toBeTruthy();
      }
    });

    test('TC-X-003 FD và SAL cùng xác nhận cọc một giữ chỗ → 1 lần confirmed, lần kia 412/409', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-X-003', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
        EP.getReservation,
      ]);
      const c = await s2Context(request);
      const today = await stackToday(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const arrival = addDays(today, 90 + Math.floor(Math.random() * 150));
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival,
        nights: 2,
        holdHours: 24,
      });
      const amount = hold.depositRequiredVnd ?? 0;
      expect(amount, 'depositRequiredVnd').toBeGreaterThan(0);
      const body = { payment: { type: 'deposit', method: 'bank_transfer', amountVnd: amount } };
      const [a, b] = await Promise.all([
        action(request, fd, hold.id, 'confirm-deposit', body, { version: hold.version }),
        action(request, sal, hold.id, 'confirm-deposit', body, { version: hold.version }),
      ]);
      const msg = `fd: ${a.status} ${a.body?.code ?? ''}; sal: ${b.status} ${b.body?.code ?? ''}`;
      const ok = [a, b].filter((r) => r.status === 200);
      expect(ok, msg).toHaveLength(1);
      const loser = [a, b].find((r) => r.status !== 200)!;
      expect([409, 412], msg).toContain(loser.status);
      const after = await getReservation(request, fd, hold.id);
      expect(after.body.status).toBe('confirmed');
    });
  },
);
