/**
 * Folio – the money side of a booking (erd 4.6, SM-13; BR-008, BR-305, BR-434, BR-903/904; DATA erd 8).
 *
 * Public API for the reservations (BE-A) and payments modules, always in the caller's transaction:
 * - openForReservation()      one `open` folio per primary booking (reservation.folio_id points at it).
 * - onReservationConfirmed()  B2/B4/B12: room line per sold night (snapshot price, stay_night_id), extra-person
 *                             lines (BR-110), commission `projected` (SM-11, BR-903) and OTA channel fee
 *                             (BR-901), each allocated over the nights of stay_night (erd 8, Σ = total).
 * - resyncStay()              B7/B8/B13/B16/PATCH people: same full sync (reversal + repost – DOM BE-02/03).
 * - onReservationVoided()     B5/B6/B10/B11/relocation: commissions → `void` (SM-11).
 * - voidStay()                FOLIO_STAY_SYNC (BE-A port): reversal of the voided nights' lines + one fee line
 *                             for the retained money (DOM BE-01).
 * stay_night allocations go through reservations/public StayNightAllocationService (ARC S2-07).
 * - lock()/totals()/view()    for payments (deposit B4) and getFolio.
 * FOC/discount lines are linked to approvals (SM-10) by FolioFocService (approval hooks, BR-434).
 *
 * Line `description` of system lines is a neutral code (`room_night`, `extra_guest xN`); clients render by
 * category + serviceDate in the UI language (erd `description_i18n` – R3).
 * Rules: lines are only INSERTed (amounts never updated – a correction is a reversal + new line, BR-008); every
 * posting writes `audit_event` category money in the same transaction (recordMoney); lock order
 * reservation (caller) → folio FOR UPDATE; numbers come from parameters/snapshots, never from code.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { FolioLineCategory } from '../../../db/schema/folio';
import { problem } from '../../../shared/problem';
import { type LocalDate, localDate, toZonedIso } from '../../../shared/time';
import {
  ApprovalService,
  type FocCancelReason,
  type FocState,
  type FocView,
  type LineChange,
} from '../../approvals/public/approval.service';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { ChannelsService } from '../../platform/public/channels';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { divideRoundVnd } from '../../platform/public/money';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { applyPct } from '../../reservations/public/pricing';
import type { FolioStaySync, VoidStayInput } from '../../reservations/public/folio-sync-port';
import type { ConfirmedStay } from '../../reservations/public/sales-port';
import { StayNightAllocationService } from '../../reservations/public/stay-night-allocation';
import { allocate } from './allocate';
import { lineLabel } from './line-labels';
import {
  type ReductionRequest,
  allocateKey,
  focDateMap,
  itemKeyCode,
  keyKindOf,
  keyOf,
  previewNightReductions,
  type NightReductionPreview,
} from './reductions';
import { type OpenRefund, refundPlan } from './refund-plan';

export { focDateMap } from './reductions';

/**
 * S4-08 (BR-309 v0.3.4, ARC 0.3.7 D1 assumption (b) – DOM to confirm): charge lines of a booking that are
 * "services" for a cancellation / no-show – reversed by default, kept only with a reason (`retainLines`).
 */
/** Lines that follow their night when a booking is cancelled / marked no-show (BR-309 v0.3.8, DOM-S4-13). */
const NIGHT_FOLLOWERS: ReadonlySet<string> = new Set([
  'room',
  'extra_person',
  'room_change_difference',
]);

/** Reason of the reversal of a room-change difference voided with its night – B12 posts it again. */
const DIFFERENCE_VOID_REASON = 'night voided with its booking (BR-429 (c))';

export { type OpenRefund, refundPlan };

export const SERVICE_CATEGORIES: ReadonlySet<string> = new Set([
  'early_checkin',
  'late_checkout',
  'minibar',
  'fnb',
  'laundry',
  'cleaning',
  'service_fee',
  'utilities',
]);

/** OpenAPI CancellationQuote.serviceLines[] (S4-08). */
export interface ServiceLineQuote {
  lineId: string;
  category: FolioLineCategory;
  labelKey: string;
  labelParams?: Record<string, string | number>;
  serviceDate?: string;
  /** Net of the FOC / discounts applied on it now. */
  amountVnd: number;
  performed: boolean;
  retained: boolean;
  retainReason?: string;
}

/** What a cancellation / no-show does to the money of the folio (dryRun = write – ONE function). */
export interface CloseStayPreview {
  serviceLines: ServiceLineQuote[];
  serviceReversedVnd: number;
  serviceRetainedVnd: number;
  /** S4-06: the refund request the close creates – overpayment after fee and reversals, OTA money excluded. */
  refundRequestVnd: number;
}

/** OpenAPI ApprovalRequest.lineChangedNote.cause – why a reduced line was re-written (S4-18). */
export type LineChangeCause = LineChange['cause'];

/** Options of the FOC key sync (syncReductions). */
export interface ReductionSyncOptions {
  userId: string | null;
  requestId?: string;
  /** Why the lines were re-written (lineChangedNote.cause); default by the category of the key. */
  cause?: LineChangeCause;
  /** B12 (BR-315 (g)): dates of the nights sold again – the FOC suspended at the no-show comes back. */
  restoreDates?: ReadonlySet<string>;
  /**
   * DOM-S4-15 (BR-434 v0.3.8): B12 of this booking – the FOC suspended at the no-show on a service line the desk
   * kept (`retainLines`) comes back with it.
   */
  restoreReservationId?: string;
  /** Requests whose key moved to another date in this sync: id → previous date (lineChangedNote dates). */
  movedFrom?: ReadonlyMap<string, string>;
}

/** Open / alive foc + special_discount request of a folio with its key (FolioService.reductionRequests). */
export interface FolioReductionRequest extends ReductionRequest {
  targetCode: string | null;
  folioLineId: string;
  lineChange: LineChange | null;
  /** foc_service_date as stored (null = not stored yet: legacy row or line key). */
  storedServiceDate: string | null;
}

export type RevenueGroup = 'room' | 'other' | 'non_revenue';

/**
 * Charges an `ota_prepaid` booking has paid to the OTA (BR-307 "Đã thu qua OTA" = the room charge the OTA
 * billed, DOM S3-2 OTA-kept fees). NOT `extra_person` (DOM 17/10, BR-110): people above max(standard
 * occupancy, OTA guest count) pay their surcharge at the desk – it stays due on the folio.
 */
export const OTA_COVERED: ReadonlySet<string> = new Set([
  'room',
  'cancellation_fee',
  'no_show_fee',
  'early_departure_fee',
]);
export type PayeeType = 'agent' | 'staff';

/** Revenue group of a charge category (BR-904: room revenue excludes surcharges, minibar, fees). */
export function revenueGroupOf(category: FolioLineCategory): RevenueGroup {
  return category === 'room' ? 'room' : 'other';
}

export type LineSource =
  'manual' | 'system' | 'minibar_check' | 'extension' | 'checkin' | 'checkout' | 'guest_app';

/** One line for FolioPort.postLines (BE-A: late checkout, room change difference, deposit forfeit…). */
export interface FolioLineInput {
  /** Default: the folio's primary booking. */
  reservationId?: string | null;
  category: FolioLineCategory;
  revenueGroup?: RevenueGroup;
  description: string;
  quantity: number;
  unitPriceVnd: number;
  /** Default round(quantity × unitPriceVnd). */
  amountVnd?: number;
  /** Default: today (property calendar date). */
  serviceDate?: LocalDate | null;
  stayNightId?: string | null;
  source: LineSource;
  lineState?: 'posted' | 'pending_approval';
  relatedLineId?: string | null;
  chargeCode?: string | null;
  note?: string | null;
  reason?: string | null;
  evidenceAttachmentIds?: readonly string[] | null;
  /** Params of the printable label (line-labels.ts – DOM BE-21), e.g. {time: '13:00', pct: 30}. */
  labelParams?: Record<string, string | number> | null;
}

/** Who posts (null = system job) + display code for the money audit. */
export interface FolioActor {
  userId: string | null;
  requestId?: string;
  reservationCode?: string;
}

export interface SyncResult {
  roomVnd: number;
  extraPersonVnd: number;
  reversedVnd: number;
  commissionVnd: number;
}

interface LiveLine {
  id: string;
  category: FolioLineCategory;
  revenue_group: RevenueGroup;
  description: string;
  quantity: string;
  unit_price_vnd: number;
  amount_vnd: number;
  service_date: string | null;
  stay_night_id: string | null;
  related_line_id: string | null;
  approval_request_id?: string | null;
  label_params?: Record<string, string | number> | null;
}

export interface FolioRow {
  id: string;
  property_id: string;
  primary_reservation_id: string;
  status: 'open' | 'settled' | 'closed';
  bill_no: string | null;
  post_checkout_window_until: Date | null;
  version: number;
}

export interface FolioLineRow {
  id: string;
  folio_id: string;
  reservation_id: string | null;
  category: FolioLineCategory;
  revenue_group: RevenueGroup;
  description: string;
  service_date: string | null;
  quantity: string;
  unit_price_vnd: number;
  amount_vnd: number;
  vat_rate_pct: string | null;
  line_state: 'posted' | 'pending_approval' | 'rejected';
  related_line_id: string | null;
  reversal_of_id: string | null;
  approval_request_id: string | null;
  stay_night_id: string | null;
  charge_code: string | null;
  label_params: Record<string, string | number> | null;
  posted_at: Date;
  posted_by: string | null;
  posted_by_name: string | null;
}

export interface PaymentRowLite {
  id: string;
  code: string;
  type: string;
  method: string;
  amount_vnd: number;
  status: string;
  received_at: Date | null;
  recorded_by: string | null;
  recorded_by_name: string | null;
  recorded_by_role: string | null;
  reconciliation: string;
  reconciled_at: Date | null;
  reconciled_by: string | null;
  reconciled_by_name: string | null;
  reconciliation_note: string | null;
  self_reconciled: boolean;
  payer_name: string | null;
  card_brand: string | null;
  card_last4: string | null;
  reversal_of_id: string | null;
  expires_at: Date | null;
  method_detail: string | null;
  note: string | null;
  attachment_id: string | null;
  confirmed_at: Date | null;
  confirmed_by: string | null;
  confirmed_by_name: string | null;
  reservation_id: string | null;
  approval_request_id: string | null;
  shift_id: string | null;
  received_amount_vnd: number | null;
  provider: string | null;
  version: number;
  /** 0065 (DOM (f)): purpose of a VietQR and the inputs of its cap. */
  qr_purpose?: string | null;
  qr_context?: Record<string, unknown> | null;
}

export interface FolioTotals {
  roomVnd: number;
  otherVnd: number;
  focVnd: number;
  totalVnd: number;
  /** Received – refunds NOT deducted (ARC 16.20). */
  paidVnd: number;
  /** ARC 16.20 (BUG-R2-102): refunded, positive (succeeded refund rows) – moneyPosition.refundedVnd. */
  refundedVnd: number;
  paidViaOtaVnd: number;
  depositHeldVnd: number;
  balanceDueVnd: number;
  /** 0.3.6 A-34: received (incl. receipts waiting for reconciliation) − total − refunded, when > 0. */
  creditVnd: number;
  /** 0.3.6 bổ sung 2 (E15-05): creditVnd − open refund requests. */
  unhandledCreditVnd: number;
  /** 0.3.6 bổ sung 2 (DOM BE-13): OTA collected beyond the OTA-covered charges. */
  otaExcessVnd: number;
}

/**
 * Money balance of a folio (FolioPort.balance – BE-A check-in/stay/check-out, credit_balance blocker).
 * Review S3 (DOM BE-13/14, ARC 13, OpenAPI 0.3.6 bổ sung 2 E15-05): `creditVnd` here is the overpayment NOT
 * yet routed to a refund request (= `unhandledCreditVnd` of the contract) – B16/B18/cancellation create at most
 * this amount, so a still-unpaid B16 refund never gets a second request at B18. The contract's `creditVnd`
 * (shown on Folio/CheckoutSummary) is `rawCreditVnd`. Money OTA collected beyond the OTA-covered charges is
 * OTA's (`otaExcessVnd`), never OTTIMO credit.
 */
export interface FolioBalance {
  totalVnd: number;
  paidVnd: number;
  refundedVnd: number;
  balanceDueVnd: number;
  /** = unhandledCreditVnd (kept under this name for the existing B16/B18/cancellation callers). */
  creditVnd: number;
  /** Contract `unhandledCreditVnd`: rawCreditVnd − openRefundVnd (≥ 0). */
  unhandledCreditVnd: number;
  /** Contract `creditVnd`: own receipts (incl. pending reconciliation) − refunded − what OTA did not cover. */
  rawCreditVnd: number;
  /** Σ (amount − refunded) of the refund requests still open (pending / escalated / approved not fully paid). */
  openRefundVnd: number;
  /** Part of the overpayment that may be PAID OUT: only receipts reconciled or needing none (cash, POS). */
  payableCreditVnd: number;
  /** rawCreditVnd − payableCreditVnd: overpayment backed by receipts not reconciled yet. */
  unreconciledVnd: number;
  /** Own receipts still pending/disputed – why payable < raw (DOM BE-14 c, REFUND_SOURCE_NOT_RECONCILED). */
  unsettledPaymentIds: string[];
  unsettledPaymentCodes: string[];
  /** OTA collected beyond the OTA-covered charges (OTA refunds the guest – DOM BE-13). */
  otaExcessVnd: number;
}

type TotalsPayment = Pick<PaymentRowLite, 'type' | 'method' | 'amount_vnd' | 'status'> & {
  id?: string;
  reversal_of_id?: string | null;
  reconciliation?: string;
  received_amount_vnd?: number | null;
  code?: string;
  reservation_id?: string | null;
};

type TotalsLine = Pick<FolioLineRow, 'amount_vnd' | 'line_state'> &
  Partial<Pick<FolioLineRow, 'id' | 'category' | 'reservation_id' | 'related_line_id'>>;

/** Money position of a folio – the ONE computation behind totals, balance, refund caps and the bill. */
export interface MoneyPosition {
  totalVnd: number;
  /** Receipts (refunds excluded), OTA included. */
  paidVnd: number;
  /** `ota_collect` receipts (BR-307 – OTA collected for us). */
  paidOtaVnd: number;
  /** OTA-covered charges (room, extra person, OTA-kept fees of the OTA booking, net of FOC/discount). */
  otaCoveredVnd: number;
  /** paidOtaVnd − what it pays of the OTA-covered charges (OTA's money – never OTTIMO credit). */
  otaExcessVnd: number;
  refundedVnd: number;
  depositHeldVnd: number;
  balanceDueVnd: number;
  /** OTTIMO overpayment (OTA excess excluded – DOM BE-13 b). */
  creditVnd: number;
  /** Overpayment backed by settled own money (reconciled / not_required; short cash = amount received). */
  payableCreditVnd: number;
  unsettledPaymentIds: string[];
  unsettledPaymentCodes: string[];
}

/**
 * Σ of the posted OTA-covered lines of the bookings the OTA collected for – BEFORE any FOC/discount (DOM 17/10,
 * BR-307: "Đã thu qua OTA" = the OTA room lines; no FOC on an OTA prepaid night). Reversal rows carry the
 * category, so the sum is net of reversals.
 */
export function otaCoveredOf(
  lines: ReadonlyArray<TotalsLine>,
  otaReservations: ReadonlySet<string>,
): number {
  if (otaReservations.size === 0) return 0;
  let sum = 0;
  for (const l of lines) {
    if (l.line_state !== 'posted' || !l.category || !OTA_COVERED.has(l.category)) continue;
    if (!l.reservation_id || !otaReservations.has(l.reservation_id)) continue;
    sum += l.amount_vnd;
  }
  return Math.max(0, sum);
}

/**
 * Σ of the posted lines and succeeded receipts (erd 4.6: balances are computed, never stored). A reversed
 * receipt (`reversed`) and its reversal row (`reversal_of_id`) are bookkeeping only – neither counts (G-12).
 * Refunds are their own negative rows: they reduce the credit, not the receipts (A-34). `ota_collect` pays only
 * the OTA-covered charges (x-ota-prepaid-rule): desk charges stay due, OTA excess is not credit.
 */
export function moneyPosition(
  lines: ReadonlyArray<TotalsLine>,
  payments: ReadonlyArray<TotalsPayment>,
): MoneyPosition {
  let totalVnd = 0;
  for (const l of lines) if (l.line_state === 'posted') totalVnd += l.amount_vnd;
  let paidVnd = 0;
  let paidOtaVnd = 0;
  let refundedVnd = 0;
  let depositHeldVnd = 0;
  let settledOwnVnd = 0;
  const otaReservations = new Set<string>();
  const unsettledIds: string[] = [];
  const unsettledCodes: string[] = [];
  for (const p of payments) {
    if (p.status !== 'succeeded' || p.reversal_of_id) continue;
    // A security deposit (long stay) is held, not a payment of the bill (BR-206).
    if (p.type === 'security_deposit') continue;
    if (p.type === 'refund') {
      refundedVnd -= p.amount_vnd;
      continue;
    }
    paidVnd += p.amount_vnd;
    if (p.type === 'deposit') depositHeldVnd += p.amount_vnd;
    if (p.method === 'ota_collect') {
      paidOtaVnd += p.amount_vnd;
      if (p.reservation_id) otaReservations.add(p.reservation_id);
      continue;
    }
    const rec = p.reconciliation ?? 'not_required';
    if (rec === 'reconciled' || rec === 'not_required') settledOwnVnd += p.amount_vnd;
    else {
      // ARC 13: a disputed receipt counts only for what really arrived (short cash), pending for nothing.
      if (rec === 'disputed') settledOwnVnd += Math.min(p.amount_vnd, p.received_amount_vnd ?? 0);
      if (p.id) unsettledIds.push(p.id);
      if (p.code) unsettledCodes.push(p.code);
    }
  }
  // Rows without a booking id (older callers) keep the S3 behaviour: OTA money pays the whole folio.
  const otaCoveredVnd =
    paidOtaVnd > 0 && otaReservations.size > 0 ? otaCoveredOf(lines, otaReservations) : paidOtaVnd;
  const otaAppliedVnd = Math.min(paidOtaVnd, otaCoveredVnd);
  const paidOwnVnd = paidVnd - paidOtaVnd;
  const dueAfterOta = Math.max(0, totalVnd - otaAppliedVnd);
  const creditVnd = Math.max(0, paidOwnVnd - refundedVnd - dueAfterOta);
  const payableCreditVnd = Math.max(
    0,
    Math.min(creditVnd, settledOwnVnd - refundedVnd - dueAfterOta),
  );
  return {
    totalVnd,
    paidVnd,
    paidOtaVnd,
    otaCoveredVnd,
    otaExcessVnd: paidOtaVnd - otaAppliedVnd,
    refundedVnd,
    depositHeldVnd,
    balanceDueVnd: Math.max(0, dueAfterOta - paidOwnVnd + refundedVnd),
    creditVnd,
    payableCreditVnd,
    unsettledPaymentIds: unsettledIds,
    unsettledPaymentCodes: unsettledCodes,
  };
}

/**
 * OpenAPI `Folio.totals` (see moneyPosition). `openRefundVnd` = open refund requests of the folio's bookings
 * (FolioService.openRefundVnd) → `unhandledCreditVnd` (E15-05).
 */
