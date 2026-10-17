-- 0063 (drizzle draft from schema/approvals.ts, BE-B – R2 Sprint 4, Phản hồi & sửa sau S4-38; number from ORC 17/10):
-- OpenAPI 0.3.7 bổ sung 4 (openapi-0.3.7.md mục 15, erd 4.6) – `ApprovalRequest.autoCancelReason` gains
-- `no_show_restored`: B12 (restore of a no-show) auto-cancels the refund request the no-show created
-- (S438-CANCEL-03; it wrote `superseded` before). Still only on `status = 'cancelled'`. Runs as ottimo_owner
-- (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
ALTER TABLE "approval_request" DROP CONSTRAINT "approval_request_auto_cancel_reason_check";--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_auto_cancel_reason_check" CHECK ("approval_request"."auto_cancel_reason" IS NULL OR ("approval_request"."auto_cancel_reason" IN ('line_removed', 'reservation_cancelled', 'reservation_no_show', 'superseded', 'no_show_restored') AND "approval_request"."status" = 'cancelled'));
