// Sprint 2 helpers (EP02 rack/đặt phòng/chống trùng/OOO, EP11 báo giá/giữ chỗ/cọc, US-139, BR-812).
// Contract: docs/api/openapi.yaml 0.3.x. Oracle numbers: fixtures/br-examples.json (never hard-code a BR number
// that the oracle already has – read it with oracle()).
//
// Shared-stack strategy (dev stack is shared with BE/FE; CI stack is disposable):
//   - every booking test picks its OWN free window with freeWindow()/bookFree() (random far-future arrival,
//     checked with searchAvailability when it is on the build, retried on 409) – never a fixed date that a
//     previous run may already hold;
//   - fixed oracle dates are used only where the price depends on the weekday (calculateQuote, no booking);
//   - what a test creates is registered with track() and cancelled in afterEach (cleanupTracked) so a rerun
//     finds the inventory free again (room blocks: transitionRoomBlock cancel).
import { readFileSync } from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  propertyIdOf,
  session,
  uniq,
  uniqName,
  versionTag,
  type ApiResult,
  type Problem,
  type StaffSession,
} from './api.js';

/** Problem fields that can sit next to a resource body (`status` excluded: resource status is a string). */
export interface ProblemFields {
  type?: string;
  title?: string;
  code?: string;
  detail?: string;
  errors?: Array<{ field?: string; code?: string }>;
  conflicts?: unknown;
  suggestions?: unknown;
}

// ───────────────────────── endpoints (method, path, operationId) ─────────────────────────

type Ep = [method: string, path: string, operationId: string];
const R = '/v1/properties/{propertyId}';
export const EP = {
  listRooms: ['GET', `${R}/rooms`, 'listRooms'],
  listChannels: ['GET', `${R}/channels`, 'listChannels'],
  createGuest: ['POST', `${R}/guests`, 'createGuest'],
  getRack: ['GET', `${R}/rack`, 'getRack'],
  searchAvailability: ['GET', `${R}/availability`, 'searchAvailability'],
  listReservations: ['GET', `${R}/reservations`, 'listReservations'],
  createReservation: ['POST', `${R}/reservations`, 'createReservation'],
  getReservation: ['GET', `${R}/reservations/{reservationId}`, 'getReservation'],
  updateReservation: ['PATCH', `${R}/reservations/{reservationId}`, 'updateReservation'],
  getReservationHistory: [
    'GET',
    `${R}/reservations/{reservationId}/history`,
    'getReservationHistory',
  ],
  extendHold: ['POST', `${R}/reservations/{reservationId}/actions/extend-hold`, 'extendHold'],
  confirmDeposit: [
    'POST',
    `${R}/reservations/{reservationId}/actions/confirm-deposit`,
    'confirmDeposit',
  ],
  createDepositNotice: [
    'POST',
    `${R}/reservations/{reservationId}/deposit-notices`,
    'createDepositNotice',
  ],
  cancelReservation: [
    'POST',
    `${R}/reservations/{reservationId}/actions/cancel`,
    'cancelReservation',
  ],
  moveReservation: ['POST', `${R}/reservations/{reservationId}/actions/move`, 'moveReservation'],
  markNoShow: ['POST', `${R}/reservations/{reservationId}/actions/mark-no-show`, 'markNoShow'],
  restoreNoShow: [
    'POST',
    `${R}/reservations/{reservationId}/actions/restore-no-show`,
    'restoreNoShow',
  ],
  assignRoom: ['POST', `${R}/reservations/{reservationId}/actions/assign-room`, 'assignRoom'],
  listOverbookingIncidents: ['GET', `${R}/overbooking-incidents`, 'listOverbookingIncidents'],
  calculateQuote: ['POST', `${R}/quotes/calculate`, 'calculateQuote'],
  saveQuote: ['POST', `${R}/quotes`, 'saveQuote'],
  getQuote: ['GET', `${R}/quotes/{quoteId}`, 'getQuote'],
  withdrawQuote: ['POST', `${R}/quotes/{quoteId}/actions/withdraw`, 'withdrawQuote'],
  createHoldFromQuote: ['POST', `${R}/quotes/{quoteId}/actions/create-hold`, 'createHoldFromQuote'],
  listLeads: ['GET', `${R}/leads`, 'listLeads'],
  createRoomBlock: ['POST', `${R}/room-blocks`, 'createRoomBlock'],
  listRoomBlocks: ['GET', `${R}/room-blocks`, 'listRoomBlocks'],
  updateRoomBlock: ['PATCH', `${R}/room-blocks/{roomBlockId}`, 'updateRoomBlock'],
  transitionRoomBlock: [
    'POST',
    `${R}/room-blocks/{roomBlockId}/actions/{action}`,
    'transitionRoomBlock',
  ],
  listAttentionItems: ['GET', `${R}/attention`, 'listAttentionItems'],
  listApprovalRequests: ['GET', `${R}/approval-requests`, 'listApprovalRequests'],
  listHkTasks: ['GET', `${R}/hk-tasks`, 'listHkTasks'],
  getFolio: ['GET', `${R}/folios/{folioId}`, 'getFolio'],
  extendQuote: ['POST', `${R}/quotes/{quoteId}/actions/extend`, 'extendQuote'],
  listCloserCandidates: ['GET', `${R}/closer-candidates`, 'listCloserCandidates'],
  listAuditEvents: ['GET', `${R}/audit-events`, 'listAuditEvents'],
} satisfies Record<string, Ep>;

