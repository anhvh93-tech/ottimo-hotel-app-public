// MSW mock of Sprint 3 (OpenAPI 0.3.6-draft): check-in (B9/B17), stay (B13/B14/B15, party), check-out
// (B18 + summary, minibar, bill), folio + payments + VietQR, approvals + refunds (A43/A46/A46a/A47/A47a),
// audit (money), registration (EP06 – C3 on trusted devices only). BE-A/B/C build the real API in
// parallel; this file follows the spec order of checks so the UI can be built and tested now.
// Dev/test only – never bundled (main.tsx imports mocks dynamically).
import type { Role, Room } from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { todayLocal } from '../app/dates';
import type { MockReservation } from './reservations';
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
  approvalRequestId?: string;
  postedAt: string;
  postedBy?: string;
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
  recordedBy?: string;
  recordedByUserId?: string;
  recordedByRole?: Role;
  reconciledByName?: string;
  note?: string;
  attachmentId?: string;
  approvalRequestId?: string;
  version: number;
}
interface MockFolio {
  id: string;
  reservationId: string;
  status: 'open' | 'settled';
  billNo: string | null;
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
  decidedAt?: string;
  refundDestination?: {
    method: string;
    bankBin?: string;
    accountNo?: string;
    accountHolder?: string;
    setAt: string;
  };
  refundedVnd?: number;
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

const MINIBAR = [
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
          r.segments?.[0]?.roomNo,
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
          id: uid(83_000 + ++n),
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
      reminders: new Map<string, Array<Record<string, unknown>>>(),
      attachments: new Set<string>(),
      stepUpUntil: new Map<string, number>(),
      /** 0.3.6 add. 3: property parameters behind `Registration.consentNotice` (null = not set up). */
      consentNotice: { currentNoticeVersion: 'privacy-2026-10-v1', imageRetentionDays: 30 } as {
        currentNoticeVersion: string;
        imageRetentionDays: number;
      } | null,
      paymentNotConfigured: false,
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
    return st.folios.get(r.folioId)!;
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
    if (time < '06:00')
      return {
        tierPct: 100,
        baseNightVnd: base,
        amountVnd: base,
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
    Object.assign(l, labelFor(l, r.segments?.[0]?.roomNo));
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

  function regView(reg: MockRegistration) {
    const r = rsv().state.reservations.find((x) => x.id === reg.reservationId)!;
    const deadlineAt = r.registrationDeadlineAt ?? undefined;
    return {
      id: reg.id,
      reservationId: r.id,
      reservationCode: r.code,
      roomNo: r.segments?.[0]?.roomNo ?? undefined,
      guestDisplayName: r.guestName,
      arrivalDate: r.arrivalDate,
      kind: isForeign(r) ? 'foreigner_temp_residence' : 'vn_citizen_stay',
      status: reg.status,
      requiredCount: r.adults + (r.children6to11 ?? 0) + (r.childrenUnder6 ?? 0),
      submittedCount: reg.documents.length,
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
        imageConsent: d.imageConsent,
        captureMethod: d.captureMethod,
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
      checks.push({ code: 'party_count', result: all.length >= required ? 'pass' : 'fail' });
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
    if (['none', 'pre', 'partial', 'review'].includes(reg.status))
      reg.status =
        reg.documents.length === 0
          ? 'none'
          : reg.documents.length >= required
            ? 'review'
            : 'partial';
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
        priorNight:
          time < '06:00'
            ? {
                date: addDays(r.arrivalDate, -1),
                available: true,
                defaultRateVnd: earlySurcharge(r, time).amountVnd,
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
        const unmet = conditions(r).filter((c) => {
          if (c.met) return false;
          if (c.code === 'room_ready' && body.roomNotReadyOverride && c.detail !== 'OOO')
            return false;
          if (c.code === 'document_check_block' && body.documentBlockOverride && lead) return false;
          return true;
        });
        if (unmet.length)
          return problem(409, 'CHECKIN_CONDITIONS_NOT_MET', {
            unmet: unmet.map((c) => c.code),
            balanceDueVnd: totals(r).balanceDueVnd,
          });
        const errors: Array<{ field: string; code: string }> = [];
        const cards = Number(body.cardsIssued);
        if (!Number.isInteger(cards) || cards < 0 || cards > 2)
          errors.push({ field: 'cardsIssued', code: 'VALUE_OUT_OF_RANGE' });
        if (body.houseRulesSent !== true)
          errors.push({ field: 'houseRulesSent', code: 'REQUIRED' });
        const ro = body.roomNotReadyOverride as Body | undefined;
        if (ro && String(ro.reason ?? '').trim().length < 3)
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
        if (body.applyEarlySurcharge && Number(body.expectedSurchargeVnd) !== sur.amountVnd)
          return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: sur.amountVnd });
        if (ro && !lead && conditions(r).find((c) => c.code === 'room_ready' && !c.met)) {
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
        bump(r);
        return rsv().remember(key, 200, resView(r, g));
      },
    ),
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
      if (body.doorAccessHandedOver === true) {
        if (r.status !== 'in_house')
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        if (r.doorAccessHandedOverAt)
          return problem(409, 'INVALID_TRANSITION', { currentState: r.status });
        r.doorAccessHandedOverAt = nowIso();
      }
      for (const k of ['adults', 'children6to11', 'childrenUnder6'] as const)
        if (typeof body[k] === 'number') r[k] = body[k] as number;
      if (typeof body.etaTime === 'string') r.etaTime = body.etaTime;
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
      if (r.segments?.[0]) r.segments[0].toDate = r.departureDate;
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
            roomNo: r.segments?.[0]?.roomNo,
            guest: arrival.guestName,
            eta: arrival.etaTime ?? '14:00',
          });
        }
        if (body.applySurcharge && Number(body.expectedSurchargeVnd) !== s.surchargeVnd)
          return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: s.surchargeVnd });
        r.agreedCheckoutTime = time;
        if (body.applySurcharge && s.surchargeVnd > 0)
          addLine(
            r,
            {
              category: 'late_checkout',
              amountVnd: s.surchargeVnd,
              description: `late_checkout ${time} ${s.tierPct}%`,
            },
            g.user.displayName,
          );
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
        const room = ctx.db().rooms.find((z) => z.id === body.newRoomId);
        if (!room || room.id === r.roomId)
          return validation([{ field: 'newRoomId', code: 'NOT_IN_LIST' }]);
        const from = String(body.effectiveDate ?? today());
        if (from !== today()) return validation([{ field: 'effectiveDate', code: 'DATE_INVALID' }]);
        const occ = r.adults + (r.children6to11 ?? 0);
        if (occ > (room.maxOccupancy ?? 99))
          return problem(422, 'CAPACITY_EXCEEDED', { roomNo: room.roomNo, max: room.maxOccupancy });
        const status = st.roomStatus[room.roomNo] ?? 'VC';
        if (status !== 'VI' && status !== 'VC')
          return problem(409, 'ROOM_NOT_READY', { roomNo: room.roomNo, roomStatus: status });
        const clash = rsv().state.reservations.find(
          (o) =>
            o.id !== r.id &&
            o.roomId === room.id &&
            ['hold', 'confirmed', 'in_house'].includes(o.status) &&
            o.arrivalDate < r.departureDate &&
            from < o.departureDate,
        );
        if (clash)
          return problem(409, 'ROOM_UNAVAILABLE', {
            conflicts: [
              {
                roomNo: room.roomNo,
                nights: [clash.arrivalDate],
                kind: 'reservation',
                guestDisplayName: clash.guestName,
              },
            ],
            suggestions: [],
          });
        const keep = body.cause === 'property_fault';
        const newRate = room.currentListPrice?.nightlyListPriceVnd ?? 800_000;
        const nights = (r.nightlyRates ?? [])
          .filter((n) => n.date >= from)
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
        r.roomId = room.id;
        r.segments = [
          {
            roomId: room.id,
            roomNo: room.roomNo,
            fromDate: r.arrivalDate,
            toDate: r.departureDate,
          },
        ];
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
      if (!body.dryRun) {
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
      st.party.set(
        r.id,
        members.filter((z) => z !== m),
      );
      bump(r);
      return new HttpResponse(null, { status: 204 });
    }),

    // ---------- check-out (S07: B18) ----------
    http.get(`${prop}/reservations/:reservationId/minibar-standard`, ({ request, params }) => {
      const x = withRes(request, params, [...FD_PLUS, 'housekeeping']);
      if (isResponse(x)) return x;
      const latest = st.minibarChecks.get(x.r.id);
      return json({
        roomNo: x.r.segments?.[0]?.roomNo,
        items: MINIBAR,
        latestCheck: latest
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
        lines: Array<{ itemId: string; remainingQty: number }>;
      };
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
      // Second check replaces the first: reverse the previous minibar lines (BR-008 – mock drops them).
      const f = folioOf(r);
      f.lines = f.lines.filter((l) => l.category !== 'minibar');
      let total = 0;
      const lines = body.lines.map((l) => {
        const std = MINIBAR.find((m) => m.itemId === l.itemId)!;
        const used = std.standardQty - l.remainingQty;
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
      st.minibarChecks.set(r.id, body.lines);
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
      if (!st.minibarChecks.has(r.id)) blockers.push('minibar_not_checked');
      if (tt.pendingApprovals) blockers.push('pending_approvals');
      if (tt.balanceDueVnd > 0) blockers.push('balance_due');
      if (tt.unhandledCreditVnd > 0) blockers.push('credit_balance');
      const extraRate = roomOf(r)?.currentListPrice?.nightlyListPriceVnd ?? 800_000;
      const already = f.lines.find(
        (l) => l.category === 'late_checkout' && l.lineState === 'posted',
      );
      return json({
        checkoutTime: time,
        standardCheckoutTime: '12:00',
        // E05-11: after the last BR-412 tier the check-out charges one more night (no late surcharge).
        lateCheckoutSurcharge: {
          tierPct: s.treatAsExtension ? 0 : s.tierPct,
          amountVnd: already || s.treatAsExtension ? 0 : s.surchargeVnd,
        },
        extraNightRequired: s.treatAsExtension === true,
        extraNightDefaultRateVnd: s.treatAsExtension ? extraRate : undefined,
        extraNightAvailable: s.treatAsExtension ? !arrivalSameDay(r) : undefined,
        postMidnightWindow: postMidnightWindow(r),
        unhandledCreditVnd: tt.unhandledCreditVnd,
        lateSurchargeRecalc:
          already && already.amountVnd !== s.surchargeVnd
            ? { oldVnd: already.amountVnd, newVnd: s.surchargeVnd }
            : undefined,
        lines: f.lines.filter((l) => l.lineState !== 'rejected'),
        totalVnd: tt.totalVnd,
        paidVnd: tt.paidVnd,
        balanceDueVnd: tt.balanceDueVnd,
        creditVnd: tt.creditVnd,
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
        if (s.treatAsExtension && !extraNight)
          return validation([{ field: 'extraNight', code: 'LATE_CHECKOUT_AFTER_LIMIT' }]);
        if (s.treatAsExtension && extraNight && !(Number(extraNight.rateVnd) > 0))
          return validation([{ field: 'extraNight.rateVnd', code: 'RATE_OUT_OF_RANGE' }]);
        // The room is sold tonight (a same-day arrival) → no extra night (0.3.6 add. 2).
        if (s.treatAsExtension && extraNight && arrivalSameDay(r))
          return problem(409, 'ROOM_UNAVAILABLE', { roomNo: roomOf(r)?.roomNo });
        if (!st.minibarChecks.has(r.id)) return problem(409, 'MINIBAR_NOT_CHECKED');
        if (
          body.applyLateSurcharge &&
          Number(body.expectedSurchargeVnd ?? s.surchargeVnd) !== s.surchargeVnd
        )
          return problem(409, 'SURCHARGE_CHANGED', { surchargeVnd: s.surchargeVnd });
        const tt0 = totals(r);
        if (tt0.pendingApprovals)
          return problem(409, 'PENDING_APPROVALS', { pendingApprovals: tt0.pendingApprovals });
        const debt = body.debt as Body | undefined;
        if (debt && !has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
        const op = body.overpaymentHandling as Body | undefined;
        if (op?.mode === 'retain_with_guest_consent' && !has(g.roles, OWN_MGR))
          return problem(403, 'FORBIDDEN_ACTION');
        if (!s.treatAsExtension && s.surchargeVnd > 0 && body.applyLateSurcharge !== true)
          return validation([{ field: 'applyLateSurcharge', code: 'SURCHARGE_DECISION_REQUIRED' }]);
        // One transaction (ARC 0.3.6 add. 2): extra night + surcharge + payment + B18, rolled back on failure.
        const f0 = folioOf(r);
        const snap = { lines: f0.lines.length, version: f0.version, pays: st.payments.length };
        const fail = (resp: Response) => {
          f0.lines.length = snap.lines;
          f0.version = snap.version;
          st.payments.length = snap.pays;
          syncReservation(r);
          return resp;
        };
        if (s.treatAsExtension && extraNight)
          addLine(
            r,
            {
              category: 'room',
              amountVnd: Number(extraNight.rateVnd),
              description: 'extra_night',
              chargeCode: 'extra_night',
              serviceDate: r.departureDate,
            },
            g.user.displayName,
          );
        if (body.applyLateSurcharge && s.surchargeVnd > 0 && !s.treatAsExtension)
          addLine(
            r,
            {
              category: 'late_checkout',
              amountVnd: s.surchargeVnd,
              description: `late_checkout ${time} ${s.tierPct}%`,
            },
            g.user.displayName,
          );
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
            amountVnd: Number(extraNight.rateVnd),
          });
        r.status = 'checked_out';
        r.actualCheckoutAt = nowIso();
        const f = folioOf(r);
        f.status = 'settled';
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
      const f = st.folios.get(String(params.folioId));
      const r = f && rsv().find({ reservationId: f.reservationId }, g);
      if (!f || !r) return problem(404, 'NOT_FOUND');
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
    http.post(`${prop}/folios/:folioId/lines/:lineId/foc`, async ({ request, params }) => {
      const g = guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      const line = f?.lines.find((l) => l.id === params.lineId);
      if (!f || !line) return problem(404, 'NOT_FOUND');
      const r = rsv().state.reservations.find((x) => x.id === f.reservationId)!;
      const body = (await request.json()) as Body;
      const errors: Array<{ field: string; code: string }> = [];
      if (!(Number(body.amountVnd) > 0))
        errors.push({ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' });
      if (Number(body.amountVnd) > line.amountVnd)
        errors.push({ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_LINE' });
      if (body.reasonCode === 'other' && String(body.note ?? '').trim().length < 3)
        errors.push({ field: 'note', code: 'REASON_REQUIRED' });
      if (errors.length) return validation(errors);
      const a: MockApproval = {
        id: uid(89_000 + next()),
        type: String(body.kind ?? 'foc'),
        status: 'pending',
        reservationCode: r.code,
        folioId: f.id,
        folioLineId: line.id,
        amountVnd: Number(body.amountVnd),
        reasonCode: String(body.reasonCode),
        reasonNote: body.note as string | undefined,
        requestedBy: g.user.displayName,
        requestedByUserId: g.user.id,
        requestedAt: nowIso(),
      };
      st.approvals.push(a);
      addLine(
        r,
        {
          category: 'foc',
          amountVnd: -a.amountVnd,
          description: `foc ${line.id}`,
          labelParams: { reason: String(body.reasonCode) },
          lineState: 'pending_approval',
          relatedLineId: line.id,
          approvalRequestId: a.id,
        },
        g.user.displayName,
      );
      return json(a, 201);
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
      const p = recordPay(r, body, g);
      bump(r);
      return rsv().remember(key, 201, p);
    }),
    http.post(`${prop}/folios/:folioId/vietqr`, async ({ request, params }) => {
      const g = guard(request, [...FD_PLUS, 'sales_staff']);
      if (isResponse(g)) return g;
      const f = st.folios.get(String(params.folioId));
      const r = f && rsv().find({ reservationId: f.reservationId }, g);
      if (!f || !r) return problem(404, 'NOT_FOUND');
      if (st.paymentNotConfigured) return problem(409, 'PAYMENT_NOT_CONFIGURED');
      const body = (await request.json()) as Body;
      const amount = Number(body.amountVnd);
      if (!(amount > 0)) return validation([{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
      if (amount > totals(r).balanceDueVnd && !body.overBalanceReason && body.purpose !== 'deposit')
        return validation([{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }]);
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
        type: body.purpose === 'deposit' ? 'deposit' : 'charge',
        method: 'vietqr',
        amountVnd: amount,
        status: 'pending',
        reconciliation: 'pending',
        recordedBy: g.user.displayName,
        recordedByUserId: g.user.id,
        recordedByRole: g.roles[0],
        version: 1,
      };
      st.payments.push(p);
      return json(
        {
          payment: p,
          qrPayload,
          transferContent: content,
          receivingAccountMasked: '9704••••7777',
          receivingAccountRecentlyChanged: false,
        },
        201,
      );
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
        p.status = 'succeeded';
        p.receivedAt = nowIso();
        p.note = (body.note as string | undefined) ?? p.note;
        p.version += 1;
        const r = rsv().state.reservations.find((x) => x.folioId === p.folioId)!;
        syncReservation(r);
        bump(r);
        audit(g, 'payment.confirmed_received', r.code, {
          amountVnd: p.amountVnd,
          method: 'vietqr',
          reconciliation: 'pending',
        });
        return json(p);
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
      if (p.status === 'reversed')
        return problem(409, 'INVALID_TRANSITION', { currentState: p.status });
      p.status = 'reversed';
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
        locale: foreign ? 'vi_en' : 'vi',
        property: {
          name: 'OTTIMO Boutique Stay – Đà Lạt',
          address: 'Đà Lạt',
          taxCode: '••••••••••',
        },
        guestDisplayName: r.guestName,
        roomNo: r.segments?.[0]?.roomNo,
        arrivalDate: r.arrivalDate,
        departureDate: r.departureDate,
        lines: f.lines.filter((l) => l.lineState === 'posted'),
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
      const id = uid(92_000 + next());
      st.attachments.add(id);
      return json({ id, purpose: 'refund_proof', sizeBytes: 1024 }, 201);
    }),

    // ---------- approvals + refunds ----------
    http.get(`${prop}/approval-requests`, ({ request }) => {
      const g = guard(request, 'any');
      if (isResponse(g)) return g;
      const status = new URL(request.url).searchParams.get('status');
      const lead = has(g.roles, LEAD_PLUS);
      const data = st.approvals
        .filter((a) => !status || a.status === status)
        .filter(
          (a) =>
            lead ||
            a.requestedByUserId === g.user.id ||
            (a.type === 'refund' && has(g.roles, FD_PLUS)),
        )
        .map(approvalView);
      return json({ data, page: { hasMore: false } });
    }),
    http.post(
      `${prop}/approval-requests/:approvalId/actions/approve`,
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
        if (a.requestedByUserId === g.user.id) return problem(403, 'SELF_APPROVAL_FORBIDDEN');
        if (a.type === 'refund' && !has(g.roles, OWN_MGR)) return problem(403, 'FORBIDDEN_ACTION');
        if (!['pending', 'escalated'].includes(a.status))
          return problem(409, 'INVALID_TRANSITION', {
            currentState: a.status,
            approverName: a.approverName,
            decidedAt: a.decidedAt,
          });
        a.status = 'approved';
        a.approverName = g.user.displayName;
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
        if (!['pending', 'escalated'].includes(a.status))
          return problem(409, 'INVALID_TRANSITION', { currentState: a.status });
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
        };
        // SEC F8: a destination changed after approval goes back to approval.
        if (a.status === 'approved') a.status = 'pending';
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
      const data = JSON.parse(typeof raw === 'string' ? raw : await (raw as Blob).text()) as Body;
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
      const doc: MockDoc = {
        id: uid(93_000 + next()),
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
      const d =
        reg.documents.find(
          (z) => z.partyMemberId === body.partyMemberId || z.id === body.partyMemberId,
        ) ?? reg.documents[0];
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
      const roomNo = r.segments?.[0]?.roomNo ?? '';
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
        const no = String(data.docNumber ?? d.docNumber)
          .replace(/\s/g, '')
          .toUpperCase();
        if (
          ['cccd', 'child_personal_id'].includes(String(data.docType ?? d.docType))
            ? !/^[0-9]{12}$/.test(no)
            : !/^[A-Z0-9-]{3,30}$/.test(no)
        )
          return validation([{ field: 'docNumber', code: 'DOC_NUMBER_INVALID' }]);
        Object.assign(d, data, { docNumber: no, noEntryRecord: data.noEntryRecord === true });
        recomputeReg(r, reg);
        reg.version += 1;
        return json(regView(reg));
      },
    ),
  ];

  function approvalView(a: MockApproval) {
    const out: Record<string, unknown> = { ...a };
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
    // A47a / F8: the payer must differ from the person who created the refund request.
    if (a.requestedByUserId === g.user.id) return problem(403, 'SELF_APPROVAL_FORBIDDEN');
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

  return {
    handlers,
    reset() {
      st = makeState();
    },
    get state() {
      return st;
    },
  };
}
