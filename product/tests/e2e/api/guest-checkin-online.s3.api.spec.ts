// L7 – Check-in online trên guest-web (US-106, US-107 – Sprint 3), tầng A (API). Mỗi ca tự tạo đơn confirmed ở
// khoảng ngày trống xa (support/s2.ts bookFree), cấp link khách (issueGuestLink), mở phiên mức 1 (openGuestSession,
// Origin guest-web) rồi đi các bước. Phần cần tua giờ (link hết hạn, sau trả phòng): clock/guest-portal.s3.clock.spec.ts.
// Phần giao diện (E) của TC-L7-001/010/011/013/014: ui/guest-web.h18.spec.ts.
// ĐK-1 (SEC s1-decisions, EP06 8.1): 5 route mức 2 KHÔNG đăng ký ở R2 → 404 (sendGuestOtp, verifyGuestSession,
// getGuestFolio, withdrawGuestConsent, issueGuestVerificationCode). ĐK-2: JSON mức 1 không có guestFullName/doorCode.
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
import { bookFree, cleanupTracked, getReservation, room, s2Context } from '../support/s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  IMAGE_RETENTION_DAYS,
  callMultipart,
  getRegistration,
  guestCall,
  guestLink,
  namedGuest,
  openGuest,
  png,
  registrationOf,
} from '../support/s3.js';
import { GUEST_ORIGIN } from '../support/env.js';

test.afterEach(async ({ request }) => cleanupTracked(request));

type Ctx = Parameters<typeof cleanupTracked>[0];

/** Confirmed booking (2 adults, far-future free window) + guest link + level-1 guest session. */
async function guestOnBooking(
  request: Ctx,
  opts: {
    roomNo?: string;
    adults?: number;
    acceptLanguage?: string;
    guest?: Record<string, unknown>;
  } = {},
) {
  const c = await s2Context(request);
  const fd = await sessionOrSkip(request, 'qa.fd');
  const today = await stackToday(request);
  const guestId = opts.guest ? (await namedGuest(request, fd, opts.guest)).id : undefined;
  const res = await bookFree(request, fd, c, {
    room: room(c, opts.roomNo ?? '301'),
    nights: 2,
    today,
    adults: opts.adults ?? 2,
    ...(guestId ? { guestId } : {}),
  });
  const link = await guestLink(request, fd, res.id);
  const g = await openGuest(request, link.token, {
    ...(opts.acceptLanguage ? { acceptLanguage: opts.acceptLanguage } : {}),
  });
  expect(g.status, `openGuestSession: ${JSON.stringify(g.body)}`).toBe(200);
  expect(g.cookie, 'cookie ottimo_gsid').toMatch(/ottimo_gsid=/);
  return { c, fd, res, link, g };
}

async function upload(
  request: Ctx,
  cookie: string,
  personIndex: number,
  docType = 'cccd',
  files = [png()],
) {
  return callMultipart<Record<string, unknown> & { code?: string; errors?: unknown[] }>(
    request,
    'POST',
    EP3.uploadGuestDocument[1],
    {
      cookie,
      origin: GUEST_ORIGIN,
      idempotencyKey: true,
      fields: { personIndex: String(personIndex), docType },
      files: files.map((f) => ['image', f] as ['image', typeof f]),
    },
  );
}

