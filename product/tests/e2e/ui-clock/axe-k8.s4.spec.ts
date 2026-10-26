// Cổng QC Sprint 4 – K8 (G8.2, M8): ca axe còn thiếu (`rounds/round-02/qc/s4-qc-gate.md` mục 5 K8). Chỉ thêm test, không
// đổi mã sản phẩm. Ngưỡng như mọi ca axe (ui/axe.ts): 0 critical/serious theo WCAG 2.1 A/AA + 2.2 AA.
// Project desk-clock (MutableClock, tuần tự). Dữ liệu dựng bằng API trên ngày ảo riêng; màn được mở và bấm thật.
// - TC-X-084: PWA H20 cỡ điện thoại 390×844 – danh sách căn (H19.2 khi có căn "Khách đang ở – cần dọn"), một căn có
//   việc dọn ở lại (20.1), hộp "Khách không muốn dọn" (20.4: mở, lỗi chưa chọn lý do, lý do "Khác"), toast hoàn tác
//   10 giây (20.2), kiểm phòng 12 mục (20.3: mở, đủ mục + ảnh, ô "Chưa đạt" và lỗi thiếu ghi chú, toast "đã ghi chưa
//   đạt" rồi Hoàn tác, Kiểm đạt).
// - TC-X-085: Desk H15 – hộp Gia hạn (15.2) và hộp Đổi phòng (15.4) của đơn đang ở, có giá xem trước của căn mới.
//   Không bấm lưu: không ghi tiền.
// - TC-X-086: Desk H16 bước 2–3 khi trả sau mốc mà đêm ngày đi đã có khách (BR-416-06): bước 2 báo "tính thêm 1 đêm"
//   không bán được, bước 3 hộp "Quản lý xác nhận phụ thu trả muộn" (lý do, miễn/giảm, tên quản lý, mật khẩu) – có
//   và không bật miễn/giảm. Không bấm Hoàn tất: không ghi tiền.
// - TC-X-087: H23 guest-web 390×844 – form "Gửi yêu cầu" ở vị trí đầu (không cuộn): nút "Gửi yêu cầu" không bị thanh
//   tab đáy che, chạm vào giữa nút thì gửi được (BUG-R2-193 – axe không bắt được vì nút bị che gần hết) + axe.
// H23 vị trí đầu (bỏ `scrollTo`) cũng có trong TC-X-077 (ui-clock/gate-s4.spec.ts).
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, STAFF_URL, WEB_URL } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import { addDays, cleanupTracked, room, s2Context, vnTime } from '../support/s2.js';
import {
  PNG_16X16,
  cleanRooms,
  guestLink,
  inHouse,
  makeStay,
  useVirtualDevice,
  virtualDay,
  type Stay,
} from '../support/s3.js';
import { scan } from '../ui/axe.js';
import { desk, openCheckOut, pastUndo, roomStatusOf, staffApp } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { photo, recordWrites, waitWrite } from '../ui/write-steps.js';

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

async function stay(
  request: APIRequestContext,
  D: string,
  roomNo: string,
  nights: number,
): Promise<Stay> {
  await at(request, D, '14:00');
  cleanRooms();
  const c = await s2Context(request);
  const fd = await sessionOrSkip(request, 'qa.fd');
  return inHouse(request, c, fd, {
    room: room(c, roomNo),
    alternatives: c.rooms,
    arrival: D,
    nights,
  });
}

/** Toast hoàn tác của PWA (20.2): giữ đếm ngược bằng cách focus nút Hoàn tác (DS 6.18) rồi quét. */
async function scanUndoToast(page: Page, text: RegExp, screen: string): Promise<void> {
  const toast = page.locator('.toast-dock .toast').filter({ hasText: text });
  await expect(toast, `toast ${screen}`).toBeVisible({ timeout: 10_000 });
  const undo = toast.getByRole('button', { name: new RegExp(`^${esc(t('common.undo'))}`) });
  await undo.focus();
  await scan(page, test.info(), screen);
  await undo.blur();
}

