/**
 * BR-438 (4)(ii)–(iii) – "sửa giảm dòng phát sinh" read from the audit log (contract 0.3.13 1.5, 1.20; V5-16; ARC
 * FB-R5-ARC-BE-B2-01): ONE definition for every reader, so the "Cần chú ý" count and the list the manager opens from it
 * can never disagree.
 * - `lineReductionWhere` – the SQL clauses of `listAuditEvents` `removalsOnly` / `reductionsOnly` (this module's
 *   controller) and of the count below: `category = money` + `action = folio_line.adjusted` (index
 *   audit_event_property_category_idx), the night money left out (room, extra_person, room_change_difference – no
 *   "phát sinh"), amounts compared only when both are JSON numbers (an old or odd row never matches, no cast error).
 * - `countLineReductionsByActor` – the reductions per person of a period, for the roles at the time given (FD/FDL for
 *   BR-438 (4)(iii)): reporting's "Cần chú ý" `foc_threshold` `check = line_reduction_count` reads it here instead of
 *   the `audit_event` table (architecture 5.1 – the table holds ip_hmac, session ids and free text; reporting never
 *   reads it). Only `actor_user_id` and the allowlisted `before`/`after` keys are read.
 * `ShiftReport.lineReductions[]` (v1.0.6) is meant to use the same clauses.
 */
import type { Tx } from '../../../db/database';
import type { FolioLineCategory } from '../../../db/schema/folio';

/** 0.3.13 V5-16 + bổ sung 1 (BR-438): the one audit action of a line correction (adjustFolioLine). */
export const LINE_REDUCTION_ACTION = 'folio_line.adjusted';

/**
 * Night-derived lines – a night, its extra person, a room-change difference: no "phát sinh" (contract 1.5, 1.20), outside
 * BR-438 (A31 floor–ceiling). `folio/public/line-reduction.ts` re-exports this list (audit never imports folio).
 */
export const NIGHT_LINE_CATEGORIES: readonly FolioLineCategory[] = [
  'room',
  'extra_person',
  'room_change_difference',
];

/** `<alias>.(before|after).amountVnd` as a number – NULL when it is not a JSON number (the row then never matches). */
export const lineAmountOf = (alias: string, side: 'before' | 'after') =>
  `(CASE WHEN jsonb_typeof(${alias}.${side}->'amountVnd') = 'number' THEN (${alias}.${side}->>'amountVnd')::numeric END)`;

/**
 * The WHERE clauses of a line reduction on `audit_event <alias>`, with `ph` adding a bind parameter. `removalsOnly`: the
 * line went to 0; `reductionsOnly`: any reduction, removals included. At least one of the two must be set.
 */
export function lineReductionWhere(
  alias: string,
  ph: (v: unknown) => string,
  only: { removalsOnly?: boolean; reductionsOnly?: boolean },
): string[] {
  if (!only.removalsOnly && !only.reductionsOnly) {
    throw new Error('lineReductionWhere: removalsOnly or reductionsOnly');
  }
  const where = [
    `${alias}.category = ${ph('money')}`,
    `${alias}.action = ${ph(LINE_REDUCTION_ACTION)}`,
    `COALESCE(${alias}.after->>'category', '') <> ALL(${ph([...NIGHT_LINE_CATEGORIES])}::text[])`,
  ];
  if (only.removalsOnly) where.push(`${lineAmountOf(alias, 'after')} = 0`);
  if (only.reductionsOnly) {
    where.push(`${lineAmountOf(alias, 'after')} < ${lineAmountOf(alias, 'before')}`);
  }
  return where;
}

/**
 * BR-438 (4)(iii): per person, the line reductions (`reductionsOnly`) of `[from, to]` on the property, by a person whose
 * role at the time (`before.actorRole`) is one of `actorRoles`; only the people with MORE than `above`, most first.
 * Runs in the caller's (read-only) transaction, RLS applies.
 */
export async function countLineReductionsByActor(
  tx: Tx,
  q: {
    propertyId: string;
    from: Date;
    to: Date;
    actorRoles: readonly string[];
    above: number;
  },
): Promise<Array<{ actorUserId: string; n: number }>> {
  const params: unknown[] = [];
  const ph = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  const where = [
    `e.property_id = ${ph(q.propertyId)}`,
    `e.occurred_at >= ${ph(q.from)}`,
    `e.occurred_at <= ${ph(q.to)}`,
    'e.actor_user_id IS NOT NULL',
    `e.before->>'actorRole' = ANY(${ph([...q.actorRoles])}::text[])`,
    ...lineReductionWhere('e', ph, { reductionsOnly: true }),
  ];
  const { rows } = await tx.query<{ actor_user_id: string; n: number }>(
    `SELECT e.actor_user_id, count(*)::int AS n FROM audit_event e
      WHERE ${where.join(' AND ')}
      GROUP BY e.actor_user_id HAVING count(*) > ${ph(q.above)}
      ORDER BY count(*) DESC, e.actor_user_id`,
    params,
  );
  return rows.map((r) => ({ actorUserId: r.actor_user_id, n: r.n }));
}
