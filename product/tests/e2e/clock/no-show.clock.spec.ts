// Project "clock" – không đến (no-show) theo mốc giờ BR-311 / khôi phục BR-315, khóa OOO kích hoạt J9.
// TC: TC-L2-070 (J6 no_show.call), TC-L2-071 (đánh dấu), TC-L2-072 (J7 không tự đánh dấu), TC-L2-073 (trước mốc),
// TC-L2-074 (khôi phục trong ngày nghiệp vụ), TC-L2-075 (b) (qua ngày nghiệp vụ → yêu cầu duyệt), TC-L6-044 (J9).
// Oracle: BR-311-01 (gọi 18:00, đánh dấu từ 23:00, không tự đánh dấu, đêm sau mở bán), BR-315-01/02.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  isAvailable,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import {
  needClock,
  resetClock,
  runJob,
  runJobIfAny,
  scenarioDate,
  setClock,
} from '../support/clock.js';
import {
  EP,
  action,
  addDays,
  cleanupTracked,
  createReservation,
  createRoomBlock,
  freeRoom,
  getReservation,
  isRoomFree,
  newGuest,
  oracle,
  reservationBody,
  room,
  s2Context,
  statusOf,
  track,
  vnTime,
  type Reservation,
  type S2Context,
} from '../support/s2.js';

test.describe.configure({ mode: 'serial' });

