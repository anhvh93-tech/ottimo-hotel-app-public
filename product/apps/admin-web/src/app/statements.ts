// FB-INV-012 – Monthly statements for long-stay guests (ARC contract `rounds/round-05/fb-inv-012/contract.md` §5,
// OpenAPI 0.3.14-draft). The BE PR (`r5-fb012-be-statements`) adds these operations to `openapi.yaml` and
// regenerates `@ottimo/api-client`; until then the shapes live here, typed by hand from the contract, and the
// MSW mock (`mocks/statements.ts`) answers them. When the generated types land, replace these interfaces with
// `ResponseOf<'getBillingPeriod'>` etc. and move the functions into `endpoints.ts`.
//
// INV 17/11 (FB-INV-012 "INV bổ sung", overrides contract §2.1 "đầu kỳ không cho gõ"): the opening reading of each
// meter is TYPED by staff every period. The server answers the previous closing reading next to it (reference only)
// and the gap (opening − previous closing, vacancy loss, never billed). Billed usage = closing − opening.
import type { AttachmentPurpose, AttachmentResult } from '@ottimo/api-client';
import { apiClient } from './api';

export type StatementStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
export type StatementKind = 'regular' | 'final';
/** BR-LS-02: day 05 due today, from 06 overdue, +3 days alert (red for manager), +10 days escalate. */
export type AlertLevel = 'due_today' | 'overdue' | 'alert' | 'escalate';
export type StatementAction =
  'update' | 'issue' | 'void' | 'record_payment' | 'print' | 'prior_adjustment';
export type MeterType = 'electricity' | 'water';
export type ReadingKind =
  'checkin' | 'period_end' | 'room_change_out' | 'room_change_in' | 'checkout';

export type MeterException =
  | { type: 'replaced'; oldFinal: number; newStart: number; replacedOn: string }
  | { type: 'rollover'; maxValue: number };

export interface Period {
  from: string;
  to: string;
}

/** One meter of one reading as the server answers it. */
export interface MeterValue {
  /** Typed by staff (INV 17/11). */
  opening: number;
  /** Closing reading. */
  value: number;
  exception: MeterException | null;
  /** Previous valid closing of the same room (null on the first reading of a stay) – reference only. */
  previousClosing: number | null;
  /** opening − previousClosing when > 0: vacancy loss (viewings, housekeeping), NOT billed to the guest. */
  gap: number | null;
  /** Billed usage of this reading (closing − opening, or the exception formula of BR-LS-12). */
  consumption: number;
}

export interface MeterReading {
  id: string;
  reservationId: string;
  roomId: string;
  roomNo: string;
  kind: ReadingKind;
  /** First day of the month the reading closes, as `YYYY-MM` (period_end only). */
  periodMonth: string | null;
  readOn: string;
  electricity: MeterValue;
  water: MeterValue;
  photoAttachmentId: string | null;
  photoWaived: boolean;
  note: string | null;
  readAt: string;
  readByInitials: string;
  voidedAt: string | null;
  voidReason: string | null;
  /** Used on an issued statement → voiding answers 409 READING_ON_ISSUED_STATEMENT. */
  onIssuedStatement: boolean;
}

export interface MeterInput {
  opening: number;
  value: number;
  exception: MeterException | null;
}

export interface RecordMeterReadingBody {
  roomId: string;
  kind: ReadingKind;
  periodMonth: string | null;
  readOn: string;
  electricity: MeterInput;
  water: MeterInput;
  photoAttachmentId: string | null;
  photoWaived: boolean;
  note: string | null;
}

export interface BillingCandidate {
  reservationId: string;
  roomId: string;
  roomNos: string[];
  guestDisplayName: string;
  readingStatus: 'missing' | 'recorded' | 'exception';
  draftBillingPeriodId: string | null;
}

export interface StatementLine {
  kind: 'rent' | 'electricity' | 'water' | 'service' | 'rounding' | 'prior_adjustment';
  labelKey: string;
  labelParams?: Record<string, string | number>;
  roomNo?: string;
  serviceDate?: string;
  meter?: { from: number; to: number; exception: MeterException | null };
  quantity: number;
  unit: 'month' | 'day' | 'kwh' | 'm3' | 'item';
  unitPriceNetVnd: number;
  /** null = the price already includes VAT (rent, cleaning). */
  vatRatePct: number | null;
  netVnd: number;
  vatVnd: number;
  amountVnd: number;
  folioLineId: string | null;
}

