/**
 * Payments – SM-12 (US-119, US-086; BR-008, BR-521, BR-527; R-PAY-01: never a card number).
 * record(): one manual `succeeded` receipt on a folio (cash / transfer / POS slip / VietQR seen on the
 * account) in the caller's transaction, code PT-… (DocNumberService), money audit (who, when, amount,
 * method – US-086 AC5). Transfers and VietQR recorded by hand carry reconciliation `pending` ("chờ đối soát",
 * US-119 AC6); cash and card POS `not_required`. Amounts are never updated (reversal = own row, R3 flows).
 * Callers lock the folio first (lock order reservation → room → folio).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { PaymentMethod, PaymentType } from '../../../db/schema/folio';
import { AuditService } from '../../audit/public/audit.service';
import { DocNumberService } from '../../platform/public/doc-number.service';

export interface ManualPaymentInput {
  folioId: string;
  reservationId: string | null;
  reservationCode: string | null;
  type: PaymentType;
  method: PaymentMethod;
  amountVnd: number;
  /** null = now (Clock). */
  receivedAt: Date | null;
  posAuthCode: string | null;
  note: string | null;
  recordedBy: string;
  /** Override (SEC-BE-22: a sale's receipt is always `pending`); default by method (BR-527). */
  reconciliation?: 'pending' | 'not_required';
  /** Role of the recorder when it is not a desk role – kept in the money audit (SEC-BE-22). */
  recordedByRole?: string;
  requestId?: string;
}

/** BR-527: manual transfer / VietQR → wait for the bank statement; cash, POS slip, OTA → not required. */
export function reconciliationFor(method: PaymentMethod): 'pending' | 'not_required' {
  return method === 'bank_transfer' || method === 'vietqr' ? 'pending' : 'not_required';
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
  ) {}

  async recordManual(tx: Tx, p: ManualPaymentInput): Promise<{ id: string; code: string }> {
    if (!Number.isSafeInteger(p.amountVnd) || p.amountVnd <= 0) {
      throw new RangeError('payment amount must be a positive safe integer');
    }
    const id = uuidv7();
    const now = this.clock.now();
    const code = await this.docNumbers.allocate(tx, 'payment');
    const reconciliation = p.reconciliation ?? reconciliationFor(p.method);
    await tx.query(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, auth_code, received_at, recorded_by, note, created_at,
         created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'succeeded', $11, $12, $13, $14, $15, $13, $15)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        p.folioId,
        p.reservationId,
        p.type,
        p.method,
        reconciliation,
        p.amountVnd,
        p.posAuthCode,
        p.receivedAt ?? now,
        p.recordedBy,
        p.note,
        now,
      ],
    );
    await this.audit.recordMoney(tx, {
      action: 'payment.recorded',
      entityType: 'payment',
      entityId: id,
      entityCode: p.reservationCode ?? code,
      after: {
        code,
        type: p.type,
        method: p.method,
        amountVnd: p.amountVnd,
        status: 'succeeded',
        reconciliation,
        ...(p.recordedByRole ? { recordedByRole: p.recordedByRole } : {}),
      },
      ...(p.requestId ? { requestId: p.requestId } : {}),
    });
    return { id, code };
  }
}
