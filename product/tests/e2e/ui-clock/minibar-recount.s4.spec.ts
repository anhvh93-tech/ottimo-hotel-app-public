// E2E UI – BUG-R2-144 phần Desk (FE-A đợt 14, `rounds/round-02/outputs/FE/s4-report.md`) và Note N-1 trên Desk thật:
// - H16 bước 1 báo "Tủ căn {room} cần đếm lại" khi lượt ở tiếp tủ đã đếm (gia hạn B13 sau lần đếm – DOM R9 / BR-703-02
//   r9_18), điền sẵn theo lần đếm trước; lưu bước 1 không đảo dòng đã tính (70.000 giữ).
// - FolioDialog → Điều chỉnh dòng minibar có miễn/giảm: tick "Bỏ cả dòng" → cảnh báo `folio.void_minibar_foc` (N-1).
// Project desk-clock (MutableClock, tuần tự). Máy chủ: M-1 kỳ nạp (BE-B, migration 0066) + cổng `onStayContinued` ở
// B13 (BE-A). TC (r1-main-flows.md): TC-L4-125, TC-L4-126.
import { expect, test } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  versionTag,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  room,
  s2Context,
  vnTime,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  p3,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { minibarCheck, minibarItem } from '../support/s3-stay.js';
import { approvedReduction } from '../support/s4-money.js';
import { desk, openCheckOut } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();
const BIA = minibarItem('bia');

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'UI H16 / Folio – minibar kỳ nạp (BUG-R2-144 phần Desk, N-1)',
  { tag: ['@ui', '@sprint4', '@clock', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L4-125 (E) BUG-R2-144 / BR-703-02 r9_18: đếm minibar ngày đi (2 bia) → gia hạn B13 → ngày đi mới mở H16: bước 1 báo "Tủ căn {room} cần đếm lại", lưu bước 1 không đảo dòng 70.000 đã tính', async ({
      browser,
      request,
    }) => {
      // BE-B (0066 kỳ nạp) + BE-A (cổng ở B13) + FE-A đợt 14 đã có trên cây chung: ca phải đạt (QA chạy 18/10 trên
      // api-dist12 – đạt), không gắn knownBug.
      needClock('TC-L4-125');
      const { D, st } = await precondition(
        'khách ở 1 đêm, đếm 2 bia ngày đi, gia hạn 1 đêm',
        async () => {
          const D = virtualDay(realToday, 3);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
          cleanRooms();
          const c = await s2Context(request);
          const fd0 = await sessionOrSkip(request, 'qa.fd');
          const st = await inHouse(request, c, fd0, {
            room: room(c, '202'),
            alternatives: c.rooms,
            arrival: D,
            nights: 1,
          });
          await useVirtualDevice(request, await setClock(request, vnTime(addDays(D, 1), '09:00')));
          const fd = await sessionOrSkip(request, 'qa.fd');
          expect((await minibarCheck(request, fd, st.res.id, { bia: 2 })).status).toBe(201);
          const cur = await getReservation(request, fd, st.res.id);
          const ext = await call<ProblemFields>(
            request,
            'POST',
            p3(EP3.extendStay, fd, { reservationId: st.res.id }),
            {
              session: fd,
              idempotencyKey: true,
              ifMatch: versionTag(cur.body.version),
              body: { nights: 1 },
            },
          );
          expect(ext.status, `B13: ${JSON.stringify(ext.body).slice(0, 200)}`).toBe(200);
          return { D, st };
        },
      );
      const day = addDays(D, 2);
      await useVirtualDevice(request, await setClock(request, vnTime(day, '09:00')));
      const fd = await sessionOrSkip(request, 'qa.fd');
      const before = liveLines(await getFolio(request, fd, st.res.folioId!), 'minibar');
      expect(
        before.map((l) => l.amountVnd),
        'dòng bia 70.000 đã tính',
      ).toEqual([2 * BIA.salePriceVnd]);
      const page = await desk(browser, 'qa.fd', vnTime(day, '09:00'));
      try {
        const checks = recordWrites(page, 'POST', /\/reservations\/[^/]+\/minibar-checks$/);
        await openCheckOut(page, st.res.id);
        await expect(
          page.getByText(tf('co.minibar_recount_title', { room: st.room.roomNo })).first(),
          'bước 1 báo tủ cần đếm lại',
        ).toBeVisible({ timeout: 15_000 });
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        await waitWrite(checks, 'recordMinibarCheck (đếm lại, điền theo lần trước)', 201);
        await expect(page.getByText(t('checkout.departure_time')).first()).toBeVisible({
          timeout: 10_000,
        });
      } finally {
        await page.context().close();
      }
      const after = liveLines(await getFolio(request, fd, st.res.folioId!), 'minibar');
      expect(
        after.map((l) => l.id),
        'dòng 70.000 giữ nguyên, không đảo',
      ).toEqual(before.map((l) => l.id));
    });

    test('TC-L4-126 (E) Note N-1: Folio → Điều chỉnh dòng bia có miễn 35.000 → tick "Bỏ cả dòng" hiện cảnh báo miễn/giảm sẽ ngưng; bỏ tick thì ẩn; không lưu gì', async ({
      browser,
      request,
    }) => {
      needClock('TC-L4-126');
      const { st, day } = await precondition(
        'khách đang ở, bia 2 (70.000) có FOC 35.000 đã duyệt',
        async () => {
          const D = virtualDay(realToday, 2);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
          cleanRooms();
          const c = await s2Context(request);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const st = await inHouse(request, c, fd, {
            room: room(c, '203'),
            alternatives: c.rooms,
            arrival: D,
            nights: 1,
          });
          expect((await minibarCheck(request, fd, st.res.id, { bia: 2 })).status).toBe(201);
          const line = liveLines(await getFolio(request, fd, st.res.folioId!), 'minibar')[0]!;
          await approvedReduction(
            request,
            fd,
            await sessionOrSkip(request, 'qa.owner'),
            st.res.folioId!,
            line.id,
            {
              amountVnd: BIA.salePriceVnd,
              reasonCode: 'service_recovery',
            },
          );
          return { st, day: D };
        },
      );
      const fd = await sessionOrSkip(request, 'qa.fd');
      const v0 = (await getFolio(request, fd, st.res.folioId!)).version;
      const page = await desk(browser, 'qa.fd', vnTime(day, '15:00'));
      try {
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await page.getByRole('button', { name: t('folio.open') }).click();
        const folio = page.getByRole('dialog', {
          name: new RegExp(`^${esc(tf('folio.dialog_title', { code: st.res.code }))}`),
        });
        await expect(folio).toBeVisible({ timeout: 15_000 });
        const row = folio
          .getByRole('row')
          .filter({ hasText: BIA.name })
          .filter({ has: page.getByRole('button', { name: t('folio.adjust') }) })
          .first();
        await row.getByRole('button', { name: t('folio.adjust') }).click();
        const adj = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('folio.adjust_title'))}`),
        });
        await expect(adj).toBeVisible();
        const warn = adj.getByText(new RegExp(esc(stem('folio.void_minibar_foc'))));
        await expect(warn, 'chưa tick: chưa cảnh báo').toHaveCount(0);
        await adj.getByRole('checkbox', { name: t('folio.adjust_void') }).check();
        await expect(warn, 'N-1: cảnh báo miễn/giảm').toBeVisible();
        await adj.getByRole('checkbox', { name: t('folio.adjust_void') }).uncheck();
        await expect(warn).toHaveCount(0);
      } finally {
        await page.context().close();
      }
      expect((await getFolio(request, fd, st.res.folioId!)).version, 'không lưu gì').toBe(v0);
    });

    test('TC-L4-132 (E) ARC 16.16 (ab) – `periodId`: lễ tân mở H16 bước 1 (kỳ `carry` sau B13), HK xong việc nạp tủ của lượt đang ở → lễ tân gửi lần đếm soạn trên kỳ cũ → 409 MINIBAR_PERIOD_CHANGED, Desk ở lại bước 1 với câu nhắc đếm lại, folio không đổi → đếm lại theo kỳ mới (dùng 1 bia) → 201 với `periodId` mới và Idempotency-Key mới, folio thêm đúng 35.000', async ({
      browser,
      request,
    }) => {
      needClock('TC-L4-132');
      const { D, st, taskId } = await precondition(
        'khách ở 1 đêm, ngày đi đếm 2 bia, gia hạn B13 → việc bổ sung T1 mở (DOM R9)',
        async () => {
          const D = virtualDay(realToday, 3);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
          cleanRooms();
          const c = await s2Context(request);
          const fd0 = await sessionOrSkip(request, 'qa.fd');
          const st = await inHouse(request, c, fd0, {
            room: room(c, '202'),
            alternatives: c.rooms,
            arrival: D,
            nights: 1,
          });
          await useVirtualDevice(request, await setClock(request, vnTime(addDays(D, 1), '09:00')));
          const fd = await sessionOrSkip(request, 'qa.fd');
          expect((await minibarCheck(request, fd, st.res.id, { bia: 2 })).status).toBe(201);
          const cur = await getReservation(request, fd, st.res.id);
          const ext = await call<ProblemFields>(
            request,
            'POST',
            p3(EP3.extendStay, fd, { reservationId: st.res.id }),
            {
              session: fd,
              idempotencyKey: true,
              ifMatch: versionTag(cur.body.version),
              body: { nights: 1 },
            },
          );
          expect(ext.status, `B13: ${JSON.stringify(ext.body).slice(0, 200)}`).toBe(200);
          const hk = await sessionOrSkip(request, 'qa.hk');
          const tasks = await call<{ data: Array<Record<string, unknown>> }>(
            request,
            'GET',
            p3(EP3.listHkTasks, hk),
            { session: hk, query: { date: addDays(D, 1) } },
          );
          const t1 = tasks.body.data.find(
            (x) => x.type === 'minibar_refill' && x.reservationId === st.res.id,
          );
          expect(t1, 'B13 sinh việc bổ sung T1 (DOM R9)').toBeTruthy();
          return { D, st, taskId: String(t1!.id) };
        },
      );
      const day = addDays(D, 2);
      await useVirtualDevice(request, await setClock(request, vnTime(day, '09:00')));
      const fd = await sessionOrSkip(request, 'qa.fd');
      const before = liveLines(await getFolio(request, fd, st.res.folioId!), 'minibar').map(
        (l) => l.id,
      );
      const page = await desk(browser, 'qa.fd', vnTime(day, '09:00'));
      const keys: string[] = [];
      page.on('request', (r) => {
        if (r.method() === 'POST' && /\/minibar-checks$/.test(new URL(r.url()).pathname))
          keys.push(r.headers()['idempotency-key'] ?? '');
      });
      try {
        const checks = recordWrites(page, 'POST', /\/reservations\/[^/]+\/minibar-checks$/);
        await openCheckOut(page, st.res.id);
        const mb = page.getByRole('table', { name: t('checkout.step.minibar') });
        await expect(mb).toBeVisible({ timeout: 15_000 });
        // HK xong việc nạp T1 trong lúc lễ tân đang ở bước 1 (lượt đang ở căn → kỳ `refill`)
        const hk = await sessionOrSkip(request, 'qa.hk');
        for (const [action, at] of [
          ['start', '09:00'],
          ['complete', '09:01'],
        ] as const) {
          const r = await call<ProblemFields>(
            request,
            'POST',
            `/v1/properties/${propertyIdOf(hk)}/hk-tasks/${taskId}/actions/${action}`,
            { session: hk, idempotencyKey: true, body: { performedAt: vnTime(day, at) } },
          );
          expect(r.status, `HK ${action}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
        }
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        const first = await waitWrite(checks, 'recordMinibarCheck soạn trên kỳ cũ', 409);
        expect(first.body, '409 MINIBAR_PERIOD_CHANGED').toContain('MINIBAR_PERIOD_CHANGED');
        await expect(
          page.getByText(t('co.minibar_period_changed_title')).first(),
          'câu nhắc đếm lại',
        ).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(t('checkout.departure_time'))).toHaveCount(0);
        expect(
          liveLines(await getFolio(request, fd, st.res.folioId!), 'minibar').map((l) => l.id),
          '409: folio không đổi',
        ).toEqual(before);
        // đếm lại theo kỳ mới: khách uống 1 bia sau lúc nạp
        await mb
          .getByRole('row', { name: /Bia/ })
          .first()
          .getByRole('button', { name: t('rooms.dec') })
          .click();
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        const second = await waitWrite(checks, 'recordMinibarCheck đếm lại', 201);
        expect(second.request?.periodId, 'periodId của kỳ mới').toBeTruthy();
        expect(second.request?.periodId, 'periodId khác lần trước').not.toBe(
          first.request?.periodId,
        );
        expect(new Set(keys).size, 'Idempotency-Key mới cho lần đếm lại').toBe(keys.length);
        await expect(page.getByText(t('checkout.departure_time')).first()).toBeVisible({
          timeout: 10_000,
        });
      } finally {
        await page.context().close();
      }
      const after = liveLines(await getFolio(request, fd, st.res.folioId!), 'minibar');
      expect(after.map((l) => l.amountVnd).sort(), 'giữ 70.000 + thêm đúng 35.000').toEqual([
        BIA.salePriceVnd,
        2 * BIA.salePriceVnd,
      ]);
    });
  },
);
