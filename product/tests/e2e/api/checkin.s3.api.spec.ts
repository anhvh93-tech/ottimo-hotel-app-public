// E2E API Sprint 3 – L3: giấy tờ C3, đối chiếu, đồng ý lưu ảnh, khai báo, mã cửa (R3), xóa ảnh (EP03, EP06).
// Project "api" (đồng hồ thật, song song): KHÔNG nhận phòng – mọi ca dùng đơn confirmed ở khoảng ngày xa còn trống
// (support/s3-checkin.ts farStay → makeStay), làm giấy tờ/khai báo/đồng ý trên đơn đó, hủy đơn ở afterEach.
// Các ca cần nhận phòng / mốc giờ chính xác (TC-L3-001…016, 073, 037, 039, 044–049, 051, 053–056, 070):
// clock/checkin.s3.clock.spec.ts. TC gốc: product/tests/test-cases/r1-main-flows.md mục 4 (L3).
// Ghi chú harness: khách NN ở ngày xa phải tự đặt entryDate ≤ hôm nay (foreignDoc mặc định = ngày đi − 5 → 422
// ENTRY_DATE_FUTURE ở project api) – dùng foreignFar() bên dưới.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  versionTag,
  type StaffSession,
} from '../support/api.js';
import { CLOCK_ENABLED, runJobIfAny } from '../support/clock.js';
import { GUEST_ORIGIN } from '../support/env.js';
import {
  EP,
  addDays,
  bookFree,
  channel,
  cleanupTracked,
  createReservation,
  freeWindow,
  getReservation,
  makeHold,
  oracle,
  reservationBody,
  room,
  s2Context,
  track,
  type ProblemFields,
  type Reservation,
} from '../support/s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  addDocument,
  callMultipart,
  completeReview,
  dev,
  fakeCccd,
  fakePassport,
  foreignDoc,
  getFolio,
  guestCall,
  guestLink,
  namedGuest,
  openGuest,
  p3,
  png,
  transitionReg,
  vnDoc,
  type GuestDocument,
} from '../support/s3.js';
import {
  SMALL_ROOMS,
  anyRoom,
  c3Log,
  checkOf,
  consentFor,
  farStay,
  getImage,
  mainDoc,
  regOf,
  regRow,
  reviewNotes,
  stepUp,
  toConfirmed,
  toScanned,
} from '../support/s3-checkin.js';

const story = (s: string) => ({ type: 'story', description: s });
const eps = (s: string) => ({ type: 'endpoints', description: s });
const R3_DOOR =
  'R3: US-128 mã cửa dời R3 (R-C, SEC D2 – R2 không sinh/lưu mã cửa; setDoorCredential/getDoorCredential không đăng ký)';

/** Hộ chiếu Đức ở ngày xa: entryDate ≤ hôm nay (EP06 2.2 ENTRY_DATE_FUTURE), thị thực còn hạn sau ngày đi. */
function foreignFar(
  name: string,
  today: string,
  departure: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return foreignDoc(name, departure, { entryDate: addDays(today, -1), ...extra });
}

/** Booker "Daniel Weber" (tên khớp hộ chiếu – BR-952) + đơn confirmed ở ngày xa, chưa có giấy tờ. */
async function foreignStay(
  request: APIRequestContext,
  fd: StaffSession,
  today: string,
  i: { adults?: number; images?: number; fullName?: string } = {},
) {
  const c = await s2Context(request);
  const g = await namedGuest(request, fd, { fullName: i.fullName ?? 'Daniel Weber' });
  const st = await farStay(request, c, fd, today, {
    guestId: g.id,
    adults: i.adults ?? 1,
    doc: false,
  });
  return { ...st, guestName: g.fullName };
}

