// Trước cổng QC Sprint 4 (tuần Ổn định) – ca UI bấm thật trên Desk/PWA với API thật (project desk-chromium, đồng hồ
// thật) cho mục CỔNG chưa có ca E2E (bảng sẵn sàng `rounds/round-02/qc/s4-gate-readiness.md` bảng 5, G7.2, G8.2):
// - BUG-R2-080 (S4-50a): hộp báo giá có tiếng Nga – lời gửi khách lấy bản RU từ API.
// - BUG-R2-076 (S4-50a): đặt trùng → "Dùng căn …" hiện giá căn mới trước, một bấm mới tạo đơn.
// - S4-30 + BUG-R2-081: CTV báo đã chuyển cọc kèm ảnh biên nhận; lễ tân xác nhận cọc thấy số tiền, ghi chú, ảnh.
// - H24 Tổng quan (chủ đầu tư) + axe ở 1366 px và 390 px.
// - PWA H19 (Việc của tôi, Các căn), H21 (báo sự cố, Thao tác trên máy), H22 (phiếu sửa: nhận việc → sửa xong) + axe.
// Dữ liệu dựng bằng API (đơn ngày xa); bước đang kiểm bấm trên giao diện, request trình duyệt gửi được ghi lại.
import { expect, test, type Page } from '@playwright/test';
import { call, propertyIdOf, session, sessionOrSkip, stackToday } from '../support/api.js';
import { SEED_PASSWORD, STAFF_URL, WEB_URL } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  freeRoom,
  freeWindow,
  getReservation,
  makeHold,
  minStayFor,
  newGuest,
  createReservation,
  quoteInput,
  reservationBody,
  room,
  s2Context,
  saveQuote,
  track,
} from '../support/s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  addDocument,
  bookerMemberId,
  makeStay,
  p3,
  stackBusinessDate,
  vnDoc,
} from '../support/s3.js';
import { farStay } from '../support/s3-checkin.js';
import { precondition } from '../support/known-bugs.js';
import { scan } from './axe.js';
import { staffApp, pastUndo } from './flows.js';
import {
  UI,
  fakePhone,
  fillBooking,
  lettersOnly,
  newDesk,
  openRack,
  signIn,
  t,
} from './helpers.js';
import {
  pickDocPerson,
  deskAs,
  photo,
  recordWrites,
  trustedDesk,
  vnd,
  waitWrite,
} from './write-steps.js';

