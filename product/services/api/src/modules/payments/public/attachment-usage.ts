/**
 * Port to the attachment store of BE-C (`files/public/attachment.service.ts`, ARC s3-contract 4.3):
 * - assertUsable(tx, actor, id, purpose, scope)  the id is an uploaded attachment of THIS property with this
 *   `purpose` (deposit_receipt, penalty_evidence, refund_proof), visible to the caller (SEC I1) and, when given,
 *   for this booking – otherwise 422 NOT_IN_LIST on `scope.field`.
 * - bindTo(tx, id, ref)  links it to the money row (one receipt image → one payment).
 * - setRetentionAnchor(tx, {id, purpose}, at)  start of the retention period (SEC I5): a receipt image is
 *   kept `deposit_receipt_retention_days` after its payment is `reconciled` (or settled without reconciliation);
 *   J16 purges it afterwards.
 *
 * Bound by BE-C's FilesModule (`{ provide: ATTACHMENT_USAGE, useExisting: AttachmentService }`).
 */
import type { Tx } from '../../../db/database';

export const ATTACHMENT_USAGE = Symbol('ATTACHMENT_USAGE');

export type MoneyAttachmentPurpose = 'deposit_receipt' | 'penalty_evidence' | 'refund_proof';

export interface AttachmentUsage {
  assertUsable(
    tx: Tx,
    actor: { userId: string; roles: readonly string[] },
    id: string,
    purpose: MoneyAttachmentPurpose,
    scope: { reservationId?: string | null; field: string },
  ): Promise<void>;
  bindTo(tx: Tx, id: string, ref: { type: 'payment' | 'folio_line'; id: string }): Promise<void>;
  setRetentionAnchor(
    tx: Tx,
    where: { id?: string; reservationId?: string; purpose: MoneyAttachmentPurpose },
    at: Date,
  ): Promise<number>;
}

/**
 * SEC I5 anchor of the image attached to a payment: receipts (`deposit_receipt`) and refund proofs
 * (`refund_proof`) start their retention when the money row is settled – reconciled, reversed after a
 * dispute, or recorded without reconciliation (cash, POS).
 */
export async function anchorPaymentAttachment(
  usage: AttachmentUsage | undefined,
  tx: Tx,
  p: { attachment_id: string | null; type: string },
  at: Date,
): Promise<void> {
  if (!usage || !p.attachment_id) return;
  await usage.setRetentionAnchor(
    tx,
    { id: p.attachment_id, purpose: p.type === 'refund' ? 'refund_proof' : 'deposit_receipt' },
    at,
  );
}
