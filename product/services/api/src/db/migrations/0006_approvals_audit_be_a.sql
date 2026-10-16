CREATE TABLE "approval_request" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"target_code" text,
	"folio_line_id" uuid,
	"amount_vnd" bigint NOT NULL,
	"limit_basis_vnd" bigint,
	"reason_code" text NOT NULL,
	"reason_note" text,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"required_role" text NOT NULL,
	"refund_account_enc" "bytea",
	"approver_id" uuid,
	"approver_role_snapshot" text,
	"approver_limit_snapshot" jsonb,
	"auth_method" text,
	"self_applied" boolean DEFAULT false NOT NULL,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"escalated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "approval_request_property_id_key" UNIQUE("property_id","id"),
	CONSTRAINT "approval_request_type_check" CHECK ("approval_request"."type" IN ('foc', 'special_discount', 'refund', 'contract_override', 'checkin_room_not_ready', 'late_checkout_conflict', 'meter_lower_than_previous', 'stocktake_variance', 'damage_pricing', 'quote_extension', 'no_show_restore', 'debt_on_checkout')),
	CONSTRAINT "approval_request_status_check" CHECK ("approval_request"."status" IN ('pending', 'approved', 'rejected', 'escalated', 'cancelled')),
	CONSTRAINT "approval_request_required_role_check" CHECK ("approval_request"."required_role" IN ('front_desk_lead', 'manager', 'owner')),
	CONSTRAINT "approval_request_amount_check" CHECK ("approval_request"."amount_vnd" >= 0),
	CONSTRAINT "approval_request_auth_method_check" CHECK ("approval_request"."auth_method" IS NULL OR "approval_request"."auth_method" IN ('password', 'pin')),
	CONSTRAINT "approval_request_no_self_approval" CHECK ("approval_request"."approver_id" IS NULL OR "approval_request"."approver_id" <> "approval_request"."requested_by" OR "approval_request"."self_applied" OR "approval_request"."approver_role_snapshot" IN ('owner', 'manager')),
	CONSTRAINT "approval_request_self_applied_check" CHECK (NOT "approval_request"."self_applied" OR ("approval_request"."approver_id" = "approval_request"."requested_by" AND "approval_request"."status" = 'approved')),
	CONSTRAINT "approval_request_decided_check" CHECK ("approval_request"."status" NOT IN ('approved', 'rejected') OR ("approval_request"."approver_id" IS NOT NULL AND "approval_request"."decided_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "entity_code" text;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_requested_by_fk" FOREIGN KEY ("organization_id","requested_by") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_approver_fk" FOREIGN KEY ("organization_id","approver_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_request_queue_idx" ON "approval_request" USING btree ("property_id","status","requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "approval_request_requester_idx" ON "approval_request" USING btree ("property_id","requested_by","requested_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "approval_request_approver_idx" ON "approval_request" USING btree ("property_id","approver_id","decided_at");--> statement-breakpoint
CREATE INDEX "audit_event_property_actor_idx" ON "audit_event" USING btree ("property_id","actor_user_id","occurred_at" DESC NULLS LAST);