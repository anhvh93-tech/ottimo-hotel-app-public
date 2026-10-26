-- 0088 (drizzle draft from schema/frontdesk.ts, completed by hand – BE-B, R3 Phản hồi & sửa, v1.0 patch ESC-031).
-- Number: next after 0087 on `main` at 26/10 (journal `when` after 0087, snapshot = 0087 + this CHECK only).
-- ESC-024 B (INV 22/10) / ESC-031 (INV 26/10 "vá luôn"): the desk records the late charge of one night without a
-- manager password at the counter; OWN + MGR are told (`late_fee_post_review`) and review it within the
-- post-checkout window (BR-416 (3)(4)). This migration only adds that notification kind. ARC S1-09: the CHECK list =
-- the list on `main` (0086) + the new kind ONLY (test/money-limit-basis-architecture.test.ts compares this SQL with
-- STAFF_NOTIFICATION_KINDS). No table, no data change.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
ALTER TABLE "staff_notification" DROP CONSTRAINT "staff_notification_kind_check";--> statement-breakpoint
ALTER TABLE "staff_notification" ADD CONSTRAINT "staff_notification_kind_check" CHECK ("staff_notification"."kind" IN ('hold_expired', 'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new', 'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection', 'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded', 'foc_stay_total_exceeded', 'website_request_new', 'website_request_cap_reached', 'website_request_overdue', 'website_request_linked_hold', 'public_booking_toggled', 'late_fee_post_review'));
