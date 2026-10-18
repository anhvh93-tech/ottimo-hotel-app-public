// E2E UI vòng sửa 5b – K11-03 / BUG-R2-173 phần Desk (FE-A đợt 17, ARC 16.19 K11-03; oracle BR-703-04):
// - TC-L4-138: B14 giữa lượt (202 → căn cùng nhóm), không đua; ngày đi H16 bước 1 hiện hai tủ, tủ căn cũ trước. Đếm tủ
//   202 qua giao diện → lệnh mang `roomId` 202 (+ `periodId`), ghi tủ 202; rồi tủ căn đang ở → lệnh mang `roomId` căn
//   mới. B18 xong, minibar 35.000 đúng một dòng. Trước đợt 17, Desk lấy `segments[0]` làm căn hiện tại và gửi vắng
//   `roomId` → ghi nhầm tủ căn mới, B18 kẹt.
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
import {
  addDays,
  cleanupTracked,
  getReservation,
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
} from '../support/s3.js';
import { minibarItem } from '../support/s3-stay.js';
import { desk, openCheckOut } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
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

/** Căn đích B14 phải sạch: dọn bằng API buồng phòng nếu đang VD/CL. */
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
  'UI vòng sửa 5b – H16 đếm từng tủ đúng `roomId` sau B14 giữa lượt (K11-03)',
  { tag: ['@ui', '@sprint4', '@clock', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L4-138 (E) BUG-R2-173 / K11-03 phần Desk (oracle BR-703-04): khách 202 hai đêm, D+1 B14 sự cố sang căn cùng nhóm; ngày đi H16 bước 1 hiện hai tủ, tủ căn cũ 202 chọn trước; đếm 202 bia dùng 1 → lệnh `roomId` 202 + `periodId`, 201; tủ căn đang ở dùng 0 → lệnh `roomId` căn mới; B18 xong, minibar 35.000 đúng một dòng, tủ 202', async ({
      browser,
      request,
    }) => {
      needClock('TC-L4-138');
      const D = virtualDay(realToday, 3);
      await at(request, D, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd0 = await sessionOrSkip(request, 'qa.fd');
      const from = room(c, '202');
      const to = c.rooms.find(
        (r) => r.id !== from.id && r.roomGroupId && r.roomGroupId === from.roomGroupId,
      );
      expect(to, 'căn cùng nhóm với 202').toBeTruthy();
      const st = await inHouse(request, c, fd0, { room: from, arrival: D, nights: 2 });
      expect(st.room.id).toBe(from.id);
      // D+1: B14 sự cố 202 → căn cùng nhóm (không đua, không đếm tủ 202 lúc đổi)
      const d1 = addDays(D, 1);
      await at(request, d1, '10:00');
      const fd1 = await sessionOrSkip(request, 'qa.fd');
      await makeReady(request, fd1, to!, d1);
      const base = {
        newRoomId: to!.id,
        effectiveDate: d1,
        cause: 'property_fault',
        reason: 'Voi sen hong',
      };
      const pv = await stayAction<Json & ProblemFields>(
        request,
        fd1,
        st.res.id,
        'change-room',
        base,
        { dryRun: true },
      );
      expect(pv.status, JSON.stringify(pv.body).slice(0, 200)).toBe(200);
      const delta = Number(pv.body.folioDeltaVnd ?? 0);
      const mv = await stayAction<Json & ProblemFields>(request, fd1, st.res.id, 'change-room', {
        ...base,
        ...(delta !== 0 ? { applyDifference: true, expectedDeltaVnd: delta } : {}),
      });
      expect(mv.status, `B14: ${JSON.stringify(mv.body).slice(0, 200)}`).toBe(200);
      // D+2 09:00: ngày đi – lễ tân trả phòng trên H16
      const d2 = addDays(D, 2);
      await at(request, d2, '09:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const page: Page = await desk(browser, 'qa.fd', vnTime(d2, '09:00'));
      try {
        const counts = recordWrites(page, 'POST', /\/minibar-checks$/);
        await openCheckOut(page, st.res.id);
        const group = page.getByRole('group', { name: t('co.minibar_cabinet') });
        await expect(group, 'hai tủ của lượt (BR-703-01)').toBeVisible({ timeout: 15_000 });
        const oldBtn = group.getByRole('button', {
          name: tf('co.minibar_cabinet_old', { room: from.roomNo }),
        });
        const hereBtn = group.getByRole('button', {
          name: tf('co.minibar_cabinet_room', { room: to!.roomNo }),
        });
        await expect(oldBtn, 'tủ căn cũ được chọn trước').toHaveAttribute('aria-pressed', 'true');
        // khách uống 1 bia ở 202
        const biaRow = page
          .getByRole('row')
          .filter({ has: page.getByRole('rowheader', { name: new RegExp(`^${esc(BIA.name)}`) }) });
        await expect(biaRow).toBeVisible();
        await biaRow.getByRole('button', { name: t('rooms.dec') }).click();
        await expect(
          page.getByText(new RegExp(esc(stem('co.minibar_total')))).first(),
        ).toContainText(BIA.salePriceVnd.toLocaleString('vi-VN'));
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        const w1 = await waitWrite(
          counts,
          'đếm tủ 202 (H16)',
          201,
          (s) => s.request?.roomId === from.id,
        );
        expect(w1.request?.roomId, 'lệnh đếm mang roomId 202').toBe(from.id);
        expect(w1.request, 'lệnh đếm mang periodId (ARC 16.19)').toHaveProperty('periodId');
        // sau tủ 202: tự chuyển sang tủ căn đang ở – chỉ còn một tủ cần đếm nên nhóm chọn tủ có thể ẩn; bảng tải lại
        // theo tủ mới (bia dùng 0)
        await expect
          .poll(
            async () =>
              (await group.isVisible().catch(() => false))
                ? await hereBtn.getAttribute('aria-pressed').catch(() => null)
                : 'hidden',
            { timeout: 15_000, message: 'chuyển sang tủ căn đang ở' },
          )
          .toMatch(/^(true|hidden)$/);
        await expect(biaRow.getByRole('cell').nth(2), 'tủ căn đang ở: bia dùng 0').toHaveText('0');
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        const w2 = await waitWrite(
          counts,
          'đếm tủ căn đang ở (H16)',
          201,
          (s) => s.request?.roomId === to!.id,
        );
        expect(w2.request?.roomId).toBe(to!.id);
        expect(
          counts.filter((s) => s.status === 201).map((s) => s.request?.roomId),
          'đúng hai lệnh đếm, mỗi tủ một lệnh, đều mang roomId',
        ).toEqual([from.id, to!.id]);
        // bước 2 → bill → thu tiền mặt 35.000 → hoàn tất
        await page.getByRole('button', { name: t('co.go_bill') }).click();
        await expect(page.getByText(t('bill.total')).first()).toBeVisible({ timeout: 15_000 });
        await page
          .getByRole('button', { name: t('pay.cash') })
          .first()
          .click();
        const cashIn = page.getByLabel(t('co.cash_received')).first();
        if (await cashIn.isVisible().catch(() => false))
          await cashIn.fill(String(BIA.salePriceVnd));
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
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('checked_out');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(f.status).toBe('settled');
      const mb = liveLines(f, 'minibar');
      expect(
        mb.map((l) => l.amountVnd),
        'minibar 35.000 đúng một dòng',
      ).toEqual([BIA.salePriceVnd]);
      const cab = (mb[0] as unknown as { cabinetRoomId?: string }).cabinetRoomId;
      if (cab !== undefined) expect(cab, 'dòng thuộc tủ 202').toBe(from.id);
      const std202 = await call<{ latestCheck?: { totalVnd?: number } | null }>(
        request,
        'GET',
        p3(EP3.getMinibarStandard, fd, { reservationId: st.res.id }),
        { session: fd, query: { roomId: from.id } },
      );
      if (std202.status === 200)
        expect(std202.body.latestCheck?.totalVnd, 'latestCheck tủ 202 = folio').toBe(
          BIA.salePriceVnd,
        );
    });
  },
);
