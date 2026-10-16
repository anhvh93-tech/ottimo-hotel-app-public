// Helpers riêng của nhóm L4 (lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền – EP04, EP05, EP15).
// Dùng chung với support/s3.ts (không sửa file đó). Hợp đồng: docs/api/openapi.yaml 0.3.6-draft.
//
//  - dsParam()/minibarItem(): đọc tham số và danh mục minibar của seed DS-E (fixtures/seed/ds-e.json) – số không
//    có trong oracle thì tính từ tham số thật của stack, không gõ cứng;
//  - vday()/at(): đặt đồng hồ (MutableClock) + thiết bị được cấp ảo cho project clock;
//  - minibarCheck(), checkOut(), lateCheckout(): bước 1–3 của trả phòng;
//  - setParam(), ensureReceivingAccount(): tham số có effectiveFrom (chỉ đặt cho NGÀY ẢO – không đụng ngày thật);
//  - emv()/crc16(): đọc chuỗi VietQR (EMVCo TLV) và tính CRC-16/CCITT-FALSE độc lập với server.
import { readFileSync } from 'node:fs';
import { expect, type APIRequestContext } from '@playwright/test';
import {
  call,
  propertyIdOf,
  session,
  sessionOrSkip,
  versionTag,
  type ApiResult,
  type StaffSession,
} from './api.js';
import { setClock } from './clock.js';
import { SEED_PASSWORD } from './env.js';
import {
  createReservation,
  freeWindow,
  getReservation,
  newGuest,
  nightsOf,
  reservationBody,
  s2Context,
  track,
  vnTime,
  type ChannelKind,
  type ProblemFields,
  type Reservation,
  type Room,
  type S2Context,
} from './s2.js';
import {
  EP3,
  autoDecision,
  callMultipart,
  cleanRooms,
  decisionRequired,
  dev,
  noDecision,
  p3,
  payBalance,
  png,
  useVirtualDevice,
  virtualDay,
  type Folio,
} from './s3.js';

// ───────────────────────── DS-E seed ─────────────────────────

interface SeedMinibarItem {
  code: string;
  name: string;
  salePriceVnd: number;
  complimentary: boolean;
  standardQtyPerRoom: number;
}
const DSE = JSON.parse(
  readFileSync(new URL('../../fixtures/seed/ds-e.json', import.meta.url), 'utf8'),
) as {
  parameters: Array<{ param: string; value: unknown }>;
  minibarItems: SeedMinibarItem[];
};

/** Giá trị tham số của seed DS-E (giá trị mặc định của stack dùng một lần). */
export function dsParam<T>(key: string): T {
  const p = DSE.parameters.find((x) => x.param === key);
  if (!p) throw new Error(`ds-e.json: thiếu tham số ${key}`);
  return p.value as T;
}

/** Món minibar của DS-E theo mã (coca, bia, nuoc, snack…). */
export function minibarItem(code: string): SeedMinibarItem {
  const i = DSE.minibarItems.find((x) => x.code === code);
  if (!i) throw new Error(`ds-e.json: không có món minibar ${code}`);
  return i;
}

// ───────────────────────── clock ─────────────────────────

/** Đặt đồng hồ tới `iso` và (nếu cần) cấp thiết bị ảo mới cho ngày ảo đó. */
export async function at(ctx: APIRequestContext, iso: string): Promise<string> {
  const now = await setClock(ctx, iso);
  await useVirtualDevice(ctx, now);
  return now;
}

/** Ngày ảo riêng của một ca clock: đồng hồ ở D `hhmm`, thiết bị ảo, mọi căn VC, ngữ cảnh DS-E. */
export async function vday(
  ctx: APIRequestContext,
  realToday: string,
  span = 6,
  hhmm = '14:30',
): Promise<{ D: string; c: S2Context }> {
  const D = virtualDay(realToday, span);
  await at(ctx, vnTime(D, hhmm));
  cleanRooms();
  const c = await s2Context(ctx);
  return { D, c };
}

// ───────────────────────── minibar (bước 1) ─────────────────────────

export interface MinibarStd {
  roomNo?: string;
  items: Array<{
    itemId: string;
    itemName: string;
    standardQty: number;
    isFree: boolean;
    unitPriceVnd?: number;
  }>;
  latestCheck?: Record<string, unknown> | null;
}

export async function minibarStandard(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
): Promise<MinibarStd> {
  const r = await call<MinibarStd>(ctx, 'GET', p3(EP3.getMinibarStandard, s, { reservationId }), {
    session: s,
  });
  expect(r.status, `getMinibarStandard: ${JSON.stringify(r.body)}`).toBe(200);
  return r.body;
}

