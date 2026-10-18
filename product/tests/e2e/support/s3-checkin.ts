// Helpers riêng của nhóm L3 (nhận phòng, giấy tờ C3, khai báo, xóa ảnh) – checkin.s3.api.spec.ts và
// checkin.s3.clock.spec.ts. Chỉ gói lại các lời gọi của support/s3.ts; không thay đổi hành vi harness dùng chung.
import { expect, type APIRequestContext } from '@playwright/test';
import {
  call,
  propertyIdOf,
  session,
  versionTag,
  type ApiResult,
  type StaffSession,
} from './api.js';
import { setClock } from './clock.js';
import { addDays, freeWindow, type ProblemFields, type Room, type S2Context } from './s2.js';
import {
  EP3,
  PRIVACY_NOTICE,
  IMAGE_RETENTION_DAYS,
  dev,
  getRegistration,
  makeStay,
  p3,
  stepUp,
  transitionReg,
  useVirtualDevice,
  completeReview,
  stackSql,
  type GuestDocument,
  type Registration,
  type Stay,
  type StayInput,
} from './s3.js';

export type Reg = Registration & ProblemFields;

/** Phòng nhỏ (định mức 2, tối đa 3) – các ca không phụ thuộc giá/sức chứa. */
export const SMALL_ROOMS = ['101', '102', '103', '201', '202', '203'];

export function anyRoom(c: S2Context, list = SMALL_ROOMS): Room {
  const no = list[Math.floor(Math.random() * list.length)]!;
  const r = c.rooms.find((x) => x.roomNo === no);
  if (!r) throw new Error(`DS-E: không có căn ${no}`);
  return r;
}

/**
 * makeStay() trên khoảng ngày xa còn trống (project api – đồng hồ thật, không nhận phòng). Đụng 409 (worker song
 * song vừa chiếm khoảng) → chọn khoảng khác, tối đa 4 lần.
 */
export async function farStay(
  ctx: APIRequestContext,
  c: S2Context,
  s: StaffSession,
  today: string,
  i: Omit<StayInput, 'arrival' | 'room'> & { room?: Room },
): Promise<Stay> {
  let last: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const rm = i.room ?? anyRoom(c);
    const w = await freeWindow(ctx, s, rm, i.nights ?? 1, { today });
    try {
      return await makeStay(ctx, c, s, { ...i, room: rm, arrival: w.arrival });
    } catch (e) {
      last = e;
      if (!String((e as Error).message).includes('409')) throw e;
    }
  }
  throw last as Error;
}

export async function regOf(ctx: APIRequestContext, s: StaffSession, regId: string): Promise<Reg> {
  const r = await getRegistration(ctx, s, regId);
  expect(r.status, `getRegistration: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body;
}

export function mainDoc(reg: Registration): GuestDocument {
  const d = reg.documents.find((x) => x.isMain);
  expect(d, `giấy tờ người đứng tên: ${JSON.stringify(reg.documents)}`).toBeTruthy();
  return d!;
}

export function checkOf(doc: GuestDocument, code: string): string | undefined {
  return doc.checks.find((x) => x.code === code)?.result;
}

/** warningNotes cho mọi mục fail/unverified chưa xử lý (unverified → kiểm tay "Đạt"). */
export function reviewNotes(reg: Registration): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const d of reg.documents) {
    for (const x of d.checks) {
      if (x.result !== 'fail' && x.result !== 'unverified') continue;
      if (x.handledNote && (x.result === 'fail' || x.manualResult)) continue;
      out.push({
        documentId: d.id,
        checkCode: x.code,
        note: 'E2E: le tan da kiem ban goc',
        ...(x.result === 'unverified' ? { manualResult: 'pass' } : {}),
      });
    }
  }
  return out;
}

/** P02b tại quầy cho một giấy tờ (người = id giấy tờ khi chưa gắn party – BE-C giả định 2). */
export async function consentFor(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  documentId: string,
  decision: 'granted' | 'refused',
): Promise<ApiResult<Reg>> {
  return call(ctx, 'POST', p3(EP3.recordImageConsent, s, { registrationId: regId }), {
    session: s,
    idempotencyKey: true,
    body: {
      partyMemberId: documentId,
      purpose: 'P02B_ID_IMAGE_RETENTION',
      decision,
      noticeVersion: PRIVACY_NOTICE,
      retentionDays: IMAGE_RETENTION_DAYS,
      locale: 'vi',
      channel: 'desk',
    },
  });
}

/** review → scanned: đồng ý cho mọi giấy tờ có ảnh chưa ghi, ghi chú mọi mục cần xử lý. */
export async function toScanned(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  decision: 'granted' | 'refused' = 'granted',
): Promise<Reg> {
  let reg = await regOf(ctx, s, regId);
  for (const d of reg.documents) {
    if ((d.imageIds?.length ?? 0) > 0 && d.imageConsent === 'not_recorded') {
      const r = await consentFor(ctx, s, regId, d.id, decision);
      expect(r.status, `recordImageConsent: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(201);
    }
  }
  reg = await regOf(ctx, s, regId);
  const r = await completeReview(ctx, s, regId, reviewNotes(reg));
  expect(r.status, `completeRegistrationReview: ${JSON.stringify(r.body).slice(0, 400)}`).toBe(200);
  expect(r.body.status).toBe('scanned');
  return r.body;
}

