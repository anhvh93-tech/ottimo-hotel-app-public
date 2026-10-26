/**
 * BE-B – v1.0 patch ESC-031 (ESC-024 B, BR-416 (3)(4)) without a database: who sees the review item, the job asks
 * only for overdue unreviewed items and tells OWN once per item.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Tx } from '../src/db/database';
import {
  type EventsService,
  attentionAudience,
  attentionVisibleTo,
} from '../src/modules/events/public/events.service';
import {
  LATE_FEE_REVIEW_OVERDUE_JOB_KEY,
  lateFeeReviewOverdueJob,
} from '../src/modules/frontdesk/public/late-fee-review-job';
import {
  ParameterMissingError,
  type ParameterService,
} from '../src/modules/platform/public/parameter.service';

describe('late_fee_post_review "Cần chú ý" (ESC-024 B)', () => {
  it('OWN and MGR only – never the desk', () => {
    expect(attentionAudience({ kind: 'late_fee_post_review' })).toEqual(['owner', 'manager']);
    for (const r of ['front_desk', 'front_desk_lead', 'housekeeping', 'sales_staff']) {
      expect(attentionVisibleTo({ kind: 'late_fee_post_review' }, [r])).toBe(false);
    }
  });
});

describe('late_fee.post_review_overdue job (BR-416 (4))', () => {
  const ctx = {
    now: new Date('2030-07-12T12:00:00Z'),
    organizationId: 'o',
    propertyId: 'p',
    timezone: 'Asia/Ho_Chi_Minh',
    date: '2030-07-12',
    slot: 'tick',
  };

  it('reads the window from post_checkout_charge_hours and tells every OWN of each overdue item', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        { ref_id: 'r1', ref_code: 'OTM-00001' },
        { ref_id: 'r2', ref_code: null },
      ],
    });
    const notify = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn().mockResolvedValue(24);
    const job = lateFeeReviewOverdueJob(
      { notify } as unknown as EventsService,
      { get } as unknown as ParameterService,
    );
    expect(job.key).toBe(LATE_FEE_REVIEW_OVERDUE_JOB_KEY);
    expect(job.schedule).toEqual({ kind: 'tick' });
    const out = await job.handler({ query } as unknown as Tx, ctx);
    expect(out).toEqual({ told: 2 });
    expect(get).toHaveBeenCalledWith(expect.anything(), 'post_checkout_charge_hours', '2030-07-12');
    const [sql, args] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/kind = 'late_fee_post_review' AND e\.resolved_at IS NULL/);
    expect(sql).toMatch(/r\.role = 'owner'/);
    expect(args).toEqual([ctx.now, 24, 100]);
    expect(notify).toHaveBeenCalledTimes(2);
    expect(notify.mock.calls[0]![1]).toEqual({
      kind: 'late_fee_post_review',
      roles: ['owner'],
      refType: 'reservation',
      refId: 'r1',
      refCode: 'OTM-00001',
    });
  });

  it('no parameter → nothing read, nothing told', async () => {
    const query = vi.fn();
    const notify = vi.fn();
    const get = vi.fn().mockRejectedValue(new ParameterMissingError('post_checkout_charge_hours'));
    const job = lateFeeReviewOverdueJob(
      { notify } as unknown as EventsService,
      { get } as unknown as ParameterService,
    );
    expect(await job.handler({ query } as unknown as Tx, ctx)).toEqual({ told: 0 });
    expect(query).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
