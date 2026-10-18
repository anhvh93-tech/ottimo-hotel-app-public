// Vòng sửa 5b (S4 tuần Ổn định) – ca API không cần đồng hồ ảo (đơn confirmed ngày xa, project "api"):
// - TC-L4-140: K11-06 / BUG-R2-176 – BR-522 (18/10): đơn đã hủy không nhận dòng phí tay – `addFolioLine` 409
//   `INVALID_TRANSITION` với mọi vai (FD, FDL, MGR, OWN), folio và yêu cầu hoàn giữ nguyên; chi đủ cọc → đã hoàn.
//   Oracle BR-522-06.
// - TC-L4-141: AN-47 (DOM r5-5, BR-417 phụ lục 5A): khách xin dời/kéo dài ngày GIỮ căn (kể cả căn OTTIMO đã xếp) →
//   đêm thêm theo bảng (min); khách xin đổi căn → ngoài bảng (lịch căn mới). Oracle BR-417-20 (T7 +2.495.000).
// Chạy tuần tự trong tệp (các ca đổi sang 101/302/401 dùng chung căn đích).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import {
  action,
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  room,
  s2Context,
  type ProblemFields,
  type S2Context,
} from '../support/s2.js';
import { EP3, addLine, approve, dev, getFolio, needDevice, p3 } from '../support/s3.js';
import { approvalsOf, upload } from '../support/s3-stay.js';
import { bookMoney, moveAcked, previewMove, totalOf } from '../support/s4-money.js';

test.describe.configure({ mode: 'default' });

type Json = Record<string, unknown>;

interface Ctx {
  c: S2Context;
  today: string;
  fd: StaffSession;
  fdl: StaffSession;
  mgr: StaffSession;
  own: StaffSession;
}

async function ctxOf(request: APIRequestContext): Promise<Ctx> {
  return {
    c: await s2Context(request),
    today: await stackToday(request),
    fd: await sessionOrSkip(request, 'qa.fd'),
    fdl: await sessionOrSkip(request, 'qa.fdl'),
    mgr: await sessionOrSkip(request, 'qa.mgr'),
    own: await sessionOrSkip(request, 'qa.owner'),
  };
}