/** scanned → sent (mã hồ sơ cổng) → confirmed. */
export async function toConfirmed(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
): Promise<Reg> {
  const cur = await regOf(ctx, s, regId);
  const kinds =
    cur.kind === 'mixed' ? ['foreigner_temp_residence', 'vn_citizen_stay'] : [undefined];
  for (const kind of kinds) {
    const sent = await transitionReg(ctx, s, regId, 'mark-sent', {
      portalReference: `E2E-${Date.now().toString(36).toUpperCase()}`,
      ...(kind ? { kind } : {}),
    });
    expect(sent.status, `mark-sent: ${JSON.stringify(sent.body).slice(0, 300)}`).toBe(200);
  }
  const conf = await transitionReg(ctx, s, regId, 'mark-confirmed');
  expect(conf.status, `mark-confirmed: ${JSON.stringify(conf.body).slice(0, 300)}`).toBe(200);
  expect(conf.body.status).toBe('confirmed');
  return conf.body;
}

/** getDocumentImage từ máy quầy (cửa sổ step-up phải đang mở). */
export async function getImage(
  ctx: APIRequestContext,
  s: StaffSession,
  regId: string,
  documentId: string,
  imageId: string,
  reason?: string,
): Promise<ApiResult<unknown>> {
  return call(
    ctx,
    'GET',
    p3(EP3.getDocumentImage, s, { registrationId: regId, documentId, imageId }),
    { ...dev(s), ...(reason ? { query: { reason } } : {}) },
  );
}

export interface C3Entry {
  occurredAt: string;
  actorType: string;
  userName?: string;
  subjectType: string;
  action: string;
  reservationCode?: string;
  subjectLabel?: string;
  reasonCode?: string;
  [k: string]: unknown;
}

