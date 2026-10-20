// MSW mock of the Desk side of EP07/EP08 (housekeeping, maintenance, room blocks), EP14 (guest request queue)
// and EP09 (minibar catalogue) – OpenAPI 0.3.7, Sprint 4 FE-B, until BE-C/BE-D/BE-B ship them. Rules mirrored
// from specs/EP07-08 (SM-02 blocks half-open [start, reopen), SM-04 W1–W6, SM-14, BR-804, BR-809), EP14 (SM-15,
// BR-811) and US-066 (BR-701): x-roles → 403, If-Match → 428/412, Idempotency-Key replay, 409 conflicts[].
// Blocks live in the EP02 mock (`rsv().blocks`) so the rack, bookings and KPIs see them at once.
import type {
  AllowedAction,
  AttentionItem,
  GuestRequest,
  HkTask,
  Item,
  ReservationStatus,
  Role,
  Room,
  RoomBlock,
  RoomStatusEntry,
  WorkOrder,
} from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { businessDayLocal, todayLocal } from '../app/dates';
import { addDays, nightsBetween, type ReservationMockState } from './reservations';
import { replyNoteErrors } from './replyNote';
import type { MockUser } from './seed';
import { MINIBAR } from './stay';

type Guard = { user: MockUser; roles: Role[] } | Response;
type Body = Record<string, unknown>;
interface Ctx {
  guard: (
    request: StrictRequest<DefaultBodyType>,
    allowed: Role[] | 'any',
    opts?: { ifMatch?: number },
  ) => Guard;
  problem: (status: number, code: string, extra?: Record<string, unknown>) => Response;
  db: () => { rooms: Room[] };
  rsv: () => ReservationMockState;
  /** Sprint 3 stay mock: housekeeping status per room number. */
  roomStatus: () => Record<string, string>;
  /** Sprint 3 stay mock: ids of uploaded attachments (receipts, work-order photos). */
  attachments: () => Set<string>;
}

const OWN_MGR: Role[] = ['owner', 'manager'];
const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const HK: Role = 'housekeeping';
const MT: Role = 'maintenance';
const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));
const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const isResponse = (g: Guard): g is Response => g instanceof Response;
const nowIso = () => new Date().toISOString();
const at = (date: string, hhmm: string) => `${date}T${hhmm}:00+07:00`;
const HIGH_CATEGORIES = ['hot_water', 'power', 'leak', 'door_lock', 'drain'];
const MANUAL_TASK_TYPES = ['adhoc_clean', 'stayover_clean', 'priority_clean', 'minibar_refill'];
const STATUS_LABEL: Record<string, string> = {
  VC: 'Đã dọn · chờ kiểm',
  VI: 'Đã kiểm · sẵn sàng',
  VD: 'Trống · cần dọn',
  CL: 'Đang dọn',
  OC: 'Có khách · sạch',
  OD: 'Có khách · cần dọn',
  OOO: 'Khóa phòng',
};
/** Pristine minibar catalogue – restored on reset (the stay mock shares the array for check-out). */
const MINIBAR_SEED = MINIBAR.map((m) => ({ ...m }));

interface BlockMeta {
  status: RoomBlock['status'];
  startDate: string;
  endDatePlanned: string;
  endDateActual: string | null;
  expectedDoneDate?: string;
  workOrderId?: string;
  reason: string;
  version: number;
}
interface MockWorkOrder extends Omit<WorkOrder, 'roomBlock' | 'allowedActions'> {
  createdBy: string;
  blockId?: string;
}
interface MockItemMeta {
  code: string;
  unit: string;
  nameEn?: string;
  costPriceVnd?: number;
  minStockQty: number;
  isActive: boolean;
  version: number;
}

