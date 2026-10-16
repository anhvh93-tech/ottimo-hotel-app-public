/**
 * VietQR receiving account of the property (`payment_receiving_account`, BR-521, SEC F1–F3; OpenAPI 0.3.6
 * setParameter.x-reauth-parameters). Value = {bankBin, accountNo, accountName}; owner-only, re-auth in the
 * request, money audit with the number masked, push to every OWN/MGR. The full number leaves the server only
 * inside the VietQR payload it builds – every listing shows `accountNoMasked`.
 */
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { containsCardNumber } from '../../../shared/validation';
import { type LocalDate, atLocal } from '../../../shared/time';

export const RECEIVING_ACCOUNT_KEY = 'payment_receiving_account';
/** SEC F3: QR made within this window after a change shows "Tài khoản nhận vừa đổi". */
export const RECENT_CHANGE_MS = 24 * 3_600_000;

export interface ReceivingAccount {
  bankBin: string;
  accountNo: string;
  accountName: string;
}

export interface ReceivingAccountInEffect extends ReceivingAccount {
  changedAt: Date;
}

/** Owner input check (SEC F3 schema): 422 VALIDATION_FAILED on the offending sub-field. */
export function parseReceivingAccount(value: unknown): ReceivingAccount {
  const v = value as Record<string, unknown> | null;
  const errors: Array<{ field: string; code: string }> = [];
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw problem('VALIDATION_FAILED', { errors: [{ field: 'value', code: 'VALIDATION_FAILED' }] });
  }
  const bankBin = typeof v.bankBin === 'string' ? v.bankBin.trim() : '';
  const accountNo = typeof v.accountNo === 'string' ? v.accountNo.replace(/\s+/g, '') : '';
  const accountName = typeof v.accountName === 'string' ? v.accountName.trim() : '';
  if (!/^[0-9]{6}$/.test(bankBin)) {
    errors.push({
      field: 'value.bankBin',
      code: v.bankBin === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
    });
  }
  if (!/^[0-9]{6,19}$/.test(accountNo)) {
    errors.push({
      field: 'value.accountNo',
      code: v.accountNo === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
    });
  }
  if (!accountName) errors.push({ field: 'value.accountName', code: 'REQUIRED' });
  else if (accountName.length > 50) errors.push({ field: 'value.accountName', code: 'TOO_LONG' });
  else if (!/^[A-Z0-9 .-]+$/.test(accountName)) {
    // NAPAS beneficiary name: upper case without diacritics (control characters never pass).
    errors.push({ field: 'value.accountName', code: 'VALIDATION_FAILED' });
  } else if (containsCardNumber(accountName)) {
    // SEC-BE-44 (A4): a card number typed into the name is refused, never stored or audited.
    throw problem('CARD_NUMBER_DETECTED', {
      errors: [{ field: 'value.accountName', code: 'CARD_NUMBER_DETECTED' }],
    });
  }
  const extra = Object.keys(v).filter((k) => !['bankBin', 'accountNo', 'accountName'].includes(k));
  for (const k of extra) errors.push({ field: `value.${k}`, code: 'NOT_IN_LIST' });
  if (errors.length) throw problem('VALIDATION_FAILED', { errors });
  return { bankBin, accountNo, accountName };
}

/** `9704••••1234` style mask (BIN prefix + last 4) – never the full number. */
export function maskedAccountNo(a: { bankBin: string; accountNo: string }): string {
  return `${a.bankBin.slice(0, 4)}••••${a.accountNo.slice(-4)}`;
}

/** The parameter value as listings show it (accountNo replaced by accountNoMasked). */
export function maskReceivingAccount(value: unknown): unknown {
  const v = value as Partial<ReceivingAccount> | null;
  if (!v || typeof v !== 'object' || typeof v.accountNo !== 'string') return value;
  return {
    bankBin: v.bankBin,
    accountNoMasked: maskedAccountNo({ bankBin: v.bankBin ?? '', accountNo: v.accountNo }),
    accountName: v.accountName,
  };
}

/**
 * Account in effect on `asOf` (business date) and when it became effective: the later of the row's last write
 * and the start of its effective date. Null when the property has none (→ 409 PAYMENT_NOT_CONFIGURED).
 */
export async function receivingAccountInEffect(
  tx: Tx,
  asOf: LocalDate,
  tz: string,
): Promise<ReceivingAccountInEffect | null> {
  const { rows } = await tx.query<{
    value: ReceivingAccount;
    effective_from: string;
    updated_at: Date;
  }>(
    `SELECT value, effective_from::text AS effective_from, updated_at FROM config_parameter
      WHERE property_id = $1 AND key = $2 AND effective_from <= $3
      ORDER BY effective_from DESC LIMIT 1`,
    [tx.ctx.propertyId, RECEIVING_ACCOUNT_KEY, asOf],
  );
  const r = rows[0];
  if (!r || !r.value || typeof r.value.accountNo !== 'string') return null;
  const start = atLocal(r.effective_from as LocalDate, '00:00', tz);
  const changedAt = r.updated_at.getTime() > start.getTime() ? r.updated_at : start;
  return { ...r.value, changedAt };
}
