// Sprint 3 helpers (EP03–EP05 nhận phòng/lưu trú/trả phòng, EP15 tiền, EP06 giấy tờ C3/khai báo, US-106/107
// check-in online). Contract: docs/api/openapi.yaml 0.3.6-draft. Oracle: fixtures/br-examples.json (oracle()).
//
// Two kinds of Sprint 3 cases:
//   - project "api" (parallel, real clock): nothing is checked in – registration/documents/consent on a far-future
//     booking, payments/VietQR/refund requests on a confirmed booking, guest link + online check-in;
//   - project "clock" (serial, MutableClock): every case that checks in / checks out. Each case runs on its OWN
//     virtual business day (virtualDay(): far beyond today + 365, never reused – .auth/virtual-day.json), so the
//     10 DS-E rooms are free and "hôm nay" is exact. Room status (SM-03 room_status) is NOT per day: a checked-out
//     room stays VD until housekeeping cleans it (transitionRoomStatus – Sprint 4, not on the build). cleanRooms()
//     emulates "buồng phòng đã dọn" on a DISPOSABLE stack only (E2E_COMPOSE_CONTROL=1, psql DELETE FROM
//     room_status → derived VC); without it the cases that need a ready room for qa.fd skip.
//
// C3 operations need the trusted-device cookie (x-requires-trusted-device): the DS-E seed writes the device tokens
// to tests/fixtures/seed/.out/ds-e.map.json (E2E_SEED_OUT overrides; gitignored, never printed).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  etag,
  propertyIdOf,
  resetRateLimits,
  session,
  uuid,
  versionTag,
  type ApiResult,
  type CallOptions,
  type StaffSession,
} from './api.js';
import {
  API_URL,
  AUTH_DIR,
  COOKIE_PREFIX,
  GUEST_COOKIE,
  GUEST_ORIGIN,
  PRODUCT_DIR,
  SEED_PASSWORD,
  SESSION_COOKIE,
} from './env.js';
import {
  addDays,
  channel,
  createReservation,
  getReservation,
  isSpecialDate,
  nightsOf,
  reservationBody,
  track,
  weekday,
  type ChannelKind,
  type ProblemFields,
  type Reservation,
  type Room,
  type S2Context,
} from './s2.js';

// ───────────────────────── endpoints (method, path, operationId) ─────────────────────────

