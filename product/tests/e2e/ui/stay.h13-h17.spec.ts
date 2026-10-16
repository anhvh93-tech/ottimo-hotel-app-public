// E2E UI Sprint 3 – admin-web H13 (Nhận phòng), H14 (Giấy tờ & khai báo), H15 (lưu trú – drawer đơn Đang ở),
// H17 (Cần duyệt, Nhật ký tiền) trên Chromium 1366×768 với API thật (project desk-chromium, đồng hồ thật).
// H16 (Trả phòng 3 bước) cần đơn đi hôm nay đã nhận phòng hôm trước → ui-clock/checkout.h16.spec.ts (desk-clock).
// Dữ liệu chuẩn bị bằng API (đơn đến hôm nay, đã thu đủ, giấy tờ người đứng tên); nhận phòng làm trên giao diện; dọn
// dữ liệu: qa.mgr hoàn tác nhận phòng (B17, cùng ngày, chưa có dòng folio mới) rồi hủy đơn (afterEach) → căn trống lại.
// axe: 0 vi phạm critical/serious (ngưỡng ĐK-S2-4) trên từng bước/màn. Trình duyệt mang cookie thiết bị được cấp DS-E
// (qa-desk-01) như máy quầy thật – không có cookie thì H13/H14 chỉ hiện điều kiện + "máy chưa được cấp quyền".
import { expect, test, type Page } from '@playwright/test';
import { call, propertyIdOf, session, versionTag } from '../support/api.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  freeRoom,
  getReservation,
  minStayFor,
  s2Context,
} from '../support/s2.js';
import {
  DEVICE_COOKIE,
  deviceToken,
  getRegistration,
  makeStay,
  stackBusinessDate,
  type Stay,
} from '../support/s3.js';
import { go, scan } from './axe.js';
import { UI, signIn, t } from './helpers.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** Trusted-device cookie for the admin-web origin (Caddy proxies /v1 → api): the browser is the desk PC. */
async function asTrustedDesk(page: Page): Promise<void> {
  const token = deviceToken();
  test.skip(!token, 'môi trường: thiếu token thiết bị được cấp (seed DS-E .out)');
  await page
    .context()
    .addCookies([
      { name: DEVICE_COOKIE, value: token!, url: WEB_URL, httpOnly: true, sameSite: 'Lax' },
    ]);
}

/** Booking arriving TODAY (real clock) on a free room – paid in full, main document entered (API). */
async function arrivalToday(request: Page['request'], doc = true): Promise<Stay> {
  const fd = await session(request, 'qa.fd');
  const c = await s2Context(request);
  // ngày nghiệp vụ (đổi lúc 06:00 – BR-010), không phải ngày lịch: chạy lúc 00:00–05:59 vẫn đúng "đến hôm nay"
  const today = await stackBusinessDate(request);
  const nights = minStayFor(today);
  const rm = await freeRoom(request, fd, c.rooms, today, addDays(today, nights));
  // song song: căn vừa kiểm trống có thể bị ca khác lấy → thử các căn còn lại (makeStay alternatives)
  return makeStay(request, c, fd, {
    room: rm,
    alternatives: c.rooms,
    arrival: today,
    nights,
    doc: doc ? 'vn' : false,
  });
}

/** B17 undo (qa.mgr, same business day) so cleanupTracked can cancel the booking and free tonight's room. */
async function undoIfInHouse(request: Page['request'], id: string): Promise<void> {
  const mgr = await session(request, 'qa.mgr');
  const cur = await getReservation(request, mgr, id);
  if (cur.body.status !== 'in_house') return;
  await call(
    request,
    'POST',
    `/v1/properties/${propertyIdOf(mgr)}/reservations/${id}/actions/undo-check-in`,
    {
      session: mgr,
      idempotencyKey: true,
      ifMatch: versionTag(cur.body.version),
      body: { reason: 'E2E UI dọn dữ liệu' },
    },
  );
}

