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
]);
