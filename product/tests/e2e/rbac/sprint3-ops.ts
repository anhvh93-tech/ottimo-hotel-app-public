// Sprint 3 operations for the RBAC runner (plan R2 mục 4 Sprint 3: EP03–EP05 nhận phòng/lưu trú/trả phòng,
// EP15 tiền/VietQR/hoàn, EP06 giấy tờ C3/khai báo, US-106/107 check-in online). Same rule as sprint1/2-ops.ts:
// only the ROLE GATE is observed, nothing durable is written:
//   read     – GET with valid parameters; item reads use a random id → an allowed role gets 404 (gate passed)
//   valid    – write with Idempotency-Key (+ If-Match "0" where required) on a random id → allowed role 404/412/422
//   invalid  – write without Idempotency-Key, deliberately invalid body → allowed role 422/404
//   guest    – guest-session operation (x-roles [guest]): the runner uses a REAL level-1 guest session (fixture
//              booking far in the future + issueGuestLink + openGuestSession) for "guest-session → 2xx"; staff
//              cookies are sent from the guest-web Origin so the answer is the session check (401), not Origin
//   absent   – not registered in R2 BY DESIGN → every subject gets 404: ĐK-1 (SEC s1-decisions, EP06 8.1 – level 2
//              guest operations) and the door code (US-128 dời R3 theo R-C, SEC D2 – no door code in R2)
//   sse      – streamEvents: read only the status line (the stream stays open)
// Trusted-device operations (x-requires-trusted-device) are sent with the DS-E desk device cookie, so a refused role
// still answers 403 FORBIDDEN_ACTION (role gate) and an allowed one reaches the handler. C3 reads behind step-up
// answer 401 REAUTH_REQUIRED for an allowed role without a step-up window (gate passed – accepted).
import type { APIRequestContext } from '@playwright/test';
import { call, propertyIdOf, session, uuid, type StaffSession } from '../support/api.js';
import { addDays } from '../support/s2.js';
import { guestLink, openGuest } from '../support/s3.js';

export type Mode3 = 'read' | 'valid' | 'invalid' | 'guest' | 'absent' | 'sse';

export interface Prepared3 {
  params: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  idempotencyKey?: boolean;
  ifMatch?: string;
  /** statuses that still prove "gate passed" for an allowed subject (beyond 2xx) */
  accept?: number[];
  note?: string;
}

export interface Fixtures3 {
  propertyId: string;
  arrival: string;
  /** a confirmed far-future booking (qa.owner) used only for the guest session */
  guestReservationId: string | null;
  /** level-1 guest cookie of that booking (null when guest-portal is not on the build) */
  guestCookie: string | null;
  /** why there is no guest cookie */
  why: string;
}

let fx: Promise<Fixtures3> | null = null;

/** Per worker: property + one guest session on a throwaway booking (cancelled in the runner's afterAll). */
export function fixtures3(ctx: APIRequestContext): Promise<Fixtures3> {
  fx ??= (async () => {
    const owner = await session(ctx, 'qa.owner');
    const propertyId = propertyIdOf(owner);
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 330 + Math.floor(Math.random() * 30));
    const arrival = d.toISOString().slice(0, 10);
    let guestReservationId: string | null = null;
    let guestCookie: string | null = null;
    let why = '';
    try {
      guestReservationId = await guestBooking(ctx, owner, arrival);
      if (!guestReservationId) why = 'không tạo được đơn fixture';
      if (guestReservationId) {
        const link = await guestLink(ctx, owner, guestReservationId);
        // guest-open 10/phút/IP: several workers open at once → openGuest resets + retries; one more try here
        for (let i = 0; i < 3 && !guestCookie; i++) {
          const g = await openGuest(ctx, link.token);
          if (g.status === 200 && g.cookie) guestCookie = g.cookie;
          else why = `openGuestSession ${g.status} ${g.body?.code ?? ''}`;
        }
      }
    } catch (e) {
      why = e instanceof Error ? e.message.split('\n')[0]! : String(e);
    }
    return { propertyId, arrival, guestReservationId, guestCookie, why };
  })();
  return fx;
}

