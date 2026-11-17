// FB-INV-012 – Monthly statements for long-stay guests (ARC contract `rounds/round-05/fb-inv-012/contract.md` §5,
// OpenAPI 0.3.14-draft). The BE PR (`r5-fb012-be-statements`, #190) adds these operations to `openapi.yaml` and
// regenerates `@ottimo/api-client`; until it merges the shapes live here and the MSW mock (`mocks/statements.ts`)
// answers them (`__tests__/fb012-mock-schema.test.ts` checks the mock against the OpenAPI schemas). When #190 merges,
// replace these interfaces with `ResponseOf<'getBillingPeriod'>` etc. and move the functions into `endpoints.ts`
// (ARC-FE-189-05, merge condition).
//
// Shapes follow OpenAPI on the BE branch plus the fields ARC asked BE to add (review ARC-on-fe-pr-189 §1):
// `excludedLines`, `replacesCode`, `readByInitials`, `onIssuedStatement`, candidate `rooms[]`,
// `acknowledgeLowerThanPrevious`, `lateReason`. INV 17/11: the opening reading is its own reading (`period_start` of
// the month opened, or `checkin` / `room_change_in`), typed by staff; the server answers the previous closing on it
// (reference only) and the gap (vacancy use, never billed). Billed usage = closing − opening, on the closing reading.
import type { AttachmentPurpose, AttachmentResult } from '@ottimo/api-client';
import { apiClient } from './api';

export type StatementStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
export type StatementKind = 'regular' | 'final';
/** BR-LS-02: day 05 due today, from 06 overdue, +3 days alert (red for manager), +10 days escalate. */
export type AlertLevel = 'due_today' | 'overdue' | 'alert' | 'escalate';
export type StatementAction =
  'update' | 'issue' | 'void' | 'record_payment' | 'print' | 'prior_adjustment';
export type MeterType = 'electricity' | 'water';
/** Opening: `checkin`, `period_start`, `room_change_in`. Closing: `period_end`, `room_change_out`, `checkout`. */
export type ReadingKind =
  | 'checkin'
  | 'period_start'
  | 'period_end'
  | 'room_change_out'
  | 'room_change_in'
  | 'checkout';
export const OPENING_KINDS: readonly ReadingKind[] = ['checkin', 'period_start', 'room_change_in'];
export const isOpeningKind = (k: ReadingKind) => OPENING_KINDS.includes(k);

export type MeterException =
  | { type: 'replaced'; oldFinal: number; newStart: number; replacedOn: string }
  | { type: 'rollover'; maxValue: number };

export interface Period {
  from: string;
  to: string;
}

/** One meter of one reading (OpenAPI `MeterValue`). */
export interface MeterValue {
  value: number;
  exception?: MeterException | null;
}

export interface MeterPair {
  electricity: number | null;
  water: number | null;
}

/** OpenAPI `MeterReading` (+ `readByInitials`, `onIssuedStatement` – BE-190-04). */
export interface MeterReading {
  id: string;
  reservationId: string;
  roomId: string;
  roomNo: string;
  kind: ReadingKind;
  /** `YYYY-MM`: month opened (`period_start`) or closed (`period_end`). */
  periodMonth?: string | null;
  readOn: string;
  electricity: MeterValue;
  water: MeterValue;
  /** Opening readings: latest closing of the room (any stay) – reference only (INV 17/11). */
  previousClosing?: {
    readingId: string;
    readOn: string;
    electricity: number;
    water: number;
  } | null;
  /** Opening readings: opening − previous closing. > 0 vacancy use (not billed); < 0 a lower opening, acknowledged. */
  gap?: MeterPair | null;
  /** Closing readings: billed usage against the opening of the same period. */
  consumption?: { fromReadingId: string; electricity: number | null; water: number | null } | null;
  photoAttachmentId?: string | null;
  photoWaived?: boolean;
  exceptionApproved?: boolean;
  note?: string | null;
  readByRole?: string;
  readByInitials?: string | null;
  voided: boolean;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt?: string;
  version: number;
  /** On an issued statement → voiding answers 409 READING_ON_ISSUED_STATEMENT. */
  onIssuedStatement?: boolean;
}

/** OpenAPI `MeterValueInput`. */
export interface MeterInput {
  value: number;
  exception?: MeterException | null;
}

