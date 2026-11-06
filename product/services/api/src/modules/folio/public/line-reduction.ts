/**
 * BR-438 – what a front desk (FD/FDL) may reduce on a folio line by itself (V5-16, FB-R4-SEC-BE-A31-01; contract
 * 0.3.13 1.5 + 1.20; DOM rules-v1.0.5 3.1, 7.2; US-177).
 *
 * - A reduction = void, lower quantity (0 included) or lower unit price – any change that makes the line's amount
 *   smaller – on a line that is not night-derived (`room`, `extra_person`, `room_change_difference`), on a folio not
 *   `settled` (a settled folio is A32, MGR+ – checked before). An increase is not a reduction.
 * - FD/FDL reduce directly only when the ROOT line of the chain (adjustFolioLine replacements: `related_line_id`, same
 *   category) was typed by hand, by the caller, in the current business day (BR-010 rollover). Otherwise 403
 *   FORBIDDEN_ACTION + `requiredFlow: foc_request` + access.denied, nothing written – the Desk opens "Gửi miễn có
 *   duyệt" (A35). OWN/MGR as before.
 * - "Typed by hand" (DOM 7.2 (3), BR-438 (1)(a)) = an A30 line (`source = manual` AND a category addFolioLine posts)
 *   or a minibar count line (`minibar_check`, category `minibar`: the person types what is left in the fridge – the
 *   minibar example of DOM 3.3 / BR-438-01, the desk edit of a count M-1 (e)). A Desk flow that posts its own line
 *   with source `manual` (late check-out of B15/B13/B16 – stay-support.replaceLateCharge) is a system line: it goes to
 *   FOC even when the same front desk pressed the button (BR-438-04, H-08). Guest requests (`guest_app`),
 *   check-in/check-out and system lines are not typed by hand either.
 * - The four facts are audited on every `folio_line.adjusted` (`before.rootLineId`, `rootLineManual`,
 *   `postedByActor`, `sameBusinessDay`): a FD/FDL reduction is allowed exactly when the last three are true.
 * A reduction allowed here is a correction, not a waiver: no FOC line, outside the FOC month (BR-435 (a)) and the
 * BR-433 quota; it is counted per person by "Cần chú ý" `foc_threshold` `check = line_reduction_count`.
 */
import type { Tx } from '../../../db/database';
import type { FolioLineCategory } from '../../../db/schema/folio';
import { type ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, businessDate } from '../../../shared/time';

/** Night-derived lines – outside BR-438 (A31 floor–ceiling; nights leave a stay through B7/B8/B16). */
export const NIGHT_LINE_CATEGORIES: readonly FolioLineCategory[] = [
  'room',
  'extra_person',
  'room_change_difference',
];

/**
 * Categories addFolioLine (A30) posts: the catalogue (adhoc cleaning, laundry, smoking / key card, damage table) and
 * the typed-in F&B / service / damage lines. test/v5-16-line-reduction.test.ts keeps it equal to the catalogue.
 */
export const A30_CATEGORIES: readonly FolioLineCategory[] = [
  'cleaning',
  'laundry',
  'penalty',
  'damage',
  'fnb',
  'service_fee',
];

/** Roles BR-438 (1)–(2) limits; OWN/MGR reduce as before (BR-438 (3)). */
export const FRONT_DESK_ROLES = ['front_desk', 'front_desk_lead'] as const;

/** `Problem.requiredFlow` of the refusal (contract 0.3.13 1.20). */
export const FOC_REQUEST_FLOW = 'foc_request';

/** `access.denied.reason` of the refusal (server side only – ProblemError.options.auditReason). */
export const BR438_DENIAL = 'BR-438';

export interface RootLine {
  id: string;
  source: string;
  category: FolioLineCategory;
  postedBy: string | null;
  postedAt: Date;
}