/** itemId của món DS-E `code` trong tủ chuẩn (khớp theo tên món của seed). */
export function itemIdOf(std: MinibarStd, code: string): string {
  const name = minibarItem(code).name;
  const it = std.items.find((x) => x.itemName === name);
  expect(it, `tủ chuẩn không có ${name}`).toBeTruthy();
  return it!.itemId;
}

export interface MinibarCheckResult {
  id: string;
  mode: string;
  lines: Array<{
    itemId: string;
    itemName?: string;
    standardQty: number;
    remainingQty: number;
    usedQty: number;
    isFree?: boolean;
    amountVnd?: number;
  }>;
  totalVnd?: number;
  replacesCheckId?: string;
}

/**
 * recordMinibarCheck với số đã dùng theo mã DS-E (`used`, mặc định 0 = không dùng gì) – đủ mọi món tủ chuẩn.
 * `raw` ghi đè danh sách dòng (ca kiểm lỗi 422).
 */
export async function minibarCheck(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  used: Record<string, number> = {},
  opts: {
    mode?: 'checkout' | 'stayover';
    raw?: Array<{ itemId: string; remainingQty: number }>;
  } = {},
): Promise<ApiResult<MinibarCheckResult & ProblemFields>> {
  let lines = opts.raw;
  if (!lines) {
    const std = await minibarStandard(ctx, s, reservationId);
    const usedById = new Map(Object.entries(used).map(([code, n]) => [itemIdOf(std, code), n]));
    lines = std.items.map((i) => ({
      itemId: i.itemId,
      remainingQty: i.standardQty - (usedById.get(i.itemId) ?? 0),
    }));
  }
  return call(ctx, 'POST', p3(EP3.recordMinibarCheck, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    body: { mode: opts.mode ?? 'checkout', lines },
  });
}

// ───────────────────────── lưu trú / trả phòng ─────────────────────────

export interface LateResult {
  checkoutTime: string;
  tierPct?: number;
  surchargeVnd: number;
  treatAsExtension?: boolean;
  arrivalSameDay?: {
    guestDisplayName?: string;
    etaTime?: string;
    alternativeRoomAvailable?: boolean;
  };
  cleaningNotBefore?: string;
  saved?: boolean;
  reservation?: Record<string, unknown> & { version?: number; agreedCheckoutTime?: string };
}

/** setLateCheckout; dryRun → không Idempotency-Key/If-Match (SEC A3). */
export async function lateCheckout(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  body: Record<string, unknown>,
  dryRun = false,
): Promise<ApiResult<LateResult & ProblemFields>> {
  const path = p3(EP3.setLateCheckout, s, { reservationId });
  if (dryRun) return call(ctx, 'POST', path, { session: s, body: { ...body, dryRun: true } });
  const send = async (b: Record<string, unknown>) => {
    const cur = await getReservation(ctx, s, reservationId);
    return call<LateResult & ProblemFields>(ctx, 'POST', path, {
      session: s,
      idempotencyKey: true,
      ifMatch: versionTag(cur.body.version),
      body: b,
    });
  };
  const r = await send(body);
  // 0.3.6 (DOM S3-12): surcharge > 0 needs applySurcharge=true (+ expected) or a FOC request – a case that is not
  // about the surcharge takes the desk default (post the amount the dry run shows).
  if (r.status === 422 && noDecision(body) && decisionRequired(r.body)) {
    const dry = await call<LateResult>(ctx, 'POST', path, {
      session: s,
      body: { ...body, dryRun: true },
    });
    if (dry.status === 200 && dry.body.surchargeVnd > 0) {
      autoDecision(
        `setLateCheckout ${String(body.checkoutTime)}: applySurcharge ${dry.body.surchargeVnd}`,
      );
      return send({ ...body, applySurcharge: true, expectedSurchargeVnd: dry.body.surchargeVnd });
    }
  }
  return r;
}

export interface CheckoutSummary {
  checkoutTime: string;
  standardCheckoutTime?: string;
  lateCheckoutSurcharge?: { tierPct?: number; amountVnd?: number };
  lines: Array<Record<string, unknown> & { category: string; amountVnd: number }>;
  totalVnd: number;
  paidVnd: number;
  balanceDueVnd: number;
  creditVnd?: number;
  lateSurchargeRecalc?: { oldVnd: number; newVnd: number; newTierPct?: number };
  pendingApprovals?: number;
  blockers?: string[];
}