// ───────────────────────── oracle (fixtures/br-examples.json) ─────────────────────────

interface OracleRow {
  id: string;
  br: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}
const ORACLE = new Map(
  (
    JSON.parse(
      readFileSync(new URL('../../fixtures/br-examples.json', import.meta.url), 'utf8'),
    ) as { examples: OracleRow[] }
  ).examples.map((e) => [e.id, e]),
);

/** One oracle row (throws when the id is missing – a renamed example must break the test loudly). */
export function oracle(id: string): OracleRow {
  const row = ORACLE.get(id);
  if (!row) throw new Error(`br-examples.json: thiếu ví dụ ${id}`);
  return row;
}
export function oracleNum(id: string, key: string): number {
  const v = oracle(id).expected[key];
  if (typeof v !== 'number') throw new Error(`${id}.expected.${key} không phải số`);
  return v;
}

// ───────────────────────── dates (business dates are YYYY-MM-DD, Asia/Ho_Chi_Minh) ─────────────────────────

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** 0 = Sunday … 6 = Saturday */
export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
export function nextWeekday(from: string, dow: number): string {
  let d = from;
  while (weekday(d) !== dow) d = addDays(d, 1);
  return d;
}
export function nightsOf(arrival: string, departure: string): string[] {
  const out: string[] = [];
  for (let d = arrival; d < departure; d = addDays(d, 1)) out.push(d);
  return out;
}
const SPECIAL_DATES =
  ((
    JSON.parse(readFileSync(new URL('../../fixtures/seed/ds-e.json', import.meta.url), 'utf8')) as {
      parameters: Array<{ param: string; value: unknown }>;
    }
  ).parameters.find((x) => x.param === 'special_dates')?.value as
    Array<{ from: string; to: string }> | undefined) ?? [];

/** Ngày thuộc special_dates của DS-E (khoảng nửa mở). */
export function isSpecialDate(date: string): boolean {
  return SPECIAL_DATES.some((x) => date >= x.from && date < x.to);
}

/** Ở tối thiểu theo ngày đến (BR-113 mặc định: T6, T7, ngày đặc biệt → 2 đêm; còn lại 1). */
export function minStayFor(arrival: string): number {
  const d = weekday(arrival);
  return d === 5 || d === 6 || isSpecialDate(arrival) ? 2 : 1;
}

