/**
 * OOO room blocks (SM-02, BR-804, US-019, US-061 – EP02 spec 12). Half-open [start, reopen) like stays; each
 * block has exactly ONE room_occupancy row (kind `ooo`, K9) so the rack, the double-booking constraint and the
 * channel availability all read the same inventory.
 *
 * O1 create (planned when it starts later, active from today) – refused with 409 + conflicts when the range
 *    overlaps a booking (in-house guests must change room first – BR-804; hold/confirmed must be moved first:
 *    the EXCLUDE constraint makes "save anyway" impossible, the MGR acknowledgement only documents the plan).
 * O2 planned → active by the daily job (jobs/room-block-activation) when start_date ≤ today.
 * O3 change the reopen date (If-Match). O4 release (without a work order: MGR+), O5 cancel a planned block.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { OccupancyService } from '../public/occupancy.service';
import { FD_PLUS, MGR_PLUS, hasAny } from './allowed-actions';
import type { BookingContext } from './booking-context';
import { Fields } from './inputs';
import { outboxAvailability, recordMachineTransition } from './reservation-store';

export interface RoomBlockRow {
  id: string;
  room_id: string;
  room_no: string;
  status: 'planned' | 'active' | 'released' | 'cancelled';
  start_date: LocalDate;
  end_date_planned: LocalDate;
  end_date_actual: LocalDate | null;
  reason: string;
  work_order_id: string | null;
  /** 0.3.7 (B-10): the block was made from an expected end-of-repair date (BR-804). */
  expected_done_date: LocalDate | null;
  version: number;
}

const COLUMNS = `b.id, b.room_id, rm.room_no, b.status, b.start_date::text AS start_date,
  b.end_date_planned::text AS end_date_planned, b.end_date_actual::text AS end_date_actual, b.reason,
  b.work_order_id, b.expected_done_date::text AS expected_done_date, b.version`;

export function toRoomBlockDto(b: RoomBlockRow): Record<string, unknown> {
  return {
    id: b.id,
    roomId: b.room_id,
    roomNo: b.room_no,
    status: b.status,
    startDate: b.start_date,
    endDatePlanned: b.end_date_planned,
    endDateActual: b.end_date_actual,
    reason: b.reason,
    ...(b.work_order_id ? { workOrderId: b.work_order_id } : {}),
    ...(b.expected_done_date ? { expectedDoneDate: b.expected_done_date } : {}),
    version: b.version,
  };
}

@Injectable()
export class RoomBlocksService {
  constructor(
    @Inject(OccupancyService) private readonly occupancy: OccupancyService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Optional() @Inject(ParameterService) private readonly params?: ParameterService,
  ) {}

  async list(tx: Tx, q: { from?: string | undefined; to?: string | undefined }) {
    const f = new Fields(q as Record<string, unknown>);
    const from = f.date('from', false);
    const to = f.date('to', false);
    f.done();
    const { rows } = await tx.query<RoomBlockRow>(
      `SELECT ${COLUMNS} FROM room_block b JOIN room rm ON rm.id = b.room_id
        WHERE ($1::date IS NULL OR COALESCE(b.end_date_actual, b.end_date_planned) > $1::date)
          AND ($2::date IS NULL OR b.start_date <= $2::date)
        ORDER BY b.start_date, rm.room_no`,
      [from ?? null, to ?? null],
    );
    return rows.map(toRoomBlockDto);
  }

  /** One block (0.3.7: read by the maintenance module through RoomBlockPort). */
  get(tx: Tx, id: string): Promise<RoomBlockRow> {
    return this.load(tx, id);
  }

  private async load(tx: Tx, id: string, forUpdate = false): Promise<RoomBlockRow> {
    const { rows } = await tx.query<RoomBlockRow>(
      `SELECT ${COLUMNS} FROM room_block b JOIN room rm ON rm.id = b.room_id WHERE b.id = $1
        ${forUpdate ? 'FOR UPDATE OF b' : ''}`,
      [id],
    );
    const row = rows[0];
    if (!row) throw problem('NOT_FOUND');
    return row;
  }

