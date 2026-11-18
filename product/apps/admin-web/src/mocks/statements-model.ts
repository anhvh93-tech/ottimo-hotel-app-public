// Data model of the FB-INV-012 mock (`statements.ts` holds the handlers). Shapes follow OpenAPI 0.3.14-draft on the
// BE branch plus the fields ARC asked BE to add (ARC-on-fe-pr-189 §1); `__tests__/fb012-mock-schema.test.ts` checks
// the answers against the schemas. INV 17/11: the opening of a period is its own reading (`period_start` of the
// month, or `checkin`), the previous closing and the gap are answered on it, the billed usage on the closing.
// Every guest, reading and amount here is made up (no real guest data).
import { businessDayLocal } from '../app/dates';
import {
  isOpeningKind,
  lastDayOf,
  meterUsage,
  monthOf,
  shiftMonth,
  type BillingPeriod,
  type MeterException,
  type MeterReading,
  type MeterType,
  type ReadingKind,
  type ReadingStatus,
} from '../app/statements';

export const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
export const TYPES: MeterType[] = ['electricity', 'water'];
export const round1 = (n: number) => Math.round(n * 10) / 10;

export interface LeaseStay {
  reservationId: string;
  reservationCode: string;
  folioId: string;
  roomId: string;
  roomNo: string;
  guestDisplayName: string;
  guestFullName: string;
  monthlyRentVnd: number;
  /** Arrival day: a `checkin` reading is read on or after it (contract: `readOn` before arrival → DATE_INVALID). */
  arrivalDate: string;
  /** Guest-facing room name (print, UXD-189-11). */
  roomName: string | null;
  status: 'in_house' | 'checked_out';
}

export interface ServiceFolioLine {
  id: string;
  reservationId: string;
  serviceDate: string;
  labelKey: string;
  amountVnd: number;
}

export interface StoredMeter {
  value: number;
  exception: MeterException | null;
}

export interface StoredReading {
  id: string;
  seq: number;
  reservationId: string;
  roomId: string;
  roomNo: string;
  kind: ReadingKind;
  periodMonth: string | null;
  readOn: string;
  electricity: StoredMeter;
  water: StoredMeter;
  photoAttachmentId: string | null;
  photoWaived: boolean;
  note: string | null;
  readByRole: string;
  readByInitials: string;
  lateReason: string | null;
  acknowledgedLower: boolean;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  version: number;
}

