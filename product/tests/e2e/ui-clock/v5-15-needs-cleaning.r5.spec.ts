// E2E UI v1.0.5 – V5-15 nút "Cần dọn" trên Desk (S10 Buồng phòng → Trạng thái buồng). Không đổi hợp đồng (ARC 0.3.13
// mục 1.4, ca T15-8 phần Desk): `transitionRoomStatus` `event = needs_cleaning` (R8, OC → OD). Nút chỉ hiện khi máy chủ
// trả `needs_cleaning` trong `allowedEvents`. Lượt 1: bấm Cần dọn căn đang ở → 200, căn thành OD, có việc dọn ở lại.
// Lượt 2: căn khác bị đổi trạng thái qua API sau khi trang đã tải (như buồng phòng bấm trên PWA) → bấm nút cũ → 409
// INVALID_TRANSITION, Desk tải lại danh sách và báo câu UXD. Dữ liệu dựng bằng API trên ngày ảo riêng.
// Project desk-clock (MutableClock, tuần tự). axe 0 critical/serious (ngưỡng ui/axe.ts) trước và sau khi bấm.
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { cleanupTracked, room, s2Context, vnTime } from '../support/s2.js';
import { cleanRooms, inHouse, useVirtualDevice, virtualDay } from '../support/s3.js';
import { scan } from '../ui/axe.js';
import { desk, roomStatusOf } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<string> {
  const iso = await setClock(request, vnTime(date, hhmm));
  await useVirtualDevice(request, iso);
  return vnTime(date, hhmm);
}

/** Row of room `no` on the "Trạng thái buồng" board. */
function roomRow(page: Page, no: string): Locator {
  return page
    .getByRole('region', { name: t('hk.desk.rooms') })
    .getByRole('listitem')
    .filter({ has: page.locator('.roomno', { hasText: new RegExp(`^${no}$`) }) });
}

test.describe(
  'v1.0.5 V5-15 – nút Cần dọn trên Desk (R8 needs_cleaning)',
  { tag: ['@ui', '@r5', '@clock', '@a11y'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('V5-15 (E) T15-8 phần Desk, US-053: qa.fd bấm Cần dọn căn 301 đang ở (OC) → R8 200, căn OD, có việc dọn ở lại, nút mất; căn 302 bị đổi qua API sau khi trang tải → bấm nút cũ → 409 INVALID_TRANSITION, danh sách tải lại, câu "Danh sách đã tải lại"; axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('V5-15');
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const a = await inHouse(request, c, fd, { room: room(c, '301'), arrival: D, nights: 2 });
      const b = await inHouse(request, c, fd, { room: room(c, '302'), arrival: D, nights: 2 });
      expect(await roomStatusOf(request, a.room.id), '301 sau nhận phòng').toBe('OC');
      expect(await roomStatusOf(request, b.room.id), '302 sau nhận phòng').toBe('OC');

      const now = await at(request, D, '16:00');
      const page = await desk(browser, 'qa.fd', now);
      try {
        const writes = recordWrites(page, 'POST', /\/status-transitions$/);
        // Lượt 2 cần trang còn trạng thái cũ khi bấm: không nhận SSE `room.status_changed` (máy chậm / mất luồng).
        // Trang rơi về hỏi lại mỗi 30 giây (live.ts POLL_MS) – lâu hơn khoảng giữa lệnh API và cú bấm.
        await page.route(/\/v1\/properties\/[^/]+\/events(\?|$)/, (r) => r.abort());
        await page.goto(`${WEB_URL}/housekeeping`);
        const rowA = roomRow(page, '301');
        const rowB = roomRow(page, '302');
        const btnA = rowA.getByRole('button', { name: t('hk.action.needs_cleaning'), exact: true });
        const btnB = rowB.getByRole('button', { name: t('hk.action.needs_cleaning'), exact: true });
        await expect(btnA, 'nút Cần dọn ở căn OC').toBeVisible({ timeout: 15_000 });
        await expect(btnB).toBeVisible();
        await expect(rowA.getByText(t('status.room.OC'))).toBeVisible();
        await scan(page, test.info(), 'S10-rooms-needs-cleaning');

        // ── Lượt 1: 301 OC → OD ──
        await btnA.click();
        const w = await waitWrite(writes, 'R8 needs_cleaning căn 301', 200, (x) =>
          x.path.includes(`/rooms/${a.room.id}/`),
        );
        expect(w.request).toMatchObject({ event: 'needs_cleaning', expectedFrom: 'OC' });
        await expect(
          page.getByText(tf('hk.desk.needs_cleaning_toast', { room: '301' })),
        ).toBeVisible();
        await expect(rowA.getByText(t('status.room.OD'))).toBeVisible({ timeout: 15_000 });
        await expect(btnA, 'OD không còn nút Cần dọn').toHaveCount(0);
        expect(await roomStatusOf(request, a.room.id)).toBe('OD');
        const tasks = await call<{ data: Array<{ roomId: string; type: string; status: string }> }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/hk-tasks`,
          { session: fd },
        );
        expect(tasks.status).toBe(200);
        expect(
          tasks.body.data.some(
            (x) => x.roomId === a.room.id && x.type === 'stayover_clean' && x.status === 'open',
          ),
          'R8a: việc dọn ở lại của 301',
        ).toBe(true);

        // ── Lượt 2: 302 đổi qua API (buồng phòng bấm trên PWA) sau khi trang đã tải ──
        const api = await call(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(fd)}/rooms/${b.room.id}/status-transitions`,
          {
            session: fd,
            idempotencyKey: true,
            body: { event: 'needs_cleaning', expectedFrom: 'OC', performedAt: vnTime(D, '15:59') },
          },
        );
        expect(api.status, `R8 qua API: ${JSON.stringify(api.body).slice(0, 200)}`).toBe(200);
        await expect(btnB, 'trang chưa tải lại: nút cũ còn').toBeVisible();
        await btnB.click();
        const conflict = await waitWrite(writes, 'R8 căn 302 đã đổi', 409, (x) =>
          x.path.includes(`/rooms/${b.room.id}/`),
        );
        expect(conflict.body).toContain('INVALID_TRANSITION');
        await expect(rowB.getByText(t('error.INVALID_TRANSITION_generic_reloaded'))).toBeVisible({
          timeout: 15_000,
        });
        await expect(rowB.getByText(t('status.room.OD'))).toBeVisible({ timeout: 15_000 });
        await expect(btnB).toHaveCount(0);
        expect(writes.filter((x) => x.status !== 200 && x.status !== 409)).toEqual([]);
        await scan(page, test.info(), 'S10-rooms-needs-cleaning-409');
      } finally {
        await page.context().close();
      }
    });
  },
);