  async create(
    tx: Tx,
    ctx: BookingContext,
    body: Record<string, unknown>,
    opts: { reopenBufferDays?: number } = {},
  ): Promise<RoomBlockRow> {
    const f = new Fields(body);
    const roomId = f.uuid('roomId', true);
    const start = f.date('startDate', true);
    // 0.3.7 (B-10, BE-C): exactly one of endDatePlanned | expectedDoneDate; from the expected end of the
    // repair the server adds ooo_reopen_buffer_days (BR-804 – FD/MT cannot read the parameter table).
    const both = f.present('endDatePlanned') && f.present('expectedDoneDate');
    if (both) f.add('expectedDoneDate', 'NOT_ALLOWED');
    const expectedDone = both ? undefined : f.date('expectedDoneDate', false);
    let end = both || f.present('expectedDoneDate') ? undefined : f.date('endDatePlanned', true);
    const reason = f.text('reason', 500, { required: true, min: 3 });
    const workOrderId = f.uuid('workOrderId', false);
    f.bool('affectedReservationsAcknowledged');
    f.done();
    if ((start as string) < ctx.today) f.add('startDate', 'DATE_IN_PAST');
    if (expectedDone) {
      if (expectedDone < (start as string)) f.add('expectedDoneDate', 'DATE_ORDER');
      const buffer =
        opts.reopenBufferDays ??
        (this.params
          ? await this.params.get<number>(tx, 'ooo_reopen_buffer_days', ctx.today)
          : undefined);
      if (buffer === undefined) throw new Error('ooo_reopen_buffer_days unavailable');
      end = addDays(expectedDone, buffer);
      // With a buffer of 0 an expected end on the start day would make an empty block (review BE-A 17/10).
      if (expectedDone >= (start as string) && end <= (start as string)) {
        f.add('expectedDoneDate', 'DATE_ORDER');
      }
    } else if ((end as string) <= (start as string)) f.add('endDatePlanned', 'DATE_ORDER');
    const room = await tx.query<{ id: string }>('SELECT id FROM room WHERE id = $1', [roomId]);
    if (!room.rows[0]) f.add('roomId', 'NOT_IN_LIST');
    f.done();
    const from = start as LocalDate;
    const to = end as LocalDate;
    const withNames = hasAny(ctx.actor.roles, FD_PLUS);
    await this.occupancy.lockRooms(tx, [roomId as string]);
    // BR-804: overlapping bookings must be moved first – list them (in-house guests change room, B14).
    await this.assertFree(tx, roomId as string, from, to, withNames);
    const id = uuidv7();
    const status = from <= ctx.today ? 'active' : 'planned';
    await tx.query(
      `INSERT INTO room_block (id, organization_id, property_id, room_id, status, reason, start_date, end_date_planned,
         work_order_id, affected_reservation_ack_by, created_at, created_by, updated_at, expected_done_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $11, $13)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        roomId,
        status,
        reason,
        from,
        to,
        workOrderId ?? null,
        body.affectedReservationsAcknowledged === true && hasAny(ctx.actor.roles, MGR_PLUS)
          ? ctx.actor.userId
          : null,
        ctx.now,
        ctx.actor.userId,
        expectedDone ?? null,
      ],
    );
    await this.occupancy.claim(
      tx,
      { roomId: roomId as string, from, to, kind: 'ooo', roomBlockId: id, now: ctx.now },
      { withNames, persons: 1 },
    );
    await recordMachineTransition(tx, 'SM-02', id, null, status, 'O1', ctx.now, reason ?? null);
    await this.audit.record(tx, {
      category: 'state',
      action: 'room_block.created',
      entityType: 'room_block',
      entityId: id,
      after: { status, startDate: from, endDatePlanned: to },
      ...(reason ? { reason } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await outboxAvailability(tx, [{ roomId: roomId as string, from, to }], 'room_block.created');
    return this.load(tx, id);
  }

  async update(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<RoomBlockRow> {
    const f = new Fields(body);
    const end = f.date('endDatePlanned', true);
    f.done();
    const b = await this.load(tx, id, true);
    if (b.version !== expectedVersion) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: b.version } });
    }
    if (b.status !== 'planned' && b.status !== 'active') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: b.status } });
    }
    if ((end as string) <= b.start_date) f.add('endDatePlanned', 'DATE_ORDER');
    else if (b.status === 'active' && (end as string) <= ctx.today)
      f.add('endDatePlanned', 'DATE_IN_PAST');
    f.done();
    await this.occupancy.lockRooms(tx, [b.room_id]);
    if ((end as string) > b.end_date_planned) {
      await this.assertFree(
        tx,
        b.room_id,
        b.end_date_planned,
        end as LocalDate,
        hasAny(ctx.actor.roles, FD_PLUS),
      );
    }
    await this.occupancy.update(
      tx,
      { roomBlockId: b.id },
      { roomId: b.room_id, from: b.start_date, to: end as LocalDate, kind: 'ooo' },
      ctx.now,
      { withNames: hasAny(ctx.actor.roles, FD_PLUS), persons: 1 },
    );
    await tx.query(
      `UPDATE room_block SET end_date_planned = $2, updated_at = $3, version = version + 1 WHERE id = $1`,
      [b.id, end, ctx.now],
    );
    await recordMachineTransition(tx, 'SM-02', b.id, b.status, b.status, 'O3', ctx.now, null);
    await this.audit.record(tx, {
      category: 'state',
      action: 'room_block.range_changed',
      entityType: 'room_block',
      entityId: b.id,
      before: { endDatePlanned: b.end_date_planned },
      after: { endDatePlanned: end },
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await outboxAvailability(
      tx,
      [
        {
          roomId: b.room_id,
          from: b.start_date,
          to: (end as string) > b.end_date_planned ? (end as string) : b.end_date_planned,
        },
      ],
      'room_block.updated',
    );
    return this.load(tx, b.id);
  }

  async transition(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    action: string,
    body: Record<string, unknown>,
    opts: { viaWorkOrder?: boolean } = {},
  ): Promise<RoomBlockRow> {
    if (action !== 'release' && action !== 'cancel') throw problem('NOT_FOUND');
    const f = new Fields(body);
    const reason = f.text('reason', 500, { required: true, min: 3 });
    f.done();
    const b = await this.load(tx, id, true);
    await this.occupancy.lockRooms(tx, [b.room_id]);
    if (action === 'cancel') {
      if (b.status !== 'planned')
        throw problem('INVALID_TRANSITION', { extras: { currentState: b.status } });
      await this.occupancy.release(tx, { roomBlockId: b.id }, ctx.now);
      await tx.query(
        `UPDATE room_block SET status = 'cancelled', release_reason = $2, released_at = $3, released_by = $4,
                updated_at = $3, version = version + 1 WHERE id = $1`,
        [b.id, reason, ctx.now, ctx.actor.userId],
      );
      await recordMachineTransition(
        tx,
        'SM-02',
        b.id,
        'planned',
        'cancelled',
        'O5',
        ctx.now,
        reason ?? null,
      );
    } else {
      if (b.status !== 'active')
        throw problem('INVALID_TRANSITION', { extras: { currentState: b.status } });
      // O4 without a finished work order: MGR+ only (A87), reason required. With its work order done / cancelled
      // (maintenance module, BE-C – US-062 AC1) the role that closed the work order releases it.
      if (!opts.viaWorkOrder && !hasAny(ctx.actor.roles, MGR_PLUS))
        throw problem('FORBIDDEN_ACTION');
      const endActual = ctx.today > b.start_date ? ctx.today : b.start_date;
      if (endActual > b.start_date) {
        await this.occupancy.update(
          tx,
          { roomBlockId: b.id },
          { roomId: b.room_id, from: b.start_date, to: endActual, kind: 'ooo' },
          ctx.now,
          { withNames: true, persons: 1 },
        );
      } else {
        await this.occupancy.release(tx, { roomBlockId: b.id }, ctx.now);
      }
      await tx.query(
        `UPDATE room_block SET status = 'released', end_date_actual = $2, release_reason = $3, released_at = $4,
                released_by = $5, updated_at = $4, version = version + 1 WHERE id = $1`,
        [b.id, endActual, reason, ctx.now, ctx.actor.userId],
      );
      await recordMachineTransition(
        tx,
        'SM-02',
        b.id,
        'active',
        'released',
        'O4',
        ctx.now,
        reason ?? null,
      );
    }
    await this.audit.record(tx, {
      category: 'state',
      action: action === 'cancel' ? 'room_block.cancelled' : 'room_block.released',
      entityType: 'room_block',
      entityId: b.id,
      before: { status: b.status },
      after: { status: action === 'cancel' ? 'cancelled' : 'released' },
      ...(reason ? { reason } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await outboxAvailability(
      tx,
      [{ roomId: b.room_id, from: b.start_date, to: b.end_date_planned }],
      `room_block.${action}`,
    );
    return this.load(tx, b.id);
  }

  /**
   * A block may not cover any booking (BR-804). 0.3.5 A-03: an in-house guest in the range → 409 ROOM_OCCUPIED
   * (change the guest's room first, BR-424); other bookings → ROOM_UNAVAILABLE / ROOM_BLOCKED, with conflicts.
   */
  private async assertFree(
    tx: Tx,
    roomId: string,
    from: LocalDate,
    to: LocalDate,
    withNames: boolean,
  ): Promise<void> {
    const conflicts = await this.occupancy.conflicts(tx, roomId, from, to);
    if (conflicts.length === 0) return;
    const err = await this.occupancy.unavailable(
      tx,
      { roomId, from, to, persons: 1 },
      { withNames },
    );
    if (conflicts.some((c) => c.status === 'in_house')) {
      throw problem('ROOM_OCCUPIED', {
        ...(err.options.extras ? { extras: err.options.extras } : {}),
      });
    }
    throw err;
  }

  /** O2 (SYS): planned blocks whose start date has come become active. */
  async activateDue(tx: Tx, today: LocalDate, now: Date): Promise<number> {
    const { rows } = await tx.query<{ id: string }>(
      `UPDATE room_block SET status = 'active', updated_at = $2, version = version + 1
        WHERE status = 'planned' AND start_date <= $1 RETURNING id`,
      [today, now],
    );
    for (const r of rows) {
      await recordMachineTransition(tx, 'SM-02', r.id, 'planned', 'active', 'O2', now, null);
    }
    return rows.length;
  }
}
