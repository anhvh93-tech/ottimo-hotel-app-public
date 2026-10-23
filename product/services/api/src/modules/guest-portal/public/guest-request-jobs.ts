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
import type { AuditService } from '../../audit/public/audit.service';
import { defineAuditEntity } from '../../audit/public/audit-fields';
import type { EventsService } from '../../events/public/events.service';
import { purgeGuestRequestText } from '../../housekeeping/public/guest-request-text-purge';
import type { ParameterService } from '../../platform/public/parameter.service';
import { SYSTEM_ACTOR, stayViews } from '../../reservations/public/stay-view';
import { overdueRecipients } from '../internal/guest-request-rules';

export const GUEST_REQUEST_SLA_JOB_KEY = 'guest_request.sla';
export const GUEST_REQUEST_PURGE_JOB_KEY = 'guest_request.purge';

// Audit of a retention run: the policy and counts only (SEC B.7 – never the purged text).
defineAuditEntity('retention_run', ['policyKey', 'count', 'linkedWork', 'arrivalNotes']);

/** Rows per tick (technical batch – the next tick takes the rest). */
const T13_BATCH = 500;

/**
 * T13 `guest_request.purge` (R3-Q15 – US-109 AC3, US-110 AC4; DRA T13 12 months; SEC B.7 – BE-D, R3 Sprint 1).
 * Every tick: a request CLOSED (`done` / `declined` – `closed_at`) more than `retention.guest_request_months` ago
 * that still carries free text loses it in one UPDATE that selects the row:
 * - `note` (the guest's words, C2 – D23) and `reply_note` (the desk's reply, same retention – EP14 3.2) → NULL,
 *   `note_purged_at` = now (the guest page / Desk show "Ghi chú đã xóa theo hạn lưu"); type, status, times and the
 *   fee already posted stay for the reports;
 * - the linked hk_task note / work order description lose the copy (housekeeping's public function – US-110 AC4);
 * - one `purge_journal` row per request (ids only – re-applied after a backup restore, SR-BAK-06);
 * - one `audit_event` per run with the COUNT only (never the text).
 * Open requests are never touched (no `closed_at`). A second run finds nothing (the row condition needs text), so
 * overlapping / repeated ticks are harmless. The month arithmetic is PostgreSQL's (`make_interval(months => n)`).
 */
