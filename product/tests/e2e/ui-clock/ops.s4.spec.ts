// E2E UI Sprint 4 – màn vận hành của FE-B trên Desk, BẤM THẬT tới API thật (s4-test-plan mục 5.3 – nối vào A4).
// Project desk-clock (MutableClock): mỗi ca một ngày ảo riêng, buồng sạch; dữ liệu không phải chủ đề dựng bằng API.
//   - S11 /maintenance (US-061, US-062, US-135): tạo phiếu thiếu mô tả không lưu; tạo phiếu + Khóa căn → toast
//     "khóa đêm …, mở bán lại từ …"; Nhận việc → Sửa xong → hộp hậu quả (focus nút an toàn) → căn VD + việc
//     "Dọn sau sửa chữa", khối kết thúc. Căn có khách đang ở → không khóa, "Tạo phiếu không khóa".
//   - S10 /housekeeping (US-054): tạo việc tay → bộ đếm "x/y xong"; "Làm xong" → bộ đếm tăng; hủy lý do "Khác" bắt
//     buộc ghi chú.
// Chuỗi liền mạch A4 ở `flow-a4.s4.spec.ts`. TC: r1-main-flows.md – TC-L6-040/043/045 (E), TC-L6-042 (E),
// TC-L6-022/033 (E).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, session, stackToday, type StaffSession } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  isRoomFree,
  s2Context,
  vnTime,
  type Room,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  PNG_16X16,
  cleanRooms,
  inHouse,
  needCleanRooms,
  p3,
  readyRooms,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { scan, settle } from '../ui/axe.js';
