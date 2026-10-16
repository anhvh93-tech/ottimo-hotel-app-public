/**
 * Payments – SM-12 (US-119, US-086; BR-008, BR-521, BR-522, BR-527; R-PAY-01: never a card number).
 *
 * Public API (always in the caller's transaction, lock order reservation → folio):
 * - recordManual()  one manual `succeeded` receipt (B2 initialPayment of BE-A, B4 deposits): code PT-…
 *                   (DocNumberService), recorder role snapshot (A-40), money audit (who, when, amount, method).
 * - recordInTx()    PaymentPort (ARC s3-contract 4.3) = the `recordPayment` rules of EP03-05 2.2 for any caller:
 *                   recordPayment endpoint, BE-A checkIn/checkOut.finalPayment. Validates type/method/amount/
 *                   backdating/POS code/receipt image, then recordManual. Field names carry `fieldPrefix`.
 * Reconciliation (BR-527): transfer / VietQR recorded by hand → `pending`; cash, POS slip, OTA → `not_required`;
 * anything a sale/CTV records → `pending` whatever the method (SEC-BE-22, ESC-017 A). Amounts are never
 * updated (reversal = own row, refund = own negative row).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { PaymentMethod, PaymentType } from '../../../db/schema/folio';
import { type FieldError, problem } from '../../../shared/problem';
import { localDate } from '../../../shared/time';
import { optionalText } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import {
  FolioService,
  PAYMENT_COLUMNS,
  PAYMENT_JOINS,
  type PaymentRowLite,
} from '../../folio/public/folio.service';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  ATTACHMENT_USAGE,
  type AttachmentUsage,
  anchorPaymentAttachment,
} from './attachment-usage';

export interface ManualPaymentInput {
  folioId: string;
  reservationId: string | null;
  reservationCode: string | null;
  type: PaymentType;
  method: PaymentMethod;
  amountVnd: number;
  /** null = now (Clock). */
  receivedAt: Date | null;
  posAuthCode: string | null;
  note: string | null;
  recordedBy: string;
  /** Override (SEC-BE-22: a sale's receipt is always `pending`); default by method (BR-527). */
  reconciliation?: 'pending' | 'not_required';
  /** Role of the recorder in the property (A-40 snapshot, persisted). */
  recordedByRole?: string | null;
  attachmentId?: string | null;
  requestId?: string;
}

/** OpenAPI PaymentCreate after JSON parsing (strings not yet checked). */
export interface PaymentCreateInput {
  type: string;
  method: string;
  amountVnd: number;
  receivedAt?: string | null;
  posAuthCode?: string | null;
  note?: string | null;
  billingPeriodId?: string | null;
  attachmentId?: string | null;
}

export interface PaymentActor {
  userId: string;
  roles: readonly string[];
  requestId?: string;
}

