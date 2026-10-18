// UXR walkthrough PWA (18/10) – hai bản sửa server cho app buồng phòng, kiểm qua HTTP thật trên ngày ảo (project "clock"):
// - TC-L4-144 – UXR P-04 (BE-B `s4-be-b.md` mục 22): việc bổ sung minibar mang tên món (`refillItems[].itemName`, tên
//   lưu lúc ghi việc) – PWA không còn hiện "1, 1".
// - TC-L6-059 – BR-614 (DOM 18/10, UXR P-33; rbac D01 "Tên + căn"; BE-C `s4-be-c.md` mục 18): `listRoomStatuses` của
//   buồng phòng chỉ có TÊN GỌI (khách VN = chữ cuối của họ tên; khách nước ngoài = chữ đầu trên giấy tờ NN đã gắn cho
//   người đặt, viết hoa chữ đầu); lễ tân giữ họ tên đầy đủ; bảo trì không có tên; căn ngoài phạm vi việc của HK không có tên.
// Mỗi ca dùng ngày ảo riêng (virtualDay).
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
  s2Context,
  vnTime,
  type ProblemFields,
  type Room,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  inHouse,
  makeStay,
  p3,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { checkOut, checkoutSummary, minibarItem } from '../support/s3-stay.js';

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

interface RoomStatusRow {
  roomId: string;
  roomNo: string;
  status: string;
  currentGuest?: string;
  nextArrival?: { date: string; guestDisplayName?: string };
}