type Ep = [method: string, path: string, operationId: string];
const R = '/v1/properties/{propertyId}';
const RS = `${R}/reservations/{reservationId}`;
const RG = `${R}/registrations/{registrationId}`;
export const EP3 = {
  previewCheckIn: ['GET', `${RS}/check-in-preview`, 'previewCheckIn'],
  checkIn: ['POST', `${RS}/actions/check-in`, 'checkIn'],
  undoCheckIn: ['POST', `${RS}/actions/undo-check-in`, 'undoCheckIn'],
  getExtensionOptions: ['GET', `${RS}/extension-options`, 'getExtensionOptions'],
  extendStay: ['POST', `${RS}/actions/extend`, 'extendStay'],
  setLateCheckout: ['POST', `${RS}/actions/late-checkout`, 'setLateCheckout'],
  changeRoom: ['POST', `${RS}/actions/change-room`, 'changeRoom'],
  listCheckoutReminders: ['GET', `${RS}/checkout-confirmations`, 'listCheckoutReminders'],
  recordCheckoutConfirmation: [
    'POST',
    `${RS}/checkout-confirmations`,
    'recordCheckoutConfirmation',
  ],
  getCheckoutSummary: ['GET', `${RS}/checkout-summary`, 'getCheckoutSummary'],
  earlyDeparture: ['POST', `${RS}/actions/early-departure`, 'earlyDeparture'],
  checkOut: ['POST', `${RS}/actions/check-out`, 'checkOut'],
  listParty: ['GET', `${RS}/party`, 'listParty'],
  addPartyMember: ['POST', `${RS}/party`, 'addPartyMember'],
  removePartyMember: ['DELETE', `${RS}/party/{memberId}`, 'removePartyMember'],
  issueGuestLink: ['POST', `${RS}/guest-link`, 'issueGuestLink'],
  revokeGuestLink: ['DELETE', `${RS}/guest-link`, 'revokeGuestLink'],
  issueGuestVerificationCode: [
    'POST',
    `${RS}/guest-verification-code`,
    'issueGuestVerificationCode',
  ],
  getDoorCredential: ['GET', `${RS}/door-credential`, 'getDoorCredential'],
  setDoorCredential: ['PUT', `${RS}/door-credential`, 'setDoorCredential'],
  recordMinibarCheck: ['POST', `${RS}/minibar-checks`, 'recordMinibarCheck'],
  getMinibarStandard: ['GET', `${RS}/minibar-standard`, 'getMinibarStandard'],
  getFolio: ['GET', `${R}/folios/{folioId}`, 'getFolio'],
  addFolioLine: ['POST', `${R}/folios/{folioId}/lines`, 'addFolioLine'],
  adjustFolioLine: ['POST', `${R}/folios/{folioId}/lines/{lineId}/adjustments`, 'adjustFolioLine'],
  requestFoc: ['POST', `${R}/folios/{folioId}/lines/{lineId}/foc`, 'requestFoc'],
  recordPayment: ['POST', `${R}/folios/{folioId}/payments`, 'recordPayment'],
  createVietQr: ['POST', `${R}/folios/{folioId}/vietqr`, 'createVietQr'],
  createRefundRequest: ['POST', `${R}/folios/{folioId}/refund-requests`, 'createRefundRequest'],
  setInvoiceRequest: ['PUT', `${R}/folios/{folioId}/invoice-request`, 'setInvoiceRequest'],
  getBill: ['GET', `${R}/folios/{folioId}/bill`, 'getBill'],
  getChargeCatalog: ['GET', `${R}/charge-catalog`, 'getChargeCatalog'],
  listPayments: ['GET', `${R}/payments`, 'listPayments'],
  confirmPaymentReceived: [
    'POST',
    `${R}/payments/{paymentId}/actions/confirm-received`,
    'confirmPaymentReceived',
  ],
  reconcilePayment: ['POST', `${R}/payments/{paymentId}/actions/reconcile`, 'reconcilePayment'],
  confirmCashHandover: [
    'POST',
    `${R}/payments/{paymentId}/actions/confirm-cash-handover`,
    'confirmCashHandover',
  ],
  reversePayment: ['POST', `${R}/payments/{paymentId}/actions/reverse`, 'reversePayment'],
  listApprovalRequests: ['GET', `${R}/approval-requests`, 'listApprovalRequests'],
  approveRequest: ['POST', `${R}/approval-requests/{approvalId}/actions/approve`, 'approveRequest'],
  rejectRequest: ['POST', `${R}/approval-requests/{approvalId}/actions/reject`, 'rejectRequest'],
  setRefundDestination: [
    'PUT',
    `${R}/approval-requests/{approvalId}/refund-destination`,
    'setRefundDestination',
  ],
  getRefundDestination: [
    'GET',
    `${R}/approval-requests/{approvalId}/refund-destination`,
    'getRefundDestination',
  ],
  executeCashRefund: [
    'POST',
    `${R}/approval-requests/{approvalId}/actions/execute-cash-refund`,
    'executeCashRefund',
  ],
  executeRefund: [
    'POST',
    `${R}/approval-requests/{approvalId}/actions/execute-refund`,
    'executeRefund',
  ],
  listItems: ['GET', `${R}/items`, 'listItems'],
  createItem: ['POST', `${R}/items`, 'createItem'],
  updateItem: ['PATCH', `${R}/items/{itemId}`, 'updateItem'],
  stepUp: ['POST', '/v1/me/step-up', 'stepUp'],
  uploadAttachment: ['POST', `${R}/attachments`, 'uploadAttachment'],
  getAttachment: ['GET', `${R}/attachments/{attachmentId}`, 'getAttachment'],
  listRegistrations: ['GET', `${R}/registrations`, 'listRegistrations'],
  getRegistration: ['GET', RG, 'getRegistration'],
  addGuestDocument: ['POST', `${RG}/documents`, 'addGuestDocument'],
  updateGuestDocument: ['PATCH', `${RG}/documents/{documentId}`, 'updateGuestDocument'],
  getGuestDocumentSensitive: [
    'GET',
    `${RG}/documents/{documentId}/sensitive`,
    'getGuestDocumentSensitive',
  ],
  getDocumentImage: ['GET', `${RG}/documents/{documentId}/images/{imageId}`, 'getDocumentImage'],
  purgeRegistrationImages: ['DELETE', `${RG}/images`, 'purgeRegistrationImages'],
  recordImageConsent: ['POST', `${RG}/consents`, 'recordImageConsent'],
  completeRegistrationReview: [
    'POST',
    `${RG}/actions/complete-review`,
    'completeRegistrationReview',
  ],
  recordDocumentCheck: [
    'PUT',
    `${RG}/documents/{documentId}/checks/{checkCode}`,
    'recordDocumentCheck',
  ],
  getPortalData: ['GET', `${RG}/portal-data`, 'getPortalData'],
  transitionRegistration: ['POST', `${RG}/actions/{transition}`, 'transitionRegistration'],
  listC3AccessLog: ['GET', `${R}/c3-access-log`, 'listC3AccessLog'],
  listAttentionItems: ['GET', `${R}/attention`, 'listAttentionItems'],
  getArrivalsDepartures: ['GET', `${R}/arrivals-departures`, 'getArrivalsDepartures'],
  listHkTasks: ['GET', `${R}/hk-tasks`, 'listHkTasks'],
  listRoomStatuses: ['GET', `${R}/room-statuses`, 'listRoomStatuses'],
  setParameter: ['PUT', `${R}/parameters/{key}`, 'setParameter'],
  listMyNotifications: ['GET', '/v1/me/notifications', 'listMyNotifications'],
  openGuestSession: ['POST', '/v1/guest/sessions', 'openGuestSession'],
  getGuestStay: ['GET', '/v1/guest/stay', 'getGuestStay'],
  setGuestLocale: ['PUT', '/v1/guest/locale', 'setGuestLocale'],
  getOnlineCheckin: ['GET', '/v1/guest/online-checkin', 'getOnlineCheckin'],
  updateOnlineCheckin: ['PUT', '/v1/guest/online-checkin', 'updateOnlineCheckin'],
  uploadGuestDocument: ['POST', '/v1/guest/online-checkin/documents', 'uploadGuestDocument'],
  recordGuestConsent: ['POST', '/v1/guest/consents', 'recordGuestConsent'],
  completeOnlineCheckin: ['POST', '/v1/guest/online-checkin/complete', 'completeOnlineCheckin'],
  getGuestFolio: ['GET', '/v1/guest/folio', 'getGuestFolio'],
  sendGuestOtp: ['POST', '/v1/guest/sessions/otp', 'sendGuestOtp'],
  verifyGuestSession: ['POST', '/v1/guest/sessions/verify', 'verifyGuestSession'],
  withdrawGuestConsent: ['POST', '/v1/guest/consents/{purpose}/withdraw', 'withdrawGuestConsent'],
} satisfies Record<string, Ep>;

/** Concrete path of an EP3 entry for the DS-E property. */
export function p3(ep: Ep, s: StaffSession, params: Record<string, string> = {}): string {
  return ep[1].replace(/\{(\w+)\}/g, (_, k: string) => {
    if (k === 'propertyId') return propertyIdOf(s);
    const v = params[k];
    if (v === undefined) throw new Error(`${ep[2]}: thiếu {${k}}`);
    return encodeURIComponent(v);
  });
}

// ───────────────────────── trusted device (C3) ─────────────────────────

const DEVICE_MAP =
  process.env.E2E_SEED_OUT ?? `${PRODUCT_DIR}tests/fixtures/seed/.out/ds-e.map.json`;
export const DEVICE_COOKIE = `${COOKIE_PREFIX}ottimo_did`;

