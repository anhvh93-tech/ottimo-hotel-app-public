/**
 * GUEST_REQUEST_WORK_PORT (public/guest-request-work.port.ts) – EP14 guest requests (BE-D) become housekeeping
 * tasks / work orders here, in BE-D's transaction (createGuestRequest / transitionGuestRequest).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { PropertyContextService } from '../../platform/public/property-context';
import type { GuestRequestWorkPort } from '../public/guest-request-work.port';
import { type HkCtx, HousekeepingService } from './housekeeping.service';
import { WorkOrdersService } from './work-orders.service';

@Injectable()
export class GuestRequestWorkAdapter implements GuestRequestWorkPort {
  constructor(
    @Inject(HousekeepingService) private readonly hk: HousekeepingService,
    @Inject(WorkOrdersService) private readonly wo: WorkOrdersService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
  ) {}

  private async ctx(tx: Tx, now: Date): Promise<HkCtx> {
    const p = await this.property.now(tx);
    const userId = tx.ctx.actorType === 'user' && tx.ctx.userId ? tx.ctx.userId : '';
    return { actor: { userId, roles: [] }, now, today: p.today, tz: p.timezone, iso: p.iso };
  }

  async createTask(
    tx: Tx,
    i: {
      guestRequestId: string;
      reservationId: string;
      roomId: string;
      note: string | null;
      dueDate: string;
      now: Date;
    },
  ): Promise<{ hkTaskId: string }> {
    const c = await this.ctx(tx, i.now);
    const t = await this.hk.insertTask(tx, c, {
      roomId: i.roomId,
      reservationId: i.reservationId,
      type: 'guest_request',
      dueDate: i.dueDate,
      source: 'guest_app',
      note: i.note,
      guestRequestId: i.guestRequestId,
    });
    return { hkTaskId: t.id };
  }

  async createWorkOrder(
    tx: Tx,
    i: {
      guestRequestId: string;
      reservationId: string;
      roomId: string;
      description: string | null;
      now: Date;
    },
  ): Promise<{ workOrderId: string; code: string }> {
    const c = await this.ctx(tx, i.now);
    return this.wo.createFromGuestRequest(tx, c, {
      guestRequestId: i.guestRequestId,
      roomId: i.roomId,
      description: i.description,
    });
  }

  async cancelTask(tx: Tx, hkTaskId: string, now: Date): Promise<void> {
    const c = await this.ctx(tx, now);
    const { rows } = await tx.query<{ status: string }>(
      'SELECT status FROM hk_task WHERE id = $1 FOR UPDATE',
      [hkTaskId],
    );
    if (!rows[0]) throw problem('NOT_FOUND');
    if (rows[0].status !== 'open') return; // already being done (or closed): HK keeps it
    await this.hk.cancelBySystem(tx, c, hkTaskId, 'other', 'Yêu cầu khách bị từ chối');
  }
}