export function computeTotals(
  lines: ReadonlyArray<
    TotalsLine & Pick<FolioLineRow, 'category' | 'revenue_group' | 'amount_vnd' | 'line_state'>
  >,
  payments: ReadonlyArray<TotalsPayment>,
  openRefundVnd = 0,
): FolioTotals {
  let roomVnd = 0;
  let otherVnd = 0;
  let focVnd = 0;
  for (const l of lines) {
    if (l.line_state !== 'posted') continue;
    if (l.category === 'foc' || l.category === 'discount') focVnd -= l.amount_vnd;
    else if (l.revenue_group === 'room') roomVnd += l.amount_vnd;
    else otherVnd += l.amount_vnd;
  }
  const m = moneyPosition(lines, payments);
  return {
    roomVnd,
    otherVnd,
    focVnd,
    totalVnd: m.totalVnd,
    paidVnd: m.paidVnd,
    refundedVnd: m.refundedVnd,
    paidViaOtaVnd: m.paidOtaVnd,
    depositHeldVnd: m.depositHeldVnd,
    balanceDueVnd: m.balanceDueVnd,
    creditVnd: m.creditVnd,
    unhandledCreditVnd: Math.max(0, m.creditVnd - openRefundVnd),
    otaExcessVnd: m.otaExcessVnd,
  };
}

/** Refunded amount (positive) of the succeeded refund rows (Bill.refundedVnd). */
export function refundedOf(payments: ReadonlyArray<TotalsPayment>): number {
  return payments
    .filter((p) => p.status === 'succeeded' && !p.reversal_of_id && p.type === 'refund')
    .reduce((a, p) => a - p.amount_vnd, 0);
}

/** Columns of PaymentRowLite (alias p + user joins ur/uc/uq) – shared with the payments module. */
export const PAYMENT_COLUMNS = `p.id, p.code, p.type, p.method, p.amount_vnd, p.status, p.received_at, p.recorded_by,
  ur.display_name AS recorded_by_name, p.recorded_by_role, p.reconciliation, p.reconciled_at, p.reconciled_by,
  uq.display_name AS reconciled_by_name, p.reconciliation_note, p.self_reconciled, p.payer_name, p.card_brand,
  p.card_last4, p.reversal_of_id, p.expires_at, p.method_detail, p.note, p.attachment_id, p.confirmed_at,
  p.confirmed_by, uc.display_name AS confirmed_by_name, p.reservation_id, p.approval_request_id, p.shift_id,
  p.received_amount_vnd, p.provider, p.version, p.qr_purpose, p.qr_context`;
export const PAYMENT_JOINS = `LEFT JOIN app_user ur ON ur.id = p.recorded_by
  LEFT JOIN app_user uc ON uc.id = p.confirmed_by LEFT JOIN app_user uq ON uq.id = p.reconciled_by`;

/**
 * 0.3.7 bổ sung 4 (DOM (f)): "còn phải thu lúc đọc" of a pending VietQR – provided by the payments module (which
 * owns the purposes and their caps); the folio module only shows it (getFolio.payments[].amountDueNowVnd).
 */
export type QrDueNowReader = (
  tx: Tx,
  actor: { userId: string; roles: readonly string[] },
  payment: PaymentRowLite & { folio_id: string },
) => Promise<number | null>;

/** Commission payee of a closer by role in the property (BR-903): CTV → agent, sale → staff. */
export function payeeTypeOf(roles: readonly string[]): PayeeType | null {
  if (roles.includes('collaborator')) return 'agent';
  if (roles.includes('sales_staff')) return 'staff';
  return null;
}

/** short_stay_commission_pct key of a payee type ({collaborator: 8, staff: 3}). */
export function commissionPctFor(table: unknown, payee: PayeeType): number | null {
  if (!table || typeof table !== 'object') return null;
  const v = (table as Record<string, unknown>)[payee === 'agent' ? 'collaborator' : 'staff'];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

/** lineChangedNote.cause when the caller does not say (BR-434 S4-18). */
function defaultCause(category: string): LineChangeCause {
  if (category === 'late_checkout' || category === 'early_checkin') return 'checkout_time_change';
  if (category === 'extra_person') return 'party_change';
  if (category === 'room_change_difference') return 'room_change';
  return 'move';
}

/** One key of a folio and its requests, with the amounts of the plan (applied / will apply). */
interface ReductionKeyPlan {
  key: string;
  line: FolioLineRow | null;
  /** Night key whose night is no longer on the stay (BR-434 (3)) – its requests are cancelled. */
  gone: boolean;
  approved: Array<{ r: FolioReductionRequest; vnd: number }>;
  pending: Array<{ r: FolioReductionRequest; vnd: number }>;
}

/** Lines of one folio indexed for the FOC key sync (live = posted, not a reversal, not reversed). */
class LineIndex {
  private readonly reversed: ReadonlySet<string>;
  private readonly ids: ReadonlyMap<string, FolioLineRow>;

  constructor(readonly all: readonly FolioLineRow[]) {
    this.reversed = new Set(
      all.filter((l) => l.reversal_of_id).map((l) => l.reversal_of_id as string),
    );
    this.ids = new Map(all.map((l) => [l.id, l]));
  }

  byId(id: string): FolioLineRow | null {
    return this.ids.get(id) ?? null;
  }

  isLive(l: FolioLineRow): boolean {
    return l.line_state === 'posted' && !l.reversal_of_id && !this.reversed.has(l.id);
  }

  /** The live line of a category on a date (latest posted). */
  liveOn(category: string, date: string): FolioLineRow | null {
    let found: FolioLineRow | null = null;
    for (const l of this.all) {
      if (l.category === category && l.service_date === date && this.isLive(l)) found = l;
    }
    return found;
  }

  latestLive(category: string): FolioLineRow | null {
    let found: FolioLineRow | null = null;
    for (const l of this.all) if (l.category === category && this.isLive(l)) found = l;
    return found;
  }

  /** The line replacing `id` (adjustFolioLine posts it with related_line_id = the old line). */
  private replacement(id: string, category: string): FolioLineRow | null {
    return (
      this.all.find(
        (n) => n.related_line_id === id && n.category === category && !n.reversal_of_id,
      ) ?? null
    );
  }

  /** Current line of the key of a request (null = no line now); `gone` = night left the stay. */
  keyLine(
    r: Pick<FolioReductionRequest, 'category' | 'serviceDate' | 'originLineId' | 'itemCode'>,
  ): {
    line: FolioLineRow | null;
    gone: boolean;
  } {
    // Mô hình minibar M-1 (ARC R8, BR-434-15/16): the key of a minibar item is every live minibar line of that
    // item on the folio (every fridge, every count) – its value is their sum; the FOC lines sit on the first one.
    const item = itemKeyCode(r);
    if (item) {
      const live = this.all.filter(
        (l) => l.category === 'minibar' && l.charge_code === item && this.isLive(l),
      );
      const first = live[0];
      if (!first) return { line: null, gone: false };
      return {
        line: { ...first, amount_vnd: live.reduce((a, l) => a + l.amount_vnd, 0) },
        gone: false,
      };
    }
    const kind = keyKindOf(r.category);
    if (kind === 'night') {
      const night = r.serviceDate ? this.liveOn('room', r.serviceDate) : null;
      if (!night || !r.serviceDate) return { line: null, gone: true };
      return {
        line: r.category === 'room' ? night : this.liveOn(r.category, r.serviceDate),
        gone: false,
      };
    }
    if (kind === 'stay') return { line: this.latestLive(r.category), gone: false };
    const seen = new Set<string>();
    let cur = this.byId(r.originLineId);
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (this.isLive(cur)) return { line: cur, gone: false };
      cur = this.replacement(cur.id, r.category);
    }
    return { line: null, gone: false };
  }

  /** FOC / discount lines of a request (not the reversal rows), in posting order. */
  linesOf(r: { id: string; folioLineId: string }): FolioLineRow[] {
    return this.all.filter(
      (l) =>
        (l.category === 'foc' || l.category === 'discount') &&
        !l.reversal_of_id &&
        (l.approval_request_id === r.id || l.id === r.folioLineId),
    );
  }
}

@Injectable()
export class FolioService implements FolioStaySync {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
    @Inject(StayNightAllocationService) private readonly nights: StayNightAllocationService,
    // Optional so the worker composition (reservations/public/worker-jobs.ts) keeps its 5 arguments; the api
    // container always provides it (settle needs it).
    @Optional() @Inject(DocNumberService) private readonly docNumbers?: DocNumberService,
    // S4-02/S4-18/S4-22 (BE-B): FOC life of the requests (state, key date, auto-cancel). Optional for the worker
    // composition (holds only – no FOC there); a FOC to move without it fails loudly.
    @Optional() @Inject(ApprovalService) private readonly approvals?: ApprovalService,
    // S4-06: "Cần chú ý" closed_reservation_credit (optional for the worker composition – holds only).
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** One open folio per primary booking. `folioId` lets the caller pre-generate it (deferred FK). */
  async openForReservation(
    tx: Tx,
    input: { reservationId: string; folioId?: string; createdBy: string | null },
  ): Promise<string> {
    const id = input.folioId ?? uuidv7();
    const now = this.clock.now();
    await tx.query(
      `INSERT INTO folio (id, organization_id, property_id, primary_reservation_id, status, created_at,
         created_by, updated_at)
       VALUES ($1, $2, $3, $4, 'open', $5, $6, $5)`,
      [id, tx.ctx.organizationId, tx.ctx.propertyId, input.reservationId, now, input.createdBy],
    );
    return id;
  }

  /**
   * ARC 16.29 (N-6): `folio.version` goes up with EVERY money change of the folio – a line written, reversed or
   * changing state (night sync, FOC, fee, adjustment), a payment written or changing status (receipt, debt
   * collection, VietQR confirmed, reversal, refund pay-out, OTA receipt resync) – in the same transaction, under
   * L3 (the caller holds the folio). A request sent with an `If-Match` read before it gets 412 instead of acting on
   * stale numbers. Test `folio-version-touch` lists every writer of `folio_line` / `payment` that must call it.
   */
  async touch(tx: Tx, folioId: string): Promise<void> {
    await tx.query('UPDATE folio SET version = version + 1, updated_at = $2 WHERE id = $1', [
      folioId,
      this.clock.now(),
    ]);
  }

  /** `SELECT … FOR UPDATE` (lock order: reservation → room → folio). Null when not visible. */
  async lock(tx: Tx, folioId: string): Promise<FolioRow | null> {
    const { rows } = await tx.query<FolioRow>(
      `SELECT id, property_id, primary_reservation_id, status, bill_no, post_checkout_window_until, version
         FROM folio WHERE id = $1 FOR UPDATE`,
      [folioId],
    );
    return rows[0] ?? null;
  }

  /**
   * S4-13 lock order for a FOC decision / request outside a booking use case: the bookings of the folio (id
   * order) → the folio – the order every booking change takes (reservation → room → folio). A decision that
   * moves a FOC writes stay_night (discount) of those bookings; locking the folio first deadlocked against a
   * cancellation holding the nights (40P01 found by the S4-13 race test). `FOR NO KEY UPDATE` (ARC 16.16 bổ sung 2,
   * same rule as the booking use cases of BE-A): still serialises with them, never blocks an FK check (KEY SHARE)
   * of a line / payment written by a transaction that holds the folio – the booking key never changes.
   */
  async lockStay(tx: Tx, folioId: string): Promise<FolioRow | null> {
    await this.lockStayBookings(tx, folioId);
    return this.lock(tx, folioId);
  }

  /**
   * L1 of 16.19 alone: every booking of the folio `FOR NO KEY UPDATE`, id order (the primary booking is the oldest
   * – uuidv7 – so it comes first). For a use case that must hold L1 before a step of another module that re-locks
   * one of those bookings (adjustFolioLine → `setNightRate`, FB-R2-ARC-BE-S4-16), then takes L3 with `lockStay`.
   */
  async lockStayBookings(tx: Tx, folioId: string): Promise<void> {
    await tx.query(
      `SELECT r.id FROM reservation r
        WHERE r.folio_id = $1
           OR r.id IN (SELECT l.reservation_id FROM folio_line l WHERE l.folio_id = $1 AND l.reservation_id IS NOT NULL)
        ORDER BY r.id FOR NO KEY UPDATE OF r`,
      [folioId],
    );
  }

  private qrDueNowReader: QrDueNowReader | null = null;

  /** 0.3.7 bổ sung 4 (DOM (f)): the payments module provides "còn phải thu" of a pending VietQR. */
  provideQrDueNow(reader: QrDueNowReader): void {
    this.qrDueNowReader = reader;
  }