type Json = Record<string, unknown>;
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe(
  'Trước cổng S4 – ca UI bấm thật (bảng 5): 076, 080, S4-30/081, H24, PWA H19–H22',
  { tag: ['@ui', '@sprint4'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L5-053 (E) [PO U5] US-083/AC2 BUG-R2-080: sale mở báo giá đã lưu → "Ngôn ngữ gửi khách" có Tiếng Việt / English / Русский; chọn Русский → lời gửi khách bản tiếng Nga từ API (GET text?locale=ru 200, chữ Kirin) + axe', async ({
      page,
      request,
    }) => {
      const sal = await session(request, 'qa.sal');
      const c = await s2Context(request);
      const rm = room(c, '203');
      const w = await freeWindow(request, sal, rm, 2, { today: await stackToday(request), dow: 2 });
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 2 }),
        guestId: await newGuest(request, sal),
      });
      expect(q.status, `saveQuote: ${JSON.stringify(q.body).slice(0, 200)}`).toBe(201);
      await signIn(page, 'qa.sal');
      const texts: Array<{ url: string; status: number; body: string }> = [];
      page.on('response', async (r) => {
        if (r.request().method() === 'GET' && /\/quotes\/[^/]+\/text/.test(r.url()))
          texts.push({ url: r.url(), status: r.status(), body: await r.text().catch(() => '') });
      });
      await page.goto(`${WEB_URL}/quotes`);
      await page.getByRole('tab', { name: t('nav.my_quotes') }).click();
      await page.getByRole('button', { name: q.body.code, exact: true }).click();
      const dlg = page.getByRole('dialog', { name: new RegExp(esc(q.body.code)) });
      const lang = dlg.getByRole('group', { name: t('sale.text_lang') });
      await expect(lang).toBeVisible({ timeout: 15_000 });
      for (const name of ['Tiếng Việt', 'English', 'Русский'])
        await expect(lang.getByRole('button', { name })).toBeVisible();
      await lang.getByRole('button', { name: 'Русский' }).click();
      await expect
        .poll(() => texts.find((x) => /locale=ru/.test(x.url))?.status, {
          message: 'GET quote text locale=ru',
          timeout: 15_000,
        })
        .toBe(200);
      const pre = dlg.locator('pre.quote-text');
      await expect(pre).toHaveAttribute('lang', 'ru');
      await expect(pre).toHaveText(/[А-Яа-яЁё]{4,}/, { timeout: 15_000 });
      await scan(page, test.info(), 'H12-quote-text-ru');
    });

    test('TC-L2-107 (E) US-017/AC4 BUG-R2-076 (KB2, P-S4-2): H09 lưu đơn khi căn vừa bị đặt → "Dùng căn …" KHÔNG tạo ngay mà hiện giá từng đêm + tổng của căn mới; bấm "Tạo đơn ở căn …" → đơn ở căn mới, tiền phòng = tổng đã hiện', async ({
      page,
      request,
    }) => {
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const rm = room(c, '203');
      const { arrival, departure } = await freeWindow(request, fd, rm, 2, {
        today: await stackToday(request),
        dow: 1,
      });
      await signIn(page, 'qa.fd');
      expect(await openRack(page), 'màn Sơ đồ phòng').toBe(true);
      await fillBooking(page, {
        roomNo: rm.roomNo,
        arrival,
        departure,
        guest: `Khach Trung ${lettersOnly()}`,
        phone: fakePhone(),
      });
      // người khác vừa đặt căn này cùng khoảng ngày (API) → lần lưu của form gặp 409 có gợi ý căn khác
      const other = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival,
          departure,
          guestId: await newGuest(request, fd),
        }),
      );
      expect(other.status, `đơn chen ngang: ${JSON.stringify(other.body).slice(0, 300)}`).toBe(201);
      track('reservation', String(other.body.id));
      const creates = recordWrites(page, 'POST', /\/reservations$/);
      const dlg = page.getByRole('dialog', { name: t('booking.new.title') });
      await dlg.getByRole('button', { name: t('booking.create'), exact: true }).click();
      await waitWrite(creates, 'lưu lần 1 → căn vừa bị đặt', 409);
      const use = dlg.getByRole('button', {
        name: new RegExp(`^${esc(t('bk.use_room').split('{')[0]!)}`),
      });
      await expect(use.first(), 'gợi ý "Dùng căn …"').toBeVisible({ timeout: 15_000 });
      const label = (await use.first().innerText()).trim();
      const newRoomNo = /(\d{3})/.exec(label)?.[1];
      expect(newRoomNo, `số căn gợi ý trong "${label}"`).toBeTruthy();
      await use.first().click();
      const check = dlg.getByRole('status').filter({
        hasText: tf('bk.use_room_check', { room: newRoomNo! }),
      });
      await expect(check, 'xem giá căn mới trước khi tạo').toBeVisible({ timeout: 15_000 });
      const total = check.locator('tr.total td.num');
      await expect(total).toHaveText(/\d/, { timeout: 15_000 });
      const shown = Number((await total.innerText()).replace(/[^\d]/g, ''));
      expect(shown).toBeGreaterThan(0);
      expect(
        creates.filter((s) => s.status === 201).length,
        'chưa tạo đơn khi bấm "Dùng căn …"',
      ).toBe(0);
      await scan(page, test.info(), 'H09-use-room-price');
      await check
        .getByRole('button', { name: tf('bk.use_room_confirm', { room: newRoomNo! }) })
        .click();
      const made = await waitWrite(creates, 'tạo đơn ở căn gợi ý', 201);
      const id = String((JSON.parse(made.body) as Json).id);
      track('reservation', id);
      const target = room(c, newRoomNo!);
      expect(made.request?.roomId, 'đơn ở căn mới').toBe(target.id);
      const res = await getReservation(request, fd, id);
      const roomTotal = Number(
        (res.body as Json).roomTotalVnd ??
          (res.body as Json).totalRoomVnd ??
          (res.body as Json).totalVnd,
      );
      expect(roomTotal, 'tổng tạo = tổng đã hiện').toBe(shown);
    });

    test('TC-L5-054 (E) [PO U5] US-086/AC4 S4-30 + BUG-R2-081: CTV "Báo đã chuyển cọc" 500.000 + ghi chú + ảnh biên nhận → lễ tân mở "Xác nhận đã nhận cọc" thấy CTV/sale đã báo: số tiền, ghi chú, xem ảnh biên nhận + axe', async ({
      browser,
      request,
    }) => {
      const ctv = await session(request, 'qa.ctv1');
      const c = await s2Context(request);
      const today = await stackToday(request);
      let arrival = addDays(today, 200);
      while (new Date(`${arrival}T00:00:00Z`).getUTCDay() !== 2) arrival = addDays(arrival, 1);
      const { hold } = await makeHold(request, ctv, c, {
        rooms: c.rooms,
        arrival,
        nights: 2,
        holdHours: 24,
      });
      const note = `FT${lettersOnly(4).toUpperCase()} – CK coc`;
      // ── CTV báo chuyển cọc (bấm thật) ──
      const cp: Page = await newDesk(browser, 'qa.ctv1');
      try {
        const notices = recordWrites(cp, 'POST', /\/deposit-notices$/);
        const ups = recordWrites(cp, 'POST', /\/attachments$/);
        await cp.goto(`${WEB_URL}/reservations/${hold.id}`);
        await cp
          .getByRole('button', { name: t('drawer.action.deposit_notice') })
          .first()
          .click();
        const dlg = cp.getByRole('dialog', { name: t('drawer.action.deposit_notice') });
        await expect(dlg.getByText(t('rsv.receipt_help'))).toBeVisible({ timeout: 15_000 });
        const amount = dlg.getByLabel(new RegExp(`^${esc(t('rsv.amount_sent'))}`));
        await amount.fill('500000');
        await dlg.getByLabel(new RegExp(`^${esc(t('stay.note'))}`)).fill(note);
        await dlg
          .getByLabel(new RegExp(`^${esc(t('rsv.attach_receipt'))}`))
          .setInputFiles({ name: 'bien-nhan.png', mimeType: 'image/png', buffer: PNG_1PX });
        await scan(cp, test.info(), 'H11-ctv-deposit-notice');
        await dlg.getByRole('button', { name: t('drawer.action.deposit_notice') }).click();
        const up = await waitWrite(ups, 'tải ảnh biên nhận', 201);
        const sent = await waitWrite(notices, 'báo chuyển cọc (202 – OpenAPI)', 202);
        expect(sent.request).toMatchObject({
          amountVnd: 500000,
          attachmentId: (JSON.parse(up.body) as Json).id,
        });
      } finally {
        await cp.context().close();
      }
      // ── lễ tân xác nhận cọc thấy nội dung CTV đã báo (BUG-R2-081) ──
      const fp: Page = await deskAs(browser, 'qa.fd');
      try {
        await fp.goto(`${WEB_URL}/reservations/${hold.id}`);
        await fp
          .getByRole('button', { name: t('drawer.action.confirm_deposit') })
          .first()
          .click();
        const box = fp.getByRole('note').filter({ hasText: t('rsv.notice.heading') });
        await expect(box).toBeVisible({ timeout: 15_000 });
        await expect(box).toContainText(vnd(500000));
        await expect(box).toContainText(tf('rsv.notice.note', { note }));
        await box.getByRole('button', { name: t('rsv.notice.photo') }).click();
        await expect(
          box.getByRole('img', { name: tf('rsv.notice.photo_alt', { code: hold.code }) }),
        ).toBeVisible({ timeout: 15_000 });
        await scan(fp, test.info(), 'H11-confirm-deposit-notice');
      } finally {
        await fp.context().close();
      }
      expect(
        (
          (await getReservation(request, await sessionOrSkip(request, 'qa.fd'), hold.id))
            .body as Json
        ).depositNotices,
        'đọc lại depositNotices',
      ).toEqual(expect.arrayContaining([expect.objectContaining({ amountVnd: 500000 })]));
    });

    test('TC-L3-084 (E) US-043/AC1 BUG-R2-091 (S4-48): H13 "Nhập tay" giấy tờ với số CCCD sai dạng → đầu hộp nêu "Còn {n} ô cần sửa – xem dòng đỏ dưới từng ô", ô sai có dòng đỏ, không lưu + axe', async ({
      page,
      request,
    }) => {
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackBusinessDate(request);
      const nights = minStayFor(today);
      const rm = await freeRoom(request, fd, c.rooms, today, addDays(today, nights));
      const st = await makeStay(request, c, fd, {
        room: rm,
        alternatives: c.rooms,
        arrival: today,
        nights,
        adults: 1,
        doc: false,
      });
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      const docs = recordWrites(page, 'POST', /\/registrations\/[^/]+\/documents$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-in`);
      await page
        .getByRole('button', { name: t('checkin.docs.manual'), exact: true })
        .first()
        .click({ timeout: 15_000 });
      const dlg = page.getByRole('dialog', { name: t('ci.manual_title') });
      await expect(dlg).toBeVisible();
      await pickDocPerson(dlg, 'booker');
      await dlg.getByLabel(t('checkin.docs.field.doc_no')).fill('12345');
      await dlg.getByLabel(t('checkin.docs.field.full_name')).fill(st.guestName.toUpperCase());
      await dlg.getByLabel(t('checkin.docs.field.dob')).fill('1990-03-12');
      await dlg.getByRole('button', { name: t('reg.value.gender.female'), exact: true }).click();
      await dlg
        .getByLabel(t('checkin.docs.field.address'))
        .fill('12 Tran Hung Dao, Phuong 10, Da Lat, Lam Dong');
      await dlg.getByRole('button', { name: t('ci.manual_save') }).click();
      const head = dlg.getByRole('alert').filter({ hasText: /Còn \d+ ô cần sửa/ });
      await expect(head, 'đầu hộp nêu số ô cần sửa (BUG-R2-091)').toBeVisible({ timeout: 15_000 });
      await expect(head).toContainText(t('error.VALIDATION_FAILED').split('{n}')[1]!.trim());
      await expect(dlg.getByLabel(t('checkin.docs.field.doc_no'))).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(docs.filter((x) => x.status === 201).length, 'giấy tờ sai không được lưu').toBe(0);
      await scan(page, test.info(), 'H13-manual-doc-errors');
    });

    test('TC-L2-108 (E) [PO U6] US-016/AC3: H08 Sơ đồ phòng – bấm thanh đơn bằng chuột mở drawer đơn; dùng bàn phím (focus ô thanh đơn, Enter) cũng mở drawer', async ({
      page,
      request,
    }) => {
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const from = addDays(today, 1);
      const rm = await freeRoom(request, fd, c.rooms, from, addDays(from, 2));
      const st = await makeStay(request, c, fd, {
        room: rm,
        alternatives: c.rooms,
        arrival: from,
        nights: 2,
        doc: false,
      });
      await signIn(page, 'qa.fd');
      expect(await openRack(page), 'màn Sơ đồ phòng').toBe(true);
      const bar = page.getByRole('gridcell', { name: new RegExp(esc(st.res.code)) });
      await expect(bar, 'thanh đơn trên rack').toBeVisible({ timeout: 20_000 });
      const drawer = page.getByRole('dialog').filter({ hasText: st.res.code });
      await bar.click();
      await expect(drawer, 'chuột: drawer đơn').toBeVisible({ timeout: 15_000 });
      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden({ timeout: 10_000 });
      await bar.focus();
      await page.keyboard.press('Enter');
      await expect(drawer, 'bàn phím: drawer đơn').toBeVisible({ timeout: 15_000 });
      await scan(page, test.info(), 'H08-rack-drawer-keyboard');
    });

    test('TC-RB-008 (E) [PO U6] US-048/AC3 BUG-R2-179: H06 hồ sơ khách đã có P05 hiện 4 ký tự cuối giấy tờ (API trả `idDocLast4` – TC-RB-008 (A)); Desk chưa hiện', async ({
      page,
      request,
    }) => {
      const { st, last4 } = await precondition('khách có CCCD + P05 (API)', async () => {
        const fd = await session(request, 'qa.fd');
        const c = await s2Context(request);
        const st = await farStay(request, c, fd, await stackToday(request), {
          adults: 1,
          doc: false,
        });
        const doc = vnDoc(st.guestName);
        const addBooker = await bookerMemberId(request, fd, st.res.id);
        const add = await addDocument(request, fd, st.regId, { ...doc, partyMemberId: addBooker });
        expect(add.status, JSON.stringify(add.body).slice(0, 200)).toBe(201);
        const p05 = await call(
          request,
          'POST',
          p3(EP3.recordImageConsent, fd, { registrationId: st.regId }),
          {
            session: fd,
            idempotencyKey: true,
            body: {
              partyMemberId: addBooker,
              purpose: 'P05_CRM',
              decision: 'granted',
              noticeVersion: PRIVACY_NOTICE,
              locale: 'vi',
              channel: 'desk',
            },
          },
        );
        expect(p05.status, JSON.stringify(p05.body).slice(0, 200)).toBe(201);
        return { st, last4: String(doc.docNumber).slice(-4) };
      });
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/guests`);
      await page.getByPlaceholder(t('crm.search_ph')).fill(st.guestName);
      await page
        .getByRole('button', { name: new RegExp(esc(st.guestName)) })
        .first()
        .click({ timeout: 15_000 });
      const dlg = page.getByRole('dialog').first();
      await expect(dlg).toBeVisible({ timeout: 15_000 });
      await expect(
        dlg.getByText(new RegExp(`${last4}\\b`)),
        'H06 hiện 4 ký tự cuối giấy tờ',
      ).toBeVisible({
        timeout: 5_000,
      });
    });

    test('TC-X-073 (E) G8.2 H24 Tổng quan chủ đầu tư (qa.owner): Cần duyệt, Cần chú ý, KPI đêm nay hiện đủ; axe 0 lỗi nghiêm trọng ở 1366 px và 390 px', async ({
      page,
    }) => {
      await signIn(page, 'qa.owner');
      await page.goto(`${WEB_URL}/overview`);
      for (const id of ['ov-appr', 'ov-attn', 'ov-tonight'])
        await expect(page.locator(`h2#${id}`)).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('h2#ov-tonight')).toHaveText(t('ov.tonight'));
      await scan(page, test.info(), 'H24-overview-1366');
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator('h2#ov-appr')).toBeVisible();
      await scan(page, test.info(), 'H24-overview-390');
    });

    test('TC-X-074 (E) [PO U2] G8.2 PWA H19–H22: buồng phòng báo sự cố (H21) → phiếu WO; kỹ thuật thấy phiếu (H22.1), Nhận việc → Sửa xong có kết quả (H22.2–22.4); axe trên Việc của tôi, Các căn, Báo sự cố, Thao tác trên máy, danh sách và chi tiết phiếu', async ({
      browser,
      request,
    }) => {
      test.slow();
      const c = await s2Context(request);
      const now = new Date().toISOString();
      // căn trống hôm nay (không khóa căn: buồng phòng chỉ đề nghị khóa – A86)
      const rm = room(c, '301');
      const desc = `Voi sen chi ra nuoc lanh ${lettersOnly(4)}`;
      const hk = await staffApp(browser, request, 'qa.hk', now);
      let code = '';
      let woId = '';
      try {
        await hk.goto(`${STAFF_URL}/#/tasks`);
        await expect(hk.getByRole('heading', { name: t('nav.my_tasks') }).first()).toBeVisible({
          timeout: 20_000,
        });
        await scan(hk, test.info(), 'H19-1-my-tasks');
        await hk
          .getByRole('link', { name: t('nav.rooms_status') })
          .first()
          .click();
        await expect(hk.getByRole('link', { name: /^Căn \d{3}/ }).first()).toBeVisible({
          timeout: 20_000,
        });
        expect(await hk.getByRole('link', { name: /^Căn \d{3}/ }).count(), '10 căn').toBe(10);
        await scan(hk, test.info(), 'H19-2-rooms');
        const wos = recordWrites(hk, 'POST', /\/work-orders$/);
        await hk.goto(`${STAFF_URL}/#/report/${rm.id}`);
        await expect(hk.locator('#wo-room')).toHaveValue(rm.id, { timeout: 15_000 });
        await hk.getByRole('button', { name: t('hk.wo.k.hot_water') }).click();
        await hk.getByLabel(new RegExp(`^${esc(t('hk.wo.desc'))}`)).fill(desc);
        await hk.locator('input[type=file]').first().setInputFiles(photo(PNG_1PX, 'su-co.png'));
        await scan(hk, test.info(), 'H21-1-report');
        await hk.getByRole('button', { name: t('hk.wo.send') }).click();
        await pastUndo(hk);
        const w = await waitWrite(wos, 'createWorkOrder (H21)', 201);
        expect(w.request).toMatchObject({ roomId: rm.id, category: 'hot_water' });
        code = String((JSON.parse(w.body) as Json).code);
        woId = String((JSON.parse(w.body) as Json).id);
        await expect(hk.getByText(tf('hk.wo.sent_title', { code })).first()).toBeVisible({
          timeout: 15_000,
        });
        await hk.goto(`${STAFF_URL}/#/queue`);
        await expect(hk.getByRole('heading', { name: t('hk.queue_title') }).first()).toBeVisible({
          timeout: 15_000,
        });
        await scan(hk, test.info(), 'H21-3-queue');
      } finally {
        await hk.context().close();
      }
      const mt = await staffApp(browser, request, 'qa.mt', now);
      try {
        const acts = recordWrites(mt, 'POST', /\/work-orders\/[^/]+\/actions\/[a-z_-]+$/);
        await mt.goto(`${STAFF_URL}/#/wo`);
        const item = mt.getByRole('link', { name: new RegExp(esc(code)) }).first();
        await expect(item, 'phiếu vừa báo có trong danh sách H22.1').toBeVisible({
          timeout: 20_000,
        });
        await scan(mt, test.info(), 'H22-1-work-orders');
        await item.click();
        await expect(mt.getByText(desc).first()).toBeVisible({ timeout: 15_000 });
        await scan(mt, test.info(), 'H22-2-work-order');
        await mt.getByRole('button', { name: t('wo.action.start') }).click();
        await expect(mt.getByRole('button', { name: t('wo.action.done') })).toBeVisible({
          timeout: 15_000,
        });
        await mt.getByRole('button', { name: t('wo.action.done') }).click();
        await mt.getByLabel(new RegExp(`^${esc(t('wo.result'))}`)).fill('Thay ruot binh nong lanh');
        const pick = mt.locator('input[type=file]');
        if ((await pick.count()) > 0)
          await pick.first().setInputFiles(photo(PNG_1PX, 'sau-sua.png'));
        await scan(mt, test.info(), 'H22-4-done');
        await mt.getByRole('button', { name: t('wo.done_confirm') }).click();
        await expect
          .poll(() => acts.filter((s) => s.status < 300).length, { timeout: 15_000 })
          .toBeGreaterThanOrEqual(2);
      } finally {
        await mt.context().close();
      }
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const one = await call<Json>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(mgr)}/work-orders/${woId}`,
        { session: mgr },
      );
      expect(one.status, JSON.stringify(one.body).slice(0, 200)).toBe(200);
      const wo = one.body;
      expect(wo.status, `phiếu ${code} sau Sửa xong`).toBe('done');
    });
  },
);