export interface ReductionScope {
  rootLineId: string;
  /** The root was typed by hand: an A30 line or a minibar count (typedByHand). */
  rootLineManual: boolean;
  /** The caller posted the root. */
  postedByActor: boolean;
  /** The root was posted in the current business day. */
  sameBusinessDay: boolean;
}

/**
 * BR-438 (1)(a): a line a person typed – an A30 line (source `manual`, A30 category) or a minibar count line
 * (`minibar_check`, the count the person typed). Late check-out lines of B15/B13/B16 carry source `manual` too but
 * are posted by the Desk flow: not typed by hand (BR-438-04).
 */
export function typedByHand(source: string, category: FolioLineCategory): boolean {
  return (
    (source === 'manual' && A30_CATEGORIES.includes(category)) ||
    (source === 'minibar_check' && category === 'minibar')
  );
}

/** BR-438: the change makes a non-night line smaller. */
export function isLineReduction(
  category: FolioLineCategory,
  beforeVnd: number,
  afterVnd: number,
): boolean {
  return !NIGHT_LINE_CATEGORIES.includes(category) && afterVnd < beforeVnd;
}

/** The roles BR-438 limits: front desk without OWN/MGR. */
export function limitedByBr438(roles: readonly string[]): boolean {
  return (
    !roles.some((r) => r === 'owner' || r === 'manager') &&
    roles.some((r) => (FRONT_DESK_ROLES as readonly string[]).includes(r))
  );
}

/**
 * The first line of the adjustFolioLine chain of `lineId`: `related_line_id` walked back while the parent has the
 * same category and is not a reversal (same walk as FolioLinesService.amountAtCheckout). A FOC / discount line
 * also points at its line through `related_line_id`, but with another category – never part of the chain.
 */
export async function rootLineOf(tx: Tx, lineId: string): Promise<RootLine | null> {
  const { rows } = await tx.query<{
    id: string;
    source: string;
    category: FolioLineCategory;
    posted_by: string | null;
    posted_at: Date;
  }>(
    `WITH RECURSIVE chain AS (
       SELECT l.id, l.related_line_id, l.category, l.source, l.posted_by, l.posted_at, 0 AS depth
         FROM folio_line l WHERE l.id = $1
       UNION ALL
       SELECT p.id, p.related_line_id, p.category, p.source, p.posted_by, p.posted_at, c.depth + 1
         FROM chain c JOIN folio_line p ON p.id = c.related_line_id
        WHERE p.category = c.category AND p.reversal_of_id IS NULL AND c.depth < 200
     )
     SELECT id, source, category, posted_by, posted_at FROM chain ORDER BY depth DESC LIMIT 1`,
    [lineId],
  );
  const r = rows[0];
  return r
    ? {
        id: r.id,
        source: r.source,
        category: r.category,
        postedBy: r.posted_by,
        postedAt: r.posted_at,
      }
    : null;
}

/** The BR-438 facts of a root line for the caller, on the business-day axis (BR-010). */
export function reductionScope(
  root: RootLine,
  actorUserId: string,
  day: { today: LocalDate; tz: string; rollover: LocalTime },
): ReductionScope {
  return {
    rootLineId: root.id,
    rootLineManual: typedByHand(root.source, root.category),
    postedByActor: root.postedBy !== null && root.postedBy === actorUserId,
    sameBusinessDay: businessDate(root.postedAt, day.tz, day.rollover) === day.today,
  };
}

/** BR-438 (1): a front desk reduces the line directly. */
export function frontDeskMayReduce(scope: ReductionScope): boolean {
  return scope.rootLineManual && scope.postedByActor && scope.sameBusinessDay;
}

/** BR-438 (2): the refusal – the controller writes access.denied after the rollback. */
export function br438Refusal(): ProblemError {
  return problem('FORBIDDEN_ACTION', {
    detail:
      'a front desk reduces only a line it typed by hand in the current business day – request a FOC (BR-438)',
    extras: { requiredFlow: FOC_REQUEST_FLOW },
    auditReason: BR438_DENIAL,
  });
}