/** Ngày đến gần nhất (từ `from`) mà 1 đêm hợp lệ (T2–T5, không phải ngày đặc biệt). */
export function weekdayArrival(from: string): string {
  let d = from;
  while (minStayFor(d) > 1) d = addDays(d, 1);
  return d;
}

export function vnTime(date: string, hhmm: string): string {
  return `${date}T${hhmm.length === 5 ? `${hhmm}:00` : hhmm}+07:00`;
}
export function ms(iso: string): number {
  return new Date(iso).getTime();
}
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Stack "now" (GET /health – follows the MutableClock, +07:00). */
export async function stackNow(ctx: APIRequestContext): Promise<string> {
  const r = await call<{ time: string }>(ctx, 'GET', '/health');
  return r.body.time;
}

// ───────────────────────── property context (rooms, channels) ─────────────────────────

export interface Room {
  id: string;
  roomNo: string;
  roomGroupId?: string;
  roomGroupCode?: string;
  baseOccupancy?: number;
  maxOccupancy?: number;
  isSellable?: boolean;
}
export interface Channel {
  id: string;
  code: string;
  channelGroup: 'direct' | 'agent' | 'ota' | 'internal';
  requiresOtaRef?: boolean;
}
export interface S2Context {
  propertyId: string;
  rooms: Room[];
  channels: Channel[];
  /** user id of qa.ctv1 – default `closerUserId` for kênh CTV (US-017 AC9: bắt buộc) */
  agentCloserId: string;
}

function listOf<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  return ((body as { data?: T[] } | undefined)?.data ?? []) as T[];
}

let ctxPromise: Promise<S2Context> | null = null;

/** Rooms + channels of the DS-E property (per worker). Skips the test when DS-E rooms are not loaded. */
export async function s2Context(ctx: APIRequestContext): Promise<S2Context> {
  ctxPromise ??= (async () => {
    const owner = await session(ctx, 'qa.owner');
    const propertyId = propertyIdOf(owner);
    const rooms = await call(ctx, 'GET', `/v1/properties/${propertyId}/rooms`, { session: owner });
    const channels = await call(ctx, 'GET', `/v1/properties/${propertyId}/channels`, {
      session: owner,
    });
    const ctv = await session(ctx, 'qa.ctv1');
    return {
      propertyId,
      rooms: rooms.status === 200 ? listOf<Room>(rooms.body) : [],
      channels: channels.status === 200 ? listOf<Channel>(channels.body) : [],
      agentCloserId: ctv.me.id,
    };
  })();
  const c = await ctxPromise;
  test.skip(c.rooms.length < 10, 'môi trường: DS-E chưa nạp đủ 10 căn (listRooms)');
  test.skip(c.channels.length === 0, 'môi trường: chưa có danh mục kênh (listChannels)');
  return c;
}

export function room(c: S2Context, roomNo: string): Room {
  const r = c.rooms.find((x) => x.roomNo === roomNo);
  if (!r) throw new Error(`DS-E: không có căn ${roomNo}`);
  return r;
}

export type ChannelKind = 'direct' | 'agent' | 'internal' | 'booking' | 'agoda' | 'airbnb';

/**
 * Channel by kind. "direct" = the single Trực tiếp channel `direct` (DS-E 16/10 – ARC A-08, DOM D-6; nguồn
 * khách ở `directSource`); stacks seeded before that still have `zalo_phone` (group direct) as fallback.
 * OTA kinds by code.
 */
export function channel(c: S2Context, kind: ChannelKind): Channel {
  const byCode = (code: string) => c.channels.find((x) => x.code === code);
  const byGroup = (g: Channel['channelGroup']) => c.channels.find((x) => x.channelGroup === g);
  const ch =
    kind === 'direct'
      ? (byCode('direct') ?? byCode('zalo_phone') ?? byGroup('direct'))
      : kind === 'agent'
        ? (byCode('collaborator') ?? byGroup('agent'))
        : kind === 'internal'
          ? (byCode('internal') ?? byGroup('internal'))
          : byCode(kind);
  if (!ch) throw new Error(`listChannels: không có kênh ${kind}`);
  return ch;
}

