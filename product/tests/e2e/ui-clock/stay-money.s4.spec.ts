// E2E UI Sprint 4 – bước GHI của FE-A cần đồng hồ, BẤM THẬT tới API thật (QC-S3-09; sprint-4-plan mục 3 M1, M3, M4).
// Viết bởi FE-A (17/10), QA rà và đưa vào bộ chạy. Project desk-clock (Chromium 1366×768, MutableClock, tuần tự sau
// project clock): mỗi ca một ngày ảo riêng (virtualDay > hôm nay + 800), máy quầy ảo được cấp (useVirtualDevice).
// Dữ liệu chuẩn bị bằng API (không phải đối tượng kiểm) trong precondition(); bước đang kiểm bấm trên Desk, request
// trình duyệt gửi được ghi lại (ui/write-steps.ts) và phải 2xx; kết quả đọc lại bằng API; tiền đọc từ br-examples.json.
// Phần BE chưa gộp → knownBug(...) ở DÒNG ĐẦU ca (support/known-bugs.ts).
//   - S4-10 / TC-L3-079 (a)(b): H13 thu "Cần thu để nhận phòng" (BR-402-01) – tiền mặt cùng B9 (checkIn.payment) khi
//     xin FOC phụ thu; VietQR purpose=check_in xác nhận trước B9.
//   - FB-R2-UXD-FE-S4-01 / TC-L3-081: tiền mặt khách đưa thiếu → nút khóa, không gọi B9; đưa dư → ghi đúng số cần thu.
//   - FB-R2-UXD-FE-S4-02 / TC-L3-082: lễ tân + buồng VD + lý do → yêu cầu lễ tân trưởng (202) không kèm payment;
//     được duyệt → Tải lại → B9 kèm approvalRequestId + tiền mặt (0.3.7 bổ sung 1 (a)).
//   - S4-08 / TC-L2-102 (b): hộp No-show – dòng dịch vụ từ folio, giữ một dòng kèm lý do (markNoShow.retainLines).
//   - S4-39 / TC-L3-080 (a)(b): hộp Bỏ khỏi đơn hỏi ô "Khách n" (guestUploadPersonIndex); Gắn người bằng
//     GuestDocumentLink; Nhập tay trùng giấy tờ chờ → 409 DOCUMENT_UNCLAIMED_EXISTS mở đúng giấy tờ.
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { call, session, stackToday, versionTag, type StaffSession } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { GUEST_ORIGIN, SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  room,
  s2Context,
  vnTime,
  type Room,
} from '../support/s2.js';
import { patchReservation, simulateRoomStatus } from '../support/s3-checkin.js';
import { ensureReceivingAccount } from '../support/s3-stay.js';
import {
  EP3,
  PRIVACY_NOTICE,
  addLine,
  approve,
  callMultipart,
  cleanRooms,
  dev,
  fakeCccd,
  getFolio,
  getRegistration,
  guestCall,
  guestLink,
  liveLines,
  makeStay,
  namedGuest,
  needCleanRooms,
  openGuest,
  p3,
  png,
  useVirtualDevice,
  virtualDay,
  vnDoc,
  type GuestDocument,
  type Registration,
} from '../support/s3.js';
import { scan, settle } from '../ui/axe.js';
import { UI, signIn, t } from '../ui/helpers.js';
import { dialogs, recordWrites, trustedDesk, vnd, waitWrite } from '../ui/write-steps.js';

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
/** "1.500.000 đ" – số tiền như Desk in (common.currency_vnd). */
const money = (n: number): string => tf('common.currency_vnd', { amount: vnd(n) });

let realToday = '';
test.describe.configure({ mode: 'default' });
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

/** Ngày ảo D lúc hh:mm: đồng hồ server + máy quầy ảo + buồng sạch; trình duyệt cùng giờ. */
async function startDay(request: APIRequestContext, D: string, hhmm: string): Promise<void> {
  await useVirtualDevice(request, await setClock(request, vnTime(D, hhmm)));
  cleanRooms();
}
async function desk(page: Page, D: string, hhmm: string, user = 'qa.fd'): Promise<void> {
  await page.clock.setFixedTime(new Date(vnTime(D, hhmm)));
  await trustedDesk(page);
  await signIn(page, user);
}

// ───────────────────────── S4-10 – H13 thu khi nhận phòng (BUG-R2-038) ─────────────────────────

