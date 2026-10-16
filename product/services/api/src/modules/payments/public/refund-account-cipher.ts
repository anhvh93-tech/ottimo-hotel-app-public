/**
 * Port to BE-C's CryptoService (`crypto/public/crypto.service.ts`, ADR-013, SEC B1 – the ONE place that holds
 * KEKs and `data_key`) for the refund destination account (D15, C3 – SEC F8, erd T09):
 * - encrypt(tx, {purpose: 'refund_account', subjectId, aad}, plaintext) → { dekId, ciphertext }  (own DEK)
 * - decrypt(tx, {dekId, ciphertext, aad}) → plaintext
 * - destroy(tx, dekId)  crypto-shredding when the refund is fully paid out (T09) or the destination changes.
 * AAD = `approval_request|refund_account_enc|<approval id>|<key version>` (SEC B1 format).
 *
 * Bound by BE-C's CryptoModule (`RefundAccountCipherAdapter` over CryptoService – one DEK per destination).
 */
import type { Tx } from '../../../db/database';

export const REFUND_ACCOUNT_CIPHER = Symbol('REFUND_ACCOUNT_CIPHER');

export interface RefundAccountCipher {
  encrypt(
    tx: Tx,
    meta: { purpose: 'refund_account'; subjectId: string; aad: string },
    plaintext: string,
  ): Promise<{ dekId: string; ciphertext: Buffer }>;
  decrypt(tx: Tx, input: { dekId: string; ciphertext: Buffer; aad: string }): Promise<string>;
  destroy(tx: Tx, dekId: string): Promise<void>;
}

export function refundAccountAad(approvalId: string): string {
  return `approval_request|refund_account_enc|${approvalId}|1`;
}