// ───────────────────────── guests ─────────────────────────

export const mobile = () => `0939${String(rnd(0, 999_999)).padStart(6, '0')}`;

/** Throwaway booker (fake: e-mail .test, mobile 0939xxxxxx). withPhone=false → PHONE_REQUIRED cases. */
export async function newGuest(
  ctx: APIRequestContext,
  s: StaffSession,
  opts: { withPhone?: boolean } = {},
): Promise<string> {
  const body: Record<string, unknown> = {
    fullName: `Khach Etoe ${uniqName(5)}`,
    email: `e2e.s2.${uniq(8)}@example.test`,
  };
  if (opts.withPhone !== false) body.phone = mobile();
  const r = await call<{ id: string }>(ctx, 'POST', `/v1/properties/${propertyIdOf(s)}/guests`, {
    session: s,
    idempotencyKey: true,
    body,
  });
  expect(r.status, `createGuest: ${JSON.stringify(r.body)}`).toBe(201);
  return r.body.id;
}

// ───────────────────────── reservations ─────────────────────────

export interface Reservation {
  id: string;
  code: string;
  status: string;
  stayType?: string;
  arrivalDate: string;
  departureDate: string;
  folioId?: string;
  conflictState?: string;
  externalContract?: boolean;
  extraGuestCount?: number;
  hold?: { hours?: number; expiresAt?: string; extendedCount?: number };
  depositRequiredVnd?: number;
  depositPaidVnd?: number;
  totalRoomVnd?: number;
  capacityConflict?: boolean;
  segments?: Array<{ roomId: string | null; roomNo?: string | null }>;
  allowedActions?: Array<{ event: string; transition: string; action: string }>;
  cancellation?: { reasonCode?: string };
  version: number;
  [k: string]: unknown;
}

export interface BookInput {
  room: Room;
  arrival: string;
  departure: string;
  kind?: ChannelKind;
  adults?: number;
  children6to11?: number;
  childrenUnder6?: number;
  guestId?: string;
  extra?: Record<string, unknown>;
}

export function reservationBody(c: S2Context, i: BookInput): Record<string, unknown> {
  const ch = channel(c, i.kind ?? 'direct');
  const body: Record<string, unknown> = {
    roomId: i.room.id,
    channelId: ch.id,
    arrivalDate: i.arrival,
    departureDate: i.departure,
    adults: i.adults ?? 2,
    children6to11: i.children6to11 ?? 0,
    childrenUnder6: i.childrenUnder6 ?? 0,
    bookerGuestId: i.guestId,
    paymentModel: ch.channelGroup === 'ota' ? 'ota_prepaid' : 'direct',
  };
  if (ch.channelGroup === 'direct') body.directSource = 'zalo_phone';
  // US-017 AC9: kênh CTV bắt buộc người chốt là CTV (ca kiểm chính quy tắc này truyền `closerUserId: undefined`)
  if (ch.channelGroup === 'agent') body.closerUserId = c.agentCloserId;
  if (ch.requiresOtaRef || ch.channelGroup === 'ota') body.otaRef = `E2E${rnd(1e8, 9e8)}`;
  // Đơn OTA nhập tay: lễ tân nhập giá theo extranet. Server hiện BẮT BUỘC giá đêm cho OTA (BUG-R2-017 – EP02 3.2
  // cho phép bỏ trống); mặc định gửi 820.000/đêm để các ca khác (trùng căn, US-139, BR-812) không vướng lỗi đó.
  // Ca kiểm chính lỗi này truyền `extra: { nightlyRates: undefined }`.
  if (ch.channelGroup === 'ota' && !(i.extra && 'nightlyRates' in i.extra)) {
    body.nightlyRates = nightsOf(i.arrival, i.departure).map((date) => ({
      date,
      amountVnd: 820000,
    }));
  }
  return { ...body, ...(i.extra ?? {}) };
}

