/**
 * J10 `guest_request.sla` (architecture 9.1; BR-811; US-110 AC2 – BE-D Sprint 4): every tick, a guest request
 * still `new` after its reply deadline (`ack_due_at`) is reminded ONCE – staff notification
 * `guest_request_overdue` to the department it is routed to, the desk (FD/FDL – "front_desk nhận nhắc") and the
 * MANAGER as the escalation step (BR-811 v0.3.8 – DOM-S4-10; the owner is not notified),
 * SSE `guest_request.changed`. Exactly once by the row itself: `overdue_notified_at` is set in the same UPDATE
 * that selects the row (a repeated or overlapping tick finds nothing). The "Cần chú ý" line is computed at read
 * time (guestRequestOverdueSource). The auto reply out of hours happens at creation, never here.
 * Registered by the guest-portal module (api + test-support job endpoint) and by the worker.
 */
import type { Tx } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import type { EventsService } from '../../events/public/events.service';
import { overdueRecipients } from '../internal/guest-request-rules';

export const GUEST_REQUEST_SLA_JOB_KEY = 'guest_request.sla';

export function guestRequestSlaJob(events: EventsService): JobDefinition {
  return {
    key: GUEST_REQUEST_SLA_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx: Tx, ctx) {
      const { rows } = await tx.query<{
        id: string;
        routed_to: 'housekeeping' | 'maintenance' | 'front_desk';
        room_no: string | null;
      }>(
        `UPDATE guest_request g SET overdue_notified_at = $1
           FROM (SELECT id FROM guest_request
                  WHERE status = 'new' AND ack_due_at <= $1 AND overdue_notified_at IS NULL
                  ORDER BY ack_due_at FOR UPDATE SKIP LOCKED) due
          WHERE g.id = due.id
         RETURNING g.id, g.routed_to, (SELECT room_no FROM room WHERE id = g.room_id) AS room_no`,
        [ctx.now],
      );
      for (const r of rows) {
        const dept = r.routed_to === 'front_desk' ? [] : [r.routed_to];
        await events.notify(
          tx,
          {
            kind: 'guest_request_overdue',
            roles: overdueRecipients(r.routed_to),
            refType: 'guest_request',
            refId: r.id,
            ...(r.room_no ? { refCode: r.room_no } : {}),
          },
          ctx.now,
        );
        await events.publish(tx, 'guest_request.changed', r.id, { roles: dept });
      }
      return { reminded: rows.length };
    },
  };
}
