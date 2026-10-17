// E2E LIỀN MẠCH A4 – sự cố buồng (Sprint 4: T4, cổng G4; s4-test-plan mục 5.3 "A4 liền mạch"). Một ca, một chuỗi;
// MỌI bước ghi bấm thật trên giao diện tới API thật (PWA nhân viên cỡ điện thoại + Desk Chromium 1366×768). KHÔNG
// test.fail giữa chuỗi. Project desk-clock (MutableClock, tuần tự sau clock).
//   1. PWA H21 (bảo trì `qa.mt`): báo sự cố căn trống + "Khóa căn" tới ngày dự kiến sửa xong → phiếu + khối OOO.
//   2. Desk S11 (lễ tân): thấy phiếu và khối khóa; H12 tìm căn trống không còn căn đó (chặn bán); API: căn `OOO`.
//   3. PWA H22 (bảo trì): Nhận việc → Sửa xong (ghi đã làm gì) → khối kết thúc, căn `VD` + việc "Dọn sau sửa chữa".
//   4. PWA (buồng phòng): Bắt đầu dọn → Dọn xong (`VC`); PWA (lễ tân trưởng): Kiểm phòng → `VI`.
//   5. Bán lại được: H12 tìm căn trống có lại căn; đơn mới đêm đó tạo được.
// TC: product/tests/test-cases/r1-main-flows.md – TC-X-072.
import { expect, test } from '@playwright/test';
import { session, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, STAFF_URL, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  createReservation,
  isRoomFree,
  newGuest,
  reservationBody,
  s2Context,
  track,
  vnTime,
  type Room,
} from '../support/s2.js';
import {
  PNG_16X16,
  cleanRooms,
  needCleanRooms,
  readyRooms,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { desk, pwaCleanInspect, roomStatusOf, staffApp } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { photo, recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;

let realToday = '';
test.describe.configure({ mode: 'default' });
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'E2E liền mạch A4 – sự cố buồng: PWA báo sự cố + khóa căn → Desk thấy phiếu, chặn bán → PWA sửa xong → dọn, kiểm → VI → bán lại',
  { tag: ['@ui', '@sprint4', '@clock', '@write', '@flow'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-X-072 (E) A4 US-061/US-062/US-053/US-055: PWA H21 báo sự cố + khóa căn → Desk S11 thấy phiếu + khối OOO, H12 không bán căn → PWA H22 sửa xong → VD + "Dọn sau sửa chữa" → PWA dọn, kiểm → VI → bán lại được', async ({
      browser,
      request,
    }) => {
      test.slow();
      test.setTimeout(4 * 60_000);
      needClock('TC-X-072');
      needCleanRooms('TC-X-072');
      // ngày ảo D (giữ D…D+5): căn trống, sạch, chưa có đơn D…D+3
      const D = virtualDay(realToday, 5);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '09:00')));
      cleanRooms();
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      let rm: Room | undefined;
      for (const r of await readyRooms(request, fd, c.rooms)) {
        if (await isRoomFree(request, fd, r, D, addDays(D, 3))) {
          rm = r;
          break;
        }
      }
      expect(rm, `có căn sạch, trống ${D} → ${addDays(D, 3)}`).toBeTruthy();
      const room = rm!;
      const reopen = addDays(D, 2);

      // ── 1. PWA H21 (bảo trì): báo sự cố + khóa căn ──
      const mt = await staffApp(browser, request, 'qa.mt', vnTime(D, '09:00'));
      const creates = recordWrites(mt, 'POST', /\/work-orders$/);
      await mt.goto(`${STAFF_URL}/#/report`);
      await mt.locator('#wo-room').selectOption(room.id);
      await mt.getByRole('button', { name: t('hk.wo.k.broken'), exact: true }).click();
      await mt.locator('#wo-desc').fill('Voi sen phong tam ro nuoc, can thay bo tron');
      await mt.getByRole('checkbox', { name: t('hk.lock_request') }).check();
      await mt.locator('#wo-block-done').fill(reopen);
      await mt.getByRole('button', { name: t('wo.create_and_block') }).click();
      const cw = await waitWrite(creates, 'createWorkOrder kèm khóa căn', 201);
      expect(cw.request).toMatchObject({
        roomId: room.id,
        category: 'broken_item',
        severity: 'medium',
        block: { startDate: D, expectedDoneDate: reopen },
      });
      const wo = JSON.parse(cw.body) as { id: string; code: string; status: string };
      await expect(mt.getByText(t('hk.lock_done'))).toBeVisible({ timeout: 10_000 });
      await mt.context().close();
      await expect.poll(() => roomStatusOf(request, room.id), { message: 'căn khóa' }).toBe('OOO');
      expect(await isRoomFree(request, fd, room, D, addDays(D, 1)), 'tồn phòng: căn bị khóa').toBe(
        false,
      );

      // ── 2. Desk S11 (lễ tân): phiếu + khối khóa; H12: căn không còn trong danh sách trống ──
      const fdp = await desk(browser, 'qa.fd', vnTime(D, '09:10'));
      await fdp.goto(`${WEB_URL}/maintenance`);
      await expect(fdp.getByRole('row').filter({ hasText: wo.code })).toBeVisible({
        timeout: 15_000,
      });
      await fdp.getByRole('button', { name: t('wo.tab.blocks'), exact: true }).click();
      await expect(
        fdp.getByRole('row').filter({ hasText: wo.code }),
        'khối khóa gắn phiếu sửa',
      ).toBeVisible({ timeout: 15_000 });
      const freeList = async () => {
        await fdp.goto(`${WEB_URL}/quotes`);
        await fdp.getByLabel(t('sale.arrival')).fill(D);
        await fdp.getByLabel(t('sale.nights')).fill('1');
        await fdp.getByRole('button', { name: t('shell.search_label') }).click();
        // dòng "{n} căn trống …" (sale.avail_count) hiện khi có kết quả tìm
        const availText = t('sale.avail_count').split('}')[1]!.split('{')[0]!.trim();
        await expect(fdp.getByRole('status').filter({ hasText: availText })).toBeVisible({
          timeout: 15_000,
        });
        return fdp.locator('.roomno').allInnerTexts();
      };
      expect(await freeList(), `H12 không bán căn ${room.roomNo} đêm ${D}`).not.toContain(
        room.roomNo,
      );
      await fdp.context().close();

      // ── 3. PWA H22 (bảo trì): Nhận việc → Sửa xong ──
      await setClock(request, vnTime(D, '15:00'));
      const mt2 = await staffApp(browser, request, 'qa.mt', vnTime(D, '15:00'));
      const acts = recordWrites(mt2, 'POST', /\/work-orders\/[^/]+\/actions\/[a-z-]+$/);
      await mt2.goto(`${STAFF_URL}/#/wo/${wo.id}`);
      await mt2.getByRole('button', { name: t('wo.action.start'), exact: true }).click();
      const acc = await waitWrite(acts, 'transitionWorkOrder accept', 200);
      expect(acc.path).toMatch(/\/actions\/accept$/);
      await mt2.getByRole('button', { name: t('wo.action.done'), exact: true }).click();
      await mt2.locator('#wo-result').fill('Da thay bo voi sen moi, thu nuoc 10 phut khong ro');
      // mức trung bình/cao: bắt buộc ít nhất 1 ảnh sau khi sửa (DONE_PHOTO_REQUIRED)
      await mt2
        .locator('input[type="file"]')
        .first()
        .setInputFiles(photo(PNG_16X16, 'sau-khi-sua.png'));
      await mt2.getByRole('button', { name: t('wo.done_confirm') }).click();
      const done = await waitWrite(acts, 'transitionWorkOrder complete', 200, (s) =>
        s.path.endsWith('/actions/complete'),
      );
      expect((done.request as Json).resultNote).toBeTruthy();
      await mt2.context().close();
      await expect
        .poll(() => roomStatusOf(request, room.id), { message: 'sửa xong → cần dọn' })
        .toBe('VD');

      // ── 4. PWA: buồng phòng dọn (việc "Dọn sau sửa chữa"), lễ tân trưởng kiểm → VI ──
      await pwaCleanInspect(browser, request, room, D, {
        taskName: t('hk.type.after_repair_clean'),
        cleanAt: '15:30',
        inspectAt: '16:00',
      });

      // ── 5. Bán lại được: H12 có lại căn; đơn mới đêm D tạo được ──
      const fdp2 = await desk(browser, 'qa.fd', vnTime(D, '16:10'));
      await fdp2.goto(`${WEB_URL}/quotes`);
      await fdp2.getByLabel(t('sale.arrival')).fill(D);
      await fdp2.getByLabel(t('sale.nights')).fill('1');
      await fdp2.getByRole('button', { name: t('shell.search_label') }).click();
      await expect(
        fdp2.locator('.roomno', { hasText: new RegExp(`^${room.roomNo}$`) }),
        `H12 bán lại căn ${room.roomNo} đêm ${D}`,
      ).toBeVisible({ timeout: 15_000 });
      await fdp2.context().close();
      const fd2 = await session(request, 'qa.fd');
      const again = await createReservation(
        request,
        fd2,
        reservationBody(c, {
          room,
          arrival: D,
          departure: addDays(D, 1),
          guestId: await newGuest(request, fd2),
        }),
      );
      expect(again.status, `đơn mới trên căn vừa mở bán: ${JSON.stringify(again.body)}`).toBe(201);
      track('reservation', again.body.id);
    });
  },
);
