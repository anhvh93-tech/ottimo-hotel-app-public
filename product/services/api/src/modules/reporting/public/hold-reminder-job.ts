/**
 * J2 `hold.remind` (architecture 9.1; BR-303; US-085 AC2 – BE-D Sprint 4): every tick, a `hold` booking whose
 * expiry is within `hold_expiry_reminder_hours` (2 h in DS-E) and still ahead reminds the person who created
 * it and the sale in charge (closer) – staff notification `hold_expiring` (inbox + push outbox + SSE
 * `notification.created`). The "Cần chú ý" line with the time left is the computed `hold_expiring` item
 * (frontdesk source, `dueAt` = earliest expiry) – nothing stored for it here.
 *
 * Exactly once per hold DEADLINE (architecture J2: key `reservationId:hold_expires_at` in job_run): the claim
 * `INSERT … ON CONFLICT DO NOTHING` on job_run (slot = id@deadline, business_date = local date of the
 * deadline) is the guard – a repeated or overlapping tick never reminds twice; an extension (B3) gives a new
 * deadline, hence a new reminder. A hold already past its deadline is J1's (never reminded late).
 * Registered by the reporting module (api + test-support job endpoint) and by the worker.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import { localDate } from '../../../shared/time';
import type { EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';

export const HOLD_REMIND_JOB_KEY = 'hold.remind';

export function holdReminderJob(events: EventsService, params: ParameterService): JobDefinition {
  return {
    key: HOLD_REMIND_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx: Tx, ctx) {
      const hours = await params.get<number>(tx, 'hold_expiry_reminder_hours', ctx.date);
      const until = new Date(ctx.now.getTime() + hours * 3_600_000);
      const { rows } = await tx.query<{
        id: string;
        code: string;
        hold_expires_at: Date;
        created_by: string | null;
        closer_user_id: string | null;
      }>(
        `SELECT id, code, hold_expires_at, created_by, closer_user_id FROM reservation
          WHERE status = 'hold' AND hold_expires_at > $1 AND hold_expires_at <= $2
          ORDER BY hold_expires_at, id`,
        [ctx.now, until],
      );
      let reminded = 0;
      for (const r of rows) {
        const claim = await tx.query<{ id: string }>(
          `INSERT INTO job_run (id, organization_id, property_id, job_key, business_date, slot, run_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'done')
           ON CONFLICT (job_key, property_id, business_date, slot) DO NOTHING RETURNING id`,
          [
            uuidv7(),
            ctx.organizationId,
            ctx.propertyId,
            HOLD_REMIND_JOB_KEY,
            localDate(r.hold_expires_at, ctx.timezone),
            `${r.id}@${r.hold_expires_at.toISOString()}`,
            ctx.now,
          ],
        );
        if (claim.rows.length === 0) continue;
        const users = [
          ...new Set([r.created_by, r.closer_user_id].filter((u): u is string => !!u)),
        ];
        const ref = { refType: 'reservation' as const, refId: r.id, refCode: r.code };
        const sent =
          users.length > 0
            ? await events.notify(tx, { kind: 'hold_expiring', userIds: users, ...ref }, ctx.now)
            : [];
        // A hold always has a creator; the desk is the safety net when that account is gone/disabled.
        if (sent.length === 0) {
          await events.notify(
            tx,
            { kind: 'hold_expiring', roles: ['front_desk_lead', 'front_desk'], ...ref },
            ctx.now,
          );
        }
        reminded += 1;
      }
      return { reminded };
    },
  };
}