/** Notice → documents (all people) → ETA → consent (person 1) → complete. */
async function fullOnlineCheckin(
  request: Ctx,
  cookie: string,
  people: number,
  decision: 'granted' | 'refused',
  eta = '21:30',
  locale = 'vi',
) {
  const n = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], cookie, {
    body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
  });
  expect(n.status, JSON.stringify(n.body)).toBe(200);
  // OpenAPI 0.3.6 addendum (SEC ĐK-2): every OnlineCheckin carries the notice version + the image retention days
  // the P02b sentence shows (BR-610) – the client sends them back in the consent.
  const oc = n.body as { currentNoticeVersion?: string; imageRetentionDays?: number };
  expect(oc.currentNoticeVersion, JSON.stringify(n.body)).toBe(PRIVACY_NOTICE);
  expect(oc.imageRetentionDays, JSON.stringify(n.body)).toBe(IMAGE_RETENTION_DAYS);
  for (let i = 1; i <= people; i++) {
    const u = await upload(request, cookie, i);
    expect(u.status, `upload người ${i}: ${JSON.stringify(u.body)}`).toBe(201);
  }
  const e = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], cookie, {
    body: { etaTime: eta, currentStep: 'consent' },
  });
  expect(e.status, JSON.stringify(e.body)).toBe(200);
  // retentionDays: missing → 422 REQUIRED; not the current parameter → 422 NOT_IN_LIST (nothing recorded)
  const consentBody = {
    personIndex: 1,
    purpose: 'P02B_ID_IMAGE_RETENTION',
    decision,
    noticeVersion: PRIVACY_NOTICE,
    locale,
    channel: 'guest_app',
  };
  for (const [days, code] of [
    [undefined, 'REQUIRED'],
    [IMAGE_RETENTION_DAYS + 1, 'NOT_IN_LIST'],
  ] as const) {
    const bad = await guestCall(request, 'POST', EP3.recordGuestConsent[1], cookie, {
      body: { ...consentBody, ...(days !== undefined ? { retentionDays: days } : {}) },
    });
    expect(bad.status, `retentionDays ${days}: ${JSON.stringify(bad.body)}`).toBe(422);
    expect(JSON.stringify(bad.body), `retentionDays ${days}`).toContain(code);
  }
  const k = await guestCall(request, 'POST', EP3.recordGuestConsent[1], cookie, {
    body: {
      personIndex: 1,
      purpose: 'P02B_ID_IMAGE_RETENTION',
      decision,
      noticeVersion: PRIVACY_NOTICE,
      retentionDays: IMAGE_RETENTION_DAYS,
      locale,
      channel: 'guest_app',
    },
  });
  expect(k.status, JSON.stringify(k.body)).toBe(201);
  const d = await guestCall(request, 'POST', EP3.completeOnlineCheckin[1], cookie, {
    idempotencyKey: true,
    body: {},
  });
  expect(d.status, JSON.stringify(d.body)).toBe(200);
  return d.body;
}

/** ĐK-2: the level-1 JSON never carries these keys (not even as null). */
function expectLevel1(body: unknown, what: string): void {
  const json = JSON.stringify(body);
  for (const k of [
    'guestFullName',
    'doorCode',
    'doorCodeAvailableFrom',
    'phone"',
    'email',
    'members',
    'lines',
    'payments',
    'docNumber',
  ]) {
    expect(json.includes(`"${k.replace(/"$/, '')}"`), `${what}: mức 1 có khóa ${k}`).toBe(false);
  }
}

