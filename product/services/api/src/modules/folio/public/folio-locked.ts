/**
 * 0.3.13 V5-44 (a) (P4-41) + bổ sung 1 (BE C0313-11): the ONE way to answer `409 FOLIO_LOCKED` – always with
 * `Problem.lockReason`, the field the Desk picks its sentence from (`detail` is for logs, never compared by a client).
 * A new place that refuses a locked folio calls `folioLocked(...)`; test/pr-b1-units.test.ts fails on any other
 * `problem('FOLIO_LOCKED'...)` under src/modules.
 */
import { type ProblemError, problem } from '../../../shared/problem';

/** OpenAPI `Problem.lockReason` (enum). */
export const FOLIO_LOCK_REASONS = [
  'closed',
  'settled',
  'post_checkout_window_over',
  'debt_reduction_requires_write_off',
  'invoice_issued',
] as const;
export type FolioLockReason = (typeof FOLIO_LOCK_REASONS)[number];

export function folioLocked(lockReason: FolioLockReason, detail?: string): ProblemError {
  return problem('FOLIO_LOCKED', { ...(detail ? { detail } : {}), extras: { lockReason } });
}

/**
 * The reason of a folio that is not `open` for an operation that takes only an open folio: `closed` (J15), else
 * `settled` (the operation does not take a settled folio).
 */
export function lockReasonOfStatus(status: string): FolioLockReason {
  return status === 'closed' ? 'closed' : 'settled';
}
