/**
 * Receipts, VietQR, reconciliation, cash handover, reversal (EP03-05 mục 2.2–2.5; US-119, US-120; SM-12;
 * BR-521, BR-526, BR-527; SEC s3-checklist F1–F7; OpenAPI 0.3.6).
 *
 * Separation of duties (SEC F5, A46/A46a – checked under FOR UPDATE here AND by CHECKs of migration 0040):
 * - reconcilePayment (MGR+): the reconciler is neither the recorder nor the VietQR confirmer; only an owner may
 *   reconcile their own entry and it is flagged `self_reconciled` (audit + report);
 * - confirmCashHandover (FD+): cash a sale/CTV recorded is confirmed by someone else – no exception;
 * - a `disputed` result never reverses by itself (MGR+ decides – reversePayment).
 * ESC-017 A (SEC F6): when a receipt recorded by a sale/CTV becomes `reconciled`, that person's projected
 * commission on the booking becomes `earned` once none of their receipts on the folio is still pending/disputed.
 * Lock order: reservation (port) → folio → payment; reversePayment: every booking of the folio (FolioService.lockStay,
 * BR-525 G-4 debt) → folio → payment → refund requests.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { decodeCursor, page } from '../../../shared/http/pagination';
import { ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, addDays, atLocal, businessDate, localDate } from '../../../shared/time';
import { optionalText, requireReason } from '../../../shared/validation';
import { ApprovalService } from '../../approvals/public/approval.service';
import { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import {
  FolioService,
  PAYMENT_COLUMNS,
  PAYMENT_JOINS,
  type PaymentRowLite,
} from '../../folio/public/folio.service';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  RECENT_CHANGE_MS,
  maskedAccountNo,
  receivingAccountInEffect,
} from '../../platform/public/receiving-account';
import { notifyStaff, publishEvent } from '../../platform/public/staff-notify';
import { ReservationHooks } from '../../reservations/public/reservation-hooks';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import {
  ATTACHMENT_USAGE,
  type AttachmentUsage,
  anchorPaymentAttachment,
} from '../public/attachment-usage';
import {
  DESK_ROLES,
  MANAGER_ROLES,
  type PaymentActor,
  type PaymentCreateInput,
  PaymentService,
  isDesk,
  parseInstant,
  primaryRole,
} from '../public/payment.service';
import { buildVietQrPayload, transferContentOf } from './vietqr';

const SALES_ROLES = ['sales_staff', 'collaborator'];

/** payment.qr_context (0065): the stay inputs of a check-in / check-out VietQR, as JSON. */
function qrContextOf(stay: StayQrInput): Record<string, unknown> {
  return {
    ...(stay.checkinTime !== undefined ? { checkinTime: stay.checkinTime } : {}),
    ...(stay.addPriorNight !== undefined ? { addPriorNight: stay.addPriorNight } : {}),
    ...(stay.priorNightRateVnd !== undefined ? { priorNightRateVnd: stay.priorNightRateVnd } : {}),
    ...(stay.checkoutAt !== undefined ? { checkoutAt: stay.checkoutAt.toISOString() } : {}),
    ...(stay.extraNightRateVnd !== undefined ? { extraNightRateVnd: stay.extraNightRateVnd } : {}),
    ...(stay.lateFeeAsNight !== undefined ? { lateFeeAsNight: stay.lateFeeAsNight } : {}),
  };
}

/** Back from payment.qr_context. */
function stayOfContext(ctx: Record<string, unknown> | null): StayQrInput {
  if (!ctx) return {};
  const out: StayQrInput = {};
  if (typeof ctx.checkinTime === 'string') out.checkinTime = ctx.checkinTime;
  if (typeof ctx.addPriorNight === 'boolean') out.addPriorNight = ctx.addPriorNight;
  if (typeof ctx.priorNightRateVnd === 'number') out.priorNightRateVnd = ctx.priorNightRateVnd;
  if (typeof ctx.checkoutAt === 'string') out.checkoutAt = new Date(ctx.checkoutAt);
  if (typeof ctx.extraNightRateVnd === 'number') out.extraNightRateVnd = ctx.extraNightRateVnd;
  if (typeof ctx.lateFeeAsNight === 'boolean') out.lateFeeAsNight = ctx.lateFeeAsNight;
  return out;
}

/** createVietQr 0.3.7: the time inputs of previewCheckIn / getCheckoutSummary the step cap is computed from. */
export interface StayQrInput {
  checkinTime?: string;
  addPriorNight?: boolean;
  priorNightRateVnd?: number;
  checkoutAt?: Date;
  extraNightRateVnd?: number;
  /** 0.3.7 bổ sung 4 (BR-416-06): check_out – the late fee charged as one night (cap includes it). */
  lateFeeAsNight?: boolean;
}

const CHECKIN_FIELDS = ['checkinTime', 'addPriorNight', 'priorNightRateVnd'] as const;
const CHECKOUT_FIELDS = ['checkoutAt', 'extraNightRateVnd', 'lateFeeAsNight'] as const;

/**
 * 0.3.7: `checkinTime`/`addPriorNight`/`priorNightRateVnd` only with `purpose=check_in` (the rate only with
 * `addPriorNight`), `checkoutAt`/`extraNightRateVnd` only with `purpose=check_out` – else 422 NOT_ALLOWED.
 */
