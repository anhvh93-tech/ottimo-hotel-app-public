/**
 * Money side of the booking transitions, owned by the folio / payments modules (BE-B), called in the SAME
 * transaction (coding-standards 6). Both services are optional at injection time so the reservations module
 * also runs where folio/payments are not loaded (unit tests, partial builds):
 *
 * - openFolio()          B1/B2: one folio per booking, reservation.folio_id set (FolioService.openForReservation).
 * - posted()             B2/B12: room + extra-person lines, commission, channel fee (FolioService.onReservationConfirmed).
 *                        B4 is posted by payments itself after confirmFromHold() (sales-port).
 * - voided()             B5/B6/B10/B11: live commissions → void (FolioService.onReservationVoided).
 * - depositPaid()        Σ succeeded deposits of the booking's folio (BR-309 refund basis, B6 "đã có cọc").
 * - recordInitialPayment() B2 `initialPayment`: PaymentService.recordManual, or the recorder the payments
 *                        module registers. Nothing wired → 409 PAYMENT_NOT_CONFIGURED: money is never accepted
 *                        without its ledger row.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { PaymentMethod } from '../../../db/schema/folio';
import { problem } from '../../../shared/problem';
import { FolioService } from '../../folio/public/folio.service';
import { PaymentService } from '../../payments/public/payment.service';
import type { InitialPayment } from '../public/reservation-hooks';
import type { ConfirmedStay } from '../public/sales-port';
import type { ReservationRow } from './reservation-store';

export type PaymentRecorder = (
  tx: Tx,
  input: {
    reservationId: string;
    code: string;
    folioId: string | null;
    payment: InitialPayment;
    userId: string;
  },
) => Promise<void>;

@Injectable()
export class MoneyBridge {
  private recorder: PaymentRecorder | null = null;

  constructor(
    @Optional() @Inject(FolioService) private readonly folios?: FolioService,
    @Optional() @Inject(PaymentService) private readonly payments?: PaymentService,
  ) {}

  /** Payments module (or a test harness) supplies the B2 receipt writer. */
  registerPaymentRecorder(fn: PaymentRecorder): void {
    this.recorder = fn;
  }

  async openFolio(tx: Tx, reservationId: string, createdBy: string | null): Promise<string | null> {
    if (!this.folios) return null;
    const folioId = await this.folios.openForReservation(tx, { reservationId, createdBy });
    await tx.query('UPDATE reservation SET folio_id = $2 WHERE id = $1', [reservationId, folioId]);
    return folioId;
  }

  async depositPaid(tx: Tx, row: Pick<ReservationRow, 'id' | 'folio_id'>): Promise<number> {
    if (this.folios && row.folio_id) return this.folios.depositPaid(tx, row.folio_id);
    // Worker / partial wiring: same rule read straight from the ledger (never assume "nothing paid" –
    // the hold-expiry job must not cancel a hold whose deposit arrived, US-085 AC4).
    const { rows } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(SUM(amount_vnd), 0) AS total FROM payment
        WHERE (reservation_id = $1 OR ($2::uuid IS NOT NULL AND folio_id = $2))
          AND type = 'deposit' AND status = 'succeeded'`,
      [row.id, row.folio_id],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async recordInitialPayment(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'code' | 'folio_id'>,
    payment: InitialPayment,
    userId: string,
    now: Date,
    requestId?: string,
  ): Promise<void> {
    if (this.recorder) {
      await this.recorder(tx, {
        reservationId: row.id,
        code: row.code,
        folioId: row.folio_id,
        payment,
        userId,
      });
      return;
    }
    if (!this.payments || !row.folio_id) {
      throw problem('PAYMENT_NOT_CONFIGURED', { detail: 'payments ledger not wired' });
    }
    await this.payments.recordManual(tx, {
      folioId: row.folio_id,
      reservationId: row.id,
      reservationCode: row.code,
      type: payment.type,
      method: payment.method as PaymentMethod,
      amountVnd: payment.amountVnd,
      receivedAt: payment.receivedAt ? new Date(payment.receivedAt) : now,
      posAuthCode: payment.posAuthCode ?? null,
      note: payment.note ?? null,
      recordedBy: userId,
      ...(requestId ? { requestId } : {}),
    });
  }

  async posted(
    tx: Tx,
    stay: ConfirmedStay,
    userId: string | null,
    requestId?: string,
  ): Promise<void> {
    if (!this.folios || !stay.folioId) return;
    await this.folios.onReservationConfirmed(tx, stay, {
      userId,
      ...(requestId ? { requestId } : {}),
    });
  }

  async voided(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'code'>,
    reason: string,
    requestId?: string,
  ): Promise<void> {
    if (!this.folios) return;
    await this.folios.onReservationVoided(tx, {
      reservationId: row.id,
      reservationCode: row.code,
      reason,
      ...(requestId ? { requestId } : {}),
    });
  }
}
