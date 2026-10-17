/**
 * Closed set of `money` audit actions (OpenAPI 0.3.6 bổ sung 2 – `AuditEvent.action`, UXD FB-R2-UXD-FE-S3-09):
 * the money log screen has one sentence per action (`mlog.a_*`). Adding an action = a contract change.
 * test/module-boundaries.test.ts keeps this list equal to the contract; AuditService refuses others.
 */
export const MONEY_AUDIT_ACTIONS = [
  'payment.recorded',
  'payment.qr_created',
  'payment.confirmed_received',
  'payment.expired',
  'payment.reconciled',
  'payment.cash_handover_confirmed',
  'payment.reversed',
  'payment.ota_collected',
  'payment.ota_collect_adjusted',
  'folio.line_posted',
  'folio.line_reversed',
  'folio_line.adjusted',
  'folio.settled',
  'folio.stay_reversed',
  'folio.foc_requested',
  'folio.foc_posted',
  'folio.foc_rejected',
  // OpenAPI 0.3.7 bổ sung D1 (BR-433/434 v0.3.5, BR-315 (g) – S4-02/S4-18/S4-22): FOC lifecycle.
  'folio.foc_cancelled',
  'folio.foc_dormant',
  'folio.foc_suspended',
  'folio.foc_restored',
  'folio.damage_posted',
  'folio.damage_rejected',
  'refund.destination_set',
  'refund.paid',
  'refund.cash_paid',
  'deposit.shortfall_accepted',
  'reservation.deposit_confirmed',
  'reservation.no_show_deposit_retained',
  'reservation.cancellation_fee',
  'reservation.debt_on_checkout',
  'reservation.early_departure',
  'reservation.extended',
  'reservation.prior_night_added',
  'reservation.extra_night_on_checkout',
  // 0.3.7 bổ sung 4 (BR-416-06, ARC 16.6 (d)): late charge of one night, OWN/MGR confirmed at the desk.
  'reservation.late_fee_instead_of_night',
  'reservation.priced',
  'reservation.repriced',
  'reservation.room_change_repriced',
  'reservation.closer_changed',
  'commission.projected',
  'commission.earned',
  'commission.voided',
  'channel_fee.recorded',
  'channel_fee.updated',
  'overbooking.relocation_cost',
  'approval.requested',
  'approval.self_applied',
  'approval.approved',
  'approval.rejected',
  'approval.escalated',
  'approval.reopened',
  'approval.cancelled',
  'config.changed',
] as const;

export type MoneyAuditAction = (typeof MONEY_AUDIT_ACTIONS)[number];

const SET: ReadonlySet<string> = new Set(MONEY_AUDIT_ACTIONS);

export function isMoneyAuditAction(action: string): action is MoneyAuditAction {
  return SET.has(action);
}