export async function checkoutSummary(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  query: Record<string, string> = {},
): Promise<ApiResult<CheckoutSummary & ProblemFields>> {
  return call(ctx, 'GET', p3(EP3.getCheckoutSummary, s, { reservationId }), {
    session: s,
    query,
  });
}

export interface CheckoutResult {
  reservation: Record<string, unknown> & { status: string; version?: number };
  billNo: string;
  createdTaskIds?: string[];
}

/** checkOut (B18) với If-Match = version hiện tại; `idempotencyKey` cố định cho ca gửi lặp. */
export async function checkOut(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  body: Record<string, unknown>,
  opts: { idempotencyKey?: string; version?: number } = {},
): Promise<ApiResult<CheckoutResult & ProblemFields>> {
  const version = opts.version ?? (await getReservation(ctx, s, reservationId)).body.version;
  return call(ctx, 'POST', p3(EP3.checkOut, s, { reservationId }), {
    session: s,
    idempotencyKey: opts.idempotencyKey ?? true,
    ifMatch: versionTag(version),
    body,
  });
}

// ───────────────────────── tham số (effectiveFrom) ─────────────────────────

/** setParameter (qa.owner mặc định). `reauth` cho khóa x-reauth-parameters (payment_receiving_account). */
export async function setParam(
  ctx: APIRequestContext,
  key: string,
  value: unknown,
  effectiveFrom: string,
  opts: { who?: string; reauth?: boolean; reason?: string } = {},
): Promise<ApiResult<Record<string, unknown> & ProblemFields>> {
  const s = await sessionOrSkip(ctx, opts.who ?? 'qa.owner');
  return call(ctx, 'PUT', `/v1/properties/${propertyIdOf(s)}/parameters/${key}`, {
    session: s,
    idempotencyKey: true,
    body: {
      value,
      effectiveFrom,
      reason: opts.reason ?? 'E2E L4: tham số cho ngày ảo của ca',
      ...(opts.reauth ? { reauth: { authMethod: 'password', secret: SEED_PASSWORD } } : {}),
    },
  });
}

/** Tài khoản nhận VietQR THỬ (dữ liệu test, không phải tài khoản thật). */
export const TEST_RECEIVING_ACCOUNT = {
  bankBin: '970436',
  accountNo: '0123456789',
  accountName: 'OTTIMO TEST',
};

/**
 * Cấu hình tài khoản nhận (BR-521, ESC-010) hiệu lực từ `effectiveFrom` = NGÀY ẢO của ca clock. Không bao giờ đặt
 * cho ngày thật: TC-L4-065 ("chưa cấu hình") chạy ở project api với đồng hồ thật.
 */
export async function ensureReceivingAccount(
  ctx: APIRequestContext,
  effectiveFrom: string,
): Promise<void> {
  const r = await setParam(
    ctx,
    'payment_receiving_account',
    TEST_RECEIVING_ACCOUNT,
    effectiveFrom,
    {
      reauth: true,
      reason: 'E2E: tai khoan nhan thu (du lieu test)',
    },
  );
  expect(r.status, `setParameter payment_receiving_account: ${JSON.stringify(r.body)}`).toBe(200);
}