/** Deposit of BR-305 attached to a direct/agent reservation (EP02 3.2 `initialPayment`, B2 điều kiện b). */
export function depositPayment(amountVnd: number): Record<string, unknown> {
  return { type: 'deposit', method: 'cash', amountVnd };
}

/**
 * createReservation. Kênh `direct`/`agent` phải kèm `initialPayment` ≥ cọc BR-305 (EP02 3.2) – mức cọc phụ thuộc
 * giá đêm nên test không tự tính: khi server trả `422 DEPOSIT_INSUFFICIENT` (kiểm sau cùng – EP02 3.4, nên mọi lỗi
 * 409/422 khác vẫn hiện nguyên) và body chưa có `initialPayment`, gửi lại MỘT lần với `depositRequiredVnd` của
 * phản hồi (khóa Idempotency mới). `autoDeposit: false` cho ca kiểm chính lỗi cọc.
 */
export async function createReservation(
  ctx: APIRequestContext,
  s: StaffSession,
  body: Record<string, unknown>,
  idempotencyKey: boolean | string = true,
  opts: { autoDeposit?: boolean } = {},
): Promise<ApiResult<Reservation & ProblemFields>> {
  const send = (b: Record<string, unknown>, key: boolean | string) =>
    call<Reservation & ProblemFields>(
      ctx,
      'POST',
      `/v1/properties/${propertyIdOf(s)}/reservations`,
      {
        session: s,
        idempotencyKey: key,
        body: b,
      },
    );
  const r = await send(body, idempotencyKey);
  const required = (r.body as { depositRequiredVnd?: number } | undefined)?.depositRequiredVnd;
  if (
    opts.autoDeposit === false ||
    body.initialPayment !== undefined ||
    r.status !== 422 ||
    r.body?.code !== 'DEPOSIT_INSUFFICIENT' ||
    !required
  ) {
    return r;
  }
  return send(
    { ...body, initialPayment: depositPayment(required) },
    idempotencyKey === false ? false : true,
  );
}

/**
 * Body + `initialPayment` đúng mức cọc, dò bằng một lời gọi không kèm cọc (server trả DEPOSIT_INSUFFICIENT kèm
 * `depositRequiredVnd`, không ghi gì). Dùng khi cần gửi cùng một body nhiều lần (Idempotency, đua đồng thời).
 */
export async function withDeposit(
  ctx: APIRequestContext,
  s: StaffSession,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (body.initialPayment !== undefined) return body;
  const r = await createReservation(ctx, s, body, true, { autoDeposit: false });
  if (r.status === 201) {
    track('reservation', r.body.id); // kênh không cần cọc: đã tạo – dọn sau
    throw new Error('withDeposit: kênh không cần cọc – đơn đã được tạo ngay ở lần dò');
  }
  const required = (r.body as { depositRequiredVnd?: number }).depositRequiredVnd;
  expect(r.body?.code, `dò cọc: ${JSON.stringify(r.body)}`).toBe('DEPOSIT_INSUFFICIENT');
  return { ...body, initialPayment: depositPayment(required ?? 0) };
}

export async function getReservation(
  ctx: APIRequestContext,
  s: StaffSession,
  id: string,
): Promise<ApiResult<Reservation & ProblemFields>> {
  return call<Reservation & ProblemFields>(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(s)}/reservations/${id}`,
    { session: s },
  );
}

/** POST …/reservations/{id}/actions/{action} with If-Match = current version (+ Idempotency-Key). */
export async function action<T = Reservation & ProblemFields>(
  ctx: APIRequestContext,
  s: StaffSession,
  id: string,
  act: string,
  body: Record<string, unknown> = {},
  opts: { version?: number; idempotencyKey?: boolean | string } = {},
): Promise<ApiResult<T>> {
  let version = opts.version;
  if (version === undefined) {
    const cur = await getReservation(ctx, s, id);
    version = cur.body?.version ?? 0;
  }
  return call<T>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/reservations/${id}/actions/${act}`,
    {
      session: s,
      idempotencyKey: opts.idempotencyKey ?? true,
      ifMatch: versionTag(version),
      body,
    },
  );
}

