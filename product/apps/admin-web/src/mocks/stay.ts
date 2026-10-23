// MSW mock of Sprint 3 (OpenAPI 0.3.6-draft): check-in (B9/B17), stay (B13/B14/B15, party), check-out
// (B18 + summary, minibar, bill), folio + payments + VietQR, approvals + refunds (A43/A46/A46a/A47/A47a),
// audit (money), registration (EP06 – C3 on trusted devices only). BE-A/B/C build the real API in
// parallel; this file follows the spec order of checks so the UI can be built and tested now.
// Dev/test only – never bundled (main.tsx imports mocks dynamically).
import type { AttentionItem, Role, Room } from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { businessDayLocal, todayLocal } from '../app/dates';
import { currentSegment } from '../app/reservations';
import type { MockFolioPort, MockReservation, MockServiceLine } from './reservations';
import { MOCK_PASSWORD, type MockUser } from './seed';

type Guard = { user: MockUser; roles: Role[] } | Response;
type Body = Record<string, unknown>;
interface RsvApi {
  state: {
    reservations: MockReservation[];
    idempotency: Map<string, { status: number; body: unknown }>;
  };
  view: (r: MockReservation, user: MockUser, roles: Role[]) => unknown;
  find: (
    params: Record<string, unknown>,
    g: { user: MockUser; roles: Role[] },
  ) => MockReservation | null;
  idem: (
    request: StrictRequest<DefaultBodyType>,
    scope: string,
  ) => { key: string | null; replay: Response | null };
  remember: (key: string | null, status: number, body: unknown) => Response;
  setFolioPort: (p: MockFolioPort) => void;
}
interface Ctx {
  guard: (
    request: StrictRequest<DefaultBodyType>,
    allowed: Role[] | 'any',
    opts?: { ifMatch?: number },
  ) => Guard;
  problem: (
    status: number,
    code: string,
    extra?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => Response;
  db: () => { users: MockUser[]; rooms: Room[]; currentDeviceTrusted: boolean };
  rsv: () => RsvApi;
}

const OWN_MGR: Role[] = ['owner', 'manager'];
/** Mock BR-433: what a manager may waive on the BR-416-06 late fee at once (the owner: no limit). */
const LATE_FEE_FOC_LIMIT_MGR = 1_000_000;
const LEAD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead'];
const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const SALES: Role[] = ['sales_staff', 'collaborator'];
const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));
const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const round1000 = (v: number) => Math.round(v / 1000) * 1000;
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export interface MockLine {
  id: string;
  category: string;
  description: string;
  serviceDate?: string;
  quantity: number;
  unitPriceVnd: number;
  amountVnd: number;
  lineState: 'posted' | 'pending_approval' | 'rejected';
  /** Bill label contract proposed by DOM/ARC (`bill.line.*` + params); `description` stays technical. */
  labelKey?: string;
  labelParams?: Record<string, string | number>;
  /** Catalogue / system charge code (`extra_night`, `overpayment_retained`, `key_card_fee`…). */
  chargeCode?: string;
  relatedLineId?: string;
  /** Reversal line (0.3.7 S4-08: service lines reversed on cancel / no-show). */
  reversalOfId?: string;
  approvalRequestId?: string;
  postedAt: string;
  postedBy?: string;
  /** Minibar M-1 (0.3.7 add. 4): the cabinet (room) a minibar line was counted in; absent = the room assigned now. */
  cabinetRoomId?: string;
  /** Minibar M-1 (BUG-R2-144): the refill period of that cabinet the line was counted in (absent = 0). */
  minibarPeriod?: number;
}
type MinibarCount = Array<{ itemId: string; remainingQty: number }>;
/** 0.3.7 add. 4 (DOM (f)): what `createVietQr` was for, kept to price "still due" when the desk confirms it. */
export interface MockQrContext {
  checkinTime?: string;
  addPriorNight?: boolean;
  checkoutTime?: string;
  extraNightRateVnd?: number;
  lateFeeAsNight?: boolean;
}
export interface MockPayment {
  id: string;
  code: string;
  folioId: string;
  reservationCode?: string;
  type: 'charge' | 'deposit' | 'refund';
  method: string;
  amountVnd: number;
  status: 'pending' | 'succeeded' | 'reversed' | 'expired';
  reconciliation: 'not_required' | 'pending' | 'reconciled' | 'disputed';
  receivedAt?: string;
  /** VietQR `pending`: business-day rollover after creation (0.3.3). */
  expiresAt?: string;
  recordedBy?: string;
  recordedByUserId?: string;
  recordedByRole?: Role;
  reconciledByName?: string;
  note?: string;
  attachmentId?: string;
  approvalRequestId?: string;
  /** VietQR only: `purpose` of `createVietQr` + its context (`payment.qr_purpose` / `qr_context`). */
  qrPurpose?: 'deposit' | 'balance' | 'check_in' | 'check_out';
  qrContext?: MockQrContext;
  version: number;
}
interface MockFolio {
  id: string;
  reservationId: string;
  status: 'open' | 'settled';
  billNo: string | null;
  /** 0.3.7 add. 1 (`Bill.settledAt`) – set with the folio number at B18. */
  settledAt?: string;
  lines: MockLine[];
  invoiceRequest?: Body;
  version: number;
}
export interface MockApproval {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'cancelled';
  reservationCode?: string;
  folioId?: string;
  folioLineId?: string;
  amountVnd: number;
  reasonCode: string;
  reasonNote?: string;
  requestedBy: string;
  requestedByUserId: string;
  requestedAt: string;
  approverName?: string;
  approverUserId?: string;
  decidedAt?: string;
  refundDestination?: {
    method: string;
    bankBin?: string;
    accountNo?: string;
    accountHolder?: string;
    setAt: string;
    setByUserId?: string;
  };
  refundedVnd?: number;
  /** 0.3.7 B-6: `ApprovalRequest.version` – bumped on every change the approver must see. */
  version?: number;
  /** 0.3.7 D1 / SEC BE-80: set when the server closed the request by itself (`status = cancelled`). */
  autoCancelReason?: string;
  /** SEC BE-80: what a debt write-off really applied (≤ `amountVnd`, fixed at approval). */
  effectiveAmountVnd?: number;
  /** BR-436: FD/FDL waived a minibar line within their own limit (re-auth). */
  selfApplied?: boolean;
}
interface MockDoc {
  id: string;
  partyMemberId?: string;
  docType: string;
  isMain: boolean;
  fullNameOnDoc: string;
  nationalityCode?: string;
  docNumber: string;
  dateOfBirth?: string;
  passportExpiryDate?: string;
  visaValidUntil?: string;
  entryDate?: string;
  gender?: string;
  passportIssueDate?: string;
  issuingPlace?: string;
  visaKind?: string;
  visaNumber?: string;
  entryPort?: string;
  entryPurpose?: string;
  noEntryRecord?: boolean;
  address?: string;
  imageIds: string[];
  imageConsent: 'not_recorded' | 'granted' | 'refused';
  captureMethod: string;
  /** Guest-link slot "Khách n" (uploadGuestDocument.personIndex). */
  personIndex?: number;
  /**
   * BUG-R2-083 (BE-C 9b): set when a person left the party while this guest-link document (n ≥ 2) was linked
   * to nobody – deleted then unless the desk links it (`isUnclaimed`, `updateGuestDocument` + partyMemberId).
   */
  fieldsPurgeAfter?: string | null;
  checks: Array<{
    code: string;
    result: string;
    blocking?: boolean;
    manualResult?: 'pass' | 'fail' | null;
    handledNote?: string;
    handledByName?: string;
  }>;
}
interface MockRegistration {
  id: string;
  reservationId: string;
  status: string;
  documents: MockDoc[];
  portalReference?: string;
  version: number;
  blocksDoorCode: boolean;
}
interface MockMember {
  id: string;
  role: 'booker' | 'companion' | 'child';
  displayName: string;
  priceAgeBand: 'adult' | 'child_6_11' | 'child_under_6';
  effectiveFrom?: string;
}

type LabelParams = Record<string, string | number>;
/**
 * Same rules as BE `folio/public/line-labels.ts` (closed `bill.line.*` list, 0.3.6 bổ sung 2): the
 * key comes from category / charge code, params from the technical description, then the poster's
 * own `labelParams` win. `room` = room of the stay (the mock has one segment).
 */
export function labelFor(
  l: Pick<MockLine, 'category' | 'description'> & Partial<MockLine>,
  roomNo?: string | null,
): { labelKey: string; labelParams?: LabelParams } {
  const given = l.labelParams ?? {};
  const d = l.description ?? '';
  const qty = Number(l.quantity ?? 1);
  const out = (labelKey: string, p: Record<string, string | number | null | undefined> = {}) => {
    const labelParams: LabelParams = {};
    for (const [k, v] of Object.entries(p))
      if (v !== null && v !== undefined && v !== '') labelParams[k] = v;
    return Object.keys(labelParams).length ? { labelKey, labelParams } : { labelKey };
  };
  const timePct = () => {
    const m = /(\d{2}:\d{2})\s+(\d+)%/.exec(d);
    return m ? { time: m[1], pct: Number(m[2]) } : {};
  };
  switch (l.category) {
    case 'room':
      return out(
        l.chargeCode === 'extra_night' ? 'bill.line.extra_night' : 'bill.line.room_night',
        {
          date: l.serviceDate,
          room: roomNo,
          ...given,
        },
      );
    case 'extra_person': {
      const m = /x(\d+)/.exec(d);
      return out('bill.line.extra_person', {
        date: l.serviceDate,
        count: m ? Number(m[1]) : null,
        ...given,
      });
    }
    case 'early_checkin':
      return out('bill.line.early_checkin', { ...timePct(), ...given });
    case 'late_checkout':
      return out('bill.line.late_checkout', { ...timePct(), ...given });
    case 'early_departure_fee': {
      const m = /(\d+)d\b/.exec(d);
      return out('bill.line.early_departure_fee', {
        noticeDays: m ? Number(m[1]) : null,
        ...given,
      });
    }
    case 'deposit_forfeit':
      return out('bill.line.overpayment_retained', given);
    case 'room_change_difference': {
      const m = /(\S+)->(\S+)/.exec(d);
      return out('bill.line.room_change', { from: m?.[1], to: m?.[2], ...given });
    }
    case 'minibar':
      return out('bill.line.minibar', { item: d, ...given, qty });
    case 'cancellation_fee':
      return out('bill.line.cancellation_fee', given);
    case 'no_show_fee':
      return out('bill.line.no_show_fee', given);
    case 'foc':
    case 'discount':
      return out(l.category === 'foc' ? 'bill.line.foc' : 'bill.line.discount', given);
    case 'laundry':
      return out('bill.line.laundry', { ...given, qty });
    case 'cleaning':
      return out('bill.line.adhoc_cleaning', { ...given, qty });
    case 'penalty':
      return l.chargeCode === 'key_card_fee'
        ? out('bill.line.key_card_fee', { ...given, qty })
        : out('bill.line.smoking_fee', given);
    case 'damage':
      return out('bill.line.damage', { item: d, ...given, qty });
    case 'fnb':
      return out('bill.line.fnb', { text: d, ...given, qty });
    case 'service_fee':
      return out('bill.line.service_fee', { text: d, ...given, qty });
    case 'utilities':
      return out('bill.line.utilities', given);
    default:
      return out('bill.line.adjustment', given);
  }
}

/** Minibar catalogue – shared with mocks/ops.ts (US-066 edits it; check-out reads the current price). */
export const MINIBAR = [
  {
    itemId: uid(7001),
    itemName: 'Coca-Cola 330 ml',
    standardQty: 2,
    isFree: false,
    unitPriceVnd: 25_000,
  },
  {
    itemId: uid(7002),
    itemName: 'Bia Đà Lạt',
    standardQty: 2,
    isFree: false,
    unitPriceVnd: 35_000,
  },
  {
    itemId: uid(7003),
    itemName: 'Snack khoai tây',
    standardQty: 1,
    isFree: false,
    unitPriceVnd: 30_000,
  },
  {
    itemId: uid(7004),
    itemName: 'Nước suối 500 ml',
    standardQty: 2,
    isFree: true,
    unitPriceVnd: 0,
  },
];
const CATALOG = [
  {
    code: 'LAUNDRY_KG',
    category: 'laundry',
    name: 'Giặt ủi',
    defaultUnitPriceVnd: 30_000,
    unit: 'kg',
    priceEditable: false,
  },
  {
    code: 'FNB',
    category: 'fnb',
    name: 'Đồ ăn gọi thêm',
    defaultUnitPriceVnd: 50_000,
    priceEditable: true,
  },
  {
    code: 'SMOKING',
    category: 'penalty',
    name: 'Khử mùi thuốc lá',
    defaultUnitPriceVnd: 500_000,
    evidenceRequired: true,
    priceEditable: false,
  },
  {
    code: 'CARD_LOST',
    category: 'penalty',
    name: 'Thiếu thẻ phòng',
    defaultUnitPriceVnd: 200_000,
    evidenceRequired: true,
    priceEditable: false,
  },
  {
    code: 'DAMAGE_TOWEL',
    category: 'damage',
    name: 'Hư hỏng – khăn tắm',
    defaultUnitPriceVnd: 150_000,
    evidenceRequired: true,
    priceEditable: false,
  },
];
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
const FOREIGN = new Set([
  'Anna Martin',
  'Kim Seo-yeon',
  'Sophie Martin',
  'Daniel Weber',
  'Emma Laurent',
]);

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return digits.length >= 13 && sum % 10 === 0;
}
const tokens = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);

