// UXR walkthrough PWA (18/10) – phần giao diện của P-04 và BR-614 trên PWA buồng phòng với API thật (project
// desk-clock, ngày ảo): thẻ việc bổ sung minibar ghi tên món (không còn "1, 1"); thẻ việc và thẻ căn ghi "Khách: <tên
// gọi>" sau số căn, không có họ tên đầy đủ. Phần API: `e2e/clock/uxr-p04-br614.s5.clock.spec.ts` (TC-L4-144, TC-L6-059).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, SESSION_COOKIE, STAFF_URL } from '../support/env.js';
import { addDays, cleanupTracked, s2Context, vnTime, type ProblemFields } from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  inHouse,
  p3,
  readyRooms,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { checkOut, checkoutSummary, minibarItem } from '../support/s3-stay.js';
import { scan } from '../ui/axe.js';
import { UI, t } from '../ui/helpers.js';

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

test.describe(
  'UXR walkthrough PWA – P-04 tên món, BR-614 tên gọi (PWA buồng phòng, API thật)',
  { tag: ['@ui', '@sprint4', '@clock'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-X-080 (E) UXR P-04 + BR-614 US-054/AC1, US-052/AC1: PWA 360×800 vai buồng phòng – thẻ việc bổ sung minibar "Bổ sung minibar: Bia Larue lon × 2, Coca-Cola lon × 1"; căn khách đang ở có việc hôm nay: thẻ việc và thẻ căn ghi "Khách: <tên gọi>" (không kèm số căn), không có họ tên đầy đủ + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-080');
      const D = virtualDay(realToday, 3);
      const d0 = addDays(D, -1);
      await at(request, d0, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const [rOut, rIn] = await readyRooms(request, fd, c.rooms);
      expect(rIn, 'hai căn sẵn sàng').toBeTruthy();
      const out = await inHouse(request, c, fd, { room: rOut!, arrival: d0, nights: 1 });
      const stayer = await inHouse(request, c, fd, { room: rIn!, arrival: d0, nights: 2 });
      // ngày D 09:00: khách căn 1 trả phòng, dùng 2 bia + 1 coca
      await at(request, D, '09:00');
      fd = await sessionOrSkip(request, 'qa.fd');
      const std = await call<{
        periodId?: string | null;
        items: Array<{ itemId: string; itemName: string; standardQty: number }>;
      }>(request, 'GET', p3(EP3.getMinibarStandard, fd, { reservationId: out.res.id }), {
        session: fd,
        query: { roomId: out.room.id },
      });
      expect(std.status, JSON.stringify(std.body).slice(0, 200)).toBe(200);
      const used: Record<string, number> = {
        [minibarItem('bia').name]: 2,
        [minibarItem('coca').name]: 1,
      };
      const n = await call<Json & ProblemFields>(
        request,
        'POST',
        p3(EP3.recordMinibarCheck, fd, { reservationId: out.res.id }),
        {
          session: fd,
          idempotencyKey: true,
          body: {
            mode: 'checkout',
            roomId: out.room.id,
            periodId: std.body.periodId ?? null,
            lines: std.body.items.map((i) => ({
              itemId: i.itemId,
              remainingQty: i.standardQty - (used[i.itemName] ?? 0),
            })),
          },
        },
      );
      expect(n.status, `đếm tủ: ${JSON.stringify(n.body).slice(0, 200)}`).toBe(201);
      const sum = await checkoutSummary(request, fd, out.res.id, { checkoutTime: '09:00' });
      const due = Number(
        (sum.body as unknown as Json).amountDueAtCheckoutVnd ?? sum.body.balanceDueVnd,
      );
      const b18 = await checkOut(request, fd, out.res.id, {
        checkoutTime: '09:00',
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(b18.status, `B18: ${JSON.stringify(b18.body).slice(0, 200)}`).toBe(200);
      // căn khách đang ở có việc hôm nay (phạm vi T của buồng phòng)
      const task = await call<Json>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(fd)}/hk-tasks`,
        {
          session: fd,
          idempotencyKey: true,
          body: { roomId: rIn!.id, type: 'adhoc_clean', dueDate: D, note: 'Thay khan tam' },
        },
      );
      expect(task.status, JSON.stringify(task.body).slice(0, 200)).toBe(201);
      // việc bổ sung minibar của lượt vừa trả (danh sách của HK có cả việc còn mở của ngày trước – định danh theo id)
      const hkS = await sessionOrSkip(request, 'qa.hk');
      const list = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hkS), {
        session: hkS,
        query: { date: D },
      });
      const refillTask = list.body.data.find(
        (x) => x.type === 'minibar_refill' && x.reservationId === out.res.id,
      );
      expect(refillTask, 'việc bổ sung minibar sau B18').toBeTruthy();
      const callName = stayer.guestName.trim().split(/\s+/).at(-1)!;
      const guestLabel = t('hk.guest_first_name').replace('{name}', callName);

      const ctx = await browser.newContext({
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh',
      });
      const hk = await ctx.newPage();
      try {
        await hk.clock.install({ time: new Date(vnTime(D, '09:30')) });
        await ctx.addCookies([
          {
            name: SESSION_COOKIE,
            value: hkS.token,
            url: STAFF_URL,
            httpOnly: true,
            sameSite: 'Lax',
          },
        ]);
        await hk.goto(`${STAFF_URL}/#/tasks`);
        const refill = hk.locator(`article[aria-labelledby="t-${String(refillTask!.id)}"]`);
        await expect(refill, 'thẻ việc bổ sung minibar của căn vừa trả').toBeVisible({
          timeout: 20_000,
        });
        await expect(refill).toContainText(t('hk.refill').split('{')[0]!);
        await expect(refill).toContainText(`${minibarItem('bia').name} × 2`);
        await expect(refill).toContainText(`${minibarItem('coca').name} × 1`);
        await expect(refill, 'không còn câu tạm "… món – xem tủ"').not.toContainText(
          t('hk.refill_unnamed').split('{n}')[1]!.trim(),
        );
        const mine = hk.locator(`article[aria-labelledby="t-${String(task.body.id)}"]`);
        await expect(mine, 'thẻ việc căn khách đang ở').toBeVisible({ timeout: 20_000 });
        await expect(mine, 'BR-614: "Khách: <tên gọi>"').toContainText(guestLabel);
        const body = await hk.locator('body').innerText();
        expect(body, 'BR-614: không có họ tên đầy đủ').not.toContain(stayer.guestName);
        // tên gọi đứng riêng ("Khách: Huy"), không kèm số căn ("Khách: Huy · 101" – kiểu cũ của server)
        await expect(
          mine.getByText(guestLabel, { exact: true }),
          'dòng "Khách: <tên gọi>" không kèm số căn',
        ).toBeVisible();
        await scan(hk, test.info(), 'H19-1-tasks-uxr-360');
        await hk.goto(`${STAFF_URL}/#/rooms`);
        const card = hk.getByRole('link', { name: new RegExp(`^Căn ${rIn!.roomNo}`) });
        await expect(card).toBeVisible({ timeout: 20_000 });
        await expect(card, 'BR-614 thẻ căn: "Khách: <tên gọi>"').toContainText(guestLabel);
        expect(
          await hk.locator('body').innerText(),
          'thẻ căn không có họ tên đầy đủ',
        ).not.toContain(stayer.guestName);
      } finally {
        await ctx.close();
      }
    });
  },
);