test.describe(
  'UI H13 – thu "Cần thu để nhận phòng" theo amountDueAtCheckinVnd (S4-10, BR-402-01)',
  { tag: ['@ui', '@sprint4', '@clock', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    /** BR-402-01: đơn 201, 3 đêm × 700.000 đến D, cọc 600.000 tiền mặt, có giấy tờ người đứng tên. */
    async function br40201(request: APIRequestContext, hhmm?: string) {
      const ex = oracle('BR-402-01');
      const D = virtualDay(realToday, 4);
      // hhmm: giờ mở ngày ảo (mặc định giờ nhận của ví dụ). Không tua đồng hồ lần hai sau khi đã đăng nhập –
      // phiên lấy trước khi tua hết hạn nhàn rỗi → 401 (QA 17/10, TC-L3-081/082).
      await startDay(request, D, hhmm ?? String(ex.input.checkinTime));
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      const rates = Object.values(ex.input.nightRatesVnd as Record<string, number>);
      const st = await makeStay(request, c, fd, {
        room: room(c, String(ex.input.roomNo)),
        arrival: D,
        nights: rates.length,
        pay: 'deposit',
        extra: {
          nightlyRates: rates.map((v, i) => ({ date: addDays(D, i), amountVnd: v })),
          initialPayment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: num(ex.input.depositPaidVnd),
          },
        },
      });
      return { ex, D, fd, st };
    }

    /** Bước 1–3 của H13 (giấy tờ đã có) → bước Giao mã & hoàn tất. */
    async function toStep4(page: Page, id: string) {
      await page.goto(`${WEB_URL}/reservations/${id}/check-in`);
      await page.getByRole('button', { name: t('ci.go_verify'), exact: true }).click();
      await page.getByRole('button', { name: t('ci.go_register'), exact: true }).click();
      await page.getByRole('button', { name: t('reg.later'), exact: true }).click();
    }
    /** Bước Giao mã & hoàn tất, bật nhận sớm ở giờ ví dụ. */
    async function toHandover(page: Page, id: string, time: string) {
      await toStep4(page, id);
      await page.getByRole('switch', { name: t('ci.early_toggle') }).click();
      await page.getByLabel(t('checkin.time')).fill(time);
    }
    const dueRow = (page: Page) =>
      page.getByRole('row', { name: new RegExp(`^${esc(t('ci.due_title'))}`) });

    test('TC-L3-079 (E) (a) US-025/AC3 H13 nhận sớm 11:00 + xin FOC phụ thu: "Cần thu" 1.710.000 → 1.500.000, tiền mặt ghi CÙNG lệnh nhận phòng (checkIn.payment), phụ thu ghi + FOC chờ duyệt (S4-10)', async ({
      page,
      request,
    }) => {
      knownBug('BUG-R2-038');
      needClock('TC-L3-079 (a)');
      test.slow();
      const { ex, D, fd, st } = await precondition(
        'đơn 201 3 đêm × 700.000 đến hôm nay, cọc 600.000, có giấy tờ',
        () => br40201(request),
      );
      const time = String(ex.input.checkinTime);
      const foc = ex.input.focRequest as Json;
      await desk(page, D, time);
      const checkins = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/check-in$/);
      await toHandover(page, st.res.id, time);
      await expect(dueRow(page)).toContainText(money(num(ex.expected.amountDueAtCheckinVnd)), {
        timeout: 15_000,
      });
      await expect(
        page.getByRole('row', { name: new RegExp(esc(t('ci.due_early'))) }),
      ).toContainText(`+${vnd(num(ex.input.earlySurchargeVnd))}`); // FE-S4-03: số trần có dấu ở dòng cộng
      await page.getByRole('checkbox', { name: t('ci.told_guest') }).check();
      await page.getByRole('switch', { name: t('ci.ask_foc') }).click();
      await page.getByRole('radio', { name: t('foc.r_regular') }).check();
      // BR-402 v0.3.6: phần đang xin FOC trên khoản phát sinh không phải thu để nhận phòng
      await expect(dueRow(page)).toContainText(money(num(ex.expected.suggestedPaymentVnd)));
      await page.getByRole('button', { name: t('pay.cash'), exact: true }).click();
      // FB-R2-UXD-FE-S4-01: số ghi thu là số lễ tân nhập thật – khách đưa đúng số cần thu
      await page.getByLabel(t('co.cash_received')).fill(String(ex.expected.suggestedPaymentVnd));
      await expect(
        page.getByText(
          tf('ci.pay_inline', { amount: money(num(ex.expected.suggestedPaymentVnd)) }),
        ),
      ).toBeVisible();
      await page.getByRole('checkbox', { name: new RegExp(esc(t('ci.house_rules_sent'))) }).check();
      await settle(page);
      await scan(page, test.info(), 'H13-pay-at-checkin');
      await page
        .getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }), exact: true })
        .click();
      const box = page.getByRole('alertdialog');
      await expect(box).toContainText(
        tf('ci.effect_pay', {
          amount: money(num(ex.expected.suggestedPaymentVnd)),
          method: t('pay.cash'),
        }),
      );
      await box.getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }) }).click();
      const w = await waitWrite(checkins, 'checkIn kèm payment', 200);
      expect(w.request).toMatchObject({
        checkinTime: time,
        applyEarlySurcharge: true,
        expectedSurchargeVnd: num(ex.input.earlySurchargeVnd),
        requestFocForSurcharge: {
          kind: 'foc',
          amountVnd: num(foc.requestedVnd),
          reasonCode: String(foc.reasonCode),
        },
        payment: {
          type: 'charge',
          method: 'cash',
          amountVnd: num(ex.expected.suggestedPaymentVnd),
        },
      });
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('in_house');
      const f = await getFolio(request, fd, st.res.folioId!);
      expect(liveLines(f, 'early_checkin').map((l) => l.amountVnd)).toEqual([
        num(ex.input.earlySurchargeVnd),
      ]);
      const cash = (f.payments ?? []).filter(
        (p) => p.method === 'cash' && p.type === 'charge' && p.status === 'succeeded',
      );
      expect(cash.map((p) => p.amountVnd)).toEqual([num(ex.expected.suggestedPaymentVnd)]);
    });

    test('TC-L3-079 (E) (b) US-025/AC3 H13 nhận sớm 11:00 không xin FOC: VietQR purpose=check_in đúng 1.710.000 (kèm giờ nhận), xác nhận đã nhận → còn thu 0 → nhận phòng không kèm payment (S4-10)', async ({
      page,
      request,
    }) => {
      knownBug('S4-10');
      needClock('TC-L3-079 (b)');
      test.slow();
      const { ex, D, fd, st } = await precondition(
        'đơn 201 3 đêm × 700.000 đến hôm nay, cọc 600.000, có giấy tờ; tài khoản nhận VietQR hiệu lực từ ngày ảo',
        async () => {
          const x = await br40201(request);
          // VietQR cần tài khoản nhận (US-120 AC2): chỉ đặt cho NGÀY ẢO – ngày thật phải giữ "chưa cấu hình" cho
          // TC-L4-065 (PAYMENT_NOT_CONFIGURED) chạy song song ở project api (QA rà 17/10)
          await ensureReceivingAccount(request, x.D);
          return x;
        },
      );
      const time = String(ex.input.checkinTime);
      const due = num(ex.expected.amountDueAtCheckinVnd);
      await desk(page, D, time);
      const qrs = recordWrites(page, 'POST', /\/folios\/[^/]+\/vietqr$/);
      const received = recordWrites(page, 'POST', /\/payments\/[^/]+\/actions\/confirm-received$/);
      const checkins = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/check-in$/);
      await toHandover(page, st.res.id, time);
      await expect(dueRow(page)).toContainText(money(due), { timeout: 15_000 });
      await page.getByRole('checkbox', { name: t('ci.told_guest') }).check();
      await page
        .getByRole('button', { name: tf('pay.vietqr_create', { amount: money(due) }) })
        .click();
      const qr = await waitWrite(qrs, 'createVietQr purpose=check_in', 201);
      expect(qr.request).toMatchObject({ amountVnd: due, purpose: 'check_in', checkinTime: time });
      await expect(page.getByRole('img', { name: /VietQR/ })).toBeVisible();
      await page.getByRole('button', { name: tf('pay.record', { amount: money(due) }) }).click();
      await waitWrite(received, 'confirmPaymentReceived (QR nhận phòng)', 200);
      await expect(dueRow(page)).toContainText(money(0), { timeout: 15_000 });
      await page.getByRole('checkbox', { name: new RegExp(esc(t('ci.house_rules_sent'))) }).check();
      await page
        .getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }), exact: true })
        .click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }) })
        .click();
      const w = await waitWrite(checkins, 'checkIn sau VietQR', 200);
      expect(w.request, 'tiền đã thu bằng QR – B9 không kèm payment').not.toHaveProperty('payment');
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('in_house');
      expect((await getFolio(request, fd, st.res.folioId!)).totals.balanceDueVnd).toBe(0);
    });

    test('TC-L3-081 (E) US-025/AC3 H13 tiền mặt khách đưa THIẾU (500.000 cho 1.500.000): nút Nhận phòng khóa, nói thiếu 1.000.000, không gọi checkIn; đưa 2.000.000 → thối 500.000, ghi đúng 1.500.000 cùng lệnh nhận phòng (FB-R2-UXD-FE-S4-01)', async ({
      page,
      request,
    }) => {
      needClock('TC-L3-081');
      test.slow();
      const { ex, D, fd, st } = await precondition(
        'đơn 201 3 đêm × 700.000 đến hôm nay, cọc 600.000, có giấy tờ; nhận phòng 14:30 (không nhận sớm)',
        () => br40201(request, '14:30'),
      );
      const due = num(ex.expected.balanceDueBeforeCheckinVnd);
      const short = 500_000;
      const given = 2_000_000;
      await desk(page, D, '14:30');
      const checkins = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/check-in$/);
      await toStep4(page, st.res.id);
      await expect(dueRow(page)).toContainText(money(due), { timeout: 15_000 });
      await page.getByRole('checkbox', { name: new RegExp(esc(t('ci.house_rules_sent'))) }).check();
      await page.getByRole('button', { name: t('pay.cash'), exact: true }).click();
      const submit = page.getByRole('button', {
        name: tf('ci.submit', { room: st.room.roomNo }),
        exact: true,
      });
      // chưa nhập tiền khách đưa → không tự coi là đưa đủ
      await expect(submit).toHaveAttribute('aria-disabled', 'true');
      await expect(page.getByText(t('ci.submit_pay_amount_needed'))).toBeVisible();
      await page.getByLabel(t('co.cash_received')).fill(String(short));
      const why = tf('ci.submit_cash_short', { amount: money(due - short) });
      await expect(page.getByText(why)).toBeVisible();
      await expect(submit).toHaveAttribute('aria-disabled', 'true');
      await expect(submit).toHaveAccessibleDescription(why);
      await settle(page);
      await scan(page, test.info(), 'H13-cash-short');
      // lễ tân vẫn bấm thử (Playwright coi aria-disabled là khóa → force: vẫn là cú bấm thật vào nút)
      await submit.click({ force: true });
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
      expect(checkins, 'tiền mặt chưa đủ → không gọi checkIn').toHaveLength(0);
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('confirmed');
      // khách đưa thêm: thối lại phần dư, ghi đúng số cần thu
      await page.getByLabel(t('co.cash_received')).fill(String(given));
      await expect(
        page.getByText(tf('co.change_due', { amount: money(given - due) })),
      ).toBeVisible();
      await expect(submit).not.toHaveAttribute('aria-disabled');
      await submit.click();
      const box = page.getByRole('alertdialog');
      await expect(box).toContainText(
        tf('ci.effect_pay', { amount: money(due), method: t('pay.cash') }),
      );
      await box.getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }) }).click();
      const w = await waitWrite(checkins, 'checkIn kèm payment tiền mặt', 200);
      expect(w.request?.payment).toEqual({ type: 'charge', method: 'cash', amountVnd: due });
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('in_house');
      const f = await getFolio(request, fd, st.res.folioId!);
      const cash = (f.payments ?? []).filter(
        (p) => p.method === 'cash' && p.type === 'charge' && p.status === 'succeeded',
      );
      expect(cash.map((p) => p.amountVnd)).toEqual([due]);
      expect(f.totals.balanceDueVnd).toBe(0);
    });

    test('TC-L3-082 (E) US-025/AC2 H13 lễ tân + buồng chưa dọn (VD) + lý do, còn phải thu 1.500.000: (a) gửi được yêu cầu lễ tân trưởng (202) KHÔNG kèm payment – chỉ còn VietQR, không ghi tiền; (b) lễ tân trưởng duyệt → Tải lại → nhận phòng kèm approvalRequestId + tiền mặt 1.500.000 (FB-R2-UXD-FE-S4-02, ARC 0.3.7 bổ sung 1)', async ({
      page,
      request,
    }) => {
      needClock('TC-L3-082');
      needCleanRooms('TC-L3-082');
      test.slow();
      const { ex, D, fd, st } = await precondition(
        'đơn 201 3 đêm × 700.000 đến hôm nay, cọc 600.000, có giấy tờ; 14:30; buồng 201 = VD',
        async () => {
          const x = await br40201(request, '14:30');
          simulateRoomStatus(x.st.room.id, 'VD');
          return x;
        },
      );
      const due = num(ex.expected.balanceDueBeforeCheckinVnd);
      const before = (await getFolio(request, fd, st.res.folioId!)).payments ?? [];
      await desk(page, D, '14:30');
      const checkins = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/check-in$/);
      await toStep4(page, st.res.id);
      await expect(dueRow(page)).toContainText(money(due), { timeout: 15_000 });
      const reason = 'Khach cho khong duoc, buong dang don';
      // nhãn "Lý do *" (dấu * của ô bắt buộc nằm trong <label>) – khớp đầu chuỗi, không exact
      await page.getByLabel(new RegExp(`^${esc(t('ci.reason'))}(\\s*\\*)?$`)).fill(reason);
      // nhánh 202 không ghi tiền: không còn tiền mặt / chuyển khoản / POS, không hứa "ghi cùng lúc"
      await expect(page.getByText(tf('ci.pay_after_lead', { amount: money(due) }))).toBeVisible();
      await expect(page.getByRole('button', { name: t('pay.cash'), exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: t('pay.card'), exact: true })).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: tf('pay.vietqr_create', { amount: money(due) }) }),
      ).toBeVisible();
      await page.getByRole('checkbox', { name: new RegExp(esc(t('ci.house_rules_sent'))) }).check();
      const send = page.getByRole('button', { name: t('ci.send_lead'), exact: true });
      await expect(send, 'còn phải thu không chặn yêu cầu lễ tân trưởng').not.toHaveAttribute(
        'aria-disabled',
      );
      await settle(page);
      await scan(page, test.info(), 'H13-request-lead-no-payment');
      await send.click();
      const box = page.getByRole('alertdialog');
      await expect(box).toContainText(t('ci.request_effect'));
      // không có dòng "Ghi khoản thu …" trong hộp xác nhận
      await expect(box).not.toContainText(t('ci.effect_pay').split('{')[0]!.trim());
      await box.getByRole('button', { name: t('ci.send_lead') }).click();
      const w = await waitWrite(checkins, 'checkIn → yêu cầu lễ tân trưởng', 202);
      expect(w.request).toMatchObject({ roomNotReadyOverride: { reason } });
      expect(w.request, 'nhánh 202 không kèm payment (422 NOT_ALLOWED)').not.toHaveProperty(
        'payment',
      );
      expect(JSON.parse(w.body)).toMatchObject({
        type: 'checkin_room_not_ready',
        status: 'pending',
      });
      await expect(page.getByText(t('ci.waiting_lead')).first()).toBeVisible();
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('confirmed');
      const after = (await getFolio(request, fd, st.res.folioId!)).payments ?? [];
      expect(
        after.map((p) => p.id),
        'không ghi khoản thu nào',
      ).toEqual(before.map((p) => p.id));

      // (b) lễ tân trưởng duyệt (màn Cần duyệt – không phải đối tượng kiểm) → lễ tân Tải lại, thu tiền, nhận phòng
      const approvalId = String((JSON.parse(w.body) as Json).id);
      const fdl = await session(request, 'qa.fdl');
      const ok = await approve(request, fdl, approvalId, 'E2E duyet nhan phong buong chua don');
      expect(ok.status, `approveRequest: ${JSON.stringify(ok.body)}`).toBe(200);
      await page
        .locator('.alert')
        .filter({ hasText: t('ci.waiting_lead') })
        .getByRole('button', { name: t('common.reload'), exact: true })
        .click();
      await expect(
        page.getByText(tf('ci.room_approved', { name: fdl.me.displayName })),
      ).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: t('pay.cash'), exact: true }).click();
      await page.getByLabel(t('co.cash_received')).fill(String(due));
      const submit = page.getByRole('button', {
        name: tf('ci.submit', { room: st.room.roomNo }),
        exact: true,
      });
      await expect(submit).not.toHaveAttribute('aria-disabled');
      await submit.click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: tf('ci.submit', { room: st.room.roomNo }) })
        .click();
      const done = await waitWrite(checkins, 'checkIn sau khi được duyệt', 200);
      expect(done.request).toMatchObject({
        roomNotReadyOverride: { approvalRequestId: approvalId },
        payment: { type: 'charge', method: 'cash', amountVnd: due },
      });
      expect((await getReservation(request, fd, st.res.id)).body.status).toBe('in_house');
      const f = await getFolio(request, fd, st.res.folioId!);
      const cash = (f.payments ?? []).filter(
        (p) => p.method === 'cash' && p.type === 'charge' && p.status === 'succeeded',
      );
      expect(cash.map((p) => p.amountVnd)).toEqual([due]);
    });
  },
);

