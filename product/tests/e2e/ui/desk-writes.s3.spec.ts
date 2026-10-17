// E2E UI – các bước GHI trên Desk được BẤM THẬT tới API thật (QC-S3-09, ĐK-S3-9, vòng sửa 9 Sprint 3).
// Project desk-chromium (Chromium 1366×768, đồng hồ thật). Ca UI trước đây chỉ kiểm phần hiển thị, còn bước ghi chạy
// qua API, nên CI xanh trong khi Desk hỏng (UXR đi thử demo 17/10: UXR #2, #3, #4, #5, #6). Ở đây:
//   - dữ liệu chuẩn bị bằng API (đơn, thu tiền, yêu cầu hoàn, duyệt) – không phải đối tượng kiểm;
//   - bước đang kiểm thì bấm trên giao diện; request trình duyệt thật sự gửi được ghi lại (ui/write-steps.ts) và
//     phải trả 2xx; kết quả đọc lại bằng API; số tiền trên màn hình so với API/oracle.
// Ca cần đơn ĐANG Ở (thêm người có phụ thu, phát sinh có ảnh, "Đã thu" sau nhận phòng) ở ui-clock/stay-writes.h15.spec.ts
// (desk-clock, ngày ảo – không giữ căn của hôm nay, không cần hoàn tác nhận phòng).
// TC: product/tests/test-cases/r1-main-flows.md v0.3.10. Lỗi: rounds/round-02/qa/bug-list.md BUG-R2-066…070.
import { expect, test, type Page } from '@playwright/test';
import { call, propertyIdOf, session, stackToday } from '../support/api.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import {
  action,
  addDays,
  cleanupTracked,
  freeRoom,
  freeWindow,
  getReservation,
  makeHold,
  minStayFor,
  oracle,
  s2Context,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  PNG_16X16,
  approve,
  dev,
  fakeCccd,
  getFolio,
  getRegistration,
  makeStay,
  p3,
  recordPayment,
  stackBusinessDate,
  type Stay,
} from '../support/s3.js';
import { approvalsOf, farBooking } from '../support/s3-stay.js';
import { go } from './axe.js';
import { UI, signIn, t } from './helpers.js';
import {
  amountRe,
  deskAs,
  digits,
  drawerBalance,
  drawerPaid,
  photo,
  recordWrites,
  trustedDesk,
  vnd,
  waitWrite,
} from './write-steps.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Booking arriving TODAY (business date) on a free room, paid in full, 2 adults, NO document (API). */
async function arrivalTodayNoDoc(request: Page['request']): Promise<Stay> {
  const fd = await session(request, 'qa.fd');
  const c = await s2Context(request);
  const today = await stackBusinessDate(request);
  const nights = minStayFor(today);
  const rm = await freeRoom(request, fd, c.rooms, today, addDays(today, nights));
  return makeStay(request, c, fd, {
    room: rm,
    alternatives: c.rooms,
    arrival: today,
    nights,
    adults: 2,
    doc: false,
  });
}

/** Money log (H17) → tab "Hoàn tiền"; the row of one booking. */
async function refundRow(page: Page, code: string) {
  await go(page, '/audit');
  await page
    .getByRole('group', { name: t('nav.moneylog') })
    .getByRole('button', { name: t('refund.title') })
    .click();
  const row = page.getByRole('listitem').filter({ hasText: code });
  await expect(row, `tab Hoàn tiền có khoản hoàn của đơn ${code}`).toBeVisible({
    timeout: 15_000,
  });
  return row;
}