let realToday = '';
test.beforeAll(async ({ request }) => {
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

const o311 = oracle('BR-311-01');
const hhmm = (iso: unknown) => String(iso).slice(11, 16);

/** Direct reservation arriving `D` (2 nights), optional ETA; deposit = server BR-305 amount (auto). */
async function arrivingToday(
  ctx: APIRequestContext,
  fd: StaffSession,
  c: S2Context,
  D: string,
  extra: Record<string, unknown> = {},
): Promise<Reservation> {
  const departure = addDays(D, 2);
  const rm = await freeRoom(ctx, fd, c.rooms, D, departure);
  const r = await createReservation(
    ctx,
    fd,
    reservationBody(c, {
      room: rm,
      arrival: D,
      departure,
      guestId: await newGuest(ctx, fd),
      extra: {
        // cọc BR-305 đúng mức server yêu cầu: createReservation tự kèm khi gặp DEPOSIT_INSUFFICIENT
        ...extra,
      },
    }),
  );
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  track('reservation', r.body.id);
  return r.body;
}

async function attention(ctx: APIRequestContext, kind: string): Promise<string[]> {
  const fd = await sessionOrSkip(ctx, 'qa.fd');
  const r = await call<{ data: Array<{ kind: string; reservationIds?: string[] }> }>(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(fd)}/attention`,
    { session: fd },
  );
  expect(r.status).toBe(200);
  return r.body.data.filter((x) => x.kind === kind).flatMap((x) => x.reservationIds ?? []);
}

test.describe(
  'No-show BR-311 / BR-315 (US-136) – MutableClock',
  { tag: ['@clock', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-L2-070…075 một ngày no-show: nhắc 18:00, khóa trước 23:00, đánh dấu, không tự đánh dấu, khôi phục', async ({
      request,
    }) => {
      test.setTimeout(240_000);
      needClock('TC-L2-070');
      await requireEndpoints(request, 'TC-L2-070', [
        EP.createReservation,
        EP.markNoShow,
        EP.restoreNoShow,
        EP.searchAvailability,
      ]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      await setClock(request, vnTime(D, '10:00'));
      let fd = await sessionOrSkip(request, 'qa.fd');
      const R1 = await arrivingToday(request, fd, c, D); // không ETA – bị nhắc, đánh dấu, khôi phục (BR-315-01)
      const R2 = await arrivingToday(request, fd, c, D, { etaTime: '22:00' }); // ETA sau mốc gọi – không nhắc
      const R3 = await arrivingToday(request, fd, c, D); // để qua nửa đêm – không tự đánh dấu (TC-L2-072)
      const R4 = await arrivingToday(request, fd, c, D); // khôi phục không lý do → 422 (TC-L2-074 b)
      const R5 = await arrivingToday(request, fd, c, D); // khôi phục sau ngày nghiệp vụ → duyệt (TC-L2-075 b)

      // TC-L2-070: 17:59 chưa nhắc; 18:00 nhắc R1, không nhắc R2 – cần J6 + "Cần chú ý" (BE: Sprint 4)
      const hasAttention = await isAvailable(request, 'GET', EP.listAttentionItems[1]);
      const callAt = hhmm(o311.expected.callFrom);
      await setClock(
        request,
        new Date(new Date(vnTime(D, callAt)).getTime() - 60_000).toISOString(),
      );
      const j6 = await runJobIfAny(request, 'no_show.call');
      if (hasAttention && j6) expect(await attention(request, 'no_show_call')).not.toContain(R1.id);
      await setClock(request, vnTime(D, callAt));
      await runJobIfAny(request, 'no_show.call');
      if (hasAttention && j6) {
        const calls = await attention(request, 'no_show_call');
        expect(calls).toContain(R1.id);
        expect(calls).not.toContain(R2.id);
      } else {
        test.info().annotations.push({
          type: 'pending',
          description:
            'TC-L2-070, TC-L2-072 (phần "Cần chú ý"): chờ J6/J7 + listAttentionItems (BE: Sprint 4)',
        });
      }

      // TC-L2-073 (a): 22:59 đã có ghi chú liên lạc → 409 (chưa tới mốc 23:00)
      await setClock(request, vnTime(D, '22:59'));
      fd = await sessionOrSkip(request, 'qa.fd');
      const early = await action(request, fd, R1.id, 'mark-no-show', {
        contactAttemptNote: 'Da goi 3 lan khong nghe may',
      });
      expect(early.status, statusOf(early)).toBe(409);

      // 23:00: J7 nhắc đánh dấu, không tự đánh dấu
      const markAt = hhmm(o311.expected.markNoShowFrom);
      await setClock(request, vnTime(D, markAt));
      const j7 = await runJobIfAny(request, 'no_show.mark_prompt');
      if (hasAttention && j7) expect(await attention(request, 'no_show_mark')).toContain(R3.id);
      fd = await sessionOrSkip(request, 'qa.fd');
      // TC-L2-073 (b): chưa ghi kết quả liên lạc → không đánh dấu được (hợp đồng: contactAttemptNote bắt buộc → 422)
      const noNote = await action(request, fd, R1.id, 'mark-no-show', {});
      expect([409, 422], statusOf(noNote)).toContain(noNote.status);

      // TC-L2-071: đánh dấu R1 → no_show; đêm còn lại mở bán (BR-311-01 releasedNightDates)
      const m1 = await action(request, fd, R1.id, 'mark-no-show', {
        contactAttemptNote: 'Da goi 3 lan khong nghe may',
      });
      expect(m1.status, JSON.stringify(m1.body)).toBe(200);
      expect((await getReservation(request, fd, R1.id)).body.status).toBe('no_show');
      // FB-R2-DOM-BE-01: no-show (B11) đảo tiền phòng, giữ cọc thành 1 dòng `no_show_fee` (doanh thu khác, BR-904)
      const hasFolio = await isAvailable(request, 'GET', EP.getFolio[1]);
      const folioLines = async () => {
        const s = await sessionOrSkip(request, 'qa.fd');
        const f = await call<{
          lines?: Array<{ category: string; amountVnd: number }>;
          totals?: { balanceDueVnd?: number; paidVnd?: number };
        }>(request, 'GET', `/v1/properties/${propertyIdOf(s)}/folios/${R1.folioId}`, {
          session: s,
        });
        expect(f.status, JSON.stringify(f.body)).toBe(200);
        const sum = (cat: string) =>
          (f.body.lines ?? [])
            .filter((l) => l.category === cat)
            .reduce((x, l) => x + l.amountVnd, 0);
        return { room: sum('room'), fee: sum('no_show_fee'), totals: f.body.totals ?? {} };
      };
      if (hasFolio) {
        const after = await folioLines();
        expect(after.room).toBe(0);
        expect(after.fee).toBe(after.totals.paidVnd);
        expect(after.totals.balanceDueVnd).toBe(0);
      }
      const rm1 = c.rooms.find((x) => x.id === R1.segments?.[0]?.roomId)!;
      expect(await isRoomFree(request, fd, rm1, addDays(D, 1), addDays(D, 2))).toBe(true);
      for (const r of [R4, R5]) {
        const m = await action(request, fd, r.id, 'mark-no-show', {
          contactAttemptNote: 'Khong lien lac duoc',
        });
        expect(m.status, statusOf(m)).toBe(200);
      }

      // TC-L2-074 (a) / BR-315-01: khôi phục 01:30 còn trong ngày nghiệp vụ, đủ điều kiện → FD làm ngay
      const o315 = oracle('BR-315-01');
      await setClock(request, vnTime(addDays(D, 1), hhmm(o315.input.restoreAt)));
      await runJobIfAny(request, 'no_show.mark_prompt');
      fd = await sessionOrSkip(request, 'qa.fd');
      expect((await getReservation(request, fd, R3.id)).body.status).toBe('confirmed'); // TC-L2-072
      const r1 = await action(request, fd, R1.id, 'restore-no-show', {
        reason: 'Khach den 01:30, phong con trong',
      });
      expect(r1.status, JSON.stringify(r1.body)).toBe(200);
      const restored = (await getReservation(request, fd, R1.id)).body;
      expect(restored.status).toBe('confirmed');
      if (hasFolio) {
        // B12: đảo dòng no_show_fee, ghi lại tiền phòng các đêm (trỏ cùng stay_night)
        const back = await folioLines();
        expect(back.fee).toBe(0);
        expect(back.room).toBe(restored.totalRoomVnd);
      }
      // TC-L2-074 (b): FDL khôi phục không lý do → 422
      const fdl = await sessionOrSkip(request, 'qa.fdl');
      const r4 = await action(request, fdl, R4.id, 'restore-no-show', { reason: '' });
      expect(r4.status, statusOf(r4)).toBe(422);

      // TC-L2-072: tới 06:00 hôm sau, chạy lại J7 → R3 vẫn confirmed (không tự đánh dấu)
      await setClock(request, vnTime(addDays(D, 1), '06:00'));
      await runJobIfAny(request, 'no_show.mark_prompt');
      fd = await sessionOrSkip(request, 'qa.fd');
      expect((await getReservation(request, fd, R3.id)).body.status).toBe('confirmed');
      expect(o311.expected.autoMark).toBe(false);

      // TC-L2-075 (b) / BR-315-02: 07:00 (qua ngày nghiệp vụ) → 202 yêu cầu duyệt, đơn vẫn no_show
      const o315b = oracle('BR-315-02');
      await setClock(request, vnTime(addDays(D, 1), hhmm(o315b.input.restoreAt)));
      fd = await sessionOrSkip(request, 'qa.fd');
      const r5 = await action(request, fd, R5.id, 'restore-no-show', { reason: 'Khach den 07:00' });
      expect(r5.status, JSON.stringify(r5.body)).toBe(202);
      expect((r5.body as unknown as { status?: string }).status).toBe('pending');
      expect((await getReservation(request, fd, R5.id)).body.status).toBe('no_show');
    });

    test('TC-L6-044 J9 ooo.activate: khối planned chuyển active khi sang ngày nghiệp vụ bắt đầu (06:00, BR-010), vẫn chặn bán khi planned', async ({
      request,
    }) => {
      needClock('TC-L6-044');
      await requireEndpoints(request, 'TC-L6-044', [EP.createRoomBlock, EP.listRoomBlocks]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      await setClock(request, vnTime(addDays(D, -3), '10:00'));
      const mt = await sessionOrSkip(request, 'qa.mt');
      const fdA = await sessionOrSkip(request, 'qa.fd'); // MT không có quyền searchAvailability
      const rm = await freeRoom(
        request,
        fdA,
        [room(c, '401'), room(c, '402'), room(c, '301')],
        D,
        addDays(D, 2),
      );
      const blk = await createRoomBlock(request, mt, {
        roomId: rm.id,
        startDate: D,
        endDatePlanned: addDays(D, 2),
        reason: 'E2E TC-L6-044',
      });
      expect(blk.status, JSON.stringify(blk.body)).toBe(201);
      expect(blk.body.status).toBe('planned');
      const statusAt = async () => {
        const s = await sessionOrSkip(request, 'qa.mt');
        const r = await call<{ data: Array<{ id: string; status: string }> }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(s)}/room-blocks`,
          { session: s, query: { from: D, to: addDays(D, 2) } },
        );
        expect(r.status).toBe(200);
        return r.body.data.find((x) => x.id === blk.body.id)?.status;
      };
      // khối bắt đầu theo NGÀY NGHIỆP VỤ (BR-010: đổi ngày lúc 06:00) – 05:59 ngày D vẫn là ngày D−1
      await setClock(request, vnTime(D, '05:59'));
      await runJob(request, 'ooo.activate');
      expect(await statusAt()).toBe('planned');
      await setClock(request, vnTime(D, '06:00'));
      await runJob(request, 'ooo.activate');
      expect(await statusAt()).toBe('active');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const r = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival: D,
          departure: addDays(D, 1),
          guestId: await newGuest(request, fd),
        }),
      );
      expectProblem(r, 409, 'ROOM_BLOCKED');
    });
  },
);