let deviceCache: Map<string, string> | null = null;
/** Token of a DS-E trusted device (label from ds-e.json devices). undefined when the seed output is absent. */
export function deviceToken(label = 'qa-desk-01'): string | undefined {
  if (!deviceCache) {
    deviceCache = new Map();
    try {
      const m = JSON.parse(readFileSync(DEVICE_MAP, 'utf8')) as {
        devices?: Array<{ label: string; token: string }>;
      };
      for (const d of m.devices ?? []) deviceCache.set(d.label, d.token);
    } catch {
      /* no seed output on this machine */
    }
  }
  return deviceCache.get(label);
}

export function needDevice(tc: string): void {
  test.skip(
    !deviceToken() && !virtualDevice,
    `${tc}: môi trường – thiếu token thiết bị được cấp (seed DS-E → ${DEVICE_MAP}, E2E_SEED_OUT)`,
  );
}

/** Device registered by useVirtualDevice() for the virtual days of project "clock" (seed devices expire). */
let virtualDevice: { token: string; expiresAt: number } | null = null;

/**
 * Project "clock": the seed devices are valid trusted_device_days (180) from the REAL date, so on a virtual day
 * (> today + 800) they are expired → DEVICE_NOT_TRUSTED. qa.owner registers a fresh desk device at the virtual
 * time (trustCurrentDevice, SR-DEV-02 – password re-auth, admin origin) whenever the current one would expire
 * within a day; dev() then sends that cookie. Call it right after setClock().
 */
export async function useVirtualDevice(ctx: APIRequestContext, nowIso: string): Promise<void> {
  const now = new Date(nowIso).getTime();
  if (virtualDevice && virtualDevice.expiresAt > now + 86_400_000) return;
  const owner = await session(ctx, 'qa.owner');
  const r = await call<{ expiresAt?: string }>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(owner)}/trusted-devices`,
    {
      session: owner,
      idempotencyKey: true,
      body: {
        name: `qa-e2e-desk-${uuid().slice(0, 8)}`,
        deviceKind: 'desk',
        currentPassword: SEED_PASSWORD,
        hardeningChecklistConfirmed: true,
      },
    },
  );
  expect(r.status, `trustCurrentDevice (thiết bị ảo): ${JSON.stringify(r.body)}`).toBe(201);
  let token = '';
  for (const c of r.setCookies) {
    const first = c.split(';')[0] ?? '';
    if (first.startsWith(`${DEVICE_COOKIE}=`))
      token = decodeURIComponent(first.slice(DEVICE_COOKIE.length + 1));
  }
  expect(token, 'trustCurrentDevice: không có cookie thiết bị').toBeTruthy();
  virtualDevice = {
    token,
    expiresAt: r.body.expiresAt ? new Date(r.body.expiresAt).getTime() : now + 30 * 86_400_000,
  };
}

/** The device token dev() sends now (virtual device on project clock, else the seed desk device). */
export function activeDeviceToken(label = 'qa-desk-01'): string | undefined {
  return virtualDevice?.token ?? deviceToken(label);
}

/** Call options: staff session + trusted-device cookie (CSRF/Origin still come from `session`). */
export function dev(s: StaffSession, label = 'qa-desk-01'): CallOptions {
  const t = virtualDevice?.token ?? deviceToken(label);
  return {
    session: s,
    cookie: `${SESSION_COOKIE}=${s.token}${t ? `; ${DEVICE_COOKIE}=${t}` : ''}`,
  };
}

/** POST /v1/me/step-up with the DS-E password (C3 reads: SR-C3 step-up window, c3_stepup_minutes). */
export async function stepUp(ctx: APIRequestContext, s: StaffSession): Promise<void> {
  const r = await call(ctx, 'POST', '/v1/me/step-up', {
    session: s,
    body: { password: SEED_PASSWORD },
  });
  expect(r.status, `stepUp ${s.username}: ${JSON.stringify(r.body)}`).toBe(200);
}

// ───────────────────────── multipart (documents, attachments, guest uploads) ─────────────────────────

/** 16×16 beige PNG (valid image – the api decodes and re-encodes it with sharp, metadata stripped). */
export const PNG_16X16 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR42mM4sWUaSYhhVMOohuGrAQD0lRIfjjkifQAAAABJRU5ErkJggg==',
  'base64',
);
/** @deprecated name kept for helpers written against the first draft */
export const PNG_8X8 = PNG_16X16;

export interface FilePart {
  name: string;
  mimeType: string;
  buffer: Buffer;
}
export const png = (name = 'giay-to.png'): FilePart => ({
  name,
  mimeType: 'image/png',
  buffer: PNG_16X16,
});

/**
 * multipart/form-data call: `fields` are text parts (objects are JSON-encoded – `data` of addGuestDocument),
 * `files` may repeat a field name (image, image…). Same CSRF/Origin/Idempotency rules as call().
 */
export async function callMultipart<T = unknown>(
  ctx: APIRequestContext,
  method: string,
  path: string,
  o: CallOptions & {
    fields?: Record<string, unknown>;
    files?: Array<[field: string, file: FilePart]>;
    origin?: string;
  },
): Promise<ApiResult<T>> {
  const form = new FormData();
  for (const [k, v] of Object.entries(o.fields ?? {})) {
    if (v === undefined) continue;
    form.append(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  for (const [k, f] of o.files ?? []) {
    form.append(k, new Blob([new Uint8Array(f.buffer)], { type: f.mimeType }), f.name);
  }
  const headers: Record<string, string> = { accept: 'application/json', ...(o.headers ?? {}) };
  const cookie = o.cookie ?? (o.session ? `${SESSION_COOKIE}=${o.session.token}` : undefined);
  if (cookie) headers.cookie = cookie;
  if (o.session && o.csrf !== false) {
    headers['x-csrf-token'] = o.session.me.csrfToken;
  }
  const origin =
    o.origin ?? (o.session ? (process.env.E2E_ORIGIN ?? 'http://localhost:8081') : undefined);
  if (origin) headers.origin = origin;
  if (o.idempotencyKey) {
    headers['idempotency-key'] = o.idempotencyKey === true ? uuid() : o.idempotencyKey;
  }
  if (o.ifMatch !== undefined) headers['if-match'] = o.ifMatch;
  const res = await ctx.fetch(`${o.base ?? API_URL}${path}`, {
    method,
    headers,
    multipart: form,
    failOnStatusCode: false,
    maxRedirects: 0,
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    /* keep text */
  }
  return {
    status: res.status(),
    body: body as T,
    headers: res.headers(),
    setCookies: res
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value),
    res,
  };
}

// ───────────────────────── registration / documents (EP06) ─────────────────────────

export interface DocCheck {
  code: string;
  result: string;
  blocking?: boolean;
  manualResult?: string | null;
  handledNote?: string;
}
export interface GuestDocument {
  id: string;
  partyMemberId?: string;
  docType: string;
  isMain: boolean;
  fullNameOnDoc?: string;
  nationalityCode?: string;
  docNumberLast4: string;
  imageIds?: string[];
  imageConsent?: string;
  checks: DocCheck[];
}
export interface Registration {
  id: string;
  reservationId: string;
  reservationCode: string;
  kind?: string;
  status: string;
  requiredCount: number;
  submittedCount: number;
  deadlineAt?: string;
  deadlineLabel: string;
  isOverdue?: boolean;
  portalReference?: string;
  documents: GuestDocument[];
  imagesPurgedAt?: string;
  imagesPurgeReason?: string;
  onlineCheckin?: Record<string, unknown> | null;
  allowedActions: Array<{ event: string; action: string }>;
  version: number;
  [k: string]: unknown;
}

/** Random-looking CCCD (12 digits, first 3 = province code) – fake data. */
export function fakeCccd(): string {
  return `079${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
}
/** Fake passport number (2 letters + 7 digits). */
export function fakePassport(): string {
  return `C${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(
    Math.floor(Math.random() * 1e7),
  ).padStart(7, '0')}`;
}

