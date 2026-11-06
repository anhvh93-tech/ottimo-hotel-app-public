// E2E UI v1.0.5 – V5-50 (BUG-R3-023 phần lọc, P2): hộp Đổi phòng (H15 15.4, B14) không liệt kê căn chưa dọn.
// `searchAvailability` không có trạng thái buồng (ARC 0.3.13 mục 1.12): Desk đọc thêm `listRoomStatuses` và chỉ giữ
// căn VI / VC. Dữ liệu dựng bằng API trên ngày ảo riêng, căn bẩn là căn thật: lượt thứ hai đổi phòng (B14) nên căn cũ
// thành VD mà vẫn trống – `searchAvailability` vẫn trả căn đó, Desk phải bỏ nó khỏi danh sách. Không bấm lưu.
// Project desk-clock (MutableClock, tuần tự). axe 0 critical/serious trên hộp (ngưỡng ui/axe.ts).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { cleanupTracked, room, s2Context, vnTime, type ProblemFields } from '../support/s2.js';
import { cleanRooms, inHouse, stayAction, useVirtualDevice, virtualDay } from '../support/s3.js';
import { scan } from '../ui/axe.js';
import { desk, roomStatusOf } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';

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
  const iso = await setClock(request, vnTime(date, hhmm));
  await useVirtualDevice(request, iso);
  return vnTime(date, hhmm);
}

test.describe(
  'v1.0.5 V5-50 – hộp Đổi phòng chỉ liệt kê căn VI / VC',
  { tag: ['@ui', '@r5', '@clock', '@a11y'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('V5-50 (E) BUG-R3-023 US-024: Desk H15 đơn đang ở 201 – căn 202 vừa trống sau B14 của lượt khác (VD) không có trong danh sách căn mới dù searchAvailability trả nó; căn VC vẫn có; câu "chỉ hiện căn VI/VC"; không lưu; axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('V5-50');
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const a = await inHouse(request, c, fd, { room: room(c, '201'), arrival: D, nights: 2 });
      const b = await inHouse(request, c, fd, { room: room(c, '202'), arrival: D, nights: 2 });
      expect([a.room.roomNo, b.room.roomNo]).toEqual(['201', '202']);
      // Lượt b đổi sang 203 (sự cố, giữ giá) → 202 thành VD, trống từ hôm nay (BR-424)
      await at(request, D, '15:00');
      const to = room(c, '203');
      const base = {
        newRoomId: to.id,
        effectiveDate: D,
        cause: 'property_fault',
        reason: 'Voi sen hong',
      };
      const pv = await stayAction<Json & ProblemFields>(
        request,
        fd,
        b.res.id,
        'change-room',
        base,
        {
          dryRun: true,
        },
      );
      expect(pv.status, `B14 xem trước: ${JSON.stringify(pv.body).slice(0, 200)}`).toBe(200);
      const delta = Number(pv.body.folioDeltaVnd ?? 0);
      const mv = await stayAction<Json & ProblemFields>(request, fd, b.res.id, 'change-room', {
        ...base,
        ...(delta !== 0 ? { applyDifference: true, expectedDeltaVnd: delta } : {}),
      });
      expect(mv.status, `B14: ${JSON.stringify(mv.body).slice(0, 200)}`).toBe(200);
      expect(await roomStatusOf(request, b.room.id), '202 sau B14').toBe('VD');

      const now = await at(request, D, '16:00');
      const page = await desk(browser, 'qa.fd', now);
      try {
        await page.goto(`${WEB_URL}/reservations/${a.res.id}`);
        await expect(page.getByText(a.res.code).first()).toBeVisible({ timeout: 15_000 });
        const avail = page.waitForResponse(
          (r) => r.request().method() === 'GET' && /\/availability\?/.test(r.url()),
          { timeout: 20_000 },
        );
        const statuses = page.waitForResponse(
          (r) => r.request().method() === 'GET' && /\/room-statuses(\?|$)/.test(r.url()),
          { timeout: 20_000 },
        );
        await page
          .getByRole('button', { name: t('drawer.action.change_room'), exact: true })
          .click();
        const chg = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('stay.change_title'))}`),
        });
        await expect(chg).toBeVisible({ timeout: 10_000 });
        const av = await avail;
        expect(av.status(), 'searchAvailability').toBe(200);
        const offered = (
          (await av.json()) as { alternatives: Array<{ roomNo: string }> }
        ).alternatives.map((x) => x.roomNo);
        // Điều kiện của ca: máy chủ vẫn trả căn bẩn trong danh sách trống (không có trạng thái buồng – ARC 1.12)
        expect(offered, 'searchAvailability trả 202 (trống, chưa dọn)').toContain('202');
        expect((await statuses).status(), 'listRoomStatuses').toBe(200);
        const target = chg.getByRole('group', { name: t('stay.new_room') });
        const radio = (no: string) => target.getByRole('radio', { name: new RegExp(`^${no}\\b`) });
        await expect(radio('101'), 'căn VC trống vẫn có').toBeVisible({ timeout: 15_000 });
        await expect(radio('202'), 'căn VD không được liệt kê').toHaveCount(0);
        await expect(radio('203'), 'căn đang có khách không được liệt kê').toHaveCount(0);
        await expect(target.getByText(t('room_change.ready_only'))).toBeVisible();
        await scan(page, test.info(), 'H15-change-room-ready-only');
      } finally {
        await page.context().close();
      }
    });
  },
);
