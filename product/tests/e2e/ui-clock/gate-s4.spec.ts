// Trước cổng QC Sprint 4 (tuần Ổn định) – ca UI bấm thật trên Desk + guest-web với API thật, đồng hồ ảo (project
// desk-clock) cho mục CỔNG chưa có ca E2E (bảng sẵn sàng `rounds/round-02/qc/s4-gate-readiness.md` bảng 5, G8.2):
// - TC-L4-142: S4-27 lễ tân điều chỉnh dòng folio (giặt 3 → 2 kg, có lý do); quản lý đảo giao dịch thu (lễ tân không có
//   nút); S4-26 quản lý "Ghi công nợ" ở H16 bước 3 (lễ tân không có lựa chọn); S4-29 "Xem Phiếu thanh toán" của đơn
//   `checked_out` + axe.
// - TC-L4-143: S4-31 H03 thẻ "Khách đi" có khách trả phòng hôm nay + nút Trả phòng; sau B18 việc dọn trả phòng sinh từ
//   lưu trú hiện ở S10 Buồng phòng + axe H03, S10.
// - TC-X-077: H23 guest-web – khách đang ở gửi yêu cầu "Khăn, đồ dùng"; Desk H03 khối S30 "Yêu cầu của khách" thấy và
//   bấm "Đã nhận" → trang khách hiện "Đã nhận" + axe H23 (Yêu cầu, Thông tin), S30.
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, runJob, setClock } from '../support/clock.js';
import { SEED_PASSWORD, SESSION_COOKIE, STAFF_URL, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  createRoomBlock,
  getReservation,
  makeHold,
  room,
  s2Context,
  vnTime,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  addLine,
  checkIn,
  cleanRooms,
  getFolio,
  guestCall,
  guestLink,
  inHouse,
  makeStay,
  openGuest,
  p3,
  useVirtualDevice,
  virtualDay,
  type Stay,
} from '../support/s3.js';
import { knownBug } from '../support/known-bugs.js';
import { scan } from '../ui/axe.js';
import { desk, openCheckOut } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();
const st4 = (): string => Date.now().toString(36).slice(-4);

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

