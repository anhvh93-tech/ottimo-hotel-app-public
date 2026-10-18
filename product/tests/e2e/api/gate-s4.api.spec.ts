// Trước cổng QC Sprint 4 (tuần Ổn định) – ca API kiểm các mục CỔNG đã sửa mà sổ lỗi còn ghi Open (bảng sẵn sàng
// `rounds/round-02/qc/s4-gate-readiness.md` G7.2) và một phần S4-33. Project "api" (đơn ngày xa, đồng hồ thật).
// - TC-RB-008 / BUG-R2-063 (S4-32, S4-11): hồ sơ CRM chỉ có 4 số cuối giấy tờ (`idDocLast4`) khi người đó có P05; không có
//   P05 thì không bao giờ có; số đầy đủ không có trong hồ sơ.
import { expect, test } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import { versionTag } from '../support/api.js';
import { GUEST_ORIGIN } from '../support/env.js';
import { knownBug, precondition } from '../support/known-bugs.js';
import { cleanupTracked, getReservation, s2Context } from '../support/s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  addDocument,
  bookerMemberId,
  callMultipart,
  dev,
  guestCall,
  guestLink,
  openGuest,
  p3,
  png,
  vnDoc,
  type GuestDocument,
} from '../support/s3.js';
import { farStay, mainDoc, regOf } from '../support/s3-checkin.js';
import { lettersOnly } from '../ui/helpers.js';

type Json = Record<string, unknown>;