function stayFieldErrors(purpose: string | null, stay: StayQrInput): void {
  const errors: Array<{ field: string; code: string }> = [];
  for (const k of CHECKIN_FIELDS) {
    if (stay[k] !== undefined && purpose !== 'check_in')
      errors.push({ field: k, code: 'NOT_ALLOWED' });
  }
  for (const k of CHECKOUT_FIELDS) {
    if (stay[k] !== undefined && purpose !== 'check_out') {
      errors.push({ field: k, code: 'NOT_ALLOWED' });
    }
  }
  if (
    purpose === 'check_in' &&
    stay.priorNightRateVnd !== undefined &&
    stay.addPriorNight !== true
  ) {
    errors.push({ field: 'priorNightRateVnd', code: 'NOT_ALLOWED' });
  }
  for (const k of ['priorNightRateVnd', 'extraNightRateVnd'] as const) {
    const v = stay[k];
    if (v !== undefined && v <= 0 && !errors.some((e) => e.field === k)) {
      errors.push({ field: k, code: 'AMOUNT_NOT_POSITIVE' });
    }
  }
  if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
}
const MAX_RANGE_DAYS = 92;

export interface ListPaymentsQuery {
  reconciliation: 'pending' | 'reconciled' | 'disputed' | 'not_required' | 'any';
  receivedFrom: LocalDate | null;
  receivedTo: LocalDate | null;
  recordedBy: string | null;
  recordedByRole: string | null;
  method: string | null;
  status: string | null;
  cursor: string | null;
  limit: number;
}

