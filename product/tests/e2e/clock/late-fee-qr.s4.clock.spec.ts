// Sprint 4 tuần Ổn định – BUG-R2-139 (P2, BE-A + FE-A): B18 khi đêm ngày đi không bán được (BR-416-06) và xác nhận QR
// vượt số còn phải thu (DOM (f)). Hợp đồng: ARC `rounds/round-02/outputs/ARC/openapi-0.3.7.md` mục 16.6 (bổ sung 4):
// `CheckoutSummary.lateFeeAsNightVnd`, `createVietQr.lateFeeAsNight`, `checkOut.lateFeeInsteadOfNight` (quản lý xác nhận
// tại quầy bằng mật khẩu – 401 `REAUTH_FAILED` giống nhau cho mọi lý do), `confirmPaymentReceived.note` bắt buộc khi vượt.
// Project "clock": tua đồng hồ sang 19:00 ngày đi. Lỗi đã biết ở DÒNG ĐẦU ca, dựng dữ liệu trong precondition().
// TC (r1-main-flows.md): TC-L4-120, TC-L4-121. Oracle: br-examples.json BR-416-06.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  resetRateLimits,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  room,
  s2Context,
  vnTime,
  type ProblemFields,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  makeStay,
  stackSql,
  p3,
  useVirtualDevice,
  virtualDay,
  type Stay,
} from '../support/s3.js';
import {
  adjustLine,
  checkOut,
  checkoutSummary,
  ensureReceivingAccount,
  minibarCheck,
} from '../support/s3-stay.js';

type Json = Record<string, unknown>;

