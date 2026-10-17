/**
 * RoomBlockPort (OpenAPI 0.3.7 nhóm H, US-061/062 – written by BE-C for the maintenance module, reviewed by
 * BE-A): the OOO blocks of a work order go through the reservations aggregate (the only inventory writer –
 * ADR-009), in the caller's transaction:
 * - O1 `createWorkOrder.block` → RoomBlocksService.create (same checks and 409s as createRoomBlock: in-house
 *   guest → ROOM_OCCUPIED, bookings → ROOM_UNAVAILABLE / other blocks → ROOM_BLOCKED, with `conflicts[]`);
 * - O4/O5 when the work order is done / cancelled → its live block is released (active) or cancelled (planned)
 *   by the role that closed the work order (no MGR+ rule – that is A87, a release WITHOUT a work order).
 * Returns the RoomBlock DTO of the contract.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { Actor } from '../internal/reservation-store';
import { ReservationsService } from '../internal/reservations.service';
import { RoomBlocksService, toRoomBlockDto } from '../internal/room-blocks.service';

export interface WorkOrderBlockInput {
  roomId: string;
  startDate: string;
  endDatePlanned?: string | undefined;
  expectedDoneDate?: string | undefined;
  reason: string;
  workOrderId: string;
  affectedReservationsAcknowledged?: boolean | undefined;
}

@Injectable()
export class RoomBlockPort {
  constructor(
    @Inject(RoomBlocksService) private readonly blocks: RoomBlocksService,
    @Inject(ReservationsService) private readonly reservations: ReservationsService,
  ) {}

  async createForWorkOrder(
    tx: Tx,
    actor: Actor,
    requestId: string | undefined,
    input: WorkOrderBlockInput,
  ): Promise<Record<string, unknown>> {
    const ctx = await this.reservations.context(tx, actor, requestId);
    const body: Record<string, unknown> = {
      roomId: input.roomId,
      startDate: input.startDate,
      reason: input.reason,
      workOrderId: input.workOrderId,
      ...(input.endDatePlanned !== undefined ? { endDatePlanned: input.endDatePlanned } : {}),
      ...(input.expectedDoneDate !== undefined ? { expectedDoneDate: input.expectedDoneDate } : {}),
      ...(input.affectedReservationsAcknowledged !== undefined
        ? { affectedReservationsAcknowledged: input.affectedReservationsAcknowledged }
        : {}),
    };
    return toRoomBlockDto(await this.blocks.create(tx, ctx, body));
  }

  /** The newest planned/active block of the work order, else its newest block (null = none). */
  async ofWorkOrder(tx: Tx, workOrderId: string): Promise<Record<string, unknown> | null> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM room_block WHERE work_order_id = $1
        ORDER BY (status IN ('planned', 'active')) DESC, start_date DESC, created_at DESC LIMIT 1`,
      [workOrderId],
    );
    return rows[0] ? toRoomBlockDto(await this.blocks.get(tx, rows[0].id)) : null;
  }

  /** Live block ids per work order (DTO `blockRequested` ends when one exists – B-09). */
  async liveBlockWorkOrders(tx: Tx, workOrderIds: readonly string[]): Promise<Set<string>> {
    if (workOrderIds.length === 0) return new Set();
    const { rows } = await tx.query<{ work_order_id: string }>(
      `SELECT DISTINCT work_order_id FROM room_block
        WHERE work_order_id = ANY($1::uuid[]) AND status IN ('planned', 'active')`,
      [[...workOrderIds]],
    );
    return new Set(rows.map((r) => r.work_order_id));
  }

  /**
   * O4 / O5 for a work order that is done or cancelled: active → released (reopen = the business date, BR-804
   * v0.3.2 "mở khóa trước hạn"), planned → cancelled. Returns the room id and what happened (null = no block).
   */
  async closeForWorkOrder(
    tx: Tx,
    actor: Actor,
    requestId: string | undefined,
    workOrderId: string,
    reason: string,
  ): Promise<{
    roomId: string;
    action: 'released' | 'cancelled';
    block: Record<string, unknown>;
  } | null> {
    const { rows } = await tx.query<{ id: string; status: string }>(
      `SELECT id, status FROM room_block WHERE work_order_id = $1 AND status IN ('planned', 'active')
        ORDER BY start_date DESC LIMIT 1 FOR UPDATE`,
      [workOrderId],
    );
    const b = rows[0];
    if (!b) return null;
    const ctx = await this.reservations.context(tx, actor, requestId);
    const action = b.status === 'active' ? 'release' : 'cancel';
    const row = await this.blocks.transition(
      tx,
      ctx,
      b.id,
      action,
      { reason },
      { viaWorkOrder: true },
    );
    return {
      roomId: row.room_id,
      action: action === 'release' ? 'released' : 'cancelled',
      block: toRoomBlockDto(row),
    };
  }
}