/** OpenAPI `MeterReadingCreate` (+ `acknowledgeLowerThanPrevious` BE-190-01, `lateReason` BE-190-03). */
export interface RecordMeterReadingBody {
  roomId: string;
  kind: ReadingKind;
  periodMonth?: string;
  readOn: string;
  electricity: MeterInput;
  water: MeterInput;
  photoAttachmentId?: string;
  photoWaived?: boolean;
  note?: string | null;
  acknowledgeLowerThanPrevious?: boolean;
  lateReason?: string;
}

export type ReadingStatus = 'missing' | 'recorded' | 'exception' | 'not_needed';

/** BE-190-02 `rooms[]`: readings of the utility period of the statement, and the opening of the next month. */
export interface CandidateRoom {
  roomId: string;
  roomNo: string;
  opening: ReadingStatus;
  closing: ReadingStatus;
  nextOpening: 'missing' | 'recorded' | 'not_needed';
}

/** One item of OpenAPI `BillingCandidateList`. */
export interface BillingCandidate {
  reservationId: string;
  reservationCode: string;
  roomNos: string[];
  rooms: CandidateRoom[];
  guestDisplayName?: string | null;
  kind: StatementKind;
  readingStatus: ReadingStatus;
  draftId?: string | null;
}

/** OpenAPI `BillingPeriodLine`. */
export interface StatementLine {
  kind: 'rent' | 'electricity' | 'water' | 'service' | 'rounding' | 'prior_adjustment';
  labelKey: string;
  labelParams?: Record<string, unknown> | null;
  roomNo?: string | null;
  serviceDate?: string | null;
  meter?: { from: number; to: number; exception?: MeterException | null } | null;
  quantity: number;
  unit: 'month' | 'day' | 'kwh' | 'm3' | 'item';
  unitPriceNetVnd: number;
  /** null = the price already includes VAT (rent, services). */
  vatRatePct?: number | null;
  netVnd: number;
  vatVnd: number;
  amountVnd: number;
  folioLineId?: string | null;
}

export const KNOWN_WARNINGS = [
  'METER_ANOMALY',
  'RENT_ALREADY_POSTED',
  'SERVICE_LINE_ON_OTHER_STATEMENT',
  'PHOTO_WAIVED',
  'OPENING_BELOW_PREVIOUS_CLOSING',
  'READING_LATE',
] as const;
export type KnownWarningCode = (typeof KNOWN_WARNINGS)[number];

/** OpenAPI `BillingWarning`: `code` + open fields – an unknown code is shown generically and still confirmed. */
export interface StatementWarning {
  code: string;
  roomNo?: string;
  meter?: MeterType;
  consumption?: number;
  threshold?: number;
  opening?: number;
  previousClosing?: number;
  [k: string]: unknown;
}

export interface StatementTotals {
  netVnd: number;
  vatVnd: number;
  roundingVnd: number;
  totalVnd: number;
  paidVnd: number;
  balanceVnd: number;
}

export interface MissingMeterReading {
  roomId: string;
  roomNo: string;
  kind: 'opening' | 'period_end' | 'room_change_out';
  periodMonth: string;
}

/** OpenAPI `BillingPeriod` (+ `excludedLines`, `replacesCode` – BE-190-04). */
export interface BillingPeriod {
  id: string;
  code?: string | null;
  status: StatementStatus;
  kind: StatementKind;
  /** `YYYY-MM`. */
  month: string;
  reservationId: string;
  reservationCode?: string;
  folioId: string;
  roomNos: string[];
  guestDisplayName?: string | null;
  rentPeriod?: Period | null;
  utilityPeriod?: Period | null;
  servicePeriod?: Period | null;
  dueDate?: string | null;
  overdueDays?: number;
  alertLevel?: AlertLevel | null;
  lines: StatementLine[];
  /** Service lines moved to the next statement (BR-LS-14) – listed, not billed; `[]` once issued. */
  excludedLines: StatementLine[];
  excludedFolioLineIds?: string[];
  missingReadings?: MissingMeterReading[];
  priorAdjustment?: { amountVnd: number; reason: string } | null;
  note?: string | null;
  totals: StatementTotals;
  warnings: StatementWarning[];
  availableActions: StatementAction[];
  replacesId?: string | null;
  replacesCode?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  version: number;
}

/** OpenAPI `BillingPeriodVoided`. */
export type BillingPeriodVoided = BillingPeriod & { canReplace: boolean };