/** Overpaid folio + refund request of `amountVnd` created by qa.fd (API – the set-up, not the subject). */
async function overpaidWithRefund(
  request: Page['request'],
  amountVnd: number,
  reason: string,
): Promise<{ res: { id: string; code: string; folioId: string }; approvalId: string }> {
  const fd = await session(request, 'qa.fd');
  const c = await s2Context(request);
  const res = await farBooking(request, c, fd, {
    nights: 1,
    today: await stackToday(request),
    pay: 'full',
  });
  // khách trả dư bằng tiền mặt (FD+ ghi chú – DOM G-15): tiền đã về → hoàn được (BR-522, không chờ đối soát)
  const over = await recordPayment(request, fd, res.folioId, {
    type: 'charge',
    method: 'cash',
    amountVnd,
    note: 'Khach tra du – E2E UI',
  });
  expect(over.status, JSON.stringify(over.body)).toBe(201);
  const req = await call<{ id: string } & ProblemFields>(
    request,
    'POST',
    p3(EP3.createRefundRequest, fd, { folioId: res.folioId }),
    { session: fd, idempotencyKey: true, body: { amountVnd, reason } },
  );
  expect(req.status, `createRefundRequest: ${JSON.stringify(req.body)}`).toBe(201);
  return { res, approvalId: req.body.id };
}

