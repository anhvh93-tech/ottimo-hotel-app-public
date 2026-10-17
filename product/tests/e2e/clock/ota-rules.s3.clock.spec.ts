// E2E clock – OpenAPI 0.3.6 bổ sung 4 (ARC s3-contract.md 7.8 (4), BR-428 v0.3.4): trả sớm (B16) đơn OTA đang ở có
// phụ thu người theo đêm → `EarlyDepartureResult.extraPersonRefundVnd` (đã thu → hoàn 100 % phụ thu của đêm bỏ, trong
// MỘT yêu cầu hoàn) / `extraPersonReversedVnd` (chưa thu → chỉ đảo dòng). Ngày ảo riêng (MutableClock).
// BE vòng 4 (c52d149) – QA kiểm 17/10: đạt.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock } from '../support/clock.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  room,
  vnTime,
  type ProblemFields,
} from '../support/s2.js';
import {
  EP3,
  getFolio,
  inHouse,
  liveLines,
  namedGuest,
  p3,
  payBalance,
  stayAction,
  useVirtualDevice,
  type Stay,
} from '../support/s3.js';
import { at, vday } from '../support/s3-stay.js';

test.describe.configure({ mode: 'default' });
let realToday = '';
test.beforeAll(async ({ request }) => {
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

interface EarlyDepartureResult {
  reservation: { departureDate: string };
  earlyDepartureFeeVnd: number;
  refundVnd?: number;
  refundRequestId?: string | null;
  extraPersonRefundVnd?: number;
  extraPersonReversedVnd?: number;
}

/** Thêm người lớn thứ 3 (khách báo trực tiếp) từ hôm nay, xác nhận phụ thu đề xuất; trả về phụ thu mỗi đêm. */
async function addThirdAdult(
  request: APIRequestContext,
  fd: StaffSession,
  st: Stay,
  today: string,
  nights: number,
): Promise<number> {
  const path = p3(EP3.addPartyMember, fd, { reservationId: st.res.id });
  // người thứ 2 (trong số khách OTA đã tính – người đứng tên là người thứ 1): không phụ thu
  const g2 = await namedGuest(request, fd);
  const second = await call<{ occupancyChange?: unknown }>(request, 'POST', path, {
    session: fd,
    idempotencyKey: true,
    body: { role: 'companion', guestId: g2.id, relationship: 'friend', effectiveFrom: today },
  });
  expect(second.status, JSON.stringify(second.body)).toBe(201);
  expect(second.body.occupancyChange ?? null).toBeNull();
  const g = await namedGuest(request, fd);
  const body = { role: 'companion', guestId: g.id, relationship: 'friend', effectiveFrom: today };
  const dry = await call<{ occupancyChange?: { surchargeVnd?: number } }>(request, 'POST', path, {
    session: fd,
    body: { ...body, dryRun: true },
  });
  expect(dry.status, JSON.stringify(dry.body)).toBe(200);
  const total = Number(dry.body.occupancyChange?.surchargeVnd ?? 0);
  expect(total, 'người vượt max(định mức căn, otaGuestCount) → có phụ thu').toBeGreaterThan(0);
  const ok = await call(request, 'POST', path, {
    session: fd,
    idempotencyKey: true,
    body: { ...body, applyExtraPersonSurcharge: true, expectedSurchargeVnd: total },
  });
  expect(ok.status, JSON.stringify(ok.body)).toBe(201);
  return total / nights;
}

test.describe(
  'OTA – B16 hoàn phụ thu người của đêm bỏ (0.3.6 bổ sung 4)',
  { tag: ['@clock', '@sprint3', '@ota'] },
  () => {
    test('TC-L4-092 US-137/– đơn OTA đang ở có người thứ 3: trả sớm bỏ 1 đêm → đã thu: extraPersonRefundVnd trong một yêu cầu hoàn; chưa thu: extraPersonReversedVnd, không hoàn', async ({
      request,
    }) => {
      needSeedPassword();
      needClock('TC-L4-092');
      const { D, c } = await vday(request, realToday, 5);
      await useVirtualDevice(request, vnTime(D, '14:30'));
      let fd = await sessionOrSkip(request, 'qa.fd');
      // 2 đơn Booking.com (OTA thu hộ) 3 đêm, 2 người lớn, căn định mức 2 – nhận phòng D 14:30
      const a = await inHouse(request, c, fd, {
        room: room(c, '203'),
        arrival: D,
        nights: 3,
        kind: 'booking',
      });
      // bổ sung 4 phải có trên build (BE vòng 4, c52d149) – thiếu là hồi quy
      expect(
        'otaGuestCount' in ((await getReservation(request, fd, a.res.id)).body as object),
        'Reservation.otaGuestCount (0.3.6 bổ sung 4)',
      ).toBe(true);
      const b = await inHouse(request, c, fd, {
        room: room(c, '202'),
        arrival: D,
        nights: 3,
        kind: 'booking',
      });
      // người lớn thứ 3 từ đêm D: phụ thu 3 đêm; (a) thu đủ tại quầy, (b) chưa thu
      const perNightA = await addThirdAdult(request, fd, a, D, 3);
      const perNightB = await addThirdAdult(request, fd, b, D, 3);
      const fa = await payBalance(request, fd, a.res.folioId!);
      expect(fa.totals.balanceDueVnd).toBe(0);
      // ⏱ D+1 10:00: khách báo đi sớm, ngày đi mới D+2 (bỏ đêm D+2)
      await at(request, vnTime(addDays(D, 1), '10:00'));
      fd = await sessionOrSkip(request, 'qa.fd');
      const early = (st: Stay) =>
        stayAction<EarlyDepartureResult & ProblemFields>(
          request,
          fd,
          st.res.id,
          'early-departure',
          {
            newDepartureDate: addDays(D, 2),
            noticeGivenAt: new Date(vnTime(addDays(D, 1), '10:00')).toISOString(),
            // đơn OTA: số OTA giữ lại theo extranet (0.3.6 bổ sung 2 E04-06) – 0: OTA tự hoàn tiền phòng đêm bỏ
            otaRetainedVnd: 0,
          },
        );
      const ra = await early(a);
      expect(ra.status, JSON.stringify(ra.body).slice(0, 400)).toBe(200);
      expect(ra.body.extraPersonRefundVnd, '(a) hoàn 100 % phụ thu đêm bỏ đã thu').toBe(perNightA);
      expect(ra.body.extraPersonReversedVnd ?? 0).toBe(0);
      expect(ra.body.refundRequestId, '(a) một yêu cầu hoàn duy nhất').toBeTruthy();
      expect(ra.body.refundVnd ?? 0).toBeGreaterThanOrEqual(perNightA);
      const rb = await early(b);
      expect(rb.status, JSON.stringify(rb.body).slice(0, 400)).toBe(200);
      expect(rb.body.extraPersonReversedVnd, '(b) chưa thu → chỉ đảo dòng').toBe(perNightB);
      expect(rb.body.extraPersonRefundVnd ?? 0).toBe(0);
      // (b) dòng phụ thu người của đêm D+2 đã đảo (không còn sống)
      const fb = await getFolio(request, fd, b.res.folioId!);
      expect(
        liveLines(fb, 'extra_person').filter((l) => l.serviceDate === addDays(D, 2)),
        '(b) phụ thu đêm bỏ đã đảo',
      ).toHaveLength(0);
    });
  },
);
