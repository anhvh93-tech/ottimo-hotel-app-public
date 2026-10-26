/**
 * ESC-024 B (INV 22/10) – v1.0 patch ESC-031 (BE-B), BR-416 (4): a late charge of one night the desk recorded without a
 * manager (`checkOut.lateFeeInsteadOfNight.postReview`) is reviewed by OWN/MGR within the post-checkout window
 * (`post_checkout_charge_hours`, 24 – the "Cần chú ý" item `late_fee_post_review` is due then). Past it and still not
 * reviewed ("Đã xem" = resolveAttentionEvent) → every OWN of the property is told once (`late_fee_post_review`, the
 * same kind; the item stays open, J15 closes the folio as usual – complaints after that: BR-525).
 *
 * Tick job, correctness from row conditions: an item counts as told when an OWN notification of the kind for the
 * booking exists from its deadline on, so a late or repeated run never tells twice. Codes and ids only (SEC J).
 */
import type { JobDefinition } from '../../../jobs/job-runner';
import type { EventsService } from '../../events/public/events.service';
import {
  ParameterMissingError,
  type ParameterService,
} from '../../platform/public/parameter.service';

export const LATE_FEE_REVIEW_OVERDUE_JOB_KEY = 'late_fee.post_review_overdue';
/** Technical batch per run (the next tick takes the rest). */
const BATCH = 100;

export function lateFeeReviewOverdueJob(
  events: EventsService,
  params: ParameterService,
): JobDefinition {
  return {
    key: LATE_FEE_REVIEW_OVERDUE_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      let hours: number;
      try {
        hours = await params.get<number>(tx, 'post_checkout_charge_hours', ctx.date);
      } catch (e) {
        if (e instanceof ParameterMissingError) return { told: 0 };
        throw e;
      }
      const { rows } = await tx.query<{ ref_id: string; ref_code: string | null }>(
        `SELECT e.ref_id, e.ref_code FROM attention_event e
          WHERE e.kind = 'late_fee_post_review' AND e.resolved_at IS NULL AND e.ref_type = 'reservation'
            AND e.created_at + make_interval(hours => $2::int) <= $1
            AND NOT EXISTS (
              SELECT 1 FROM staff_notification n
               JOIN user_property_role r ON r.user_id = n.user_id AND r.property_id = n.property_id
                AND r.role = 'owner' AND r.revoked_at IS NULL
               WHERE n.kind = 'late_fee_post_review' AND n.ref_id = e.ref_id
                 AND n.created_at >= e.created_at + make_interval(hours => $2::int))
          ORDER BY e.created_at LIMIT $3`,
        [ctx.now, Math.trunc(hours), BATCH],
      );
      for (const r of rows) {
        await events.notify(
          tx,
          {
            kind: 'late_fee_post_review',
            roles: ['owner'],
            refType: 'reservation',
            refId: r.ref_id,
            refCode: r.ref_code,
          },
          ctx.now,
        );
      }
      return { told: rows.length };
    },
  };
}
