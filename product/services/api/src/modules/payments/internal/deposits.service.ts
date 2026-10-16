/**
 * Deposit flows of a hold (US-086 AC1, AC2, AC4, AC5; SM-01 B4; SM-12; BR-305, BR-527).
 * confirmDeposit (FD+, SAL own – CTV never, rbac note 20):
 *   lock reservation (port) → If-Match → status hold → hold not expired (or the money arrived before the
 *   deadline – US-085 AC4) → record the receipt (or reuse a succeeded deposit of this folio) →
 *   Σ deposits ≥ depositRequired ? B4 (port) + folio postings (room/extra lines, commission projected,
 *   allocations) + lead won + notices handled : COMMIT the receipt and answer 422 DEPOSIT_INSUFFICIENT
 *   (AC2 "giao dịch vẫn được ghi, đơn giữ hold").
 * createDepositNotice (SAL/CTV own, A53): "khách đã chuyển cọc" → row + push to FD/FDL and the sale in
 *   charge (outbox, no amount in the payload – C2 stays out of push); FD/SAL confirm with B4.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { PaymentMethod } from '../../../db/schema/folio';
import { problem } from '../../../shared/problem';
import { localDate, toZonedIso } from '../../../shared/time';
import { ParameterService } from '../../platform/public/parameter.service';
import { AuditService } from '../../audit/public/audit.service';
import { FolioService } from '../../folio/public/folio.service';
import {
  type DepositTarget,
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { LeadsService } from '../../sales/public/leads.service';
import { EventsService } from '../../events/public/events.service';
import { notifyStaff } from '../../platform/public/staff-notify';
import {
  ATTACHMENT_USAGE,
  type AttachmentUsage,
  anchorPaymentAttachment,
} from '../public/attachment-usage';
import { PaymentService, primaryRole, reconciliationFor } from '../public/payment.service';

const FULL_SCOPE = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
/** SEC-BE-28: minimum gap between two pushes of the same open deposit notice. */
const NOTICE_REPUSH_MS = 10 * 60_000;

export interface Caller {
  userId: string;
  roles: readonly string[];
}

export interface DepositPaymentInput {
  method: Extract<PaymentMethod, 'vietqr' | 'bank_transfer' | 'cash' | 'card_pos'>;
  amountVnd: number;
  receivedAt: Date | null;
  posAuthCode: string | null;
  note: string | null;
  /** 0.3.6: receipt image (`uploadAttachment purpose=deposit_receipt`, A-17 lifted). */
  attachmentId?: string | null;
}

function own(c: Caller): boolean {
  return !c.roles.some((r) => FULL_SCOPE.includes(r));
}

