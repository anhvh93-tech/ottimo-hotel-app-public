// E2E API – OpenAPI 0.3.6 bổ sung 4 (ARC s3-contract.md 7.8, 17/10): 4 luật OTA của DOM (BR-110/307/310/428 v0.3.4).
//   TC-L4-090 đổi số người đơn OTA trước nhận phòng phải chọn nguồn (`partyChangeSource`, `otaModificationRef`,
//             `Reservation.otaGuestCount`);
//   TC-L4-091 không FOC trên dòng tiền phòng đơn OTA trả trước (422 FOC_NOT_ALLOWED_OTA_PREPAID);
//   TC-L2-083 tiền phạt hủy OTA vào folio (`cancellation_fee` + `ota_collect` cho `ota_prepaid`; `otaPenaltyChannelFeeVnd`).
// TC-L4-092 (B16 hoàn phụ thu người của đêm bỏ – `extraPersonRefundVnd`) ở clock/ota-rules.s3.clock.spec.ts.
// Đơn ngày xa (project api, đồng hồ thật). BE vòng 4 (c52d149) – QA kiểm 17/10: cả 3 ca đạt.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import {
  EP,
  action,
  cleanupTracked,
  fieldCodes,
  getReservation,
  room,
  s2Context,
  type ProblemFields,
} from '../support/s2.js';
import { EP3, getFolio, liveLines, p3 } from '../support/s3.js';
import { patchReservation } from '../support/s3-checkin.js';
import { farBooking } from '../support/s3-stay.js';

let today = '';
test.afterEach(async ({ request }) => cleanupTracked(request));

/** Bổ sung 4 (BE vòng 4, c52d149): `Reservation.otaGuestCount` phải có – thiếu là hồi quy, không phải "pending". */
async function needAddendum4(
  request: APIRequestContext,
  fd: StaffSession,
  otaId: string,
): Promise<void> {
  const r = await getReservation(request, fd, otaId);
  expect('otaGuestCount' in (r.body as object), 'Reservation.otaGuestCount (0.3.6 bổ sung 4)').toBe(
    true,
  );
}

