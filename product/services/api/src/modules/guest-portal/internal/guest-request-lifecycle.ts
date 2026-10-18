/**
 * Guest-request steps that do NOT need the housekeeping work port (BE-D Sprint 4): SM-15 history, the BR-506 fee
 * posting and the linked-work callbacks BE-C makes through GUEST_REQUEST_STATUS_PORT.
 * Kept apart from GuestRequestsService ON PURPOSE: GuestRequestsService depends on BE-C's GUEST_REQUEST_WORK_PORT
 * (HousekeepingService), and HousekeepingService depends on GUEST_REQUEST_STATUS_PORT – if the status port also
 * depended on GuestRequestsService the providers would form a cycle (Nest never finished booting – 17/10).
 * Dependencies here: EventsService, FolioService only.
 *
 * BR-506 fee – when (ARC FB-R2-ARC-BE-S4-07, stabilisation week 18/10):
 * - a request CARRIED BY A LINKED TASK / WORK ORDER: the fee goes to the folio only when that work is `done`
 *   (`linkedDone`) – also when the desk already closed the request ("complete" while the task was open). The desk's
 *   `complete` never posts it; a cancelled task never posts it.
 * - a request WITHOUT linked work (port not bound, no room yet at creation): the `complete` that closes it posts it.
 * Lock order (ARC 16.19 bổ sung 3): folio (L3) → hk_task (L4) → guest_request (L4b). `lockForFee` is the L3 step
 * housekeeping takes before the task; `lockFeeFolio` the same step for the desk's `complete`.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { GuestRequestStatus } from '../../../db/schema/guest-requests';
import { ProblemError, problem } from '../../../shared/problem';
import { EventsService } from '../../events/public/events.service';
import { FolioService } from '../../folio/public/folio.service';
import { readStayInfo } from '../../reservations/public/read-port';
import type { RoutedTo } from './guest-request-rules';

const OPEN: readonly GuestRequestStatus[] = ['new', 'acknowledged', 'in_progress'];

/** SSE audience added to the FD+ floor: the department the request is routed to. */
export function sseRoles(routed: RoutedTo): string[] {
  return routed === 'front_desk' ? [] : [routed];
}

interface LifecycleRow {
  id: string;
  reservation_id: string;
  status: GuestRequestStatus;
  routed_to: RoutedTo;
  fee_vnd_snapshot: number | string | null;
  fee_folio_line_id: string | null;
}