async function roomStatuses(request: APIRequestContext, s: StaffSession): Promise<RoomStatusRow[]> {
  const r = await call<{ data: RoomStatusRow[] }>(request, 'GET', p3(EP3.listRoomStatuses, s), {
    session: s,
  });
  expect(r.status, `listRoomStatuses: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body.data;
}

/** Căn không có khách đang ở (theo lễ tân) – tránh căn còn khách ở quá ngày của ca trước (S4-03). */
async function freeRooms(request: APIRequestContext, c: S2Context, fd: StaffSession, n: number) {
  const busy = new Set(
    (await roomStatuses(request, fd)).filter((x) => x.currentGuest).map((x) => x.roomId),
  );
  const out: Room[] = c.rooms.filter((r) => !busy.has(r.id));
  expect(out.length, `cần ít nhất ${n} căn trống`).toBeGreaterThanOrEqual(n);
  return out;
}

/** Căn có việc trong danh sách hôm nay của `s` (gồm việc còn mở của ngày trước). */
async function hkTaskRooms(
  request: APIRequestContext,
  s: StaffSession,
  date: string,
): Promise<Set<string>> {
  const r = await call<{ data: Array<{ roomId: string }> }>(
    request,
    'GET',
    p3(EP3.listHkTasks, s),
    {
      session: s,
      query: { date },
    },
  );
  expect(r.status, `listHkTasks: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return new Set(r.body.data.map((t) => t.roomId));
}

async function addTask(
  request: APIRequestContext,
  s: StaffSession,
  roomId: string,
  dueDate: string,
): Promise<void> {
  const r = await call<Json>(request, 'POST', `/v1/properties/${propertyIdOf(s)}/hk-tasks`, {
    session: s,
    idempotencyKey: true,
    body: { roomId, type: 'adhoc_clean', dueDate, note: 'E2E BR-614 pham vi T' },
  });
  expect(r.status, `createHkTask: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(201);
}

interface Std {
  periodId?: string | null;
  items: Array<{ itemId: string; itemName: string; standardQty: number }>;
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

async function countFridge(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  roomId: string,
  used: Record<string, number>,
): Promise<ApiResult<Json & ProblemFields>> {
  const t = await std(request, s, reservationId, roomId);
  return call(request, 'POST', p3(EP3.recordMinibarCheck, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    body: {
      mode: 'checkout',
      roomId,
      periodId: t.periodId ?? null,
      lines: t.items.map((i) => {
        const code = Object.keys(used).find((k) => minibarItem(k).name === i.itemName);
        return { itemId: i.itemId, remainingQty: i.standardQty - (code ? used[code]! : 0) };
      }),
    },
  });
}

test.describe(
  'UXR walkthrough PWA – tên món việc bổ sung (P-04), tên gọi cho buồng phòng (BR-614)',
  { tag: ['@clock', '@sprint4'] },
  () => {
    test('TC-L4-144 (A) UXR P-04 BR-703-02: đếm ngày đi dùng 2 bia + 1 coca → B18 → việc `minibar_refill` của HK có `refillItems` mang `itemName` từng món (Bia Larue lon × 2, Coca-Cola lon × 1)', async ({
      request,
    }) => {
      needClock('TC-L4-144');
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const [rm] = await freeRooms(request, c, fd, 1);
      const st = await inHouse(request, c, fd, { room: rm!, arrival: D, nights: 1 });
      const d1 = addDays(D, 1);
      await at(request, d1, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd'); // phiên cũ hết hạn khi tua đồng hồ
      const n = await countFridge(request, fd, st.res.id, st.room.id, { bia: 2, coca: 1 });
      expect(n.status, `đếm ngày đi: ${JSON.stringify(n.body).slice(0, 300)}`).toBe(201);
      const sum = await checkoutSummary(request, fd, st.res.id, { checkoutTime: '09:00' });
      expect(sum.status, JSON.stringify(sum.body).slice(0, 200)).toBe(200);
      const due = Number(
        (sum.body as unknown as Json).amountDueAtCheckoutVnd ?? sum.body.balanceDueVnd,
      );
      const out = await checkOut(request, fd, st.res.id, {
        checkoutTime: '09:00',
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
      const hk = await sessionOrSkip(request, 'qa.hk');
      const r = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
        session: hk,
        query: { date: d1 },
      });
      expect(r.status, `listHkTasks: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
      const tasks = r.body.data.filter(
        (t) =>
          t.type === 'minibar_refill' && t.roomId === st.room.id && t.reservationId === st.res.id,
      );
      expect(tasks.length, 'một việc bổ sung minibar cho căn vừa trả').toBe(1);
      const items = (tasks[0]!.refillItems ?? []) as Array<{
        itemId: string;
        quantity: number;
        itemName?: string;
      }>;
      const shown = items.map((x) => `${x.itemName ?? '(không tên)'} × ${x.quantity}`).sort();
      expect(shown, 'mỗi món có tên (P-04)').toEqual(
        [`${minibarItem('bia').name} × 2`, `${minibarItem('coca').name} × 1`].sort(),
      );
    });

    test('TC-L6-059 (A) BR-614 UXR P-33 rbac D01: `listRoomStatuses` – HK (căn trong phạm vi việc) thấy tên gọi: khách VN "Nguyen Thi Xxxx" → "Xxxx", khách nước ngoài (hộ chiếu "DANIEL WEBER" gắn người đặt) → "Daniel", khách sắp đến → tên gọi; không có họ tên đầy đủ trong thân phản hồi; căn ngoài phạm vi không có tên; FD thấy họ tên đầy đủ; MT không có tên', async ({
      request,
    }) => {
      needClock('TC-L6-059');
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      // phạm vi T gồm cả việc còn mở của ngày trước (OF_DAY): căn "ngoài phạm vi" phải không có việc nào trong danh
      // sách của HK hôm nay
      const hk = await sessionOrSkip(request, 'qa.hk');
      const carried = await hkTaskRooms(request, hk, D);
      const free = await freeRooms(request, c, fd, 3);
      const rOut = free.find((r) => !carried.has(r.id));
      const [rVn, rNn, rNext] = free.filter((r) => r !== rOut);
      expect(rNext, 'cần 3 căn trống trong phạm vi').toBeTruthy();
      const vn = await inHouse(request, c, fd, { room: rVn!, arrival: D, nights: 2 });
      const nn = await inHouse(request, c, fd, {
        room: rNn!,
        arrival: D,
        nights: 2,
        doc: 'foreign',
      });
      const next = await makeStay(request, c, fd, { room: rNext!, arrival: addDays(D, 1) });
      const outside = rOut
        ? await inHouse(request, c, fd, { room: rOut, arrival: D, nights: 2 })
        : null;
      if (!rOut)
        test.info().annotations.push({
          type: 'note',
          description: 'mọi căn trống đều còn việc mở của ngày trước – bỏ phần "ngoài phạm vi T"',
        });
      // phạm vi T của HK hôm nay: việc chưa giao ở 3 căn đầu, căn thứ tư không có việc
      for (const r of [rVn!, rNn!, rNext!]) await addTask(request, fd, r.id, D);
      const lastWord = (n: string) => n.trim().split(/\s+/).at(-1)!;
      const byRoom = (rows: RoomStatusRow[], id: string) => rows.find((x) => x.roomId === id);

      const h = await roomStatuses(request, hk);
      expect
        .soft(byRoom(h, rVn!.id)?.currentGuest, 'HK: khách VN → chữ cuối')
        .toBe(lastWord(vn.guestName));
      expect
        .soft(byRoom(h, rNn!.id)?.currentGuest, 'HK: khách NN → chữ đầu trên hộ chiếu')
        .toBe('Daniel');
      expect
        .soft(byRoom(h, rNext!.id)?.nextArrival?.guestDisplayName, 'HK: khách sắp đến → tên gọi')
        .toBe(lastWord(next.guestName));
      if (rOut)
        expect
          .soft(byRoom(h, rOut.id)?.currentGuest, 'HK: căn ngoài phạm vi T → không tên')
          .toBe(undefined);
      const hText = JSON.stringify(h);
      for (const full of [vn.guestName, nn.guestName, next.guestName, outside?.guestName ?? ''])
        if (full) expect.soft(hText, `HK không thấy họ tên đầy đủ "${full}"`).not.toContain(full);

      const f = await roomStatuses(request, fd);
      expect.soft(byRoom(f, rVn!.id)?.currentGuest, 'FD: họ tên đầy đủ').toBe(vn.guestName);
      expect.soft(byRoom(f, rNn!.id)?.currentGuest, 'FD: họ tên đầy đủ').toBe(nn.guestName);
      expect
        .soft(byRoom(f, rNext!.id)?.nextArrival?.guestDisplayName, 'FD: họ tên đầy đủ')
        .toBe(next.guestName);

      const mt = await sessionOrSkip(request, 'qa.mt');
      const m = await roomStatuses(request, mt);
      for (const r of [rVn!, rNn!, rNext!, ...(rOut ? [rOut] : [])]) {
        const row = byRoom(m, r.id);
        expect.soft(row?.currentGuest, `MT ${r.roomNo}: không tên`).toBe(undefined);
        expect
          .soft(row?.nextArrival?.guestDisplayName, `MT ${r.roomNo}: không tên`)
          .toBe(undefined);
      }
    });
  },
);