// ───────────────────────── S4-08 – No-show giữ dòng dịch vụ (BR-309) ─────────────────────────

test.describe(
  'UI H11 – No-show: dòng dịch vụ tự đảo trừ dòng lễ tân giữ kèm lý do (S4-08)',
  { tag: ['@ui', '@sprint4', '@clock', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('TC-L2-102 (E) (b) US-136/AC2 H11 no-show 23:30 có 2 dòng dịch vụ: hộp liệt kê từ folio, giữ dòng đã phát sinh chi phí kèm lý do → markNoShow.retainLines; dòng kia bị đảo (S4-08)', async ({
      page,
      request,
    }) => {
      // S4-08 đã xanh trên cây làm việc 17/10 (QA chạy lại) – ca phải đạt; dòng S4-08 còn trong OPEN để patch B-6 áp đúng ngữ cảnh
      needClock('TC-L2-102 (b)');
      test.slow();
      const { D, st, ids } = await precondition(
        'đơn Trực tiếp đến hôm nay đã cọc + 2 dòng dịch vụ',
        async () => {
          const D = virtualDay(realToday, 3);
          await startDay(request, D, '10:00');
          const c = await s2Context(request);
          const fd = await session(request, 'qa.fd');
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            alternatives: c.rooms,
            arrival: D,
            nights: 2,
            pay: 'deposit',
            doc: false,
          });
          const cat = await call<{ data: Json[] }>(request, 'GET', p3(EP3.getChargeCatalog, fd), {
            session: fd,
          });
          expect(cat.status).toBe(200);
          const svc = cat.body.data.filter(
            (x) =>
              ['service_fee', 'fnb', 'laundry', 'cleaning'].includes(String(x.category)) &&
              x.evidenceRequired !== true,
          );
          expect(svc.length).toBeGreaterThan(0);
          for (const [i, item] of [svc[0]!, svc[1] ?? svc[0]!].entries()) {
            const l = await addLine(request, fd, st.res.folioId!, {
              chargeCode: item.code,
              quantity: 1,
              note: i === 0 ? 'Dua don san bay' : 'Bua toi dat truoc',
            });
            expect(l.status, `addFolioLine: ${JSON.stringify(l.body)}`).toBe(201);
          }
          const f = await getFolio(request, fd, st.res.folioId!);
          const ids = f.lines
            .filter((l) => l.category !== 'room' && l.lineState === 'posted')
            .map((l) => l.id);
          expect(ids.length).toBeGreaterThanOrEqual(2);
          // mốc đánh dấu no-show (BR-311) đã qua
          await useVirtualDevice(request, await setClock(request, vnTime(D, '23:30')));
          return { D, st, ids };
        },
      );
      await desk(page, D, '23:30');
      const marks = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/mark-no-show$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
      await page.getByRole('button', { name: t('drawer.action.no_show'), exact: true }).click();
      const box = page.getByRole('alertdialog');
      const group = box.getByRole('group', { name: t('svc.title') });
      await expect(group).toBeVisible({ timeout: 15_000 });
      await settle(page);
      await scan(page, test.info(), 'H11-no-show-service-lines');
      await group.getByRole('checkbox').first().check();
      const reason = 'Xe da ra san bay';
      await group.getByLabel(t('svc.reason')).fill(reason);
      await box.getByLabel(t('noshow.contact_note')).selectOption('rsv.contact_noanswer');
      await box.getByRole('button', { name: t('noshow.confirm'), exact: true }).click();
      const w = await waitWrite(marks, 'markNoShow kèm retainLines', 200);
      const retain = (w.request?.retainLines ?? []) as Array<{ lineId: string; reason: string }>;
      expect(retain).toHaveLength(1);
      expect(retain[0]!.reason).toBe(reason);
      expect(ids).toContain(retain[0]!.lineId);
      const fd = await session(request, 'qa.fd');
      const live = liveLines(await getFolio(request, fd, st.res.folioId!)).map((l) => l.id);
      expect(live, 'dòng giữ còn').toContain(retain[0]!.lineId);
      for (const id of ids.filter((x) => x !== retain[0]!.lineId))
        expect(live, `dòng ${id} không giữ → đảo (BR-309)`).not.toContain(id);
    });
  },
);