export function statusOf(r: ApiResult): string {
  const code = (r.body as Problem | undefined)?.code;
  return `${r.status}${code ? ` ${code}` : ''}`;
}

/** Room-night availability via searchAvailability (null = endpoint not on the build). */
export async function isRoomFree(
  ctx: APIRequestContext,
  s: StaffSession,
  rm: Room,
  arrival: string,
  departure: string,
): Promise<boolean | null> {
  const r = await call<{ requestedRoom?: { available?: boolean } }>(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(s)}/availability`,
    { session: s, query: { arrival, departure, roomId: rm.id } },
  );
  if (r.status === 404 || r.status === 405) return null;
  if (r.status !== 200) return false;
  return r.body?.requestedRoom?.available === true;
}

/**
 * A window of `nights` nights in [today+minOffset, today+maxOffset] where `rm` is free.
 * Uses searchAvailability when present; otherwise a random window (callers retry on 409).
 */
export async function freeWindow(
  ctx: APIRequestContext,
  s: StaffSession,
  rm: Room,
  nights: number,
  opts: { today: string; minOffset?: number; maxOffset?: number; dow?: number },
): Promise<{ arrival: string; departure: string }> {
  for (let i = 0; i < 25; i++) {
    let arrival = addDays(opts.today, rnd(opts.minOffset ?? 30, opts.maxOffset ?? 320));
    if (opts.dow !== undefined) arrival = nextWeekday(arrival, opts.dow);
    // 1 đêm: tránh ngày có ở tối thiểu 2 đêm (BR-113: T6, T7, ngày đặc biệt) – ca cần đúng ngày đó tự đặt `dow`
    else if (nights < minStayFor(arrival)) arrival = weekdayArrival(arrival);
    const departure = addDays(arrival, nights);
    // tránh ngày đặc biệt (giá +30%, ở tối thiểu 2 đêm) để các ca 1 đêm bên trong khoảng không vướng BR-113
    if (nightsOf(arrival, addDays(departure, 1)).some(isSpecialDate)) continue;
    const free = await isRoomFree(ctx, s, rm, arrival, departure);
    if (free !== false) return { arrival, departure };
  }
  test.skip(true, `môi trường: không tìm được ${nights} đêm trống cho căn ${rm.roomNo}`);
  throw new Error('unreachable');
}

/** First room (in the order given) free for [arrival, departure). */
export async function freeRoom(
  ctx: APIRequestContext,
  s: StaffSession,
  candidates: Room[],
  arrival: string,
  departure: string,
): Promise<Room> {
  for (const rm of candidates) {
    const free = await isRoomFree(ctx, s, rm, arrival, departure);
    if (free !== false) return rm;
  }
  test.skip(true, `môi trường: không còn căn trống ${arrival}→${departure}`);
  throw new Error('unreachable');
}

/** Create a reservation on a free window of `rm` (retry on 409 – shared stack). Tracks it for cleanup. */
export async function bookFree(
  ctx: APIRequestContext,
  s: StaffSession,
  c: S2Context,
  i: Omit<BookInput, 'arrival' | 'departure'> & { nights: number; today: string; dow?: number },
): Promise<Reservation> {
  const guestId = i.guestId ?? (await newGuest(ctx, s));
  for (let attempt = 0; attempt < 6; attempt++) {
    const w = await freeWindow(ctx, s, i.room, i.nights, {
      today: i.today,
      ...(i.dow !== undefined ? { dow: i.dow } : {}),
    });
    const r = await createReservation(
      ctx,
      s,
      reservationBody(c, { ...i, guestId, arrival: w.arrival, departure: w.departure }),
    );
    if (r.status === 201) {
      track('reservation', r.body.id);
      return r.body;
    }
    if (r.status !== 409) {
      expect(r.status, `createReservation ${i.room.roomNo}: ${JSON.stringify(r.body)}`).toBe(201);
    }
  }
  test.skip(true, `môi trường: căn ${i.room.roomNo} kín mọi khoảng thử (409)`);
  throw new Error('unreachable');
}

// ───────────────────────── quotes / holds ─────────────────────────

export interface Quote {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  totalVnd?: number;
  depositVnd?: number;
  version: number;
  [k: string]: unknown;
}

export function quoteInput(
  c: S2Context,
  i: { room: Room; arrival: string; nights: number; adults?: number; kind?: ChannelKind },
): Record<string, unknown> {
  return {
    type: 'short',
    roomId: i.room.id,
    arrivalDate: i.arrival,
    nights: i.nights,
    adults: i.adults ?? 2,
    channelId: channel(c, i.kind ?? 'direct').id,
  };
}

export async function saveQuote(
  ctx: APIRequestContext,
  s: StaffSession,
  body: Record<string, unknown>,
): Promise<ApiResult<Quote & ProblemFields>> {
  return call<Quote & ProblemFields>(ctx, 'POST', `/v1/properties/${propertyIdOf(s)}/quotes`, {
    session: s,
    idempotencyKey: true,
    body,
  });
}

export async function createHold(
  ctx: APIRequestContext,
  s: StaffSession,
  quoteId: string,
  holdHours: number,
): Promise<ApiResult<Reservation & ProblemFields>> {
  return call<Reservation & ProblemFields>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/quotes/${quoteId}/actions/create-hold`,
    { session: s, idempotencyKey: true, body: { holdHours } },
  );
}

