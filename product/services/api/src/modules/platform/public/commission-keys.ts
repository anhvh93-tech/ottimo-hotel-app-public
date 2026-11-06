/**
 * Names of the commission rate parameters (BR-903; DOM rules-v1.0.5 4.1, 4.4; contract 0.3.13 1.10, 1.22). Names only –
 * no rate, no default: the values are the owner's internal table, typed on the Desk (SEC G3).
 * - `SHORT_STAY_COMMISSION_KEY` is READ for money in `folio/public/commission-rate.ts` only (test/v5-30-commission-rate
 *   scans the code); here it names the key for the save rule and the visibility filter of the platform module, which
 *   may not import folio.
 * - `COMMISSION_RATE_KEYS` (FB-R5-ARC-BE-H1-01 Major, SEC FB-R5-SEC-BE-V530-02): listParameters / getParameterHistory
 *   show these keys to OWN and MGR only – any other role sees neither the name, the value nor the history (404), like a
 *   security key for FDL (DOM 4.4 "Tỷ lệ cấu hình: … Vai khác: Không", rbac S17 / A60). `long_stay_commission` and
 *   `manager_performance_bonus_pct` are listed now so PR-M only adds them to the catalogue.
 */
export const SHORT_STAY_COMMISSION_KEY = 'short_stay_commission_pct';

export const COMMISSION_RATE_KEYS: ReadonlySet<string> = new Set([
  SHORT_STAY_COMMISSION_KEY,
  'long_stay_commission',
  'manager_performance_bonus_pct',
]);