/** listC3AccessLog (OWN/MGR) của một đơn. */
export async function c3Log(
  ctx: APIRequestContext,
  reservationId: string,
  viewer = 'qa.owner',
): Promise<C3Entry[]> {
  const o = await session(ctx, viewer);
  const r = await call<{ data: C3Entry[] }>(ctx, 'GET', p3(EP3.listC3AccessLog, o), {
    session: o,
    query: { reservationId, limit: 100 },
  });
  expect(r.status, `listC3AccessLog: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body.data;
}

export interface AttentionItem {
  kind: string;
  severity: string;
  count?: number;
  reservationIds?: string[];
  dueAt?: string;
  [k: string]: unknown;
}

export async function attention(ctx: APIRequestContext, s: StaffSession): Promise<AttentionItem[]> {
  const r = await call<{ data: AttentionItem[] }>(ctx, 'GET', p3(EP3.listAttentionItems, s), {
    session: s,
  });
  expect(r.status, `listAttentionItems: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
  return r.body.data;
}

/** Mục "Cần chú ý" về khai báo/thị thực có chứa đơn này. */
export function regAttentionOf(items: AttentionItem[], reservationId: string): AttentionItem[] {
  return items.filter(
    (x) =>
      ['registration_due', 'registration_overdue', 'visa_expiring'].includes(x.kind) &&
      (x.reservationIds ?? []).includes(reservationId),
  );
}

export interface RegSummary {
  id: string;
  reservationId: string;
  status: string;
  deadlineAt?: string;
  deadlineLabel: string;
  isOverdue: boolean;
  kind: string;
  requiredCount: number;
  submittedCount: number;
}

/** listRegistrations (mọi trang) → dòng của đơn, hoặc undefined. */
export async function regRow(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  view: 'action_needed' | 'needs_update' | 'all' = 'all',
): Promise<RegSummary | undefined> {
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const l = await call<{ data: RegSummary[]; page: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      p3(EP3.listRegistrations, s),
      { session: s, query: { view, limit: 100, cursor } },
    );
    expect(l.status, `listRegistrations: ${JSON.stringify(l.body).slice(0, 200)}`).toBe(200);
    const hit = l.body.data.find((x) => x.reservationId === reservationId);
    if (hit) return hit;
    cursor = l.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return undefined;
}

/** Mốc giờ của ví dụ BR chuyển sang ngày ảo D (giữ giờ, giữ độ lệch ngày giữa đầu vào và kết quả). */
export function onDay(D: string, inputIso: string, expectedIso: string): [string, string] {
  const d0 = inputIso.slice(0, 10);
  const d1 = expectedIso.slice(0, 10);
  const diff = Math.round(
    (new Date(`${d1}T00:00:00Z`).getTime() - new Date(`${d0}T00:00:00Z`).getTime()) / 86_400_000,
  );
  return [
    `${D}T${inputIso.slice(11, 19)}+07:00`,
    `${addDays(D, diff)}T${expectedIso.slice(11, 19)}+07:00`,
  ];
}

/** setClock + thiết bị quầy ảo (project clock – mọi lần tua). */
export async function at(ctx: APIRequestContext, iso: string): Promise<string> {
  const now = await setClock(ctx, iso);
  await useVirtualDevice(ctx, now);
  return now;
}

/** updateReservation (PATCH) với If-Match = version hiện tại. */
export async function patchReservation(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  version: number,
  body: Record<string, unknown>,
): Promise<ApiResult<Record<string, unknown> & ProblemFields>> {
  return call(ctx, 'PATCH', `/v1/properties/${propertyIdOf(s)}/reservations/${reservationId}`, {
    session: s,
    ifMatch: versionTag(version),
    body,
  });
}

/**
 * Trạng thái buồng SM-03 đã lưu của căn (room_status). listRoomStatuses là Sprint 4 và getRack.roomStatus vẫn suy
 * từ dữ liệu hôm nay (rack.service – không đọc room_status) → đọc DB của stack dùng một lần.
 */
export function roomStatusOf(roomId: string): string {
  return sqlValue(`SELECT status FROM room_status WHERE room_id = '${roomId}';`);
}

/**
 * Giả lập trạng thái buồng lưu (SM-03) trên stack dùng một lần – chuyển trạng thái buồng phòng là Sprint 4
 * (transitionRoomStatus chưa có), khối OOO không tạo được trên căn đã có đơn (409).
 */
export function simulateRoomStatus(roomId: string, status: string): void {
  stackSql(
    `INSERT INTO room_status (room_id, organization_id, property_id, status, since)
       SELECT id, organization_id, property_id, '${status}', now() FROM room WHERE id = '${roomId}'
     ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, version = room_status.version + 1;`,
  );
}

/** Một giá trị từ DB của stack dùng một lần (bằng chứng phần Sprint 4 chưa có API: hk_task, retention_run). */
export function sqlValue(sql: string): string {
  return stackSql(sql).trim();
}

/** Lịch sử đơn (getReservationHistory). */
export async function historyOf(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
): Promise<Array<Record<string, unknown>>> {
  const r = await call<{ data: Array<Record<string, unknown>> }>(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(s)}/reservations/${reservationId}/history`,
    { session: s, query: { limit: 100 } },
  );
  expect(r.status, `getReservationHistory: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body.data;
}

/** Trả phòng B18: kiểm minibar (còn đủ mức chuẩn) nếu căn có tủ, rồi checkOut với If-Match. */
export async function checkOutStay(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  checkoutTime: string,
  extra: Record<string, unknown> = {},
): Promise<ApiResult<Record<string, unknown> & ProblemFields>> {
  const pid = propertyIdOf(s);
  const std = await call<{
    roomId?: string;
    periodId?: string | null;
    items: Array<{ itemId: string; standardQty: number }>;
  }>(ctx, 'GET', `/v1/properties/${pid}/reservations/${reservationId}/minibar-standard`, {
    session: s,
  });
  if (std.status === 200 && std.body.items.length > 0) {
    const m = await call(
      ctx,
      'POST',
      `/v1/properties/${pid}/reservations/${reservationId}/minibar-checks`,
      {
        session: s,
        idempotencyKey: true,
        // tủ + kỳ của bản chuẩn vừa đọc (BUG-R2-196: thiếu `roomId`/`periodId` → 422)
        body: {
          mode: 'checkout',
          roomId: std.body.roomId,
          periodId: std.body.periodId ?? null,
          lines: std.body.items.map((i) => ({ itemId: i.itemId, remainingQty: i.standardQty })),
        },
      },
    );
    expect(m.status, `recordMinibarCheck: ${JSON.stringify(m.body).slice(0, 300)}`).toBe(201);
  }
  const cur = await call<{ version: number }>(
    ctx,
    'GET',
    `/v1/properties/${pid}/reservations/${reservationId}`,
    { session: s },
  );
  return call(
    ctx,
    'POST',
    `/v1/properties/${pid}/reservations/${reservationId}/actions/check-out`,
    {
      session: s,
      idempotencyKey: true,
      ifMatch: versionTag(cur.body.version),
      body: { checkoutTime, ...extra },
    },
  );
}

/** setParameter (qa.owner) có hiệu lực từ `effectiveFrom`. */
export async function setParam(
  ctx: APIRequestContext,
  owner: StaffSession,
  key: string,
  value: unknown,
  effectiveFrom: string,
  reason = 'E2E QA L3 – khôi phục ngay sau ca',
): Promise<ApiResult<Record<string, unknown> & ProblemFields>> {
  return call(ctx, 'PUT', `/v1/properties/${propertyIdOf(owner)}/parameters/${key}`, {
    session: owner,
    body: { value, effectiveFrom, reason },
  });
}

/** getReservation của đơn con (B9a / B13 OTA) qua listReservations: cùng căn, có parentReservationId. */
export async function childOf(
  ctx: APIRequestContext,
  s: StaffSession,
  parentId: string,
  stayFrom: string,
  stayTo: string,
): Promise<Record<string, unknown> | undefined> {
  const pid = propertyIdOf(s);
  const l = await call<{ data: Array<{ id: string }> }>(
    ctx,
    'GET',
    `/v1/properties/${pid}/reservations`,
    {
      session: s,
      query: { stayFrom, stayTo, limit: 100 },
    },
  );
  expect(l.status, `listReservations: ${JSON.stringify(l.body).slice(0, 200)}`).toBe(200);
  for (const x of l.body.data) {
    if (x.id === parentId) continue;
    const r = await call<Record<string, unknown>>(
      ctx,
      'GET',
      `/v1/properties/${pid}/reservations/${x.id}`,
      {
        session: s,
      },
    );
    if (r.body.parentReservationId === parentId) return r.body;
  }
  return undefined;
}

export { stepUp };