export type PaymentListRow = PaymentRowLite & {
  folio_id: string;
  reservation_code: string | null;
};

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
    @Inject(ATTACHMENT_USAGE) private readonly attachments: AttachmentUsage,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
    @Optional() @Inject(ReservationHooks) private readonly hooks?: ReservationHooks,
  ) {}

  private port(): ReservationSalesPort {
    if (!this.reservations) throw new Error('reservations module not wired');
    return this.reservations;
  }

  /**
   * BR-525 (G-4): the debt owner (front desk – `ReservationHooks.debtAfterReversal`, BE-A). A reversal that leaves
   * a debt is refused when nobody records it (never an untracked debt – the hooks throw when no handler is bound).
   */
  private debtOwner(): ReservationHooks {
    if (!this.hooks) throw new Error('reservation hooks not wired (BR-525 G-4 debt)');
    return this.hooks;
  }

  private async rollover(tx: Tx, tz: string, now: Date): Promise<string> {
    return this.params.get<string>(tx, 'business_day_rollover', localDate(now, tz));
  }

  /** Booking of a folio inside the caller's scope (SAL/CTV: created or closed it – else 404, never 403). */
  async scopedReservation(
    tx: Tx,
    actor: { userId: string; roles: readonly string[] },
    reservationId: string,
    opts: { lock?: boolean } = {},
  ): Promise<{
    id: string;
    code: string;
    status: string;
    createdBy: string | null;
    depositRequiredVnd?: number;
  }> {
    const port = this.port();
    const r = opts.lock
      ? await port.lockForDeposit(tx, reservationId)
      : await port.ownership(tx, reservationId);
    if (!r) throw problem('NOT_FOUND');
    if (!isDesk(actor.roles) && r.createdBy !== actor.userId && r.closerUserId !== actor.userId) {
      throw problem('NOT_FOUND');
    }
    return {
      id: r.id,
      code: r.code,
      status: r.status,
      createdBy: r.createdBy,
      ...('depositRequiredVnd' in r && typeof r.depositRequiredVnd === 'number'
        ? { depositRequiredVnd: r.depositRequiredVnd }
        : {}),
    };
  }

  private async folioMeta(
    tx: Tx,
    folioId: string,
  ): Promise<{ primary_reservation_id: string; created_at: Date }> {
    const { rows } = await tx.query<{ primary_reservation_id: string; created_at: Date }>(
      'SELECT primary_reservation_id, created_at FROM folio WHERE id = $1',
      [folioId],
    );
    if (!rows[0]) throw problem('NOT_FOUND');
    return rows[0];
  }

  /** Channel group of a booking (`ota_collect` only for OTA bookings – EP03-05 2.2). */
  private async channelGroup(tx: Tx, reservationId: string): Promise<string | null> {
    const view = await this.port().reservationView(tx, reservationId);
    const { rows } = await tx.query<{ channel_group: string }>(
      'SELECT channel_group FROM channel WHERE id = $1',
      [view.channelId],
    );
    return rows[0]?.channel_group ?? null;
  }

  // ───────────── recordPayment (2.2) ─────────────

  async record(
    tx: Tx,
    actor: PaymentActor,
    folioId: string,
    raw: PaymentCreateInput,
  ): Promise<PaymentRowLite> {
    // A33 own_deposit_only (US-119 AC4): a sale/CTV records deposits only – the scope answers 403 before any
    // body rule (BUG-R2-005 role gate first; CI TC-L4-063).
    if (!isDesk(actor.roles) && raw.type !== 'deposit') throw problem('FORBIDDEN_ACTION');
    if (raw.type === 'refund') {
      // A-33: a refund is only paid out through executeRefund / executeCashRefund.
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'type', code: 'NOT_IN_LIST' }] });
    }
    const meta = await this.folioMeta(tx, folioId);
    const r = await this.scopedReservation(tx, actor, meta.primary_reservation_id, { lock: true });
    // Verification 17/10 (ARC-S3-02 follow-up): money received on a hold is its deposit – a `charge` there
    // would not count for B4/J1 (the hold would expire although paid).
    if (r.status === 'hold' && raw.type !== 'deposit') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'type', code: 'NOT_IN_LIST' }] });
    }
    // BUG-R2-051 / SEC F1: a hold owes its missing deposit (BR-305) – same cap as createVietQr; otherwise the
    // folio balance (a hold has no lines yet, so the balance would be 0).
    const holdCap =
      r.status === 'hold' && r.depositRequiredVnd !== undefined
        ? Math.max(0, r.depositRequiredVnd - (await this.folios.depositPaid(tx, folioId)))
        : undefined;
    // ARC 16.26 (BR-525): a checked-out stay with an open debt – the folio (`settled` after its window, or
    // `closed`) takes a `charge` from FD+ up to the amount due. L1: the primary (scopedReservation) then every
    // booking of the folio `NO KEY UPDATE` by id, L3 the folio (`lockStay`), L4 the receipt – as reversePayment.
    let debtCollection = false;
    if (r.status === 'checked_out') {
      const folio = await this.folios.lockStay(tx, folioId);
      // The front desk owns the debt (ReservationHooks.openDebt – BE-A): null = none → FOLIO_LOCKED as before.
      if (folio && folio.status !== 'open') {
        debtCollection = (await this.debtOwner().openDebt(tx, folioId)) !== null;
      }
    }
    const row = await this.payments.recordInTx(tx, actor, folioId, raw, {
      reservationId: r.id,
      reservationCode: r.code,
      channelGroup: raw.method === 'ota_collect' ? await this.channelGroup(tx, r.id) : null,
      reservationCreatedAt: meta.created_at,
      ...(holdCap !== undefined ? { outstandingCapVnd: holdCap } : {}),
      ...(debtCollection ? { debtCollection: true } : {}),
    });
    // Paid in full → the debt is closed in the same transaction (front desk – "Cần chú ý" checkout_debt goes);
    // a part payment leaves it open with what is left (its due date unchanged).
    if (debtCollection && (await this.folios.balance(tx, folioId)).balanceDueVnd <= 0) {
      await this.debtOwner().debtSettled(tx, {
        folioId,
        paymentId: row.id,
        actor: { userId: actor.userId, roles: actor.roles },
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    // Debt paid after checkout (BR-525) can be the last condition of SM-11 `earned` (BE-15) – the commission
    // "paid in full" step (FolioService.tryEarnCommissions): DOM 18/10, a receipt recorded after check-out counts
    // once confirmed (a transfer waits for its reconciliation, which runs this again).
    if (r.status === 'checked_out') await this.tryEarn(tx, r.id, actor.requestId);
    await this.changed(tx, row, r.id);
    return row;
  }

  /** Display code of a booking (stayInfo of the reservations port – no read of its tables). */
  async reservationCode(tx: Tx, reservationId: string): Promise<string | undefined> {
    return (await this.port().stayInfo(tx, reservationId))?.code;
  }

  /** A-35: `payment.changed` (MGR+ and the recorder) + `reservation.changed` (folio moved). */
  private async changed(tx: Tx, p: PaymentRowLite, reservationId: string | null): Promise<void> {
    await publishEvent(tx, this.events, 'payment.changed', p.id, {
      roles: MANAGER_ROLES,
      ...(p.recorded_by ? { userIds: [p.recorded_by] } : {}),
    });
    if (reservationId) await publishEvent(tx, this.events, 'reservation.changed', reservationId);
  }

  // ───────────── listPayments (2.4) ─────────────

  async list(
    tx: Tx,
    actor: { userId: string; roles: readonly string[] },
    q: ListPaymentsQuery,
  ): Promise<{
    rows: PaymentListRow[];
    nextCursor: string | null;
    tz: string;
    now: Date;
    alertDays: number;
    rollover: string;
  }> {
    const now = this.clock.now();
    const tz = await this.folios.timezone(tx);
    const rollover = await this.rollover(tx, tz, now);
    const where: string[] = [];
    const args: unknown[] = [];
    const arg = (v: unknown) => {
      args.push(v);
      return `$${args.length}`;
    };
    const managers = actor.roles.some((r) => MANAGER_ROLES.includes(r));
    const deskScope = actor.roles.some((r) => r === 'front_desk' || r === 'front_desk_lead');
    if (!managers) {
      const me = arg(actor.userId);
      // own: recorded or confirmed by me; FD/FDL also every cash a sale/CTV recorded that waits (A46a).
      where.push(
        deskScope
          ? `(p.recorded_by = ${me} OR p.confirmed_by = ${me} OR (p.method = 'cash' AND p.status = 'succeeded'
              AND p.reconciliation = 'pending' AND p.recorded_by_role IN ('sales_staff', 'collaborator')))`
          : `(p.recorded_by = ${me} OR p.confirmed_by = ${me})`,
      );
    }
    if (q.reconciliation !== 'any') where.push(`p.reconciliation = ${arg(q.reconciliation)}`);
    if (q.status) where.push(`p.status = ${arg(q.status)}`);
    else if (q.reconciliation !== 'any') where.push(`p.status IN ('succeeded', 'reversed')`);
    if (q.method) where.push(`p.method = ${arg(q.method)}`);
    if (q.recordedByRole) where.push(`p.recorded_by_role = ${arg(q.recordedByRole)}`);
    if (q.recordedBy && (managers || q.recordedBy === actor.userId)) {
      const { rows } = await tx.query(
        `SELECT 1 FROM user_property_role WHERE user_id = $1 AND property_id = $2 LIMIT 1`,
        [q.recordedBy, tx.ctx.propertyId],
      );
      if (!rows[0]) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'recordedBy', code: 'NOT_IN_LIST' }],
        });
      }
      where.push(`p.recorded_by = ${arg(q.recordedBy)}`);
    }
    if (q.receivedFrom && q.receivedTo && q.receivedTo < q.receivedFrom) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'receivedTo', code: 'DATE_INVALID' }],
      });
    }
    if (q.receivedFrom && q.receivedTo) {
      const days = (Date.parse(q.receivedTo) - Date.parse(q.receivedFrom)) / 86_400_000 + 1;
      if (days > MAX_RANGE_DAYS) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'receivedTo', code: 'DATE_RANGE_TOO_LONG' }],
        });
      }
    }
    // Business dates (BR-010): [from rollover, to + 1 rollover).
    if (q.receivedFrom)
      where.push(`p.received_at >= ${arg(atLocal(q.receivedFrom, rollover, tz))}`);
    if (q.receivedTo) {
      where.push(`p.received_at < ${arg(atLocal(addDays(q.receivedTo, 1), rollover, tz))}`);
    }
    const c = decodeCursor(q.cursor, 2);
    if (c) {
      const at = arg(new Date(String(c[0])));
      const id = arg(String(c[1]));
      where.push(`(p.received_at, p.id) > (${at}, ${id})`);
    }
    const { rows } = await tx.query<PaymentListRow>(
      `SELECT ${PAYMENT_COLUMNS}, p.folio_id, NULL::text AS reservation_code
         FROM payment p ${PAYMENT_JOINS}
        WHERE p.received_at IS NOT NULL ${where.length ? `AND ${where.join(' AND ')}` : ''}
        ORDER BY p.received_at, p.id
        LIMIT ${arg(q.limit + 1)}`,
      args,
    );
    const pg = page(rows, q.limit, (r) => [(r.received_at as Date).toISOString(), r.id]);
    // Booking codes through the reservations port (one read per distinct booking of the page).
    const codes = new Map<string, string | null>();
    for (const r of pg.data) {
      if (!r.reservation_id || codes.has(r.reservation_id)) continue;
      codes.set(r.reservation_id, (await this.reservationCode(tx, r.reservation_id)) ?? null);
    }
    for (const r of pg.data)
      r.reservation_code = r.reservation_id ? (codes.get(r.reservation_id) ?? null) : null;
    const alertDays = await this.params.get<number>(
      tx,
      'bank_reconcile_alert_days',
      localDate(now, tz),
    );
    return { rows: pg.data, nextCursor: pg.page.nextCursor, tz, now, alertDays, rollover };
  }

  /** Business days waiting and the BR-527 "Cần chú ý" flag (≥ alert days × 24 h – oracle BR-527-01). */
  static waiting(
    p: Pick<PaymentRowLite, 'reconciliation' | 'received_at'>,
    ctx: { tz: string; now: Date; alertDays: number; rollover: string },
  ): { pendingDays?: number; reconcileOverdue: boolean } {
    if (p.reconciliation !== 'pending' || !p.received_at) return { reconcileOverdue: false };
    const today = businessDate(ctx.now, ctx.tz, ctx.rollover);
    const from = businessDate(p.received_at, ctx.tz, ctx.rollover);
    const pendingDays = Math.round((Date.parse(today) - Date.parse(from)) / 86_400_000);
    const overdue = ctx.now.getTime() - p.received_at.getTime() >= ctx.alertDays * 86_400_000;
    return { pendingDays, reconcileOverdue: overdue };
  }

  /**
   * 0.3.7 bổ sung 4 (DOM (f), ARC D7): "còn phải thu lúc xác nhận" of a VietQR = the cap of ITS purpose computed
   * now with the inputs kept at creation – `check_in` / `check_out` through the reservations port
   * (`amountDueNowFor`, BE-A: previewCheckIn / getCheckoutSummary at confirmation), `deposit` = the deposit still missing,
   * `balance` = the balance due of the folio. A step that no longer applies (the stay moved on, a non-desk actor)
   * falls back to the balance due now. Legacy rows (no purpose): deposit type → deposit, else balance.
   */
  async amountDueNow(
    tx: Tx,
    actor: { userId: string; roles: readonly string[]; requestId?: string },
    p: Pick<PaymentRowLite, 'type' | 'reservation_id' | 'qr_purpose' | 'qr_context'> & {
      folio_id: string;
    },
  ): Promise<number> {
    const purpose = p.qr_purpose ?? (p.type === 'deposit' ? 'deposit' : 'balance');
    const balance = async () => (await this.folios.balance(tx, p.folio_id)).balanceDueVnd;
    if ((purpose === 'check_in' || purpose === 'check_out') && p.reservation_id) {
      try {
        // BE-A's cap at confirmation (D7): options no longer valid are dropped, a stay past the step answers
        // the folio balance.
        return await this.port().amountDueNowFor(tx, {
          reservationId: p.reservation_id,
          purpose,
          actor: {
            userId: actor.userId,
            roles: actor.roles,
            ...(actor.requestId ? { requestId: actor.requestId } : {}),
          },
          ...stayOfContext(p.qr_context ?? null),
        });
      } catch (e) {
        if (e instanceof ProblemError) return balance();
        throw e;
      }
    }
    if (purpose === 'deposit' && p.reservation_id) {
      const view = await this.port().reservationView(tx, p.reservation_id);
      const required = Number(view.depositRequiredVnd ?? 0);
      return Math.max(0, required - (await this.folios.depositPaid(tx, p.folio_id)));
    }
    return balance();
  }

  // ───────────── confirmPaymentReceived (2.3, SM-12) ─────────────

  async confirmReceived(
    tx: Tx,
    actor: PaymentActor,
    paymentId: string,
    input: { receivedAt: string | null; note: unknown; attachmentId: string | null },
  ): Promise<PaymentRowLite> {
    const note = optionalText('note', input.note, 300);
    const receivedAt = parseInstant('receivedAt', input.receivedAt);
    const current = await this.payments.row(tx, paymentId);
    if (!current) throw problem('NOT_FOUND');
    const folioId = (current as PaymentRowLite & { folio_id: string }).folio_id;
    const meta = await this.folioMeta(tx, folioId);
    const r = await this.scopedReservation(tx, actor, meta.primary_reservation_id, { lock: true });
    if (!isDesk(actor.roles) && current.type !== 'deposit') throw problem('NOT_FOUND');
    await this.folios.lock(tx, folioId);
    const p = (await this.payments.row(tx, paymentId, { forUpdate: true })) as PaymentRowLite;
    const now = this.clock.now();
    const expired = p.status === 'pending' && p.expires_at !== null && p.expires_at <= now;
    if (p.method !== 'vietqr' || p.status !== 'pending' || expired) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: expired ? 'expired' : p.status },
      });
    }
    // 0.3.7 bổ sung 4 (DOM (f), ARC D7): more than what is due NOW for the QR's purpose needs a note (the over
    // part becomes credit, handled by BR-522 – never an automatic refund request).
    const dueNow = await this.amountDueNow(tx, actor, { ...p, folio_id: folioId });
    if (p.amount_vnd > dueNow && (!note || note.length < 3)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
        extras: { max: dueNow },
      });
    }
    const at = receivedAt ?? now;
    // SEC-BE-44 / F4 (as recordPayment): never before the QR existed nor in the future; a sale dates back at
    // most `staff_payment_backdate_max_hours`; the desk back-filling > 24 h writes a note.
    const created = await this.createdAt(tx, p.id);
    if (at.getTime() > now.getTime() || (created && at.getTime() < created.getTime())) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'receivedAt', code: 'DATE_INVALID' }],
      });
    }
    const ageMs = now.getTime() - at.getTime();
    if (isDesk(actor.roles)) {
      if (ageMs > 24 * 3_600_000 && !note) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
        });
      }
    } else {
      const tz = await this.folios.timezone(tx);
      const maxH = await this.params.get<number>(
        tx,
        'staff_payment_backdate_max_hours',
        localDate(now, tz),
      );
      if (ageMs > maxH * 3_600_000) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'receivedAt', code: 'DATE_INVALID' }],
        });
      }
    }
    if (input.attachmentId) {
      await this.attachments.assertUsable(tx, actor, input.attachmentId, 'deposit_receipt', {
        reservationId: r.id,
        field: 'attachmentId',
      });
    }
    await tx.query(
      `UPDATE payment SET status = 'succeeded', received_at = $2, confirmed_at = $3, confirmed_by = $4,
          reconciliation = 'pending', note = COALESCE($5, note), attachment_id = COALESCE($6, attachment_id),
          updated_at = $3, version = version + 1
        WHERE id = $1`,
      [p.id, at, now, actor.userId, note, input.attachmentId],
    );
    if (input.attachmentId) {
      await this.attachments.bindTo(tx, input.attachmentId, { type: 'payment', id: p.id });
    }
    await this.audit.recordMoney(tx, {
      action: 'payment.confirmed_received',
      entityType: 'payment',
      entityId: p.id,
      entityCode: r.code,
      before: { status: 'pending' },
      after: {
        code: p.code,
        status: 'succeeded',
        amountVnd: p.amount_vnd,
        method: p.method,
        reconciliation: 'pending',
        ...(p.amount_vnd > dueNow ? { overVnd: p.amount_vnd - dueNow } : {}),
      },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const out = (await this.payments.row(tx, p.id)) as PaymentRowLite;
    await this.changed(tx, out, r.id);
    return out;
  }

  // ───────────── reconcilePayment (2.4, A46) ─────────────

  async reconcile(
    tx: Tx,
    actor: PaymentActor,
    paymentId: string,
    version: number,
    input: { result: 'reconciled' | 'disputed'; note: unknown },
  ): Promise<PaymentRowLite> {
    const note =
      input.result === 'disputed'
        ? requireReason('note', input.note, { max: 300 })
        : optionalText('note', input.note, 300);
    const p = await this.lockPayment(tx, paymentId);
    if (p.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: p.version } });
    }
    if (p.status !== 'succeeded' || p.reconciliation !== 'pending') {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: p.status !== 'succeeded' ? p.status : p.reconciliation },
      });
    }
    const self = p.recorded_by === actor.userId || p.confirmed_by === actor.userId;
    const owner = actor.roles.includes('owner');
    if (self && !owner) throw problem('SELF_RECONCILE_FORBIDDEN');
    if (self && p.method === 'cash' && SALES_ROLES.includes(p.recorded_by_role ?? '')) {
      throw problem('SELF_RECONCILE_FORBIDDEN');
    }
    return this.applyReconciliation(tx, actor, p, {
      result: input.result,
      note,
      selfReconciled: self,
      receivedAmountVnd: null,
      action: 'payment.reconciled',
    });
  }

  // ───────────── confirmCashHandover (2.4, A46a) ─────────────

  async confirmCashHandover(
    tx: Tx,
    actor: PaymentActor,
    paymentId: string,
    version: number,
    input: { result: 'received' | 'short'; receivedAmountVnd: number | null; note: unknown },
  ): Promise<PaymentRowLite> {
    const short = input.result === 'short';
    const note = short
      ? requireReason('note', input.note, { max: 300 })
      : optionalText('note', input.note, 300);
    const p = await this.lockPayment(tx, paymentId);
    if (p.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: p.version } });
    }
    if (
      p.method !== 'cash' ||
      p.status !== 'succeeded' ||
      p.reconciliation !== 'pending' ||
      !SALES_ROLES.includes(p.recorded_by_role ?? '')
    ) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: p.status !== 'succeeded' ? p.status : p.reconciliation },
      });
    }
    // A46a / BR-527 v0.3.3: never the person who recorded it – owner included.
    if (p.recorded_by === actor.userId) throw problem('SELF_RECONCILE_FORBIDDEN');
    if (short) {
      const got = input.receivedAmountVnd;
      if (got === null || !Number.isSafeInteger(got) || got < 0 || got >= p.amount_vnd) {
        throw problem('VALIDATION_FAILED', {
          errors: [
            { field: 'receivedAmountVnd', code: got === null ? 'REQUIRED' : 'AMOUNT_INVALID' },
          ],
        });
      }
    }
    return this.applyReconciliation(tx, actor, p, {
      result: short ? 'disputed' : 'reconciled',
      note,
      selfReconciled: false,
      receivedAmountVnd: short ? input.receivedAmountVnd : null,
      action: 'payment.cash_handover_confirmed',
    });
  }

  private async createdAt(tx: Tx, paymentId: string): Promise<Date | null> {
    const { rows } = await tx.query<{ created_at: Date }>(
      'SELECT created_at FROM payment WHERE id = $1',
      [paymentId],
    );
    return rows[0]?.created_at ?? null;
  }

  private async lockPayment(
    tx: Tx,
    paymentId: string,
  ): Promise<PaymentRowLite & { folio_id: string }> {
    const current = (await this.payments.row(tx, paymentId)) as
      (PaymentRowLite & { folio_id: string }) | null;
    if (!current) throw problem('NOT_FOUND');
    if (current.reservation_id) await this.port().lockForDeposit(tx, current.reservation_id);
    await this.folios.lock(tx, current.folio_id);
    return (await this.payments.row(tx, paymentId, { forUpdate: true })) as PaymentRowLite & {
      folio_id: string;
    };
  }

  private async applyReconciliation(
    tx: Tx,
    actor: PaymentActor,
    p: PaymentRowLite & { folio_id: string },
    o: {
      result: 'reconciled' | 'disputed';
      note: string | null;
      selfReconciled: boolean;
      receivedAmountVnd: number | null;
      action: string;
    },
  ): Promise<PaymentRowLite> {
    const now = this.clock.now();
    await tx.query(
      `UPDATE payment SET reconciliation = $2, reconciled_at = $3, reconciled_by = $4, reconciliation_note = $5,
          self_reconciled = $6, received_amount_vnd = $7, reconciled_by_role = $8, updated_at = $3,
          version = version + 1
        WHERE id = $1`,
      [
        p.id,
        o.result,
        now,
        actor.userId,
        o.note,
        o.selfReconciled,
        o.receivedAmountVnd,
        primaryRole(actor.roles),
      ],
    );
    const code = p.reservation_id
      ? (await this.port().ownership(tx, p.reservation_id))?.code
      : undefined;
    await this.audit.recordMoney(tx, {
      action: o.action,
      entityType: 'payment',
      entityId: p.id,
      entityCode: code ?? p.code,
      before: { reconciliation: 'pending' },
      after: {
        code: p.code,
        amountVnd: p.amount_vnd,
        method: p.method,
        reconciliation: o.result,
        recordedByRole: p.recorded_by_role,
        ...(o.selfReconciled ? { selfReconciled: true } : {}),
        ...(o.receivedAmountVnd !== null ? { receivedAmountVnd: o.receivedAmountVnd } : {}),
      },
      ...(o.note ? { reason: o.note } : {}),
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    if (o.result === 'disputed') {
      // SEC F5 / BR-527: red alert to the owners and the managers other than the recorder; never auto-reversed.
      await notifyStaff(
        tx,
        this.events,
        {
          kind: 'payment_disputed',
          roles: MANAGER_ROLES,
          ...(p.recorded_by ? { excludeUserIds: [p.recorded_by] } : {}),
          refType: 'payment',
          refId: p.id,
          refCode: code ?? p.code,
        },
        now,
      );
    } else {
      await this.tryEarn(tx, p.reservation_id, actor.requestId);
      // SEC I5: the receipt image is kept `deposit_receipt_retention_days` from now on (J16 purges it).
      await anchorPaymentAttachment(this.attachments, tx, p, now);
    }
    const out = (await this.payments.row(tx, p.id)) as PaymentRowLite;
    await this.changed(tx, out, p.reservation_id);
    return out;
  }

  /** BE-15 / DOM S3-3: try SM-11 `earned` after money moved on a booking (see FolioService). */
  private async tryEarn(tx: Tx, reservationId: string | null, requestId?: string): Promise<void> {
    if (!reservationId) return;
    const own = await this.port().ownership(tx, reservationId);
    if (!own) return;
    await this.folios.tryEarnCommissions(
      tx,
      { reservationId: own.id, reservationCode: own.code, status: own.status },
      requestId,
    );
  }

  // ───────────── reversePayment (2.5, A34) ─────────────

  /**
   * BR-525 (G-4, DOM 18/10 – BUG-R2-200): a reversal on a checked-out stay that leaves "còn phải thu" > 0 records
   * the debt of the stay in the SAME transaction through `ReservationHooks.debtAfterReversal` (front desk – BE-A:
   * debt = what the reversal added, max(0, due after) − max(0, due before); reason = the reversal reason, default
   * due date; OWN + MGR told; "Cần chú ý" `checkout_debt` until the folio owes nothing). Owed again → the stay's
   * earned / payable commissions go back to `projected` (BR-903, G-4 (3)); recordPayment earns them again. No folio line is posted
   * (no `post_checkout` fee – the charges did not change, only a receipt went away); the folio stays `settled` /
   * `closed` and its bill is unchanged. Due ≤ 0 after the reversal → no debt. On any booking, an overpayment that
   * fell below the open refund requests runs refundPlan again (BR-522).
   * Lock order (ARC 16.19): L1 every booking of the folio `FOR NO KEY UPDATE`, id order (`FolioService.lockStay` –
   * the debt is written on them) → L3 folio → L4 payment → L4 refund requests (refundPlan). Every decision (status,
   * due before / after) is read under these locks.
   */
  async reverse(
    tx: Tx,
    actor: PaymentActor,
    paymentId: string,
    reasonRaw: unknown,
  ): Promise<PaymentRowLite> {
    const reason = requireReason('reason', reasonRaw);
    const current = (await this.payments.row(tx, paymentId)) as
      (PaymentRowLite & { folio_id: string }) | null;
    if (!current) throw problem('NOT_FOUND');
    const folio = await this.folios.lockStay(tx, current.folio_id);
    if (!folio) throw problem('NOT_FOUND');
    const p = (await this.payments.row(tx, paymentId, { forUpdate: true })) as PaymentRowLite & {
      folio_id: string;
    };
    if (p.status !== 'succeeded' || p.reversal_of_id) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: p.status } });
    }
    const stay = await this.port().stayInfo(tx, folio.primary_reservation_id);
    const checkedOut = stay?.status === 'checked_out';
    const dueBefore = checkedOut ? (await this.folios.balance(tx, p.folio_id)).balanceDueVnd : 0;
    const now = this.clock.now();
    const id = uuidv7();
    const code = await this.docNumbers.allocate(tx, 'payment');
    await tx.query(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, received_at, recorded_by, recorded_by_role, reversal_of_id,
         reversal_reason, created_at, created_by, updated_at)
       SELECT $2, organization_id, property_id, $3, folio_id, reservation_id, type, method, 'not_required',
              -amount_vnd, 'succeeded', $4, $5, $6, id, $7, $4, $5, $4
         FROM payment WHERE id = $1`,
      [p.id, id, code, now, actor.userId, primaryRole(actor.roles), reason],
    );
    await tx.query(
      `UPDATE payment SET status = 'reversed', updated_at = $2, version = version + 1 WHERE id = $1`,
      [p.id, now],
    );
    // SEC I5: a disputed receipt is kept until it is dealt with (the reversal) + the retention period.
    if (p.reconciliation === 'disputed')
      await anchorPaymentAttachment(this.attachments, tx, p, now);
    if (p.type === 'refund' && p.approval_request_id) {
      // Reversing a refund paid by mistake gives the approved amount back (BR-522) – through SM-10's owner.
      await this.approvals.addRefunded(tx, p.approval_request_id, p.amount_vnd);
    }
    const resCode = p.reservation_id
      ? (await this.port().ownership(tx, p.reservation_id))?.code
      : undefined;
    let debtVnd = 0;
    if (checkedOut && stay) {
      // Only a reversal that RAISED what is owed records (or grows) the debt: the increase is
      // max(0, due after) − max(0, due before) (`balanceDueVnd` is never negative) – reversing a refund pay-out,
      // or a receipt the overpayment covers, leaves no new debt (BR-525 "còn phải thu ≤ 0 → không có công nợ").
      // The front desk records the debt = that increase (DOM 18/10): it reads the due after under our locks and
      // takes `dueBeforeVnd` (read here under L3 before the reversal was written).
      const dueAfter = (await this.folios.balance(tx, p.folio_id)).balanceDueVnd;
      if (dueAfter > 0) {
        // BR-903 (G-4 (3)): owed again → earned / payable commissions back to projected (paid untouched).
        await this.folios.unearnCommissions(tx, {
          folioId: p.folio_id,
          reservationCode: stay.code,
          reason,
          ...(actor.requestId ? { requestId: actor.requestId } : {}),
        });
      }
      if (dueAfter - dueBefore > 0) {
        const debt = await this.debtOwner().debtAfterReversal(tx, {
          folioId: p.folio_id,
          paymentId: p.id,
          reason,
          // BE-A 18/10 (DOM: debt = only what the reversal added) – the port takes the increase over this.
          dueBeforeVnd: dueBefore,
          actor: { userId: actor.userId, roles: actor.roles },
          ...(actor.requestId ? { requestId: actor.requestId } : {}),
        });
        if (debt.recorded) debtVnd = debt.debtVnd;
      }
    }
    if (stay) {
      await this.folios.reconcileRefundsAfterReversal(tx, {
        folioId: p.folio_id,
        reservationId: stay.id,
        reservationCode: stay.code,
        reservationStatus: stay.status,
        actor: { userId: actor.userId, roles: actor.roles },
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    await this.audit.recordMoney(tx, {
      action: 'payment.reversed',
      entityType: 'payment',
      entityId: p.id,
      entityCode: resCode ?? p.code,
      before: { status: 'succeeded', amountVnd: p.amount_vnd },
      after: {
        status: 'reversed',
        code,
        amountVnd: -p.amount_vnd,
        method: p.method,
        type: p.type,
        ...(debtVnd > 0 ? { debtVnd } : {}),
      },
      reason,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const out = (await this.payments.row(tx, p.id)) as PaymentRowLite;
    await this.changed(tx, out, p.reservation_id);
    return out;
  }

  // ───────────── createVietQr (2.3, US-120; SEC F1–F3) ─────────────

  async createVietQr(
    tx: Tx,
    actor: PaymentActor,
    folioId: string,
    input: {
      amountVnd: number;
      purpose: string | null;
      overBalanceReason: unknown;
      /** 0.3.7: time inputs of the desk step (`check_in` / `check_out` only). */
      stay?: StayQrInput;
    },
  ): Promise<{ paymentId: string; expiredPaymentIds: string[] }> {
    if (input.purpose === 'billing_period') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'purpose', code: 'NOT_IN_LIST' }] });
    }
    const stay = input.stay ?? {};
    const stayPurpose =
      input.purpose === 'check_in' || input.purpose === 'check_out' ? input.purpose : null;
    stayFieldErrors(input.purpose, stay);
    if (!Number.isSafeInteger(input.amountVnd) || input.amountVnd <= 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }],
      });
    }
    const desk = isDesk(actor.roles);
    // 0.3.7: the QR of the check-in / check-out step is a desk action (SAL/CTV → 403, never their scope 404).
    if (stayPurpose && !desk) throw problem('FORBIDDEN_ACTION');
    // D12c (x-rbac-field): only FD+ may ask for more than the balance.
    if (input.overBalanceReason !== undefined && input.overBalanceReason !== null && !desk) {
      throw problem('FORBIDDEN_ACTION');
    }
    const overReason =
      input.overBalanceReason === undefined || input.overBalanceReason === null
        ? null
        : requireReason('overBalanceReason', input.overBalanceReason, { max: 300 });
    const meta = await this.folioMeta(tx, folioId);
    const target = await this.port().lockForDeposit(tx, meta.primary_reservation_id);
    if (!target) throw problem('NOT_FOUND');
    if (!desk && target.createdBy !== actor.userId && target.closerUserId !== actor.userId) {
      throw problem('NOT_FOUND');
    }
    // 0.3.7 (S4-10): `check_in` on a `confirmed` booking, `check_out` on an `in_house` one – else 409.
    if (stayPurpose && target.status !== (stayPurpose === 'check_in' ? 'confirmed' : 'in_house')) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: target.status } });
    }
    // A QR on a hold collects its deposit (a `charge` would not count for B4/J1 – verification 17/10).
    if (target.status === 'hold' && input.purpose !== null && input.purpose !== 'deposit') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'purpose', code: 'NOT_IN_LIST' }] });
    }
    const folio = await this.folios.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    if (folio.status === 'closed') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const tz = await this.folios.timezone(tx);
    const rollover = await this.rollover(tx, tz, now);
    const today = businessDate(now, tz, rollover);
    // 0.3.7 (S4-10): the check-in / check-out step owes what B9 / B18 would leave due at the typed time –
    // `CheckInPreview.amountDueAtCheckinVnd` (BR-402 v0.3.6: surcharge / B9a night included, pending FOC on
    // incidental charges not due) / `CheckoutSummary.amountDueAtCheckoutVnd`: the front desk's calculation
    // through the reservations port (BE-A), which also checks the step's day (arrival or B9a window; departure
    // or post-midnight window → else 409 INVALID_TRANSITION), the B9a / extra-night options and FD+.
    const stepDueVnd = stayPurpose
      ? await this.port().amountDueFor(tx, {
          reservationId: target.id,
          purpose: stayPurpose,
          actor: {
            userId: actor.userId,
            roles: actor.roles,
            ...(actor.requestId ? { requestId: actor.requestId } : {}),
          },
          ...stay,
        })
      : null;
    const account = await receivingAccountInEffect(tx, today, tz);
    if (!account) throw problem('PAYMENT_NOT_CONFIGURED');

    // SEC F1: the amount is checked against what is owed – a hold owes its missing deposit (BR-305).
    const hold = target.status === 'hold';
    const purpose = input.purpose ?? (hold ? 'deposit' : 'balance');
    let capVnd: number;
    if (stayPurpose) capVnd = stepDueVnd ?? 0;
    else if (hold)
      capVnd = Math.max(
        0,
        target.depositRequiredVnd - (await this.folios.depositPaid(tx, folio.id)),
      );
    else capVnd = (await this.folios.balance(tx, folio.id)).balanceDueVnd;
    if (input.amountVnd > capVnd && !overReason) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
        extras: { max: capVnd },
      });
    }
    // One pending QR per folio (UK payment_one_pending_qr_per_folio): the older one expires now.
    const { rows: expired } = await tx.query<{ id: string }>(
      `UPDATE payment SET status = 'expired', updated_at = $2, version = version + 1
        WHERE folio_id = $1 AND method = 'vietqr' AND status = 'pending' RETURNING id`,
      [folio.id, now],
    );
    const expiresAt = atLocal(addDays(today, 1), rollover, tz);
    const id = uuidv7();
    const code = await this.docNumbers.allocate(tx, 'payment');
    await tx.query(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, over_balance_reason,
         created_at, created_by, updated_at, qr_purpose, qr_context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'vietqr', 'pending', $8, 'pending', $9, $10, $11, $12, $13, $10, $13,
               $14, $15)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        folio.id,
        target.id,
        purpose === 'deposit' ? 'deposit' : 'charge',
        input.amountVnd,
        expiresAt,
        actor.userId,
        primaryRole(actor.roles),
        overReason,
        now,
        purpose,
        // 0.3.7 bổ sung 4 (ARC D7): the inputs of the cap, so the confirmation recomputes the SAME purpose.
        stayPurpose ? JSON.stringify(qrContextOf(stay)) : null,
      ],
    );
    await this.audit.recordMoney(tx, {
      action: 'payment.qr_created',
      entityType: 'payment',
      entityId: id,
      entityCode: target.code,
      after: {
        code,
        type: purpose === 'deposit' ? 'deposit' : 'charge',
        method: 'vietqr',
        amountVnd: input.amountVnd,
        status: 'pending',
        reconciliation: 'pending',
      },
      ...(overReason ? { reason: overReason } : {}),
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const payment = (await this.payments.row(tx, id)) as PaymentRowLite;
    await this.changed(tx, payment, target.id);
    return { paymentId: id, expiredPaymentIds: expired.map((e) => e.id) };
  }

  /**
   * SEC-BE-43 / F3: the QR answer is rebuilt from the payment row and the receiving account IN EFFECT at
   * every call – the idempotency table only keeps the ids, so a replay never hands back an old account or the
   * full account number from storage.
   */
  async qrView(
    tx: Tx,
    paymentId: string,
  ): Promise<
    Record<string, unknown> & { payment: PaymentRowLite; receivingAccountChangedAt: Date }
  > {
    const payment = (await this.payments.row(tx, paymentId)) as
      (PaymentRowLite & { folio_id: string }) | null;
    if (!payment || payment.method !== 'vietqr') throw problem('NOT_FOUND');
    const now = this.clock.now();
    const tz = await this.folios.timezone(tx);
    const rollover = await this.rollover(tx, tz, now);
    const account = await receivingAccountInEffect(tx, businessDate(now, tz, rollover), tz);
    if (!account) throw problem('PAYMENT_NOT_CONFIGURED');
    const folio = await this.folios.get(tx, payment.folio_id);
    const code = payment.reservation_id
      ? await this.reservationCode(tx, payment.reservation_id)
      : null;
    const content = transferContentOf(
      folio?.status === 'open' || !folio?.bill_no ? (code ?? payment.code) : folio.bill_no,
    );
    return {
      payment,
      qrPayload: buildVietQrPayload({
        bankBin: account.bankBin,
        accountNo: account.accountNo,
        amountVnd: payment.amount_vnd,
        transferContent: content,
      }),
      transferContent: content,
      receivingAccountMasked: maskedAccountNo(account),
      receivingAccountChangedAt: account.changedAt,
      receivingAccountRecentlyChanged:
        now.getTime() - account.changedAt.getTime() < RECENT_CHANGE_MS,
    };
  }
}

export { DESK_ROLES };