/** now − `months` calendar months (UTC month arithmetic – same day of month, clamped like PostgreSQL). */
function cutoffOf(now: Date, months: number): Date {
  const d = new Date(now.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/**
 * Bookings whose stay has ENDED at or before `limit` (read through BE-A's stay view, SYSTEM actor – guest-portal
 * never reads the booking tables): checked out → `actualCheckoutAt`; cancelled → `cancelledAt`; no-show →
 * `noShowMarkedAt`. A stay still running through an open child booking (B9a / extension) is not ended.
 */
async function endedStays(tx: Tx, reservationIds: string[], limit: Date): Promise<Set<string>> {
  const out = new Set<string>();
  if (reservationIds.length === 0) return out;
  const views = await stayViews(tx, [...new Set(reservationIds)], SYSTEM_ACTOR);
  for (const [id, v] of views) {
    const end =
      v.status === 'checked_out'
        ? v.actualCheckoutAt
        : v.status === 'cancelled'
          ? v.cancelledAt
          : v.status === 'no_show'
            ? v.noShowMarkedAt
            : null;
    if (!end || v.effectiveDepartureDate > v.departureDate) continue;
    if (end.getTime() <= limit.getTime()) out.add(id);
  }
  return out;
}

export function guestRequestPurgeJob(deps: {
  events: EventsService;
  params: ParameterService;
  audit: AuditService;
}): JobDefinition {
  return {
    key: GUEST_REQUEST_PURGE_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx: Tx, ctx) {
      const months = Number(
        await deps.params.get<number>(tx, 'retention.guest_request_months', ctx.date),
      );
      if (!Number.isInteger(months) || months < 1) return { purged: 0 };
      const cutoff = `$1::timestamptz - make_interval(months => $2::int)`;
      // (1) Closed requests: deadline from `closed_at`.
      const { rows: closed } = await tx.query<{ id: string }>(
        `SELECT id FROM guest_request
          WHERE closed_at IS NOT NULL AND (note IS NOT NULL OR reply_note IS NOT NULL)
            AND closed_at <= ${cutoff}
          ORDER BY closed_at LIMIT $3 FOR UPDATE SKIP LOCKED`,
        [ctx.now, months, T13_BATCH],
      );
      // (2) FB-R3-SEC-BED-02 (SEC mốc T13 = COALESCE(closed_at, end of the stay)): requests never closed whose
      //     stay ended ≥ N months ago. Created during the stay, so `created_at` ≤ end ≤ cutoff pre-filters.
      const { rows: open } = await tx.query<{ id: string; reservation_id: string }>(
        `SELECT id, reservation_id FROM guest_request
          WHERE closed_at IS NULL AND (note IS NOT NULL OR reply_note IS NOT NULL)
            AND created_at <= ${cutoff}
          ORDER BY created_at LIMIT $3 FOR UPDATE SKIP LOCKED`,
        [ctx.now, months, T13_BATCH],
      );
      const limit = cutoffOf(ctx.now, months);
      const ended = await endedStays(
        tx,
        open.map((r) => r.reservation_id),
        limit,
      );
      const ids = [
        ...closed.map((r) => r.id),
        ...open.filter((r) => ended.has(r.reservation_id)).map((r) => r.id),
      ];
      const { rows } = await tx.query<{ id: string }>(
        `UPDATE guest_request SET note = NULL, reply_note = NULL, note_purged_at = $1, updated_at = $1,
                version = version + 1
          WHERE id = ANY($2::uuid[])
         RETURNING id`,
        [ctx.now, ids],
      );
      let work = 0;
      for (const r of rows) {
        const w = await purgeGuestRequestText(tx, deps.events, {
          guestRequestId: r.id,
          now: ctx.now,
        });
        work += w.tasks + w.workOrders;
        await tx.query(
          `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action,
             purged_at)
           VALUES ($1, $2, 'guest_request', $3, 'T13', 'null_columns', $4)`,
          [ctx.organizationId, ctx.propertyId, r.id, ctx.now],
        );
        await deps.events.publish(tx, 'guest_request.changed', r.id);
      }
      // (3) FB-R3-SEC-BED-01: the online check-in arrival note (C2, D23 – erd "xóa theo T13 cùng guest_request"),
      //     deadline = end of the stay + N months; a stay still open is never touched.
      const { rows: notes } = await tx.query<{ id: string; reservation_id: string }>(
        `SELECT id, reservation_id FROM online_checkin
          WHERE arrival_note IS NOT NULL AND created_at <= ${cutoff}
          ORDER BY created_at LIMIT $3 FOR UPDATE SKIP LOCKED`,
        [ctx.now, months, T13_BATCH],
      );
      const notesEnded = await endedStays(
        tx,
        notes.map((r) => r.reservation_id),
        limit,
      );
      const noteIds = notes.filter((r) => notesEnded.has(r.reservation_id)).map((r) => r.id);
      const { rows: cleared } = await tx.query<{ id: string }>(
        `UPDATE online_checkin SET arrival_note = NULL, updated_at = $1 WHERE id = ANY($2::uuid[]) RETURNING id`,
        [ctx.now, noteIds],
      );
      for (const r of cleared) {
        await tx.query(
          `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action,
             purged_at)
           VALUES ($1, $2, 'online_checkin', $3, 'T13', 'null_columns', $4)`,
          [ctx.organizationId, ctx.propertyId, r.id, ctx.now],
        );
      }
      if (rows.length > 0 || cleared.length > 0) {
        await deps.audit.record(tx, {
          category: 'data',
          action: 'retention.guest_request_note_purged',
          entityType: 'retention_run',
          after: {
            policyKey: 'T13',
            count: rows.length,
            linkedWork: work,
            arrivalNotes: cleared.length,
          },
        });
      }
      return { purged: rows.length, linkedWork: work, arrivalNotes: cleared.length };
    },
  };
}

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