/** Internal-channel booking (no deposit, no payment) on the first free room – cancelled by cleanupFixtures3. */
async function guestBooking(
  ctx: APIRequestContext,
  owner: StaffSession,
  arrival: string,
): Promise<string | null> {
  const pid = propertyIdOf(owner);
  const ch = await call<{ data?: Array<{ id: string; code: string; channelGroup: string }> }>(
    ctx,
    'GET',
    `/v1/properties/${pid}/channels`,
    { session: owner },
  );
  const rooms = await call<{ data?: Array<{ id: string; roomNo: string }> }>(
    ctx,
    'GET',
    `/v1/properties/${pid}/rooms`,
    { session: owner },
  );
  const direct = (ch.body.data ?? []).find((x) => x.code === 'direct');
  const guest = await call<{ id: string }>(ctx, 'POST', `/v1/properties/${pid}/guests`, {
    session: owner,
    idempotencyKey: true,
    body: {
      fullName: 'Khach Rbac Ba',
      phone: `0939${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`,
    },
  });
  if (!direct || guest.status !== 201) return null;
  for (const rm of rooms.body.data ?? []) {
    const body: Record<string, unknown> = {
      roomId: rm.id,
      channelId: direct.id,
      directSource: 'zalo_phone',
      arrivalDate: arrival,
      departureDate: addDays(arrival, 2), // 2 đêm: ngày đến T6/T7/ngày đặc biệt cần ở tối thiểu 2 (BR-113)
      adults: 1,
      bookerGuestId: guest.body.id,
      paymentModel: 'direct',
    };
    let r = await call<{ id: string; depositRequiredVnd?: number; code?: string }>(
      ctx,
      'POST',
      `/v1/properties/${pid}/reservations`,
      { session: owner, idempotencyKey: true, body },
    );
    if (r.status === 422 && r.body.code === 'DEPOSIT_INSUFFICIENT') {
      r = await call(ctx, 'POST', `/v1/properties/${pid}/reservations`, {
        session: owner,
        idempotencyKey: true,
        body: {
          ...body,
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: r.body.depositRequiredVnd },
        },
      });
    }
    if (r.status === 201) return r.body.id;
  }
  return null;
}

/** Cancel the fixture booking (best effort). */
export async function cleanupFixtures3(ctx: APIRequestContext): Promise<void> {
  if (!fx) return;
  const f = await fx.catch(() => null);
  if (!f?.guestReservationId) return;
  try {
    const owner = await session(ctx, 'qa.owner');
    const cur = await call<{ version: number }>(
      ctx,
      'GET',
      `/v1/properties/${f.propertyId}/reservations/${f.guestReservationId}`,
      { session: owner },
    );
    await call(
      ctx,
      'POST',
      `/v1/properties/${f.propertyId}/reservations/${f.guestReservationId}/actions/cancel`,
      {
        session: owner,
        idempotencyKey: true,
        ifMatch: `"${cur.body.version}"`,
        body: { reasonCode: 'other', note: 'E2E dọn dữ liệu RBAC S3' },
      },
    );
  } catch {
    /* best effort */
  }
}

export interface OpDef3 {
  mode: Mode3;
  /** x-requires-trusted-device: send the desk device cookie */
  device?: boolean;
  prepare: (f: Fixtures3) => Prepared3;
}

