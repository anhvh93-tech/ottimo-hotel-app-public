/**
 * Audit allowlists of the payments module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through payments.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

defineAuditEntity('payment', [
  // 0.3.7 bổ sung 4 (DOM (f)): a VietQR confirmed above what was due for its purpose.
  'overVnd',
  'code',
  'type',
  'method',
  'amountVnd',
  'status',
  'reconciliation',
  'recordedByRole',
  'selfReconciled',
  'receivedAmountVnd',
  // PO 17/10 (SEC-37): an OWN approved and paid the same transfer refund ("OWN tự duyệt và chi").
  'ownSelfApprovedAndPaid',
  // BR-525 (G-4): the debt a reversal after check-out left (folio balance due, recorded by the front desk).
  'debtVnd',
  // ARC 16.26 (BR-525): a receipt collecting the debt of a checked-out stay.
  'debtCollection',
]);
defineAuditEntity('deposit_notice', ['amountVnd', 'status']);
// Refund destination events (no C3: method and the last 4 digits only – D15 masked).
defineAuditEntity('approval_request', ['refundMethod', 'accountNoLast4']);
