/**
 * BR-812 extra-guest kit tasks (ESC-014, erd 4.8 hk_task, SM-14), kept in sync with the booking in the SAME
 * transaction as every booking change (B2, B4, B7, B7a, B12 create; B5/B10/B11, fewer guests, room change
 * before preparation cancel; already prepared → collect task on the old room). Never a background job.
 *
 * Desired state: booking `confirmed`, a room assigned and extraCount > 0 → exactly one open/in-progress
 * `extra_guest_kit_prepare` task for (booking, room) with quantity = extraCount, due = check-in time on the
 * arrival day (BR-812 (2), parameter checkin_time). `hold` bookings have no task.
 * Sprint 3: an `in_house` booking keeps its kit (people changed mid-stay → due = now + midstay minutes, BR-812 (2));
 * room changes of in-house guests (`transfer`) are handled by the front desk module (B14).
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { ReservationStatus } from '../../../db/schema';
import { type LocalDate, localDate } from '../../../shared/time';

export interface KitSyncInput {
  reservationId: string;
  roomId: string | null;
  status: ReservationStatus;
  extraCount: number;
  dueAt: Date;
  tz: string;
  now: Date;
  today: LocalDate;
  userId: string | null;
}

export interface KitSyncResult {
  created: number;
  updated: number;
  cancelled: number;
  collect: number;
}

interface TaskRow {
  id: string;
  room_id: string;
  type: string;
  status: string;
  quantity: number;
  due_at: Date | null;
}

export async function syncExtraGuestKit(tx: Tx, input: KitSyncInput): Promise<KitSyncResult> {
  const result: KitSyncResult = { created: 0, updated: 0, cancelled: 0, collect: 0 };
  const { rows } = await tx.query<TaskRow>(
    `SELECT id, room_id, type, status, quantity, due_at FROM hk_task
      WHERE reservation_id = $1 AND type = 'extra_guest_kit_prepare' AND status <> 'cancelled'
      ORDER BY created_at FOR UPDATE`,
    [input.reservationId],
  );
  const desired =
    (input.status === 'confirmed' || input.status === 'in_house') &&
    input.roomId !== null &&
    input.extraCount > 0
      ? { roomId: input.roomId, quantity: input.extraCount }
      : null;

  const touched: string[] = [];
  let keep: TaskRow | undefined;
  for (const t of rows) {
    const open = t.status === 'open' || t.status === 'in_progress';
    const matches = desired !== null && t.room_id === desired.roomId;
    if (open) {
      if (matches && !keep) {
        keep = t;
        continue;
      }
      await tx.query(
        `UPDATE hk_task SET status = 'cancelled', cancel_reason = $2, updated_at = $3, version = version + 1
          WHERE id = $1`,
        [t.id, 'booking_changed', input.now],
      );
      result.cancelled += 1;
      touched.push(t.id);
    } else if (t.status === 'done') {
      if (matches) {
        keep = keep ?? t;
        continue;
      }
      // Prepared already: recover it at the next cleaning of that room (BR-812 (4)) – ONE collect task per
      // prepared kit (DOM-BE-08): skip when a collect for this booking + room already exists.
      const exists = await tx.query(
        `SELECT 1 FROM hk_task WHERE reservation_id = $1 AND room_id = $2
            AND type = 'extra_guest_kit_collect' AND status <> 'cancelled' LIMIT 1`,
        [input.reservationId, t.room_id],
      );
      if (exists.rows.length > 0) continue;
      const id = await insertTask(
        tx,
        input,
        t.room_id,
        'extra_guest_kit_collect',
        t.quantity,
        null,
      );
      result.collect += 1;
      touched.push(id);
    }
  }

  if (desired) {
    if (keep && (keep.status === 'open' || keep.status === 'in_progress')) {
      if (keep.quantity !== desired.quantity || keep.due_at?.getTime() !== input.dueAt.getTime()) {
        await tx.query(
          `UPDATE hk_task SET quantity = $2, due_at = $3, due_date = $4, updated_at = $5, version = version + 1
            WHERE id = $1`,
          [keep.id, desired.quantity, input.dueAt, localDate(input.dueAt, input.tz), input.now],
        );
        result.updated += 1;
        touched.push(keep.id);
      }
    } else if (!keep || keep.quantity < desired.quantity) {
      const qty = keep ? desired.quantity - keep.quantity : desired.quantity;
      const id = await insertTask(
        tx,
        input,
        desired.roomId,
        'extra_guest_kit_prepare',
        qty,
        input.dueAt,
      );
      result.created += 1;
      touched.push(id);
    }
  }

  for (const id of touched) {
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'hk_task.changed', $4, $5)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({ taskId: id, reservationId: input.reservationId }),
        `hk_task.changed:${id}:${uuidv7()}`,
      ],
    );
  }
  return result;
}

async function insertTask(
  tx: Tx,
  input: KitSyncInput,
  roomId: string,
  type: 'extra_guest_kit_prepare' | 'extra_guest_kit_collect',
  quantity: number,
  dueAt: Date | null,
): Promise<string> {
  const id = uuidv7();
  await tx.query(
    `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, quantity, status,
       due_at, due_date, source, created_at, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, 'system', $10, $11, $10)`,
    [
      id,
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      roomId,
      input.reservationId,
      type,
      quantity,
      dueAt,
      dueAt ? localDate(dueAt, input.tz) : input.today,
      input.now,
      input.userId,
    ],
  );
  return id;
}