/** Fully filled Vietnamese CCCD (passes BR-605/613 checks). */
export function vnDoc(
  fullName: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    docType: 'cccd',
    isMain: true,
    fullNameOnDoc: fullName.toUpperCase(),
    docNumber: fakeCccd(),
    dateOfBirth: '1990-03-12',
    gender: 'female',
    nationalityCode: 'VNM',
    address: '12 Tran Hung Dao, Phuong 10, Da Lat, Lam Dong',
    captureMethod: 'manual',
    ...extra,
  };
}

/** Foreign passport with visa valid well after the stay (no blocking check). */
export function foreignDoc(
  fullName: string,
  departure: string,
  extra: Record<string, unknown> = {},
  /** business date of the stack (stackBusinessDate) – keeps entryDate in the past for far-future bookings */
  today?: string,
): Record<string, unknown> {
  return {
    docType: 'passport',
    isMain: true,
    fullNameOnDoc: fullName.toUpperCase(),
    docNumber: fakePassport(),
    dateOfBirth: '1988-04-02',
    gender: 'male',
    nationalityCode: 'DEU',
    passportIssueDate: '2020-01-15',
    passportExpiryDate: addDays(departure, 3000),
    visaKind: 'visa_exempt',
    visaValidUntil: addDays(departure, 30),
    // ngày nhập cảnh không được ở tương lai (ENTRY_DATE_FUTURE): ngày đi − 5, muộn nhất hôm qua của STACK khi biết
    entryDate:
      today && addDays(today, -1) < addDays(departure, -5)
        ? addDays(today, -1)
        : addDays(departure, -5),
    entryPort: 'Tan Son Nhat',
    entryPurpose: 'DL',
    captureMethod: 'manual',
    ...extra,
  };
}

export async function getRegistration(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
): Promise<ApiResult<Registration & ProblemFields>> {
  return call(ctx, 'GET', p3(EP3.getRegistration, s, { registrationId: regId }), { session: s });
}

/** addGuestDocument (multipart `data` + 0–4 `image`) from the trusted desk device. */
export async function addDocument(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  data: Record<string, unknown>,
  images = 0,
  opts: { device?: boolean; idempotencyKey?: string | boolean } = {},
): Promise<ApiResult<Registration & ProblemFields>> {
  const o = opts.device === false ? { session: s } : dev(s);
  return callMultipart(ctx, 'POST', p3(EP3.addGuestDocument, s, { registrationId: regId }), {
    ...o,
    idempotencyKey: opts.idempotencyKey ?? true,
    fields: { data },
    files: Array.from({ length: images }, (_, i) => ['image', png(`giay-to-${i + 1}.png`)]),
  });
}

/**
 * Registration id of a booking (SM-05 K1: created with the booking). OpenAPI 0.3.6 puts it on
 * Reservation.registrationId; the build does not return it yet (BUG-R2-031) → fall back to listRegistrations
 * (view=all, newest first) filtered on reservationId.
 */
export async function registrationOf(
  ctx: APIRequestContext,
  s: StaffSession,
  res: { id: string; registrationId?: unknown },
): Promise<string> {
  if (typeof res.registrationId === 'string') return res.registrationId;
  const r = await getReservation(ctx, s, res.id);
  const id = (r.body as { registrationId?: string }).registrationId;
  if (id) return id;
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const l = await call<{
      data: Array<{ id: string; reservationId: string }>;
      page: { nextCursor?: string | null };
    }>(ctx, 'GET', p3(EP3.listRegistrations, s), {
      session: s,
      query: { view: 'all', limit: 100, cursor },
    });
    expect(l.status, `listRegistrations: ${JSON.stringify(l.body).slice(0, 200)}`).toBe(200);
    const hit = l.body.data.find((x) => x.reservationId === res.id);
    if (hit) return hit.id;
    cursor = l.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  throw new Error(`không tìm thấy bản ghi khai báo của đơn ${res.id} (SM-05 K1)`);
}

/** transitionRegistration with If-Match = current version. */
export async function transitionReg(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  transition: string,
  body: Record<string, unknown> = {},
): Promise<ApiResult<Registration & ProblemFields>> {
  const cur = await getRegistration(ctx, s, regId);
  return call(
    ctx,
    'POST',
    p3(EP3.transitionRegistration, s, { registrationId: regId, transition }),
    { session: s, idempotencyKey: true, ifMatch: versionTag(cur.body.version), body },
  );
}

