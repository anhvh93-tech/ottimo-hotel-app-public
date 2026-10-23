// Project "clock" (tuần tự, sau mọi project API) – duyệt FOC trên folio (US-007, SM-10 A1–A6; BR-431…436, BR-008)
// và nhật ký tiền (US-006): mọi ca cần đơn ĐANG Ở (in_house) có dòng phát sinh để miễn, một số ca trả phòng ngày đi.
// Mỗi ca chạy trên NGÀY ẢO riêng (support/s3.ts virtualDay), tự đặt đồng hồ, cấp thiết bị quầy ảo, đưa mọi căn về
// VC (cleanRooms). Dòng phụ thu: trả muộn (setLateCheckout, BR-412) hoặc nhận sớm (checkIn, BR-411) trên giá đêm
// của ví dụ BR (oracle) – rồi requestFoc trên dòng đó.
// Hạn mức tháng (BR-433 lễ tân trưởng, BR-436 tự miễn minibar) tính theo THÁNG LỊCH của đồng hồ: ca nào kiểm số dư
// hạn mức chạy ở ngày ảo đầu tiên của một tháng lịch mới và giữ chỗ phần còn lại của tháng đó (ownMonthDay) – hạn
// mức bắt đầu từ 0 và ca sau (của file này hay file clock khác) không bị ảnh hưởng.
// R2 chưa có PIN: "PIN của chính mình" → mật khẩu đăng nhập (approveRequest/rejectRequest authMethod=password).
// Số tiền có ví dụ BR đọc từ oracle (fixtures/br-examples.json); hạn mức đọc từ tham số DS-E (foc_limits,
// foc_self_apply.front_desk.*) – không gõ cứng.
// TC: product/tests/test-cases/r1-main-flows.md mục 1 (TC-NT-016, TC-NT-017 (1), TC-NT-027 (luồng) … TC-NT-036).
// Phần hợp đồng của TC-NT-027 (phạm vi danh sách, id không có) và TC-NT-017 (2)(3): e2e/api/audit-approvals.api.spec.ts.
import { readFileSync } from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  activateUser,
  call,
  createThrowawayUser,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  versionTag,
  type ApiResult,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD } from '../support/env.js';
import {
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  oracleNum,
  room,
  s2Context,
  vnTime,
  type ProblemFields,
  type Room,
  type S2Context,
} from '../support/s2.js';
import {
  CAN_CLEAN_ROOMS,
  EP3,
  addLine,
  approve,
  cleanRooms,
  getFolio,
  inHouse,
  liveLines,
  makeStay,
  p3,
  payBalance,
  recordPayment,
  stackSql,
  stayAction,
  useVirtualDevice,
  virtualDay,
  type CheckInBody,
  type Folio,
  type FolioLine,
  type Stay,
} from '../support/s3.js';

// ───────────────────────── tham số DS-E (hạn mức – không gõ cứng) ─────────────────────────

const DS_E = JSON.parse(
  readFileSync(new URL('../../fixtures/seed/ds-e.json', import.meta.url), 'utf8'),
) as {
  parameters: Array<{ param: string; value: unknown }>;
  minibarItems: Array<{ code: string; name: string; salePriceVnd: number }>;
};
function dsParam<T>(key: string): T {
  const p = DS_E.parameters.find((x) => x.param === key);
  if (!p) throw new Error(`ds-e.json: thiếu tham số ${key}`);
  return p.value as T;
}
const FOC_LIMITS = dsParam<{ front_desk_lead: { perTimeVnd: number; perMonthVnd: number } }>(
  'foc_limits',
);
/** BR-433: lễ tân trưởng ≤ 300.000/lần, ≤ 1.500.000/tháng (DS-E foc_limits). */
const FDL_PER_TIME = FOC_LIMITS.front_desk_lead.perTimeVnd;
const FDL_PER_MONTH = FOC_LIMITS.front_desk_lead.perMonthVnd;
/** BR-436: lễ tân tự miễn minibar ≤ 100.000/lần, ≤ 500.000/người/tháng. */
const SELF_PER_TIME = dsParam<number>('foc_self_apply.front_desk.per_time');
const SELF_PER_MONTH = dsParam<number>('foc_self_apply.front_desk.per_month');
const LAUNDRY_PER_KG = dsParam<number>('laundry_price_per_kg');
/** Giá đêm của các ví dụ BR-411/412 (700.000) – đơn đặt đúng giá này để phụ thu khớp oracle. */
const RATE = oracle('BR-412-01').input.lastNightRateVnd as number;

// ───────────────────────── ngày ảo, tháng lịch riêng ─────────────────────────

function firstOfNextMonth(d: string): string {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * Ngày ảo là ngày ĐẦU TIÊN được dùng của một tháng lịch mới (hạn mức tháng BR-433/436 của mọi người = 0 khi ca bắt
 * đầu), và phần còn lại của tháng đó được giữ chỗ (không ca nào khác dùng) – ca kiểm số dư hạn mức tự cô lập.
 */
function ownMonthDay(realToday: string, span: number): string {
  const d0 = virtualDay(realToday, 0);
  virtualDay(realToday, daysBetween(d0, firstOfNextMonth(d0))); // bỏ phần còn lại của tháng d0
  const D = virtualDay(realToday, span);
  virtualDay(realToday, daysBetween(D, firstOfNextMonth(D))); // giữ phần còn lại của tháng D
  expect(D.slice(0, 7) > d0.slice(0, 7), `ngày ảo ${D} phải ở tháng sau ${d0}`).toBe(true);
  return D;
}

/** Đồng hồ ở D hh:mm, thiết bị quầy ảo, mọi căn VC (chỉ gọi TRƯỚC khi nhận phòng trong ngày). */
async function startDay(ctx: APIRequestContext, D: string, hhmm: string): Promise<void> {
  const now = await setClock(ctx, vnTime(D, hhmm));
  await useVirtualDevice(ctx, now);
  cleanRooms();
}

/** Tua đồng hồ trong ca (không dọn buồng) – phiên cũ hết hạn, gọi lại sessionOrSkip(). */
async function moveTo(ctx: APIRequestContext, date: string, hhmm: string): Promise<void> {
  await useVirtualDevice(ctx, await setClock(ctx, vnTime(date, hhmm)));
}

// ───────────────────────── yêu cầu duyệt (SM-10) ─────────────────────────

interface Approval {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  reasonCode: string;
  reasonNote?: string;
  requestedBy: string;
  requestedAt: string;
  requiredRole: string;
  approverName?: string;
  approverRole?: string;
  decidedAt?: string;
  decisionNote?: string;
  approverRemainingMonthlyVnd?: number;
  folioLineId?: string;
  reservationCode?: string;
  selfApplied?: boolean;
}
type ApprovalResult = ApiResult<Approval & ProblemFields & { approver?: string }>;

const CANCEL_REQUEST: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/approval-requests/{approvalId}/actions/cancel',
  'cancelRequest',
];

/** requestFoc (kind foc). `password` = người gửi xác thực lại bằng mật khẩu của chính mình (BR-436, R2 không PIN). */
async function requestFoc(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
  lineId: string,
  b: {
    amountVnd: number;
    reasonCode?: string;
    note?: string;
    password?: boolean;
    extra?: Record<string, unknown>;
  },
): Promise<ApprovalResult> {
  return call(ctx, 'POST', p3(EP3.requestFoc, s, { folioId, lineId }), {
    session: s,
    idempotencyKey: true,
    body: {
      kind: 'foc',
      amountVnd: b.amountVnd,
      reasonCode: b.reasonCode ?? 'regular_vip',
      ...(b.note ? { note: b.note } : {}),
      ...(b.password ? { authMethod: 'password', secret: SEED_PASSWORD } : {}),
      ...(b.extra ?? {}),
    },
  });
}

/** approveRequest / rejectRequest với thân tùy ý (mật khẩu sai, thiếu lý do, tài khoản tạm…). */
async function decide(
  ctx: APIRequestContext,
  s: StaffSession,
  approvalId: string,
  act: 'approve' | 'reject',
  body: Record<string, unknown>,
): Promise<ApprovalResult> {
  const ep = act === 'approve' ? EP3.approveRequest : EP3.rejectRequest;
  return call(ctx, 'POST', p3(ep, s, { approvalId }), {
    session: s,
    idempotencyKey: true,
    body,
  });
}

/** approve() của support/s3.ts (mật khẩu đăng nhập – R2 chưa có PIN: "PIN → mật khẩu") với kiểu ApprovalRequest. */
async function approveFoc(
  ctx: APIRequestContext,
  s: StaffSession,
  approvalId: string,
  note?: string,
): Promise<ApprovalResult> {
  return (await approve(ctx, s, approvalId, note)) as unknown as ApprovalResult;
}

/** Từ chối bằng mật khẩu của chính người duyệt (R2: PIN → mật khẩu), có lý do. */
async function reject(
  ctx: APIRequestContext,
  s: StaffSession,
  approvalId: string,
  reason: string,
): Promise<ApprovalResult> {
  return decide(ctx, s, approvalId, 'reject', {
    authMethod: 'password',
    secret: SEED_PASSWORD,
    reason,
  });
}