test.describe(
  'K8 cổng S4 – axe H20 (PWA buồng phòng), H15 Gia hạn / Đổi phòng, H16 bước 2–3 quản lý xác nhận',
  { tag: ['@ui', '@sprint4', '@clock', '@a11y'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-X-084 (E) G8.2 K8 US-053/AC1–AC4, US-055/AC1–AC2: PWA H20 390×844 – danh sách căn có căn "cần dọn", căn có việc dọn ở lại (20.1), hộp "Khách không muốn dọn" (20.4) gồm lỗi chưa chọn lý do và lý do "Khác", toast hoàn tác (20.2), kiểm phòng 12 mục (20.3) gồm "Chưa đạt" thiếu ghi chú, toast "đã ghi chưa đạt" + Hoàn tác, Kiểm đạt → VI; axe từng trạng thái', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-084');
      const D = virtualDay(realToday, 3);
      const st = await stay(request, D, '301', 2);
      const occ = st.room;
      const c = await s2Context(request);
      const vacant =
        c.rooms.find((x) => x.roomNo !== occ.roomNo && x.roomNo === '302') ??
        c.rooms.find((x) => x.roomNo !== occ.roomNo)!;
      // căn có khách: OC → OD (R8a) sinh một việc `stayover_clean` hôm nay – như J8 buổi sáng
      let now = await at(request, D, '15:00');
      // lễ tân trưởng ghi (buồng phòng chỉ thao tác căn trong phạm vi việc được giao – 404 khi chưa có việc)
      const hkS = await sessionOrSkip(request, 'qa.fdl');
      const dirty = await call(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(hkS)}/rooms/${occ.id}/status-transitions`,
        {
          session: hkS,
          idempotencyKey: true,
          body: { event: 'needs_cleaning', expectedFrom: 'OC', performedAt: now },
        },
      );
      expect(dirty.status, `needs_cleaning: ${JSON.stringify(dirty.body).slice(0, 300)}`).toBe(200);
      expect(await roomStatusOf(request, occ.id)).toBe('OD');

      // ── buồng phòng: danh sách căn, 20.1, 20.4, 20.2 ──
      now = await at(request, D, '15:05');
      const hk = await staffApp(browser, request, 'qa.hk', now);
      try {
        const moves = recordWrites(hk, 'POST', /\/rooms\/[^/]+\/status-transitions$/);
        await hk.goto(`${STAFF_URL}/#/rooms`);
        const rooms = hk.getByRole('link', { name: /^Căn \d{3}/ });
        await expect(rooms.first()).toBeVisible({ timeout: 20_000 });
        expect(await rooms.count(), '10 căn').toBe(10);
        await expect(hk.getByText(t('hk.status.OD')).first(), 'căn có khách cần dọn').toBeVisible();
        await scan(hk, test.info(), 'H20-rooms-list');

        await hk.goto(`${STAFF_URL}/#/room/${occ.id}`);
        const refuseLink = hk.getByRole('link', { name: t('hk.task.guest_refused') });
        await expect(refuseLink, '20.1 việc dọn ở lại có "Khách không muốn dọn"').toBeVisible({
          timeout: 20_000,
        });
        const start = hk.getByRole('button', { name: t('hk.action.start_cleaning') });
        await expect(start).toBeVisible();
        await scan(hk, test.info(), 'H20-1-room-stayover');

        await refuseLink.click();
        await expect(hk.getByRole('heading', { name: t('hk.refuse_title') })).toBeVisible({
          timeout: 10_000,
        });
        await scan(hk, test.info(), 'H20-4-refuse');
        await hk.getByRole('button', { name: t('hk.refuse_save') }).click();
        await expect(hk.getByRole('alert').filter({ hasText: t('common.required') })).toBeVisible();
        await scan(hk, test.info(), 'H20-4-refuse-required');
        await hk.getByRole('radio', { name: t('hk.refuse.other') }).check();
        await expect(hk.locator('#refuse-note')).toBeVisible();
        await scan(hk, test.info(), 'H20-4-refuse-other');
        // không bỏ việc: quay lại căn
        await hk
          .locator('.hk-foot')
          .getByRole('button', { name: t('common.back') })
          .click();
        await expect(start).toBeVisible({ timeout: 10_000 });

        await start.click();
        await scanUndoToast(hk, new RegExp(esc(occ.roomNo)), 'H20-2-undo-toast');
        await pastUndo(hk);
        const w = await waitWrite(moves, 'transitionRoomStatus start_cleaning', 200);
        expect(w.request).toMatchObject({ event: 'start_cleaning', expectedFrom: 'OD' });
        await expect.poll(() => roomStatusOf(request, occ.id)).toBe('CL');
      } finally {
        await hk.context().close();
      }

      // ── lễ tân trưởng: kiểm phòng căn trống (VC) – 20.3 ──
      now = await at(request, D, '15:20');
      expect(await roomStatusOf(request, vacant.id), 'căn trống đã dọn').toBe('VC');
      const fdl = await staffApp(browser, request, 'qa.fdl', now);
      try {
        const insp = recordWrites(fdl, 'POST', /\/rooms\/[^/]+\/inspections$/);
        await fdl.goto(`${STAFF_URL}/#/inspect/${vacant.id}`);
        const legend = fdl.getByRole('group', { name: t('hk.insp.legend') });
        await expect(legend).toBeVisible({ timeout: 20_000 });
        const pass = fdl.getByRole('button', { name: t('hk.insp.pass') });
        await expect(pass, 'chưa tick đủ → khóa').toHaveAttribute('aria-disabled', 'true');
        await scan(fdl, test.info(), 'H20-3-inspect-empty');
        for (const box of await legend.getByRole('checkbox').all()) await box.check();
        const pick = fdl.locator('input[type="file"]');
        if ((await pick.count()) > 0)
          await pick.first().setInputFiles(photo(PNG_16X16, 'kiem-phong.png'));
        await expect(pass).not.toHaveAttribute('aria-disabled', 'true', { timeout: 15_000 });
        await scan(fdl, test.info(), 'H20-3-inspect-ready');
        // "Chưa đạt": ô ghi chú bắt buộc
        await fdl.getByRole('button', { name: t('hk.insp.fail'), exact: true }).click();
        const note = fdl.locator('#insp-fail');
        await expect(note).toBeVisible();
        await scan(fdl, test.info(), 'H20-3-inspect-fail');
        await fdl.getByRole('button', { name: t('hk.insp.fail_save') }).click();
        await expect(note).toHaveAttribute('aria-invalid', 'true');
        await scan(fdl, test.info(), 'H20-3-inspect-fail-required');
        await note.fill('Bon cau chua sach, thieu khan tam');
        await fdl.getByRole('button', { name: t('hk.insp.fail_save') }).click();
        await scanUndoToast(
          fdl,
          new RegExp(esc(stem('hk.toast.insp_failed'))),
          'H20-3-inspect-failed-toast',
        );
        // hoàn tác trong 10 giây: không gửi gì
        const toast = fdl.locator('.toast-dock .toast');
        await toast.getByRole('button', { name: new RegExp(`^${esc(t('common.undo'))}`) }).click();
        await fdl.clock.fastForward('00:12');
        expect(
          insp.filter((x) => x.status < 300),
          'Hoàn tác: không ghi kiểm phòng',
        ).toHaveLength(0);
        // Kiểm đạt
        await fdl.goto(`${STAFF_URL}/#/inspect/${vacant.id}`);
        await expect(legend).toBeVisible({ timeout: 20_000 });
        for (const box of await legend.getByRole('checkbox').all()) await box.check();
        if ((await pick.count()) > 0)
          await pick.first().setInputFiles(photo(PNG_16X16, 'kiem-phong.png'));
        await expect(pass).not.toHaveAttribute('aria-disabled', 'true', { timeout: 15_000 });
        await pass.click();
        await scanUndoToast(fdl, new RegExp(esc(vacant.roomNo)), 'H20-3-inspect-pass-toast');
        await pastUndo(fdl);
        const ins = await waitWrite(insp, 'recordInspection đạt', 201);
        expect(
          ((ins.request as Record<string, unknown>).items as Array<{ passed: boolean }>).every(
            (i) => i.passed,
          ),
        ).toBe(true);
        await expect.poll(() => roomStatusOf(request, vacant.id)).toBe('VI');
      } finally {
        await fdl.context().close();
      }
    });

    test('TC-X-085 (E) G8.2 K8 US-028/AC1, US-024/AC2: Desk H15 đơn đang ở – hộp Gia hạn (đêm trống, số tiền trên nút) và hộp Đổi phòng (lý do, căn mới, giá xem trước); không lưu; axe từng hộp', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-085');
      const D = virtualDay(realToday, 4);
      const st = await stay(request, D, '201', 2);
      const now = await at(request, D, '16:00');
      const page = await desk(browser, 'qa.fd', now);
      try {
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await expect(page.getByText(st.res.code).first()).toBeVisible({ timeout: 15_000 });
        // ── Gia hạn (15.2) ──
        await page.getByRole('button', { name: t('drawer.action.extend'), exact: true }).click();
        const ext = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('extend.title'))}`),
        });
        await expect(ext).toBeVisible({ timeout: 10_000 });
        await expect(ext.getByRole('checkbox').first(), 'đêm có thể gia hạn').toBeVisible({
          timeout: 15_000,
        });
        await expect(
          ext.getByRole('button', { name: new RegExp(`^${esc(stem('extend.submit'))}`) }),
        ).toBeVisible();
        await scan(page, test.info(), 'H15-extend');
        await ext.getByRole('button', { name: t('common.cancel'), exact: true }).click();
        await expect(ext).toBeHidden({ timeout: 10_000 });
        // ── Đổi phòng (15.4) ──
        await page
          .getByRole('button', { name: t('drawer.action.change_room'), exact: true })
          .click();
        const chg = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('stay.change_title'))}`),
        });
        await expect(chg).toBeVisible({ timeout: 10_000 });
        const target = chg.getByRole('group', { name: t('stay.new_room') });
        await expect(target).toBeVisible({ timeout: 15_000 });
        await scan(page, test.info(), 'H15-change-room');
        const previews = recordWrites(page, 'POST', /\/actions\/change-room$/);
        await chg.getByLabel(new RegExp(`^${esc(t('move.reason'))}`)).fill('Voi sen hong');
        const first = target.getByRole('radio').first();
        await expect(first, 'có căn mới để chọn').toBeVisible({ timeout: 15_000 });
        await first.check();
        await expect
          .poll(() => previews.length, { timeout: 15_000, message: 'giá xem trước của căn mới' })
          .toBeGreaterThan(0);
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
        await scan(page, test.info(), 'H15-change-room-preview');
      } finally {
        await page.context().close();
      }
    });

    test('TC-X-086 (E) G8.2 K8 US-036/AC1, BR-416-06: Desk H16 trả 19:00 khi đêm ngày đi đã có khách – bước 2 báo không thêm đêm được (phụ thu bằng 1 đêm), bước 3 hộp "Quản lý xác nhận phụ thu trả muộn" (lý do, miễn/giảm, tên quản lý, mật khẩu) có và không bật miễn/giảm; không Hoàn tất; axe bước 2, bước 3', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-086');
      const D = virtualDay(realToday, 3);
      const st = await stay(request, D, '203', 1);
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      // khách khác đến cùng căn tối ngày đi → đêm thêm không bán được
      await makeStay(request, c, fd, { room: st.room, arrival: addDays(D, 1), nights: 1 });
      const now = await at(request, addDays(D, 1), '19:00');
      const page = await desk(browser, 'qa.fd', now);
      try {
        await openCheckOut(page, st.res.id);
        await expect(page.getByRole('table', { name: t('checkout.step.minibar') })).toBeVisible({
          timeout: 15_000,
        });
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        await expect(
          page.getByText(t('checkout.extra_night_title')).first(),
          'bước 2: trả sau mốc → tính thêm 1 đêm',
        ).toBeVisible({ timeout: 15_000 });
        await expect(
          page.getByText(new RegExp(esc(stem('co.late_fee_as_night_body')))).first(),
          'đêm không bán được → phụ thu bằng 1 đêm, quản lý xác nhận',
        ).toBeVisible();
        await scan(page, test.info(), 'H16-2-late-fee-as-night');
        await page.getByRole('button', { name: t('co.go_bill') }).click();
        // ESC-031 (FE-A 26/10): bước 3 mở ở "Ghi phụ thu – quản lý xem lại" (số chỉ đọc, lý do, không mật khẩu);
        // hộp quản lý xác nhận tại quầy chỉ có khi MFA_ENFORCED = false (stack CI) – chọn nó để quét như trước.
        const review = page.getByRole('region', {
          name: new RegExp(`^${esc(stem('co.late_fee_pr_title'))}`),
        });
        await expect(review, 'bước 3: Ghi phụ thu – quản lý xem lại').toBeVisible({
          timeout: 15_000,
        });
        await expect(review.locator('input[type="password"]')).toHaveCount(0);
        await scan(page, test.info(), 'H16-3-post-review');
        await page.getByRole('button', { name: t('co.late_fee_mode_desk') }).click();
        const box = page.getByRole('region', {
          name: new RegExp(`^${esc(stem('co.late_fee_confirm_title'))}`),
        });
        await expect(box, 'bước 3: hộp quản lý xác nhận').toBeVisible({ timeout: 15_000 });
        await expect(
          box.getByLabel(new RegExp(`^${esc(t('co.late_fee_approver'))}`)),
        ).toBeVisible();
        await scan(page, test.info(), 'H16-3-mgr-confirm');
        await box.getByRole('switch', { name: t('co.late_fee_foc') }).click();
        await expect(box.getByLabel(new RegExp(`^${esc(t('foc.amount'))}`))).toBeVisible();
        await scan(page, test.info(), 'H16-3-mgr-confirm-foc');
      } finally {
        await page.context().close();
      }
    });
    test('TC-X-087 (E) G8.2 K8 US-109/AC1 BUG-R2-193: H23 guest-web 390×844 – mở form "Khăn, đồ dùng", ghi chú, KHÔNG cuộn: nút "Gửi yêu cầu" không bị thanh tab đáy che (WCAG 2.4.11), chạm vào giữa nút thì gửi yêu cầu (không nhảy sang tab khác) + axe', async ({
      browser,
      request,
    }) => {
      knownBug('BUG-R2-193');
      test.slow();
      needClock('TC-X-087');
      const { link, D } = await precondition('khách đang ở có link trang khách', async () => {
        const D = virtualDay(realToday, 3);
        const st = await stay(request, D, '202', 2);
        await at(request, D, '16:00');
        const fd = await sessionOrSkip(request, 'qa.fd');
        return { link: await guestLink(request, fd, st.res.id), D };
      });
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh',
      });
      const g = await ctx.newPage();
      try {
        await g.clock.setFixedTime(new Date(vnTime(D, '16:00')));
        const sends = recordWrites(g, 'POST', /\/v1\/guest\/requests$/);
        await g.goto(link.url);
        await expect(g.getByRole('heading', { name: /^Welcome to OTTIMO/ })).toBeVisible({
          timeout: 15_000,
        });
        await g.getByRole('button', { name: t('guest.tab.requests') }).click();
        await g.getByRole('button', { name: t('gw.req.new') }).click();
        await g.getByRole('button', { name: new RegExp(esc(t('guest.req.towels'))) }).click();
        await g
          .getByLabel(t('guest.req.note'))
          .fill(`Them khan K8 ${Date.now().toString(36).slice(-4)}`);
        await scan(g, test.info(), 'H23-request-form-top');
        const send = g.getByRole('button', { name: t('guest.req.send'), exact: true });
        const at0 = await send.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          if (y < 0 || y > window.innerHeight) return { x, y, state: 'offscreen', by: '' };
          const hit = document.elementFromPoint(x, y);
          return hit && (hit === el || el.contains(hit))
            ? { x, y, state: 'ok', by: '' }
            : {
                x,
                y,
                state: 'covered',
                by: `${hit?.tagName} "${(hit?.textContent ?? '').trim()}"`,
              };
        });
        test.info().annotations.push({ type: 'H23-send-button', description: JSON.stringify(at0) });
        expect(at0.state, `nút "Gửi yêu cầu" bị che bởi ${at0.by}`).not.toBe('covered');
        // khách chạm vào chỗ nhìn thấy nút (nếu nút còn dưới màn hình thì khách cuộn tới – như Playwright)
        if (at0.state === 'ok') await g.touchscreen.tap(at0.x, at0.y);
        else await send.tap();
        await waitWrite(sends, 'khách gửi khăn (chạm nút ở vị trí đầu)', 201);
      } finally {
        await ctx.close();
      }
    });
  },
);
