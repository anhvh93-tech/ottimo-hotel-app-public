/**
 * Audit allowlists of the folio module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through folio.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03) for money events written by this module (category money).
defineAuditEntity('folio', [
  'roomVnd',
  'extraPersonVnd',
  'nights',
  'commissionVnd',
  'depositPaidVnd',
  'depositRequiredVnd',
  'status',
  'reversedVnd',
  'feeVnd',
  'billNo',
  'totalVnd',
  'balanceDueVnd',
  // 0.3.6 bổ sung 2: night sync logged as folio.line_posted / line_reversed – `confirmed` | `resynced`.
  'sync',
  // 0.3.7 D1 S4-08: services reversed / kept by a cancellation or no-show.
  'serviceReversedVnd',
  'serviceRetainedVnd',
]);
defineAuditEntity('channel_fee', [
  'channelCode',
  'baseVnd',
  'ratePct',
  'amountEstimatedVnd',
  'amountActualVnd',
  'source',
]);
defineAuditEntity('folio_line', [
  'category',
  'amountVnd',
  'lineState',
  'relatedCategory',
  'reversedVnd',
  // BUG-R2-208 (ARC 16.31.1, SEC s1 D.4): numbers an A32 reduction on a folio with an open debt was decided on.
  'openDebtVnd',
  'windowVnd',
  'reducedVnd',
  // FB-R3-SEC-BE-B-03: the role at the time of the reduction.
  'actorRole',
]);
defineAuditEntity('invoice_request', ['buyerType', 'einvoiceStatus']);
// 0.3.7 D1 (S4-02/S4-18/S4-22): folio.foc_dormant / foc_restored / foc_suspended / foc_cancelled on the request.
defineAuditEntity('approval_request', [
  'approvalRequestId',
  'focState',
  'focCancelReason',
  'effectiveAmountVnd',
  'serviceDate',
  'reason',
  'from',
  // FB-R2-SEC-BE-80 (approval.applied_capped): a debt write-off applied up to the open debt.
  'appliedVnd',
  'openDebtVnd',
]);
// 0.3.6 B-29 (payments.confirmDeposit): short deposit accepted by MGR+.
defineAuditEntity('reservation', ['shortfallVnd', 'depositRequiredVnd', 'depositPaidVnd']);
// BR-433 (c) v0.4.0 – ESC-026 A: `folio.foc_stay_alerted` (numbers only, no guest data).
defineAuditEntity('reservation', ['stayWaiverVnd', 'thresholdVnd', 'itemCount', 'alertCount']);
defineAuditEntity('commission', [
  'status',
  'payeeType',
  'ratePct',
  'baseVnd',
  'amountVnd',
  'voidReason',
]);
