// E2E Sprint 3 – bảo vệ dữ liệu C3 theo vai và thiết bị (US-003 AC1, US-048, US-087 AC3, US-142 AC2; rbac M1,
// 8.5, 8.7; SR-DEV-03/04, SR-C3-03/07/09; SEC F01). Project "api" (đồng hồ thật, song song): KHÔNG nhận phòng –
// đơn confirmed ngày xa (bookFree, hủy ở afterEach) + giấy tờ CCCD có địa chỉ và 1 ảnh, nhập từ máy quầy được cấp.
// Thứ tự kiểm của server (BE-C, crypto/public/c3-access-gate.ts): phiên → thiết bị được cấp → vai → step-up
// (401 REAUTH_REQUIRED) → phạm vi → lý do → c3_access_log (trước dữ liệu) → dữ liệu (`Cache-Control: no-store`).
// TC: product/tests/test-cases/r1-main-flows.md mục 2 (TC-RB-001, TC-RB-002, TC-RB-022).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  freshSession,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  resetRateLimits,
  sessionOrSkip,
  stackToday,
  type Me,
  type StaffSession,
} from '../support/api.js';
import { ORIGIN, SEED_PASSWORD, SESSION_COOKIE } from '../support/env.js';
import {
  EP,
  bookFree,
  cleanupTracked,
  room,
  s2Context,
  stackNow,
  type Reservation,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  addDocument,
  dev,
  namedGuest,
  needDevice,
  p3,
  registrationOf,
  stepUp,
  vnDoc,
  type Registration,
} from '../support/s3.js';

// ───────────────────────── helpers ─────────────────────────

interface C3Fixture {
  res: Reservation;
  regId: string;
  docId: string;
  imageId: string;
  guestId: string;
  guestName: string;
  /** giá trị rõ đã nhập – chỉ dùng để dò rò rỉ, không in ra */
  docNumber: string;
  last4: string;
  address: string;
  fullNameOnDoc: string;
}

/**
 * Đơn confirmed ngày xa + giấy tờ người đứng tên (CCCD, địa chỉ thường trú, 1 ảnh) nhập bởi qa.fd trên máy quầy.
 * `closer`: 'sal' → kênh Trực tiếp nguồn "nhân viên sale" người chốt qa.sal; 'ctv' → kênh CTV người chốt qa.ctv1;
 * khách do chính người chốt tạo (phạm vi `own` của hồ sơ khách SAL/CTV – rbac M6).
 */
async function c3Fixture(
  ctx: APIRequestContext,
  c: S2Context,
  fd: StaffSession,
  today: string,
  i: { roomNo: string; closer?: StaffSession; closerKind?: 'sal' | 'ctv' },
): Promise<C3Fixture> {
  const g = await namedGuest(ctx, i.closer ?? fd);
  const res = await bookFree(ctx, fd, c, {
    room: room(c, i.roomNo),
    nights: 1,
    today,
    guestId: g.id,
    kind: i.closerKind === 'ctv' ? 'agent' : 'direct',
    ...(i.closerKind === 'sal' && i.closer
      ? { extra: { directSource: 'sales_staff', closerUserId: i.closer.me.id } }
      : {}),
  });
  const regId = await registrationOf(ctx, fd, res);
  const data = vnDoc(g.fullName);
  const add = await addDocument(ctx, fd, regId, data, 1);
  expect(add.status, `addGuestDocument: ${JSON.stringify(add.body)}`).toBe(201);
  const doc = add.body.documents.find((d) => d.isMain) ?? add.body.documents[0];
  expect(doc, 'giấy tờ người đứng tên').toBeTruthy();
  expect(doc!.imageIds?.length ?? 0, 'ảnh giấy tờ đã lưu').toBeGreaterThanOrEqual(1);
  const docNumber = String(data.docNumber);
  return {
    res,
    regId,
    docId: doc!.id,
    imageId: doc!.imageIds![0]!,
    guestId: g.id,
    guestName: g.fullName,
    docNumber,
    last4: docNumber.slice(-4),
    address: String(data.address),
    fullNameOnDoc: String(data.fullNameOnDoc),
  };
}

/** Khóa C3/giấy tờ không được có mặt (kể cả giá trị null) trong JSON của SAL/CTV – TC-RB-001. */
const C3_KEYS = new Set([
  'docType',
  'docNumber',
  'docNumberLast4',
  'idDocLast4',
  'idDocType',
  'idDocument',
  'documents',
  'document',
  'imageIds',
  'images',
  'imageId',
  'address',
  'permanentAddress',
  'fullNameOnDoc',
  'passportNumber',
  'visaNumber',
  'issuingPlace',
]);