/** OpenAPI `BillingPeriodPaymentResult`. */
export interface BillingPeriodPaymentResult {
  billingPeriod: BillingPeriod;
  payment: {
    id: string;
    method: string;
    amountVnd: number;
    status: string;
    reconciliation: string;
  };
}

/** OpenAPI `BillingPeriodSummary`. */
export interface BillingPeriodSummary {
  id: string;
  code?: string | null;
  reservationId: string;
  roomNos: string[];
  guestDisplayName?: string | null;
  month: string;
  kind: StatementKind;
  totalVnd?: number | null;
  balanceVnd: number;
  dueDate?: string | null;
  status: StatementStatus;
  overdueDays: number;
  alertLevel?: AlertLevel | null;
}

/** OpenAPI `BillingPeriodPrint`. */
export interface BillingPeriodPrint extends BillingPeriod {
  property: {
    displayName?: string | null;
    addressLine?: string | null;
    hotline?: string | null;
    email?: string | null;
  };
  guest: { fullName?: string | null };
  vietqr?: {
    payload: string;
    bankShortName?: string | null;
    accountHolder: string;
    accountNoMasked: string;
    amountVnd: number;
    transferContent: string;
  } | null;
  printedAt: string;
  printedByInitials?: string | null;
}

/** OpenAPI `BillingPeriodPaymentCreate`. */
export interface RecordStatementPaymentBody {
  method: 'cash' | 'vietqr';
  amountVnd: number;
  receivedAt?: string | null;
  note?: string | null;
  bankReference?: string | null;
}

const PROP = '/v1/properties/{propertyId}';
const r = apiClient.request.bind(apiClient);

export const statementsApi = {
  listMeterReadings: (propertyId: string, reservationId: string) =>
    r<{ items: MeterReading[] }>('GET', `${PROP}/reservations/{reservationId}/meter-readings`, {
      path: { propertyId, reservationId },
    }),
  recordMeterReading: (
    propertyId: string,
    reservationId: string,
    body: RecordMeterReadingBody,
    idem: string,
  ) =>
    r<MeterReading>('POST', `${PROP}/reservations/{reservationId}/meter-readings`, {
      path: { propertyId, reservationId },
      body,
      idempotencyKey: idem,
    }),
  voidMeterReading: (propertyId: string, readingId: string, reason: string) =>
    r<MeterReading>('POST', `${PROP}/meter-readings/{readingId}/void`, {
      path: { propertyId, readingId },
      body: { reason },
    }),
  /**
   * Meter photo (attachment C2 `purpose=meter`, contract §2.1). One file binds to one record, so a photo used by
   * the closing and the next opening is uploaded twice (ARC-FE-189-01). The OpenAPI upload enum has `meter` on the
   * BE branch; the cast goes when the client is regenerated (ARC-FE-189-06).
   */
  uploadMeterPhoto: (propertyId: string, reservationId: string, file: Blob, idem: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('purpose', 'meter' as AttachmentPurpose);
    form.append('reservationId', reservationId);
    return r<AttachmentResult>('POST', `${PROP}/attachments`, {
      path: { propertyId },
      form,
      idempotencyKey: idem,
    });
  },
  listBillingCandidates: (propertyId: string, month: string) =>
    r<{ month: string; items: BillingCandidate[] }>('GET', `${PROP}/billing-periods/candidates`, {
      path: { propertyId },
      query: { month },
    }),
  listBillingPeriods: (
    propertyId: string,
    query: { status?: string; month?: string; overdue?: boolean; roomId?: string; cursor?: string },
  ) =>
    r<{ items: BillingPeriodSummary[]; page: { nextCursor: string | null } }>(
      'GET',
      `${PROP}/billing-periods`,
      { path: { propertyId }, query },
    ),
  createBillingPeriod: (
    propertyId: string,
    reservationId: string,
    body: { month: string; kind: StatementKind },
    idem: string,
  ) =>
    r<BillingPeriod>('POST', `${PROP}/reservations/{reservationId}/billing-periods`, {
      path: { propertyId, reservationId },
      body,
      idempotencyKey: idem,
    }),
  getBillingPeriod: (propertyId: string, id: string) =>
    r<BillingPeriod>('GET', `${PROP}/billing-periods/{id}`, { path: { propertyId, id } }),
  updateBillingPeriod: (
    propertyId: string,
    id: string,
    version: number,
    body: {
      excludedFolioLineIds?: string[];
      priorAdjustment?: { amountVnd: number; reason: string } | null;
      note?: string | null;
    },
  ) =>
    r<BillingPeriod>('PATCH', `${PROP}/billing-periods/{id}`, {
      path: { propertyId, id },
      body,
      ifMatch: version,
    }),
  issueBillingPeriod: (
    propertyId: string,
    id: string,
    version: number,
    acknowledgeWarnings: boolean,
    idem: string,
  ) =>
    r<BillingPeriod>('POST', `${PROP}/billing-periods/{id}/issue`, {
      path: { propertyId, id },
      body: { acknowledgeWarnings },
      ifMatch: version,
      idempotencyKey: idem,
    }),
  voidBillingPeriod: (propertyId: string, id: string, reason: string) =>
    r<BillingPeriodVoided>('POST', `${PROP}/billing-periods/{id}/void`, {
      path: { propertyId, id },
      body: { reason },
    }),
  recordBillingPeriodPayment: (
    propertyId: string,
    id: string,
    body: RecordStatementPaymentBody,
    idem: string,
  ) =>
    r<BillingPeriodPaymentResult>('POST', `${PROP}/billing-periods/{id}/payments`, {
      path: { propertyId, id },
      body,
      idempotencyKey: idem,
    }),
  getBillingPeriodPrint: (propertyId: string, id: string) =>
    r<BillingPeriodPrint>('GET', `${PROP}/billing-periods/{id}/print`, {
      path: { propertyId, id },
    }),
};

