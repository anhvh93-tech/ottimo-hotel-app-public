/**
 * Guest-request steps that do NOT need the housekeeping work port (BE-D Sprint 4): SM-15 history, the BR-506 fee
 * posting and the linked-work callbacks BE-C makes through GUEST_REQUEST_STATUS_PORT.
 * Kept apart from GuestRequestsService ON PURPOSE: GuestRequestsService depends on BE-C's GUEST_REQUEST_WORK_PORT
 * (HousekeepingService), and HousekeepingService depends on GUEST_REQUEST_STATUS_PORT – if the status port also
 * depended on GuestRequestsService the providers would form a cycle (Nest never finished booting – 17/10).
 * Dependencies here: EventsService, FolioService only.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { GuestRequestStatus } from '../../../db/schema/guest-requests';
import { ProblemError, problem } from '../../../shared/problem';
import { EventsService } from '../../events/public/events.service';
import { FolioService } from '../../folio/public/folio.service';
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

  async linkedDone(tx: Tx, id: string, now: Date): Promise<void> {
    const r = await this.row(tx, id, true);
    if (!OPEN.includes(r.status)) return;
    await tx.query(
      `UPDATE guest_request SET status = 'done', acknowledged_at = COALESCE(acknowledged_at, $2),
              closed_at = $2, updated_at = $2, version = version + 1 WHERE id = $1`,
      [id, now],
    );
    await this.history(tx, id, r.status, 'done', 'linked_work_done', now, 'system', null);
    await this.postFee(tx, r, null, undefined);
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(r.routed_to) });
  }

  async linkedCancelled(tx: Tx, id: string): Promise<void> {
    const r = await this.row(tx, id);
    // No state change: the desk answers the guest (EP14 4.4 "Việc liên quan đã hủy – trả lời khách").
    await this.events.publish(tx, 'guest_request.changed', id, { roles: sseRoles(r.routed_to) });
  }

  /**
   * BR-506 (DOM D-13 d): the fee the guest accepted goes to the folio ONCE, when the request is done – through
   * BE-B's FolioPort (money audit `folio.line_posted`). A folio already closed (after the post-checkout
   * window) refuses the posting: the request still closes and the desk charges by hand (logged, no data).
   */
  async postFee(
    tx: Tx,
    r: Pick<LifecycleRow, 'id' | 'reservation_id' | 'fee_vnd_snapshot' | 'fee_folio_line_id'>,
    userId: string | null,
    requestId: string | undefined,
  ): Promise<void> {
    const fee = r.fee_vnd_snapshot === null ? 0 : Number(r.fee_vnd_snapshot);
    if (fee <= 0 || r.fee_folio_line_id) return;
    const folio = await this.folios.folioOfReservation(tx, r.reservation_id);
    if (!folio) return;
    const { rows } = await tx.query<{ code: string }>(
      'SELECT code FROM reservation WHERE id = $1',
      [r.reservation_id],
    );
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
          ...(rows[0]?.code ? { reservationCode: rows[0].code } : {}),
          ...(requestId ? { requestId } : {}),
        },
        { allowPostCheckout: true },
      );
      await tx.query('UPDATE guest_request SET fee_folio_line_id = $2 WHERE id = $1', [
        r.id,
        lineId,
      ]);
    } catch (err) {
      if (err instanceof ProblemError && err.code === 'FOLIO_LOCKED') {
        this.logger.warn(`guest request ${r.id}: folio closed, fee not posted`);
        return;
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
