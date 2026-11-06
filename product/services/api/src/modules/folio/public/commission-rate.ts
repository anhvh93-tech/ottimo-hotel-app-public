/**
 * V5-30 – commission rates come from the owner's parameter rows only (FB-R4-SEC-BE-01 Major, FB-R4-SEC-ORC-01 G3;
 * contract 0.3.13 1.10, 1.24; DOM rules-v1.0.5 4.1, 7.3; BR-903).
 * - The code holds NO default rate: `short_stay_commission_pct` has no catalogue default and the production bootstrap
 *   no longer writes one (`admin/production-defaults.ts` INV_ENTERS_KEYS). OWN types the internal table on the Desk.
 * - A missing row (`ParameterMissingError`), a table without the payee's sub-key or a value that is not a percent is
 *   `rate_missing`: no rate, no amount – never 0, never an old number. The quote says so
 *   (`QuoteCalculation.commission.status`), confirming a booking creates no `commission` row, and the next commission
 *   sync after OWN typed the rate creates it (DOM 7.3; the rate is the one snapshot at booking time when there is one).
 * - Every read of a commission rate key goes through this file (test/v5-30-commission-rate.test.ts scans the code).
 *   Long-stay commission is `long_stay_commission` (DOM 4.1, contract 1.22 – PR-M); the old `lease_terms[]`
 *   commission columns are gone from the defaults and no code reads them.
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import {
  ParameterMissingError,
  type ParameterService,
} from '../../platform/public/parameter.service';

/** Parameter key of the short-stay rate table: `{"staff": %, "collaborator": %}` (BR-903, DOM 4.1). */
export const SHORT_STAY_COMMISSION_KEY = 'short_stay_commission_pct';

/** OpenAPI `QuoteCalculation.commission.status` (0.3.13). */
export type CommissionStatus = 'computed' | 'rate_missing' | 'not_applicable';

export type CommissionRate =
  | { status: 'computed'; ratePct: number }
  | { status: 'rate_missing' }
  | { status: 'not_applicable' };

/** Rate of a payee in a `short_stay_commission_pct` table; null when the table has no valid rate for it. */
export function commissionPctFor(table: unknown, payee: 'agent' | 'staff'): number | null {
  if (!table || typeof table !== 'object' || Array.isArray(table)) return null;
  const v = (table as Record<string, unknown>)[payee === 'agent' ? 'collaborator' : 'staff'];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
}

/**
 * Pure rule: no payee (no closer, or the closer is neither sale nor CTV) → `not_applicable`; a payee without a valid
 * rate in the stored table (absent table included) → `rate_missing`; otherwise `computed` with that rate.
 */
export function commissionRateOf(table: unknown, payee: 'agent' | 'staff' | null): CommissionRate {
  if (!payee) return { status: 'not_applicable' };
  const ratePct = commissionPctFor(table, payee);
  return ratePct === null ? { status: 'rate_missing' } : { status: 'computed', ratePct };
}

/** Stored short-stay rate table effective on `asOf`, or undefined when OWN has not typed one yet. */
export async function shortStayCommissionTable(
  params: ParameterService,
  tx: Tx,
  asOf: LocalDate,
): Promise<unknown> {
  try {
    return await params.get<unknown>(tx, SHORT_STAY_COMMISSION_KEY, asOf);
  } catch (err) {
    if (err instanceof ParameterMissingError) return undefined;
    throw err;
  }
}

/** Short-stay rate of `payee` on `asOf` (BR-903) – the table is read only when there is a payee. */
export async function shortStayCommissionRate(
  params: ParameterService,
  tx: Tx,
  payee: 'agent' | 'staff' | null,
  asOf: LocalDate,
): Promise<CommissionRate> {
  if (!payee) return { status: 'not_applicable' };
  return commissionRateOf(await shortStayCommissionTable(params, tx, asOf), payee);
}
