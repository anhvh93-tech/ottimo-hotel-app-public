/**
 * R3-Q15 / US-110 AC4 (T13 – BE-D, R3 Sprint 1): when the guest's note of a request is emptied after
 * `retention.guest_request_months`, the work created from it must not keep a copy of the guest's words.
 * Housekeeping owns `hk_task` / `work_order`, so the guest-portal T13 job calls this function (same transaction)
 * instead of writing these tables itself:
 * - hk_task (`guest_request` task): `note` → NULL;
 * - work_order (`report_issue`): `description` → the fixed text the port uses without a note (the title keeps
 *   "Khách báo hỏng – căn {roomNo}" – type + room only).
 * `version` / `updated_at` move so the staff PWA replaces its offline copy at the next sync, and SSE
 * `hk_task.changed` / `work_order.changed` is published (ids only).
 */
import type { Tx } from '../../../db/database';
import type { EventsService } from '../../events/public/events.service';

/** Same text as WorkOrdersService.createFromGuestRequest uses when the guest wrote nothing. */
export const GUEST_WORK_ORDER_FIXED_DESCRIPTION = 'Khách báo hỏng qua app khách';

export async function purgeGuestRequestText(
  tx: Tx,
  events: EventsService | undefined,
  input: { guestRequestId: string; now: Date },
): Promise<{ tasks: number; workOrders: number }> {
  const tasks = await tx.query<{ id: string }>(
    `UPDATE hk_task SET note = NULL, updated_at = $2, version = version + 1
      WHERE guest_request_id = $1 AND note IS NOT NULL
      RETURNING id`,
    [input.guestRequestId, input.now],
  );
  const orders = await tx.query<{ id: string }>(
    `UPDATE work_order SET description = $3, updated_at = $2, version = version + 1
      WHERE guest_request_id = $1 AND description <> $3
      RETURNING id`,
    [input.guestRequestId, input.now, GUEST_WORK_ORDER_FIXED_DESCRIPTION],
  );
  for (const t of tasks.rows) await events?.publish(tx, 'hk_task.changed', t.id);
  for (const w of orders.rows) await events?.publish(tx, 'work_order.changed', w.id);
  return { tasks: tasks.rows.length, workOrders: orders.rows.length };
}
