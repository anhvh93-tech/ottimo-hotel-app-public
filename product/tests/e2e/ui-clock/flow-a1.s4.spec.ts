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
// FOC trong chuỗi là FOC xin lúc nhận sớm, duyệt ở H17 (ORC 17/10). FOC ở bước trả phòng (S4-25): ca riêng
// TC-X-071 bên dưới.
// Tiền đọc từ br-examples.json: BR-107-01 / BR-305-01 (202, 7 đêm thứ Hai → 5.205.000, cọc 1.600.000, còn
// 3.605.000), BR-411-01 (nhận 11:00 → 30 % giá đêm đầu), BR-402-01 (FOC chờ duyệt trên phụ thu không phải thu để
// nhận phòng), BR-702-01 (minibar 100.000).
// TC: product/tests/test-cases/r1-main-flows.md – TC-X-070 (A1), TC-X-071 (FOC ở trả phòng, S4-25).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { propertyIdOf, session, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { precondition } from '../support/known-bugs.js';
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
  cleanRooms,
  fakeCccd,
  getFolio,
  inHouse,
  liveLines,
  namedGuest,
  needCleanRooms,
  preview,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';
import { settle } from '../ui/axe.js';
import { desk, openCheckOut, pwaCleanInspect } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { dialogs, recordWrites, vnd, waitWrite } from '../ui/write-steps.js';

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
      // chờ số cần thu theo giờ trả 11:00 rồi mới bấm (người thật nhìn số trước) – bấm sớm hơn chạm BUG-R2-141
      await openCheckOut(fd3, res.id);
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
      await pwaCleanInspect(browser, request, r202, departure);
      // propertyIdOf giữ cho câu hỏi "đơn của cơ sở nào" khi đọc log lỗi
      expect(propertyIdOf(fdB)).toBeTruthy();
    });

    test('TC-X-071 (E) A1 phần S4-25 US-007/AC1, US-036: H16 bước 2 trả muộn 14:00 → tick "đã báo khách" + "Xin miễn phụ thu" (Khách quen) → phụ thu và yêu cầu FOC đi cùng lệnh ghi phụ thu (setLateCheckout.requestFocForSurcharge), bill báo "đang chờ duyệt"', async ({
      browser,
      request,
    }) => {
      needClock('TC-X-071');
      test.slow();
      // S4-25 (FE-A 17/10): như H13 13.4 và H15 15.3 – phụ thu trả muộn chưa có trên folio ở bước 2, nên đề nghị FOC
      // đi CÙNG lệnh ghi phụ thu (B15 `requestFocForSurcharge`) khi bấm "Tiếp tục: Bill" – không phải requestFoc trên
      // một dòng đã có (nút "Mở form miễn phí / giảm giá" dành cho dòng đã ghi: Folio, tóm tắt H16).
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
      const lates = recordWrites(fdPage, 'POST', /\/reservations\/[^/]+\/actions\/late-checkout$/);
      await openCheckOut(fdPage, st.res.id); // BUG-R2-141: chờ số cần thu theo giờ 14:00 rồi mới bấm
      await fdPage.getByRole('button', { name: t('co.go_extras') }).click();
      await expect(
        fdPage.getByText(new RegExp(`^${esc(t('checkout.late_fee').split('{')[0]!)}`)),
      ).toBeVisible({ timeout: 15_000 });
      await fdPage.getByRole('checkbox', { name: new RegExp(esc(t('ci.told_guest'))) }).check();
      // S4-25: "Xin miễn phụ thu (gửi duyệt)" + lý do, ngay dưới ô "đã báo khách" (mẫu H13 13.4)
      await fdPage.getByRole('switch', { name: t('ci.ask_foc') }).click();
      await fdPage.getByRole('radio', { name: t('foc.r_regular') }).check();
      await fdPage.getByRole('button', { name: t('co.go_bill') }).click();
      const sent = await waitWrite(
        lates,
        'setLateCheckout kèm requestFocForSurcharge',
        200,
        (s) => s.request?.dryRun === false,
      );
      const fee = Number(sent.request?.expectedSurchargeVnd);
      expect(fee).toBeGreaterThan(0);
      expect(sent.request).toMatchObject({
        applySurcharge: true,
        requestFocForSurcharge: { kind: 'foc', amountVnd: fee, reasonCode: 'regular_vip' },
      });
      // bước 3 (bill) báo khoản miễn đang chờ duyệt – chặn "Hoàn tất" tới khi có kết quả (BR-426)
      await expect(
        fdPage.getByText(new RegExp(esc(t('co.foc_pending').split('{')[0]!))).first(),
      ).toBeVisible({
        timeout: 10_000,
      });
      const f = await getFolio(request, await session(request, 'qa.fd'), st.res.folioId!);
      const late = liveLines(f, 'late_checkout');
      expect(late.map((l) => l.amountVnd)).toEqual([fee]);
      expect(
        f.lines
          .filter((l) => l.relatedLineId === late[0]!.id && l.category === 'foc')
          .map((l) => [l.amountVnd, l.lineState]),
      ).toEqual([[-fee, 'pending_approval']]);
      await fdPage.context().close();
    });
  },
);