async function stay(
  request: APIRequestContext,
  D: string,
  roomNo: string,
  nights = 1,
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

test.describe(
  'Trước cổng S4 – ca UI bấm thật (bảng 5): S4-26, S4-27, S4-29, S4-31 H03/S10, H23 + S30',
  { tag: ['@ui', '@sprint4', '@clock', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L4-142 (E) [PO U5] S4-27 US-032/AC1, US-119/AC3; S4-26 US-038/AC3; S4-29 US-020/AC2: lễ tân điều chỉnh dòng F&B 3 → 2 ly có lý do (đảo + dòng mới, không xóa); quản lý đảo giao dịch thu có lý do (lễ tân không có nút); ngày đi lễ tân không có "Ghi công nợ", quản lý ghi công nợ có hạn + lý do → đơn checked_out còn nợ; "Xem Phiếu thanh toán" của đơn đã trả + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L4-142');
      const D = virtualDay(realToday, 3);
      const st = await stay(request, D, '203');
      let fd = await sessionOrSkip(request, 'qa.fd');
      const add = await addLine(request, fd, st.res.folioId!, {
        category: 'fnb',
        description: 'Nuoc cam 3 ly',
        quantity: 3,
        unitPriceVnd: 25000,
        serviceDate: D,
      });
      expect(add.status, `addFolioLine F&B: ${JSON.stringify(add.body).slice(0, 300)}`).toBe(201);
      // ── S4-27 (a) lễ tân điều chỉnh dòng giặt 3 → 2 ──
      await at(request, D, '18:00');
      let page: Page = await desk(browser, 'qa.fd', vnTime(D, '18:00'));
      try {
        const adj = recordWrites(page, 'POST', /\/lines\/[^/]+\/adjustments$/);
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await page
          .getByRole('button', { name: t('folio.open') })
          .first()
          .click();
        const fdlg = page.getByRole('dialog', { name: new RegExp(`^Folio · ${esc(st.res.code)}`) });
        await expect(fdlg).toBeVisible({ timeout: 15_000 });
        await expect(
          fdlg.getByRole('button', { name: t('pay.reverse') }),
          'lễ tân không có nút đảo giao dịch thu',
        ).toHaveCount(0);
        const row = fdlg.getByRole('row').filter({ hasText: /Nuoc cam/i });
        await row.getByRole('button', { name: t('folio.adjust') }).click();
        const box = page.getByRole('dialog', { name: /^Điều chỉnh:/ });
        const qty = box.getByLabel(new RegExp(`^${esc(t('folio.adjust_qty'))}`));
        await qty.fill('2');
        await box
          .getByLabel(new RegExp(`^${esc(t('folio.adjust_reason'))}`))
          .fill('Khach chi dung 2 ly');
        await scan(page, test.info(), 'H15-folio-adjust');
        await box.getByRole('button', { name: t('folio.adjust_submit') }).click();
        const w = await waitWrite(adj, 'adjustFolioLine (F&B 3 → 2)', 201);
        expect(w.request).toEqual({ newQuantity: 2, reason: 'Khach chi dung 2 ly' });
        await expect(page.getByText(t('folio.adjusted_toast')).first()).toBeVisible();
      } finally {
        await page.context().close();
      }
      fd = await sessionOrSkip(request, 'qa.fd');
      const f1 = await getFolio(request, fd, st.res.folioId!);
      const laundry = f1.lines.filter((l) => l.category === 'fnb');
      expect(
        laundry.map((l) => l.amountVnd).sort((a, b) => a - b),
        'giữ dòng gốc 75.000, thêm đảo −75.000 và dòng mới 50.000 (BR-008)',
      ).toEqual([-75000, 50000, 75000]);
      // ── S4-27 (b) quản lý đảo giao dịch thu (tiền phòng đã thu khi nhận phòng) ──
      const paid = (f1.payments ?? []).filter(
        (p) => p.type === 'charge' && p.status === 'succeeded',
      );
      expect(paid.length, 'có giao dịch thu để đảo').toBeGreaterThan(0);
      let reversedId = '';
      page = await desk(browser, 'qa.mgr', vnTime(D, '18:00'));
      try {
        const rev = recordWrites(page, 'POST', /\/payments\/[^/]+\/actions\/reverse$/);
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await page
          .getByRole('button', { name: t('folio.open') })
          .first()
          .click();
        const fdlg = page.getByRole('dialog', { name: new RegExp(`^Folio · ${esc(st.res.code)}`) });
        await expect(fdlg.getByText(t('folio.payments')).first()).toBeVisible({ timeout: 15_000 });
        const payRow = fdlg
          .getByRole('listitem')
          .filter({ has: page.getByRole('button', { name: t('pay.reverse') }) })
          .first();
        await payRow.getByRole('button', { name: t('pay.reverse') }).click();
        const box = page.getByRole('alertdialog', { name: /^Đảo giao dịch/ });
        await expect(box.getByRole('button', { name: t('pay.reverse') })).toBeDisabled();
        await box.getByLabel(/^Lý do đảo/).fill('Ghi nham giao dich');
        await scan(page, test.info(), 'H15-reverse-payment');
        await box.getByRole('button', { name: t('pay.reverse') }).click();
        const r = await waitWrite(rev, 'reversePayment', 200);
        reversedId = String((JSON.parse(r.body) as Json).id);
        expect(r.request).toMatchObject({ reason: 'Ghi nham giao dich' });
        await expect(fdlg.getByText(t('pay.reversed_chip')).first()).toBeVisible({
          timeout: 15_000,
        });
      } finally {
        await page.context().close();
      }
      const f2 = await getFolio(request, fd, st.res.folioId!);
      expect(
        (f2.payments ?? []).find((p) => p.id === reversedId)?.status,
        'giao dịch gốc còn, trạng thái reversed',
      ).toBe('reversed');
      // ── S4-26 ngày đi: lễ tân không có "Ghi công nợ"; quản lý ghi công nợ ──
      const d1 = addDays(D, 1);
      await at(request, d1, '10:00');
      page = await desk(browser, 'qa.fd', vnTime(d1, '10:00'));
      try {
        await openCheckOut(page, st.res.id);
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        await page.getByRole('button', { name: t('co.go_bill') }).click();
        await expect(page.getByText(t('bill.total')).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('switch', { name: t('co.debt_toggle') })).toHaveCount(0);
      } finally {
        await page.context().close();
      }
      const due = addDays(d1, 7);
      page = await desk(browser, 'qa.mgr', vnTime(d1, '10:00'));
      try {
        const outs = recordWrites(page, 'POST', /\/actions\/check-out$/);
        await openCheckOut(page, st.res.id);
        await page.getByRole('button', { name: t('co.go_extras') }).click();
        await page.getByRole('button', { name: t('co.go_bill') }).click();
        await expect(page.getByText(t('bill.total')).first()).toBeVisible({ timeout: 15_000 });
        const toggle = page.getByRole('switch', { name: t('co.debt_toggle') });
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        const complete = page.getByRole('button', { name: /^Ghi công nợ .* – hoàn tất$/ });
        await expect(complete).toHaveAttribute('aria-disabled', 'true');
        await expect(complete).toHaveAccessibleDescription(t('co.debt_needs'));
        await page.getByLabel(new RegExp(`^${esc(t('co.debt_due'))}`)).fill(due);
        await page
          .getByLabel(new RegExp(`^${esc(t('co.debt_reason'))}`))
          .fill('Cong ty thanh toan cuoi thang');
        await expect(complete).not.toHaveAttribute('aria-disabled', 'true');
        await scan(page, test.info(), 'H16-debt');
        await complete.click();
        const ask = page.getByRole('alertdialog');
        await expect(ask).toBeVisible();
        await ask.getByRole('button', { name: /^Ghi công nợ .* – hoàn tất$/ }).click();
        const out = await waitWrite(outs, 'checkOut ghi công nợ', 200);
        expect(JSON.stringify(out.request), 'lệnh B18 mang hạn công nợ').toContain(due);
        await expect(page.getByText(new RegExp(esc(stem('checkout.done')))).first()).toBeVisible({
          timeout: 20_000,
        });
      } finally {
        await page.context().close();
      }
      fd = await sessionOrSkip(request, 'qa.fd');
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('checked_out');
      const f3 = await getFolio(request, fd, st.res.folioId!);
      expect(f3.totals.balanceDueVnd, 'còn nợ sau khi ghi công nợ').toBeGreaterThan(0);
      // ── S4-29 "Xem Phiếu thanh toán" của đơn đã trả ──
      page = await desk(browser, 'qa.fd', vnTime(d1, '11:00'));
      try {
        await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
        await expect(
          page.getByRole('button', { name: t('drawer.action.check_out') }),
          'đơn đã trả không còn nút Trả phòng',
        ).toHaveCount(0);
        await page
          .getByRole('button', { name: t('co.preview_bill') })
          .first()
          .click();
        const bill = page.getByRole('dialog', { name: t('bill.title') });
        await expect(bill).toBeVisible({ timeout: 15_000 });
        const billNo = String((f3 as unknown as Json).billNo ?? '');
        if (billNo) await expect(bill.getByText(billNo).first()).toBeVisible();
        await expect(bill.getByRole('button', { name: t('co.print') })).toBeVisible();
        await expect(bill.getByRole('button', { name: t('co.bill_vien') })).toBeVisible();
        await scan(page, test.info(), 'H11-bill-checked-out');
      } finally {
        await page.context().close();
      }
    });

    test('TC-L4-143 (E) [PO U1] S4-31 US-031/AC1, US-054/AC3: ngày đi H03 thẻ "Khách đi" có khách và nút Trả phòng; sau B18 căn VD và việc dọn trả phòng (`checkout_clean`) sinh từ lưu trú hiện ở S10 Buồng phòng + axe H03, S10', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L4-143');
      const D = virtualDay(realToday, 3);
      const st = await stay(request, D, '202');
      const d1 = addDays(D, 1);
      await at(request, d1, '08:30');
      let page: Page = await desk(browser, 'qa.fd', vnTime(d1, '08:30'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const dep = page.locator('section[aria-labelledby="today-dep"]');
        await expect(dep).toBeVisible({ timeout: 15_000 });
        const item = dep.getByRole('listitem').filter({ hasText: st.res.code });
        await expect(item, 'khách trả phòng hôm nay trên H03').toBeVisible({ timeout: 15_000 });
        await expect(item.getByRole('link', { name: t('drawer.action.check_out') })).toBeVisible();
        await scan(page, test.info(), 'H03-today-departures');
      } finally {
        await page.context().close();
      }
      // B18 bằng API (đã thu đủ khi nhận phòng; minibar không dùng)
      const fd = await sessionOrSkip(request, 'qa.fd');
      const std = await call<{
        items: Array<{ itemId: string; standardQty: number }>;
        periodId?: string | null;
        roomId?: string;
      }>(request, 'GET', p3(EP3.getMinibarStandard, fd, { reservationId: st.res.id }), {
        session: fd,
        query: { roomId: st.room.id },
      });
      const mb = await call(
        request,
        'POST',
        p3(EP3.recordMinibarCheck, fd, { reservationId: st.res.id }),
        {
          session: fd,
          idempotencyKey: true,
          body: {
            mode: 'checkout',
            roomId: st.room.id,
            periodId: std.body.periodId ?? null,
            lines: std.body.items.map((i) => ({ itemId: i.itemId, remainingQty: i.standardQty })),
          },
        },
      );
      expect(mb.status, JSON.stringify(mb.body).slice(0, 200)).toBe(201);
      const cur = await getReservation(request, fd, st.res.id);
      const out = await call<Json & ProblemFields>(
        request,
        'POST',
        p3(EP3.checkOut, fd, { reservationId: st.res.id }),
        {
          session: fd,
          idempotencyKey: true,
          ifMatch: `"${cur.body.version}"`,
          body: { checkoutTime: '08:30' },
        },
      );
      expect(out.status, `B18: ${JSON.stringify(out.body).slice(0, 300)}`).toBe(200);
      const hk = await sessionOrSkip(request, 'qa.hk');
      const tasks = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listHkTasks, hk), {
        session: hk,
        query: { date: d1 },
      });
      expect(tasks.status).toBe(200);
      const clean = tasks.body.data.find(
        (x) => x.roomId === st.room.id && x.type === 'checkout_clean',
      );
      expect(clean, 'việc dọn trả phòng sinh từ lưu trú (US-031)').toBeTruthy();
      page = await desk(browser, 'qa.fd', vnTime(d1, '08:35'));
      try {
        await page.goto(`${WEB_URL}/housekeeping`);
        await expect(
          page.getByText(new RegExp(`\\b${st.room.roomNo}\\b`)).first(),
          'S10 có căn vừa trả',
        ).toBeVisible({ timeout: 15_000 });
        await scan(page, test.info(), 'S10-housekeeping-board');
      } finally {
        await page.context().close();
      }
    });

    test('TC-X-077 (E) [PO U4] US-108/AC1, US-109/AC1–AC2, US-110/AC1, US-112/AC1–AC2: H23 guest-web 390×844 tiếng Việt – tab Thông tin (giờ, "Chỉ đường" mở ghim bản đồ, không lộ số căn); gửi "Khăn, đồ dùng" (miễn phí) và "Dọn phòng thêm" (lần đầu miễn phí; sau khi đã dọn đầy đủ thì phải tick đồng ý phí); Desk H03 khối S30 nhận / từ chối; trạng thái trên trang khách đổi "Đã nhận" → "Hoàn thành" / "Không thực hiện được"; bản tiếng Anh; axe H23, S30', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-077');
      const D = virtualDay(realToday, 3);
      const st = await stay(request, D, '301', 2);
      await at(request, D, '16:00');
      let fd = await sessionOrSkip(request, 'qa.fd');
      const link = await guestLink(request, fd, st.res.id);
      const guestCtx = async (locale: string) => {
        const ctx = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
          locale,
          timezoneId: 'Asia/Ho_Chi_Minh',
        });
        const pg = await ctx.newPage();
        return { ctx, pg };
      };
      const hkDo = async (taskId: string, from: string, to: string) => {
        const hk = await sessionOrSkip(request, 'qa.hk');
        for (const [action, hhmm] of [
          ['start', from],
          ['complete', to],
        ] as const) {
          const r = await call(
            request,
            'POST',
            `/v1/properties/${propertyIdOf(hk)}/hk-tasks/${taskId}/actions/${action}`,
            { session: hk, idempotencyKey: true, body: { performedAt: vnTime(D, hhmm) } },
          );
          expect(r.status, `HK ${action} ${taskId}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(
            200,
          );
        }
      };
      const taskOf = async (requestId: string): Promise<string> => {
        fd = await sessionOrSkip(request, 'qa.fd');
        const l = await call<{ data: Json[] }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/guest-requests`,
          { session: fd },
        );
        expect(l.status, JSON.stringify(l.body).slice(0, 200)).toBe(200);
        const hit = l.body.data.find((x) => x.id === requestId);
        expect(hit?.hkTaskId, `việc buồng phòng của yêu cầu ${requestId}`).toBeTruthy();
        return String(hit!.hkTaskId);
      };
      const tag = `${st.res.code.slice(-4)}${Date.now().toString(36).slice(-3)}`;
      const towelsNote = `Them 2 khan tam ${tag}`;
      const cleanNote = `Don lai phong ${tag}`;
      const { ctx: gctx, pg: g } = await guestCtx('vi-VN');
      let towelsId = '';
      let clean1Id = '';
      let clean2Id = '';
      try {
        await g.clock.setFixedTime(new Date(vnTime(D, '16:00')));
        const sends = recordWrites(g, 'POST', /\/v1\/guest\/requests$/);
        await g.goto(link.url);
        await expect(g.getByRole('heading', { name: /^Welcome to OTTIMO/ })).toBeVisible({
          timeout: 15_000,
        });
        // ── Thông tin (US-108) ──
        await g.getByRole('button', { name: t('guest.tab.info') }).click();
        await expect(g.getByRole('heading', { name: t('guest.tab.info') })).toBeVisible();
        const dir = g.getByRole('link', { name: t('gw.directions') });
        await expect(dir).toBeVisible();
        expect(await dir.getAttribute('href'), 'Chỉ đường mở ghim bản đồ').toMatch(/^https:\/\//);
        expect(
          await g.locator('body').innerText(),
          'trang khách không lộ số căn (BR-012)',
        ).not.toMatch(new RegExp(`\\b${st.room.roomNo}\\b`));
        await scan(g, test.info(), 'H23-info-vi');
        // ── Yêu cầu: khăn (miễn phí) ──
        await g.getByRole('button', { name: t('guest.tab.requests') }).click();
        await g.getByRole('button', { name: t('gw.req.new') }).click();
        await g.getByRole('button', { name: new RegExp(esc(t('guest.req.towels'))) }).click();
        await g.getByLabel(t('guest.req.note')).fill(towelsNote);
        // nút gửi nằm dưới thanh tab dưới cùng tới khi cuộn (ghi ở bug-list 11.24) – quét như khách đã cuộn
        await g.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await scan(g, test.info(), 'H23-request-form');
        await g.getByRole('button', { name: t('guest.req.send'), exact: true }).click();
        const w1 = await waitWrite(sends, 'khách gửi khăn', 201);
        expect(w1.request).toEqual({ type: 'amenities', note: towelsNote });
        towelsId = String((JSON.parse(w1.body) as Json).id);
        // ── Dọn phòng thêm lần 1: hôm nay chưa dọn → miễn phí ──
        await g.getByRole('button', { name: t('gw.req.new') }).click();
        await g.getByRole('button', { name: new RegExp(`^${esc(t('guest.req.clean'))}`) }).click();
        await expect(g.getByRole('checkbox')).toHaveCount(0);
        await g.getByRole('button', { name: t('guest.req.send'), exact: true }).click();
        const w2 = await waitWrite(sends, 'dọn thêm lần 1 (miễn phí)', 201, (x) =>
          JSON.stringify(x.request).includes('extra_cleaning'),
        );
        expect(w2.request?.feeAccepted).toBeUndefined();
        clean1Id = String((JSON.parse(w2.body) as Json).id);
      } finally {
        await gctx.close();
      }
      // buồng phòng dọn xong lần 1 (lần dọn đầy đủ hôm nay)
      await at(request, D, '16:30');
      await hkDo(await taskOf(clean1Id), '16:10', '16:25');
      // ── Dọn phòng thêm lần 2: có phí, phải tick đồng ý ──
      const { ctx: g2ctx, pg: g2 } = await guestCtx('vi-VN');
      try {
        await g2.clock.setFixedTime(new Date(vnTime(D, '16:30')));
        const sends = recordWrites(g2, 'POST', /\/v1\/guest\/requests$/);
        await g2.goto(link.url);
        await g2.getByRole('button', { name: t('guest.tab.requests') }).click();
        await g2.getByRole('button', { name: t('gw.req.new') }).click();
        await g2.getByRole('button', { name: new RegExp(`^${esc(t('guest.req.clean'))}`) }).click();
        const fee = g2.getByRole('checkbox');
        await expect(fee, 'ô đồng ý phí (ESC-016 A)').toHaveCount(1);
        const send = g2.getByRole('button', { name: t('guest.req.send'), exact: true });
        await expect(send).toHaveAttribute('aria-disabled', 'true');
        await fee.check();
        await g2.getByLabel(t('guest.req.note')).fill(cleanNote);
        await send.click();
        const w3 = await waitWrite(sends, 'dọn thêm lần 2 (có phí)', 201);
        expect(w3.request).toMatchObject({ type: 'extra_cleaning', feeAccepted: true });
        clean2Id = String((JSON.parse(w3.body) as Json).id);
        expect(Number((JSON.parse(w3.body) as Json).feeVnd ?? 0), 'phí snapshot').toBeGreaterThan(
          0,
        );
      } finally {
        await g2ctx.close();
      }
      // ── Desk H03 – S30: nhận khăn, từ chối lần dọn có phí ──
      const page = await desk(browser, 'qa.fd', vnTime(D, '16:35'));
      try {
        const acts = recordWrites(page, 'POST', /\/guest-requests\/[^/]+\/actions\/[a-z_]+$/);
        await page.goto(`${WEB_URL}/today`);
        const s30 = page.locator('section[aria-labelledby="today-req"]');
        const rowsOf = (label: string) =>
          s30.getByRole('listitem').filter({ hasText: st.room.roomNo }).filter({ hasText: label });
        await expect(rowsOf(t('guest.req.towels')).first(), 'S30 có yêu cầu khăn').toBeVisible({
          timeout: 20_000,
        });
        await scan(page, test.info(), 'S30-guest-requests');
        await rowsOf(towelsNote)
          .first()
          .getByRole('button', { name: t('today.req_ack') })
          .click();
        const ack = await waitWrite(acts, 'nhận yêu cầu khăn', 200, (x) =>
          x.path.endsWith('/actions/acknowledge'),
        );
        expect(ack.path).toContain(towelsId);
        const paid = rowsOf(cleanNote);
        await paid
          .first()
          .getByRole('button', { name: t('guest.req.status.declined') })
          .click();
        const dlg = page.getByRole('dialog', {
          name: new RegExp(`^${esc(stem('req.desk.decline_title'))}`),
        });
        await expect(dlg).toBeVisible();
        await dlg.getByRole('button', { name: t('guest.req.status.declined') }).click();
        const dec = await waitWrite(acts, 'từ chối lần dọn có phí', 200, (x) =>
          x.path.endsWith('/actions/decline'),
        );
        expect(dec.path).toContain(clean2Id);
      } finally {
        await page.context().close();
      }
      // buồng phòng giao khăn xong → yêu cầu "Hoàn thành"
      await at(request, D, '16:50');
      await hkDo(await taskOf(towelsId), '16:40', '16:45');
      // ── trang khách: trạng thái đổi; bản tiếng Anh (US-112) ──
      const { ctx: g3ctx, pg: g3 } = await guestCtx('vi-VN');
      try {
        await g3.clock.setFixedTime(new Date(vnTime(D, '16:50')));
        await g3.goto(link.url);
        await g3.getByRole('button', { name: t('guest.tab.requests') }).click();
        const card = (label: string) => g3.getByRole('listitem').filter({ hasText: label }).first();
        await expect(card(t('guest.req.towels'))).toContainText(t('guest.req.status.done'), {
          timeout: 15_000,
        });
        await expect(
          g3
            .getByRole('listitem')
            .filter({ hasText: t('guest.req.status.declined') })
            .first(),
          'lần dọn có phí: Không thực hiện được',
        ).toBeVisible();
        await scan(g3, test.info(), 'H23-requests-status-vi');
      } finally {
        await g3ctx.close();
      }
      const { ctx: enCtx, pg: en } = await guestCtx('en-US');
      try {
        await en.clock.setFixedTime(new Date(vnTime(D, '16:55')));
        await en.goto(link.url);
        // hồ sơ người đứng tên có ngôn ngữ vi (ưu tiên 2 của P-S4-10) → khách tự đổi ở đầu trang (US-112 AC2)
        const langs = en
          .locator('select')
          .filter({ has: en.getByRole('option', { name: 'English' }) });
        await expect(langs.first()).toBeVisible({ timeout: 15_000 });
        await langs.first().selectOption({ label: 'English' });
        await expect(en.getByRole('button', { name: 'Requests' })).toBeVisible({ timeout: 15_000 });
        await en.getByRole('button', { name: 'Requests' }).click();
        await expect(en.getByText('Done').first()).toBeVisible({ timeout: 15_000 });
        await expect(en.getByText("Can't be done").first()).toBeVisible();
        await scan(en, test.info(), 'H23-requests-en');
        await en.getByRole('button', { name: 'Info' }).click();
        await expect(en.getByRole('link', { name: 'Directions' })).toBeVisible();
        await scan(en, test.info(), 'H23-info-en');
      } finally {
        await enCtx.close();
      }
    });

    test('TC-X-078 (E) [PO U1] US-010/AC1–AC2, US-011/AC1–AC3, US-012/AC1, AC3–AC5, US-030/AC2, US-031/AC1: H03 Hôm nay (FD, MGR) trên dữ liệu dựng sẵn – KPI, khách đến (Nhận phòng), khách đi (Trả phòng, "Có khách đến cùng căn hôm nay", "Đã trả lời" → 12:31 "Quá giờ trả phòng"), "Giữ chỗ chưa cọc", "Cần chú ý" (phiếu sửa Gấp; khai báo → bấm mở H14), nhận phòng ở máy khác → H03 tự cập nhật; 01:30 hôm sau vẫn ngày nghiệp vụ cũ + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-078');
      const D = virtualDay(realToday, 4);
      const c = await s2Context(request);
      // A: khách ở 202 đêm D−1, đi hôm nay D
      const A = await stay(request, addDays(D, -1), '202');
      // C: giữ chỗ chưa cọc tạo hôm qua, đến hôm nay (giữ chỗ không tạo được trong ngày đến – HOLD_NOT_ALLOWED_TODAY)
      const fdPrev = await sessionOrSkip(request, 'qa.fd');
      const { hold } = await makeHold(request, fdPrev, c, {
        rooms: [room(c, '301'), room(c, '302')],
        arrival: D,
        nights: 1,
        holdHours: 24,
      });
      await at(request, D, '07:00');
      let fd = await sessionOrSkip(request, 'qa.fd');
      // B: khách đến hôm nay 203; E: khách đến hôm nay vào đúng căn A trả (202)
      const B = await makeStay(request, c, fd, { room: room(c, '203'), arrival: D, nights: 1 });
      const E = await makeStay(request, c, fd, { room: room(c, '202'), arrival: D, nights: 1 });
      // OOO 401 hôm nay + phiếu sửa Gấp
      const mt = await sessionOrSkip(request, 'qa.mt');
      const blk = await createRoomBlock(request, mt, {
        roomId: room(c, '401').id,
        startDate: D,
        endDatePlanned: addDays(D, 1),
        reason: 'E2E U1 thay binh nong lanh',
      });
      expect(blk.status, JSON.stringify(blk.body).slice(0, 200)).toBe(201);
      const woTitle = `Ro nuoc tran ${st4()}`;
      const wo = await call<Json>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(mt)}/work-orders`,
        {
          session: mt,
          idempotencyKey: true,
          body: {
            roomId: room(c, '401').id,
            title: woTitle,
            description: 'Tran nha tam ro nuoc',
            severity: 'high',
            category: 'leak',
          },
        },
      );
      expect(wo.status, JSON.stringify(wo.body).slice(0, 200)).toBe(201);
      // A trả lời giờ trả 11:00 (US-030)
      fd = await sessionOrSkip(request, 'qa.fd');
      const conf = await call(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(fd)}/reservations/${A.res.id}/checkout-confirmations`,
        {
          session: fd,
          idempotencyKey: true,
          body: { channel: 'phone', replyType: 'time', confirmedTime: '11:00' },
        },
      );
      expect(conf.status, JSON.stringify(conf.body).slice(0, 200)).toBe(201);
      await at(request, D, '08:00');
      let page: Page = await desk(browser, 'qa.fd', vnTime(D, '08:00'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const arr = page.locator('section[aria-labelledby="today-arr"]');
        const dep = page.locator('section[aria-labelledby="today-dep"]');
        await expect(arr).toBeVisible({ timeout: 20_000 });
        const rowB = arr.getByRole('listitem').filter({ hasText: B.res.code });
        const rowE = arr.getByRole('listitem').filter({ hasText: E.res.code });
        await expect(rowB, 'khách đến B').toBeVisible({ timeout: 20_000 });
        await expect(rowE, 'khách đến E').toBeVisible();
        await expect(rowB.getByRole('link', { name: t('drawer.action.check_in') })).toBeVisible();
        const rowA = dep.getByRole('listitem').filter({ hasText: A.res.code });
        await expect(rowA, 'khách đi A').toBeVisible();
        await expect(rowA.getByRole('link', { name: t('drawer.action.check_out') })).toBeVisible();
        await expect(rowA).toContainText(t('today.same_room_arrival'));
        await expect(rowA).toContainText(t('today.dep_replied'));
        const holds = page.locator('section[aria-labelledby="today-holds"]');
        await expect(holds).toContainText(stem('fo.tabs.holds'));
        await expect(holds).toContainText(hold.code);
        const attn = page.locator('section[aria-labelledby="today-attn"]');
        await expect(attn, 'Cần chú ý có phiếu sửa Gấp').toContainText(/Phiếu sửa Gấp|Gấp/, {
          timeout: 20_000,
        });
        await scan(page, test.info(), 'H03-today-u1-fd');
        // nhận phòng B ở máy khác (API) → H03 tự cập nhật, không tải lại
        fd = await sessionOrSkip(request, 'qa.fd');
        const ci = await checkIn(request, fd, B.res.id);
        expect(ci.status, JSON.stringify(ci.body).slice(0, 200)).toBe(200);
        await expect(rowB, 'H03 cập nhật sau khi nhận phòng ở máy khác').toContainText(
          t('status.booking.in_house'),
          { timeout: 30_000 },
        );
        // "Cần chú ý" khai báo của B → bấm mở H14
        const reg = attn
          .getByRole('link')
          .filter({ hasText: /khai báo/i })
          .first();
        if (await reg.isVisible({ timeout: 10_000 }).catch(() => false)) {
          await reg.click();
          await expect(page, 'mở H14 Khai báo').toHaveURL(/\/registration/);
        } else {
          test.info().annotations.push({
            type: 'U1',
            description:
              'Cần chú ý chưa có mục khai báo lúc 08:00 (hạn còn xa) – bước bấm mở H14 không chạy',
          });
        }
      } finally {
        await page.context().close();
      }
      // 12:31: A quá giờ trả phòng (đã hẹn 11:00)
      await at(request, D, '12:31');
      page = await desk(browser, 'qa.mgr', vnTime(D, '12:31'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const rowA = page
          .locator('section[aria-labelledby="today-dep"]')
          .getByRole('listitem')
          .filter({ hasText: A.res.code });
        await expect(rowA, 'MGR thấy H03').toBeVisible({ timeout: 20_000 });
        await expect(rowA).toContainText(t('stay.card_overdue'));
        await scan(page, test.info(), 'H03-today-u1-mgr-1231');
      } finally {
        await page.context().close();
      }
      // 01:30 hôm sau: vẫn ngày nghiệp vụ D (BR-010)
      await at(request, addDays(D, 1), '01:30');
      page = await desk(browser, 'qa.fd', vnTime(addDays(D, 1), '01:30'));
      try {
        await page.goto(`${WEB_URL}/today`);
        const ddmm = `${D.slice(8, 10)}/${D.slice(5, 7)}`;
        await expect(
          page.getByText(new RegExp(esc(ddmm))).first(),
          'ngày nghiệp vụ D lúc 01:30',
        ).toBeVisible({
          timeout: 20_000,
        });
      } finally {
        await page.context().close();
      }
    });

    test('TC-X-079 (E) [PO U2] US-052/AC1–AC2, US-054/AC2, US-057/AC2: PWA H19 360×800 vai buồng phòng – không cuộn ngang; việc từ yêu cầu guest-web có chip "App khách"; "Các căn" đủ 10 căn, lọc "Cần dọn"; báo sự cố tick "Đề nghị khóa căn" → Desk S11 phiếu có chip "Đề nghị khóa" và nút "Khóa phòng theo đề nghị" + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-X-079');
      const D = virtualDay(realToday, 3);
      const st = await stay(request, D, '203', 2);
      await at(request, D, '16:00');
      const fd = await sessionOrSkip(request, 'qa.fd');
      // khách gửi "Khăn, đồ dùng" qua guest-web (API của trang khách)
      const link = await guestLink(request, fd, st.res.id);
      const gs = await openGuest(request, link.token);
      expect(gs.status, JSON.stringify(gs.body).slice(0, 200)).toBe(200);
      const tag = `Khan U2 ${Date.now().toString(36).slice(-4)}`;
      const gr = await guestCall(request, 'POST', '/v1/guest/requests', gs.cookie, {
        idempotencyKey: true,
        body: { type: 'amenities', note: tag },
      });
      expect(gr.status, JSON.stringify(gr.body).slice(0, 200)).toBe(201);
      const c = await s2Context(request);
      const free = room(c, '302');
      const ctx = await browser.newContext({
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        locale: 'vi-VN',
        timezoneId: 'Asia/Ho_Chi_Minh',
      });
      const hk = await ctx.newPage();
      let woCode = '';
      try {
        await hk.clock.install({ time: new Date(vnTime(D, '16:05')) });
        const hkS = await sessionOrSkip(request, 'qa.hk');
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
        const card = hk.getByRole('article').filter({ hasText: tag });
        await expect(card, 'việc từ yêu cầu của khách').toBeVisible({ timeout: 20_000 });
        await expect(card).toContainText(t('hk.source.guest_app'));
        const noHScroll = () =>
          hk.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          );
        expect(await noHScroll(), 'H19.1 không cuộn ngang ở 360 px').toBe(true);
        await scan(hk, test.info(), 'H19-1-tasks-360');
        await hk.goto(`${STAFF_URL}/#/rooms`);
        const rooms = hk.getByRole('link', { name: /^Căn \d{3}/ });
        await expect(rooms.first()).toBeVisible({ timeout: 20_000 });
        expect(await rooms.count(), '10 căn').toBe(10);
        expect(await noHScroll(), 'H19.2 không cuộn ngang ở 360 px').toBe(true);
        const dirty = hk.getByRole('button', {
          name: new RegExp(`^${esc(stem('hk.filter.dirty'))}`),
        });
        const n = Number(/\((\d+)\)/.exec(await dirty.innerText())?.[1] ?? 'NaN');
        await dirty.click();
        await expect(rooms).toHaveCount(n, { timeout: 10_000 });
        await scan(hk, test.info(), 'H19-2-rooms-dirty-360');
        // báo sự cố + đề nghị khóa căn (buồng phòng chỉ đề nghị – A86)
        const wos = recordWrites(hk, 'POST', /\/work-orders$/);
        await hk.goto(`${STAFF_URL}/#/report/${free.id}`);
        await hk.getByRole('button', { name: t('hk.wo.k.hot_water') }).click();
        await hk
          .getByLabel(new RegExp(`^${esc(t('hk.wo.desc'))}`))
          .fill(`Khong co nuoc nong ${tag}`);
        await hk
          .getByRole('checkbox', {
            name: new RegExp(`^${esc(t('hk.wo.block_request').split(' –')[0]!)}`),
          })
          .check();
        await hk.getByRole('button', { name: t('hk.wo.send') }).click();
        await hk.clock.fastForward('00:12');
        const w = await waitWrite(wos, 'createWorkOrder đề nghị khóa', 201);
        expect(w.request).toMatchObject({ roomId: free.id, blockRequested: true });
        expect(w.request).not.toHaveProperty('block');
        woCode = String((JSON.parse(w.body) as Json).code);
      } finally {
        await ctx.close();
      }
      const page = await desk(browser, 'qa.fd', vnTime(D, '16:20'));
      try {
        await page.goto(`${WEB_URL}/maintenance`);
        const row = page.getByRole('row').filter({ hasText: woCode }).first();
        await expect(row, 'S11 có phiếu vừa báo').toBeVisible({ timeout: 20_000 });
        await expect(row).toContainText(t('wo.chip.block_requested'));
        await row.getByRole('button').first().click();
        await expect(
          page.getByRole('button', { name: t('wo.block_by_request') }),
          'Desk có "Khóa phòng theo đề nghị"',
        ).toBeVisible({ timeout: 15_000 });
        await scan(page, test.info(), 'S11-wo-block-request');
      } finally {
        await page.context().close();
      }
    });

    test('TC-L6-056 (E) [PO U3] US-061/AC2, US-062/AC3: S11 Desk – (a) tạo phiếu + khóa căn trùng đơn tương lai → không khóa, "Khoảng khóa trùng 1 đơn đã đặt" kèm mã đơn; (b) phiếu Gấp ở căn có khách quá hạn phương án → drawer gợi ý đổi phòng / bù sự cố + link Sơ đồ phòng + axe', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('TC-L6-056');
      const D = virtualDay(realToday, 5);
      const st = await stay(request, D, '201', 2);
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      // đơn tương lai ở 302: đến D+2
      const fut = await makeStay(request, c, fd, {
        room: room(c, '302'),
        arrival: addDays(D, 2),
        nights: 1,
        doc: false,
      });
      // phiếu Gấp ở căn có khách (201), tạo lúc 14:00
      const mt = await sessionOrSkip(request, 'qa.mt');
      const wo = await call<Json>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(mt)}/work-orders`,
        {
          session: mt,
          idempotencyKey: true,
          body: {
            roomId: st.room.id,
            title: 'Mat nuoc nong',
            description: 'Khach bao khong co nuoc nong',
            severity: 'high',
            category: 'hot_water',
          },
        },
      );
      expect(wo.status, JSON.stringify(wo.body).slice(0, 200)).toBe(201);
      const woCode = String(wo.body.code);
      await at(request, D, '16:30');
      // J11 `work_order.sla` (mỗi nhịp): phiếu Gấp ở căn có khách quá hạn phương án → gợi ý cho lễ tân
      await runJob(request, 'work_order.sla');
      fd = await sessionOrSkip(request, 'qa.fd');
      const page = await desk(browser, 'qa.fd', vnTime(D, '16:30'));
      try {
        const creates = recordWrites(page, 'POST', /\/work-orders$/);
        await page.goto(`${WEB_URL}/maintenance`);
        // (a) khóa trùng đơn tương lai
        await page.getByRole('button', { name: t('wo.new_title'), exact: true }).click();
        const dlg = page.getByRole('dialog', { name: t('wo.new_title') });
        await dlg.getByLabel(t('hk.wo.room')).selectOption(room(c, '302').id);
        await dlg.getByLabel(t('wo.title_label')).fill('Bon cau ro nuoc');
        await dlg.getByLabel(t('hk.wo.desc')).fill('Bon cau ro nuoc, can thay van');
        await dlg.getByLabel(t('hk.wo.what')).selectOption('leak');
        await dlg.getByRole('switch', { name: t('hk.lock_request') }).click();
        await dlg.getByLabel(t('wo.block_done_planned')).fill(addDays(D, 3));
        const reason = dlg.getByLabel(t('wo.block_reason'));
        if (!(await reason.inputValue())) await reason.fill('Sua bon cau');
        await dlg.getByRole('button', { name: t('wo.create_and_block'), exact: true }).click();
        await waitWrite(creates, 'createWorkOrder kèm khóa trùng đơn', 409);
        await expect(
          dlg.getByText(t('wo.block_conflict_title').replace('{n}', '1')),
          'báo khoảng khóa trùng đơn',
        ).toBeVisible({ timeout: 15_000 });
        await expect(dlg.getByText(fut.res.code).first(), 'mã đơn trùng').toBeVisible();
        await scan(page, test.info(), 'S11-block-conflicts');
        await dlg.getByRole('button', { name: 'Hủy', exact: true }).click();
        const leave = page.getByRole('alertdialog');
        if (await leave.isVisible({ timeout: 3_000 }).catch(() => false)) {
          console.log('[U3] hộp hỏi rời form:', await leave.innerText());
          await leave.getByRole('button').last().click();
        }
        await expect(dlg).toBeHidden({ timeout: 10_000 });
        // (b) phiếu Gấp ở căn có khách, quá hạn phương án → gợi ý cho lễ tân
        const open = page.getByRole('button', { name: woCode, exact: true });
        await expect(open, `phiếu ${woCode} trong danh sách`).toBeVisible({ timeout: 20_000 });
        await open.click();
        const [pre, post] = t('wo.remedy_desk').split('{room}');
        const remedy = page.getByText(
          new RegExp(`${esc(pre!)}${esc(st.room.roomNo)}.*${esc(post!.trim())}`),
        );
        await expect(remedy, 'gợi ý đổi phòng / bù sự cố (US-062 AC3)').toBeVisible({
          timeout: 15_000,
        });
        await expect(page.getByRole('link', { name: t('today.open_rack') })).toBeVisible();
        await scan(page, test.info(), 'S11-wo-remedy');
      } finally {
        await page.context().close();
      }
    });

    test('TC-L3-085 (E) S4-33 US-025/AC6 BR-417 (2) H13 trước 06:00: đơn Trực tiếp 201 đến D, khách tới 04:40 ngày D (đêm D−1 trống) → H13 báo "Khách nhận trước 06:00 – thêm đêm …", tick đã báo khách, thu đủ trong B9, "Thêm đêm và nhận phòng" → đơn thành D−1…, `in_house` + axe', async ({
      browser,
      request,
    }) => {
      knownBug('BUG-R2-194');
      test.slow();
      needClock('TC-L3-085');
      const D = virtualDay(realToday, 3);
      await at(request, addDays(D, -1), '20:00');
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const st = await makeStay(request, c, fd, {
        room: room(c, '201'),
        arrival: D,
        nights: 1,
        adults: 1,
      });
      await at(request, D, '04:40');
      const page = await desk(browser, 'qa.fd', vnTime(D, '04:40'));
      try {
        const cis = recordWrites(page, 'POST', /\/actions\/check-in$/);
        await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-in`);
        const conditions = page.getByRole('region', { name: t('checkin.cond.title') });
        await expect(conditions).toBeVisible({ timeout: 15_000 });
        // bước 1 → 2 → 3 → 4 (Giao mã & hoàn tất): nội quy, giờ nhận & phụ thu, thu tiền trước khi giao mã
        for (const step of ['ci.go_verify', 'ci.go_register', 'ci.go_handover'])
          await page.getByRole('button', { name: t(step) }).click();
        await page
          .getByRole('checkbox', { name: new RegExp(t('ci.house_rules_sent').slice(0, 20)) })
          .check();
        const early = page.getByRole('switch', { name: t('ci.early_toggle') });
        await expect(early).toBeVisible({ timeout: 20_000 });
        if ((await early.getAttribute('aria-checked')) !== 'true') await early.click();
        await page.getByLabel(t('checkin.time')).fill('04:40');
        const dueRow = page.getByRole('row', { name: new RegExp(t('ci.due_title')) });
        await expect(dueRow, 'số cần thu gồm đêm trước').toBeVisible({ timeout: 15_000 });
        const due = Number(
          ((await dueRow.innerText()).match(/([\d.]+)\s*đ/)?.[1] ?? '0').replace(/\./g, ''),
        );
        expect(due, 'thu tiền đêm trước trong B9').toBeGreaterThan(0);
        const prior = page.getByText(new RegExp(`^${esc(stem('checkin.prior_night'))}`));
        await expect(prior, 'H13 báo thêm đêm trước').toBeVisible({ timeout: 15_000 });
        // BUG-R2-194: tiền đêm B9a nằm ở `priorNight.defaultRateVnd`; Desk lấy `earlyCheckinSurcharge.amountVnd` (0)
        await expect(prior, 'H13 nêu đúng tiền đêm trước (không "0 đ")').toContainText(
          `${due.toLocaleString('vi-VN')} đ`,
        );
        await page.getByRole('checkbox', { name: t('ci.told_guest') }).check({ timeout: 5_000 });
        await page.getByRole('button', { name: t('pay.cash'), exact: true }).click();
        await page.getByLabel(t('co.cash_received')).fill(String(due));
        await scan(page, test.info(), 'H13-prior-night');
        const submit = page.getByRole('button', { name: t('checkin.prior_night_submit') }).last();
        await expect(submit).not.toHaveAttribute('aria-disabled', 'true', { timeout: 15_000 });
        await submit.click();
        const dialog = page.getByRole('alertdialog');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button').last().click();
        const w = await waitWrite(cis, 'B9a thêm đêm trước', 200);
        expect(w.request).toMatchObject({ addPriorNight: true });
      } finally {
        await page.context().close();
      }
      fd = await sessionOrSkip(request, 'qa.fd');
      const after = (await getReservation(request, fd, st.res.id)).body;
      expect(after.status).toBe('in_house');
      expect(after.arrivalDate, 'đơn Trực tiếp thêm đêm D−1').toBe(addDays(D, -1));
    });
  },
);
