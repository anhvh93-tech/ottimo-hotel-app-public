// MSW mock of EP02 (rack, availability, reservations SM-01, quotes, commissions) – OpenAPI 0.3.4.
// Rules mirrored from docs/specs/EP02-reservations.md: x-roles / x-scope, server check order
// (fields → sellable → OOO → overlap → money), 409 ROOM_UNAVAILABLE with conflicts[] + suggestions[],
// If-Match → 412, Idempotency-Key replay, allowedActions by status AND role. Dates are relative to
// "today" so the rack always has data. Dev/test only – never bundled (main.tsx dynamic import).
import type {
  Channel,
  Commission,
  GuestSummary,
  Quote,
  QuoteCalculation,
  QuoteInput,
  RackBar,
  Reservation,
  ReservationCreate,
  ReservationStatus,
  Role,
  Parameter,
  Room,
  RoomGroup,
} from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { todayLocal } from '../app/dates';
import type { MockGuest, MockUser } from './seed';

type Guard = { user: MockUser; roles: Role[] } | Response;
interface Ctx {
  guard: (
    request: StrictRequest<DefaultBodyType>,
    allowed: Role[] | 'any',
    opts?: { ifMatch?: number },
  ) => Guard;
  problem: (status: number, code: string, extra?: Record<string, unknown>) => Response;
  db: () => {
    users: MockUser[];
    rooms: Room[];
    guests: MockGuest[];
    groups: RoomGroup[];
    params: Parameter[];
  };
  summary: (g: MockGuest, roles: Role[]) => Record<string, unknown>;
}

const OWN_MGR: Role[] = ['owner', 'manager'];
const LEAD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead'];
const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const SALES: Role[] = ['sales_staff', 'collaborator'];
const ALL_STAFF: Role[] = [...FD_PLUS, 'housekeeping', 'maintenance', ...SALES];
const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));

const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const USER = { fd: uid(4), sal: uid(7), ctv: uid(8) };
export const LONG_STAY_FROM_NIGHTS = 28;
/** DOM D-5 (s2-DOM) reason codes for move/postpone – `other` needs a note. */
export const MOVE_REASONS = [
  'guest_request',
  'property_fault',
  'overbooking',
  'upgrade',
  'inventory_optimize',
  'force_majeure',
  'other',
] as const;

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const nightsBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2;

export interface MockReservation extends Reservation {
  /** Sprint 3 mock: guest nationality on the booking (drives VN/foreigner registration). */
  nationality?: string;
  createdBy?: string;
  guestName: string;
  roomId: string | null;
  depositPaidVnd: number;
  holdCreatedAt?: string;
  /** BR-424 "căn gốc" of an OTA booking (first room assigned) – S4-05/S4-21 room change difference. */
  originalRoomId?: string;
  /** Mock-only: `room_change_difference` currently on the folio (OTA guest request). */
  roomChangeDifferenceVnd?: number;
}
/** One service line of a folio as `CancellationQuote.serviceLines` shows it (0.3.7 D1, S4-08). */
export interface MockServiceLine {
  lineId: string;
  category: string;
  labelKey?: string;
  labelParams?: Record<string, string | number>;
  serviceDate?: string;
  amountVnd: number;
  performed: boolean;
}
/**
 * The folio side the EP02 handlers need (the Sprint 3 mock owns folios/payments and plugs itself in –
 * no import cycle): S4-08 service lines on cancel / no-show, S4-28 deposit paid through a VietQR.
 */
export interface MockFolioPort {
  serviceLines: (r: MockReservation) => MockServiceLine[];
  reverseServiceLines: (r: MockReservation, keep: string[], by: string) => void;
  /** `confirmDeposit.existingPaymentId`: a succeeded deposit payment of this booking's folio. */
  depositPayment: (r: MockReservation, paymentId: string) => boolean;
}
interface MockBlock {
  id: string;
  roomId: string;
  from: string;
  to: string;
  reason: string;
}
interface MockQuote extends Quote {
  createdBy: string;
  input: QuoteInput;
}
interface MockCommission extends Commission {
  payeeUserId: string;
}

export function seedChannels(): Channel[] {
  const c = (n: number, code: string, name: string, channelGroup: Channel['channelGroup']) => ({
    id: uid(500 + n),
    code,
    name,
    channelGroup,
    isActive: true,
    requiresOtaRef: channelGroup === 'ota',
  });
  return [
    c(1, 'direct', 'Trực tiếp', 'direct'),
    c(2, 'agent', 'CTV / môi giới', 'agent'),
    c(3, 'booking', 'Booking.com', 'ota'),
    c(4, 'agoda', 'Agoda', 'ota'),
    c(5, 'airbnb', 'Airbnb', 'ota'),
    c(6, 'expedia', 'Expedia', 'ota'),
    c(7, 'internal', 'Nội bộ', 'internal'),
  ];
}

const ROOM_STATUS: Record<string, string> = {
  '101': 'OD',
  '102': 'OD',
  '103': 'VI',
  '201': 'OD',
  '202': 'VC',
  '203': 'VD',
  '301': 'OC',
  '302': 'VI',
  '401': 'OOO',
  '402': 'OD',
};

function makeState(rooms: Room[], channels: Channel[]) {
  const T = todayLocal();
  const room = (no: string) => rooms.find((r) => r.roomNo === no)!;
  const ch = (code: string) => channels.find((c) => c.code === code)!;
  let n = 140;
  const res = (
    no: string | null,
    guest: string,
    fromOff: number,
    toOff: number,
    status: ReservationStatus,
    channel: string,
    extra: Partial<MockReservation> = {},
  ): MockReservation => {
    n += 1;
    const r = no ? room(no) : null;
    const arrivalDate = addDays(T, fromOff);
    const departureDate = addDays(T, toOff);
    const nights = nightsBetween(arrivalDate, departureDate);
    const rate = r?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
    const total = rate * nights;
    return {
      id: uid(1000 + n),
      code: `OTM-0${n}`,
      status,
      stayType: 'short',
      channelId: ch(channel).id,
      channelCode: channel,
      paymentModel: ch(channel).channelGroup === 'ota' ? 'ota_prepaid' : 'direct',
      booker: { id: uid(2000 + n), code: `KH-0${n}`, displayName: guest },
      guestName: guest,
      externalContract: false,
      folioId: uid(3000 + n),
      roomId: r?.id ?? null,
      segments: r
        ? [{ roomId: r.id, roomNo: r.roomNo, fromDate: arrivalDate, toDate: departureDate }]
        : [],
      arrivalDate,
      departureDate,
      nights,
      adults: 2,
      children6to11: 0,
      childrenUnder6: 0,
      extraGuestCount: 0,
      partyMissingCount: 1,
      depositRequiredVnd: Math.round((total * 0.3) / 100_000) * 100_000,
      totalRoomVnd: total,
      balanceDueVnd: total,
      nightlyRates: Array.from({ length: Math.min(nights, 31) }, (_, i) => ({
        date: addDays(arrivalDate, i),
        amountVnd: rate,
      })),
      conflictState: 'none',
      allowedActions: [],
      version: 1,
      depositPaidVnd: 0,
      createdBy: USER.fd,
      ...extra,
    };
  };
  const now = Date.now();
  const reservations: MockReservation[] = [
    res('101', 'Trần Thu Nga', -2, 2, 'in_house', 'airbnb'),
    res('101', 'Sophie Martin', 3, 6, 'confirmed', 'booking'),
    res('102', 'Emma Laurent', -40, 50, 'in_house', 'direct', {
      stayType: 'long',
      externalContract: true,
      adults: 1,
      manualLongStay: {
        monthlyRentVnd: 9_000_000,
        depositHeldVnd: 18_000_000,
        externalContractRef: 'HĐ-2026-09',
      },
    }),
    res('103', 'Hoàng Long', -3, -1, 'checked_out', 'agoda'),
    res('103', 'Anna Martin', 0, 3, 'confirmed', 'booking'),
    res('103', 'Lê Minh', 4, 6, 'hold', 'agent', {
      createdBy: USER.ctv,
      closerUserId: USER.ctv,
      holdCreatedAt: new Date(now - 90 * 60_000).toISOString(),
      hold: {
        hours: 24,
        expiresAt: new Date(now + (22 * 60 + 30) * 60_000).toISOString(),
        extendedCount: 0,
      },
    }),
    res('201', 'Phạm Huy', -3, 0, 'in_house', 'agoda'),
    res('201', 'Lê Thu Trang', 2, 4, 'confirmed', 'agent', { createdBy: USER.sal }),
    res('202', 'Nguyễn Văn An', 1, 5, 'confirmed', 'direct', {
      directSource: 'zalo_phone',
      depositPaidVnd: 1_000_000,
    }),
    res('202', 'Vũ Thị Lan', 0, 1, 'no_show', 'direct', { directSource: 'zalo_phone' }),
    res('203', 'Ngọc Anh', -3, -1, 'checked_out', 'direct'),
    res('203', 'Ji-woo Park', 4, 7, 'confirmed', 'booking'),
    res('203', 'Tanaka Yui', 8, 11, 'confirmed', 'airbnb'),
    res('301', 'Daniel Weber', -75, 290, 'in_house', 'direct', {
      stayType: 'long',
      externalContract: true,
      adults: 1,
      manualLongStay: {
        monthlyRentVnd: 11_130_000,
        depositHeldVnd: 22_300_000,
        externalContractRef: 'HĐ-2026-08',
      },
    }),
    res('302', 'Gia đình anh Hưng', 0, 4, 'confirmed', 'direct', {
      adults: 4,
      extraGuestCount: 1,
      etaTime: '15:30',
      partyMissingCount: 3,
      directSource: 'zalo_phone',
      depositPaidVnd: 1_200_000,
    }),
    res('302', 'Olga Ivanova', 6, 9, 'confirmed', 'agoda'),
    res('401', 'Chen Wei', 2, 6, 'confirmed', 'airbnb'),
    res('402', 'Kim Seo-yeon', -1, 3, 'in_house', 'airbnb'),
    res('402', 'Trần Quốc Bảo', 5, 8, 'confirmed', 'direct', { depositPaidVnd: 900_000 }),
    res(null, 'Hannah Schmidt', 6, 8, 'confirmed', 'agoda', {
      // 0.3.5 A-25: group the channel mapped the booking to (Agoda → Lầu 1–2).
      requestedRoomGroupId: room('203').roomGroupId,
      conflictState: 'open',
      otaRef: '1182736455',
    }),
  ];
  for (const r of reservations) r.balanceDueVnd = (r.totalRoomVnd ?? 0) - r.depositPaidVnd;
  const blocks: MockBlock[] = [
    {
      id: uid(4001),
      roomId: room('401').id,
      from: T,
      to: addDays(T, 2),
      reason: 'hỏng bình nóng lạnh',
    },
  ];
  return {
    channels,
    reservations,
    blocks,
    quotes: [] as MockQuote[],
    commissions: [] as MockCommission[],
    notices: [] as Array<{
      id: string;
      reservationId: string;
      amountVnd: number;
      note?: string;
      attachmentId?: string;
      createdAt: string;
      updatedAt: string;
      createdByName: string;
    }>,
    idempotency: new Map<string, { status: number; body: unknown }>(),
    nextRes: 170,
    nextQuote: 49,
  };
}