  /** Payment.amountDueNowVnd of the pending VietQR of a folio (id → amount; absent when unknown). */
  async qrDueNow(
    tx: Tx,
    actor: { userId: string; roles: readonly string[] },
    folioId: string,
    payments: readonly PaymentRowLite[],
  ): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (!this.qrDueNowReader) return out;
    for (const p of payments) {
      if (p.method !== 'vietqr' || p.status !== 'pending') continue;
      const v = await this.qrDueNowReader(tx, actor, { ...p, folio_id: folioId });
      if (v !== null) out.set(p.id, v);
    }
    return out;
  }

  async get(tx: Tx, folioId: string): Promise<FolioRow | null> {
    const { rows } = await tx.query<FolioRow>(
      `SELECT id, property_id, primary_reservation_id, status, bill_no, post_checkout_window_until, version
         FROM folio WHERE id = $1`,
      [folioId],
    );
    return rows[0] ?? null;
  }

  async lines(tx: Tx, folioId: string): Promise<FolioLineRow[]> {
    const { rows } = await tx.query<FolioLineRow>(
      `SELECT l.id, l.folio_id, l.reservation_id, l.category, l.revenue_group, l.description,
              l.service_date::text AS service_date, l.quantity, l.unit_price_vnd, l.amount_vnd, l.vat_rate_pct,
              l.line_state, l.related_line_id, l.reversal_of_id, l.approval_request_id, l.stay_night_id,
              l.charge_code, l.label_params, l.posted_at, l.posted_by, u.display_name AS posted_by_name
         FROM folio_line l LEFT JOIN app_user u ON u.id = l.posted_by
        WHERE l.folio_id = $1
        ORDER BY l.posted_at, l.service_date NULLS LAST, l.id`,
      [folioId],
    );
    return rows;
  }

  async payments(tx: Tx, folioId: string): Promise<PaymentRowLite[]> {
    const { rows } = await tx.query<PaymentRowLite>(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payment p ${PAYMENT_JOINS}
        WHERE p.folio_id = $1
        ORDER BY p.received_at NULLS LAST, p.id`,
      [folioId],
    );
    return rows;
  }

  async totals(tx: Tx, folioId: string): Promise<FolioTotals> {
    const lines = await this.lines(tx, folioId);
    return computeTotals(
      lines,
      await this.payments(tx, folioId),
      await this.openRefundVnd(tx, folioId, lines),
    );
  }

  /**
   * Deposit still held on a folio (B4 sufficiency, BR-305, BR-309 base, J1): Σ succeeded deposit receipts,
   * capped by the own money still held (deposits + desk charges − refunds paid out). Reversal rows are
   * bookkeeping (their original is `reversed`) – never counted, so a reversed deposit gives 0, not −X
   * (ARC-BE-S3-02, SEC-BE-36); a deposit paid back to the guest no longer confirms a hold nor keeps it
   * (verification 17/10). OTA collections are not deposits.
   */
  async depositPaid(tx: Tx, folioId: string): Promise<number> {
    const { rows } = await tx.query<{
      dep: string | number;
      own: string | number;
      back: string | number;
    }>(
      `SELECT COALESCE(SUM(amount_vnd) FILTER (WHERE type = 'deposit'), 0) AS dep,
              COALESCE(SUM(amount_vnd) FILTER (WHERE type IN ('deposit', 'charge') AND method <> 'ota_collect'), 0)
                AS own,
              COALESCE(-SUM(amount_vnd) FILTER (WHERE type = 'refund'), 0) AS back
         FROM payment
        WHERE folio_id = $1 AND status = 'succeeded' AND reversal_of_id IS NULL`,
      [folioId],
    );
    const r = rows[0];
    const dep = Number(r?.dep ?? 0);
    const held = Math.max(0, Number(r?.own ?? 0) - Number(r?.back ?? 0));
    return Math.min(dep, held);
  }

  // ───────────── FolioPort (ARC s3-contract 4.3 – BE-A checkout/stay, BE-B endpoints) ─────────────

  /**
   * Lock the folio for a posting: `open`, or `settled` inside `post_checkout_window_until` when the caller
   * allows post-checkout charges (BR-427 c) – otherwise 409 FOLIO_LOCKED. Lock order: reservation → folio.
   */
  async lockForPosting(
    tx: Tx,
    folioId: string,
    opts: { allowPostCheckout?: boolean } = {},
  ): Promise<FolioRow & { postCheckout: boolean }> {
    const folio = await this.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    if (folio.status === 'open') return { ...folio, postCheckout: false };
    const window = folio.post_checkout_window_until;
    if (
      opts.allowPostCheckout &&
      folio.status === 'settled' &&
      window &&
      this.clock.now().getTime() < window.getTime()
    ) {
      return { ...folio, postCheckout: true };
    }
    throw problem('FOLIO_LOCKED');
  }

  /**
   * FolioPort.postLines – append charge lines in the caller's transaction (money audit per line, BR-008).
   * Amount = round(quantity × unit price) unless given. Returns the new line ids in input order.
   */
  async postLines(
    tx: Tx,
    folioId: string,
    lines: readonly FolioLineInput[],
    actor: FolioActor,
    opts: {
      allowPostCheckout?: boolean;
      /** lineChangedNote.cause of the pending FOC that follow the posted lines (default by category). */
      cause?: LineChangeCause;
    } = {},
  ): Promise<string[]> {
    const folio = await this.lockForPosting(tx, folioId, opts);
    const now = this.clock.now();
    const tz = await this.timezone(tx);
    const ids: string[] = [];
    for (const l of lines) {
      const amountVnd = l.amountVnd ?? Math.round(l.quantity * l.unitPriceVnd);
      const id = await this.insertLine(tx, {
        folioId: folio.id,
        reservationId:
          l.reservationId === undefined ? folio.primary_reservation_id : l.reservationId,
        category: l.category,
        ...(l.revenueGroup ? { revenueGroup: l.revenueGroup } : {}),
        description: l.description,
        quantity: l.quantity,
        unitPriceVnd: l.unitPriceVnd,
        amountVnd,
        serviceDate: l.serviceDate ?? localDate(now, tz),
        stayNightId: l.stayNightId ?? null,
        source: l.source,
        postedBy: actor.userId,
        now,
        lineState: l.lineState ?? 'posted',
        relatedLineId: l.relatedLineId ?? null,
        chargeCode: l.chargeCode ?? null,
        note: l.note ?? null,
        reason: l.reason ?? null,
        evidenceAttachmentIds: l.evidenceAttachmentIds ?? null,
        postCheckout: folio.postCheckout,
        labelParams: l.labelParams ?? null,
      });
      ids.push(id);
      await this.audit.recordMoney(tx, {
        action: 'folio.line_posted',
        entityType: 'folio_line',
        entityId: id,
        ...(actor.reservationCode ? { entityCode: actor.reservationCode } : {}),
        after: {
          category: l.category,
          amountVnd,
          lineState: l.lineState ?? 'posted',
        },
        ...(l.reason ? { reason: l.reason } : {}),
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    // S438-FOC-01/04 (BR-434, nghi vấn A7): a charge posted on a key that carries an approved FOC (a re-posted
    // room-change difference of the date, a minibar line replacing a recount, a late charge…) – the FOC follows
    // at once (min(approved, line)); idempotent, nothing to do on a folio without reductions.
    if (
      folio.status === 'open' &&
      lines.some(
        (l) =>
          (l.lineState ?? 'posted') === 'posted' &&
          l.category !== 'foc' &&
          l.category !== 'discount',
      )
    ) {
      await this.syncReductions(tx, folio.id, {
        userId: actor.userId,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
        ...(opts.cause ? { cause: opts.cause } : {}),
      });
    }
    // An OTA-covered charge (B16 early-departure fee kept by the OTA…) moves the OTA prepaid receipt.
    if (lines.some((l) => OTA_COVERED.has(l.category))) {
      await this.syncOtaCollect(tx, folio.id, folio.primary_reservation_id, null, actor);
    }
    return ids;
  }

  /**
   * FolioPort.reverseLine – bút toán đảo of one live posted line (and of the posted FOC/discount lines that
   * reduced it), `reason` 3–500 on the reversal row (BR-008, G-10). 404 unknown line, 409 INVALID_TRANSITION
   * when the line is not live (pending/rejected, already reversed, itself a reversal).
   */
  async reverseLine(
    tx: Tx,
    lineId: string,
    reason: string,
    actor: FolioActor,
    opts: {
      allowSettled?: boolean;
      /**
       * The caller posts the replacement and runs syncReductions itself (replaceLateCharge, adjustFolioLine) –
       * otherwise the FOC of the reversed line goes dormant right here (BR-434 – never `approved` unapplied).
       */
      skipReductionSync?: boolean;
    } = {},
  ): Promise<{ reversalId: string; reversedVnd: number; folioId: string }> {
    const { rows } = await tx.query<{ folio_id: string }>(
      'SELECT folio_id FROM folio_line WHERE id = $1',
      [lineId],
    );
    const folioId = rows[0]?.folio_id;
    if (!folioId) throw problem('NOT_FOUND');
    const folio = await this.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    if (folio.status !== 'open' && !(opts.allowSettled && folio.status === 'settled')) {
      throw problem('FOLIO_LOCKED');
    }
    const { rows: liveRows } = await tx.query<LiveLine & { reservation_id: string | null }>(
      `SELECT l.id, l.category, l.revenue_group, l.description, l.quantity, l.unit_price_vnd, l.amount_vnd,
              l.service_date::text AS service_date, l.stay_night_id, l.related_line_id, l.reservation_id
         FROM folio_line l
        WHERE l.folio_id = $1 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [folioId],
    );
    const line = liveRows.find((l) => l.id === lineId);
    if (!line) throw problem('INVALID_TRANSITION');
    const now = this.clock.now();
    const reversedVnd = await this.reverseWithReductions(
      tx,
      line,
      liveRows,
      actor.userId,
      now,
      reason,
    );
    // x-ota-prepaid-rule: the OTA receipt follows a reversed OTA-covered line (or its FOC/discount).
    await this.resyncOtaCollect(
      tx,
      folioId,
      line.reservation_id ?? folio.primary_reservation_id,
      actor,
    );
    const { rows: rev } = await tx.query<{ id: string }>(
      'SELECT id FROM folio_line WHERE reversal_of_id = $1',
      [lineId],
    );
    await this.audit.recordMoney(tx, {
      action: 'folio.line_reversed',
      entityType: 'folio_line',
      entityId: lineId,
      ...(actor.reservationCode ? { entityCode: actor.reservationCode } : {}),
      before: { category: line.category, amountVnd: line.amount_vnd },
      after: { reversedVnd, lineState: 'posted' },
      reason,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    if (!opts.skipReductionSync) {
      await this.syncReductions(tx, folioId, {
        userId: actor.userId,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    return { reversalId: rev[0]?.id as string, reversedVnd, folioId };
  }

  /** FolioPort.balance – server-side money balance (A-34: balanceDue and credit are never both > 0). */
  async balance(tx: Tx, folioId: string): Promise<FolioBalance> {
    const payments = await this.payments(tx, folioId);
    const lines = await this.lines(tx, folioId);
    const m = moneyPosition(lines, payments);
    const openRefundVnd = await this.openRefundVnd(tx, folioId, lines);
    const unhandled = Math.max(0, m.creditVnd - openRefundVnd);
    return {
      totalVnd: m.totalVnd,
      paidVnd: m.paidVnd,
      refundedVnd: m.refundedVnd,
      balanceDueVnd: m.balanceDueVnd,
      creditVnd: unhandled,
      unhandledCreditVnd: unhandled,
      rawCreditVnd: m.creditVnd,
      openRefundVnd,
      payableCreditVnd: m.payableCreditVnd,
      unreconciledVnd: m.creditVnd - m.payableCreditVnd,
      unsettledPaymentIds: m.unsettledPaymentIds,
      unsettledPaymentCodes: m.unsettledPaymentCodes,
      otaExcessVnd: m.otaExcessVnd,
    };
  }

  /**
   * Σ (amount − refunded) of the refund requests of the folio's bookings that are still open (pending,
   * escalated, approved not fully paid). The refund columns are written by payments (ARC B-4).
   */
  async openRefundVnd(
    tx: Tx,
    folioId: string,
    lines?: ReadonlyArray<Pick<FolioLineRow, 'reservation_id'>>,
  ): Promise<number> {
    const folio = await this.get(tx, folioId);
    if (!folio) return 0;
    const ids = new Set<string>([folio.primary_reservation_id]);
    for (const l of lines ?? (await this.lines(tx, folioId)))
      if (l.reservation_id) ids.add(l.reservation_id);
    const { rows } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(SUM(amount_vnd - refunded_vnd), 0) AS total FROM approval_request
        WHERE type = 'refund' AND target_type = 'reservation' AND target_id = ANY($1::uuid[])
          AND status IN ('pending', 'escalated', 'approved')`,
      [[...ids]],
    );
    return Number(rows[0]?.total ?? 0);
  }

  /** The open refund requests behind openRefundVnd, oldest first (DOM-S4-14). */
  private async openRefunds(
    tx: Tx,
    folioId: string,
    opts: { lock?: boolean } = {},
  ): Promise<OpenRefund[]> {
    const folio = await this.get(tx, folioId);
    if (!folio) return [];
    const ids = new Set<string>([folio.primary_reservation_id]);
    for (const l of await this.lines(tx, folioId)) if (l.reservation_id) ids.add(l.reservation_id);
    const { rows } = await tx.query<{ id: string; status: string; remaining: string | number }>(
      `SELECT id, status, amount_vnd - refunded_vnd AS remaining FROM approval_request
        WHERE type = 'refund' AND target_type = 'reservation' AND target_id = ANY($1::uuid[])
          AND status IN ('pending', 'escalated', 'approved') AND refunded_vnd < amount_vnd
        ORDER BY requested_at, id${opts.lock ? ' FOR UPDATE' : ''}`,
      [[...ids]],
    );
    return rows.map((r) => ({ id: r.id, status: r.status, remainingVnd: Number(r.remaining) }));
  }

  /**
   * "Giá trị đơn" (DOM 17/10, REFUND #3 – BR-309/BR-429 addendum): Σ of the live `room` + `extra_person`
   * lines of the booking at the moment of the cancellation / no-show, after their FOC and special discounts
   * (and after any move or night reduction already posted) – never the pricing snapshot, never services,
   * never money the OTA collected for us (its system receipt is deducted). The cap of every cancellation /
   * no-show fee (reservations B10 / B11).
   */
  async bookingValueVnd(tx: Tx, folioId: string, reservationId: string): Promise<number> {
    const { rows } = await tx.query<{ lines: string | number; ota: string | number }>(
      `SELECT
         (SELECT COALESCE(SUM(l.amount_vnd), 0) FROM folio_line l
            LEFT JOIN folio_line rel ON rel.id = l.related_line_id
           WHERE l.folio_id = $1 AND l.line_state = 'posted'
             AND ((l.category IN ('room', 'extra_person') AND l.reservation_id = $2)
               OR (l.category IN ('foc', 'discount') AND rel.category IN ('room', 'extra_person')
                   AND rel.reservation_id = $2))) AS lines,
         (SELECT COALESCE(SUM(p.amount_vnd), 0) FROM payment p
           WHERE p.folio_id = $1 AND p.reservation_id = $2 AND p.provider = 'ota_system'
             AND p.status = 'succeeded' AND p.reversal_of_id IS NULL) AS ota`,
      [folioId, reservationId],
    );
    return Math.max(0, Number(rows[0]?.lines ?? 0) - Number(rows[0]?.ota ?? 0));
  }

  /**
   * BR-433 (d) v0.4.1 (FB-R3-SEC-BE-B-07, ARC S1-08) – THE limit basis of every waiver rule (BR-433 (a)(b), the manager
   * threshold of (c) / ESC-026 A, BR-416 at the desk). Nobody else computes it. Each night price is PROTECTED:
   * LEAST(the line's price – `room`: unit price, `late_fee_as_night`: the charge –, its `limit_ref_vnd`), the reference
   * written by the system's price paths only, so raising a night by hand (A31 / A32) never raises a limit.
   * - `lineId` (BR-433 (b), BR-416): the night the line belongs to (BUG-R2-046): a room line its own night; the late fee
   *   as a night itself; late check-out the last night; early check-in the first; any other line the night of its
   *   service date (else the latest before it, else the first) – of the line's booking; a long stay its converted
   *   night (BR-102);
   * - `lineId` null (BR-433 (a), (c)): the HIGHEST protected night of the folio (or the long stay's converted night);
   * - after check-out never above what `settle` captured (`folio.limit_basis_checkout_vnd`, BB07-7).
   * null = no night at all (→ the owner decides (a)(b); (c) uses 0). Read under the caller's L1 → L3.
   */
  async limitBasisVnd(tx: Tx, folioId: string, lineId: string | null): Promise<number | null> {
    const computed = await this.limitBasisNow(tx, folioId, lineId);
    const { rows } = await tx.query<{ captured: string | number | null }>(
      'SELECT limit_basis_checkout_vnd AS captured FROM folio WHERE id = $1',
      [folioId],
    );
    const captured = rows[0]?.captured;
    // BUG-R3-004 (BR-433 (a) "no night → OWN"): no live night left → no basis, whatever B18 captured (the capture
    // only ever LOWERS a basis that exists).
    if (computed === null) return null;
    if (captured === null || captured === undefined) return computed;
    return Math.min(computed, Number(captured));
  }

  /** limitBasisVnd without the B18 capture (what `settle` captures). */
  private async limitBasisNow(
    tx: Tx,
    folioId: string,
    lineId: string | null,
  ): Promise<number | null> {
    const protectedPrice = `LEAST(CASE WHEN l.charge_code = 'late_fee_as_night' THEN l.amount_vnd
                                       ELSE l.unit_price_vnd END,
                                  COALESCE(l.limit_ref_vnd, CASE WHEN l.charge_code = 'late_fee_as_night'
                                                                 THEN l.amount_vnd ELSE l.unit_price_vnd END))`;
    if (lineId === null) {
      const longNight = await this.longStayNightOf(tx, null, folioId);
      if (longNight !== null) return longNight;
      const { rows } = await tx.query<{ basis: string | number | null }>(
        `SELECT max(${protectedPrice}) AS basis FROM folio_line l
          WHERE l.folio_id = $1 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
            AND (l.category = 'room' OR l.charge_code = 'late_fee_as_night')
            AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
        [folioId],
      );
      const b = rows[0]?.basis;
      return b === null || b === undefined ? null : Number(b);
    }
    const { rows } = await tx.query<{
      category: string;
      price: number;
      service_date: string | null;
      folio_id: string;
      reservation_id: string | null;
      charge_code: string | null;
    }>(
      `SELECT l.category, ${protectedPrice} AS price, l.service_date::text AS service_date, l.folio_id,
              l.reservation_id, l.charge_code
         FROM folio_line l WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line) return null;
    if (line.category === 'room') return Number(line.price);
    // BUG-R2-148 (BR-416-06, DOM 18/10): the late fee charged as one night IS the night of the departure day.
    if (line.charge_code === 'late_fee_as_night') return Number(line.price);
    // ARC 16.21 (Minor): a long stay's night is its monthly rent ÷ long_stay_daily_divisor (BR-102/BR-413).
    const longNight = await this.longStayNightOf(tx, line.reservation_id, line.folio_id);
    if (longNight !== null) return longNight;
    const { rows: nights } = await tx.query<{ price: string | number; service_date: string }>(
      `SELECT ${protectedPrice} AS price, l.service_date::text AS service_date FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'room' AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL AND l.service_date IS NOT NULL
          AND ($2::uuid IS NULL OR l.reservation_id = $2)
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.service_date, l.posted_at`,
      [line.folio_id, line.reservation_id],
    );
    if (nights.length === 0) return null;
    const price = (n: { price: string | number }) => Number(n.price);
    const first = nights[0] as { price: string | number; service_date: string };
    const last = nights[nights.length - 1] as { price: string | number; service_date: string };
    if (line.category === 'late_checkout') return price(last);
    if (line.category === 'early_checkin') return price(first);
    const d = line.service_date;
    if (!d) return price(last);
    const same = nights.find((n) => n.service_date === d);
    if (same) return price(same);
    const before = nights.filter((n) => n.service_date < d);
    return price(before[before.length - 1] ?? first);
  }

  /**
   * BR-433 (a)(b) v0.4.0 + (d) v0.4.1 (ARC S1-10) – what every waiver request hands to `ApprovalService.submit`, ONE
   * definition for the folio (`requestFoc`) and the desk (FOC of a surcharge, BR-416): the Σ the per-time limit is
   * compared with (write-off: the folio's write-offs applied now – every cycle, OWN included – + the pending ones +
   * this one; any other waiver: the key's applied + asked + this one) and the protected basis (write-off: the folio's
   * highest night; otherwise the line's night). Read under the caller's L1 → L3.
   */
  async waiverLimitInput(
    tx: Tx,
    folioId: string,
    lineId: string,
    amountVnd: number,
    kind: 'debt_write_off' | 'key',
  ): Promise<{ perTimeAmountVnd: number; limitBasisVnd: number | null }> {
    if (kind === 'debt_write_off') {
      const { rows } = await tx.query<{ applied: string | number; asked: string | number }>(
        `SELECT
           (SELECT COALESCE(-sum(l.amount_vnd), 0) FROM folio_line l
              JOIN approval_request a ON a.id = l.approval_request_id
             WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted'
               AND l.reversal_of_id IS NULL AND a.reason_code = 'debt_write_off'
               AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)) AS applied,
           (SELECT COALESCE(sum(a.amount_vnd), 0) FROM approval_request a
              JOIN folio_line f ON f.id = a.folio_line_id
             WHERE f.folio_id = $1 AND a.type = 'foc' AND a.reason_code = 'debt_write_off'
               AND a.status IN ('pending', 'escalated')) AS asked`,
        [folioId],
      );
      return {
        perTimeAmountVnd: Number(rows[0]?.applied ?? 0) + Number(rows[0]?.asked ?? 0) + amountVnd,
        limitBasisVnd: await this.limitBasisVnd(tx, folioId, null),
      };
    }
    const usage = await this.reductionUsage(tx, lineId);
    return {
      perTimeAmountVnd: usage.usedVnd + amountVnd,
      limitBasisVnd: await this.limitBasisVnd(tx, folioId, lineId),
    };
  }

  /**
   * Nightly equivalent of the long stay a line belongs to (its booking, else the folio's primary booking): monthly
   * rent ÷ `long_stay_daily_divisor`, rounded to `rounding.night_rate` (BR-102, BR-413 – what the desk's
   * `longStayNight` computes). Null for a short stay, a long stay without rent, or missing parameters.
   */
  private async longStayNightOf(
    tx: Tx,
    reservationId: string | null,
    folioId: string,
  ): Promise<number | null> {
    const { rows } = await tx.query<{ stay_type: string; rent: string | number | null }>(
      `SELECT r.stay_type, (r.manual_long_stay ->> 'monthly_rent_vnd') AS rent
         FROM reservation r
        WHERE r.id = COALESCE($1::uuid, (SELECT f.primary_reservation_id FROM folio f WHERE f.id = $2))`,
      [reservationId, folioId],
    );
    const r = rows[0];
    const rent = r?.rent === null || r?.rent === undefined ? null : Number(r.rent);
    if (r?.stay_type !== 'long' || !rent || rent <= 0) return null;
    const today = localDate(this.clock.now(), await this.timezone(tx));
    try {
      const divisor = await this.params.get<number>(tx, 'long_stay_daily_divisor', today);
      const unit = await this.params.get<number>(tx, 'rounding.night_rate', today);
      return divideRoundVnd(rent, divisor, unit);
    } catch (err) {
      if (err instanceof ParameterMissingError) return null;
      throw err;
    }
  }

  /**
   * ARC-BE-S3-15 c (B17 undo check-in): does the booking have live posted lines posted at/after `at`?
   * Lets the desk refuse an undo once money moved, without re-implementing "live line" outside folio.
   */
  async hasLiveLinesSince(tx: Tx, reservationId: string, at: Date): Promise<boolean> {
    const { rows } = await tx.query(
      `SELECT 1 FROM folio_line l
        WHERE l.reservation_id = $1 AND l.posted_at >= $2 AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        LIMIT 1`,
      [reservationId, at],
    );
    return rows.length > 0;
  }

  /**
   * FolioPort.settle – B18: folio `open → settled`, bill number F{yy}-… (BR-007, DocNumberService),
   * post-checkout window = now + `post_checkout_charge_hours` (BR-427). Money audit `folio.settled`.
   */
  async settle(
    tx: Tx,
    folioId: string,
    actor: FolioActor,
  ): Promise<{ billNo: string; settledAt: Date; postCheckoutWindowUntil: Date }> {
    const folio = await this.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    if (folio.status !== 'open')
      throw problem('INVALID_TRANSITION', { extras: { currentState: folio.status } });
    // BR-434 / BR-433 (S4-02): a FOC still dormant when the folio is settled is cancelled ("không áp").
    await this.cancelDormantOnSettle(tx, folio.id, actor);
    const now = this.clock.now();
    const tz = await this.timezone(tx);
    const hours = await this.params.get<number>(
      tx,
      'post_checkout_charge_hours',
      localDate(now, tz),
    );
    const until = new Date(now.getTime() + hours * 3_600_000);
    if (!this.docNumbers) throw new Error('FolioService.settle needs DocNumberService');
    const billNo = await this.docNumbers.allocate(tx, 'bill');
    // BR-433 (d) v0.4.1 (ARC S1-08): the limit basis is captured ONCE here – the only place that settles a folio; no
    // path writes it afterwards, so a night raised after check-out never raises a limit (BB07-7).
    const basisAtCheckout = await this.limitBasisNow(tx, folio.id, null);
    await tx.query(
      `UPDATE folio SET status = 'settled', bill_no = $2, settled_at = $3, settled_by = $4,
          post_checkout_window_until = $5, updated_at = $3, version = version + 1,
          limit_basis_checkout_vnd = $6
        WHERE id = $1`,
      [folio.id, billNo, now, actor.userId, until, basisAtCheckout],
    );
    const b = await this.balance(tx, folio.id);
    await this.audit.recordMoney(tx, {
      action: 'folio.settled',
      entityType: 'folio',
      entityId: folio.id,
      entityCode: billNo,
      before: { status: 'open' },
      after: { status: 'settled', billNo, totalVnd: b.totalVnd, balanceDueVnd: b.balanceDueVnd },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    return { billNo, settledAt: now, postCheckoutWindowUntil: until };
  }

  /**
   * J15 `folio.close` for ONE folio (ARC 16.27 (1), BR-427 (d), BR-525 – DOM 18/10), in the job's transaction of
   * this folio: L1 every booking of the folio `NO KEY UPDATE` → L3 the folio (`lockStay`), then everything is read
   * under the locks. A `settled` folio whose post-checkout window (check-out + `post_checkout_charge_hours`, one
   * window for the whole folio) is over: still owed and no open debt → the front desk records ONE debt
   * (`debtOnCheckout`, reason `post_checkout_unpaid`, default due days, system actor) – the same structure as at B18
   * – then the folio is `closed` (the bill stays as settled; R3 e-invoice). A folio with an open refund request
   * waits (a refund pay-out needs a folio that is not closed – it closes on a later run once paid). Idempotent: not
   * `settled` or window not over → nothing. Returns what happened.
   */
  async closeAfterWindow(
    tx: Tx,
    folioId: string,
    now: Date,
    debts: {
      recordDebt(folioId: string): Promise<{ recorded: boolean }>;
      hasOpenDebt(folioId: string): Promise<boolean>;
    },
  ): Promise<'closed' | 'closed_with_debt' | 'waiting_refund' | 'skipped'> {
    const folio = await this.lockStay(tx, folioId);
    const until = folio?.post_checkout_window_until ?? null;
    if (!folio || folio.status !== 'settled' || !until || until.getTime() > now.getTime()) {
      return 'skipped';
    }
    const b = await this.balance(tx, folioId);
    if (b.openRefundVnd > 0) return 'waiting_refund';
    // BUG-R3-002 (fuzz R3-Q30 I4, BR-522 / BR-427 (d)): never a closed folio holding the guest's money. An
    // overpayment not routed to a refund request yet (normally A32 opens one – FolioLinesService) keeps the folio
    // `settled` and "Cần chú ý" `closed_reservation_credit` tells the desk; J15 closes it once it is paid back or
    // left by the guest (the next tick after that).
    if (b.unhandledCreditVnd > 0) {
      if (this.events) {
        const { rows: r } = await tx.query<{ code: string }>(
          'SELECT code FROM reservation WHERE id = $1',
          [folio.primary_reservation_id],
        );
        await this.events.openAttention(tx, {
          kind: 'closed_reservation_credit',
          severity: 'warning',
          dedupeKey: `closed_reservation_credit:${folio.primary_reservation_id}`,
          refType: 'reservation',
          refId: folio.primary_reservation_id,
          ...(r[0]?.code ? { refCode: r[0].code } : {}),
          now,
        });
      }
      return 'waiting_refund';
    }
    let debt = false;
    if (b.balanceDueVnd > 0) {
      const r = await debts.recordDebt(folioId);
      // Never a closed folio owing money outside the debt list (A19): no debt recorded and none open → stop here.
      if (!r.recorded && !(await debts.hasOpenDebt(folioId))) {
        throw new Error(`J15: folio ${folioId} owes money and no debt was recorded`);
      }
      debt = true;
    }
    await tx.query(
      `UPDATE folio SET status = 'closed', closed_at = $2, updated_at = $2, version = version + 1 WHERE id = $1`,
      [folioId, now],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'folio.closed',
      entityType: 'folio',
      entityId: folioId,
      entityCode: folio.bill_no ?? folioId,
      before: { status: 'settled' },
      after: { status: 'closed', balanceDueVnd: b.balanceDueVnd },
    });
    return debt ? 'closed_with_debt' : 'closed';
  }

  /**
   * SM-11 `projected → earned` (BR-903 + BR-527, DOM S3-3 / BE-15): a short-stay commission is earned when
   * ALL hold – the booking is `checked_out`, its folio owes nothing, and no receipt recorded by the payee on
   * the folio is still `pending`/`disputed`. Called at the LAST of those events: B18 (reservation hook),
   * reconciliation / cash handover, a receipt after checkout (debt). The caller passes the booking status.
   */
  async tryEarnCommissions(
    tx: Tx,
    stay: { reservationId: string; reservationCode: string; status: string },
    requestId?: string,
  ): Promise<number> {
    if (stay.status !== 'checked_out') return 0;
    const folio = await this.folioOfReservation(tx, stay.reservationId);
    if (!folio) return 0;
    const m = moneyPosition(await this.lines(tx, folio.id), await this.payments(tx, folio.id));
    if (m.balanceDueVnd > 0) return 0;
    // DOM 18/10 (BR-525 / BR-903, ARC 16.26): money received AFTER the check-out (a debt collected, a post-checkout
    // charge paid) counts once confirmed – a transfer still pending / disputed holds the commission until its
    // reconciliation (which runs this again: applyReconciliation → tryEarn).
    const { rows: unconfirmed } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM payment p JOIN reservation r ON r.id = $1
        WHERE p.folio_id = $2 AND p.status = 'succeeded' AND p.reversal_of_id IS NULL AND p.amount_vnd > 0
          AND p.reconciliation IN ('pending', 'disputed')
          AND r.actual_checkout_at IS NOT NULL AND p.created_at > r.actual_checkout_at`,
      [stay.reservationId, folio.id],
    );
    if ((unconfirmed[0]?.n ?? 0) > 0) return 0;
    const { rows: due } = await tx.query<{ id: string; amount_vnd: number; payee_user_id: string }>(
      `SELECT c.id, c.amount_vnd, c.payee_user_id FROM commission c
        WHERE c.reservation_id = $1 AND c.status = 'projected'
          AND NOT EXISTS (
            SELECT 1 FROM payment p
             WHERE p.folio_id = $2 AND p.recorded_by = c.payee_user_id AND p.status = 'succeeded'
               AND p.reversal_of_id IS NULL AND p.reconciliation IN ('pending', 'disputed'))
        FOR UPDATE OF c`,
      [stay.reservationId, folio.id],
    );
    const now = this.clock.now();
    for (const c of due) {
      await tx.query(
        `UPDATE commission SET status = 'earned', recognized_at = $2, updated_at = $2, version = version + 1
          WHERE id = $1`,
        [c.id, now],
      );
      await this.audit.recordMoney(tx, {
        action: 'commission.earned',
        entityType: 'commission',
        entityId: c.id,
        entityCode: stay.reservationCode,
        before: { status: 'projected' },
        after: { status: 'earned', amountVnd: c.amount_vnd },
        ...(requestId ? { requestId } : {}),
      });
    }
    return due.length;
  }

  /**
   * BR-903 / BR-525 (DOM 18/10 – G-4 (3)): a commission is earned only while the stay owes nothing. A receipt
   * reversed after check-out that leaves money owed sends the `earned` / `payable` commissions of the stay's
   * bookings back to `projected` (recognized_at cleared); `tryEarnCommissions` earns them again – with the date of
   * that moment – once the debt is paid (recordPayment on the checked-out stay). `paid` is never touched in R2
   * (taking it back from a later pay-out is PO's call for R3). Caller holds L1 → L3 (reversePayment); the
   * commission rows are locked after the folio, as in tryEarnCommissions. Returns the commissions sent back.
   */
  async unearnCommissions(
    tx: Tx,
    input: { folioId: string; reservationCode: string; reason: string; requestId?: string },
  ): Promise<number> {
    const { rows } = await tx.query<{ id: string; status: string; amount_vnd: number }>(
      `SELECT c.id, c.status, c.amount_vnd FROM commission c
        WHERE c.status IN ('earned', 'payable')
          AND c.reservation_id IN (SELECT r.id FROM reservation r WHERE r.folio_id = $1)
        ORDER BY c.id FOR UPDATE OF c`,
      [input.folioId],
    );
    const now = this.clock.now();
    for (const c of rows) {
      await tx.query(
        `UPDATE commission SET status = 'projected', recognized_at = NULL, updated_at = $2,
            version = version + 1
          WHERE id = $1`,
        [c.id, now],
      );
      await this.audit.recordMoney(tx, {
        action: 'commission.projected',
        entityType: 'commission',
        entityId: c.id,
        entityCode: input.reservationCode,
        before: { status: c.status, amountVnd: c.amount_vnd },
        after: { status: 'projected', amountVnd: c.amount_vnd },
        reason: input.reason,
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
    }
    return rows.length;
  }

  /** Folio of a booking (folio.primary_reservation_id is unique). */
  async folioOfReservation(tx: Tx, reservationId: string): Promise<FolioRow | null> {
    const { rows } = await tx.query<FolioRow>(
      `SELECT id, property_id, primary_reservation_id, status, bill_no, post_checkout_window_until, version
         FROM folio WHERE primary_reservation_id = $1`,
      [reservationId],
    );
    return rows[0] ?? null;
  }

  /**
   * B2 / B4 / B12 money postings (see header) – a full sync of the folio with the sold nights (`syncStay`):
   * idempotent, so a restore (B12) re-posts exactly the nights whose line was reversed at B11.
   */
  async onReservationConfirmed(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
  ): Promise<SyncResult> {
    return this.syncStay(tx, stay, actor, 'confirmed');
  }

  /**
   * B7 / B8 / B13 / B16 / PATCH people (FB-R2-DOM-BE-02): the booking changed nights, prices (BR-107 re-tier,
   * DOM D-8) or people. Same sync as onReservationConfirmed: lines of nights no longer sold and lines whose
   * price changed are REVERSED (BR-008), new nights / new prices / new extra-person fee are posted,
   * commission and OTA channel fee are recomputed and re-allocated.
   */
  async resyncStay(
    tx: Tx,
    stay: ConfirmedStay,
    actor: {
      userId: string | null;
      requestId?: string;
      /** S4-18: why the nights changed (lineChangedNote.cause of the pending FOC that follow) – optional. */
      cause?: LineChangeCause;
    },
  ): Promise<void> {
    await this.syncStay(tx, stay, actor, 'resynced');
  }

  /** B5/B6/B10/B11/relocation: live commissions of the booking → void (SM-11). */
  async onReservationVoided(
    tx: Tx,
    input: { reservationId: string; reservationCode: string; reason: string; requestId?: string },
  ): Promise<number> {
    return this.voidCommissions(
      tx,
      input.reservationId,
      input.reservationCode,
      input.reason,
      this.clock.now(),
      input.requestId,
    );
  }

  /**
   * FOLIO_STAY_SYNC.voidStay – B10 / B11 / relocation (FB-R2-DOM-BE-01 Blocker):
   * - reverses the live `room` lines of `voidedStayNightIds` and the `extra_person` lines of the same dates,
   *   with the posted FOC/discount lines that reduced them (BR-008: reversal lines, never an edit);
   * - posts ONE line for the retained money (`retainedVnd` > 0): `cancellation_fee` (BR-309) or `no_show_fee`
   *   (BR-311), revenue "other" (BR-904); the refundable part stays in the refund approval flow (BR-522),
   *   so until it is paid back the balance shows it as a credit (negative balance);
   * - holds (B5/B6) have no posted lines → no-op. Money audit `folio.stay_reversed` in the same transaction.
   * Commissions are voided by onReservationVoided (called by reservations just before).
   */
  async voidStay(tx: Tx, input: VoidStayInput, who: { userId: string | null }): Promise<void> {
    const retained = input.retainedVnd;
    if (!Number.isSafeInteger(retained) || retained < 0) {
      throw new RangeError('retainedVnd must be a non-negative safe integer');
    }
    const folio = await this.lock(tx, input.folioId);
    if (!folio) throw new Error(`folio ${input.folioId} not visible for ${input.reservationCode}`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const nightIds = new Set(input.voidedStayNightIds);
    const voidedDates = new Set(
      (await this.liveLines(tx, folio.id, input.reservationId))
        .filter(
          (l) => l.category === 'room' && l.stay_night_id !== null && nightIds.has(l.stay_night_id),
        )
        .map((l) => l.service_date ?? ''),
    );
    // S4-22 / S4-18 (BR-315 (g), BR-434): the FOC of the voided nights – suspended (no-show) or cancelled –
    // and every pending FOC of the booking auto-cancelled, BEFORE the nights are reversed.
    await this.voidReductionKeys(tx, folio.id, input, voidedDates, who, 'before');
    const live = await this.liveLines(tx, folio.id, input.reservationId);
    const voidedRoom = live.filter(
      (l) => l.category === 'room' && l.stay_night_id !== null && nightIds.has(l.stay_night_id),
    );
    const dates = new Set(voidedRoom.map((l) => l.service_date));
    let reversedVnd = 0;
    for (const l of voidedRoom) {
      reversedVnd += await this.reverseWithReductions(tx, l, live, who.userId, now);
    }
    for (const l of live.filter(
      (x) => x.category === 'extra_person' && dates.has(x.service_date),
    )) {
      reversedVnd += await this.reverseWithReductions(tx, l, live, who.userId, now);
    }
    // DOM-S4-13 (BR-309 / BR-429 (c) v0.3.8): the OTA room-change difference of a voided night goes with it.
    for (const l of live.filter(
      (x) => x.category === 'room_change_difference' && dates.has(x.service_date),
    )) {
      reversedVnd += await this.reverseWithReductions(
        tx,
        l,
        live,
        who.userId,
        now,
        DIFFERENCE_VOID_REASON,
      );
    }
    // S4-08 (BR-309 v0.3.4): service lines not performed go with the booking (with their FOC); the desk keeps
    // the ones with a cost already incurred (reason in the audit below).
    let serviceReversedVnd = 0;
    let serviceRetainedVnd = 0;
    const retainNotes: string[] = [];
    if (input.services) {
      const keep = new Map(input.services.retainLines.map((r) => [r.lineId, r.reason]));
      for (const l of live.filter((x) => SERVICE_CATEGORIES.has(x.category))) {
        if (keep.has(l.id)) {
          serviceRetainedVnd += l.amount_vnd;
          retainNotes.push(`${l.category} ${l.id}: ${keep.get(l.id)}`);
          continue;
        }
        const r = await this.reverseWithReductions(
          tx,
          l,
          live,
          who.userId,
          now,
          'service not performed – booking closed (BR-309)',
        );
        serviceReversedVnd += r;
        reversedVnd += r;
      }
    }
    let feeVnd = 0;
    if (retained > 0) {
      const category =
        input.retainedKind ?? (input.reason === 'no_show' ? 'no_show_fee' : 'cancellation_fee');
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: input.reservationId,
        category,
        description: category,
        quantity: 1,
        unitPriceVnd: retained,
        amountVnd: retained,
        serviceDate: localDate(now, await this.timezone(tx)),
        stayNightId: null,
        source: 'system',
        postedBy: who.userId,
        now,
      });
      feeVnd = retained;
    }
    await this.voidReductionKeys(tx, folio.id, input, voidedDates, who, 'after');
    await this.channelFeeAfterVoid(tx, input, feeVnd, now);
    if (reversedVnd !== 0 || feeVnd > 0 || serviceRetainedVnd > 0) {
      await this.audit.recordMoney(tx, {
        action: 'folio.stay_reversed',
        entityType: 'folio',
        entityId: folio.id,
        entityCode: input.reservationCode,
        after: {
          reversedVnd,
          feeVnd,
          status: input.reason,
          ...(input.services ? { serviceReversedVnd, serviceRetainedVnd } : {}),
        },
        ...(retainNotes.length
          ? { reason: `retained: ${retainNotes.join('; ')}`.slice(0, 500) }
          : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
    }
    await this.syncOtaCollect(tx, folio.id, input.reservationId, null, {
      userId: who.userId,
      reservationCode: input.reservationCode,
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
  }

  /**
   * BR-310 / BR-901 (DOM 17/10, oracle BR-310-01): after a void the OTA channel fee is due on what remains sold
   * plus the OTA cancellation penalty – the reported fee when there is one, else the rate snapshot × base. The
   * penalty is no sold night: nothing is allocated to the voided nights and it earns no commission.
   */
  private async channelFeeAfterVoid(
    tx: Tx,
    input: VoidStayInput,
    feeVnd: number,
    now: Date,
  ): Promise<void> {
    const { rows } = await tx.query<{
      id: string;
      base_amount_vnd: number;
      rate_pct_snapshot: string;
      amount_estimated_vnd: number;
      amount_actual_vnd: number | null;
    }>(
      `SELECT id, base_amount_vnd, rate_pct_snapshot, amount_estimated_vnd, amount_actual_vnd
         FROM channel_fee WHERE reservation_id = $1 FOR UPDATE`,
      [input.reservationId],
    );
    const old = rows[0];
    if (!old) return;
    const { rows: sold } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(SUM(l.amount_vnd), 0) AS total FROM folio_line l
        WHERE l.folio_id = $1 AND l.reservation_id = $2 AND l.category = 'room' AND l.line_state = 'posted'`,
      [input.folioId, input.reservationId],
    );
    const base = Math.max(0, Number(sold[0]?.total ?? 0)) + feeVnd;
    const estimated = applyPct(base, Number(old.rate_pct_snapshot), 1);
    // A reported fee on the penalty wins (BR-901 "số thực tế"); otherwise the earlier actual no longer fits
    // the new base → back to the estimate.
    const actual = input.channelFeeActualVnd ?? null;
    if (
      old.base_amount_vnd === base &&
      old.amount_estimated_vnd === estimated &&
      old.amount_actual_vnd === actual
    ) {
      return;
    }
    await tx.query(
      `UPDATE channel_fee SET base_amount_vnd = $2, amount_estimated_vnd = $3, amount_actual_vnd = $4,
          source = $5, updated_at = $6, version = version + 1
        WHERE id = $1`,
      [old.id, base, estimated, actual, actual === null ? 'estimate' : 'manual_reconcile', now],
    );
    await this.audit.recordMoney(tx, {
      action: 'channel_fee.updated',
      entityType: 'channel_fee',
      entityId: input.reservationId,
      entityCode: input.reservationCode,
      before: { baseVnd: old.base_amount_vnd, amountEstimatedVnd: old.amount_estimated_vnd },
      after: {
        baseVnd: base,
        amountEstimatedVnd: estimated,
        amountActualVnd: actual,
        source: actual === null ? 'estimate' : 'manual_reconcile',
      },
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
  }

  /**
   * x-ota-prepaid-rule kept after a MANUAL change of the folio (re-verification 17/10, DOM BE-13): line
   * adjustment / reversal (open or settled folio), FOC/discount decision, and B18 as a safety net before the
   * balance check. Acts only when the booking already has its system receipt (paymentModel unknown here).
   */
  async resyncOtaCollect(
    tx: Tx,
    folioId: string,
    reservationId: string | null,
    actor: FolioActor,
  ): Promise<void> {
    const rid = reservationId ?? (await this.get(tx, folioId))?.primary_reservation_id;
    if (!rid) return;
    await this.syncOtaCollect(tx, folioId, rid, null, actor);
  }

  /**
   * DOM BE-13 / BR-307: an `ota_prepaid` booking has ONE live system receipt `ota_collect` (provider
   * `ota_system`, reconciliation `not_required` until the OTA payout reconciliation of R3) equal to the
   * OTA-covered charges of the booking: nights and the fees the OTA keeps (cancellation – BR-310, no-show,
   * early departure), before any FOC/discount (none allowed on an OTA prepaid night – DOM 17/10) and never the
   * extra-person fee (collected at the desk).
   * Called by: the night sync (syncStay, voidStay), postLines of an OTA-covered category, reverseLine,
   * adjustFolioLine, the FOC/discount decision and B18 (resyncOtaCollect). A different amount → the old
   * receipt is reversed (BR-008) and a new one written. `paymentModel` null = unknown here: acts only when
   * the booking already has a system receipt.
   * Lines of child bookings (B9a / OTA extension, direct channel) are paid at the desk – not covered.
   */
  async syncOtaCollect(
    tx: Tx,
    folioId: string,
    reservationId: string,
    paymentModel: string | null,
    actor: FolioActor,
  ): Promise<void> {
    // DOM BE-13 (verification 17/10): only THIS booking's system receipt – a direct child booking (B9a, B13,
    // E05-11) on the same folio never touches the OTA receipt of its parent.
    const { rows: live } = await tx.query<{ id: string; amount_vnd: number; code: string }>(
      `SELECT id, amount_vnd, code FROM payment
        WHERE folio_id = $1 AND reservation_id = $2 AND provider = 'ota_system' AND status = 'succeeded'
          AND reversal_of_id IS NULL
        FOR UPDATE`,
      [folioId, reservationId],
    );
    if (live.length === 0 && paymentModel !== 'ota_prepaid') return;
    // Known non-prepaid model with a system receipt (model changed) → target 0: the receipt is reversed.
    const covered = paymentModel === 'ota_prepaid' || paymentModel === null;
    let target = 0;
    if (covered) {
      const { rows } = await tx.query<{ total: string | number | null }>(
        `WITH live AS (
           SELECT l.* FROM folio_line l
            WHERE l.folio_id = $1 AND l.reservation_id = $2 AND l.line_state = 'posted'
              AND l.reversal_of_id IS NULL
              AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id))
         SELECT COALESCE(SUM(c.amount_vnd), 0) AS total
           FROM live c WHERE c.category = ANY($3::text[])`,
        [folioId, reservationId, [...OTA_COVERED]],
      );
      target = Math.max(0, Number(rows[0]?.total ?? 0));
    }
    if (live.length === 1 && live[0]?.amount_vnd === target) return;
    if (live.length === 0 && target === 0) return;
    if (!this.docNumbers) throw new Error('FolioService.syncOtaCollect needs DocNumberService');
    const now = this.clock.now();
    for (const p of live) {
      const revCode = await this.docNumbers.allocate(tx, 'payment');
      await tx.query(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
           reconciliation, amount_vnd, status, received_at, provider, reversal_of_id, reversal_reason,
           created_at, updated_at)
         SELECT $2, organization_id, property_id, $3, folio_id, reservation_id, type, method, 'not_required',
                -amount_vnd, 'succeeded', $4, provider, id, 'ota_prepaid_resync', $4, $4
           FROM payment WHERE id = $1`,
        [p.id, uuidv7(), revCode, now],
      );
      await tx.query(
        `UPDATE payment SET status = 'reversed', updated_at = $2, version = version + 1 WHERE id = $1`,
        [p.id, now],
      );
    }
    let code: string | null = null;
    if (target > 0) {
      code = await this.docNumbers.allocate(tx, 'payment');
      await tx.query(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
           reconciliation, amount_vnd, status, received_at, provider, note, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'charge', 'ota_collect', 'not_required', $7, 'succeeded', $8,
           'ota_system', 'ota_prepaid', $8, $8)`,
        [
          uuidv7(),
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          code,
          folioId,
          reservationId,
          target,
          now,
        ],
      );
    }
    await this.touch(tx, folioId);
    await this.audit.recordMoney(tx, {
      action: live.length ? 'payment.ota_collect_adjusted' : 'payment.ota_collected',
      entityType: 'payment',
      entityId: reservationId,
      ...(actor.reservationCode ? { entityCode: actor.reservationCode } : {}),
      ...(live.length ? { before: { amountVnd: live.reduce((a, p) => a + p.amount_vnd, 0) } } : {}),
      after: { method: 'ota_collect', amountVnd: target, ...(code ? { code } : {}) },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
  }

  // ───────────── sync (B2/B4/B7/B8/B12/B13/B16/PATCH) ─────────────

  private async syncStay(
    tx: Tx,
    stay: ConfirmedStay,
    who: { userId: string | null; requestId?: string; cause?: LineChangeCause },
    sync: 'confirmed' | 'resynced',
  ): Promise<SyncResult> {
    const folio = await this.lock(tx, stay.folioId);
    if (!folio) throw new Error(`folio ${stay.folioId} not visible for ${stay.reservationCode}`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const tz = await this.timezone(tx);
    const today = localDate(now, tz);
    const by = who.userId;
    let live = await this.liveLines(tx, folio.id, stay.reservationId);
    const result: SyncResult = { roomVnd: 0, extraPersonVnd: 0, reversedVnd: 0, commissionVnd: 0 };

    // B12: a restored no-show drops its fee (the nights are charged again below).
    for (const l of live.filter((x) => x.category === 'no_show_fee')) {
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }

    // Room nights. A room line carries the night's GROSS price (stay_night.room_revenue_gross_vnd); FOC and
    // special discounts are their own lines, recomputed per KEY from the APPROVED amounts by syncReductions
    // below (S4-02, BR-434 v0.3.5: min(số đã duyệt, giá mới), dormant / restored; S4-23 order) – never carried
    // from the FOC line still on the folio (BUG-R2-056) and never netted into the room line (BUG-R2-055: a FOC
    // above the new price made the night negative and broke the commission allocation).
    const target = new Map(stay.nights.map((n) => [n.stayNightId, n]));
    const revenue = await this.nights.revenueOf(
      tx,
      stay.nights.map((n) => n.stayNightId),
    );
    const grossOf = (n: ConfirmedStay['nights'][number]) =>
      revenue.get(n.stayNightId)?.grossVnd ?? Math.max(0, n.roomRevenueVnd);
    const roomLines = live
      .filter((x) => x.category === 'room' && x.stay_night_id)
      .sort((x, y) => (x.service_date ?? '').localeCompare(y.service_date ?? ''));
    const newNights = [...stay.nights].sort((x, y) => x.date.localeCompare(y.date));
    // BR-434 (1)–(3) by DATE (S4-14): the FOC keys of this booking's dates follow the date map BEFORE the lines
    // move (kept date → itself, dropped[i] → added[i], no counterpart → cancelled / auto-cancelled).
    const movedFrom = await this.moveReductionKeys(
      tx,
      folio.id,
      roomLines.map((l) => l.service_date ?? ''),
      newNights.map((n) => n.date),
      who,
    );
    live = await this.liveLines(tx, folio.id, stay.reservationId);
    const kept = new Set<string>();
    for (const l of live
      .filter((x) => x.category === 'room' && x.stay_night_id)
      .sort((x, y) => (x.service_date ?? '').localeCompare(y.service_date ?? ''))) {
      const night = target.get(l.stay_night_id as string);
      if (night && !kept.has(night.stayNightId) && l.amount_vnd === grossOf(night)) {
        kept.add(night.stayNightId);
        continue;
      }
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }
    for (const n of newNights) {
      if (kept.has(n.stayNightId)) continue;
      const gross = grossOf(n);
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: stay.reservationId,
        category: 'room',
        description: n.extraNight ? 'extra_night' : 'room_night',
        quantity: 1,
        unitPriceVnd: gross,
        amountVnd: gross,
        serviceDate: n.date,
        stayNightId: n.stayNightId,
        source: 'system',
        postedBy: who.userId,
        now,
        chargeCode: n.extraNight ? 'extra_night' : null,
        labelParams: { date: n.date },
        // BR-433 (d) v0.4.1: the reference rate of the night (system price paths only) – never the typed price.
        limitRefVnd: n.referenceRateVnd,
      });
      result.roomVnd += gross;
    }

    // Extra-person fee (BR-110): one line per sold night at THAT night's fee (BE-A review fix, DOM S3-13 /
    // FB-R2-ARC-BE-S3-01 – `ConfirmedStay.nights[].extraPersonVnd`; mid-stay changes apply from `effectiveFrom`).
    // Its FOC is a key of its own (date) – handled by syncReductions like the room nights (0 → dormant).
    live = await this.liveLines(tx, folio.id, stay.reservationId);
    const wanted = new Map<string, number>();
    // Blocker verification ARC-S3-01 (BE-A, 17/10): the label counts the extra persons of THAT night.
    const countOf = new Map<string, number>();
    for (const n of stay.nights) {
      const fee = n.extraPersonVnd ?? stay.extraPersonPerNightVnd;
      if (fee > 0) wanted.set(n.date, fee);
      countOf.set(n.date, n.extraPersonCount ?? stay.extraGuestCount);
    }
    const keptDates = new Set<string>();
    for (const l of live.filter((x) => x.category === 'extra_person')) {
      const d = l.service_date ?? '';
      if (wanted.get(d) === l.amount_vnd && !keptDates.has(d)) {
        keptDates.add(d);
        continue;
      }
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }
    for (const [d, fee] of wanted) {
      if (keptDates.has(d)) continue;
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: stay.reservationId,
        category: 'extra_person',
        description: `extra_guest x${countOf.get(d) ?? stay.extraGuestCount}`,
        quantity: 1,
        unitPriceVnd: fee,
        amountVnd: fee,
        serviceDate: d,
        stayNightId: null,
        source: 'system',
        postedBy: who.userId,
        now,
        labelParams: {
          date: d,
          ...((countOf.get(d) ?? stay.extraGuestCount) > 0
            ? { count: countOf.get(d) ?? stay.extraGuestCount }
            : {}),
        },
      });
      result.extraPersonVnd += fee;
    }

    // DOM-S4-13: B12 (the folio of a no-show synced again – a void booking is never synced, voidStay is its
    // path) brings back the OTA room-change difference voided with its night (BR-429 (c) – it follows the night
    // both ways). Nothing to do for any other booking (no difference reversed for that reason).
    await this.repostVoidedDifferences(tx, folio.id, stay, by, now);

    // FOC / special discounts of every key of the folio (S4-02/S4-18/S4-22/S4-23) – B12 brings back the FOC
    // suspended at the no-show on the nights sold again (BR-315 (g)) and on the services the desk kept
    // (DOM-S4-15).
    await this.syncReductions(tx, folio.id, {
      userId: who.userId,
      ...(who.requestId ? { requestId: who.requestId } : {}),
      ...(who.cause ? { cause: who.cause } : {}),
      restoreDates: new Set(newNights.map((n) => n.date)),
      restoreReservationId: stay.reservationId,
      movedFrom,
    });

    // S4-03 (BUG-R2-055): commission and channel fee on the nights AFTER the reductions moved (net = gross −
    // what is applied on the night now, never negative) – not on the values read before the sync.
    const nets = await this.nights.revenueOf(
      tx,
      stay.nights.map((n) => n.stayNightId),
    );
    const netStay: ConfirmedStay = {
      ...stay,
      nights: stay.nights.map((n) => ({
        ...n,
        roomRevenueVnd: Math.max(0, nets.get(n.stayNightId)?.netVnd ?? n.roomRevenueVnd),
      })),
    };
    result.commissionVnd = await this.syncCommission(tx, netStay, today, now, who.requestId);
    await this.syncChannelFee(tx, netStay, today, now, who.requestId);
    await this.syncOtaCollect(tx, folio.id, stay.reservationId, stay.paymentModel ?? null, {
      userId: who.userId,
      reservationCode: stay.reservationCode,
      ...(who.requestId ? { requestId: who.requestId } : {}),
    });

    if (result.roomVnd !== 0 || result.extraPersonVnd !== 0 || result.reversedVnd !== 0) {
      // Closed money-log list (OpenAPI 0.3.6 bổ sung 2 – AuditEvent.action): one entry per sync, named by
      // what it did; `after.sync` tells a first posting (B2/B4/B12) from a resync (B7/B8/B13/B14/B16/PATCH).
      await this.audit.recordMoney(tx, {
        action:
          result.roomVnd !== 0 || result.extraPersonVnd !== 0
            ? 'folio.line_posted'
            : 'folio.line_reversed',
        entityType: 'folio',
        entityId: folio.id,
        entityCode: stay.reservationCode,
        after: {
          sync,
          roomVnd: result.roomVnd,
          extraPersonVnd: result.extraPersonVnd,
          reversedVnd: result.reversedVnd,
          nights: stay.nights.length,
          commissionVnd: result.commissionVnd,
        },
        ...(who.requestId ? { requestId: who.requestId } : {}),
      });
    }
    return result;
  }

  // ───────────── FOC keys (S4-02, S4-18, S4-22, S4-23, S4-34 – BR-434 v0.3.5/v0.3.6, BR-433, BR-412) ─────────────

  private requireApprovals(): ApprovalService {
    if (!this.approvals) throw new Error('FolioService needs ApprovalService to move a FOC');
    return this.approvals;
  }

  /**
   * Open (pending/escalated) and alive (approved: applied / dormant / suspended) foc + special_discount requests
   * of a folio with their key: the category of the line the request was made on (never changes) and the
   * current key date (foc_service_date, falling back to that line's date). `lock` = FOR UPDATE (writes; lock
   * order folio → approval_request – the caller holds the folio); read-only views pass false.
   */
  async reductionRequests(
    tx: Tx,
    folioId: string,
    opts: { lock: boolean; ids?: readonly string[] },
  ): Promise<FolioReductionRequest[]> {
    const { rows } = await tx.query<{
      id: string;
      type: 'foc' | 'special_discount';
      status: 'pending' | 'escalated' | 'approved';
      foc_state: 'applied' | 'dormant' | 'suspended' | null;
      amount_vnd: number;
      applied_cap_vnd: number | string | null;
      decided_at: Date | null;
      requested_at: Date;
      reason_code: string;
      target_code: string | null;
      folio_line_id: string;
      line_change: LineChange | null;
      foc_service_date: string | null;
      origin_line_id: string;
      origin_category: string;
      origin_date: string | null;
      origin_charge_code: string | null;
    }>(
      `SELECT a.id, a.type, a.status, a.foc_state, a.amount_vnd, a.applied_cap_vnd, a.decided_at, a.requested_at,
              a.reason_code,
              a.target_code, a.folio_line_id, a.line_change, a.foc_service_date::text AS foc_service_date,
              c.id AS origin_line_id, c.category AS origin_category, c.service_date::text AS origin_date,
              c.charge_code AS origin_charge_code
         FROM approval_request a
         JOIN folio_line f0 ON f0.id = a.folio_line_id
         JOIN folio_line c ON c.id = f0.related_line_id
        WHERE f0.folio_id = $1 AND a.type IN ('foc', 'special_discount')
          AND (a.status IN ('pending', 'escalated')
               OR (a.status = 'approved' AND COALESCE(a.foc_state, 'applied') IN ('applied', 'dormant', 'suspended')))
          AND ($2::uuid[] IS NULL OR a.id = ANY($2::uuid[]))
        ORDER BY a.requested_at, a.id
        ${opts.lock ? 'FOR UPDATE OF a' : ''}`,
      [folioId, opts.ids ? [...opts.ids] : null],
    );
    return rows.map((r) => {
      const dated = keyKindOf(r.origin_category) === 'night';
      return {
        id: r.id,
        type: r.type,
        status: r.status === 'approved' ? 'approved' : r.status,
        focState: r.status === 'approved' ? (r.foc_state ?? 'applied') : null,
        // FB-R2-SEC-BE-80: a debt write-off never applies more than its cap fixed when it was applied (BR-525).
        amountVnd:
          r.applied_cap_vnd === null
            ? Number(r.amount_vnd)
            : Math.min(Number(r.amount_vnd), Number(r.applied_cap_vnd)),
        decidedAt: r.decided_at,
        requestedAt: r.requested_at,
        reasonCode: r.reason_code,
        category: r.origin_category,
        serviceDate: dated ? (r.foc_service_date ?? r.origin_date) : null,
        storedServiceDate: r.foc_service_date,
        originLineId: r.origin_line_id,
        itemCode: r.origin_category === 'minibar' ? r.origin_charge_code : null,
        targetCode: r.target_code,
        folioLineId: r.folio_line_id,
        lineChange: r.line_change,
      };
    });
  }

  /** Read-only plan of every key of a folio – the ONE computation of the write (syncReductions) and the views. */
  private planReductions(
    reqs: readonly FolioReductionRequest[],
    idx: LineIndex,
    restoreDates?: ReadonlySet<string>,
    restoreReservationId?: string,
  ): ReductionKeyPlan[] {
    const groups = new Map<string, ReductionKeyPlan>();
    for (const r of reqs) {
      if (r.status === 'approved' && r.focState === 'suspended') {
        const back =
          keyKindOf(r.category) !== 'night'
            ? !!restoreReservationId && idx.keyLine(r).line?.reservation_id === restoreReservationId
            : !!r.serviceDate && !!restoreDates?.has(r.serviceDate);
        if (!back) continue;
      }
      const k = keyOf(r);
      let g = groups.get(k);
      if (!g) {
        const found = idx.keyLine(r);
        g = { key: k, line: found.line, gone: found.gone, approved: [], pending: [] };
        groups.set(k, g);
      }
      if (r.status === 'approved') g.approved.push({ r, vnd: 0 });
      else g.pending.push({ r, vnd: 0 });
    }
    for (const g of groups.values()) {
      if (g.gone) continue;
      const a = allocateKey(
        g.line?.amount_vnd ?? 0,
        g.approved.map((x) => x.r),
        g.pending.map((x) => x.r),
      );
      for (const x of g.approved) x.vnd = a.applied.get(x.r.id) ?? 0;
      for (const x of g.pending) x.vnd = a.willApply.get(x.r.id) ?? 0;
    }
    return [...groups.values()];
  }

  /**
   * THE FOC sync of a folio (S4-02 + S4-18 + S4-23 + S4-34; BR-434 v0.3.5/v0.3.6, BR-412, BR-433): after any
   * re-write of charge lines (night sync, late check-out change, line adjustment/reversal, a decision), every
   * key is recomputed from the APPROVED amounts in approval order:
   * - approved: one live FOC line = applied (0 → none, `dormant`; > 0 again → `restored`, no re-approval);
   *   a key whose night left the stay → `cancelled` (night_removed), limit given back;
   * - pending: its "chờ duyệt" line follows the current line of the key (lineChangedNote), stays pending – the
   *   approval applies min(asked, line − what the earlier reductions apply); no line any more → auto-cancelled;
   * - money audit folio.foc_posted / foc_requested / line_reversed / foc_dormant / foc_restored /
   *   foc_cancelled in the same transaction; stay_night.discount_vnd = what is applied on the night.
   * Idempotent: a consistent folio is left untouched. Lock order: folio (here) → approval_request.
   */
  async syncReductions(tx: Tx, folioId: string, opts: ReductionSyncOptions): Promise<void> {
    const folio = await this.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    const reqs = await this.reductionRequests(tx, folio.id, { lock: true });
    if (reqs.length === 0) return;
    const approvals = this.requireApprovals();
    const now = this.clock.now();
    const idx = new LineIndex(await this.lines(tx, folio.id));
    for (const g of this.planReductions(reqs, idx, opts.restoreDates, opts.restoreReservationId)) {
      for (const r of [...g.approved.map((x) => x.r), ...g.pending.map((x) => x.r)]) {
        // 0060: the key date is stored (legacy rows fall back to the date of their line).
        if (r.serviceDate && r.storedServiceDate === null) {
          await approvals.setFocKeyDate(tx, r.id, r.serviceDate);
        }
      }
      if (g.gone) {
        for (const { r } of g.approved) await this.cancelFoc(tx, r, 'night_removed', idx, opts);
        for (const { r } of g.pending) {
          await approvals.autoCancel(tx, r.id, 'line_removed', opts.requestId);
        }
        continue;
      }
      for (const { r, vnd } of g.approved) {
        await this.applyFoc(tx, folio.status, r, g.line, vnd, idx, opts, now);
      }
      for (const { r, vnd } of g.pending) {
        await this.followPending(tx, r, g.line, vnd, idx, opts, now);
      }
    }
    await this.syncNightDiscounts(tx, folio.id);
  }

  /** An approved request on its key: exactly one live FOC line of `vnd` on the current line (none when 0). */
  private async applyFoc(
    tx: Tx,
    folioStatus: FolioRow['status'],
    r: FolioReductionRequest,
    line: FolioLineRow | null,
    vnd: number,
    idx: LineIndex,
    opts: ReductionSyncOptions,
    now: Date,
  ): Promise<void> {
    const mine = idx.linesOf(r);
    const live = mine.filter((l) => idx.isLive(l));
    const pend = mine.filter((l) => l.line_state === 'pending_approval');
    if (vnd > 0 && line) {
      const one = live.length === 1 ? live[0] : undefined;
      if (one && pend.length === 0 && one.related_line_id === line.id && one.amount_vnd === -vnd) {
        if (one.approval_request_id !== r.id) await this.linkLine(tx, one.id, r.id);
      } else {
        const p =
          live.length === 0
            ? pend.find((x) => x.related_line_id === line.id && x.amount_vnd === -vnd)
            : undefined;
        for (const l of live) await this.reverseFocLine(tx, l, r, opts, now);
        for (const x of pend) {
          if (x !== p) await this.setLineState(tx, x.id, 'rejected');
        }
        let id: string;
        if (p) {
          // The classic path: the "chờ duyệt" line itself becomes the posted FOC (same amount, same line).
          await tx.query(
            `UPDATE folio_line SET line_state = 'posted', approval_request_id = $2 WHERE id = $1`,
            [p.id, r.id],
          );
          await this.touch(tx, p.folio_id);
          id = p.id;
        } else {
          id = await this.insertFocLine(tx, r, line, -vnd, 'posted', opts, now);
        }
        await this.audit.recordMoney(tx, {
          action: 'folio.foc_posted',
          entityType: 'folio_line',
          entityId: id,
          ...(r.targetCode ? { entityCode: r.targetCode } : {}),
          after: {
            category: r.type === 'foc' ? 'foc' : 'discount',
            amountVnd: -vnd,
            lineState: 'posted',
            relatedCategory: line.category,
          },
          reason: 'FOC on the current line of its key (BR-434)',
          ...(opts.requestId ? { requestId: opts.requestId } : {}),
        });
      }
    } else {
      for (const l of live) await this.reverseFocLine(tx, l, r, opts, now);
      for (const x of pend) await this.setLineState(tx, x.id, 'rejected');
    }
    // State (erd 4.6): applied / dormant; a settled stay keeps no dormant FOC (BR-434 "chốt folio khi FOC
    // còn ngủ" → cancelled, "không áp").
    const next: FocState = vnd > 0 ? 'applied' : folioStatus === 'open' ? 'dormant' : 'cancelled';
    if (next === r.focState) return;
    await this.requireApprovals().setFocState(tx, r.id, {
      focState: next,
      ...(next === 'cancelled' ? { focCancelReason: 'settled_while_dormant' as const } : {}),
    });
    await this.auditFocState(
      tx,
      r,
      next,
      vnd,
      opts,
      next === 'cancelled' ? 'settled_while_dormant' : null,
    );
  }

  /**
   * A pending request follows the current line of its key (S4-18): its "chờ duyệt" line is re-pointed (old one
   * `rejected`, new one on the current line, same asked amount) and lineChangedNote records old → new line.
   */
  private async followPending(
    tx: Tx,
    r: FolioReductionRequest,
    line: FolioLineRow | null,
    willApplyVnd: number,
    idx: LineIndex,
    opts: ReductionSyncOptions,
    now: Date,
  ): Promise<void> {
    const pend = idx.linesOf(r).filter((l) => l.line_state === 'pending_approval');
    const current = pend[pend.length - 1];
    for (const x of pend) if (x !== current) await this.setLineState(tx, x.id, 'rejected');
    const cause = opts.cause ?? defaultCause(r.category);
    if (line) {
      if (current && current.related_line_id === line.id) {
        if (current.approval_request_id !== r.id) await this.linkLine(tx, current.id, r.id);
        return;
      }
      const old = current?.related_line_id ? idx.byId(current.related_line_id) : null;
      if (current) await this.setLineState(tx, current.id, 'rejected');
      const id = await this.insertFocLine(tx, r, line, -r.amountVnd, 'pending_approval', opts, now);
      await this.audit.recordMoney(tx, {
        action: 'folio.foc_requested',
        entityType: 'folio_line',
        entityId: id,
        ...(r.targetCode ? { entityCode: r.targetCode } : {}),
        after: {
          category: r.type === 'foc' ? 'foc' : 'discount',
          amountVnd: -r.amountVnd,
          lineState: 'pending_approval',
          relatedCategory: line.category,
        },
        reason: `pending request follows the re-posted line (BR-434 S4-18), will apply ${willApplyVnd}`,
        ...(opts.requestId ? { requestId: opts.requestId } : {}),
      });
      const from = opts.movedFrom?.get(r.id);
      await this.requireApprovals().setLineChange(tx, r.id, {
        oldLineVnd: old?.amount_vnd ?? 0,
        newLineVnd: line.amount_vnd,
        ...(from && line.service_date && from !== line.service_date
          ? { fromServiceDate: from, toServiceDate: line.service_date }
          : {}),
        cause,
        changedAt: now.toISOString(),
      });
      return;
    }
    // The key is alive but has no line now (fee back to 0, late check-out back inside the grace): the request
    // stays pending (approving it makes the FOC dormant) – the note says the line is 0 now.
    const old = current?.related_line_id ? idx.byId(current.related_line_id) : null;
    if (old && !idx.isLive(old) && r.lineChange?.newLineVnd !== 0) {
      await this.requireApprovals().setLineChange(tx, r.id, {
        oldLineVnd: old.amount_vnd,
        newLineVnd: 0,
        cause,
        changedAt: now.toISOString(),
      });
    }
  }

  /** BR-434 / BR-433: an approved FOC cancelled by rule – its lines reversed, `cancelled`, limit given back. */
  private async cancelFoc(
    tx: Tx,
    r: FolioReductionRequest,
    reason: FocCancelReason,
    idx: LineIndex,
    opts: Pick<ReductionSyncOptions, 'userId' | 'requestId'>,
  ): Promise<void> {
    const now = this.clock.now();
    for (const l of idx.linesOf(r)) {
      if (idx.isLive(l)) await this.reverseFocLine(tx, l, r, opts, now);
      else if (l.line_state === 'pending_approval') await this.setLineState(tx, l.id, 'rejected');
    }
    await this.requireApprovals().setFocState(tx, r.id, {
      focState: 'cancelled',
      focCancelReason: reason,
    });
    await this.auditFocState(tx, r, 'cancelled', 0, opts, reason);
  }

  private async auditFocState(
    tx: Tx,
    r: FolioReductionRequest,
    next: FocState,
    appliedVnd: number,
    opts: Pick<ReductionSyncOptions, 'requestId'>,
    cancelReason: FocCancelReason | null,
  ): Promise<void> {
    const action =
      next === 'cancelled'
        ? 'folio.foc_cancelled'
        : next === 'dormant'
          ? r.focState === 'suspended'
            ? 'folio.foc_restored'
            : 'folio.foc_dormant'
          : next === 'suspended'
            ? 'folio.foc_suspended'
            : 'folio.foc_restored';
    await this.audit.recordMoney(tx, {
      action,
      entityType: 'approval_request',
      entityId: r.id,
      ...(r.targetCode ? { entityCode: r.targetCode } : {}),
      before: { focState: r.focState },
      // OpenAPI 0.3.7 D1 AuditEvent.action: approvalRequestId, serviceDate, amountVnd (approved), reason
      // (= focCancelReason) for foc_cancelled; `from` (dormant | suspended) for foc_restored.
      after: {
        approvalRequestId: r.id,
        focState: next,
        amountVnd: r.amountVnd,
        effectiveAmountVnd: appliedVnd,
        ...(cancelReason ? { focCancelReason: cancelReason, reason: cancelReason } : {}),
        ...(action === 'folio.foc_restored' && r.focState ? { from: r.focState } : {}),
        ...(r.serviceDate ? { serviceDate: r.serviceDate } : {}),
      },
      ...(opts.requestId ? { requestId: opts.requestId } : {}),
    });
  }

  /**
   * BR-434 (1)–(3) by DATE (S4-14) – before the nights of a booking are re-posted, the requests on its dates
   * follow the date map: kept date → itself, dropped[i] → added[i] (key date moved), dropped without a
   * counterpart → approved `cancelled` (night_removed, folio.foc_cancelled, limit given back) / pending
   * auto-cancelled (requester told). A FOC suspended by a no-show is not on a live night – untouched.
   * Returns the moved PENDING requests (id → old date) for their lineChangedNote.
   */
  private async moveReductionKeys(
    tx: Tx,
    folioId: string,
    oldDates: readonly string[],
    newDates: readonly string[],
    who: { userId: string | null; requestId?: string },
  ): Promise<Map<string, string>> {
    const moved = new Map<string, string>();
    if (oldDates.length === 0) return moved;
    const old = new Set(oldDates);
    const reqs = (await this.reductionRequests(tx, folioId, { lock: true })).filter(
      (r) =>
        keyKindOf(r.category) === 'night' &&
        !!r.serviceDate &&
        old.has(r.serviceDate) &&
        !(r.status === 'approved' && r.focState === 'suspended'),
    );
    if (reqs.length === 0) return moved;
    const approvals = this.requireApprovals();
    const goesTo = focDateMap(oldDates, newDates);
    const idx = new LineIndex(await this.lines(tx, folioId));
    for (const r of reqs) {
      const from = r.serviceDate as string;
      const to = goesTo.get(from);
      if (to === undefined) {
        if (r.status === 'approved') await this.cancelFoc(tx, r, 'night_removed', idx, who);
        else await approvals.autoCancel(tx, r.id, 'line_removed', who.requestId);
        continue;
      }
      if (to !== from || r.storedServiceDate === null) await approvals.setFocKeyDate(tx, r.id, to);
      if (to !== from && r.status !== 'approved') moved.set(r.id, from);
    }
    return moved;
  }

  /**
   * B10 / B11 / relocation (S4-22, S4-18, BR-315 (g), BR-434): the requests of the voided nights (room +
   * extra-person keys on those dates) and of the other lines of the booking –
   * - no-show: approved → `suspended` (not applied, out of the monthly limit and the FOC report, back at B12);
   * - cancellation / relocation: approved → `cancelled` (reservation_cancelled, limit given back);
   * - pending → auto-cancelled (`reservation_no_show` / `reservation_cancelled`), requester told.
   * Phase `before` runs BEFORE the lines are reversed (night keys, every pending request of the booking); phase
   * `after` cancels the approved FOC of the booking's other lines the cancellation reversed (S4-08 services not
   * performed) – a line the desk kept (`retainLines`) keeps its FOC.
   */
  private async voidReductionKeys(
    tx: Tx,
    folioId: string,
    input: VoidStayInput,
    dates: ReadonlySet<string>,
    who: { userId: string | null },
    phase: 'before' | 'after',
  ): Promise<void> {
    const reqs = await this.reductionRequests(tx, folioId, { lock: true });
    if (reqs.length === 0) return;
    const { rows: own } = await tx.query<{ id: string }>(
      `SELECT id FROM folio_line WHERE folio_id = $1 AND reservation_id = $2`,
      [folioId, input.reservationId],
    );
    const ownLines = new Set(own.map((l) => l.id));
    const noShow = input.reason === 'no_show';
    const approvals = this.requireApprovals();
    const idx = new LineIndex(await this.lines(tx, folioId));
    const retainedIds = new Set((input.services?.retainLines ?? []).map((x) => x.lineId));
    const opts = { userId: who.userId, ...(input.requestId ? { requestId: input.requestId } : {}) };
    for (const r of reqs) {
      const night = keyKindOf(r.category) === 'night';
      const mine = night
        ? !!r.serviceDate && dates.has(r.serviceDate)
        : ownLines.has(r.originLineId);
      if (!mine) continue;
      if (phase === 'after') {
        if (night || r.status !== 'approved') continue;
        const line = idx.keyLine(r).line;
        // Other lines of the booking: approved FOC whose line the cancellation reversed → cancelled.
        if (!line) {
          await this.cancelFoc(tx, r, 'reservation_cancelled', idx, opts);
          continue;
        }
        // DOM-S4-15 (BR-434 v0.3.8): a service the desk KEPT (`retainLines`) is money OTTIMO collects – its
        // FOC is cancelled with the booking, suspended by a no-show (back at B12; a folio settled while it is
        // suspended cancels it). Lines that are no service (penalty, damage, adjustment…) keep their FOC.
        if (!retainedIds.has(line.id)) continue;
        if (!noShow) {
          await this.cancelFoc(tx, r, 'reservation_cancelled', idx, opts);
        } else if (r.focState !== 'suspended') {
          await this.suspendFoc(tx, r, idx, opts);
        }
        continue;
      }
      if (r.status !== 'approved') {
        await approvals.autoCancel(
          tx,
          r.id,
          noShow ? 'reservation_no_show' : 'reservation_cancelled',
          input.requestId,
        );
      } else if (!night) {
        // A service line of the booking: decided after the reversals (phase `after`).
        continue;
      } else if (noShow) {
        if (r.focState === 'suspended') continue;
        await approvals.setFocState(tx, r.id, { focState: 'suspended' });
        await this.auditFocState(tx, r, 'suspended', 0, opts, null);
      } else {
        await this.cancelFoc(tx, r, 'reservation_cancelled', idx, opts);
      }
    }
  }

  /**
   * DOM-S4-13 (BR-429 (c) v0.3.8): B12 – the OTA room-change difference voided with its night at the no-show
   * (reversal reason DIFFERENCE_VOID_REASON) is posted again for every night sold again (same amount, label,
   * revenue group); a night that already has a live difference line is left alone (idempotent).
   */
  private async repostVoidedDifferences(
    tx: Tx,
    folioId: string,
    stay: ConfirmedStay,
    by: string | null,
    now: Date,
  ): Promise<void> {
    const { rows } = await tx.query<{
      service_date: string;
      amount_vnd: number;
      unit_price_vnd: number;
      quantity: string;
      description: string;
      revenue_group: RevenueGroup;
      charge_code: string | null;
      label_params: Record<string, string | number> | null;
    }>(
      `SELECT o.service_date::text AS service_date, o.amount_vnd, o.unit_price_vnd, o.quantity, o.description,
              o.revenue_group, o.charge_code, o.label_params
         FROM folio_line o JOIN folio_line r ON r.reversal_of_id = o.id
        WHERE o.folio_id = $1 AND o.reservation_id = $2 AND o.category = 'room_change_difference'
          AND o.service_date IS NOT NULL AND r.reason = $3
        ORDER BY o.service_date, o.posted_at`,
      [folioId, stay.reservationId, DIFFERENCE_VOID_REASON],
    );
    if (rows.length === 0) return;
    const all = await this.lines(tx, folioId);
    const idx = new LineIndex(all);
    const sold = new Set(stay.nights.map((n) => n.date));
    const live = new Set(
      all
        .filter(
          (l) =>
            l.category === 'room_change_difference' &&
            l.reservation_id === stay.reservationId &&
            idx.isLive(l),
        )
        .map((l) => l.service_date),
    );
    for (const o of rows) {
      if (!sold.has(o.service_date) || live.has(o.service_date)) continue;
      await this.insertLine(tx, {
        folioId,
        reservationId: stay.reservationId,
        category: 'room_change_difference',
        revenueGroup: o.revenue_group,
        description: o.description,
        quantity: Number(o.quantity),
        unitPriceVnd: Number(o.unit_price_vnd),
        amountVnd: Number(o.amount_vnd),
        serviceDate: o.service_date,
        stayNightId: null,
        source: 'system',
        postedBy: by,
        now,
        chargeCode: o.charge_code,
        labelParams: o.label_params,
        reason: 'B12 – night sold again (BR-429 (c))',
      });
      live.add(o.service_date);
    }
  }

  /**
   * DOM-S4-15 (BR-434 v0.3.8, BR-315 (g)): a no-show suspends the approved FOC on a service the desk kept – the
   * FOC line is reversed (the guest pays the line), the request stays `approved` (out of the monthly limit and
   * the FOC report), B12 brings it back.
   */
  private async suspendFoc(
    tx: Tx,
    r: FolioReductionRequest,
    idx: LineIndex,
    opts: Pick<ReductionSyncOptions, 'userId' | 'requestId'>,
  ): Promise<void> {
    const now = this.clock.now();
    for (const l of idx.linesOf(r)) {
      if (idx.isLive(l)) await this.reverseFocLine(tx, l, r, opts, now);
    }
    await this.requireApprovals().setFocState(tx, r.id, { focState: 'suspended' });
    await this.auditFocState(tx, r, 'suspended', 0, opts, null);
  }

  /**
   * B18 (BR-434 "folio chốt mà FOC còn ngủ"; v0.3.8 "chốt folio khi còn tạm dừng → hủy"): dormant or suspended
   * FOC of a settling folio → cancelled, "không áp" (contract reason `settled_while_dormant`).
   */
  private async cancelDormantOnSettle(tx: Tx, folioId: string, actor: FolioActor): Promise<void> {
    const reqs = (await this.reductionRequests(tx, folioId, { lock: true })).filter(
      (r) => r.status === 'approved' && (r.focState === 'dormant' || r.focState === 'suspended'),
    );
    if (reqs.length === 0) return;
    const idx = new LineIndex(await this.lines(tx, folioId));
    for (const r of reqs) {
      await this.cancelFoc(tx, r, 'settled_while_dormant', idx, {
        userId: actor.userId,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
  }

  /**
   * OpenAPI 0.3.7 D1 ApprovalRequest.effectiveAmountVnd + current FOC line, read-only (approval DTOs): pending →
   * "khi duyệt sẽ áp X" from the same plan as the write; approved → applied now (live FOC lines; settled folio:
   * really applied); anything else → 0.
   */
  async focViews(
    tx: Tx,
    rows: ReadonlyArray<{ id: string; folio_line_id: string | null }>,
  ): Promise<Map<string, FocView>> {
    const out = new Map<string, FocView>();
    const withLine = rows.filter((r) => !!r.folio_line_id);
    if (withLine.length === 0) return out;
    const { rows: folios } = await tx.query<{ id: string; folio_id: string }>(
      `SELECT id, folio_id FROM folio_line WHERE id = ANY($1::uuid[])`,
      [withLine.map((r) => r.folio_line_id)],
    );
    const folioOf = new Map(folios.map((f) => [f.id, f.folio_id]));
    const byFolio = new Map<string, string[]>();
    for (const r of withLine) {
      const f = folioOf.get(r.folio_line_id as string);
      if (!f) continue;
      byFolio.set(f, [...(byFolio.get(f) ?? []), r.id]);
    }
    for (const [folioId, ids] of byFolio) {
      const idx = new LineIndex(await this.lines(tx, folioId));
      const reqs = await this.reductionRequests(tx, folioId, { lock: false });
      const willApply = new Map<string, number>();
      for (const g of this.planReductions(reqs, idx)) {
        for (const x of g.pending) willApply.set(x.r.id, g.gone ? 0 : x.vnd);
      }
      for (const id of ids) {
        const row = rows.find((x) => x.id === id) as { id: string; folio_line_id: string };
        const mine = idx.linesOf({ id, folioLineId: row.folio_line_id });
        const live = mine.filter((l) => idx.isLive(l));
        const pend = mine.filter((l) => l.line_state === 'pending_approval');
        const current = live[live.length - 1] ?? pend[pend.length - 1] ?? mine[mine.length - 1];
        out.set(id, {
          effectiveAmountVnd: willApply.has(id)
            ? (willApply.get(id) as number)
            : live.reduce((a, l) => a - l.amount_vnd, 0),
          folioLineId: current?.id ?? row.folio_line_id,
        });
      }
    }
    return out;
  }

  /**
   * BE-A M2 (S4-04 / S4-21 – "xem trước và lệnh ghi dùng chung một hàm"): the FOC / special discounts the nights
   * of a booking WILL carry after a change, from the SAME allocation as the write (date map BR-434 (1)–(3),
   * min(approved, new line), S4-23 order). Read-only (preview transactions). `nights` = the booking's nights
   * after the change with their gross room price and extra-person fee. Returns per new date the FOC applied
   * and the pending "will apply" amounts (MovePreview.nights[].focVnd / pendingFocVnd), and the applied totals
   * before / after – folioDeltaVnd = lines delta − (newAppliedVnd − oldAppliedVnd).
   */
  async previewStayReductions(
    tx: Tx,
    folioId: string,
    reservationId: string,
    nights: ReadonlyArray<{
      date: string;
      roomVnd: number;
      extraPersonVnd: number;
      /** S438-FOC-04: the OTA room-change difference of the night after the change (with `differences`). */
      differenceVnd?: number;
    }>,
    opts: {
      /**
       * S438-FOC-04 (BE-A move planner): `nights[].differenceVnd` are the room-change differences after the
       * change – the FOC on the difference keys (one per date) is then counted before AND after. Without it the
       * difference keys stay out of both totals (callers that do not re-price the differences).
       */
      differences?: boolean;
    } = {},
  ): Promise<{
    byDate: Map<string, NightReductionPreview>;
    oldAppliedVnd: number;
    newAppliedVnd: number;
  }> {
    const live = await this.liveLines(tx, folioId, reservationId);
    const keyed = opts.differences ? NIGHT_FOLLOWERS : new Set<string>(['room', 'extra_person']);
    const nightLines = new Set(live.filter((l) => keyed.has(l.category)).map((l) => l.id));
    const oldAppliedVnd = live
      .filter(
        (l) =>
          (l.category === 'foc' || l.category === 'discount') &&
          !!l.related_line_id &&
          nightLines.has(l.related_line_id),
      )
      .reduce((a, l) => a - l.amount_vnd, 0);
    const byDate = previewNightReductions({
      requests: await this.reductionRequests(tx, folioId, { lock: false }),
      oldDates: live
        .filter((l) => l.category === 'room' && l.stay_night_id && l.service_date)
        .map((l) => l.service_date as string),
      nights: opts.differences ? nights : nights.map((n) => ({ ...n, differenceVnd: 0 })),
    });
    let newAppliedVnd = 0;
    for (const v of byDate.values()) {
      newAppliedVnd += v.roomFocVnd + v.extraFocVnd + (opts.differences ? v.differenceFocVnd : 0);
    }
    return { byDate, oldAppliedVnd, newAppliedVnd };
  }

  /**
   * BR-402 v0.3.6 (BE-A M4 – check-in "đã thu đủ"): what the PENDING FOC / discount requests of a folio would
   * apply if approved now (Σ "khi duyệt sẽ áp X", same plan as the write), per category of the line they reduce.
   * BR-402: only the requests on incidental charges (not `room`) relieve the amount due at check-in.
   */
  async pendingReductionsVnd(tx: Tx, folioId: string): Promise<Map<string, number>> {
    const idx = new LineIndex(await this.lines(tx, folioId));
    const out = new Map<string, number>();
    for (const g of this.planReductions(
      await this.reductionRequests(tx, folioId, { lock: false }),
      idx,
    )) {
      if (g.gone) continue;
      for (const x of g.pending) {
        out.set(x.r.category, (out.get(x.r.category) ?? 0) + x.vnd);
      }
    }
    return out;
  }

  // ───────────── S4-06 / S4-08 – closing a booking (B10 cancel, B11 no-show; BR-309, BR-522) ─────────────

  /**
   * S4-08 + S4-06 – the ONE calculation behind `cancelReservation` dryRun, the cancellation itself and
   * `markNoShow` (read-only here): the booking's live service lines (reversed unless retained, with the FOC on
   * them), its nights reversed, the fee posted – and the overpayment left on the folio = the refund request the
   * close creates (`refundRequestVnd`; OTA money excluded, requests already open deducted). `retainLines` are
   * validated here (lineId must be a live service line of the booking – NOT_IN_LIST; reason ≥ 3 –
   * REASON_REQUIRED, field `retainLines[i].*`). `today` = business date (performed = service date before it).
   */
  async closeStayPreview(
    tx: Tx,
    folioId: string,
    reservationId: string,
    input: {
      retainLines: ReadonlyArray<{ lineId: string; reason: string }>;
      feeVnd: number;
      feeCategory: 'cancellation_fee' | 'no_show_fee';
      today: LocalDate;
    },
  ): Promise<CloseStayPreview> {
    const all = await this.lines(tx, folioId);
    const idx = new LineIndex(all);
    const reductionsOf = (id: string) =>
      all.filter(
        (r) =>
          r.related_line_id === id &&
          (r.category === 'foc' || r.category === 'discount') &&
          idx.isLive(r),
      );
    const own = all.filter((l) => l.reservation_id === reservationId && idx.isLive(l));
    const services = own.filter((l) => SERVICE_CATEGORIES.has(l.category));
    const byId = new Map(services.map((l) => [l.id, l]));
    const errors: Array<{ field: string; code: string }> = [];
    const retained = new Map<string, string>();
    input.retainLines.forEach((r, i) => {
      if (!byId.has(r.lineId))
        errors.push({ field: `retainLines[${i}].lineId`, code: 'NOT_IN_LIST' });
      const reason = typeof r.reason === 'string' ? r.reason.trim() : '';
      if (reason.length < 3)
        errors.push({ field: `retainLines[${i}].reason`, code: 'REASON_REQUIRED' });
      else if (byId.has(r.lineId)) retained.set(r.lineId, reason);
    });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const noShow = input.feeCategory === 'no_show_fee';
    const removed = new Set<string>();
    const serviceLines: ServiceLineQuote[] = services.map((l) => {
      const reds = reductionsOf(l.id);
      const net = l.amount_vnd + reds.reduce((a, r) => a + r.amount_vnd, 0);
      const keep = retained.has(l.id);
      if (!keep) removed.add(l.id);
      // DOM-S4-15 (BR-434 v0.3.8): a kept service is money OTTIMO collects – its FOC goes too (cancel →
      // cancelled, no-show → suspended): the guest pays the line in full.
      for (const r of reds) removed.add(r.id);
      const { labelKey, labelParams } = lineLabel(l);
      return {
        lineId: l.id,
        category: l.category,
        labelKey,
        ...(labelParams ? { labelParams } : {}),
        ...(l.service_date ? { serviceDate: l.service_date } : {}),
        // DOM-S4-12 (BR-309 v0.3.8): a hint only – cancel: service date < business date; no-show: ≤ (marked
        // from `no_show_mark_time`, the arrival-day service is past – the car already left for the airport).
        amountVnd: keep ? l.amount_vnd : net,
        performed:
          !!l.service_date &&
          (noShow ? l.service_date <= input.today : l.service_date < input.today),
        retained: keep,
        ...(keep ? { retainReason: retained.get(l.id) as string } : {}),
      };
    });
    // The nights of the booking (room + extra person + OTA room-change difference – DOM-S4-13) go with their
    // reductions (voidStay).
    for (const l of own) {
      if (!NIGHT_FOLLOWERS.has(l.category)) continue;
      removed.add(l.id);
      for (const r of reductionsOf(l.id)) removed.add(r.id);
    }
    const lines: Array<Parameters<typeof moneyPosition>[0][number]> = all
      .filter((l) => idx.isLive(l) && !removed.has(l.id))
      .map((l) => ({
        id: l.id,
        amount_vnd: l.amount_vnd,
        line_state: l.line_state,
        category: l.category,
        reservation_id: l.reservation_id,
      }));
    if (input.feeVnd > 0) {
      lines.push({
        amount_vnd: input.feeVnd,
        line_state: 'posted',
        category: input.feeCategory,
        reservation_id: reservationId,
      });
    }
    // x-ota-prepaid-rule: the OTA receipt of the booking follows its OTA-covered lines (syncOtaCollect).
    let payments = (await this.payments(tx, folioId)).filter((p) => !p.reversal_of_id);
    const otaLive = payments.filter(
      (p) =>
        p.provider === 'ota_system' &&
        p.reservation_id === reservationId &&
        p.status === 'succeeded',
    );
    if (otaLive.length > 0) {
      const target = lines
        .filter((l) => l.reservation_id === reservationId && OTA_COVERED.has(l.category ?? ''))
        .reduce((a, l) => a + l.amount_vnd, 0);
      payments = [
        ...payments.filter((p) => !otaLive.includes(p)),
        ...(target > 0 ? [{ ...(otaLive[0] as PaymentRowLite), amount_vnd: target }] : []),
      ];
    }
    const m = moneyPosition(lines, payments);
    const plan = refundPlan(m.creditVnd, await this.openRefunds(tx, folioId));
    const reversed = serviceLines.filter((x) => !x.retained).reduce((a, x) => a + x.amountVnd, 0);
    const kept = serviceLines.filter((x) => x.retained).reduce((a, x) => a + x.amountVnd, 0);
    return {
      serviceLines,
      serviceReversedVnd: reversed,
      serviceRetainedVnd: kept,
      // DOM-S4-14: the request the close makes (supplementary, or again after the pending ones are cancelled).
      refundRequestVnd: plan.createVnd,
    };
  }

  /**
   * S4-06 (BR-522 v0.3.4 bổ sung 17/10) – after a booking was cancelled / marked no-show (its folio already
   * synced: nights and services reversed, fee posted): the overpayment not yet routed to a refund request
   * (OTA money excluded) becomes ONE `refund` request (MGR+ decides, BR-522), and "Cần chú ý"
   * `closed_reservation_credit` stays open until it is paid out (EventsService – no params, BE-D 2.2). An
   * already-open request is never duplicated: only the part not requested yet is requested (SM-10 – the amount
   * of a request never changes). Returns the request created, else the request still open, else null.
   */
  async closeStayCredit(
    tx: Tx,
    input: {
      folioId: string;
      reservationId: string;
      reservationCode: string;
      reasonCode: string;
      reasonNote?: string | null;
      actor: { userId: string; roles: readonly string[] };
      requestId?: string;
    },
  ): Promise<{ id: string; amountVnd: number; created: boolean } | null> {
    const b = await this.balance(tx, input.folioId);
    const approvals = this.requireApprovals();
    // DOM-S4-14 (BR-522 v0.3.8): open requests above the overpayment → the pending ones are cancelled (requester
    // told) and one request of the right amount is made again; below it → a supplementary request.
    const plan = refundPlan(
      b.rawCreditVnd,
      await this.openRefunds(tx, input.folioId, { lock: true }),
    );
    const cancelReason =
      plan.createVnd > 0
        ? ('superseded' as const)
        : input.reasonCode === 'no_show'
          ? ('reservation_no_show' as const)
          : ('reservation_cancelled' as const);
    for (const id of plan.cancelIds) {
      await approvals.autoCancel(tx, id, cancelReason, input.requestId);
    }
    let request: { id: string; amountVnd: number; created: boolean } | null = null;
    if (plan.createVnd > 0) {
      const row = await approvals.submit(tx, input.actor, {
        type: 'refund',
        amountVnd: plan.createVnd,
        reasonCode: input.reasonCode,
        ...(input.reasonNote ? { reasonNote: input.reasonNote } : {}),
        targetType: 'reservation',
        targetId: input.reservationId,
        targetCode: input.reservationCode,
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
      request = { id: row.id, amountVnd: Number(row.amount_vnd), created: true };
    } else if (b.rawCreditVnd > 0) {
      const { rows } = await tx.query<{ id: string; amount_vnd: number }>(
        `SELECT id, amount_vnd FROM approval_request
          WHERE type = 'refund' AND target_type = 'reservation' AND target_id = $1
            AND status IN ('pending', 'escalated', 'approved') AND refunded_vnd < amount_vnd
          ORDER BY requested_at DESC LIMIT 1`,
        [input.reservationId],
      );
      if (rows[0]) {
        request = { id: rows[0].id, amountVnd: Number(rows[0].amount_vnd), created: false };
      }
    }
    if (b.rawCreditVnd > 0 && this.events) {
      await this.events.openAttention(tx, {
        kind: 'closed_reservation_credit',
        severity: 'warning',
        dedupeKey: `closed_reservation_credit:${input.reservationId}`,
        refType: 'reservation',
        refId: input.reservationId,
        refCode: input.reservationCode,
        now: this.clock.now(),
      });
    }
    return request;
  }

  /**
   * S438-CANCEL-03 (BR-522 v0.3.8, BR-315 (f)) – B12: the no-show is undone and its folio synced again (nights,
   * fee reversed). The refund requests the close left are reconciled with the overpayment NOW by the same
   * refundPlan: above it → the pending ones auto-cancelled (`no_show_restored` – 0.3.7 bổ sung 4, migration
   * 0063; requester told) and, only if some
   * overpayment is still left, one request of that amount again; "Cần chú ý" closed_reservation_credit is
   * resolved – the booking is no longer closed.
   */
  async reopenStayCredit(
    tx: Tx,
    input: {
      folioId: string;
      reservationId: string;
      reservationCode: string;
      actor: { userId: string; roles: readonly string[] };
      requestId?: string;
    },
  ): Promise<void> {
    await this.refundsDownToCredit(tx, input, 'no_show_restored');
    if (this.events) {
      await this.events.resolveAttention(
        tx,
        `closed_reservation_credit:${input.reservationId}`,
        this.clock.now(),
        'no-show restored (B12)',
      );
    }
  }

  /**
   * BR-525 (G-4) / BR-522 – a receipt was reversed (`reversePayment`, any booking status): when the overpayment
   * left is now below what the open refund requests of the folio still ask, the same refundPlan as a cancellation
   * runs again – the pending ones are auto-cancelled (`superseded`: replaced by a request of the right amount;
   * requester told) and, only if some overpayment is left, ONE request of that amount is made (SM-10: the amount
   * of a request never changes; approved requests are never touched). A cancelled / no-show booking left with no
   * overpayment closes its "Cần chú ý" closed_reservation_credit (nothing to pay back – the same rule as a
   * refund paid out). Caller holds L3 folio (ARC 16.19); the requests are locked here (L4).
   */
  async reconcileRefundsAfterReversal(
    tx: Tx,
    input: {
      folioId: string;
      reservationId: string;
      reservationCode: string;
      reservationStatus: string;
      actor: { userId: string; roles: readonly string[] };
      requestId?: string;
    },
  ): Promise<{ cancelledIds: string[]; createdId: string | null }> {
    const out = await this.refundsDownToCredit(tx, input, 'superseded');
    if (
      this.events &&
      (input.reservationStatus === 'cancelled' || input.reservationStatus === 'no_show') &&
      (await this.balance(tx, input.folioId)).rawCreditVnd <= 0
    ) {
      await this.events.resolveAttention(
        tx,
        `closed_reservation_credit:${input.reservationId}`,
        this.clock.now(),
        'receipt reversed – nothing to pay back (BR-522)',
      );
    }
    return out;
  }

  /** refundPlan when the open refund requests ask more than the overpayment (reopenStayCredit, reversal). */
  private async refundsDownToCredit(
    tx: Tx,
    input: {
      folioId: string;
      reservationId: string;
      reservationCode: string;
      actor: { userId: string; roles: readonly string[] };
      requestId?: string;
    },
    cancelReason: 'no_show_restored' | 'superseded',
  ): Promise<{ cancelledIds: string[]; createdId: string | null }> {
    const b = await this.balance(tx, input.folioId);
    const open = await this.openRefunds(tx, input.folioId, { lock: true });
    const total = open.reduce((a, r) => a + r.remainingVnd, 0);
    if (total <= Math.max(0, b.rawCreditVnd)) return { cancelledIds: [], createdId: null };
    const approvals = this.requireApprovals();
    const plan = refundPlan(b.rawCreditVnd, open);
    const cancelledIds: string[] = [];
    for (const id of plan.cancelIds) {
      if (await approvals.autoCancel(tx, id, cancelReason, input.requestId)) cancelledIds.push(id);
    }
    let createdId: string | null = null;
    if (plan.createVnd > 0) {
      const row = await approvals.submit(tx, input.actor, {
        type: 'refund',
        amountVnd: plan.createVnd,
        reasonCode: 'overpayment',
        targetType: 'reservation',
        targetId: input.reservationId,
        targetCode: input.reservationCode,
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
      createdId = row.id;
    }
    return { cancelledIds, createdId };
  }

  /**
   * S4-23 (6) / S4-25 (BR-434 v0.3.6): the most a NEW FOC / special-discount request may ask on a charge line =
   * line − (what the reductions on it apply now + what the pending requests on it ask). Every reduction of a key
   * sits on the CURRENT line of the key (syncReductions), so this is the key's headroom. The line must be live.
   */
  async reductionHeadroomVnd(tx: Tx, lineId: string): Promise<number> {
    const u = await this.reductionUsage(tx, lineId);
    return Math.max(0, u.valueVnd - u.usedVnd);
  }

  /**
   * The KEY of a charge line (BR-434) as the reductions see it: its value (the live line; a minibar item = every
   * live line of the item – mô hình M-1, BUG-R2-135) and what the FOC / special-discount lines on it use now
   * (posted, or still asked – `pending_approval`). BR-433 (b) (R3 – FB-R2-SEC-BE-83): `usedVnd` is the Σ of the
   * key a new request is added to before it is compared with the per-time limit.
   */
  async reductionUsage(tx: Tx, lineId: string): Promise<{ valueVnd: number; usedVnd: number }> {
    // Mô hình minibar M-1 (ARC R8, BUG-R2-135): a minibar item is ONE key – its value is every live line of the
    // item, minus every reduction (posted or asked) on any of them.
    const { rows: item } = await tx.query<{
      folio_id: string;
      charge_code: string | null;
      category: string;
    }>('SELECT folio_id, charge_code, category FROM folio_line WHERE id = $1', [lineId]);
    const code = item[0]?.category === 'minibar' ? item[0].charge_code : null;
    if (item[0] && code) {
      const { rows: agg } = await tx.query<{ amount: string | number; used: string | number }>(
        `WITH live AS (
           SELECT l.id, l.amount_vnd FROM folio_line l
            WHERE l.folio_id = $1 AND l.category = 'minibar' AND l.charge_code = $2
              AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
              AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id))
         SELECT COALESCE((SELECT SUM(amount_vnd) FROM live), 0) AS amount,
                COALESCE((SELECT -SUM(f.amount_vnd) FROM folio_line f
                           WHERE f.related_line_id IN (SELECT id FROM live)
                             AND f.category IN ('foc', 'discount')
                             AND f.line_state IN ('posted', 'pending_approval') AND f.reversal_of_id IS NULL
                             AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = f.id)), 0) AS used`,
        [item[0].folio_id, code],
      );
      return { valueVnd: Number(agg[0]?.amount ?? 0), usedVnd: Number(agg[0]?.used ?? 0) };
    }
    const { rows } = await tx.query<{ amount: string | number; used: string | number }>(
      `SELECT l.amount_vnd AS amount,
              COALESCE((SELECT -SUM(f.amount_vnd) FROM folio_line f
                         WHERE f.related_line_id = l.id AND f.category IN ('foc', 'discount')
                           AND f.line_state IN ('posted', 'pending_approval') AND f.reversal_of_id IS NULL
                           AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = f.id)), 0) AS used
         FROM folio_line l WHERE l.id = $1`,
      [lineId],
    );
    const r = rows[0];
    if (!r) return { valueVnd: 0, usedVnd: 0 };
    return { valueVnd: Number(r.amount), usedVnd: Number(r.used) };
  }

  /** stay_night.discount_vnd of every live night = the FOC / discount applied on its room line now (DATA). */
  private async syncNightDiscounts(tx: Tx, folioId: string): Promise<void> {
    const { rows } = await tx.query<{ stay_night_id: string; reduced: string | number }>(
      `SELECT l.stay_night_id,
              COALESCE((SELECT -SUM(r.amount_vnd) FROM folio_line r
                         WHERE r.related_line_id = l.id AND r.category IN ('foc', 'discount')
                           AND r.line_state = 'posted' AND r.reversal_of_id IS NULL
                           AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = r.id)), 0) AS reduced
         FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'room' AND l.stay_night_id IS NOT NULL
          AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id)`,
      [folioId],
    );
    for (const n of rows) await this.nights.setDiscount(tx, n.stay_night_id, Number(n.reduced));
  }

  private async insertFocLine(
    tx: Tx,
    r: FolioReductionRequest,
    line: FolioLineRow,
    amountVnd: number,
    state: 'posted' | 'pending_approval',
    opts: Pick<ReductionSyncOptions, 'userId'>,
    now: Date,
  ): Promise<string> {
    const id = await this.insertLine(tx, {
      folioId: line.folio_id,
      reservationId: line.reservation_id,
      category: r.type === 'foc' ? 'foc' : 'discount',
      revenueGroup: line.revenue_group,
      description: r.type === 'foc' ? 'foc' : 'special_discount',
      quantity: 1,
      unitPriceVnd: amountVnd,
      amountVnd,
      serviceDate: line.service_date,
      stayNightId: null,
      source: 'system',
      postedBy: opts.userId,
      now,
      lineState: state,
      relatedLineId: line.id,
      labelParams: { reason: r.reasonCode },
      reason: 'FOC follows its key (BR-434)',
    });
    await this.linkLine(tx, id, r.id);
    return id;
  }

  private async reverseFocLine(
    tx: Tx,
    l: FolioLineRow,
    r: FolioReductionRequest,
    opts: Pick<ReductionSyncOptions, 'requestId'>,
    now: Date,
  ): Promise<void> {
    const reversed = await this.reverse(tx, l, null, now);
    if (reversed === 0 && l.amount_vnd !== 0) return;
    // The night's discount follows at once (syncNightDiscounts sets the live nights again at the end).
    const rel = l.related_line_id ? await this.lineById(tx, l.related_line_id) : null;
    if (rel?.category === 'room' && rel.stay_night_id) {
      await this.nights.addDiscount(tx, rel.stay_night_id, l.amount_vnd);
    }
    await this.audit.recordMoney(tx, {
      action: 'folio.line_reversed',
      entityType: 'folio_line',
      entityId: l.id,
      ...(r.targetCode ? { entityCode: r.targetCode } : {}),
      before: { category: l.category, amountVnd: l.amount_vnd },
      after: { reversedVnd: l.amount_vnd, lineState: 'posted' },
      reason: 'FOC recomputed on its key (BR-434)',
      ...(opts.requestId ? { requestId: opts.requestId } : {}),
    });
  }

  private async lineById(
    tx: Tx,
    id: string,
  ): Promise<{ category: string; stay_night_id: string | null } | null> {
    const { rows } = await tx.query<{ category: string; stay_night_id: string | null }>(
      'SELECT category, stay_night_id FROM folio_line WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * ARC s3 thẻ 15 (reopened 18/10) – FolioPort for other modules: link a folio line WAITING for a decision
   * (`line_state = 'pending_approval'` – a FOC / special-discount line, a damage line) to the approval request
   * submitted for it (`approval_request.folio_line_id` = this line). The Folio DTO shows it as `approvalRequestId`
   * and the decision hooks find the line through it. Only the folio module writes `folio_line` (BE-A's B16/B18 FOC
   * in stay-support calls this instead of its own UPDATE).
   * Lock order (ARC 16.19): the caller holds L1 (its booking) and usually L3 already (it posted the line with
   * postLines); the folio is (re)locked here – L3, no wait when held – BEFORE anything is read; the approval row
   * (L4) is only read. Idempotent for the same request; 404 NOT_FOUND unknown line (or not visible); 422
   * NOT_IN_LIST when the request is not the one of this line; 409 INVALID_TRANSITION when the line is not pending
   * any more or already carries another request.
   */
  async linkApprovalRequest(tx: Tx, folioLineId: string, approvalRequestId: string): Promise<void> {
    const { rows: found } = await tx.query<{ folio_id: string }>(
      'SELECT folio_id FROM folio_line WHERE id = $1',
      [folioLineId],
    );
    if (!found[0]) throw problem('NOT_FOUND');
    await this.lock(tx, found[0].folio_id);
    const { rows } = await tx.query<{ line_state: string; approval_request_id: string | null }>(
      'SELECT line_state, approval_request_id FROM folio_line WHERE id = $1',
      [folioLineId],
    );
    const line = rows[0] as { line_state: string; approval_request_id: string | null };
    if (line.approval_request_id === approvalRequestId) return;
    const { rows: req } = await tx.query<{ folio_line_id: string | null }>(
      'SELECT folio_line_id FROM approval_request WHERE id = $1',
      [approvalRequestId],
    );
    if (!req[0] || req[0].folio_line_id !== folioLineId) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'approvalRequestId', code: 'NOT_IN_LIST' }],
      });
    }
    if (line.line_state !== 'pending_approval' || line.approval_request_id !== null) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: line.line_state } });
    }
    await this.linkLine(tx, folioLineId, approvalRequestId);
  }

  private async linkLine(tx: Tx, lineId: string, approvalId: string): Promise<void> {
    await tx.query('UPDATE folio_line SET approval_request_id = $2 WHERE id = $1', [
      lineId,
      approvalId,
    ]);
  }

  private async setLineState(tx: Tx, lineId: string, state: 'posted' | 'rejected'): Promise<void> {
    const { rows } = await tx.query<{ folio_id: string }>(
      'UPDATE folio_line SET line_state = $2 WHERE id = $1 RETURNING folio_id',
      [lineId, state],
    );
    if (rows[0]) await this.touch(tx, rows[0].folio_id);
  }

  /**
   * Posted, non-reversal, not-yet-reversed lines of one booking on a folio – with the FOC/discount lines that
   * reduce them whatever booking those were written on (round 6 (B): a FOC on a child booking's night was
   * written on the primary booking and missed here, so the night was reversed and re-posted net while the
   * FOC stayed – reduced twice).
   */
  private async liveLines(tx: Tx, folioId: string, reservationId: string): Promise<LiveLine[]> {
    const { rows } = await tx.query<LiveLine>(
      `SELECT l.id, l.category, l.revenue_group, l.description, l.quantity, l.unit_price_vnd, l.amount_vnd,
              l.service_date::text AS service_date, l.stay_night_id, l.related_line_id, l.approval_request_id,
              l.label_params
         FROM folio_line l
         LEFT JOIN folio_line rel ON rel.id = l.related_line_id
        WHERE l.folio_id = $1 AND l.line_state = 'posted'
          AND (l.reservation_id = $2
               OR (l.category IN ('foc', 'discount') AND rel.reservation_id = $2))
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.posted_at, l.id`,
      [folioId, reservationId],
    );
    return rows;
  }

  /**
   * Reversal of a line (BR-008: opposite amount, `reversal_of_id`) and of the posted FOC/discount lines that
   * reduced it; a reversed room discount is taken back from its night. Returns the net reversed amount.
   */
  private async reverseWithReductions(
    tx: Tx,
    line: LiveLine,
    live: readonly LiveLine[],
    by: string | null,
    now: Date,
    reason: string | null = null,
  ): Promise<number> {
    let net = await this.reverse(tx, line, by, now, reason);
    for (const r of live.filter(
      (x) => x.related_line_id === line.id && (x.category === 'foc' || x.category === 'discount'),
    )) {
      net += await this.reverse(tx, r, by, now, reason);
      if (line.category === 'room' && line.stay_night_id) {
        await this.nights.addDiscount(tx, line.stay_night_id, r.amount_vnd);
      }
    }
    return net;
  }

  private async reverse(
    tx: Tx,
    l: Pick<LiveLine, 'id' | 'amount_vnd'>,
    by: string | null,
    now: Date,
    reason: string | null = null,
  ): Promise<number> {
    const id = uuidv7();
    // Never twice (a line reversed by an earlier step of the same use case – e.g. a FOC cancelled before its
    // night is reversed): 0 rows inserted → nothing reversed now.
    const { rowCount } = await tx.query(
      `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category, adjusts_group,
         revenue_group, description, quantity, unit_price_vnd, amount_vnd, vat_rate_pct, service_date,
         stay_night_id, line_state, related_line_id, reversal_of_id, source, posted_at, posted_by, created_at,
         charge_code, reason, label_params, limit_ref_vnd)
       SELECT $2, organization_id, property_id, folio_id, reservation_id, category, adjusts_group, revenue_group,
              description, quantity, -unit_price_vnd, -amount_vnd, vat_rate_pct, service_date, stay_night_id,
              'posted', related_line_id, id, $5, $3, $4, $3, charge_code, $6, label_params, limit_ref_vnd
         FROM folio_line WHERE id = $1
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = $1)`,
      [l.id, id, now, by, reason ? 'manual' : 'system', reason],
    );
    if (!rowCount) return 0;
    const { rows } = await tx.query<{ folio_id: string }>(
      'SELECT folio_id FROM folio_line WHERE id = $1',
      [l.id],
    );
    if (rows[0]) await this.touch(tx, rows[0].folio_id);
    return l.amount_vnd;
  }

  private async voidCommissions(
    tx: Tx,
    reservationId: string,
    code: string,
    reason: string,
    now: Date,
    requestId?: string,
  ): Promise<number> {
    const { rows } = await tx.query<{ id: string; amount_vnd: number }>(
      `UPDATE commission SET status = 'void', void_reason = $2, updated_at = $3, version = version + 1
        WHERE reservation_id = $1 AND status IN ('projected', 'earned')
        RETURNING id, amount_vnd`,
      [reservationId, reason, now],
    );
    for (const c of rows) {
      await this.audit.recordMoney(tx, {
        action: 'commission.voided',
        entityType: 'commission',
        entityId: c.id,
        entityCode: code,
        before: { status: 'projected', amountVnd: c.amount_vnd },
        after: { status: 'void', voidReason: reason },
        ...(requestId ? { requestId } : {}),
      });
    }
    return rows.length;
  }

  /** Append one line (never updates an amount – BR-008). */
  async insertLine(
    tx: Tx,
    l: {
      folioId: string;
      reservationId: string | null;
      category: FolioLineCategory;
      revenueGroup?: RevenueGroup;
      description: string;
      quantity: number;
      unitPriceVnd: number;
      amountVnd: number;
      serviceDate: LocalDate | null;
      stayNightId: string | null;
      source: LineSource;
      postedBy: string | null;
      now: Date;
      lineState?: 'posted' | 'pending_approval';
      relatedLineId?: string | null;
      vatRatePct?: number | null;
      chargeCode?: string | null;
      note?: string | null;
      reason?: string | null;
      evidenceAttachmentIds?: readonly string[] | null;
      postCheckout?: boolean;
      labelParams?: Record<string, string | number> | null;
      /**
       * BR-433 (d) v0.4.1 (ARC S1-08): reference price of a night line (`room`, `late_fee_as_night`). Absent → the line
       * it replaces (`relatedLineId`, same category – an A32 replacement keeps the reference, never the new price),
       * else the line's own price (a system line).
       */
      limitRefVnd?: number | null;
    },
  ): Promise<string> {
    if (!Number.isSafeInteger(l.amountVnd) || !Number.isSafeInteger(l.unitPriceVnd)) {
      throw new RangeError('folio line amounts must be safe integers');
    }
    const id = uuidv7();
    await tx.query(
      `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category,
         revenue_group, description, quantity, unit_price_vnd, amount_vnd, vat_rate_pct, service_date,
         stay_night_id, line_state, related_line_id, source, posted_at, posted_by, created_at, charge_code, note,
         reason, evidence_attachment_ids, post_checkout, label_params, limit_ref_vnd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $18, $20, $21,
         $22, $23, $24, $25,
         CASE WHEN $6 = 'room' OR $20::text = 'late_fee_as_night' THEN COALESCE($26::bigint,
           (SELECT r.limit_ref_vnd FROM folio_line r WHERE r.id = $16 AND r.category = $6),
           CASE WHEN $20::text = 'late_fee_as_night' THEN abs($11::bigint) ELSE abs($10::bigint) END) END)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        l.folioId,
        l.reservationId,
        l.category,
        l.revenueGroup ?? revenueGroupOf(l.category),
        l.description,
        String(l.quantity),
        l.unitPriceVnd,
        l.amountVnd,
        l.vatRatePct === undefined || l.vatRatePct === null ? null : String(l.vatRatePct),
        l.serviceDate,
        l.stayNightId,
        l.lineState ?? 'posted',
        l.relatedLineId ?? null,
        l.source,
        l.now,
        l.postedBy,
        l.chargeCode ?? null,
        l.note ?? null,
        l.reason ?? null,
        l.evidenceAttachmentIds ? [...l.evidenceAttachmentIds] : null,
        l.postCheckout ?? false,
        l.labelParams ? JSON.stringify(l.labelParams) : null,
        l.limitRefVnd ?? null,
      ],
    );
    await this.touch(tx, l.folioId);
    return id;
  }

  /**
   * SM-11 (BR-903, BR-006): the live `projected` commission of the closer must equal % × room total of the
   * sold nights. Changed closer / base / rate → old row `void` (reason `resync`) + new row; always
   * re-allocated over the current nights (Σ = amount, remainder on the last night).
   */
  private async syncCommission(
    tx: Tx,
    stay: ConfirmedStay,
    today: LocalDate,
    now: Date,
    requestId?: string,
  ): Promise<number> {
    let desired: { payee: PayeeType; ratePct: number; base: number; amount: number } | null = null;
    if (stay.closerUserId && stay.stayType === 'short' && stay.nights.length > 0) {
      const { rows: roleRows } = await tx.query<{ role: string }>(
        `SELECT upr.role FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
          WHERE upr.user_id = $1 AND upr.property_id = $2 AND upr.revoked_at IS NULL AND u.status = 'active'`,
        [stay.closerUserId, tx.ctx.propertyId],
      );
      const payee = payeeTypeOf(roleRows.map((r) => r.role));
      const ratePct = payee
        ? (stay.commissionRatePctSnapshot ??
          commissionPctFor(await this.params.get(tx, 'short_stay_commission_pct', today), payee))
        : null;
      if (payee && ratePct !== null && ratePct > 0) {
        const base = stay.nights.reduce((a, n) => a + n.roomRevenueVnd, 0);
        desired = { payee, ratePct, base, amount: applyPct(base, ratePct, 1) };
      }
    }
    const { rows: liveRows } = await tx.query<{
      id: string;
      payee_user_id: string;
      payee_type: PayeeType;
      rate_pct_snapshot: string;
      base_amount_vnd: number;
      amount_vnd: number;
    }>(
      `SELECT id, payee_user_id, payee_type, rate_pct_snapshot, base_amount_vnd, amount_vnd FROM commission
        WHERE reservation_id = $1 AND status = 'projected' FOR UPDATE`,
      [stay.reservationId],
    );
    let current = liveRows.find(
      (c) =>
        desired &&
        c.payee_user_id === stay.closerUserId &&
        c.payee_type === desired.payee &&
        Number(c.rate_pct_snapshot) === desired.ratePct &&
        c.base_amount_vnd === desired.base,
    );
    for (const c of liveRows) {
      if (c === current) continue;
      await tx.query(
        `UPDATE commission SET status = 'void', void_reason = 'resync', updated_at = $2, version = version + 1
          WHERE id = $1`,
        [c.id, now],
      );
      await this.audit.recordMoney(tx, {
        action: 'commission.voided',
        entityType: 'commission',
        entityId: c.id,
        entityCode: stay.reservationCode,
        before: { status: 'projected', amountVnd: c.amount_vnd },
        after: { status: 'void', voidReason: 'resync' },
        ...(requestId ? { requestId } : {}),
      });
    }
    if (desired && !current) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO commission (id, organization_id, property_id, reservation_id, payee_type, payee_user_id,
           rate_pct_snapshot, base_amount_vnd, amount_vnd, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'projected', $10, $10)`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          stay.reservationId,
          desired.payee,
          stay.closerUserId,
          String(desired.ratePct),
          desired.base,
          desired.amount,
          now,
        ],
      );
      await this.audit.recordMoney(tx, {
        action: 'commission.projected',
        entityType: 'commission',
        entityId: id,
        entityCode: stay.reservationCode,
        after: {
          status: 'projected',
          payeeType: desired.payee,
          ratePct: desired.ratePct,
          baseVnd: desired.base,
          amountVnd: desired.amount,
        },
        ...(requestId ? { requestId } : {}),
      });
      current = {
        id,
        payee_user_id: stay.closerUserId as string,
        payee_type: desired.payee,
        rate_pct_snapshot: String(desired.ratePct),
        base_amount_vnd: desired.base,
        amount_vnd: desired.amount,
      };
    }
    if (stay.nights.length > 0) {
      const parts = current
        ? allocate(
            current.amount_vnd,
            stay.nights.map((n) => n.roomRevenueVnd),
          )
        : stay.nights.map(() => 0);
      await this.nights.setCommissions(
        tx,
        stay.nights.map((n, i) => ({
          stayNightId: n.stayNightId,
          agentVnd: current?.payee_type === 'agent' ? (parts[i] as number) : 0,
          staffVnd: current?.payee_type === 'staff' ? (parts[i] as number) : 0,
        })),
      );
    }
    return current?.amount_vnd ?? 0;
  }

  /** BR-901 / DATA FB-01: OTA channel fee (reported or estimated), money audit, allocated over the nights. */
  private async syncChannelFee(
    tx: Tx,
    stay: ConfirmedStay,
    today: LocalDate,
    now: Date,
    requestId?: string,
  ): Promise<void> {
    if (stay.nights.length === 0) return;
    const channel = await this.channels.byId(tx, stay.channelId, today);
    if (!channel || channel.channelGroup !== 'ota') return;
    const base = stay.nights.reduce((a, n) => a + n.roomRevenueVnd, 0);
    const { rows: existing } = await tx.query<{
      id: string;
      base_amount_vnd: number;
      rate_pct_snapshot: string;
      amount_estimated_vnd: number;
      amount_actual_vnd: number | null;
    }>(
      `SELECT id, base_amount_vnd, rate_pct_snapshot, amount_estimated_vnd, amount_actual_vnd
         FROM channel_fee WHERE reservation_id = $1 FOR UPDATE`,
      [stay.reservationId],
    );
    const old = existing[0];
    // The rate is snapshotted at the first posting (BR-006); a reported fee wins over the estimate.
    const ratePct = old ? Number(old.rate_pct_snapshot) : (channel.commissionRatePct ?? 0);
    const estimated = applyPct(base, ratePct, 1);
    const actual = stay.otaChannelFeeVnd ?? old?.amount_actual_vnd ?? null;
    let changed = false;
    if (!old) {
      await tx.query(
        `INSERT INTO channel_fee (id, organization_id, property_id, reservation_id, channel_id, base_amount_vnd,
           rate_pct_snapshot, amount_estimated_vnd, amount_actual_vnd, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
        [
          uuidv7(),
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          stay.reservationId,
          stay.channelId,
          base,
          String(ratePct),
          estimated,
          actual,
          actual === null ? 'estimate' : 'manual_reconcile',
          now,
        ],
      );
      changed = true;
    } else if (
      old.base_amount_vnd !== base ||
      old.amount_estimated_vnd !== estimated ||
      old.amount_actual_vnd !== actual
    ) {
      await tx.query(
        `UPDATE channel_fee SET base_amount_vnd = $2, amount_estimated_vnd = $3, amount_actual_vnd = $4,
            source = $5, updated_at = $6, version = version + 1
          WHERE id = $1`,
        [old.id, base, estimated, actual, actual === null ? 'estimate' : 'manual_reconcile', now],
      );
      changed = true;
    }
    if (changed) {
      await this.audit.recordMoney(tx, {
        action: old ? 'channel_fee.updated' : 'channel_fee.recorded',
        entityType: 'channel_fee',
        entityId: stay.reservationId,
        entityCode: stay.reservationCode,
        ...(old
          ? {
              before: {
                baseVnd: old.base_amount_vnd,
                amountEstimatedVnd: old.amount_estimated_vnd,
                amountActualVnd: old.amount_actual_vnd,
              },
            }
          : {}),
        after: {
          channelCode: channel.code,
          baseVnd: base,
          ratePct,
          amountEstimatedVnd: estimated,
          amountActualVnd: actual,
          source: actual === null ? 'estimate' : 'manual_reconcile',
        },
        ...(requestId ? { requestId } : {}),
      });
    }
    const parts = allocate(
      actual ?? estimated,
      stay.nights.map((n) => n.roomRevenueVnd),
    );
    await this.nights.setChannelFees(
      tx,
      stay.nights.map((n, i) => ({ stayNightId: n.stayNightId, amountVnd: parts[i] as number })),
      actual === null,
    );
  }

  async timezone(tx: Tx): Promise<string> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = rows[0]?.timezone;
    if (!tz) throw problem('NOT_FOUND');
    return tz;
  }

  iso(instant: Date | null, tz: string): string | undefined {
    return instant ? toZonedIso(instant, tz) : undefined;
  }
}