function makeState(rooms: Room[], rsv: ReservationMockState) {
  const T = todayLocal();
  const room = (no: string) => rooms.find((r) => r.roomNo === no)!;
  const res = (guest: string) => rsv.reservations.find((r) => r.guestName === guest);
  const blockMeta = new Map<string, BlockMeta>();
  // The EP02 seed block of 401 (hot water) is the one of WO-00034.
  const seedBlock = rsv.blocks[0];
  const woHigh = uid(95_034);
  if (seedBlock)
    blockMeta.set(seedBlock.id, {
      status: seedBlock.from <= T ? 'active' : 'planned',
      startDate: seedBlock.from,
      endDatePlanned: seedBlock.to,
      endDateActual: null,
      expectedDoneDate: addDays(seedBlock.to, -1),
      workOrderId: woHigh,
      reason: seedBlock.reason,
      version: 1,
    });
  const hist = (actorName: string, change: string, from: string | null, to: string | null) => ({
    at: nowIso(),
    actorName,
    change: change as NonNullable<WorkOrder['history']>[number]['change'],
    from,
    to,
  });
  const wo = (
    n: number,
    no: string,
    title: string,
    extra: Partial<MockWorkOrder>,
  ): MockWorkOrder => ({
    id: uid(95_000 + n),
    code: `WO-000${n}`,
    roomId: room(no).id,
    roomNo: no,
    roomName: room(no).name ?? null,
    title,
    description: title,
    severity: 'medium',
    status: 'new',
    source: 'front_desk',
    category: 'other',
    reportedBy: 'Hạnh',
    createdBy: uid(4),
    history: [hist('Hạnh', 'created', null, 'new')],
    version: 1,
    ...extra,
  });
  const nga = res('Trần Thu Nga');
  const workOrders: MockWorkOrder[] = [
    wo(34, '401', 'Hỏng bình nóng lạnh', {
      id: woHigh,
      description: 'Bình không nóng, có tiếng kêu. Đã báo khóa căn.',
      severity: 'high',
      status: 'in_progress',
      source: 'housekeeping',
      category: 'hot_water',
      reportedBy: 'Bích',
      assigneeName: 'Tuấn',
      acceptedAt: nowIso(),
      blockId: seedBlock?.id,
      history: [
        hist('Bích', 'created', null, 'new'),
        hist('Tuấn', 'status', 'new', 'in_progress'),
        hist('Hạnh', 'block', null, seedBlock ? `${seedBlock.from}→${seedBlock.to}` : null),
      ],
    }),
    wo(35, '101', 'Vòi sen yếu', {
      description: 'Khách báo qua app: vòi sen nước yếu.',
      severity: 'medium',
      source: 'guest_app',
      category: 'other',
      reportedBy: 'Khách',
      resolveDueAt: at(T, '23:00'),
    }),
    wo(36, '202', 'Rỉ nước bồn rửa', {
      description: 'Rỉ nước dưới bồn rửa bếp, có vũng nhỏ.',
      severity: 'low',
      source: 'housekeeping',
      category: 'leak',
      reportedBy: 'Bích',
      blockRequested: true,
      history: [
        hist('Bích', 'created', null, 'new'),
        hist('Bích', 'block_requested', null, 'true'),
      ],
    }),
    wo(31, '203', 'Thay bóng đèn bếp', {
      severity: 'low',
      status: 'done',
      category: 'power',
      reportedBy: 'Bích',
      assigneeName: 'Tuấn',
      resultNote: 'Đã thay bóng LED mới.',
      doneAt: at(addDays(T, -1), '15:20'),
      history: [
        hist('Bích', 'created', null, 'new'),
        hist('Tuấn', 'status', 'new', 'in_progress'),
        hist('Tuấn', 'status', 'in_progress', 'done'),
      ],
    }),
  ];
  const kim = res('Kim Seo-yeon');
  const hung = res('Gia đình anh Hưng');
  const huy = res('Phạm Huy');
  const task = (n: number, no: string, type: HkTask['type'], extra: Partial<HkTask>): HkTask => ({
    id: uid(96_000 + n),
    roomId: room(no).id,
    roomNo: no,
    roomName: room(no).name ?? null,
    type,
    status: 'open',
    dueDate: T,
    source: 'system',
    priorityRank: 5,
    quantity: 1,
    version: 1,
    ...extra,
  });
  const reqTask = uid(96_004);
  const hkTasks: HkTask[] = [
    task(1, '302', 'extra_guest_kit_prepare', {
      priorityRank: 2,
      quantity: hung?.extraGuestCount || 1,
      reservationId: hung?.id ?? null,
      dueAt: at(T, hung?.etaTime ?? '14:00'),
    }),
    task(2, '203', 'checkout_clean', { priorityRank: 5 }),
    task(3, '101', 'stayover_clean', { priorityRank: 6, linenChange: true }),
    task(4, '402', 'guest_request', {
      id: reqTask,
      priorityRank: 3,
      source: 'guest_app',
      note: 'Thêm 2 khăn tắm',
      reservationId: kim?.id ?? null,
    }),
    task(5, '301', 'minibar_refill', {
      priorityRank: 7,
      status: 'done',
      doneAt: at(T, '09:40'),
      refillItems: [{ itemId: MINIBAR[1]!.itemId, itemName: MINIBAR[1]!.itemName, quantity: 2 }],
    }),
  ];
  const created = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const requests: GuestRequest[] = [
    {
      id: uid(97_501),
      reservationId: kim?.id ?? uid(1),
      roomNo: '402',
      roomName: room('402').name ?? null,
      type: 'amenities',
      note: 'Thêm 2 khăn tắm',
      status: 'acknowledged',
      routedTo: 'housekeeping',
      hkTaskId: reqTask,
      createdAt: created(40),
      feeVnd: null,
    },
    {
      id: uid(97_502),
      reservationId: nga?.id ?? uid(1),
      roomNo: '101',
      roomName: room('101').name ?? null,
      type: 'report_issue',
      note: 'Vòi sen nước yếu',
      status: 'acknowledged',
      routedTo: 'maintenance',
      workOrderId: uid(95_035),
      createdAt: created(25),
      feeVnd: null,
    },
    {
      id: uid(97_503),
      reservationId: huy?.id ?? uid(1),
      roomNo: '201',
      roomName: room('201').name ?? null,
      type: 'transport_tour',
      note: 'Đặt xe ra sân bay lúc 13:00',
      status: 'new',
      routedTo: 'front_desk',
      ackDueAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      isAckOverdue: true,
      createdAt: created(20),
      feeVnd: null,
    },
  ];
  const itemMeta = new Map<string, MockItemMeta>(
    MINIBAR.map((m, i) => [
      m.itemId,
      {
        code: ['coca', 'bia-da-lat', 'snack', 'nuoc-suoi'][i] ?? `item-${i}`,
        unit: ['lon', 'chai', 'gói', 'chai'][i] ?? 'cái',
        costPriceVnd: [9_000, 14_000, 11_000, 4_000][i],
        minStockQty: 24,
        isActive: true,
        version: 1,
      },
    ]),
  );
  return {
    blockMeta,
    workOrders,
    hkTasks,
    requests,
    itemMeta,
    idempotency: new Map<string, { status: number; body: unknown }>(),
    next: 100,
    nextWo: 36,
    /** `property.phone_public` – the only long number a `replyNote` may carry (B-15 step 5); none in the seed. */
    publicPhone: null as string | null,
  };
}