/**
 * saveQuote + createHoldFromQuote for `actor` on the first free room of `rooms` (arrival fixed by the caller).
 * Returns the hold and its quote. Tracks the hold for cleanup.
 */
export async function makeHold(
  ctx: APIRequestContext,
  actor: StaffSession,
  c: S2Context,
  i: {
    rooms: Room[];
    arrival: string;
    nights: number;
    holdHours: number;
    adults?: number;
    guestId?: string;
  },
): Promise<{ hold: Reservation; quote: Quote; room: Room }> {
  const guestId = i.guestId ?? (await newGuest(ctx, actor));
  // BR-113: ngày đến T6/T7/ngày đặc biệt cần ≥ 2 đêm (saveQuote → MIN_STAY_NOT_MET)
  i = { ...i, nights: Math.max(i.nights, minStayFor(i.arrival)) };
  const departure = addDays(i.arrival, i.nights);
  for (const rm of i.rooms) {
    if ((await isRoomFree(ctx, actor, rm, i.arrival, departure)) === false) continue;
    const q = await saveQuote(ctx, actor, {
      ...quoteInput(c, { room: rm, arrival: i.arrival, nights: i.nights, adults: i.adults ?? 2 }),
      guestId,
    });
    expect(q.status, `saveQuote: ${JSON.stringify(q.body)}`).toBe(201);
    const h = await createHold(ctx, actor, q.body.id, i.holdHours);
    if (h.status === 409) continue;
    expect(h.status, `createHoldFromQuote: ${JSON.stringify(h.body)}`).toBe(201);
    track('reservation', h.body.id);
    return { hold: h.body, quote: q.body, room: rm };
  }
  test.skip(true, `môi trường: không còn căn trống để giữ chỗ từ ${i.arrival}`);
  throw new Error('unreachable');
}

// ───────────────────────── room blocks ─────────────────────────

