/**
 * Audit allowlists of the frontdesk module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through frontdesk.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlist of the front desk facts (SR-AUD-03): no guest C2/C3, no door code (SEC D2).
defineAuditEntity('reservation', [
  'cardsIssued',
  'doorAccessHandedOver',
  'roomStatusBefore',
  'agreedCheckoutTime',
  'lateSurchargeVnd',
  'tierPct',
  'checkoutMode',
  'debtVnd',
  // ARC 16.31.2 (BUG-R2-209/210): open debt before/after a debt record (numbers only).
  'openDebtVnd',
  'actorRole',
  'debtOutcome',
  'balanceDueVnd',
  'dueDate',
  'replyType',
  'channel',
  'confirmedTime',
  'partyRole',
  'priceAgeBand',
  // ESC-024 B / ESC-031 (BE-B): end of the post-checkout window the manager reviews a desk-recorded late charge in.
  'reviewDueAt',
  // OpenAPI 0.3.9 B16 (FB-R3-SEC-ARC-05): the amounts the desk confirmed in the preview (numbers only).
  'previewConfirmed',
  'expectedRefundVnd',
  'expectedFeeVnd',
  // B16 `reservation.early_departure` (BR-428 v0.4.8 (e), numbers / booking codes only): the facts of the money log
  // line – earlier keys were dropped by the allowlist.
  'droppedNetVnd',
  'droppedOtaGrossVnd',
  'droppedExtraPersonVnd',
  'extraPersonRefundVnd',
  'extraPersonReversedVnd',
  'roomChangeDifferenceVnd',
  'roomChangeDifferenceReversedVnd',
  'refundablePaidVnd',
  'refundRequestedVnd',
  'childBookings',
  'noticeGivenAt',
  'noticeEvidence',
]);
