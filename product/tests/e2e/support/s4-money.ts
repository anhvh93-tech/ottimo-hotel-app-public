// Sprint 4 – helpers for the money cases (S4-01/02/05/07/18/21/22/23/34, BR-402, B-6). Contract: docs/api/openapi.yaml
// 0.3.7 (D1 freeze). Every amount the case checks comes from fixtures/br-examples.json (oracle()); this file only maps
// an oracle stay onto a free window with the SAME weekday pattern (giá đêm thường/cuối tuần như ví dụ BR) and reads
// folio / approval / audit state back.
//
// Window strategy (project api, real clock): arrival in today + 200…360 days – the far end of the 365-day booking window
// (booking_window_days, OUTSIDE_BOOKING_WINDOW), mostly beyond the 30…320 windows of the Sprint 2/3 api cases, and
// every room the case moves to is checked free first. Clock cases use virtualDay() instead.
import { readFileSync } from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, propertyIdOf, session, type ApiResult, type StaffSession } from './api.js';
import { PRODUCT_DIR, SEED_PASSWORD } from './env.js';
import {
  action,
  addDays,
  createReservation,
  getReservation,
  isRoomFree,
  isSpecialDate,
  newGuest,
  nightsOf,
  reservationBody,
  track,
  weekday,
  type BookInput,
  type ProblemFields,
  type Reservation,
  type Room,
  type S2Context,
} from './s2.js';
import { EP3, approve, getFolio, liveLines, p3, type Folio, type FolioLine } from './s3.js';

type Ep = [method: string, path: string, operationId: string];
const R = '/v1/properties/{propertyId}';
const RS = `${R}/reservations/{reservationId}`;
export const EP4 = {
  previewMoveReservation: ['GET', `${RS}/move-preview`, 'previewMoveReservation'],
  moveReservation: ['POST', `${RS}/actions/move`, 'moveReservation'],
  listAuditEvents: ['GET', `${R}/audit-events`, 'listAuditEvents'],
  listMyNotifications: ['GET', '/v1/me/notifications', 'listMyNotifications'],
} satisfies Record<string, Ep>;

// ───────────────────────── oracle stay → test window ─────────────────────────

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** Maps an oracle date onto the test window (same offset from the arrival date → same weekday). */
export function mapper(oracleArrival: string, arrival: string): (oracleDate: string) => string {
  expect(weekday(arrival), `cửa sổ test phải cùng thứ với ví dụ BR (${oracleArrival})`).toBe(
    weekday(oracleArrival),
  );
  return (d: string) => addDays(arrival, daysBetween(oracleArrival, d));
}

/** Re-keys an oracle `{date: value}` map onto the test window. */
export function remap<T>(m: Record<string, T>, map: (d: string) => string): Record<string, T> {
  return Object.fromEntries(Object.entries(m).map(([d, v]) => [map(d), v]));
}

/**
 * A window of `span` days (the longest stay the case reaches) starting on weekday `dow`, no special date
 * (BR-103/113) from 2 days before to 2 days after, where EVERY room of `rooms` is free.
 */
export async function moneyWindow(
  ctx: APIRequestContext,
  s: StaffSession,
  rooms: Room[],
  span: number,
  o: { today: string; dow: number; minOffset?: number; maxOffset?: number },
): Promise<string> {
  const min = o.minOffset ?? 200;
  const max = o.maxOffset ?? 360;
  for (let i = 0; i < 40; i++) {
    let d = addDays(o.today, min + Math.floor(Math.random() * (max - min)));
    while (weekday(d) !== o.dow) d = addDays(d, 1);
    if (daysBetween(o.today, d) > 363) continue; // booking_window_days 365 (B7 dời +1 ngày vẫn trong cửa sổ)
    if (nightsOf(addDays(d, -2), addDays(d, span + 2)).some(isSpecialDate)) continue;
    let free = true;
    for (const rm of rooms) {
      if ((await isRoomFree(ctx, s, rm, d, addDays(d, span))) === false) {
        free = false;
        break;
      }
    }
    if (free) return d;
  }
  test.skip(
    true,
    `môi trường: không tìm được ${span} ngày trống cho ${rooms.map((r) => r.roomNo)}`,
  );
  throw new Error('unreachable');
}

