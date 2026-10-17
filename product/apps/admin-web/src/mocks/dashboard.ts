// MSW mock of EP01 (Sprint 4 – FE-B): `getTonightKpi`, `getArrivalsDepartures`, `listAttentionItems`,
// `resolveAttentionEvent` – OpenAPI 0.3.7, until BE-D ships the read module. Everything is COMPUTED from the
// EP02/EP03 mock state (reservations, blocks, folios, approvals), so a write on another screen changes the
// numbers on the next read – like the real API (US-010 AC2: no fixed numbers). Rules mirrored from
// specs/EP01-dashboard.md: BR-404 (arrivals/departures), metrics K-01…K-03 + S1c, BR-907 role filter
// (FD gets no money/FOC items – AC6; `foc_threshold` OWN only – AC8), US-031 reminder states (BR-425).
import type {
  ArrivalItem,
  ArrivalsDepartures,
  AttentionItem,
  DepartureItem,
  DepartureReminderState,
  ReservationSummary,
  Role,
  Room,
  TonightKpi,
} from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { todayLocal } from '../app/dates';
import type { MockReservation, ReservationMockState } from './reservations';
import type { MockUser } from './seed';

type Guard = { user: MockUser; roles: Role[] } | Response;
interface Ctx {
  guard: (request: StrictRequest<DefaultBodyType>, allowed: Role[] | 'any') => Guard;
  problem: (status: number, code: string, extra?: Record<string, unknown>) => Response;
  db: () => { rooms: Room[] };
  rsv: () => ReservationMockState;
  /** Items other mocks own (S4-39 guest-link documents waiting for a person – stay.ts). */
  extra: () => AttentionItem[];
}

const OWN_MGR: Role[] = ['owner', 'manager'];
const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));
const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const isResponse = (g: Guard): g is Response => g instanceof Response;
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 } as const;

/** A stored `attention_event` row (source = event) – closed by `resolveAttentionEvent`. */
export interface MockAttentionEvent extends AttentionItem {
  eventId: string;
  /** Roles that receive it (server filter). */
  audience: Role[];
  resolvedAt?: string;
  resolvedNote?: string;
}

/** The API shape of a stored event (mock bookkeeping fields dropped). */
function publicItem(e: MockAttentionEvent): AttentionItem {
  const item: Record<string, unknown> = { ...e };
  for (const k of ['audience', 'resolvedAt', 'resolvedNote']) delete item[k];
  return item as unknown as AttentionItem;
}

/** `HH:mm` local (Asia/Ho_Chi_Minh, the property zone) → instant of today. */
const todayAt = (hhmm: string) => `${todayLocal()}T${hhmm}:00+07:00`;

function makeState() {
  return { events: [] as MockAttentionEvent[], nextEvent: 1 };
}