/** Extra mock guests for EP02 flows (codes ≥ KH-0030 so S1 tests keep KH-0022 as the next code). */
function extraGuests(): MockGuest[] {
  const g = (n: number, code: string, fullName: string, extra: Partial<MockGuest>): MockGuest => ({
    id: uid(300 + n),
    code,
    fullName,
    nationalityCode: 'VN',
    isForeigner: false,
    preferredLocale: 'vi',
    tags: [],
    serviceNotes: [],
    crmConsent: 'granted',
    version: 1,
    createdBy: USER.fd,
    ...extra,
  });
  return [
    g(30, 'KH-0030', 'Trần Minh Khoa', { phone: '0938 222 444' }),
    g(31, 'KH-0031', 'Phan Thị Mơ', { email: 'mo.phan@example.com' }),
    g(32, 'KH-0032', 'Hoàng Gia Bảo', { phone: '0977 111 333', createdBy: USER.sal }),
    g(33, 'KH-0033', 'Lý Minh Châu', { phone: '0966 555 777', createdBy: USER.ctv }),
  ];
}

/** Copy without mock-only bookkeeping fields (never sent by the real API). */
function strip<T extends object, K extends keyof T>(o: T, keys: K[]): Omit<T, K> {
  const out = { ...o };
  for (const k of keys) delete out[k];
  return out;
}
/** Quotes past `expiresAt` read as `expired` (job J-x in the real API). */
const quoteStatus = (q: MockQuote): Quote['status'] =>
  q.status === 'active' && Date.parse(q.expiresAt) < Date.now() ? 'expired' : q.status;
const publicQuote = (q: MockQuote): Quote => ({
  ...strip(q, ['createdBy', 'input']),
  status: quoteStatus(q),
});