export type MoneyBooking = Reservation & { folioId: string; totalRoomVnd?: number };

/**
 * Books `room` for [arrival, arrival + nights) on a window where `alsoFree` rooms are free for `span` days
 * (default = nights). Retries another window on 409 (shared stack). Tracked → cancelled in afterEach.
 */
export async function bookMoney(
  ctx: APIRequestContext,
  c: S2Context,
  s: StaffSession,
  i: Omit<BookInput, 'arrival' | 'departure'> & {
    today: string;
    dow: number;
    nights: number;
    span?: number;
    alsoFree?: Room[];
    /** rate of every night (nightlyRates) – giá thỏa thuận (BR-429 (g)) */
    rate?: number;
  },
): Promise<MoneyBooking> {
  const span = Math.max(i.span ?? i.nights, i.nights);
  const guestId = i.guestId ?? (await newGuest(ctx, s));
  for (let attempt = 0; attempt < 6; attempt++) {
    const arrival = await moneyWindow(ctx, s, [i.room, ...(i.alsoFree ?? [])], span, {
      today: i.today,
      dow: i.dow,
    });
    const departure = addDays(arrival, i.nights);
    const extra: Record<string, unknown> = { ...(i.extra ?? {}) };
    if (i.rate !== undefined) {
      extra.nightlyRates = nightsOf(arrival, departure).map((date) => ({
        date,
        amountVnd: i.rate,
      }));
    }
    const r = await createReservation(
      ctx,
      s,
      reservationBody(c, { ...i, guestId, arrival, departure, extra }),
    );
    if (r.status === 409) continue;
    expect(
      r.status,
      `createReservation ${i.room.roomNo} ${arrival}: ${JSON.stringify(r.body)}`,
    ).toBe(201);
    track('reservation', r.body.id);
    const fresh = await getReservation(ctx, s, r.body.id);
    expect(fresh.body.folioId, 'đơn có folio').toBeTruthy();
    return fresh.body as MoneyBooking;
  }
  test.skip(true, `môi trường: căn ${i.room.roomNo} kín mọi khoảng thử (409)`);
  throw new Error('unreachable');
}

// ───────────────────────── B7 xem trước / ghi ─────────────────────────

export interface MovePreviewBody {
  pricingBasis?: string;
  roomId?: string;
  roomNo?: string;
  roomName?: string | null;
  arrivalDate?: string;
  departureDate?: string;
  nights?: Array<{
    date: string;
    oldRateVnd?: number | null;
    newRateVnd: number;
    roomChangeDifferenceVnd?: number;
    focVnd?: number;
    pendingFocVnd?: number;
    suggestedRateVnd?: number;
  }>;
  removedNights?: string[];
  roomTotalOldVnd?: number;
  roomTotalNewVnd?: number;
  extraPersonOldVnd?: number;
  extraPersonNewVnd?: number;
  roomChangeDifferenceVnd?: number;
  folioDeltaVnd?: number;
  losDiscountPct?: number;
  returningGuestDiscountPct?: number;
  depositPaidVnd?: number;
  balanceDueAfterVnd?: number;
  warnings?: Array<{ code: string; field?: string }>;
}

export interface MoveInput {
  roomId?: string;
  arrivalDate?: string;
  departureDate?: string;
  reasonCode: string;
  note?: string;
  applyDifference?: boolean;
  expectedDeltaVnd?: number;
  [k: string]: unknown;
}