test.describe(
  'UI Sprint 3 – H13 nhận phòng, H14 giấy tờ, H15 lưu trú, H17 duyệt & nhật ký tiền',
  { tag: ['@ui', '@sprint3'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    const undo: string[] = [];
    test.afterEach(async ({ request }) => {
      for (const id of undo.splice(0)) await undoIfInHouse(request, id).catch(() => undefined);
      await cleanupTracked(request);
    });

    test('TC-L3-001 (E) H13 nhận phòng 4 bước trên máy quầy (qa.fd) → Đang ở; axe H13 từng bước + H15 drawer', async ({
      page,
      request,
    }, info) => {
      test.slow();
      const st = await arrivalToday(request);
      undo.push(st.res.id);
      await asTrustedDesk(page);
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-in`);
      const conditions = page.getByRole('region', { name: t('checkin.cond.title') });
      await expect(conditions).toBeVisible({ timeout: 15_000 });
      // điều kiện bằng chữ, không chỉ bằng màu: cả 6 điều kiện "Đã đủ"
      await expect(conditions.getByRole('listitem')).toHaveCount(6);
      await expect(conditions.getByText(/Còn thiếu/)).toHaveCount(0);
      await scan(page, info, 'H13-step1-conditions');
      // bước 1 → 2 → 3 (Khai báo: hạn theo giờ nhận thực tế) → 4
      await page.getByRole('button', { name: t('ci.go_verify') }).click();
      await page.getByRole('button', { name: t('ci.go_register') }).click();
      await expect(page.getByText(/hạn/).first()).toBeVisible();
      await scan(page, info, 'H13-step3-register');
      // nút sang bước 4 ở bước 3 dùng nhầm khóa ci.submit không tham số → hiện "{room}" (BUG-R2-032, P3)
      const toStep4 = page.getByRole('button', { name: /^Nhận phòng căn/ }).last();
      const label = (await toStep4.textContent()) ?? '';
      info.annotations.push({ type: 'observed', description: `nút bước 3: "${label.trim()}"` });
      await toStep4.click();
      // bước 4: nội quy bắt buộc; "đã giao mã/thẻ" không bắt buộc; không có ô mã cửa (R2 – US-128 dời R3)
      const rules = page.getByRole('checkbox', {
        name: new RegExp(t('ci.house_rules_sent').slice(0, 20)),
      });
      await expect(rules).toBeVisible();
      await expect(page.getByLabel(/mã cửa \(PIN\)|Mã cửa:/)).toHaveCount(0);
      const submit = page
        .getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }) })
        .last();
      await expect(submit).toHaveAttribute('aria-disabled', 'true');
      await scan(page, info, 'H13-step4-handover');
      await rules.check();
      await submit.click();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await scan(page, info, 'H13-confirm-dialog');
      await dialog.getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }) }).click();
      await expect(
        page.getByText(new RegExp(`Đã nhận phòng căn ${st.room.roomNo}`)).first(),
      ).toBeVisible({
        timeout: 15_000,
      });
      const fd = await session(request, 'qa.fd');
      const after = await getReservation(request, fd, st.res.id);
      expect(after.body.status).toBe('in_house');
      // H15 – drawer đơn Đang ở (gia hạn, trả muộn, đổi phòng, phát sinh, người đi cùng…)
      await go(page, `/reservations/${st.res.id}`);
      await expect(page.getByText(st.res.code).first()).toBeVisible({ timeout: 10_000 });
      await scan(page, info, 'H15-in-house-drawer');
      // OpenAPI 0.3.6 Reservation: houseRulesSentAt / cardsIssued sau nhận phòng – build chưa trả (BUG-R2-031)
      test.fail(
        true,
        'BUG-R2-031: Reservation thiếu houseRulesSentAt/cardsIssued/registrationId (0.3.6)',
      );
      expect(after.body.houseRulesSentAt, 'houseRulesSentAt').toBeTruthy();
      expect(after.body.cardsIssued, 'cardsIssued').toBe(1);
    });

    test('TC-L3-030 (E) H13 bước Giấy tờ hiện giấy tờ đã nhập của đơn (BUG-R2-031)', async ({
      page,
      request,
    }) => {
      const st = await arrivalToday(request);
      await asTrustedDesk(page);
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-in`);
      await expect(page.getByRole('region', { name: t('checkin.cond.title') })).toBeVisible({
        timeout: 15_000,
      });
      const fd = await session(request, 'qa.fd');
      const reg = await getRegistration(request, fd, st.regId);
      const last4 = reg.body.documents.find((d) => d.isMain)?.docNumberLast4 ?? '????';
      // BUG-R2-031: GET reservation không trả `registrationId` (OpenAPI 0.3.6) → CheckInPage không gọi
      // getRegistration, khung giấy tờ bước 1–2 "Đang tải…" mãi; lễ tân phải sang H14 để nhập/kiểm giấy tờ
      test.fail(
        true,
        'BUG-R2-031: Reservation thiếu registrationId → H13 bước Giấy tờ/Kiểm tra treo "Đang tải…"',
      );
      await expect(page.getByRole('main').getByText(new RegExp(last4)).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test('TC-X-040 H14 Giấy tờ & khai báo: danh sách + chi tiết (qa.fd, máy được cấp) + axe', async ({
      page,
      request,
    }, info) => {
      const st = await arrivalToday(request);
      await asTrustedDesk(page);
      await signIn(page, 'qa.fd');
      await go(page, '/registration');
      await scan(page, info, 'H14-list');
      await go(page, `/registration/${st.regId}`);
      // chỉ 4 số cuối giấy tờ (C3 – che), có nút xem đủ (step-up)
      await expect(page.getByText(/••\s?\d{4}|\*{2,}\d{4}|\d{4}$/).first()).toBeVisible({
        timeout: 10_000,
      });
      await scan(page, info, 'H14-detail');
    });

    test('TC-X-040 H14 máy chưa được cấp quyền (qa.owner): không xem/nhập giấy tờ C3', async ({
      page,
      request,
    }, info) => {
      const st = await arrivalToday(request);
      await signIn(page, 'qa.owner'); // không có cookie thiết bị
      await go(page, `/reservations/${st.res.id}/check-in`);
      await expect(
        page.getByText(new RegExp(t('ci.untrusted_note').slice(0, 25))).first(),
      ).toBeVisible({
        timeout: 10_000,
      });
      // không có nút nhận phòng trên máy chưa được cấp (rbac 8.7)
      await expect(page.getByRole('button', { name: /^Nhận phòng căn/ })).toHaveCount(0);
      await scan(page, info, 'H13-untrusted');
    });

    test('TC-X-040 H17 Cần duyệt (qa.mgr) + Nhật ký tiền 3 tab (qa.mgr, qa.fd) + axe', async ({
      page,
    }, info) => {
      await signIn(page, 'qa.mgr');
      await go(page, '/approvals');
      await scan(page, info, 'H17-approvals');
      await go(page, '/audit');
      await scan(page, info, 'H17-money-log');
      const tabs = page.getByRole('group', { name: t('nav.moneylog') }).getByRole('button');
      const n = await tabs.count();
      for (let i = 1; i < n; i++) {
        await tabs.nth(i).click();
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
        await scan(page, info, `H17-money-tab-${i + 1}`);
      }
      expect(n, 'Nhật ký tiền: Nhật ký / Chờ đối soát / Hoàn tiền').toBeGreaterThanOrEqual(3);
    });

    test('TC-X-040 giao diện tối: H13 + H17 (qa.fd)', async ({ page, request }, info) => {
      const st = await arrivalToday(request);
      await page.emulateMedia({ colorScheme: 'dark' });
      await asTrustedDesk(page);
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-in`);
      await expect(page.getByRole('region', { name: t('checkin.cond.title') })).toBeVisible({
        timeout: 15_000,
      });
      await scan(page, info, 'H13-dark');
      await go(page, '/audit');
      await scan(page, info, 'H17-money-log-dark');
    });
  },
);