/** `YYYY-MM` of a `YYYY-MM-DD` day. */
export const monthOf = (day: string) => day.slice(0, 7);

/** `YYYY-MM` shifted by `n` months. */
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Last day (`YYYY-MM-DD`) of a `YYYY-MM` month. */
export function lastDayOf(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m, 0));
  return `${month}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Month whose end-of-month readings the desk is most likely entering on `day`: the current month on its last day,
 * otherwise the month before (day 01 still closes it, BR-LS-10).
 */
export const readingMonthOn = (day: string) =>
  day === lastDayOf(monthOf(day)) ? monthOf(day) : shiftMonth(monthOf(day), -1);

/**
 * Typed meter value cut to the unit of the server (BR-LS-11, ARC-FE-189-08): kWh whole, m³ one decimal; the extra
 * digits are DROPPED on the typed text (no float maths), so the preview matches the server.
 */
export function parseMeter(raw: string, type: MeterType): number | null {
  const s = raw.trim().replace(',', '.');
  const m = /^(\d+)(?:\.(\d*))?$/.exec(s);
  if (!m) return null;
  if (type === 'electricity') return Number(m[1]);
  return Number(`${m[1]}.${(m[2] ?? '').slice(0, 1) || '0'}`);
}

/**
 * Billed usage PREVIEW of one meter (BR-LS-11/12): closing − opening; meter replaced = (old final − opening) +
 * (closing − new start); rollover = (max + 1 − opening) + closing. Once saved the desk shows the server's
 * `consumption`, never this number.
 */
export function meterUsage(opening: number, m: MeterInput, type: MeterType): number {
  const e = m.exception;
  const raw =
    e?.type === 'replaced'
      ? e.oldFinal - opening + (m.value - e.newStart)
      : e?.type === 'rollover'
        ? e.maxValue + 1 - opening + m.value
        : m.value - opening;
  return type === 'water' ? Math.round(raw * 10) / 10 : Math.round(raw);
}

/** Tone of a statement row/chip – only the 80/15/5 palette (contract §6.1: Earth Brown for overdue, no extra red). */
export function statusTone(
  status: StatementStatus,
  alert: AlertLevel | null | undefined,
): { tone: 'neutral' | 'oak' | 'ink' | 'long'; className?: string } {
  if (status === 'paid') return { tone: 'long' };
  if (status === 'void') return { tone: 'neutral' };
  if (alert && alert !== 'due_today')
    return { tone: 'neutral', className: `stmt-overdue${alert === 'overdue' ? '' : ' strong'}` };
  if (alert === 'due_today') return { tone: 'oak' };
  if (status === 'draft') return { tone: 'neutral' };
  return { tone: 'ink' };
}