/** Duyệt mọi cặp khóa/giá trị của JSON. */
function walk(v: unknown, visit: (key: string, value: unknown, path: string) => void, path = '$') {
  if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, visit, `${path}[${i}]`));
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      visit(k, x, `${path}.${k}`);
      walk(x, visit, `${path}.${k}`);
    }
  }
}

/** Giá trị rõ của giấy tờ (số đầy đủ, 4 số cuối kể cả dạng che, địa chỉ, họ tên trên giấy tờ) không có trong `text`. */
function leaks(text: string, f: C3Fixture, opts: { nameOnDoc?: boolean } = {}): string[] {
  const out: string[] = [];
  if (text.includes(f.docNumber)) out.push('số giấy tờ đầy đủ');
  if (text.includes(f.address)) out.push('địa chỉ thường trú');
  if (new RegExp(`(["•*xX#]\\s?)${f.last4}"`).test(text)) out.push('4 số cuối giấy tờ');
  if (opts.nameOnDoc && text.includes(f.fullNameOnDoc)) out.push('họ tên trên giấy tờ');
  return out;
}

function expectNoC3(where: string, body: unknown, f: C3Fixture): void {
  const keys: string[] = [];
  walk(body, (k, _v, path) => {
    if (C3_KEYS.has(k)) keys.push(path);
  });
  expect(keys, `${where}: khóa giấy tờ/C3 phải vắng mặt`).toEqual([]);
  expect(leaks(JSON.stringify(body ?? null), f), `${where}: giá trị giấy tờ lộ ra`).toEqual([]);
}

interface C3LogEntry {
  occurredAt: string;
  actorType: string;
  userName?: string;
  trustedDeviceName?: string;
  subjectType: string;
  action: string;
  reservationCode?: string;
  subjectLabel?: string;
  reasonCode?: string;
}

/** c3_access_log của một đơn (listC3AccessLog, OWN/MGR) – mới nhất trước, đủ mọi trang. */
async function c3LogOf(
  ctx: APIRequestContext,
  owner: StaffSession,
  reservationId: string,
): Promise<C3LogEntry[]> {
  const out: C3LogEntry[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) {
    const r = await call<{ data: C3LogEntry[]; page: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      p3(EP3.listC3AccessLog, owner),
      { session: owner, query: { reservationId, limit: 100, cursor } },
    );
    expect(r.status, `listC3AccessLog: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
    out.push(...r.body.data);
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return out;
}

interface AuditRow {
  occurredAt: string;
  actorName?: string;
  category: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityCode?: string;
  reason?: string;
}

/**
 * Nhật ký nhóm `access` của một người (owner xem) từ mốc `since` (giờ của SERVER – /health), mới nhất trước:
 * đọc tới khi gặp dòng cũ hơn mốc (người dùng QA bị từ chối rất nhiều lần ở project rbac chạy song song).
 */
async function accessAuditSince(
  ctx: APIRequestContext,
  owner: StaffSession,
  actorUserId: string,
  since: string,
): Promise<AuditRow[]> {
  const out: AuditRow[] = [];
  const from = new Date(since).getTime();
  const day = since.slice(0, 10);
  let cursor: string | undefined;
  for (let i = 0; i < 50; i++) {
    const r = await call<{ data: AuditRow[]; page: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      `/v1/properties/${propertyIdOf(owner)}/audit-events`,
      {
        session: owner,
        query: { category: 'access', actorUserId, from: day, limit: 100, cursor },
      },
    );
    expect(r.status, `listAuditEvents: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
    const fresh = r.body.data.filter((e) => new Date(e.occurredAt).getTime() >= from);
    out.push(...fresh);
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor || fresh.length < r.body.data.length) break;
  }
  return out;
}

/** 4 lời gọi C3 của TC-RB-002 / TC-RB-022 trên giấy tờ của `f`. */
function c3Calls(s: StaffSession, f: C3Fixture): Array<[op: string, path: string]> {
  const ids = { registrationId: f.regId, documentId: f.docId, imageId: f.imageId };
  return [
    ['getRegistration', p3(EP3.getRegistration, s, ids)],
    [
      'getGuestDocumentSensitive',
      `${p3(EP3.getGuestDocumentSensitive, s, ids)}?reason=registration`,
    ],
    ['getDocumentImage', `${p3(EP3.getDocumentImage, s, ids)}?reason=registration`],
    ['getPortalData', p3(EP3.getPortalData, s, ids)],
  ];
}