export function createReservationMock(ctx: Ctx) {
  const { guard, problem } = ctx;
  let state = makeState(ctx.db().rooms, seedChannels());
  let folioPort: MockFolioPort | null = null;
  const ensureGuests = () => {
    const guests = ctx.db().guests;
    for (const g of extraGuests()) if (!guests.some((x) => x.id === g.id)) guests.push(g);
  };
  ensureGuests();

  const isResponse = (g: Guard): g is Response => g instanceof Response;
  const prop = '*/v1/properties/:propertyId';
  const rooms = () => ctx.db().rooms;
  const roomById = (id?: string | null) => rooms().find((r) => r.id === id);
  const groupCode = (id?: string) => ctx.db().groups.find((g) => g.id === id)?.code ?? id;
  const channelById = (id?: string) => state.channels.find((c) => c.id === id);
  const today = () => todayLocal();
  const json = (body: unknown, status = 200) => HttpResponse.json(body as never, { status });
  const validation = (errors: Array<{ field: string; code: string }>) =>
    problem(422, 'VALIDATION_FAILED', { errors });

  const live = (r: MockReservation) => ['hold', 'confirmed', 'in_house'].includes(r.status);
  /** Overlap check shared by every flow (EP02 §3.5 AC4) – reservations then OOO blocks. */
  function clash(roomId: string, from: string, to: string, ignoreId?: string) {
    const conflicts: Array<Record<string, unknown>> = [];
    for (const r of state.reservations) {
      if (r.id === ignoreId || !live(r) || r.roomId !== roomId) continue;
      if (overlaps(from, to, r.arrivalDate, r.departureDate)) {
        const a = from > r.arrivalDate ? from : r.arrivalDate;
        const b = to < r.departureDate ? to : r.departureDate;
        conflicts.push({
          roomNo: roomById(roomId)?.roomNo,
          nights: Array.from({ length: nightsBetween(a, b) }, (_, i) => addDays(a, i)),
          kind: 'reservation',
          reservationCode: r.code,
          guestDisplayName: r.guestName,
        });
      }
    }
    const block = state.blocks.find((b) => b.roomId === roomId && overlaps(from, to, b.from, b.to));
    return { conflicts, block };
  }
  /** BR-113 (a): the free gap [from, to) is boxed in by bookings/blocks on both sides. */
  function isOrphanNight(roomId: string, from: string, to: string) {
    const c = clash(roomId, from, to);
    if (c.conflicts.length || c.block) return false;
    const before = clash(roomId, addDays(from, -1), from);
    const after = clash(roomId, to, addDays(to, 1));
    return (
      (before.conflicts.length > 0 || !!before.block) &&
      (after.conflicts.length > 0 || !!after.block)
    );
  }
  function suggestions(roomId: string | null, from: string, to: string, occ: number) {
    const wanted = roomById(roomId);
    const free = rooms().filter(
      (r) =>
        r.id !== roomId &&
        r.isSellable !== false &&
        (r.maxOccupancy ?? 9) >= occ &&
        !clash(r.id, from, to).conflicts.length &&
        !clash(r.id, from, to).block,
    );
    const same = free.filter((r) => !wanted || r.roomGroupId === wanted.roomGroupId);
    const other = free.filter((r) => wanted && r.roomGroupId !== wanted.roomGroupId);
    return [...same, ...other].slice(0, 6).map((r) => ({
      roomId: r.id,
      roomNo: r.roomNo,
      roomGroupCode: groupCode(r.roomGroupId),
      upgrade: !!wanted && r.roomGroupId !== wanted.roomGroupId,
    }));
  }
  function blockedProblem(roomId: string, b: MockBlock) {
    return problem(409, 'ROOM_BLOCKED', {
      conflicts: [
        {
          roomNo: roomById(roomId)?.roomNo,
          nights: Array.from({ length: nightsBetween(b.from, b.to) }, (_, i) => addDays(b.from, i)),
          kind: 'ooo',
        },
      ],
    });
  }
  /** FD+ see who occupies the room; other roles only the nights (booking.error.conflict_noname). */
  function unavailable(roles: Role[], conflicts: Array<Record<string, unknown>>, sugg: unknown[]) {
    const fd = has(roles, FD_PLUS);
    return problem(409, 'ROOM_UNAVAILABLE', {
      conflicts: conflicts.map((c) =>
        fd ? c : { roomNo: c.roomNo, nights: c.nights, kind: c.kind },
      ),
      suggestions: sugg,
    });
  }

  function idem(request: StrictRequest<DefaultBodyType>, scope: string) {
    const key = request.headers.get('idempotency-key');
    if (!key) return { key: null, replay: problem(428, 'PRECONDITION_REQUIRED') };
    const hit = state.idempotency.get(`${scope}:${key}`);
    return { key: `${scope}:${key}`, replay: hit ? json(hit.body, hit.status) : null };
  }
  const remember = (key: string | null, status: number, body: unknown) => {
    if (key) state.idempotency.set(key, { status, body });
    return json(body, status);
  };

  // ---------- pricing (BR-101/104/107/110/305/903 – simplified for the mock) ----------
  function price(roomId: string | undefined, arrival: string, nights: number) {
    const r = roomById(roomId);
    const base = r?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
    const losPct = nights >= 7 ? 10 : 0;
    const rates = Array.from({ length: nights }, (_, i) => {
      const date = addDays(arrival, i);
      const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
      const weekend = dow === 5 || dow === 6;
      const v = Math.round((weekend ? base * 1.15 : base) / 1000) * 1000;
      // 0.3.5 A-22: `calendarRateVnd` = calendar price before the BR-107 length-of-stay step.
      return {
        date,
        amountVnd: Math.round((v * (100 - losPct)) / 100 / 1000) * 1000,
        calendarRateVnd: v,
      };
    });
    return { rates, losPct };
  }
  /**
   * BR-107 v0.3.8 (DOM S4-38, BE-A): rates typed by the desk are CALENDAR rates – the length-of-stay step of the
   * whole stay applies on them (Direct / agent; OTA and internal keep what was typed).
   */
  function stepTyped(typed: Array<{ date: string; amountVnd: number }>, group: string) {
    const pct = ['direct', 'agent'].includes(group) && typed.length >= 7 ? 10 : 0;
    return typed.map((n) => ({
      date: n.date,
      amountVnd: Math.round((n.amountVnd * (100 - pct)) / 100 / 1000) * 1000,
      calendarRateVnd: n.amountVnd,
    }));
  }
  function extraFee(room: Room | undefined, adults: number, c611: number, nights: number) {
    const base = room?.baseOccupancy ?? 2;
    const extra = Math.max(0, adults + c611 - base);
    const extraAdults = Math.min(extra, Math.max(0, adults - base));
    return { extra, fee: (extraAdults * 150_000 + (extra - extraAdults) * 100_000) * nights };
  }
  const deposit = (roomTotal: number) => Math.round((roomTotal * 0.3) / 100_000) * 100_000;
  function calculate(body: QuoteInput, roles: Role[]): QuoteCalculation | Response {
    const nights = body.nights ?? 0;
    const r = roomById(body.roomId);
    const errors: Array<{ field: string; code: string }> = [];
    if (!body.arrivalDate) errors.push({ field: 'arrivalDate', code: 'REQUIRED' });
    else if (body.arrivalDate < today())
      errors.push({ field: 'arrivalDate', code: 'DATE_IN_PAST' });
    if (nights < 1) errors.push({ field: 'nights', code: 'REQUIRED' });
    if (!r) errors.push({ field: 'roomId', code: 'REQUIRED' });
    if (errors.length) return validation(errors);
    const occ = body.adults + (body.children6to11 ?? 0);
    if (r && occ > (r.maxOccupancy ?? 9))
      return problem(422, 'CAPACITY_EXCEEDED', {
        roomNo: r.roomNo,
        max: r.maxOccupancy,
        errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
      });
    const { rates, losPct } = price(body.roomId, body.arrivalDate, nights);
    const roomTotal = rates.reduce((s, x) => s + x.amountVnd, 0);
    const ch = channelById(body.channelId);
    const fee =
      ch && ch.channelGroup !== 'ota'
        ? extraFee(r, body.adults, body.children6to11 ?? 0, nights).fee
        : 0;
    const total = roomTotal + fee;
    const ctv = roles.includes('collaborator');
    const sal = roles.includes('sales_staff');
    const pct = ctv ? 8 : sal ? 3 : undefined;
    const c = clash(r!.id, body.arrivalDate, addDays(body.arrivalDate, nights));
    const out: QuoteCalculation = {
      type: 'short',
      nights,
      nightlyRates: rates,
      losDiscountPct: losPct,
      totalVnd: total,
      // 0.3.5 A-14: split amounts so the client never derives the fee by subtraction.
      roomTotalVnd: roomTotal,
      extraPersonFeeVnd: fee,
      extraGuestCount: Math.max(0, occ - (r?.baseOccupancy ?? 2)),
      roomId: r!.id,
      roomNo: r!.roomNo,
      depositVnd: deposit(roomTotal),
      availability: {
        available: !c.conflicts.length && !c.block,
        alternatives: suggestions(r!.id, body.arrivalDate, addDays(body.arrivalDate, nights), occ)
          .filter((s) => !s.upgrade)
          .map((s) => s.roomNo),
      },
    };
    if (pct !== undefined || has(roles, OWN_MGR)) {
      const ratePct = pct ?? 3;
      out.commission = {
        ratePct,
        baseVnd: roomTotal,
        amountVnd: Math.round((roomTotal * ratePct) / 100),
        ruleRef: 'BR-903',
      };
      if (!ctv) out.ottimoRemainingVnd = total - out.commission.amountVnd!;
    }
    if (nights >= 15)
      out.longStayAlternative = {
        termMonths: 1,
        totalVnd: r?.currentListPrice?.monthlyListPriceVnd ?? 9_000_000,
        mandatory: nights >= LONG_STAY_FROM_NIGHTS,
      };
    return out;
  }

  // ---------- S4-08: service lines kept on cancel / no-show (BR-309; 0.3.7 D1) ----------
  function retainCheck(
    r: MockReservation,
    retain: Array<{ lineId: string; reason?: string }> | undefined,
  ) {
    const all = folioPort?.serviceLines(r) ?? [];
    const keep = retain ?? [];
    const bad = keep.findIndex((k) => !all.some((l) => l.lineId === k.lineId));
    if (bad >= 0) return validation([{ field: `retainLines[${bad}].lineId`, code: 'NOT_IN_LIST' }]);
    const noReason = keep.findIndex((k) => (k.reason ?? '').trim().length < 3);
    if (noReason >= 0)
      return validation([{ field: `retainLines[${noReason}].reason`, code: 'REASON_REQUIRED' }]);
    const keepIds = keep.map((k) => k.lineId);
    const lines = all.map((l) => {
      const k = keep.find((x) => x.lineId === l.lineId);
      return { ...l, retained: !!k, ...(k ? { retainReason: k.reason } : {}) };
    });
    return {
      lines,
      keepIds,
      reversedVnd: lines.filter((l) => !l.retained).reduce((a, l) => a + l.amountVnd, 0),
      retainedVnd: lines.filter((l) => l.retained).reduce((a, l) => a + l.amountVnd, 0),
    };
  }

  // ---------- S4-21: one calc for previewMoveReservation and moveReservation (ESC-019 A, BR-429) ----------
  interface MoveInput {
    roomId?: string;
    arrivalDate?: string;
    departureDate?: string;
    reasonCode?: string;
    mode?: string;
  }
  function movePlan(r: MockReservation, body: MoveInput, roles: Role[]) {
    if (body.mode === 'postpone_instead_of_cancel' && !has(roles, OWN_MGR))
      return problem(403, 'FORBIDDEN_ACTION');
    if (!body.reasonCode) return validation([{ field: 'reasonCode', code: 'REQUIRED' }]);
    if (!MOVE_REASONS.includes(body.reasonCode as (typeof MOVE_REASONS)[number]))
      return validation([{ field: 'reasonCode', code: 'NOT_IN_LIST' }]);
    if (body.reasonCode === 'overbooking' && r.conflictState !== 'open' && !r.capacityConflict)
      return validation([{ field: 'reasonCode', code: 'NOT_IN_LIST' }]);
    if (body.reasonCode === 'upgrade' && !has(roles, LEAD_PLUS))
      return problem(403, 'FORBIDDEN_ACTION');
    if (body.reasonCode === 'force_majeure' && body.mode !== 'postpone_instead_of_cancel')
      return validation([{ field: 'reasonCode', code: 'NOT_IN_LIST' }]);
    // 0.3.7 D1 (BR-012 (4)): sorting rooms is only allowed while the guest was not told the room.
    if (body.reasonCode === 'inventory_optimize' && r.roomDisclosedToGuest)
      return validation([{ field: 'reasonCode', code: 'NOT_IN_LIST' }]);
    const isOta = channelById(r.channelId)?.channelGroup === 'ota';
    const from = body.arrivalDate ?? r.arrivalDate;
    const to = body.departureDate ?? r.departureDate;
    if (isOta && (from !== r.arrivalDate || to !== r.departureDate))
      return validation([{ field: 'arrivalDate', code: 'OTA_DATES_LOCKED' }]);
    if (from < today()) return validation([{ field: 'arrivalDate', code: 'DATE_IN_PAST' }]);
    if (to <= from) return validation([{ field: 'departureDate', code: 'DATE_ORDER' }]);
    const target = roomById(body.roomId ?? r.roomId)!;
    const over = (target.maxOccupancy ?? 9) < r.adults + (r.children6to11 ?? 0);
    if (over && !isOta)
      return problem(422, 'CAPACITY_EXCEEDED', { roomNo: target.roomNo, max: target.maxOccupancy });
    if (target.isSellable === false)
      return problem(409, 'ROOM_NOT_SELLABLE', { roomNo: target.roomNo });
    const c = clash(target.id, from, to, r.id);
    if (c.block) return blockedProblem(target.id, c.block);
    if (c.conflicts.length)
      return unavailable(roles, c.conflicts, suggestions(target.id, from, to, r.adults));

    const roomMoved = target.id !== r.roomId;
    const nights = nightsBetween(from, to);
    const old = new Map((r.nightlyRates ?? []).map((n) => [n.date, n.amountVnd]));
    const priced = price(target.id, from, nights);
    const guest = body.reasonCode === 'guest_request';
    const basis: 'new_room_rate' | 'keep_booked_rate' | 'external_contract' = r.externalContract
      ? 'external_contract'
      : guest && roomMoved
        ? 'new_room_rate'
        : 'keep_booked_rate';
    const origin = r.originalRoomId ?? r.roomId ?? target.id;
    const originRates = isOta ? price(origin, from, nights).rates : [];
    const nightRows = priced.rates.map((pr, i) => {
      const was = old.get(pr.date);
      const kept = was ?? pr.amountVnd; // nights added by a date change use today's rate
      const newRate = basis === 'new_room_rate' && !isOta ? pr.amountVnd : kept;
      const diff =
        isOta && basis === 'new_room_rate'
          ? Math.max(0, pr.calendarRateVnd - originRates[i]!.calendarRateVnd)
          : undefined;
      return {
        date: pr.date,
        oldRateVnd: was ?? null,
        newRateVnd: newRate,
        ...(diff !== undefined ? { roomChangeDifferenceVnd: diff } : {}),
      };
    });
    const removedNights = [...old.keys()].filter((d) => d < from || d >= to);
    const roomTotalOld = [...old.values()].reduce((a, x) => a + x, 0);
    const roomTotalNew = nightRows.reduce((a, x) => a + x.newRateVnd, 0);
    // Other (not a guest request) into a dearer room: FDL+ only, like an upgrade (BR-429 (b)).
    if (
      body.reasonCode === 'other' &&
      roomMoved &&
      !has(roles, LEAD_PLUS) &&
      priced.rates.reduce((a, x) => a + x.amountVnd, 0) >
        price(r.roomId ?? target.id, from, nights).rates.reduce((a, x) => a + x.amountVnd, 0)
    )
      return problem(403, 'FORBIDDEN_ACTION');
    const perNight = (room: Room | undefined) =>
      isOta ? 0 : extraFee(room, r.adults, r.children6to11 ?? 0, 1).fee;
    const oldNightFee = perNight(roomById(r.roomId));
    const extraOld = oldNightFee * old.size;
    const extraNew =
      (guest && roomMoved ? perNight(target) : Math.min(oldNightFee, perNight(target))) * nights;
    const otaDiff = nightRows.reduce((a, x) => a + (x.roomChangeDifferenceVnd ?? 0), 0);
    const delta =
      basis === 'external_contract'
        ? 0
        : roomTotalNew -
          roomTotalOld +
          (extraNew - extraOld) +
          (isOta && basis === 'new_room_rate' ? otaDiff - (r.roomChangeDifferenceVnd ?? 0) : 0);
    const preview = {
      pricingBasis: basis,
      roomId: target.id,
      roomNo: target.roomNo,
      roomName: target.name ?? null,
      arrivalDate: from,
      departureDate: to,
      nights: nightRows,
      ...(removedNights.length ? { removedNights } : {}),
      roomTotalOldVnd: roomTotalOld,
      roomTotalNewVnd: basis === 'external_contract' ? roomTotalOld : roomTotalNew,
      extraPersonOldVnd: extraOld,
      extraPersonNewVnd: extraNew,
      ...(isOta && basis === 'new_room_rate' ? { roomChangeDifferenceVnd: otaDiff } : {}),
      folioDeltaVnd: delta,
      losDiscountPct: priced.losPct,
      depositPaidVnd: r.depositPaidVnd,
      balanceDueAfterVnd: Math.max(0, (r.balanceDueVnd ?? 0) + delta),
      warnings: over ? [{ code: 'CAPACITY_EXCEEDED_WARNING', field: 'roomId' }] : [],
    };
    const apply = () => {
      if (roomMoved && !r.originalRoomId && r.roomId) r.originalRoomId = r.roomId;
      r.roomId = target.id;
      r.arrivalDate = from;
      r.departureDate = to;
      r.nights = nights;
      r.segments = [{ roomId: target.id, roomNo: target.roomNo, fromDate: from, toDate: to }];
      r.extraGuestCount = Math.max(
        0,
        r.adults + (r.children6to11 ?? 0) - (target.baseOccupancy ?? 2),
      );
      r.capacityConflict = over ? true : undefined;
      if (basis !== 'external_contract') {
        r.nightlyRates = nightRows.map((n) => ({ date: n.date, amountVnd: n.newRateVnd }));
        r.totalRoomVnd = roomTotalNew;
        if (isOta && basis === 'new_room_rate') r.roomChangeDifferenceVnd = otaDiff;
        r.balanceDueVnd = Math.max(0, (r.balanceDueVnd ?? 0) + delta);
      }
      if (guest && roomMoved) r.roomDisclosedToGuest = true;
    };
    // BR-429 (d1) v0.3.8 (DOM-S4-06): told + exact figure for any change of money; a guest room change also at 0.
    return {
      preview,
      apply,
      needTold:
        (guest && roomMoved && basis !== 'external_contract') || preview.folioDeltaVnd !== 0,
      over,
    };
  }

  // ---------- views ----------
  function actionsFor(r: MockReservation, user: MockUser, roles: Role[]) {
    const fd = has(roles, FD_PLUS);
    const own = r.createdBy === user.id || r.closerUserId === user.id;
    const out: Array<{
      event: string;
      transition: string;
      action: string;
      requiresApproval?: boolean;
      requiresTrustedDevice?: boolean;
    }> = [];
    const add = (event: string, transition: string, action: string, extra = {}) =>
      out.push({ event, transition, action, ...extra });
    if (r.status === 'hold') {
      if (fd || (roles.includes('sales_staff') && own))
        add('confirm_deposit', 'B4', 'confirm-deposit');
      if ((fd || own) && (r.hold?.extendedCount ?? 0) === 0)
        add('extend_hold', 'B3', 'extend-hold');
      if (fd || own) add('cancel_hold', 'B5', 'cancel');
    } else if (r.status === 'confirmed') {
      if (r.conflictState === 'open') {
        if (fd) add('assign_room', 'B7a', 'assign-room');
        if (fd) add('cancel', 'B10', 'cancel');
      } else {
        if (fd && r.arrivalDate === today())
          add('check_in', 'B9', 'check-in', { requiresTrustedDevice: true });
        if (fd) add('move', 'B7', 'move');
        if (has(roles, OWN_MGR)) add('postpone', 'B8', 'move');
        if (fd || (roles.includes('sales_staff') && own && r.channelCode === 'direct'))
          add('cancel', 'B10', 'cancel');
        // A-04: the server decides the time (no_show_mark_time); the UI never uses the client clock.
        const from = noShowFrom(r);
        if (fd && from && Date.now() >= Date.parse(from))
          add('mark_no_show', 'B11', 'mark-no-show');
      }
    } else if (r.status === 'in_house' && fd) {
      // Sprint 3 (EP03-05): stay actions by status AND role.
      add('extend_stay', 'B13', 'extend');
      add('set_late_checkout', 'B15', 'late-checkout');
      add('change_room', 'B14', 'change-room');
      if (r.departureDate <= today()) add('check_out', 'B18', 'check-out');
      if (
        has(roles, OWN_MGR) &&
        r.actualCheckinAt &&
        todayLocal('Asia/Ho_Chi_Minh', new Date(r.actualCheckinAt)) === today()
      )
        add('undo_check_in', 'B17', 'undo-check-in');
    } else if (r.status === 'no_show' && fd) {
      add('restore_no_show', 'B12', 'restore-no-show', {
        requiresApproval: !has(roles, OWN_MGR) && r.arrivalDate !== today(),
      });
    }
    return out;
  }
  function param<T>(key: string, d: T): T {
    const v = ctx.db().params.find((p) => p.key === key)?.value;
    return v === undefined ? d : (v as T);
  }
  /** 0.3.5 `Reservation.noShowAvailableFrom`: arrival day at `no_show_mark_time` (confirmed, arriving today). */
  function noShowFrom(r: MockReservation): string | null {
    if (r.status !== 'confirmed' || r.conflictState === 'open' || r.arrivalDate !== today())
      return null;
    return `${r.arrivalDate}T${param('no_show_mark_time', '23:00')}:00+07:00`;
  }
  function view(r: MockReservation, user: MockUser, roles: Role[]): Reservation {
    const rest = strip(r, ['createdBy', 'guestName', 'roomId', 'holdCreatedAt', 'nationality']);
    const out: Reservation = {
      ...rest,
      progress:
        r.stayType === 'long'
          ? []
          : [
              { step: 'hold', done: true },
              { step: 'deposit', done: r.status !== 'hold' },
              { step: 'confirmed', done: r.status !== 'hold' },
              { step: 'checked_in', done: ['in_house', 'checked_out'].includes(r.status) },
              { step: 'checked_out', done: r.status === 'checked_out' },
            ],
      allowedActions: actionsFor(r, user, roles),
      noShowAvailableFrom: noShowFrom(r),
      requestedRoomGroupCode: r.requestedRoomGroupId
        ? groupCode(r.requestedRoomGroupId)
        : undefined,
    };
    // 0.3.7 add. 1 (BUG-R2-081): deposit notices – newest first; `open` while the booking is on hold
    // (B4 → `handled`); `note` (D12c) and `createdByName` (D27) only for FD+.
    const notices = state.notices.filter((n) => n.reservationId === r.id);
    if (notices.length)
      out.depositNotices = [...notices]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((n) => ({
          id: n.id,
          amountVnd: n.amountVnd,
          attachmentId: n.attachmentId ?? null,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          status: r.status === 'hold' ? 'open' : 'handled',
          ...(has(roles, FD_PLUS) ? { note: n.note ?? null, createdByName: n.createdByName } : {}),
        }));
    if (roles.includes('collaborator') && !has(roles, FD_PLUS)) {
      delete out.nightlyRates;
      delete out.balanceDueVnd;
      delete out.internalNote;
      delete out.registrationStatus;
    }
    return out;
  }
  const inScope = (r: MockReservation, user: MockUser, roles: Role[]) =>
    has(roles, FD_PLUS) || r.createdBy === user.id || r.closerUserId === user.id;
  function find(params: Record<string, unknown>, g: { user: MockUser; roles: Role[] }) {
    const r = state.reservations.find((x) => x.id === params.reservationId);
    // US-087 AC2: another person's item is a 404 for SAL/CTV (existence is not leaked).
    return r && inScope(r, g.user, g.roles) ? r : null;
  }
  function invalid(r: MockReservation, allowed: string[]) {
    return allowed.includes(r.status)
      ? null
      : problem(409, 'INVALID_TRANSITION', { currentState: r.status });
  }

  function rackBar(r: MockReservation, user: MockUser, roles: Role[]): RackBar {
    const kind: RackBar['kind'] =
      r.stayType === 'long' && ['confirmed', 'in_house'].includes(r.status)
        ? 'long_stay'
        : (r.status as RackBar['kind']);
    if (has(roles, FD_PLUS))
      return {
        kind,
        from: r.arrivalDate,
        to: r.departureDate,
        reservationId: r.id,
        guestDisplayName: r.guestName,
        channelCode: r.channelCode,
        conflictState: r.conflictState,
        arrivingToday: r.arrivalDate === today(),
        // 0.3.5 A-01 (FD+): manual long stay badge, sofa icon, hold countdown, booking code.
        externalContract: r.externalContract,
        extraGuestCount: r.extraGuestCount ?? 0,
        holdExpiresAt: r.hold?.expiresAt,
        reservationCode: r.code,
        // 0.3.5 A-24 / A-25 (FD+).
        ...(r.capacityConflict ? { capacityConflict: true } : {}),
        ...(r.conflictState === 'open' && r.requestedRoomGroupId
          ? {
              requestedRoomGroupId: r.requestedRoomGroupId,
              requestedRoomGroupCode: groupCode(r.requestedRoomGroupId),
            }
          : {}),
      };
    // SAL/CTV (availability_only, 0.3.5 A-01): nothing identifies a booking, not even their own –
    // H12 overlays its own bookings from `listReservations` (x-scope own).
    if (has(roles, SALES)) return { kind: 'unavailable', from: r.arrivalDate, to: r.departureDate };
    void user;
    // housekeeping / maintenance: all_masked
    return {
      kind,
      from: r.arrivalDate,
      to: r.departureDate,
      arrivingToday: r.arrivalDate === today(),
      extraGuestCount: r.extraGuestCount ?? 0,
    };
  }

  function createRes(
    body: ReservationCreate,
    user: MockUser,
    extra: Partial<MockReservation> = {},
  ): MockReservation {
    const r = roomById(body.roomId);
    const ch = channelById(body.channelId)!;
    const nights = nightsBetween(body.arrivalDate, body.departureDate);
    const rates =
      body.nightlyRates && body.nightlyRates.length
        ? stepTyped(body.nightlyRates, ch.channelGroup)
        : price(body.roomId, body.arrivalDate, Math.min(nights, 31)).rates;
    const total = body.manualLongStay ? 0 : rates.reduce((s, x) => s + x.amountVnd, 0);
    const fee =
      ch.channelGroup === 'ota' ? 0 : extraFee(r, body.adults, body.children6to11 ?? 0, nights);
    const g = ctx.db().guests.find((x) => x.id === body.bookerGuestId);
    const unassigned = body.allowUnassigned && ch.channelGroup === 'ota';
    state.nextRes += 1;
    const paid = body.initialPayment?.amountVnd ?? 0;
    const extraCount = Math.max(
      0,
      body.adults + (body.children6to11 ?? 0) - (r?.baseOccupancy ?? 2),
    );
    return {
      id: uid(5000 + state.nextRes),
      code: `OTM-0${state.nextRes}`,
      status: 'confirmed',
      stayType: body.manualLongStay ? 'long' : 'short',
      channelId: ch.id,
      channelCode: ch.code,
      directSource: body.directSource,
      paymentModel: body.paymentModel,
      otaRef: body.otaRef,
      booker: g
        ? { id: g.id, code: g.code, displayName: g.fullName, nationalityCode: g.nationalityCode }
        : undefined,
      guestName: g?.fullName ?? '—',
      externalContract: !!body.manualLongStay,
      manualLongStay: body.manualLongStay,
      folioId: uid(6000 + state.nextRes),
      roomId: unassigned ? null : (r?.id ?? null),
      segments: unassigned
        ? []
        : [
            {
              roomId: r!.id,
              roomNo: r!.roomNo,
              fromDate: body.arrivalDate,
              toDate: body.departureDate,
            },
          ],
      arrivalDate: body.arrivalDate,
      departureDate: body.departureDate,
      nights,
      adults: body.adults,
      children6to11: body.children6to11 ?? 0,
      childrenUnder6: body.childrenUnder6 ?? 0,
      extraGuestCount: extraCount,
      partyMissingCount: Math.max(
        0,
        body.adults + (body.children6to11 ?? 0) + (body.childrenUnder6 ?? 0) - 1,
      ),
      etaTime: body.etaTime,
      depositRequiredVnd: body.manualLongStay ? 0 : deposit(total),
      totalRoomVnd: total + (typeof fee === 'number' ? fee : fee.fee),
      balanceDueVnd: total + (typeof fee === 'number' ? fee : fee.fee) - paid,
      nightlyRates: body.manualLongStay ? undefined : rates,
      conflictState: unassigned ? 'open' : 'none',
      requestedRoomGroupId: unassigned ? r?.roomGroupId : undefined,
      internalNote: body.internalNote,
      allowedActions: [],
      version: 1,
      depositPaidVnd: paid,
      createdBy: user.id,
      ...extra,
    };
  }

  const handlers = [
    // ---------- channels ----------
    http.get(`${prop}/channels`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      return isResponse(g) ? g : json({ data: state.channels });
    }),

    // ---------- rack (S03, US-016/019/139) ----------
    http.get(`${prop}/rack`, ({ request }) => {
      const g = guard(request, ALL_STAFF);
      if (isResponse(g)) return g;
      const url = new URL(request.url);
      const days = Math.min(31, Math.max(1, Number(url.searchParams.get('days') ?? 14)));
      const from = url.searchParams.get('from') ?? addDays(today(), -2);
      const to = addDays(from, days);
      const visible = state.reservations.filter(
        (r) =>
          ['hold', 'confirmed', 'in_house', 'checked_out'].includes(r.status) &&
          overlaps(from, to, r.arrivalDate, r.departureDate),
      );
      const fd = has(g.roles, FD_PLUS);
      const sales = has(g.roles, SALES) && !fd;
      const rackRooms = [...rooms()]
        .sort((a, b) => a.roomNo.localeCompare(b.roomNo))
        .map((room) => ({
          roomId: room.id,
          roomNo: room.roomNo,
          roomGroupCode: groupCode(room.roomGroupId),
          isSellable: room.isSellable !== false,
          roomStatus: ROOM_STATUS[room.roomNo] ?? 'VC',
          bars: [
            ...visible
              .filter((r) => r.roomId === room.id && r.conflictState !== 'open')
              .map((r) => rackBar(r, g.user, g.roles)),
            ...state.blocks
              .filter((b) => b.roomId === room.id && overlaps(from, to, b.from, b.to))
              .map((b) =>
                sales
                  ? { kind: 'unavailable' as const, from: b.from, to: b.to }
                  : {
                      kind: 'ooo' as const,
                      from: b.from,
                      to: b.to,
                      roomBlockId: b.id,
                      // Same as the API (rack.service LABEL): an i18n key, not the block reason.
                      label: 'status.block.ooo',
                    },
              ),
          ],
        }));
      return json({
        from,
        days,
        today: today(),
        rooms: rackRooms,
        unassigned: fd
          ? visible
              .filter((r) => r.conflictState === 'open')
              .map((r) => rackBar(r, g.user, g.roles))
          : [],
      });
    }),

    // ---------- availability (S15, US-082) ----------
    http.get(`${prop}/availability`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const q = new URL(request.url).searchParams;
      const arrival = q.get('arrival') ?? '';
      const departure = q.get('departure') ?? '';
      const adults = Number(q.get('adults') ?? 2);
      if (arrival < today()) return validation([{ field: 'arrival', code: 'DATE_IN_PAST' }]);
      if (departure <= arrival) return validation([{ field: 'departure', code: 'DATE_ORDER' }]);
      const roomId = q.get('roomId');
      let requestedRoom;
      if (roomId) {
        const r = roomById(roomId);
        const c = clash(roomId, arrival, departure);
        const reason =
          r?.isSellable === false
            ? 'not_sellable'
            : c.block
              ? 'blocked'
              : c.conflicts.length
                ? 'booked'
                : (r?.maxOccupancy ?? 9) < adults
                  ? 'capacity'
                  : undefined;
        requestedRoom = { roomId, roomNo: r?.roomNo, available: !reason, reason };
      }
      // 0.3.5 A-05: `upgrade` relative to the booking (reservationId) or the requested room;
      // same group first, then by group order (BR-316).
      const rsvId = q.get('reservationId');
      const rsv = rsvId ? state.reservations.find((x) => x.id === rsvId) : undefined;
      const wantedGroup = rsv?.requestedRoomGroupId ?? roomById(rsv?.roomId ?? roomId)?.roomGroupId;
      const alternatives = rooms()
        .filter((r) => r.id !== roomId && r.isSellable !== false && (r.maxOccupancy ?? 9) >= adults)
        .filter((r) => {
          const c = clash(r.id, arrival, departure, rsvId ?? undefined);
          return !c.conflicts.length && !c.block;
        })
        .map((r) => ({
          roomId: r.id,
          roomNo: r.roomNo,
          roomGroupCode: groupCode(r.roomGroupId),
          available: true,
          upgrade: !!wantedGroup && r.roomGroupId !== wantedGroup,
        }))
        .sort((a, b) => Number(a.upgrade) - Number(b.upgrade))
        .slice(0, roomId || rsvId ? 6 : 10);
      return json({ arrival, departure, requestedRoom, alternatives });
    }),

    // ---------- reservations ----------
    http.get(`${prop}/reservations`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const q = new URL(request.url).searchParams;
      const statuses = q.get('status')?.split(',').filter(Boolean);
      const ext = q.get('externalContract');
      const text = (q.get('q') ?? '').trim().toLowerCase();
      const data = state.reservations
        .filter((r) => inScope(r, g.user, g.roles))
        .filter((r) => !statuses || statuses.includes(r.status))
        .filter((r) => ext === null || String(r.externalContract) === ext)
        .filter(
          (r) =>
            !text ||
            r.code.toLowerCase().includes(text) ||
            (r.otaRef ?? '').toLowerCase().includes(text) ||
            (r.booker?.code ?? '').toLowerCase().includes(text) ||
            // FE-S3-21 (proposal to ARC/BE): an exact room number also matches.
            (r.segments?.[0]?.roomNo ?? '') === text,
        )
        .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate))
        .map((r) => ({
          id: r.id,
          code: r.code,
          status: r.status,
          stayType: r.stayType,
          roomNo: r.segments?.[0]?.roomNo ?? null,
          arrivalDate: r.arrivalDate,
          departureDate: r.departureDate,
          nights: r.nights,
          guestDisplayName: r.guestName,
          channelCode: r.channelCode,
          etaTime: r.etaTime,
          holdExpiresAt: r.hold?.expiresAt,
          conflictState: r.conflictState,
          balanceDueVnd: has(g.roles, FD_PLUS) ? r.balanceDueVnd : undefined,
        }));
      return json({ data, page: { hasMore: false } });
    }),

    http.post(`${prop}/reservations`, async ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, 'createReservation');
      if (replay) return replay;
      const body = (await request.json()) as ReservationCreate;
      const ch = channelById(body.channelId);
      const r = roomById(body.roomId);
      const errors: Array<{ field: string; code: string }> = [];
      if (!ch) errors.push({ field: 'channelId', code: 'NOT_IN_LIST' });
      if (!body.bookerGuestId) errors.push({ field: 'bookerGuestId', code: 'REQUIRED' });
      if (!body.adults || body.adults < 1) errors.push({ field: 'adults', code: 'REQUIRED' });
      if (!body.arrivalDate) errors.push({ field: 'arrivalDate', code: 'REQUIRED' });
      else if (body.arrivalDate < today())
        errors.push({ field: 'arrivalDate', code: 'DATE_IN_PAST' });
      if (!body.departureDate || body.departureDate <= body.arrivalDate)
        errors.push({ field: 'departureDate', code: 'DATE_ORDER' });
      const nights = nightsBetween(body.arrivalDate, body.departureDate);
      if (body.manualLongStay) {
        if (nights < LONG_STAY_FROM_NIGHTS)
          errors.push({ field: 'departureDate', code: 'MANUAL_LONG_STAY_BELOW_THRESHOLD' });
        if (!(body.manualLongStay.monthlyRentVnd > 0))
          errors.push({ field: 'manualLongStay.monthlyRentVnd', code: 'AMOUNT_NOT_POSITIVE' });
        if (body.nightlyRates || body.allowUnassigned || body.initialPayment)
          errors.push({ field: 'manualLongStay', code: 'VALIDATION_FAILED' });
      } else if (nights >= LONG_STAY_FROM_NIGHTS) {
        errors.push({ field: 'departureDate', code: 'LONG_STAY_REQUIRES_CONTRACT' });
      }
      if (ch?.channelGroup === 'ota') {
        if (!body.otaRef) errors.push({ field: 'otaRef', code: 'REQUIRED' });
        else if (
          state.reservations.some(
            (x) => x.otaRef === body.otaRef && x.channelId === ch.id && x.status !== 'cancelled',
          )
        )
          errors.push({ field: 'otaRef', code: 'OTA_REF_DUPLICATE' });
      } else if (body.allowUnassigned) {
        errors.push({ field: 'allowUnassigned', code: 'ALLOW_UNASSIGNED_OTA_ONLY' });
      }
      if (body.directSource && ch && ch.channelGroup !== 'direct')
        errors.push({ field: 'directSource', code: 'DIRECT_SOURCE_NOT_ALLOWED' });
      (body.nightlyRates ?? []).forEach((n, i) => {
        if (!(n.amountVnd > 0))
          errors.push({ field: `nightlyRates[${i}].amountVnd`, code: 'AMOUNT_NOT_POSITIVE' });
        else if (n.amountVnd < 300_000 || n.amountVnd > 3_000_000) {
          if (ch?.channelGroup === 'ota') {
            if (!body.rateOverrideReason)
              errors.push({
                field: `nightlyRates[${i}].amountVnd`,
                code: 'RATE_OUT_OF_RANGE_WARNING',
              });
          } else if (ch?.channelGroup !== 'internal')
            errors.push({ field: `nightlyRates[${i}].amountVnd`, code: 'RATE_OUT_OF_RANGE' });
        }
      });
      // BR-113: arrival on Fri/Sat needs ≥ 2 nights (direct/agent; FDL+ may override with a reason).
      if (
        body.arrivalDate &&
        ch &&
        ['direct', 'agent'].includes(ch.channelGroup) &&
        !body.manualLongStay
      ) {
        const dow = new Date(`${body.arrivalDate}T00:00:00Z`).getUTCDay();
        if (
          (dow === 5 || dow === 6) &&
          nights < 2 &&
          !(body.minStayOverrideReason && has(g.roles, LEAD_PLUS)) &&
          !(r && isOrphanNight(r.id, body.arrivalDate, body.departureDate))
        )
          errors.push({ field: 'departureDate', code: 'MIN_STAY_NOT_MET' });
      }
      if (errors.length) {
        // 0.3.5 A-05: MIN_STAY_NOT_MET carries `minStayNights` + orphan-night rooms to pick instead.
        const minStay = errors.some((e) => e.code === 'MIN_STAY_NOT_MET');
        return problem(422, 'VALIDATION_FAILED', {
          errors,
          ...(minStay
            ? {
                minStayNights: 2,
                suggestions: rooms()
                  .filter(
                    (x) =>
                      x.id !== r?.id &&
                      x.isSellable !== false &&
                      isOrphanNight(x.id, body.arrivalDate, body.departureDate),
                  )
                  .map((x) => ({
                    roomId: x.id,
                    roomNo: x.roomNo,
                    roomGroupCode: groupCode(x.roomGroupId),
                    upgrade: !!r && x.roomGroupId !== r.roomGroupId,
                    orphanNight: true,
                  })),
              }
            : {}),
        });
      }
      const occ = body.adults + (body.children6to11 ?? 0);
      if (r && occ > (r.maxOccupancy ?? 9) && ch?.channelGroup !== 'ota')
        return problem(422, 'CAPACITY_EXCEEDED', {
          roomNo: r.roomNo,
          max: r.maxOccupancy,
          errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
        });
      // 0.3.5 A-20 (DOM D-1): OTA over capacity is a warning – saved with a reason + capacityConflict.
      const capacityConflict = !!r && occ > (r.maxOccupancy ?? 9) && ch?.channelGroup === 'ota';
      if (capacityConflict && !(body.capacityWarningAckReason ?? '').trim())
        return problem(422, 'VALIDATION_FAILED', {
          roomNo: r!.roomNo,
          max: r!.maxOccupancy,
          errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED_WARNING' }],
        });
      const guest = ctx.db().guests.find((x) => x.id === body.bookerGuestId);
      if (ch && ['direct', 'agent'].includes(ch.channelGroup) && !guest?.phone)
        return problem(422, 'PHONE_REQUIRED', {
          errors: [{ field: 'bookerGuestId', code: 'PHONE_REQUIRED' }],
        });
      const unassigned = body.allowUnassigned && ch?.channelGroup === 'ota';
      if (!unassigned) {
        if (!r) return validation([{ field: 'roomId', code: 'REQUIRED' }]);
        if (r.isSellable === false) return problem(409, 'ROOM_NOT_SELLABLE', { roomNo: r.roomNo });
        const c = clash(r.id, body.arrivalDate, body.departureDate);
        if (c.block) return blockedProblem(r.id, c.block);
        if (c.conflicts.length)
          return unavailable(
            g.roles,
            c.conflicts,
            suggestions(r.id, body.arrivalDate, body.departureDate, occ),
          );
      }
      if (ch && ['direct', 'agent'].includes(ch.channelGroup) && !body.manualLongStay) {
        const roomTotal = (
          body.nightlyRates?.length
            ? stepTyped(body.nightlyRates, ch.channelGroup)
            : price(r?.id, body.arrivalDate, nights).rates
        ).reduce((s, x) => s + x.amountVnd, 0);
        const need = deposit(roomTotal);
        const paid = body.initialPayment?.amountVnd ?? 0;
        if (paid < need)
          return problem(422, 'DEPOSIT_INSUFFICIENT', {
            depositRequiredVnd: need,
            depositPaidVnd: paid,
            shortfallVnd: need - paid,
          });
      }
      const created = createRes(body, g.user);
      if (capacityConflict) created.capacityConflict = true;
      state.reservations.push(created);
      return remember(key, 201, view(created, g.user, g.roles));
    }),

    http.get(`${prop}/reservations/:reservationId`, ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const r = find(params, g);
      return r ? json(view(r, g.user, g.roles)) : problem(404, 'NOT_FOUND');
    }),

    http.post(
      `${prop}/reservations/:reservationId/actions/extend-hold`,
      async ({ request, params }) => {
        const pre = guard(request, [...FD_PLUS, ...SALES]);
        if (isResponse(pre)) return pre;
        const r = find(params, pre);
        if (!r) return problem(404, 'NOT_FOUND');
        const g = guard(request, [...FD_PLUS, ...SALES], { ifMatch: r.version });
        if (isResponse(g)) return g;
        const { key, replay } = idem(request, `extend:${r.id}`);
        if (replay) return replay;
        const bad = invalid(r, ['hold']);
        if (bad) return bad;
        if ((r.hold?.extendedCount ?? 0) > 0)
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        const { extraHours } = (await request.json()) as { extraHours: number };
        const exp = new Date(r.hold?.expiresAt ?? Date.now());
        if (exp.getTime() < Date.now())
          return problem(409, 'HOLD_EXPIRED', { expiredAt: exp.toISOString() });
        const cap = new Date(`${r.arrivalDate}T12:00:00+07:00`).getTime();
        r.hold = {
          ...r.hold,
          expiresAt: new Date(Math.min(exp.getTime() + extraHours * 3_600_000, cap)).toISOString(),
          extendedCount: 1,
        };
        r.version += 1;
        return remember(key, 200, view(r, g.user, g.roles));
      },
    ),

    http.post(
      `${prop}/reservations/:reservationId/actions/confirm-deposit`,
      async ({ request, params }) => {
        const pre = guard(request, [...FD_PLUS, 'sales_staff']);
        if (isResponse(pre)) return pre;
        const r = find(params, pre);
        if (!r) return problem(404, 'NOT_FOUND');
        const g = guard(request, [...FD_PLUS, 'sales_staff'], { ifMatch: r.version });
        if (isResponse(g)) return g;
        const { key, replay } = idem(request, `deposit:${r.id}`);
        if (replay) return replay;
        const bad = invalid(r, ['hold']);
        if (bad) return bad;
        const body = (await request.json()) as {
          payment?: { amountVnd: number; method: string; posAuthCode?: string };
          existingPaymentId?: string;
          recordOnly?: boolean;
        };
        if (!body.payment === !body.existingPaymentId)
          return validation([{ field: 'payment', code: 'REQUIRED' }]);
        if (body.existingPaymentId) {
          // S4-28: the deposit VietQR already confirmed received – nothing new is written here.
          if (!folioPort?.depositPayment(r, body.existingPaymentId))
            return validation([{ field: 'existingPaymentId', code: 'NOT_IN_LIST' }]);
          const need = r.depositRequiredVnd ?? 0;
          if (r.depositPaidVnd < need)
            return problem(422, 'DEPOSIT_INSUFFICIENT', {
              depositRequiredVnd: need,
              depositPaidVnd: r.depositPaidVnd,
              shortfallVnd: need - r.depositPaidVnd,
            });
          r.balanceDueVnd = (r.totalRoomVnd ?? 0) - r.depositPaidVnd;
          r.status = 'confirmed';
          delete r.hold;
          r.version += 1;
          return remember(key, 200, view(r, g.user, g.roles));
        }
        const amount = body.payment?.amountVnd ?? 0;
        if (!(amount > 0))
          return validation([{ field: 'payment.amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
        if (body.payment?.method === 'card_pos' && /\d{12,}/.test(body.payment.posAuthCode ?? ''))
          return validation([{ field: 'payment.posAuthCode', code: 'CARD_NUMBER_DETECTED' }]);
        const need = r.depositRequiredVnd ?? 0;
        if (r.depositPaidVnd + amount < need) {
          // 0.3.5 A-13: money recorded → 200, booking stays on hold, client shows the shortfall.
          r.depositPaidVnd += amount;
          r.balanceDueVnd = (r.totalRoomVnd ?? 0) - r.depositPaidVnd;
          r.version += 1;
          return remember(key, 200, view(r, g.user, g.roles));
        }
        r.depositPaidVnd += amount;
        r.balanceDueVnd = (r.totalRoomVnd ?? 0) - r.depositPaidVnd;
        r.status = 'confirmed';
        delete r.hold;
        r.version += 1;
        return remember(key, 200, view(r, g.user, g.roles));
      },
    ),

    http.post(
      `${prop}/reservations/:reservationId/deposit-notices`,
      async ({ request, params }) => {
        const g = guard(request, SALES);
        if (isResponse(g)) return g;
        const r = find(params, g);
        if (!r) return problem(404, 'NOT_FOUND');
        const body = (await request.json()) as {
          amountVnd: number;
          note?: string;
          attachmentId?: string;
        };
        if (!(body.amountVnd > 0))
          return validation([{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
        // 0.3.7 add. 1: only a booking on hold; at most one open notice – reporting again updates it.
        if (r.status !== 'hold')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        // S4-30: receipt photo (`uploadAttachment purpose=deposit_receipt`) – kept with the notice.
        const now = new Date().toISOString();
        const open = state.notices.find((n) => n.reservationId === r.id);
        if (open)
          Object.assign(open, {
            amountVnd: body.amountVnd,
            note: body.note,
            attachmentId: body.attachmentId ?? open.attachmentId,
            updatedAt: now,
          });
        else
          state.notices.push({
            id: uid(9600 + state.notices.length + 1),
            reservationId: r.id,
            amountVnd: body.amountVnd,
            note: body.note,
            attachmentId: body.attachmentId,
            createdAt: now,
            updatedAt: now,
            createdByName: g.user.displayName,
          });
        return new HttpResponse(null, { status: 202 });
      },
    ),

    http.post(`${prop}/reservations/:reservationId/actions/cancel`, async ({ request, params }) => {
      const pre = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(pre)) return pre;
      const r = find(params, pre);
      if (!r) return problem(404, 'NOT_FOUND');
      const body = (await request.json()) as {
        reasonCode?: string;
        note?: string;
        dryRun?: boolean;
        otaPenaltyVnd?: number;
        otaPenaltyChannelFeeVnd?: number;
        retainLines?: Array<{ lineId: string; reason?: string }>;
      };
      const g = body.dryRun ? pre : guard(request, [...FD_PLUS, ...SALES], { ifMatch: r.version });
      if (isResponse(g)) return g;
      const ctv = g.roles.includes('collaborator') && !has(g.roles, FD_PLUS);
      const sal = g.roles.includes('sales_staff') && !has(g.roles, FD_PLUS);
      if (
        (ctv && r.status !== 'hold') ||
        (sal && r.status !== 'hold' && r.channelCode !== 'direct')
      )
        return problem(403, 'FORBIDDEN_ACTION');
      const bad = invalid(r, ['hold', 'confirmed']);
      if (bad) return bad;
      if (!body.reasonCode) return validation([{ field: 'reasonCode', code: 'REQUIRED' }]);
      if (body.reasonCode === 'other' && (body.note ?? '').trim().length < 3)
        return validation([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const isOta = channelById(r.channelId)?.channelGroup === 'ota';
      if (body.otaPenaltyVnd !== undefined && !isOta)
        return validation([{ field: 'otaPenaltyVnd', code: 'OTA_PENALTY_OTA_ONLY' }]);
      // 0.3.6 add. 4: the channel fee only goes with a penalty.
      if (body.otaPenaltyChannelFeeVnd !== undefined && body.otaPenaltyVnd === undefined)
        return validation([{ field: 'otaPenaltyChannelFeeVnd', code: 'NOT_ALLOWED' }]);
      if (body.reasonCode === 'ota_cancelled' && !isOta)
        return validation([{ field: 'reasonCode', code: 'NOT_IN_LIST' }]);
      // BR-309 (ESC-006 A): ≥ 7 days before arrival → 100 % of the deposit back; 3–6 days → 50 %;
      // < 3 days → kept (peak dates and force majeure are not mocked).
      const daysBefore = nightsBetween(today(), r.arrivalDate);
      const share = daysBefore >= 7 ? 1 : daysBefore >= 3 ? 0.5 : 0;
      const refundable = r.status === 'hold' ? 0 : Math.round(r.depositPaidVnd * share);
      // 0.3.7 D1 (S4-08): service lines are reversed unless kept – same answer for dry run and write.
      const svc = retainCheck(r, body.retainLines);
      if (svc instanceof Response) return svc;
      const cancellation = {
        depositPaidVnd: r.depositPaidVnd,
        refundableVnd: refundable,
        retainedVnd: r.depositPaidVnd - refundable,
        policyRef: 'BR-309',
        otaPenaltyVnd: body.otaPenaltyVnd,
        serviceLines: svc.lines,
        serviceReversedVnd: svc.reversedVnd,
        serviceRetainedVnd: svc.retainedVnd,
      };
      if (body.dryRun) return json({ reservation: view(r, g.user, g.roles), cancellation });
      const { key, replay } = idem(request, `cancel:${r.id}`);
      if (replay) return replay;
      folioPort?.reverseServiceLines(r, svc.keepIds, g.user.displayName);
      r.status = 'cancelled';
      r.cancellation = {
        cancelledAt: new Date().toISOString(),
        reasonCode: body.reasonCode as never,
        note: body.note,
      };
      r.version += 1;
      return remember(key, 200, { reservation: view(r, g.user, g.roles), cancellation });
    }),

    http.get(`${prop}/reservations/:reservationId/move-preview`, ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const r = find(params, g);
      if (!r) return problem(404, 'NOT_FOUND');
      const bad = invalid(r, ['confirmed']);
      if (bad) return bad;
      const q = new URL(request.url).searchParams;
      const plan = movePlan(
        r,
        {
          roomId: q.get('roomId') ?? undefined,
          arrivalDate: q.get('arrivalDate') ?? undefined,
          departureDate: q.get('departureDate') ?? undefined,
          reasonCode: q.get('reasonCode') ?? undefined,
          mode: q.get('mode') ?? undefined,
        },
        g.roles,
      );
      return plan instanceof Response ? plan : json(plan.preview);
    }),

    http.post(`${prop}/reservations/:reservationId/actions/move`, async ({ request, params }) => {
      const pre = guard(request, FD_PLUS);
      if (isResponse(pre)) return pre;
      const r = find(params, pre);
      if (!r) return problem(404, 'NOT_FOUND');
      const g = guard(request, FD_PLUS, { ifMatch: r.version });
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, `move:${r.id}`);
      if (replay) return replay;
      const bad = invalid(r, ['confirmed']);
      if (bad) return bad;
      const body = (await request.json()) as MoveInput & {
        note?: string;
        capacityWarningAckReason?: string;
        applyDifference?: boolean;
        expectedDeltaVnd?: number;
      };
      if (
        body.reasonCode &&
        ['other', 'force_majeure'].includes(body.reasonCode) &&
        (body.note ?? '').trim().length < 3
      )
        return validation([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const plan = movePlan(r, body, g.roles);
      if (plan instanceof Response) return plan;
      if (plan.over && !(body.capacityWarningAckReason ?? '').trim())
        return problem(422, 'VALIDATION_FAILED', {
          roomNo: plan.preview.roomNo,
          max: roomById(plan.preview.roomId)?.maxOccupancy,
          errors: [{ field: 'roomId', code: 'CAPACITY_EXCEEDED_WARNING' }],
        });
      // ESC-019 A / BR-414, BR-429 (d1) v0.3.8: told the new amount, the exact figure (DOM-S4-06).
      if (plan.needTold && (body.applyDifference !== true || body.expectedDeltaVnd === undefined))
        return validation([{ field: 'applyDifference', code: 'REQUIRED' }]);
      if (plan.needTold && body.expectedDeltaVnd !== plan.preview.folioDeltaVnd)
        return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: plan.preview.folioDeltaVnd });
      plan.apply();
      r.version += 1;
      return remember(key, 200, view(r, g.user, g.roles));
    }),

    http.post(
      `${prop}/reservations/:reservationId/actions/assign-room`,
      async ({ request, params }) => {
        const pre = guard(request, FD_PLUS);
        if (isResponse(pre)) return pre;
        const r = find(params, pre);
        if (!r) return problem(404, 'NOT_FOUND');
        const g = guard(request, FD_PLUS, { ifMatch: r.version });
        if (isResponse(g)) return g;
        const { key, replay } = idem(request, `assign:${r.id}`);
        if (replay) return replay;
        if (r.conflictState !== 'open')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        const body = (await request.json()) as { roomId: string; resolution: string };
        if (body.resolution === 'upgraded' && !has(g.roles, LEAD_PLUS))
          return problem(403, 'FORBIDDEN_ACTION');
        const target = roomById(body.roomId);
        if (!target) return validation([{ field: 'roomId', code: 'NOT_IN_LIST' }]);
        const c = clash(target.id, r.arrivalDate, r.departureDate, r.id);
        if (c.block) return blockedProblem(target.id, c.block);
        if (c.conflicts.length)
          return unavailable(
            g.roles,
            c.conflicts,
            suggestions(target.id, r.arrivalDate, r.departureDate, r.adults),
          );
        r.roomId = target.id;
        r.segments = [
          {
            roomId: target.id,
            roomNo: target.roomNo,
            fromDate: r.arrivalDate,
            toDate: r.departureDate,
          },
        ];
        r.conflictState = 'resolved';
        r.version += 1;
        return remember(key, 200, view(r, g.user, g.roles));
      },
    ),

    http.post(
      `${prop}/reservations/:reservationId/actions/mark-no-show`,
      async ({ request, params }) => {
        const pre = guard(request, FD_PLUS);
        if (isResponse(pre)) return pre;
        const r = find(params, pre);
        if (!r) return problem(404, 'NOT_FOUND');
        // 0.3.5 A-04 order: body → If-Match → state + server time.
        const body = (await request.json()) as {
          contactAttemptNote?: string;
          retainLines?: Array<{ lineId: string; reason?: string }>;
        };
        if ((body.contactAttemptNote ?? '').trim().length < 3)
          return validation([{ field: 'contactAttemptNote', code: 'REASON_REQUIRED' }]);
        const svc = retainCheck(r, body.retainLines);
        if (svc instanceof Response) return svc;
        const g = guard(request, FD_PLUS, { ifMatch: r.version });
        if (isResponse(g)) return g;
        const { key, replay } = idem(request, `noshow:${r.id}`);
        if (replay) return replay;
        const bad = invalid(r, ['confirmed']);
        if (bad) return bad;
        const from = noShowFrom(r);
        if (!from || Date.now() < Date.parse(from))
          return problem(409, 'INVALID_TRANSITION', {
            currentState: r.status,
            availableFrom: from ?? undefined,
          });
        folioPort?.reverseServiceLines(r, svc.keepIds, g.user.displayName);
        r.status = 'no_show';
        r.version += 1;
        return remember(key, 200, view(r, g.user, g.roles));
      },
    ),

    http.post(
      `${prop}/reservations/:reservationId/actions/restore-no-show`,
      async ({ request, params }) => {
        const pre = guard(request, FD_PLUS);
        if (isResponse(pre)) return pre;
        const r = find(params, pre);
        if (!r) return problem(404, 'NOT_FOUND');
        const g = guard(request, FD_PLUS, { ifMatch: r.version });
        if (isResponse(g)) return g;
        const { key, replay } = idem(request, `restore:${r.id}`);
        if (replay) return replay;
        const bad = invalid(r, ['no_show']);
        if (bad) return bad;
        const body = (await request.json()) as {
          reason?: string;
          roomId?: string;
          allowUnassigned?: boolean;
        };
        if ((body.reason ?? '').trim().length < 3)
          return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
        const mgr = has(g.roles, OWN_MGR);
        // 0.3.5 A-21: MGR+ may restore into another free room or into the unassigned lane.
        if ((body.roomId || body.allowUnassigned) && !mgr) return problem(403, 'FORBIDDEN_ACTION');
        const isOta = channelById(r.channelId)?.channelGroup === 'ota';
        if (!mgr && (isOta || r.arrivalDate !== today()))
          return remember(key, 202, {
            id: uid(7000 + state.nextRes),
            type: 'no_show_restore',
            status: 'pending',
            targetCode: r.code,
          });
        if (body.allowUnassigned) {
          r.requestedRoomGroupId = roomById(r.roomId)?.roomGroupId;
          r.roomId = null;
          r.segments = [];
          r.conflictState = 'open';
        } else {
          const target = body.roomId ? roomById(body.roomId) : roomById(r.roomId);
          const c = target
            ? clash(target.id, r.arrivalDate, r.departureDate, r.id)
            : { conflicts: [] };
          if (c.conflicts.length)
            return unavailable(
              g.roles,
              c.conflicts,
              mgr ? suggestions(target!.id, r.arrivalDate, r.departureDate, r.adults) : [],
            );
          if (target && target.id !== r.roomId) {
            r.roomId = target.id;
            r.segments = [
              {
                roomId: target.id,
                roomNo: target.roomNo,
                fromDate: r.arrivalDate,
                toDate: r.departureDate,
              },
            ];
          }
        }
        r.status = 'confirmed';
        r.version += 1;
        return remember(key, 200, view(r, g.user, g.roles));
      },
    ),

    // ---------- quotes (EP11 R2) ----------
    http.post(`${prop}/quotes/calculate`, async ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const out = calculate((await request.json()) as QuoteInput, g.roles);
      return out instanceof Response ? out : json(out);
    }),
    http.get(`${prop}/quotes`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const data = state.quotes
        .filter((q) => has(g.roles, FD_PLUS) || q.createdBy === g.user.id)
        .map((q) => publicQuote(q));
      return json({ data, page: { hasMore: false } });
    }),
    http.post(`${prop}/quotes`, async ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const { key, replay } = idem(request, 'saveQuote');
      if (replay) return replay;
      const body = (await request.json()) as QuoteInput & { guestId: string };
      if (!body.guestId) return validation([{ field: 'guestId', code: 'REQUIRED' }]);
      const calc = calculate(body, g.roles);
      if (calc instanceof Response) return calc;
      state.nextQuote += 1;
      const exp = new Date(`${addDays(today(), 3)}T23:59:00+07:00`).toISOString();
      const q: MockQuote = {
        ...calc,
        id: uid(8000 + state.nextQuote),
        code: `BG-000${state.nextQuote}`,
        status: 'active',
        guestId: body.guestId,
        roomId: body.roomId,
        arrivalDate: body.arrivalDate,
        createdAt: new Date().toISOString(),
        expiresAt: exp,
        version: 1,
        createdBy: g.user.id,
        input: body,
      };
      state.quotes.push(q);
      return remember(key, 201, publicQuote(q));
    }),
    http.get(`${prop}/quotes/:quoteId`, ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const q = state.quotes.find((x) => x.id === params.quoteId);
      if (!q || (!has(g.roles, FD_PLUS) && q.createdBy !== g.user.id))
        return problem(404, 'NOT_FOUND');
      return json(publicQuote(q));
    }),
    http.get(`${prop}/quotes/:quoteId/text`, ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const q = state.quotes.find((x) => x.id === params.quoteId);
      if (!q || (!has(g.roles, FD_PLUS) && q.createdBy !== g.user.id))
        return problem(404, 'NOT_FOUND');
      const asked = new URL(request.url).searchParams.get('locale');
      const locale = asked === 'en' || asked === 'ru' ? asked : 'vi';
      const r = roomById(q.roomId);
      const d = (s: string) => s.split('-').reverse().join('/');
      const to = addDays(q.arrivalDate!, q.nights ?? 1);
      const money = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN');
      // US-083 AC2: no commission, no "OTTIMO còn lại", no phone/email in the guest text.
      const text =
        locale === 'ru'
          ? `OTTIMO Boutique Stay – Предложение ${q.code}\nАпартаменты ${r?.roomNo} ${r?.name}, ${d(q.arrivalDate!)} → ${d(to)} (ночей: ${q.nights}), взрослых: ${q.input.adults}.\nСтоимость проживания: ${money(q.totalVnd ?? 0)} VND.\nПредоплата для брони: ${money(q.depositVnd ?? 0)} VND. Остаток оплачивается при заселении.\nПредложение действительно до ${d(q.expiresAt.slice(0, 10))}.`
          : locale === 'en'
            ? `OTTIMO Boutique Stay – Quote ${q.code}\nRoom ${r?.roomNo} ${r?.name}, ${d(q.arrivalDate!)} → ${d(to)} (${q.nights} nights), ${q.input.adults} adults.\nRoom total: ${money(q.totalVnd ?? 0)} VND.\nDeposit to hold the room: ${money(q.depositVnd ?? 0)} VND. The rest is paid at check-in.\nThis quote is valid until ${d(q.expiresAt.slice(0, 10))}.`
            : `OTTIMO Boutique Stay – Báo giá ${q.code}\nCăn ${r?.roomNo} ${r?.name}, ${d(q.arrivalDate!)} → ${d(to)} (${q.nights} đêm), ${q.input.adults} người lớn.\nTiền phòng: ${money(q.totalVnd ?? 0)} đ.\nCọc giữ phòng: ${money(q.depositVnd ?? 0)} đ. Phần còn lại thanh toán khi nhận phòng.\nBáo giá có hiệu lực đến 23:59 ${d(q.expiresAt.slice(0, 10))}.`;
      return json({ locale, text });
    }),
    http.post(`${prop}/quotes/:quoteId/actions/create-hold`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const q = state.quotes.find((x) => x.id === params.quoteId);
      if (!q || (!has(g.roles, FD_PLUS) && q.createdBy !== g.user.id))
        return problem(404, 'NOT_FOUND');
      const { key, replay } = idem(request, `hold:${q.id}`);
      if (replay) return replay;
      if (quoteStatus(q) !== 'active')
        return problem(409, 'QUOTE_EXPIRED', { expiredAt: q.expiresAt });
      if (q.arrivalDate === today()) return problem(422, 'HOLD_NOT_ALLOWED_TODAY');
      const guest = ctx.db().guests.find((x) => x.id === q.guestId);
      if (!guest?.phone) return problem(422, 'PHONE_REQUIRED');
      const body = (await request.json()) as { holdHours: number };
      if (![12, 24, 48].includes(body.holdHours))
        return validation([{ field: 'holdHours', code: 'NOT_IN_LIST' }]);
      const departure = addDays(q.arrivalDate!, q.nights ?? 1);
      const c = clash(q.roomId!, q.arrivalDate!, departure);
      if (c.block) return blockedProblem(q.roomId!, c.block);
      if (c.conflicts.length)
        return unavailable(
          g.roles,
          c.conflicts,
          suggestions(q.roomId!, q.arrivalDate!, departure, q.input.adults),
        );
      const created = createRes(
        {
          roomId: q.roomId!,
          channelId: q.input.channelId,
          arrivalDate: q.arrivalDate!,
          departureDate: departure,
          adults: q.input.adults,
          children6to11: q.input.children6to11 ?? 0,
          childrenUnder6: q.input.childrenUnder6 ?? 0,
          bookerGuestId: q.guestId!,
          paymentModel: 'direct',
          allowUnassigned: false,
          nightlyRates: q.nightlyRates,
        },
        g.user,
      );
      const cap = new Date(`${q.arrivalDate}T12:00:00+07:00`).getTime();
      created.status = 'hold';
      created.quoteId = q.id;
      created.closerUserId = has(g.roles, SALES) ? g.user.id : undefined;
      created.hold = {
        hours: body.holdHours,
        expiresAt: new Date(Math.min(Date.now() + body.holdHours * 3_600_000, cap)).toISOString(),
        extendedCount: 0,
      };
      created.depositRequiredVnd = q.depositVnd;
      created.totalRoomVnd = q.totalVnd;
      created.balanceDueVnd = q.totalVnd;
      state.reservations.push(created);
      q.status = 'converted';
      q.convertedReservationId = created.id;
      if (q.commission?.amountVnd && has(g.roles, SALES))
        state.commissions.push({
          id: uid(9000 + state.nextRes),
          reservationCode: created.code,
          payeeType: g.roles.includes('collaborator') ? 'agent' : 'staff',
          payeeName: g.user.displayName,
          ratePctSnapshot: q.commission.ratePct,
          baseAmountVnd: q.commission.baseVnd,
          amountVnd: q.commission.amountVnd,
          status: 'projected',
          payeeUserId: g.user.id,
        });
      return remember(key, 201, view(created, g.user, g.roles));
    }),

    // ---------- 0.3.5 A-06 closer candidates (FD+) ----------
    http.get(`${prop}/closer-candidates`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const kind = new URL(request.url).searchParams.get('kind') ?? 'all';
      const data = ctx
        .db()
        .users.filter((u) => u.status === 'active')
        .flatMap((u) => {
          const roles = u.roles.map((x) => x.role);
          const k = roles.includes('collaborator')
            ? ('agent' as const)
            : roles.includes('sales_staff')
              ? ('staff' as const)
              : null;
          return k && (kind === 'all' || kind === k)
            ? [{ userId: u.id, displayName: u.displayName, kind: k }]
            : [];
        });
      return json({ data });
    }),

    // ---------- 0.3.5 A-07 booking rules (every booking role) ----------
    http.get(`${prop}/booking-rules`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      return json({
        businessDate: today(),
        holdHoursOptions: param('hold_hours_options', [12, 24, 48]),
        holdHoursDefault: param('hold_hours_default', 24),
        holdLatestTimeOnArrival: param('hold_latest_time_on_arrival', '12:00'),
        holdExtensionMaxHours: param('hold_extension_max_hours', 24),
        quoteValidityDays: param('quote_validity_days', 3),
        shortStayDepositPct: param('short_stay_deposit_pct', 30),
        longStayCompareFromNights: param('long_stay_compare_from_nights', 15),
        longStayRequiredFromNights: param('long_stay_required_from_nights', LONG_STAY_FROM_NIGHTS),
        noShowCallTime: param('no_show_call_time', '18:00'),
        noShowMarkTime: param('no_show_mark_time', '23:00'),
        checkinTime: param('checkin_time', '14:00'),
        checkoutTime: param('checkout_time', '12:00'),
      });
    }),

    // ---------- 0.3.5 A-18 extend an expired quote (Q4) ----------
    http.post(`${prop}/quotes/:quoteId/actions/extend`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const q = state.quotes.find((x) => x.id === params.quoteId);
      if (!q || (!has(g.roles, FD_PLUS) && q.createdBy !== g.user.id))
        return problem(404, 'NOT_FOUND');
      const { key, replay } = idem(request, `extendQuote:${q.id}`);
      if (replay) return replay;
      const status = quoteStatus(q);
      if (status !== 'expired') return problem(409, 'INVALID_TRANSITION', { currentState: status });
      const body = (await request.json().catch(() => ({}))) as { reason?: string };
      if (has(g.roles, OWN_MGR)) {
        q.status = 'active';
        q.expiresAt = new Date(`${addDays(today(), 3)}T23:59:59+07:00`).toISOString();
        q.version += 1;
        return remember(key, 200, publicQuote(q));
      }
      if (!has(g.roles, SALES)) return problem(403, 'FORBIDDEN_ACTION');
      if ((body.reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      return remember(key, 202, {
        id: uid(7500 + state.nextQuote),
        type: 'quote_extension',
        status: 'pending',
        targetCode: q.code,
      });
    }),

    // ---------- commissions (US-087: only the caller's own for SAL/CTV) ----------
    http.get(`${prop}/commissions`, ({ request }) => {
      const g = guard(request, [...OWN_MGR, ...SALES]);
      if (isResponse(g)) return g;
      const data = state.commissions
        .filter((c) => has(g.roles, OWN_MGR) || c.payeeUserId === g.user.id)
        .map((c) => strip(c, ['payeeUserId']));
      return json({ data, page: { hasMore: false } });
    }),
  ];

  return {
    handlers,
    reset() {
      state = makeState(ctx.db().rooms, seedChannels());
      ensureGuests();
    },
    get state() {
      return state;
    },
    /** The Sprint 3 mock plugs its folio side in (S4-08 service lines, S4-28 deposit QR). */
    setFolioPort(p: MockFolioPort) {
      folioPort = p;
    },
    /** Sprint 3 mock (stay.ts) reuses the same reservation view, scope and idempotency rules. */
    view,
    find,
    idem,
    remember,
  };
}

export type ReservationMockState = ReturnType<typeof makeState>;
export type { GuestSummary };