test.describe(
  'L7 – Check-in online trên guest-web (US-106, US-107 – Sprint 3)',
  { tag: ['@api', '@sprint3'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test.describe('', () => {
      test(
        'TC-L7-001 US-106/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-106/AC1' },
            { type: 'endpoints', description: 'issueGuestLink, openGuestSession, getGuestStay' },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-001', [
            EP3.issueGuestLink,
            EP3.openGuestSession,
            EP3.getGuestStay,
          ]);
          const c = await s2Context(request);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const today = await stackToday(request);
          const res = await bookFree(request, fd, c, { room: room(c, '302'), nights: 2, today });
          // issueGuestLink: link riêng của đơn, không lưu ở bộ nhớ đệm (no-store), token ≥ 256 bit
          const r = await call<{ url: string; expiresAt: string }>(
            request,
            'POST',
            `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}/guest-link`,
            { session: fd, idempotencyKey: true },
          );
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.headers['cache-control'] ?? '').toContain('no-store');
          expect(r.body.url).toMatch(/\/g\/[A-Za-z0-9_-]{43,64}$/);
          expect(new URL(r.body.url).origin, 'link mở guest-web').toBe(GUEST_ORIGIN);
          const token = r.body.url.split('/g/')[1]!;
          // một link khác cho đơn khác (link không trùng)
          const other = await bookFree(request, fd, c, { room: room(c, '402'), nights: 1, today });
          expect((await guestLink(request, fd, other.id)).token).not.toBe(token);
          // mở link: không đăng nhập, không tạo tài khoản – chỉ cookie phiên khách
          const g = await openGuest(request, token);
          expect(g.status, JSON.stringify(g.body)).toBe(200);
          expect(g.body).toMatchObject({ level: 1, reservationCode: res.code, stayEnded: false });
          expect(g.headers['referrer-policy']).toBe('no-referrer');
          const set = g.setCookies.find((x) => x.includes('ottimo_gsid='))!;
          expect(set, 'Set-Cookie ottimo_gsid').toBeTruthy();
          expect(set).toMatch(/HttpOnly/i);
          expect(set).toMatch(/SameSite=Strict/i);
          expect(
            g.setCookies.some((x) => x.includes('ottimo_sid=')),
            'không tạo phiên nhân viên',
          ).toBe(false);
          // vào thẳng trang của đơn
          const st = await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie);
          expect(st.status, JSON.stringify(st.body)).toBe(200);
          expect(st.body).toMatchObject({
            reservationCode: res.code,
            status: 'confirmed',
            arrivalDate: res.arrivalDate,
            departureDate: res.departureDate,
            checkinTime: '14:00',
            checkoutTime: '12:00',
            onlineCheckinAvailable: true,
          });
          expectLevel1(st.body, 'getGuestStay');
          expectLevel1(g.body, 'openGuestSession');
          // link sai dạng / không tồn tại → 401 GUEST_LINK_INVALID (không lộ đơn nào)
          expectProblem(
            await call(request, 'POST', EP3.openGuestSession[1], {
              body: { token: `${token.slice(0, -4)}AAAA` },
              headers: { origin: GUEST_ORIGIN },
            }),
            401,
            'GUEST_LINK_INVALID',
          );
        },
      );

      test(
        'TC-L7-002 US-106/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-106/AC2' },
            { type: 'endpoints', description: 'getGuestStay, getGuestFolio' },
            {
              type: 'note',
              description:
                '(a) ở đây; (b) sau trả phòng + ân hạn: clock/guest-portal.s3.clock.spec.ts; (c) HĐ dài hạn dời R3 (R-C)',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-002', [EP3.issueGuestLink, EP3.getGuestStay]);
          const a = await guestOnBooking(request, { roomNo: '201' });
          const b = await guestOnBooking(request, { roomNo: '202' });
          // (a) phiên A chỉ thấy đơn A, mọi cách "chỉ" sang đơn B đều không ra dữ liệu B (x-scope reservation)
          const sa = await guestCall(request, 'GET', EP3.getGuestStay[1], a.g.cookie, {
            query: { reservationId: b.res.id, reservationCode: b.res.code },
          });
          expect(sa.status, JSON.stringify(sa.body)).toBe(200);
          expect(sa.body.reservationCode).toBe(a.res.code);
          expect(JSON.stringify(sa.body)).not.toContain(b.res.code);
          // đường dẫn có id đơn B không phải route khách (không có cách đọc chéo)
          const viaId = await guestCall(request, 'GET', `/v1/guest/stay/${b.res.id}`, a.g.cookie);
          expect([404, 405]).toContain(viaId.status);
          // getGuestFolio: ĐK-1 (mức 2 dời R3) → 404 với mọi phiên
          expect((await guestCall(request, 'GET', EP3.getGuestFolio[1], a.g.cookie)).status).toBe(
            404,
          );
          // hạn link = giờ trả chuẩn ngày đi + guest_link_grace_hours (24) – SR-GST-05/11
          const exp = new Date(a.link.expiresAt).getTime();
          const due = new Date(`${a.res.departureDate}T12:00:00+07:00`).getTime() + 24 * 3_600_000;
          expect(exp, `expiresAt ${a.link.expiresAt}`).toBe(due);
        },
      );

      test(
        'TC-L7-003 US-106/AC3 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-106/AC3' },
            { type: 'endpoints', description: 'verifyGuestSession, getGuestFolio, getGuestStay' },
            {
              type: 'note',
              description:
                'US-106 AC3 → US-141 dời R3 (R-C, EP06 mục phạm vi): R2 chỉ mức 1; OTP/mã lễ tân (mức 2) không đăng ký – ĐK-1',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-003', [EP3.issueGuestLink, EP3.getGuestStay]);
          const { g, fd, res, c } = await guestOnBooking(request);
          // mức 1: JSON không có bill, mã cửa, họ tên đầy đủ, liên hệ, người đi cùng (SR-GST-06, ĐK-2)
          expect(g.body.level).toBe(1);
          expect(
            (g.body.verification as Record<string, unknown> | undefined)?.emailOtpAvailable,
          ).toBe(false);
          expect(g.body.level2ExpiresAt ?? null).toBeNull();
          const st = await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie);
          expect(st.status).toBe(200);
          expectLevel1(st.body, 'getGuestStay');
          expect(st.body.guestFullName, 'không có họ tên đầy đủ').toBeUndefined();
          expect(st.body.doorCode, 'không có mã cửa').toBeUndefined();
          const oc = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g.cookie);
          expect(oc.status).toBe(200);
          expectLevel1(oc.body, 'getOnlineCheckin');
          // ĐK-1: mức 2 chưa có ở R2 – 5 route không đăng ký → 404 (không phải 401/403/2xx)
          for (const [m, p] of [
            ['GET', EP3.getGuestFolio[1]],
            ['POST', EP3.sendGuestOtp[1]],
            ['POST', EP3.verifyGuestSession[1]],
            ['POST', EP3.withdrawGuestConsent[1].replace('{purpose}', 'P02B_ID_IMAGE_RETENTION')],
          ] as const) {
            const r = await guestCall(request, m, p, g.cookie, m === 'POST' ? { body: {} } : {});
            expect(r.status, `${m} ${p}: ${JSON.stringify(r.body)}`).toBe(404);
          }
          const code = await call(
            request,
            'POST',
            `/v1/properties/${c.propertyId}/reservations/${res.id}/guest-verification-code`,
            { session: fd, idempotencyKey: true, body: {} },
          );
          expect(code.status, 'issueGuestVerificationCode (ĐK-1)').toBe(404);
        },
      );

      test(
        'TC-L7-004 US-106/– [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-106/–' },
            { type: 'endpoints', description: 'revokeGuestLink, issueGuestLink, openGuestSession' },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-004', [
            EP3.revokeGuestLink,
            EP3.issueGuestLink,
            EP3.openGuestSession,
          ]);
          const { fd, res, link, g } = await guestOnBooking(request, { roomNo: '102' });
          const rv = await call(
            request,
            'DELETE',
            `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}/guest-link`,
            { session: fd },
          );
          expect(rv.status, JSON.stringify(rv.body)).toBe(204);
          // link cũ và phiên đang mở của nó đều hết hiệu lực (thu hồi mọi token + phiên – B-13)
          expectProblem((await openGuest(request, link.token)) as never, 401, 'GUEST_LINK_INVALID');
          expect((await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie)).status).toBe(401);
          // link mới hoạt động, vẫn gắn với ĐƠN (mã đơn), không gắn với phòng
          const fresh = await guestLink(request, fd, res.id);
          expect(fresh.token).not.toBe(link.token);
          const g2 = await openGuest(request, fresh.token);
          expect(g2.status).toBe(200);
          expect(g2.body.reservationCode).toBe(res.code);
          const st = await guestCall(request, 'GET', EP3.getGuestStay[1], g2.cookie);
          expect(st.body.reservationCode).toBe(res.code);
        },
      );

      test(
        'TC-L7-010 US-107/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-107/AC1' },
            {
              type: 'endpoints',
              description:
                'getOnlineCheckin, uploadGuestDocument, updateOnlineCheckin, recordGuestConsent, completeOnlineCheckin',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-010', [
            EP3.getOnlineCheckin,
            EP3.uploadGuestDocument,
            EP3.updateOnlineCheckin,
            EP3.recordGuestConsent,
            EP3.completeOnlineCheckin,
          ]);
          const { fd, res, g } = await guestOnBooking(request, { roomNo: '203' });
          const regId = await registrationOf(request, fd, res);
          expect((await getRegistration(request, fd, regId)).body.status).toBe('none');
          // bước 0: thông báo xử lý dữ liệu (không có dấu đã đọc sẵn)
          const s0 = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g.cookie);
          expect(s0.body).toMatchObject({
            currentStep: 'notice',
            requiredPeople: 2,
            uploadedPeople: [],
            consentRecorded: false,
            noticeAccepted: false,
          });
          // gửi trước bước thiếu → 409 INVALID_TRANSITION + currentState (bước còn thiếu)
          const early = await guestCall(request, 'POST', EP3.completeOnlineCheckin[1], g.cookie, {
            idempotencyKey: true,
            body: {},
          });
          expect(early.status).toBe(409);
          expect(early.body.code).toBe('INVALID_TRANSITION');
          const done = await fullOnlineCheckin(request, g.cookie, 2, 'granted', '21:30');
          expect(done).toMatchObject({
            currentStep: 'done',
            uploadedPeople: [1, 2],
            etaTime: '21:30',
            consentRecorded: true,
          });
          // Desk: khai báo pre (SM-05 K2), thấy giờ đến 21:30, đồng ý ghi kênh app
          const reg = await getRegistration(request, fd, regId);
          expect(reg.body.status).toBe('pre');
          expect(reg.body.onlineCheckin).toMatchObject({ etaTime: '21:30', uploadedCount: 2 });
          expect((reg.body.onlineCheckin as { completedAt?: string }).completedAt).toBeTruthy();
          expect(reg.body.documents.find((d) => d.isMain)?.imageConsent).toBe('granted');
          // giờ đến ghi vào đơn (setEta – BE-A cổng cho BE-C)
          expect((await getReservation(request, fd, res.id)).body.etaTime).toBe('21:30');
          // qa.fd nhận thông báo trong app online_checkin_completed
          const notes = await call<{
            data: Array<{ kind: string; refCode?: string; refId?: string }>;
          }>(request, 'GET', EP3.listMyNotifications[1], { session: fd, query: { limit: 50 } });
          expect(notes.status, JSON.stringify(notes.body)).toBe(200);
          expect(
            notes.body.data.some(
              (n) =>
                n.kind === 'online_checkin_completed' &&
                (n.refCode === res.code || n.refId === res.id || n.refId === regId),
            ),
            `thông báo online_checkin_completed cho ${res.code}: ${JSON.stringify(notes.body.data.slice(0, 5))}`,
          ).toBe(true);
        },
      );

      test(
        'TC-L7-011 US-107/AC2 [E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-107/AC2' },
            { type: 'endpoints', description: 'getOnlineCheckin' },
            {
              type: 'note',
              description: 'tầng A ở đây; tầng E (mở lại trang): ui/guest-web.h18.spec.ts',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-011', [
            EP3.getOnlineCheckin,
            EP3.uploadGuestDocument,
          ]);
          const { fd, res, g } = await guestOnBooking(request, { roomNo: '101' });
          await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
            body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
          });
          expect((await upload(request, g.cookie, 1)).status).toBe(201);
          // bỏ dở → mở lại link (phiên mới) → vào thẳng bước giấy tờ, người 1 đã có, còn người 2
          const again = await guestLink(request, fd, res.id);
          const g2 = await openGuest(request, again.token);
          expect(g2.status).toBe(200);
          const oc = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g2.cookie);
          expect(oc.status).toBe(200);
          expect(oc.body).toMatchObject({
            currentStep: 'documents',
            requiredPeople: 2,
            uploadedPeople: [1],
            noticeAccepted: true,
          });
          expect((await upload(request, g2.cookie, 2, 'passport')).status).toBe(201);
          const oc2 = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g2.cookie);
          expect(oc2.body.uploadedPeople).toEqual([1, 2]);
        },
      );

      test(
        'TC-L7-012 US-107/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-107/AC3' },
            { type: 'endpoints', description: 'recordGuestConsent, completeOnlineCheckin' },
            {
              type: 'note',
              description:
                'phần "ảnh xóa ngay khi khai báo confirmed" (BR-609) kiểm ở TC-L3-039/071 (cùng cơ chế K7/K6)',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-012', [
            EP3.recordGuestConsent,
            EP3.completeOnlineCheckin,
          ]);
          const { fd, res, g } = await guestOnBooking(request, { roomNo: '103' });
          // chọn Không đồng ý: vẫn hoàn tất
          const done = await fullOnlineCheckin(request, g.cookie, 2, 'refused', '16:00');
          expect(done).toMatchObject({ currentStep: 'done', consentRecorded: true });
          const regId = await registrationOf(request, fd, res);
          const reg = await getRegistration(request, fd, regId);
          expect(reg.body.status).toBe('pre');
          const main = reg.body.documents.find((d) => d.isMain);
          expect(main?.imageConsent, JSON.stringify(reg.body.documents)).toBe('refused');
          // ảnh còn (chờ xóa khi khai báo confirmed – BR-609), chưa xóa ngay khi khách bấm Không
          expect((main?.imageIds ?? []).length).toBeGreaterThan(0);
          expect(reg.body.imagesPurgedAt ?? null).toBeNull();
          // đồng ý chỉ ghi cho Khách 1 qua app (ĐK-5): người 2 → 4xx
          const p2 = await guestCall(request, 'POST', EP3.recordGuestConsent[1], g.cookie, {
            body: {
              personIndex: 2,
              purpose: 'P02B_ID_IMAGE_RETENTION',
              decision: 'granted',
              noticeVersion: PRIVACY_NOTICE,
              retentionDays: IMAGE_RETENTION_DAYS,
              locale: 'vi',
              channel: 'guest_app',
            },
          });
          expect(p2.status, JSON.stringify(p2.body)).toBeGreaterThanOrEqual(400);
          expect(p2.status).toBeLessThan(500);
        },
      );

      test(
        'TC-L7-013 US-107/AC4 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-107/AC4' },
            { type: 'endpoints', description: 'uploadGuestDocument, openGuestSession' },
            {
              type: 'note',
              description:
                'link hết hạn theo giờ: clock/guest-portal.s3.clock.spec.ts (TC-L7-002 b)',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-013', [
            EP3.uploadGuestDocument,
            EP3.openGuestSession,
          ]);
          const { g, fd, res, link } = await guestOnBooking(request, { roomNo: '402' });
          await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
            body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
          });
          // tệp .exe (MZ…) → 422 FILE_REJECTED / FILE_TYPE, có thể tải lại
          const exe = await upload(request, g.cookie, 1, 'cccd', [
            {
              name: 'giay-to.exe',
              mimeType: 'application/octet-stream',
              buffer: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2048, 1)]),
            },
          ]);
          expect(exe.status, JSON.stringify(exe.body)).toBe(422);
          expect(exe.body.code).toBe('FILE_REJECTED');
          expect(JSON.stringify(exe.body.errors)).toContain('FILE_TYPE');
          // "ảnh" 25 MB (đầu PNG) → bị từ chối, không 5xx (≤ 10 MB/ảnh – SR-FILE-02; 413 nếu vượt giới hạn thân)
          const big = Buffer.concat([
            png().buffer.subarray(0, 16),
            Buffer.alloc(25 * 1024 * 1024, 7),
          ]);
          const huge = await upload(request, g.cookie, 1, 'cccd', [
            { name: 'anh-25mb.png', mimeType: 'image/png', buffer: big },
          ]);
          expect(
            [413, 422],
            `25 MB: ${huge.status} ${JSON.stringify(huge.body).slice(0, 200)}`,
          ).toContain(huge.status);
          if (huge.status === 422) {
            expect(huge.body.code).toBe('FILE_REJECTED');
            expect(JSON.stringify(huge.body.errors)).toMatch(/FILE_TOO_LARGE|FILE_TYPE/);
          }
          // HEIC (ftypheic) → FILE_TYPE (khách iPhone phải chuyển JPEG trên máy – EP06 8.3)
          const heic = await upload(request, g.cookie, 1, 'cccd', [
            {
              name: 'IMG_0001.HEIC',
              mimeType: 'image/heic',
              buffer: Buffer.concat([
                Buffer.from([0, 0, 0, 24]),
                Buffer.from('ftypheic'),
                Buffer.alloc(512, 0),
              ]),
            },
          ]);
          expect(heic.status).toBe(422);
          expect(JSON.stringify(heic.body.errors)).toContain('FILE_TYPE');
          // tải lại ảnh hợp lệ được ngay sau lỗi
          expect((await upload(request, g.cookie, 1)).status).toBe(201);
          // link sai → 401 GUEST_LINK_INVALID; link đã thu hồi → 401
          const wrong = await openGuest(request, 'x'.repeat(43));
          expect(wrong.status).toBe(401);
          expect(wrong.body.code).toBe('GUEST_LINK_INVALID');
          await call(
            request,
            'DELETE',
            `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}/guest-link`,
            {
              session: fd,
            },
          );
          const revoked = await openGuest(request, link.token);
          expect(revoked.status).toBe(401);
          expect(revoked.body.code).toBe('GUEST_LINK_INVALID');
        },
      );

      test(
        'TC-L7-014 US-107/AC5 [E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-107/AC5' },
            { type: 'endpoints', description: 'getOnlineCheckin' },
            {
              type: 'note',
              description:
                'tầng A: ngôn ngữ phiên + bằng chứng đồng ý ghi locale; tầng E (mọi chữ EN đã duyệt): ui/guest-web.h18.spec.ts',
            },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-014', [EP3.getOnlineCheckin, EP3.setGuestLocale]);
          // khách nước ngoài (hồ sơ tự nhận ngôn ngữ EN – guests.service: quốc tịch ≠ VN → en), trình duyệt EN
          // → phiên EN (EP06 8.5: hồ sơ trước, trình duyệt sau). Ghi chú: createGuest luôn điền preferredLocale
          // (VN → vi), nên nhánh "theo trình duyệt" chỉ xảy ra với hồ sơ cũ chưa có ngôn ngữ.
          const { g } = await guestOnBooking(request, {
            roomNo: '102',
            acceptLanguage: 'en-US,en;q=0.9',
            guest: { nationalityCode: 'DE' },
          });
          expect(g.body.locale).toBe('en');
          // đổi tay sang VI rồi về EN (setGuestLocale 204)
          for (const locale of ['vi', 'en']) {
            const r = await guestCall(request, 'PUT', EP3.setGuestLocale[1], g.cookie, {
              body: { locale },
            });
            expect(r.status, JSON.stringify(r.body)).toBe(204);
          }
          const bad = await guestCall(request, 'PUT', EP3.setGuestLocale[1], g.cookie, {
            body: { locale: 'fr' },
          });
          expect(bad.status).toBe(422);
          // đi hết các bước bằng EN: bằng chứng đồng ý mang locale en (R-CON-02)
          const done = await fullOnlineCheckin(request, g.cookie, 2, 'granted', '18:00', 'en');
          expect(done.currentStep).toBe('done');
        },
      );

      test(
        'TC-L7-015 US-107/– [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-107/–' },
            { type: 'endpoints', description: 'getOnlineCheckin' },
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L7-015', [
            EP3.getOnlineCheckin,
            EP3.uploadGuestDocument,
          ]);
          const { g } = await guestOnBooking(request, { roomNo: '201' });
          await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
            body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
          });
          const up = await upload(request, g.cookie, 1);
          expect(up.status).toBe(201);
          // chỉ trạng thái "đã nhận": không id ảnh, không URL, không loại/số giấy tờ (ĐK-3, rbac ghi chú 7)
          const oc = await guestCall(request, 'GET', EP3.getOnlineCheckin[1], g.cookie);
          const json = JSON.stringify(oc.body) + JSON.stringify(up.body);
          expect(oc.body.uploadedPeople).toEqual([1]);
          expect(json).not.toMatch(/imageId|image_id|"url"|blob|docType|docNumber|attachment/i);
          // không có route xem lại ảnh cho khách
          for (const p of [
            '/v1/guest/online-checkin/documents',
            '/v1/guest/online-checkin/documents/1',
            '/v1/guest/documents',
          ]) {
            const r = await guestCall(request, 'GET', p, g.cookie);
            expect([404, 405], `GET ${p}: ${r.status}`).toContain(r.status);
          }
        },
      );
    });
  },
);