const P = (f: Fixtures3, extra: Record<string, string> = {}) => ({
  propertyId: f.propertyId,
  ...extra,
});
const NF = [404];
const read = (q?: Prepared3['query']): OpDef3 => ({
  mode: 'read',
  prepare: (f) => ({ params: P(f), ...(q ? { query: q } : {}) }),
});
const byId = (keys: string[], o: Partial<Prepared3> = {}, device = false): OpDef3 => ({
  mode: 'read',
  device,
  prepare: (f) => ({
    params: P(f, Object.fromEntries(keys.map((k) => [k, uuid()]))),
    accept: NF,
    note: `${keys.join(', ')} ngẫu nhiên → vai được phép nhận 404`,
    ...o,
  }),
});
const write = (
  keys: string[],
  body: (f: Fixtures3) => unknown,
  o: { ifMatch?: boolean; accept?: number[]; device?: boolean; idempotency?: boolean } = {},
): OpDef3 => ({
  mode: 'valid',
  ...(o.device ? { device: true } : {}),
  prepare: (f) => ({
    params: P(f, Object.fromEntries(keys.map((k) => [k, uuid()]))),
    ...(o.idempotency === false ? {} : { idempotencyKey: true }),
    ...(o.ifMatch ? { ifMatch: '"0"' } : {}),
    body: body(f),
    accept: o.accept ?? [404, 412],
    note: `${keys.join(', ')} ngẫu nhiên → 404`,
  }),
});
const guest = (
  method: 'read' | 'write',
  body?: unknown,
  accept: number[] = [],
  o: { idempotencyKey?: boolean } = {},
): OpDef3 => ({
  mode: 'guest',
  prepare: () => ({
    params: {},
    ...(body !== undefined ? { body } : {}),
    ...(o.idempotencyKey ? { idempotencyKey: true } : {}),
    accept,
    note: method === 'write' ? 'phiên khách thật, Origin guest-web' : 'phiên khách thật',
  }),
});
const absent = (keys: string[] = [], why = 'ĐK-1'): OpDef3 => ({
  mode: 'absent',
  prepare: (f) => ({
    params: P(
      f,
      Object.fromEntries(
        keys.map((k) => [k, k === 'purpose' ? 'P02B_ID_IMAGE_RETENTION' : uuid()]),
      ),
    ),
    body: {},
    note: why,
  }),
});
const R = ['reservationId'];

