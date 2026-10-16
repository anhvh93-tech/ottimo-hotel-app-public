/**
 * "Cần chú ý" `reconcile_overdue` (B-21, BR-527, oracle BR-527-01) – contributed by the payments module through
 * EventsService.registerAttentionSource (FB-R2-ARC-BE-S3-15 b: the rule lives once, next to listPayments'
 * `reconcileOverdue` flag – same threshold: still `pending` ≥ `bank_reconcile_alert_days` × 24 h).
 * Count + age only (SEC J): no payer, no amount, no booking code.
 */
import type { Tx } from '../../../db/database';
import type {
  AttentionItem,
  AttentionSource,
  AttentionSourceContext,
} from '../../events/public/events.service';

export const reconcileOverdueSource: AttentionSource = async (
  tx: Tx,
  ctx: AttentionSourceContext,
): Promise<AttentionItem[]> => {
  const days = await ctx.param<number>('bank_reconcile_alert_days');
  if (days === undefined) return [];
  const { rows } = await tx.query<{ n: number; oldest: Date | null }>(
    `SELECT count(*)::int AS n, min(received_at) AS oldest FROM payment
      WHERE reconciliation = 'pending' AND status = 'succeeded' AND reversal_of_id IS NULL
        AND received_at <= $1::timestamptz - make_interval(days => $2::int)`,
    [ctx.now, days],
  );
  const r = rows[0];
  if (!r || r.n === 0 || !r.oldest) return [];
  const oldestDays = Math.floor((ctx.now.getTime() - r.oldest.getTime()) / 86_400_000);
  return [
    {
      kind: 'reconcile_overdue',
      source: 'computed',
      severity: 'warning',
      count: r.n,
      link: '/payments?reconciliation=pending',
      params: { count: r.n, oldestDays },
    },
  ];
};