test.describe(
  'UI Sprint 3 – bước ghi bấm thật: giấy tờ nhập tay, chi hoàn tiền, hộp hủy đơn, "Đã thu" (QC-S3-09)',
  { tag: ['@ui', '@sprint3', '@write'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L3-075 (E) US-043/AC1 H13 bước Giấy tờ: lễ tân bấm "Nhập tay" lưu giấy tờ người 1 (không ảnh) và người 2 (kèm ảnh) → partial → review (BUG-R2-067)', async ({
      page,
      request,
    }) => {
      test.slow();
      const st = await arrivalTodayNoDoc(request);
      const fd = await session(request, 'qa.fd');
      const reg0 = await getRegistration(request, fd, st.regId);
      expect(reg0.body.status, 'khai báo trước khi nhập giấy tờ').toBe('none');
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      const docs = recordWrites(page, 'POST', /\/registrations\/[^/]+\/documents$/);
      await page.goto(`${WEB_URL}/reservations/${st.res.id}/check-in`);
      await expect(page.getByText(tf('checkin.docs.progress', { have: 0, need: 2 }))).toBeVisible({
        timeout: 15_000,
      });

      // ── người 1: CCCD người đứng tên, nhập tay đủ trường, không ảnh (multipart chỉ có phần `data`) ──
      const n1 = fakeCccd();
      await page
        .getByRole('button', { name: t('checkin.docs.manual'), exact: true })
        .first()
        .click();
      let dlg = page.getByRole('dialog', { name: t('ci.manual_title') });
      await expect(dlg).toBeVisible();
      await dlg.getByLabel(t('checkin.docs.field.doc_no')).fill(n1);
      await dlg.getByLabel(t('checkin.docs.field.full_name')).fill(st.guestName.toUpperCase());
      await dlg.getByLabel(t('checkin.docs.field.dob')).fill('1990-03-12');
      await dlg.getByRole('button', { name: t('reg.value.gender.female'), exact: true }).click();
      await dlg
        .getByLabel(t('checkin.docs.field.address'))
        .fill('12 Tran Hung Dao, Phuong 10, Da Lat, Lam Dong');
      await dlg.getByRole('button', { name: t('ci.manual_save') }).click();
      // UXR #3: phần `data` gửi dạng Blob (có filename) → server bỏ qua → 422 `data REQUIRED` ("Bắt buộc")
      await waitWrite(docs, 'addGuestDocument người 1 (nhập tay, không ảnh)', 201);
      await expect(dlg).toBeHidden({ timeout: 10_000 });
      await expect(page.getByText(tf('checkin.docs.progress', { have: 1, need: 2 }))).toBeVisible();
      await expect(
        page.getByText(tf('ci.doc_masked', { type: t('ci.doc.cccd'), last4: n1.slice(-4) })),
      ).toBeVisible();
      const reg1 = await getRegistration(request, fd, st.regId);
      expect(reg1.body.status, 'BR-601: người 1 đủ trường → partial').toBe('partial');
      expect(reg1.body.documents).toHaveLength(1);
      expect(reg1.body.documents[0]).toMatchObject({
        docNumberLast4: n1.slice(-4),
        captureMethod: 'manual',
        isMain: true,
      });

      // ── người 2: CCCD kèm 1 ảnh chụp tại quầy (multipart `data` + `image`) ──
      const n2 = fakeCccd();
      await page
        .getByRole('button', { name: t('checkin.docs.manual'), exact: true })
        .first()
        .click();
      dlg = page.getByRole('dialog', { name: t('ci.manual_title') });
      await expect(dlg).toBeVisible();
      await dlg.getByLabel(t('checkin.docs.field.doc_no')).fill(n2);
      await dlg.getByLabel(t('checkin.docs.field.full_name')).fill('TRAN VAN BINH');
      await dlg.getByLabel(t('checkin.docs.field.dob')).fill('1988-07-21');
      await dlg.getByRole('button', { name: t('reg.value.gender.male'), exact: true }).click();
      await dlg
        .getByLabel(t('checkin.docs.field.address'))
        .fill('45 Phan Dinh Phung, Phuong 1, Da Lat, Lam Dong');
      await dlg
        .getByLabel(t('checkin.docs.scan'))
        .setInputFiles(photo(PNG_16X16, 'cccd-nguoi-2.png'));
      const before = docs.length;
      await dlg.getByRole('button', { name: t('ci.manual_save') }).click();
      await waitWrite(
        docs,
        'addGuestDocument người 2 (nhập tay, kèm ảnh)',
        201,
        (s) => docs.indexOf(s) >= before,
      );
      await expect(dlg).toBeHidden({ timeout: 10_000 });
      await expect(page.getByText(tf('checkin.docs.progress', { have: 2, need: 2 }))).toBeVisible();
      const reg2 = await getRegistration(request, fd, st.regId);
      expect(reg2.body.status, 'BR-601: đủ người → review').toBe('review');
      expect(reg2.body.documents).toHaveLength(2);
      const d2 = reg2.body.documents.find((d) => d.docNumberLast4 === n2.slice(-4));
      expect(d2, 'giấy tờ người 2').toBeTruthy();
      expect(d2).toMatchObject({ captureMethod: 'manual', isMain: false });
      expect(d2!.imageIds ?? [], 'ảnh chụp tại quầy được lưu cùng giấy tờ').toHaveLength(1);
    });

    test('TC-L4-093 (E) US-021/AC4 chi hoàn TIỀN MẶT trên Desk: FD nhập nơi nhận, quản lý duyệt, LỄ TÂN TRƯỞNG thấy khoản và chi kèm ảnh biên nhận (BUG-R2-066, BUG-R2-068)', async ({
      browser,
      page,
      request,
    }) => {
      test.slow();
      // oracle BR-522-01: hoàn đã duyệt 350.000, người tạo yêu cầu (FD) không tự chi tiền mặt (A47a)
      const amount = Number(oracle('BR-522-01').input.refundApprovedVnd);
      const { res, approvalId } = await overpaidWithRefund(request, amount, 'Hoan tien tra du');
      const mgr = await session(request, 'qa.mgr');

      // 1. qa.fd (người tạo yêu cầu) nhập nơi nhận = tiền mặt trên Desk
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      const destWrites = recordWrites(
        page,
        'PUT',
        /\/approval-requests\/[^/]+\/refund-destination$/,
      );
      let row = await refundRow(page, res.code);
      await row.getByRole('button', { name: t('refund.set_destination') }).click();
      const destDlg = page.getByRole('dialog', { name: t('refund.set_destination') });
      await expect(
        destDlg.getByRole('button', { name: t('pay.cash'), exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await destDlg.getByRole('button', { name: t('common.save'), exact: true }).click();
      await waitWrite(destWrites, 'setRefundDestination (tiền mặt)', 200);
      await expect(destDlg).toBeHidden({ timeout: 10_000 });

      // 2. quản lý duyệt (API – không phải đối tượng kiểm của ca này)
      const ok = await approve(request, mgr, approvalId);
      expect(ok.status, `approve: ${JSON.stringify(ok.body)}`).toBe(200);

      // 3. qa.fdl mở Hoàn tiền: thấy khoản quản lý đã duyệt (UXR #4) → chi tiền mặt kèm ảnh biên nhận (UXR #2)
      const fdl = await deskAs(browser, 'qa.fdl');
      try {
        const uploads = recordWrites(fdl, 'POST', /\/attachments$/);
        const payouts = recordWrites(fdl, 'POST', /\/actions\/execute-cash-refund$/);
        row = await refundRow(fdl, res.code);
        await row.getByRole('button', { name: t('refund.execute_cash'), exact: true }).click();
        const dlg = fdl.getByRole('dialog', { name: t('refund.execute_cash') });
        await expect(dlg).toBeVisible();
        expect(digits(await dlg.getByLabel(t('co.amount')).inputValue()), 'số tiền mặc định').toBe(
          amount,
        );
        await dlg.getByLabel(t('refund.proof')).setInputFiles(photo(PNG_16X16, 'bien-nhan.png'));
        await dlg.getByRole('button', { name: t('refund.execute_cash'), exact: true }).click();
        const up = await waitWrite(uploads, 'uploadAttachment refund_proof (ảnh biên nhận)', 201);
        const pay = await waitWrite(payouts, 'executeCashRefund', 201);
        const attachmentId = (JSON.parse(up.body) as { id: string }).id;
        expect(pay.request?.attachmentId, 'giao dịch chi mang đúng ảnh vừa tải').toBe(attachmentId);
        await expect(dlg).toBeHidden({ timeout: 10_000 });
        await expect(
          fdl.getByText(new RegExp(esc(t('refund.paid').split('{')[0]!.trim()))).first(),
        ).toBeVisible();
      } finally {
        await fdl.context().close();
      }
      const after = (await approvalsOf(request, mgr, res.code, 'refund')).find(
        (a) => a.id === approvalId,
      );
      expect(after?.refundedVnd, 'đã ghi chi đủ khoản hoàn').toBe(amount);
      const f = await getFolio(request, mgr, res.folioId);
      const refund = f.payments.find((p) => p.type === 'refund' && p.amountVnd === -amount);
      expect(refund, 'giao dịch hoàn âm trong folio').toBeTruthy();
    });

    test('TC-L4-094 (E) US-021/AC4 ghi hoàn CHUYỂN KHOẢN trên Desk: chủ đầu tư nhập mã giao dịch + ảnh ủy nhiệm chi (BUG-R2-066)', async ({
      browser,
      request,
    }) => {
      test.slow();
      const amount = 300000;
      const { res, approvalId } = await overpaidWithRefund(
        request,
        amount,
        'Hoan chuyen khoan tra du',
      );
      const fd = await session(request, 'qa.fd');
      const mgr = await session(request, 'qa.mgr');
      // nơi nhận chuyển khoản (C3 – máy được cấp) và duyệt: API, không phải đối tượng kiểm (ô "Ngân hàng nhận" là
      // BUG-R2-074, sửa ở Sprint 4)
      const accountNo = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
      const dest = await call(request, 'PUT', p3(EP3.setRefundDestination, fd, { approvalId }), {
        ...dev(fd),
        idempotencyKey: true,
        body: {
          method: 'bank_transfer',
          bankBin: '970436',
          accountNo,
          accountHolder: 'NGUYEN VAN E2E',
        },
      });
      expect(dest.status, JSON.stringify(dest.body)).toBe(200);
      const ok = await approve(request, mgr, approvalId);
      expect(ok.status, `approve: ${JSON.stringify(ok.body)}`).toBe(200);

      // chủ đầu tư (không tạo, không duyệt, không nhập nơi nhận – A47, SEC-37) ghi đã chuyển trên Desk
      const own = await deskAs(browser, 'qa.owner');
      try {
        const uploads = recordWrites(own, 'POST', /\/attachments$/);
        const payouts = recordWrites(own, 'POST', /\/actions\/execute-refund$/);
        const row = await refundRow(own, res.code);
        await row.getByRole('button', { name: t('refund.execute_transfer'), exact: true }).click();
        const dlg = own.getByRole('dialog', { name: t('refund.execute_transfer') });
        await expect(dlg).toBeVisible();
        expect(digits(await dlg.getByLabel(t('co.amount')).inputValue())).toBe(amount);
        const bankRef = `FT${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
        await dlg.getByLabel(t('refund.bank_reference')).fill(bankRef);
        await dlg.getByLabel(t('refund.proof')).setInputFiles(photo(PNG_16X16, 'uy-nhiem-chi.png'));
        await dlg.getByRole('button', { name: t('refund.execute_transfer'), exact: true }).click();
        const up = await waitWrite(uploads, 'uploadAttachment refund_proof (ủy nhiệm chi)', 201);
        const pay = await waitWrite(payouts, 'executeRefund', 201);
        expect(pay.request?.attachmentId).toBe((JSON.parse(up.body) as { id: string }).id);
        expect(pay.request?.bankReference).toBe(bankRef);
        await expect(dlg).toBeHidden({ timeout: 10_000 });
      } finally {
        await own.context().close();
      }
      const after = (await approvalsOf(request, mgr, res.code, 'refund')).find(
        (a) => a.id === approvalId,
      );
      expect(after?.refundedVnd).toBe(amount);
      const f = await getFolio(request, mgr, res.folioId);
      expect(f.payments.some((p) => p.type === 'refund' && p.amountVnd === -amount)).toBe(true);
    });

    test('TC-L2-085 (E) US-021/AC2+AC4 hộp Hủy đơn khi hoàn 100 % cọc (BR-309-03): nêu số tiền hoàn, không nói "chưa thu tiền"; hủy → yêu cầu hoàn đúng số (BUG-R2-069)', async ({
      page,
      request,
    }) => {
      const fd = await session(request, 'qa.fd');
      const mgr = await session(request, 'qa.mgr');
      const c = await s2Context(request);
      // đơn Trực tiếp đã cọc, ngày đến ≥ 30 ngày nữa (≥ 7 ngày → hoàn 100 % cọc – BR-309-03), không đêm cao điểm
      const res = await farBooking(request, c, fd, { nights: 1, today: await stackToday(request) });
      const paid = (await getFolio(request, fd, res.folioId)).totals.paidVnd;
      expect(paid, 'đơn đã cọc').toBeGreaterThan(0);
      const o = oracle('BR-309-03');
      expect(o.expected.refundVnd, 'oracle BR-309-03: hoàn 100 % cọc').toBe(o.input.depositVnd);
      const pv = await call<{ cancellation: { refundableVnd: number; retainedVnd: number } }>(
        request,
        'POST',
        `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}/actions/cancel`,
        { session: fd, body: { reasonCode: 'guest_changed_mind', dryRun: true } },
      );
      expect(pv.status, JSON.stringify(pv.body)).toBe(200);
      expect(pv.body.cancellation).toMatchObject({ refundableVnd: paid, retainedVnd: 0 });

      await signIn(page, 'qa.fd');
      const cancels = recordWrites(page, 'POST', /\/reservations\/[^/]+\/actions\/cancel$/);
      await go(page, `/reservations/${res.id}`);
      await expect(page.getByText(res.code).first()).toBeVisible({ timeout: 10_000 });
      await page
        .getByRole('button', { name: t('drawer.action.cancel_booking'), exact: true })
        .first()
        .click();
      const box = page.getByRole('alertdialog');
      await expect(box).toBeVisible();
      await expect(box.getByText(t('cancel.preview_loading'))).toBeHidden({ timeout: 10_000 });
      // UXR #5: thiếu nhánh refundable > 0 && retained = 0 → câu "Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn"
      const noMoney = t('confirm.cancel_booking.body_no_money').split('. ').pop()!.trim();
      await expect(box, 'không nói "chưa thu tiền" khi đơn đã cọc').not.toContainText(noMoney);
      await expect(box, `câu hậu quả nêu số tiền hoàn ${vnd(paid)}`).toContainText(amountRe(paid));
      await box
        .getByLabel(t('cancel.reason'))
        .selectOption({ label: t('cancel.reason.changed_mind') });
      await box
        .getByRole('button', { name: t('drawer.action.cancel_booking'), exact: true })
        .click();
      const done = await waitWrite(
        cancels,
        'cancelReservation',
        200,
        (s) => s.request?.dryRun !== true,
      );
      await expect(box).toBeHidden({ timeout: 10_000 });
      const refundId = (
        JSON.parse(done.body) as { cancellation?: { refundApprovalRequestId?: string } }
      ).cancellation?.refundApprovalRequestId;
      expect((await getReservation(request, fd, res.id)).body.status).toBe('cancelled');
      const refunds = await approvalsOf(request, mgr, res.code, 'refund');
      const r = refunds.find((a) => a.id === refundId) ?? refunds[0];
      expect(r, 'yêu cầu hoàn cho quản lý duyệt (BR-522)').toBeTruthy();
      expect(r!.amountVnd).toBe(paid);
    });

    test('TC-L2-086 (E) US-020/– drawer: dòng "Đã thu" = tiền đã thu thật (folio), không phải tiền phòng − còn phải thu – giữ chỗ chưa cọc, đơn đã hủy có cọc (BUG-R2-070)', async ({
      page,
      request,
    }) => {
      const fd = await session(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      await signIn(page, 'qa.fd');

      // (a) giữ chỗ chưa cọc (như D5 của demo: "Đã thu −1.416.000")
      const rm = c.rooms[Math.floor(Math.random() * c.rooms.length)]!;
      const w = await freeWindow(request, fd, rm, 1, { today });
      const { hold } = await makeHold(request, fd, c, {
        rooms: [rm, ...c.rooms.filter((x) => x.id !== rm.id)],
        arrival: w.arrival,
        nights: 1,
        holdHours: 24,
      });
      const holdPaid = hold.folioId
        ? (await getFolio(request, fd, hold.folioId)).totals.paidVnd
        : 0;
      expect(holdPaid, 'giữ chỗ chưa cọc: chưa thu đồng nào').toBe(0);
      await go(page, `/reservations/${hold.id}`);
      await expect(page.getByText(hold.code).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(t('drawer.folio.title'), { exact: true })).toBeVisible();
      await expect.poll(() => drawerBalance(page), { timeout: 10_000 }).not.toBeNull();
      // chưa thu thì "Đã thu" là 0 (đơn có folio: dòng hiện sau khi đọc folio) hoặc không hiện (chưa có folio) –
      // không bao giờ là tiền phòng
      if (hold.folioId) {
        await expect
          .poll(() => drawerPaid(page), { timeout: 10_000, message: 'giữ chỗ chưa cọc: "Đã thu"' })
          .toBe(holdPaid);
      } else {
        expect((await drawerPaid(page)) ?? 0, 'giữ chỗ chưa cọc: "Đã thu"').toBe(holdPaid);
      }

      // (b) đơn đã cọc rồi hủy (như A của demo: "Đã thu −1.822.000" khi mới cọc 500.000)
      const res = await farBooking(request, c, fd, { nights: 2, today });
      const cancel = await action(request, fd, res.id, 'cancel', {
        reasonCode: 'guest_changed_mind',
      });
      expect(cancel.status, JSON.stringify(cancel.body)).toBe(200);
      const paid = (await getFolio(request, fd, res.folioId)).totals.paidVnd;
      expect(paid, 'đơn đã cọc').toBeGreaterThan(0);
      await go(page, `/reservations/${res.id}`);
      await expect(page.getByText(res.code).first()).toBeVisible({ timeout: 10_000 });
      await expect
        .poll(() => drawerPaid(page), {
          timeout: 10_000,
          message: `đơn đã hủy: "Đã thu" = ${vnd(paid)} (folio), không phải tiền phòng − còn phải thu`,
        })
        .toBe(paid);
    });
  },
);
