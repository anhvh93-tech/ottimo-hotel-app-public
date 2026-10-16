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
import type { UseCaseFailure } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { FolioService } from '../../folio/public/folio.service';
import {
  type DepositTarget,
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { LeadsService } from '../../sales/public/leads.service';
import { PaymentService } from '../public/payment.service';

const FULL_SCOPE = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

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
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
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
    input: { payment: DepositPaymentInput | null; existingPaymentId: string | null },
    requestId?: string,
  ): Promise<{ body: Record<string, unknown> } | UseCaseFailure> {
    const port = this.port();
    const t = await this.target(tx, c, reservationId);
    if (t.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: t.version } });
    }
    if (t.status !== 'hold') throw problem('INVALID_TRANSITION');
    const now = this.clock.now();
    // Lock order reservation → room → folio (coding-standards 6): the reservation row lock (above)
    // serialises deposits of this hold; the folio row is locked later by onReservationConfirmed, after
    // the port has done its occupancy work.
    const folio = await this.folios.get(tx, t.folioId);
    if (!folio) throw new Error(`folio of ${t.code} not visible`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');

    let receivedAt: Date;
    if (input.payment) {
      receivedAt = input.payment.receivedAt ?? now;
      if (
        receivedAt.getTime() > now.getTime() ||
        (t.holdCreatedAt && receivedAt.getTime() < t.holdCreatedAt.getTime())
      ) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'payment.receivedAt', code: 'DATE_INVALID' }],
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
    if (t.holdExpiresAt && t.holdExpiresAt.getTime() <= now.getTime()) {
      if (receivedAt.getTime() >= t.holdExpiresAt.getTime()) throw problem('HOLD_EXPIRED');
    }

    let paymentCode: string | null = null;
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
        ...(requestId ? { requestId } : {}),
      });
      paymentCode = recorded.code;
    }

    const paid = await this.folios.depositPaid(tx, folio.id);
    if (paid < t.depositRequiredVnd) {
      // AC2: the receipt stays (commit), the booking stays `hold`, the answer says how much is missing.
      return {
        fail: problem('DEPOSIT_INSUFFICIENT', {
          extras: {
            depositRequiredVnd: t.depositRequiredVnd,
            depositPaidVnd: paid,
            shortfallVnd: t.depositRequiredVnd - paid,
            ...(paymentCode ? { paymentCode } : {}),
          },
        }),
      };
    }

    const stay = await port.confirmFromHold(tx, t.id, {
      userId: c.userId,
      ...(requestId ? { requestId } : {}),
    });
    await this.folios.onReservationConfirmed(tx, stay, {
      userId: c.userId,
      ...(requestId ? { requestId } : {}),
    });
    await this.leads.onDepositConfirmed(tx, t.quoteId);
    await tx.query(
      `UPDATE deposit_notice SET status = 'handled', updated_at = $2, version = version + 1
        WHERE reservation_id = $1 AND status = 'open'`,
      [t.id, now],
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

  async notice(
    tx: Tx,
    c: Caller,
    reservationId: string,
    input: { amountVnd: number; note: string | null },
    requestId?: string,
  ): Promise<void> {
    const t = await this.target(tx, c, reservationId);
    if (t.status !== 'hold') throw problem('INVALID_TRANSITION');
    const now = this.clock.now();
    const id = uuidv7();
    await tx.query(
      `INSERT INTO deposit_notice (id, organization_id, property_id, reservation_id, amount_vnd, note, status,
         created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $7)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        t.id,
        input.amountVnd,
        input.note,
        now,
        c.userId,
      ],
    );
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
        `deposit_notice:${id}`,
      ],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'deposit_notice.created',
      entityType: 'deposit_notice',
      entityId: id,
      entityCode: t.code,
      after: { amountVnd: input.amountVnd, status: 'open' },
      ...(requestId ? { requestId } : {}),
    });
  }
}