/** previewMoveReservation (GET, read-only – no Idempotency-Key / If-Match). */
export async function previewMove(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  q: Omit<MoveInput, 'applyDifference' | 'expectedDeltaVnd' | 'note'>,
): Promise<ApiResult<MovePreviewBody & ProblemFields>> {
  return call(ctx, 'GET', p3(EP4.previewMoveReservation, s, { reservationId }), {
    session: s,
    query: q as Record<string, string>,
  });
}

/** moveReservation with If-Match = current version (+ fresh Idempotency-Key unless given). */
export async function move(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  body: MoveInput,
  opts: { idempotencyKey?: string; version?: number } = {},
): Promise<ApiResult<Reservation & ProblemFields>> {
  return action(ctx, s, reservationId, 'move', body, opts);
}

/**
 * Guest-request move the way the Desk does it (BR-429 (d)): preview → "Đã báo khách" → write with
 * expectedDeltaVnd = preview.folioDeltaVnd. Asserts the preview answered 200 and the write did NOT come back
 * 409 SURCHARGE_CHANGED (critic #10: xem trước = lệnh ghi).
 */
export async function previewThenMove(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  q: {
    roomId?: string;
    arrivalDate?: string;
    departureDate?: string;
    reasonCode: string;
    note?: string;
  },
): Promise<{ preview: MovePreviewBody; res: Reservation }> {
  const { note, ...query } = q;
  const p = await previewMove(ctx, s, reservationId, query);
  expect(p.status, `previewMoveReservation: ${JSON.stringify(p.body)}`).toBe(200);
  expect(typeof p.body.folioDeltaVnd, 'MovePreview.folioDeltaVnd').toBe('number');
  const w = await move(ctx, s, reservationId, {
    ...query,
    ...(note ? { note } : {}),
    applyDifference: true,
    expectedDeltaVnd: p.body.folioDeltaVnd,
  });
  expect(
    w.status,
    `moveReservation sau xem trước (xem trước = lệnh ghi, không 409): ${JSON.stringify(w.body)}`,
  ).toBe(200);
  return { preview: p.body, res: w.body };
}

// ───────────────────────── FOC / giảm giá đặc biệt (SM-10) ─────────────────────────

export interface ApprovalRow {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  effectiveAmountVnd?: number;
  focState?: string;
  focCancelReason?: string;
  autoCancelReason?: string;
  lineChangedNote?: {
    oldLineVnd: number;
    newLineVnd: number;
    cause: string;
    fromServiceDate?: string;
    toServiceDate?: string;
  } | null;
  folioLineId?: string;
  reservationCode?: string;
  targetCode?: string;
  requiredRole?: string;
  approverRemainingMonthlyVnd?: number;
  version?: number;
  [k: string]: unknown;
}

/** requestFoc (kind foc | special_discount) on a folio line. */
export async function requestReduction(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
  lineId: string,
  b: { kind?: 'foc' | 'special_discount'; amountVnd: number; reasonCode?: string; note?: string },
): Promise<ApiResult<ApprovalRow & ProblemFields>> {
  return call(ctx, 'POST', p3(EP3.requestFoc, s, { folioId, lineId }), {
    session: s,
    idempotencyKey: true,
    body: {
      kind: b.kind ?? 'foc',
      amountVnd: b.amountVnd,
      reasonCode: b.reasonCode ?? 'service_recovery',
      ...(b.note ? { note: b.note } : {}),
    },
  });
}

/** requestFoc then approve (approver's own password – R2 has no PIN). Returns the approved request. */
export async function approvedReduction(
  ctx: APIRequestContext,
  requester: StaffSession,
  approver: StaffSession,
  folioId: string,
  lineId: string,
  b: { kind?: 'foc' | 'special_discount'; amountVnd: number; reasonCode?: string },
): Promise<ApprovalRow> {
  const q = await requestReduction(ctx, requester, folioId, lineId, b);
  expect(q.status, `requestFoc ${b.kind ?? 'foc'} ${b.amountVnd}: ${JSON.stringify(q.body)}`).toBe(
    201,
  );
  const a = await approve(ctx, approver, q.body.id);
  expect(a.status, `approveRequest: ${JSON.stringify(a.body)}`).toBe(200);
  expect(a.body.status).toBe('approved');
  return a.body as unknown as ApprovalRow;
}