export interface StatementWarning {
  code:
    | 'METER_ANOMALY'
    | 'RENT_ALREADY_POSTED'
    | 'SERVICE_LINE_ON_OTHER_STATEMENT'
    | 'PHOTO_WAIVED'
    | 'PRICE_CHANGED_SINCE_DRAFT';
  roomNo?: string;
  meter?: MeterType;
  consumption?: number;
  threshold?: number;
}

export interface StatementTotals {
  netVnd: number;
  vatVnd: number;
  roundingVnd: number;
  totalVnd: number;
  paidVnd: number;
  balanceVnd: number;
}

export interface BillingPeriod {
  id: string;
  code: string | null;
  status: StatementStatus;
  kind: StatementKind;
  /** `YYYY-MM`. */
  month: string;
  reservationId: string;
  folioId: string;
  roomNos: string[];
  guestDisplayName: string;
  rentPeriod: Period | null;
  utilityPeriod: Period | null;
  servicePeriod: Period | null;
  dueDate: string | null;
  overdueDays: number;
  alertLevel: AlertLevel | null;
  lines: StatementLine[];
  /** Service lines of the period the desk moved to the next statement (BR-LS-14) – still listed, not billed. */
  excludedLines?: StatementLine[];
  priorAdjustment?: { amountVnd: number; reason: string } | null;
  totals: StatementTotals;
  warnings: StatementWarning[];
  availableActions: StatementAction[];
  replacesId: string | null;
  replacesCode?: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason?: string | null;
  version: number;
}

export interface BillingPeriodSummary {
  id: string;
  code: string | null;
  roomNos: string[];
  guestDisplayName: string;
  month: string;
  totalVnd: number;
  balanceVnd: number;
  dueDate: string | null;
  status: StatementStatus;
  overdueDays: number;
  alertLevel: AlertLevel | null;
}

export interface BillingPeriodPrint extends BillingPeriod {
  property: { displayName: string; addressLine: string; hotline: string; email: string };
  guest: { fullName: string };
  vietqr: {
    payload: string;
    bankShortName: string;
    accountHolder: string;
    accountNoMasked: string;
    amountVnd: number;
    transferContent: string;
  } | null;
  printedAt: string;
  printedByInitials: string;
}

export interface RecordStatementPaymentBody {
  method: 'cash' | 'vietqr';
  amountVnd: number;
  receivedAt?: string;
  note?: string | null;
}

export interface VoidResult {
  billingPeriod: BillingPeriod;
  canReplace: boolean;
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
  /** Meter photo (attachment C2 `purpose=meter`, contract §2.1) – the purpose is not yet in the generated union. */
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
    r<VoidResult>('POST', `${PROP}/billing-periods/{id}/void`, {
      path: { propertyId, id },
      body: { reason },
    }),
  recordBillingPeriodPayment: (
    propertyId: string,
    id: string,
    body: RecordStatementPaymentBody,
    idem: string,
  ) =>
    r<BillingPeriod>('POST', `${PROP}/billing-periods/{id}/payments`, {
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
 * Billed usage of one meter (BR-LS-11/12, INV 17/11): closing − opening; meter replaced = (old final − opening) +
 * (closing − new start); rollover = (max + 1 − opening) + closing. Water keeps one decimal (the desk drops the rest).
 */
export function meterUsage(m: MeterInput, type: MeterType): number {
  const e = m.exception;
  const raw =
    e?.type === 'replaced'
      ? e.oldFinal - m.opening + (m.value - e.newStart)
      : e?.type === 'rollover'
        ? e.maxValue + 1 - m.opening + m.value
        : m.value - m.opening;
  return type === 'water' ? Math.round(raw * 10) / 10 : Math.round(raw);
}

/** Tone of a statement row/chip – only the 80/15/5 palette (contract §6.1: Earth Brown for overdue, no extra red). */
export function statusTone(
  status: StatementStatus,
  alert: AlertLevel | null,
): { tone: 'neutral' | 'oak' | 'ink' | 'long'; className?: string } {
  if (status === 'paid') return { tone: 'long' };
  if (status === 'void') return { tone: 'neutral' };
  if (alert && alert !== 'due_today')
    return { tone: 'neutral', className: `stmt-overdue${alert === 'overdue' ? '' : ' strong'}` };
  if (alert === 'due_today') return { tone: 'oak' };
  if (status === 'draft') return { tone: 'neutral' };
  return { tone: 'ink' };
}