test.describe(
  'OTA – 0.3.6 bổ sung 4 (BR-110/307/310 v0.3.4)',
  { tag: ['@api', '@sprint3', '@ota'] },
  () => {
    test.beforeEach(async ({ request }) => {
      needSeedPassword();
      today = await stackToday(request);
    });

    test('TC-L4-090 US-022/– đổi số người đơn OTA trước nhận phòng: phải chọn nguồn; ota_modification cập nhật otaGuestCount, guest_direct giữ', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L4-090', [EP.updateReservation, EP.getReservation]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      // căn 302 (định mức 3, tối đa 4) – 2 người lớn, đơn Booking.com
      const a = await farBooking(request, c, fd, {
        nights: 2,
        today,
        kind: 'booking',
        room: room(c, '302'),
      });
      await needAddendum4(request, fd, a.id);
      let cur = await getReservation(request, fd, a.id);
      expect(cur.body.otaGuestCount, 'otaGuestCount lúc nhập đơn OTA').toBe(2);
      // (a) đổi số người không chọn nguồn → 422 REQUIRED partyChangeSource
      const noSrc = await patchReservation(request, fd, a.id, cur.body.version, { adults: 3 });
      expectProblem(noSrc, 422);
      expect(fieldCodes(noSrc.body as ProblemFields)).toContain('partyChangeSource:REQUIRED');
      // (b) ota_modification thiếu mã sửa đơn → 422 REQUIRED otaModificationRef
      const noRef = await patchReservation(request, fd, a.id, cur.body.version, {
        adults: 3,
        partyChangeSource: 'ota_modification',
      });
      expectProblem(noRef, 422);
      expect(fieldCodes(noRef.body as ProblemFields)).toContain('otaModificationRef:REQUIRED');
      // (c) OTA đã sửa đơn → otaGuestCount = 3, không phụ thu người
      const mod = await patchReservation(request, fd, a.id, cur.body.version, {
        adults: 3,
        partyChangeSource: 'ota_modification',
        otaModificationRef: 'BDC-MOD-E2E1',
      });
      expect(mod.status, JSON.stringify(mod.body)).toBe(200);
      cur = await getReservation(request, fd, a.id);
      expect(cur.body).toMatchObject({ adults: 3, otaGuestCount: 3 });
      expect(liveLines(await getFolio(request, fd, a.folioId), 'extra_person')).toHaveLength(0);
      // (d) đơn OTA khác: khách báo trực tiếp → giữ otaGuestCount 2 (người vượt sẽ phụ thu tại quầy)
      const b = await farBooking(request, c, fd, {
        nights: 2,
        today,
        kind: 'booking',
        room: room(c, '302'),
      });
      const bc = await getReservation(request, fd, b.id);
      const direct = await patchReservation(request, fd, b.id, bc.body.version, {
        adults: 3,
        partyChangeSource: 'guest_direct',
      });
      expect(direct.status, JSON.stringify(direct.body)).toBe(200);
      expect((await getReservation(request, fd, b.id)).body).toMatchObject({
        adults: 3,
        otaGuestCount: 2,
      });
      // (e) đơn kênh Trực tiếp gửi partyChangeSource → 422 NOT_ALLOWED; otaGuestCount null
      const d = await farBooking(request, c, fd, {
        nights: 2,
        today,
        kind: 'direct',
        room: room(c, '302'),
      });
      const dc = await getReservation(request, fd, d.id);
      expect(dc.body.otaGuestCount ?? null).toBeNull();
      const bad = await patchReservation(request, fd, d.id, dc.body.version, {
        adults: 3,
        partyChangeSource: 'guest_direct',
      });
      expectProblem(bad, 422);
      expect(fieldCodes(bad.body as ProblemFields)).toContain('partyChangeSource:NOT_ALLOWED');
    });

    test('TC-L4-091 US-007/– FOC / giảm giá đặc biệt trên dòng tiền phòng đơn OTA trả trước → 422 FOC_NOT_ALLOWED_OTA_PREPAID; đơn trả tại chỗ vẫn FOC được', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L4-091', [EP3.requestFoc, EP3.getFolio]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const pre = await farBooking(request, c, fd, { nights: 2, today, kind: 'booking' });
      expect(pre.paymentModel).toBe('ota_prepaid');
      await needAddendum4(request, fd, pre.id);
      const f = await getFolio(request, fd, pre.folioId);
      const line = liveLines(f, 'room')[0]!;
      const paidViaOta = f.totals.paidViaOtaVnd;
      for (const kind of ['foc', 'special_discount']) {
        const r = await call<ProblemFields>(
          request,
          'POST',
          p3(EP3.requestFoc, fd, { folioId: pre.folioId, lineId: line.id }),
          {
            session: fd,
            idempotencyKey: true,
            body: { kind, amountVnd: 100000, reasonCode: 'regular_vip', note: 'E2E OTA' },
          },
        );
        expectProblem(r, 422);
        expect(fieldCodes(r.body), kind).toContain('kind:FOC_NOT_ALLOWED_OTA_PREPAID');
      }
      // "Đã thu qua OTA" không đổi, không có dòng FOC
      const f2 = await getFolio(request, fd, pre.folioId);
      expect(f2.totals.paidViaOtaVnd).toBe(paidViaOta);
      expect(liveLines(f2, 'foc')).toHaveLength(0);
    });

    test('TC-L2-083 US-021/– hủy đơn OTA: tiền phạt vào folio (cancellation_fee), ota_prepaid kèm ota_collect → còn phải thu 0; phí kênh tùy chọn; đơn khác kênh → 422', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-083', [EP.cancelReservation, EP3.getFolio]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const pre = await farBooking(request, c, fd, { nights: 2, today, kind: 'booking' });
      expect(pre.paymentModel).toBe('ota_prepaid');
      await needAddendum4(request, fd, pre.id);
      const penalty = 400000;
      // phí kênh mà không có tiền phạt → 422 NOT_ALLOWED
      const noPen = await action(request, fd, pre.id, 'cancel', {
        reasonCode: 'ota_cancelled',
        otaPenaltyChannelFeeVnd: 50000,
      });
      expectProblem(noPen, 422);
      expect(fieldCodes(noPen.body)).toContain('otaPenaltyChannelFeeVnd:NOT_ALLOWED');
      const ok = await action(request, fd, pre.id, 'cancel', {
        reasonCode: 'ota_cancelled',
        otaPenaltyVnd: penalty,
        otaPenaltyChannelFeeVnd: 62000,
      });
      expect(ok.status, JSON.stringify(ok.body).slice(0, 300)).toBe(200);
      const f = await getFolio(request, fd, pre.folioId);
      expect(liveLines(f, 'cancellation_fee').reduce((s, l) => s + l.amountVnd, 0)).toBe(penalty);
      expect(f.totals.paidViaOtaVnd, 'ota_collect = tiền phạt').toBe(penalty);
      expect(f.totals.balanceDueVnd).toBe(0);
      // đơn Trực tiếp gửi otaPenaltyVnd → 422 OTA_PENALTY_OTA_ONLY
      const d = await farBooking(request, c, fd, { nights: 2, today, kind: 'direct' });
      const bad = await action(request, fd, d.id, 'cancel', {
        reasonCode: 'guest_changed_mind',
        otaPenaltyVnd: penalty,
      });
      expectProblem(bad, 422);
      expect(fieldCodes(bad.body)).toContain('otaPenaltyVnd:OTA_PENALTY_OTA_ONLY');
    });
  },
);