export function createStayMock(ctx: Ctx) {
  const { guard, problem } = ctx;
  const isResponse = (g: unknown): g is Response => g instanceof Response;
  const prop = '*/v1/properties/:propertyId';
  const today = () => todayLocal();
  const json = (body: unknown, status = 200) => HttpResponse.json(body as never, { status });
  const validation = (errors: Array<{ field: string; code: string }>) =>
    problem(422, 'VALIDATION_FAILED', { errors });
  const rsv = () => ctx.rsv();
  const roomOf = (r: MockReservation) => ctx.db().rooms.find((x) => x.id === r.roomId);

  function makeState() {
    const reservations = rsv().state.reservations;
    const folios = new Map<string, MockFolio>();
    const payments: MockPayment[] = [];
    const registrations = new Map<string, MockRegistration>();
    const party = new Map<string, MockMember[]>();
    const roomStatus: Record<string, string> = { ...ROOM_STATUS };
    let n = 0;
    const now = new Date().toISOString();
    const fdUser = uid(4);
    for (const r of reservations) {
      // 0.3.6 add. 4: guests the OTA priced (adults + children 6–11), null for other channels.
      r.otaGuestCount = r.paymentModel !== 'direct' ? r.adults + (r.children6to11 ?? 0) : null;
      // Hi-fi H16 example: Phạm Huy (201, Agoda "trả tại chỗ", 3 × 820.000).
      if (r.guestName === 'Phạm Huy') {
        r.paymentModel = 'ota_pay_at_property';
        r.nightlyRates = (r.nightlyRates ?? []).map((x) => ({ ...x, amountVnd: 820_000 }));
        r.totalRoomVnd = 820_000 * (r.nights ?? 0);
        r.actualCheckinAt = new Date(Date.now() - 3 * 86_400_000).toISOString();
        r.cardsIssued = 1;
        r.houseRulesSentAt = r.actualCheckinAt;
        r.doorAccessHandedOverAt = r.actualCheckinAt;
      }
      if (r.guestName === 'Kim Seo-yeon') {
        r.actualCheckinAt = new Date(Date.now() - 86_400_000).toISOString();
        r.doorAccessHandedOverAt = null;
      }
      if (FOREIGN.has(r.guestName)) r.nationality = 'FRA';
      const lines: MockLine[] = (r.nightlyRates ?? []).map((nr, i) => ({
        id: uid(80_000 + ++n),
        category: 'room',
        description: 'room_night',
        ...labelFor(
          { category: 'room', description: 'room_night', serviceDate: nr.date },
          currentSegment(r.segments, nr.date)?.roomNo,
        ),
        serviceDate: nr.date,
        quantity: 1,
        unitPriceVnd: nr.amountVnd,
        amountVnd: nr.amountVnd,
        lineState: 'posted',
        postedAt: now,
        postedBy: i === 0 ? 'Hạnh' : undefined,
      }));
      folios.set(r.folioId, {
        id: r.folioId,
        reservationId: r.id,
        status: r.status === 'checked_out' ? 'settled' : 'open',
        billNo: r.status === 'checked_out' ? `F26-0001${String(++n).padStart(2, '0')}` : null,
        lines,
        version: 1,
      });
      if (r.depositPaidVnd > 0)
        payments.push({
          id: uid(81_000 + ++n),
          code: `PT-0${n}`,
          folioId: r.folioId,
          reservationCode: r.code,
          type: 'deposit',
          method: 'bank_transfer',
          amountVnd: r.depositPaidVnd,
          status: 'succeeded',
          reconciliation: 'reconciled',
          receivedAt: now,
          recordedBy: 'Hạnh',
          recordedByUserId: fdUser,
          recordedByRole: 'front_desk',
          version: 1,
        });
      if (r.paymentModel === 'ota_prepaid' && lines.length)
        payments.push({
          id: uid(81_500 + ++n),
          code: `PT-0${n}`,
          folioId: r.folioId,
          reservationCode: r.code,
          type: 'charge',
          method: 'ota_collect',
          amountVnd: lines.reduce((a, l) => a + l.amountVnd, 0),
          status: 'succeeded',
          reconciliation: 'not_required',
          receivedAt: now,
          recordedBy: 'system',
          version: 1,
        });
      if (r.guestName === 'Gia đình anh Hưng')
        r.depositShortfall = {
          shortfallVnd: 300_000,
          acceptedAt: now,
          acceptedByName: 'Quân',
          reason: 'Khách quen, thu đủ khi đến',
        };
      const regId = uid(82_000 + ++n);
      r.registrationId = regId;
      r.registrationStatus = r.status === 'checked_out' ? 'confirmed' : 'none';
      registrations.set(regId, {
        id: regId,
        reservationId: r.id,
        status: r.registrationStatus,
        documents: [],
        version: 1,
        blocksDoorCode: false,
      });
      party.set(r.id, [
        {
          // Like the server (BE-C, ARC 16.22): the booker's id in `party[]` is the reservation id.
          id: r.id,
          role: 'booker',
          displayName: r.guestName,
          priceAgeBand: 'adult',
        },
      ]);
    }
    // OTA prepaid stays: room money is not due at the desk.
    // A sale's cash deposit waiting to be handed in at the desk (BR-527, A46a).
    const sal = reservations.find((r) => r.guestName === 'Nguyễn Văn An')!;
    payments.push({
      id: uid(84_001),
      code: 'PT-0166',
      folioId: sal.folioId,
      reservationCode: sal.code,
      type: 'deposit',
      method: 'cash',
      amountVnd: 1_600_000,
      status: 'succeeded',
      reconciliation: 'pending',
      receivedAt: now,
      recordedBy: 'Sơn',
      recordedByUserId: uid(7),
      recordedByRole: 'sales_staff',
      version: 1,
    });
    // A desk VietQR waiting for the bank statement (A46, MGR+).
    payments.push({
      id: uid(84_002),
      code: 'PT-0151',
      folioId: sal.folioId,
      reservationCode: sal.code,
      type: 'deposit',
      method: 'vietqr',
      amountVnd: 1_000_000,
      status: 'succeeded',
      reconciliation: 'pending',
      receivedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      recordedBy: 'Hạnh',
      recordedByUserId: fdUser,
      recordedByRole: 'front_desk',
      note: 'FT2628811902',
      version: 1,
    });
    // Refund requests (G-14): cash approved by the manager, created by the lead (FD may pay it out);
    // a bank-transfer refund created by FD (only MGR/OWN execute – A47); FD's own cash refund (403).
    const nga = reservations.find((r) => r.guestName === 'Trần Thu Nga')!;
    const kim = reservations.find((r) => r.guestName === 'Kim Seo-yeon')!;
    const approvals: MockApproval[] = [
      {
        id: uid(85_001),
        type: 'refund',
        status: 'approved',
        reservationCode: nga.code,
        folioId: nga.folioId,
        amountVnd: 500_000,
        reasonCode: 'overpayment',
        reasonNote: 'Khách trả dư tiền cọc',
        requestedBy: 'Lan',
        requestedByUserId: uid(3),
        requestedAt: now,
        approverName: 'Quân',
        decidedAt: now,
        refundDestination: { method: 'cash', setAt: now },
        refundedVnd: 0,
      },
      {
        id: uid(85_002),
        type: 'refund',
        status: 'approved',
        reservationCode: kim.code,
        folioId: kim.folioId,
        amountVnd: 1_200_000,
        reasonCode: 'early_departure',
        reasonNote: 'Trả sớm 1 đêm',
        requestedBy: 'Hạnh',
        requestedByUserId: fdUser,
        requestedAt: now,
        approverName: 'Quân',
        decidedAt: now,
        refundDestination: {
          method: 'bank_transfer',
          bankBin: '970407',
          accountNo: '19036666777',
          accountHolder: 'KIM SEO YEON',
          setAt: now,
        },
        refundedVnd: 0,
      },
      {
        id: uid(85_003),
        type: 'refund',
        status: 'approved',
        reservationCode: kim.code,
        folioId: kim.folioId,
        amountVnd: 200_000,
        reasonCode: 'overpayment',
        requestedBy: 'Hạnh',
        requestedByUserId: fdUser,
        requestedAt: now,
        approverName: 'Quân',
        decidedAt: now,
        refundDestination: { method: 'cash', setAt: now },
        refundedVnd: 0,
      },
      {
        id: uid(85_004),
        type: 'foc',
        status: 'pending',
        reservationCode: kim.code,
        folioId: kim.folioId,
        amountVnd: 75_000,
        reasonCode: 'regular_vip',
        reasonNote: 'Khách ở lần thứ 4',
        requestedBy: 'Hạnh',
        requestedByUserId: fdUser,
        requestedAt: now,
      },
    ];
    const audit: Array<Record<string, unknown>> = [
      {
        occurredAt: now,
        actorType: 'user',
        actorName: 'Sơn · Sale',
        actorUserId: uid(7),
        category: 'money',
        action: 'payment.recorded',
        entityType: 'payment',
        entityCode: sal.code,
        after: {
          amountVnd: 1_600_000,
          method: 'cash',
          recordedByRole: 'sales_staff',
          reconciliation: 'pending',
        },
      },
      {
        occurredAt: now,
        actorType: 'user',
        actorName: 'Quân · Quản lý',
        actorUserId: uid(2),
        category: 'money',
        action: 'reservation.closer_changed',
        entityType: 'reservation',
        entityCode: sal.code,
        before: { closer: 'Sơn' },
        after: { closer: 'Mai' },
        reason: 'Khách do CTV giới thiệu',
      },
      {
        occurredAt: now,
        actorType: 'user',
        actorName: 'Hạnh',
        actorUserId: fdUser,
        category: 'money',
        action: 'folio.line_posted',
        entityType: 'folio',
        entityCode: kim.code,
        after: { amountVnd: 75_000, category: 'laundry' },
      },
    ];
    // Kim (402) used laundry – a line + the pending FOC above.
    folios.get(kim.folioId)!.lines.push({
      id: uid(86_001),
      category: 'laundry',
      description: 'LAUNDRY_KG x2.5',
      chargeCode: 'LAUNDRY_KG',
      labelKey: 'bill.line.laundry',
      labelParams: { qty: 2.5 },
      serviceDate: today(),
      quantity: 2.5,
      unitPriceVnd: 30_000,
      amountVnd: 75_000,
      lineState: 'posted',
      postedAt: now,
      postedBy: 'Hạnh',
    });
    approvals[3]!.folioLineId = uid(86_001);
    return {
      folios,
      payments,
      registrations,
      party,
      roomStatus,
      approvals,
      audit,
      minibarChecks: new Map<string, Array<{ itemId: string; remainingQty: number }>>(),
      /** BR-416-06 desk confirmation: failed attempts per caller (mock SR-RL-02, no expiry). */
      lateFeeFails: new Map<string, number>(),
      /**
       * Minibar M-1 (BR-703-01): cabinets of earlier rooms of a stay (after B14), by reservation id; `lines` =
       * their `checkout` count (absent = not counted yet). The room assigned now stays in `minibarChecks`.
       */
      minibarOldRooms: new Map<
        string,
        Array<{
          roomId: string;
          roomNo: string;
          lines?: Array<{ itemId: string; remainingQty: number }>;
        }>
      >(),
      /**
       * BUG-R2-144 (BR-703-02): `${reservationId}:${roomId}` of a counted cabinet that must be counted again in
       * the same refill period (extension after the count – DOM (b); back in the room before the refill was done).
       */
      minibarRecount: new Set<string>(),
      /** BUG-R2-144: current refill period per `${reservationId}:${roomId}` (a refill starts a new one; absent = 0). */
      minibarPeriods: new Map<string, number>(),
      /**
       * ARC 16.14 `new_fill` (R3 refill mid-stay, no stay event): cabinets whose new period is still to count. Tests
       * open one by bumping `minibarPeriods`, clearing the count and adding the key here.
       */
      minibarNewFill: new Set<string>(),
      /** ARC 16.19 K11-09 `not_today`: the room of today was counted, but not on the business day of B18 (tests). */
      minibarNotToday: new Set<string>(),
      reminders: new Map<string, Array<Record<string, unknown>>>(),
      attachments: new Set<string>(),
      stepUpUntil: new Map<string, number>(),
      /** A22a guest links: issued/revoked times per reservation (the token itself is never kept). */
      guestLinks: new Map<string, { issuedAt: string; revokedAt?: string; count: number }>(),
      /** 0.3.6 add. 3: property parameters behind `Registration.consentNotice` (null = not set up). */
      consentNotice: { currentNoticeVersion: 'privacy-2026-10-v1', imageRetentionDays: 30 } as {
        currentNoticeVersion: string;
        imageRetentionDays: number;
      } | null,
      paymentNotConfigured: false,
      /** Tests: a server before 0.3.7 add. 4 (no `lateFeeAsNightVnd`, the unsold night still priced in the due). */
      legacyNoLateFeeAsNight: false,
      seq: 200,
    };
  }

  let st = makeState();
  const next = () => ++st.seq;
  const nowIso = () => new Date().toISOString();

  // ---------- helpers ----------
  const trusted = (g: { user: MockUser; roles: Role[] }) =>
    g.user.deviceTrusted === true || (g.roles.includes('owner') && ctx.db().currentDeviceTrusted);
  const roleName = (g: { user: MockUser }) => g.user.displayName;
  const audit = (g: { user: MockUser }, action: string, code: string | undefined, after: Body) =>
    st.audit.unshift({
      occurredAt: nowIso(),
      actorType: 'user',
      actorName: g.user.displayName,
      actorUserId: g.user.id,
      category: 'money',
      action,
      entityType: 'folio',
      entityCode: code,
      after,
    });

  function folioOf(r: MockReservation) {
    // Bookings created after the seed (holds from a quote, new bookings) get their folio on first use.
    let f = st.folios.get(r.folioId);
    if (!f) {
      f = {
        id: r.folioId,
        reservationId: r.id,
        status: 'open',
        billNo: null,
        lines: (r.nightlyRates ?? []).map((nr) => ({
          id: uid(80_500 + next()),
          category: 'room',
          description: 'room_night',
          ...labelFor(
            { category: 'room', description: 'room_night', serviceDate: nr.date },
            currentSegment(r.segments, nr.date)?.roomNo,
          ),
          serviceDate: nr.date,
          quantity: 1,
          unitPriceVnd: nr.amountVnd,
          amountVnd: nr.amountVnd,
          lineState: 'posted' as const,
          postedAt: nowIso(),
        })),
        version: 1,
      };
      st.folios.set(r.folioId, f);
    }
    return f;
  }
  /** The booking a folio belongs to (its primary), within the caller's scope. */
  function byFolio(folioId: string, g: { user: MockUser; roles: Role[] }) {
    const id =
      st.folios.get(folioId)?.reservationId ??
      rsv().state.reservations.find((x) => x.folioId === folioId)?.id;
    return id ? rsv().find({ reservationId: id }, g) : null;
  }
  /**
   * 0.3.7 `CheckInPreview.amountDueAtCheckinVnd` (BUG-R2-038, BR-402 v0.3.6): balance now + early
   * surcharge / B9a night that check-in will post (the mock has no pending FOC on extras before B9).
   */
  /** The night before arrival is held by another live booking of the same room (BR-906, BUG-R2-127). */
  function priorTaken(r: MockReservation) {
    const night = addDays(r.arrivalDate, -1);
    return rsv().state.reservations.some(
      (o) =>
        o.id !== r.id &&
        o.roomId === r.roomId &&
        ['hold', 'confirmed', 'in_house'].includes(o.status) &&
        o.arrivalDate <= night &&
        o.departureDate > night,
    );
  }
  function dueAtCheckin(r: MockReservation, time: string, priorNight = false) {
    const sur = earlySurcharge(r, time);
    const posted = sur.addsPreviousNight ? (priorNight ? sur.baseNightVnd : 0) : sur.amountVnd;
    const tt = totals(r);
    // A VietQR confirmed before B9 leaves a temporary credit that the posted charge then uses up.
    return Math.max(0, tt.balanceDueVnd - tt.creditVnd + posted);
  }
  function totals(r: MockReservation) {
    const f = folioOf(r);
    const posted = f.lines.filter((l) => l.lineState === 'posted');
    const roomVnd = posted
      .filter((l) => l.category === 'room')
      .reduce((a, l) => a + l.amountVnd, 0);
    const totalVnd = posted.reduce((a, l) => a + l.amountVnd, 0);
    const pays = st.payments.filter((p) => p.folioId === f.id && p.status === 'succeeded');
    const paidVnd = pays.filter((p) => p.type !== 'refund').reduce((a, p) => a + p.amountVnd, 0);
    const refundedVnd = pays
      .filter((p) => p.type === 'refund')
      .reduce((a, p) => a + p.amountVnd, 0);
    // DOM BE-13 / FE-03: OTA prepaid room money is a system `ota_collect` payment – no special case.
    const paidViaOtaVnd = pays
      .filter((p) => p.method === 'ota_collect')
      .reduce((a, p) => a + p.amountVnd, 0);
    const net = totalVnd - paidVnd + refundedVnd;
    const creditVnd = Math.max(0, -net);
    // 0.3.6 add. 2: credit already covered by an open/approved refund request is "handled".
    const requested = st.approvals
      .filter(
        (a) =>
          a.type === 'refund' &&
          a.folioId === f.id &&
          ['pending', 'approved', 'escalated'].includes(a.status),
      )
      .reduce((a, x) => a + x.amountVnd - (x.refundedVnd ?? 0), 0);
    return {
      roomVnd,
      otherVnd: totalVnd - roomVnd,
      totalVnd,
      paidVnd,
      paidViaOtaVnd,
      otaExcessVnd: 0,
      balanceDueVnd: Math.max(0, net),
      creditVnd,
      unhandledCreditVnd: Math.max(0, creditVnd - requested),
      refundedVnd,
      pendingApprovals: f.lines.filter((l) => l.lineState === 'pending_approval').length,
    };
  }
  function syncReservation(r: MockReservation) {
    const tt = totals(r);
    r.balanceDueVnd = tt.balanceDueVnd;
  }
  function paymentView(p: MockPayment) {
    return {
      ...p,
      qrContext: undefined,
      amountDueNowVnd: qrDueNow(p),
      pendingDays: Math.floor((Date.now() - Date.parse(p.receivedAt ?? nowIso())) / 86_400_000),
    };
  }
  function folioView(r: MockReservation, roles: Role[]) {
    const f = folioOf(r);
    const tt = totals(r);
    const out = {
      id: f.id,
      status: f.status,
      billNo: f.billNo,
      reservationIds: [r.id],
      lines: f.lines.filter((l) => l.lineState !== 'rejected'),
      payments: st.payments.filter((p) => p.folioId === f.id).map(paymentView),
      totals: {
        roomVnd: tt.roomVnd,
        otherVnd: tt.otherVnd,
        // 0.3.6 add. 2: OTA prepaid bills show only what is settled at the desk.
        totalVnd: r.paymentModel === 'ota_prepaid' ? tt.totalVnd - tt.paidViaOtaVnd : tt.totalVnd,
        paidVnd: r.paymentModel === 'ota_prepaid' ? tt.paidVnd - tt.paidViaOtaVnd : tt.paidVnd,
        paidViaOtaVnd: tt.paidViaOtaVnd,
        // ARC 16.20 (BUG-R2-102): money handed back – `paidVnd` does not take it off.
        refundedVnd: tt.refundedVnd,
        depositHeldVnd: r.depositPaidVnd,
        balanceDueVnd: tt.balanceDueVnd,
        creditVnd: tt.creditVnd,
        unhandledCreditVnd: tt.unhandledCreditVnd,
        otaExcessVnd: tt.otaExcessVnd,
      },
      pendingApprovals: tt.pendingApprovals,
      invoiceRequest: f.invoiceRequest,
      version: f.version,
    };
    if (roles.includes('collaborator') && !has(roles, FD_PLUS))
      return {
        id: f.id,
        status: f.status,
        lines: [],
        payments: [],
        totals: { roomVnd: tt.roomVnd, depositHeldVnd: r.depositPaidVnd },
        version: f.version,
      };
    return out;
  }
  const regOf = (r: MockReservation) => st.registrations.get(r.registrationId!)!;
  const isForeign = (r: MockReservation) => r.nationality !== undefined && r.nationality !== 'VNM';

  // BR-411 tiers on the first night (OTA → room list price, BR-415).
  function earlySurcharge(r: MockReservation, time: string) {
    const base =
      r.paymentModel !== 'direct'
        ? (roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000)
        : (r.nightlyRates?.[0]?.amountVnd ?? 800_000);
    if (time >= '14:00')
      return { tierPct: 0, baseNightVnd: base, amountVnd: 0, addsPreviousNight: false };
    // Like the server: before the rollover the check-in adds the night before (B9a) – a room night at
    // `priorNight.defaultRateVnd`, not a surcharge (`amountVnd` 0 – BUG-R2-194).
    if (time < '06:00')
      return {
        tierPct: 100,
        baseNightVnd: base,
        amountVnd: 0,
        addsPreviousNight: true,
        ruleRef: 'BR-417',
      };
    const pct = time < '10:00' ? 50 : 30;
    return {
      tierPct: pct,
      baseNightVnd: base,
      amountVnd: round1000((base * pct) / 100),
      addsPreviousNight: false,
      ruleRef: 'BR-411',
    };
  }
  function conditions(r: MockReservation) {
    const room = roomOf(r);
    const status = room ? (st.roomStatus[room.roomNo] ?? 'VC') : 'VC';
    const reg = regOf(r);
    const tt = totals(r);
    return [
      { code: 'not_unassigned', met: r.conflictState !== 'open' },
      { code: 'capacity_within_max', met: !r.capacityConflict },
      {
        code: 'room_ready',
        met: status === 'VI' || status === 'VC',
        detail: status,
        overridableBy: status === 'OOO' ? [] : LEAD_PLUS,
      },
      {
        code: 'balance_paid',
        met: r.paymentModel === 'ota_prepaid' || tt.balanceDueVnd === 0,
        detail: String(tt.balanceDueVnd),
      },
      { code: 'main_guest_document', met: reg.documents.some((d) => d.isMain) },
      { code: 'document_check_block', met: !reg.blocksDoorCode, overridableBy: LEAD_PLUS },
    ];
  }

  // BR-412 tiers on the last night; grace to 12:30 only without a same-day arrival.
  function arrivalSameDay(r: MockReservation) {
    return rsv().state.reservations.find(
      (x) =>
        x.id !== r.id &&
        x.roomId === r.roomId &&
        x.status === 'confirmed' &&
        x.arrivalDate === r.departureDate,
    );
  }
  /** E03-07: typed times vs the server clock (tolerance `manual_time_tolerance_minutes`, mock 15). */
  const nowHHmm = () =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date());
  const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  function timeCheck(time: string | undefined, note: unknown, field: string, noteField: string) {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
    const now = nowHHmm();
    if (now < '06:00') return null; // post-midnight: business-day axis, not checked by the mock
    const diff = minutes(time) - minutes(now);
    if (diff > 15) return validation([{ field, code: 'TIME_AFTER_ACTION' }]);
    if (diff < -15 && String(note ?? '').trim().length < 3)
      return validation([{ field: noteField, code: 'TIME_NOTE_REQUIRED' }]);
    return null;
  }

  /**
   * 0.3.6 add. 2 (B18/B16 window): business day = departure − 1 while the calendar already shows the
   * departure date, before `business_day_rollover` (mock 06:00) – an early-morning check-out is valid
   * with no surcharge. After the departure day's last tier (incl. after its midnight) → extra night.
   */
  const postMidnightWindow = (r: MockReservation) =>
    today() === r.departureDate && nowHHmm() < '06:00';
  function lateSurcharge(r: MockReservation, time: string) {
    if (postMidnightWindow(r) && time < '06:00') return { tierPct: 0, surchargeVnd: 0, base: 0 };
    const base =
      r.paymentModel !== 'direct'
        ? (roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000)
        : (r.nightlyRates?.at(-1)?.amountVnd ?? 800_000);
    const arrival = arrivalSameDay(r);
    if (time < '06:00' || time > '18:00')
      return { tierPct: 100, surchargeVnd: base, treatAsExtension: true, base };
    if (time <= '12:00' || (!arrival && time <= '12:30'))
      return { tierPct: 0, surchargeVnd: 0, base };
    const pct = time <= '15:00' ? 30 : 50;
    return { tierPct: pct, surchargeVnd: round1000((base * pct) / 100), base };
  }

  /** ARC-BE-S3-06: one live late charge per stay (checkout.service / stay.service `replaceLateCharge`). */
  const liveLate = (r: MockReservation) =>
    folioOf(r).lines.filter((l) => l.category === 'late_checkout' && l.lineState === 'posted');
  /**
   * `requestFoc` (and `requestFocForSurcharge` of B15): validation, S4-23 (6) headroom on the line (422 + max),
   * BR-436 FD/FDL self-waiver of a minibar line after re-auth (≤ 100.000 a time, ≤ 500.000 a month) → applied
   * at once; otherwise a pending request + a "chờ duyệt" FOC line.
   */
  function focRequest(
    r: MockReservation,
    line: MockLine,
    body: Body,
    g: { user: MockUser; roles: Role[] },
    field = '',
  ): MockApproval | Response {
    const f = folioOf(r);
    const errors: Array<{ field: string; code: string }> = [];
    const amount = Number(body.amountVnd);
    if (!(amount > 0)) errors.push({ field: `${field}amountVnd`, code: 'AMOUNT_NOT_POSITIVE' });
    if (body.reasonCode === 'other' && String(body.note ?? '').trim().length < 3)
      errors.push({ field: `${field}note`, code: 'REASON_REQUIRED' });
    // 0.3.6 add. 4 (BR-307): no FOC / special discount on the room nights of an OTA-prepaid booking.
    if (line.category === 'room' && r.paymentModel === 'ota_prepaid')
      errors.push({ field: `${field}kind`, code: 'FOC_NOT_ALLOWED_OTA_PREPAID' });
    if (errors.length) return validation(errors);
    const reversed = new Set(f.lines.map((l) => l.reversalOfId).filter(Boolean));
    const used = f.lines
      .filter(
        (l) =>
          l.relatedLineId === line.id &&
          ['foc', 'discount'].includes(l.category) &&
          (l.lineState === 'posted' || l.lineState === 'pending_approval') &&
          !l.reversalOfId &&
          !reversed.has(l.id),
      )
      .reduce((a, l) => a + Math.abs(l.amountVnd), 0);
    const max = Math.max(0, line.amountVnd - used);
    if (amount > max)
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: `${field}amountVnd`, code: 'VALUE_OUT_OF_RANGE' }],
        max,
      });
    let self = false;
    if (body.authMethod !== undefined || body.secret !== undefined) {
      if (body.secret !== MOCK_PASSWORD)
        return problem(401, 'REAUTH_FAILED', {
          errors: [{ field: 'secret', code: 'REAUTH_FAILED' }],
        });
      const fd = has(g.roles, ['front_desk', 'front_desk_lead']);
      const month = nowIso().slice(0, 7);
      const spent = st.approvals
        .filter(
          (a) =>
            a.selfApplied &&
            a.requestedByUserId === g.user.id &&
            (a.decidedAt ?? '').slice(0, 7) === month,
        )
        .reduce((a, x) => a + x.amountVnd, 0);
      self =
        fd &&
        String(body.kind ?? 'foc') === 'foc' &&
        line.category === 'minibar' &&
        amount <= 100_000 &&
        spent + amount <= 500_000;
    }
    const a: MockApproval = {
      id: uid(89_000 + next()),
      type: String(body.kind ?? 'foc'),
      status: self ? 'approved' : 'pending',
      reservationCode: r.code,
      folioId: f.id,
      folioLineId: line.id,
      amountVnd: amount,
      reasonCode: String(body.reasonCode),
      reasonNote: body.note as string | undefined,
      requestedBy: g.user.displayName,
      requestedByUserId: g.user.id,
      requestedAt: nowIso(),
      ...(self
        ? {
            selfApplied: true,
            approverName: g.user.displayName,
            approverUserId: g.user.id,
            decidedAt: nowIso(),
          }
        : {}),
    };
    st.approvals.push(a);
    addLine(
      r,
      {
        category: String(body.kind ?? 'foc') === 'special_discount' ? 'discount' : 'foc',
        amountVnd: -amount,
        description: `foc ${line.id}`,
        labelParams: { reason: String(body.reasonCode) },
        lineState: self ? 'posted' : 'pending_approval',
        relatedLineId: line.id,
        approvalRequestId: a.id,
      },
      g.user.displayName,
    );
    return a;
  }

  /**
   * `CheckoutSummary.amountDueAtCheckoutVnd` (S4-47, ARC 0.3.7 bổ sung 4): what B18 leaves due at `time` – the
   * late charge re-priced, or after the last tier one more night at `rate` (default: list price) with the BR-107
   * step of the longer stay (mock: 10 % from 7 nights), credit taken off, clamped once.
   */
  function dueAtCheckout(r: MockReservation, time: string, rate?: number, lateFee = false) {
    const s = lateSurcharge(r, time);
    const tt = totals(r);
    const live = liveLate(r).reduce((a, l) => a + l.amountVnd, 0);
    const lateNew = s.treatAsExtension ? 0 : s.surchargeVnd;
    const calendar = rate ?? roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
    const pct = (r.nights ?? 0) + 1 >= 7 ? 10 : 0;
    // BUG-R2-139 / BR-416-06: a night that cannot be sold is never added; with `lateFee` the late fee of one
    // night (`lateFeeAsNightVnd`, no BR-107 step) is.
    const fee = lateFeeAsNight(r, time);
    const night =
      s.treatAsExtension && fee === undefined
        ? Math.round((calendar * (100 - pct)) / 100 / 1000) * 1000
        : 0;
    return Math.max(
      0,
      tt.balanceDueVnd - tt.creditVnd + (lateNew - live) + night + (lateFee ? (fee ?? 0) : 0),
    );
  }
  /** `CheckoutSummary.lateFeeAsNightVnd`: after the last tier while the night of departure is sold. */
  function lateFeeAsNight(r: MockReservation, time: string) {
    if (st.legacyNoLateFeeAsNight) return undefined;
    return lateSurcharge(r, time).treatAsExtension && arrivalSameDay(r)
      ? (roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000)
      : undefined;
  }
  /** `Payment.amountDueNowVnd` (DOM (f)): the cap of the QR's purpose re-priced now with the context it was made with. */
  function qrDueNow(p: MockPayment) {
    if (p.method !== 'vietqr' || p.status !== 'pending' || !p.qrPurpose) return undefined;
    const r = rsv().state.reservations.find((x) => x.folioId === p.folioId);
    if (!r) return undefined;
    const c = p.qrContext ?? {};
    if (p.qrPurpose === 'deposit')
      return Math.max(0, (r.depositRequiredVnd ?? 0) - r.depositPaidVnd);
    if (p.qrPurpose === 'check_in')
      return dueAtCheckin(r, c.checkinTime ?? '14:00', !!c.addPriorNight && !priorTaken(r));
    if (p.qrPurpose === 'check_out')
      return dueAtCheckout(
        r,
        c.checkoutTime ?? r.agreedCheckoutTime ?? '12:00',
        c.extraNightRateVnd,
        !!c.lateFeeAsNight,
      );
    return totals(r).balanceDueVnd;
  }

  /** A room's name for what the guest reads (BR-012) – `undefined` when the room has none yet. */
  const nameOfRoom = (roomNo: string | null | undefined) =>
    ctx.db().rooms.find((x) => x.roomNo === roomNo)?.name || undefined;

  // ---------- minibar M-1 (0.3.7 add. 4): one cabinet per (stay, room) ----------
  // K11-03: the cabinet of the room the stay is in today (segments split by B14), never `segments[0]`.
  const currentCabinet = (r: MockReservation) => {
    const seg = currentSegment(r.segments, today());
    return {
      roomId: seg?.roomId ?? r.roomId ?? '',
      roomNo: seg?.roomNo ?? roomOf(r)?.roomNo ?? '',
    };
  };
  const cabKey = (r: MockReservation, roomId: string) => `${r.id}:${roomId}`;
  const periodOf = (r: MockReservation, roomId: string) =>
    st.minibarPeriods.get(cabKey(r, roomId)) ?? 0;
  /**
   * `MinibarStandard.periodId`: `null` while the cabinet has had no refill (period 0); otherwise an id of THAT
   * cabinet's fill (another cabinet's period never matches – ARC 16.19 (ac)).
   */
  const periodIdOf = (roomId: string, period: number) =>
    period > 0
      ? uid(
          95_000 + period * 1_000 + ([...roomId].reduce((a, c) => a + c.charCodeAt(0), 0) % 1_000),
        )
      : null;
  /**
   * `CheckoutSummary.minibarUncheckedRooms`: earlier rooms, then the room assigned now, with no `checkout` count after
   * their last mark (refill or the stay entering the room again – BUG-R2-144; extension after the count – DOM (b)).
   */
  function uncheckedCabinets(r: MockReservation) {
    // ARC 16.14 `reason`: stay_continued > new_fill > never_counted.
    const reason = (roomId: string) =>
      st.minibarRecount.has(cabKey(r, roomId))
        ? 'stay_continued'
        : st.minibarNewFill.has(cabKey(r, roomId))
          ? 'new_fill'
          : periodOf(r, roomId) > 0
            ? 'stay_continued'
            : st.minibarNotToday.has(cabKey(r, roomId))
              ? 'not_today'
              : 'never_counted';
    const out = (st.minibarOldRooms.get(r.id) ?? [])
      .filter((c) => !c.lines || st.minibarRecount.has(cabKey(r, c.roomId)))
      .map((c) => ({ roomId: c.roomId, roomNo: c.roomNo, reason: reason(c.roomId) }));
    const here = currentCabinet(r);
    if (
      !st.minibarChecks.has(r.id) ||
      st.minibarRecount.has(cabKey(r, here.roomId)) ||
      st.minibarNotToday.has(cabKey(r, here.roomId))
    )
      out.push({ ...here, reason: reason(here.roomId) });
    return out;
  }
  /** R1: the cabinet a `roomId` names – the room assigned now (absent / same) or an earlier room of the stay. */
  function cabinetOf(r: MockReservation, roomId?: string) {
    const here = currentCabinet(r);
    const at = (c: { roomId: string; roomNo: string; lines?: MinibarCount }, current: boolean) => ({
      ...c,
      current,
      period: periodOf(r, c.roomId),
      // Counted since the last mark → `latestCheck`; otherwise the last count of the period only informs.
      counted:
        !!c.lines &&
        !st.minibarRecount.has(cabKey(r, c.roomId)) &&
        !st.minibarNotToday.has(cabKey(r, c.roomId)),
    });
    if (!roomId || roomId === here.roomId)
      return at({ ...here, lines: st.minibarChecks.get(r.id) }, true);
    const old = (st.minibarOldRooms.get(r.id) ?? []).find((c) => c.roomId === roomId);
    return old ? at(old, false) : undefined;
  }
  /**
   * BUG-R2-144: the stay enters a room again (B14 back to an earlier room). Counted before and refilled since
   * (mock: the refill task is taken as done) → a new refill period, nothing counted in it yet.
   */
  function enterCabinet(r: MockReservation, roomId: string, roomNo: string) {
    const olds = st.minibarOldRooms.get(r.id) ?? [];
    const back = olds.find((c) => c.roomId === roomId);
    if (back)
      st.minibarOldRooms.set(
        r.id,
        olds.filter((c) => c !== back),
      );
    st.minibarChecks.delete(r.id);
    st.minibarRecount.delete(cabKey(r, roomId));
    if (back?.lines) st.minibarPeriods.set(cabKey(r, roomId), periodOf(r, roomId) + 1);
    return { roomId, roomNo };
  }
  /** R6: the live minibar line of an item in a cabinet (`chargeCode` = item), and whether it was ever charged. */
  function minibarLive(r: MockReservation, cabinetRoomId: string, itemId: string) {
    const f = folioOf(r);
    const here = currentCabinet(r).roomId;
    const reversed = new Set(f.lines.map((l) => l.reversalOfId).filter(Boolean));
    const all = f.lines.filter(
      (l) =>
        l.category === 'minibar' &&
        l.chargeCode === itemId &&
        !l.reversalOfId &&
        (l.cabinetRoomId ?? here) === cabinetRoomId &&
        // R1/R6/R7 (BUG-R2-144): keep / reverse only within the current refill period.
        (l.minibarPeriod ?? 0) === periodOf(r, cabinetRoomId),
    );
    const live = all.find((l) => l.lineState === 'posted' && !reversed.has(l.id));
    return { live, ever: all.length > 0 };
  }

  function replaceLate(r: MockReservation, amountVnd: number, label: string, by: string) {
    // the server posts a reversal pair; the mock hides the old line (same totals, same live amount)
    for (const l of liveLate(r)) l.lineState = 'rejected';
    if (amountVnd > 0) addLine(r, { category: 'late_checkout', amountVnd, description: label }, by);
    else {
      folioOf(r).version += 1;
      syncReservation(r);
    }
  }

  function addLine(
    r: MockReservation,
    line: Partial<MockLine> & { category: string; amountVnd: number; description: string },
    by: string,
  ) {
    const l: MockLine = {
      id: uid(87_000 + next()),
      quantity: 1,
      unitPriceVnd: line.amountVnd,
      lineState: 'posted',
      postedAt: nowIso(),
      postedBy: by,
      serviceDate: today(),
      ...line,
    };
    Object.assign(l, labelFor(l, currentSegment(r.segments, l.serviceDate ?? today())?.roomNo));
    folioOf(r).lines.push(l);
    folioOf(r).version += 1;
    syncReservation(r);
    return l;
  }
  function recordPay(
    r: MockReservation,
    body: Body,
    g: { user: MockUser; roles: Role[] },
  ): MockPayment {
    const method = String(body.method);
    const staffRole = g.roles.find((x) => SALES.includes(x));
    const p: MockPayment = {
      id: uid(88_000 + next()),
      code: `PT-0${st.seq}`,
      folioId: r.folioId,
      reservationCode: r.code,
      type: (body.type as MockPayment['type']) ?? 'charge',
      method,
      amountVnd: Number(body.amountVnd),
      status: 'succeeded',
      reconciliation:
        staffRole || method === 'vietqr' || method === 'bank_transfer' ? 'pending' : 'not_required',
      receivedAt: (body.receivedAt as string) ?? nowIso(),
      recordedBy: g.user.displayName,
      recordedByUserId: g.user.id,
      recordedByRole: staffRole ?? g.roles[0],
      note: body.note as string | undefined,
      attachmentId: body.attachmentId as string | undefined,
      version: 1,
    };
    st.payments.push(p);
    syncReservation(r);
    audit(g, 'payment.recorded', r.code, {
      amountVnd: p.amountVnd,
      method,
      recordedByRole: p.recordedByRole,
      reconciliation: p.reconciliation,
    });
    return p;
  }
  function paymentErrors(body: Body) {
    const errors: Array<{ field: string; code: string }> = [];
    if (!(Number(body.amountVnd) > 0))
      errors.push({ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' });
    if (
      !['vietqr', 'bank_transfer', 'cash', 'card_pos', 'ota_collect'].includes(String(body.method))
    )
      errors.push({ field: 'method', code: 'NOT_IN_LIST' });
    if (body.type === 'refund') errors.push({ field: 'type', code: 'NOT_IN_LIST' });
    if (body.method === 'card_pos' && !String(body.posAuthCode ?? '').trim())
      errors.push({ field: 'posAuthCode', code: 'REQUIRED' });
    if (typeof body.note === 'string' && luhn(body.note.replace(/\D/g, '')))
      errors.push({ field: 'note', code: 'CARD_NUMBER_DETECTED' });
    return errors;
  }

  // Shared guard: role → reservation in scope → If-Match on the reservation version.
  function withRes(
    request: StrictRequest<DefaultBodyType>,
    params: Record<string, unknown>,
    roles: Role[],
    opts: { ifMatch?: boolean } = {},
  ): { g: { user: MockUser; roles: Role[] }; r: MockReservation } | Response {
    const pre = guard(request, roles);
    if (isResponse(pre)) return pre;
    const r = rsv().find(params, pre);
    if (!r) return problem(404, 'NOT_FOUND');
    if (!opts.ifMatch) return { g: pre, r };
    const g = guard(request, roles, { ifMatch: r.version });
    if (isResponse(g)) return g;
    return { g, r };
  }
  const resView = (r: MockReservation, g: { user: MockUser; roles: Role[] }) =>
    rsv().view(r, g.user, g.roles);
  const bump = (r: MockReservation) => {
    r.version += 1;
  };

  // 0.3.6 fallback (24 h wait for every unlinked slot when a person leaves) is gone from `removePartyMember`
  // in 0.3.7 (S4-39): the desk names the slot. It stays server-side only for reductions without a choice.
  /** Same rule as BE `isUnclaimed` (registration.repo.ts): unlinked guest-link "Khách n ≥ 2" with a deadline. */
  const isUnclaimed = (d: MockDoc) =>
    !d.partyMemberId && (d.personIndex ?? 0) >= 2 && !!d.fieldsPurgeAfter;

  function regView(reg: MockRegistration) {
    const r = rsv().state.reservations.find((x) => x.id === reg.reservationId)!;
    const deadlineAt = r.registrationDeadlineAt ?? undefined;
    return {
      id: reg.id,
      reservationId: r.id,
      reservationCode: r.code,
      roomNo: currentSegment(r.segments, today())?.roomNo ?? undefined,
      guestDisplayName: r.guestName,
      arrivalDate: r.arrivalDate,
      kind: isForeign(r) ? 'foreigner_temp_residence' : 'vn_citizen_stay',
      status: reg.status,
      requiredCount: r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0),
      // BUG-R2-205 (ARC 16.29): people in the party beyond the booking's guests (e.g. added from an ID that matched
      // nobody) – absent when not over.
      partyOverCount: (() => {
        const over =
          (st.party.get(r.id) ?? []).length -
          (r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0));
        return over > 0 ? over : undefined;
      })(),
      // BUG-R2-083: an unclaimed document never counts (BE countsForDeclaration).
      // Like the server (BUG-R2-089): IDs whose details are entered – photos only do not count.
      submittedCount: reg.documents.filter((d) => !isUnclaimed(d) && !!d.fullNameOnDoc).length,
      deadlineAt,
      deadlineLabel: ['sent', 'confirmed', 'updated', 'void'].includes(reg.status)
        ? 'done'
        : reg.status === 'needs_update'
          ? 'needs_update'
          : r.status !== 'in_house'
            ? 'at_checkin'
            : deadlineAt && Date.parse(deadlineAt) < Date.now()
              ? 'overdue'
              : 'before_deadline_today',
      isOverdue: deadlineAt ? Date.parse(deadlineAt) < Date.now() : false,
      portalReference: reg.portalReference,
      blocksDoorCode: reg.blocksDoorCode,
      ...(st.consentNotice ? { consentNotice: st.consentNotice } : {}),
      // BR-610: images kept `imageRetentionDays` after check-out when someone agreed.
      ...(st.consentNotice && reg.documents.some((d) => d.imageConsent === 'granted')
        ? {
            imageRetentionUntil: `${addDays(r.departureDate, st.consentNotice.imageRetentionDays)}T12:00:00+07:00`,
          }
        : {}),
      documents: reg.documents.map((d) => ({
        id: d.id,
        partyMemberId: d.partyMemberId,
        docType: d.docType,
        isMain: d.isMain,
        fullNameOnDoc: d.fullNameOnDoc,
        nationalityCode: d.nationalityCode,
        docNumberLast4: d.docNumber.slice(-4),
        imageIds: d.imageIds,
        // BE: an unclaimed document's images go at its own deadline.
        ...(isUnclaimed(d) && d.imageIds.length ? { imagePurgeAt: d.fieldsPurgeAfter } : {}),
        imageConsent: d.imageConsent,
        captureMethod: d.captureMethod,
        // 0.3.7 (S4-48): the slot "Khách n" and the deadline of a document waiting to be linked.
        ...(d.personIndex ? { personIndex: d.personIndex } : {}),
        unclaimedUntil: isUnclaimed(d) ? d.fieldsPurgeAfter : null,
        checks: d.checks,
      })),
      allowedActions: [],
      version: reg.version,
    };
  }
  function computeChecks(r: MockReservation, d: MockDoc, all: MockDoc[]) {
    const checks: MockDoc['checks'] = [];
    const want = tokens(r.guestName);
    const got = new Set(tokens(d.fullNameOnDoc));
    if (d.isMain)
      checks.push({
        code: 'name_match',
        result: want.length < 2 ? 'unverified' : want.every((w) => got.has(w)) ? 'pass' : 'fail',
      });
    const foreign = d.docType === 'passport' && d.nationalityCode !== 'VNM';
    if (foreign) {
      const exp = d.passportExpiryDate;
      checks.push({
        code: 'passport_valid_at_arrival',
        result: !exp ? 'unverified' : exp >= r.arrivalDate ? 'pass' : 'fail',
        blocking: true,
      });
      checks.push({
        code: 'passport_valid_through_departure',
        result: !exp ? 'unverified' : exp > r.departureDate ? 'pass' : 'fail',
      });
      checks.push({
        code: 'entry_record_present',
        result: d.noEntryRecord ? 'fail' : d.entryDate ? 'pass' : 'unverified',
        blocking: true,
      });
      const visa = d.visaValidUntil;
      checks.push({
        code: 'visa_valid_through_departure',
        result: !visa ? 'unverified' : visa >= r.departureDate ? 'pass' : 'fail',
      });
    }
    const required = r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0);
    if (d.isMain)
      checks.push({
        code: 'party_count',
        result: all.filter((z) => !isUnclaimed(z)).length >= required ? 'pass' : 'fail',
      });
    return checks;
  }
  function recomputeReg(r: MockReservation, reg: MockRegistration) {
    for (const d of reg.documents) {
      const old = new Map(d.checks.map((c) => [c.code, c]));
      d.checks = computeChecks(r, d, reg.documents).map((c) => {
        const o = old.get(c.code);
        return o?.manualResult || o?.handledNote
          ? {
              ...c,
              manualResult: o.manualResult,
              handledNote: o.handledNote,
              handledByName: o.handledByName,
            }
          : c;
      });
    }
    reg.blocksDoorCode = reg.documents.some((d) =>
      d.checks.some((c) => c.blocking && (c.manualResult ?? c.result) === 'fail'),
    );
    const required = r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0);
    // BUG-R2-083: an unclaimed guest-link document does not count for "enough people".
    const counted = reg.documents.filter((d) => !isUnclaimed(d)).length;
    if (['none', 'pre', 'partial', 'review'].includes(reg.status))
      reg.status = counted === 0 ? 'none' : counted >= required ? 'review' : 'partial';
    r.registrationStatus = reg.status as MockReservation['registrationStatus'];
  }
  function needStepUp(g: { user: MockUser }) {
    return (st.stepUpUntil.get(g.user.id) ?? 0) < Date.now();
  }
  function c3(
    request: StrictRequest<DefaultBodyType>,
    params: Record<string, unknown>,
    roles: Role[] = FD_PLUS,
  ) {
    const g = guard(request, roles);
    if (isResponse(g)) return g;
    if (!trusted(g)) return problem(403, 'DEVICE_NOT_TRUSTED');
    const reg = st.registrations.get(String(params.registrationId));
    if (!reg) return problem(404, 'NOT_FOUND');
    const r = rsv().state.reservations.find((x) => x.id === reg.reservationId)!;
    return { g, reg, r };
  }

  // ---------- S4-08 / S4-28: folio side of cancel, no-show and deposit confirmation ----------
  const SERVICE = [
    'early_checkin',
    'late_checkout',
    'minibar',
    'fnb',
    'laundry',
    'cleaning',
    'service_fee',
    'utilities',
  ];
  function liveServiceLines(r: MockReservation) {
    const lines = folioOf(r).lines.filter((l) => l.lineState === 'posted');
    const reversed = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
    return lines.filter(
      (l) => SERVICE.includes(l.category) && !l.reversalOfId && !reversed.has(l.id),
    );
  }
  rsv().setFolioPort({
    serviceLines: (r) =>
      liveServiceLines(r).map((l): MockServiceLine => ({
        lineId: l.id,
        category: l.category,
        labelKey: l.labelKey,
        labelParams: l.labelParams,
        serviceDate: l.serviceDate,
        // net of the approved FOC / discount that goes with the line
        amountVnd:
          l.amountVnd +
          folioOf(r)
            .lines.filter((x) => x.relatedLineId === l.id && x.lineState === 'posted')
            .reduce((a, x) => a + x.amountVnd, 0),
        performed: !!l.serviceDate && l.serviceDate < today(),
      })),
    reverseServiceLines: (r, keep, by) => {
      for (const l of liveServiceLines(r)) {
        if (keep.includes(l.id)) continue;
        addLine(
          r,
          {
            category: l.category,
            amountVnd: -l.amountVnd,
            description: `reversal ${l.id}`,
            labelKey: l.labelKey,
            labelParams: l.labelParams,
            serviceDate: l.serviceDate,
            reversalOfId: l.id,
          },
          by,
        );
      }
    },
    depositPayment: (r, id) =>
      st.payments.some(
        (p) =>
          p.id === id &&
          p.folioId === r.folioId &&
          p.type === 'deposit' &&
          p.status === 'succeeded',
      ),
  });

  const handlers = [
    // ---------- check-in (S06, B9 / B17) ----------
    http.get(`${prop}/reservations/:reservationId/check-in-preview`, ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS);
      if (isResponse(x)) return x;
      const { r } = x;
      const time = new URL(request.url).searchParams.get('checkinTime') ?? '14:00';
      const room = roomOf(r);
      const warnings: Array<{ code: string; detail?: string }> = [];
      if ((r.extraGuestCount ?? 0) > 0) warnings.push({ code: 'extra_guest_kit_not_ready' });
      const foreign = isForeign(r);
      return json({
        checkinTime: time,
        standardCheckinTime: '14:00',
        roomStatus: room ? st.roomStatus[room.roomNo] : 'VC',
        conditions: conditions(r),
        warnings,
        earlyCheckinSurcharge: earlySurcharge(r, time),
        // 0.3.7 (BUG-R2-038): what B9 needs collected at this check-in time.
        balanceDueVnd: totals(r).balanceDueVnd,
        // BUG-R2-127: the B9a night is due only when the night before is free in this room.
        amountDueAtCheckinVnd:
          r.paymentModel === 'ota_prepaid'
            ? 0
            : dueAtCheckin(r, time, time < '06:00' && !priorTaken(r)),
        priorNight:
          time < '06:00'
            ? {
                date: addDays(r.arrivalDate, -1),
                available: !priorTaken(r),
                defaultRateVnd: earlySurcharge(r, time).baseNightVnd,
              }
            : undefined,
        registrationDeadlinePreview: foreign
          ? new Date(Date.now() + 12 * 3_600_000).toISOString()
          : `${today()}T23:00:00+07:00`,
      });
    }),
    http.post(
      `${prop}/reservations/:reservationId/actions/check-in`,
      async ({ request, params }) => {
        const x = withRes(request, params, FD_PLUS, { ifMatch: true });
        if (isResponse(x)) return x;
        const { g, r } = x;
        if (!trusted(g)) return problem(403, 'DEVICE_NOT_TRUSTED');
        const { key, replay } = rsv().idem(request, `checkin:${r.id}`);
        if (replay) return replay;
        if (r.status !== 'confirmed')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        if (r.conflictState === 'open') return problem(409, 'RESERVATION_UNASSIGNED');
        const body = (await request.json()) as Body;
        const lead = has(g.roles, LEAD_PLUS);
        if (body.documentBlockOverride && !lead) return problem(403, 'FORBIDDEN_ACTION');
        // BUG-R2-127 (BE-A): no B9a night when the night before is taken in this room.
        if (body.addPriorNight && priorTaken(r))
          return validation([{ field: 'addPriorNight', code: 'NOT_ALLOWED' }]);
        // 0.3.7 (BUG-R2-038, BR-402 v0.3.6): `balance_paid` is judged AFTER the early surcharge / B9a
        // night and `payment` – minus the FOC asked on the surcharge; short → 409, nothing written.
        const pay = body.payment as Body | undefined;
        // 0.3.7 bổ sung 1 (ARC): FD asking the lead (room not ready, no approved request) → 202 that writes
        // nothing but the ApprovalRequest; money is collected at the B9 call after approval.
        const asksLead =
          !!body.roomNotReadyOverride &&
          !lead &&
          !(body.roomNotReadyOverride as Body).approvalRequestId &&
          !!conditions(r).find((c) => c.code === 'room_ready' && !c.met && c.detail !== 'OOO');
        if (asksLead && pay) return validation([{ field: 'payment', code: 'NOT_ALLOWED' }]);
        // 0.3.7 bổ sung 1 (a): FD calls B9 again with the lead's approval of TODAY for this booking.
        const approvalId = (body.roomNotReadyOverride as Body | undefined)?.approvalRequestId;
        if (approvalId !== undefined && !lead) {
          const a = st.approvals.find((x) => x.id === approvalId);
          if (
            !a ||
            a.type !== 'checkin_room_not_ready' ||
            a.reservationCode !== r.code ||
            a.status !== 'approved' ||
            !a.decidedAt ||
            // Like `checkin.service`: business day of the decision === business day now (BR-010).
            businessDayLocal(undefined, new Date(a.decidedAt)) !== businessDayLocal()
          )
            return validation([
              { field: 'roomNotReadyOverride.approvalRequestId', code: 'NOT_IN_LIST' },
            ]);
        }
        if (pay && pay.type !== 'charge')
          return validation([{ field: 'payment.type', code: 'NOT_IN_LIST' }]);
        const payErrs = pay
          ? paymentErrors(pay).map((e) => ({ ...e, field: `payment.${e.field}` }))
          : [];
        if (payErrs.length) return validation(payErrs);
        const inTime = String(body.checkinTime ?? '14:00');
        const early0 = earlySurcharge(r, inTime);
        // B9a: the night before at the typed rate or the suggested one (ARC 16.18).
        const priorRate =
          body.addPriorNight && early0.addsPreviousNight
            ? Number(body.priorNightRateVnd ?? early0.baseNightVnd)
            : 0;
        const posting = (body.applyEarlySurcharge ? early0.amountVnd : 0) + priorRate;
        const focAsked = body.requestFocForSurcharge ? posting : 0;
        const ttNow = totals(r);
        const dueNow = Math.max(0, ttNow.balanceDueVnd - ttNow.creditVnd + posting - focAsked);
        const paid = pay ? Number(pay.amountVnd) : 0;
        if (pay && paid > dueNow && String(pay.note ?? '').trim().length < 3)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'payment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
            max: dueNow,
          });
        const unmet = conditions(r).filter((c) => {
          if (c.code === 'balance_paid')
            return !asksLead && r.paymentModel !== 'ota_prepaid' && dueNow - paid > 0;
          if (c.met) return false;
          if (c.code === 'room_ready' && body.roomNotReadyOverride && c.detail !== 'OOO')
            return false;
          if (c.code === 'document_check_block' && body.documentBlockOverride && lead) return false;
          return true;
        });
        if (unmet.length)
          return problem(409, 'CHECKIN_CONDITIONS_NOT_MET', {
            unmet: unmet.map((c) => c.code),
            balanceDueVnd: dueNow - paid,
          });
        const errors: Array<{ field: string; code: string }> = [];
        const cards = Number(body.cardsIssued);
        if (!Number.isInteger(cards) || cards < 0 || cards > 2)
          errors.push({ field: 'cardsIssued', code: 'VALUE_OUT_OF_RANGE' });
        if (body.houseRulesSent !== true)
          errors.push({ field: 'houseRulesSent', code: 'REQUIRED' });
        const ro = body.roomNotReadyOverride as Body | undefined;
        if (ro && !(ro.approvalRequestId && !lead) && String(ro.reason ?? '').trim().length < 3)
          errors.push({ field: 'roomNotReadyOverride.reason', code: 'REASON_REQUIRED' });
        if (errors.length) return validation(errors);
        const timeErr = timeCheck(
          body.checkinTime as string | undefined,
          body.checkinTimeNote,
          'checkinTime',
          'checkinTimeNote',
        );
        if (timeErr) return timeErr;
        const time = String(body.checkinTime ?? '14:00');
        const sur = earlySurcharge(r, time);
        if (sur.amountVnd > 0 && body.checkinTime && body.applyEarlySurcharge !== true)
          return validation([
            { field: 'applyEarlySurcharge', code: 'SURCHARGE_DECISION_REQUIRED' },
          ]);
        if (
          body.applyEarlySurcharge &&
          sur.amountVnd > 0 &&
          Number(body.expectedSurchargeVnd) !== sur.amountVnd
        )
          return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: sur.amountVnd });
        // B9a: the amount shown is the night's (BUG-R2-194) – required, and it must be the one written.
        if (priorRate > 0) {
          if (body.expectedSurchargeVnd === undefined)
            return validation([{ field: 'expectedSurchargeVnd', code: 'REQUIRED' }]);
          if (Number(body.expectedSurchargeVnd) !== priorRate)
            return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: priorRate });
        }
        if (
          ro &&
          !lead &&
          !ro.approvalRequestId &&
          conditions(r).find((c) => c.code === 'room_ready' && !c.met)
        ) {
          const a: MockApproval = {
            id: uid(89_000 + next()),
            type: 'checkin_room_not_ready',
            status: 'pending',
            reservationCode: r.code,
            amountVnd: 0,
            reasonCode: 'other',
            reasonNote: String(ro.reason),
            requestedBy: g.user.displayName,
            requestedByUserId: g.user.id,
            requestedAt: nowIso(),
          };
          st.approvals.push(a);
          return rsv().remember(key, 202, a);
        }
        r.status = 'in_house';
        r.actualCheckinAt = nowIso();
        r.cardsIssued = cards;
        r.houseRulesSentAt = nowIso();
        r.doorAccessHandedOverAt = body.doorAccessHandedOver ? nowIso() : null;
        r.registrationDeadlineAt = isForeign(r)
          ? new Date(Date.now() + 12 * 3_600_000).toISOString()
          : `${today()}T23:00:00+07:00`;
        const room = roomOf(r);
        if (room) st.roomStatus[room.roomNo] = ro ? 'OD' : 'OC';
        if (priorRate > 0)
          addLine(
            r,
            {
              category: 'room',
              amountVnd: priorRate,
              description: 'room_night',
              chargeCode: 'prior_night',
              serviceDate: addDays(r.arrivalDate, -1),
            },
            g.user.displayName,
          );
        if (body.applyEarlySurcharge && sur.amountVnd > 0)
          addLine(
            r,
            {
              category: 'early_checkin',
              amountVnd: sur.amountVnd,
              description: `early_checkin ${time} ${sur.tierPct}%`,
            },
            g.user.displayName,
          );
        // 0.3.7: the payment taken at check-in is written in the same transaction (after the lines).
        if (pay) recordPay(r, { ...pay, type: 'charge' }, g);
        bump(r);
        return rsv().remember(key, 200, resView(r, g));
      },
    ),
    // A22a: online check-in link – a new token each time (old links stop), returned once.
    http.post(`${prop}/reservations/:reservationId/guest-link`, ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS);
      if (isResponse(x)) return x;
      const { r } = x;
      const { key, replay } = rsv().idem(request, `guest-link:${r.id}`);
      if (replay) return replay;
      if (!['hold', 'confirmed', 'in_house'].includes(r.status))
        return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
      const token = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(24)), (b) =>
        b.toString(36).padStart(2, '0'),
      ).join('');
      const prev = st.guestLinks.get(r.id);
      st.guestLinks.set(r.id, { issuedAt: nowIso(), count: (prev?.count ?? 0) + 1 });
      return rsv().remember(key, 201, {
        url: `https://guest.ottimo.local/g/${token}`,
        expiresAt: `${addDays(r.departureDate, 1)}T12:00:00+07:00`,
      });
    }),
    http.delete(`${prop}/reservations/:reservationId/guest-link`, ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS);
      if (isResponse(x)) return x;
      const { r } = x;
      const cur = st.guestLinks.get(r.id);
      if (cur) cur.revokedAt = nowIso();
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(
      `${prop}/reservations/:reservationId/actions/undo-check-in`,
      async ({ request, params }) => {
        const x = withRes(request, params, OWN_MGR, { ifMatch: true });
        if (isResponse(x)) return x;
        const { g, r } = x;
        const { key, replay } = rsv().idem(request, `undo:${r.id}`);
        if (replay) return replay;
        if (r.status !== 'in_house')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        const body = (await request.json()) as Body;
        if (String(body.reason ?? '').trim().length < 3)
          return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
        r.status = 'confirmed';
        r.actualCheckinAt = undefined;
        const room = roomOf(r);
        if (room) st.roomStatus[room.roomNo] = 'VI';
        bump(r);
        return rsv().remember(key, 200, resView(r, g));
      },
    ),
    // B-28 door handed over (and other patch fields) – reservations.ts handles adults etc.
    http.patch(`${prop}/reservations/:reservationId`, async ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS, { ifMatch: true });
      if (isResponse(x)) return x;
      const { g, r } = x;
      const body = (await request.json()) as Body;
      // 0.3.6 add. 4 (DOM OTA rule, BR-110/307): guest count of an OTA booking before check-in needs
      // its source; `ota_modification` (+ extranet ref) moves `otaGuestCount`, `guest_direct` keeps it
      // and charges the people above max(room standard, otaGuestCount) at the desk.
      const isOta = r.paymentModel !== 'direct';
      const countKeys = ['adults', 'children6to11', 'childrenUnder6'] as const;
      const countChanged = countKeys.some(
        (k) => typeof body[k] === 'number' && body[k] !== (r[k] ?? 0),
      );
      if (body.partyChangeSource !== undefined && !isOta)
        return validation([{ field: 'partyChangeSource', code: 'NOT_ALLOWED' }]);
      const preArrival = ['hold', 'confirmed'].includes(r.status);
      if (isOta && preArrival && countChanged) {
        if (!['ota_modification', 'guest_direct'].includes(String(body.partyChangeSource ?? '')))
          return validation([{ field: 'partyChangeSource', code: 'REQUIRED' }]);
        if (
          body.partyChangeSource === 'ota_modification' &&
          !/^[A-Za-z0-9\-/._]{3,64}$/.test(String(body.otaModificationRef ?? ''))
        )
          return validation([{ field: 'otaModificationRef', code: 'REQUIRED' }]);
      }
      if (body.doorAccessHandedOver === true) {
        if (r.status !== 'in_house')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        if (r.doorAccessHandedOverAt)
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        r.doorAccessHandedOverAt = nowIso();
      }
      for (const k of countKeys) if (typeof body[k] === 'number') r[k] = body[k] as number;
      if (typeof body.etaTime === 'string') r.etaTime = body.etaTime;
      if (isOta && preArrival && countChanged) {
        if (body.partyChangeSource === 'ota_modification')
          r.otaGuestCount = r.adults + (r.children6to11 ?? 0);
        // Re-post the extra-person nights (desk-collected, not covered by the OTA).
        const f = folioOf(r);
        f.lines = f.lines.filter((l) => l.category !== 'extra_person');
        const base = Math.max(roomOf(r)?.baseOccupancy ?? 2, r.otaGuestCount ?? 0);
        const extra = Math.max(0, r.adults + (r.children6to11 ?? 0) - base);
        const extraAdults = Math.min(extra, Math.max(0, r.adults - base));
        const perNight = extraAdults * 150_000 + (extra - extraAdults) * 100_000;
        if (perNight > 0)
          for (let d = r.arrivalDate; d < r.departureDate; d = addDays(d, 1))
            addLine(
              r,
              {
                category: 'extra_person',
                amountVnd: perNight,
                description: `extra_person x${extra}`,
                serviceDate: d,
                postedAt: nowIso(),
              },
              g.user.displayName,
            );
        syncReservation(r);
      }
      const room = roomOf(r);
      if (room) {
        const occ = r.adults + (r.children6to11 ?? 0);
        r.capacityConflict = occ > (room.maxOccupancy ?? 99);
        r.extraGuestCount = Math.max(0, occ - (room.baseOccupancy ?? 2));
      }
      bump(r);
      return json(resView(r, g));
    }),

    // ---------- stay (S08: B13, B15, B14, party, reminders) ----------
    http.get(`${prop}/reservations/:reservationId/extension-options`, ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS);
      if (isResponse(x)) return x;
      const { r } = x;
      const rate =
        r.paymentModel === 'direct'
          ? (r.nightlyRates?.at(-1)?.amountVnd ?? 800_000)
          : (roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000);
      const nights = [];
      let max = 0;
      let blocked = false;
      for (let i = 0; i < 7; i++) {
        const date = addDays(r.departureDate, i);
        const taken = rsv().state.reservations.some(
          (o) =>
            o.id !== r.id &&
            o.roomId === r.roomId &&
            ['hold', 'confirmed', 'in_house'].includes(o.status) &&
            o.arrivalDate <= date &&
            date < o.departureDate,
        );
        if (taken) blocked = true;
        if (!blocked) max += 1;
        nights.push({
          date,
          available: !blocked,
          defaultRateVnd: rate,
          floorVnd: round1000(rate * 0.7),
          ceilingVnd: round1000(rate * 1.5),
        });
      }
      const ota = r.paymentModel !== 'direct';
      // D-8 / BR-107: direct stays that cross 7 nights get the length-of-stay step on every night.
      // `repricing[].nights` = nights ADDED; `repricedTotalVnd` = room total of the whole booking.
      const roomNow = (r.nightlyRates ?? []).reduce((a, x) => a + x.amountVnd, 0);
      // 0.3.6 add. 3 (BUG-R2-045): OTA → child direct booking, no BR-107 step, channel fee saved per k
      // nights = Σ default rates × the channel commission (mock 15.5 %).
      const repricing = Array.from({ length: max }, (_, i) => {
        const k = i + 1;
        if (ota)
          return {
            nights: k,
            repricedTotalVnd: k * rate,
            deltaVnd: k * rate,
            losDiscountPct: 0,
            channelFeeSavingsVnd: Math.round(k * rate * 0.155),
          };
        const pct = (r.nights ?? 0) + k >= 7 && (r.nights ?? 0) < 7 ? 10 : 0;
        const total = round1000(((roomNow + k * rate) * (100 - pct)) / 100);
        return {
          nights: k,
          repricedTotalVnd: total,
          deltaVnd: total - roomNow,
          losDiscountPct: pct,
        };
      });
      return json({
        maxNights: max,
        exceedsShortStayLimit: false,
        createsChildReservation: ota,
        channelFeeSavingsVnd: ota ? Math.round(rate * 0.155) : undefined,
        currentBookingRateVnd: ota ? null : (r.nightlyRates?.at(-1)?.amountVnd ?? null),
        nights,
        repricing,
      });
    }),
    http.post(`${prop}/reservations/:reservationId/actions/extend`, async ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS, { ifMatch: true });
      if (isResponse(x)) return x;
      const { g, r } = x;
      const { key, replay } = rsv().idem(request, `extend-stay:${r.id}`);
      if (replay) return replay;
      if (r.status !== 'in_house')
        return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
      const body = (await request.json()) as {
        nights: number;
        nightlyRates?: Array<{ date: string; amountVnd: number }>;
      };
      if (!(body.nights >= 1 && body.nights <= 7))
        return validation([{ field: 'nights', code: 'EXTENSION_LIMIT_EXCEEDED' }]);
      const rate = r.nightlyRates?.at(-1)?.amountVnd ?? 800_000;
      for (let i = 0; i < body.nights; i++) {
        const date = addDays(r.departureDate, i);
        const amount = body.nightlyRates?.find((n) => n.date === date)?.amountVnd ?? rate;
        r.nightlyRates = [...(r.nightlyRates ?? []), { date, amountVnd: amount }];
        addLine(
          r,
          {
            category: 'room',
            amountVnd: amount,
            description: 'room_night',
            serviceDate: date,
          },
          g.user.displayName,
        );
      }
      r.departureDate = addDays(r.departureDate, body.nights);
      r.nights = (r.nights ?? 0) + body.nights;
      // The stay goes on in the room of its last segment (after a B14 there are several).
      const lastSeg = [...(r.segments ?? [])]
        .sort((a, b) => a.fromDate.localeCompare(b.fromDate))
        .at(-1);
      if (lastSeg) lastSeg.toDate = r.departureDate;
      // BUG-R2-144 / DOM (b): a cabinet counted for the old departure is counted again before B18.
      if (st.minibarChecks.has(r.id)) st.minibarRecount.add(cabKey(r, currentCabinet(r).roomId));
      bump(r);
      return rsv().remember(key, 200, { reservation: resView(r, g) });
    }),
    http.post(
      `${prop}/reservations/:reservationId/actions/late-checkout`,
      async ({ request, params }) => {
        const body = (await request.clone().json()) as Body;
        const dry = body.dryRun === true;
        const x = withRes(request, params, FD_PLUS, { ifMatch: !dry });
        if (isResponse(x)) return x;
        const { g, r } = x;
        const time = String(body.checkoutTime ?? '');
        if (!/^\d{2}:\d{2}$/.test(time))
          return validation([{ field: 'checkoutTime', code: 'DATE_INVALID' }]);
        const s = lateSurcharge(r, time);
        const arrival = arrivalSameDay(r);
        const result = {
          checkoutTime: time,
          tierPct: s.tierPct,
          surchargeVnd: s.surchargeVnd,
          treatAsExtension: s.treatAsExtension === true,
          arrivalSameDay: arrival
            ? {
                guestDisplayName: arrival.guestName,
                etaTime: arrival.etaTime ?? '14:00',
                alternativeRoomAvailable: false,
              }
            : undefined,
          cleaningNotBefore: time,
        };
        if (dry) return json(result);
        const { key, replay } = rsv().idem(request, `late:${r.id}`);
        if (replay) return replay;
        if (s.treatAsExtension)
          return validation([{ field: 'checkoutTime', code: 'LATE_CHECKOUT_AFTER_LIMIT' }]);
        if (arrival && !has(g.roles, OWN_MGR)) {
          if (body.requestApproval) {
            const a: MockApproval = {
              id: uid(89_000 + next()),
              type: 'late_checkout_conflict',
              status: 'pending',
              reservationCode: r.code,
              amountVnd: s.surchargeVnd,
              reasonCode: 'other',
              requestedBy: g.user.displayName,
              requestedByUserId: g.user.id,
              requestedAt: nowIso(),
            };
            st.approvals.push(a);
            return rsv().remember(key, 202, a);
          }
          return problem(409, 'LATE_CHECKOUT_CONFLICT', {
            roomNo: currentSegment(r.segments, today())?.roomNo,
            guest: arrival.guestName,
            eta: arrival.etaTime ?? '14:00',
          });
        }
        if (body.applySurcharge && Number(body.expectedSurchargeVnd) !== s.surchargeVnd)
          return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: s.surchargeVnd });
        const askFoc = body.requestFocForSurcharge as Body | undefined;
        if (askFoc && !(body.applySurcharge && s.surchargeVnd > 0))
          return validation([{ field: 'requestFocForSurcharge', code: 'NOT_ALLOWED' }]);
        r.agreedCheckoutTime = time;
        replaceLate(
          r,
          body.applySurcharge ? s.surchargeVnd : 0,
          `late_checkout ${time} ${s.tierPct}%`,
          g.user.displayName,
        );
        // S4-25 (US-007 AC1): the surcharge and its FOC request in one call (B15 requestFocForSurcharge).
        if (askFoc) {
          const lateLine = liveLate(r)[0]!;
          const foc = focRequest(
            r,
            lateLine,
            { kind: 'foc', ...askFoc },
            g,
            'requestFocForSurcharge.',
          );
          if (foc instanceof Response) return foc;
        }
        bump(r);
        return rsv().remember(key, 200, { ...result, saved: true, reservation: resView(r, g) });
      },
    ),
    http.post(
      `${prop}/reservations/:reservationId/actions/change-room`,
      async ({ request, params }) => {
        const body = (await request.clone().json()) as Body;
        const dry = body.dryRun === true;
        const x = withRes(request, params, FD_PLUS, { ifMatch: !dry });
        if (isResponse(x)) return x;
        const { g, r } = x;
        if (r.status !== 'in_house')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        // BE-A B14 (17/10): a child booking shares the room – call the primary booking.
        if (r.parentReservationId)
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        // The whole stay moves: the primary + its in-house child bookings (B9a / OTA extension).
        const stay = [
          r,
          ...rsv().state.reservations.filter(
            (o) => o.parentReservationId === r.id && o.status === 'in_house',
          ),
        ];
        const stayEnd = stay.reduce((a, o) => (o.departureDate > a ? o.departureDate : a), '');
        const room = ctx.db().rooms.find((z) => z.id === body.newRoomId);
        if (!room || room.id === r.roomId)
          return validation([{ field: 'newRoomId', code: 'NOT_IN_LIST' }]);
        const from = String(body.effectiveDate ?? today());
        // BUG-R2-211: like the API – the BUSINESS day (`ctx.today`, BR-010).
        if (from !== businessDayLocal())
          return validation([{ field: 'effectiveDate', code: 'DATE_INVALID' }]);
        const occ = r.adults + (r.children6to11 ?? 0);
        if (occ > (room.maxOccupancy ?? 99))
          return problem(422, 'CAPACITY_EXCEEDED', { roomNo: room.roomNo, max: room.maxOccupancy });
        const status = st.roomStatus[room.roomNo] ?? 'VC';
        if (status !== 'VI' && status !== 'VC')
          return problem(409, 'ROOM_NOT_READY', { roomNo: room.roomNo, roomStatus: status });
        // Free up to the EFFECTIVE departure (children included), else the clashing nights + a
        // suggested free room; code/name of the other booking only for FD+ (always here).
        const busy = (roomId: string) =>
          rsv().state.reservations.filter(
            (o) =>
              !stay.includes(o) &&
              o.roomId === roomId &&
              ['hold', 'confirmed', 'in_house'].includes(o.status) &&
              o.arrivalDate < stayEnd &&
              from < o.departureDate,
          );
        const clashes = busy(room.id);
        if (clashes.length) {
          const nightsOf = (o: MockReservation) => {
            const out: string[] = [];
            for (let d = from; d < stayEnd; d = addDays(d, 1))
              if (d >= o.arrivalDate && d < o.departureDate) out.push(d);
            return out;
          };
          const free = ctx
            .db()
            .rooms.find(
              (z) =>
                z.id !== r.roomId &&
                z.id !== room.id &&
                (z.maxOccupancy ?? 99) >= occ &&
                ['VI', 'VC'].includes(st.roomStatus[z.roomNo] ?? 'VC') &&
                busy(z.id).length === 0,
            );
          return problem(409, 'ROOM_UNAVAILABLE', {
            roomNo: room.roomNo,
            conflicts: clashes.map((c) => ({
              roomNo: room.roomNo,
              nights: nightsOf(c),
              kind: c.status === 'hold' ? 'hold' : 'reservation',
              reservationCode: c.code,
              guestDisplayName: c.guestName,
              stayFrom: c.arrivalDate,
              stayTo: c.departureDate,
            })),
            suggestions: free
              ? [{ roomId: free.id, roomNo: free.roomNo, roomGroupCode: undefined, upgrade: false }]
              : [],
          });
        }
        const keep = body.cause === 'property_fault';
        const newRate = room.currentListPrice?.nightlyListPriceVnd ?? 800_000;
        // `nights` = every night from today of the whole stay (primary + children).
        const nights = stay
          .flatMap((o) => o.nightlyRates ?? [])
          .filter((n) => n.date >= from)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((n) => ({
            date: n.date,
            oldRateVnd: n.amountVnd,
            newRateVnd: keep ? n.amountVnd : newRate,
          }));
        const delta = nights.reduce((a, n) => a + n.newRateVnd - n.oldRateVnd, 0);
        if (dry)
          return json({
            nights,
            folioDeltaVnd: delta,
            extraGuestKitTransfer: (r.extraGuestCount ?? 0) > 0,
            newRoomStatus: status,
          });
        if (String(body.reason ?? '').trim().length < 3)
          return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
        const { key, replay } = rsv().idem(request, `change-room:${r.id}`);
        if (replay) return replay;
        const old = roomOf(r);
        if (old) st.roomStatus[old.roomNo] = body.oldRoomVacated === 'OD' ? 'OD' : 'VD';
        st.roomStatus[room.roomNo] = 'OC';
        // Minibar M-1 (BR-703-01, BUG-R2-144): the room left becomes an earlier cabinet of the stay (counted as at
        // check-out); entering a room again starts a new refill period there when it was counted before.
        const left = currentCabinet(r);
        const kept = (st.minibarOldRooms.get(r.id) ?? []).filter((c) => c.roomId !== left.roomId);
        kept.push({ ...left, lines: st.minibarChecks.get(r.id) });
        st.minibarOldRooms.set(r.id, kept);
        enterCabinet(r, room.id, room.roomNo);
        for (const o of stay) {
          o.roomId = room.id;
          // Like the server (K11-03): the nights before the move stay in the room left – one segment more, the
          // room of today is the new one (B14 back to an earlier room adds a third segment, no merge).
          const start = from > o.arrivalDate ? from : o.arrivalDate;
          const kept = (o.segments ?? [])
            .filter((g) => g.fromDate < start)
            .map((g) => ({ ...g, toDate: g.toDate > start ? start : g.toDate }));
          o.segments = [
            ...kept,
            { roomId: room.id, roomNo: room.roomNo, fromDate: start, toDate: o.departureDate },
          ];
          if (o !== r) bump(o);
        }
        r.doorAccessHandedOverAt = null;
        if (delta)
          addLine(
            r,
            {
              category: 'room_change_difference',
              amountVnd: delta,
              description: `room_change ${old?.roomNo}->${room.roomNo}`,
            },
            g.user.displayName,
          );
        bump(r);
        return rsv().remember(key, 200, resView(r, g));
      },
    ),
    http.get(
      `${prop}/reservations/:reservationId/checkout-confirmations`,
      ({ request, params }) => {
        const x = withRes(request, params, FD_PLUS);
        if (isResponse(x)) return x;
        const data = st.reminders.get(x.r.id) ?? [];
        return json({ state: data.length ? 'replied' : 'reminded_waiting', data });
      },
    ),
    http.post(
      `${prop}/reservations/:reservationId/checkout-confirmations`,
      async ({ request, params }) => {
        const x = withRes(request, params, FD_PLUS);
        if (isResponse(x)) return x;
        const body = (await request.json()) as Body;
        if (['time', 'late'].includes(String(body.replyType)) && !body.confirmedTime)
          return validation([{ field: 'confirmedTime', code: 'REQUIRED' }]);
        const entry = { ...body, recordedAt: nowIso(), recordedByName: x.g.user.displayName };
        st.reminders.set(x.r.id, [...(st.reminders.get(x.r.id) ?? []), entry]);
        return json(entry, 201);
      },
    ),
    http.get(`${prop}/reservations/:reservationId/party`, ({ request, params }) => {
      const x = withRes(request, params, [...FD_PLUS, ...SALES]);
      if (isResponse(x)) return x;
      const { r, g } = x;
      const members = st.party.get(r.id) ?? [];
      const required = r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0);
      const base = {
        requiredCount: required,
        presentCount: members.length,
        missingCount: Math.max(0, required - members.length),
        version: r.version,
      };
      if (!has(g.roles, FD_PLUS)) return json(base);
      return json({
        ...base,
        members: members.map((m) => ({
          id: m.id,
          role: m.role,
          guest:
            m.role === 'child' ? undefined : { id: m.id, code: '', displayName: m.displayName },
          childDisplayName: m.role === 'child' ? m.displayName : undefined,
          priceAgeBand: m.priceAgeBand,
          effectiveFrom: m.effectiveFrom,
        })),
      });
    }),
    http.post(`${prop}/reservations/:reservationId/party`, async ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS);
      if (isResponse(x)) return x;
      const { r } = x;
      const body = (await request.json()) as Body;
      const name = String(body.childName ?? body.guestName ?? '').trim();
      if (body.role === 'child' && name.length < 2)
        return validation([{ field: 'childName', code: 'REQUIRED' }]);
      const members = st.party.get(r.id) ?? [];
      if (body.guestId && members.some((m) => m.id === body.guestId))
        return problem(409, 'PARTY_DUPLICATE');
      if (!body.dryRun && !request.headers.get('idempotency-key'))
        return problem(428, 'PRECONDITION_REQUIRED');
      // UXR #7 (party.service.ts, BR-110 per night): in house, a person above the counted guests of the
      // booking and above the room's standard occupancy (OTA: above the guests the OTA priced) carries a
      // surcharge from tonight × remaining nights; the desk must confirm it (no silent skip – DOM S3-12).
      const band = body.role === 'child' ? 'child_6_11' : 'adult';
      let occupancyChange: Body | undefined;
      let surcharge = 0;
      let remainingNights = 0;
      let newExtra = r.extraGuestCount ?? 0;
      if (r.status === 'in_house') {
        if (!body.effectiveFrom) return validation([{ field: 'effectiveFrom', code: 'REQUIRED' }]);
        const declared = r.adults + (r.children6to11 ?? 0);
        const present = members.filter((m) => m.priceAgeBand !== 'child_under_6').length + 1;
        const next = Math.max(declared, present);
        if (next !== declared) {
          const base = Math.max(roomOf(r)?.baseOccupancy ?? 2, r.otaGuestCount ?? 0);
          const delta = Math.max(0, next - base) - Math.max(0, declared - base);
          remainingNights = Math.max(
            0,
            Math.round(
              (Date.parse(`${r.departureDate}T00:00:00Z`) -
                Date.parse(`${String(body.effectiveFrom)}T00:00:00Z`)) /
                86_400_000,
            ),
          );
          surcharge = delta * (band === 'adult' ? 150_000 : 100_000) * remainingNights;
          newExtra = Math.max(0, next - (roomOf(r)?.baseOccupancy ?? 2));
          occupancyChange = {
            adults: band === 'adult' ? r.adults + 1 : r.adults,
            children6to11: band === 'adult' ? (r.children6to11 ?? 0) : (r.children6to11 ?? 0) + 1,
            childrenUnder6: r.childrenUnder6 ?? 0,
            extraCount: newExtra,
            surchargeVnd: surcharge,
            nights: remainingNights,
            surchargeApplied: false,
            extraGuestKitTaskCreated: false,
          };
        }
        if (!body.dryRun && surcharge > 0) {
          if (body.applyExtraPersonSurcharge !== true)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'applyExtraPersonSurcharge', code: 'SURCHARGE_DECISION_REQUIRED' }],
              surchargeVnd: surcharge,
            });
          if (body.expectedSurchargeVnd === undefined)
            return validation([{ field: 'expectedSurchargeVnd', code: 'REQUIRED' }]);
          if (body.expectedSurchargeVnd !== surcharge)
            return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: surcharge });
        }
      }
      if (!body.dryRun) {
        if (occupancyChange) {
          r.adults = occupancyChange.adults as number;
          r.children6to11 = occupancyChange.children6to11 as number;
          r.extraGuestCount = newExtra;
          if (surcharge > 0) {
            const perNight = surcharge / remainingNights;
            for (let i = 0; i < remainingNights; i++)
              addLine(
                r,
                {
                  category: 'extra_person',
                  amountVnd: perNight,
                  description: 'extra_person x1',
                  serviceDate: addDays(String(body.effectiveFrom), i),
                  postedAt: nowIso(),
                },
                x.g.user.displayName,
              );
            occupancyChange.surchargeApplied = true;
          }
          occupancyChange.extraGuestKitTaskCreated = true;
        }
        members.push({
          id: uid(83_500 + next()),
          role: body.role === 'child' ? 'child' : 'companion',
          displayName: name || 'Khách đi cùng',
          priceAgeBand: body.role === 'child' ? 'child_6_11' : 'adult',
          effectiveFrom: body.effectiveFrom as string | undefined,
        });
        st.party.set(r.id, members);
        r.partyMissingCount = Math.max(
          0,
          r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0) - members.length,
        );
        bump(r);
      }
      const required = r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0);
      return json(
        {
          requiredCount: required,
          presentCount: members.length,
          missingCount: Math.max(0, required - members.length),
          version: r.version,
          members: members.map((m) => ({
            id: m.id,
            role: m.role,
            guest: { id: m.id, code: '', displayName: m.displayName },
            priceAgeBand: m.priceAgeBand,
          })),
          ...(occupancyChange ? { occupancyChange } : {}),
        },
        body.dryRun ? 200 : 201,
      );
    }),
    http.delete(`${prop}/reservations/:reservationId/party/:memberId`, ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS, { ifMatch: true });
      if (isResponse(x)) return x;
      const { r } = x;
      const members = st.party.get(r.id) ?? [];
      const m = members.find((z) => z.id === params.memberId);
      if (!m) return problem(404, 'NOT_FOUND');
      if (m.role === 'booker')
        return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
      // 0.3.7 (S4-39, SEC-BE-53 main option): the desk says which "Khách n" slot was this person's.
      const reg = r.registrationId ? st.registrations.get(r.registrationId) : undefined;
      const linked = !!reg?.documents.some((d) => d.partyMemberId === m.id);
      const slots = (reg?.documents ?? [])
        .filter((d) => d.captureMethod === 'guest_upload' && !d.partyMemberId && !d.isMain)
        .filter((d) => (d.personIndex ?? 0) >= 2);
      const raw = new URL(request.url).searchParams.get('guestUploadPersonIndex');
      if (raw === null && !linked && slots.length)
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'guestUploadPersonIndex', code: 'REQUIRED' }],
          personIndexes: slots.map((d) => d.personIndex).sort(),
        });
      const slot = raw === null || raw === 'none' ? null : Number(raw);
      if (slot !== null && (linked || !slots.length))
        return validation([{ field: 'guestUploadPersonIndex', code: 'NOT_ALLOWED' }]);
      if (slot !== null && !slots.some((d) => d.personIndex === slot))
        return validation([{ field: 'guestUploadPersonIndex', code: 'NOT_IN_LIST' }]);
      st.party.set(
        r.id,
        members.filter((z) => z !== m),
      );
      if (reg) {
        // Linked documents go; the chosen slot goes; later unlinked slots move up; no 24 h wait.
        reg.documents = reg.documents.filter(
          (d) =>
            d.partyMemberId !== m.id &&
            !(slot !== null && slots.includes(d) && d.personIndex === slot),
        );
        if (slot !== null)
          for (const d of slots)
            if (d.personIndex! > slot && reg.documents.includes(d)) d.personIndex! -= 1;
        recomputeReg(r, reg);
        reg.version += 1;
      }
      bump(r);
      return new HttpResponse(null, { status: 204 });
    }),

    // ---------- check-out (S07: B18) ----------
    http.get(`${prop}/reservations/:reservationId/minibar-standard`, ({ request, params }) => {
      const x = withRes(request, params, [...FD_PLUS, 'housekeeping']);
      if (isResponse(x)) return x;
      const cab = cabinetOf(x.r, new URL(request.url).searchParams.get('roomId') ?? undefined);
      if (!cab) return validation([{ field: 'roomId', code: 'NOT_IN_LIST' }]);
      const latest = cab.lines;
      // DOM (e): the four folio fields are FD+ only (HK sees no money of the folio).
      const fd = has(x.g.roles, FD_PLUS);
      return json({
        roomId: cab.roomId,
        roomNo: cab.roomNo,
        periodId: periodIdOf(cab.roomId, cab.period),
        items: MINIBAR.map((m) => {
          const last = latest?.find((l) => l.itemId === m.itemId);
          const lastUsed = last ? m.standardQty - last.remainingQty : null;
          const { live, ever } = minibarLive(x.r, cab.roomId, m.itemId);
          const folioUsed = live ? live.quantity : ever ? 0 : null;
          return {
            ...m,
            lastCheckUsedQty: lastUsed,
            ...(fd
              ? {
                  folioLineId: live?.id ?? null,
                  folioUsedQty: folioUsed,
                  folioAmountVnd: live?.amountVnd,
                  adjustedAfterLastCheck:
                    lastUsed !== null && folioUsed !== null && folioUsed !== lastUsed,
                }
              : {}),
          };
        }),
        // BUG-R2-144: `latestCheck` only for a count after the cabinet's last mark (same rule as B18).
        latestCheck:
          cab.counted && latest
            ? {
                id: uid(90_001),
                mode: 'checkout',
                lines: latest.map((l) => ({
                  ...l,
                  standardQty: MINIBAR.find((m) => m.itemId === l.itemId)!.standardQty,
                  usedQty: MINIBAR.find((m) => m.itemId === l.itemId)!.standardQty - l.remainingQty,
                })),
              }
            : null,
      });
    }),
    http.post(`${prop}/reservations/:reservationId/minibar-checks`, async ({ request, params }) => {
      const x = withRes(request, params, [...FD_PLUS, 'housekeeping']);
      if (isResponse(x)) return x;
      const { r, g } = x;
      const body = (await request.json()) as {
        mode: string;
        roomId?: string;
        periodId?: string | null;
        lines: Array<{ itemId: string; remainingQty: number }>;
      };
      // ARC 16.19 (K11-03): a count with `periodId` names its cabinet – absent `roomId` → 422 REQUIRED.
      if (body.periodId !== undefined && !body.roomId)
        return validation([{ field: 'roomId', code: 'REQUIRED' }]);
      // R1: the room assigned now (absent) or an earlier room of this stay; any other room → NOT_IN_LIST.
      const cab = cabinetOf(r, body.roomId);
      if (!cab) return validation([{ field: 'roomId', code: 'NOT_IN_LIST' }]);
      // ARC 16.16 (ab): counted on a period that has since changed (refill) → nothing written.
      if (body.periodId !== undefined && body.periodId !== periodIdOf(cab.roomId, cab.period))
        return problem(409, 'MINIBAR_PERIOD_CHANGED');
      const errors: Array<{ field: string; code: string }> = [];
      if (MINIBAR.some((m) => !body.lines.some((l) => l.itemId === m.itemId)))
        errors.push({ field: 'lines', code: 'MINIBAR_ITEMS_INCOMPLETE' });
      body.lines.forEach((l, i) => {
        const std = MINIBAR.find((m) => m.itemId === l.itemId);
        if (!std) errors.push({ field: `lines[${i}].itemId`, code: 'NOT_IN_LIST' });
        else if (
          l.remainingQty < 0 ||
          l.remainingQty > std.standardQty ||
          !Number.isInteger(l.remainingQty)
        )
          errors.push({ field: `lines[${i}].remainingQty`, code: 'MINIBAR_QTY_OVER_STANDARD' });
      });
      if (errors.length) return problem(422, 'VALIDATION_FAILED', { errors, max: 2 });
      const f = folioOf(r);
      let total = 0;
      const lines = body.lines.map((l) => {
        const std = MINIBAR.find((m) => m.itemId === l.itemId)!;
        const used = std.standardQty - l.remainingQty;
        const prev = cab.lines?.find((p) => p.itemId === l.itemId);
        const lastUsed = prev ? std.standardQty - prev.remainingQty : null;
        const { live, ever } = minibarLive(r, cab.roomId, l.itemId);
        const folioUsed = live ? live.quantity : ever ? 0 : null;
        // R6 (DOM (e)): the last count confirmed, or the number on the folio (corrected / voided with a
        // reason) → that live line stays as it is, with its FOC and label.
        if (used === lastUsed || (folioUsed !== null && used === folioUsed)) {
          const kept = live?.amountVnd ?? 0;
          total += kept;
          return {
            itemId: l.itemId,
            itemName: std.itemName,
            standardQty: std.standardQty,
            remainingQty: l.remainingQty,
            usedQty: used,
            isFree: std.isFree,
            amountVnd: kept,
          };
        }
        // R7: a new count – the live line is reversed (BR-008; the mock drops it) and one new line is written.
        if (live) {
          f.lines = f.lines.filter((z) => z !== live);
          f.version += 1;
          syncReservation(r);
        }
        const amount = std.isFree ? 0 : used * std.unitPriceVnd;
        total += amount;
        if (amount > 0)
          addLine(
            r,
            {
              category: 'minibar',
              amountVnd: amount,
              quantity: used,
              unitPriceVnd: std.unitPriceVnd,
              description: `minibar ${std.itemName} x${used}`,
              labelParams: { item: std.itemName },
              chargeCode: l.itemId,
              cabinetRoomId: cab.roomId,
              minibarPeriod: cab.period,
            },
            g.user.displayName,
          );
        return {
          itemId: l.itemId,
          itemName: std.itemName,
          standardQty: std.standardQty,
          remainingQty: l.remainingQty,
          usedQty: used,
          isFree: std.isFree,
          amountVnd: amount,
        };
      });
      st.minibarRecount.delete(cabKey(r, cab.roomId));
      st.minibarNewFill.delete(cabKey(r, cab.roomId));
      st.minibarNotToday.delete(cabKey(r, cab.roomId));
      if (cab.current) st.minibarChecks.set(r.id, body.lines);
      else {
        const old = (st.minibarOldRooms.get(r.id) ?? []).find((c) => c.roomId === cab.roomId);
        if (old) old.lines = body.lines;
      }
      return json(
        { id: uid(90_000 + next()), mode: body.mode, checkedAt: nowIso(), lines, totalVnd: total },
        201,
      );
    }),
    http.get(`${prop}/reservations/:reservationId/checkout-summary`, ({ request, params }) => {
      const x = withRes(request, params, FD_PLUS);
      if (isResponse(x)) return x;
      const { r } = x;
      const time =
        new URL(request.url).searchParams.get('checkoutTime') ?? r.agreedCheckoutTime ?? '12:00';
      const s = lateSurcharge(r, time);
      const tt = totals(r);
      const f = folioOf(r);
      const blockers: string[] = [];
      const unchecked = uncheckedCabinets(r);
      if (unchecked.length) blockers.push('minibar_not_checked');
      if (tt.pendingApprovals) blockers.push('pending_approvals');
      if (tt.balanceDueVnd > 0) blockers.push('balance_due');
      if (tt.unhandledCreditVnd > 0) blockers.push('credit_balance');
      const extraRate = roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
      // Like getCheckoutSummary: the surcharge AT THIS TIME (G-10) and, when a late charge is already on the
      // folio (B15), the recalculation old → new (B18 reverses a lower amount, a higher one needs the decision).
      const live = liveLate(r).reduce((a, l) => a + l.amountVnd, 0);
      const newVnd = s.treatAsExtension ? 0 : s.surchargeVnd;
      return json({
        checkoutTime: time,
        standardCheckoutTime: '12:00',
        // E05-11: after the last BR-412 tier the check-out charges one more night (no late surcharge).
        lateCheckoutSurcharge: {
          tierPct: s.treatAsExtension ? 0 : s.tierPct,
          amountVnd: newVnd,
        },
        extraNightRequired: s.treatAsExtension === true,
        extraNightDefaultRateVnd: s.treatAsExtension ? extraRate : undefined,
        // ARC 16.18 (vòng sửa 5): the Desk range of the extra night (mock: 50 %–200 % of the list price).
        extraNightFloorVnd:
          s.treatAsExtension && !arrivalSameDay(r) ? Math.round(extraRate * 0.5) : undefined,
        extraNightCeilingVnd: s.treatAsExtension && !arrivalSameDay(r) ? extraRate * 2 : undefined,
        extraNightAvailable: s.treatAsExtension ? !arrivalSameDay(r) : undefined,
        lateFeeAsNightVnd: lateFeeAsNight(r, time),
        minibarUncheckedRooms: unchecked.length ? unchecked : undefined,
        postMidnightWindow: postMidnightWindow(r),
        unhandledCreditVnd: tt.unhandledCreditVnd,
        lateSurchargeRecalc: liveLate(r).length
          ? { oldVnd: live, newVnd, newTierPct: s.treatAsExtension ? 0 : s.tierPct }
          : undefined,
        lines: f.lines.filter((l) => l.lineState !== 'rejected'),
        totalVnd: tt.totalVnd,
        paidVnd: tt.paidVnd,
        balanceDueVnd: tt.balanceDueVnd,
        creditVnd: tt.creditVnd,
        amountDueAtCheckoutVnd: dueAtCheckout(r, time, undefined, true),
        pendingApprovals: tt.pendingApprovals,
        blockers,
      });
    }),
    http.post(
      `${prop}/reservations/:reservationId/actions/check-out`,
      async ({ request, params }) => {
        const x = withRes(request, params, FD_PLUS, { ifMatch: true });
        if (isResponse(x)) return x;
        const { g, r } = x;
        const { key, replay } = rsv().idem(request, `checkout:${r.id}`);
        if (replay) return replay;
        if (r.status !== 'in_house')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        const body = (await request.json()) as Body;
        const time = String(body.checkoutTime ?? '12:00');
        const timeErr = timeCheck(time, body.checkoutTimeNote, 'checkoutTime', 'checkoutTimeNote');
        if (timeErr) return timeErr;
        const s = lateSurcharge(r, time);
        const extraNight = body.extraNight as { rateVnd?: number } | undefined;
        // BR-416-06 (0.3.7 add. 4): the night of departure is sold → a late fee of one night, confirmed at the
        // desk by an OWN/MGR (password), instead of the extra night.
        const lf = body.lateFeeInsteadOfNight as Body | undefined;
        const feeVnd = lateFeeAsNight(r, time);
        if (s.treatAsExtension && !extraNight && !lf)
          return validation([
            {
              field: feeVnd !== undefined ? 'lateFeeInsteadOfNight' : 'extraNight',
              code: 'LATE_CHECKOUT_AFTER_LIMIT',
            },
          ]);
        if (lf && feeVnd === undefined)
          return validation([{ field: 'lateFeeInsteadOfNight', code: 'NOT_ALLOWED' }]);
        let lfApprover: MockUser | undefined;
        const lfFoc = lf?.requestFoc as Body | undefined;
        if (lf && feeVnd !== undefined) {
          // SEC BE-64: every read-only business check first, the password last.
          const selfOk = has(g.roles, OWN_MGR);
          const errs: Array<{ field: string; code: string }> = [];
          if (String(lf.reason ?? '').trim().length < 3)
            errs.push({ field: 'lateFeeInsteadOfNight.reason', code: 'REASON_REQUIRED' });
          if (!selfOk && !String(lf.approverUsername ?? '').trim())
            errs.push({ field: 'lateFeeInsteadOfNight.approverUsername', code: 'REQUIRED' });
          if (lf.authMethod !== 'password')
            errs.push({ field: 'lateFeeInsteadOfNight.authMethod', code: 'NOT_IN_LIST' });
          if (lfFoc) {
            if (lfFoc.authMethod !== undefined || lfFoc.secret !== undefined)
              errs.push({
                field: 'lateFeeInsteadOfNight.requestFoc.authMethod',
                code: 'NOT_ALLOWED',
              });
            if (!(Number(lfFoc.amountVnd) > 0))
              errs.push({
                field: 'lateFeeInsteadOfNight.requestFoc.amountVnd',
                code: 'AMOUNT_NOT_POSITIVE',
              });
            if (lfFoc.reasonCode === 'other' && String(lfFoc.note ?? '').trim().length < 3)
              errs.push({
                field: 'lateFeeInsteadOfNight.requestFoc.note',
                code: 'REASON_REQUIRED',
              });
          }
          if (errs.length) return validation(errs);
          if (lfFoc && Number(lfFoc.amountVnd) > feeVnd)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [
                { field: 'lateFeeInsteadOfNight.requestFoc.amountVnd', code: 'VALUE_OUT_OF_RANGE' },
              ],
              max: feeVnd,
            });
          if (Number(lf.amountVnd) !== feeVnd)
            return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: feeVnd });
          // SR-RL-02 (mock): 5 failures of the caller → locked 15 minutes.
          if ((st.lateFeeFails.get(g.user.id) ?? 0) >= 5)
            return problem(429, 'RATE_LIMITED', {}, { 'retry-after': '900' });
          const name = String(lf.approverUsername ?? '').trim();
          lfApprover =
            !name || name === g.user.username
              ? selfOk
                ? g.user
                : undefined
              : ctx
                  .db()
                  .users.find(
                    (u) =>
                      u.username === name &&
                      u.status === 'active' &&
                      u.roles.some((x) => OWN_MGR.includes(x.role)),
                  );
          // Unknown name, not OWN/MGR, wrong password: the same 401 (SR-AUTH-04).
          if (!lfApprover || lf.secret !== MOCK_PASSWORD) {
            st.lateFeeFails.set(g.user.id, (st.lateFeeFails.get(g.user.id) ?? 0) + 1);
            return problem(401, 'REAUTH_FAILED', {
              errors: [{ field: 'lateFeeInsteadOfNight.secret', code: 'REAUTH_FAILED' }],
            });
          }
          // BR-433 (mock): a manager applies a waiver up to 1.000.000 đ; the owner has no limit.
          if (
            lfFoc &&
            !lfApprover.roles.some((x) => x.role === 'owner') &&
            Number(lfFoc.amountVnd) > LATE_FEE_FOC_LIMIT_MGR
          )
            return problem(403, 'APPROVAL_LIMIT_EXCEEDED', { limitVnd: LATE_FEE_FOC_LIMIT_MGR });
        }
        // ARC 16.18: `rateVnd` absent = the default night (source `default`); sent = typed (`manual`), in range.
        const listRate = roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
        const extraNightVnd =
          extraNight?.rateVnd === undefined ? listRate : Number(extraNight.rateVnd);
        if (s.treatAsExtension && extraNight && extraNight.rateVnd !== undefined) {
          if (!(extraNightVnd > 0))
            return validation([{ field: 'extraNight.rateVnd', code: 'RATE_OUT_OF_RANGE' }]);
          const min = Math.round(listRate * 0.5);
          const max = listRate * 2;
          if (extraNightVnd < min || extraNightVnd > max)
            return problem(422, 'VALIDATION_FAILED', {
              errors: [{ field: 'extraNight.rateVnd', code: 'RATE_OUT_OF_RANGE' }],
              min,
              max,
            });
        }
        // The room is sold tonight (a same-day arrival) → no extra night (0.3.6 add. 2).
        if (s.treatAsExtension && extraNight && arrivalSameDay(r))
          return problem(409, 'ROOM_UNAVAILABLE', { roomNo: roomOf(r)?.roomNo });
        if (uncheckedCabinets(r).length) return problem(409, 'MINIBAR_NOT_CHECKED');
        // checkout.service B18: the surcharge at the actual time vs the live late charge (B15).
        const lateOld = liveLate(r).reduce((a, l) => a + l.amountVnd, 0);
        const lateNew = s.treatAsExtension ? 0 : s.surchargeVnd;
        const lateRaise = lateNew > lateOld;
        if (
          body.applyLateSurcharge &&
          lateRaise &&
          Number(body.expectedSurchargeVnd ?? lateNew) !== lateNew
        )
          return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: lateNew });
        const tt0 = totals(r);
        if (tt0.pendingApprovals)
          return problem(409, 'PENDING_APPROVALS', { pendingApprovals: tt0.pendingApprovals });
        const debt = body.debt as Body | undefined;
        if (debt && !has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
        // S4-26 (FE-B): debt {dueDate, reason ≥ 3} – required fields of the contract (BR-525).
        if (debt) {
          const errs: Array<{ field: string; code: string }> = [];
          if (!/^\d{4}-\d{2}-\d{2}$/.test(String(debt.dueDate ?? '')))
            errs.push({ field: 'debt.dueDate', code: 'REQUIRED' });
          if (String(debt.reason ?? '').trim().length < 3)
            errs.push({ field: 'debt.reason', code: 'REASON_REQUIRED' });
          if (errs.length) return validation(errs);
        }
        const op = body.overpaymentHandling as Body | undefined;
        if (op?.mode === 'retain_with_guest_consent' && !has(g.roles, OWN_MGR))
          return problem(403, 'FORBIDDEN_ACTION');
        if (lateRaise && body.applyLateSurcharge !== true)
          return validation([{ field: 'applyLateSurcharge', code: 'SURCHARGE_DECISION_REQUIRED' }]);
        // One transaction (ARC 0.3.6 add. 2): extra night + surcharge + payment + B18, rolled back on failure.
        const f0 = folioOf(r);
        const snap = {
          lines: f0.lines.length,
          states: f0.lines.map((l) => l.lineState),
          version: f0.version,
          pays: st.payments.length,
          approvals: st.approvals.length,
        };
        const fail = (resp: Response) => {
          f0.lines.length = snap.lines;
          f0.lines.forEach((l, i) => (l.lineState = snap.states[i]!));
          f0.version = snap.version;
          st.payments.length = snap.pays;
          st.approvals.length = snap.approvals;
          syncReservation(r);
          return resp;
        };
        if (s.treatAsExtension && extraNight)
          addLine(
            r,
            {
              category: 'room',
              amountVnd: extraNightVnd,
              description: 'extra_night',
              chargeCode: 'extra_night',
              serviceDate: r.departureDate,
            },
            g.user.displayName,
          );
        if (lateNew < lateOld || (lateRaise && body.applyLateSurcharge))
          replaceLate(r, lateNew, `late_checkout ${time} ${s.tierPct}%`, g.user.displayName);
        if (lf && feeVnd !== undefined && lfApprover) {
          // `late_checkout` · `late_fee_as_night` (other revenue, not a night sold); the tiered charge goes.
          for (const l of liveLate(r)) l.lineState = 'rejected';
          const feeLine = addLine(
            r,
            {
              category: 'late_checkout',
              amountVnd: feeVnd,
              description: `late_fee_as_night ${time}`,
              chargeCode: 'late_fee_as_night',
            },
            g.user.displayName,
          );
          if (lfFoc) {
            const a: MockApproval = {
              id: uid(89_000 + next()),
              type: String(lfFoc.kind ?? 'foc'),
              status: 'approved',
              reservationCode: r.code,
              folioId: folioOf(r).id,
              folioLineId: feeLine.id,
              amountVnd: Number(lfFoc.amountVnd),
              reasonCode: String(lfFoc.reasonCode),
              reasonNote: lfFoc.note as string | undefined,
              requestedBy: g.user.displayName,
              requestedByUserId: g.user.id,
              requestedAt: nowIso(),
              approverName: lfApprover.displayName,
              approverUserId: lfApprover.id,
              decidedAt: nowIso(),
            };
            st.approvals.push(a);
            addLine(
              r,
              {
                category: String(lfFoc.kind ?? 'foc') === 'special_discount' ? 'discount' : 'foc',
                amountVnd: -Number(lfFoc.amountVnd),
                description: `foc ${feeLine.id}`,
                labelParams: { reason: String(lfFoc.reasonCode) },
                relatedLineId: feeLine.id,
                approvalRequestId: a.id,
              },
              g.user.displayName,
            );
          }
          audit(g, 'reservation.late_fee_instead_of_night', r.code, {
            amountVnd: feeVnd,
            reason: String(lf.reason),
            approverUserId: lfApprover.id,
            confirmChannel: lfApprover.id === g.user.id ? 'self' : 'desk',
          });
        }
        if (body.finalPayment) {
          const errs = paymentErrors(body.finalPayment as Body);
          if (errs.length)
            return fail(validation(errs.map((e) => ({ ...e, field: `finalPayment.${e.field}` }))));
          recordPay(r, body.finalPayment as Body, g);
        }
        const tt = totals(r);
        if (tt.balanceDueVnd > 0 && !debt)
          return fail(problem(409, 'BALANCE_DUE', { balanceDueVnd: tt.balanceDueVnd }));
        if (tt.unhandledCreditVnd > 0) {
          if (!op)
            return fail(
              validation([{ field: 'overpaymentHandling', code: 'OVERPAYMENT_HANDLING_REQUIRED' }]),
            );
          if (String(op.reason ?? '').trim().length < 3)
            return fail(
              validation([{ field: 'overpaymentHandling.reason', code: 'REASON_REQUIRED' }]),
            );
          if (op.mode === 'refund_request')
            st.approvals.push({
              id: uid(89_000 + next()),
              type: 'refund',
              status: 'pending',
              reservationCode: r.code,
              folioId: r.folioId,
              amountVnd: tt.unhandledCreditVnd,
              reasonCode: 'overpayment',
              reasonNote: String(op.reason),
              requestedBy: g.user.displayName,
              requestedByUserId: g.user.id,
              requestedAt: nowIso(),
              refundedVnd: 0,
            });
          else
            addLine(
              r,
              {
                category: 'deposit_forfeit',
                amountVnd: tt.unhandledCreditVnd,
                description: 'retain_with_guest_consent',
                chargeCode: 'overpayment_retained',
              },
              g.user.displayName,
            );
        }
        if (s.treatAsExtension && extraNight)
          audit(g, 'reservation.extra_night_on_checkout', r.code, {
            amountVnd: extraNightVnd,
            source: extraNight.rateVnd === undefined ? 'default' : 'manual',
          });
        if (debt && tt.balanceDueVnd > 0)
          audit(g, 'reservation.debt_on_checkout', r.code, {
            amountVnd: tt.balanceDueVnd,
            dueDate: String(debt.dueDate),
          });
        r.status = 'checked_out';
        r.actualCheckoutAt = nowIso();
        const f = folioOf(r);
        f.status = 'settled';
        f.settledAt = nowIso();
        f.billNo = `F26-000${100 + next()}`;
        const room = roomOf(r);
        if (room) st.roomStatus[room.roomNo] = 'VD';
        bump(r);
        return rsv().remember(key, 200, {
          reservation: resView(r, g),
          billNo: f.billNo,
          createdTaskIds: [uid(91_000 + next())],
        });
      },
    ),

    // ---------- folio, payments, VietQR, bill ----------
    http.get(`${prop}/folios/:folioId`, ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, ...SALES]);
      if (isResponse(g)) return g;
      const r = byFolio(String(params.folioId), g);
      if (!r) return problem(404, 'NOT_FOUND');
      return json(folioView(r, g.roles));
    }),
    http.get(`${prop}/charge-catalog`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      return json({ data: CATALOG });
    }),
    http.post(`${prop}/folios/:folioId/lines`, async ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      if (!f) return problem(404, 'NOT_FOUND');
      const r = rsv().state.reservations.find((x) => x.id === f.reservationId)!;
      if (f.status === 'settled') return problem(409, 'FOLIO_LOCKED');
      const body = (await request.json()) as Body;
      const item = CATALOG.find((c) => c.code === body.chargeCode);
      const errors: Array<{ field: string; code: string }> = [];
      if (body.chargeCode && !item) errors.push({ field: 'chargeCode', code: 'NOT_IN_LIST' });
      const qty = Number(body.quantity);
      if (!(qty > 0)) errors.push({ field: 'quantity', code: 'VALUE_OUT_OF_RANGE' });
      if (
        item &&
        !item.priceEditable &&
        body.unitPriceVnd !== undefined &&
        Number(body.unitPriceVnd) !== item.defaultUnitPriceVnd
      )
        errors.push({ field: 'unitPriceVnd', code: 'PRICE_NOT_EDITABLE' });
      if (
        item?.evidenceRequired &&
        !(Array.isArray(body.evidenceAttachmentIds) && body.evidenceAttachmentIds.length) &&
        String(body.note ?? '').trim().length < 3
      )
        errors.push({ field: 'evidenceAttachmentIds', code: 'EVIDENCE_REQUIRED' });
      if (errors.length) return validation(errors);
      const unit = item?.priceEditable
        ? Number(body.unitPriceVnd ?? item.defaultUnitPriceVnd)
        : (item?.defaultUnitPriceVnd ?? Number(body.unitPriceVnd));
      addLine(
        r,
        {
          category: item?.category ?? String(body.category),
          quantity: qty,
          unitPriceVnd: unit,
          amountVnd: round1000(unit * qty),
          description: `${item?.code ?? body.description} x${qty}`,
          chargeCode: item?.code === 'CARD_LOST' ? 'key_card_fee' : item?.code,
          // fnb / service: free text; damage: catalogue item name (BE `catalogName`).
          labelParams:
            item?.category === 'damage'
              ? { item: item.name }
              : ['fnb', 'service_fee'].includes(item?.category ?? String(body.category))
                ? { text: String(body.note ?? '').trim() || (item?.name ?? '') }
                : undefined,
        },
        g.user.displayName,
      );
      audit(g, 'folio.line_posted', r.code, {
        amountVnd: round1000(unit * qty),
        category: item?.category,
      });
      return json(folioView(r, g.roles), 201);
    }),
    // S4-27 (US-006 AC1, US-038 AC2; BR-008): adjustment = reversal + new line, reason required,
    // If-Match = Folio.version; settled → MGR/OWN only (A32); night lines take a price only (S4-35).
    http.post(`${prop}/folios/:folioId/lines/:lineId/adjustments`, async ({ request, params }) => {
      const pre = guard(request, FD_PLUS);
      if (isResponse(pre)) return pre;
      const r = byFolio(String(params.folioId), pre);
      if (!r) return problem(404, 'NOT_FOUND');
      const f = folioOf(r);
      const g = guard(request, FD_PLUS, { ifMatch: f.version });
      if (isResponse(g)) return g;
      if (f.status === 'settled' && !has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
      const { key, replay } = rsv().idem(request, `adjust:${params.lineId}`);
      if (replay) return replay;
      const body = (await request.json()) as Body;
      if (String(body.reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      const live = f.lines.filter((l) => l.lineState === 'posted');
      const l = live.find((x) => x.id === params.lineId);
      if (!l || l.reversalOfId || live.some((x) => x.reversalOfId === l.id))
        return problem(409, 'INVALID_TRANSITION', { currentState: 'reversed' });
      const night = ['room', 'extra_person'].includes(l.category);
      if (night && (body.newQuantity !== undefined || body.voidLine === true))
        return validation([
          { field: body.voidLine ? 'voidLine' : 'newQuantity', code: 'NOT_ALLOWED' },
        ]);
      const qty = body.newQuantity !== undefined ? Number(body.newQuantity) : l.quantity;
      const unit =
        body.newUnitPriceVnd !== undefined ? Number(body.newUnitPriceVnd) : l.unitPriceVnd;
      // N-7 (FB-R2-SEC-BE-81): a settled folio of a booking that still owes takes no cut – every role.
      const after = body.voidLine === true ? 0 : round1000(unit * qty);
      if (f.status === 'settled' && totals(r).balanceDueVnd > 0 && after < l.amountVnd)
        return problem(409, 'FOLIO_LOCKED', {
          detail: 'open debt – reduce what is owed through a FOC debt_write_off (BR-525)',
        });
      if (night && l.category === 'room') {
        const list = roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
        if (unit < list * 0.5 || unit > list * 2)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'newUnitPriceVnd', code: 'RATE_OUT_OF_RANGE' }],
            min: Math.round(list * 0.5),
            max: list * 2,
          });
      }
      addLine(
        r,
        {
          category: l.category,
          amountVnd: -l.amountVnd,
          quantity: l.quantity,
          unitPriceVnd: -l.unitPriceVnd,
          description: `reversal ${l.id}`,
          labelKey: l.labelKey,
          labelParams: l.labelParams,
          serviceDate: l.serviceDate,
          reversalOfId: l.id,
        },
        g.user.displayName,
      );
      if (body.voidLine !== true)
        addLine(
          r,
          {
            category: l.category,
            quantity: qty,
            unitPriceVnd: unit,
            amountVnd: round1000(unit * qty),
            description: l.description,
            labelKey: l.labelKey,
            labelParams: l.labelParams,
            serviceDate: l.serviceDate,
            chargeCode: l.chargeCode,
            cabinetRoomId: l.cabinetRoomId,
          },
          g.user.displayName,
        );
      audit(g, 'folio_line.adjusted', r.code, {
        before: l.amountVnd,
        amountVnd: body.voidLine === true ? 0 : round1000(unit * qty),
        reason: String(body.reason),
      });
      return rsv().remember(key, 201, folioView(r, g.roles));
    }),
    http.post(`${prop}/folios/:folioId/lines/:lineId/foc`, async ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      const line = f?.lines.find((l) => l.id === params.lineId);
      if (!f || !line) return problem(404, 'NOT_FOUND');
      const r = rsv().state.reservations.find((x) => x.id === f.reservationId)!;
      const body = (await request.json()) as Body;
      // Like folio.controller: the requester's password is checked BEFORE the unit of work (R2: password only).
      if (body.authMethod === 'pin')
        return validation([{ field: 'authMethod', code: 'NOT_IN_LIST' }]);
      if (body.authMethod !== undefined && !body.secret)
        return validation([{ field: 'secret', code: 'REQUIRED' }]);
      const reauthenticated = body.authMethod === 'password' && !!body.secret;
      if (reauthenticated && body.secret !== MOCK_PASSWORD)
        return problem(401, 'REAUTH_FAILED', {
          errors: [{ field: 'secret', code: 'REAUTH_FAILED' }],
        });
      // ARC 16.27 (R7LOCK-02, BR-525): writing a debt off after check-out – the one FOC a settled folio takes.
      if (body.reasonCode === 'debt_write_off') {
        const due = totals(r).balanceDueVnd;
        if (f.status !== 'settled' || due <= 0) return problem(409, 'FOLIO_LOCKED');
        if (!has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
        // R3-Q25 (FB-R2-SEC-BE-82 (b), foc.service): the write-off requester re-authenticates like an approver (S1).
        if (!reauthenticated) return validation([{ field: 'secret', code: 'REQUIRED' }]);
        if (String(body.kind ?? 'foc') !== 'foc')
          return validation([{ field: 'kind', code: 'NOT_ALLOWED' }]);
        if (String(body.note ?? '').trim().length < 3)
          return validation([{ field: 'note', code: 'REASON_REQUIRED' }]);
        const reversed = new Set(f.lines.map((l) => l.reversalOfId).filter(Boolean));
        const used = f.lines
          .filter(
            (l) =>
              l.relatedLineId === line.id &&
              ['foc', 'discount'].includes(l.category) &&
              (l.lineState === 'posted' || l.lineState === 'pending_approval') &&
              !reversed.has(l.id),
          )
          .reduce((a, l) => a + Math.abs(l.amountVnd), 0);
        // BE-80 (a): what pending write-offs of this folio already ask is not asked twice.
        const waiting = st.approvals
          .filter(
            (a) =>
              a.folioId === f.id &&
              a.reasonCode === 'debt_write_off' &&
              ['pending', 'escalated'].includes(a.status),
          )
          .reduce((a, x) => a + x.amountVnd, 0);
        const max = Math.max(0, Math.min(line.amountVnd - used, due - waiting));
        const amount = Number(body.amountVnd);
        if (!(amount > 0)) return validation([{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
        if (amount > max)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
            max,
          });
        // BR-433: a manager waives up to one night (mock: the room's list price); above → the owner approves.
        const night = roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
        const applied = g.roles.includes('owner') || amount <= night;
        const a: MockApproval = {
          id: uid(89_000 + next()),
          type: 'foc',
          status: applied ? 'approved' : 'pending',
          reservationCode: r.code,
          folioId: f.id,
          folioLineId: line.id,
          amountVnd: amount,
          reasonCode: 'debt_write_off',
          reasonNote: String(body.note).trim(),
          requestedBy: g.user.displayName,
          requestedByUserId: g.user.id,
          requestedAt: nowIso(),
          ...(applied
            ? {
                approverName: g.user.displayName,
                approverUserId: g.user.id,
                decidedAt: nowIso(),
                effectiveAmountVnd: amount,
              }
            : {}),
        };
        st.approvals.push(a);
        addLine(
          r,
          {
            category: 'foc',
            amountVnd: -amount,
            description: `foc ${line.id}`,
            labelParams: { reason: 'debt_write_off' },
            lineState: applied ? 'posted' : 'pending_approval',
            relatedLineId: line.id,
            approvalRequestId: a.id,
          },
          g.user.displayName,
        );
        return json(approvalView(a), 201);
      }
      const out = focRequest(r, line, body, g);
      return out instanceof Response ? out : json(approvalView(out), 201);
    }),
    http.post(`${prop}/folios/:folioId/payments`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, 'sales_staff']);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      if (!f) return problem(404, 'NOT_FOUND');
      const r = rsv().find({ reservationId: f.reservationId }, g);
      if (!r) return problem(404, 'NOT_FOUND');
      const body = (await request.json()) as Body;
      const errs = paymentErrors(body);
      if (errs.length) return validation(errs);
      const key = `pay:${request.headers.get('idempotency-key')}`;
      const hit = rsv().state.idempotency.get(key);
      if (hit) return json(hit.body, hit.status);
      // ARC 16.26 (BR-525 G-4): a settled folio takes only debt collection – `charge`, FD+, ≤ what is still due.
      if (f.status === 'settled') {
        const due = totals(r).balanceDueVnd;
        if (body.type !== 'charge' || due <= 0) return problem(409, 'FOLIO_LOCKED');
        if (!has(g.roles, FD_PLUS)) return problem(403, 'FORBIDDEN_ACTION');
        if (Number(body.amountVnd) > due)
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
            max: due,
          });
      }
      const p = recordPay(r, body, g);
      bump(r);
      // R2 (ARC 16.30.3, SM-10 A7): collecting the debt in full does NOT close a write-off still waiting – it is
      // closed (`debt_cleared`) when someone approves it; closing at once is BE-S4-17, moved to R3.
      return rsv().remember(key, 201, p);
    }),
    http.post(`${prop}/folios/:folioId/vietqr`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, 'sales_staff']);
      if (isResponse(g)) return g;
      const r = byFolio(String(params.folioId), g);
      if (!r) return problem(404, 'NOT_FOUND');
      const f = folioOf(r);
      const { key, replay } = rsv().idem(request, `vietqr:${f.id}`);
      if (replay) return replay;
      if (st.paymentNotConfigured) return problem(409, 'PAYMENT_NOT_CONFIGURED');
      const body = (await request.json()) as Body;
      const amount = Number(body.amountVnd);
      if (!(amount > 0)) return validation([{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
      // SEC F1: a hold owes its missing deposit (BR-305) and only takes `purpose=deposit`;
      // 0.3.7 `check_in` is capped by `amountDueAtCheckinVnd` at the time the desk is looking at.
      const hold = r.status === 'hold';
      if (hold && body.purpose && body.purpose !== 'deposit')
        return validation([{ field: 'purpose', code: 'NOT_IN_LIST' }]);
      const outTime =
        typeof body.checkoutAt === 'string'
          ? String(body.checkoutAt).slice(11, 16)
          : (r.agreedCheckoutTime ?? '12:00');
      // 0.3.7 add. 4 (BUG-R2-139, BR-416-06): `lateFeeAsNight` only while the night of departure is sold;
      // then no typed extra-night rate either.
      const unsold = body.purpose === 'check_out' && lateFeeAsNight(r, outTime) !== undefined;
      if (body.lateFeeAsNight === true && !unsold)
        return validation([{ field: 'lateFeeAsNight', code: 'NOT_ALLOWED' }]);
      if (body.extraNightRateVnd !== undefined && unsold)
        return validation([{ field: 'extraNightRateVnd', code: 'NOT_ALLOWED' }]);
      const purpose: NonNullable<MockPayment['qrPurpose']> = hold
        ? 'deposit'
        : body.purpose === 'check_in' || body.purpose === 'check_out' || body.purpose === 'deposit'
          ? body.purpose
          : 'balance';
      const qrContext: MockQrContext =
        purpose === 'check_in'
          ? {
              checkinTime: String(body.checkinTime ?? '14:00'),
              addPriorNight: !!body.addPriorNight,
            }
          : purpose === 'check_out'
            ? {
                checkoutTime: outTime,
                extraNightRateVnd:
                  body.extraNightRateVnd !== undefined ? Number(body.extraNightRateVnd) : undefined,
                lateFeeAsNight: body.lateFeeAsNight === true,
              }
            : {};
      const cap = hold
        ? Math.max(0, (r.depositRequiredVnd ?? 0) - r.depositPaidVnd)
        : body.purpose === 'check_in'
          ? dueAtCheckin(r, String(body.checkinTime ?? '14:00'), !!body.addPriorNight)
          : body.purpose === 'check_out'
            ? dueAtCheckout(r, outTime, qrContext.extraNightRateVnd, qrContext.lateFeeAsNight)
            : totals(r).balanceDueVnd;
      if (amount > cap && !body.overBalanceReason)
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
          max: cap,
        });
      // One pending QR per folio: the older one expires now.
      for (const old of st.payments)
        if (old.folioId === f.id && old.method === 'vietqr' && old.status === 'pending')
          old.status = 'expired';
      const content =
        f.status === 'settled' && f.billNo ? f.billNo.replace('-', '') : r.code.replace('-', '');
      // EMVCo-like payload (mock): the real one is built by BE-B with CRC16 (INT F2).
      const amt = String(amount);
      const qrPayload = `00020101021238570010A000000727012700069704070113190366667770208QRIBFTTA530370454${String(amt.length).padStart(2, '0')}${amt}5802VN62${String(content.length + 4).padStart(2, '0')}08${String(content.length).padStart(2, '0')}${content}6304ABCD`;
      // Mock: the pending QR stays outside `payments` until the desk confirms it was received.
      const p: MockPayment = {
        id: uid(88_500 + next()),
        code: `PT-0${st.seq}`,
        folioId: f.id,
        reservationCode: r.code,
        type: hold || body.purpose === 'deposit' ? 'deposit' : 'charge',
        method: 'vietqr',
        amountVnd: amount,
        status: 'pending',
        reconciliation: 'pending',
        expiresAt: `${addDays(today(), 1)}T06:00:00+07:00`,
        recordedBy: g.user.displayName,
        recordedByUserId: g.user.id,
        recordedByRole: g.roles[0],
        qrPurpose: purpose,
        qrContext,
        version: 1,
      };
      st.payments.push(p);
      return rsv().remember(key, 201, {
        payment: paymentView(p),
        qrPayload,
        transferContent: content,
        receivingAccountMasked: '9704••••7777',
        receivingAccountRecentlyChanged: false,
      });
    }),
    http.post(
      `${prop}/payments/:paymentId/actions/confirm-received`,
      async ({ request, params }) => {
        const g = guard(request, [...FD_PLUS, 'sales_staff']);
        if (isResponse(g)) return g;
        const p = st.payments.find((x) => x.id === params.paymentId);
        if (!p) return problem(404, 'NOT_FOUND');
        if (p.status !== 'pending')
          return problem(409, 'INVALID_TRANSITION', { currentState: p.status });
        const body = (await request.json()) as Body;
        // 0.3.7 add. 4 (DOM (f)): above what the QR's purpose still leaves due → a note (≥ 3) says why.
        const dueNow = qrDueNow(p);
        if (
          dueNow !== undefined &&
          p.amountVnd > dueNow &&
          String(body.note ?? '').trim().length < 3
        )
          return problem(422, 'VALIDATION_FAILED', {
            errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
            max: dueNow,
          });
        p.status = 'succeeded';
        p.receivedAt = nowIso();
        p.note = (body.note as string | undefined) ?? p.note;
        p.version += 1;
        const r = rsv().state.reservations.find((x) => x.folioId === p.folioId)!;
        // A deposit QR counts towards the hold's deposit (B4 then confirms with `existingPaymentId`).
        if (p.type === 'deposit') r.depositPaidVnd += p.amountVnd;
        syncReservation(r);
        bump(r);
        audit(g, 'payment.confirmed_received', r.code, {
          amountVnd: p.amountVnd,
          method: 'vietqr',
          reconciliation: 'pending',
        });
        return json(paymentView(p));
      },
    ),
    http.get(`${prop}/payments`, ({ request }) => {
      const g = guard(request, [...FD_PLUS, 'sales_staff']);
      if (isResponse(g)) return g;
      const q = new URL(request.url).searchParams;
      const rec = q.get('reconciliation') ?? 'pending';
      const roleFilter = q.get('recordedByRole')?.split(',');
      const method = q.get('method');
      const mgr = has(g.roles, OWN_MGR);
      const data = st.payments
        .filter((p) => p.status === 'succeeded' && p.type !== 'refund')
        .filter((p) => rec === 'any' || p.reconciliation === rec)
        .filter((p) => !roleFilter || roleFilter.includes(String(p.recordedByRole)))
        .filter((p) => !method || p.method === method)
        // x-scope own_or_cash_handover for FD/FDL (0.3.6 A-42).
        .filter(
          (p) =>
            mgr ||
            p.recordedByUserId === g.user.id ||
            (p.method === 'cash' && SALES.includes(p.recordedByRole as Role)),
        )
        .map(paymentView);
      return json({ data, page: { hasMore: false } });
    }),
    http.post(`${prop}/payments/:paymentId/actions/reconcile`, async ({ request, params }) => {
      const pre = guard(request, OWN_MGR);
      if (isResponse(pre)) return pre;
      const p = st.payments.find((x) => x.id === params.paymentId);
      if (!p) return problem(404, 'NOT_FOUND');
      const g = guard(request, OWN_MGR, { ifMatch: p.version });
      if (isResponse(g)) return g;
      if (p.recordedByUserId === g.user.id && !g.roles.includes('owner'))
        return problem(403, 'SELF_RECONCILE_FORBIDDEN');
      if (p.reconciliation !== 'pending')
        return problem(409, 'INVALID_TRANSITION', { currentState: p.reconciliation });
      const body = (await request.json()) as Body;
      if (body.result === 'disputed' && String(body.note ?? '').trim().length < 3)
        return validation([{ field: 'note', code: 'REASON_REQUIRED' }]);
      p.reconciliation = body.result === 'disputed' ? 'disputed' : 'reconciled';
      p.reconciledByName = g.user.displayName;
      p.version += 1;
      return json(paymentView(p));
    }),
    http.post(
      `${prop}/payments/:paymentId/actions/confirm-cash-handover`,
      async ({ request, params }) => {
        const pre = guard(request, FD_PLUS);
        if (isResponse(pre)) return pre;
        const p = st.payments.find((x) => x.id === params.paymentId);
        if (!p) return problem(404, 'NOT_FOUND');
        const g = guard(request, FD_PLUS, { ifMatch: p.version });
        if (isResponse(g)) return g;
        // A46a: the person confirming must differ from the person who recorded it – even the owner.
        if (p.recordedByUserId === g.user.id) return problem(403, 'SELF_RECONCILE_FORBIDDEN');
        if (
          p.method !== 'cash' ||
          !SALES.includes(p.recordedByRole as Role) ||
          p.reconciliation !== 'pending'
        )
          return problem(409, 'INVALID_TRANSITION', { currentState: p.reconciliation });
        const body = (await request.json()) as Body;
        if (body.result === 'short' && String(body.note ?? '').trim().length < 3)
          return validation([{ field: 'note', code: 'REASON_REQUIRED' }]);
        p.reconciliation = body.result === 'short' ? 'disputed' : 'reconciled';
        p.reconciledByName = g.user.displayName;
        p.version += 1;
        audit(g, 'payment.cash_handover_confirmed', p.reservationCode, {
          amountVnd: p.amountVnd,
          method: 'cash',
        });
        return json(paymentView(p));
      },
    ),
    http.post(`${prop}/payments/:paymentId/actions/reverse`, async ({ request, params }) => {
      const g = guard(request, OWN_MGR);
      if (isResponse(g)) return g;
      const p = st.payments.find((x) => x.id === params.paymentId);
      if (!p) return problem(404, 'NOT_FOUND');
      const body = (await request.json().catch(() => ({}))) as Body;
      if (String(body.reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      if (p.status !== 'succeeded')
        return problem(409, 'INVALID_TRANSITION', { currentState: p.status });
      p.status = 'reversed';
      p.version += 1;
      const r = rsv().state.reservations.find((x) => x.folioId === p.folioId)!;
      syncReservation(r);
      return json(p);
    }),
    http.post(`${prop}/folios/:folioId/refund-requests`, async ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      if (!f) return problem(404, 'NOT_FOUND');
      const r = rsv().state.reservations.find((x) => x.id === f.reservationId)!;
      const body = (await request.json()) as Body;
      if (String(body.reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      if (!(Number(body.amountVnd) > 0) || Number(body.amountVnd) > totals(r).unhandledCreditVnd)
        return validation([{ field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' }]);
      const a: MockApproval = {
        id: uid(89_000 + next()),
        type: 'refund',
        status: 'pending',
        reservationCode: r.code,
        folioId: f.id,
        amountVnd: Number(body.amountVnd),
        reasonCode: 'overpayment',
        reasonNote: String(body.reason),
        requestedBy: g.user.displayName,
        requestedByUserId: g.user.id,
        requestedAt: nowIso(),
        refundedVnd: 0,
      };
      st.approvals.push(a);
      return json(a, 201);
    }),
    http.put(`${prop}/folios/:folioId/invoice-request`, async ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      if (!f) return problem(404, 'NOT_FOUND');
      const body = (await request.json()) as Body;
      const errors: Array<{ field: string; code: string }> = [];
      if (body.buyerType === 'company') {
        if (String(body.companyName ?? '').trim().length < 2)
          errors.push({ field: 'companyName', code: 'REQUIRED' });
        if (!/^[0-9]{10}(-?[0-9]{3})?$/.test(String(body.taxCode ?? '')))
          errors.push({ field: 'taxCode', code: 'TAX_CODE_INVALID' });
        if (body.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(body.email)))
          errors.push({ field: 'email', code: 'EMAIL_INVALID' });
      }
      if (errors.length) return validation(errors);
      f.invoiceRequest = { ...body, einvoiceStatus: 'not_requested' };
      return json(f.invoiceRequest);
    }),
    http.get(`${prop}/folios/:folioId/bill`, ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      if (!f) return problem(404, 'NOT_FOUND');
      const r = rsv().state.reservations.find((x) => x.id === f.reservationId)!;
      const tt = totals(r);
      const foreign = isForeign(r);
      return json({
        folioId: f.id,
        billNo: f.billNo,
        // 0.3.7 add. 1: the time the folio was settled (seeded checked-out stays: their departure morning).
        settledAt:
          f.status === 'settled' ? (f.settledAt ?? `${r.departureDate}T11:00:00+07:00`) : null,
        locale: foreign ? 'vi_en' : 'vi',
        property: {
          name: 'OTTIMO Boutique Stay – Đà Lạt',
          address: 'Đà Lạt',
          taxCode: '••••••••••',
        },
        guestDisplayName: r.guestName,
        roomNo: currentSegment(r.segments, today())?.roomNo,
        // 0.3.7 add. D1 (BR-012): the room NAME on the bill (and in the line labels), never the number.
        roomName: nameOfRoom(currentSegment(r.segments, today())?.roomNo) ?? null,
        arrivalDate: r.arrivalDate,
        departureDate: r.departureDate,
        lines: f.lines
          .filter((l) => l.lineState === 'posted')
          .map((l) => {
            const p = l.labelParams;
            if (!p || !(['room', 'from', 'to'] as const).some((k) => k in p)) return l;
            const named = (v: string | number | undefined) =>
              v === undefined ? v : (nameOfRoom(String(v)) ?? v);
            return {
              ...l,
              labelParams: {
                ...p,
                ...('room' in p ? { room: named(p.room)! } : {}),
                ...('from' in p ? { from: named(p.from)! } : {}),
                ...('to' in p ? { to: named(p.to)! } : {}),
              },
            };
          }),
        totalVnd: tt.totalVnd,
        paidVnd: tt.paidVnd,
        balanceDueVnd: tt.balanceDueVnd,
        usdReference: foreign
          ? {
              rate: 26_300,
              totalUsd: Math.round((tt.totalVnd / 26_300) * 10) / 10,
              rateUpdatedOn: today(),
            }
          : undefined,
        vietqrTransferContent: r.code.replace('-', ''),
        paymentModel: r.paymentModel,
        otaPrepaidVnd: r.paymentModel === 'ota_prepaid' ? tt.roomVnd : null,
        refunds: st.payments
          .filter((p) => p.folioId === f.id && p.type === 'refund')
          .map((p) => ({ amountVnd: p.amountVnd, paidAt: p.receivedAt, method: p.method })),
        refundedVnd: tt.refundedVnd,
        // DOM FE-03: "Hoàn lại khách {x}" on the bill when the guest paid more (contract pending ARC).
        creditVnd: tt.creditVnd,
      });
    }),
    http.post(`${prop}/attachments`, async ({ request }) => {
      const g = guard(request, [...FD_PLUS, 'housekeeping', 'maintenance', ...SALES]);
      if (isResponse(g)) return g;
      if (!request.headers.get('idempotency-key')) return problem(428, 'PRECONDITION_REQUIRED');
      // Same parts as the API (attachments.controller.ts): `file` (a file part), `purpose` and
      // `reservationId` as plain text parts.
      const form = await request.formData();
      const file = form.get('file');
      const purpose = form.get('purpose');
      const reservationId = form.get('reservationId');
      const errors: Array<{ field: string; code: string }> = [];
      if (!file || typeof file === 'string') errors.push({ field: 'file', code: 'REQUIRED' });
      if (typeof purpose !== 'string' || !purpose.trim())
        errors.push({ field: 'purpose', code: 'REQUIRED' });
      if (reservationId !== null && typeof reservationId !== 'string')
        errors.push({ field: 'reservationId', code: 'VALIDATION_FAILED' });
      if (errors.length) return validation(errors);
      const id = uid(92_000 + next());
      st.attachments.add(id);
      return json({ id, purpose, sizeBytes: 1024 }, 201);
    }),

    // ---------- approvals + refunds ----------
    http.get(`${prop}/approval-requests`, ({ request }) => {
      const g = guard(request, 'any');
      if (isResponse(g)) return g;
      const q = new URL(request.url).searchParams;
      const status = q.get('status');
      const lead = has(g.roles, LEAD_PLUS);
      const all = st.approvals
        .filter((a) => !status || a.status === status)
        .filter(
          (a) =>
            lead ||
            a.requestedByUserId === g.user.id ||
            (a.type === 'refund' && has(g.roles, FD_PLUS)),
        );
      // PageInfo like the server (BUG-R2-107): `limit` rows from the opaque `cursor`, then `nextCursor`.
      const limit = Math.min(Math.max(Number(q.get('limit') ?? 50) || 50, 1), 100);
      const from = Number(q.get('cursor') ?? 0) || 0;
      const data = all.slice(from, from + limit).map(approvalView);
      const next = from + limit < all.length ? String(from + limit) : null;
      return json({ data, page: { limit, nextCursor: next } });
    }),
    http.post(
      `${prop}/approval-requests/:approvalId/actions/approve`,
      async ({ request, params }) => {
        const g = guard(request, LEAD_PLUS);
        if (isResponse(g)) return g;
        const a = st.approvals.find((x) => x.id === params.approvalId);
        if (!a) return problem(404, 'NOT_FOUND');
        const body = (await request.json()) as Body;
        const missing = versionCheck(a, body, 'missing');
        if (missing) return missing;
        if (body.secret !== MOCK_PASSWORD)
          return problem(401, 'REAUTH_FAILED', {
            errors: [{ field: 'secret', code: 'REAUTH_FAILED' }],
          });
        if (a.requestedByUserId === g.user.id) return problem(403, 'SELF_APPROVAL_FORBIDDEN');
        if (a.type === 'refund' && !has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
        if (!['pending', 'escalated'].includes(a.status))
          return problem(409, 'INVALID_TRANSITION', {
            currentState: a.status,
            approverName: a.approverName,
            decidedAt: a.decidedAt,
          });
        const stale = versionCheck(a, body, 'stale');
        if (stale) return stale;
        // SEC BE-80: a debt write-off approved after the debt was collected – closed by the server instead.
        if (a.reasonCode === 'debt_write_off') {
          const f0 = a.folioId ? st.folios.get(a.folioId) : undefined;
          const r0 = f0 && rsv().state.reservations.find((x) => x.id === f0.reservationId);
          if (r0 && totals(r0).balanceDueVnd <= 0) {
            autoCancel(a, 'debt_cleared');
            return json(approvalView(a));
          }
          // Part of the debt paid meanwhile: only what is still owed is written off.
          const owed = r0 ? totals(r0).balanceDueVnd : a.amountVnd;
          a.effectiveAmountVnd = Math.min(a.amountVnd, owed);
          if (a.effectiveAmountVnd < a.amountVnd) {
            const l0 = f0?.lines.find((l) => l.approvalRequestId === a.id);
            if (l0) {
              l0.amountVnd = -a.effectiveAmountVnd;
              l0.unitPriceVnd = -a.effectiveAmountVnd;
            }
            st.audit.unshift({
              occurredAt: nowIso(),
              actorType: 'system',
              category: 'money',
              action: 'approval.applied_capped',
              entityType: 'approval_request',
              entityCode: a.reservationCode,
              before: { amountVnd: a.amountVnd },
              after: { appliedVnd: a.effectiveAmountVnd, openDebtVnd: owed },
              reason: 'debt_collected_before_approval',
            });
          }
        }
        a.version = (a.version ?? 1) + 1;
        a.status = 'approved';
        a.approverName = g.user.displayName;
        a.approverUserId = g.user.id;
        a.decidedAt = nowIso();
        const f = a.folioId ? st.folios.get(a.folioId) : undefined;
        const line = f?.lines.find((l) => l.approvalRequestId === a.id);
        if (line) line.lineState = 'posted';
        if (f) syncReservation(rsv().state.reservations.find((x) => x.id === f.reservationId)!);
        audit(g, 'approval.approved', a.reservationCode, { amountVnd: a.amountVnd, type: a.type });
        return json(approvalView(a));
      },
    ),
    http.post(
      `${prop}/approval-requests/:approvalId/actions/reject`,
      async ({ request, params }) => {
        const g = guard(request, LEAD_PLUS);
        if (isResponse(g)) return g;
        const a = st.approvals.find((x) => x.id === params.approvalId);
        if (!a) return problem(404, 'NOT_FOUND');
        const body = (await request.json()) as Body;
        if (body.secret !== MOCK_PASSWORD)
          return problem(401, 'REAUTH_FAILED', {
            errors: [{ field: 'secret', code: 'REAUTH_FAILED' }],
          });
        if (String(body.reason ?? '').trim().length < 3)
          return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
        const missing = versionCheck(a, body, 'missing');
        if (missing) return missing;
        if (!['pending', 'escalated'].includes(a.status))
          return problem(409, 'INVALID_TRANSITION', { currentState: a.status });
        const stale = versionCheck(a, body, 'stale');
        if (stale) return stale;
        a.version = (a.version ?? 1) + 1;
        a.status = 'rejected';
        a.approverName = g.user.displayName;
        a.decidedAt = nowIso();
        const f = a.folioId ? st.folios.get(a.folioId) : undefined;
        const line = f?.lines.find((l) => l.approvalRequestId === a.id);
        if (line) line.lineState = 'rejected';
        return json(approvalView(a));
      },
    ),
    http.post(`${prop}/approval-requests/:approvalId/actions/cancel`, ({ request, params }) => {
      const g = guard(request, 'any');
      if (isResponse(g)) return g;
      const a = st.approvals.find((x) => x.id === params.approvalId);
      if (!a || a.requestedByUserId !== g.user.id) return problem(404, 'NOT_FOUND');
      a.status = 'cancelled';
      return json(approvalView(a));
    }),
    http.put(
      `${prop}/approval-requests/:approvalId/refund-destination`,
      async ({ request, params }) => {
        const g = guard(request, FD_PLUS);
        if (isResponse(g)) return g;
        const a = st.approvals.find((x) => x.id === params.approvalId && x.type === 'refund');
        if (!a) return problem(404, 'NOT_FOUND');
        const body = (await request.json()) as Body;
        if (body.method === 'bank_transfer') {
          if (!trusted(g)) return problem(403, 'DEVICE_NOT_TRUSTED');
          const acc = String(body.accountNo ?? '').replace(/\s/g, '');
          const errors: Array<{ field: string; code: string }> = [];
          if (!/^[0-9]{6}$/.test(String(body.bankBin ?? '')))
            errors.push({ field: 'bankBin', code: 'REQUIRED' });
          if (!/^[0-9]{6,19}$/.test(acc)) errors.push({ field: 'accountNo', code: 'REQUIRED' });
          else if (luhn(acc)) errors.push({ field: 'accountNo', code: 'CARD_NUMBER_DETECTED' });
          if (errors.length) return validation(errors);
        }
        a.refundDestination = {
          method: String(body.method),
          bankBin: body.bankBin as string | undefined,
          accountNo: body.accountNo as string | undefined,
          accountHolder: body.accountHolder as string | undefined,
          setAt: nowIso(),
          setByUserId: g.user.id,
        };
        // SEC F8: a destination changed after approval goes back to approval.
        if (a.status === 'approved') a.status = 'pending';
        a.version = (a.version ?? 1) + 1;
        return json(approvalView(a));
      },
    ),
    http.get(`${prop}/approval-requests/:approvalId/refund-destination`, ({ request, params }) => {
      const g = guard(request, OWN_MGR);
      if (isResponse(g)) return g;
      if (!trusted(g)) return problem(403, 'DEVICE_NOT_TRUSTED');
      if (needStepUp(g)) return problem(401, 'REAUTH_REQUIRED');
      const a = st.approvals.find((x) => x.id === params.approvalId);
      if (!a?.refundDestination) return problem(404, 'NOT_FOUND');
      const { method, bankBin, accountNo, accountHolder } = a.refundDestination;
      return json({ method, bankBin, accountNo, accountHolder });
    }),
    http.post(
      `${prop}/approval-requests/:approvalId/actions/execute-cash-refund`,
      async ({ request, params }) => {
        const g = guard(request, FD_PLUS);
        if (isResponse(g)) return g;
        return executeRefund(request, String(params.approvalId), g, 'cash');
      },
    ),
    http.post(
      `${prop}/approval-requests/:approvalId/actions/execute-refund`,
      async ({ request, params }) => {
        const g = guard(request, OWN_MGR);
        if (isResponse(g)) return g;
        return executeRefund(request, String(params.approvalId), g, 'transfer');
      },
    ),
    http.get(`${prop}/audit-events`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const q = new URL(request.url).searchParams;
      const actor = q.get('actorUserId');
      const mgr = has(g.roles, OWN_MGR);
      const data = st.audit
        .filter((e) => !q.get('category') || e.category === q.get('category'))
        .filter((e) => !actor || e.actorUserId === actor)
        // FD/FDL: only their own money actions (US-006 AC2, x-scope own).
        .filter((e) => mgr || e.actorUserId === g.user.id)
        .map((e) => {
          const out = { ...e };
          delete out.actorUserId;
          return out;
        });
      return json({ data, page: { hasMore: false } });
    }),
    http.post('*/v1/me/step-up', async ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const body = (await request.json()) as Body;
      if (body.password !== MOCK_PASSWORD)
        return problem(401, 'REAUTH_FAILED', {
          errors: [{ field: 'password', code: 'REAUTH_FAILED' }],
        });
      const until = Date.now() + 15 * 60_000;
      st.stepUpUntil.set(g.user.id, until);
      return json({ validUntil: new Date(until).toISOString() });
    }),

    // ---------- registration (S09 – C3, trusted device) ----------
    http.get(`${prop}/registrations`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const view = new URL(request.url).searchParams.get('view') ?? 'action_needed';
      const data = [...st.registrations.values()]
        .map((reg) => ({
          reg,
          r: rsv().state.reservations.find((x) => x.id === reg.reservationId)!,
        }))
        .filter(({ reg, r }) =>
          view === 'all'
            ? true
            : view === 'needs_update'
              ? reg.status === 'needs_update'
              : ['none', 'pre', 'partial', 'review', 'scanned', 'sent'].includes(reg.status) &&
                (r.status === 'in_house' ||
                  (r.status === 'confirmed' && r.arrivalDate === today())),
        )
        .map(({ reg }) => {
          const v = regView(reg);
          return {
            id: v.id,
            reservationId: v.reservationId,
            reservationCode: v.reservationCode,
            roomNo: v.roomNo,
            guestDisplayName: v.guestDisplayName,
            arrivalDate: v.arrivalDate,
            kind: v.kind,
            status: v.status,
            requiredCount: v.requiredCount,
            submittedCount: v.submittedCount,
            deadlineAt: v.deadlineAt,
            deadlineLabel: v.deadlineLabel,
            isOverdue: v.isOverdue,
          };
        });
      return json({ data, page: { hasMore: false } });
    }),
    http.get(`${prop}/registrations/:registrationId`, ({ request, params }) => {
      const x = c3(request, params);
      if (isResponse(x)) return x;
      return json(regView(x.reg));
    }),
    http.post(`${prop}/registrations/:registrationId/documents`, async ({ request, params }) => {
      const x = c3(request, params);
      if (isResponse(x)) return x;
      const { reg, r } = x;
      const form = await request.formData();
      const raw = form.get('data');
      // UXR #3: like the API's `textPart`, only a plain text part counts – a Blob/File part (it carries a
      // filename on the wire) is ignored → 422 `data REQUIRED`.
      if (typeof raw !== 'string') return validation([{ field: 'data', code: 'REQUIRED' }]);
      const data = JSON.parse(raw) as Body;
      const images = form.getAll('image');
      const errors: Array<{ field: string; code: string }> = [];
      const no = String(data.docNumber ?? '')
        .replace(/\s/g, '')
        .toUpperCase();
      if (!String(data.fullNameOnDoc ?? '').trim())
        errors.push({ field: 'fullNameOnDoc', code: 'REQUIRED' });
      if (
        ['cccd', 'child_personal_id'].includes(String(data.docType))
          ? !/^[0-9]{12}$/.test(no)
          : !/^[A-Z0-9-]{3,30}$/.test(no)
      )
        errors.push({ field: 'docNumber', code: 'DOC_NUMBER_INVALID' });
      if (data.dateOfBirth && String(data.dateOfBirth) > today())
        errors.push({ field: 'dateOfBirth', code: 'DOB_FUTURE' });
      if (data.entryDate && String(data.entryDate) > today())
        errors.push({ field: 'entryDate', code: 'ENTRY_DATE_FUTURE' });
      if (data.isMain && reg.documents.some((d) => d.isMain))
        errors.push({ field: 'isMain', code: 'MAIN_GUEST_DUPLICATE' });
      if (errors.length) return validation(errors);
      // BE addDocument: the same number twice in one registration. 0.3.7 (S4-39): the twin is a document
      // waiting to be linked → DOCUMENT_UNCLAIMED_EXISTS with its id + slot (the desk links it, no new one).
      const twin = reg.documents.find((d) => d.docNumber && d.docNumber === no);
      if (twin && isUnclaimed(twin))
        return problem(409, 'DOCUMENT_UNCLAIMED_EXISTS', {
          documentId: twin.id,
          personIndex: twin.personIndex,
        });
      if (twin) return problem(409, 'PARTY_DUPLICATE');
      // SEC FB-R2-SEC-BE-73 / ARC 16.22: whose ID it is comes from `partyMemberId` – never "main ID = booker".
      // Absent → a person of the party with the same name, else a new person "from the ID" (relationship unknown).
      const members = st.party.get(r.id) ?? [];
      let memberId = data.partyMemberId as string | undefined;
      if (memberId !== undefined) {
        if (!members.some((m) => m.id === memberId))
          return validation([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
        if (reg.documents.some((d) => d.partyMemberId === memberId))
          return problem(409, 'PARTY_DUPLICATE');
      } else {
        const key = (v: string) =>
          v
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/gi, 'd')
            .toLowerCase()
            .trim();
        const same = members.find(
          (m) =>
            key(m.displayName) === key(String(data.fullNameOnDoc)) &&
            !reg.documents.some((d) => d.partyMemberId === m.id),
        );
        if (same) memberId = same.id;
        else {
          const created: MockMember = {
            id: uid(83_500 + next()),
            role: 'companion',
            displayName: String(data.fullNameOnDoc).trim(),
            priceAgeBand: 'adult',
          };
          st.party.set(r.id, [...members, created]);
          memberId = created.id;
        }
      }
      const doc: MockDoc = {
        id: uid(93_000 + next()),
        partyMemberId: memberId,
        docType: String(data.docType),
        isMain: data.isMain === true || !reg.documents.some((d) => d.isMain),
        fullNameOnDoc: String(data.fullNameOnDoc).trim(),
        nationalityCode:
          (data.nationalityCode as string | undefined) ??
          (data.docType === 'passport' ? undefined : 'VNM'),
        docNumber: no,
        dateOfBirth: data.dateOfBirth as string | undefined,
        passportExpiryDate: data.passportExpiryDate as string | undefined,
        visaValidUntil: data.visaValidUntil as string | undefined,
        entryDate: data.entryDate as string | undefined,
        // All manual-entry fields the portal needs (BE-C `portalFields()`, FE-S3-02).
        gender: data.gender as string | undefined,
        address: data.address as string | undefined,
        passportIssueDate: data.passportIssueDate as string | undefined,
        issuingPlace: data.issuingPlace as string | undefined,
        visaKind: data.visaKind as string | undefined,
        visaNumber: data.visaNumber as string | undefined,
        entryPort: data.entryPort as string | undefined,
        entryPurpose: data.entryPurpose as string | undefined,
        noEntryRecord: data.noEntryRecord === true,
        imageIds: images.map(() => uid(94_000 + next())),
        imageConsent: 'not_recorded',
        captureMethod: String(data.captureMethod ?? 'manual'),
        checks: [],
      };
      reg.documents.push(doc);
      recomputeReg(r, reg);
      reg.version += 1;
      return json(regView(reg), 201);
    }),
    http.put(
      `${prop}/registrations/:registrationId/documents/:documentId/checks/:checkCode`,
      async ({ request, params }) => {
        const x = c3(request, params);
        if (isResponse(x)) return x;
        const { reg, r, g } = x;
        const g2 = guard(request, FD_PLUS, { ifMatch: reg.version });
        if (isResponse(g2)) return g2;
        const d = reg.documents.find((z) => z.id === params.documentId);
        const c = d?.checks.find((z) => z.code === params.checkCode);
        if (!d || !c) return problem(404, 'NOT_FOUND');
        const body = (await request.json()) as Body;
        if (String(body.note ?? '').trim().length < 3)
          return validation([{ field: 'note', code: 'CHECK_NOTE_REQUIRED' }]);
        c.manualResult =
          (body.manualResult as 'pass' | 'fail' | undefined) ?? c.manualResult ?? null;
        c.handledNote = String(body.note);
        c.handledByName = roleName(g);
        recomputeReg(r, reg);
        reg.version += 1;
        return json(regView(reg));
      },
    ),
    http.post(`${prop}/registrations/:registrationId/consents`, async ({ request, params }) => {
      const x = c3(request, params);
      if (isResponse(x)) return x;
      const { reg } = x;
      const body = (await request.json()) as Body;
      if (body.purpose === 'P02B_ID_IMAGE_RETENTION') {
        if (body.retentionDays === undefined)
          return validation([{ field: 'retentionDays', code: 'REQUIRED' }]);
        if (body.retentionDays !== st.consentNotice?.imageRetentionDays)
          return validation([{ field: 'retentionDays', code: 'NOT_IN_LIST' }]);
      }
      // ARC 16.22: the person who decides – required, and only THEIR document (no "first / main ID" guess).
      if (!body.partyMemberId) return validation([{ field: 'partyMemberId', code: 'REQUIRED' }]);
      const d = reg.documents.find((z) => z.partyMemberId === body.partyMemberId);
      if (!d) return validation([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
      if (d.imageConsent === 'refused' && body.decision === 'granted' && !d.imageIds.length)
        return problem(409, 'CONSENT_CHANGE_NOT_ALLOWED');
      d.imageConsent = body.decision as 'granted' | 'refused';
      reg.version += 1;
      return json(regView(reg), 201);
    }),
    http.post(
      `${prop}/registrations/:registrationId/actions/complete-review`,
      async ({ request, params }) => {
        const x = c3(request, params);
        if (isResponse(x)) return x;
        const { reg, r } = x;
        const g2 = guard(request, FD_PLUS, { ifMatch: reg.version });
        if (isResponse(g2)) return g2;
        const body = (await request.json()) as {
          warningNotes?: Array<{
            documentId: string;
            checkCode: string;
            note: string;
            manualResult?: 'pass' | 'fail';
          }>;
        };
        for (const w of body.warningNotes ?? []) {
          const c = reg.documents
            .find((d) => d.id === w.documentId)
            ?.checks.find((z) => z.code === w.checkCode);
          if (c) {
            c.handledNote = w.note;
            c.manualResult = w.manualResult ?? c.manualResult ?? null;
          }
        }
        recomputeReg(r, reg);
        const missing =
          reg.status !== 'review' ||
          reg.documents.some((d) =>
            d.checks.some((c) => ['fail', 'unverified'].includes(c.result) && !c.handledNote),
          ) ||
          reg.documents.some((d) => d.imageIds.length && d.imageConsent === 'not_recorded');
        if (missing) return problem(409, 'REGISTRATION_INCOMPLETE');
        reg.status = 'scanned';
        r.registrationStatus = 'scanned';
        reg.version += 1;
        return json(regView(reg));
      },
    ),
    http.get(`${prop}/registrations/:registrationId/portal-data`, ({ request, params }) => {
      const x = c3(request, params);
      if (isResponse(x)) return x;
      if (needStepUp(x.g)) return problem(401, 'REAUTH_REQUIRED');
      const { reg, r } = x;
      if (!['scanned', 'needs_update'].includes(reg.status))
        return problem(409, 'INVALID_TRANSITION', { currentState: reg.status });
      // Same shape as BE-C `rules.ts portalFields()`: label = i18n key (`reg.field.*`), value in
      // Vietnamese as the portal expects (dates as the server formats them), enum/empty → `valueKey`.
      const GENDER: Record<string, string> = { male: 'Nam', female: 'Nữ', other: 'Khác' };
      const VISA: Record<string, string> = {
        visa: 'Thị thực',
        visa_exempt: 'Miễn thị thực',
        temp_residence_card: 'Thẻ tạm trú',
      };
      const f = (key: string, value: string | undefined, valueKey?: string) =>
        value
          ? { label: `reg.field.${key}`, value, ...(valueKey ? { valueKey } : {}) }
          : { label: `reg.field.${key}`, value: '', valueKey: 'reg.value.empty' };
      const roomNo = currentSegment(r.segments, today())?.roomNo ?? '';
      const people = reg.documents.map((d) => {
        const gender = d.gender
          ? f('gender', GENDER[d.gender], `reg.value.gender.${d.gender}`)
          : f('gender', undefined);
        const foreign = d.docType === 'passport' && d.nationalityCode !== 'VNM';
        return {
          fields: foreign
            ? [
                f('full_name', d.fullNameOnDoc.toUpperCase()),
                f('date_of_birth', d.dateOfBirth),
                gender,
                f('nationality', d.nationalityCode),
                f('passport_number', d.docNumber),
                f('passport_expiry', d.passportExpiryDate),
                d.visaKind
                  ? f('visa_kind', VISA[d.visaKind], `reg.value.visa_kind.${d.visaKind}`)
                  : f('visa_kind', undefined),
                f('visa_number', d.visaNumber),
                f('visa_valid_until', d.visaValidUntil),
                f('entry_date', d.entryDate),
                f('entry_port', d.entryPort),
                f('entry_purpose', d.entryPurpose),
                f('arrival_date', r.arrivalDate),
                f('departure_date', r.departureDate),
                f('room_no', roomNo),
              ]
            : [
                f('full_name', d.fullNameOnDoc.toUpperCase()),
                f('date_of_birth', d.dateOfBirth),
                gender,
                f('id_number', d.docNumber),
                f('address', d.address),
                f('arrival_date', r.arrivalDate),
                f('departure_date', r.departureDate),
                f('room_no', roomNo),
              ],
        };
      });
      return json({
        kind: isForeign(r) ? 'foreigner_temp_residence' : 'vn_citizen_stay',
        portalUrl: 'https://dichvucong.bocongan.gov.vn/',
        people,
        clipboardText: people.map((p) => p.fields.map((f) => f.value).join('\t')).join('\n'),
      });
    }),
    http.post(
      `${prop}/registrations/:registrationId/actions/:transition`,
      async ({ request, params }) => {
        const x = c3(request, params);
        if (isResponse(x)) return x;
        const { reg, r } = x;
        const g2 = guard(request, FD_PLUS, { ifMatch: reg.version });
        if (isResponse(g2)) return g2;
        const body = (await request.json()) as Body;
        const t = String(params.transition);
        if (t === 'mark-sent') {
          if (reg.status !== 'scanned')
            return problem(409, 'INVALID_TRANSITION', { currentState: reg.status });
          const ref = String(body.portalReference ?? '').trim();
          if (!/^[A-Za-z0-9\-/._]{3,64}$/.test(ref))
            return validation([{ field: 'portalReference', code: 'PORTAL_REFERENCE_REQUIRED' }]);
          reg.status = 'sent';
          reg.portalReference = ref;
        } else if (t === 'mark-confirmed') {
          if (reg.status !== 'sent')
            return problem(409, 'INVALID_TRANSITION', { currentState: reg.status });
          reg.status = 'confirmed';
          for (const d of reg.documents) if (d.imageConsent === 'refused') d.imageIds = [];
        } else if (t === 'mark-rejected') {
          if (String(body.rejectedReason ?? '').trim().length < 3)
            return validation([{ field: 'rejectedReason', code: 'REASON_REQUIRED' }]);
          reg.status = 'scanned';
        } else return problem(404, 'NOT_FOUND');
        r.registrationStatus = reg.status as MockReservation['registrationStatus'];
        reg.version += 1;
        return json(regView(reg));
      },
    ),
    http.delete(`${prop}/registrations/:registrationId/images`, ({ request, params }) => {
      const x = c3(request, params, OWN_MGR);
      if (isResponse(x)) return x;
      const { reg } = x;
      const g2 = guard(request, OWN_MGR, { ifMatch: reg.version });
      if (isResponse(g2)) return g2;
      if (reg.documents.every((d) => !d.imageIds.length))
        return problem(409, 'INVALID_TRANSITION', { currentState: reg.status });
      for (const d of reg.documents) d.imageIds = [];
      reg.version += 1;
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(
      `${prop}/registrations/:registrationId/documents/:documentId/sensitive`,
      ({ request, params }) => {
        const x = c3(request, params);
        if (isResponse(x)) return x;
        if (needStepUp(x.g)) return problem(401, 'REAUTH_REQUIRED');
        const d = x.reg.documents.find((z) => z.id === params.documentId);
        if (!d) return problem(404, 'NOT_FOUND');
        return HttpResponse.json(
          {
            id: d.id,
            docType: d.docType,
            fullNameOnDoc: d.fullNameOnDoc,
            docNumber: d.docNumber,
            dateOfBirth: d.dateOfBirth,
            nationalityCode: d.nationalityCode,
            passportExpiryDate: d.passportExpiryDate,
            visaValidUntil: d.visaValidUntil,
            entryDate: d.entryDate,
            gender: d.gender,
            passportIssueDate: d.passportIssueDate,
            issuingPlace: d.issuingPlace,
            visaKind: d.visaKind,
            visaNumber: d.visaNumber,
            entryPort: d.entryPort,
            entryPurpose: d.entryPurpose,
            noEntryRecord: d.noEntryRecord,
            address: d.address,
          },
          { headers: { 'cache-control': 'no-store' } },
        );
      },
    ),
    // getDocumentImage (C3: trusted device, step-up, no-store) – a 3-byte JPEG stand-in.
    http.get(
      `${prop}/registrations/:registrationId/documents/:documentId/images/:imageId`,
      ({ request, params }) => {
        const x = c3(request, params);
        if (isResponse(x)) return x;
        if (needStepUp(x.g)) return problem(401, 'REAUTH_REQUIRED');
        const d = x.reg.documents.find((z) => z.id === params.documentId);
        if (!d || !d.imageIds.includes(String(params.imageId))) return problem(404, 'NOT_FOUND');
        return new HttpResponse(new Uint8Array([0xff, 0xd8, 0xff]), {
          headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' },
        });
      },
    ),
    // listAttentionItems – only the registration item of BE-C 9b (data_quality /
    // registration_party_docs_unlinked). Sprint 4: the full list is served by mocks/dashboard.ts (FE-B), which
    // adds this item through `registrationAttention()` – this handler is kept for the S3 screens' own tests.
    http.get(`${prop}/attention`, ({ request }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      return json({ data: registrationAttention() });
    }),
    // updateGuestDocument (If-Match = registration version) – same field rules as add.
    http.patch(
      `${prop}/registrations/:registrationId/documents/:documentId`,
      async ({ request, params }) => {
        const x = c3(request, params);
        if (isResponse(x)) return x;
        const { reg, r } = x;
        const g2 = guard(request, FD_PLUS, { ifMatch: reg.version });
        if (isResponse(g2)) return g2;
        const d = reg.documents.find((z) => z.id === params.documentId);
        if (!d) return problem(404, 'NOT_FOUND');
        const data = (await request.json()) as Body;
        // 0.3.7 `GuestDocumentLink` (S4-39): only `partyMemberId` – link, no C3 field touched.
        if (Object.keys(data).length === 1 && typeof data.partyMemberId === 'string') {
          const id = data.partyMemberId;
          if (!(st.party.get(r.id) ?? []).some((m) => m.id === id))
            return validation([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
          if (reg.documents.some((z) => z !== d && z.partyMemberId === id))
            return problem(409, 'PARTY_DUPLICATE');
          if (d.partyMemberId && d.partyMemberId !== id)
            return problem(409, 'INVALID_TRANSITION', { currentState: 'linked' });
          d.partyMemberId = id;
          d.fieldsPurgeAfter = null;
          recomputeReg(r, reg);
          reg.version += 1;
          return json(regView(reg));
        }
        const no = String(data.docNumber ?? d.docNumber)
          .replace(/\s/g, '')
          .toUpperCase();
        if (
          ['cccd', 'child_personal_id'].includes(String(data.docType ?? d.docType))
            ? !/^[0-9]{12}$/.test(no)
            : !/^[A-Z0-9-]{3,30}$/.test(no)
        )
          return validation([{ field: 'docNumber', code: 'DOC_NUMBER_INVALID' }]);
        if (reg.documents.some((z) => z !== d && z.docNumber === no))
          return problem(409, 'PARTY_DUPLICATE');
        // BUG-R2-083 (BE-C 9b): partyMemberId must be a person still in this booking's party, not taken by
        // another document; linking an unclaimed document keeps it (its deadline goes).
        const memberId = data.partyMemberId as string | undefined;
        if (memberId !== undefined) {
          if (!(st.party.get(r.id) ?? []).some((m) => m.id === memberId))
            return validation([{ field: 'partyMemberId', code: 'NOT_IN_LIST' }]);
          if (reg.documents.some((z) => z !== d && z.partyMemberId === memberId))
            return problem(409, 'PARTY_DUPLICATE');
        }
        const claimed = isUnclaimed(d) && !!memberId;
        // BE updateDocument keeps the capture method, the slot and the link when none is sent.
        const keep = { captureMethod: d.captureMethod, personIndex: d.personIndex };
        Object.assign(d, data, keep, {
          docNumber: no,
          noEntryRecord: data.noEntryRecord === true,
          partyMemberId: memberId ?? d.partyMemberId,
        });
        if (claimed) d.fieldsPurgeAfter = null;
        recomputeReg(r, reg);
        reg.version += 1;
        return json(regView(reg));
      },
    ),
  ];

  /**
   * 0.3.7 B-6 (#6): `expectedVersion` on approve/reject – required for `refund` (422 REQUIRED), compared
   * when sent (412 VERSION_CONFLICT + currentVersion). Not an If-Match header (FOC flow unchanged).
   */
  function versionCheck(a: MockApproval, body: Body, step: 'missing' | 'stale') {
    const sent = body.expectedVersion;
    if (step === 'missing')
      return a.type === 'refund' && (sent === undefined || sent === null)
        ? validation([{ field: 'expectedVersion', code: 'REQUIRED' }])
        : null;
    return sent !== undefined && sent !== null && Number(sent) !== (a.version ?? 1)
      ? problem(412, 'VERSION_CONFLICT', { currentVersion: a.version ?? 1 })
      : null;
  }
  /** 0.3.7 D1: the server cancels a request by itself – `cancelled` + reason, its FOC line → rejected. */
  function autoCancel(a: MockApproval, reason: string) {
    a.version = (a.version ?? 1) + 1;
    a.status = 'cancelled';
    a.autoCancelReason = reason;
    const f = a.folioId ? st.folios.get(a.folioId) : undefined;
    const line = f?.lines.find((l) => l.approvalRequestId === a.id);
    if (line) line.lineState = 'rejected';
    st.audit.unshift({
      occurredAt: nowIso(),
      actorType: 'system',
      category: 'money',
      action: 'approval.cancelled',
      entityType: 'approval_request',
      entityCode: a.reservationCode,
      before: { status: 'pending' },
      after: { status: 'cancelled', type: a.type, amountVnd: a.amountVnd },
      reason: `auto: ${reason}`,
    });
  }

  function approvalView(a: MockApproval) {
    const out: Record<string, unknown> = { ...a, version: a.version ?? 1 };
    delete out.requestedByUserId;
    delete out.folioId;
    if (a.refundDestination) {
      out.refundDestination = {
        method: a.refundDestination.method,
        bankBin: a.refundDestination.bankBin,
        accountNoLast4: a.refundDestination.accountNo?.slice(-4),
        setAt: a.refundDestination.setAt,
      };
    }
    return out;
  }

  async function executeRefund(
    request: StrictRequest<DefaultBodyType>,
    approvalId: string,
    g: { user: MockUser; roles: Role[] },
    kind: 'cash' | 'transfer',
  ) {
    const a = st.approvals.find((x) => x.id === approvalId && x.type === 'refund');
    if (!a) return problem(404, 'NOT_FOUND');
    if (a.status !== 'approved')
      return problem(409, 'INVALID_TRANSITION', { currentState: a.status });
    const dest = a.refundDestination?.method;
    if (!dest) return problem(409, 'REFUND_DESTINATION_REQUIRED');
    // E15-05: money paid by an unreconciled transfer/VietQR cannot be paid back yet.
    const unreconciled = st.payments.filter(
      (p) =>
        p.folioId === a.folioId &&
        p.status === 'succeeded' &&
        p.type !== 'refund' &&
        ['vietqr', 'bank_transfer'].includes(p.method) &&
        ['pending', 'disputed'].includes(p.reconciliation),
    );
    if (unreconciled.length)
      return problem(409, 'REFUND_SOURCE_NOT_RECONCILED', {
        paymentIds: unreconciled.map((p) => p.id),
        unreconciledVnd: unreconciled.reduce((x, p) => x + p.amountVnd, 0),
      });
    if (kind === 'cash' && dest !== 'cash') return problem(403, 'FORBIDDEN_ACTION');
    if (kind === 'transfer' && dest === 'cash')
      return problem(409, 'INVALID_TRANSITION', { currentState: a.status });
    // refunds.service.ts (PO 17/10, SEC-37): the payer is never the requester; for a transfer also never
    // the approver or whoever set the destination – except an owner paying a transfer.
    const ownerTransfer = kind === 'transfer' && g.roles[0] === 'owner';
    if (a.requestedByUserId === g.user.id && !ownerTransfer)
      return problem(403, 'SELF_REFUND_FORBIDDEN');
    if (
      kind === 'transfer' &&
      !ownerTransfer &&
      (a.approverUserId === g.user.id || a.refundDestination?.setByUserId === g.user.id)
    )
      return problem(403, 'SELF_REFUND_FORBIDDEN');
    const { key, replay } = rsv().idem(request, `refund:${a.id}`);
    if (replay) return replay;
    const body = (await request.json()) as Body;
    const errors: Array<{ field: string; code: string }> = [];
    const left = a.amountVnd - (a.refundedVnd ?? 0);
    if (!(Number(body.amountVnd) > 0))
      errors.push({ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' });
    else if (Number(body.amountVnd) > left)
      errors.push({ field: 'amountVnd', code: 'REFUND_EXCEEDS_APPROVED' });
    if ((kind === 'cash' || dest === 'bank_transfer') && !body.attachmentId)
      errors.push({ field: 'attachmentId', code: 'EVIDENCE_REQUIRED' });
    if (kind === 'transfer' && dest === 'bank_transfer' && !String(body.bankReference ?? '').trim())
      errors.push({ field: 'bankReference', code: 'REQUIRED' });
    if (errors.length) return problem(422, 'VALIDATION_FAILED', { errors, max: left });
    const r = rsv().state.reservations.find((x) => x.folioId === a.folioId)!;
    const p: MockPayment = {
      id: uid(95_000 + next()),
      code: `PT-0${st.seq}`,
      folioId: r.folioId,
      reservationCode: r.code,
      type: 'refund',
      method: kind === 'cash' ? 'cash' : 'bank_transfer',
      amountVnd: Number(body.amountVnd),
      status: 'succeeded',
      reconciliation: kind === 'cash' ? 'not_required' : 'pending',
      receivedAt: String(body.paidAt ?? nowIso()),
      recordedBy: g.user.displayName,
      recordedByUserId: g.user.id,
      recordedByRole: g.roles[0],
      approvalRequestId: a.id,
      attachmentId: body.attachmentId as string | undefined,
      note: (body.bankReference as string | undefined) ?? (body.note as string | undefined),
      version: 1,
    };
    st.payments.push(p);
    a.refundedVnd = (a.refundedVnd ?? 0) + p.amountVnd;
    syncReservation(r);
    audit(g, kind === 'cash' ? 'refund.cash_paid' : 'refund.paid', r.code, {
      amountVnd: -p.amountVnd,
      method: p.method,
    });
    return rsv().remember(key, 201, p);
  }

  /** "Cần chú ý" item of guest-link documents waiting for a person (S4-39) – also fed to mocks/dashboard.ts. */
  function registrationAttention(): AttentionItem[] {
    const found = [...st.registrations.values()]
      .filter((reg) => reg.status !== 'void' && reg.documents.some(isUnclaimed))
      .map((reg) => ({
        r: rsv().state.reservations.find((x) => x.id === reg.reservationId)!,
        due: reg.documents
          .filter(isUnclaimed)
          .map((d) => d.fieldsPurgeAfter!)
          .sort()[0]!,
      }))
      .sort((a, b) => (a.due < b.due ? -1 : 1));
    const first = found[0];
    if (!first) return [];
    return [
      {
        kind: 'data_quality',
        source: 'computed',
        severity: 'warning',
        count: found.length,
        reservationIds: found.map((f) => f.r.id),
        roomNos: [
          ...new Set(
            found
              .map((f) => currentSegment(f.r.segments, today())?.roomNo)
              .filter((x): x is string => !!x),
          ),
        ],
        dueAt: first.due,
        ...(found.length === 1 ? { refCode: first.r.code } : {}),
        link: '/registrations',
        params: { check: 'registration_party_docs_unlinked' },
      },
    ];
  }

  return {
    handlers,
    registrationAttention,
    reset() {
      st = makeState();
    },
    get state() {
      return st;
    },
  };
}
