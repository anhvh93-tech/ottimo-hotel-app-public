/**
 * PaymentPort.expireDue (FB-R2-ARC-BE-S3-15 a): the payments module owns every write of `payment` – J24
 * `payment.expire` (src/jobs/payment-jobs.ts) only calls this. A `pending` payment (VietQR in R2; VNPay/MoMo
 * in R3) whose `expires_at ≤ now` becomes `expired` (SM-12, actor `system`) – never touches `succeeded`.
 *
 * Exactly once per row by the ROW condition (`status = 'pending' AND expires_at <= $now`, FOR UPDATE SKIP
 * LOCKED, re-checked by the UPDATE), so overlapping/late runs are harmless (catch-up). Per row: SM-12
 * history, money audit `payment.expired`, SSE `payment.changed` (MGR+ and the recorder) – ids only.
 */
import type { Tx } from '../../../db/database';
import type { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';

/** Rows handled per run (technical batch – the next tick takes the rest). */
const BATCH = 200;

export async function expirePendingPayments(
  tx: Tx,
  audit: AuditService,
  now: Date,
): Promise<{ expired: number }> {
  const { rows } = await tx.query<{
    id: string;
    code: string;
    method: string;
    amount_vnd: number;
    recorded_by: string | null;
  }>(
    `WITH due AS (
       SELECT id FROM payment
        WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at <= $1
        ORDER BY expires_at, id
        LIMIT $2
        FOR UPDATE SKIP LOCKED)
     UPDATE payment p SET status = 'expired', updated_at = $1, version = version + 1
       FROM due WHERE p.id = due.id AND p.status = 'pending'
     RETURNING p.id, p.code, p.method, p.amount_vnd, p.recorded_by`,
    [now, BATCH],
  );
  const events = new EventsService();
  for (const p of rows) {
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, reason_code, occurred_at)
       VALUES ($1, $2, 'SM-12', $3, 'pending', 'expired', 'expire', 'system', NULL, 'expires_at', $4)`,
      [tx.ctx.organizationId, tx.ctx.propertyId, p.id, now],
    );
    await audit.recordMoney(tx, {
      action: 'payment.expired',
      entityType: 'payment',
      entityId: p.id,
      entityCode: p.code,
      before: { status: 'pending' },
      after: { status: 'expired', method: p.method, amountVnd: p.amount_vnd },
    });
    await events.publish(tx, 'payment.changed', p.id, {
      roles: ['owner', 'manager'],
      ...(p.recorded_by ? { userIds: [p.recorded_by] } : {}),
    });
  }
  return { expired: rows.length };
}
