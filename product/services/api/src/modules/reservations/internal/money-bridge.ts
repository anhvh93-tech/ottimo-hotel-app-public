/**
 * Money side of the booking transitions, owned by the folio / payments modules (BE-B), called in the SAME
 * transaction (coding-standards 6). FolioService and PaymentService are REQUIRED (FB-R2-ARC-BE-S2-04): a
 * booking is never created/confirmed without its folio and its money lines – a wiring mistake fails loudly.
 *
 * - openFolio()            B1/B2: one folio per booking; the caller pre-generates its id (both FKs DEFERRED).
 * - posted()               B2/B12: room + extra-person lines, commission, channel fee (onReservationConfirmed).
 *                          B4 is posted by payments itself after confirmFromHold() (sales-port).
 * - voided()               B5/B6/B10/B11/relocation: commissions → void + folio reversal (FOLIO_STAY_SYNC.voidStay).
 * - resynced()             B7/B8/PATCH guests/B12: folio follows the sold nights (FOLIO_STAY_SYNC.resyncStay).
 * - depositPaid()          Σ succeeded deposits of the booking's folio (BR-309 refund basis, J1 "đã có cọc").
 * - recordInitialPayment() B2 `initialPayment` through PaymentService.recordManual (one path – ARC-BE-S2-10).
 *
 * FOLIO_STAY_SYNC (public/folio-sync-port.ts) is implemented and provided by the folio module (BE-B,
 * DOM-BE-01/02) – required like the two services.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { PaymentMethod } from '../../../db/schema/folio';
import { FolioService } from '../../folio/public/folio.service';
import { PaymentService } from '../../payments/public/payment.service';
import { FOLIO_STAY_SYNC, type FolioStaySync, type VoidStayInput } from '../public/folio-sync-port';
import type { InitialPayment } from '../public/reservation-hooks';
import type { ConfirmedStay } from '../public/sales-port';
import type { ReservationRow } from './reservation-store';

@Injectable()
export class MoneyBridge {
  constructor(
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(FOLIO_STAY_SYNC) private readonly sync: FolioStaySync,
  ) {}

  async openFolio(
    tx: Tx,
    reservationId: string,
    folioId: string,
    createdBy: string | null,
  ): Promise<string> {
    return this.folios.openForReservation(tx, { reservationId, folioId, createdBy });
  }

  async depositPaid(tx: Tx, row: Pick<ReservationRow, 'folio_id'>): Promise<number> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return this.folios.depositPaid(tx, row.folio_id);
  }

  /**
   * Refund requests still open on the folio (pending / escalated / approved not fully paid – BE-B
   * FolioService.openRefundVnd): a cancellation (B10/B5) never requests again what is already requested
   * (verification 17/10, DOM BE-14).
   */
  async openRefunds(tx: Tx, row: Pick<ReservationRow, 'folio_id'>): Promise<number> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return this.folios.openRefundVnd(tx, row.folio_id);
  }

  /**
   * "Giá trị đơn" (DOM 17/10, REFUND #3): live room + extra-person lines after FOC/discounts, minus what the
   * OTA collected – the cap of a cancellation / no-show fee (BE-B FolioService.bookingValueVnd).
   */
  async bookingValue(tx: Tx, row: Pick<ReservationRow, 'folio_id' | 'id'>): Promise<number> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return this.folios.bookingValueVnd(tx, row.folio_id, row.id);
  }

  /** 0.3.6 `Reservation.balanceDueVnd` (BUG-R2-031): what the folio still owes. */
  async balanceDue(tx: Tx, row: Pick<ReservationRow, 'folio_id'>): Promise<number> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return (await this.folios.balance(tx, row.folio_id)).balanceDueVnd;
  }

  /** A-34 / G-14: money the guest paid above what the folio now charges (refund basis – BE-12). */
  async credit(tx: Tx, row: Pick<ReservationRow, 'folio_id'>): Promise<number> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return (await this.folios.balance(tx, row.folio_id)).creditVnd;
  }

  async recordInitialPayment(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'code' | 'folio_id'>,
    payment: InitialPayment,
    userId: string,
    now: Date,
    requestId?: string,
  ): Promise<void> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
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

  async posted(tx: Tx, stay: ConfirmedStay, userId: string | null, requestId?: string) {
    await this.folios.onReservationConfirmed(tx, stay, {
      userId,
      ...(requestId ? { requestId } : {}),
    });
  }

  async voided(
    tx: Tx,
    input: Omit<VoidStayInput, 'folioId'> & { folioId: string | null },
    userId: string | null,
  ): Promise<void> {
    await this.folios.onReservationVoided(tx, {
      reservationId: input.reservationId,
      reservationCode: input.reservationCode,
      reason: input.reason,
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    if (!input.folioId) throw new Error('booking without folio (folio_id NOT NULL)');
    await this.sync.voidStay(tx, { ...input, folioId: input.folioId }, { userId });
  }

  async resynced(tx: Tx, stay: ConfirmedStay, userId: string | null, requestId?: string) {
    await this.sync.resyncStay(tx, stay, { userId, ...(requestId ? { requestId } : {}) });
  }
}