@Injectable()
export class GuestRequestLifecycle {
  private readonly logger = new Logger('GuestRequests');

  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(FolioService) private readonly folios: FolioService,
  ) {}

  private async row(tx: Tx, id: string, lock = false): Promise<LifecycleRow> {
    const { rows } = await tx.query<LifecycleRow>(
      `SELECT id, reservation_id, status, routed_to, fee_vnd_snapshot, fee_folio_line_id FROM guest_request
        WHERE id = $1${lock ? ' FOR UPDATE' : ''}`,
      [id],
    );
    const r = rows[0];
    if (!r) throw problem('NOT_FOUND');
    return r;
  }

  // ───────────────────────── linked work (BE-C → GuestRequestStatusPort) ─────────────────────────

  async linkedStarted(tx: Tx, id: string, now: Date): Promise<void> {
    const r = await this.row(tx, id, true);
    if (r.status !== 'new' && r.status !== 'acknowledged') return;
    await tx.query(
      `UPDATE guest_request SET status = 'in_progress', acknowledged_at = COALESCE(acknowledged_at, $2),
              updated_at = $2, version = version + 1 WHERE id = $1`,
      [id, now],
    );
    await this.history(tx, id, r.status, 'in_progress', 'linked_work_started', now, 'system', null);
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(r.routed_to) });
  }

  /**
   * Linked work done → request `done` and the accepted fee posted (S4-07: the work is what is charged – also when
   * the desk already closed the request; never for a declined one). Housekeeping holds the folio already
   * (`lockForFee`, 16.19 bổ sung 3), so the posting re-locks it without waiting. The request row is written ONCE
   * (status and fee line together): a second UPDATE of a row other sessions queue on is what deadlocked the
   * forced race of the old code (test guest-requests-s4-fix-bed).
   */
  async linkedDone(tx: Tx, id: string, now: Date): Promise<void> {
    const r = await this.row(tx, id, true);
    if (r.status === 'declined') return;
    const open = OPEN.includes(r.status);
    if (!open && !this.feeDue(r)) return; // already done and charged: nothing to announce
    const line = await this.postFeeLine(tx, r, null, undefined);
    if (open) {
      await tx.query(
        `UPDATE guest_request SET status = 'done', acknowledged_at = COALESCE(acknowledged_at, $2),
                closed_at = $2, fee_folio_line_id = COALESCE($3, fee_folio_line_id), updated_at = $2,
                version = version + 1 WHERE id = $1`,
        [id, now, line],
      );
      await this.history(tx, id, r.status, 'done', 'linked_work_done', now, 'system', null);
    } else if (line) {
      await tx.query('UPDATE guest_request SET fee_folio_line_id = $2 WHERE id = $1', [id, line]);
    } else {
      return; // folio closed (logged): nothing changed
    }
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(r.routed_to) });
  }

  async linkedCancelled(tx: Tx, id: string): Promise<void> {
    const r = await this.row(tx, id);
    // No state change: the desk answers the guest (EP14 4.4 "Việc liên quan đã hủy – trả lời khách").
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(r.routed_to) });
  }

  /** A fee accepted by the guest and not posted yet (both fields only ever go one way). */
  feeDue(r: Pick<LifecycleRow, 'fee_vnd_snapshot' | 'fee_folio_line_id'>): boolean {
    const fee = r.fee_vnd_snapshot === null ? 0 : Number(r.fee_vnd_snapshot);
    return fee > 0 && !r.fee_folio_line_id;
  }

  /**
   * 16.19 bổ sung 3 – L3 before L4: lock the folio the request's fee would go to. Read WITHOUT a lock (the request
   * is L4b, taken later): `fee_vnd_snapshot` never changes and `fee_folio_line_id` / `declined` only go one way,
   * so skipping the lock on "posted" / "declined" can never miss a posting.
   */
  async lockForFee(tx: Tx, guestRequestId: string): Promise<void> {
    const { rows } = await tx.query<LifecycleRow>(
      `SELECT id, reservation_id, status, routed_to, fee_vnd_snapshot, fee_folio_line_id FROM guest_request
        WHERE id = $1`,
      [guestRequestId],
    );
    const r = rows[0];
    if (!r || r.status === 'declined' || !this.feeDue(r)) return;
    await this.lockFeeFolio(tx, r.reservation_id);
  }

  /** `FolioService.lock` (FOR UPDATE, any status – `postLines` checks the status when it posts). */
  async lockFeeFolio(tx: Tx, reservationId: string): Promise<void> {
    const folio = await this.folios.folioOfReservation(tx, reservationId);
    if (folio) await this.folios.lock(tx, folio.id);
  }

  /**
   * BR-506 (DOM D-13 d): the fee the guest accepted goes to the folio ONCE – through BE-B's FolioPort (money
   * audit `folio.line_posted`); when: see the header. The caller holds the folio (L3) and the request (L4b), and
   * stores the returned line id in its own UPDATE of the request (`fee_folio_line_id`). A folio already closed
   * (after the post-checkout window) refuses the posting: null – the request still closes and the desk charges by
   * hand (logged, no data). Null too when nothing is due.
   */
  async postFeeLine(
    tx: Tx,
    r: Pick<LifecycleRow, 'id' | 'reservation_id' | 'fee_vnd_snapshot' | 'fee_folio_line_id'>,
    userId: string | null,
    requestId: string | undefined,
  ): Promise<string | null> {
    if (!this.feeDue(r)) return null;
    const fee = Number(r.fee_vnd_snapshot);
    const folio = await this.folios.folioOfReservation(tx, r.reservation_id);
    if (!folio) return null;
    // Booking code for the money audit through the reservations read port (ARC S4-09: no reservation SQL here).
    const code = (await readStayInfo(tx, r.reservation_id))?.code;
    try {
      const [lineId] = await this.folios.postLines(
        tx,
        folio.id,
        [
          {
            reservationId: r.reservation_id,
            category: 'cleaning',
            description: 'Dọn phòng lẻ theo yêu cầu khách (BR-506)',
            quantity: 1,
            unitPriceVnd: fee,
            amountVnd: fee,
            source: 'guest_app',
            chargeCode: 'adhoc_cleaning',
            labelParams: { qty: 1 },
          },
        ],
        {
          userId,
          ...(code ? { reservationCode: code } : {}),
          ...(requestId ? { requestId } : {}),
        },
        { allowPostCheckout: true },
      );
      return lineId ?? null;
    } catch (err) {
      if (err instanceof ProblemError && err.code === 'FOLIO_LOCKED') {
        this.logger.warn(`guest request ${r.id}: folio closed, fee not posted`);
        return null;
      }
      throw err;
    }
  }

  async history(
    tx: Tx,
    id: string,
    from: string | null,
    to: string,
    event: string,
    now: Date,
    actorType: 'user' | 'guest' | 'system',
    userId: string | null,
  ): Promise<void> {
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, occurred_at)
       VALUES ($1, $2, 'SM-15', $3, $4, $5, $6, $7, $8, $9)`,
      [tx.ctx.organizationId, tx.ctx.propertyId, id, from, to, event, actorType, userId, now],
    );
  }
}