async function partyOf(request: APIRequestContext, s: StaffSession, reservationId: string) {
  const r = await call<{
    requiredCount: number;
    members?: Array<{ id: string; role: string; relationship?: string; guest?: { id: string } }>;
    version: number;
  }>(request, 'GET', p3(EP3.listParty, s, { reservationId }), { session: s });
  expect(r.status, `listParty: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body;
}

test.describe(
  'L3 – giấy tờ, đối chiếu, đồng ý, khai báo, mã cửa, xóa ảnh (EP03, EP06 – Sprint 3, API)',
  { tag: ['@api', '@sprint3'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test.describe('4.2 Giấy tờ, đối chiếu, đồng ý, khai báo', () => {
      test(
        'TC-L3-030 US-043/AC1 [A · Cao]',
        { annotation: [story('US-043/AC1'), eps('addGuestDocument, getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-030', [EP3.addGuestDocument, EP3.getRegistration]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 2, doc: false });
          const reg0 = await regOf(request, fd, st.regId);
          expect(reg0.status).toBe('none');
          expect(reg0.requiredCount).toBe(2);
          // người 1 đủ trường → partial (BR-601, K3)
          const d1 = await addDocument(request, fd, st.regId, vnDoc(st.guestName));
          expect(d1.status, JSON.stringify(d1.body)).toBe(201);
          expect(d1.body.status).toBe('partial');
          expect(d1.body.submittedCount).toBe(1);
          // người 2 → review (K4)
          const d2 = await addDocument(
            request,
            fd,
            st.regId,
            vnDoc('Tran Van Binh', { isMain: false, gender: 'male' }),
          );
          expect(d2.status, JSON.stringify(d2.body)).toBe(201);
          expect(d2.body.status).toBe('review');
          expect(d2.body.submittedCount).toBe(2);
          expect(d2.body.documents).toHaveLength(2);
          // oracle BR-601-01: 3 khách, mới có 2 giấy tờ → partial (số khách tăng lên 3 – K13)
          const o = oracle('BR-601-01');
          const res = await getReservation(request, fd, st.res.id);
          const up = await call<Reservation>(
            request,
            'PATCH',
            `/v1/properties/${propertyIdOf(fd)}/reservations/${st.res.id}`,
            {
              session: fd,
              ifMatch: versionTag(res.body.version),
              body: { adults: Number(o.input.guests) },
            },
          );
          expect(up.status, JSON.stringify(up.body)).toBe(200);
          const reg3 = await regOf(request, fd, st.regId);
          expect(reg3.requiredCount).toBe(Number(o.input.guests));
          expect(reg3.submittedCount).toBe(Number(o.input.documentsCaptured));
          expect(reg3.status).toBe(String(o.expected.registrationStatus));
        },
      );

      test(
        'TC-L3-031 US-043/AC2 [A · TB]',
        { annotation: [story('US-043/AC2'), eps('addGuestDocument')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-031', [
            EP3.addGuestDocument,
            EP3.recordImageConsent,
            EP3.getPortalData,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          // 1 người lớn + 1 trẻ 6–11 → cần khai 2 người (BR-601/608)
          const st = await farStay(request, c, fd, today, { adults: 1, children6to11: 1 });
          const arrival = st.res.arrivalDate;
          const dob = addDays(arrival, -8 * 365 - 30);
          const kid = {
            docType: 'child_personal_id',
            isMain: false,
            fullNameOnDoc: 'NGUYEN BE NA',
            docNumber: fakeCccd(),
            dateOfBirth: dob,
            gender: 'female',
            nationalityCode: 'VNM',
            captureMethod: 'manual',
          };
          // không ảnh vẫn lưu được (BR-612: trẻ em – số định danh cá nhân, không bắt ảnh)
          const r = await addDocument(request, fd, st.regId, kid, 0);
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.body.status).toBe('review');
          const doc = r.body.documents.find((d) => d.docType === 'child_personal_id');
          expect(doc, JSON.stringify(r.body.documents)).toBeTruthy();
          expect(doc!.imageIds ?? []).toHaveLength(0);
          expect(doc!.imageConsent).toBe('not_recorded');
          // trẻ em không có quyết định đồng ý lưu ảnh (dữ liệu trẻ em – ĐK-5)
          const cons = await consentFor(request, fd, st.regId, doc!.id, 'granted');
          expect(cons.status, JSON.stringify(cons.body)).toBe(422);
          // đủ người → scanned không cần đồng ý của trẻ; năm sinh dùng cho khai báo (dữ liệu cổng VN)
          await toScanned(request, fd, st.regId);
          await stepUp(request, fd);
          const pd = await call<{
            people: Array<{ fields: Array<{ label: string; value: string }> }>;
          }>(request, 'GET', p3(EP3.getPortalData, fd, { registrationId: st.regId }), dev(fd));
          expect(pd.status, JSON.stringify(pd.body).slice(0, 300)).toBe(200);
          const dobs = pd.body.people.map(
            (p) => p.fields.find((f) => f.label === 'reg.field.date_of_birth')?.value,
          );
          expect(dobs).toContain(dob);
        },
      );

      test(
        'TC-L3-032 US-043/AC3 [A · TB]',
        { annotation: [story('US-043/AC3'), eps('addGuestDocument, listParty')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-032', [EP3.addGuestDocument, EP3.listParty]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          // hồ sơ KH có sẵn G: lần ở trước đã khai giấy tờ số N (người đứng tên)
          const prev = await farStay(request, c, fd, today, { adults: 1, doc: false });
          const known = vnDoc(prev.guestName);
          const kd = await addDocument(request, fd, prev.regId, known);
          expect(kd.status, JSON.stringify(kd.body)).toBe(201);
          const prevBooker = (await getReservation(request, fd, prev.res.id)).body.booker as
            { id?: string } | undefined;
          // đơn mới 2 khách (người đứng tên khác)
          const st = await farStay(request, c, fd, today, { adults: 2 });
          const before = await partyOf(request, fd, st.res.id);
          // (a) người thứ 2 trùng số giấy tờ N với hồ sơ G, không chọn partyMemberId
          const a = await addDocument(request, fd, st.regId, { ...known, isMain: false });
          expect(a.status, JSON.stringify(a.body)).toBe(201);
          const docA = a.body.documents.find((d) => !d.isMain);
          expect(docA).toBeTruthy();
          test.fail(
            true,
            'BUG-R2-033: addGuestDocument không gắn người vào đơn theo BR-951 (partyMemberId trống → không khớp hồ sơ, không tạo người "Chưa rõ")',
          );
          expect(docA!.partyMemberId, 'giấy tờ được gắn với một người trong đơn').toBeTruthy();
          const after = await partyOf(request, fd, st.res.id);
          const memberA = after.members?.find((m) => m.id === docA!.partyMemberId);
          expect(memberA?.guest?.id, 'khớp hồ sơ có sẵn theo số giấy tờ (BR-951)').toBe(
            prevBooker?.id,
          );
          // (b) không khớp ai → người mới quan hệ "Chưa rõ"
          const b = await addDocument(
            request,
            fd,
            st.regId,
            vnDoc('Hoang Van Moi', { isMain: false, gender: 'male' }),
          );
          expect(b.status).toBe(201);
          const docB = b.body.documents.find((d) => d.fullNameOnDoc === 'HOANG VAN MOI');
          const after2 = await partyOf(request, fd, st.res.id);
          const memberB = after2.members?.find((m) => m.id === docB?.partyMemberId);
          expect(memberB?.relationship).toBe('unknown');
          expect((after2.members ?? []).length).toBeGreaterThan((before.members ?? []).length);
        },
      );

      test(
        'TC-L3-033 US-043/AC4 [A · Cao]',
        {
          annotation: [
            story('US-043/AC4'),
            eps('getGuestDocumentSensitive, updateGuestDocument, listC3AccessLog'),
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-033', [
            EP3.getGuestDocumentSensitive,
            EP3.updateGuestDocument,
            EP3.listC3AccessLog,
            EP3.stepUp,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const today = await stackToday(request);
          const st = await foreignStay(request, fd, today);
          const dep = st.res.departureDate;
          const data = foreignFar(st.guestName, today, dep);
          const add = await addDocument(request, fd, st.regId, data);
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const doc = mainDoc(add.body);
          // xem lại (step-up + máy quầy)
          await stepUp(request, fd);
          const view = await call<{ docNumber: string }>(
            request,
            'GET',
            p3(EP3.getGuestDocumentSensitive, fd, { registrationId: st.regId, documentId: doc.id }),
            dev(fd),
          );
          expect(view.status, JSON.stringify(view.body)).toBe(200);
          expect(view.body.docNumber).toBe(data.docNumber);
          expect(view.headers['cache-control'] ?? '').toContain('no-store');
          // sửa số hộ chiếu
          const reg = await regOf(request, fd, st.regId);
          const newNo = fakePassport();
          const up = await call(
            request,
            'PATCH',
            p3(EP3.updateGuestDocument, fd, { registrationId: st.regId, documentId: doc.id }),
            { ...dev(fd), ifMatch: versionTag(reg.version), body: { ...data, docNumber: newNo } },
          );
          expect(up.status, JSON.stringify(up.body)).toBe(200);
          // mỗi lần nhập/xem/sửa có dòng c3_access_log: người, thời điểm, đơn (A70 L, R-REG-09)
          const log = (await c3Log(request, st.res.id)).filter(
            (e) => e.subjectType === 'guest_document',
          );
          for (const action of ['create', 'view', 'update']) {
            const e = log.find((x) => x.action === action);
            expect(e, `c3_access_log ${action}: ${JSON.stringify(log)}`).toBeTruthy();
            expect(e!.actorType).toBe('user');
            expect(e!.userName).toBe(fd.me.displayName);
            expect(e!.reservationCode).toBe(st.res.code);
            expect(Date.parse(e!.occurredAt)).not.toBeNaN();
          }
          // nhật ký không chứa số giấy tờ đầy đủ
          const json = JSON.stringify(log);
          expect(json).not.toContain(String(data.docNumber));
          expect(json).not.toContain(newNo);
        },
      );

      test(
        'TC-L3-034 US-044/AC1 [U+A · Cao]',
        { annotation: [story('US-044/AC1'), eps('addGuestDocument, getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-034', [EP3.addGuestDocument, EP3.getRegistration]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const today = await stackToday(request);
          const st = await foreignStay(request, fd, today, { adults: 3 });
          const dep = st.res.departureDate;
          // hộ chiếu hết hạn: ngày đi − 1, đúng ngày đi, ngày đi + 1
          const cases: Array<[string, string, string]> = [
            [st.guestName, addDays(dep, -1), 'fail'],
            ['Anna Schmidt', dep, 'fail'],
            ['Lukas Becker', addDays(dep, 1), 'pass'],
          ];
          let reg = await regOf(request, fd, st.regId);
          const ids: string[] = [];
          for (const [i, [name, exp]] of cases.entries()) {
            const r = await addDocument(
              request,
              fd,
              st.regId,
              foreignFar(name, today, dep, { passportExpiryDate: exp, isMain: i === 0 }),
            );
            expect(r.status, `${name}: ${JSON.stringify(r.body)}`).toBe(201);
            reg = r.body;
            const d = reg.documents.find((x) => x.fullNameOnDoc === name.toUpperCase());
            ids.push(d!.id);
          }
          for (const [i, [name, exp, want]] of cases.entries()) {
            const d = reg.documents.find((x) => x.id === ids[i]) as GuestDocument;
            expect(
              checkOf(d, 'passport_valid_through_departure'),
              `${name} hết hạn ${exp}, ngày đi ${dep}`,
            ).toBe(want);
          }
        },
      );

      test(
        'TC-L3-035 US-044/AC2 [U+A · Cao]',
        { annotation: [story('US-044/AC2'), eps('getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-035', [EP3.addGuestDocument, EP3.getRegistration]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const today = await stackToday(request);
          const st = await foreignStay(request, fd, today);
          const dep = st.res.departureDate;
          // hộ chiếu (passport) thiếu ngày hết hạn + thị thực → không lưu được (không thể "Đạt" khi thiếu dữ liệu)
          const miss = await addDocument(
            request,
            fd,
            st.regId,
            foreignFar(st.guestName, today, dep, {
              passportExpiryDate: undefined,
              visaValidUntil: undefined,
            }),
          );
          expect(miss.status, JSON.stringify(miss.body)).toBe(422);
          const codes = (miss.body.errors ?? []).map((e) => `${e.field}:${e.code}`);
          expect(codes).toContain('passportExpiryDate:REQUIRED');
          expect(codes).toContain('visaValidUntil:REQUIRED');
          // giấy tờ NN loại "khác" không có ngày hết hạn, không có dấu nhập cảnh → "Chưa kiểm được"
          const other = await addDocument(
            request,
            fd,
            st.regId,
            foreignFar(st.guestName, today, dep, {
              docType: 'other',
              passportExpiryDate: undefined,
              passportIssueDate: undefined,
              entryDate: undefined,
            }),
          );
          expect(other.status, JSON.stringify(other.body)).toBe(201);
          const d = mainDoc(other.body);
          expect(checkOf(d, 'passport_valid_through_departure')).toBe('unverified');
          expect(checkOf(d, 'passport_valid_at_arrival')).toBe('unverified');
          expect(checkOf(d, 'entry_record_present')).toBe('unverified');
          // mỗi mục đúng một trong 3 giá trị, không mục nào "Đạt" khi thiếu dữ liệu
          for (const x of d.checks) expect(['pass', 'fail', 'unverified']).toContain(x.result);
          // "Chưa kiểm được" của mục chặn (BR-613 c) mặc định chặn cho tới khi kiểm tay (an toàn)
          expect(d.checks.find((x) => x.code === 'passport_valid_at_arrival')?.blocking).toBe(true);
        },
      );

      test(
        'TC-L3-036 US-044/AC3 [U · TB]',
        { annotation: [story('US-044/AC3'), eps('getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-036', [
            EP3.addGuestDocument,
            EP3.updateGuestDocument,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const today = await stackToday(request);
          // "Daniel Weber" / "WEBER DANIEL" → Đạt
          const a = await foreignStay(request, fd, today);
          const dataA = foreignFar('Weber Daniel', today, a.res.departureDate);
          const ra = await addDocument(request, fd, a.regId, dataA);
          expect(ra.status, JSON.stringify(ra.body)).toBe(201);
          expect(checkOf(mainDoc(ra.body), 'name_match')).toBe('pass');
          // "Đỗ Mai Anh" / "DO MAI ANH" → Đạt
          const b = await foreignStay(request, fd, today, { fullName: 'Đỗ Mai Anh' });
          const rb = await addDocument(request, fd, b.regId, vnDoc('Do Mai Anh'));
          expect(rb.status, JSON.stringify(rb.body)).toBe(201);
          expect(checkOf(mainDoc(rb.body), 'name_match')).toBe('pass');
          // "Daniel Weber" / "DANIELA WEBB" → Không đạt (hoặc Chưa kiểm được)
          const reg = await regOf(request, fd, a.regId);
          const up = await call<{ documents: GuestDocument[] }>(
            request,
            'PATCH',
            p3(EP3.updateGuestDocument, fd, {
              registrationId: a.regId,
              documentId: mainDoc(reg).id,
            }),
            {
              ...dev(fd),
              ifMatch: versionTag(reg.version),
              body: { ...dataA, fullNameOnDoc: 'DANIELA WEBB' },
            },
          );
          expect(up.status, JSON.stringify(up.body)).toBe(200);
          const d = up.body.documents.find((x) => x.isMain) as GuestDocument;
          expect(['fail', 'unverified']).toContain(checkOf(d, 'name_match'));
        },
      );

      test(
        'TC-L3-038 US-045/AC1 [A+E · Cao]',
        {
          annotation: [story('US-045/AC1'), eps('recordImageConsent, completeRegistrationReview')],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-038', [
            EP3.recordImageConsent,
            EP3.completeRegistrationReview,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const stay = async () => {
            const st = await farStay(request, c, fd, today, { adults: 1, doc: false });
            const r = await addDocument(request, fd, st.regId, vnDoc(st.guestName), 1);
            expect(r.status, JSON.stringify(r.body)).toBe(201);
            expect(r.body.status).toBe('review');
            return { st, doc: mainDoc(r.body) };
          };
          const one = await stay();
          expect(one.doc.imageConsent, 'không tích sẵn').toBe('not_recorded');
          // "Đối chiếu xong" khi chưa chọn đồng ý → không chuyển được
          const none = await completeReview(request, fd, one.st.regId);
          expectProblem(none, 409, 'REGISTRATION_INCOMPLETE');
          expect((none.body.errors ?? []).map((e) => `${e.field}:${e.code}`)).toContain(
            `documents[${one.doc.id}].imageConsent:REQUIRED`,
          );
          expect((await regOf(request, fd, one.st.regId)).status).toBe('review');
          // "Không" → scanned, khai báo tiếp bình thường
          const no = await consentFor(request, fd, one.st.regId, one.doc.id, 'refused');
          expect(no.status, JSON.stringify(no.body)).toBe(201);
          expect(mainDoc(no.body).imageConsent).toBe('refused');
          const sc = await completeReview(request, fd, one.st.regId);
          expect(sc.status, JSON.stringify(sc.body)).toBe(200);
          expect(sc.body.status).toBe('scanned');
          const sent = await transitionReg(request, fd, one.st.regId, 'mark-sent', {
            portalReference: 'E2E-L3-038',
          });
          expect(sent.status, JSON.stringify(sent.body)).toBe(200);
          expect(sent.body.status).toBe('sent');
          // (dữ liệu mới) "Có" → scanned
          const two = await stay();
          const yes = await consentFor(request, fd, two.st.regId, two.doc.id, 'granted');
          expect(yes.status, JSON.stringify(yes.body)).toBe(201);
          expect(mainDoc(yes.body).imageConsent).toBe('granted');
          const sc2 = await completeReview(request, fd, two.st.regId);
          expect(sc2.status, JSON.stringify(sc2.body)).toBe(200);
          expect(sc2.body.status).toBe('scanned');
        },
      );

      test(
        'TC-L3-040 US-045/AC3 [A · TB]',
        { annotation: [story('US-045/AC3'), eps('getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-040', [
            EP3.issueGuestLink,
            EP3.openGuestSession,
            EP3.updateOnlineCheckin,
            EP3.uploadGuestDocument,
            EP3.recordGuestConsent,
            EP3.getRegistration,
            EP.listAuditEvents,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 1, doc: false });
          const link = await guestLink(request, fd, st.res.id);
          const g = await openGuest(request, link.token);
          expect(g.status, JSON.stringify(g.body)).toBe(200);
          const n = await guestCall(request, 'PUT', EP3.updateOnlineCheckin[1], g.cookie, {
            body: { noticeVersion: PRIVACY_NOTICE, currentStep: 'documents' },
          });
          expect(n.status, JSON.stringify(n.body)).toBe(200);
          const up = await callMultipart(request, 'POST', EP3.uploadGuestDocument[1], {
            cookie: g.cookie,
            origin: GUEST_ORIGIN,
            idempotencyKey: true,
            fields: { personIndex: '1', docType: 'cccd' },
            files: [['image', png()]],
          });
          expect(up.status, JSON.stringify(up.body)).toBe(201);
          const before = Date.now();
          const k = await guestCall(request, 'POST', EP3.recordGuestConsent[1], g.cookie, {
            body: {
              personIndex: 1,
              purpose: 'P02B_ID_IMAGE_RETENTION',
              decision: 'granted',
              noticeVersion: PRIVACY_NOTICE,
              locale: 'vi',
              channel: 'guest_app',
            },
          });
          expect(k.status, JSON.stringify(k.body)).toBe(201);
          // lễ tân mở khai báo: đã có quyết định "Có" của khách (không hỏi lại)
          const reg = await regOf(request, fd, st.regId);
          const d = reg.documents.find(
            (x) =>
              (x as GuestDocument & { captureMethod?: string }).captureMethod === 'guest_upload',
          );
          expect(d, JSON.stringify(reg.documents)).toBeTruthy();
          expect(d!.imageConsent).toBe('granted');
          // lễ tân nhập trường từ bản gốc → "Đối chiếu xong" không phải ghi đồng ý lần nữa
          const upd = await call(
            request,
            'PATCH',
            p3(EP3.updateGuestDocument, fd, { registrationId: st.regId, documentId: d!.id }),
            { ...dev(fd), ifMatch: versionTag(reg.version), body: vnDoc(st.guestName) },
          );
          expect(upd.status, JSON.stringify(upd.body)).toBe(200);
          const sc = await completeReview(
            request,
            fd,
            st.regId,
            reviewNotes(await regOf(request, fd, st.regId)),
          );
          expect(sc.status, JSON.stringify(sc.body)).toBe(200);
          expect(sc.body.status).toBe('scanned');
          // thời điểm + hình thức "qua app" + mục đích: nhật ký consent.recorded (GuestDocumentMasked chỉ có
          // imageConsent – [GIẢ ĐỊNH QA] chi tiết lấy từ nhật ký thao tác)
          const owner = await sessionOrSkip(request, 'qa.owner');
          type AuditRow = {
            action: string;
            entityId?: string;
            actorType: string;
            occurredAt: string;
            after?: Record<string, unknown>;
          };
          let ev: AuditRow | undefined;
          let cursor: string | undefined;
          for (let page = 0; page < 20 && !ev; page++) {
            const au = await call<{ data: AuditRow[]; page: { nextCursor?: string | null } }>(
              request,
              'GET',
              `/v1/properties/${propertyIdOf(owner)}/audit-events`,
              { session: owner, query: { category: 'data', from: today, limit: 100, cursor } },
            );
            expect(au.status, JSON.stringify(au.body).slice(0, 300)).toBe(200);
            ev = au.body.data.find(
              (e) => e.action === 'consent.recorded' && e.entityId === st.regId,
            );
            cursor = au.body.page?.nextCursor ?? undefined;
            if (!cursor) break;
          }
          expect(ev, 'nhật ký consent.recorded của khai báo').toBeTruthy();
          expect(ev!.actorType).toBe('guest');
          expect(ev!.after).toMatchObject({
            purpose: 'P02B_ID_IMAGE_RETENTION',
            decision: 'granted',
            channel: 'guest_app',
          });
          expect(Date.parse(ev!.occurredAt)).toBeGreaterThanOrEqual(before - 60_000);
        },
      );

      test(
        'TC-L3-041 US-046/AC1 [A+E · TB]',
        { annotation: [story('US-046/AC1'), eps('getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-041', [EP3.addGuestDocument, EP3.getRegistration]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          // (a) 1 hộ chiếu Đức + 1 CCCD VN → có người NN → khai báo tạm trú NN (khối NN trước, `mixed`)
          const a = await foreignStay(request, fd, today, { adults: 2 });
          const ra = await addDocument(
            request,
            fd,
            a.regId,
            foreignFar(a.guestName, today, a.res.departureDate),
          );
          expect(ra.status, JSON.stringify(ra.body)).toBe(201);
          expect(ra.body.kind).toBe('foreigner_temp_residence');
          const rb = await addDocument(
            request,
            fd,
            a.regId,
            vnDoc('Pham Thi Lan', { isMain: false }),
          );
          expect(rb.status, JSON.stringify(rb.body)).toBe(201);
          expect(rb.body.kind).toBe('mixed');
          const row = await regRow(request, fd, a.res.id);
          expect(row?.kind).toBe('mixed');
          // (b) toàn CCCD VN → thông báo lưu trú công dân VN
          const b = await farStay(request, c, fd, today, { adults: 2 });
          const rc = await addDocument(
            request,
            fd,
            b.regId,
            vnDoc('Vu Van Hai', { isMain: false, gender: 'male' }),
          );
          expect(rc.status, JSON.stringify(rc.body)).toBe(201);
          expect(rc.body.kind).toBe('vn_citizen_stay');
        },
      );

      test(
        'TC-L3-042 US-046/AC2 [A+E · Cao]',
        { annotation: [story('US-046/AC2'), eps('getPortalData, listC3AccessLog')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-042', [
            EP3.getPortalData,
            EP3.listC3AccessLog,
            EP3.completeRegistrationReview,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const today = await stackToday(request);
          const st = await foreignStay(request, fd, today);
          const data = foreignFar(st.guestName, today, st.res.departureDate, {
            visaKind: 'visa',
            visaNumber: 'DV1234567',
          });
          const add = await addDocument(request, fd, st.regId, data);
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          await toScanned(request, fd, st.regId);
          await stepUp(request, fd);
          const path = p3(EP3.getPortalData, fd, { registrationId: st.regId });
          const pd = await call<{
            kind: string;
            portalUrl: string;
            people: Array<{ fields: Array<{ label: string; value: string }> }>;
            clipboardText: string;
          }>(request, 'GET', path, dev(fd));
          expect(pd.status, JSON.stringify(pd.body).slice(0, 300)).toBe(200);
          expect(pd.body.kind).toBe('foreigner_temp_residence');
          expect(pd.body.portalUrl).toContain('tbltkbtt.bocongan.gov.vn');
          expect(pd.body.people).toHaveLength(1);
          const f = pd.body.people[0]!.fields;
          const val = (k: string) => f.find((x) => x.label === `reg.field.${k}`)?.value;
          // đủ trường bắt buộc BR-606 (thứ tự theo server – đúng thứ tự form cổng)
          expect(val('full_name')).toBe(String(data.fullNameOnDoc));
          expect(val('date_of_birth')).toBe(String(data.dateOfBirth));
          expect(val('nationality')).toBe('DEU');
          expect(val('passport_number')).toBe(String(data.docNumber));
          expect(val('visa_number')).toBe('DV1234567');
          expect(val('visa_valid_until')).toBe(String(data.visaValidUntil));
          expect(val('entry_date')).toBe(String(data.entryDate));
          expect(val('arrival_date')).toBe(st.res.arrivalDate);
          expect(val('departure_date')).toBe(st.res.departureDate);
          expect(f.findIndex((x) => x.label === 'reg.field.full_name')).toBe(0);
          expect(f.findIndex((x) => x.label === 'reg.field.arrival_date')).toBeLessThan(
            f.findIndex((x) => x.label === 'reg.field.departure_date'),
          );
          // bộ nhớ tạm: một dòng/người, các trường cách nhau bằng tab, đúng thứ tự
          expect(pd.body.clipboardText).toBe(f.map((x) => x.value).join('\t'));
          expect(pd.headers['cache-control'] ?? '').toContain('no-store');
          // lần sao chép thứ 2 → mỗi lần một dòng log C3
          const pd2 = await call(request, 'GET', path, dev(fd));
          expect(pd2.status).toBe(200);
          // điện thoại (không phải máy quầy được cấp) → API từ chối
          const phone = await call(request, 'GET', path, { session: fd });
          expectProblem(phone, 403, 'DEVICE_NOT_TRUSTED');
          const log = (await c3Log(request, st.res.id)).filter(
            (e) => e.subjectType === 'portal_data',
          );
          expect(log.length, JSON.stringify(log)).toBe(2);
          for (const e of log) {
            expect(e.userName).toBe(fd.me.displayName);
            expect(e.reservationCode).toBe(st.res.code);
          }
        },
      );

      test(
        'TC-L3-043 US-046/AC3 [A · Cao]',
        { annotation: [story('US-046/AC3'), eps('transitionRegistration, listRegistrations')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-043', [
            EP3.transitionRegistration,
            EP3.listRegistrations,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 1 });
          await toScanned(request, fd, st.regId);
          // dán mã hồ sơ → sent (người khai, thời điểm, mã)
          const t0 = Date.now();
          const sent = await transitionReg(request, fd, st.regId, 'mark-sent', {
            portalReference: '  HS-2026/0042  ',
          });
          expect(sent.status, JSON.stringify(sent.body)).toBe(200);
          expect(sent.body.status).toBe('sent');
          expect(sent.body.portalReference).toBe('HS-2026/0042');
          expect(Date.parse(String(sent.body.sentAt))).toBeGreaterThanOrEqual(t0 - 60_000);
          const refs = sent.body.portalReferences as Array<Record<string, unknown>>;
          expect(refs[0]).toMatchObject({
            reference: 'HS-2026/0042',
            sentByName: fd.me.displayName,
          });
          // "Cổng đã xác nhận" → confirmed, rời danh sách cần xử lý
          const conf = await transitionReg(request, fd, st.regId, 'mark-confirmed');
          expect(conf.status, JSON.stringify(conf.body)).toBe(200);
          expect(conf.body.status).toBe('confirmed');
          expect(conf.body.deadlineLabel).toBe('done');
          expect(conf.body.allowedActions).toEqual([]);
          expect(await regRow(request, fd, st.res.id, 'action_needed')).toBeUndefined();
          // (dữ liệu mới) "Cổng từ chối" + lý do → scanned
          const b = await farStay(request, c, fd, today, { adults: 1 });
          await toScanned(request, fd, b.regId);
          const s2 = await transitionReg(request, fd, b.regId, 'mark-sent', {
            portalReference: 'HS-2026-0043',
          });
          expect(s2.status).toBe(200);
          const noReason = await transitionReg(request, fd, b.regId, 'mark-rejected', {});
          expectProblem(noReason, 422, 'VALIDATION_FAILED');
          expect((noReason.body.errors ?? []).map((e) => e.code)).toContain('REASON_REQUIRED');
          const rej = await transitionReg(request, fd, b.regId, 'mark-rejected', {
            rejectedReason: 'Sai ngay het han thi thuc',
          });
          expect(rej.status, JSON.stringify(rej.body)).toBe(200);
          expect(rej.body.status).toBe('scanned');
          expect(rej.body.allowedActions.map((a) => a.action)).toContain('mark-sent');
        },
      );

      test(
        'TC-L3-050 US-047/AC1 [A · Cao]',
        {
          annotation: [
            story('US-047/AC1'),
            eps('createReservation, createHoldFromQuote, confirmDeposit, listRegistrations'),
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-050', [
            EP.createReservation,
            EP.createHoldFromQuote,
            EP.confirmDeposit,
            EP3.listRegistrations,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const sal = await sessionOrSkip(request, 'qa.sal');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const one = async (res: { id: string }, persons: number, what: string) => {
            const all = [];
            // đúng 1 bản ghi (listRegistrations view=all)
            let cursor: string | undefined;
            for (let p = 0; p < 50; p++) {
              const l = await call<{
                data: Array<{
                  id: string;
                  reservationId: string;
                  status: string;
                  requiredCount: number;
                }>;
                page: { nextCursor?: string | null };
              }>(request, 'GET', p3(EP3.listRegistrations, fd), {
                session: fd,
                query: { view: 'all', limit: 100, cursor },
              });
              expect(l.status).toBe(200);
              all.push(...l.body.data.filter((x) => x.reservationId === res.id));
              cursor = l.body.page?.nextCursor ?? undefined;
              if (!cursor) break;
            }
            expect(all, `${what}: đúng 1 bản ghi khai báo`).toHaveLength(1);
            expect(all[0]!.status, what).toBe('none');
            expect(all[0]!.requiredCount, `${what}: số người cần khai = số khách`).toBe(persons);
          };
          // đặt mới Trực tiếp: 2 NL + 1 trẻ 6–11 + 1 trẻ dưới 6 → 4 người (mọi người kể cả trẻ dưới 6)
          const d = await bookFree(request, fd, c, {
            room: room(c, '301'),
            nights: 2,
            today,
            adults: 2,
            children6to11: 1,
            childrenUnder6: 1,
          });
          await one(d, 4, 'đặt mới Trực tiếp');
          // giữ chỗ từ báo giá → xác nhận cọc
          const h = await makeHold(request, sal, c, {
            rooms: SMALL_ROOMS.map((n) => room(c, n)),
            arrival: (await freeWindow(request, fd, room(c, '102'), 1, { today })).arrival,
            nights: 1,
            holdHours: 24,
            adults: 2,
          });
          await one(h.hold, 2, 'giữ chỗ từ báo giá');
          const cur = await getReservation(request, fd, h.hold.id);
          const dep = await call<Reservation & ProblemFields>(
            request,
            'POST',
            `/v1/properties/${propertyIdOf(fd)}/reservations/${h.hold.id}/actions/confirm-deposit`,
            {
              session: fd,
              idempotencyKey: true,
              ifMatch: versionTag(cur.body.version),
              body: {
                payment: {
                  type: 'deposit',
                  method: 'cash',
                  amountVnd: cur.body.depositRequiredVnd ?? h.quote.depositVnd ?? 0,
                },
              },
            },
          );
          expect(dep.status, JSON.stringify(dep.body)).toBe(200);
          expect(dep.body.status).toBe('confirmed');
          await one(h.hold, 2, 'giữ chỗ → xác nhận cọc');
          // đơn OTA nhập tay
          const o = await bookFree(request, fd, c, {
            room: anyRoom(c),
            nights: 1,
            today,
            kind: 'booking',
            adults: 1,
          });
          await one(o, 1, 'đơn OTA nhập tay');
          // đơn dài hạn nhập tay (AC5a – HĐ thật R3)
          const lr = room(c, '402');
          const w = await freeWindow(request, fd, lr, 30, { today });
          const long = await createReservation(
            request,
            fd,
            reservationBody(c, {
              room: lr,
              ...w,
              adults: 2,
              guestId: (await namedGuest(request, fd)).id,
              extra: {
                manualLongStay: {
                  monthlyRentVnd: 9500000,
                  externalContractRef: 'HD-E2E-L3-050',
                  depositHeldVnd: 9500000,
                },
              },
            }),
          );
          expect(long.status, JSON.stringify(long.body)).toBe(201);
          track('reservation', long.body.id);
          await one(long.body, 2, 'đơn dài hạn nhập tay');
          expect(channel(c, 'direct').id).toBeTruthy();
        },
      );

      test(
        'TC-L3-052 US-047/AC3 [A · TB]',
        { annotation: [story('US-047/AC3'), eps('updateReservation, getRegistration')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-052', [EP.updateReservation, EP3.getRegistration]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const adults3 = async (st: { res: { id: string } }) => {
            const cur = await getReservation(request, fd, st.res.id);
            const up = await call<Reservation & ProblemFields>(
              request,
              'PATCH',
              `/v1/properties/${propertyIdOf(fd)}/reservations/${st.res.id}`,
              { session: fd, ifMatch: versionTag(cur.body.version), body: { adults: 3 } },
            );
            expect(up.status, JSON.stringify(up.body)).toBe(200);
          };
          // (a) partial 2 người (mới có 1 giấy tờ) → cần 3, trạng thái theo số người đã có
          const a = await farStay(request, c, fd, today, { adults: 2 });
          expect((await regOf(request, fd, a.regId)).status).toBe('partial');
          await adults3(a);
          const ra = await regOf(request, fd, a.regId);
          expect(ra.requiredCount).toBe(3);
          expect(ra.submittedCount).toBe(1);
          expect(ra.status).toBe('partial');
          // (b) confirmed 2 người → needs_update (K9) + việc khai bổ sung (danh sách cần cập nhật)
          const b = await farStay(request, c, fd, today, { adults: 2 });
          const d2 = await addDocument(
            request,
            fd,
            b.regId,
            vnDoc('Ngo Van Tam', { isMain: false, gender: 'male' }),
          );
          expect(d2.status).toBe(201);
          await toScanned(request, fd, b.regId);
          await toConfirmed(request, fd, b.regId);
          await adults3(b);
          const rb = await regOf(request, fd, b.regId);
          expect(rb.requiredCount).toBe(3);
          expect(rb.status).toBe('needs_update');
          expect(rb.deadlineLabel).toBe('needs_update');
          expect((await regRow(request, fd, b.res.id, 'needs_update'))?.status).toBe(
            'needs_update',
          );
        },
      );

      test(
        'TC-L3-055 US-022/– [A · TB]',
        {
          annotation: [
            story('US-022/–'),
            eps('removePartyMember, addPartyMember, getRegistration'),
          ],
        },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-055', [
            EP3.addPartyMember,
            EP3.removePartyMember,
            EP3.getRegistration,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 2 });
          // người thứ 2 trong đơn (người đi cùng) + giấy tờ gắn với người đó, có ảnh
          const g2 = await namedGuest(request, fd);
          const add = await call<{ members: Array<{ id: string; guest?: { id: string } }> }>(
            request,
            'POST',
            p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
            {
              session: fd,
              idempotencyKey: true,
              body: { role: 'companion', guestId: g2.id, relationship: 'friend' },
            },
          );
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const member = add.body.members.find((m) => m.guest?.id === g2.id);
          expect(member, JSON.stringify(add.body)).toBeTruthy();
          const d2 = await addDocument(
            request,
            fd,
            st.regId,
            vnDoc(g2.fullName, { isMain: false, partyMemberId: member!.id }),
            1,
          );
          expect(d2.status, JSON.stringify(d2.body)).toBe(201);
          expect(d2.body.status).toBe('review');
          const doc2 = d2.body.documents.find((d) => d.partyMemberId === member!.id);
          expect(doc2?.imageIds ?? []).toHaveLength(1);
          // 1. bỏ người thứ 2 khỏi đơn
          const party = await partyOf(request, fd, st.res.id);
          const del = await call(
            request,
            'DELETE',
            p3(EP3.removePartyMember, fd, { reservationId: st.res.id, memberId: member!.id }),
            { session: fd, idempotencyKey: true, ifMatch: versionTag(party.version) },
          );
          expect(del.status, JSON.stringify(del.body)).toBe(204);
          const r1 = await regOf(request, fd, st.regId);
          expect(r1.status, 'thiếu người so với số khách → partial').toBe('partial');
          expect(r1.documents.map((d) => d.id)).not.toContain(doc2!.id);
          // ảnh của người bị bỏ: không còn đọc được (hủy khóa ngay – A-38)
          await stepUp(request, fd);
          const img = await getImage(request, fd, st.regId, doc2!.id, doc2!.imageIds![0]!);
          expect(img.status).toBe(404);
          // 2. thêm người khác chưa có giấy tờ → vẫn partial
          const g3 = await namedGuest(request, fd);
          const add3 = await call(
            request,
            'POST',
            p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
            {
              session: fd,
              idempotencyKey: true,
              body: { role: 'companion', guestId: g3.id, relationship: 'family' },
            },
          );
          expect(add3.status, JSON.stringify(add3.body)).toBe(201);
          const r2 = await regOf(request, fd, st.regId);
          expect(r2.status).toBe('partial');
          expect(r2.submittedCount).toBeLessThan(r2.requiredCount);
        },
      );
    });

    test.describe('4.3 Mã cửa, xóa ảnh giấy tờ theo hạn', () => {
      test(
        'TC-L3-060 US-128/AC1 [A+E · Cao]',
        { annotation: [story('US-128/AC1'), eps('setDoorCredential, getGuestStay')] },
        async ({ request }) => {
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 1 });
          // R2: không có endpoint nhập mã cửa (404), app khách không có mã cửa (ĐK-2)
          const set = await call(
            request,
            'PUT',
            p3(EP3.setDoorCredential, fd, { reservationId: st.res.id }),
            { session: fd, idempotencyKey: true, body: { code: '1203472' } },
          );
          expect(set.status).toBe(404);
          const link = await guestLink(request, fd, st.res.id);
          const g = await openGuest(request, link.token);
          expect(g.status).toBe(200);
          const gs = await guestCall(request, 'GET', EP3.getGuestStay[1], g.cookie);
          expect(gs.status, JSON.stringify(gs.body)).toBe(200);
          expect(JSON.stringify(gs.body), 'ĐK-2: mức 1 không có doorCode').not.toContain(
            'doorCode',
          );
          test.skip(
            true,
            `${R3_DOOR} – hiệu lực mặc định nhận → trả muộn và hiện trên app khách (TC-L7-021)`,
          );
        },
      );

      test(
        'TC-L3-061 US-128/AC3 [A · Cao]',
        { annotation: [story('US-128/AC3'), eps('checkOut, changeRoom, getDoorCredential')] },
        async ({ request }) => {
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 1 });
          const get = await call(
            request,
            'GET',
            p3(EP3.getDoorCredential, fd, { reservationId: st.res.id }),
            { session: fd },
          );
          expect(get.status, 'getDoorCredential chưa đăng ký ở R2').toBe(404);
          test.skip(
            true,
            `${R3_DOOR} – mã cũ "đã hủy" khi trả phòng/đổi phòng + việc nhắc xóa mã trên app khóa (ESC-011)`,
          );
        },
      );

      test(
        'TC-L3-062 US-128/–; US-025/AC3 [A · TB]',
        { annotation: [story('US-128/–; US-025/AC3'), eps('setDoorCredential')] },
        async ({ request }) => {
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          // đơn còn phải thu > 0 (chỉ cọc)
          const st = await farStay(request, c, fd, today, { adults: 1, nights: 3, pay: 'deposit' });
          const folio = await getFolio(request, fd, String(st.res.folioId));
          expect(folio.totals.balanceDueVnd, 'còn phải thu > 0').toBeGreaterThan(0);
          // R2: không có chức năng nhập mã cửa → không giao được mã trước khi đủ điều kiện (BR-402)
          const set = await call(
            request,
            'PUT',
            p3(EP3.setDoorCredential, fd, { reservationId: st.res.id }),
            { session: fd, idempotencyKey: true, body: { code: '1203472' } },
          );
          expect(set.status).toBe(404);
          const res = await getReservation(request, fd, st.res.id);
          expect(JSON.stringify(res.body)).not.toMatch(/doorCode|doorCredential/);
        },
      );

      test(
        'TC-L3-071 US-049/AC2 [A · Cao]',
        { annotation: [story('US-049/AC2'), eps('transitionRegistration, getDocumentImage')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-071', [
            EP3.transitionRegistration,
            EP3.getDocumentImage,
          ]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 1, doc: false });
          const add = await addDocument(request, fd, st.regId, vnDoc(st.guestName), 2);
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const doc = mainDoc(add.body);
          expect(doc.imageIds).toHaveLength(2);
          await toScanned(request, fd, st.regId, 'refused');
          await stepUp(request, fd);
          const before = await getImage(request, fd, st.regId, doc.id, doc.imageIds![0]!);
          expect(before.status, 'trước khi confirmed ảnh còn').toBe(200);
          const conf = await toConfirmed(request, fd, st.regId);
          // xóa NGAY khi confirmed, không chờ J16
          for (const imageId of doc.imageIds!) {
            const img = await getImage(request, fd, st.regId, doc.id, imageId, 'recheck');
            expect(img.status, `ảnh ${imageId} sau confirmed`).toBe(404);
          }
          expect(conf.imagesPurgeReason).toBe('no_consent');
          expect(conf.imagesPurgedAt).toBeTruthy();
          const reg = await regOf(request, fd, st.regId);
          expect(mainDoc(reg).imageIds ?? []).toHaveLength(0);
          // trường văn bản cần thiết còn (số giấy tờ 4 ký tự cuối)
          expect(mainDoc(reg).docNumberLast4).toHaveLength(4);
          // ▶ J16 (lưới an toàn) – chỉ khi stack cho chạy job (CI / E2E_CLOCK_CONTROL=1); ảnh vẫn 404
          const j = CLOCK_ENABLED ? await runJobIfAny(request, 'retention.purge') : null;
          test.info().annotations.push({
            type: 'J16',
            description: j
              ? JSON.stringify(j)
              : 'không chạy (stack không cho chạy job hoặc job chưa đăng ký)',
          });
          const again = await getImage(request, fd, st.regId, doc.id, doc.imageIds![0]!, 'recheck');
          expect(again.status).toBe(404);
          // nhật ký C3: mỗi ảnh một dòng purge (lý do no_consent)
          const purge = (await c3Log(request, st.res.id)).filter(
            (e) => e.subjectType === 'document_image' && e.action === 'purge',
          );
          expect(purge).toHaveLength(2);
          for (const e of purge) expect(e.reasonCode).toBe('no_consent');
        },
      );

      test(
        'TC-L3-072 US-049/AC3 [A+E · Cao]',
        { annotation: [story('US-049/AC3'), eps('purgeRegistrationImages')] },
        async ({ request }) => {
          await requireEndpoints(request, 'TC-L3-072', [EP3.purgeRegistrationImages]);
          const fd = await sessionOrSkip(request, 'qa.fd');
          const mgr = await sessionOrSkip(request, 'qa.mgr');
          const c = await s2Context(request);
          const today = await stackToday(request);
          const st = await farStay(request, c, fd, today, { adults: 1, doc: false });
          const add = await addDocument(request, fd, st.regId, vnDoc(st.guestName), 1);
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const doc = mainDoc(add.body);
          const cons = await consentFor(request, fd, st.regId, doc.id, 'granted');
          expect(cons.status).toBe(201);
          const path = p3(EP3.purgeRegistrationImages, fd, { registrationId: st.regId });
          // (a) qa.fd không có chức năng – API 403
          const v0 = (await regOf(request, fd, st.regId)).version;
          const a = await call(request, 'DELETE', path, {
            ...dev(fd),
            idempotencyKey: true,
            ifMatch: versionTag(v0),
            query: { reason: 'guest_request' },
          });
          expect(a.status, JSON.stringify(a.body)).toBe(403);
          // (b) qa.mgr xóa sớm (máy quầy, If-Match, lý do)
          const t0 = Date.now();
          const b = await call(request, 'DELETE', path, {
            ...dev(mgr),
            idempotencyKey: true,
            ifMatch: versionTag(v0),
            query: { reason: 'guest_request' },
          });
          expect(b.status, JSON.stringify(b.body)).toBe(204);
          const reg = await regOf(request, fd, st.regId);
          expect(reg.imagesPurgeReason).toBe('guest_request');
          expect(Date.parse(String(reg.imagesPurgedAt))).toBeGreaterThanOrEqual(t0 - 60_000);
          expect(mainDoc(reg).imageIds ?? []).toHaveLength(0);
          await stepUp(request, mgr);
          const img = await getImage(request, mgr, st.regId, doc.id, doc.imageIds![0]!);
          expect(img.status).toBe(404);
          // nhật ký: người (qa.mgr), lý do, thời điểm
          const purge = (await c3Log(request, st.res.id)).filter(
            (e) => e.subjectType === 'document_image' && e.action === 'purge',
          );
          expect(purge).toHaveLength(1);
          expect(purge[0]).toMatchObject({
            userName: mgr.me.displayName,
            reasonCode: 'guest_request',
          });
          expect(Date.parse(purge[0]!.occurredAt)).toBeGreaterThanOrEqual(t0 - 60_000);
          // lần 2 → 409 (đã xóa)
          const again = await call(request, 'DELETE', path, {
            ...dev(mgr),
            idempotencyKey: true,
            ifMatch: versionTag(reg.version),
            query: { reason: 'guest_request' },
          });
          expect(again.status).toBe(409);
        },
      );
    });
  },
);
