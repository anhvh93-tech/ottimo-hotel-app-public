-- 0093 (drizzle draft from schema/frontdesk.ts, completed by hand – BE-B, R4 v1.0.4 P4-10 `v104/be-holds`).
-- BUG-R3-041 / WA-04 (DOM-on-PO-v1.0.0-docs A.5): J1 `hold.expire` now writes staff inbox rows (events.notify:
-- inbox + SSE `notification.created`) instead of a push-only outbox row, for `hold_expired` (already a kind),
-- `hold_overdue_with_deposit` and `hold_overdue_cap` (the two new kinds below; OpenAPI 0.3.12 P4-00 (a)).
-- ARC S1-09: the CHECK list = the list of 0088 + the new kinds ONLY (test/money-limit-basis-architecture.test.ts
-- compares this SQL with STAFF_NOTIFICATION_KINDS). No table, no data change – only widens the CHECK.
-- Number (plan-v1.0.4 2.2): 0093 is reserved for P4-10; 0092 is LP-v2 (on `main@L`). Cut from `origin/main`
-- (journal ends at 0091), so here: journal idx 68, `when` = 0091 + 2000, snapshot prevId = 0091. After the rebase on
-- `main@L`: idx 69, `when` = 0092 + 2000, snapshot regenerated from 0092 (rounds/round-04/outputs/BE/v104-be-holds.md).
-- Rollback: additive only; v1.0.3 never writes the new kinds → rolling the image back to sha-da6d6f3dc22b needs no
-- DB rollback.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
ALTER TABLE "staff_notification" DROP CONSTRAINT "staff_notification_kind_check";--> statement-breakpoint
ALTER TABLE "staff_notification" ADD CONSTRAINT "staff_notification_kind_check" CHECK ("staff_notification"."kind" IN ('hold_expired', 'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new', 'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection', 'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded', 'foc_stay_total_exceeded', 'website_request_new', 'website_request_cap_reached', 'website_request_overdue', 'website_request_linked_hold', 'public_booking_toggled', 'late_fee_post_review', 'hold_overdue_with_deposit', 'hold_overdue_cap'));