async function cancelRequest(
  ctx: APIRequestContext,
  s: StaffSession,
  approvalId: string,
): Promise<ApprovalResult> {
  return call(
    ctx,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/approval-requests/${approvalId}/actions/cancel`,
    { session: s, idempotencyKey: true },
  );
}

/** Hàng chờ duyệt theo phạm vi của người xem (mới nhất trước), tối đa 5 trang × 100. */
async function queue(
  ctx: APIRequestContext,
  s: StaffSession,
  status?: string,
): Promise<Approval[]> {
  const out: Approval[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 5; i++) {
    const r = await call<{ data: Approval[]; page: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      p3(EP3.listApprovalRequests, s),
      { session: s, query: { status, limit: 100, cursor } },
    );
    expect(r.status, `listApprovalRequests ${s.username}: ${JSON.stringify(r.body)}`).toBe(200);
    out.push(...r.body.data);
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return out;
}

/** Một yêu cầu trong hàng chờ của `s` (undefined = ngoài phạm vi người xem). */
async function rowOf(
  ctx: APIRequestContext,
  s: StaffSession,
  id: string,
): Promise<Approval | undefined> {
  return (await queue(ctx, s)).find((a) => a.id === id);
}

/**
 * Hạn mức tháng còn lại của người xem (ApprovalRequest.approverRemainingMonthlyVnd – cùng giá trị trên mọi dòng
 * hàng chờ của OWN/MGR/FDL). Lễ tân trưởng chỉ thấy yêu cầu định tuyến tới FDL + của mình + mình đã quyết
 * (`within_limit_or_own`) – yêu cầu đã escalated lên quản lý KHÔNG còn trong hàng chờ của FDL.
 */
async function remainingOf(ctx: APIRequestContext, s: StaffSession): Promise<number | undefined> {
  return (await queue(ctx, s)).find((a) => a.approverRemainingMonthlyVnd !== undefined)
    ?.approverRemainingMonthlyVnd;
}

/** Tổng FOC minibar `s` đã TỰ ÁP (BR-436) trong tháng `month` (YYYY-MM) – từ hàng chờ của chính người đó. */
async function selfAppliedIn(ctx: APIRequestContext, s: StaffSession, month: string) {
  return (await queue(ctx, s))
    .filter((a) => a.selfApplied && a.status === 'approved' && a.decidedAt?.slice(0, 7) === month)
    .reduce((sum, a) => sum + a.amountVnd, 0);
}

/** Payload hàng đợi thông báo đẩy (outbox `staff.push`, Mock ở R2) – chỉ stack dùng một lần (psql). */
function pushOf(dedupeKey: string): Record<string, unknown> | null {
  expect(dedupeKey).toMatch(/^[a-z_]+:[0-9a-f-]{36}(:[a-z_]+)?$/);
  const out = stackSql(
    `SELECT payload::text FROM outbox_message WHERE dedupe_key = '${dedupeKey}';`,
  ).trim();
  return out ? (JSON.parse(out.split('\n')[0]!) as Record<string, unknown>) : null;
}

// ───────────────────────── đơn đang ở có dòng phát sinh ─────────────────────────

interface FocStay {
  st: Stay;
  folioId: string;
  late?: FolioLine;
  early?: FolioLine;
}

/**
 * Đơn 1 đêm ngày D giá RATE (700.000, kênh Trực tiếp – trong sàn–trần BR-105), trả đủ tiền phòng, nhận phòng
 * (nhận sớm theo `early` – đồng hồ phải ≥ giờ nhận của ví dụ) và hẹn trả muộn theo `late` (setLateCheckout,
 * applySurcharge + expectedSurchargeVnd = oracle). Trả về các dòng phụ thu trên folio.
 */
async function surchargeStay(
  ctx: APIRequestContext,
  c: S2Context,
  fd: StaffSession,
  i: { room: Room; arrival: string; late?: string; early?: string },
): Promise<FocStay> {
  const earlyEx = i.early ? oracle(i.early) : null;
  if (earlyEx) expect(earlyEx.input.firstNightRateVnd).toBe(RATE);
  const checkInBody: CheckInBody | undefined = earlyEx
    ? {
        checkinTime: String(earlyEx.input.checkinTime),
        applyEarlySurcharge: true,
        expectedSurchargeVnd: Number(earlyEx.expected.surchargeVnd),
      }
    : undefined;
  const st = await inHouse(ctx, c, fd, {
    room: i.room,
    arrival: i.arrival,
    nights: 1,
    extra: { nightlyRates: [{ date: i.arrival, amountVnd: RATE }] },
    ...(checkInBody ? { checkIn: checkInBody } : {}),
  });
  const folioId = st.res.folioId!;
  expect(folioId, 'đơn có folio').toBeTruthy();
  if (i.late) {
    const lateEx = oracle(i.late);
    expect(lateEx.input.lastNightRateVnd).toBe(RATE);
    const r = await stayAction<{ saved?: boolean; surchargeVnd?: number } & ProblemFields>(
      ctx,
      fd,
      st.res.id,
      'late-checkout',
      {
        checkoutTime: String(lateEx.input.checkoutTime),
        applySurcharge: true,
        expectedSurchargeVnd: Number(lateEx.expected.surchargeVnd),
      },
    );
    expect(r.status, `setLateCheckout: ${JSON.stringify(r.body)}`).toBe(200);
    expect(r.body.saved).toBe(true);
  }
  const f = await getFolio(ctx, fd, folioId);
  const out: FocStay = { st, folioId };
  if (i.late) {
    out.late = liveLines(f, 'late_checkout')[0];
    expect(out.late?.amountVnd, 'dòng phụ thu trả muộn').toBe(oracleNum(i.late, 'surchargeVnd'));
  }
  if (i.early) {
    out.early = liveLines(f, 'early_checkin')[0];
    expect(out.early?.amountVnd, 'dòng phụ thu nhận sớm').toBe(oracleNum(i.early, 'surchargeVnd'));
  }
  return out;
}

/** Dòng "Dịch vụ khác" (service_fee, giá nhập tay) – nguồn phát sinh để lấp hạn mức tháng. Trả về id dòng. */
async function serviceLine(
  ctx: APIRequestContext,
  s: StaffSession,
  folioId: string,
  amountVnd: number,
): Promise<string> {
  const before = new Set((await getFolio(ctx, s, folioId)).lines.map((l) => l.id));
  const r = await addLine(ctx, s, folioId, {
    chargeCode: 'service_fee',
    quantity: 1,
    unitPriceVnd: amountVnd,
    description: 'E2E dich vu khac',
  });
  expect(r.status, `addFolioLine service_fee: ${JSON.stringify(r.body)}`).toBe(201);
  const line = r.body.lines.find((l) => !before.has(l.id) && l.category === 'service_fee');
  expect(line?.amountVnd).toBe(amountVnd);
  return line!.id;
}

/**
 * qa.fdl duyệt các FOC (do qa.fd gửi, mỗi lần ≤ hạn mức lần) cho tới khi đã dùng `targetUsed` trong tháng
 * (`usedNow` = đã dùng hiện tại). Mỗi FOC một dòng service_fee riêng (một khóa FOC riêng): BR-433 (b) v0.4.0 /
 * BE-83 (R3-Q22) so hạn mức lần với Σ cộng dồn trên CÙNG khóa, nên lần 2 trên cùng dòng (Σ 600.000 > 300.000) sẽ
 * chuyển quản lý – đúng quy tắc chống chia nhỏ, không phải thứ ca này kiểm. Khác khóa trên cùng lượt ở chỉ báo OWN
 * (BR-433 (c), ESC-026 A), không đổi định tuyến.
 */
async function fillFdlMonth(
  ctx: APIRequestContext,
  fd: StaffSession,
  fdl: StaffSession,
  folioId: string,
  usedNow: number,
  targetUsed: number,
): Promise<void> {
  let left = targetUsed - usedNow;
  if (left <= 0) return;
  while (left > 0) {
    const amountVnd = Math.min(FDL_PER_TIME, left);
    const lineId = await serviceLine(ctx, fd, folioId, amountVnd);
    const r = await requestFoc(ctx, fd, folioId, lineId, {
      amountVnd,
      reasonCode: 'service_recovery',
    });
    expect(r.status, `requestFoc (lấp hạn mức): ${JSON.stringify(r.body)}`).toBe(201);
    expect(r.body.requiredRole).toBe('front_desk_lead');
    const a = await approveFoc(ctx, fdl, r.body.id, 'E2E lap han muc thang');
    expect(a.status, `approve (lấp hạn mức): ${JSON.stringify(a.body)}`).toBe(200);
    expect(a.body.status).toBe('approved');
    left -= amountVnd;
  }
}

interface MinibarStd {
  /** tủ + kỳ của bản chuẩn – lần đếm gửi lại đúng hai trường này (BUG-R2-196) */
  roomId?: string;
  periodId?: string | null;
  items: Array<{
    itemId: string;
    itemName: string;
    standardQty: number;
    isFree: boolean;
    unitPriceVnd?: number;
  }>;
}

async function minibarStd(
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

/** recordMinibarCheck: `used` = số đã dùng theo itemId (checkout: mọi món, còn lại = chuẩn − đã dùng). */
async function minibarCheck(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  mode: 'checkout' | 'stayover',
  used: Record<string, number>,
): Promise<void> {
  const std = await minibarStd(ctx, s, reservationId);
  const items = mode === 'checkout' ? std.items : std.items.filter((i) => used[i.itemId]);
  if (items.length === 0) return;
  const r = await call(ctx, 'POST', p3(EP3.recordMinibarCheck, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    body: {
      mode,
      roomId: std.roomId,
      periodId: std.periodId ?? null,
      lines: items.map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (used[i.itemId] ?? 0),
      })),
    },
  });
  expect(r.status, `recordMinibarCheck ${mode}: ${JSON.stringify(r.body)}`).toBe(201);
}

/** Trả phòng (B18) giờ `hhmm` ngày đi: kiểm minibar đủ (không dùng gì) rồi checkOut. */
async function checkOutAt(
  ctx: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  hhmm: string,
  extra: Record<string, unknown> = {},
): Promise<ApiResult<{ reservation?: { status: string }; billNo?: string } & ProblemFields>> {
  return stayAction(ctx, s, reservationId, 'check-out', { checkoutTime: hhmm, ...extra });
}

interface AuditRow {
  occurredAt: string;
  actorName?: string;
  category: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityCode?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
}

/** listAuditEvents (owner: mọi người) – đủ mọi trang. */
async function auditOf(
  ctx: APIRequestContext,
  s: StaffSession,
  q: { category?: string; actorUserId?: string; from: string; to: string },
): Promise<AuditRow[]> {
  const out: AuditRow[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 30; i++) {
    const r = await call<{ data: AuditRow[]; page: { nextCursor?: string | null } }>(
      ctx,
      'GET',
      `/v1/properties/${propertyIdOf(s)}/audit-events`,
      { session: s, query: { ...q, limit: 100, cursor } },
    );
    expect(r.status, `listAuditEvents: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(200);
    out.push(...r.body.data);
    cursor = r.body.page?.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return out;
}

/** psql với vai runtime của api (ottimo_app) – trả lỗi của PostgreSQL (rỗng = câu lệnh chạy được). */
function sqlAsApp(sql: string): string {
  try {
    stackSql(`SET ROLE ottimo_app;\n${sql}`);
    return '';
  } catch (e) {
    return String((e as { stderr?: Buffer }).stderr ?? e);
  }
}

const FOC_EPS = [
  EP3.checkIn,
  EP3.setLateCheckout,
  EP3.requestFoc,
  EP3.listApprovalRequests,
  EP3.approveRequest,
  EP3.getFolio,
];

// ───────────────────────── tests ─────────────────────────

let realToday = '';
test.beforeAll(async ({ request }) => {
  // một worker có thể được khởi động lại giữa file (ca đỏ): đưa đồng hồ về thật trước khi đọc "hôm nay"
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'L1 – nhật ký tiền và duyệt FOC trên folio (US-006, US-007, SM-10) – MutableClock',
  { tag: ['@clock', '@sprint3'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test(
      'TC-NT-016 điều chỉnh dòng folio có nhật ký trước/sau, không xóa được',
      {
        annotation: [
          { type: 'story', description: 'US-006/AC1' },
          { type: 'endpoints', description: 'addFolioLine, adjustFolioLine, listAuditEvents' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-016');
        await requireEndpoints(request, 'TC-NT-016', [
          EP3.checkIn,
          EP3.addFolioLine,
          EP3.adjustFolioLine,
        ]);
        const D = virtualDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const st = await inHouse(request, c, fd, { room: room(c, '101'), arrival: D });
        const folioId = st.res.folioId!;

        // 1. "Giặt ủi 75.000" = 2,5 kg × laundry_price_per_kg (BR-507-01)
        const kg = Number(oracle('BR-507-01').input.weightGrams) / 1000;
        const add = await addLine(request, fd, folioId, { chargeCode: 'laundry', quantity: kg });
        expect(add.status, JSON.stringify(add.body)).toBe(201);
        const orig = liveLines(add.body, 'laundry')[0]!;
        expect(orig.amountVnd).toBe(oracleNum('BR-507-01', 'amountVnd'));

        // 2. điều chỉnh → 60.000 (2 kg × giá/kg – tính từ tham số) kèm lý do
        const newKg = 2;
        const after = newKg * LAUNDRY_PER_KG;
        const reason = 'Can lai do giat: 2 kg';
        const cur = await call<Folio>(request, 'GET', p3(EP3.getFolio, fd, { folioId }), {
          session: fd,
        });
        const adj = await call<Folio & ProblemFields>(
          request,
          'POST',
          p3(EP3.adjustFolioLine, fd, { folioId, lineId: orig.id }),
          {
            session: fd,
            idempotencyKey: true,
            ifMatch: versionTag(cur.body.version),
            body: { newQuantity: newKg, reason },
          },
        );
        expect(adj.status, JSON.stringify(adj.body)).toBe(201);
        // không ghi đè: dòng gốc 75.000 còn nguyên + bút toán đảo + dòng mới (EP03-05 3.3) → chênh −15.000
        const kept = adj.body.lines.find((l) => l.id === orig.id);
        expect(kept?.amountVnd).toBe(orig.amountVnd);
        const reversal = adj.body.lines.find((l) => l.reversalOfId === orig.id);
        expect(reversal?.amountVnd).toBe(-orig.amountVnd);
        const replacement = adj.body.lines.find(
          (l) => l.relatedLineId === orig.id && l.category === 'laundry' && !l.reversalOfId,
        );
        expect(replacement?.amountVnd).toBe(after);
        const laundryNet = adj.body.lines
          .filter((l) => l.category === 'laundry' && l.lineState === 'posted')
          .reduce((s, l) => s + l.amountVnd, 0);
        expect(laundryNet - orig.amountVnd, 'chênh lệch điều chỉnh').toBe(after - orig.amountVnd);

        // nhật ký: người, thời điểm, trước/sau, lý do (owner xem S27)
        const owner = await sessionOrSkip(request, 'qa.owner');
        const log = await auditOf(request, owner, {
          category: 'money',
          actorUserId: fd.me.id,
          from: D,
          to: D,
        });
        const row = log.find((e) => e.action === 'folio_line.adjusted' && e.entityId === orig.id);
        expect(row, JSON.stringify(log.map((e) => e.action))).toBeTruthy();
        expect(row!.actorName).toBe(fd.me.displayName);
        expect(row!.occurredAt.slice(0, 10)).toBe(D);
        expect(row!.before?.amountVnd).toBe(orig.amountVnd);
        expect(row!.after?.amountVnd).toBe(after);
        expect(row!.reason).toBe(reason);

        // 3. không có endpoint xóa dòng
        const del = await call(
          request,
          'DELETE',
          `/v1/properties/${propertyIdOf(fd)}/folios/${folioId}/lines/${orig.id}`,
          { session: fd, idempotencyKey: true },
        );
        expect([404, 405], `DELETE dòng folio: ${del.status}`).toContain(del.status);
        // DB: vai runtime ottimo_app không có quyền DELETE/sửa số tiền (REVOKE – BR-008, ERD K8)
        if (CAN_CLEAN_ROOMS) {
          expect(sqlAsApp(`DELETE FROM folio_line WHERE id = '${orig.id}';`)).toMatch(
            /permission denied/i,
          );
          expect(sqlAsApp(`UPDATE folio_line SET amount_vnd = 1 WHERE id = '${orig.id}';`)).toMatch(
            /permission denied/i,
          );
          expect(
            stackSql(`SELECT amount_vnd FROM folio_line WHERE id = '${orig.id}';`).trim(),
          ).toBe(String(orig.amountVnd));
        } else {
          test.info().annotations.push({
            type: 'note',
            description: 'Phần DB (REVOKE) cần stack dùng một lần (E2E_COMPOSE_CONTROL=1) – bỏ qua',
          });
        }
      },
    );

    test(
      'TC-NT-017 (1) nhật ký tiền lọc theo ngày + người đúng, đủ',
      {
        annotation: [
          { type: 'story', description: 'US-006/AC2' },
          { type: 'endpoints', description: 'listAuditEvents' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-017 (1)');
        await requireEndpoints(request, 'TC-NT-017 (1)', [
          EP3.addFolioLine,
          EP3.adjustFolioLine,
          EP3.requestFoc,
          EP3.recordPayment,
        ]);
        test.info().annotations.push({
          type: 'note',
          description:
            'Ngày ảo riêng (không ca nào khác thao tác ngày này) thay cho 14–15/10 của DS-0: "không thiếu, không thừa" = kết quả lọc người khớp đúng các dòng của qa.fd trong toàn bộ nhật ký tiền của ngày đó',
        });
        const D = virtualDay(realToday, 2);
        await startDay(request, D, '10:00');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const fd2 = await sessionOrSkip(request, 'qa.fd2');
        const owner = await sessionOrSkip(request, 'qa.owner');

        // thao tác tiền của qa.fd: đặt đơn + cọc + thu đủ, ghi dòng, điều chỉnh, FOC rồi rút, thu thêm
        const st = await makeStay(request, c, fd, { room: room(c, '102'), arrival: D });
        const folioId = st.res.folioId!;
        const add = await addLine(request, fd, folioId, { chargeCode: 'laundry', quantity: 1 });
        expect(add.status, JSON.stringify(add.body)).toBe(201);
        const laundry = liveLines(add.body, 'laundry')[0]!;
        const cur = await getFolio(request, fd, folioId);
        const adj = await call<Folio>(
          request,
          'POST',
          p3(EP3.adjustFolioLine, fd, { folioId, lineId: laundry.id }),
          {
            session: fd,
            idempotencyKey: true,
            ifMatch: versionTag(cur.version),
            body: { newQuantity: 2, reason: 'Can lai do giat' },
          },
        );
        expect(adj.status, JSON.stringify(adj.body)).toBe(201);
        const newLaundry = liveLines(adj.body, 'laundry').find(
          (l) => l.relatedLineId === laundry.id,
        )!;
        const foc = await requestFoc(request, fd, folioId, newLaundry.id, {
          amountVnd: newLaundry.amountVnd,
          reasonCode: 'service_recovery',
        });
        expect(foc.status, JSON.stringify(foc.body)).toBe(201);
        expect((await cancelRequest(request, fd, foc.body.id)).status).toBe(200);
        const pay = await recordPayment(request, fd, folioId, {
          type: 'charge',
          method: 'cash',
          amountVnd: newLaundry.amountVnd,
        });
        expect(pay.status, JSON.stringify(pay.body)).toBe(201);
        // thao tác tiền của qa.fd2 cùng ngày (phải bị lọc ra)
        const st2 = await makeStay(request, c, fd2, { room: room(c, '103'), arrival: D });
        const add2 = await addLine(request, fd2, st2.res.folioId!, {
          chargeCode: 'laundry',
          quantity: 1,
        });
        expect(add2.status).toBe(201);

        // 1. owner lọc ngày D + người = qa.fd
        const mine = await auditOf(request, owner, {
          category: 'money',
          actorUserId: fd.me.id,
          from: D,
          to: D,
        });
        const all = await auditOf(request, owner, { category: 'money', from: D, to: D });
        const key = (e: AuditRow) =>
          `${e.occurredAt}|${e.action}|${e.entityType ?? ''}|${e.entityId ?? ''}|${e.entityCode ?? ''}`;
        // không thừa: chỉ qa.fd, chỉ ngày D, chỉ nhóm tiền
        for (const e of mine) {
          expect(e.actorName, key(e)).toBe(fd.me.displayName);
          expect(e.category).toBe('money');
          expect(e.occurredAt.slice(0, 10), key(e)).toBe(D);
        }
        for (const e of all) expect(e.occurredAt.slice(0, 10), key(e)).toBe(D);
        // không thiếu: đúng bằng các dòng của qa.fd trong toàn bộ nhật ký tiền ngày D
        expect(mine.map(key).sort()).toEqual(
          all
            .filter((e) => e.actorName === fd.me.displayName)
            .map(key)
            .sort(),
        );
        // đủ các loại thao tác vừa làm: ghi dòng, điều chỉnh, FOC, hủy (rút FOC), thu
        const has = (action: string, entityId?: string) =>
          mine.some(
            (e) => e.action === action && (entityId === undefined || e.entityId === entityId),
          );
        expect(has('folio.line_posted'), 'ghi dòng').toBe(true);
        expect(has('folio_line.adjusted', laundry.id), 'điều chỉnh').toBe(true);
        expect(has('approval.requested', foc.body.id), 'gửi FOC').toBe(true);
        expect(has('approval.cancelled', foc.body.id), 'rút FOC').toBe(true);
        expect(has('payment.recorded', pay.body.id), 'thu tiền').toBe(true);
        // thao tác của qa.fd2 có trong nhật ký ngày nhưng không lọt vào kết quả lọc qa.fd
        expect(all.some((e) => e.actorName === fd2.me.displayName)).toBe(true);
      },
    );

    test(
      'TC-NT-027 (luồng) qa.fd gửi FOC trả muộn 210.000 "Khách quen/VIP" → pending, folio chờ duyệt, không chọn người duyệt, hàng chờ + thông báo theo hạn mức',
      {
        annotation: [
          { type: 'story', description: 'US-007/AC1' },
          { type: 'endpoints', description: 'requestFoc, listApprovalRequests' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-027');
        await requireEndpoints(request, 'TC-NT-027', FOC_EPS);
        const D = virtualDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '201'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;
        const before = await getFolio(request, fd, fs.folioId);
        const ex = oracle('BR-432-01');
        expect(late.amountVnd).toBe(ex.input.amountVnd);

        // gửi kèm approverId: hợp đồng không có trường chọn người duyệt → bỏ qua (201) hoặc 422
        let r = await requestFoc(request, fd, fs.folioId, late.id, {
          amountVnd: late.amountVnd,
          reasonCode: 'regular_vip',
          extra: { approverId: fdl.me.id },
        });
        expect([201, 422], JSON.stringify(r.body)).toContain(r.status);
        if (r.status === 422) {
          r = await requestFoc(request, fd, fs.folioId, late.id, {
            amountVnd: late.amountVnd,
            reasonCode: 'regular_vip',
          });
        }
        expect(r.status, JSON.stringify(r.body)).toBe(201);
        const q = r.body;
        expect(q).toMatchObject({
          type: 'foc',
          status: 'pending',
          amountVnd: late.amountVnd,
          reasonCode: 'regular_vip',
          requiredRole: 'front_desk_lead',
          requestedBy: fd.me.displayName,
          selfApplied: false,
          reservationCode: fs.st.res.code,
        });
        expect(q.approverName, 'không có người duyệt chỉ định trước').toBeUndefined();

        // folio: dòng FOC âm "chờ duyệt", chưa trừ vào còn phải thu
        const f = await getFolio(request, fd, fs.folioId);
        const focLine = f.lines.find((l) => l.id === q.folioLineId);
        expect(focLine).toMatchObject({
          category: 'foc',
          amountVnd: -late.amountVnd,
          lineState: 'pending_approval',
          relatedLineId: late.id,
          approvalRequestId: q.id,
        });
        expect(f.totals.balanceDueVnd).toBe(before.totals.balanceDueVnd);
        expect(f.pendingApprovals).toBe(1);

        // định tuyến (BR-432-01 routedToRoles): mọi vai đủ hạn mức thấy trong hàng chờ; người gửi thấy của mình
        const routed = ex.expected.routedToRoles as string[];
        const byRole: Record<string, string> = {
          front_desk_lead: 'qa.fdl',
          manager: 'qa.mgr',
          owner: 'qa.owner',
        };
        for (const role of routed) {
          const s = await sessionOrSkip(request, byRole[role]!);
          const row = (await queue(request, s, 'pending')).find((a) => a.id === q.id);
          expect(row, `${s.username} thấy yêu cầu trong hàng chờ`).toBeTruthy();
        }
        expect((await rowOf(request, fd, q.id))?.status).toBe('pending');
        const fd2 = await sessionOrSkip(request, 'qa.fd2');
        expect(
          await rowOf(request, fd2, q.id),
          'qa.fd2 không thấy yêu cầu của qa.fd',
        ).toBeUndefined();

        // thông báo đẩy (BR-432 v0.3, pushNotifyRoles): vai thấp nhất đủ hạn mức + quản lý, không chủ đầu tư
        if (CAN_CLEAN_ROOMS) {
          const push = pushOf(`approval_requested:${q.id}:front_desk_lead`);
          expect(push, 'outbox staff.push approval_requested').toBeTruthy();
          expect([...(push!.roles as string[])].sort()).toEqual(
            [...(ex.expected.pushNotifyRoles as string[])].sort(),
          );
          const mgr = await sessionOrSkip(request, 'qa.mgr');
          const owner = await sessionOrSkip(request, 'qa.owner');
          const users = push!.userIds as string[];
          expect(users).toContain(fdl.me.id);
          expect(users).toContain(mgr.me.id);
          expect(users).not.toContain(owner.me.id);
          expect(users).not.toContain(fd.me.id);
        } else {
          test.info().annotations.push({
            type: 'note',
            description: 'Thông báo đẩy (outbox) cần stack dùng một lần – chỉ kiểm hàng chờ',
          });
        }
      },
    );

    test(
      'TC-NT-028 qa.fdl duyệt bằng mật khẩu của mình (R2: PIN → mật khẩu) → approved; folio phụ thu 210.000 + dòng FOC −210.000, người duyệt thật; nhật ký tiền',
      {
        annotation: [
          { type: 'story', description: 'US-007/AC2' },
          { type: 'endpoints', description: 'approveRequest, getFolio' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-028');
        await requireEndpoints(request, 'TC-NT-028', [...FOC_EPS, EP3.getBill]);
        const D = ownMonthDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '202'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;
        const r = await requestFoc(request, fd, fs.folioId, late.id, {
          amountVnd: late.amountVnd,
          reasonCode: 'regular_vip',
        });
        expect(r.status, JSON.stringify(r.body)).toBe(201);
        const before = await getFolio(request, fd, fs.folioId);
        // hạn mức tháng qa.fdl đã dùng 0 (tháng lịch riêng của ca)
        expect(await remainingOf(request, fdl)).toBe(FDL_PER_MONTH);

        const a = await approveFoc(request, fdl, r.body.id, 'Khach quen');
        expect(a.status, JSON.stringify(a.body)).toBe(200);
        expect(a.body).toMatchObject({
          status: 'approved',
          approverName: fdl.me.displayName,
          approverRole: 'front_desk_lead',
          requestedBy: fd.me.displayName,
          selfApplied: false,
        });
        expect(a.body.decidedAt?.slice(0, 10)).toBe(D);

        // BR-434: dòng phát sinh + dòng FOC âm cùng giá trị, đã ghi sổ
        const f = await getFolio(request, fd, fs.folioId);
        expect(f.lines.find((l) => l.id === late.id)).toMatchObject({
          lineState: 'posted',
          amountVnd: late.amountVnd,
        });
        const focLine = f.lines.find((l) => l.id === a.body.folioLineId);
        expect(focLine).toMatchObject({
          category: 'foc',
          lineState: 'posted',
          amountVnd: -late.amountVnd,
          relatedLineId: late.id,
        });
        expect(late.amountVnd + focLine!.amountVnd).toBe(oracleNum('BR-434-01', 'netVnd'));
        expect(f.totals.balanceDueVnd).toBe(before.totals.balanceDueVnd - late.amountVnd);
        expect(f.pendingApprovals ?? 0).toBe(0);
        // bill: dòng FOC in ngay dưới dòng phụ thu, nhãn "Miễn phí · {lý do}"
        const bill = await call<{ lines: FolioLine[] }>(
          request,
          'GET',
          p3(EP3.getBill, fd, { folioId: fs.folioId }),
          { session: fd },
        );
        expect(bill.status).toBe(200);
        const iLate = bill.body.lines.findIndex((l) => l.id === late.id);
        expect(bill.body.lines[iLate + 1]?.id, 'dòng FOC in ngay dưới dòng phụ thu').toBe(
          focLine!.id,
        );
        test.info().annotations.push({
          type: 'note',
          description:
            'Nhãn bill "Miễn phí · {lý do}" (FolioLine.labelKey/labelParams) là bổ sung hợp đồng sau ảnh 8ca2a47 – chưa kiểm; lý do kiểm ở ApprovalRequest.reasonCode, người duyệt ở approverName',
        });

        // hạn mức tháng của qa.fdl cộng 210.000; nhật ký tiền ghi người duyệt thật
        expect(await remainingOf(request, fdl)).toBe(FDL_PER_MONTH - late.amountVnd);
        const owner = await sessionOrSkip(request, 'qa.owner');
        const log = await auditOf(request, owner, {
          category: 'money',
          actorUserId: fdl.me.id,
          from: D,
          to: D,
        });
        expect(log.some((e) => e.action === 'approval.approved' && e.entityId === r.body.id)).toBe(
          true,
        );
        expect(log.some((e) => e.action === 'folio.foc_posted' && e.entityId === focLine!.id)).toBe(
          true,
        );
      },
    );

    test(
      'TC-NT-029 hạn mức lễ tân trưởng: (a) 300.000 duyệt được; (c) vượt hạn mức tháng → escalated; (d) không leo thêm, FDL khác không duyệt yêu cầu của FDL; (b) 301.000 → cần quản lý',
      {
        annotation: [
          { type: 'story', description: 'US-007/AC3' },
          { type: 'endpoints', description: 'approveRequest' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-029');
        await requireEndpoints(request, 'TC-NT-029', [...FOC_EPS, EP3.addFolioLine]);
        const D = ownMonthDay(realToday, 2);
        // nhận sớm 08:00 (BR-411-02: 350.000) + hẹn trả 17:00 (BR-412-02: 350.000) – hai dòng > hạn mức lần FDL
        await startDay(request, D, '08:00');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '203'),
          arrival: D,
          early: 'BR-411-02',
          late: 'BR-412-02',
        });

        // (a) đúng biên hạn mức lần (= foc_limits.front_desk_lead.perTimeVnd) → duyệt được
        const ra = await requestFoc(request, fd, fs.folioId, fs.early!.id, {
          amountVnd: FDL_PER_TIME,
        });
        expect(ra.status, JSON.stringify(ra.body)).toBe(201);
        expect(ra.body.requiredRole).toBe('front_desk_lead');
        const aa = await approveFoc(request, fdl, ra.body.id);
        expect(aa.status, JSON.stringify(aa.body)).toBe(200);
        expect(aa.body.status).toBe('approved');

        // (c) qa.fdl đã duyệt 1.300.000 trong tháng → FOC 210.000 vượt hạn mức tháng → escalated lên quản lý
        const usedC = 1_300_000; // dữ liệu TC-NT-029 (c)
        const focC = Number(oracle('BR-433-01').input.amountVnd); // 210.000 – trong hạn mức lần
        expect(usedC + focC).toBeGreaterThan(FDL_PER_MONTH);
        await fillFdlMonth(request, fd, fdl, fs.folioId, FDL_PER_TIME, usedC);
        const lineC = await serviceLine(request, fd, fs.folioId, focC);
        const rc = await requestFoc(request, fd, fs.folioId, lineC, { amountVnd: focC });
        expect(rc.status, JSON.stringify(rc.body)).toBe(201);
        expect(rc.body.requiredRole).toBe('front_desk_lead');
        expect(await remainingOf(request, fdl)).toBe(FDL_PER_MONTH - usedC);
        const ac = await approveFoc(request, fdl, rc.body.id);
        expect(ac.status, JSON.stringify(ac.body)).toBe(403);
        expect(ac.body.code).toBe('APPROVAL_LIMIT_EXCEEDED');
        expect(ac.body.approver).toBe('manager');
        const owner = await sessionOrSkip(request, 'qa.owner');
        expect(await rowOf(request, owner, rc.body.id)).toMatchObject({
          status: 'escalated',
          requiredRole: 'manager',
        });
        // đã lên quản lý: không còn trong hàng chờ của lễ tân trưởng; hạn mức tháng của FDL không đổi
        expect(await rowOf(request, fdl, rc.body.id)).toBeUndefined();
        expect(await remainingOf(request, fdl)).toBe(FDL_PER_MONTH - usedC);

        // (d1) qa.fdl duyệt lại yêu cầu đã escalated → 403, giữ nguyên (không leo thêm, không đổi cấp duyệt)
        const ad = await approveFoc(request, fdl, rc.body.id);
        expect(ad.status, JSON.stringify(ad.body)).toBe(403);
        expect(ad.body.code).toBe('APPROVAL_LIMIT_EXCEEDED');
        expect(await rowOf(request, owner, rc.body.id)).toMatchObject({
          status: 'escalated',
          requiredRole: 'manager',
        });
        // (d2) FOC do qa.fdl gửi (không phải minibar) → định tuyến lên quản lý; một lễ tân trưởng khác duyệt → 403,
        //      yêu cầu vẫn pending (chỉ người đủ cấp vượt hạn mức mới làm yêu cầu chuyển escalated)
        const amountB = FDL_PER_TIME + 1_000; // (b) 301.000 – để dành trên cùng dòng trả muộn 350.000
        const rd = await requestFoc(request, fdl, fs.folioId, fs.late!.id, {
          amountVnd: fs.late!.amountVnd - amountB - 9_000,
        });
        expect(rd.status, JSON.stringify(rd.body)).toBe(201);
        expect(rd.body).toMatchObject({ status: 'pending', requiredRole: 'manager' });
        const tmp = await createThrowawayUser(request, owner, 'front_desk_lead');
        const fdl2 = await activateUser(request, tmp);
        const a2 = await decide(request, fdl2.session, rd.body.id, 'approve', {
          authMethod: 'password',
          secret: fdl2.password,
        });
        expect(a2.status, JSON.stringify(a2.body)).toBe(403);
        expect(a2.body.code).toBe('APPROVAL_LIMIT_EXCEEDED');
        expect(await rowOf(request, owner, rd.body.id)).toMatchObject({
          status: 'pending',
          requiredRole: 'manager',
        });

        // (b) 301.000 = hạn mức lần + 1.000 → vượt FDL, trong hạn mức quản lý (≤ giá 1 đêm 700.000 – BR-433-02)
        expect(amountB).toBeLessThanOrEqual(RATE);
        const rb = await requestFoc(request, fd, fs.folioId, fs.late!.id, { amountVnd: amountB });
        expect(rb.status, JSON.stringify(rb.body)).toBe(201);
        const ab = await approveFoc(request, fdl, rb.body.id);
        expect(ab.status, JSON.stringify(ab.body)).toBe(403);
        expect(ab.body.code).toBe('APPROVAL_LIMIT_EXCEEDED');
        expect(['pending', 'escalated']).toContain(
          (await rowOf(request, owner, rb.body.id))?.status,
        );
        // BUG-R2-046 đã sửa ở vòng sửa 2 (cây làm việc sau e3959ec) – QA bỏ test.fail 17/10, kiểm lại trên stack mới
        expect(oracle('BR-433-02').expected.escalateTo).toBe('manager');
        expect(rb.body.requiredRole, 'định tuyến 301.000 (BR-433-02)').toBe('manager');
        expect(ab.body.approver).toBe('manager');
      },
    );

    test(
      'TC-NT-030 (a) qa.fdl tự duyệt → 403 SELF_APPROVAL_FORBIDDEN; (c) mật khẩu sai → 401 REAUTH_FAILED, vẫn pending, có audit; (b) qa.mgr tự gửi tự duyệt được',
      {
        annotation: [
          { type: 'story', description: 'US-007/AC4' },
          { type: 'endpoints', description: 'approveRequest' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-030');
        await requireEndpoints(request, 'TC-NT-030', FOC_EPS);
        const D = virtualDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const mgr = await sessionOrSkip(request, 'qa.mgr');
        const owner = await sessionOrSkip(request, 'qa.owner');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '101'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;

        // (a) qa.fdl gửi FOC rồi tự duyệt
        const ra = await requestFoc(request, fdl, fs.folioId, late.id, { amountVnd: 100_000 });
        expect(ra.status, JSON.stringify(ra.body)).toBe(201);
        const aa = await approveFoc(request, fdl, ra.body.id);
        expect(aa.status, JSON.stringify(aa.body)).toBe(403);
        expect(aa.body.code).toBe('SELF_APPROVAL_FORBIDDEN');
        expect((await rowOf(request, owner, ra.body.id))?.status).toBe('pending');

        // (c) yêu cầu của qa.fd; qa.fdl nhập sai mật khẩu ("PIN sai" – R2 dùng mật khẩu)
        const rc = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: 60_000 });
        expect(rc.status, JSON.stringify(rc.body)).toBe(201);
        const wrong = await decide(request, fdl, rc.body.id, 'approve', {
          authMethod: 'password',
          secret: `${SEED_PASSWORD}-sai`,
        });
        expect(wrong.status, JSON.stringify(wrong.body)).toBe(401);
        expect(wrong.body.code).toBe('REAUTH_FAILED');
        expect(wrong.body.errors).toContainEqual({ field: 'secret', code: 'REAUTH_FAILED' });
        expect((await rowOf(request, owner, rc.body.id))?.status).toBe('pending');
        const sec = await auditOf(request, owner, {
          category: 'security',
          actorUserId: fdl.me.id,
          from: D,
          to: D,
        });
        expect(sec.some((e) => /reauth_failed|reauth_locked/.test(e.action))).toBe(true);
        // mật khẩu đúng sau đó vẫn duyệt được (bộ đếm sai về 0 – không khóa qa.fdl cho các ca sau)
        const ok = await approveFoc(request, fdl, rc.body.id);
        expect(ok.status, JSON.stringify(ok.body)).toBe(200);

        // (b) qa.mgr tự gửi FOC 50.000 (≤ giá 1 đêm – BR-433) → tự áp (approved ngay) hoặc tự duyệt được
        const rb = await requestFoc(request, mgr, fs.folioId, late.id, { amountVnd: 50_000 });
        expect(rb.status, JSON.stringify(rb.body)).toBe(201);
        // BUG-R2-046 đã sửa ở vòng sửa 2 (cây làm việc sau e3959ec) – QA bỏ test.fail 17/10, kiểm lại trên stack mới
        let final: Approval & ProblemFields = rb.body;
        if (rb.body.status === 'pending') {
          const ab = await approveFoc(request, mgr, rb.body.id);
          expect(ab.status, `qa.mgr tự duyệt: ${JSON.stringify(ab.body)}`).toBe(200);
          final = ab.body;
        }
        expect(final).toMatchObject({ status: 'approved', approverName: mgr.me.displayName });
      },
    );

    test(
      'TC-NT-031 folio còn 1 yêu cầu pending + 1 escalated, đã thu đủ → trả phòng 409 PENDING_APPROVALS, đơn vẫn in_house',
      {
        annotation: [
          { type: 'story', description: 'US-007/AC5' },
          { type: 'endpoints', description: 'checkOut' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-031');
        await requireEndpoints(request, 'TC-NT-031', [
          ...FOC_EPS,
          EP3.addFolioLine,
          EP3.checkOut,
          EP3.recordMinibarCheck,
        ]);
        const D = ownMonthDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        let fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '102'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;
        // escalated: qa.fdl còn 100.000 hạn mức tháng, FOC 110.000 → vượt tháng → escalated
        await fillFdlMonth(request, fd, fdl, fs.folioId, 0, FDL_PER_MONTH - 100_000);
        const r1 = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: 110_000 });
        expect(r1.status, JSON.stringify(r1.body)).toBe(201);
        const a1 = await approveFoc(request, fdl, r1.body.id);
        expect(a1.status, JSON.stringify(a1.body)).toBe(403);
        const owner = await sessionOrSkip(request, 'qa.owner');
        expect((await rowOf(request, owner, r1.body.id))?.status).toBe('escalated');
        const r2 = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: 100_000 });
        expect(r2.status, JSON.stringify(r2.body)).toBe(201);
        expect(r2.body.status).toBe('pending');
        // đã thu đủ (FOC chưa duyệt không trừ vào còn phải thu)
        const paid = await payBalance(request, fd, fs.folioId);
        expect(paid.totals.balanceDueVnd).toBe(0);

        // ngày đi 15:00 (giờ hẹn – phụ thu không đổi): minibar đã kiểm, hoàn tất trả phòng → bị chặn
        const dep = addDays(D, 1);
        await moveTo(request, dep, '15:00');
        fd = await sessionOrSkip(request, 'qa.fd');
        await minibarCheck(request, fd, fs.st.res.id, 'checkout', {});
        const out = await checkOutAt(request, fd, fs.st.res.id, '15:00');
        expect(out.status, JSON.stringify(out.body)).toBe(409);
        expect(out.body.code).toBe('PENDING_APPROVALS');
        expect((out.body as { pendingApprovals?: number }).pendingApprovals).toBe(2);
        const res = await getReservation(request, fd, fs.st.res.id);
        expect(res.body.status).toBe('in_house');
      },
    );

    test(
      'TC-NT-032 FOC minibar 90.000: (a) qa.fd tự áp trong hạn mức (xác thực lại mật khẩu) → approved, cộng hạn mức tháng; (b) đã tự miễn 450.000 → pending chờ qa.fdl',
      {
        annotation: [
          { type: 'story', description: 'US-007/AC6' },
          { type: 'endpoints', description: 'requestFoc, listApprovalRequests' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-032');
        await requireEndpoints(request, 'TC-NT-032', [
          ...FOC_EPS,
          EP3.recordMinibarCheck,
          EP3.getMinibarStandard,
        ]);
        test.info().annotations.push({
          type: 'note',
          description:
            'Chưa kiểm: danh sách "FOC tự áp trong ca" của báo cáo đóng ca BR-526 (chưa có trên build) và cảnh báo thất thoát BR-435 (job/Tổng quan) – chỉ kiểm nhật ký approval.self_applied',
        });
        const D = ownMonthDay(realToday, 2);
        const month = D.slice(0, 7);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const st = await inHouse(request, c, fd, { room: room(c, '401'), arrival: D });
        const folioId = st.res.folioId!;
        const vang = DS_E.minibarItems.find((x) => x.code === 'vang')!;
        const std = await minibarStd(request, fd, st.res.id);
        const vangId = std.items.find((i) => i.itemName === vang.name)?.itemId;
        expect(vangId, 'món vang trong tủ chuẩn').toBeTruthy();

        // dòng minibar 90.000 từ kiểm minibar trả phòng (1 chai vang)
        await minibarCheck(request, fd, st.res.id, 'checkout', { [vangId!]: 1 });
        let f = await getFolio(request, fd, folioId);
        const lineA = liveLines(f, 'minibar').find((l) => l.amountVnd === vang.salePriceVnd)!;
        expect(lineA, 'dòng minibar 90.000').toBeTruthy();
        expect(await selfAppliedIn(request, fd, month)).toBe(0);

        // không xác thực lại → không tự áp (BR-436 (3)): pending; rút lại
        const noAuth = await requestFoc(request, fd, folioId, lineA.id, {
          amountVnd: lineA.amountVnd,
          reasonCode: 'regular_vip',
        });
        expect(noAuth.status, JSON.stringify(noAuth.body)).toBe(201);
        expect(noAuth.body).toMatchObject({ status: 'pending', selfApplied: false });
        expect((await cancelRequest(request, fd, noAuth.body.id)).status).toBe(200);

        // (a) tự áp: xác thực lại bằng mật khẩu của chính mình, trong hạn mức lần + tháng
        expect(lineA.amountVnd).toBeLessThanOrEqual(SELF_PER_TIME);
        const a = await requestFoc(request, fd, folioId, lineA.id, {
          amountVnd: lineA.amountVnd,
          reasonCode: 'regular_vip',
          password: true,
        });
        expect(a.status, JSON.stringify(a.body)).toBe(201);
        expect(a.body).toMatchObject({
          status: 'approved',
          selfApplied: true,
          requestedBy: fd.me.displayName,
          approverName: fd.me.displayName,
          approverRole: 'front_desk',
        });
        f = await getFolio(request, fd, folioId);
        expect(f.lines.find((l) => l.id === a.body.folioLineId)).toMatchObject({
          category: 'foc',
          lineState: 'posted',
          amountVnd: -lineA.amountVnd,
          relatedLineId: lineA.id,
        });
        expect(await selfAppliedIn(request, fd, month)).toBe(lineA.amountVnd);
        const owner = await sessionOrSkip(request, 'qa.owner');
        const log = await auditOf(request, owner, {
          category: 'money',
          actorUserId: fd.me.id,
          from: D,
          to: D,
        });
        expect(
          log.some((e) => e.action === 'approval.self_applied' && e.entityId === a.body.id),
        ).toBe(true);

        // (b) đã tự miễn 450.000 trong tháng (dữ liệu TC) → FOC 90.000 vượt 500.000 → pending, không tự áp
        const usedB = 450_000;
        expect(usedB + lineA.amountVnd).toBeGreaterThan(SELF_PER_MONTH);
        // Kiểm minibar giữa kỳ (mode=stayover) bị đóng tới US-033 (DOM BE-29, build 229db99) → dòng minibar để lấp hạn
        // mức lấy từ kiểm trả phòng của 2 đơn khác cùng tháng: đơn 2 dùng mọi món tính tiền, đơn 3 dùng 1 vang.
        const st2 = await inHouse(request, c, fd, {
          room: room(c, '402'),
          alternatives: c.rooms.filter((r) => !['401', '402'].includes(r.roomNo)),
          arrival: D,
        });
        const std2 = await minibarStd(request, fd, st2.res.id);
        const all: Record<string, number> = {};
        for (const i of std2.items) if (!i.isFree) all[i.itemId] = i.standardQty;
        await minibarCheck(request, fd, st2.res.id, 'checkout', all);
        const f2 = await getFolio(request, fd, st2.res.folioId!);
        let need = usedB - (await selfAppliedIn(request, fd, month));
        for (const l of liveLines(f2, 'minibar')) {
          if (need <= 0) break;
          const amt = Math.min(SELF_PER_TIME, l.amountVnd, need);
          const r = await requestFoc(request, fd, st2.res.folioId!, l.id, {
            amountVnd: amt,
            password: true,
          });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.body.status, 'lấp hạn mức tự miễn').toBe('approved');
          need -= amt;
        }
        expect(need, 'đủ dòng minibar để lấp 450.000').toBeLessThanOrEqual(0);
        expect(await selfAppliedIn(request, fd, month)).toBe(usedB);
        const st3 = await inHouse(request, c, fd, {
          room: room(c, '301'),
          alternatives: c.rooms.filter(
            (r) => !['401', '402', '301', st2.room.roomNo].includes(r.roomNo),
          ),
          arrival: D,
        });
        const std3 = await minibarStd(request, fd, st3.res.id);
        const vang3 = std3.items.find((i) => i.itemName === vang.name)?.itemId;
        expect(vang3, 'món vang trong tủ chuẩn căn 3').toBeTruthy();
        await minibarCheck(request, fd, st3.res.id, 'checkout', { [vang3!]: 1 });
        const f3 = await getFolio(request, fd, st3.res.folioId!);
        const lineB = liveLines(f3, 'minibar').find((l) => l.amountVnd === vang.salePriceVnd)!;
        expect(lineB, 'dòng minibar 90.000 thứ hai').toBeTruthy();
        const b = await requestFoc(request, fd, st3.res.folioId!, lineB.id, {
          amountVnd: lineB.amountVnd,
          reasonCode: 'regular_vip',
          password: true,
        });
        expect(b.status, JSON.stringify(b.body)).toBe(201);
        expect(b.body).toMatchObject({
          status: 'pending',
          selfApplied: false,
          requiredRole: String(oracle('BR-436-02').expected.routeTo),
        });
        expect(await selfAppliedIn(request, fd, month)).toBe(usedB);
      },
    );

    test(
      'TC-NT-033 qa.fdl từ chối (không lý do → 422; có lý do → rejected, người gửi được báo); phụ thu 210.000 còn phải thu; trả phòng: chưa thu → 409 BALANCE_DUE, thu xong → checked_out',
      {
        annotation: [
          { type: 'story', description: 'US-007/–' },
          { type: 'endpoints', description: 'rejectRequest, getFolio, checkOut' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-033');
        await requireEndpoints(request, 'TC-NT-033', [
          ...FOC_EPS,
          EP3.rejectRequest,
          EP3.checkOut,
          EP3.recordMinibarCheck,
        ]);
        const D = virtualDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        let fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '103'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;
        const r = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: late.amountVnd });
        expect(r.status, JSON.stringify(r.body)).toBe(201);

        // 1. không lý do → 422; có lý do → rejected (mật khẩu của chính qa.fdl)
        const noReason = await decide(request, fdl, r.body.id, 'reject', {
          authMethod: 'password',
          secret: SEED_PASSWORD,
        });
        expect(noReason.status, JSON.stringify(noReason.body)).toBe(422);
        expect((noReason.body.errors ?? []).map((e) => e.field)).toContain('reason');
        const reason = 'Khach khong thuoc dien mien phi';
        const rj = await reject(request, fdl, r.body.id, reason);
        expect(rj.status, JSON.stringify(rj.body)).toBe(200);
        expect(rj.body).toMatchObject({
          status: 'rejected',
          approverName: fdl.me.displayName,
          decisionNote: reason,
        });
        if (CAN_CLEAN_ROOMS) {
          const push = pushOf(`approval_decided:${r.body.id}`);
          expect(push, 'thông báo kết quả cho người gửi').toBeTruthy();
          expect(push!.userIds).toEqual([fd.me.id]);
          expect(push!.status).toBe('rejected');
        }
        // 2. dòng FOC bị bỏ, phụ thu còn nguyên phải thu
        const f = await getFolio(request, fd, fs.folioId);
        expect(f.lines.find((l) => l.id === r.body.folioLineId)?.lineState).toBe('rejected');
        expect(liveLines(f, 'late_checkout').map((l) => l.amountVnd)).toEqual([late.amountVnd]);
        expect(liveLines(f, 'foc')).toHaveLength(0);
        expect(f.totals.balanceDueVnd).toBe(late.amountVnd);

        // 3. ngày đi 15:00: không còn PENDING_APPROVALS; chưa thu → BALANCE_DUE; thu 210.000 → checked_out
        await moveTo(request, addDays(D, 1), '15:00');
        fd = await sessionOrSkip(request, 'qa.fd');
        await minibarCheck(request, fd, fs.st.res.id, 'checkout', {});
        const due = await checkOutAt(request, fd, fs.st.res.id, '15:00');
        expect(due.status, JSON.stringify(due.body)).toBe(409);
        expect(due.body.code).toBe('BALANCE_DUE');
        const out = await checkOutAt(request, fd, fs.st.res.id, '15:00', {
          finalPayment: { type: 'charge', method: 'cash', amountVnd: late.amountVnd },
        });
        expect(out.status, JSON.stringify(out.body)).toBe(200);
        expect(out.body.reservation?.status).toBe('checked_out');
      },
    );

    test(
      'TC-NT-034 FOC đã escalated lên quản lý: (a) qa.fdl từ chối → 403; (b) qa.mgr từ chối có lý do → rejected, phụ thu còn phải thu; (c) hạn mức tháng không bị cộng',
      {
        annotation: [
          { type: 'story', description: 'US-007/–' },
          { type: 'endpoints', description: 'rejectRequest, listApprovalRequests' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-034');
        await requireEndpoints(request, 'TC-NT-034', [
          ...FOC_EPS,
          EP3.rejectRequest,
          EP3.addFolioLine,
        ]);
        test.info().annotations.push({
          type: 'note',
          description:
            'Yêu cầu escalated tạo bằng đường hợp lệ duy nhất của build (FB-R2-ARC-BE-08): FDL vượt hạn mức THÁNG (đã duyệt 1.300.000, FOC 210.000). FOC 301.000 (TC-NT-029 b) được định tuyến ngay khi gửi tới cấp đủ hạn mức (pending, không qua escalated) – hiện lên chủ đầu tư do BUG-R2-046',
        });
        const D = ownMonthDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const mgr = await sessionOrSkip(request, 'qa.mgr');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '201'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;
        const usedC = 1_300_000; // như TC-NT-029 (c)
        await fillFdlMonth(request, fd, fdl, fs.folioId, 0, usedC);
        const r = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: late.amountVnd });
        expect(r.status, JSON.stringify(r.body)).toBe(201);
        expect((await approveFoc(request, fdl, r.body.id)).status).toBe(403);
        expect(await rowOf(request, mgr, r.body.id)).toMatchObject({
          status: 'escalated',
          requiredRole: 'manager',
        });
        const before = await getFolio(request, fd, fs.folioId);
        const fdlRemaining = await remainingOf(request, fdl);
        expect(fdlRemaining).toBe(FDL_PER_MONTH - usedC);

        // (a) qa.fdl không còn là người duyệt của yêu cầu
        const ra = await reject(request, fdl, r.body.id, 'Khong du dieu kien');
        expect(ra.status, JSON.stringify(ra.body)).toBe(403);
        expect(ra.body.code).toBe('APPROVAL_LIMIT_EXCEEDED');
        expect((await rowOf(request, mgr, r.body.id))?.status).toBe('escalated');
        // (b) qa.mgr từ chối có lý do (mật khẩu của mình) → rejected; phụ thu giữ nguyên phải thu
        const reason = 'Quan ly khong dong y mien phi';
        const rb = await reject(request, mgr, r.body.id, reason);
        expect(rb.status, JSON.stringify(rb.body)).toBe(200);
        expect(rb.body).toMatchObject({
          status: 'rejected',
          approverName: mgr.me.displayName,
          approverRole: 'manager',
          decisionNote: reason,
        });
        const f = await getFolio(request, fd, fs.folioId);
        expect(f.lines.find((l) => l.id === r.body.folioLineId)?.lineState).toBe('rejected');
        expect(liveLines(f, 'late_checkout').map((l) => l.amountVnd)).toEqual([late.amountVnd]);
        expect(f.totals.balanceDueVnd).toBe(before.totals.balanceDueVnd);
        // (c) hạn mức tháng không bị cộng: qa.fdl giữ nguyên số còn lại; không có nhật ký "approval.approved"
        expect(await remainingOf(request, fdl)).toBe(fdlRemaining);
        const owner = await sessionOrSkip(request, 'qa.owner');
        const log = await auditOf(request, owner, { category: 'money', from: D, to: D });
        expect(log.some((e) => e.action === 'approval.approved' && e.entityId === r.body.id)).toBe(
          false,
        );
        expect(log.some((e) => e.action === 'approval.rejected' && e.entityId === r.body.id)).toBe(
          true,
        );
        // quản lý: hạn mức tháng không giới hạn (foc_limits.manager) – không có số dư để so
        expect((await rowOf(request, mgr, r.body.id))?.approverRemainingMonthlyVnd).toBeUndefined();
      },
    );

    test(
      'TC-NT-035 rút yêu cầu: (a) qa.fd2 rút yêu cầu của qa.fd → 403/404; (c) rút yêu cầu đã approved → 409; (b) qa.fd rút → cancelled, hết "chờ duyệt", trả phòng không bị chặn',
      {
        annotation: [
          { type: 'story', description: 'US-007/–' },
          { type: 'endpoints', description: 'cancelRequest, checkOut' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-035');
        await requireEndpoints(request, 'TC-NT-035', [
          ...FOC_EPS,
          CANCEL_REQUEST,
          EP3.checkOut,
          EP3.recordMinibarCheck,
        ]);
        const D = virtualDay(realToday, 2);
        await startDay(request, D, '14:30');
        const c = await s2Context(request);
        let fd = await sessionOrSkip(request, 'qa.fd');
        const fd2 = await sessionOrSkip(request, 'qa.fd2');
        const owner = await sessionOrSkip(request, 'qa.owner');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '202'),
          arrival: D,
          late: 'BR-412-01',
        });
        const late = fs.late!;
        const pending = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: 100_000 });
        expect(pending.status, JSON.stringify(pending.body)).toBe(201);
        const other = await requestFoc(request, fd, fs.folioId, late.id, { amountVnd: 110_000 });
        expect(other.status, JSON.stringify(other.body)).toBe(201);
        // "FOC khác đã approved" – chủ đầu tư duyệt (không giới hạn, không phụ thuộc hạn mức tháng)
        const ok = await approveFoc(request, owner, other.body.id);
        expect(ok.status, JSON.stringify(ok.body)).toBe(200);

        // (a) người khác rút → 404 (phạm vi own) hoặc 403
        const a = await cancelRequest(request, fd2, pending.body.id);
        expect([403, 404], JSON.stringify(a.body)).toContain(a.status);
        expect((await rowOf(request, owner, pending.body.id))?.status).toBe('pending');
        // (c) rút yêu cầu đã approved → 409 INVALID_TRANSITION
        const cc = await cancelRequest(request, fd, other.body.id);
        expect(cc.status, JSON.stringify(cc.body)).toBe(409);
        expect(cc.body.code).toBe('INVALID_TRANSITION');
        // (b) người gửi rút → cancelled, dòng "chờ duyệt" biến mất
        const b = await cancelRequest(request, fd, pending.body.id);
        expect(b.status, JSON.stringify(b.body)).toBe(200);
        expect(b.body.status).toBe('cancelled');
        const f = await getFolio(request, fd, fs.folioId);
        expect(f.lines.find((l) => l.id === pending.body.folioLineId)?.lineState).toBe('rejected');
        expect(f.lines.filter((l) => l.lineState === 'pending_approval')).toHaveLength(0);
        expect(f.pendingApprovals ?? 0).toBe(0);

        // trả phòng ngày đi: không còn bị chặn bởi yêu cầu duyệt (thu nốt phần còn phải thu)
        await moveTo(request, addDays(D, 1), '15:00');
        fd = await sessionOrSkip(request, 'qa.fd');
        await minibarCheck(request, fd, fs.st.res.id, 'checkout', {});
        const due = (await getFolio(request, fd, fs.folioId)).totals.balanceDueVnd;
        expect(due).toBe(late.amountVnd - 110_000);
        const out = await checkOutAt(request, fd, fs.st.res.id, '15:00', {
          finalPayment: { type: 'charge', method: 'cash', amountVnd: due },
        });
        expect(out.status, JSON.stringify(out.body)).toBe(200);
        expect(out.body.reservation?.status).toBe('checked_out');
      },
    );

    test(
      'TC-NT-036 (b) qa.fd gửi FOC phụ thu (không phải minibar) → pending dù xác thực lại; (a) qa.mgr áp FOC trực tiếp → approved ngay, người thao tác = người duyệt, folio có dòng FOC âm',
      {
        annotation: [
          { type: 'story', description: 'US-007/–' },
          { type: 'endpoints', description: 'requestFoc, getFolio' },
        ],
      },
      async ({ request }) => {
        needClock('TC-NT-036');
        await requireEndpoints(request, 'TC-NT-036', FOC_EPS);
        const D = virtualDay(realToday, 2);
        // nhận sớm 11:00 (BR-411-01: 210.000) + hẹn trả 15:00 (BR-412-01: 210.000)
        await startDay(request, D, '11:00');
        const c = await s2Context(request);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const mgr = await sessionOrSkip(request, 'qa.mgr');
        const fs = await surchargeStay(request, c, fd, {
          room: room(c, '203'),
          arrival: D,
          early: 'BR-411-01',
          late: 'BR-412-01',
        });

        // (b) lễ tân: cùng loại FOC phụ thu, có xác thực lại → vẫn pending (chỉ minibar được tự áp – BR-436)
        const b = await requestFoc(request, fd, fs.folioId, fs.early!.id, {
          amountVnd: fs.early!.amountVnd,
          password: true,
        });
        expect(b.status, JSON.stringify(b.body)).toBe(201);
        expect(b.body).toMatchObject({ status: 'pending', selfApplied: false });

        // (a) quản lý áp FOC trả muộn 210.000 (≤ giá 1 đêm 700.000 – BR-433) → approved ngay (SM-10 A2 a)
        const a = await requestFoc(request, mgr, fs.folioId, fs.late!.id, {
          amountVnd: fs.late!.amountVnd,
          password: true,
        });
        expect(a.status, JSON.stringify(a.body)).toBe(201);
        // BUG-R2-046 đã sửa ở vòng sửa 2 (cây làm việc sau e3959ec) – QA bỏ test.fail 17/10, kiểm lại trên stack mới
        expect(a.body).toMatchObject({
          status: 'approved',
          selfApplied: true,
          requestedBy: mgr.me.displayName,
          approverName: mgr.me.displayName,
        });
        const f = await getFolio(request, fd, fs.folioId);
        expect(f.lines.find((l) => l.id === a.body.folioLineId)).toMatchObject({
          category: 'foc',
          lineState: 'posted',
          amountVnd: -fs.late!.amountVnd,
        });
      },
    );
  },
);
