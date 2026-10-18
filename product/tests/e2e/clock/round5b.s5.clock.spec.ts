// Vòng sửa 5b (S4 tuần Ổn định) – ca API cần đồng hồ ảo cho các bản sửa của kiểm lại 5b (`reviews/s4-money-recheck5b.md`):
// - TC-L4-137: K11-03 / BUG-R2-173 – lần đếm phải định danh được tủ (ARC 16.19 K11-03, (ac) viết lại, (ah), ca 30 của
//   16.4): lần đếm soạn với `periodId: null` trước B14 → 409 `MINIBAR_PERIOD_CHANGED` → tải lại → 201 ghi đúng tủ căn
//   cũ; vắng `roomId` mà có `periodId` → 422 `REQUIRED`. Oracle BR-703-04.
// - TC-L4-139: K11-09 – BR-703 ghi chú 7 (ca 29 của 16.4): tủ căn đang ở phải đếm trong ngày nghiệp vụ của B18; lần
//   đếm "dùng 0" soạn trước B13 gửi sau B13 không đủ → B18 đòi đếm lại (`not_today`), uống 1 bia → 35.000. Oracle
//   BR-703-03.
// - TC-L4-145: BUG-R2-196 (recheck6 R6MISC-01, ARC 16.19 K11-08): `roomId` và `periodId` bắt buộc với mọi vai – vắng cả
//   hai hoặc chỉ có `roomId` → 422 `REQUIRED`, không ghi lần đếm.
// Project "clock" (tuần tự, 1 worker). Mỗi ca dùng ngày ảo riêng (virtualDay).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  type ApiResult,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import {
  addDays,
  cleanupTracked,
  oracle,
  room,
  s2Context,
  vnTime,
  type ProblemFields,
  type Room,
} from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  p3,
  stayAction,
  useVirtualDevice,
  virtualDay,
  type Folio,
} from '../support/s3.js';
import { checkOut, checkoutSummary, minibarItem } from '../support/s3-stay.js';

type Json = Record<string, unknown>;
const BIA = minibarItem('bia');

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

interface Std {
  roomId?: string;
  roomNo?: string;
  periodId?: string | null;
  items: Array<{ itemId: string; itemName: string; standardQty: number }>;
  latestCheck?: { totalVnd?: number } | null;
}