test.describe(
  'Vòng sửa 5b – đơn đã đóng không nhận dòng phí tay (K11-06), đêm thêm khi khách xin giữ căn (AN-47)',
  { tag: ['@api', '@sprint4', '@money'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L4-140 (A) BUG-R2-176 / K11-06 – BR-522 18/10 (oracle BR-522-06): cọc 2.000.000, hủy `found_other` → yêu cầu hoàn 2.000.000; FD/FDL/MGR/OWN thêm dòng F&B 90.000 → 409 INVALID_TRANSITION (`currentState` cancelled), folio giữ nguyên, yêu cầu vẫn 2.000.000; duyệt, chi tiền mặt đủ 2.000.000 → đã hoàn (`refundedVnd` = 2.000.000)', async ({
      request,
    }) => {
      needDevice('TC-L4-140');
      const ex = oracle('BR-522-06');
      const inp = ex.input as Json;
      const exp = ex.expected as Json;
      const k = await ctxOf(request);
      const depositVnd = Number(inp.depositPaidVnd);
      const b = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '202'),
        today: k.today,
        dow: 1,
        nights: 3,
        extra: { initialPayment: { type: 'deposit', method: 'cash', amountVnd: depositVnd } },
      });
      const cancel = await action<Json & ProblemFields>(request, k.fd, b.id, 'cancel', {
        reasonCode: String(inp.cancelReasonCode),
        note: 'Khach bao qua Zalo',
      });
      expect(cancel.status, `cancel: ${JSON.stringify(cancel.body).slice(0, 300)}`).toBe(200);
      const approvalId = String(
        ((cancel.body.cancellation ?? {}) as Json).refundApprovalRequestId ?? '',
      );
      expect(approvalId, 'hủy tạo yêu cầu hoàn (BR-522)').toBeTruthy();
      const before = (await getFolio(request, k.mgr, b.folioId)).totals;
      const line = inp.manualLine as Json;
      for (const [who, s] of [
        ['FD', k.fd],
        ['FDL', k.fdl],
        ['MGR', k.mgr],
        ['OWN', k.own],
      ] as const) {
        const r = await addLine(request, s, b.folioId, line);
        expect(r.status, `${who} addFolioLine: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(
          Number(exp.addFolioLineStatus),
        );
        expect(r.body.code).toBe(String(exp.addFolioLineCode));
        expect((r.body as unknown as Json).currentState, `${who}: currentState`).toBe('cancelled');
      }
      expect((await getFolio(request, k.mgr, b.folioId)).totals, 'folio giữ nguyên').toEqual(
        before,
      );
      const code = (await getReservation(request, k.fd, b.id)).body.code as string;
      const req0 = (await approvalsOf(request, k.mgr, code, 'refund')).find(
        (a) => a.id === approvalId,
      );
      expect(req0?.amountVnd, 'yêu cầu hoàn vẫn 2.000.000').toBe(Number(exp.refundRequestVnd));
      expect(req0?.status).toBe(String(exp.refundRequestStatusBeforePayout));
      // nơi nhận tiền mặt (người tạo), quản lý duyệt, FDL chi (người chi ≠ người tạo – A47a)
      const dest = await call(request, 'PUT', p3(EP3.setRefundDestination, k.fd, { approvalId }), {
        ...dev(k.fd),
        idempotencyKey: true,
        body: { method: 'cash' },
      });
      expect(dest.status, `setRefundDestination: ${JSON.stringify(dest.body)}`).toBe(200);
      const ok = await approve(request, k.mgr, approvalId);
      expect(ok.status, `approve: ${JSON.stringify(ok.body).slice(0, 200)}`).toBe(200);
      const proof = await upload(request, k.fdl, 'refund_proof', b.id);
      const paid = await call<Json & ProblemFields>(
        request,
        'POST',
        p3(EP3.executeCashRefund, k.fdl, { approvalId }),
        {
          session: k.fdl,
          idempotencyKey: true,
          body: {
            amountVnd: Number(exp.payoutVnd),
            paidAt: new Date().toISOString(),
            attachmentId: proof,
          },
        },
      );
      expect(paid.status, `executeCashRefund: ${JSON.stringify(paid.body).slice(0, 300)}`).toBe(
        201,
      );
      expect(paid.body.amountVnd).toBe(-Number(exp.payoutVnd));
      const req1 = (await approvalsOf(request, k.mgr, code, 'refund')).find(
        (a) => a.id === approvalId,
      );
      expect(req1?.refundedVnd, 'chi đủ → đã hoàn (refunded)').toBe(Number(exp.refundedVnd));
      expect(req1?.amountVnd).toBe(Number(exp.refundRequestVnd));
    });

    test('TC-L4-141 (A) AN-47 – BR-417 phụ lục 5A, DOM r5-5 (oracle BR-417-20): (b) 202 thứ Hai–thứ Tư, B7 sự cố sang 401, khách xin thêm 3 đêm thứ Tư/Năm/Sáu → +2.495.000 (min theo bảng, không lịch 401 3.282.000); 302 → 101 (sự cố) rồi thêm 1 đêm thứ Tư → +667.000; (a) khách xin đổi 202 (thỏa thuận 650.000) sang 302 → ngoài bảng, lịch 302 từng đêm 917.000', async ({
      request,
    }) => {
      const ex = oracle('BR-417-20');
      const exp = ex.expected as Record<string, Json>;
      const k = await ctxOf(request);
      // (b) T7
      const r401 = room(k.c, '401');
      const t7 = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '202'),
        alsoFree: [r401],
        today: k.today,
        dow: 1,
        nights: 2,
        span: 5,
      });
      const m1 = await moveAcked(request, k.fd, t7.id, {
        roomId: r401.id,
        reasonCode: 'property_fault',
      });
      expect(m1.status, `B7 sự cố 202 → 401: ${JSON.stringify(m1.body).slice(0, 300)}`).toBe(200);
      const room0 = totalOf(await getFolio(request, k.fd, t7.folioId), 'room');
      const p1 = await previewMove(request, k.fd, t7.id, {
        departureDate: addDays(t7.arrivalDate, 5),
        reasonCode: 'guest_request',
      });
      expect(p1.status, `xem trước thêm 3 đêm: ${JSON.stringify(p1.body).slice(0, 300)}`).toBe(200);
      expect(
        p1.body.folioDeltaVnd,
        'T7: min(792.000; 1.042.000) × 2 + min(911.000; 1.198.000)',
      ).toBe(Number(exp.b_T7!.folioDeltaVnd));
      expect(p1.body.folioDeltaVnd).not.toBe(Number(exp.b_T7!.notCalendarVnd));
      const m2 = await moveAcked(request, k.fd, t7.id, {
        departureDate: addDays(t7.arrivalDate, 5),
        reasonCode: 'guest_request',
      });
      expect(m2.status, `B7 thêm 3 đêm: ${JSON.stringify(m2.body).slice(0, 300)}`).toBe(200);
      expect(totalOf(await getFolio(request, k.fd, t7.folioId), 'room'), 'xem trước = ghi').toBe(
        room0 + Number(exp.b_T7!.folioDeltaVnd),
      );
      // (b) 302 → 101 rồi thêm 1 đêm thứ Tư
      const r101 = room(k.c, '101');
      const c = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '302'),
        alsoFree: [r101],
        today: k.today,
        dow: 1,
        nights: 2,
        span: 3,
      });
      const m3 = await moveAcked(request, k.fd, c.id, {
        roomId: r101.id,
        reasonCode: 'property_fault',
      });
      expect(m3.status, `B7 sự cố 302 → 101: ${JSON.stringify(m3.body).slice(0, 300)}`).toBe(200);
      const c0 = totalOf(await getFolio(request, k.fd, c.folioId), 'room');
      const m4 = await moveAcked(request, k.fd, c.id, {
        departureDate: addDays(c.arrivalDate, 3),
        reasonCode: 'guest_request',
      });
      expect(m4.status, `B7 thêm 1 đêm: ${JSON.stringify(m4.body).slice(0, 300)}`).toBe(200);
      expect(
        totalOf(await getFolio(request, k.fd, c.folioId), 'room') - c0,
        'min(917.000; 667.000)',
      ).toBe(Number(exp.b_302to101!.folioDeltaVnd));
      // (a) khách xin đổi căn → ngoài bảng: lịch hiện hành căn mới từng đêm, không mang thỏa thuận
      const r302 = room(k.c, '302');
      const a = await bookMoney(request, k.c, k.fd, {
        room: room(k.c, '202'),
        alsoFree: [r302],
        today: k.today,
        dow: 1,
        nights: 2,
        rate: 650000,
      });
      const pa = await previewMove(request, k.fd, a.id, {
        roomId: r302.id,
        reasonCode: 'guest_request',
      });
      expect(pa.status, JSON.stringify(pa.body).slice(0, 300)).toBe(200);
      expect(
        (pa.body.nights ?? []).map((n) => n.newRateVnd),
        'lịch 302 từng đêm',
      ).toEqual(exp.a!.newNightsVnd);
    });
  },
);