// ───────────────────────── S4-39 – bỏ người khỏi đoàn, gắn người (BUG-R2-085) ─────────────────────────

type Doc = GuestDocument & {
  captureMethod?: string;
  personIndex?: number;
  unclaimedUntil?: string | null;
  partyMemberId?: string;
};
const docsOf = (reg: Registration): Doc[] => reg.documents as Doc[];

async function regNow(request: APIRequestContext, s: StaffSession, regId: string) {
  const r = await getRegistration(request, s, regId);
  expect(r.status, `getRegistration: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body as Registration;
}

async function companion(request: APIRequestContext, s: StaffSession, reservationId: string) {
  const g = await namedGuest(request, s);
  const r = await call<{ members?: Array<{ id: string; guest?: { id: string } }> }>(
    request,
    'POST',
    p3(EP3.addPartyMember, s, { reservationId }),
    {
      session: s,
      idempotencyKey: true,
      body: { role: 'companion', guestId: g.id, relationship: 'friend' },
    },
  );
  expect(r.status, `addPartyMember: ${JSON.stringify(r.body)}`).toBe(201);
  const m = r.body.members?.find((x) => x.guest?.id === g.id);
  expect(m, JSON.stringify(r.body)).toBeTruthy();
  return { name: g.fullName, memberId: m!.id };
}

/** Khách gửi ảnh giấy tờ qua link cho Khách 1…n (Khách 3 hai ảnh để nhận ra). */
async function guestUploads(request: APIRequestContext, s: StaffSession, reservationId: string) {
  const link = await guestLink(request, s, reservationId);
  const g = await openGuest(request, link.token);
  expect(g.status, `openGuestSession: ${JSON.stringify(g.body)}`).toBe(200);
  const notice = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
    body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
  });
  expect(notice.status, JSON.stringify(notice.body)).toBe(200);
  for (const [personIndex, images] of [
    [1, 1],
    [2, 1],
    [3, 2],
  ] as const) {
    const up = await callMultipart(request, 'POST', EP3.uploadGuestDocument[1], {
      cookie: g.cookie,
      origin: GUEST_ORIGIN,
      idempotencyKey: true,
      fields: { personIndex: String(personIndex), docType: 'cccd' },
      files: Array.from({ length: images }, (_, i) => [
        'image',
        png(`khach-${personIndex}-${i + 1}.png`),
      ]),
    });
    expect(up.status, `upload Khách ${personIndex}: ${JSON.stringify(up.body)}`).toBe(201);
  }
}

test.describe(
  'UI H15/H14 – bỏ người khỏi đoàn chọn ô "Khách n", gắn người bằng GuestDocumentLink (S4-39)',
  { tag: ['@ui', '@sprint4', '@clock', '@write', '@c3'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    async function stay3(request: APIRequestContext, D: string) {
      const c = await s2Context(request);
      const fd = await session(request, 'qa.fd');
      const big: Room[] = c.rooms.filter((r) => (r.baseOccupancy ?? 0) >= 3);
      const rooms = big.length ? big : c.rooms.filter((r) => (r.maxOccupancy ?? 0) >= 3);
      expect(rooms.length, 'DS-E có căn cho 3 người lớn').toBeGreaterThan(0);
      const st = await makeStay(request, c, fd, {
        room: rooms[0]!,
        alternatives: rooms,
        arrival: addDays(D, 2),
        nights: 1,
        adults: 3,
        doc: false,
      });
      return { fd, st };
    }

    test('TC-L3-080 (E) (a) US-022/– H15 bỏ người chưa có giấy tờ khi khách đã gửi Khách 2, 3 qua link: hộp hỏi ô (không chọn sẵn), chọn Khách 2 → DELETE ?guestUploadPersonIndex=2, Khách 3 dồn thành Khách 2, không hẹn xóa; H14 "Gắn người" gửi chỉ partyMemberId (S4-39)', async ({
      page,
      request,
    }) => {
      // BUG-R2-085 (S4-39) đã xanh trên cây làm việc 17/10 (QA chạy lại) – ca phải đạt; đóng lỗi chờ SEC Verified (G2)
      needClock('TC-L3-080 (a)');
      test.slow();
      const { D, fd, st, A, B, k2, k3 } = await precondition(
        'đơn 3 người lớn, đi cùng A + B, khách gửi Khách 1–3 qua link',
        async () => {
          const D = virtualDay(realToday, 4);
          await startDay(request, D, '09:00');
          const { fd, st } = await stay3(request, D);
          const A = await companion(request, fd, st.res.id);
          const B = await companion(request, fd, st.res.id);
          await guestUploads(request, fd, st.res.id);
          const links = docsOf(await regNow(request, fd, st.regId)).filter(
            (d) => !d.isMain && d.captureMethod === 'guest_upload',
          );
          const k3 = links.find((d) => (d.imageIds ?? []).length === 2)!;
          const k2 = links.find((d) => (d.imageIds ?? []).length === 1)!;
          expect(k2 && k3, JSON.stringify(links)).toBeTruthy();
          return { D, fd, st, A, B, k2, k3 };
        },
      );
      await desk(page, D, '09:05');
      const urls: string[] = [];
      page.on('request', (r) => {
        if (r.method() === 'DELETE' && /\/party\//.test(r.url())) urls.push(r.url());
      });
      const deletes = recordWrites(page, 'DELETE', /\/reservations\/[^/]+\/party\/[^/]+$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}`);
      await page.getByRole('button', { name: t('rsv.add_person'), exact: true }).click();
      const party = page.getByRole('dialog', { name: t('rsv.party'), exact: true });
      await party
        .getByRole('listitem')
        .filter({ hasText: A.name })
        .getByRole('button', { name: t('party.remove'), exact: true })
        .click();
      const box = page.getByRole('alertdialog', {
        name: tf('party.remove_confirm', { name: A.name }),
      });
      const group = box.getByRole('group', { name: tf('party.slot_question', { name: A.name }) });
      await expect(group).toBeVisible({ timeout: 15_000 });
      const radios = group.getByRole('radio');
      await expect(radios).toHaveCount(3);
      for (let i = 0; i < 3; i++) await expect(radios.nth(i)).not.toBeChecked();
      const confirm = box.getByRole('button', { name: t('party.remove'), exact: true });
      await expect(confirm).toBeDisabled();
      await settle(page);
      await scan(page, test.info(), 'H15-remove-slot-choice');
      await group.getByRole('radio', { name: tf('guest.oci.person_n', { n: 2 }) }).check();
      await confirm.click();
      await waitWrite(deletes, 'removePartyMember chọn Khách 2', 204);
      expect(new URL(urls.at(-1)!).searchParams.get('guestUploadPersonIndex')).toBe('2');
      const reg = await regNow(request, fd, st.regId);
      const ids = docsOf(reg).map((d) => d.id);
      expect(ids, 'giấy tờ ô đã chọn bị hủy ngay').not.toContain(k2.id);
      const k3now = docsOf(reg).find((d) => d.id === k3.id)!;
      expect(k3now.personIndex, 'ô sau dồn số').toBe(2);
      expect(k3now.unclaimedUntil ?? null, 'không hẹn xóa 24 giờ').toBeNull();

      // ── H14: "Gắn người" Khách 2 (cũ là Khách 3) vào B – chỉ partyMemberId, không đọc C3 ──
      const patches = recordWrites(page, 'PATCH', /\/registrations\/[^/]+\/documents\/[^/]+$/);
      const c3reads: string[] = [];
      page.on('request', (r) => {
        if (/\/sensitive|\/images\//.test(r.url())) c3reads.push(r.url());
      });
      await page.goto(`${WEB_URL}/registration/${st.regId}`);
      const row = page.locator(`li#doc-${k3.id}`);
      await expect(row).toContainText(tf('guest.oci.person_n', { n: 2 }), { timeout: 15_000 });
      await row.getByRole('button', { name: t('reg.link.action'), exact: true }).click();
      const dlg = page.getByRole('dialog', { name: t('reg.link.action') });
      const pick = dlg.getByLabel(t('reg.link.member'));
      await expect(pick).toBeEnabled({ timeout: 10_000 });
      await expect(pick, 'không chọn sẵn').toHaveValue('');
      await settle(page);
      await scan(page, test.info(), 'H14-link-dialog-0.3.7');
      await pick.selectOption({ label: B.name });
      await dlg.getByRole('button', { name: t('reg.link.action'), exact: true }).click();
      const sent = await waitWrite(patches, 'updateGuestDocument GuestDocumentLink', 200);
      expect(sent.request, 'chỉ partyMemberId (GuestDocumentLink)').toEqual({
        partyMemberId: B.memberId,
      });
      expect(c3reads, 'gắn người không đọc trường/ảnh C3').toEqual([]);
      const after = docsOf(await regNow(request, fd, st.regId)).find((d) => d.id === k3.id)!;
      expect(after.partyMemberId).toBe(B.memberId);
    });

    test('TC-L3-080 (E) (b) US-043/– H14 "Nhập tay" trùng số giấy tờ khách gửi đang chờ gắn → 409 DOCUMENT_UNCLAIMED_EXISTS: Desk mở đúng giấy tờ đó (theo documentId) và gắn người, không tạo giấy tờ mới (S4-39)', async ({
      page,
      request,
    }) => {
      // BUG-R2-085 (S4-39) đã xanh trên cây làm việc 17/10 (QA chạy lại) – ca phải đạt; đóng lỗi chờ SEC Verified (G2)
      needClock('TC-L3-080 (b)');
      test.slow();
      const { D, fd, st, A, k3, number } = await precondition(
        'đơn 3 người lớn, đi cùng A; Khách 2–3 gửi qua link, Khách 3 đã nhập trường; giảm còn 2 người lớn (giấy tờ chưa gắn chờ gắn người)',
        async () => {
          const D = virtualDay(realToday, 4);
          await startDay(request, D, '09:00');
          const { fd, st } = await stay3(request, D);
          const A = await companion(request, fd, st.res.id);
          await guestUploads(request, fd, st.res.id);
          let reg = await regNow(request, fd, st.regId);
          const k3 = docsOf(reg).find(
            (d) =>
              !d.isMain && d.captureMethod === 'guest_upload' && (d.imageIds ?? []).length === 2,
          )!;
          const number = fakeCccd();
          const filled = await call(
            request,
            'PATCH',
            p3(EP3.updateGuestDocument, fd, { registrationId: st.regId, documentId: k3.id }),
            {
              ...dev(fd),
              ifMatch: versionTag(reg.version),
              body: vnDoc(A.name, { isMain: false, docNumber: number }),
            },
          );
          expect(filled.status, `nhập trường Khách 3: ${JSON.stringify(filled.body)}`).toBe(200);
          // Đường giảm người không có lựa chọn của lễ tân (0.3.7 – phương án dự phòng còn lại): giấy tờ chưa gắn chờ.
          const res = (await getReservation(request, fd, st.res.id)).body;
          const p = await patchReservation(request, fd, st.res.id, res.version, { adults: 2 });
          expect(p.status, `updateReservation adults 3 → 2: ${JSON.stringify(p.body)}`).toBe(200);
          reg = await regNow(request, fd, st.regId);
          const waiting = docsOf(reg).find((d) => d.id === k3.id)!;
          expect(waiting.unclaimedUntil, 'Khách 3 chờ gắn người').toBeTruthy();
          return { D, fd, st, A, k3: waiting, number };
        },
      );
      await desk(page, D, '09:05');
      const adds = recordWrites(page, 'POST', /\/registrations\/[^/]+\/documents$/);
      const patches = recordWrites(page, 'PATCH', /\/registrations\/[^/]+\/documents\/[^/]+$/);
      await page.goto(`${WEB_URL}/registration/${st.regId}`);
      await page
        .getByRole('button', { name: t('checkin.docs.manual'), exact: true })
        .first()
        .click();
      const manual = dialogs(page).filter({ hasText: t('ci.manual_title') });
      await manual.getByLabel(t('checkin.docs.field.doc_no')).fill(number);
      await manual.getByLabel(t('checkin.docs.field.full_name')).fill(A.name.toUpperCase());
      // lễ tân nhập đủ trường bắt buộc (server kiểm trường trước khi kiểm trùng – thiếu ngày sinh → 422, QA rà 17/10)
      await manual.getByLabel(t('checkin.docs.field.dob')).fill('1990-01-01');
      await manual.getByRole('button', { name: t('ci.manual_save'), exact: true }).click();
      const dup = await waitWrite(adds, 'addGuestDocument trùng giấy tờ chờ', 409);
      const problem = JSON.parse(dup.body) as Json;
      expect(problem.code).toBe('DOCUMENT_UNCLAIMED_EXISTS');
      expect(problem.documentId).toBe(k3.id);
      await expect(
        manual.getByText(tf('reg.link.dup_unclaimed', { n: num(problem.personIndex) })),
      ).toBeVisible();
      await manual.getByRole('button', { name: t('reg.link.open_pending'), exact: true }).click();
      await expect(manual).toBeHidden();
      const dlg = page.getByRole('dialog', { name: t('reg.link.action') });
      await expect(dlg).toContainText(tf('guest.oci.person_n', { n: num(problem.personIndex) }));
      await dlg.getByLabel(t('reg.link.member')).selectOption({ label: A.name });
      await dlg.getByRole('button', { name: t('reg.link.action'), exact: true }).click();
      const sent = await waitWrite(patches, 'gắn người cho đúng giấy tờ chờ', 200);
      expect(sent.path).toMatch(new RegExp(`/documents/${esc(k3.id)}$`));
      expect(sent.request).toEqual({ partyMemberId: A.memberId });
      const reg = await regNow(request, fd, st.regId);
      expect(
        docsOf(reg).filter((d) => d.docNumberLast4 === number.slice(-4)),
        'không tạo giấy tờ mới',
      ).toHaveLength(1);
      expect(docsOf(reg).find((d) => d.id === k3.id)?.partyMemberId).toBe(A.memberId);
    });
  },
);
