// E2E Sprint 3 – L4 (EP04, EP05, EP15) – phần chạy ở project "api" (đồng hồ thật, song song): KHÔNG nhận phòng.
// Đơn confirmed ngày xa (support/s3-stay.ts farBooking – khoảng trống today + 30…320, hủy ở afterEach): danh mục phí,
// hóa đơn công ty, ghi thu/đảo giao dịch/hoàn tiền (tách nhiệm BR-522-01, C3 nơi nhận hoàn), VietQR CHƯA cấu hình
// (TC-L4-065 – tài khoản nhận chỉ được đặt cho NGÀY ẢO ở project clock), schema không có trường thẻ.
// Các TC cần đơn in_house / trả phòng / mốc giờ ở e2e/clock/stay-checkout.s3.clock.spec.ts.
// TC: product/tests/test-cases/r1-main-flows.md mục 5 (L4). Oracle: fixtures/br-examples.json (oracle()).
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
} from '../support/api.js';
import {
  EP,
  addDays,
  cleanupTracked,
  fieldCodes,
  getReservation,
  makeHold,
  oracle,
  oracleNum,
  s2Context,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  CAN_CLEAN_ROOMS,
  addDocument,
  addLine,
  approve,
  dev,
  foreignDoc,
  getFolio,
  liveLines,
  namedGuest,
  p3,
  recordPayment,
  registrationOf,
  stackSql,
  stepUp,
  vnDoc,
  type Payment,
} from '../support/s3.js';
import { approvalsOf, dsParam, farBooking, upload, type Approval } from '../support/s3-stay.js';

let today = '';

