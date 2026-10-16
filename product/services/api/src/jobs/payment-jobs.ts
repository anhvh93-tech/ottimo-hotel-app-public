/**
 * J24 `payment.expire` (architecture 9.1, erd 4.6 "Vòng đời giao dịch VietQR pending", OpenAPI 0.3.3 E05-02):
 * a `pending` payment (VietQR in R2; VNPay/MoMo in R3) whose `expires_at ≤ Clock.now()` becomes `expired`
 * (SM-12, actor `system`) – never touches `succeeded`. `expires_at` itself is set by the payments module
 * (next business-day rollover); `confirmPaymentReceived` still re-checks it on the spot.
 *
 * The rule lives in the payments module (`payments/public/payment-expiry.ts` – FB-R2-ARC-BE-S3-15 a: one
 * writer of `payment`); this job only schedules it. Runs every worker tick (cheaper than the 5-minute slot
 * and still idempotent).
 */
import type { AuditService } from '../modules/audit/public/audit.service';
import { expirePendingPayments } from '../modules/payments/public/payment-expiry';
import type { JobDefinition } from './job-runner';

export { expirePendingPayments };

export const PAYMENT_EXPIRY_JOB_KEY = 'payment.expire';

export function paymentExpiryJob(audit: AuditService): JobDefinition {
  return {
    key: PAYMENT_EXPIRY_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      return expirePendingPayments(tx, audit, ctx.now);
    },
  };
}