export async function createRoomBlock(
  ctx: APIRequestContext,
  s: StaffSession,
  body: Record<string, unknown>,
): Promise<ApiResult<{ id: string; status: string; version: number } & ProblemFields>> {
  const r = await call<{ id: string; status: string; version: number } & ProblemFields>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/room-blocks`,
    { session: s, idempotencyKey: true, body },
  );
  if (r.status === 201) track('roomBlock', r.body.id);
  return r;
}

// ───────────────────────── cleanup registry ─────────────────────────

type Tracked = { kind: 'reservation' | 'roomBlock'; id: string };
const tracked: Tracked[] = [];

export function track(kind: Tracked['kind'], id: string): void {
  tracked.push({ kind, id });
}

/**
 * Best effort: cancel what this test created (owner, reason "other"), so the room-nights are free again on a
 * shared stack. Failures are ignored (already cancelled / no_show / endpoint missing).
 */
export async function cleanupTracked(ctx: APIRequestContext): Promise<void> {
  if (tracked.length === 0) return;
  const items = tracked.splice(0);
  let owner: StaffSession;
  try {
    owner = await session(ctx, 'qa.owner');
  } catch {
    return;
  }
  const pid = propertyIdOf(owner);
  for (const t of items) {
    try {
      if (t.kind === 'reservation') {
        const cur = await getReservation(ctx, owner, t.id);
        if (cur.status !== 200 || !['hold', 'confirmed'].includes(cur.body.status)) continue;
        await action(
          ctx,
          owner,
          t.id,
          'cancel',
          { reasonCode: 'other', note: 'E2E dọn dữ liệu' },
          {
            version: cur.body.version,
          },
        );
      } else {
        await call(ctx, 'POST', `/v1/properties/${pid}/room-blocks/${t.id}/actions/cancel`, {
          session: owner,
          idempotencyKey: true,
          body: { reason: 'E2E dọn dữ liệu' },
        });
      }
    } catch {
      /* best effort */
    }
  }
}

// ───────────────────────── misc ─────────────────────────

/** Problem.conflicts[] nights (ROOM_UNAVAILABLE) flattened. */
export function conflictNights(p: ProblemFields): string[] {
  const out: string[] = [];
  for (const c of (p.conflicts as Array<{ nights?: string[] }> | undefined) ?? []) {
    out.push(...(c.nights ?? []));
  }
  return out;
}

export function fieldCodes(p: ProblemFields): string[] {
  return (p.errors ?? []).map((e) => `${e.field ?? ''}:${e.code ?? ''}`);
}

/** Oracle person input (adults + childrenAges) → API counts (BR-110: under 6 not counted, 6–11 counted). */
export function paxOf(input: Record<string, unknown>): {
  adults: number;
  children6to11: number;
  childrenUnder6: number;
} {
  const ages = (input.childrenAges as number[] | undefined) ?? [];
  return {
    adults: Number(input.adults ?? 2),
    children6to11: ages.filter((a) => a >= 6 && a <= 11).length,
    childrenUnder6: ages.filter((a) => a < 6).length,
  };
}

export interface QuoteCalc {
  totalVnd?: number;
  depositVnd?: number;
  losDiscountPct?: number;
  nightlyRates?: Array<{ date: string; amountVnd: number }>;
  commission?: { amountVnd?: number; ratePct?: number };
  ottimoRemainingVnd?: number;
  longStayAlternative?: { termMonths?: number; totalVnd?: number; mandatory?: boolean };
  availability?: { available?: boolean; alternatives?: string[] };
  warnings?: string[];
  [k: string]: unknown;
}

export async function calculateQuote(
  ctx: APIRequestContext,
  s: StaffSession,
  body: Record<string, unknown>,
): Promise<ApiResult<QuoteCalc & Problem>> {
  return call<QuoteCalc & Problem>(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/quotes/calculate`,
    { session: s, body },
  );
}

/** Skip when a fixed oracle date is no longer in the future of the stack (oracle examples are dated 2026). */
export function needFutureDate(date: string, today: string, tc: string): void {
  test.skip(date <= today, `${tc}: ngày ví dụ BR ${date} đã qua so với hôm nay của stack ${today}`);
}