/** Khách X đã có hồ sơ CRM với P05 và CCCD của chính X (lần ở trước) – như khách quen đặt hộ người khác. */
async function crmGuestWithP05(
  request: import('@playwright/test').APIRequestContext,
  fd: StaffSession,
): Promise<{ id: string; last4: string }> {
  const c = await s2Context(request);
  const prev = await farStay(request, c, fd, await stackToday(request), { adults: 1, doc: false });
  const own = vnDoc(prev.guestName);
  const addBooker = await bookerMemberId(request, fd, prev.res.id);
  const add = await addDocument(request, fd, prev.regId, { ...own, partyMemberId: addBooker });
  expect(add.status, JSON.stringify(add.body).slice(0, 200)).toBe(201);
  const p05 = await call(
    request,
    'POST',
    p3(EP3.recordImageConsent, fd, { registrationId: prev.regId }),
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
  const id = (
    (await getReservation(request, fd, prev.res.id)).body.booker as { id?: string } | undefined
  )?.id;
  expect(id).toBeTruthy();
  return { id: id!, last4: String(own.docNumber).slice(-4) };
}

async function getGuestBody(
  request: import('@playwright/test').APIRequestContext,
  s: StaffSession,
  id: string,
): Promise<Json> {
  const r = await call<Json>(request, 'GET', `/v1/properties/${propertyIdOf(s)}/guests/${id}`, {
    session: s,
  });
  expect(r.status, `getGuest: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body;
}

test.describe(
  'Trước cổng S4 – mục CỔNG đã sửa (G7.2): hồ sơ CRM 4 số cuối giấy tờ (BUG-R2-063)',
  { tag: ['@api', '@sprint4'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-RB-008 (A) US-048/AC3 BUG-R2-063 (S4-32): người đứng tên khai CCCD rồi đồng ý P05 tại quầy → hồ sơ CRM (FD, MGR) có `idDocLast4` = 4 số cuối, không có số đầy đủ; người khác không P05 → không có `idDocLast4`', async ({
      request,
    }) => {
      const fd = await sessionOrSkip(request, 'qa.fd');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const guestOf = async (s: StaffSession, id: string) => {
        const r = await call<Json>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(s)}/guests/${id}`,
          { session: s },
        );
        expect(r.status, `getGuest: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
        return r.body;
      };
      // (1) có P05
      const st = await farStay(request, c, fd, today, { adults: 1, doc: false });
      const doc = vnDoc(st.guestName);
      const addBooker = await bookerMemberId(request, fd, st.res.id);
      const add = await addDocument(request, fd, st.regId, { ...doc, partyMemberId: addBooker });
      expect(add.status, JSON.stringify(add.body).slice(0, 300)).toBe(201);
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
      expect(p05.status, JSON.stringify(p05.body).slice(0, 300)).toBe(201);
      const bookerId = (
        (await getReservation(request, fd, st.res.id)).body.booker as { id?: string } | undefined
      )?.id;
      expect(bookerId, 'hồ sơ người đứng tên').toBeTruthy();
      const last4 = String(doc.docNumber).slice(-4);
      for (const [who, s] of [
        ['FD', fd],
        ['MGR', mgr],
      ] as const) {
        const g = await guestOf(s, bookerId!);
        expect(g.crmConsent, `${who}: P05`).toBe('granted');
        expect(g.idDocLast4, `${who}: 4 số cuối giấy tờ`).toBe(last4);
        expect(JSON.stringify(g), `${who}: không có số giấy tờ đầy đủ`).not.toContain(
          String(doc.docNumber),
        );
      }
      // (2) không P05: khai giấy tờ nhưng không đồng ý CRM → không có 4 số cuối
      const st2 = await farStay(request, c, fd, today, { adults: 1, doc: false });
      const doc2 = vnDoc(st2.guestName);
      const add2Booker = await bookerMemberId(request, fd, st2.res.id);
      const add2 = await addDocument(request, fd, st2.regId, {
        ...doc2,
        partyMemberId: add2Booker,
      });
      expect(add2.status, JSON.stringify(add2.body).slice(0, 300)).toBe(201);
      const booker2 = (
        (await getReservation(request, fd, st2.res.id)).body.booker as { id?: string } | undefined
      )?.id;
      const g2 = await guestOf(fd, booker2!);
      expect(g2.crmConsent ?? 'not_asked').not.toBe('granted');
      expect(g2.idDocLast4 ?? null, 'không P05 → không có 4 số cuối').toBeNull();
      expect(JSON.stringify(g2)).not.toContain(String(doc2.docNumber));
    });

    // ───────────── SEC BE-73 / ARC 16.22 – đặt hộ: người đặt X ≠ người ở Y (BUG-R2-180) ─────────────

    test('TC-RB-028 (A) BE-73 / ARC 16.22 BUG-R2-180 đặt hộ – Desk: X (khách quen, đã có P05) đặt cho Y; H14 nhập CCCD của Y (giấy tờ chính, không chọn người) rồi P05 của Y → khóa giấy tờ, 4 số cuối, P05 nằm trên hồ sơ của Y; hồ sơ X giữ 4 số cuối của chính X', async ({
      request,
    }) => {
      knownBug('BUG-R2-180');
      const { fd, st, x, docY } = await precondition('X đặt hộ Y (1 người lớn)', async () => {
        const fd = await sessionOrSkip(request, 'qa.fd');
        const c = await s2Context(request);
        const x = await crmGuestWithP05(request, fd);
        const st = await farStay(request, c, fd, await stackToday(request), {
          adults: 1,
          doc: false,
          guestId: x.id,
        });
        const yName = `Tran Thi Y ${lettersOnly(4)}`;
        return { fd, st, x, docY: vnDoc(yName, { dateOfBirth: '1995-05-05' }) };
      });
      // đặt hộ: lễ tân nhập giấy tờ của Y, không chọn người (Y chưa có trong đơn) → server tạo người cho Y
      const add = await addDocument(request, fd, st.regId, docY);
      expect(add.status, JSON.stringify(add.body).slice(0, 300)).toBe(201);
      const d = mainDoc(add.body);
      // SEC BE-73: giấy tờ chính của Y (không chọn người) không được ghi lên hồ sơ người đặt X
      const gx0 = await getGuestBody(request, fd, x.id);
      expect(gx0.idDocLast4, 'hồ sơ X giữ 4 số cuối của chính X sau khi nhập giấy tờ của Y').toBe(
        x.last4,
      );
      const yMember = (d as unknown as { partyMemberId?: string }).partyMemberId;
      expect(yMember, 'giấy tờ của Y gắn một người trong đơn').toBeTruthy();
      const party = await call<{
        members?: Array<{ id: string; role?: string; guest?: { id?: string } }>;
      }>(request, 'GET', p3(EP3.listParty, fd, { reservationId: st.res.id }), { session: fd });
      const yGuest = party.body.members?.find((m) => m.id === yMember)?.guest?.id;
      expect(yGuest, 'giấy tờ của Y không gắn vào hồ sơ người đặt X').not.toBe(x.id);
      const p05 = await call(
        request,
        'POST',
        p3(EP3.recordImageConsent, fd, { registrationId: st.regId }),
        {
          session: fd,
          idempotencyKey: true,
          body: {
            partyMemberId: yMember,
            purpose: 'P05_CRM',
            decision: 'granted',
            noticeVersion: PRIVACY_NOTICE,
            locale: 'vi',
            channel: 'desk',
          },
        },
      );
      expect(p05.status, JSON.stringify(p05.body).slice(0, 300)).toBe(201);
      const gx = await getGuestBody(request, fd, x.id);
      expect(gx.idDocLast4, 'hồ sơ X giữ 4 số cuối giấy tờ của chính X').toBe(x.last4);
      const gy = await getGuestBody(request, fd, yGuest!);
      expect(gy.crmConsent, 'P05 trên hồ sơ Y').toBe('granted');
      expect(gy.idDocLast4, '4 số cuối trên hồ sơ Y').toBe(String(docY.docNumber).slice(-4));
    });

    test('TC-RB-029 (A) BE-73 / ARC 16.22 BUG-R2-180 đặt hộ – app khách: X đặt cho Y; X là khách quen đã có P05; Y tải CCCD (Khách 1) trên app, lễ tân nhập trường từ ảnh → khóa giấy tờ, 4 số cuối của Y không ghi đè hồ sơ X (app chưa nhận P05 – guest consents chỉ P02B)', async ({
      request,
    }) => {
      // Chạy thật 18/10 trên api-dist18: đường app không ghi đè hồ sơ X (khác đường Desk) – ca phải đạt, giữ làm hồi quy.
      const { fd, st, x, yName } = await precondition(
        'X đặt hộ Y (1 người lớn) + link khách',
        async () => {
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const x = await crmGuestWithP05(request, fd);
          const st = await farStay(request, c, fd, await stackToday(request), {
            adults: 1,
            doc: false,
            guestId: x.id,
          });
          return { fd, st, x, yName: `Le Van Y ${lettersOnly(4)}` };
        },
      );
      const link = await guestLink(request, fd, st.res.id);
      const g = await openGuest(request, link.token);
      expect(g.status, JSON.stringify(g.body).slice(0, 200)).toBe(200);
      const n = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
        body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
      });
      expect(n.status, JSON.stringify(n.body).slice(0, 200)).toBe(200);
      const up = await callMultipart(request, 'POST', EP3.uploadGuestDocument[1], {
        cookie: g.cookie,
        origin: GUEST_ORIGIN,
        idempotencyKey: true,
        fields: { personIndex: '1', docType: 'cccd' },
        files: [['image', png()]],
      });
      expect(up.status, JSON.stringify(up.body).slice(0, 200)).toBe(201);
      const reg = await regOf(request, fd, st.regId);
      const d = reg.documents.find(
        (x2) => (x2 as GuestDocument & { captureMethod?: string }).captureMethod === 'guest_upload',
      );
      expect(d, JSON.stringify(reg.documents).slice(0, 300)).toBeTruthy();
      const docY = vnDoc(yName, { dateOfBirth: '1994-04-04' });
      const upd = await call(
        request,
        'PATCH',
        p3(EP3.updateGuestDocument, fd, { registrationId: st.regId, documentId: d!.id }),
        { ...dev(fd), ifMatch: versionTag(reg.version), body: docY },
      );
      expect(upd.status, JSON.stringify(upd.body).slice(0, 300)).toBe(200);
      const gx = await getGuestBody(request, fd, x.id);
      expect(
        gx.idDocLast4,
        'hồ sơ X giữ 4 số cuối giấy tờ của chính X (giấy tờ của Y không ghi đè)',
      ).toBe(x.last4);
    });
  },
);