/** recordImageConsent (desk channel) for the main document. */
export async function deskConsent(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  decision: 'granted' | 'refused',
  partyMemberId?: string,
): Promise<ApiResult<Registration & ProblemFields>> {
  // recordImageConsent ở quầy bắt buộc partyMemberId (BE-C giả định 2: id người trong đơn HOẶC id giấy tờ) –
  // mặc định: giấy tờ người đứng tên của khai báo
  let who = partyMemberId;
  if (!who) {
    const reg = await getRegistration(ctx, s, regId);
    const main = reg.body.documents?.find((d) => d.isMain) ?? reg.body.documents?.[0];
    who = main?.partyMemberId ?? main?.id;
  }
  return call(ctx, 'POST', p3(EP3.recordImageConsent, s, { registrationId: regId }), {
    session: s,
    idempotencyKey: true,
    body: {
      ...(who ? { partyMemberId: who } : { personIndex: 1 }),
      purpose: 'P02B_ID_IMAGE_RETENTION',
      decision,
      noticeVersion: PRIVACY_NOTICE,
      retentionDays: IMAGE_RETENTION_DAYS,
      locale: 'vi',
      channel: 'desk',
    },
  });
}

/**
 * PortalData.fields[].value of a date (OpenAPI 0.3.6 addendum, ARC 17/10): `portal_date_format`, default dd/MM/yyyy
 * (DOM S3-5 – assumption pending ESC-018). Nationality is "Vietnamese country name (alpha-3)".
 */
export function portalDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** privacy_notice_version default (catalogue 0052 – DS-E does not override it). */
export const PRIVACY_NOTICE = 'privacy-2026-10-v1';

/**
 * DS-E `id_image_retention_days_after_checkout` (BR-610) = 30. OpenAPI 0.3.6 addendum (SEC ĐK-2, 17/10):
 * `ConsentInput.retentionDays` is REQUIRED for P02B (the number of days the person read) – a different value → 422.
 */
export const IMAGE_RETENTION_DAYS = 30;

/** completeRegistrationReview with If-Match (warningNotes for fail/unverified checks). */
export async function completeReview(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  warningNotes: Array<Record<string, unknown>> = [],
): Promise<ApiResult<Registration & ProblemFields>> {
  const cur = await getRegistration(ctx, s, regId);
  return call(ctx, 'POST', p3(EP3.completeRegistrationReview, s, { registrationId: regId }), {
    session: s,
    idempotencyKey: true,
    ifMatch: versionTag(cur.body.version),
    body: warningNotes.length ? { warningNotes } : {},
  });
}

// ───────────────────────── folio / payments (EP15) ─────────────────────────

export interface FolioLine {
  id: string;
  category: string;
  description: string;
  serviceDate?: string;
  quantity: number;
  unitPriceVnd: number;
  amountVnd: number;
  lineState: string;
  reversalOfId?: string;
  relatedLineId?: string;
  approvalRequestId?: string;
  revenueGroup?: string;
}
export interface Payment {
  id: string;
  code: string;
  type: string;
  method: string;
  amountVnd: number;
  status: string;
  reconciliation?: string;
  reconciledByName?: string;
  reconciledAt?: string;
  recordedByRole?: string;
  reversalOfId?: string;
  expiresAt?: string;
  folioId?: string;
  version?: number;
  [k: string]: unknown;
}
export interface Folio {
  id: string;
  status: string;
  billNo?: string | null;
  lines: FolioLine[];
  payments: Payment[];
  totals: {
    roomVnd: number;
    otherVnd?: number;
    focVnd?: number;
    totalVnd: number;
    paidVnd: number;
    paidViaOtaVnd?: number;
    balanceDueVnd: number;
    creditVnd?: number;
  };
  pendingApprovals?: number;
  invoiceRequest?: Record<string, unknown>;
  version: number;
}

