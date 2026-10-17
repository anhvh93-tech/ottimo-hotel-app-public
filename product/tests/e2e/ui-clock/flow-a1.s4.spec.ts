// E2E LIỀN MẠCH A1 – khách ngắn ngày trực tiếp (Sprint 4: T4, cổng G4 / ĐK-S3-7 / M6; s4-test-plan mục 5.1–5.2).
// Một ca, một chuỗi; MỌI bước ghi bấm thật trên giao diện tới API thật (Desk Chromium 1366×768 + PWA nhân viên cỡ
// điện thoại). Phần dựng dữ liệu không phải chủ đề (khách hàng, tài khoản nhận VietQR, buồng sạch) làm bằng API.
// KHÔNG test.fail giữa chuỗi: bước nào hỏng thì cả ca đỏ. Project desk-clock (MutableClock, tuần tự sau clock).
//   1. H12 (sale): tìm căn trống → báo giá 202, 7 đêm từ thứ Hai → Tạo giữ chỗ → VietQR cọc vẽ ngay.
//   2. H11 (lễ tân): Xác nhận cọc = chính giao dịch QR → `confirmed`.
//   3. H13 (lễ tân, ngày đến 11:00): nhập tay giấy tờ → nhận sớm + xin FOC phụ thu nhận sớm → thu tiền mặt còn lại
//      CÙNG lệnh nhận phòng (checkIn.payment) → `in_house`.
//   4. H17 (quản lý): duyệt FOC → phụ thu nhận sớm về 0.
//   5. H16 (lễ tân, ngày đi 11:00): minibar 2 bia + 1 snack + 2 nước → bill → VietQR → đã nhận → hoàn tất →
//      `checked_out`, folio `settled`, số bill F{yy}-nnnnnn, căn `VD` + việc "Dọn trả phòng".
//   6. PWA (buồng phòng): Bắt đầu dọn → Dọn xong (`VC`); PWA (lễ tân trưởng): Kiểm phòng theo checklist → `VI`.
// FOC trong chuỗi là FOC xin lúc nhận sớm, duyệt ở H17 (ORC 17/10): Desk chưa có nút xin FOC ở bước trả phòng –
// S4-25, ca riêng TC-X-071 bên dưới (knownBug ở dòng đầu ca).
// Tiền đọc từ br-examples.json: BR-107-01 / BR-305-01 (202, 7 đêm thứ Hai → 5.205.000, cọc 1.600.000, còn
// 3.605.000), BR-411-01 (nhận 11:00 → 30 % giá đêm đầu), BR-402-01 (FOC chờ duyệt trên phụ thu không phải thu để
// nhận phòng), BR-702-01 (minibar 100.000).
// TC: product/tests/test-cases/r1-main-flows.md – TC-X-070 (A1), TC-X-071 (FOC ở trả phòng, S4-25).
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';
import { call, propertyIdOf, session, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, SESSION_COOKIE, STAFF_URL, WEB_URL } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  oracleNum,
  room,
  s2Context,
  track,
  vnTime,
  weekday,
} from '../support/s2.js';
import { approvalsOf, ensureReceivingAccount } from '../support/s3-stay.js';
import {
  EP3,
  PNG_16X16,
  cleanRooms,
  fakeCccd,
  getFolio,
  inHouse,
  liveLines,
  namedGuest,
  needCleanRooms,
  p3,
  preview,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { settle } from '../ui/axe.js';
import { UI, signIn, t } from '../ui/helpers.js';
import { dialogs, photo, recordWrites, trustedDesk, vnd, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
/** "1.600.000 đ" – số tiền như Desk in (common.currency_vnd). */
const money = (n: number): string => tf('common.currency_vnd', { amount: vnd(n) });

let realToday = '';
test.describe.configure({ mode: 'default' });
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

/** Desk của một người: ngữ cảnh trình duyệt riêng, máy quầy được cấp, giờ trình duyệt = giờ ảo của stack. */
async function desk(browser: Browser, user: string, iso: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(iso));
  await trustedDesk(page);
  await signIn(page, user);
  return page;
}

/**
 * PWA nhân viên (apps/mobile) cỡ điện thoại. Giờ trình duyệt CHẠY từ giờ ảo (clock.install – hàng đợi PWA giữ mỗi
 * thao tác 10 giây để hoàn tác rồi mới gửi, `performedAt` phải gần giờ server: B-02).
 */
async function staffApp(
  browser: Browser,
  request: APIRequestContext,
  user: string,
  iso: string,
): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(iso) });
  const s = await session(request, user);
  await ctx.addCookies([
    { name: SESSION_COOKIE, value: s.token, url: STAFF_URL, httpOnly: true, sameSite: 'Lax' },
  ]);
  return page;
}

