/**
 * Audit allowlists of the billing module (FB-INV-012, SR-AUD-03, contract mục 9.5). No Nest import here, so every
 * process that writes audit loads them (src/audit-entities.ts). Numbers and states only – no guest data, no note.
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

defineAuditEntity('meter_reading', [
  'reservationId',
  'roomId',
  'kind',
  'periodMonth',
  'readOn',
  'electricity',
  'water',
  // INV 17/11: opening − previous closing (vacancy loss, not billed).
  'electricityGap',
  'waterGap',
  'electricityException',
  'waterException',
  'photoWaived',
  // ARC BE-190-01 / 03: opening below the previous closing saved after the warning; reading typed after its window.
  'acknowledgedLower',
  'late',
  'voided',
]);

defineAuditEntity('billing_period', [
  'status',
  'code',
  'month',
  'kind',
  'totalVnd',
  'paidVnd',
  'balanceVnd',
  'warnings',
  'paymentId',
  'method',
  'amountVnd',
  // SEC BE-190-02: money decided on a draft (who set it is the actor of billing_period.updated).
  'priorAdjustmentVnd',
  'excludedFolioLineCount',
]);
