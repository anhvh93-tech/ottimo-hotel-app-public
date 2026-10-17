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

  /**
   * S4-08 + S4-06 (BE-B): services reversed / kept and the refund request a cancellation / no-show creates – the
   * SAME calculation for the dry run and the write (FolioService.closeStayPreview); validates `retainLines`.
   */
  async closeStayPreview(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'folio_id'>,
    input: {
      retainLines: ReadonlyArray<{ lineId: string; reason: string }>;
      feeVnd: number;
      feeCategory: 'cancellation_fee' | 'no_show_fee';
      today: string;
    },
  ) {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return this.folios.closeStayPreview(tx, row.folio_id, row.id, input);
  }

  /** S4-06 (BE-B, BR-522): ONE refund request for the overpayment left + "Cần chú ý" closed_reservation_credit. */
  async closeStayCredit(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'code' | 'folio_id'>,
    reasonCode: string,
    actor: { userId: string; roles: readonly string[] },
    requestId?: string,
    reasonNote?: string | null,
  ): Promise<{ id: string; amountVnd: number } | null> {
    if (!row.folio_id) throw new Error('booking without folio (folio_id NOT NULL)');
    return this.folios.closeStayCredit(tx, {
      folioId: row.folio_id,
      reservationId: row.id,
      reservationCode: row.code,
      reasonCode,
      ...(reasonNote ? { reasonNote } : {}),
      actor,
      ...(requestId ? { requestId } : {}),
    });
  }

  async resynced(tx: Tx, stay: ConfirmedStay, userId: string | null, requestId?: string) {
    await this.sync.resyncStay(tx, stay, { userId, ...(requestId ? { requestId } : {}) });
  }

  /** Lock order reservation → rooms → folio (the move plan is computed under this lock – ARC 10.4). */
  async lockFolio(tx: Tx, row: Pick<ReservationRow, 'folio_id'>): Promise<void> {
    if (row.folio_id) await this.folios.lock(tx, row.folio_id);
  }

  /**
   * S4-04 / S4-21 (M2): the FOC / special discounts the booking's nights WILL carry after a move – BE-B's
   * allocation (FolioService.previewStayReductions, the SAME function as the folio sync: BR-434 date map,
   * min(approved, new line), S4-23 order). `nights` = every live night of the booking after the move.
   */
  async previewReductions(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'folio_id'>,
    nights: ReadonlyArray<{ date: string; roomVnd: number; extraPersonVnd: number }>,
  ): Promise<{
    byDate: Map<string, { focVnd: number; pendingVnd: number }>;
    oldAppliedVnd: number;
    newAppliedVnd: number;
  }> {
    if (!row.folio_id) return { byDate: new Map(), oldAppliedVnd: 0, newAppliedVnd: 0 };
    const r = await this.folios.previewStayReductions(tx, row.folio_id, row.id, nights);
    const byDate = new Map<string, { focVnd: number; pendingVnd: number }>();
    for (const [d, v] of r.byDate) {
      byDate.set(d, {
        focVnd: v.roomFocVnd + v.extraFocVnd,
        pendingVnd: v.roomPendingVnd + v.extraPendingVnd,
      });
    }
    return { byDate, oldAppliedVnd: r.oldAppliedVnd, newAppliedVnd: r.newAppliedVnd };
  }

  /** Live `room_change_difference` lines of one booking (BR-424 / BR-429 (c) – S4-05, read only). */
  async differenceLines(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'folio_id'>,
  ): Promise<Array<{ id: string; serviceDate: string | null; amountVnd: number }>> {
    if (!row.folio_id) return [];
    const lines = await this.folios.lines(tx, row.folio_id);
    const reversed = new Set(lines.flatMap((l) => (l.reversal_of_id ? [l.reversal_of_id] : [])));
    return lines
      .filter(
        (l) =>
          l.category === 'room_change_difference' &&
          l.reservation_id === row.id &&
          l.line_state === 'posted' &&
          !l.reversal_of_id &&
          !reversed.has(l.id),
      )
      .map((l) => ({ id: l.id, serviceDate: l.service_date, amountVnd: l.amount_vnd }));
  }

  /**
   * S4-05 (BR-424 v0.3.5): a guest-requested move reverses the OTA differences from the first moved night and
   * posts the new ones (one line per night, room revenue BR-904) – never cumulative.
   */
  async repostDifferences(
    tx: Tx,
    row: Pick<ReservationRow, 'id' | 'code' | 'folio_id'>,
    reverse: readonly string[],
    post: ReadonlyArray<{ date: string; amountVnd: number; from: string; to: string }>,
    who: { userId: string; requestId?: string | undefined },
  ): Promise<void> {
    if (!row.folio_id) return;
    const actor = {
      userId: who.userId,
      reservationCode: row.code,
      ...(who.requestId ? { requestId: who.requestId } : {}),
    };
    for (const id of reverse) {
      await this.folios.reverseLine(
        tx,
        id,
        'room_change re-priced against the origin room (BR-424)',
        actor,
      );
    }
    if (post.length === 0) return;
    await this.folios.postLines(
      tx,
      row.folio_id,
      post.map((d) => ({
        reservationId: row.id,
        category: 'room_change_difference' as const,
        // DOM S3-15: room revenue (BR-904), not "other".
        revenueGroup: 'room' as const,
        chargeCode: 'room_change_difference',
        description: `room_change ${d.from}->${d.to}`,
        quantity: 1,
        unitPriceVnd: d.amountVnd,
        amountVnd: d.amountVnd,
        serviceDate: d.date,
        source: 'manual' as const,
        labelParams: { from: d.from, to: d.to },
      })),
      actor,
    );
  }
}