/**
 * Origin của app nhân viên PWA (STAFF_BASE_URL của api). Mặc định theo quy ước stack: cổng admin-web + 1
 * (dev 8081 → 8082; CI 8081 → 8082; stack dùng một lần 28081 → 28082). E2E_STAFF_ORIGIN ghi đè.
 */
function staffPwaOrigin(): string {
  if (process.env.E2E_STAFF_ORIGIN) return new URL(process.env.E2E_STAFF_ORIGIN).origin;
  const u = new URL(ORIGIN);
  u.port = String(Number(u.port || (u.protocol === 'https:' ? 443 : 80)) + 1);
  return u.origin;
}

// ───────────────────────── tests ─────────────────────────

let today = '';

test.describe(
  'C3 theo vai và thiết bị (US-003, US-048, US-142 – Sprint 3)',
  { tag: ['@api', '@sprint3', '@security'] },
  () => {
    test.beforeAll(async ({ request }) => {
      today = await stackToday(request);
    });
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test(
      'TC-RB-001 SAL/CTV: hồ sơ khách, chi tiết đơn, người trong đơn, tìm khách – JSON không có khóa giấy tờ (kể cả 4 số cuối), ảnh, địa chỉ',
      {
        annotation: [
          { type: 'story', description: 'US-003/AC1; US-087/AC3' },
          { type: 'endpoints', description: 'getGuest, getReservation, listParty, searchGuests' },
        ],
      },
      async ({ request }) => {
        await requireEndpoints(request, 'TC-RB-001', [
          EP.getReservation,
          EP3.listParty,
          EP3.addGuestDocument,
          EP3.getRegistration,
        ]);
        needDevice('TC-RB-001');
        test.info().annotations.push({
          type: 'note',
          description:
            'Thay khách g7 (DS-0) bằng dữ liệu tự tạo: mỗi vai một đơn confirmed ngày xa (SAL: Trực tiếp nguồn sale, người chốt qa.sal; CTV: kênh CTV, người chốt qa.ctv1), giấy tờ CCCD có địa chỉ + 1 ảnh nhập từ máy quầy. Phần giao diện (không có khối "Giấy tờ") thuộc lớp E – chưa phủ ở ca API này.',
        });
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const sal = await sessionOrSkip(request, 'qa.sal');
        const ctv = await sessionOrSkip(request, 'qa.ctv1');

        for (const [who, s, kind, roomNo] of [
          ['qa.sal', sal, 'sal', '102'],
          ['qa.ctv1', ctv, 'ctv', '103'],
        ] as const) {
          const f = await c3Fixture(request, c, fd, today, {
            roomNo,
            closer: s,
            closerKind: kind,
          });
          // đối chứng: dữ liệu giấy tờ có thật trên đơn (FD+ thấy dạng che 4 số cuối ở bản ghi khai báo)
          const reg = await call<Registration>(
            request,
            'GET',
            p3(EP3.getRegistration, fd, { registrationId: f.regId }),
            { session: fd },
          );
          expect(reg.status).toBe(200);
          expect(reg.body.documents.some((d) => d.docNumberLast4 === f.last4)).toBe(true);

          const pid = propertyIdOf(s);
          const guest = await call(request, 'GET', `/v1/properties/${pid}/guests/${f.guestId}`, {
            session: s,
          });
          expect(guest.status, `${who} getGuest: ${JSON.stringify(guest.body)}`).toBe(200);
          expectNoC3(`${who} getGuest`, guest.body, f);

          const res = await call(request, 'GET', `/v1/properties/${pid}/reservations/${f.res.id}`, {
            session: s,
          });
          expect(res.status, `${who} getReservation: ${JSON.stringify(res.body)}`).toBe(200);
          expectNoC3(`${who} getReservation`, res.body, f);

          const party = await call<{ members?: unknown[] }>(
            request,
            'GET',
            p3(EP3.listParty, s, { reservationId: f.res.id }),
            { session: s },
          );
          expect(party.status, `${who} listParty: ${JSON.stringify(party.body)}`).toBe(200);
          // rbac D10: SAL/CTV chỉ thấy số người (`own_count_only`), không có danh sách người
          expect(party.body.members, `${who} listParty.members`).toBeUndefined();
          expectNoC3(`${who} listParty`, party.body, f);

          const search = await call<{ data: Array<{ id: string }> }>(
            request,
            'GET',
            `/v1/properties/${pid}/guests`,
            { session: s, query: { q: f.guestName, limit: 20 } },
          );
          expect(search.status, `${who} searchGuests: ${JSON.stringify(search.body)}`).toBe(200);
          expect(
            search.body.data.some((g) => g.id === f.guestId),
            `${who} tìm thấy khách của mình`,
          ).toBe(true);
          expectNoC3(`${who} searchGuests`, search.body, f);
        }
      },
    );

    test(
      'TC-RB-002 SAL, CTV, HK, MT gọi trực tiếp getRegistration/getGuestDocumentSensitive/getDocumentImage/getPortalData → 403/404, không nội dung, có audit, không thêm c3_access_log',
      {
        annotation: [
          { type: 'story', description: 'US-003/AC1; US-048/AC2' },
          {
            type: 'endpoints',
            description:
              'getRegistration, getGuestDocumentSensitive, getDocumentImage, getPortalData',
          },
        ],
      },
      async ({ request }) => {
        await requireEndpoints(request, 'TC-RB-002', [
          EP3.getRegistration,
          EP3.getGuestDocumentSensitive,
          EP3.getDocumentImage,
          EP3.getPortalData,
          EP3.listC3AccessLog,
        ]);
        needDevice('TC-RB-002');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const owner = await sessionOrSkip(request, 'qa.owner');
        const f = await c3Fixture(request, c, fd, today, { roomNo: '201' });
        const logBefore = await c3LogOf(request, owner, f.res.id);

        for (const username of ['qa.sal', 'qa.ctv1', 'qa.hk', 'qa.mt']) {
          const s = await sessionOrSkip(request, username);
          const since = await stackNow(request);
          for (const [op, path] of c3Calls(s, f)) {
            // gọi từ máy quầy ĐƯỢC CẤP (cookie thiết bị hợp lệ) – lần từ chối là do VAI, không do thiết bị
            const r = await call(request, 'GET', path, dev(s));
            expect(
              [403, 404],
              `${username} ${op} (máy được cấp): ${r.status} ${JSON.stringify(r.body)}`,
            ).toContain(r.status);
            if (r.status === 403) {
              expect((r.body as { code?: string }).code, `${username} ${op}`).toBe(
                'FORBIDDEN_ACTION',
              );
            }
            expect(r.headers['content-type'] ?? '', `${username} ${op}: không trả ảnh`).not.toMatch(
              /^image\//,
            );
            expect(
              leaks(JSON.stringify(r.body ?? null), f, { nameOnDoc: true }),
              `${username} ${op}: không lộ nội dung giấy tờ`,
            ).toEqual([]);
            // không cookie thiết bị (điện thoại/PWA): cũng bị chặn, không nội dung
            const noDevice = await call(request, 'GET', path, { session: s });
            expect([403, 404], `${username} ${op} (không thiết bị)`).toContain(noDevice.status);
            expect(leaks(JSON.stringify(noDevice.body ?? null), f, { nameOnDoc: true })).toEqual(
              [],
            );
          }
          // mỗi lần bị từ chối có audit access.denied (owner xem được) – entityCode = operationId
          const audit = await accessAuditSince(request, owner, s.me.id, since);
          const denied = audit.filter((e) => e.action === 'access.denied');
          for (const [op] of c3Calls(s, f)) {
            expect(
              denied.some((e) => e.entityCode === op || e.entityId === op),
              `${username}: audit access.denied cho ${op}`,
            ).toBe(true);
          }
        }

        // không có dòng c3_access_log nào mới (đặc biệt không có "view") cho các lần bị từ chối
        const logAfter = await c3LogOf(request, owner, f.res.id);
        expect(logAfter.length, JSON.stringify(logAfter.slice(0, 3))).toBe(logBefore.length);
        expect(logAfter.filter((e) => e.action === 'view')).toHaveLength(0);
      },
    );

    test(
      'TC-RB-022 qa.fd trên PWA/không thiết bị → 403 DEVICE_NOT_TRUSTED, không nội dung; máy quầy được cấp: step-up rồi xem được, no-store, có c3_access_log',
      {
        annotation: [
          { type: 'story', description: 'US-048/–; US-142/AC2' },
          {
            type: 'endpoints',
            description: 'getGuestDocumentSensitive, getDocumentImage, getDoorCredential',
          },
        ],
      },
      async ({ request }) => {
        await requireEndpoints(request, 'TC-RB-022', [
          EP3.getGuestDocumentSensitive,
          EP3.getDocumentImage,
          EP3.stepUp,
          EP3.listC3AccessLog,
        ]);
        needDevice('TC-RB-022');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const owner = await sessionOrSkip(request, 'qa.owner');
        const f = await c3Fixture(request, c, fd, today, { roomNo: '202' });
        const ids = { registrationId: f.regId, documentId: f.docId, imageId: f.imageId };
        const sensitivePath = `${p3(EP3.getGuestDocumentSensitive, fd, ids)}?reason=registration`;
        const imagePath = `${p3(EP3.getDocumentImage, fd, ids)}?reason=registration`;
        const doorPath = p3(EP3.getDoorCredential, fd, { reservationId: f.res.id });

        // ── PWA điện thoại: phiên đăng nhập từ origin app nhân viên (client_origin staff_pwa), không bao giờ
        //    có cookie thiết bị được cấp (SR-DEV-03) ──
        const pwaOrigin = staffPwaOrigin();
        const pwaLogin = () =>
          call<Me>(request, 'POST', '/v1/auth/login', {
            body: { username: 'qa.fd', password: SEED_PASSWORD },
            headers: { origin: pwaOrigin },
          });
        let lr = await pwaLogin();
        // 429 do khối lượng đăng nhập của chính bộ test (SR-RL-01, một IP) – xóa bộ đếm rồi thử lại MỘT lần
        if (lr.status === 429 && (await resetRateLimits(request, '429 khi đăng nhập PWA qa.fd')))
          lr = await pwaLogin();
        let pwa: StaffSession;
        const pwaToken = lr.setCookies
          .map((x) => x.split(';')[0] ?? '')
          .find((x) => x.startsWith(`${SESSION_COOKIE}=`))
          ?.slice(SESSION_COOKIE.length + 1);
        if (lr.status === 200 && pwaToken) {
          pwa = { username: 'qa.fd', token: decodeURIComponent(pwaToken), me: lr.body };
        } else {
          test.info().annotations.push({
            type: 'note',
            description: `Đăng nhập từ origin PWA ${pwaOrigin} → ${lr.status} (stack không cấu hình STAFF_BASE_URL) – dùng phiên mới không cookie thiết bị thay cho PWA`,
          });
          pwa = await freshSession(request, 'qa.fd');
        }
        const logStart = await c3LogOf(request, owner, f.res.id);
        const since = await stackNow(request);
        for (const [op, path] of [
          ['getGuestDocumentSensitive', sensitivePath],
          ['getDocumentImage', imagePath],
        ] as const) {
          const r = await call(request, 'GET', path, { session: pwa });
          expect(r.status, `PWA ${op}: ${JSON.stringify(r.body)}`).toBe(403);
          expect((r.body as { code?: string }).code).toBe('DEVICE_NOT_TRUSTED');
          expect(r.headers['content-type'] ?? '').not.toMatch(/^image\//);
          expect(leaks(JSON.stringify(r.body ?? null), f, { nameOnDoc: true })).toEqual([]);
        }
        // mã cửa: US-128 dời R3 (R-C, SEC D2) – route chưa đăng ký trên build R2
        const door = await call(request, 'GET', doorPath, { session: pwa });
        expect(door.status, `getDoorCredential: ${JSON.stringify(door.body)}`).toBe(404);
        expect(JSON.stringify(door.body ?? '')).not.toMatch(/"code"\s*:\s*"\d{4,}"/);
        // lần bị chặn có audit access.denied (lý do DEVICE_NOT_TRUSTED), owner xem được
        const audit = await accessAuditSince(request, owner, fd.me.id, since);
        const deviceDenied = audit.filter(
          (e) => e.action === 'access.denied' && e.entityType === 'trusted_device',
        );
        expect(deviceDenied.length, JSON.stringify(audit.slice(0, 3))).toBeGreaterThanOrEqual(2);
        expect(deviceDenied.every((e) => e.reason === 'DEVICE_NOT_TRUSTED')).toBe(true);
        // không có dòng c3_access_log nào cho các lần bị chặn
        expect((await c3LogOf(request, owner, f.res.id)).length).toBe(logStart.length);

        // ── máy quầy đã được cấp (cookie thiết bị) nhưng phiên chưa xác thực lại → 401 REAUTH_REQUIRED ──
        const desk = await freshSession(request, 'qa.fd');
        const noStepUp = await call(request, 'GET', sensitivePath, dev(desk));
        expect(noStepUp.status, JSON.stringify(noStepUp.body)).toBe(401);
        expect((noStepUp.body as { code?: string }).code).toBe('REAUTH_REQUIRED');
        expect(leaks(JSON.stringify(noStepUp.body ?? null), f, { nameOnDoc: true })).toEqual([]);
        expect((await c3LogOf(request, owner, f.res.id)).length).toBe(logStart.length);

        // ── máy quầy + step-up → xem được số đầy đủ, không cache, đúng 1 dòng "view" ──
        await stepUp(request, desk);
        const ok = await call<{ id: string; docNumber: string; address?: string }>(
          request,
          'GET',
          sensitivePath,
          dev(desk),
        );
        expect(ok.status, JSON.stringify(ok.body).slice(0, 200)).toBe(200);
        expect(ok.body.id).toBe(f.docId);
        expect(ok.body.docNumber === f.docNumber, 'docNumber đầy đủ đúng số đã nhập').toBe(true);
        expect(ok.body.address === f.address, 'địa chỉ (D07) đúng').toBe(true);
        expect(ok.headers['cache-control'] ?? '').toContain('no-store');
        const afterView = await c3LogOf(request, owner, f.res.id);
        const views = afterView.filter(
          (e) => e.action === 'view' && e.subjectType === 'guest_document',
        );
        expect(afterView.length - logStart.length).toBe(1);
        expect(views).toHaveLength(1);
        expect(views[0]!.actorType).toBe('user');
        expect(views[0]!.userName).toBe(fd.me.displayName);
        expect(views[0]!.reservationCode).toBe(f.res.code);
        expect(views[0]!.reasonCode).toBe('registration');
        expect(views[0]!.trustedDeviceName ?? '', 'ghi tên thiết bị được cấp').not.toBe('');
        // nhật ký C3 không chứa số đầy đủ (chỉ "loại ••4 số cuối")
        expect(JSON.stringify(afterView)).not.toContain(f.docNumber);

        // ảnh giấy tờ trên máy quầy (trong cửa sổ step-up): 200 ảnh, no-store, thêm 1 dòng "view" document_image
        const img = await call(request, 'GET', imagePath, dev(desk));
        expect(img.status).toBe(200);
        expect(img.headers['content-type'] ?? '').toMatch(/^image\//);
        expect(img.headers['cache-control'] ?? '').toContain('no-store');
        const afterImg = await c3LogOf(request, owner, f.res.id);
        expect(afterImg.length - afterView.length).toBe(1);
        expect(
          afterImg.filter((e) => e.subjectType === 'document_image' && e.action === 'view'),
        ).toHaveLength(1);
        // BUG-R2-048 (kiểm lại vòng sửa 2): bộ lọc ngày theo hợp đồng `from`/`to` (OpenAPI DateFrom/DateTo).
        // Khoảng ngày cũ (2000) → 0 dòng; khoảng chứa ngày ghi → có các dòng vừa tạo.
        const logPath = p3(EP3.listC3AccessLog, owner);
        const old = await call<{ data: C3LogEntry[] }>(request, 'GET', logPath, {
          session: owner,
          query: { from: '2000-01-01', to: '2000-01-02', limit: 100 },
        });
        expect(old.status, JSON.stringify(old.body).slice(0, 300)).toBe(200);
        expect(old.body.data, 'from/to năm 2000 → không có dòng').toHaveLength(0);
        const day = await stackToday(request, '00:00'); // ngày lịch hôm nay (giờ cơ sở)
        const shift = (n: number) =>
          new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
        const win = await call<{ data: C3LogEntry[] }>(request, 'GET', logPath, {
          session: owner,
          query: { from: shift(-1), to: shift(1), reservationId: f.res.id, limit: 100 },
        });
        expect(win.status).toBe(200);
        expect(win.body.data.length, 'from/to = hôm nay → có dòng của ca').toBeGreaterThanOrEqual(
          2,
        );
        const bad = await call(request, 'GET', logPath, {
          session: owner,
          query: { from: '17/10/2026' },
        });
        expect(bad.status, 'from sai định dạng → 422').toBe(422);
        test.info().annotations.push({
          type: 'note',
          description:
            'Mã cửa (getDoorCredential, setDoorCredential) – US-128 dời R3 (R-C, SEC D2): kiểm 404 route chưa đăng ký; phần "xem mã cửa trên máy quầy" chờ R3. Phần giao diện PWA (không có nút C3) thuộc lớp E.',
        });
      },
    );
  },
);