// ───────────────────────── VietQR (EMVCo) ─────────────────────────

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) – hex 4 ký tự in hoa. Vector chuẩn "123456789" → 29B1. */
export function crc16(s: string): string {
  let crc = 0xffff;
  for (const b of Buffer.from(s, 'utf8')) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** TLV EMVCo (id 2 số + độ dài 2 số + giá trị) → Map id → giá trị. Ném lỗi khi độ dài không khớp. */
export function emv(payload: string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || !Number.isInteger(len) || i + 4 + len > payload.length) {
      throw new Error(`EMVCo TLV hỏng tại vị trí ${i}: ${payload.slice(i, i + 12)}`);
    }
    out.set(id, payload.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return out;
}

// ───────────────────────── tệp đính kèm, duyệt ─────────────────────────

/** uploadAttachment (ảnh PNG hợp lệ) → id. */
export async function upload(
  ctx: APIRequestContext,
  s: StaffSession,
  purpose: string,
  reservationId?: string,
): Promise<string> {
  const r = await callMultipart<{ id: string }>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/attachments`,
    {
      session: s,
      idempotencyKey: true,
      fields: { purpose, ...(reservationId ? { reservationId } : {}) },
      files: [['file', png(`${purpose}.png`)]],
    },
  );
  expect(r.status, `uploadAttachment ${purpose}: ${JSON.stringify(r.body)}`).toBe(201);
  return r.body.id;
}

export interface Approval {
  id: string;
  type: string;
  status: string;
  amountVnd?: number;
  reservationCode?: string;
  targetCode?: string;
  requiredRole?: string;
  refundDestination?: Record<string, unknown>;
  refundedVnd?: number;
  [k: string]: unknown;
}

/** Yêu cầu duyệt của một đơn (theo mã đơn), mọi trạng thái, mới nhất trước. */
export async function approvalsOf(
  ctx: APIRequestContext,
  s: StaffSession,
  code: string,
  type?: string,
): Promise<Approval[]> {
  const out: Approval[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const r = await call<{ data: Approval[]; page?: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      p3(EP3.listApprovalRequests, s),
      { session: s, query: { limit: 100, cursor } },
    );
    expect(r.status, `listApprovalRequests: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
    out.push(
      ...r.body.data.filter(
        (a) => (a.reservationCode ?? a.targetCode) === code && (!type || a.type === type),
      ),
    );
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return out;
}

/** Folio + ETag (If-Match của adjustFolioLine = Folio.version). */
export async function folioWithTag(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
): Promise<Folio> {
  const r = await call<Folio>(ctx, 'GET', p3(EP3.getFolio, s, { folioId }), { session: s });
  expect(r.status, `getFolio: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body;
}

export async function adjustLine(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
  lineId: string,
  body: Record<string, unknown>,
): Promise<ApiResult<Folio & ProblemFields>> {
  const f = await folioWithTag(ctx, s, folioId);
  return call(ctx, 'POST', p3(EP3.adjustFolioLine, s, { folioId, lineId }), {
    session: s,
    idempotencyKey: true,
    ifMatch: versionTag(f.version),
    body,
  });
}

/** Phiên mới đăng nhập sau khi tua đồng hồ (session() tự kiểm getMe). */
export async function fresh(ctx: APIRequestContext, username: string): Promise<StaffSession> {
  return sessionOrSkip(ctx, username);
}

export { dev, session };

// ───────────────────────── đơn ngày xa (project api – không nhận phòng) ─────────────────────────

/**
 * Đơn confirmed trên khoảng trống ngày xa (today + 30…320) – thử lại khi ca song song chiếm (409). `rate` → mọi đêm
 * nhập tay giá đó (kênh Trực tiếp: trong sàn–trần BR-105). `pay`: 'deposit' (mặc định – chỉ cọc BR-305 tự thêm),
 * 'full' (trả đủ tiền mặt). Đơn được track() để hủy ở afterEach.
 */
export async function farBooking(
  ctx: APIRequestContext,
  c: S2Context,
  s: StaffSession,
  i: {
    nights: number;
    today: string;
    room?: Room;
    kind?: ChannelKind;
    rate?: number;
    pay?: 'deposit' | 'full';
    guestId?: string;
    initialPaymentVnd?: number;
    extra?: Record<string, unknown>;
  },
): Promise<Reservation & { folioId: string }> {
  const guestId = i.guestId ?? (await newGuest(ctx, s));
  for (let attempt = 0; attempt < 8; attempt++) {
    const rm = i.room ?? c.rooms[Math.floor(Math.random() * c.rooms.length)]!;
    const w = await freeWindow(ctx, s, rm, i.nights, { today: i.today });
    const extra: Record<string, unknown> = { ...(i.extra ?? {}) };
    if (i.rate !== undefined) {
      extra.nightlyRates = nightsOf(w.arrival, w.departure).map((date) => ({
        date,
        amountVnd: i.rate,
      }));
    }
    const body = reservationBody(c, {
      room: rm,
      arrival: w.arrival,
      departure: w.departure,
      kind: i.kind ?? 'direct',
      guestId,
      extra,
    });
    if (i.initialPaymentVnd !== undefined) {
      body.initialPayment = { type: 'deposit', method: 'cash', amountVnd: i.initialPaymentVnd };
    }
    const r = await createReservation(ctx, s, body);
    if (r.status === 409) continue;
    expect(r.status, `createReservation ${rm.roomNo} ${w.arrival}: ${JSON.stringify(r.body)}`).toBe(
      201,
    );
    track('reservation', r.body.id);
    if (i.pay === 'full' && r.body.folioId) await payBalance(ctx, s, r.body.folioId);
    const fresh = await getReservation(ctx, s, r.body.id);
    return fresh.body as Reservation & { folioId: string };
  }
  throw new Error('farBooking: mọi khoảng thử đều kín (409)');
}