export function createOpsMock(ctx: Ctx) {
  const { guard, problem } = ctx;
  let st = makeState(ctx.db().rooms, ctx.rsv());
  const json = (body: unknown, status = 200) => HttpResponse.json(body as never, { status });
  const validation = (errors: Array<{ field: string; code: string }>) =>
    problem(422, 'VALIDATION_FAILED', { errors });
  const prop = '*/v1/properties/:propertyId';
  const T = () => todayLocal();
  const roomById = (id: unknown) => ctx.db().rooms.find((r) => r.id === id);
  const etag = (v: number) => ({ etag: `"${v}"` });
  /** Room of blocks removed from the EP02 list (cancelled / released before they started). */
  const removedRooms = new Map<string, string>();

  function idem(request: StrictRequest<DefaultBodyType>, scope: string) {
    const key = request.headers.get('idempotency-key');
    if (!key) return { key: null, replay: problem(428, 'PRECONDITION_REQUIRED') };
    const hit = st.idempotency.get(`${scope}:${key}`);
    return { key: `${scope}:${key}`, replay: hit ? json(hit.body, hit.status) : null };
  }
  function remember(key: string | null, status: number, body: unknown) {
    if (key) st.idempotency.set(key, { status, body });
    return json(body, status);
  }

  // ---------- room blocks (SM-02) ----------
  function blockView(id: string): RoomBlock | undefined {
    const m = st.blockMeta.get(id);
    const b = ctx.rsv().blocks.find((x) => x.id === id);
    if (!m) return undefined;
    const roomId = b?.roomId ?? removedRooms.get(id) ?? '';
    return {
      id,
      roomId,
      roomNo: roomById(roomId)?.roomNo,
      status: m.status,
      startDate: m.startDate,
      endDatePlanned: m.endDatePlanned,
      endDateActual: m.endDateActual,
      expectedDoneDate: m.expectedDoneDate,
      reason: m.reason,
      workOrderId: m.workOrderId,
      version: m.version,
    };
  }
  const allBlocks = (): RoomBlock[] =>
    [...st.blockMeta.keys()].map((id) => blockView(id)!).filter(Boolean);
  function setBlockEnd(id: string, to: string | null) {
    const list = ctx.rsv().blocks;
    const i = list.findIndex((b) => b.id === id);
    if (i < 0) return;
    if (to === null || to <= list[i]!.from) {
      removedRooms.set(id, list[i]!.roomId);
      list.splice(i, 1);
    } else list[i]!.to = to;
  }
  function refreshRoomStatus(roomId: string) {
    const r = roomById(roomId);
    if (!r) return;
    const s = ctx.roomStatus();
    const blocked = ctx
      .rsv()
      .blocks.some((b) => b.roomId === roomId && b.from <= T() && T() < b.to);
    if (blocked) s[r.roomNo] = 'OOO';
    else if (s[r.roomNo] === 'OOO') s[r.roomNo] = 'VD';
  }
  /** O4 – the block stops at `to` (= first sellable day); the room needs cleaning + inspection. */
  function release(id: string, to: string) {
    const m = st.blockMeta.get(id)!;
    const roomId = ctx.rsv().blocks.find((b) => b.id === id)?.roomId;
    m.status = 'released';
    m.endDateActual = to;
    m.version += 1;
    setBlockEnd(id, to);
    // O4: the room leaves OOO for "Cần dọn" with an after-repair cleaning task (US-062 AC1).
    const r = roomById(roomId);
    if (r) {
      ctx.roomStatus()[r.roomNo] = 'VD';
      st.hkTasks.push(newTask(r, 'after_repair_clean', { priorityRank: 5 }));
    }
  }
  /**
   * BR-804 / ARC A-03 order: in-house guest in the range → 409 ROOM_OCCUPIED; another block → ROOM_BLOCKED;
   * hold/confirmed booking → ROOM_UNAVAILABLE + conflicts[] – always (no manager override).
   */
  function blockConflict(roomId: string, from: string, to: string, ignoreBlockId?: string) {
    const room = roomById(roomId)!;
    const overl = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2;
    const nights = (a: string, b: string) =>
      Array.from({ length: nightsBetween(a, b) }, (_, i) => addDays(a, i)).filter(
        (d) => d >= from && d < to,
      );
    const res = ctx
      .rsv()
      .reservations.filter(
        (r) => r.roomId === roomId && overl(r.arrivalDate, r.departureDate, from, to),
      );
    const conflict = (statuses: ReservationStatus[]) =>
      res
        .filter((r) => statuses.includes(r.status))
        .map((r) => ({
          roomNo: room.roomNo,
          nights: nights(r.arrivalDate, r.departureDate),
          kind: r.status === 'hold' ? 'hold' : 'reservation',
          reservationCode: r.code,
          guestDisplayName: r.guestName,
        }));
    const inHouse = conflict(['in_house']);
    if (inHouse.length) return problem(409, 'ROOM_OCCUPIED', { conflicts: inHouse });
    const other = ctx
      .rsv()
      .blocks.find(
        (b) => b.roomId === roomId && b.id !== ignoreBlockId && overl(b.from, b.to, from, to),
      );
    if (other)
      return problem(409, 'ROOM_BLOCKED', {
        conflicts: [{ roomNo: room.roomNo, nights: nights(other.from, other.to), kind: 'ooo' }],
      });
    const future = conflict(['hold', 'confirmed']);
    if (future.length) return problem(409, 'ROOM_UNAVAILABLE', { conflicts: future });
    return null;
  }
  /** Fields of `block` / RoomBlockCreate → {start, end, expected} or 422 errors. */
  function blockFields(b: Body, prefix: string, roles: Role[]) {
    const errors: Array<{ field: string; code: string }> = [];
    const f = (k: string) => (prefix ? `${prefix}.${k}` : k);
    const start = String(b.startDate ?? '');
    const expected = b.expectedDoneDate ? String(b.expectedDoneDate) : undefined;
    const endPlanned = b.endDatePlanned ? String(b.endDatePlanned) : undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start))
      errors.push({ field: f('startDate'), code: 'REQUIRED' });
    else if (start < businessDayLocal())
      errors.push({ field: f('startDate'), code: 'DATE_IN_PAST' });
    if (expected && endPlanned) errors.push({ field: f('expectedDoneDate'), code: 'NOT_ALLOWED' });
    if (!expected && !endPlanned) errors.push({ field: f('expectedDoneDate'), code: 'REQUIRED' });
    if (expected && start && expected < start)
      errors.push({ field: f('expectedDoneDate'), code: 'DATE_ORDER' });
    if (endPlanned && start && endPlanned <= start)
      errors.push({ field: f('endDatePlanned'), code: 'DATE_ORDER' });
    if (String(b.reason ?? '').trim().length < 3)
      errors.push({ field: f('reason'), code: 'REASON_REQUIRED' });
    if (b.affectedReservationsAcknowledged === true && !has(roles, OWN_MGR))
      return { forbidden: true as const };
    // ooo_reopen_buffer_days = 1 (BR §13) – the server works it out, FD/MT never read the parameter.
    const end = endPlanned ?? (expected ? addDays(expected, 1) : '');
    return { errors, start, end, expected, reason: String(b.reason ?? '').trim() };
  }
  function addBlock(
    roomId: string,
    f: { start: string; end: string; expected?: string; reason: string },
    workOrderId?: string,
  ) {
    st.next += 1;
    const id = uid(94_000 + st.next);
    ctx.rsv().blocks.push({ id, roomId, from: f.start, to: f.end, reason: f.reason });
    st.blockMeta.set(id, {
      status: f.start <= T() ? 'active' : 'planned',
      startDate: f.start,
      endDatePlanned: f.end,
      endDateActual: null,
      expectedDoneDate: f.expected,
      workOrderId,
      reason: f.reason,
      version: 1,
    });
    refreshRoomStatus(roomId);
    // Open housekeeping tasks of a room that is closed today are dropped (cancelReasonCode room_blocked).
    if (f.start <= T())
      for (const t of st.hkTasks)
        if (t.roomId === roomId && t.status === 'open' && t.type.endsWith('_clean')) {
          t.status = 'cancelled';
          t.cancelReasonCode = 'room_blocked';
          t.version += 1;
        }
    return id;
  }

  // ---------- work orders (SM-04) ----------
  function woActions(w: MockWorkOrder, roles: Role[]): AllowedAction[] {
    if (!has(roles, [...FD_PLUS, MT])) return [];
    const a = (event: string, transition: string, action: string): AllowedAction => ({
      event,
      transition,
      action,
    });
    switch (w.status) {
      case 'new':
        return [a('accept', 'W2', 'accept'), a('cancel', 'W5', 'cancel')];
      case 'in_progress':
        return [a('wait_parts', 'W3', 'wait-parts'), a('complete', 'W4', 'complete')];
      case 'waiting_parts':
        return [a('resume', 'W3', 'resume'), a('cancel', 'W5', 'cancel')];
      case 'done':
        return w.doneAt && Date.now() - Date.parse(w.doneAt) <= 7 * 86_400_000
          ? [a('reopen', 'W6', 'reopen')]
          : [];
      default:
        return [];
    }
  }
  function woView(w: MockWorkOrder, roles: Role[]): WorkOrder {
    const { createdBy: _c, blockId, ...rest } = w;
    void _c;
    const roomBlock = blockId ? blockView(blockId) : undefined;
    return { ...rest, ...(roomBlock ? { roomBlock } : {}), allowedActions: woActions(w, roles) };
  }
  const occupied = (roomId: string) =>
    ctx.rsv().reservations.some((r) => r.roomId === roomId && r.status === 'in_house');

  // ---------- housekeeping ----------
  function newTask(r: Room, type: HkTask['type'], extra: Partial<HkTask> = {}): HkTask {
    st.next += 1;
    return {
      id: uid(96_000 + st.next),
      roomId: r.id,
      roomNo: r.roomNo,
      roomName: r.name ?? null,
      type,
      status: 'open',
      dueDate: T(),
      source: 'system',
      priorityRank: 5,
      quantity: 1,
      version: 1,
      ...extra,
    };
  }
  /** B18 (stay mock) → "Dọn trả phòng" appears in the list (US-054 AC1) – derived on read. */
  function syncCheckoutTasks() {
    for (const r of ctx.rsv().reservations) {
      const done = (r as { actualCheckoutAt?: string }).actualCheckoutAt;
      if (
        r.status !== 'checked_out' ||
        !r.roomId ||
        !done ||
        todayLocal(undefined, new Date(done)) !== T()
      )
        continue;
      if (
        st.hkTasks.some(
          (t) => t.roomId === r.roomId && t.type === 'checkout_clean' && t.dueDate === T(),
        )
      )
        continue;
      const room = roomById(r.roomId);
      if (room) st.hkTasks.push(newTask(room, 'checkout_clean', { reservationId: r.id }));
    }
  }

  // ---------- guest requests (SM-15, BR-811) ----------
  /** `replyNote` like the server (EP14 v0.3 4.4): ≤ 300, card number (V-09), then luật B-15 (`./replyNote`). */
  function replyErrors(note: string) {
    if (note.length > 300) return validation([{ field: 'replyNote', code: 'TOO_LONG' }]);
    const errs = replyNoteErrors(note, {
      publicPhone: st.publicPhone,
      currentYear: Number(T().slice(0, 4)),
    });
    if (!errs.length) return null;
    return errs[0]!.code === 'CARD_NUMBER_DETECTED'
      ? problem(422, 'CARD_NUMBER_DETECTED', { errors: errs })
      : validation(errs);
  }

  // ---------- minibar catalogue ----------
  function itemView(m: (typeof MINIBAR)[number], roles: Role[]): Item {
    const meta = st.itemMeta.get(m.itemId)!;
    return {
      id: m.itemId,
      code: meta.code,
      name: m.itemName,
      unit: meta.unit,
      isFree: m.isFree,
      salePriceVnd: m.isFree ? null : m.unitPriceVnd,
      ...(has(roles, OWN_MGR) && meta.costPriceVnd !== undefined
        ? { costPriceVnd: meta.costPriceVnd }
        : {}),
      minibarStandardQty: m.standardQty,
      minStockQty: meta.minStockQty,
      isActive: meta.isActive,
      version: meta.version,
    };
  }
  function itemErrors(b: Body, selfId?: string) {
    const errors: Array<{ field: string; code: string }> = [];
    const name = (b.name ?? {}) as { vi?: string; en?: string };
    const code = String(b.code ?? '').trim();
    if (!code) errors.push({ field: 'code', code: 'REQUIRED' });
    else if ([...st.itemMeta.entries()].some(([id, m]) => id !== selfId && m.code === code))
      errors.push({ field: 'code', code: 'DUPLICATE' });
    if (!String(name.vi ?? '').trim()) errors.push({ field: 'name.vi', code: 'REQUIRED' });
    if (!String(b.unit ?? '').trim()) errors.push({ field: 'unit', code: 'REQUIRED' });
    const std = Number(b.minibarStandardQty);
    if (!Number.isInteger(std) || std < 0)
      errors.push({ field: 'minibarStandardQty', code: 'VALIDATION_FAILED' });
    if (b.salePriceVnd !== null && b.salePriceVnd !== undefined && !(Number(b.salePriceVnd) > 0))
      errors.push({ field: 'salePriceVnd', code: 'AMOUNT_NOT_POSITIVE' });
    return { errors, name, code };
  }

  const handlers = [
    // ---------- housekeeping (S10) ----------
    http.get(`${prop}/room-statuses`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      const fd = has(g.roles, FD_PLUS);
      const res = ctx.rsv().reservations;
      const data: RoomStatusEntry[] = ctx
        .db()
        .rooms.filter((r) => r.isSellable !== false)
        .map((r) => {
          const status = (ctx.roomStatus()[r.roomNo] ?? 'VC') as RoomStatusEntry['status'];
          const guest = res.find((x) => x.roomId === r.id && x.status === 'in_house');
          const next = res
            .filter((x) => x.roomId === r.id && x.status === 'confirmed' && x.arrivalDate >= T())
            .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate))[0];
          return {
            roomId: r.id,
            roomNo: r.roomNo,
            roomName: r.name ?? null,
            status,
            statusLabel: STATUS_LABEL[status],
            since: at(T(), '08:00'),
            ...(fd && guest ? { currentGuest: guest.guestName } : {}),
            ...(next
              ? {
                  nextArrival: {
                    date: next.arrivalDate,
                    etaTime: next.etaTime,
                    ...(fd ? { guestDisplayName: next.guestName } : {}),
                  },
                }
              : {}),
            allowedEvents: [],
            openTaskIds: st.hkTasks
              .filter(
                (t) => t.roomId === r.id && (t.status === 'open' || t.status === 'in_progress'),
              )
              .map((t) => t.id),
            inspectionFailed: false,
            version: 1,
          };
        });
      return json({ data, asOf: nowIso() });
    }),
    http.get(`${prop}/hk-tasks`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      syncCheckoutTasks();
      const url = new URL(request.url);
      const date = url.searchParams.get('date') ?? T();
      const status = url.searchParams.get('status');
      const day = st.hkTasks.filter(
        (t) => t.dueDate === date || (t.dueDate < date && t.status === 'open'),
      );
      const data = day
        .filter((t) => !status || t.status === status)
        .map((t) => (t.dueDate < date ? { ...t, carriedOver: true } : t))
        .sort(
          (a, b) =>
            (a.priorityRank ?? 9) - (b.priorityRank ?? 9) || a.roomNo.localeCompare(b.roomNo),
        );
      const counted = day.filter((t) => t.status !== 'cancelled');
      return json({
        data,
        summary: { done: counted.filter((t) => t.status === 'done').length, total: counted.length },
      });
    }),
    http.post(`${prop}/hk-tasks`, async ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, 'hk-create');
      if (replay) return replay;
      const b = (await request.json()) as Body;
      const errors: Array<{ field: string; code: string }> = [];
      const room = roomById(b.roomId);
      if (!room) errors.push({ field: 'roomId', code: 'NOT_IN_LIST' });
      if (!MANUAL_TASK_TYPES.includes(String(b.type)))
        errors.push({ field: 'type', code: 'NOT_IN_LIST' });
      const due = String(b.dueDate ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) errors.push({ field: 'dueDate', code: 'REQUIRED' });
      else if (due < businessDayLocal()) errors.push({ field: 'dueDate', code: 'DATE_IN_PAST' });
      if (typeof b.note === 'string' && /(?:\d[ -]?){13,19}/.test(b.note))
        errors.push({ field: 'note', code: 'CARD_NUMBER_DETECTED' });
      if (errors.length) return validation(errors);
      if (ctx.roomStatus()[room!.roomNo] === 'OOO') return problem(409, 'ROOM_BLOCKED');
      const t = newTask(room!, b.type as HkTask['type'], {
        dueDate: due,
        source: 'manual',
        note: b.note ? String(b.note) : undefined,
        priorityRank: b.type === 'priority_clean' ? 1 : 7,
      });
      st.hkTasks.push(t);
      return remember(key, 201, t);
    }),
    http.post(`${prop}/hk-tasks/:taskId/actions/:action`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, HK]);
      if (isResponse(g)) return g;
      const t = st.hkTasks.find((x) => x.id === params.taskId);
      if (!t) return problem(404, 'NOT_FOUND');
      const { key, replay } = idem(request, `hk:${t.id}`);
      if (replay) return replay;
      const b = ((await request.json().catch(() => ({}))) ?? {}) as Body;
      const action = String(params.action);
      if (!b.performedAt) return validation([{ field: 'performedAt', code: 'REQUIRED' }]);
      if (t.status === 'done' || t.status === 'cancelled')
        return problem(409, 'INVALID_TRANSITION', { currentState: t.status });
      if (action === 'start') t.status = 'in_progress';
      else if (action === 'complete') {
        t.status = 'done';
        t.doneAt = String(b.performedAt);
        // A guest request task done → the request is done (SM-15).
        for (const r of st.requests) if (r.hkTaskId === t.id) r.status = 'done';
      } else if (action === 'cancel') {
        const code = String(b.cancelReasonCode ?? '');
        if (!code) return validation([{ field: 'cancelReasonCode', code: 'REQUIRED' }]);
        if (!['guest_refused', 'dnd', 'other'].includes(code))
          return validation([{ field: 'cancelReasonCode', code: 'NOT_IN_LIST' }]);
        if (code === 'other' && String(b.cancelNote ?? '').trim().length < 3)
          return validation([{ field: 'cancelNote', code: 'REQUIRED' }]);
        if (!has(g.roles, FD_PLUS) && !['stayover_clean', 'long_stay_clean'].includes(t.type))
          return problem(403, 'FORBIDDEN_ACTION');
        t.status = 'cancelled';
        t.cancelReasonCode = code as HkTask['cancelReasonCode'];
        if (code === 'other') t.cancelNote = String(b.cancelNote).trim();
      } else return problem(404, 'NOT_FOUND');
      t.version += 1;
      return remember(key, 200, t);
    }),

    // ---------- work orders (S11) ----------
    http.get(`${prop}/work-orders`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      const status = new URL(request.url).searchParams.get('status');
      const data = st.workOrders
        .filter((w) => !status || w.status === status)
        .filter((w) => !(g.roles.length === 1 && g.roles[0] === HK) || w.createdBy === g.user.id)
        .map((w) => woView(w, g.roles));
      return json({ data, page: { hasMore: false } });
    }),
    http.get(`${prop}/work-orders/:workOrderId`, ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      const w = st.workOrders.find((x) => x.id === params.workOrderId);
      if (!w) return problem(404, 'NOT_FOUND');
      return json(woView(w, g.roles), 200);
    }),
    http.post(`${prop}/work-orders`, async ({ request }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, 'wo-create');
      if (replay) return replay;
      const b = (await request.json()) as Body;
      const block = b.block as Body | undefined;
      if (block && !has(g.roles, [...FD_PLUS, MT])) return problem(403, 'FORBIDDEN_ACTION');
      const errors: Array<{ field: string; code: string }> = [];
      const room = roomById(b.roomId);
      if (!room) errors.push({ field: 'roomId', code: 'NOT_IN_LIST' });
      if (!String(b.title ?? '').trim()) errors.push({ field: 'title', code: 'REQUIRED' });
      if (!String(b.description ?? '').trim())
        errors.push({ field: 'description', code: 'REQUIRED' });
      const category = String(b.category ?? '');
      if (
        ![
          'hot_water',
          'power',
          'leak',
          'door_lock',
          'wifi',
          'broken_item',
          'drain',
          'other',
        ].includes(category)
      )
        errors.push({ field: 'category', code: category ? 'NOT_IN_LIST' : 'REQUIRED' });
      const bf = block ? blockFields(block, 'block', g.roles) : null;
      if (bf && 'forbidden' in bf) return problem(403, 'FORBIDDEN_ACTION');
      if (bf) errors.push(...bf.errors);
      if (errors.length) return validation(errors);
      if (bf && !('forbidden' in bf)) {
        const c = blockConflict(room!.id, bf.start, bf.end);
        if (c) return c;
      }
      const occ = occupied(room!.id);
      const severity =
        (b.severity as WorkOrder['severity']) ??
        (HIGH_CATEGORIES.includes(category) && occ ? 'high' : occ ? 'medium' : 'low');
      st.nextWo += 1;
      const id = uid(95_000 + st.nextWo);
      const w: MockWorkOrder = {
        id,
        code: `WO-000${st.nextWo}`,
        roomId: room!.id,
        roomNo: room!.roomNo,
        roomName: room!.name ?? null,
        title: String(b.title).trim(),
        description: String(b.description).trim(),
        severity,
        status: 'new',
        source: has(g.roles, FD_PLUS)
          ? 'front_desk'
          : g.roles.includes(MT)
            ? 'maintenance'
            : 'housekeeping',
        category: category as WorkOrder['category'],
        reportedBy: g.user.displayName,
        blockRequested: b.blockRequested === true,
        photoAttachmentIds: (b.photoAttachmentIds as string[] | undefined) ?? [],
        createdBy: g.user.id,
        history: [
          { at: nowIso(), actorName: g.user.displayName, change: 'created', from: null, to: 'new' },
        ],
        version: 1,
      };
      if (bf && !('forbidden' in bf)) {
        w.blockId = addBlock(room!.id, bf, id);
        w.history!.push({
          at: nowIso(),
          actorName: g.user.displayName,
          change: 'block',
          from: null,
          to: `${bf.start}→${bf.end}`,
        });
      }
      st.workOrders.unshift(w);
      return remember(key, 201, woView(w, g.roles));
    }),
    http.patch(`${prop}/work-orders/:workOrderId`, async ({ request, params }) => {
      const w = st.workOrders.find((x) => x.id === params.workOrderId);
      const g = guard(request, [...FD_PLUS, MT], w ? { ifMatch: w.version } : {});
      if (isResponse(g)) return g;
      if (!w) return problem(404, 'NOT_FOUND');
      const b = (await request.json()) as Body;
      const who = g.user.displayName;
      if (b.severity && b.severity !== w.severity) {
        if (!['high', 'medium', 'low'].includes(String(b.severity)))
          return validation([{ field: 'severity', code: 'NOT_IN_LIST' }]);
        w.history!.push({
          at: nowIso(),
          actorName: who,
          change: 'severity',
          from: w.severity,
          to: String(b.severity),
        });
        w.severity = b.severity as WorkOrder['severity'];
      }
      if (typeof b.partsNote === 'string') w.partsNote = b.partsNote;
      if (b.blockRequested === false && w.blockRequested) {
        w.blockRequested = false;
        w.history!.push({
          at: nowIso(),
          actorName: who,
          change: 'block_requested',
          from: 'true',
          to: 'false',
        });
      }
      w.version += 1;
      return HttpResponse.json(woView(w, g.roles) as never, { headers: etag(w.version) });
    }),
    http.post(`${prop}/work-orders/:workOrderId/actions/:action`, async ({ request, params }) => {
      const w = st.workOrders.find((x) => x.id === params.workOrderId);
      const g = guard(request, [...FD_PLUS, MT], w ? { ifMatch: w.version } : {});
      if (isResponse(g)) return g;
      if (!w) return problem(404, 'NOT_FOUND');
      const { key, replay } = idem(request, `wo:${w.id}`);
      if (replay) return replay;
      const b = ((await request.json().catch(() => ({}))) ?? {}) as Body;
      const action = String(params.action);
      const who = g.user.displayName;
      const from = w.status;
      const allowed = woActions(w, g.roles).some((a) => a.action === action);
      if (!allowed) return problem(409, 'INVALID_TRANSITION', { currentState: w.status });
      const note = String(b.note ?? '').trim();
      if (action === 'accept') {
        w.status = 'in_progress';
        w.acceptedAt = nowIso();
        w.assigneeName = w.assigneeName ?? who;
      } else if (action === 'wait-parts') {
        const errors: Array<{ field: string; code: string }> = [];
        if (note.length < 3) errors.push({ field: 'note', code: 'REQUIRED' });
        const d = b.partsExpectedDate ? String(b.partsExpectedDate) : '';
        if (!d && w.severity !== 'high')
          errors.push({ field: 'partsExpectedDate', code: 'REQUIRED' });
        if (d && d < T()) errors.push({ field: 'partsExpectedDate', code: 'DATE_IN_PAST' });
        if (errors.length) return validation(errors);
        w.status = 'waiting_parts';
        w.partsNote = note;
        if (d) {
          w.partsExpectedDate = d;
          w.history!.push({
            at: nowIso(),
            actorName: who,
            change: 'parts_expected_date',
            from: null,
            to: d,
          });
        }
      } else if (action === 'resume') w.status = 'in_progress';
      else if (action === 'complete') {
        const result = String(b.resultNote ?? '').trim();
        if (result.length < 3) return validation([{ field: 'resultNote', code: 'REQUIRED' }]);
        const photos = (b.photoAttachmentIds as string[] | undefined) ?? [];
        if (['high', 'medium'].includes(w.severity) && !photos.length)
          return validation([{ field: 'photoAttachmentIds', code: 'EVIDENCE_REQUIRED' }]);
        w.status = 'done';
        w.doneAt = nowIso();
        w.resultNote = result;
        // W4 + O4: the linked block ends – back on sale from the next business day, room VD + cleaning.
        const m = w.blockId ? st.blockMeta.get(w.blockId) : undefined;
        if (m && (m.status === 'active' || m.status === 'planned')) {
          if (m.status === 'planned') {
            m.status = 'cancelled';
            m.version += 1;
            setBlockEnd(w.blockId!, null);
          } else release(w.blockId!, addDays(T(), 1));
        }
        for (const r of st.requests) if (r.workOrderId === w.id) r.status = 'done';
      } else if (action === 'cancel') {
        if (String(b.cancelReason ?? '').trim().length < 3)
          return validation([{ field: 'cancelReason', code: 'REQUIRED' }]);
        if (!has(g.roles, FD_PLUS) && (w.createdBy !== g.user.id || w.status !== 'new'))
          return problem(403, 'FORBIDDEN_ACTION');
        w.status = 'cancelled';
        const m = w.blockId ? st.blockMeta.get(w.blockId) : undefined;
        if (m?.status === 'planned') {
          m.status = 'cancelled';
          m.version += 1;
          setBlockEnd(w.blockId!, null);
        } else if (m?.status === 'active') release(w.blockId!, T());
      } else if (action === 'reopen') {
        if (note.length < 3) return validation([{ field: 'note', code: 'REQUIRED' }]);
        w.status = 'in_progress';
        delete w.doneAt;
      }
      w.history!.push({ at: nowIso(), actorName: who, change: 'status', from, to: w.status });
      if (note && action !== 'wait-parts')
        w.history!.push({
          at: nowIso(),
          actorName: who,
          change: 'note',
          from: null,
          to: null,
          note,
        });
      w.version += 1;
      return remember(key, 200, woView(w, g.roles));
    }),

    // ---------- room blocks (US-019) ----------
    http.get(`${prop}/room-blocks`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, MT]);
      if (isResponse(g)) return g;
      const url = new URL(request.url);
      const from = url.searchParams.get('from') ?? '0000-01-01';
      const to = url.searchParams.get('to') ?? '9999-12-31';
      const data = allBlocks().filter(
        (b) => b.startDate < to && (b.endDateActual ?? b.endDatePlanned) > from,
      );
      return json({ data });
    }),
    http.post(`${prop}/room-blocks`, async ({ request }) => {
      const g = guard(request, [...FD_PLUS, MT]);
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, 'block-create');
      if (replay) return replay;
      const b = (await request.json()) as Body;
      const room = roomById(b.roomId);
      const bf = blockFields(b, '', g.roles);
      if ('forbidden' in bf) return problem(403, 'FORBIDDEN_ACTION');
      const errors = [...bf.errors];
      if (!room) errors.unshift({ field: 'roomId', code: 'NOT_IN_LIST' });
      if (errors.length) return validation(errors);
      const c = blockConflict(room!.id, bf.start, bf.end);
      if (c) return c;
      const woId = b.workOrderId ? String(b.workOrderId) : undefined;
      const id = addBlock(room!.id, bf, woId);
      const w = woId ? st.workOrders.find((x) => x.id === woId) : undefined;
      if (w) {
        w.blockId = id;
        w.blockRequested = false;
        w.history!.push({
          at: nowIso(),
          actorName: g.user.displayName,
          change: 'block',
          from: null,
          to: `${bf.start}→${bf.end}`,
        });
        w.version += 1;
      }
      return remember(key, 201, blockView(id));
    }),
    http.patch(`${prop}/room-blocks/:roomBlockId`, async ({ request, params }) => {
      const id = String(params.roomBlockId);
      const m = st.blockMeta.get(id);
      const g = guard(request, [...FD_PLUS, MT], m ? { ifMatch: m.version } : {});
      if (isResponse(g)) return g;
      const cur = m ? ctx.rsv().blocks.find((x) => x.id === id) : undefined;
      if (!m || !cur || !['planned', 'active'].includes(m.status)) return problem(404, 'NOT_FOUND');
      const b = (await request.json()) as Body;
      const end = String(b.endDatePlanned ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(end))
        return validation([{ field: 'endDatePlanned', code: 'REQUIRED' }]);
      if (end <= m.startDate || end <= T())
        return validation([{ field: 'endDatePlanned', code: 'DATE_ORDER' }]);
      if (end > m.endDatePlanned) {
        const c = blockConflict(cur.roomId, m.endDatePlanned, end, id);
        if (c) return c;
      }
      m.endDatePlanned = end;
      m.version += 1;
      setBlockEnd(id, end);
      return HttpResponse.json(blockView(id) as never, { headers: etag(m.version) });
    }),
    http.post(`${prop}/room-blocks/:roomBlockId/actions/:action`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, MT]);
      if (isResponse(g)) return g;
      const id = String(params.roomBlockId);
      const m = st.blockMeta.get(id);
      if (!m) return problem(404, 'NOT_FOUND');
      const { key, replay } = idem(request, `block:${id}`);
      if (replay) return replay;
      const b = (await request.json()) as Body;
      if (String(b.reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      const action = String(params.action);
      if (action === 'cancel') {
        if (m.status !== 'planned')
          return problem(409, 'INVALID_TRANSITION', { currentState: m.status });
        m.status = 'cancelled';
        m.version += 1;
        setBlockEnd(id, null);
      } else if (action === 'release') {
        if (m.status !== 'active')
          return problem(409, 'INVALID_TRANSITION', { currentState: m.status });
        // A87: without its work order only MGR+; with an open work order → close the work order.
        const w = m.workOrderId ? st.workOrders.find((x) => x.id === m.workOrderId) : undefined;
        if (w && !['done', 'cancelled'].includes(w.status))
          return problem(409, 'INVALID_TRANSITION', {
            currentState: m.status,
            workOrderCode: w.code,
          });
        if (!has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
        release(id, T());
      } else return problem(404, 'NOT_FOUND');
      return remember(key, 200, blockView(id) ?? allBlocks().find((x) => x.id === id));
    }),

    // ---------- guest requests (S30, US-110) ----------
    http.get(`${prop}/guest-requests`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      const status = new URL(request.url).searchParams.get('status');
      const fd = has(g.roles, FD_PLUS);
      const dept = g.roles.includes(HK) ? 'housekeeping' : 'maintenance';
      const data = st.requests
        .filter((r) => !status || r.status === status)
        .filter((r) => fd || r.routedTo === dept)
        .map((r) => {
          const out: GuestRequest = { ...r };
          if (!fd) delete out.feeVnd;
          return out;
        });
      return json({ data });
    }),
    http.post(`${prop}/guest-requests/:requestId/actions/:action`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, HK, MT]);
      if (isResponse(g)) return g;
      const r = st.requests.find((x) => x.id === params.requestId);
      if (!r) return problem(404, 'NOT_FOUND');
      const { key, replay } = idem(request, `req:${r.id}`);
      if (replay) return replay;
      const b = ((await request.json().catch(() => ({}))) ?? {}) as Body;
      const action = String(params.action);
      const open = ['new', 'acknowledged', 'in_progress'];
      if (!open.includes(r.status))
        return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
      const reply = String(b.replyNote ?? '').trim();
      // Luật B-15 is for the staff reply only – the guest's own `note` is never checked here.
      const bad = reply ? replyErrors(reply) : null;
      if (bad) return bad;
      if (action === 'acknowledge') {
        if (r.status !== 'new')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        r.status = 'acknowledged';
        r.isAckOverdue = false;
      } else if (action === 'complete') r.status = 'done';
      else if (action === 'decline') {
        const code = String(b.declinedReasonCode ?? '');
        if (!code) return validation([{ field: 'declinedReasonCode', code: 'REQUIRED' }]);
        if (
          ![
            'not_available_now',
            'outside_service_hours',
            'needs_front_desk',
            'duplicate',
            'other',
          ].includes(code)
        )
          return validation([{ field: 'declinedReasonCode', code: 'NOT_IN_LIST' }]);
        if (code === 'other' && !reply)
          return validation([{ field: 'replyNote', code: 'REQUIRED' }]);
        r.status = 'declined';
        r.declinedReasonCode = code as GuestRequest['declinedReasonCode'];
      } else return problem(404, 'NOT_FOUND');
      if (reply) r.replyNote = reply;
      r.updatedAt = nowIso();
      return remember(key, 200, r);
    }),

    // ---------- attachments (B-01) – read back a non-ID photo ----------
    http.get(`${prop}/attachments/:attachmentId`, ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, HK, MT, 'sales_staff', 'collaborator']);
      if (isResponse(g)) return g;
      if (!ctx.attachments().has(String(params.attachmentId))) return problem(404, 'NOT_FOUND');
      return new HttpResponse(new Uint8Array([0xff, 0xd8, 0xff]), {
        headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, no-store' },
      });
    }),

    // ---------- minibar catalogue (S13, US-066) ----------
    http.get(`${prop}/items`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, HK]);
      if (isResponse(g)) return g;
      return json({ data: MINIBAR.map((m) => itemView(m, g.roles)) });
    }),
    http.post(`${prop}/items`, async ({ request }) => {
      const g = guard(request, OWN_MGR);
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, 'item-create');
      if (replay) return replay;
      const b = (await request.json()) as Body;
      const { errors, name, code } = itemErrors(b);
      if (errors.length) return validation(errors);
      st.next += 1;
      const itemId = uid(7000 + st.next);
      const sale =
        b.salePriceVnd === null || b.salePriceVnd === undefined ? null : Number(b.salePriceVnd);
      MINIBAR.push({
        itemId,
        itemName: String(name.vi).trim(),
        standardQty: Number(b.minibarStandardQty),
        isFree: sale === null,
        unitPriceVnd: sale ?? 0,
      });
      st.itemMeta.set(itemId, {
        code,
        unit: String(b.unit).trim(),
        nameEn: name.en,
        costPriceVnd: b.costPriceVnd === undefined ? undefined : Number(b.costPriceVnd),
        minStockQty: Number(b.minStockQty ?? 0),
        isActive: b.isActive !== false,
        version: 1,
      });
      return remember(key, 201, itemView(MINIBAR[MINIBAR.length - 1]!, g.roles));
    }),
    http.patch(`${prop}/items/:itemId`, async ({ request, params }) => {
      const m = MINIBAR.find((x) => x.itemId === params.itemId);
      const meta = m ? st.itemMeta.get(m.itemId) : undefined;
      const g = guard(request, OWN_MGR, meta ? { ifMatch: meta.version } : {});
      if (isResponse(g)) return g;
      if (!m || !meta) return problem(404, 'NOT_FOUND');
      const b = (await request.json()) as Body;
      const { errors, name, code } = itemErrors(b, m.itemId);
      if (errors.length) return validation(errors);
      // US-066 AC2: the next checks use the new price; posted folio lines keep theirs (stay mock copies it).
      const sale =
        b.salePriceVnd === null || b.salePriceVnd === undefined ? null : Number(b.salePriceVnd);
      m.itemName = String(name.vi).trim();
      m.standardQty = Number(b.minibarStandardQty);
      m.isFree = sale === null;
      m.unitPriceVnd = sale ?? 0;
      Object.assign(meta, {
        code,
        unit: String(b.unit).trim(),
        nameEn: name.en,
        costPriceVnd: b.costPriceVnd === undefined ? meta.costPriceVnd : Number(b.costPriceVnd),
        minStockQty: Number(b.minStockQty ?? meta.minStockQty),
        isActive: b.isActive !== false,
        version: meta.version + 1,
      });
      return HttpResponse.json(itemView(m, g.roles) as never, { headers: etag(meta.version) });
    }),
  ];

  return {
    handlers,
    reset() {
      MINIBAR.splice(0, MINIBAR.length, ...MINIBAR_SEED.map((m) => ({ ...m })));
      removedRooms.clear();
      st = makeState(ctx.db().rooms, ctx.rsv());
    },
    get state() {
      return st;
    },
    /** "Cần chú ý" items this mock owns (BR-907): urgent work orders open, requests not picked up in time. */
    attentionItems(): AttentionItem[] {
      const high = st.workOrders.filter(
        (w) => w.severity === 'high' && !['done', 'cancelled'].includes(w.status),
      );
      const late = st.requests.filter((r) => r.isAckOverdue && r.status === 'new');
      return [
        ...(high.length
          ? [
              {
                kind: 'work_order_high_open' as const,
                source: 'computed' as const,
                severity: high.some((w) => w.isOverdue)
                  ? ('critical' as const)
                  : ('warning' as const),
                count: high.length,
                roomNos: high.map((w) => w.roomNo ?? '').filter(Boolean),
              },
            ]
          : []),
        ...(late.length
          ? [
              {
                kind: 'guest_request_overdue' as const,
                source: 'computed' as const,
                severity: 'warning' as const,
                count: late.length,
                roomNos: late.map((r) => r.roomNo).filter((x): x is string => !!x),
              },
            ]
          : []),
      ];
    },
  };
}