@Injectable()
export class DepositsService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(LeadsService) private readonly leads: LeadsService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(ATTACHMENT_USAGE) private readonly attachments: AttachmentUsage,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  private port(): ReservationSalesPort {
    if (!this.reservations) {
      throw problem('INTERNAL_ERROR', { detail: 'reservations module not wired' });
    }
    return this.reservations;
  }

  /** Reservation locked FOR UPDATE and inside the caller's scope (404 otherwise). */
  private async target(tx: Tx, c: Caller, reservationId: string): Promise<DepositTarget> {
    const t = await this.port().lockForDeposit(tx, reservationId);
    if (!t) throw problem('NOT_FOUND');
    if (own(c) && t.createdBy !== c.userId && t.closerUserId !== c.userId) {
      throw problem('NOT_FOUND');
    }
    return t;
  }

  async confirm(
    tx: Tx,
    c: Caller,
    reservationId: string,
    version: number,
    input: {
      payment: DepositPaymentInput | null;
      existingPaymentId: string | null;
      /** 0.3.6 B-29 / DOM BE-11: MGR+ confirms with less than the required deposit. */
      acceptShortfallReason?: string | null;
    },
    requestId?: string,
  ): Promise<{ body: Record<string, unknown> }> {
    const port = this.port();
    const acceptShortfall = input.acceptShortfallReason ?? null;
    // D12c: only owner/manager may accept a short deposit (FD/FDL/SAL → 403 before anything is read).
    if (acceptShortfall && !c.roles.some((r) => r === 'owner' || r === 'manager')) {
      throw problem('FORBIDDEN_ACTION');
    }
    const t = await this.target(tx, c, reservationId);
    if (t.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: t.version } });
    }
    if (t.status !== 'hold') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: t.status } });
    }
    const now = this.clock.now();
    const tz = await this.folios.timezone(tx);
    const desk = !own(c); // FD+ (rbac: SAL is the only other role with A04)
    // Lock order reservation → room → folio (coding-standards 6): the reservation row lock (above)
    // serialises deposits of this hold; the folio row is locked later by onReservationConfirmed, after
    // the port has done its occupancy work.
    const folio = await this.folios.get(tx, t.folioId);
    if (!folio) throw new Error(`folio of ${t.code} not visible`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');

    let receivedAt: Date;
    if (input.payment) {
      receivedAt = input.payment.receivedAt ?? now;
      // BR-527 v0.3.2 (SEC-BE-22): a sale/CTV may date a receipt back at most
      // `staff_payment_backdate_max_hours`, and never before the hold.
      const backdateH = desk
        ? null
        : await this.params.get<number>(tx, 'staff_payment_backdate_max_hours', localDate(now, tz));
      const earliest = Math.max(
        t.holdCreatedAt?.getTime() ?? 0,
        backdateH === null ? 0 : now.getTime() - backdateH * 3_600_000,
      );
      if (receivedAt.getTime() > now.getTime() || receivedAt.getTime() < earliest) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'payment.receivedAt', code: 'DATE_INVALID' }],
        });
      }
      // BR-527 v0.3.2: one receipt ≤ what the booking still owes (room + known extra-person fee − paid);
      // above it only FD+ may record, with a reason in `note` (money paid in advance shows on the folio).
      const outstanding = Math.max(
        0,
        (await this.stayTotal(tx, t)) - (await this.folios.depositPaid(tx, t.folioId)),
      );
      if (
        input.payment.amountVnd > outstanding &&
        !(desk && (input.payment.note ?? '').length >= 3)
      ) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'payment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
          extras: { max: outstanding },
        });
      }
    } else {
      const { rows } = await tx.query<{ received_at: Date | null }>(
        `SELECT received_at FROM payment WHERE id = $1 AND folio_id = $2 AND type = 'deposit'
            AND status = 'succeeded'`,
        [input.existingPaymentId, folio.id],
      );
      if (!rows[0]) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'existingPaymentId', code: 'NOT_IN_LIST' }],
        });
      }
      receivedAt = rows[0].received_at ?? now;
    }
    // US-085 AC4: a hold past its deadline is only confirmed when the money arrived before the deadline.
    // SEC-BE-22 (2): only FD+ may rescue an overdue hold on that ground.
    if (t.holdExpiresAt && t.holdExpiresAt.getTime() <= now.getTime()) {
      if (!desk || receivedAt.getTime() >= t.holdExpiresAt.getTime()) {
        throw problem('HOLD_EXPIRED', { extras: { expiredAt: toZonedIso(t.holdExpiresAt, tz) } });
      }
    }

    let recordedNew = false;
    let paymentId: string | null = input.existingPaymentId;
    if (input.payment?.attachmentId) {
      await this.attachments.assertUsable(tx, c, input.payment.attachmentId, 'deposit_receipt', {
        reservationId: t.id,
        field: 'payment.attachmentId',
      });
    }
    if (input.payment) {
      const recorded = await this.payments.recordManual(tx, {
        folioId: folio.id,
        reservationId: t.id,
        reservationCode: t.code,
        type: 'deposit',
        method: input.payment.method,
        amountVnd: input.payment.amountVnd,
        receivedAt,
        posAuthCode: input.payment.posAuthCode,
        note: input.payment.note,
        recordedBy: c.userId,
        // SEC-BE-22 (1): whatever the method, a receipt recorded by a sale waits for the desk/bank check.
        ...(desk ? {} : { reconciliation: 'pending' as const }),
        recordedByRole: primaryRole(c.roles),
        attachmentId: input.payment.attachmentId ?? null,
        ...(requestId ? { requestId } : {}),
      });
      recordedNew = true;
      paymentId = recorded.id;
      if (input.payment.attachmentId) {
        await this.attachments.bindTo(tx, input.payment.attachmentId, {
          type: 'payment',
          id: recorded.id,
        });
        // SEC I5: cash/POS at the desk needs no reconciliation → the receipt retention starts now.
        if (desk && reconciliationFor(input.payment.method) === 'not_required') {
          await anchorPaymentAttachment(
            this.attachments,
            tx,
            { attachment_id: input.payment.attachmentId, type: 'deposit' },
            now,
          );
        }
      }
      if (!desk) await this.pushUnverified(tx, t, c.userId);
    }

    const paid = await this.folios.depositPaid(tx, folio.id);
    let shortfall = 0;
    if (paid < t.depositRequiredVnd && acceptShortfall) {
      // B-29: a manager accepts the short deposit – only when some money was received.
      if (paid <= 0) throw problem('INVALID_TRANSITION', { extras: { currentState: t.status } });
      shortfall = t.depositRequiredVnd - paid;
    }
    if (paid < t.depositRequiredVnd && !shortfall) {
      if (!recordedNew) {
        // Nothing written: a 4xx is safe to resend (contract 0.3.5 A-13).
        throw problem('DEPOSIT_INSUFFICIENT', {
          extras: {
            depositRequiredVnd: t.depositRequiredVnd,
            depositPaidVnd: paid,
            shortfallVnd: t.depositRequiredVnd - paid,
          },
        });
      }
      // US-086 AC2 + A-13: the receipt is kept, the booking stays `hold` → 200 with depositPaidVnd.
      return { body: await port.reservationView(tx, t.id) };
    }

    const stay = await port.confirmFromHold(tx, t.id, {
      userId: c.userId,
      ...(requestId ? { requestId } : {}),
    });
    if (shortfall > 0) {
      // Columns of 0040 (owned by this use case – ARC s3-contract 5): who, when, how much, why.
      await tx.query(
        `UPDATE reservation SET deposit_shortfall_vnd = $2, deposit_shortfall_accepted_at = $3,
            deposit_shortfall_accepted_by = $4, deposit_shortfall_reason = $5
          WHERE id = $1`,
        [t.id, shortfall, now, c.userId, acceptShortfall],
      );
      await this.audit.recordMoney(tx, {
        action: 'deposit.shortfall_accepted',
        entityType: 'reservation',
        entityId: t.id,
        entityCode: t.code,
        after: {
          shortfallVnd: shortfall,
          depositRequiredVnd: t.depositRequiredVnd,
          depositPaidVnd: paid,
        },
        reason: acceptShortfall as string,
        ...(requestId ? { requestId } : {}),
      });
      await notifyStaff(
        tx,
        this.events,
        {
          kind: 'deposit_shortfall_accepted',
          roles: ['owner'],
          excludeUserIds: [c.userId],
          refType: 'reservation',
          refId: t.id,
          refCode: t.code,
        },
        now,
      );
    }
    await this.folios.onReservationConfirmed(tx, stay, {
      userId: c.userId,
      ...(requestId ? { requestId } : {}),
    });
    await this.leads.onDepositConfirmed(tx, t.quoteId);
    await tx.query(
      `UPDATE deposit_notice SET status = 'handled', handled_payment_id = $3, updated_at = $2,
          version = version + 1
        WHERE reservation_id = $1 AND status = 'open'`,
      [t.id, now, paymentId],
    );
    await this.audit.recordMoney(tx, {
      action: 'reservation.deposit_confirmed',
      entityType: 'folio',
      entityId: folio.id,
      entityCode: t.code,
      after: {
        depositPaidVnd: paid,
        depositRequiredVnd: t.depositRequiredVnd,
        status: 'confirmed',
      },
      ...(requestId ? { requestId } : {}),
    });
    return { body: await port.reservationView(tx, t.id) };
  }

  /** Room total + extra-person fee of the stay (quote snapshot, else the booking's room total). */
  private async stayTotal(tx: Tx, t: DepositTarget): Promise<number> {
    if (t.quoteId) {
      const { rows } = await tx.query<{ total_vnd: number }>(
        'SELECT total_vnd FROM quote WHERE id = $1',
        [t.quoteId],
      );
      if (rows[0]) return rows[0].total_vnd;
    }
    const view = await this.port().reservationView(tx, t.id);
    return Number(view.totalRoomVnd ?? 0);
  }

  /** SEC-BE-22 (1): "deposit not verified" push to FD/FDL/MGR until "Cần chú ý" exists (Sprint 4). */
  private async pushUnverified(tx: Tx, t: DepositTarget, by: string): Promise<void> {
    const { rows: users } = await tx.query<{ user_id: string }>(
      `SELECT DISTINCT upr.user_id FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
        WHERE upr.property_id = $1 AND upr.revoked_at IS NULL AND u.status = 'active' AND upr.user_id <> $2
          AND upr.role IN ('front_desk', 'front_desk_lead', 'manager')
        ORDER BY upr.user_id`,
      [tx.ctx.propertyId, by],
    );
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({
          kind: 'deposit_unverified',
          refType: 'reservation',
          refId: t.id,
          refCode: t.code,
          userIds: users.map((u) => u.user_id),
        }),
        `deposit_unverified:${t.id}:${uuidv7()}`,
      ],
    );
  }

  async notice(
    tx: Tx,
    c: Caller,
    reservationId: string,
    input: { amountVnd: number; note: string | null; attachmentId?: string | null },
    requestId?: string,
  ): Promise<void> {
    const t = await this.target(tx, c, reservationId);
    if (input.attachmentId) {
      await this.attachments.assertUsable(tx, c, input.attachmentId, 'deposit_receipt', {
        reservationId: t.id,
        field: 'attachmentId',
      });
    }
    if (t.status !== 'hold') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: t.status } });
    }
    const now = this.clock.now();
    // SEC-BE-28 (3): one open notice per booking – a new report updates it; the desk is pushed again only
    // after NOTICE_REPUSH_MS (no push storm from repeated taps or a hijacked account).
    const { rows: open } = await tx.query<{ id: string; updated_at: Date }>(
      `SELECT id, updated_at FROM deposit_notice WHERE reservation_id = $1 AND status = 'open'
        ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [t.id],
    );
    const prev = open[0];
    const id = prev?.id ?? uuidv7();
    if (prev) {
      await tx.query(
        `UPDATE deposit_notice SET amount_vnd = $2, note = $3, updated_at = $4, version = version + 1,
            attachment_id = COALESCE($5, attachment_id)
          WHERE id = $1`,
        [prev.id, input.amountVnd, input.note, now, input.attachmentId ?? null],
      );
    } else {
      await tx.query(
        `INSERT INTO deposit_notice (id, organization_id, property_id, reservation_id, amount_vnd, note, status,
           created_at, created_by, updated_at, attachment_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $7, $9)`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          t.id,
          input.amountVnd,
          input.note,
          now,
          c.userId,
          input.attachmentId ?? null,
        ],
      );
    }
    await this.audit.record(tx, {
      category: 'state',
      action: prev ? 'deposit_notice.updated' : 'deposit_notice.created',
      entityType: 'deposit_notice',
      entityId: id,
      entityCode: t.code,
      after: { amountVnd: input.amountVnd, status: 'open' },
      ...(requestId ? { requestId } : {}),
    });
    if (prev && now.getTime() - prev.updated_at.getTime() < NOTICE_REPUSH_MS) return;
    const { rows: users } = await tx.query<{ user_id: string }>(
      `SELECT DISTINCT upr.user_id FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
        WHERE upr.property_id = $1 AND upr.revoked_at IS NULL AND u.status = 'active' AND upr.user_id <> $2
          AND (upr.role IN ('front_desk', 'front_desk_lead')
               OR (upr.role = 'sales_staff' AND upr.user_id IN ($3::uuid, $4::uuid)))
        ORDER BY upr.user_id`,
      [tx.ctx.propertyId, c.userId, t.closerUserId, t.createdBy],
    );
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({
          kind: 'deposit_notice',
          refType: 'reservation',
          refId: t.id,
          refCode: t.code,
          userIds: users.map((u) => u.user_id),
        }),
        `deposit_notice:${id}:${now.getTime()}`,
      ],
    );
  }
}