const ROLE_ORDER = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
  'housekeeping',
  'maintenance',
] as const;
export const DESK_ROLES: readonly string[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
export const MANAGER_ROLES: readonly string[] = ['owner', 'manager'];

/** Highest role of a caller in the property (recorder snapshot – A-40). */
export function primaryRole(roles: readonly string[]): string | null {
  return ROLE_ORDER.find((r) => roles.includes(r)) ?? null;
}

export function isDesk(roles: readonly string[]): boolean {
  return roles.some((r) => DESK_ROLES.includes(r));
}

/** BR-527: manual transfer / VietQR → wait for the bank statement; cash, POS slip, OTA → not required. */
export function reconciliationFor(method: PaymentMethod): 'pending' | 'not_required' {
  return method === 'bank_transfer' || method === 'vietqr' ? 'pending' : 'not_required';
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** R2 receipt types (EP03-05 2.2): security_deposit / deposit_deduction are long-stay (R3); refund only via 2.6. */
const R2_TYPES = ['deposit', 'charge'] as const;
/** R2 methods (vnpay / momo – R3). */
const R2_METHODS = ['vietqr', 'bank_transfer', 'cash', 'card_pos', 'ota_collect'] as const;
const BACKFILL_NOTE_HOURS = 24;

export function parseInstant(field: string, raw: string | null | undefined): Date | null {
  if (raw === undefined || raw === null) return null;
  const t = typeof raw === 'string' && ISO_INSTANT.test(raw) ? Date.parse(raw) : Number.NaN;
  if (Number.isNaN(t)) {
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'DATE_INVALID' }] });
  }
  return new Date(t);
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
    // Optional: the worker composition (reservations/public/worker-jobs.ts) only uses recordManual.
    @Optional() @Inject(FolioService) private readonly folios?: FolioService,
    @Optional() @Inject(ParameterService) private readonly params?: ParameterService,
    // ATTACHMENT_USAGE (BE-C AttachmentService) depends on the reservations port, whose adapter depends on
    // this service through MoneyBridge: resolved lazily at call time, never at construction (no DI cycle).
    @Optional() @Inject(ModuleRef) private readonly moduleRef?: ModuleRef,
  ) {}

  private get attachments(): AttachmentUsage | undefined {
    return this.moduleRef?.get<AttachmentUsage>(ATTACHMENT_USAGE, { strict: false });
  }

  async recordManual(tx: Tx, p: ManualPaymentInput): Promise<{ id: string; code: string }> {
    if (!Number.isSafeInteger(p.amountVnd) || p.amountVnd <= 0) {
      throw new RangeError('payment amount must be a positive safe integer');
    }
    const id = uuidv7();
    const now = this.clock.now();
    const code = await this.docNumbers.allocate(tx, 'payment');
    const reconciliation = p.reconciliation ?? reconciliationFor(p.method);
    await tx.query(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, auth_code, received_at, recorded_by, note, created_at,
         created_by, updated_at, recorded_by_role, attachment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'succeeded', $11, $12, $13, $14, $15, $13, $15, $16, $17)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        p.folioId,
        p.reservationId,
        p.type,
        p.method,
        reconciliation,
        p.amountVnd,
        p.posAuthCode,
        p.receivedAt ?? now,
        p.recordedBy,
        p.note,
        now,
        p.recordedByRole ?? null,
        p.attachmentId ?? null,
      ],
    );
    await this.audit.recordMoney(tx, {
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: id,
      entityCode: p.reservationCode ?? code,
      after: {
        code,
        type: p.type,
        method: p.method,
        amountVnd: p.amountVnd,
        status: 'succeeded',
        reconciliation,
        ...(p.recordedByRole ? { recordedByRole: p.recordedByRole } : {}),
      },
      ...(p.requestId ? { requestId: p.requestId } : {}),
    });
    return { id, code };
  }

  /**
   * PaymentPort.recordInTx (EP03-05 2.2). The caller has checked the role gate and the booking scope and
   * holds the reservation lock when it has one. `outstandingCapVnd` (SAL – BR-527): one receipt ≤ what the
   * booking still owes; FD+ above the balance must give a `note` (thu dư, DOM G-15).
   */
  async recordInTx(
    tx: Tx,
    actor: PaymentActor,
    folioId: string,
    raw: PaymentCreateInput,
    ctx: {
      reservationId: string | null;
      reservationCode: string | null;
      channelGroup?: string | null;
      reservationCreatedAt?: Date | null;
      fieldPrefix?: string;
    },
  ): Promise<PaymentRowLite> {
    const folios = this.need(this.folios, 'FolioService');
    const params = this.need(this.params, 'ParameterService');
    const f = (name: string) => `${ctx.fieldPrefix ?? ''}${name}`;
    const errors: FieldError[] = [];
    const desk = isDesk(actor.roles);
    if (!(R2_TYPES as readonly string[]).includes(raw.type)) {
      errors.push({ field: f('type'), code: 'NOT_IN_LIST' });
    }
    if (!(R2_METHODS as readonly string[]).includes(raw.method)) {
      errors.push({ field: f('method'), code: 'NOT_IN_LIST' });
    }
    if (raw.method === 'ota_collect' && ctx.channelGroup !== 'ota') {
      errors.push({ field: f('method'), code: 'NOT_IN_LIST' });
    }
    if (!Number.isSafeInteger(raw.amountVnd) || raw.amountVnd <= 0) {
      errors.push({ field: f('amountVnd'), code: 'AMOUNT_NOT_POSITIVE' });
    }
    let receivedAt: Date | null = null;
    try {
      receivedAt = parseInstant(f('receivedAt'), raw.receivedAt);
    } catch {
      errors.push({ field: f('receivedAt'), code: 'DATE_INVALID' });
    }
    const auth = typeof raw.posAuthCode === 'string' ? raw.posAuthCode.trim() || null : null;
    if (raw.method === 'card_pos' && !auth)
      errors.push({ field: f('posAuthCode'), code: 'REQUIRED' });
    if (auth && !/^[A-Za-z0-9]{1,12}$/.test(auth)) {
      errors.push({ field: f('posAuthCode'), code: 'VALIDATION_FAILED' });
    }
    if (raw.billingPeriodId !== undefined && raw.billingPeriodId !== null) {
      // Long-stay billing periods (US-119 AC5) are R3.
      errors.push({ field: f('billingPeriodId'), code: 'NOT_IN_LIST' });
    }
    if (
      raw.attachmentId !== undefined &&
      raw.attachmentId !== null &&
      !UUID.test(raw.attachmentId)
    ) {
      errors.push({ field: f('attachmentId'), code: 'NOT_IN_LIST' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const note = optionalText(f('note'), raw.note, 300);
    // A47 / US-119 AC4: a sale records deposits of their own bookings only (scope own_deposit_only).
    if (!desk && raw.type !== 'deposit') throw problem('FORBIDDEN_ACTION');

    const folio = await folios.lockForPosting(tx, folioId, { allowPostCheckout: true });
    if (folio.status === 'closed') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const tz = await folios.timezone(tx);
    const at = receivedAt ?? now;
    const earliest = ctx.reservationCreatedAt ?? null;
    if (at.getTime() > now.getTime() || (earliest && at.getTime() < earliest.getTime())) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: f('receivedAt'), code: 'DATE_INVALID' }],
      });
    }
    if (desk) {
      // P12: back-filling more than 24 h needs a note.
      if (now.getTime() - at.getTime() > BACKFILL_NOTE_HOURS * 3_600_000 && !note) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: f('note'), code: 'REASON_REQUIRED' }],
        });
      }
    } else {
      const maxH = await params.get<number>(
        tx,
        'staff_payment_backdate_max_hours',
        localDate(now, tz),
      );
      if (now.getTime() - at.getTime() > maxH * 3_600_000) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: f('receivedAt'), code: 'DATE_INVALID' }],
        });
      }
    }
    const balance = await folios.balance(tx, folio.id);
    if (raw.amountVnd > balance.balanceDueVnd) {
      if (!desk) {
        // BR-527: a sale never records more than the booking still owes.
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: f('amountVnd'), code: 'AMOUNT_TOO_HIGH' }],
          extras: { max: balance.balanceDueVnd },
        });
      }
      if (!note || note.length < 3) {
        // DOM G-15: an overpayment needs a note on how it will be handled.
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: f('note'), code: 'REASON_REQUIRED' }],
        });
      }
    }
    if (raw.attachmentId) {
      const att = this.need(this.attachments, 'AttachmentUsage');
      await att.assertUsable(tx, actor, raw.attachmentId, 'deposit_receipt', {
        reservationId: ctx.reservationId,
        field: f('attachmentId'),
      });
    }
    const role = primaryRole(actor.roles);
    const recorded = await this.recordManual(tx, {
      folioId: folio.id,
      reservationId: ctx.reservationId,
      reservationCode: ctx.reservationCode,
      type: raw.type as PaymentType,
      method: raw.method as PaymentMethod,
      amountVnd: raw.amountVnd,
      receivedAt: at,
      posAuthCode: auth,
      note,
      recordedBy: actor.userId,
      ...(desk ? {} : { reconciliation: 'pending' as const }),
      recordedByRole: role,
      attachmentId: raw.attachmentId ?? null,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    if (raw.attachmentId) {
      await this.need(this.attachments, 'AttachmentUsage').bindTo(tx, raw.attachmentId, {
        type: 'payment',
        id: recorded.id,
      });
    }
    const row = (await this.row(tx, recorded.id)) as PaymentRowLite;
    // SEC I5: nothing to reconcile (cash/POS at the desk) → the receipt retention starts now.
    if (row.reconciliation === 'not_required') {
      await anchorPaymentAttachment(this.attachments, tx, row, now);
    }
    return row;
  }

  /** One payment with the display joins (PaymentRowLite). */
  async row(
    tx: Tx,
    paymentId: string,
    opts: { forUpdate?: boolean } = {},
  ): Promise<PaymentRowLite | null> {
    if (opts.forUpdate) {
      const { rows } = await tx.query<{ id: string }>(
        'SELECT id FROM payment WHERE id = $1 FOR UPDATE',
        [paymentId],
      );
      if (!rows[0]) return null;
    }
    const { rows } = await tx.query<PaymentRowLite & { folio_id: string }>(
      `SELECT ${PAYMENT_COLUMNS}, p.folio_id FROM payment p ${PAYMENT_JOINS} WHERE p.id = $1`,
      [paymentId],
    );
    return rows[0] ?? null;
  }

  private need<T>(dep: T | undefined, name: string): T {
    if (!dep) throw new Error(`PaymentService needs ${name} (api container)`);
    return dep;
  }
}
