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
import { AuditService } from '../../audit/public/audit.service';
import { ChannelsService } from '../../platform/public/channels';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { applyPct } from '../../reservations/public/pricing';
import type { FolioStaySync, VoidStayInput } from '../../reservations/public/folio-sync-port';
import type { ConfirmedStay } from '../../reservations/public/sales-port';
import { StayNightAllocationService } from '../../reservations/public/stay-night-allocation';
import { allocate } from './allocate';

export type RevenueGroup = 'room' | 'other' | 'non_revenue';

/** Charges an `ota_prepaid` booking has paid to the OTA (BR-307, DOM BE-13, DOM S3-2 OTA fees). */
export const OTA_COVERED: ReadonlySet<string> = new Set([
  'room',
  'extra_person',
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
}

export interface FolioTotals {
  roomVnd: number;
  otherVnd: number;
  focVnd: number;
  totalVnd: number;
  paidVnd: number;
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
 * Σ of the posted OTA-covered lines of the bookings the OTA collected for (+ their FOC/discount lines, through
 * `related_line_id`). Reversal rows carry the category and the related line, so the sum is net.
 */
export function otaCoveredOf(
  lines: ReadonlyArray<TotalsLine>,
  otaReservations: ReadonlySet<string>,
): number {
  if (otaReservations.size === 0) return 0;
  const covered = new Set<string>();
  let sum = 0;
  for (const l of lines) {
    if (l.line_state !== 'posted' || !l.category || !OTA_COVERED.has(l.category)) continue;
    if (!l.reservation_id || !otaReservations.has(l.reservation_id)) continue;
    sum += l.amount_vnd;
    if (l.id) covered.add(l.id);
  }
  for (const l of lines) {
    if (l.line_state !== 'posted' || (l.category !== 'foc' && l.category !== 'discount')) continue;
    if (l.related_line_id && covered.has(l.related_line_id)) sum += l.amount_vnd;
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
  p.received_amount_vnd, p.provider, p.version`;
export const PAYMENT_JOINS = `LEFT JOIN app_user ur ON ur.id = p.recorded_by
  LEFT JOIN app_user uc ON uc.id = p.confirmed_by LEFT JOIN app_user uq ON uq.id = p.reconciled_by`;

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

  /** `SELECT … FOR UPDATE` (lock order: reservation → room → folio). Null when not visible. */
  async lock(tx: Tx, folioId: string): Promise<FolioRow | null> {
    const { rows } = await tx.query<FolioRow>(
      `SELECT id, property_id, primary_reservation_id, status, bill_no, post_checkout_window_until, version
         FROM folio WHERE id = $1 FOR UPDATE`,
      [folioId],
    );
    return rows[0] ?? null;
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
   * Σ succeeded deposit receipts of a folio (B4 sufficiency, BR-305, BR-309 base, J1). Reversal rows are
   * bookkeeping (their original is `reversed`) – never counted, so a reversed deposit gives 0, not −X
   * (ARC-BE-S3-02, SEC-BE-36). Same rule as moneyPosition().depositHeldVnd.
   */
  async depositPaid(tx: Tx, folioId: string): Promise<number> {
    const { rows } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(SUM(amount_vnd), 0) AS total FROM payment
        WHERE folio_id = $1 AND type = 'deposit' AND status = 'succeeded' AND reversal_of_id IS NULL`,
      [folioId],
    );
    return Number(rows[0]?.total ?? 0);
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
    opts: { allowPostCheckout?: boolean } = {},
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
    opts: { allowSettled?: boolean } = {},
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

  /**
   * BR-433 "≤ giá 1 đêm" basis of a FOC/discount on a folio line (BUG-R2-046): the night rate of the night the
   * line belongs to – a room line: its own rate; late check-out: the last night; early check-in: the first
   * night; any other line: the night of its service date (else the latest night before it, else the first).
   * Live room lines of the line's booking only; null when the booking has no night on the folio.
   */
  async nightRateBasis(tx: Tx, lineId: string): Promise<number | null> {
    const { rows } = await tx.query<{
      category: string;
      unit_price_vnd: number;
      service_date: string | null;
      folio_id: string;
      reservation_id: string | null;
    }>(
      `SELECT category, unit_price_vnd, service_date::text AS service_date, folio_id, reservation_id
         FROM folio_line WHERE id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line) return null;
    if (line.category === 'room') return line.unit_price_vnd;
    const { rows: nights } = await tx.query<{ unit_price_vnd: number; service_date: string }>(
      `SELECT l.unit_price_vnd, l.service_date::text AS service_date FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'room' AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL AND l.service_date IS NOT NULL
          AND ($2::uuid IS NULL OR l.reservation_id = $2)
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.service_date, l.posted_at`,
      [line.folio_id, line.reservation_id],
    );
    if (nights.length === 0) return null;
    const first = nights[0] as { unit_price_vnd: number; service_date: string };
    const last = nights[nights.length - 1] as { unit_price_vnd: number; service_date: string };
    if (line.category === 'late_checkout') return last.unit_price_vnd;
    if (line.category === 'early_checkin') return first.unit_price_vnd;
    const d = line.service_date;
    if (!d) return last.unit_price_vnd;
    const same = nights.find((n) => n.service_date === d);
    if (same) return same.unit_price_vnd;
    const before = nights.filter((n) => n.service_date < d);
    return (before[before.length - 1] ?? first).unit_price_vnd;
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
    await tx.query(
      `UPDATE folio SET status = 'settled', bill_no = $2, settled_at = $3, settled_by = $4,
          post_checkout_window_until = $5, updated_at = $3, version = version + 1
        WHERE id = $1`,
      [folio.id, billNo, now, actor.userId, until],
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
    actor: { userId: string | null; requestId?: string },
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
    const live = await this.liveLines(tx, folio.id, input.reservationId);
    const nightIds = new Set(input.voidedStayNightIds);
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
    if (reversedVnd !== 0 || feeVnd > 0) {
      await this.audit.recordMoney(tx, {
        action: 'folio.stay_reversed',
        entityType: 'folio',
        entityId: folio.id,
        entityCode: input.reservationCode,
        after: { reversedVnd, feeVnd, status: input.reason },
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
   * DOM BE-13 / BR-307: an `ota_prepaid` booking has ONE live system receipt `ota_collect` (provider
   * `ota_system`, reconciliation `not_required` until the OTA payout reconciliation of R3) equal to the
   * OTA-covered charges of the booking: nights, extra-person fee, fees the OTA keeps (cancellation, no-show,
   * early departure), net of their approved FOC/discounts. Re-run after every change of those lines: a
   * different amount → the old receipt is reversed (BR-008) and a new one written. `paymentModel` null =
   * unknown here (fee posting, void): acts only when the folio already has a system receipt.
   * Lines of child bookings (B9a / OTA extension, direct channel) are paid at the desk – not covered.
   */
  async syncOtaCollect(
    tx: Tx,
    folioId: string,
    reservationId: string,
    paymentModel: string | null,
    actor: FolioActor,
  ): Promise<void> {
    const { rows: live } = await tx.query<{ id: string; amount_vnd: number; code: string }>(
      `SELECT id, amount_vnd, code FROM payment
        WHERE folio_id = $1 AND provider = 'ota_system' AND status = 'succeeded' AND reversal_of_id IS NULL
        FOR UPDATE`,
      [folioId],
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
         SELECT COALESCE(SUM(c.amount_vnd), 0) + COALESCE((
                  SELECT SUM(d.amount_vnd) FROM live d JOIN live c2 ON c2.id = d.related_line_id
                   WHERE d.category IN ('foc', 'discount') AND c2.category = ANY($3::text[])), 0) AS total
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
    who: { userId: string | null; requestId?: string },
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

    // Room nights: keep a live line whose gross (line − nothing) still equals the night, else reverse.
    const target = new Map(stay.nights.map((n) => [n.stayNightId, n]));
    const kept = new Set<string>();
    for (const l of live.filter((x) => x.category === 'room' && x.stay_night_id)) {
      const night = target.get(l.stay_night_id as string);
      const reduced = this.reductionOf(l, live);
      if (
        night &&
        !kept.has(night.stayNightId) &&
        l.amount_vnd === night.roomRevenueVnd + reduced
      ) {
        kept.add(night.stayNightId);
        continue;
      }
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }
    for (const n of stay.nights) {
      if (kept.has(n.stayNightId)) continue;
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: stay.reservationId,
        category: 'room',
        description: n.extraNight ? 'extra_night' : 'room_night',
        quantity: 1,
        unitPriceVnd: n.roomRevenueVnd,
        amountVnd: n.roomRevenueVnd,
        serviceDate: n.date,
        stayNightId: n.stayNightId,
        source: 'system',
        postedBy: who.userId,
        now,
        chargeCode: n.extraNight ? 'extra_night' : null,
        labelParams: { date: n.date },
      });
      result.roomVnd += n.roomRevenueVnd;
    }

    // Extra-person fee (BR-110): one line per sold night at THAT night's fee (BE-A review fix, DOM S3-13 /
    // FB-R2-ARC-BE-S3-01 – `ConfirmedStay.nights[].extraPersonVnd`; mid-stay changes apply from `effectiveFrom`).
    live = await this.liveLines(tx, folio.id, stay.reservationId);
    const wanted = new Map<string, number>();
    for (const n of stay.nights) {
      const fee = n.extraPersonVnd ?? stay.extraPersonPerNightVnd;
      if (fee > 0) wanted.set(n.date, fee);
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
        description: `extra_guest x${stay.extraGuestCount}`,
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
          ...(stay.extraGuestCount > 0 ? { count: stay.extraGuestCount } : {}),
        },
      });
      result.extraPersonVnd += fee;
    }

    result.commissionVnd = await this.syncCommission(tx, stay, today, now, who.requestId);
    await this.syncChannelFee(tx, stay, today, now, who.requestId);
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

  /** Posted, non-reversal, not-yet-reversed lines of one booking on a folio. */
  private async liveLines(tx: Tx, folioId: string, reservationId: string): Promise<LiveLine[]> {
    const { rows } = await tx.query<LiveLine>(
      `SELECT l.id, l.category, l.revenue_group, l.description, l.quantity, l.unit_price_vnd, l.amount_vnd,
              l.service_date::text AS service_date, l.stay_night_id, l.related_line_id
         FROM folio_line l
        WHERE l.folio_id = $1 AND l.reservation_id = $2 AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.posted_at, l.id`,
      [folioId, reservationId],
    );
    return rows;
  }

  /** Σ of the posted FOC/discount lines that reduce `line` (positive VND). */
  private reductionOf(line: LiveLine, live: readonly LiveLine[]): number {
    return live
      .filter(
        (r) => r.related_line_id === line.id && (r.category === 'foc' || r.category === 'discount'),
      )
      .reduce((a, r) => a - r.amount_vnd, 0);
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
    l: LiveLine,
    by: string | null,
    now: Date,
    reason: string | null = null,
  ): Promise<number> {
    const id = uuidv7();
    await tx.query(
      `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category, adjusts_group,
         revenue_group, description, quantity, unit_price_vnd, amount_vnd, vat_rate_pct, service_date,
         stay_night_id, line_state, related_line_id, reversal_of_id, source, posted_at, posted_by, created_at,
         charge_code, reason, label_params)
       SELECT $2, organization_id, property_id, folio_id, reservation_id, category, adjusts_group, revenue_group,
              description, quantity, -unit_price_vnd, -amount_vnd, vat_rate_pct, service_date, stay_night_id,
              'posted', related_line_id, id, $5, $3, $4, $3, charge_code, $6, label_params
         FROM folio_line WHERE id = $1`,
      [l.id, id, now, by, reason ? 'manual' : 'system', reason],
    );
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
         reason, evidence_attachment_ids, post_checkout, label_params)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $18, $20, $21,
         $22, $23, $24, $25)`,
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
      ],
    );
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