/** One approval request by id from the viewer's queue (OWN/MGR see every request of the property). */
export async function approvalById(
  ctx: APIRequestContext,
  viewer: StaffSession,
  id: string,
): Promise<ApprovalRow> {
  let cursor: string | undefined;
  for (let page = 0; page < 30; page++) {
    const r = await call<{ data: ApprovalRow[]; page?: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      p3(EP3.listApprovalRequests, viewer),
      { session: viewer, query: { limit: 100, cursor } },
    );
    expect(r.status, `listApprovalRequests: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
    const hit = r.body.data.find((a) => a.id === id);
    if (hit) return hit;
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  throw new Error(`listApprovalRequests (${viewer.username}): không thấy yêu cầu ${id}`);
}

/** Remaining monthly FOC limit of the viewer (BR-433) – null when the viewer has no monthly limit. */
export async function remainingMonthly(
  ctx: APIRequestContext,
  viewer: StaffSession,
): Promise<number | undefined> {
  const r = await call<{ data: ApprovalRow[] }>(ctx, 'GET', p3(EP3.listApprovalRequests, viewer), {
    session: viewer,
    query: { limit: 100 },
  });
  expect(r.status).toBe(200);
  return r.body.data.find((a) => a.approverRemainingMonthlyVnd !== undefined)
    ?.approverRemainingMonthlyVnd;
}

// ───────────────────────── folio reading ─────────────────────────

const NIGHT_CATEGORIES = new Set(['room', 'extra_person', 'room_change_difference']);

/** The live line of `category` on `date` (exactly one expected). */
export function lineOn(f: Folio, category: string, date: string): FolioLine {
  const ls = liveLines(f, category).filter((l) => l.serviceDate === date);
  expect(
    ls.length,
    `folio: đúng 1 dòng ${category} sống ngày ${date} – ${JSON.stringify(ls)}`,
  ).toBe(1);
  return ls[0]!;
}

/** Live lines of `category` on `date` (0 or more). */
export function linesOn(f: Folio, category: string, date: string): FolioLine[] {
  return liveLines(f, category).filter((l) => l.serviceDate === date);
}

/** Live FOC (`foc`) / special discount (`discount`) lines reducing `lineId` (positive amounts). */
export function reductionsOf(f: Folio, lineId: string, category?: 'foc' | 'discount'): number[] {
  return [...liveLines(f, 'foc'), ...liveLines(f, 'discount')]
    .filter((l) => l.relatedLineId === lineId && (!category || l.category === category))
    .map((l) => -l.amountVnd);
}

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** Live reduction on the line of `category` on `date` (0 when the line or the reduction is absent). */
export function reductionOn(
  f: Folio,
  category: string,
  date: string,
  kind?: 'foc' | 'discount',
): number {
  return sum(linesOn(f, category, date).flatMap((l) => reductionsOf(f, l.id, kind)));
}

/** Net of one night: room + extra person + room change difference − their FOC/discounts. */
export function nightNet(f: Folio, date: string): number {
  const lines = [...NIGHT_CATEGORIES].flatMap((cat) => linesOn(f, cat, date));
  return sum(lines.map((l) => l.amountVnd)) - sum(lines.flatMap((l) => reductionsOf(f, l.id)));
}

/** Σ live lines of a category (all dates). */
export function totalOf(f: Folio, category: string): number {
  return sum(liveLines(f, category).map((l) => l.amountVnd));
}

export async function folio(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
): Promise<Folio> {
  return getFolio(ctx, s, folioId);
}

// ───────────────────────── audit (US-006) – tập đóng money ─────────────────────────

export interface AuditRow {
  occurredAt: string;
  category: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityCode?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

let closedSet: Set<string> | null = null;

/**
 * Tập đóng `AuditEvent.action` của `category = money` – đọc thẳng mô tả trong docs/api/openapi.yaml (hợp đồng, không
 * chép tay): mọi mã `xxx.yyy` trong mô tả trường `action`, trừ đường dẫn trường (`after.*`, `before.*`) và khóa
 * chuỗi (`mlog.*`).
 */
export function moneyActionSet(): Set<string> {
  if (closedSet) return closedSet;
  const yaml = readFileSync(`${PRODUCT_DIR}docs/api/openapi.yaml`, 'utf8');
  const start = yaml.indexOf('\n    AuditEvent:\n');
  expect(start, 'openapi.yaml: không thấy schema AuditEvent').toBeGreaterThan(0);
  const block = yaml.slice(start, yaml.indexOf('\n        entityType:', start));
  const codes = [...block.matchAll(/`([a-z_]+\.[a-z_]+)`/g)]
    .map((m) => m[1]!)
    .filter((x) => !/^(after|before|mlog)\./.test(x));
  closedSet = new Set(codes);
  expect(closedSet.size, 'tập đóng money (openapi.yaml) có ≥ 50 mã').toBeGreaterThanOrEqual(50);
  return closedSet;
}

/**
 * Money audit events of one booking (entityCode = mã đơn), newest first. Reads up to `pages` × 100 events of today
 * onwards (audit has no entity filter – call right after the action).
 */
export async function moneyEventsOf(
  ctx: APIRequestContext,
  viewer: StaffSession,
  code: string,
  o: { from?: string; pages?: number } = {},
): Promise<AuditRow[]> {
  const out: AuditRow[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < (o.pages ?? 30); page++) {
    const r = await call<{ data: AuditRow[]; page?: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      p3(EP4.listAuditEvents, viewer),
      {
        session: viewer,
        query: { category: 'money', limit: 100, cursor, ...(o.from ? { from: o.from } : {}) },
      },
    );
    expect(r.status, `listAuditEvents: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
    out.push(...r.body.data.filter((e) => e.entityCode === code));
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return out;
}

// ───────────────────────── thông báo (StaffNotification) ─────────────────────────

export interface NotificationRow {
  id: string;
  kind: string;
  refType?: string;
  refId?: string;
  refCode?: string;
  createdAt: string;
}

export async function myNotifications(
  ctx: APIRequestContext,
  s: StaffSession,
): Promise<NotificationRow[]> {
  const r = await call<{ data: NotificationRow[] } | NotificationRow[]>(
    ctx,
    'GET',
    EP4.listMyNotifications[1],
    { session: s, query: { limit: 100 } },
  );
  expect(r.status, `listMyNotifications: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return Array.isArray(r.body) ? r.body : r.body.data;
}

// ───────────────────────── refund (B-6 expectedVersion) ─────────────────────────

/** approveRequest / rejectRequest with an explicit body (expectedVersion present/absent/stale). */
export async function decideWith(
  ctx: APIRequestContext,
  s: StaffSession,
  approvalId: string,
  act: 'approve' | 'reject',
  extra: Record<string, unknown>,
): Promise<ApiResult<ApprovalRow & ProblemFields & { currentVersion?: number }>> {
  const ep = act === 'approve' ? EP3.approveRequest : EP3.rejectRequest;
  return call(ctx, 'POST', p3(ep, s, { approvalId }), {
    session: s,
    idempotencyKey: true,
    body: {
      authMethod: 'password',
      secret: SEED_PASSWORD,
      ...(act === 'reject' ? { reason: 'E2E B-6 tu choi' } : { note: 'E2E B-6 duyet' }),
      ...extra,
    },
  });
}

export { propertyIdOf, session };