async function std(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  roomId: string,
): Promise<Std> {
  const r = await call<Std & ProblemFields>(
    request,
    'GET',
    p3(EP3.getMinibarStandard, s, { reservationId }),
    { session: s, query: { roomId } },
  );
  expect(r.status, `getMinibarStandard: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body;
}

/** Thân lệnh đếm `checkout` soạn từ một bản chuẩn đã tải (còn lại = mốc − đã dùng). */
function countBody(t: Std, used: Record<string, number>): Json {
  return {
    mode: 'checkout',
    lines: t.items.map((i) => {
      const code = Object.keys(used).find((c) => minibarItem(c).name === i.itemName);
      return { itemId: i.itemId, remainingQty: i.standardQty - (code ? used[code]! : 0) };
    }),
  };
}

async function sendCount(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  body: Json,
): Promise<ApiResult<Json & ProblemFields>> {
  return call(request, 'POST', p3(EP3.recordMinibarCheck, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    body,
  });
}

/** Tải bản chuẩn của tủ `roomId` rồi đếm (gửi `roomId` + `periodId` như Desk từ FE-A đợt 17). */
async function countFridge(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  roomId: string,
  used: Record<string, number>,
  what: string,
): Promise<void> {
  const t = await std(request, s, reservationId, roomId);
  const r = await sendCount(request, s, reservationId, {
    ...countBody(t, used),
    roomId,
    periodId: t.periodId ?? null,
  });
  expect(r.status, `${what}: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(201);
}

/** Căn đích B14 phải sạch: dọn bằng API buồng phòng nếu đang VD/CL. */
async function makeReady(
  request: APIRequestContext,
  s: StaffSession,
  rm: Room,
  day: string,
  hhmm: string,
): Promise<void> {
  const st = await call<{ data: Array<{ roomId: string; status: string }> }>(
    request,
    'GET',
    p3(EP3.listRoomStatuses, s),
    { session: s },
  );
  const cur = st.body.data.find((x) => x.roomId === rm.id)?.status ?? 'VC';
  const step = async (event: string, expectedFrom: string) => {
    const r = await call(
      request,
      'POST',
      `/v1/properties/${propertyIdOf(s)}/rooms/${rm.id}/status-transitions`,
      {
        session: s,
        idempotencyKey: true,
        body: { event, expectedFrom, performedAt: vnTime(day, hhmm) },
      },
    );
    expect(r.status, `${rm.roomNo} ${event}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  };
  if (cur === 'VD') await step('start_cleaning', 'VD');
  if (cur === 'VD' || cur === 'CL') await step('finish_cleaning', 'CL');
}

const minibarGross = (f: Folio): number =>
  liveLines(f, 'minibar').reduce((a, l) => a + l.amountVnd, 0);

async function refillTasksOf(
  request: APIRequestContext,
  date: string,
  roomId: string,
  reservationId: string,
): Promise<Json[]> {
  const hk = await sessionOrSkip(request, 'qa.hk');
  const r = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
    session: hk,
    query: { date },
  });
  expect(r.status, `listHkTasks: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body.data.filter(
    (t) => t.type === 'minibar_refill' && t.roomId === roomId && t.reservationId === reservationId,
  );
}

test.describe(
  'Vòng sửa 5b – lần đếm định danh tủ (K11-03), mốc ngày đi của lần đếm (K11-09)',
  { tag: ['@clock', '@sprint4', '@money'] },
  () => {
    test('TC-L4-137 (A) BUG-R2-173 / ARC 16.19 K11-03 ca 30 (oracle BR-703-04): tải tủ 202 (`periodId` null) → B14 202 → 203 → đếm `roomId` 202 `periodId: null` → 409 MINIBAR_PERIOD_CHANGED, không ghi → tải lại → 201 ghi tủ 202, 35.000, 1 việc {bia: 1}; có `periodId` mà vắng `roomId` → 422 REQUIRED; tủ 203 vẫn phải đếm; B18 minibar 35.000', async ({
      request,
    }) => {
      needClock('TC-L4-137');
      const ex = oracle('BR-703-04');
      const D = virtualDay(realToday, 4);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const from = room(c, '202');
      const to = c.rooms.find(
        (r) => r.id !== from.id && r.roomGroupId && r.roomGroupId === from.roomGroupId,
      );
      expect(to, 'căn cùng nhóm với 202').toBeTruthy();
      const st = await inHouse(request, c, fd, { room: from, arrival: D, nights: 2 });
      expect(st.room.id, 'khách ở 202 (ví dụ ARC)').toBe(from.id);
      const d1 = addDays(D, 1);
      // 09:00 lễ tân A mở H16 bước 1 cho tủ 202 – tủ chưa nạp
      await at(request, d1, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const t0 = await std(request, fd, st.res.id, from.id);
      expect(t0.periodId ?? null, 'tủ 202 chưa có lần nạp → periodId null').toBeNull();
      expect.soft(t0.roomId, 'MinibarStandard.roomId = tủ đang mô tả').toBe(from.id);
      const stale = countBody(t0, { bia: 1 });
      // 09:05 lễ tân B đổi phòng 202 → 203 (sự cố) – B14 ghi nhận tủ 202 bằng lần nạp `check_in`
      await at(request, d1, '09:05');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const fdB = await sessionOrSkip(request, 'qa.fdl');
      await makeReady(request, fdB, to!, d1, '09:05');
      const base = {
        newRoomId: to!.id,
        effectiveDate: d1,
        cause: 'property_fault',
        reason: 'Dieu hoa hong',
      };
      const pv = await stayAction<Json & ProblemFields>(
        request,
        fdB,
        st.res.id,
        'change-room',
        base,
        { dryRun: true },
      );
      expect(pv.status, JSON.stringify(pv.body).slice(0, 200)).toBe(200);
      const delta = Number(pv.body.folioDeltaVnd ?? 0);
      const mv = await stayAction<Json & ProblemFields>(request, fdB, st.res.id, 'change-room', {
        ...base,
        ...(delta !== 0 ? { applyDifference: true, expectedDeltaVnd: delta } : {}),
      });
      expect(mv.status, `B14: ${JSON.stringify(mv.body).slice(0, 200)}`).toBe(200);
      // 09:06 lễ tân A gửi lần đếm đã soạn
      await at(request, d1, '09:06');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const noRoom = await sendCount(request, fd, st.res.id, { ...stale, periodId: null });
      expect(noRoom.status, `periodId mà vắng roomId: ${JSON.stringify(noRoom.body)}`).toBe(422);
      expect(
        JSON.stringify(noRoom.body.errors ?? []),
        '422 REQUIRED ở roomId (ARC 16.19 K11-03)',
      ).toContain('roomId');
      const first = await sendCount(request, fd, st.res.id, {
        ...stale,
        roomId: from.id,
        periodId: null,
      });
      expect(first.status, `lần đếm soạn trước B14: ${JSON.stringify(first.body)}`).toBe(
        Number((ex.expected as Json).firstStatus),
      );
      expect(first.body.code).toBe(String((ex.expected as Json).firstCode));
      expect(minibarGross(await getFolio(request, fd, st.res.folioId!)), '409 không ghi gì').toBe(
        0,
      );
      // tải lại: tủ 202 nay có lần nạp `check_in` → periodId là id
      const t1 = await std(request, fd, st.res.id, from.id);
      expect(t1.periodId, 'tải lại → periodId = lần nạp check_in').toBeTruthy();
      const again = await sendCount(request, fd, st.res.id, {
        ...countBody(t1, { bia: 1 }),
        roomId: from.id,
        periodId: t1.periodId,
      });
      expect(again.status, `đếm lại sau khi tải lại: ${JSON.stringify(again.body)}`).toBe(201);
      const f1 = await getFolio(request, fd, st.res.folioId!);
      expect(minibarGross(f1), 'ghi tủ 202: 35.000').toBe(Number((ex.expected as Json).minibarVnd));
      expect((await std(request, fd, st.res.id, from.id)).latestCheck?.totalVnd).toBe(
        BIA.salePriceVnd,
      );
      const tasks = await refillTasksOf(request, d1, from.id, st.res.id);
      expect(tasks.length, 'đúng một việc bổ sung cho tủ 202').toBe(1);
      const items = (tasks[0]!.refillItems ?? []) as Array<{ itemId: string; quantity: number }>;
      expect(
        items.map((x) => x.quantity),
        'việc bổ sung {bia: 1}',
      ).toEqual([1]);
      expect(
        (await refillTasksOf(request, d1, to!.id, st.res.id)).length,
        'tủ 203 không có việc bổ sung',
      ).toBe(0);
      const s1 = await checkoutSummary(request, fd, st.res.id);
      expect(
        ((s1.body as unknown as Json).minibarUncheckedRooms ?? []) as Json[],
        'tủ 203 không bị coi là đã đếm',
      ).toEqual([expect.objectContaining({ roomId: to!.id })]);
      // d2: ngày đi – đếm tủ 203 dùng 0, B18
      const d2 = addDays(D, 2);
      await at(request, d2, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      await countFridge(request, fd, st.res.id, to!.id, {}, 'đếm tủ 203 dùng 0');
      const sum = await checkoutSummary(request, fd, st.res.id, { checkoutTime: '09:00' });
      expect(sum.status).toBe(200);
      expect(((sum.body as unknown as Json).minibarUncheckedRooms ?? []) as Json[]).toEqual([]);
      const due = Number(
        (sum.body as unknown as Json).amountDueAtCheckoutVnd ?? sum.body.balanceDueVnd,
      );
      expect(due, 'còn thu = minibar 35.000 (tiền phòng đã thu)').toBe(BIA.salePriceVnd);
      const out = await checkOut(request, fd, st.res.id, {
        checkoutTime: '09:00',
        finalPayment: { type: 'charge', method: 'cash', amountVnd: due },
      });
      expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.status).toBe('settled');
      expect(minibarGross(f), 'minibar 35.000').toBe(Number((ex.expected as Json).minibarVnd));
    });

    test('TC-L4-139 (A) K11-09 / BR-703 ghi chú 7, ca 29 ARC 16.4 (oracle BR-703-03): 202 ngày đi cũ soạn lần đếm dùng 0 → B13 thêm 1 đêm → gửi lần đếm (201) → khách uống 1 bia → hôm sau B18 chặn `minibar_not_checked`, `minibarUncheckedRooms` lý do `not_today`, `latestCheck` null → đếm còn 1/2 → B18 thu 35.000 (không 0)', async ({
      request,
    }) => {
      needClock('TC-L4-139');
      const ex = oracle('BR-703-03');
      const exp = ex.expected as Json;
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const rm = room(c, String((ex.input as Json).roomNo));
      const st = await inHouse(request, c, fd, { room: rm, arrival: D, nights: 1 });
      const d1 = addDays(D, 1);
      await at(request, d1, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const t0 = await std(request, fd, st.res.id, st.room.id);
      const prepared = { ...countBody(t0, {}), roomId: st.room.id, periodId: t0.periodId ?? null };
      const ext = await stayAction<Json & ProblemFields>(request, fd, st.res.id, 'extend', {
        nights: 1,
      });
      expect(ext.status, `B13: ${JSON.stringify(ext.body).slice(0, 300)}`).toBe(200);
      const sent = await sendCount(request, fd, st.res.id, prepared);
      expect(sent.status, `lần đếm soạn trước B13: ${JSON.stringify(sent.body)}`).toBe(201);
      expect(exp.countBeforeB13Accepted).toBe(true);
      const sameDay = await checkoutSummary(request, fd, st.res.id);
      expect(
        (sameDay.body.blockers ?? []) as string[],
        'cùng ngày: lần đếm hôm nay đủ',
      ).not.toContain(String(exp.blocker));
      // hôm sau (ngày đi mới) – khách đã uống 1 bia trong đêm gia hạn
      const d2 = addDays(D, 2);
      await at(request, d2, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const before = await checkoutSummary(request, fd, st.res.id, { checkoutTime: '11:00' });
      expect(before.status).toBe(200);
      expect((before.body.blockers ?? []) as string[], 'B18 đòi đếm lại').toContain(
        String(exp.blocker),
      );
      expect(((before.body as unknown as Json).minibarUncheckedRooms ?? []) as Json[]).toEqual([
        expect.objectContaining({ roomId: st.room.id, reason: String(exp.uncheckedReason) }),
      ]);
      expect(
        (await std(request, fd, st.res.id, st.room.id)).latestCheck ?? null,
        'latestCheck null tới khi đếm trong ngày',
      ).toBeNull();
      const blocked = await checkOut(request, fd, st.res.id, { checkoutTime: '09:00' });
      expect(blocked.status, 'B18 khi chưa đếm trong ngày').toBe(409);
      expect(blocked.body.code).toBe('MINIBAR_NOT_CHECKED');
      await countFridge(request, fd, st.res.id, st.room.id, { bia: 1 }, 'đếm trong ngày đi');
      const after = await checkoutSummary(request, fd, st.res.id, { checkoutTime: '11:00' });
      expect((after.body.blockers ?? []) as string[]).not.toContain(String(exp.blocker));
      await at(request, d2, '11:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const due = Number(
        (after.body as unknown as Json).amountDueAtCheckoutVnd ?? after.body.balanceDueVnd,
      );
      const out = await checkOut(request, fd, st.res.id, {
        checkoutTime: '11:00',
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(minibarGross(f), 'minibar 35.000 (không có quy tắc thì 0)').toBe(
        Number(exp.minibarVnd),
      );
      expect(Number(exp.minibarVndWithoutRule)).toBe(0);
    });

    test('TC-L4-145 (A) BUG-R2-196 / ARC 16.19 K11-08 (hợp đồng `required: [mode, lines, roomId, periodId]`): lễ tân và buồng phòng gửi lần đếm vắng cả `roomId` lẫn `periodId`, hoặc chỉ có `roomId` → 422 `REQUIRED`, không ghi lần đếm; đủ hai trường → 201, 35.000', async ({
      request,
    }) => {
      needClock('TC-L4-145');
      const D = virtualDay(realToday, 2);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const st = await inHouse(request, c, fd, {
        room: room(c, '101'),
        alternatives: c.rooms,
        arrival: D,
        nights: 1,
      });
      const d1 = addDays(D, 1);
      await at(request, d1, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const hk = await sessionOrSkip(request, 'qa.hk');
      const t0 = await std(request, fd, st.res.id, st.room.id);
      const body = countBody(t0, { bia: 1 });
      const fieldsOf = (r: ApiResult<Json & ProblemFields>) => JSON.stringify(r.body.errors ?? []);
      for (const [who, s] of [
        ['FD', fd],
        ['HK', hk],
      ] as const) {
        const none = await sendCount(request, s, st.res.id, body);
        expect(none.status, `${who} vắng cả hai: ${JSON.stringify(none.body)}`).toBe(422);
        expect(fieldsOf(none), `${who}: roomId REQUIRED`).toMatch(/"roomId"[^}]*"REQUIRED"/);
        const roomOnly = await sendCount(request, s, st.res.id, { ...body, roomId: st.room.id });
        expect(roomOnly.status, `${who} chỉ có roomId: ${JSON.stringify(roomOnly.body)}`).toBe(422);
        expect(fieldsOf(roomOnly), `${who}: periodId REQUIRED`).toMatch(
          /"periodId"[^}]*"REQUIRED"/,
        );
      }
      expect(
        (await std(request, fd, st.res.id, st.room.id)).latestCheck ?? null,
        'không ghi lần đếm nào',
      ).toBeNull();
      const ok = await sendCount(request, fd, st.res.id, {
        ...body,
        roomId: st.room.id,
        periodId: t0.periodId ?? null,
      });
      expect(ok.status, `đủ hai trường: ${JSON.stringify(ok.body).slice(0, 300)}`).toBe(201);
      expect((await std(request, fd, st.res.id, st.room.id)).latestCheck?.totalVnd).toBe(
        BIA.salePriceVnd,
      );
    });
  },
);