export const SPRINT3_OPS: Record<string, OpDef3> = {
  // ── nhận phòng / lưu trú / trả phòng (BE-A, EP03–EP05) ──
  previewCheckIn: byId(R),
  checkIn: write(R, () => ({ cardsIssued: 1, houseRulesSent: true }), {
    ifMatch: true,
    device: true,
  }),
  undoCheckIn: write(R, () => ({ reason: 'E2E RBAC' }), { ifMatch: true }),
  getExtensionOptions: byId(R),
  extendStay: write(R, () => ({ nights: 1 }), { ifMatch: true }),
  setLateCheckout: write(R, () => ({ checkoutTime: '15:00' }), { ifMatch: true }),
  listCheckoutReminders: byId(R),
  recordCheckoutConfirmation: write(R, () => ({ channel: 'phone', replyType: 'on_time' })),
  getCheckoutSummary: byId(R),
  earlyDeparture: write(
    R,
    (f) => ({ newDepartureDate: f.arrival, noticeGivenAt: new Date().toISOString() }),
    { ifMatch: true },
  ),
  checkOut: write(R, () => ({ checkoutTime: '12:00' }), { ifMatch: true }),
  removePartyMember: write(['reservationId', 'memberId'], () => undefined, { ifMatch: true }),
  resolveOverbookingExternal: write(['incidentId'], () => ({ costVnd: 0, note: 'E2E RBAC' }), {
    accept: [404, 412, 422],
  }),
  streamEvents: { mode: 'sse', prepare: (f) => ({ params: P(f) }) },

  // ── folio, thu tiền, VietQR, hoàn, minibar (BE-B, EP15) ──
  getFolio: byId(['folioId']),
  addFolioLine: write(['folioId'], () => ({ chargeCode: 'smoking_fee', quantity: 1 }), {
    accept: [404, 422],
  }),
  adjustFolioLine: write(['folioId', 'lineId'], () => ({ newQuantity: 1, reason: 'E2E RBAC' }), {
    ifMatch: true,
  }),
  requestFoc: write(['folioId', 'lineId'], () => ({
    kind: 'foc',
    amountVnd: 1000,
    reasonCode: 'other',
    note: 'E2E RBAC',
  })),
  getChargeCatalog: read(),
  getBill: byId(['folioId']),
  setInvoiceRequest: write(['folioId'], () => ({ buyerType: 'individual' }), {
    idempotency: false,
    accept: [404, 422],
  }),
  recordPayment: write(
    ['folioId'],
    () => ({ type: 'deposit', method: 'cash', amountVnd: 100000 }),
    {
      accept: [404, 422],
    },
  ),
  listPayments: read({ limit: 5 }),
  confirmPaymentReceived: write(['paymentId'], () => ({})),
  reconcilePayment: write(['paymentId'], () => ({ result: 'reconciled' }), { ifMatch: true }),
  confirmCashHandover: write(['paymentId'], () => ({ result: 'received' }), { ifMatch: true }),
  reversePayment: write(['paymentId'], () => ({ reason: 'E2E RBAC' })),
  createVietQr: write(['folioId'], () => ({ amountVnd: 100000 }), { accept: [404, 409, 422] }),
  createRefundRequest: write(['folioId'], () => ({ amountVnd: 1000, reason: 'E2E RBAC' }), {
    accept: [404, 409, 422],
  }),
  setRefundDestination: write(['approvalId'], () => ({ method: 'cash' }), {
    device: true,
    accept: [404, 409, 422],
  }),
  getRefundDestination: byId(['approvalId'], { accept: [401, 404] }, true),
  executeCashRefund: write(
    ['approvalId'],
    (f) => ({
      amountVnd: 1000,
      paidAt: `${f.arrival}T10:00:00+07:00`,
      attachmentId: uuid(),
    }),
    { accept: [404, 409, 422] },
  ),
  executeRefund: write(
    ['approvalId'],
    (f) => ({
      amountVnd: 1000,
      paidAt: `${f.arrival}T10:00:00+07:00`,
      bankReference: 'E2E',
    }),
    { accept: [404, 409, 422] },
  ),
  recordMinibarCheck: write(R, () => ({ mode: 'checkout', lines: [] }), { accept: [404, 422] }),
  getMinibarStandard: byId(R),

  // ── tệp đính kèm, giấy tờ C3, khai báo (BE-C, EP06) ──
  uploadAttachment: write([], () => ({ purpose: 'inspection' }), {
    accept: [400, 404, 415, 422],
  }),
  getAttachment: byId(['attachmentId']),
  listRegistrations: read({ view: 'action_needed', limit: 5 }),
  getRegistration: byId(['registrationId']),
  addGuestDocument: write(['registrationId'], () => ({}), {
    device: true,
    accept: [400, 404, 415, 422],
  }),
  updateGuestDocument: write(
    ['registrationId', 'documentId'],
    () => ({ docType: 'cccd', fullNameOnDoc: 'E2E RBAC', docNumber: '079000000000' }),
    { ifMatch: true, device: true, idempotency: false, accept: [404, 412, 422] },
  ),
  getGuestDocumentSensitive: byId(
    ['registrationId', 'documentId'],
    { query: { reason: 'recheck' }, accept: [401, 404] },
    true,
  ),
  getDocumentImage: byId(
    ['registrationId', 'documentId', 'imageId'],
    { query: { reason: 'recheck' }, accept: [401, 404] },
    true,
  ),
  purgeRegistrationImages: {
    mode: 'valid',
    device: true,
    prepare: (f) => ({
      params: P(f, { registrationId: uuid() }),
      idempotencyKey: true,
      ifMatch: '"0"',
      query: { reason: 'guest_request' },
      accept: [404, 412],
      note: 'registrationId ngẫu nhiên → 404',
    }),
  },
  recordImageConsent: write(['registrationId'], () => ({
    partyMemberId: uuid(),
    purpose: 'P02B_ID_IMAGE_RETENTION',
    decision: 'refused',
    noticeVersion: 'privacy-2026-10-v1',
    retentionDays: 30,
    locale: 'vi',
    channel: 'desk',
  })),
  completeRegistrationReview: write(['registrationId'], () => ({}), { ifMatch: true }),
  recordDocumentCheck: {
    mode: 'valid',
    device: true,
    prepare: (f) => ({
      params: P(f, { registrationId: uuid(), documentId: uuid(), checkCode: 'name_match' }),
      ifMatch: '"0"',
      body: { manualResult: 'pass', note: 'E2E RBAC' },
      accept: [404, 412, 422],
      note: 'registrationId ngẫu nhiên → 404',
    }),
  },
  getPortalData: byId(['registrationId'], { accept: [401, 404] }, true),
  transitionRegistration: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { registrationId: uuid(), transition: 'mark-sent' }),
      idempotencyKey: true,
      ifMatch: '"0"',
      body: { portalReference: 'E2E-RBAC' },
      accept: [404, 412],
      note: 'registrationId ngẫu nhiên → 404',
    }),
  },

  // ── link khách (staff) + phiên khách mức 1 (BE-C guest-portal, US-106/107) ──
  issueGuestLink: write(R, () => undefined, { accept: [404] }),
  revokeGuestLink: byId(R, { accept: [204, 404] }),
  getGuestStay: guest('read'),
  setGuestLocale: guest('write', { locale: 'vi' }),
  getOnlineCheckin: guest('read'),
  updateOnlineCheckin: guest('write', { etaTime: '16:00' }, [409]),
  uploadGuestDocument: guest('write', { personIndex: 1, docType: 'cccd' }, [400, 415, 422], {
    idempotencyKey: true,
  }),
  recordGuestConsent: guest(
    'write',
    {
      personIndex: 1,
      purpose: 'P02B_ID_IMAGE_RETENTION',
      decision: 'refused',
      noticeVersion: 'privacy-2026-10-v1',
      retentionDays: 30,
      locale: 'vi',
      channel: 'guest_app',
    },
    [409, 422],
  ),
  completeOnlineCheckin: guest('write', {}, [409], { idempotencyKey: true }),

  // ── Sprint 2 bỏ sót trong runner S2 (đã có trên build): lead mới, chuyển trạng thái khối OOO ──
  createLead: write([], () => ({ guestId: uuid() }), { accept: [404, 422] }),
  transitionRoomBlock: {
    mode: 'valid',
    prepare: (f) => ({
      params: P(f, { roomBlockId: uuid(), action: 'cancel' }),
      idempotencyKey: true,
      body: { reason: 'E2E RBAC' },
      accept: [404, 412],
      note: 'roomBlockId ngẫu nhiên → 404',
    }),
  },

  // ── không đăng ký ở R2 theo quyết định (404 cho mọi chủ thể) ──
  sendGuestOtp: absent([], 'ĐK-1: mức 2 (OTP) dời R3 – US-141'),
  verifyGuestSession: absent([], 'ĐK-1: mức 2 dời R3 – US-141'),
  getGuestFolio: absent([], 'ĐK-1: hóa đơn cho khách dời R3'),
  withdrawGuestConsent: absent(['purpose'], 'ĐK-1: rút đồng ý qua lễ tân ở R2'),
  issueGuestVerificationCode: absent(R, 'ĐK-1: mã xác minh lễ tân dời R3'),
  getDoorCredential: absent(R, 'US-128 mã cửa dời R3 (R-C), SEC D2'),
  setDoorCredential: absent(R, 'US-128 mã cửa dời R3 (R-C), SEC D2'),
};