export interface StoredPeriod {
  id: string;
  reservationId: string;
  month: string;
  kind: 'regular' | 'final';
  status: BillingPeriod['status'];
  code: string | null;
  excludedFolioLineIds: string[];
  priorAdjustment: { amountVnd: number; reason: string } | null;
  replacesId: string | null;
  /** Frozen at issue (D4: drafts are computed on read). */
  snapshot: BillingPeriod | null;
  readingIds: string[];
  paidVnd: number;
  payments: Array<{
    id: string;
    method: 'cash' | 'vietqr';
    amountVnd: number;
    reconciliation: string;
  }>;
  issuedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  version: number;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const CLOSING_KINDS: ReadingKind[] = ['period_end', 'room_change_out', 'checkout'];
export const isClosingKind = (k: ReadingKind) => CLOSING_KINDS.includes(k);

/** Seed relative to the business day so every test date works: M = this month, P = M − 1, P2 = M − 2. */
export function seedState() {
  const today = businessDayLocal();
  const M = monthOf(today);
  const P = shiftMonth(M, -1);
  const P2 = shiftMonth(M, -2);
  const stays: LeaseStay[] = [
    {
      reservationId: uid(81_001),
      reservationCode: 'OTM-90001',
      folioId: uid(82_001),
      roomId: uid(206),
      roomNo: '203',
      guestDisplayName: 'N. Minh',
      guestFullName: 'Nguyễn Minh',
      monthlyRentVnd: 8_500_000,
      arrivalDate: `${P2}-20`,
      roomName: 'The Sage',
      status: 'in_house',
    },
    {
      reservationId: uid(81_002),
      reservationCode: 'OTM-90002',
      folioId: uid(82_002),
      roomId: uid(208),
      roomNo: '302',
      guestDisplayName: 'T. Lan',
      guestFullName: 'Trần Lan',
      monthlyRentVnd: 7_000_000,
      arrivalDate: `${P2}-01`,
      roomName: 'The Ivory',
      status: 'in_house',
    },
  ];
  let seq = 0;
  const r = (
    stay: LeaseStay,
    kind: ReadingKind,
    periodMonth: string | null,
    readOn: string,
    e: number,
    w: number,
  ): StoredReading => {
    seq += 1;
    return {
      id: uid(83_000 + seq),
      seq,
      reservationId: stay.reservationId,
      roomId: stay.roomId,
      roomNo: stay.roomNo,
      kind,
      periodMonth,
      readOn,
      electricity: { value: e, exception: null },
      water: { value: w, exception: null },
      photoAttachmentId: uid(84_000 + seq),
      photoWaived: false,
      note: null,
      readByRole: 'front_desk',
      readByInitials: 'H',
      lateReason: null,
      acknowledgedLower: false,
      voidedAt: null,
      voidReason: null,
      createdAt: `${readOn}T09:00:00+07:00`,
      version: 1,
    };
  };
  const [s203, s302] = stays as [LeaseStay, LeaseStay];
  const readings: StoredReading[] = [
    // 203: in on day 20 of P2; P2 closed at 1.250 / 35,2; P opened at 1.262 / 35,2 (12 kWh vacancy use, not billed).
    r(s203, 'checkin', null, `${P2}-20`, 1100, 30),
    r(s203, 'period_end', P2, lastDayOf(P2), 1250, 35.2),
    r(s203, 'period_start', P, lastDayOf(P2), 1262, 35.2),
    // 302: in on day 01 of P2; P2 closed 800 / 20,0; P opened 800 / 20,0, closed 905 / 23,4; M opened 905 / 23,4.
    r(s302, 'checkin', null, `${P2}-01`, 640, 12),
    r(s302, 'period_end', P2, lastDayOf(P2), 800, 20),
    r(s302, 'period_start', P, lastDayOf(P2), 800, 20),
    r(s302, 'period_end', P, lastDayOf(P), 905, 23.4),
    r(s302, 'period_start', M, lastDayOf(P), 905, 23.4),
  ];
  const services: ServiceFolioLine[] = [
    {
      id: uid(85_001),
      reservationId: s203.reservationId,
      serviceDate: `${P}-12`,
      labelKey: 'bill.line.adhoc_cleaning',
      amountVnd: 150_000,
    },
    {
      id: uid(85_002),
      reservationId: s203.reservationId,
      serviceDate: `${P}-26`,
      labelKey: 'bill.line.adhoc_cleaning',
      amountVnd: 150_000,
    },
  ];
  return { stays, readings, services, periods: [] as StoredPeriod[], seq: 1000, M, P };
}

export type MockState = ReturnType<typeof seedState>;

const valid = (x: StoredReading) => !x.voidedAt;
const before = (a: StoredReading, b: StoredReading) =>
  a.readOn < b.readOn || (a.readOn === b.readOn && a.seq < b.seq);

/** Latest valid closing of the room (any stay) before `x` – the reference of an opening reading. */
export function previousClosingOf(st: MockState, x: StoredReading) {
  return st.readings
    .filter((o) => valid(o) && o.id !== x.id && o.roomId === x.roomId && isClosingKind(o.kind))
    .filter((o) => before(o, x))
    .at(-1);
}

/** Opening of the period `x` (a closing) closes: the latest valid opening of the same stay and room before it. */
export function openingOf(st: MockState, x: StoredReading) {
  return st.readings
    .filter(
      (o) =>
        valid(o) &&
        o.id !== x.id &&
        o.reservationId === x.reservationId &&
        o.roomId === x.roomId &&
        isOpeningKind(o.kind),
    )
    .filter((o) => before(o, x))
    .at(-1);
}

export function readingView(st: MockState, x: StoredReading, issued: Set<string>): MeterReading {
  let previousClosing: MeterReading['previousClosing'] = null;
  let gap: MeterReading['gap'] = null;
  let consumption: MeterReading['consumption'] = null;
  if (isOpeningKind(x.kind)) {
    const prev = previousClosingOf(st, x);
    if (prev) {
      previousClosing = {
        readingId: prev.id,
        readOn: prev.readOn,
        electricity: prev.electricity.value,
        water: prev.water.value,
      };
      gap = {
        electricity: x.electricity.exception ? null : x.electricity.value - prev.electricity.value,
        water: x.water.exception ? null : round1(x.water.value - prev.water.value),
      };
    }
  } else {
    const open = openingOf(st, x);
    if (open)
      consumption = {
        fromReadingId: open.id,
        electricity: meterUsage(open.electricity.value, x.electricity, 'electricity'),
        water: meterUsage(open.water.value, x.water, 'water'),
      };
  }
  return {
    id: x.id,
    reservationId: x.reservationId,
    roomId: x.roomId,
    roomNo: x.roomNo,
    kind: x.kind,
    periodMonth: x.periodMonth,
    readOn: x.readOn,
    electricity: { ...x.electricity },
    water: { ...x.water },
    previousClosing,
    gap,
    consumption,
    photoAttachmentId: x.photoAttachmentId,
    photoWaived: x.photoWaived,
    exceptionApproved: !!(x.electricity.exception || x.water.exception),
    note: x.note,
    readByRole: x.readByRole,
    readByInitials: x.readByInitials,
    late: !!x.lateReason,
    lateReason: x.lateReason,
    voided: !!x.voidedAt,
    voidedAt: x.voidedAt,
    voidReason: x.voidReason,
    createdAt: x.createdAt,
    version: x.version,
    onIssuedStatement: issued.has(x.id),
  };
}

/** Opening reading of utility month `u` for a stay: `period_start` of `u`, or the check-in inside `u`. */
export function periodOpening(st: MockState, stay: LeaseStay, u: string) {
  return st.readings
    .filter(
      (x) =>
        valid(x) &&
        x.reservationId === stay.reservationId &&
        ((x.kind === 'period_start' && x.periodMonth === u) ||
          ((x.kind === 'checkin' || x.kind === 'room_change_in') && monthOf(x.readOn) === u)),
    )
    .at(-1);
}

/** Closing reading of utility month `u`: `period_end` of `u`, or a check-out / room change inside `u`. */
export function periodClosing(st: MockState, stay: LeaseStay, u: string) {
  return st.readings
    .filter(
      (x) =>
        valid(x) &&
        x.reservationId === stay.reservationId &&
        ((x.kind === 'period_end' && x.periodMonth === u) ||
          ((x.kind === 'checkout' || x.kind === 'room_change_out') && monthOf(x.readOn) === u)),
    )
    .at(-1);
}

export function statusOf(x: StoredReading | undefined): ReadingStatus {
  if (!x) return 'missing';
  return x.electricity.exception || x.water.exception ? 'exception' : 'recorded';
}

/** End-of-month window of `month` (BR-LS-10): last day − daysBefore … day 01 of the next month + daysAfter − 1. */
export function windowOf(month: string, w: { daysBeforeMonthEnd: number; daysAfter: number }) {
  const end = lastDayOf(month);
  const from = new Date(`${end}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - w.daysBeforeMonthEnd);
  const to = new Date(`${shiftMonth(month, 1)}-01T00:00:00Z`);
  to.setUTCDate(to.getUTCDate() + Math.max(0, w.daysAfter - 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
