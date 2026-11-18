/**
 * FB-INV-012 (contract `rounds/round-05/fb-inv-012/contract.md` mục 2.4): charge codes of the folio lines a monthly
 * statement posts when it is issued. They belong to the statement: the folio never reduces (FOC / discount) or adjusts
 * them by hand – a wrong statement is voided (its lines reversed) and replaced, or corrected on the next statement
 * ("Điều chỉnh kỳ trước", BR-LS-16). Kept in the folio module so its own guards read them without importing billing.
 */
export const MONTHLY_RENT_CHARGE_CODE = 'monthly_rent';
export const ELECTRICITY_CHARGE_CODE = 'electricity';
export const WATER_CHARGE_CODE = 'water';
export const STATEMENT_ROUNDING_CHARGE_CODE = 'statement_rounding';
export const STATEMENT_PRIOR_ADJUSTMENT_CHARGE_CODE = 'statement_prior_adjustment';

export const STATEMENT_CHARGE_CODES: ReadonlySet<string> = new Set([
  MONTHLY_RENT_CHARGE_CODE,
  ELECTRICITY_CHARGE_CODE,
  WATER_CHARGE_CODE,
  STATEMENT_ROUNDING_CHARGE_CODE,
  STATEMENT_PRIOR_ADJUSTMENT_CHARGE_CODE,
]);

export const isStatementLine = (chargeCode: string | null | undefined): boolean =>
  !!chargeCode && STATEMENT_CHARGE_CODES.has(chargeCode);
