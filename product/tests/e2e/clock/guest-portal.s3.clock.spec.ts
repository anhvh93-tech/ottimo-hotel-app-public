// Project "clock" – link khách theo giờ (US-106 AC2, US-107 AC4; SR-GST-05/11, SEC F09): sau trả phòng chỉ còn
// trang "Cảm ơn" (403 GUEST_STAY_ENDED), link sống tới giờ trả chuẩn ngày đi + guest_link_grace_hours (24) rồi
// 401 GUEST_LINK_INVALID. Bổ sung TC-L7-002 (b) và TC-L7-013 (link hết hạn) của api/guest-checkin-online.s3.api.spec.ts.
// Ngày ảo riêng (support/s3.ts virtualDay), thiết bị được cấp ảo (useVirtualDevice), buồng sạch (cleanRooms).
import { expect, test } from '@playwright/test';
import {
  call,
  needSeedPassword,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { addDays, cleanupTracked, room, s2Context, vnTime } from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  guestCall,
  guestLink,
  inHouse,
  openGuest,
  p3,
  stayAction,
  useVirtualDevice,
  virtualDay,
} from '../support/s3.js';

// Mỗi ca chạy trên ngày ảo riêng, độc lập: KHÔNG dùng mode 'serial' (một ca đỏ sẽ bỏ qua mọi ca sau và CI chạy
// lại cả file). Thứ tự tuần tự đã do project clock/desk-clock bảo đảm (workers 1, fullyParallel false).
test.describe.configure({ mode: 'default' });

let realToday = '';
test.beforeAll(async ({ request }) => {
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'Link khách theo giờ (US-106, US-107) – MutableClock',
  { tag: ['@clock', '@sprint3'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-L7-002 (b) + TC-L7-013 (hết hạn): trả phòng → 403 GUEST_STAY_ENDED; link sống tới 12:00 ngày đi + 24 giờ rồi 401 GUEST_LINK_INVALID', async ({
      request,
    }) => {
      needClock('TC-L7-002 (b)');
      await requireEndpoints(request, 'TC-L7-002 (b)', [
        EP3.checkIn,
        EP3.checkOut,
        EP3.issueGuestLink,
        EP3.openGuestSession,
        EP3.getGuestStay,
      ]);
      const D = virtualDay(realToday, 4);
      await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
      cleanRooms();
      const c = await s2Context(request);
      let fd = await sessionOrSkip(request, 'qa.fd');
      const st = await inHouse(request, c, fd, {
        room: room(c, '302'),
        alternatives: c.rooms,
        arrival: D,
        nights: 1,
      });
      const link = await guestLink(request, fd, st.res.id);
      // hạn link = 12:00 ngày đi + 24 giờ (guest_link_grace_hours DS-E/catalogue = 24)
      const departure = addDays(D, 1);
      const expiry = vnTime(addDays(departure, 1), '12:00');
      expect(new Date(link.expiresAt).getTime()).toBe(new Date(expiry).getTime());
      const g = await openGuest(request, link.token);
      expect(g.status).toBe(200);
      expect((await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie)).body.status).toBe(
        'in_house',
      );

      // trả phòng ngày đi 11:30 (minibar căn 302 kiểm đủ trước nếu có món tính tiền – B18 bước 1)
      await useVirtualDevice(request, await setClock(request, vnTime(departure, '11:30')));
      fd = await sessionOrSkip(request, 'qa.fd');
      const std = await call<{
        items: Array<{ itemId: string; standardQty: number; isFree: boolean }>;
      }>(request, 'GET', p3(EP3.getMinibarStandard, fd, { reservationId: st.res.id }), {
        session: fd,
      });
      if (std.status === 200 && std.body.items.length > 0) {
        const mc = await call(
          request,
          'POST',
          p3(EP3.recordMinibarCheck, fd, { reservationId: st.res.id }),
          {
            session: fd,
            idempotencyKey: true,
            body: {
              mode: 'checkout',
              lines: std.body.items.map((i) => ({ itemId: i.itemId, remainingQty: i.standardQty })),
            },
          },
        );
        expect(mc.status, JSON.stringify(mc.body)).toBe(201);
      }
      const out = await stayAction<{ reservation: { status: string } }>(
        request,
        fd,
        st.res.id,
        'check-out',
        { checkoutTime: '11:30' },
      );
      expect(out.status, JSON.stringify(out.body)).toBe(200);
      expect(out.body.reservation.status).toBe('checked_out');

      // phiên đang mở: chỉ còn trang "Cảm ơn" – 403 GUEST_STAY_ENDED cho thông tin lưu trú và check-in online
      const ended = await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie);
      expect(ended.status, JSON.stringify(ended.body)).toBe(403);
      expect(ended.body.code).toBe('GUEST_STAY_ENDED');
      const oci = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g.cookie);
      expect([403, 409]).toContain(oci.status);
      // ngôn ngữ vẫn đổi được sau trả phòng (trang cảm ơn – BE-C)
      expect(
        (
          await guestCall(request, 'PUT', EP3.setGuestLocale[1], g.cookie, {
            body: { locale: 'en' },
          })
        ).status,
      ).toBe(204);

      // trong ân hạn: mở lại link → 200 stayEnded = true
      await setClock(request, vnTime(addDays(departure, 1), '11:59'));
      const inGrace = await openGuest(request, link.token);
      expect(inGrace.status, JSON.stringify(inGrace.body)).toBe(200);
      expect(inGrace.body.stayEnded).toBe(true);
      // đúng mốc hết hạn và sau đó: 401 GUEST_LINK_INVALID (trang lỗi kèm cách liên hệ lễ tân – guest-web)
      for (const at of ['12:00', '12:01']) {
        await setClock(request, vnTime(addDays(departure, 1), at));
        const expired = await openGuest(request, link.token);
        expect(expired.status, `${at}: ${JSON.stringify(expired.body)}`).toBe(401);
        expect(expired.body.code).toBe('GUEST_LINK_INVALID');
      }
      // phiên cũ cũng không còn dùng được (phiên khách hết hạn theo link)
      const old = await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie);
      expect([401, 403]).toContain(old.status);
    });
  },
);