interface People {
  c: S2Context;
  fd: StaffSession;
  mgr: StaffSession;
}
async function people(request: APIRequestContext): Promise<People> {
  return {
    c: await s2Context(request),
    fd: await sessionOrSkip(request, 'qa.fd'),
    mgr: await sessionOrSkip(request, 'qa.mgr'),
  };
}
async function moveTo(request: APIRequestContext, date: string, hhmm: string): Promise<People> {
  await useVirtualDevice(request, await setClock(request, vnTime(date, hhmm)));
  return people(request);
}
async function qr(
  request: APIRequestContext,
  s: StaffSession,
  folioId: string,
  body: Json,
): Promise<{ status: number; body: Json & ProblemFields }> {
  return call<Json & ProblemFields>(request, 'POST', p3(EP3.createVietQr, s, { folioId }), {
    session: s,
    idempotencyKey: true,
    body,
  });
}

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'B18 đêm không bán được (BR-416-06) và QR vượt cần ghi chú – BUG-R2-139',
  { tag: ['@clock', '@sprint4', '@money'] },
  () => {
    test.describe.configure({ mode: 'default' });

    test('TC-L4-120 (A) BR-416-06 khách rời 19:00, căn có khách đến tối nay: xem trước = trần QR = phụ thu bằng giá 1 đêm (không cộng đêm); B18 `lateFeeInsteadOfNight` cần quản lý xác nhận tại quầy – sai mật khẩu / không có tên / không đủ vai đều 401 REAUTH_FAILED giống nhau; số lệch 409; đúng → 200, không thêm đêm', async ({
      request,
    }) => {
      knownBug('BUG-R2-139');
      needClock('TC-L4-120');
      const { D, st } = await precondition(
        'khách ở 1 đêm (đã thu đủ), khách khác đặt cùng căn đêm ngày đi',
        async () => {
          const D = virtualDay(realToday, 3);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
          cleanRooms();
          await ensureReceivingAccount(request, D);
          const k = await people(request);
          const st = await inHouse(request, k.c, k.fd, {
            room: room(k.c, '203'),
            alternatives: k.c.rooms,
            arrival: D,
            nights: 1,
          });
          await makeStay(request, k.c, k.fd, { room: st.room, arrival: addDays(D, 1), nights: 1 });
          return { D, st };
        },
      );
      const k = await moveTo(request, addDays(D, 1), '19:00');
      // B18 chặn `MINIBAR_NOT_CHECKED` khi tủ chưa đếm (R9) – đếm trước (không dùng gì) để mọi lần gửi B18 dưới đây chỉ
      // khác nhau ở phần phụ thu thay đêm
      const mb = await minibarCheck(request, k.fd, st.res.id);
      expect(mb.status, `recordMinibarCheck: ${JSON.stringify(mb.body).slice(0, 200)}`).toBe(201);
      const s = await checkoutSummary(request, k.fd, st.res.id, { checkoutTime: '19:00' });
      expect(s.status, JSON.stringify(s.body).slice(0, 300)).toBe(200);
      const b = s.body as unknown as Json;
      expect.soft(b.extraNightRequired, 'rời sau mốc → cần đêm thêm').toBe(true);
      expect.soft(b.extraNightAvailable, 'căn có khách đến → không bán được').toBe(false);
      const fee = Number(b.lateFeeAsNightVnd);
      expect(fee, 'lateFeeAsNightVnd = giá 1 đêm của đêm ngày đi').toBe(
        Number(b.extraNightDefaultRateVnd),
      );
      expect.soft(b.amountDueAtCheckoutVnd, 'xem trước gồm phụ thu, không gồm đêm').toBe(fee);
      if (st.room.roomNo === '203')
        expect
          .soft(fee, 'oracle BR-416-06 (203)')
          .toBe(Number(oracle('BR-416-06').expected.lateCheckoutFeeVnd));
      // QR check_out: cờ `lateFeeAsNight`, trần = số trên; đêm không bán được → 422
      const withNight = await qr(request, k.fd, st.res.folioId!, {
        purpose: 'check_out',
        amountVnd: fee,
        extraNightRateVnd: fee,
      });
      expect.soft(withNight.status, 'QR kèm đêm không bán được').toBe(422);
      expect.soft(JSON.stringify(withNight.body)).toContain('NOT_ALLOWED');
      const over = await qr(request, k.fd, st.res.folioId!, {
        purpose: 'check_out',
        amountVnd: fee + 1000,
        lateFeeAsNight: true,
      });
      expect.soft(over.status, 'QR vượt trần').toBe(422);
      expect.soft(over.body.max, 'trần QR = phụ thu').toBe(fee);
      // B18: thiếu cả đêm thêm lẫn phụ thu thay đêm → 422
      const none = await checkOut(request, k.fd, st.res.id, { checkoutTime: '19:00' });
      expect.soft(none.status).toBe(422);
      expect.soft(JSON.stringify(none.body)).toContain('LATE_CHECKOUT_AFTER_LIMIT');
      const late = (approverUsername: string, secret: string, amountVnd = fee) => ({
        checkoutTime: '19:00',
        lateFeeInsteadOfNight: {
          amountVnd,
          reason: 'Khach roi 19:00, can co khach den toi nay',
          approverUsername,
          authMethod: 'password',
          secret,
        },
        finalPayment: { type: 'charge', method: 'cash', amountVnd },
      });
      // ba lý do từ chối trả CÙNG một phản hồi (không lộ tên tài khoản)
      const wrong = await checkOut(request, k.fd, st.res.id, late('qa.mgr', 'sai-mat-khau-e2e'));
      const nobody = await checkOut(
        request,
        k.fd,
        st.res.id,
        late('qa.khong-ton-tai', 'sai-mat-khau-e2e'),
      );
      const fdRole = await checkOut(request, k.fd, st.res.id, late('qa.fd', SEED_PASSWORD ?? ''));
      for (const [label, r] of [
        ['sai mật khẩu', wrong],
        ['không có tên', nobody],
        ['không đủ vai (FD)', fdRole],
      ] as const) {
        expect.soft(r.status, label).toBe(401);
        expect.soft((r.body as ProblemFields).code, label).toBe('REAUTH_FAILED');
        expect.soft(JSON.stringify(r.body), label).toContain('lateFeeInsteadOfNight.secret');
      }
      const lech = await checkOut(
        request,
        k.fd,
        st.res.id,
        late('qa.mgr', SEED_PASSWORD ?? '', fee - 1000),
      );
      expect.soft(lech.status, 'số lệch').toBe(409);
      expect.soft(JSON.stringify(lech.body)).toContain('SURCHARGE_CHANGED');
      const ok = await checkOut(request, k.fd, st.res.id, late('qa.mgr', SEED_PASSWORD ?? ''));
      expect(ok.status, JSON.stringify(ok.body).slice(0, 400)).toBe(200);
      expect(ok.body.reservation.status).toBe('checked_out');
      expect.soft(ok.body.reservation.departureDate, 'không thêm đêm').toBe(addDays(D, 1));
      const f = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(f.status).toBe('settled');
      expect
        .soft(
          liveLines(f, 'late_checkout').reduce((a, l) => a + l.amountVnd, 0),
          'một dòng phụ thu bằng giá 1 đêm',
        )
        .toBe(fee);
      expect
        .soft(
          liveLines(f, 'room').filter((l) => l.serviceDate === addDays(D, 1)),
          'không có đêm ngày đi',
        )
        .toHaveLength(0);
    });

    test('TC-L4-121 (A) DOM (f) xác nhận QR vượt số còn phải thu: QR 70.000 (minibar 2 bia) → lễ tân sửa còn 1 bia → `amountDueNowVnd` 35.000; xác nhận không ghi chú → 422 REASON_REQUIRED (max 35.000); có ghi chú → 200, phần vượt 35.000 vào tiền thừa', async ({
      request,
    }) => {
      knownBug('BUG-R2-139');
      needClock('TC-L4-121');
      const { k, st, paymentId } = await precondition(
        'khách đang ở, minibar 70.000, QR balance 70.000 chờ, dòng minibar sửa còn 35.000',
        async () => {
          const D = virtualDay(realToday, 2);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '15:00')));
          cleanRooms();
          await ensureReceivingAccount(request, D);
          const k = await people(request);
          const st: Stay = await inHouse(request, k.c, k.fd, {
            room: room(k.c, '202'),
            alternatives: k.c.rooms,
            arrival: D,
            nights: 1,
          });
          expect((await minibarCheck(request, k.fd, st.res.id, { bia: 2 })).status).toBe(201);
          const q = await qr(request, k.fd, st.res.folioId!, { amountVnd: 70000 });
          expect(q.status, JSON.stringify(q.body).slice(0, 300)).toBe(201);
          const line = liveLines(await getFolio(request, k.fd, st.res.folioId!), 'minibar')[0]!;
          const adj = await adjustLine(request, k.fd, st.res.folioId!, line.id, {
            newQuantity: 1,
            reason: 'Khach chi dung 1 lon',
          });
          expect(adj.status, JSON.stringify(adj.body).slice(0, 300)).toBe(201);
          return { k, st, paymentId: String((q.body.payment as Json).id) };
        },
      );
      const f0 = await getFolio(request, k.fd, st.res.folioId!);
      const p0 = f0.payments.find((p) => p.id === paymentId) as unknown as Json | undefined;
      expect.soft(p0?.qrPurpose, 'qrPurpose').toBe('balance');
      expect.soft(p0?.amountDueNowVnd, 'còn phải thu lúc này').toBe(35000);
      const confirm = (body: Json) =>
        call<Json & ProblemFields>(
          request,
          'POST',
          `/v1/properties/${propertyIdOf(k.fd)}/payments/${paymentId}/actions/confirm-received`,
          { session: k.fd, idempotencyKey: true, body },
        );
      const noNote = await confirm({});
      expect.soft(noNote.status, 'thiếu ghi chú').toBe(422);
      expect.soft(JSON.stringify(noNote.body)).toContain('REASON_REQUIRED');
      expect.soft(noNote.body.max, 'max = còn phải thu lúc xác nhận').toBe(35000);
      const ok = await confirm({ note: 'FT26292001234 - NGUYEN VAN A, chuyen du 2 lon' });
      expect(ok.status, JSON.stringify(ok.body).slice(0, 300)).toBe(200);
      const f1 = await getFolio(request, k.fd, st.res.folioId!);
      expect.soft(f1.totals.balanceDueVnd).toBe(0);
      expect.soft(f1.totals.creditVnd, 'phần vượt vào tiền thừa (BR-522)').toBe(35000);
    });

    test('TC-L4-123 (A) SEC SR-AUTH-11 (2)(3), BE-59 (2) – BUG-R2-146: quản lý đang bị KHÓA ĐĂNG NHẬP (`locked_until` tương lai, `active`) làm người xác nhận BR-416-06 với mật khẩu ĐÚNG → 401 REAUTH_FAILED giống hệt tài khoản không có (kể cả không gửi finalPayment), đơn vẫn đang ở, không ghi gì', async ({
      request,
    }) => {
      knownBug('BUG-R2-146');
      needClock('TC-L4-123');
      test.skip(
        process.env.E2E_COMPOSE_CONTROL !== '1',
        'TC-L4-123: cần E2E_COMPOSE_CONTROL=1 để đặt `locked_until` cho tài khoản quản lý thử',
      );
      const { D, st } = await precondition(
        'khách ở 1 đêm (đã thu đủ), khách khác đặt cùng căn đêm ngày đi; 19:00 ngày đi, đã đếm minibar',
        async () => {
          const D = virtualDay(realToday, 3);
          await useVirtualDevice(request, await setClock(request, vnTime(D, '14:00')));
          cleanRooms();
          await ensureReceivingAccount(request, D);
          const k = await people(request);
          const st = await inHouse(request, k.c, k.fd, {
            room: room(k.c, '203'),
            alternatives: k.c.rooms,
            arrival: D,
            nights: 1,
          });
          await makeStay(request, k.c, k.fd, { room: st.room, arrival: addDays(D, 1), nights: 1 });
          return { D, st };
        },
      );
      const k = await moveTo(request, addDays(D, 1), '19:00');
      expect((await minibarCheck(request, k.fd, st.res.id)).status).toBe(201);
      const s = await checkoutSummary(request, k.fd, st.res.id, { checkoutTime: '19:00' });
      const fee = Number((s.body as unknown as Json).lateFeeAsNightVnd);
      expect(fee, 'lateFeeAsNightVnd').toBeGreaterThan(0);
      const body = (approverUsername: string, withPayment: boolean) => ({
        checkoutTime: '19:00',
        lateFeeInsteadOfNight: {
          amountVnd: fee,
          reason: 'Khach roi 19:00, can co khach den toi nay',
          approverUsername,
          authMethod: 'password',
          secret: SEED_PASSWORD ?? '',
        },
        ...(withPayment
          ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: fee } }
          : {}),
      });
      const shape = (b: unknown): Json => {
        const rest: Json = { ...((b ?? {}) as Json) };
        delete rest.requestId;
        return rest;
      };
      // Bộ đếm SR-RL-02 của người gọi (qa.fd) đã có các lần sai của TC-L4-120: tới lần thứ 5 máy chủ trả 429, harness
      // tự gọi /__test__/rate-limits/reset rồi gửi lại – mà reset XÓA cả `locked_until` của qa.* → quản lý hết khóa giữa
      // ca (409 BALANCE_DUE ở lần không finalPayment, chẩn đoán 18/10). Xóa bộ đếm trước khi khóa để ca tự đủ.
      await resetRateLimits(request, 'TC-L4-123 – bộ đếm xác nhận lại từ ca trước');
      // đối chứng: tài khoản không có → 401 đồng nhất (không đụng bộ đếm của quản lý)
      const nobody = await checkOut(request, k.fd, st.res.id, body('qa.khong-ton-tai', true));
      expect(nobody.status, JSON.stringify(nobody.body).slice(0, 200)).toBe(401);
      stackSql(
        "UPDATE app_user SET locked_until = '2099-01-01T00:00:00Z' WHERE username = 'qa.mgr';",
      );
      try {
        const locked = await checkOut(request, k.fd, st.res.id, body('qa.mgr', true));
        expect
          .soft(
            locked.status,
            `quản lý khóa đăng nhập, mật khẩu đúng – ${JSON.stringify(locked.body).slice(0, 240)}`,
          )
          .toBe(401);
        expect
          .soft(shape(locked.body), 'thân giống hệt tài khoản không có')
          .toEqual(shape(nobody.body));
        expect(
          stackSql(
            "SELECT locked_until IS NOT NULL AND locked_until > now() FROM app_user WHERE username = 'qa.mgr';",
          ).trim(),
          'qa.mgr vẫn đang khóa đăng nhập',
        ).toBe('t');
        const noPay = await checkOut(request, k.fd, st.res.id, body('qa.mgr', false));
        expect
          .soft(
            noPay.status,
            `không gửi finalPayment: vẫn 401 (không 409 BALANCE_DUE) – ${JSON.stringify(noPay.body).slice(0, 240)}`,
          )
          .toBe(401);
        const r = await getReservation(request, k.fd, st.res.id);
        expect.soft(r.body.status, 'đơn vẫn đang ở').toBe('in_house');
        const f = await getFolio(request, k.fd, st.res.folioId!);
        expect.soft(liveLines(f, 'late_checkout'), 'không ghi phụ thu').toHaveLength(0);
      } finally {
        stackSql("UPDATE app_user SET locked_until = NULL WHERE username = 'qa.mgr';");
      }
      // đối chứng: quản lý đủ điều kiện → 200 (trả phòng xong, không để đơn kẹt)
      const ok = await checkOut(request, k.fd, st.res.id, body('qa.mgr', true));
      expect(ok.status, JSON.stringify(ok.body).slice(0, 300)).toBe(200);
    });
  },
);