export function createDashboardMock(ctx: Ctx) {
  const { guard, problem } = ctx;
  let state = makeState();
  const json = (body: unknown, status = 200) => HttpResponse.json(body as never, { status });
  const prop = '*/v1/properties/:propertyId';

  const roomOf = (r: MockReservation) => ctx.db().rooms.find((x) => x.id === r.roomId);
  const covers = (r: MockReservation, night: string) =>
    r.arrivalDate <= night && night < r.departureDate;
  const sellable = () => ctx.db().rooms.filter((r) => r.isSellable !== false);
  const blocksTonight = (T: string) => ctx.rsv().blocks.filter((b) => b.from <= T && T < b.to);

  function kpi(T: string): TonightKpi {
    const rooms = sellable();
    const ids = new Set(rooms.map((r) => r.id));
    const ooo = new Set(
      blocksTonight(T)
        .map((b) => b.roomId)
        .filter((id) => ids.has(id)),
    );
    const res = ctx.rsv().reservations;
    const sold = new Set(
      res
        .filter((r) => ['confirmed', 'in_house', 'checked_out'].includes(r.status))
        .filter((r) => r.roomId && ids.has(r.roomId) && covers(r, T))
        .map((r) => r.roomId!),
    );
    const holdOnly = new Set(
      res
        .filter((r) => r.status === 'hold' && r.roomId && covers(r, T) && !sold.has(r.roomId))
        .map((r) => r.roomId!),
    );
    const arrivals = res.filter(
      (r) => r.arrivalDate === T && (r.status === 'confirmed' || r.status === 'in_house'),
    );
    const departures = res.filter(
      (r) => r.departureDate === T && (r.status === 'in_house' || r.status === 'checked_out'),
    );
    const available = rooms.length - ooo.size;
    return {
      businessDate: T,
      roomsTotal: ctx.db().rooms.length,
      roomsSellable: rooms.length,
      oooRooms: ooo.size,
      availableRoomsNet: available,
      occupiedRooms: sold.size,
      holdOnlyRooms: holdOnly.size,
      arrivals: arrivals.length,
      arrivalsCheckedIn: arrivals.filter((r) => r.status === 'in_house').length,
      departures: departures.length,
      departuresCheckedOut: departures.filter((r) => r.status === 'checked_out').length,
      inHouse: res.filter((r) => r.status === 'in_house').length,
      occupancyPct: available > 0 ? Math.round((sold.size / available) * 1000) / 10 : null,
      unassignedConflictReservations: res.filter(
        (r) => !r.roomId && r.conflictState === 'open' && r.status === 'confirmed' && covers(r, T),
      ).length,
      denominatorNote: `Đêm khả dụng thuần = ${rooms.length} căn − ${ooo.size} căn khóa = ${available}`,
      metricRefs: {
        availableRoomsNet: 'K-01',
        occupiedRooms: 'K-02',
        occupancyPct: 'K-03',
        unassignedConflictReservations: 'S1c',
      },
    };
  }

  function summary(r: MockReservation, roles: Role[]): ReservationSummary {
    return {
      id: r.id,
      code: r.code,
      status: r.status,
      stayType: r.stayType,
      roomNo: roomOf(r)?.roomNo ?? null,
      arrivalDate: r.arrivalDate,
      departureDate: r.departureDate,
      nights: r.nights,
      guestDisplayName: r.guestName,
      channelCode: r.channelCode,
      etaTime: r.etaTime,
      holdExpiresAt: r.hold?.expiresAt,
      conflictState: r.conflictState,
      registrationStatus: r.registrationStatus,
      ...(has(roles, FD_PLUS) ? { balanceDueVnd: Math.max(0, r.balanceDueVnd ?? 0) } : {}),
    };
  }

  /** US-031 / BR-425 (mock clock = browser clock): 10:00 call, 12:00 (arrival same room) or 12:30 overdue. */
  function reminder(r: MockReservation, sameRoomArrival: boolean): DepartureReminderState {
    if (r.status === 'checked_out') return 'checked_out';
    if (r.agreedCheckoutTime) return 'replied';
    const now = Date.now();
    if (now >= Date.parse(todayAt(sameRoomArrival ? '12:00' : '12:30'))) return 'overdue';
    if (now >= Date.parse(todayAt('10:00'))) return 'call_needed';
    return 'reminded_waiting';
  }

  function arrivalsDepartures(T: string, roles: Role[]): ArrivalsDepartures {
    const res = ctx.rsv().reservations;
    const fd = has(roles, FD_PLUS);
    const arrivals: ArrivalItem[] = res
      .filter((r) => r.arrivalDate === T && (r.status === 'confirmed' || r.status === 'in_house'))
      .map((r) => ({
        ...summary(r, roles),
        allowedActions:
          fd && r.status === 'confirmed' && r.roomId && r.arrivalDate === todayLocal()
            ? [
                {
                  event: 'check_in',
                  transition: 'B9',
                  action: 'check-in',
                  requiresTrustedDevice: true,
                },
              ]
            : [],
      }));
    const departures: DepartureItem[] = res
      .filter(
        (r) => r.departureDate === T && (r.status === 'in_house' || r.status === 'checked_out'),
      )
      .map((r) => {
        const same = res.some(
          (x) =>
            x.id !== r.id &&
            !!r.roomId &&
            x.roomId === r.roomId &&
            x.arrivalDate === T &&
            x.status === 'confirmed',
        );
        return {
          ...summary(r, roles),
          reminderState: reminder(r, same),
          hasArrivalSameRoomToday: same,
          allowedActions:
            fd && r.status === 'in_house' && T === todayLocal()
              ? [{ event: 'check_out', transition: 'B18', action: 'check-out' }]
              : [],
        };
      });
    const holdsArrivingToday = res
      .filter((r) => r.status === 'hold' && r.arrivalDate === T)
      .map((r) => summary(r, roles));
    return { date: T, arrivals, departures, holdsArrivingToday };
  }

  /** BR-907 items computed at read time + stored events still open, filtered by role. */
  function attention(T: string, roles: Role[]): AttentionItem[] {
    const res = ctx.rsv().reservations;
    const rooms = ctx.db().rooms;
    const out: AttentionItem[] = [];
    // registration_due: arrivals today / in house without a sent registration (BR-602) – one line.
    const due = res.filter(
      (r) =>
        (r.status === 'in_house' || (r.status === 'confirmed' && r.arrivalDate === T)) &&
        r.stayType === 'short' &&
        !['sent', 'confirmed', 'void'].includes(String(r.registrationStatus ?? 'none')),
    );
    if (due.length)
      out.push({
        kind: 'registration_due',
        source: 'computed',
        severity: 'warning',
        count: due.length,
        dueAt: todayAt('23:00'),
        reservationIds: due.map((r) => r.id),
        roomNos: due.map((r) => roomOf(r)?.roomNo).filter((x): x is string => !!x),
        link: '/registrations?due=today',
      });
    // hold_expiring (BR-303): within hold_expiry_reminder_hours (24 h) – one line per hold.
    for (const r of res.filter((x) => x.status === 'hold' && x.hold?.expiresAt)) {
      const left = Date.parse(r.hold!.expiresAt!) - Date.now();
      if (left > 0 && left <= 24 * 3_600_000)
        out.push({
          kind: 'hold_expiring',
          source: 'computed',
          severity: left <= 2 * 3_600_000 ? 'critical' : 'warning',
          count: 1,
          dueAt: r.hold!.expiresAt,
          reservationIds: [r.id],
          refCode: r.code,
        });
    }
    // room_ooo (AC4, 0.3.7 add. 1): one line – `count` + `roomNos` only, no date.
    const oooRooms = blocksTonight(T)
      .map((b) => rooms.find((x) => x.id === b.roomId)?.roomNo)
      .filter((x): x is string => !!x);
    if (oooRooms.length)
      out.push({
        kind: 'room_ooo',
        source: 'computed',
        severity: 'info',
        count: oooRooms.length,
        roomNos: oooRooms,
      });
    // capacity_conflict (DOM D-1)
    for (const r of res.filter(
      (x) => x.capacityConflict && ['confirmed', 'in_house'].includes(x.status),
    ))
      out.push({
        kind: 'capacity_conflict',
        source: 'computed',
        severity: r.arrivalDate <= T ? 'critical' : 'warning',
        count: 1,
        reservationIds: [r.id],
        refCode: r.code,
      });
    // overbooking (S1c): OTA booking without a room – critical within 24 h of arrival (BR-317 (5)).
    for (const r of res.filter(
      (x) => !x.roomId && x.conflictState === 'open' && x.status === 'confirmed',
    )) {
      const hours = (Date.parse(`${r.arrivalDate}T14:00:00+07:00`) - Date.now()) / 3_600_000;
      out.push({
        kind: 'overbooking',
        source: 'event',
        eventId: uid(97_000 + Number(r.code.replace(/\D/g, ''))),
        severity: hours <= 24 ? 'critical' : 'warning',
        count: 1,
        reservationIds: [r.id],
        refCode: r.code,
      });
    }
    // ota_no_show_report (US-136 AC2, 0.3.7 D1): an OTA booking marked no-show → report it on the extranet.
    for (const r of res.filter((x) => x.status === 'no_show' && x.paymentModel !== 'direct')) {
      const eventId = uid(98_000 + Number(r.code.replace(/\D/g, '')));
      if (state.events.some((e) => e.eventId === eventId && e.resolvedAt)) continue;
      out.push({
        kind: 'ota_no_show_report',
        source: 'event',
        eventId,
        severity: 'warning',
        count: 1,
        reservationIds: [r.id],
        refCode: r.code,
        params: { action: 'report', channel: r.channelCode ?? '' },
      });
    }
    // foc_threshold (BR-435, US-012 AC8): OWN only, computed when the owner opens the page.
    if (roles.includes('owner'))
      out.push({ kind: 'foc_threshold', source: 'computed', severity: 'warning', count: 1 });
    out.push(...ctx.extra());
    // Stored events (tests / SSE simulation) still open and meant for this role.
    for (const e of state.events)
      if (!e.resolvedAt && has(roles, e.audience)) out.push(publicItem(e));
    // FD/FDL: no money / FOC items (AC6). `data_quality` of the registration checks is for the desk (0.3.7).
    const fdOnly = !has(roles, OWN_MGR);
    const visible = out.filter(
      (i) => !(fdOnly && ['reconcile_overdue', 'foc_threshold'].includes(i.kind)),
    );
    return visible.sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999'),
    );
  }

  const handlers = [
    http.get(`${prop}/dashboard/tonight`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      return json(kpi(todayLocal()));
    }),
    http.get(`${prop}/arrivals-departures`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const T = todayLocal();
      const date = new URL(request.url).searchParams.get('date') ?? T;
      const days =
        Math.abs(Date.parse(`${date}T00:00:00Z`) - Date.parse(`${T}T00:00:00Z`)) / 86_400_000;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || days > 7)
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'date', code: 'VALUE_OUT_OF_RANGE' }],
        });
      return json(arrivalsDepartures(date, g.roles));
    }),
    http.get(`${prop}/attention`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      return json({ data: attention(todayLocal(), g.roles) });
    }),
    http.post(`${prop}/attention-events/:eventId/actions/resolve`, async ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      if (!request.headers.get('idempotency-key')) return problem(428, 'PRECONDITION_REQUIRED');
      const eventId = String(params.eventId);
      const body = ((await request.json().catch(() => ({}))) ?? {}) as { note?: string };
      const open = attention(todayLocal(), g.roles).find((i) => i.eventId === eventId);
      if (!open) return problem(404, 'NOT_FOUND');
      // Close themselves when the business state changes (EP01 3.2) – never by hand (BE-D: 409).
      if (
        ['overbooking', 'unassigned_with_free_room', 'closed_reservation_credit'].includes(
          open.kind,
        )
      )
        return problem(409, 'INVALID_TRANSITION');
      const note = (body.note ?? '').trim();
      if (open.severity === 'critical' && note.length < 3)
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
        });
      const stored = state.events.find((e) => e.eventId === eventId);
      const now = new Date().toISOString();
      if (stored) Object.assign(stored, { resolvedAt: now, resolvedNote: note });
      else
        state.events.push({
          ...open,
          eventId,
          audience: FD_PLUS,
          resolvedAt: now,
          resolvedNote: note,
        });
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return {
    handlers,
    reset() {
      state = makeState();
    },
    get state() {
      return state;
    },
    /** Tests / console: add a stored event ("Mô phỏng sự kiện SSE" of hi-fi H24). */
    addEvent(item: Omit<AttentionItem, 'source' | 'eventId'> & { audience?: Role[] }) {
      const e: MockAttentionEvent = {
        source: 'event',
        eventId: uid(99_000 + state.nextEvent++),
        audience: item.audience ?? FD_PLUS,
        ...item,
      } as MockAttentionEvent;
      state.events.push(e);
      return e;
    },
  };
}