test.describe(
  'L4 – Lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền (EP04, EP05, EP15 – Sprint 3)',
  { tag: ['@api', '@sprint3'] },
  () => {
    test.beforeAll(async ({ request }) => {
      today = await stackToday(request);
    });
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test.describe('5.1 Gia hạn, trả muộn, nhắc trả phòng, phát sinh', () => {
      test(
        'TC-L4-034 US-032/– [U · Thấp]',
        {
          annotation: [
            { type: 'story', description: 'US-032/–' },
            { type: 'endpoints', description: 'getChargeCatalog' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Bảng đền bù tạm
          // Bước: Thêm khăn tắm, ly, remote
          // Kỳ vọng: 150.000; 50.000; 200.000
          // Quy tắc: BR-512
          await requireEndpoints(request, 'TC-L4-034', [EP3.getChargeCatalog, EP3.addFolioLine]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const cat = await call<{
            data: Array<{
              code: string;
              category: string;
              defaultUnitPriceVnd: number;
              evidenceRequired?: boolean;
              priceEditable?: boolean;
              ruleRef?: string;
            }>;
          }>(request, 'GET', p3(EP3.getChargeCatalog, fd), { session: fd });
          expect(cat.status, JSON.stringify(cat.body)).toBe(200);
          const expected = oracle('BR-512-01').expected.catalogVnd as Record<string, number>;
          for (const [code, price] of Object.entries(expected)) {
            const item = cat.body.data.find((x) => x.code === `damage.${code}`);
            expect(item, `danh mục thiếu damage.${code}`).toBeTruthy();
            expect(item!.category).toBe('damage');
            expect(item!.defaultUnitPriceVnd).toBe(price);
            expect(item!.evidenceRequired).toBe(true);
            expect(item!.priceEditable).toBe(false);
          }
          // Lễ tân thêm 3 món đền bù (kèm biên bản) lên folio của đơn: giá lấy từ bảng, không sửa được
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 2, today });
          for (const [code, price] of Object.entries(expected)) {
            const r = await addLine(request, fd, res.folioId, {
              chargeCode: `damage.${code}`,
              quantity: 1,
              serviceDate: res.arrivalDate,
              note: 'Bien ban kiem phong E2E',
            });
            expect(r.status, JSON.stringify(r.body)).toBe(201);
            const line = r.body.lines.find((l) => l.description === `damage.${code}`);
            expect(line, `dòng damage.${code}`).toBeTruthy();
            expect(line!.amountVnd).toBe(price);
            expect(line!.category).toBe('damage');
          }
          const edited = await addLine(request, fd, res.folioId, {
            chargeCode: 'damage.glass',
            quantity: 1,
            unitPriceVnd: 1000,
            serviceDate: res.arrivalDate,
            note: 'Bien ban kiem phong E2E',
          });
          expect(edited.status).toBe(422);
          expect(fieldCodes(edited.body)).toContain('unitPriceVnd:PRICE_NOT_EDITABLE');
        },
      );
    });

    test.describe('5.2 Trả phòng 3 bước, bill, thu tiền', () => {
      test(
        'TC-L4-051 US-037/AC2 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-037/AC2' },
            { type: 'endpoints', description: 'getBill' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: (a) khách đứng tên hộ chiếu nước ngoài; (b) khách VN hồ sơ ngôn ngữ "English"; (c)
          //   khách VN tiếng Việt; tỷ giá 26.200 cập nhật 10/10
          // Bước: Xem bill
          // Kỳ vọng: (a), (b) bill song ngữ Việt – Anh + dòng quy đổi USD tham khảo kèm ngày cập nhật tỷ giá
          //   (13.908.000 đ ≈ 530,8 USD); (c) chỉ tiếng Việt
          // Quy tắc: BR-004, BR-009
          // Bill đọc được trên đơn confirmed (không cần nhận phòng) → chạy ở project api.
          await requireEndpoints(request, 'TC-L4-051', [
            EP3.getBill,
            EP3.addFolioLine,
            EP3.addGuestDocument,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const o = oracle('BR-004-01');
          const target = Number(o.input.amountVnd); // 13.908.000
          const rate = dsParam<number>('fx_usd_vnd'); // 26.200 (DS-E)
          const bill = async (guest: Record<string, unknown>, doc: 'foreign' | 'vn') => {
            const g = await namedGuest(request, fd, guest);
            const res = await farBooking(request, c, fd, { nights: 1, today, guestId: g.id });
            const regId = await registrationOf(request, fd, res);
            const name = String(guest.fullName ?? g.fullName);
            const d = await addDocument(
              request,
              fd,
              regId,
              doc === 'foreign'
                ? foreignDoc(name, res.departureDate, { entryDate: addDays(today, -1) })
                : vnDoc(name),
            );
            expect(d.status, JSON.stringify(d.body)).toBe(201);
            // tổng bill = số tiền của ví dụ BR-004-01 (thêm dòng dịch vụ cho đủ)
            const f = await getFolio(request, fd, res.folioId);
            const add = await addLine(request, fd, res.folioId, {
              category: 'fnb',
              description: 'Tiec sinh nhat',
              quantity: 1,
              unitPriceVnd: target - f.totals.totalVnd,
              serviceDate: res.arrivalDate,
            });
            expect(add.status, JSON.stringify(add.body)).toBe(201);
            const b = await call<{
              locale: string;
              totalVnd: number;
              usdReference?: { rate: number; totalUsd: number; rateUpdatedOn?: string };
            }>(request, 'GET', p3(EP3.getBill, fd, { folioId: res.folioId }), { session: fd });
            expect(b.status, JSON.stringify(b.body)).toBe(200);
            expect(b.body.totalVnd).toBe(target);
            return b.body;
          };
          // (a) khách đứng tên hộ chiếu nước ngoài (hồ sơ quốc tịch DE)
          const a = await bill({ fullName: 'Daniel Weber', nationalityCode: 'DE' }, 'foreign');
          // (b) khách VN, ngôn ngữ hồ sơ English
          const b = await bill({ nationalityCode: 'VN', preferredLocale: 'en' }, 'vn');
          for (const x of [a, b]) {
            expect(x.locale).toBe('vi_en');
            expect(x.usdReference?.rate).toBe(rate);
            expect(x.usdReference?.totalUsd.toFixed(1)).toBe(String(o.expected.usdDisplay));
            expect(x.usdReference?.rateUpdatedOn, 'ngày cập nhật tỷ giá').toMatch(
              /^\d{4}-\d{2}-\d{2}$/,
            );
            expect(x.usdReference!.rateUpdatedOn! <= today).toBe(true);
          }
          // (c) khách VN tiếng Việt → chỉ tiếng Việt, không quy đổi USD
          const cc = await bill({ nationalityCode: 'VN', preferredLocale: 'vi' }, 'vn');
          expect(cc.locale).toBe('vi');
          expect(cc.usdReference).toBeUndefined();
        },
      );
      test(
        'TC-L4-058 US-039/AC1 [A+U · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-039/AC1' },
            { type: 'endpoints', description: 'setInvoiceRequest' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Tích "Khách lấy hóa đơn công ty"
          // Bước: MST: 0101234567; 0101234567-001; 0101234567001; 010123456; 01012345678; 01A1234567
          // Kỳ vọng: 10 số, 13 số (có/không gạch ngang) hợp lệ; 9 số, 11 số, có chữ → lỗi rõ tại ô MST
          // Quy tắc: BL 5.16, ERD invoice_request
          await requireEndpoints(request, 'TC-L4-058', [EP3.setInvoiceRequest]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 1, today });
          const put = (taxCode: string) =>
            call<Record<string, unknown> & ProblemFields>(
              request,
              'PUT',
              p3(EP3.setInvoiceRequest, fd, { folioId: res.folioId }),
              {
                session: fd,
                idempotencyKey: true,
                body: {
                  buyerType: 'company',
                  companyName: 'Cong ty TNHH Thu Nghiem E2E',
                  taxCode,
                  email: 'ketoan.e2e@example.test',
                },
              },
            );
          for (const ok of ['0101234567', '0101234567-001', '0101234567001']) {
            const r = await put(ok);
            expect(r.status, `${ok}: ${JSON.stringify(r.body)}`).toBe(200);
            expect(r.body.taxCode).toBe(ok);
          }
          for (const bad of ['010123456', '01012345678', '01A1234567']) {
            const r = await put(bad);
            expect(r.status, `${bad}: ${JSON.stringify(r.body)}`).toBe(422);
            expect(fieldCodes(r.body), bad).toContain('taxCode:TAX_CODE_INVALID');
          }
        },
      );
      test(
        'TC-L4-059 US-039/AC2 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-039/AC2' },
            { type: 'endpoints', description: 'setInvoiceRequest, getBill, getGuest' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: MST hợp lệ
          // Bước: Lưu tên công ty, MST, email
          // Kỳ vọng: Thông tin gắn với bill và hồ sơ khách; hóa đơn điện tử thật để R3 (US-122)
          // Quy tắc: BR-524, D16
          await requireEndpoints(request, 'TC-L4-059', [
            EP3.setInvoiceRequest,
            EP3.getBill,
            EP3.getFolio,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 1, today });
          const inv = {
            buyerType: 'company',
            companyName: 'Cong ty CP Du Lich Thu Nghiem',
            taxCode: '0312345678',
            email: 'hoadon.e2e@example.test',
            address: '1 Nguyen Hue, Quan 1, TP HCM',
          };
          const r = await call<Record<string, unknown>>(
            request,
            'PUT',
            p3(EP3.setInvoiceRequest, fd, { folioId: res.folioId }),
            { session: fd, idempotencyKey: true, body: inv },
          );
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          // R2: chỉ lưu yêu cầu, MISA phát hành ở R3 (US-122) → not_requested
          expect(r.body.einvoiceStatus).toBe('not_requested');
          const f = await getFolio(request, fd, res.folioId);
          expect(f.invoiceRequest).toMatchObject({
            buyerType: 'company',
            companyName: inv.companyName,
            taxCode: inv.taxCode,
            email: inv.email,
          });
          const bill = await call<Record<string, unknown>>(
            request,
            'GET',
            p3(EP3.getBill, fd, { folioId: res.folioId }),
            { session: fd },
          );
          expect(bill.status, JSON.stringify(bill.body)).toBe(200);
          expect(bill.body.folioId).toBe(res.folioId);
          // Hồ sơ khách (D16): spec EP03-05 5.x "thông tin gắn folio + hồ sơ khách"
          const guestId = (res as { booker?: { id?: string } }).booker?.id;
          expect(guestId, 'Reservation.booker.id').toBeTruthy();
          const g = await call<Record<string, unknown>>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(fd)}/guests/${guestId}`,
            { session: fd },
          );
          expect(g.status, JSON.stringify(g.body)).toBe(200);
          // BUG-R2-041 đã sửa ở vòng sửa 2 (cây làm việc sau e3959ec) – QA bỏ test.fail 17/10, kiểm lại trên stack mới
          expect(g.body.companyName).toBe(inv.companyName);
          expect(g.body.taxCode).toBe(inv.taxCode);
        },
      );
      test(
        'TC-L4-060 US-119/AC1 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'story', description: 'US-119/AC1' },
            { type: 'endpoints', description: 'recordPayment, getFolio' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn tổng 2.460.000 đã thu cọc 800.000
          // Bước: Ghi thu 1.660.000 chuyển khoản
          // Kỳ vọng: Còn phải thu 0; đơn có 2 giao dịch succeeded với cách thanh toán, người thu, thời điểm, mã
          //   PT-xxxxxx
          // Quy tắc: BR-521, SM-12 *→succeeded
          await requireEndpoints(request, 'TC-L4-060', [EP3.recordPayment, EP3.getFolio]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          // 3 đêm × 820.000 = 2.460.000 (giá nhập tay kênh Trực tiếp); cọc = mức BR-305 server yêu cầu
          const res = await farBooking(request, c, fd, { nights: 3, today, rate: 820000 });
          const f0 = await getFolio(request, fd, res.folioId);
          expect(f0.totals.totalVnd).toBe(3 * 820000);
          const deposit = f0.totals.paidVnd;
          expect(deposit).toBe(res.depositRequiredVnd);
          const rest = f0.totals.totalVnd - deposit;
          expect(f0.totals.balanceDueVnd).toBe(rest);
          const p = await recordPayment(request, fd, res.folioId, {
            type: 'charge',
            method: 'bank_transfer',
            amountVnd: rest,
            note: 'CK Vietcombank E2E',
          });
          expect(p.status, JSON.stringify(p.body)).toBe(201);
          expect(p.body.status).toBe('succeeded');
          expect(p.body.code).toMatch(/^PT-\d+/);
          // chuyển khoản ghi tay → chờ đối soát (BR-527)
          expect(p.body.reconciliation).toBe('pending');
          const f = await getFolio(request, fd, res.folioId);
          expect(f.totals.balanceDueVnd).toBe(0);
          expect(f.totals.paidVnd).toBe(f0.totals.totalVnd);
          const ok = f.payments.filter((x) => x.status === 'succeeded');
          expect(ok).toHaveLength(2);
          for (const x of ok) {
            expect(x.code).toMatch(/^PT-\d+/);
            expect(['cash', 'bank_transfer']).toContain(x.method);
            expect(x.recordedBy, 'người thu').toBeTruthy();
            expect(x.receivedAt, 'thời điểm').toBeTruthy();
          }
          expect(ok.map((x) => x.amountVnd).sort((a, b) => a - b)).toEqual(
            [deposit, rest].sort((a, b) => a - b),
          );
        },
      );
      test(
        'TC-L4-061 US-119/AC2 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-119/AC2' },
            { type: 'endpoints', description: 'getFolio' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn Booking "OTA thu hộ" 3 đêm, phát sinh 75.000
          // Bước: Xem còn phải thu
          // Kỳ vọng: Chỉ 75.000; tiền phòng không cộng
          // Quy tắc: BR-307
          await requireEndpoints(request, 'TC-L4-061', [EP3.getFolio, EP3.addFolioLine]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 3, today, kind: 'booking' });
          expect(res.paymentModel).toBe('ota_prepaid');
          // phát sinh 75.000 = giặt ủi 2,5 kg (oracle BR-507-01)
          const kg = Number(oracle('BR-507-01').input.weightGrams) / 1000;
          const add = await addLine(request, fd, res.folioId, {
            chargeCode: 'laundry',
            quantity: kg,
            serviceDate: res.arrivalDate,
          });
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const f = await getFolio(request, fd, res.folioId);
          expect(liveLines(f, 'room').length).toBe(3);
          // BUG-R2-044 đã sửa ở 229db99 – QA kiểm lại 17/10, đóng; bỏ test.fail có điều kiện để hồi quy báo đỏ
          expect(f.totals.paidViaOtaVnd).toBe(f.totals.roomVnd);
          expect(f.totals.balanceDueVnd).toBe(oracleNum('BR-507-01', 'amountVnd'));
        },
      );
      test(
        'TC-L4-062 US-119/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-119/AC3' },
            { type: 'endpoints', description: 'reversePayment' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Giao dịch ghi sai 1.660.000
          // Bước: (a) qa.fd đảo; (b) qa.mgr đảo không lý do; (c) qa.mgr đảo có lý do; (d) thử xóa giao dịch
          // Kỳ vọng: (a) 403; (b) 422; (c) giao dịch gốc reversed + giao dịch âm có lý do; (d) không có endpoint,
          //   DB từ chối DELETE
          // Quy tắc: A34, BR-008, ERD K8, SM-12 succeeded→reversed
          // + tách nhiệm hoàn tiền (BR-522-01, SEC F8, A43/A47/A47a, D15) – test.step "tách nhiệm"
          // mọi endpoint của ca (cả bước hoàn tiền + C3) kiểm NGAY ĐẦU ca: sau một lần đăng nhập trong ca, request
          // context giữ cookie phiên → lần thăm dò "ẩn danh" của isAvailable() thành có phiên và trả 404 (sai)
          await requireEndpoints(request, 'TC-L4-062', [
            EP3.reversePayment,
            EP3.recordPayment,
            EP3.createRefundRequest,
            EP3.setRefundDestination,
            EP3.getRefundDestination,
            EP3.executeCashRefund,
            EP3.executeRefund,
            EP3.approveRequest,
            EP3.listApprovalRequests,
            EP3.uploadAttachment,
            EP3.stepUp,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const mgr = await sessionOrSkip(request, 'qa.mgr');
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 3, today, rate: 820000 });
          const f0 = await getFolio(request, fd, res.folioId);
          const wrong = f0.totals.balanceDueVnd; // 2.460.000 − cọc (= 1.660.000 với cọc 800.000)
          const p = await recordPayment(request, fd, res.folioId, {
            type: 'charge',
            method: 'bank_transfer',
            amountVnd: wrong,
          });
          expect(p.status, JSON.stringify(p.body)).toBe(201);
          const rev = (s: typeof fd, body: Record<string, unknown>) =>
            call<Payment & ProblemFields>(
              request,
              'POST',
              p3(EP3.reversePayment, s, { paymentId: p.body.id }),
              { session: s, idempotencyKey: true, body },
            );
          await test.step('(a) qa.fd đảo → 403', async () => {
            expectProblem(await rev(fd, { reason: 'Ghi nham so tien' }), 403);
          });
          await test.step('(b) qa.mgr đảo không lý do → 422', async () => {
            const r = await rev(mgr, {});
            expect(r.status, JSON.stringify(r.body)).toBe(422);
            const r2 = await rev(mgr, { reason: ' ' });
            expect(r2.status).toBe(422);
            expect(fieldCodes(r2.body)).toContain('reason:REASON_REQUIRED');
          });
          await test.step('(c) qa.mgr đảo có lý do → gốc reversed + giao dịch âm', async () => {
            const r = await rev(mgr, { reason: 'Ghi nham so tien – E2E' });
            expect(r.status, JSON.stringify(r.body)).toBe(200);
            expect(r.body.status).toBe('reversed');
            const f = await getFolio(request, mgr, res.folioId);
            const neg = f.payments.find((x) => x.reversalOfId === p.body.id);
            expect(neg, 'giao dịch đảo').toBeTruthy();
            expect(neg!.amountVnd).toBe(-wrong);
            expect(f.totals.balanceDueVnd).toBe(wrong);
            // đảo lần 2 → 409
            expectProblem(await rev(mgr, { reason: 'Dao lan hai' }), 409, 'INVALID_TRANSITION');
          });
          await test.step('(d) không có thao tác xóa; DB không cho DELETE/UPDATE số tiền', async () => {
            const del = await call(
              request,
              'DELETE',
              `/v1/properties/${propertyIdOf(mgr)}/payments/${p.body.id}`,
              { session: mgr },
            );
            expect([404, 405]).toContain(del.status);
            const f = await getFolio(request, mgr, res.folioId);
            expect(f.payments.some((x) => x.id === p.body.id)).toBe(true);
            if (CAN_CLEAN_ROOMS) {
              const priv = stackSql(
                `SELECT has_table_privilege('ottimo_app', 'payment', 'DELETE'),
                        has_column_privilege('ottimo_app', 'payment', 'amount_vnd', 'UPDATE');`,
              ).trim();
              expect(priv).toBe('f|f');
            }
          });

          // ── tách nhiệm hoàn tiền: oracle BR-522-01 (hoàn đã duyệt 350.000, FD sáng tạo yêu cầu, MGR duyệt) ──
          await test.step('tách nhiệm hoàn tiền mặt (BR-522-01, A47a) + MGR không tự duyệt (SEC F8)', async () => {
            const o = oracle('BR-522-01');
            const approved = Number(o.input.refundApprovedVnd);
            const fd2 = await sessionOrSkip(request, 'qa.fd2');
            const r2 = await farBooking(request, c, fd, { nights: 1, today, pay: 'full' });
            // khách trả dư (thu dư FD+ cần ghi chú – DOM G-15) → creditVnd
            const over = await recordPayment(request, fd, r2.folioId, {
              type: 'charge',
              method: 'cash',
              amountVnd: approved + 200000,
              note: 'Khach tra du – se hoan',
            });
            expect(over.status, JSON.stringify(over.body)).toBe(201);
            expect((await getFolio(request, fd, r2.folioId)).totals.creditVnd).toBe(
              approved + 200000,
            );
            const createRefund = (s: typeof fd, amountVnd: number) =>
              call<Approval & ProblemFields>(
                request,
                'POST',
                p3(EP3.createRefundRequest, s, { folioId: r2.folioId }),
                {
                  session: s,
                  idempotencyKey: true,
                  body: { amountVnd, reason: 'Hoan tien tra du' },
                },
              );
            // MGR tạo yêu cầu hoàn rồi tự duyệt → 403 SELF_APPROVAL_FORBIDDEN (kể cả MGR/OWN)
            const mine = await createRefund(mgr, 100000);
            expect(mine.status, JSON.stringify(mine.body)).toBe(201);
            expect(mine.body.type).toBe('refund');
            expectProblem(
              await approve(request, mgr, mine.body.id),
              403,
              'SELF_APPROVAL_FORBIDDEN',
            );
            // vượt số dư còn có thể hoàn → 422 REFUND_EXCEEDS_APPROVED
            const tooMuch = await createRefund(fd, approved + 200000);
            expect(tooMuch.status).toBe(422);
            expect(fieldCodes(tooMuch.body)).toContain('amountVnd:REFUND_EXCEEDS_APPROVED');
            // FD sáng tạo yêu cầu 350.000, nơi nhận tiền mặt, MGR duyệt
            const req = await createRefund(fd, approved);
            expect(req.status, JSON.stringify(req.body)).toBe(201);
            const dest = await call<Approval>(
              request,
              'PUT',
              p3(EP3.setRefundDestination, fd, { approvalId: req.body.id }),
              { ...dev(fd), idempotencyKey: true, body: { method: 'cash' } },
            );
            expect(dest.status, JSON.stringify(dest.body)).toBe(200);
            const ok = await approve(request, mgr, req.body.id);
            expect(ok.status, JSON.stringify(ok.body)).toBe(200);
            expect(ok.body.status).toBe('approved');
            const proof = await upload(request, fd2, 'refund_proof', r2.id);
            const pay = (s: typeof fd, amountVnd: number, att: string) =>
              call<Payment & ProblemFields>(
                request,
                'POST',
                p3(EP3.executeCashRefund, s, { approvalId: req.body.id }),
                {
                  session: s,
                  idempotencyKey: true,
                  body: { amountVnd, paidAt: new Date().toISOString(), attachmentId: att },
                },
              );
            // Kết quả từng lần thử theo cách gọi của oracle; các lần bị từ chối chạy trước (không ghi gì), lần chi
            // hợp lệ chạy sau cùng – nếu chạy trước thì yêu cầu đã `refunded` và mọi lần sau chỉ còn 409.
            const label = (r: { status: number; body?: { code?: string } }, kind: string) =>
              r.status === 201
                ? 'paid'
                : r.status === 403 && r.body?.code === 'SELF_REFUND_FORBIDDEN'
                  ? 'rejected_self_requested'
                  : r.status === 403 && kind === 'transfer'
                    ? 'rejected_transfer_manager_only'
                    : r.status === 422
                      ? 'rejected_over_approved'
                      : `${r.status} ${r.body?.code ?? ''}`;
            // lần 2: chính FD sáng (người tạo yêu cầu) chi tiền mặt
            const proof2 = await upload(request, fd, 'refund_proof', r2.id);
            const a2 = await pay(fd, approved, proof2);
            // lần 3: FD chiều chi chuyển khoản (chỉ MGR/OWN – A47)
            const a3 = await call<ProblemFields>(
              request,
              'POST',
              p3(EP3.executeRefund, fd2, { approvalId: req.body.id }),
              {
                session: fd2,
                idempotencyKey: true,
                body: {
                  amountVnd: approved,
                  paidAt: new Date().toISOString(),
                  bankReference: 'FT0001',
                },
              },
            );
            // lần 4: FD chiều chi 400.000 > số đã duyệt
            const a4 = await pay(fd2, 400000, proof);
            // lần 1: FD chiều chi tiền mặt đúng số đã duyệt
            const a1 = await pay(fd2, approved, proof);
            expect(a1.status, JSON.stringify(a1.body)).toBe(201);
            expect(a1.body.type).toBe('refund');
            expect(a1.body.amountVnd).toBe(-approved);
            const results = [
              label(a1, 'cash'),
              label(a2, 'cash'),
              label(a3, 'transfer'),
              label(a4, 'cash'),
            ];
            expect(results).toEqual(o.expected.attemptResults);
            // số dư sau khi hoàn = oracle (0 – phần dư 200.000 còn lại là yêu cầu hoàn 100.000 của MGR + credit)
            const f = await getFolio(request, fd, r2.folioId);
            expect(f.totals.balanceDueVnd).toBe(oracleNum('BR-522-01', 'balanceAfterVnd'));
          });

          await test.step('C3 nơi nhận hoàn chuyển khoản (D15, A47): FD không đọc; MGR cần thiết bị + step-up; danh sách chỉ 4 số cuối', async () => {
            const r3 = await farBooking(request, c, fd, { nights: 1, today, pay: 'full' });
            const over = await recordPayment(request, fd, r3.folioId, {
              type: 'charge',
              method: 'bank_transfer',
              amountVnd: 300000,
              note: 'Khach chuyen du – se hoan',
            });
            expect(over.status, JSON.stringify(over.body)).toBe(201);
            const req = await call<Approval>(
              request,
              'POST',
              p3(EP3.createRefundRequest, fd, { folioId: r3.folioId }),
              {
                session: fd,
                idempotencyKey: true,
                body: { amountVnd: 300000, reason: 'Hoan chuyen khoan tra du' },
              },
            );
            expect(req.status, JSON.stringify(req.body)).toBe(201);
            const accountNo = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
            // không có thiết bị được cấp → 403
            const noDev = await call(
              request,
              'PUT',
              p3(EP3.setRefundDestination, fd, { approvalId: req.body.id }),
              {
                session: fd,
                idempotencyKey: true,
                body: {
                  method: 'bank_transfer',
                  bankBin: '970436',
                  accountNo,
                  accountHolder: 'NGUYEN VAN E2E',
                },
              },
            );
            expect(noDev.status, JSON.stringify(noDev.body)).toBe(403);
            const set = await call<Approval>(
              request,
              'PUT',
              p3(EP3.setRefundDestination, fd, { approvalId: req.body.id }),
              {
                ...dev(fd),
                idempotencyKey: true,
                body: {
                  method: 'bank_transfer',
                  bankBin: '970436',
                  accountNo,
                  accountHolder: 'NGUYEN VAN E2E',
                },
              },
            );
            expect(set.status, JSON.stringify(set.body)).toBe(200);
            expect(set.headers['cache-control']).toContain('no-store');
            expect(JSON.stringify(set.body)).not.toContain(accountNo);
            expect(set.body.refundDestination).toMatchObject({
              method: 'bank_transfer',
              accountNoLast4: accountNo.slice(-4),
            });
            // danh sách duyệt (MGR) chỉ có accountNoLast4
            const list = await approvalsOf(request, mgr, r3.code, 'refund');
            expect(list.length).toBeGreaterThan(0);
            expect(JSON.stringify(list)).not.toContain(accountNo);
            expect(list[0]!.refundDestination).toMatchObject({
              accountNoLast4: accountNo.slice(-4),
            });
            // FD/FDL đọc nơi nhận đầy đủ → 403, không lộ số tài khoản
            for (const who of ['qa.fd', 'qa.fdl']) {
              const s = await sessionOrSkip(request, who);
              const g = await call(
                request,
                'GET',
                p3(EP3.getRefundDestination, s, { approvalId: req.body.id }),
                dev(s),
              );
              expect(g.status, `${who}: ${JSON.stringify(g.body)}`).toBe(403);
              expect(JSON.stringify(g.body)).not.toContain(accountNo);
            }
            // MGR không thiết bị được cấp → 403; có thiết bị nhưng chưa step-up → 401 REAUTH_REQUIRED
            const mgrNoDev = await call(
              request,
              'GET',
              p3(EP3.getRefundDestination, mgr, { approvalId: req.body.id }),
              { session: mgr },
            );
            expect(mgrNoDev.status, JSON.stringify(mgrNoDev.body)).toBe(403);
            expect(JSON.stringify(mgrNoDev.body)).not.toContain(accountNo);
            const mgr2 = await sessionOrSkip(request, 'qa.mgr');
            const fresh = await call<{ accountNo?: string }>(
              request,
              'GET',
              p3(EP3.getRefundDestination, mgr2, { approvalId: req.body.id }),
              dev(mgr2),
            );
            if (fresh.status === 200) {
              // phiên MGR dùng chung đã step-up ở ca khác trong cửa sổ c3_stepup_minutes – vẫn hợp lệ
              expect(fresh.body.accountNo).toBe(accountNo);
            } else {
              expectProblem(fresh, 401, 'REAUTH_REQUIRED');
              expect(JSON.stringify(fresh.body)).not.toContain(accountNo);
              await stepUp(request, mgr2);
              const g = await call<{ accountNo?: string; accountHolder?: string }>(
                request,
                'GET',
                p3(EP3.getRefundDestination, mgr2, { approvalId: req.body.id }),
                dev(mgr2),
              );
              expect(g.status, JSON.stringify(g.body)).toBe(200);
              expect(g.headers['cache-control']).toContain('no-store');
              expect(g.body.accountNo).toBe(accountNo);
            }
          });
        },
      );
      test(
        'TC-L4-063 US-119/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-119/AC4' },
            { type: 'endpoints', description: 'recordPayment' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Giữ chỗ G1 do qa.sal chốt; giữ chỗ G2 của người khác
          // Bước: qa.sal ghi thu cọc G1; ghi thu G2; ghi thu tiền phòng còn lại (không phải cọc) cho G1; qa.ctv1
          //   ghi thu G1
          // Kỳ vọng: G1 cọc: được; G2: 404; khoản không phải cọc: 403; qa.ctv1: 403
          // Quy tắc: A33, x-scope own_deposit_only
          await requireEndpoints(request, 'TC-L4-063', [
            EP3.recordPayment,
            EP.saveQuote,
            EP.createHoldFromQuote,
          ]);
          const sal = await sessionOrSkip(request, 'qa.sal');
          const ctv = await sessionOrSkip(request, 'qa.ctv1');
          const c = await s2Context(request);
          const arrival = addDays(today, 40 + Math.floor(Math.random() * 200));
          const g1 = await makeHold(request, sal, c, {
            rooms: c.rooms,
            arrival,
            nights: 2,
            holdHours: 24,
          });
          const g2 = await makeHold(request, ctv, c, {
            rooms: c.rooms,
            arrival: addDays(arrival, 3),
            nights: 2,
            holdHours: 24,
          });
          const folio = async (id: string) => {
            const fdl = await sessionOrSkip(request, 'qa.fd');
            return (await getReservation(request, fdl, id)).body.folioId!;
          };
          const g1Folio = await folio(g1.hold.id);
          const g2Folio = await folio(g2.hold.id);
          const deposit = g1.hold.depositRequiredVnd ?? 500000; // đủ cọc → đơn confirmed (BR-305, BR-527)
          // G2 của người khác → 404 (phạm vi M, không lộ tồn tại)
          expectProblem(
            await recordPayment(request, sal, g2Folio, {
              type: 'deposit',
              method: 'cash',
              amountVnd: 100000,
            }),
            404,
          );
          // khoản không phải cọc trên GIỮ CHỖ → 422 type NOT_IN_LIST cho mọi vai (16941c6, ARC-S3-02: tiền nhận trên
          // giữ chỗ là cọc – một `charge` không tính cho B4/J1); phần 403 own_deposit_only kiểm sau khi đơn confirmed
          expectProblem(
            await recordPayment(request, sal, g1Folio, {
              type: 'charge',
              method: 'cash',
              amountVnd: 100000,
            }),
            422,
            'VALIDATION_FAILED',
          );
          // CTV không ghi thu được → 403 (A33)
          expectProblem(
            await recordPayment(request, ctv, g1Folio, {
              type: 'deposit',
              method: 'cash',
              amountVnd: 100000,
            }),
            403,
          );
          // G1 – cọc giữ chỗ của chính qa.sal → được, luôn "chờ đối soát" (SEC-BE-22, ESC-017 A)
          const okDep = await recordPayment(request, sal, g1Folio, {
            type: 'deposit',
            method: 'bank_transfer',
            amountVnd: deposit,
            note: 'Coc CK E2E',
          });
          // BUG-R2-042 đã sửa ở 229db99 – QA kiểm lại 17/10, đóng; bỏ test.fail có điều kiện để hồi quy báo đỏ
          expect(okDep.status, JSON.stringify(okDep.body)).toBe(201);
          expect(okDep.body.reconciliation).toBe('pending');
          // đơn đã đủ cọc → confirmed: SAL ghi khoản không phải cọc → 403 (A33/A47 own_deposit_only)
          const fd = await sessionOrSkip(request, 'qa.fd');
          const g1Now = await getReservation(request, fd, g1.hold.id);
          if (g1Now.body.status === 'confirmed') {
            expectProblem(
              await recordPayment(request, sal, g1Folio, {
                type: 'charge',
                method: 'cash',
                amountVnd: 100000,
              }),
              403,
              'FORBIDDEN_ACTION',
            );
          } else {
            test.info().annotations.push({
              type: 'note',
              description: `G1 còn ${g1Now.body.status} sau cọc ${deposit} – phần 403 own_deposit_only chưa kiểm ở lượt này`,
            });
          }
        },
      );
      test(
        'TC-L4-065 US-120/AC2 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-120/AC2' },
            { type: 'endpoints', description: 'createVietQr' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Chưa cấu hình tài khoản nhận
          // Bước: Chọn chuyển khoản bằng qa.fd, qa.mgr
          // Kỳ vọng: Không hiện QR giả; API 409 PAYMENT_NOT_CONFIGURED; qa.mgr/qa.owner thấy "Chưa cấu hình tài
          //   khoản nhận"; qa.fd thấy hướng dẫn liên hệ quản lý
          // Quy tắc: ESC-010
          await requireEndpoints(request, 'TC-L4-065', [EP3.createVietQr]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 2, today });
          const f0 = await getFolio(request, fd, res.folioId);
          expect(f0.totals.balanceDueVnd).toBeGreaterThan(0);
          for (const who of ['qa.fd', 'qa.mgr', 'qa.owner']) {
            const s = await sessionOrSkip(request, who);
            const r = await call<Record<string, unknown> & ProblemFields>(
              request,
              'POST',
              p3(EP3.createVietQr, s, { folioId: res.folioId }),
              { session: s, idempotencyKey: true, body: { amountVnd: f0.totals.balanceDueVnd } },
            );
            expectProblem(r, 409, 'PAYMENT_NOT_CONFIGURED');
            expect(r.body.qrPayload, `${who}: không có QR giả`).toBeUndefined();
          }
          // không sinh giao dịch chờ nào
          const f = await getFolio(request, fd, res.folioId);
          expect(f.payments.filter((x) => x.method === 'vietqr')).toHaveLength(0);
          // MGR/OWN thấy tham số tài khoản nhận chưa có giá trị hôm nay (màn Tham số – "Chưa cấu hình")
          const mgr = await sessionOrSkip(request, 'qa.mgr');
          const params = await call<{ data: Array<{ key: string; value?: unknown }> }>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(mgr)}/parameters`,
            { session: mgr },
          );
          expect(params.status).toBe(200);
          const acc = params.body.data.find((x) => x.key === 'payment_receiving_account');
          expect(acc?.value ?? null).toBeNull();
        },
      );
      test(
        'TC-L4-066 US-119/– [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-119/–' },
            { type: 'endpoints', description: 'recordPayment' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: –
          // Bước: Kiểm schema recordPayment và màn thu tiền bằng thẻ
          // Kỳ vọng: Không có trường số thẻ/CVV/hạn thẻ; thẻ tại quầy chỉ nhận "đã thu bằng thẻ" + 4 số cuối/mã
          //   chuẩn chi
          // Quy tắc: R-PAY-01, R-PAY-03, R-PAY-04
          await requireEndpoints(request, 'TC-L4-066', [EP3.recordPayment]);
          // (1) hợp đồng: PaymentCreate không có trường thẻ
          const yaml = readFileSync(
            new URL('../../../docs/api/openapi.yaml', import.meta.url),
            'utf8',
          );
          const start = yaml.indexOf('\n    PaymentCreate:');
          expect(start, 'components.schemas.PaymentCreate').toBeGreaterThan(0);
          const rest = yaml.slice(start + 1);
          const end = rest.search(/\n {4}[A-Za-z]/);
          const schema = end > 0 ? rest.slice(0, end) : rest;
          expect(schema).not.toMatch(/card_?number|cardNumber|pan\b|cvv|cvc|expiry|expiration/i);
          // (2) thẻ tại quầy: card_pos bắt buộc mã chuẩn chi, không nhận số thẻ
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const res = await farBooking(request, c, fd, { nights: 2, today });
          const noAuth = await recordPayment(request, fd, res.folioId, {
            type: 'charge',
            method: 'card_pos',
            amountVnd: 100000,
          });
          expect(noAuth.status).toBe(422);
          expect(fieldCodes(noAuth.body)).toContain('posAuthCode:REQUIRED');
          // số thẻ (Luhn hợp lệ, dữ liệu thử) ở ghi chú → 422 CARD_NUMBER_DETECTED, không lưu
          const pan = '4111 1111 1111 1111';
          const inNote = await recordPayment(request, fd, res.folioId, {
            type: 'charge',
            method: 'card_pos',
            amountVnd: 100000,
            posAuthCode: 'A1B2C3',
            note: `the ${pan}`,
          });
          expect(inNote.status, JSON.stringify(inNote.body)).toBe(422);
          expect(fieldCodes(inNote.body)).toContain('note:CARD_NUMBER_DETECTED');
          // trường thẻ lạ trong body không được lưu/trả lại
          const ok = await recordPayment(request, fd, res.folioId, {
            type: 'charge',
            method: 'card_pos',
            amountVnd: 100000,
            posAuthCode: 'A1B2C3',
            cardNumber: '4111111111111111',
            cvv: '123',
            expiry: '12/30',
          });
          expect([201, 422]).toContain(ok.status);
          expect(JSON.stringify(ok.body)).not.toMatch(/4111111111111111|"cvv"|"expiry"/);
          if (ok.status === 201) {
            expect(ok.body.method).toBe('card_pos');
            expect(ok.body.reconciliation).toBe('not_required');
            const f = await getFolio(request, fd, res.folioId);
            expect(JSON.stringify(f)).not.toMatch(/4111111111111111|"cvv"/);
          }
          // số thẻ ở ô mã chuẩn chi → 422 CARD_NUMBER_DETECTED (spec EP03-05 2.2, V-09)
          const inAuth = await recordPayment(request, fd, res.folioId, {
            type: 'charge',
            method: 'card_pos',
            amountVnd: 100000,
            posAuthCode: '4111111111111111',
          });
          expect(inAuth.status, JSON.stringify(inAuth.body)).toBe(422);
          expect(JSON.stringify(inAuth.body)).not.toContain('4111111111111111');
          // BUG-R2-043 đã sửa ở vòng sửa 2 (cây làm việc sau e3959ec) – QA bỏ test.fail 17/10, kiểm lại trên stack mới
          expect(fieldCodes(inAuth.body)).toContain('posAuthCode:CARD_NUMBER_DETECTED');
        },
      );
    });

    test.describe('5.3 Biến thể trả phòng dài hạn có khấu trừ ký quỹ (US-041 Must R3 – ca chính)', () => {
      test(
        'TC-L4-080 US-041/– [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-041/–' },
            { type: 'endpoints', description: '—' },
          ],
        },
        async () => {
          // Tiền điều kiện: HĐ Daniel 301, ký quỹ 22.300.000; điện nước kỳ cuối 650.000; khách làm mất 1 thẻ;
          //   biên bản kiểm phòng có ảnh
          // Bước: Trả phòng dài hạn, quyết toán
          // Kỳ vọng: Bill cuối: tiền thuê ngày lẻ chưa thu (nếu có) + điện nước 650.000 + phạt 200.000 − ký quỹ
          //   22.300.000 → hoàn 21.450.000; tạo yêu cầu hoàn cho qa.mgr duyệt, hạn hoàn 7 ngày làm việc; không có
          //   biên bản ảnh → không cho khấu trừ. Endpoint quyết toán chưa có trong OpenAPI R2
          // Quy tắc: BR-214, BR-522, BR-511, BL #6
          // Oracle sẵn sàng cho R3: BR-214-01 (hoàn 21.450.000, 7 ngày làm việc)
          expect(oracleNum('BR-214-01', 'refundVnd')).toBeGreaterThan(0);
          test.skip(
            true,
            'R3: US-041 trả phòng dài hạn/quyết toán ký quỹ – endpoint chưa có trong OpenAPI R2 (dời R3 theo R-C, ESC-012)',
          );
        },
      );
      test(
        'TC-L4-081 US-041/– [U · Thấp]',
        {
          annotation: [
            { type: 'story', description: 'US-041/–' },
            { type: 'endpoints', description: '—' },
          ],
        },
        async () => {
          // Tiền điều kiện: HĐ kết thúc 01/05/2027, khách ở thêm 5 ngày
          // Bước: Tính tiền ngày lẻ
          // Kỳ vọng: 371.000 × 5 = 1.855.000 + phí dịch vụ 350.000 × 5/30 = 58.000 (ví dụ BR-210)
          // Quy tắc: BR-214, BR-210
          expect(oracleNum('BR-210-01', 'rentVnd')).toBeGreaterThan(0);
          test.skip(
            true,
            'R3: US-041 quyết toán HĐ dài hạn (tiền ngày lẻ BR-210) – endpoint chưa có trong OpenAPI R2 (dời R3 theo R-C, ESC-012)',
          );
        },
      );
    });
  },
);
