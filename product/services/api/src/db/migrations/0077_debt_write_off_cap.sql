-- 0077 (BE-B, R2 Sprint 4 vòng sửa 8 – FB-R2-SEC-BE-80 Blocker, BR-525; ORC 18/10; drizzle-kit draft, rule 4.2a):
-- a `debt_write_off` FOC is capped again when it is APPLIED (min(approved, open debt then)) and that cap stays
-- (`applied_cap_vnd` – a later FOC re-sync never applies more); approved when no debt is left → cancelled with
-- the new auto-cancel reason `debt_cleared` (`no_show_restored` of 0063 kept).
ALTER TABLE "approval_request" DROP CONSTRAINT "approval_request_auto_cancel_reason_check";--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "applied_cap_vnd" bigint;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_applied_cap_check" CHECK ("approval_request"."applied_cap_vnd" IS NULL OR ("approval_request"."applied_cap_vnd" >= 0 AND "approval_request"."type" = 'foc'));--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_auto_cancel_reason_check" CHECK ("approval_request"."auto_cancel_reason" IS NULL OR ("approval_request"."auto_cancel_reason" IN ('line_removed', 'reservation_cancelled', 'reservation_no_show', 'superseded', 'no_show_restored', 'debt_cleared') AND "approval_request"."status" = 'cancelled'));--> statement-breakpoint
-- Column grant (pattern 0055/0060: approval_request is updated column by column by the app role).
GRANT UPDATE (applied_cap_vnd) ON approval_request TO ottimo_app;
