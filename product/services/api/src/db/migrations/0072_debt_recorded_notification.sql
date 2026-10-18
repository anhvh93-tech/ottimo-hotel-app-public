-- 0072 (BE-A, R2 Sprint 4 tuần Ổn định – number PROPOSED by BE-A 18/10, ORC to confirm or renumber). BR-525 (DOM
-- 18/10 – G-4, `reviews/s4-money-recheck6.md`): a receipt reversed after check-out that leaves money to collect
-- records the guest's debt in the same transaction and tells OWN + MGR – the staff inbox kind `debt_recorded`
-- (OpenAPI StaffNotification.kind – ARC adds it to the contract). Schema only: the CHECK list of 0055 + the kind.
ALTER TABLE staff_notification DROP CONSTRAINT staff_notification_kind_check;
--> statement-breakpoint
ALTER TABLE staff_notification ADD CONSTRAINT staff_notification_kind_check CHECK (kind IN ('hold_expired',
  'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue',
  'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed',
  'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed',
  'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new',
  'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection',
  'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded'));
