-- 0100 (BE, R5 – FB-INV-012 go-live fix for v1.0.7: long-stay guests already in house before Desk; ARC contract
-- rounds/round-05/fb-inv-012/contract.md §12.7, SEC review SEC-on-arc-contract-12.md). ADDITIVE ONLY: no UPDATE/DELETE of
-- existing rows. Drafted by drizzle-kit from src/db/schema (head snapshot 0099 → prevId), completed by hand (parameter).
-- Apply order: idx 74, when = 0099 when + 2000 (rule of 0098). FB-INV-013 takes 0101 (ARC G8).
-- 1. reservation.checkin_backdated_on / _reason (§12.1.2, A127) + pair CHECK – nullable, no default: metadata only.
-- 2. payment_method_check widened to a SUPERSET (+ outside_desk, §12.2 G4) + payment_outside_desk_check: an outside-Desk
--    receipt is a statement charge, `not_required`, never in a shift, with its reason. Deviation from §12.7 #2 (BE): a
--    reversal row (A34 – reversePayment copies the method, no statement, no note) is accepted with reversal_of_id set.
-- 3. meter_reading.catch_up (§12.5, BR-LS-17) + CHECK (reason, approver, photo).
-- 4. config_parameter_def `long_stay_cleaning_fee_by_room` (§12.4 G6): OWN/MGR (A101), default {} – production
--    bootstrap writes no row, behaviour unchanged until OWN/MGR fills it.
-- 5. staff_notification_kind_check widened to a superset (+ backdated_stay, statement_settled_outside_desk), as 0093.
-- Rollback (image before this package) never reads the new columns / key; only an existing outside_desk receipt would
-- show its raw method code on the old Desk.
ALTER TABLE "payment" DROP CONSTRAINT "payment_method_check";--> statement-breakpoint
ALTER TABLE "staff_notification" DROP CONSTRAINT "staff_notification_kind_check";--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "checkin_backdated_on" date;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "checkin_backdated_reason" text;--> statement-breakpoint
ALTER TABLE "meter_reading" ADD COLUMN "catch_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_outside_desk_check" CHECK ("payment"."method" <> 'outside_desk' OR ("payment"."type" = 'charge' AND "payment"."reconciliation" = 'not_required' AND "payment"."shift_id" IS NULL AND ("payment"."reversal_of_id" IS NOT NULL OR ("payment"."billing_period_id" IS NOT NULL AND "payment"."note" IS NOT NULL))));--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_method_check" CHECK ("payment"."method" IN ('vietqr', 'bank_transfer', 'cash', 'card_pos', 'vnpay', 'momo', 'ota_collect', 'outside_desk'));--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_checkin_backdated_pair_check" CHECK (("reservation"."checkin_backdated_on" IS NULL AND "reservation"."checkin_backdated_reason" IS NULL) OR ("reservation"."checkin_backdated_on" IS NOT NULL AND char_length("reservation"."checkin_backdated_reason") BETWEEN 3 AND 300));--> statement-breakpoint
ALTER TABLE "staff_notification" ADD CONSTRAINT "staff_notification_kind_check" CHECK ("staff_notification"."kind" IN ('hold_expired', 'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new', 'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection', 'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored', 'debt_recorded', 'foc_stay_total_exceeded', 'website_request_new', 'website_request_cap_reached', 'website_request_overdue', 'website_request_linked_hold', 'public_booking_toggled', 'late_fee_post_review', 'hold_overdue_with_deposit', 'hold_overdue_cap', 'backdated_stay', 'statement_settled_outside_desk'));--> statement-breakpoint
ALTER TABLE "meter_reading" ADD CONSTRAINT "meter_reading_catch_up_check" CHECK (NOT "meter_reading"."catch_up" OR ("meter_reading"."late_reason" IS NOT NULL AND "meter_reading"."late_approved_by" IS NOT NULL AND "meter_reading"."photo_attachment_id" IS NOT NULL));
--> statement-breakpoint
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('long_stay_cleaning_fee_by_room', 'json', '{owner,manager}', 'BR-LS-07', false, NULL, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