import { desk, roomStatusOf } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { dialogs, photo, recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

let realToday = '';
test.describe.configure({ mode: 'default' });
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

/** Ngày ảo D lúc hh:mm, buồng sạch; một căn sạch và trống D…D+3. */
async function dayWithFreeRoom(request: APIRequestContext, span: number, hhmm: string) {
  const D = virtualDay(realToday, span);
  await useVirtualDevice(request, await setClock(request, vnTime(D, hhmm)));
  cleanRooms();
  const c = await s2Context(request);
  const fd = await session(request, 'qa.fd');
  for (const r of await readyRooms(request, fd, c.rooms)) {
    if (await isRoomFree(request, fd, r, D, addDays(D, 3))) return { D, c, fd, room: r };
  }
  throw new Error(`không có căn sạch, trống ${D} → ${addDays(D, 3)}`);
}

async function hkTasks(request: APIRequestContext, s: StaffSession, date: string): Promise<Json[]> {
  const r = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, s), {
    session: s,
    query: { date },
  });
  expect(r.status, `listHkTasks: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body.data;
}

test.describe(
  'UI S11 /maintenance – phiếu sửa + khóa căn trên Desk (FE-B, US-061, US-062)',
  { tag: ['@ui', '@sprint4', '@clock', '@write'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L6-043 (E) + TC-L6-040 (E) + TC-L6-045 (E) US-061/AC1, AC4; US-062/AC1; US-135 S11: thiếu mô tả không lưu; tạo phiếu + Khóa căn → toast khóa/mở bán; Nhận việc → Sửa xong → hộp hậu quả (focus nút an toàn) → căn VD + "Dọn sau sửa chữa", khối kết thúc', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L6-040 (E)');
      needCleanRooms('TC-L6-040 (E)');
      const { D, room } = await dayWithFreeRoom(request, 5, '09:00');
      const reopenPlanned = addDays(D, 2);
      const page = await desk(browser, 'qa.fd', vnTime(D, '09:05'));
      const creates = recordWrites(page, 'POST', /\/work-orders$/);
      const acts = recordWrites(page, 'POST', /\/work-orders\/[^/]+\/actions\/[a-z-]+$/);
      await page.goto(`${WEB_URL}/maintenance`);
      await page.getByRole('button', { name: t('wo.new_title'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('wo.new_title') });
      await expect(dlg).toBeVisible();
      await dlg.getByLabel(t('hk.wo.room')).selectOption(room.id);
      await dlg.getByLabel(t('wo.title_label')).fill('Voi sen ro nuoc');
      await dlg.getByLabel(t('hk.wo.what')).selectOption('broken_item');
      // (TC-L6-043) thiếu mô tả → không tạo phiếu
      await dlg.getByRole('button', { name: t('wo.create'), exact: true }).click();
      await expect(dlg).toBeVisible();
      await page.waitForTimeout(500);
      expect(
        creates.filter((w) => w.status === 201),
        'thiếu mô tả: không có phiếu nào được tạo',
      ).toHaveLength(0);
      await dlg.getByLabel(t('hk.wo.desc')).fill('Voi sen phong tam ro nuoc lien tuc');
      await dlg.getByRole('checkbox', { name: t('hk.lock_request') }).check();
      await dlg.getByLabel(t('wo.block_done_planned')).fill(reopenPlanned);
      const reason = dlg.getByLabel(t('wo.block_reason'));
      if (!(await reason.inputValue())) await reason.fill('Sua voi sen');
      await settle(page);
      await scan(page, test.info(), 'S11-new-wo-block');
      await dlg.getByRole('button', { name: t('wo.create_and_block'), exact: true }).click();
      const cw = await waitWrite(creates, 'createWorkOrder kèm khóa căn', 201);
      expect(cw.request).toMatchObject({
        roomId: room.id,
        category: 'broken_item',
        block: { startDate: D, expectedDoneDate: reopenPlanned },
      });
      const wo = JSON.parse(cw.body) as { id: string; code: string; roomBlock?: Json };
      expect(wo.roomBlock, 'phiếu có khối khóa').toBeTruthy();
      await expect(page.getByText(tf('wo.created', { code: wo.code })).first()).toBeVisible();
      await expect.poll(() => roomStatusOf(request, room.id)).toBe('OOO');

      // (TC-L6-045) Nhận việc → Sửa xong → hộp hậu quả → xác nhận
      await page.getByRole('button', { name: wo.code, exact: true }).click();
      await page.getByRole('button', { name: t('wo.action.start'), exact: true }).click();
      await waitWrite(acts, 'transitionWorkOrder accept', 200, (s) => s.path.endsWith('/accept'));
      await page.getByRole('button', { name: t('wo.action.done'), exact: true }).click();
      const done = page.getByRole('dialog', { name: tf('wo.done_title', { code: wo.code }) });
      await done.getByLabel(t('wo.result')).fill('Da thay bo voi sen moi');
      const file = done.locator('input[type="file"]');
      if ((await file.count()) > 0)
        await file.first().setInputFiles(photo(PNG_16X16, 'sau-khi-sua.png'));
      await done.getByRole('button', { name: t('wo.done_confirm'), exact: true }).click();
      const sure = dialogs(page).filter({ hasText: t('wo.done_effects_title') });
      await expect(sure).toBeVisible();
      await expect(
        sure.getByRole('button', { name: t('confirm.keep') }),
        'US-135: focus nút an toàn',
      ).toBeFocused();
      await scan(page, test.info(), 'S11-done-confirm');
      await sure.getByRole('button', { name: t('wo.done_confirm'), exact: true }).click();
      const comp = await waitWrite(acts, 'transitionWorkOrder complete', 200, (s) =>
        s.path.endsWith('/complete'),
      );
      expect((comp.request as Json).resultNote).toBeTruthy();
      await expect(page.getByText(tf('wo.reopened', { room: room.roomNo })).first()).toBeVisible({
        timeout: 10_000,
      });
      await page.context().close();
      await expect.poll(() => roomStatusOf(request, room.id)).toBe('VD');
      const fd = await session(request, 'qa.fd');
      expect(await isRoomFree(request, fd, room, D, addDays(D, 1)), 'khối kết thúc – bán lại').toBe(
        true,
      );
      const tasks = await hkTasks(request, fd, D);
      expect(
        tasks.filter((x) => x.roomId === room.id && x.type === 'after_repair_clean'),
        'việc "Dọn sau sửa chữa"',
      ).toHaveLength(1);
    });

    test('TC-L6-042 (E) US-061/AC3 S11 căn có khách đang ở: tạo phiếu + Khóa căn → không khóa, báo "Căn đang có khách – chưa khóa được" → "Tạo phiếu không khóa" tạo phiếu không khối', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L6-042 (E)');
      needCleanRooms('TC-L6-042 (E)');
      const { D, c, fd, room } = await dayWithFreeRoom(request, 4, '14:00');
      const st = await inHouse(request, c as S2Context, fd, {
        room: room as Room,
        alternatives: c.rooms,
        arrival: D,
        nights: 2,
      });
      const occupied = st.room;
      const page = await desk(browser, 'qa.fd', vnTime(D, '14:10'));
      const creates = recordWrites(page, 'POST', /\/work-orders$/);
      await page.goto(`${WEB_URL}/maintenance`);
      await page.getByRole('button', { name: t('wo.new_title'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('wo.new_title') });
      await dlg.getByLabel(t('hk.wo.room')).selectOption(occupied.id);
      await dlg.getByLabel(t('wo.title_label')).fill('Dieu hoa keu to');
      await dlg.getByLabel(t('hk.wo.desc')).fill('Dieu hoa keu to ban dem, khach phan anh');
      await dlg.getByLabel(t('hk.wo.what')).selectOption('broken_item');
      await dlg.getByRole('checkbox', { name: t('hk.lock_request') }).check();
      await dlg.getByLabel(t('wo.block_done_planned')).fill(addDays(D, 1));
      const reason = dlg.getByLabel(t('wo.block_reason'));
      if (!(await reason.inputValue())) await reason.fill('Sua dieu hoa');
      await dlg.getByRole('button', { name: t('wo.create_and_block'), exact: true }).click();
      await waitWrite(creates, 'createWorkOrder kèm khóa – căn có khách', 409);
      await expect(dlg.getByText(t('wo.block_occupied_title'))).toBeVisible();
      await dlg.getByRole('button', { name: t('wo.create_without_block'), exact: true }).click();
      const ok = await waitWrite(
        creates,
        'createWorkOrder không khóa',
        201,
        (s) => s.status === 201,
      );
      expect(ok.request).not.toHaveProperty('block');
      expect((JSON.parse(ok.body) as Json).roomBlock ?? null).toBeNull();
      await page.context().close();
      expect(await roomStatusOf(request, occupied.id)).not.toBe('OOO');
    });
  },
);

test.describe(
  'UI S10 /housekeeping – việc buồng phòng trên Desk (FE-B, US-054)',
  { tag: ['@ui', '@sprint4', '@clock', '@write'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L6-022 (E) + TC-L6-033 (E) US-054/AC3 S10: tạo việc tay → bộ đếm tăng tổng; "Làm xong" → bộ đếm tăng số xong; hủy việc lý do "Khác" bắt buộc ghi chú', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L6-022 (E)');
      needCleanRooms('TC-L6-022 (E)');
      const { D, room } = await dayWithFreeRoom(request, 3, '09:00');
      const page = await desk(browser, 'qa.fd', vnTime(D, '09:10'));
      const writes = recordWrites(page, 'POST', /\/hk-tasks(\/[^/]+\/actions\/[a-z-]+)?$/);
      await page.goto(`${WEB_URL}/housekeeping`);
      const counter = page.getByText(/^\d+\/\d+ xong$/).first();
      const read = async () => {
        const m = /^(\d+)\/(\d+)/.exec((await counter.innerText()).trim());
        return { done: Number(m?.[1] ?? NaN), total: Number(m?.[2] ?? NaN) };
      };
      await expect(counter).toBeVisible({ timeout: 15_000 });
      const c0 = await read();
      const newTask = async (note: string) => {
        await page.getByRole('button', { name: t('hk.desk.new_task'), exact: true }).click();
        const dlg = page.getByRole('dialog', { name: t('hk.desk.new_task_title') });
        await dlg.getByLabel(t('booking.field.room')).selectOption(room.id);
        await dlg.getByLabel(t('hk.desk.task_type')).selectOption('adhoc_clean');
        await dlg.getByLabel(t('hk.desk.note')).fill(note);
        await dlg.getByRole('button', { name: t('hk.desk.new_task'), exact: true }).click();
        const w = await waitWrite(writes, `createHkTask ${note}`, 201, (s) =>
          JSON.stringify(s.request).includes(note),
        );
        await expect(dlg).toBeHidden();
        return JSON.parse(w.body) as { id: string };
      };
      const t1 = await newTask('Don them theo yeu cau 1');
      await expect.poll(read).toEqual({ done: c0.done, total: c0.total + 1 });
      const row1 = page.getByRole('listitem').filter({ hasText: 'Don them theo yeu cau 1' });
      await row1.getByRole('button', { name: t('hk.task.complete'), exact: true }).click();
      const doneW = await waitWrite(writes, 'transitionHkTask complete', 200, (s) =>
        s.path.includes(t1.id),
      );
      expect(doneW.path).toMatch(/\/actions\/[a-z-]+$/);
      await expect.poll(read).toEqual({ done: c0.done + 1, total: c0.total + 1 });

      // (TC-L6-033) hủy lý do "Khác": phải ghi chú mới hủy được
      const t2 = await newTask('Don them theo yeu cau 2');
      const row2 = page.getByRole('listitem').filter({ hasText: 'Don them theo yeu cau 2' });
      await row2.getByRole('button', { name: t('hk.desk.cancel'), exact: true }).click();
      const cd = dialogs(page).filter({ hasText: t('hk.desk.cancel_effect') });
      await cd.getByRole('radio', { name: t('hk.refuse.other') }).check();
      const go = cd.getByRole('button', { name: t('hk.desk.cancel'), exact: true });
      await expect(go, 'chưa ghi chú → chưa hủy được').toBeDisabled();
      await cd.getByLabel(t('stay.note')).fill('Khach doi y, khong can don them');
      await go.click();
      const cancelW = await waitWrite(writes, 'transitionHkTask cancel', 200, (s) =>
        s.path.includes(t2.id),
      );
      expect(cancelW.request).toMatchObject({ reasonCode: 'other' });
      await expect(
        page.getByText(tf('hk.desk.cancelled_toast', { room: room.roomNo })).first(),
      ).toBeVisible();
      await page.context().close();
    });
  },
);
