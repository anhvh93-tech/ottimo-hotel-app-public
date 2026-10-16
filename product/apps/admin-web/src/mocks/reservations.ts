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
  db: () => { users: MockUser[]; rooms: Room[]; guests: MockGuest[]; groups: RoomGroup[] };
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

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const nightsBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2;

export interface MockReservation extends Reservation {
  createdBy?: string;
  guestName: string;
  roomId: string | null;
  depositPaidVnd: number;
  holdCreatedAt?: string;
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
    notices: [] as Array<{ reservationId: string; amountVnd: number }>,
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
const publicQuote = (q: MockQuote): Quote => strip(q, ['createdBy', 'input']);

export function createReservationMock(ctx: Ctx) {
  const { guard, problem } = ctx;
  let state = makeState(ctx.db().rooms, seedChannels());
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
          kind: 'block',
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
      return { date, amountVnd: Math.round((v * (100 - losPct)) / 100 / 1000) * 1000 };
    });
    return { rates, losPct };
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
        if (fd && r.arrivalDate === today()) add('mark_no_show', 'B11', 'mark-no-show');
      }
    } else if (r.status === 'no_show' && fd) {
      add('restore_no_show', 'B12', 'restore-no-show', {
        requiresApproval: !has(roles, OWN_MGR) && r.arrivalDate !== today(),
      });
    }
    return out;
  }
  function view(r: MockReservation, user: MockUser, roles: Role[]): Reservation {
    const rest = strip(r, ['createdBy', 'guestName', 'roomId', 'depositPaidVnd', 'holdCreatedAt']);
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
    };
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
      : problem(409, 'INVALID_TRANSITION', { currentStatus: r.status });
  }

  function rackBar(
    r: MockReservation,
    user: MockUser,
    roles: Role[],
  ): RackBar & Record<string, unknown> {
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
        // Proposed RackBar fields (FE → ARC, H08 note): manual long stay + sofa icon + hold countdown.
        externalContract: r.externalContract,
        extraGuestCount: r.extraGuestCount ?? 0,
        holdExpiresAt: r.hold?.expiresAt,
        reservationCode: r.code,
      };
    if (has(roles, SALES)) {
      const own = r.createdBy === user.id || r.closerUserId === user.id;
      return own
        ? {
            kind,
            from: r.arrivalDate,
            to: r.departureDate,
            reservationId: r.id,
            guestDisplayName: r.guestName,
            holdExpiresAt: r.hold?.expiresAt,
          }
        : { kind: 'unavailable', from: r.arrivalDate, to: r.departureDate };
    }
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
        ? body.nightlyRates
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
                      label: b.reason,
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
      const alternatives = rooms()
        .filter((r) => r.id !== roomId && r.isSellable !== false && (r.maxOccupancy ?? 9) >= adults)
        .filter((r) => {
          const c = clash(r.id, arrival, departure);
          return !c.conflicts.length && !c.block;
        })
        .slice(0, roomId ? 6 : 10)
        .map((r) => ({
          roomId: r.id,
          roomNo: r.roomNo,
          roomGroupCode: groupCode(r.roomGroupId),
          available: true,
        }));
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
            (r.booker?.code ?? '').toLowerCase().includes(text),
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
          !(body.minStayOverrideReason && has(g.roles, LEAD_PLUS))
        )
          errors.push({ field: 'departureDate', code: 'MIN_STAY_NOT_MET' });
      }
      if (errors.length) return problem(422, 'VALIDATION_FAILED', { errors, min: 2 });
      const occ = body.adults + (body.children6to11 ?? 0);
      if (r && occ > (r.maxOccupancy ?? 9) && ch?.channelGroup !== 'ota')
        return problem(422, 'CAPACITY_EXCEEDED', {
          max: r.maxOccupancy,
          errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
        });
      const guest = ctx.db().guests.find((x) => x.id === body.bookerGuestId);
      if (ch && ['direct', 'agent'].includes(ch.channelGroup) && !guest?.phone)
        return problem(422, 'PHONE_REQUIRED', {
          errors: [{ field: 'bookerGuestId', code: 'PHONE_REQUIRED' }],
        });
      const unassigned = body.allowUnassigned && ch?.channelGroup === 'ota';
      if (!unassigned) {
        if (!r) return validation([{ field: 'roomId', code: 'REQUIRED' }]);
        if (r.isSellable === false) return problem(409, 'ROOM_NOT_SELLABLE');
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
            ? body.nightlyRates
            : price(r?.id, body.arrivalDate, nights).rates
        ).reduce((s, x) => s + x.amountVnd, 0);
        const need = deposit(roomTotal);
        const paid = body.initialPayment?.amountVnd ?? 0;
        if (paid < need) return problem(422, 'DEPOSIT_INSUFFICIENT', { required: need, paid });
      }
      const created = createRes(body, g.user);
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
          return problem(409, 'INVALID_TRANSITION', { currentStatus: r.status });
        const { extraHours } = (await request.json()) as { extraHours: number };
        const exp = new Date(r.hold?.expiresAt ?? Date.now());
        if (exp.getTime() < Date.now()) return problem(409, 'HOLD_EXPIRED');
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
          recordOnly?: boolean;
        };
        const amount = body.payment?.amountVnd ?? 0;
        if (!(amount > 0))
          return validation([{ field: 'payment.amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
        if (body.payment?.method === 'card_pos' && /\d{12,}/.test(body.payment.posAuthCode ?? ''))
          return validation([{ field: 'payment.posAuthCode', code: 'CARD_NUMBER_DETECTED' }]);
        const need = r.depositRequiredVnd ?? 0;
        if (r.depositPaidVnd + amount < need) {
          // AC2: the money is recorded, the booking stays on hold – then 422 tells how much is missing.
          r.depositPaidVnd += amount;
          r.balanceDueVnd = (r.totalRoomVnd ?? 0) - r.depositPaidVnd;
          r.version += 1;
          return problem(422, 'DEPOSIT_INSUFFICIENT', { required: need, paid: r.depositPaidVnd });
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
        const body = (await request.json()) as { amountVnd: number };
        if (!(body.amountVnd > 0))
          return validation([{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
        state.notices.push({ reservationId: r.id, amountVnd: body.amountVnd });
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
      // BR-309 (mock): ≥ 5 days before arrival → 50 % back; otherwise the deposit is kept.
      const daysBefore = nightsBetween(today(), r.arrivalDate);
      const refundable =
        r.status === 'hold' ? 0 : daysBefore >= 5 ? Math.round(r.depositPaidVnd / 2) : 0;
      const cancellation = {
        depositPaidVnd: r.depositPaidVnd,
        refundableVnd: refundable,
        retainedVnd: r.depositPaidVnd - refundable,
        policyRef: 'BR-309',
        otaPenaltyVnd: body.otaPenaltyVnd,
      };
      if (body.dryRun) return json({ reservation: view(r, g.user, g.roles), cancellation });
      const { key, replay } = idem(request, `cancel:${r.id}`);
      if (replay) return replay;
      r.status = 'cancelled';
      r.cancellation = {
        cancelledAt: new Date().toISOString(),
        reasonCode: body.reasonCode as never,
        note: body.note,
      };
      r.version += 1;
      return remember(key, 200, { reservation: view(r, g.user, g.roles), cancellation });
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
      const body = (await request.json()) as {
        roomId?: string;
        arrivalDate?: string;
        departureDate?: string;
        reasonCode?: string;
        note?: string;
        mode?: string;
      };
      if (body.mode === 'postpone_instead_of_cancel' && !has(g.roles, OWN_MGR))
        return problem(403, 'FORBIDDEN_ACTION');
      if (!body.reasonCode) return validation([{ field: 'reasonCode', code: 'REQUIRED' }]);
      if (body.reasonCode === 'other' && (body.note ?? '').trim().length < 3)
        return validation([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const isOta = channelById(r.channelId)?.channelGroup === 'ota';
      const datesChanged =
        (body.arrivalDate && body.arrivalDate !== r.arrivalDate) ||
        (body.departureDate && body.departureDate !== r.departureDate);
      if (isOta && datesChanged)
        return validation([{ field: 'arrivalDate', code: 'OTA_DATES_LOCKED' }]);
      const from = body.arrivalDate ?? r.arrivalDate;
      const to = body.departureDate ?? r.departureDate;
      if (from < today()) return validation([{ field: 'arrivalDate', code: 'DATE_IN_PAST' }]);
      if (to <= from) return validation([{ field: 'departureDate', code: 'DATE_ORDER' }]);
      const target = roomById(body.roomId ?? r.roomId)!;
      if ((target.maxOccupancy ?? 9) < r.adults + (r.children6to11 ?? 0))
        return problem(422, 'CAPACITY_EXCEEDED', { max: target.maxOccupancy });
      if (target.isSellable === false) return problem(409, 'ROOM_NOT_SELLABLE');
      const c = clash(target.id, from, to, r.id);
      if (c.block) return blockedProblem(target.id, c.block);
      if (c.conflicts.length)
        return unavailable(g.roles, c.conflicts, suggestions(target.id, from, to, r.adults));
      r.roomId = target.id;
      r.arrivalDate = from;
      r.departureDate = to;
      r.nights = nightsBetween(from, to);
      r.segments = [{ roomId: target.id, roomNo: target.roomNo, fromDate: from, toDate: to }];
      r.extraGuestCount = Math.max(
        0,
        r.adults + (r.children6to11 ?? 0) - (target.baseOccupancy ?? 2),
      );
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
          return problem(409, 'INVALID_TRANSITION', { currentStatus: r.status });
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
        const g = guard(request, FD_PLUS, { ifMatch: r.version });
        if (isResponse(g)) return g;
        const { key, replay } = idem(request, `noshow:${r.id}`);
        if (replay) return replay;
        const bad = invalid(r, ['confirmed']);
        if (bad) return bad;
        const body = (await request.json()) as { contactAttemptNote?: string };
        if ((body.contactAttemptNote ?? '').trim().length < 3)
          return validation([{ field: 'contactAttemptNote', code: 'REASON_REQUIRED' }]);
        if (r.arrivalDate !== today())
          return problem(409, 'INVALID_TRANSITION', { currentStatus: r.status });
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
        const body = (await request.json()) as { reason?: string };
        if ((body.reason ?? '').trim().length < 3)
          return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
        const c = r.roomId
          ? clash(r.roomId, r.arrivalDate, r.departureDate, r.id)
          : { conflicts: [] };
        if (c.conflicts.length) return unavailable(g.roles, c.conflicts, []);
        if (!has(g.roles, OWN_MGR) && r.arrivalDate !== today())
          return remember(key, 202, {
            id: uid(7000 + state.nextRes),
            type: 'no_show_restore',
            status: 'pending',
            targetCode: r.code,
          });
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
      const locale = new URL(request.url).searchParams.get('locale') === 'en' ? 'en' : 'vi';
      const r = roomById(q.roomId);
      const d = (s: string) => s.split('-').reverse().join('/');
      const to = addDays(q.arrivalDate!, q.nights ?? 1);
      const money = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN');
      // US-083 AC2: no commission, no "OTTIMO còn lại", no phone/email in the guest text.
      const text =
        locale === 'en'
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
      if (q.status !== 'active' || Date.parse(q.expiresAt) < Date.now())
        return problem(409, 'QUOTE_EXPIRED');
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
  };
}

export type ReservationMockState = ReturnType<typeof makeState>;
export type { GuestSummary };
