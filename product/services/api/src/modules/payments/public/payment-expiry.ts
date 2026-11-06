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
  const { rows } = await tx.query<ExpiredRow>(
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
  await afterExpiry(tx, audit, rows, now, { reasonCode: 'expires_at' });
  return { expired: rows.length };
}

type ExpiredRow = {
  id: string;
  code: string;
  method: string;
  amount_vnd: number;
  recorded_by: string | null;
};

/** SM-12 history, money audit `payment.expired`, SSE `payment.changed` (MGR+ and the recorder) – ids only. */
async function afterExpiry(
  tx: Tx,
  audit: AuditService,
  rows: readonly ExpiredRow[],
  now: Date,
  why: { reasonCode: string; reservationStatus?: string },
): Promise<void> {
  const events = new EventsService();
  for (const p of rows) {
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, reason_code, occurred_at)
       VALUES ($1, $2, 'SM-12', $3, 'pending', 'expired', 'expire', 'system', NULL, $5, $4)`,
      [tx.ctx.organizationId, tx.ctx.propertyId, p.id, now, why.reasonCode],
    );
    await audit.recordMoney(tx, {
      action: 'payment.expired',
      entityType: 'payment',
      entityId: p.id,
      entityCode: p.code,
      before: { status: 'pending' },
      after: {
        status: 'expired',
        method: p.method,
        amountVnd: p.amount_vnd,
        ...(why.reservationStatus ? { reservationStatus: why.reservationStatus } : {}),
      },
    });
    await events.publish(tx, 'payment.changed', p.id, {
      roles: ['owner', 'manager'],
      ...(p.recorded_by ? { userIds: [p.recorded_by] } : {}),
    });
  }
}

/**
 * 0.3.13 bổ sung 1 (V5-48 "nên làm cùng", SEC-on-bug-r5-002 3.1): J1, B5, B10, B11 (and the BR-312 relocation) close
 * the booking that owns a folio → its VietQR still `pending` expires in the SAME transaction, so the Desk never
 * shows an old QR as waiting on a closed booking (`confirmPaymentReceived` answers 409 there anyway). Only the
 * folio's PRIMARY booking: another booking of a shared folio leaving keeps the folio's QR. The caller holds the
 * booking and the folio locks (MoneyBridge.voided, after FolioStaySync.voidStay); money already received is never
 * touched (`succeeded` rows stay). Actor `system` in SM-12 (reason `reservation_closed`), as J24.
 */
export async function expirePendingQrOnClosure(
  tx: Tx,
  audit: AuditService,
  input: { folioId: string; reservationId: string; reservationStatus: string },
  now: Date,
): Promise<{ expiredPaymentIds: string[] }> {
  const { rows } = await tx.query<ExpiredRow>(
    `UPDATE payment p SET status = 'expired', updated_at = $3, version = p.version + 1
       FROM folio f
      WHERE p.folio_id = $1 AND f.id = p.folio_id AND f.primary_reservation_id = $2
        AND p.method = 'vietqr' AND p.status = 'pending'
     RETURNING p.id, p.code, p.method, p.amount_vnd, p.recorded_by`,
    [input.folioId, input.reservationId, now],
  );
  await afterExpiry(tx, audit, rows, now, {
    reasonCode: 'reservation_closed',
    reservationStatus: input.reservationStatus,
  });
  return { expiredPaymentIds: rows.map((r) => r.id) };
}
