// E2E UI vòng sửa 5 (BR-417 phụ lục 5A, ARC 16.17/16.18; BE-A `s4-be-a.md` mục 17, BE-B mục 17, FE-A đợt 16):
// - TC-L4-134: H09 đơn thỏa thuận – sửa đúng một đêm ở giữa → B1 gửi `edited` từng đêm; khi gia hạn, đêm tham chiếu là
//   đêm đã sửa (AN-23/AN-24 – "đêm nhập tay gần nhất", đêm lịch không làm tham chiếu).
// - TC-L4-135: đua B18 ‖ HK bấm xong việc bổ sung tủ căn cũ → folio ghi đúng một lần; Desk tự gửi lại một lần cùng
//   Idempotency-Key khi gặp 409 CONCURRENT_UPDATE (ARC 16.17 bổ sung (af)). HK xong việc thật trên máy chủ; 409 của
//   bên thua được trả ở tầng mạng (cuộc đua khóa không tái tạo ổn định từ trình duyệt).
// - TC-L4-136: H16 bước 2 nhập giá đêm thêm ngoài `extraNightFloorVnd`–`extraNightCeilingVnd` → lỗi ngay ở ô, khóa
//   "Tiếp tục: Bill & thu tiền".
// Project desk-clock (MutableClock, tuần tự).
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD } from '../support/env.js';
import { precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  room,
  s2Context,
  track,
  vnTime,
  type ProblemFields,
  type Room,
} from '../support/s2.js';
import {
  EP3,
  addDocument,
  checkIn,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  p3,
  payBalance,
  registrationOf,
  stayAction,
  useVirtualDevice,
  virtualDay,
  vnDoc,
  type Stay,
} from '../support/s3.js';
import { checkoutSummary, minibarItem } from '../support/s3-stay.js';
import { desk, openCheckOut } from '../ui/flows.js';
import { UI, fakePhone, fillBooking, lettersOnly, openRack, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();
const ddmm = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
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

/** Lần đếm `checkout` của tủ `roomId` (đủ món của tủ, `used` theo mã DS-E). */
async function countFridge(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  roomId: string,
  used: Record<string, number>,
): Promise<void> {
  const std = await call<{
    items: Array<{ itemId: string; itemName: string; standardQty: number }>;
  }>(request, 'GET', p3(EP3.getMinibarStandard, s, { reservationId }), {
    session: s,
    query: { roomId },
  });
  expect(std.status).toBe(200);
  const lines = std.body.items.map((i) => {
    const code = Object.keys(used).find((c) => minibarItem(c).name === i.itemName);
    return { itemId: i.itemId, remainingQty: i.standardQty - (code ? used[code]! : 0) };
  });
  const r = await call(request, 'POST', p3(EP3.recordMinibarCheck, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    body: { mode: 'checkout', roomId, lines },
  });
  expect(r.status, `recordMinibarCheck: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(201);
}

/** Căn đích B14 phải sạch: dọn bằng API buồng phòng nếu đang VD/CL (như ma trận minibar). */
async function makeReady(
  request: APIRequestContext,
  s: StaffSession,
  rm: Room,
  day: string,
): Promise<void> {
  const st = await call<{ data: Array<{ roomId: string; status: string }> }>(
    request,
    'GET',
    p3(EP3.listRoomStatuses, s),
    { session: s },
  );
  const cur = st.body.data.find((x) => x.roomId === rm.id)?.status ?? 'VC';
  const step = async (event: string, expectedFrom: string, hhmm: string) => {
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
  if (cur === 'VD') await step('start_cleaning', 'VD', '10:00');
  if (cur === 'VD' || cur === 'CL') await step('finish_cleaning', 'CL', '10:01');
}

test.describe(
  'UI vòng sửa 5 – giá đêm thêm theo bảng AN, đua B18 ‖ HK, khoảng giá đêm thêm',
  { tag: ['@ui', '@sprint4', '@clock', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L4-134 (E) BR-417 phụ lục 5A (AN-23/AN-24), ARC 16.18 bổ sung: H09 đơn 3 đêm, lễ tân sửa đúng đêm GIỮA thành 650.000 → B1 gửi `edited` chỉ ở đêm giữa; nhận phòng rồi gia hạn: giá gợi ý đêm thêm = 650.000 (đêm nhập tay gần nhất), `currentBookingRateVnd` 650.000', async ({
      browser,
      request,
    }) => {
      needClock('TC-L4-134');
      const D = virtualDay(realToday, 4);
      await at(request, D, '10:00');
      cleanRooms();
      const page = await desk(browser, 'qa.fd', vnTime(D, '10:00'));
      const guest = `Khach Anbang ${lettersOnly()}`;
      let resId = '';
      try {
        const creates = recordWrites(page, 'POST', /\/reservations$/);
        expect(await openRack(page), 'màn Sơ đồ phòng').toBe(true);
        await fillBooking(page, {
          roomNo: '202',
          arrival: D,
          departure: addDays(D, 3),
          guest,
          phone: fakePhone(),
        });
        const dlg = page.getByRole('dialog', { name: t('booking.new.title') });
        const mid = dlg.getByRole('textbox', {
          name: `${t('rate.pre_tier')} ${ddmm(addDays(D, 1))}`,
        });
        await expect(mid).toBeVisible({ timeout: 15_000 });
        await mid.fill('650000');
        await dlg.getByRole('button', { name: t('booking.create'), exact: true }).click();
        const w = await waitWrite(creates, 'createReservation (B1)', 201);
        const nights = (w.request?.nightlyRates ?? []) as Array<{
          date: string;
          amountVnd: number;
          edited?: boolean;
        }>;
        expect(
          nights.map((n) => n.date),
          'đủ 3 đêm',
        ).toEqual([D, addDays(D, 1), addDays(D, 2)]);
        expect(
          nights.map((n) => !!n.edited),
          'chỉ đêm giữa là đêm đã sửa',
        ).toEqual([false, true, false]);
        expect(nights[1]!.amountVnd).toBe(650000);
        // phép thử có nghĩa: đêm cuối (gần nhất) theo giá mặc định, khác 650.000
        expect(nights[2]!.amountVnd, 'đêm cuối giữ giá mặc định').not.toBe(650000);
        resId = String((JSON.parse(w.body) as Json).id);
        track('reservation', resId);
      } finally {
        await page.context().close();
      }
      // nhận phòng 14:00: thu đủ + giấy tờ người đứng tên (đơn tạo trên H09 chưa có), rồi xem giá gợi ý gia hạn (B13)
      await at(request, D, '14:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const made = await getReservation(request, fd, resId);
      if (made.body.folioId) await payBalance(request, fd, made.body.folioId);
      const regId = await registrationOf(request, fd, { id: resId });
      const doc = await addDocument(request, fd, regId, vnDoc(guest));
      expect(doc.status, `addGuestDocument: ${JSON.stringify(doc.body).slice(0, 200)}`).toBe(201);
      const ci = await checkIn(request, fd, resId);
      expect(ci.status, `checkIn: ${JSON.stringify(ci.body).slice(0, 200)}`).toBe(200);
      const o = await call<{
        nights?: Array<{ date: string; defaultRateVnd?: number }>;
        currentBookingRateVnd?: number | null;
      }>(request, 'GET', p3(EP3.getExtensionOptions, fd, { reservationId: resId }), {
        session: fd,
        query: { nights: '1' },
      });
      expect(o.status, JSON.stringify(o.body).slice(0, 300)).toBe(200);
      expect(o.body.nights?.[0]?.date).toBe(addDays(D, 3));
      expect(o.body.nights?.[0]?.defaultRateVnd, 'đêm tham chiếu = đêm giữa đã sửa (650.000)').toBe(
        650000,
      );
      expect(o.body.currentBookingRateVnd, 'giá từ thỏa thuận → có giá').toBe(650000);
    });

    test('TC-L4-135 (E) ARC 16.17 bổ sung (af): đua B18 ‖ HK bấm xong việc bổ sung tủ căn cũ – B18 thành công đúng một lần (folio minibar 70.000, một khoản thu), mọi lần gửi B18 cùng một Idempotency-Key; gặp 409 CONCURRENT_UPDATE thì Desk tự gửi lại một lần', async ({
      browser,
      request,
    }) => {
      needClock('TC-L4-135');
      const { D, st, oldRoom, t1 } = await precondition(
        'khách ở 2 đêm; D+1 B14 sự cố sang căn cùng nhóm, đếm tủ căn cũ 2 bia → việc bổ sung T1 mở',
        async () => {
          const D = virtualDay(realToday, 3);
          await at(request, D, '14:00');
          cleanRooms();
          const c = await s2Context(request);
          const fd0 = await sessionOrSkip(request, 'qa.fd');
          const st: Stay = await inHouse(request, c, fd0, {
            room: room(c, '202'),
            alternatives: c.rooms,
            arrival: D,
            nights: 2,
          });
          const to = c.rooms.find(
            (r) => r.id !== st.room.id && r.roomGroupId && r.roomGroupId === st.room.roomGroupId,
          )!;
          expect(to, 'căn cùng nhóm').toBeTruthy();
          const d1 = addDays(D, 1);
          await at(request, d1, '10:00');
          const fd = await sessionOrSkip(request, 'qa.fd');
          await makeReady(request, fd, to, d1);
          const base = {
            newRoomId: to.id,
            effectiveDate: d1,
            cause: 'property_fault',
            reason: 'Binh nong lanh hong',
          };
          const pv = await stayAction<Json & ProblemFields>(
            request,
            fd,
            st.res.id,
            'change-room',
            base,
            { dryRun: true },
          );
          expect(pv.status).toBe(200);
          const delta = Number(pv.body.folioDeltaVnd ?? 0);
          const mv = await stayAction<Json & ProblemFields>(request, fd, st.res.id, 'change-room', {
            ...base,
            ...(delta !== 0 ? { applyDifference: true, expectedDeltaVnd: delta } : {}),
          });
          expect(mv.status, JSON.stringify(mv.body).slice(0, 200)).toBe(200);
          await countFridge(request, fd, st.res.id, st.room.id, { bia: 2 });
          const hk = await sessionOrSkip(request, 'qa.hk');
          const tasks = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
            session: hk,
            query: { date: d1 },
          });
          const t1 = tasks.body.data.find(
            (x) =>
              x.type === 'minibar_refill' &&
              x.roomId === st.room.id &&
              x.reservationId === st.res.id,
          );
          expect(t1, 'việc bổ sung tủ căn cũ').toBeTruthy();
          return { D, st, oldRoom: st.room, t1: String(t1!.id) };
        },
      );
      const d2 = addDays(D, 2);
      await at(request, d2, '09:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const hk = await sessionOrSkip(request, 'qa.hk');
      const hkDone = async (): Promise<number[]> => {
        const out: number[] = [];
        for (const [action, hhmm] of [
          ['start', '09:00'],
          ['complete', '09:01'],
        ] as const) {
          const r = await call(
            request,
            'POST',
            `/v1/properties/${propertyIdOf(hk)}/hk-tasks/${t1}/actions/${action}`,
            {
              session: hk,
              idempotencyKey: true,
              body: { performedAt: vnTime(d2, hhmm) },
            },
          );
          out.push(r.status);
        }
        return out;
      };
      // các khoản đã thu khi nhận phòng (tiền phòng) không thuộc phép đo của B18
      const paidBefore = new Set(
        ((await getFolio(request, fd, st.res.folioId!)).payments ?? []).map((p) => p.id),
      );
      const page: Page = await desk(browser, 'qa.fd', vnTime(d2, '09:00'));
      const keys: string[] = [];
      const statuses: number[] = [];
      let hkPromise: Promise<number[]> | null = null;
      try {
        page.on('request', (r) => {
          if (r.method() === 'POST' && /\/actions\/check-out$/.test(new URL(r.url()).pathname))
            keys.push(r.headers()['idempotency-key'] ?? '');
        });
        page.on('response', (r) => {
          if (
            r.request().method() === 'POST' &&
            /\/actions\/check-out$/.test(new URL(r.url()).pathname)
          )
            statuses.push(r.status());
        });
        // Bên thua cuộc đua: lần gửi B18 đầu tiên đến đúng lúc HK bấm "xong" T1 (khóa việc → khóa tủ, ARC 16.16) –
        // máy chủ trả 409 CONCURRENT_UPDATE và hoàn tác (khóa Idempotency-Key không giữ lại). Từ trình duyệt không
        // tạo được cuộc đua khóa một cách ổn định → HK xong việc thật trên máy chủ, còn 409 của lần đầu được trả ở
        // tầng mạng (route.fulfill, đúng dạng problem của máy chủ); lần gửi lại đi thẳng tới máy chủ.
        let injected = false;
        await page.route(/\/actions\/check-out$/, async (route) => {
          if (route.request().method() !== 'POST' || injected) return route.continue();
          injected = true;
          hkPromise = hkDone();
          await hkPromise;
          await route.fulfill({
            status: 409,
            contentType: 'application/problem+json',
            headers: { 'Retry-After': '1' },
            body: JSON.stringify({
              type: '/problems/concurrent-update',
              title: 'Concurrent update',
              status: 409,
              code: 'CONCURRENT_UPDATE',
            }),
          });
        });
        await openCheckOut(page, st.res.id);
        await expect(page.getByRole('table', { name: t('checkout.step.minibar') })).toBeVisible({
          timeout: 15_000,
        });
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        await page.getByRole('button', { name: t('co.go_bill') }).click();
        await expect(page.getByText(t('bill.total')).first()).toBeVisible({ timeout: 15_000 });
        await page
          .getByRole('button', { name: t('pay.cash') })
          .first()
          .click();
        const cashIn = page.getByLabel(t('co.cash_received')).first();
        if (await cashIn.isVisible().catch(() => false))
          await cashIn.fill(String(2 * BIA.salePriceVnd));
        await page
          .getByRole('button', { name: new RegExp(esc(stem('pay.record'))) })
          .first()
          .click();
        await expect
          .poll(async () => (await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd, {
            timeout: 10_000,
          })
          .toBe(0);
        await page
          .getByRole('button', { name: /hoàn tất/i })
          .last()
          .click();
        const dialog = page.getByRole('alertdialog');
        await expect(dialog).toBeVisible();
        await dialog
          .getByRole('button', { name: /hoàn tất|Trả phòng/i })
          .last()
          .click();
        await expect(page.getByText(new RegExp(esc(stem('checkout.done')))).first()).toBeVisible({
          timeout: 20_000,
        });
      } finally {
        await page.context().close();
      }
      const hkRes = hkPromise ? await hkPromise : [];
      test.info().annotations.push({
        type: 'race',
        description: `B18: ${statuses.join(' → ')}; HK start/complete: ${hkRes.join('/')}`,
      });
      expect(hkRes, 'HK bắt đầu + xong T1 (thắng cuộc đua)').toEqual([200, 200]);
      expect(keys.length, 'Desk tự gửi lại đúng một lần').toBe(2);
      expect(new Set(keys).size, 'lần gửi lại cùng Idempotency-Key').toBe(1);
      expect(statuses, '409 rồi 200').toEqual([409, 200]);
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('checked_out');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.status).toBe('settled');
      expect(
        liveLines(f, 'minibar').reduce((a, l) => a + l.amountVnd, 0),
        'minibar ghi đúng một lần',
      ).toBe(2 * BIA.salePriceVnd);
      const cash = (f.payments ?? []).filter(
        (p) =>
          !paidBefore.has(p.id) &&
          p.method === 'cash' &&
          p.type === 'charge' &&
          p.status === 'succeeded',
      );
      expect(
        cash.map((p) => p.amountVnd),
        'một khoản thu tiền mặt ở B18',
      ).toEqual([2 * BIA.salePriceVnd]);
      console.log(
        `[TC-L4-135] B18: ${statuses.join(' → ')}; HK start/complete: ${hkRes.join('/')}`,
      );
      expect(oldRoom.id).toBeTruthy();
    });

    test('TC-L4-136 (E) FE-A đợt 16 / BE-A 17.4: H16 rời 19:00 (đêm thêm còn bán) – bước 2 nhập giá đêm thêm ngoài `extraNightFloorVnd`–`extraNightCeilingVnd` → lỗi ngay ở ô "Giá đêm thêm", "Tiếp tục: Bill & thu tiền" khóa; sửa về trong khoảng → hết lỗi', async ({
      browser,
      request,
    }) => {
      needClock('TC-L4-136');
      const { D, st } = await precondition(
        'khách ở 1 đêm, ngày đi 19:00, căn không có khách đến',
        async () => {
          const D = virtualDay(realToday, 2);
          await at(request, D, '14:00');
          cleanRooms();
          const c = await s2Context(request);
          const st = await inHouse(request, c, await sessionOrSkip(request, 'qa.fd'), {
            room: room(c, '202'),
            alternatives: c.rooms,
            arrival: D,
            nights: 1,
          });
          return { D, st };
        },
      );
      const day = addDays(D, 1);
      await at(request, day, '19:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const s = await checkoutSummary(request, fd, st.res.id, { checkoutTime: '19:00' });
      const b = s.body as unknown as Json;
      expect(b.extraNightRequired, 'rời sau mốc → cần đêm thêm').toBe(true);
      const floor = Number(b.extraNightFloorVnd);
      const ceiling = Number(b.extraNightCeilingVnd);
      expect(floor, 'extraNightFloorVnd').toBeGreaterThan(0);
      expect(ceiling, 'extraNightCeilingVnd').toBeGreaterThan(floor);
      const page = await desk(browser, 'qa.fd', vnTime(day, '19:00'));
      try {
        await openCheckOut(page, st.res.id);
        await expect(page.getByRole('table', { name: t('checkout.step.minibar') })).toBeVisible({
          timeout: 15_000,
        });
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        const rate = page.getByLabel(new RegExp(`^${esc(t('checkout.extra_night_rate_label'))}`));
        await expect(rate).toBeVisible({ timeout: 10_000 });
        const err = page.getByText(new RegExp(esc(stem('field_error.value_out_of_range'))));
        const go = page.getByRole('button', { name: t('co.go_bill') });
        await rate.fill(String(floor - 1000));
        await expect(err.first(), 'dưới sàn → lỗi ở ô').toBeVisible();
        await expect(go).toHaveAttribute('aria-disabled', 'true');
        await rate.fill(String(ceiling + 1000));
        await expect(err.first(), 'trên trần → lỗi ở ô').toBeVisible();
        await rate.fill(String(floor));
        await expect(err, 'trong khoảng → hết lỗi').toHaveCount(0);
      } finally {
        await page.context().close();
      }
    });
  },
);
