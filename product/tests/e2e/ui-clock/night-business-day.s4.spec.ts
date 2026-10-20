// K2' cổng QC Sprint 4 – giờ đêm 00:00–05:59: ngày kinh doanh (BR-010, đổi ngày 06:00) còn là hôm trước.
// T9 theo lịch 39312874062 chạy 02:40 giờ VN và đỏ TC-X-074 (BUG-R2-211: PWA gửi `listHkTasks` theo ngày lịch → 422).
// Ca chạy theo giờ thật chỉ bắt được lỗi khi lượt CI rơi vào giờ đêm, nên ở đây đặt hẳn đồng hồ stack + trình duyệt.
// Project desk-clock (MutableClock, tuần tự); mỗi ca một ngày ảo riêng (thứ Hai–Tư, không ngày đặc biệt).
// - TC-X-088: PWA buồng phòng (qa.hk) lúc 02:40, 05:59 (biên trước đổi ngày) và 06:00: Việc của tôi, Các căn, một căn
//   tải được, mọi `GET hk-tasks` < 400 (BUG-R2-211).
// - TC-L2-109: Desk H09 lúc 02:40 – ngày đến mặc định = ngày kinh doanh D-1, đặt được D-1 → D, đúng 1 đêm (BUG-R2-213).
// - TC-L2-110: Desk H15 Đổi phòng lúc 02:40 – xem trước và ghi với `effectiveDate` = D-1, không 422 (BUG-R2-212).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, STAFF_URL, WEB_URL } from '../support/env.js';
import { addDays, cleanupTracked, room, s2Context, track, vnTime } from '../support/s2.js';
import { cleanRooms, inHouse, useVirtualDevice, virtualDay, type Stay } from '../support/s3.js';
import { desk, staffApp } from '../ui/flows.js';
import { UI, fakePhone, fillBooking, lettersOnly, openRack, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<string> {
  await useVirtualDevice(request, await setClock(request, vnTime(date, hhmm)));
  return vnTime(date, hhmm);
}

/** Khách ở từ D-1 (2 đêm), đã nhận phòng D-1 14:00 – lúc 02:40 ngày D vẫn là "đêm nay" của lượt ở. */
async function stayFromYesterday(
  request: APIRequestContext,
  D: string,
  roomNo: string,
): Promise<Stay> {
  await at(request, addDays(D, -1), '14:00');
  cleanRooms();
  const c = await s2Context(request);
  const fd = await sessionOrSkip(request, 'qa.fd');
  return inHouse(request, c, fd, {
    room: room(c, roomNo),
    alternatives: c.rooms,
    arrival: addDays(D, -1),
    nights: 2,
  });
}

test.describe(
  "K2' – giờ đêm trước 06:00: ngày kinh doanh trên PWA và Desk (BUG-R2-211, 212, 213)",
  { tag: ['@ui', '@sprint4', '@clock'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-X-088 (E) US-052/AC1, US-053/AC1 BR-010 BUG-R2-211: PWA buồng phòng lúc 02:40, 05:59 và 06:00 – "Việc của tôi", "Các căn" (10 căn) và một căn tải được, không có câu "Chưa tải được…", mọi GET hk-tasks < 400', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-088');
      const D = virtualDay(realToday, 3);
      const st = await stayFromYesterday(request, D, '201');
      for (const hhmm of ['02:40', '05:59', '06:00']) {
        await test.step(`PWA qa.hk lúc ${hhmm} ngày ${D}`, async () => {
          const now = await at(request, D, hhmm);
          const hk = await staffApp(browser, request, 'qa.hk', now);
          try {
            const reads = recordWrites(hk, 'GET', /\/hk-tasks$/);
            await hk.goto(`${STAFF_URL}/#/tasks`);
            await expect(hk.getByRole('heading', { name: t('nav.my_tasks') }).first()).toBeVisible({
              timeout: 20_000,
            });
            await expect
              .poll(() => reads.length, { message: `${hhmm}: đã đọc hk-tasks`, timeout: 15_000 })
              .toBeGreaterThan(0);
            await expect(hk.getByText(t('hk.error_title'))).toHaveCount(0);
            await hk.goto(`${STAFF_URL}/#/rooms`);
            const rooms = hk.getByRole('link', { name: /^Căn \d{3}/ });
            await expect(rooms.first(), `${hhmm}: Các căn tải được`).toBeVisible({
              timeout: 20_000,
            });
            expect(await rooms.count(), '10 căn').toBe(10);
            await expect(hk.getByText(t('hk.rooms_error_title'))).toHaveCount(0);
            await hk.goto(`${STAFF_URL}/#/room/${st.room.id}`);
            await expect(
              hk.getByRole('link', { name: new RegExp(esc(t('hk.report_this_room'))) }),
              `${hhmm}: màn một căn`,
            ).toBeVisible({ timeout: 20_000 });
            await expect(hk.getByText(t('hk.rooms_error_title'))).toHaveCount(0);
            const bad = reads.filter((r) => r.status >= 400);
            expect(
              bad.map((r) => `${r.status} ${r.path}`),
              `${hhmm}: GET hk-tasks bị từ chối`,
            ).toEqual([]);
          } finally {
            await hk.context().close();
          }
        });
      }
    });

    test('TC-L2-109 (E) US-017/AC1 BR-010 BUG-R2-213: Desk H09 lúc 02:40 ngày D – ngày đến mặc định là ngày kinh doanh D-1; đặt D-1 → D được (không `past_date`), đơn 1 đêm D-1, không cộng thêm đêm', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L2-109');
      const D = virtualDay(realToday, 3);
      const now = await at(request, D, '02:40');
      cleanRooms();
      const page = await desk(browser, 'qa.fd', now);
      try {
        const creates = recordWrites(page, 'POST', /\/reservations$/);
        expect(await openRack(page), 'màn Sơ đồ phòng').toBe(true);
        await page
          .getByRole('button', { name: t('booking.new.title') })
          .first()
          .click();
        const dlg = page.getByRole('dialog', { name: t('booking.new.title') });
        await expect(
          dlg.getByRole('textbox', { name: 'Ngày đến' }),
          'ngày đến mặc định = ngày kinh doanh',
        ).toHaveValue(addDays(D, -1), { timeout: 15_000 });
        await page.keyboard.press('Escape');
        await expect(dlg).toBeHidden({ timeout: 10_000 });
        await fillBooking(page, {
          roomNo: '102',
          arrival: addDays(D, -1),
          departure: D,
          guest: `Khach Dem ${lettersOnly()}`,
          phone: fakePhone(),
        });
        await dlg.getByRole('button', { name: t('booking.create'), exact: true }).click();
        const w = await waitWrite(creates, 'createReservation D-1 → D lúc 02:40', 201);
        const body = JSON.parse(w.body) as Json;
        track('reservation', String(body.id));
        expect(w.request).toMatchObject({ arrivalDate: addDays(D, -1), departureDate: D });
        expect(body.arrivalDate).toBe(addDays(D, -1));
        expect(
          ((body.nightlyRates as Array<{ date: string }> | undefined) ?? []).map((n) => n.date),
          'đơn đã lưu: 1 đêm D-1, không cộng thêm đêm',
        ).toEqual([addDays(D, -1)]);
      } finally {
        await page.context().close();
      }
    });

    test('TC-L2-110 (E) US-024/AC2 BR-010 BUG-R2-212: Desk H15 Đổi phòng lúc 02:40 ngày D (khách ở từ D-1) – xem trước và ghi gửi `effectiveDate` = ngày kinh doanh D-1, không 422; căn mới nhận từ đêm D-1', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L2-110');
      const D = virtualDay(realToday, 3);
      const st = await stayFromYesterday(request, D, '202');
      const now = await at(request, D, '02:40');
      const page = await desk(browser, 'qa.fd', now);
      try {
        const moves = recordWrites(page, 'POST', /\/actions\/change-room$/);
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await expect(page.getByText(st.res.code).first()).toBeVisible({ timeout: 15_000 });
        await page
          .getByRole('button', { name: t('drawer.action.change_room'), exact: true })
          .click();
        const chg = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('stay.change_title'))}`),
        });
        await expect(chg).toBeVisible({ timeout: 10_000 });
        await chg.getByLabel(new RegExp(`^${esc(t('move.reason'))}`)).fill('Dieu hoa hong ban dem');
        const target = chg.getByRole('group', { name: t('stay.new_room') });
        const first = target.getByRole('radio').first();
        await expect(first, 'có căn trống từ đêm nay').toBeVisible({ timeout: 15_000 });
        await first.check();
        const pre = await waitWrite(moves, 'xem trước đổi phòng lúc 02:40', 200, (x) =>
          JSON.stringify(x.request).includes('"dryRun":true'),
        );
        expect(pre.request).toMatchObject({ effectiveDate: addDays(D, -1) });
        await chg
          .getByRole('button', { name: new RegExp(`^${esc(stem('stay.change_submit'))}`) })
          .click();
        const w = await waitWrite(moves, 'ghi đổi phòng lúc 02:40', 200, (x) =>
          JSON.stringify(x.request).includes('"dryRun":false'),
        );
        expect(w.request).toMatchObject({ effectiveDate: addDays(D, -1) });
        expect(
          moves.filter((x) => x.status >= 400).map((x) => `${x.status} ${x.body.slice(0, 200)}`),
        ).toEqual([]);
      } finally {
        await page.context().close();
      }
    });
  },
);