/** Qua hết thời gian hoàn tác của hàng đợi PWA (UNDO_MS 10 giây) để lệnh được gửi. */
async function pastUndo(page: Page): Promise<void> {
  await page.clock.fastForward('00:12');
}

const row = (scope: Page | Locator, re: RegExp) => scope.getByRole('row', { name: re }).first();

test.describe(
  'E2E liền mạch A1 – khách ngắn ngày trực tiếp: báo giá → VietQR cọc → nhận phòng → FOC có duyệt → trả phòng → PWA dọn, kiểm → VI',
  { tag: ['@ui', '@sprint4', '@clock', '@write', '@money', '@flow'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-X-070 (E) A1 US-084/US-086/US-120/US-043/US-025/US-007/US-035/US-053/US-055: H12 báo giá 202 7 đêm → giữ chỗ + VietQR cọc 1.600.000 → H11 xác nhận cọc → H13 nhận sớm 11:00 + FOC phụ thu, thu 3.605.000 trong B9 → H17 duyệt FOC → H16 minibar 100.000, VietQR, hoàn tất → PWA dọn, kiểm → VI', async ({
      browser,
      request,
    }) => {
      test.slow();
      test.setTimeout(4 * 60_000);
      needClock('TC-X-070');
      needCleanRooms('TC-X-070');
      const q107 = oracle('BR-107-01');
      const q305 = oracle('BR-305-01');
      const roomTotal = num(q107.expected.roomTotalVnd);
      const deposit = num(q305.expected.depositVnd);
      const remaining = num(q305.expected.remainingAtCheckinVnd);
      const minibarDue = oracleNum('BR-702-01', 'amountVnd');
      const earlyPct =
        oracleNum('BR-411-01', 'surchargeVnd') / num(oracle('BR-411-01').input.firstNightRateVnd);
      const firstNight = (q107.expected.discountedNightlyRatesVnd as number[])[0]!;
      const nights = num(q107.input.nights);

      // ── ngày ảo D (giữ D…D+17): giữ chỗ D, đến thứ Hai đầu tiên sau D, 7 đêm ──
      const D = virtualDay(realToday, 17);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '09:00')));
      cleanRooms();
      await ensureReceivingAccount(request, D);
      let arrival = addDays(D, 1);
      while (weekday(arrival) !== 1) arrival = addDays(arrival, 1);
      const departure = addDays(arrival, nights);
      const c = await s2Context(request);
      const r202 = room(c, String(q107.input.roomNo));
      const sal = await session(request, 'qa.sal');
      const guest = await namedGuest(request, sal);

      // ── 1. H12 (sale): tìm căn trống → báo giá → Tạo giữ chỗ → VietQR cọc ──
      const salPage = await desk(browser, 'qa.sal', vnTime(D, '09:00'));
      const quotes = recordWrites(salPage, 'POST', /\/quotes$/);
      const holds = recordWrites(salPage, 'POST', /\/quotes\/[^/]+\/actions\/create-hold$/);
      const qrs = recordWrites(salPage, 'POST', /\/folios\/[^/]+\/vietqr$/);
      await salPage.goto(`${WEB_URL}/quotes`);
      await salPage.getByLabel(t('sale.arrival')).fill(arrival);
      await salPage.getByLabel(t('sale.nights')).fill(String(nights));
      await salPage.getByLabel(t('occ.adults')).selectOption('1');
      await salPage.getByRole('button', { name: t('shell.search_label') }).click();
      const free = salPage
        .getByRole('listitem')
        .filter({ has: salPage.locator('.roomno', { hasText: new RegExp(`^${r202.roomNo}$`) }) });
      await expect(free, `căn ${r202.roomNo} trống ${arrival} → ${departure}`).toBeVisible({
        timeout: 15_000,
      });
      await free.getByRole('button', { name: t('sale.quote_title') }).click();
      const qd = salPage.getByRole('dialog').filter({ hasText: t('sale.save_quote') });
      await expect(qd).toBeVisible();
      const picker = qd.getByRole('combobox', { name: new RegExp(esc(t('booking.field.guest'))) });
      await picker.fill(guest.fullName);
      await qd
        .getByRole('option', { name: new RegExp(esc(guest.fullName)) })
        .first()
        .click();
      await expect(
        qd.getByText(new RegExp(vnd(roomTotal).replace(/\./g, '\\.'))).first(),
      ).toBeVisible({
        timeout: 15_000,
      });
      await qd.getByRole('button', { name: t('sale.save_quote') }).click();
      const savedQuote = await waitWrite(quotes, 'saveQuote', 201);
      const quote = JSON.parse(savedQuote.body) as Json;
      expect(num(quote.depositVnd), 'cọc của báo giá (BR-305-01)').toBe(deposit);
      // sau khi lưu, hộp chuyển sang bước gửi khách (cùng hộp, không còn nút Lưu báo giá)
      await salPage.getByRole('button', { name: t('sale.to_hold') }).click({ timeout: 15_000 });
      const hold = salPage.getByRole('dialog', { name: t('sale.hold_title') });
      await hold.getByRole('button', { name: t('sale.create_hold'), exact: true }).click();
      const created = await waitWrite(holds, 'createHoldFromQuote', 201);
      const res = JSON.parse(created.body) as { id: string; code: string; folioId: string };
      track('reservation', res.id);
      const qr = await waitWrite(qrs, 'createVietQr purpose=deposit', 201);
      expect(qr.request).toMatchObject({ purpose: 'deposit', amountVnd: deposit });
      const qrBody = JSON.parse(qr.body) as { transferContent: string; payment: { id: string } };
      const ref = res.code.replace(/-/g, '');
      expect(qrBody.transferContent, 'nội dung chuyển khoản = mã đơn bỏ gạch (BR-521)').toBe(ref);
      await expect(
        hold.getByRole('img', { name: tf('pay.qr_label', { amount: money(deposit), ref }) }),
      ).toBeVisible();
      const fd = await session(request, 'qa.fd');
      const held = await getReservation(request, fd, res.id);
      expect(held.body.status).toBe('hold');
      expect(held.body.totalRoomVnd, 'tiền phòng 7 đêm (BR-107-01)').toBe(roomTotal);
      await salPage.context().close();

      // ── 2. H11 (lễ tân): Xác nhận cọc = chính giao dịch QR ──
      const fd1 = await desk(browser, 'qa.fd', vnTime(D, '09:30'));
      const received = recordWrites(fd1, 'POST', /\/payments\/[^/]+\/actions\/confirm-received$/);
      const b4 = recordWrites(fd1, 'POST', /\/reservations\/[^/]+\/actions\/confirm-deposit$/);
      await fd1.goto(`${WEB_URL}/reservations/${res.id}`);
      await fd1
        .getByRole('button', { name: t('rsv.deposit_submit') })
        .first()
        .click();
      const dep = fd1.getByRole('dialog', { name: tf('rsv.deposit_title', { code: res.code }) });
      await expect(dep.getByText(/chờ khách chuyển/)).toBeVisible({ timeout: 15_000 });
      await dep.getByRole('button', { name: t('rsv.deposit_submit') }).click();
      const conf = await waitWrite(received, 'confirmPaymentReceived (QR cọc)', 200);
      expect(conf.path).toContain(qrBody.payment.id);
      const b4w = await waitWrite(b4, 'confirmDeposit existingPaymentId', 200);
      expect(b4w.request).toEqual({ existingPaymentId: qrBody.payment.id });
      const confirmed = await getReservation(request, fd, res.id);
      expect(confirmed.body.status).toBe('confirmed');
      expect(confirmed.body.depositPaidVnd).toBe(deposit);
      await fd1.context().close();

      // ── 3. H13 (lễ tân, ngày đến 11:00): giấy tờ → nhận sớm + xin FOC phụ thu → tiền mặt trong B9 ──
      const checkinTime = String(oracle('BR-411-01').input.checkinTime);
      await useVirtualDevice(request, await setClock(request, vnTime(arrival, checkinTime)));
      cleanRooms();
      const fdA = await session(request, 'qa.fd');
      const pv = await preview(request, fdA, res.id, checkinTime);
      expect(pv.status, JSON.stringify(pv.body).slice(0, 300)).toBe(200);
      const early = num((pv.body.earlyCheckinSurcharge as Json).amountVnd);
      expect(
        Math.abs(early - firstNight * earlyPct),
        `phụ thu nhận sớm 11:00 = 30 % × ${vnd(firstNight)} (BR-411-01)`,
      ).toBeLessThan(1000);
      expect(num(pv.body.balanceDueVnd), 'còn phải thu trước nhận phòng (BR-305-01)').toBe(
        remaining,
      );
      expect(num(pv.body.amountDueAtCheckinVnd)).toBe(remaining + early);
      const fd2 = await desk(browser, 'qa.fd', vnTime(arrival, checkinTime));
      const docs = recordWrites(fd2, 'POST', /\/registrations\/[^/]+\/documents$/);
      const checkins = recordWrites(fd2, 'POST', /\/reservations\/[^/]+\/actions\/check-in$/);
      await fd2.goto(`${WEB_URL}/reservations/${res.id}/check-in`);
      await expect(fd2.getByText(tf('checkin.docs.progress', { have: 0, need: 1 }))).toBeVisible({
        timeout: 15_000,
      });
      const docNo = fakeCccd();
      await fd2
        .getByRole('button', { name: t('checkin.docs.manual'), exact: true })
        .first()
        .click();
      const man = fd2.getByRole('dialog', { name: t('ci.manual_title') });
      await man.getByLabel(t('checkin.docs.field.doc_no')).fill(docNo);
      await man.getByLabel(t('checkin.docs.field.full_name')).fill(guest.fullName.toUpperCase());
      await man.getByLabel(t('checkin.docs.field.dob')).fill('1991-05-20');
      await man.getByRole('button', { name: t('reg.value.gender.female'), exact: true }).click();
      await man
        .getByLabel(t('checkin.docs.field.address'))
        .fill('12 Tran Hung Dao, Phuong 10, Da Lat, Lam Dong');
      await man.getByRole('button', { name: t('ci.manual_save') }).click();
      await waitWrite(docs, 'addGuestDocument (nhập tay)', 201);
      await expect(man).toBeHidden({ timeout: 10_000 });
      await fd2.getByRole('button', { name: t('ci.go_verify'), exact: true }).click();
      await fd2.getByRole('button', { name: t('ci.go_register'), exact: true }).click();
      await fd2.getByRole('button', { name: t('reg.later'), exact: true }).click();
      await fd2.getByRole('switch', { name: t('ci.early_toggle') }).click();
      await fd2.getByLabel(t('checkin.time')).fill(checkinTime);
      const dueRow = fd2.getByRole('row', { name: new RegExp(`^${esc(t('ci.due_title'))}`) });
      await expect(dueRow).toContainText(money(remaining + early), { timeout: 15_000 });
      await fd2.getByRole('checkbox', { name: t('ci.told_guest') }).check();
      await fd2.getByRole('switch', { name: t('ci.ask_foc') }).click();
      await fd2.getByRole('radio', { name: t('foc.r_regular') }).check();
      // BR-402-01: phần đang xin FOC trên khoản phát sinh không phải thu để nhận phòng
      await expect(dueRow).toContainText(money(remaining));
      await fd2.getByRole('button', { name: t('pay.cash'), exact: true }).click();
      await fd2.getByLabel(t('co.cash_received')).fill(String(remaining));
      await fd2.getByRole('checkbox', { name: new RegExp(esc(t('ci.house_rules_sent'))) }).check();
      await settle(fd2);
      await fd2
        .getByRole('button', { name: tf('ci.submit', { room: r202.roomNo }), exact: true })
        .click();
      const box = fd2.getByRole('alertdialog');
      await expect(box).toContainText(
        tf('ci.effect_pay', { amount: money(remaining), method: t('pay.cash') }),
      );
      await box.getByRole('button', { name: tf('ci.submit', { room: r202.roomNo }) }).click();
      const ci = await waitWrite(checkins, 'checkIn kèm payment + FOC phụ thu', 200);
      expect(ci.request).toMatchObject({
        checkinTime,
        applyEarlySurcharge: true,
        expectedSurchargeVnd: early,
        requestFocForSurcharge: { kind: 'foc', amountVnd: early, reasonCode: 'regular_vip' },
        payment: { type: 'charge', method: 'cash', amountVnd: remaining },
      });
      expect((await getReservation(request, fdA, res.id)).body.status).toBe('in_house');
      await fd2.context().close();

      // ── 4. H17 (quản lý): duyệt FOC phụ thu nhận sớm ──
      const mgr = await session(request, 'qa.mgr');
      const focs = (await approvalsOf(request, mgr, res.code)).filter(
        (a) => a.status === 'pending',
      );
      expect(focs, 'một yêu cầu FOC chờ duyệt của đơn').toHaveLength(1);
      const mgrPage = await desk(browser, 'qa.mgr', vnTime(arrival, '11:20'));
      const decisions = recordWrites(
        mgrPage,
        'POST',
        /\/approval-requests\/[^/]+\/actions\/approve$/,
      );
      await mgrPage.goto(`${WEB_URL}/approvals`);
      const card = mgrPage.getByRole('listitem').filter({ hasText: res.code });
      await expect(card).toBeVisible({ timeout: 15_000 });
      await card.getByRole('button', { name: t('approval.approve'), exact: true }).click();
      const ad = dialogs(mgrPage).filter({ has: mgrPage.getByLabel(t('approval.pin_label')) });
      await ad.getByLabel(t('approval.pin_label')).fill(SEED_PASSWORD!);
      await ad.getByRole('button', { name: t('approval.approve'), exact: true }).click();
      const okFoc = await waitWrite(decisions, 'approveRequest FOC phụ thu', 200);
      expect(okFoc.path).toContain(focs[0]!.id);
      const fAfterFoc = await getFolio(request, fdA, res.folioId);
      expect(fAfterFoc.totals.balanceDueVnd, 'FOC đã duyệt → không còn phải thu (BR-402-01)').toBe(
        0,
      );
      await mgrPage.context().close();

      // ── 5. H16 (lễ tân, ngày đi 11:00): minibar → phụ phí → bill → VietQR → hoàn tất ──
      await useVirtualDevice(request, await setClock(request, vnTime(departure, '11:00')));
      // tua đồng hồ → phiên cũ hết hạn nhàn rỗi: đọc lại bằng phiên mới (session() tự kiểm getMe)
      const fdB = await session(request, 'qa.fd');
      const fd3 = await desk(browser, 'qa.fd', vnTime(departure, '11:00'));
      const qr2 = recordWrites(fd3, 'POST', /\/folios\/[^/]+\/vietqr$/);
      const recv2 = recordWrites(fd3, 'POST', /\/payments\/[^/]+\/actions\/confirm-received$/);
      const outs = recordWrites(fd3, 'POST', /\/reservations\/[^/]+\/actions\/check-out$/);
      await fd3.goto(`${WEB_URL}/reservations/${res.id}/check-out`);
      const mb = fd3.getByRole('table', { name: t('checkout.step.minibar') });
      await expect(mb).toBeVisible({ timeout: 15_000 });
      const used = oracle('BR-702-01').input.used as Record<string, number>;
      const names: Record<string, RegExp> = { bia: /Bia/, snack: /Snack/, nuoc: /Nước suối/ };
      for (const [code, n] of Object.entries(used)) {
        const r = row(mb, names[code]!);
        for (let i = 0; i < n; i++) await r.getByRole('button', { name: t('rooms.dec') }).click();
      }
      await fd3.getByRole('button', { name: t('co.go_extras') }).click();
      await expect(fd3.getByText(t('checkout.departure_time')).first()).toBeVisible({
        timeout: 10_000,
      });
      await fd3.getByRole('button', { name: t('co.go_bill') }).click();
      await expect(fd3.getByText(t('bill.total')).first()).toBeVisible({ timeout: 10_000 });
      await expect
        .poll(async () => (await getFolio(request, fdB, res.folioId)).totals.balanceDueVnd, {
          timeout: 10_000,
          message: 'còn phải thu = minibar (BR-702-01)',
        })
        .toBe(minibarDue);
      await fd3
        .getByRole('button', { name: tf('pay.vietqr_create', { amount: money(minibarDue) }) })
        .click();
      const qrOut = await waitWrite(qr2, 'createVietQr (thu nốt khi trả phòng)', 201);
      expect(qrOut.request).toMatchObject({ amountVnd: minibarDue });
      await expect(fd3.getByRole('img', { name: /VietQR/ })).toBeVisible();
      await fd3
        .getByRole('button', { name: tf('pay.record', { amount: money(minibarDue) }) })
        .click();
      await waitWrite(recv2, 'confirmPaymentReceived (QR trả phòng)', 200);
      await expect(fd3.getByText(t('drawer.folio.settled')).first()).toBeVisible({
        timeout: 15_000,
      });
      await fd3
        .getByRole('button', { name: /hoàn tất/i })
        .last()
        .click();
      const done = fd3.getByRole('alertdialog');
      await expect(done).toBeVisible();
      await done
        .getByRole('button', { name: /hoàn tất|Trả phòng/i })
        .last()
        .click();
      await waitWrite(outs, 'checkOut', 200);
      await expect(
        fd3.getByText(new RegExp(esc(t('checkout.done').split('{')[0]!.trim()))).first(),
      ).toBeVisible({
        timeout: 15_000,
      });
      await fd3.context().close();
      expect((await getReservation(request, fdB, res.id)).body.status).toBe('checked_out');
      const fOut = await getFolio(request, fdB, res.folioId);
      expect(fOut.status).toBe('settled');
      expect(fOut.billNo, 'số bill BR-007').toMatch(/^F\d{2}-\d{6,}$/);
      expect(fOut.totals.balanceDueVnd).toBe(0);
      expect(liveLines(fOut, 'room').reduce((a, l) => a + l.amountVnd, 0)).toBe(roomTotal);
      expect(liveLines(fOut, 'minibar').reduce((a, l) => a + l.amountVnd, 0)).toBe(minibarDue);
      const paid = (fOut.payments ?? [])
        .filter((p) => p.status === 'succeeded')
        .reduce((a, p) => a + p.amountVnd, 0);
      expect(paid, 'đã thu = cọc + tiền mặt nhận phòng + VietQR trả phòng').toBe(
        deposit + remaining + minibarDue,
      );

      // ── 6. PWA: buồng phòng dọn (VD → CL → VC), lễ tân trưởng kiểm checklist (VC → VI) ──
      const statusOf = async () => {
        const s = await session(request, 'qa.fd');
        const r = await call<{ data: Array<{ roomId: string; status: string }> }>(
          request,
          'GET',
          p3(EP3.listRoomStatuses, s),
          { session: s },
        );
        return r.body.data.find((x) => x.roomId === r202.id)?.status;
      };
      await expect.poll(statusOf, { message: 'căn sau trả phòng' }).toBe('VD');
      // giờ PWA = giờ server: `performedAt` phải trong [giờ server − 24 giờ, + 5 phút] và sau `since` (B-02)
      await setClock(request, vnTime(departure, '11:30'));
      const hk = await staffApp(browser, request, 'qa.hk', vnTime(departure, '11:30'));
      const moves = recordWrites(hk, 'POST', /\/rooms\/[^/]+\/status-transitions$/);
      await hk.goto(`${STAFF_URL}/#/tasks`);
      // thẻ việc mang tên "Căn {số}, {tên}" (roomLabel); chữ trong thẻ dính liền số căn nên lọc theo tên thẻ
      const task = hk
        .getByRole('article', {
          name: new RegExp(`^${esc(tf('hk.room_title', { room: r202.roomNo }))}(,|$)`),
        })
        .filter({ has: hk.getByRole('button', { name: t('hk.action.start_cleaning') }) })
        .first();
      await expect(task, 'việc "Dọn trả phòng" của căn có ngay sau trả phòng').toBeVisible({
        timeout: 20_000,
      });
      await task.getByRole('button', { name: t('hk.action.start_cleaning') }).click();
      await pastUndo(hk);
      const start = await waitWrite(moves, 'transitionRoomStatus start_cleaning', 200);
      expect(start.request).toMatchObject({ event: 'start_cleaning', expectedFrom: 'VD' });
      await expect.poll(statusOf).toBe('CL');
      const finish = hk.getByRole('button', { name: t('hk.action.finish_cleaning') });
      if (!(await finish.isVisible().catch(() => false)))
        await hk.goto(`${STAFF_URL}/#/room/${r202.id}`);
      await finish.click();
      await pastUndo(hk);
      const fin = await waitWrite(moves, 'transitionRoomStatus finish_cleaning', 200, (s) =>
        JSON.stringify(s.request).includes('finish_cleaning'),
      );
      expect(fin.request).toMatchObject({ event: 'finish_cleaning', expectedFrom: 'CL' });
      await expect.poll(statusOf).toBe('VC');
      await hk.context().close();

      await setClock(request, vnTime(departure, '12:00'));
      const fdl = await staffApp(browser, request, 'qa.fdl', vnTime(departure, '12:00'));
      const insp = recordWrites(fdl, 'POST', /\/rooms\/[^/]+\/inspections$/);
      await fdl.goto(`${STAFF_URL}/#/inspect/${r202.id}`);
      const legend = fdl.getByRole('group', { name: t('hk.insp.legend') });
      await expect(legend).toBeVisible({ timeout: 20_000 });
      for (const box of await legend.getByRole('checkbox').all()) await box.check();
      const pick = fdl.locator('input[type="file"]');
      if ((await pick.count()) > 0)
        await pick.first().setInputFiles(photo(PNG_16X16, 'kiem-phong.png'));
      const pass = fdl.getByRole('button', { name: t('hk.insp.pass') });
      await expect(pass).not.toHaveAttribute('aria-disabled', 'true', { timeout: 15_000 });
      await pass.click();
      await pastUndo(fdl);
      const ins = await waitWrite(insp, 'recordInspection đạt', 201);
      expect(
        ((ins.request as Json).items as Array<{ passed: boolean }>).every((i) => i.passed),
        'mọi mục checklist đạt',
      ).toBe(true);
      await expect.poll(statusOf, { message: 'căn sẵn sàng sau kiểm đạt' }).toBe('VI');
      await fdl.context().close();
      // propertyIdOf giữ cho câu hỏi "đơn của cơ sở nào" khi đọc log lỗi
      expect(propertyIdOf(fdB)).toBeTruthy();
    });

    test('TC-X-071 (E) A1 phần S4-25 US-007/AC1: H16 bước 2 trả muộn 14:00 → "Mở form miễn phí" trên dòng phụ thu trả muộn → Gửi duyệt → requestFoc chờ duyệt, bill báo "đang chờ duyệt"', async ({
      browser,
      request,
    }) => {
      knownBug('S4-25');
      needClock('TC-X-071');
      test.slow();
      // Desk chưa có nút xin FOC ngoài bước nhận phòng (S4-25 gộp sau khi QA đóng 056/059/061 – ORC 17/10).
      // Ca đỏ đúng chỗ thiếu; phần dựng dữ liệu nằm trong precondition – hỏng ở đó thì ca phải đỏ thật.
      const { st, departure } = await precondition(
        'khách đang ở 1 đêm, ngày đi 14:00 (sau giờ ân hạn – phụ thu trả muộn BR-412-01)',
        async () => {
          const D = virtualDay(realToday, 3);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
          cleanRooms();
          const c = await s2Context(request);
          const st = await inHouse(request, c, await session(request, 'qa.fd'), {
            room: room(c, '203'),
            alternatives: c.rooms,
            arrival: D,
            nights: 1,
          });
          const departure = addDays(D, 1);
          await setClock(request, vnTime(departure, '14:00'));
          return { st, departure };
        },
      );
      const fdPage = await desk(browser, 'qa.fd', vnTime(departure, '14:00'));
      const focs = recordWrites(fdPage, 'POST', /\/folios\/[^/]+\/lines\/[^/]+\/foc$/);
      await fdPage.goto(`${WEB_URL}/reservations/${st.res.id}/check-out`);
      await fdPage.getByRole('button', { name: t('co.go_extras') }).click();
      await fdPage.getByRole('checkbox', { name: new RegExp(esc(t('ci.told_guest'))) }).check();
      // S4-25: form xin miễn phí ngay trên dòng phụ thu trả muộn (UXD: foc.open_form → foc.send)
      await fdPage.getByRole('button', { name: t('foc.open_form') }).click({ timeout: 10_000 });
      const form = dialogs(fdPage).filter({ hasText: t('foc.send') });
      await form.getByRole('radio', { name: t('foc.r_regular') }).check();
      await form.getByRole('button', { name: t('foc.send') }).click();
      const sent = await waitWrite(focs, 'requestFoc phụ thu trả muộn', 201);
      expect(sent.request).toMatchObject({ kind: 'foc', reasonCode: 'regular_vip' });
      await fdPage.getByRole('button', { name: t('co.go_bill') }).click();
      await expect(
        fdPage.getByText(new RegExp(esc(t('co.foc_pending').split('{')[0]!))),
      ).toBeVisible({
        timeout: 10_000,
      });
      await fdPage.context().close();
    });
  },
);