export async function getFolio(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
): Promise<Folio> {
  const r = await call<Folio>(ctx, 'GET', p3(EP3.getFolio, s, { folioId }), { session: s });
  expect(r.status, `getFolio: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body;
}

/** Live (not reversed, not a reversal) posted lines of a category. */
export function liveLines(f: Folio, category?: string): FolioLine[] {
  const reversed = new Set(f.lines.filter((l) => l.reversalOfId).map((l) => l.reversalOfId));
  return f.lines.filter(
    (l) =>
      !l.reversalOfId &&
      !reversed.has(l.id) &&
      l.lineState === 'posted' &&
      (category === undefined || l.category === category),
  );
}

export async function recordPayment(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
  body: Record<string, unknown>,
): Promise<ApiResult<Payment & ProblemFields>> {
  return call(ctx, 'POST', p3(EP3.recordPayment, s, { folioId }), {
    session: s,
    idempotencyKey: true,
    body,
  });
}

/** Pay the whole balance due in cash (FD+): check-in condition balance_paid (BR-402). */
export async function payBalance(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
): Promise<Folio> {
  const f = await getFolio(ctx, s, folioId);
  if (f.totals.balanceDueVnd > 0) {
    const r = await recordPayment(ctx, s, folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: f.totals.balanceDueVnd,
    });
    expect(r.status, `recordPayment: ${JSON.stringify(r.body)}`).toBe(201);
  }
  return getFolio(ctx, s, folioId);
}

export async function addLine(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
  body: Record<string, unknown>,
): Promise<ApiResult<Folio & ProblemFields>> {
  return call(ctx, 'POST', p3(EP3.addFolioLine, s, { folioId }), {
    session: s,
    idempotencyKey: true,
    body,
  });
}

/** Approve an approval request with the approver's login password (R2 – no PIN). */
export async function approve(
  ctx: APIRequestContext,
  approver: StaffSession,
  approvalId: string,
  note = 'E2E duyệt',
): Promise<ApiResult<Record<string, unknown> & ProblemFields>> {
  return call(ctx, 'POST', p3(EP3.approveRequest, approver, { approvalId }), {
    session: approver,
    idempotencyKey: true,
    body: { authMethod: 'password', secret: SEED_PASSWORD, note },
  });
}

// ───────────────────────── guest portal (ADR-006) ─────────────────────────

/** issueGuestLink → { url, token } (token = last path segment of /g/{token}). */
export async function guestLink(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
): Promise<{ url: string; token: string; expiresAt: string; status: number }> {
  const r = await call<{ url: string; expiresAt: string }>(
    ctx,
    'POST',
    p3(EP3.issueGuestLink, s, { reservationId }),
    { session: s, idempotencyKey: true },
  );
  expect(r.status, `issueGuestLink: ${JSON.stringify(r.body)}`).toBe(201);
  const token = r.body.url.split('/g/')[1]?.split(/[?#]/)[0] ?? '';
  return { url: r.body.url, token, expiresAt: r.body.expiresAt, status: r.status };
}

export interface GuestSession {
  cookie: string;
  status: number;
  body: Record<string, unknown> & ProblemFields;
  setCookies: string[];
  headers: Record<string, string>;
}

/**
 * openGuestSession (guest-web Origin) → guest cookie ottimo_gsid. A 429 RATE_LIMITED caused by the harness's own
 * volume (guest-open: 10/min + 100/day per IP – every E2E call comes from one IP) is reset through
 * /__test__/rate-limits/reset (clears every in-memory window) and retried ONCE – like login(). Cases that assert
 * the limit itself pass `noRetry`.
 */
export async function openGuest(
  ctx: APIRequestContext,
  token: string,
  opts: { acceptLanguage?: string; base?: string; noRetry?: boolean } = {},
): Promise<GuestSession> {
  const once = async () => {
    const r = await call<Record<string, unknown> & ProblemFields>(
      ctx,
      'POST',
      '/v1/guest/sessions',
      {
        body: { token },
        headers: {
          origin: GUEST_ORIGIN,
          ...(opts.acceptLanguage ? { 'accept-language': opts.acceptLanguage } : {}),
        },
        ...(opts.base ? { base: opts.base } : {}),
      },
    );
    let cookie = '';
    for (const c of r.setCookies) {
      const first = c.split(';')[0] ?? '';
      if (first.startsWith(`${GUEST_COOKIE}=`)) cookie = first;
    }
    return { cookie, status: r.status, body: r.body, setCookies: r.setCookies, headers: r.headers };
  };
  const first = await once();
  if (first.status !== 429 || opts.noRetry) return first;
  if (!(await resetRateLimits(ctx, '429 khi mở phiên khách'))) return first;
  return once();
}

/** A call as the guest (cookie + guest-web Origin on writes). */
export async function guestCall<T = Record<string, unknown> & ProblemFields>(
  ctx: APIRequestContext,
  method: string,
  path: string,
  cookie: string,
  o: Omit<CallOptions, 'session' | 'cookie'> = {},
): Promise<ApiResult<T>> {
  const write = !['GET', 'HEAD'].includes(method.toUpperCase());
  return call<T>(ctx, method, path, {
    ...o,
    cookie,
    headers: { ...(write ? { origin: GUEST_ORIGIN } : {}), ...(o.headers ?? {}) },
  });
}

// ───────────────────────── bookings for Sprint 3 ─────────────────────────

export interface StayInput {
  room: Room;
  /** other rooms to try in order when `room` is taken (409) */
  alternatives?: Room[];
  arrival: string;
  nights?: number;
  kind?: ChannelKind;
  adults?: number;
  children6to11?: number;
  childrenUnder6?: number;
  guestId?: string;
  extra?: Record<string, unknown>;
  /** 'full' (default): balance paid in cash; 'deposit': only the BR-305 deposit; 'none' (OTA) */
  pay?: 'full' | 'deposit';
  /** main guest document: 'vn' (default), 'foreign', or false */
  doc?: 'vn' | 'foreign' | false;
}

export interface Stay {
  res: Reservation & { registrationId?: string; balanceDueVnd?: number };
  room: Room;
  regId: string;
  guestName: string;
}

/** Booker with a name (needed for name_match against the document) – fake data. */
export async function namedGuest(
  ctx: APIRequestContext,
  s: StaffSession,
  extra: Record<string, unknown> = {},
): Promise<{ id: string; fullName: string }> {
  const letters = 'abcdefghiklmnopqrstuvxy';
  const pick = (n: number) =>
    Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const fullName = `Nguyen Thi ${pick(1).toUpperCase()}${pick(5)}`;
  const r = await call<{ id: string }>(ctx, 'POST', `/v1/properties/${propertyIdOf(s)}/guests`, {
    session: s,
    idempotencyKey: true,
    body: {
      fullName,
      phone: `0939${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`,
      email: `e2e.s3.${uuid().slice(0, 8)}@example.test`,
      ...extra,
    },
  });
  expect(r.status, `createGuest: ${JSON.stringify(r.body)}`).toBe(201);
  return { id: r.body.id, fullName: String(extra.fullName ?? fullName) };
}

/**
 * A confirmed booking for `arrival` (+ BR-305 deposit; balance paid when pay='full'; main document added unless
 * doc=false). The caller makes sure the room-nights are free (virtual day, or freeWindow on the real clock).
 */
export async function makeStay(
  ctx: APIRequestContext,
  c: S2Context,
  s: StaffSession,
  i: StayInput,
): Promise<Stay> {
  const g = i.guestId
    ? { id: i.guestId, fullName: '' }
    : await namedGuest(ctx, s, i.doc === 'foreign' ? { fullName: 'Daniel Weber' } : {});
  const nights = i.nights ?? 1;
  // `alternatives`: rooms tried in order when the first is taken (409) – parallel cases on the real clock
  const candidates = [i.room, ...(i.alternatives ?? []).filter((x) => x.id !== i.room.id)];
  let r!: Awaited<ReturnType<typeof createReservation>>;
  let used = i.room;
  for (const rm of candidates) {
    used = rm;
    r = await createReservation(
      ctx,
      s,
      reservationBody(c, {
        room: rm,
        arrival: i.arrival,
        departure: addDays(i.arrival, nights),
        kind: i.kind ?? 'direct',
        adults: i.adults ?? 2,
        children6to11: i.children6to11 ?? 0,
        childrenUnder6: i.childrenUnder6 ?? 0,
        guestId: g.id,
        ...(i.extra ? { extra: i.extra } : {}),
      }),
    );
    if (r.status !== 409 || candidates.length === 1) break;
  }
  if (r.status === 409 && candidates.length > 1) {
    test.skip(true, `môi trường: mọi căn thử đều kín ${i.arrival} (${nights} đêm)`);
  }
  expect(r.status, `createReservation ${used.roomNo} ${i.arrival}: ${JSON.stringify(r.body)}`).toBe(
    201,
  );
  track('reservation', r.body.id);
  const ota = channel(c, i.kind ?? 'direct').channelGroup === 'ota';
  if ((i.pay ?? 'full') === 'full' && r.body.folioId) {
    const paymentModel = (r.body as { paymentModel?: string }).paymentModel;
    if (!ota || paymentModel === 'ota_pay_at_property') await payBalance(ctx, s, r.body.folioId);
  }
  const regId = await registrationOf(ctx, s, r.body as { id: string; registrationId?: string });
  if ((i.doc ?? 'vn') !== false) {
    const name = g.fullName || 'Khach Etoe';
    const data =
      i.doc === 'foreign'
        ? foreignDoc(name, addDays(i.arrival, nights), {}, await stackBusinessDate(ctx))
        : vnDoc(name);
    const d = await addDocument(ctx, s, regId, data);
    expect(d.status, `addGuestDocument: ${JSON.stringify(d.body)}`).toBe(201);
  }
  const fresh = await getReservation(ctx, s, r.body.id);
  return {
    res: fresh.body as Stay['res'],
    room: used,
    regId,
    guestName: g.fullName,
  };
}

export interface CheckInBody {
  checkinTime?: string;
  applyEarlySurcharge?: boolean;
  expectedSurchargeVnd?: number;
  roomNotReadyOverride?: { reason?: string; approvalRequestId?: string };
  documentBlockOverride?: { reason: string };
  cardsIssued?: number;
  houseRulesSent?: boolean;
  doorAccessHandedOver?: boolean;
  addPriorNight?: boolean;
  priorNightRateVnd?: number;
  requestFocForSurcharge?: Record<string, unknown>;
}

/** checkIn from the trusted desk device, If-Match = current version. */
export async function checkIn(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  body: CheckInBody = {},
  opts: { device?: boolean; idempotencyKey?: string } = {},
): Promise<ApiResult<Reservation & ProblemFields>> {
  const o = opts.device === false ? { session: s } : dev(s);
  const send = async (b: CheckInBody) => {
    const cur = await getReservation(ctx, s, reservationId);
    return call<Reservation & ProblemFields>(ctx, 'POST', p3(EP3.checkIn, s, { reservationId }), {
      ...o,
      idempotencyKey: opts.idempotencyKey ?? true,
      ifMatch: versionTag(cur.body.version),
      body: { cardsIssued: 1, houseRulesSent: true, ...b },
    });
  };
  const r = await send(body);
  // 0.3.6 (DOM S3-12, BUG-R2-039 fixed): an early check-in with a surcharge > 0 needs an explicit decision
  // (422 SURCHARGE_DECISION_REQUIRED). A case whose body says nothing about the surcharge (it is not the subject)
  // takes the desk default: post the amount previewCheckIn shows for the same time (typed, else server time).
  if (r.status === 422 && !opts.idempotencyKey && noDecision(body) && decisionRequired(r.body)) {
    const time = body.checkinTime ?? (await serverLocalTime(ctx));
    const pv = await preview(ctx, s, reservationId, time);
    const early = pv.body.earlyCheckinSurcharge as {
      amountVnd?: number;
      addsPreviousNight?: boolean;
    };
    if ((early?.amountVnd ?? 0) > 0 && !early?.addsPreviousNight) {
      autoDecision(`checkIn ${time}: applyEarlySurcharge ${early.amountVnd}`);
      return send({ ...body, applyEarlySurcharge: true, expectedSurchargeVnd: early.amountVnd });
    }
  }
  return r;
}

/** True when the body takes no surcharge decision (checkIn / setLateCheckout). */
export function noDecision(body: object): boolean {
  return !['applyEarlySurcharge', 'applySurcharge', 'addPriorNight', 'requestFocForSurcharge'].some(
    (k) => k in body,
  );
}

/** 422 with a field error SURCHARGE_DECISION_REQUIRED (OpenAPI 0.3.6, DOM S3-12). */
export function decisionRequired(body: unknown): boolean {
  return JSON.stringify(body ?? '').includes('SURCHARGE_DECISION_REQUIRED');
}

/** HH:MM of the stack clock (GET /health time is +07:00 and follows the MutableClock). */
export async function serverLocalTime(ctx: APIRequestContext): Promise<string> {
  const h = await call<{ time: string }>(ctx, 'GET', '/health');
  return h.body.time.slice(11, 16);
}

/** Visible trace of a surcharge decision taken by the harness for a case that is not about it. */
export function autoDecision(what: string): void {
  try {
    test
      .info()
      .annotations.push({ type: 'harness', description: `quyết định phụ thu mặc định – ${what}` });
  } catch {
    /* outside a test */
  }
}

export async function preview(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  checkinTime?: string,
): Promise<ApiResult<Record<string, unknown> & ProblemFields>> {
  return call(ctx, 'GET', p3(EP3.previewCheckIn, s, { reservationId }), {
    session: s,
    ...(checkinTime ? { query: { checkinTime } } : {}),
  });
}

/** A stay checked in now (FDL override when the room is not ready – the room status is not the subject). */
export async function inHouse(
  ctx: APIRequestContext,
  c: S2Context,
  s: StaffSession,
  i: StayInput & { checkIn?: CheckInBody },
): Promise<Stay> {
  const st = await makeStay(ctx, c, s, i);
  let r = await checkIn(ctx, s, st.res.id, i.checkIn ?? {});
  if (r.status === 409 && (r.body as ProblemFields).code === 'CHECKIN_CONDITIONS_NOT_MET') {
    const unmet = (r.body as { unmet?: string[] }).unmet ?? [];
    if (unmet.length === 1 && unmet[0] === 'room_ready') {
      const lead = await session(ctx, 'qa.fdl');
      r = await checkIn(ctx, lead, st.res.id, {
        ...(i.checkIn ?? {}),
        roomNotReadyOverride: { reason: 'E2E: buồng chưa dọn (HK Sprint 4)' },
      });
    }
  }
  expect(r.status, `checkIn ${st.res.code}: ${JSON.stringify(r.body)}`).toBe(200);
  expect(r.body.status).toBe('in_house');
  return { ...st, res: r.body as Stay['res'] };
}

/** POST …/actions/{act} on a reservation with If-Match = current version (Sprint 3 actions). */
export async function stayAction<T = Reservation & ProblemFields>(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  act: string,
  body: Record<string, unknown>,
  opts: { device?: boolean; idempotencyKey?: string | boolean; dryRun?: boolean } = {},
): Promise<ApiResult<T>> {
  const o = opts.device ? dev(s) : { session: s };
  if (opts.dryRun) {
    // SEC A3: a dry run needs no Idempotency-Key / If-Match and writes nothing
    return call<T>(
      ctx,
      'POST',
      `/v1/properties/${propertyIdOf(s)}/reservations/${reservationId}/actions/${act}`,
      { ...o, body: { ...body, dryRun: true } },
    );
  }
  const cur = await getReservation(ctx, s, reservationId);
  return call<T>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/reservations/${reservationId}/actions/${act}`,
    {
      ...o,
      idempotencyKey: opts.idempotencyKey ?? true,
      ifMatch: versionTag(cur.body.version),
      body,
    },
  );
}

/** Night rate of `date` of a booking (nightlyRates). */
export function nightRate(res: Reservation, date: string): number {
  const n = (res.nightlyRates as Array<{ date: string; amountVnd: number }> | undefined)?.find(
    (x) => x.date === date,
  );
  expect(n, `đêm ${date} của ${res.code}`).toBeTruthy();
  return n!.amountVnd;
}

/**
 * Business date of the stack (BR-010: the day changes at business_day_rollover 06:00, not at midnight) – what
 * "hôm nay" means for check-in/arrivals. stackToday() (support/api.ts) is the CALENDAR date: between 00:00 and
 * 05:59 the two differ by one day (a booking "arriving today" must use this one).
 */
export async function stackBusinessDate(
  ctx: APIRequestContext,
  rollover = '06:00',
): Promise<string> {
  const r = await call<{ time: string }>(ctx, 'GET', '/health');
  const date = r.body.time.slice(0, 10);
  return r.body.time.slice(11, 16) < rollover ? addDays(date, -1) : date;
}

// ───────────────────────── virtual business days (project clock) ─────────────────────────

const VDAY_FILE = `${AUTH_DIR}virtual-day.json`;

/**
 * A fresh business day for one clock case: far beyond any booking of the parallel projects (> today + 365),
 * never handed out twice for this API (persisted), T2–T4 (so D, D+1, D+2 are weekdays: BR-113 min stay 1 night,
 * no weekend uplift) and no special date nearby. `span` = number of days the case may use after D.
 */
export function virtualDay(realToday: string, span = 6): string {
  // a clock left in the future by an interrupted run must not push the base further: never later than the host date
  const host = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  let next = addDays(realToday < host ? realToday : host, 800);
  try {
    const f = JSON.parse(readFileSync(VDAY_FILE, 'utf8')) as { apiUrl: string; next: string };
    if (f.apiUrl === API_URL && f.next > next) next = f.next;
  } catch {
    /* first case */
  }
  let d = next;
  const ok = (x: string) =>
    [1, 2, 3].includes(weekday(x)) &&
    !nightsOf(addDays(x, -2), addDays(x, span + 2)).some(isSpecialDate);
  while (!ok(d)) d = addDays(d, 1);
  mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(VDAY_FILE, JSON.stringify({ apiUrl: API_URL, next: addDays(d, span + 2) }), {
    mode: 0o600,
  });
  return d;
}

const COMPOSE_CONTROL = process.env.E2E_COMPOSE_CONTROL === '1';

/** psql as the database superuser of the DISPOSABLE compose stack (E2E_COMPOSE_CONTROL=1). */
export function stackSql(sql: string): string {
  const args = [
    'compose',
    ...(process.env.E2E_COMPOSE_PROJECT ? ['-p', process.env.E2E_COMPOSE_PROJECT] : []),
    '--env-file',
    process.env.E2E_COMPOSE_ENV_FILE ?? '.env',
    '-f',
    process.env.E2E_COMPOSE_FILE ?? 'infra/docker-compose.yml',
    'exec',
    '-T',
    'postgres',
    'sh',
    '-c',
    'psql -v ON_ERROR_STOP=1 -At -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
  ];
  return execFileSync('docker', args, { cwd: PRODUCT_DIR, input: sql, stdio: 'pipe' }).toString();
}

export const CAN_CLEAN_ROOMS = COMPOSE_CONTROL;

/**
 * "Buồng phòng đã dọn" for every room: housekeeping transitions (SM-03 R1–R5, transitionRoomStatus) are Sprint 4,
 * so on the disposable stack the stored room_status rows are removed → derived status VC (room-status.service).
 * Returns false (nothing done) on a stack without compose control.
 */
export function cleanRooms(): boolean {
  if (!COMPOSE_CONTROL) return false;
  stackSql('DELETE FROM room_status;');
  return true;
}

export function needCleanRooms(tc: string): void {
  test.skip(
    !COMPOSE_CONTROL,
    `${tc}: cần buồng sạch (VC) – dọn buồng là Sprint 4; trên stack dùng một lần đặt E2E_COMPOSE_CONTROL=1`,
  );
}

/** Problem `unmet[]` of CHECKIN_CONDITIONS_NOT_MET. */
export function unmetOf(r: ApiResult): string[] {
  return ((r.body as { unmet?: string[] } | undefined)?.unmet ?? []).slice().sort();
}

/** etag header → version number. */
export function etagVersion(r: ApiResult): number | undefined {
  const t = etag(r);
  return t ? Number(t.replace(/[^0-9]/g, '')) : undefined;
}

export function exists(path: string): boolean {
  return existsSync(path);
}
