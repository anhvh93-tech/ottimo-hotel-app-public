/**
 * Audit allowlists of the reservations module (SR-AUD-03, AuditEvent.before/after). No Nest import here, so EVERY process
 * that writes audit loads them: the api through reservations.module.ts, the worker and the admin CLIs through
 * src/audit-entities.ts. Until v1.0.0-rc.5 they ran only when the module file was imported, which the worker never
 * does (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3: J15 / J24 threw AuditEntityNotRegisteredError).
 */
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03): booking state/money facts only – no guest C2/C3 values.
defineAuditEntity('reservation', [
  'status',
  'roomNo',
  'arrivalDate',
  'departureDate',
  'channelCode',
  'conflictState',
  'externalContract',
  'totalRoomVnd',
  'depositRequiredVnd',
  'extraPersonFeeVnd',
  'nightlyRates',
  'rateSource',
  'monthlyRentVnd',
  'adults',
  'children6to11',
  'childrenUnder6',
  'reasonCode',
  'depositPaidVnd',
  'retainedVnd',
  'refundableVnd',
  'otaPenaltyVnd',
  'costVnd',
  // 0.3.7 bổ sung 4 (BR-416-06): `reservation.late_fee_instead_of_night` – the charge and both people.
  'amountVnd',
  'checkoutTime',
  'date',
  'confirmedBy',
  'channel',
  'authMethod',
  'approverRole',
  'focVnd',
]);
defineAuditEntity('room_block', ['status', 'startDate', 'endDatePlanned']);
