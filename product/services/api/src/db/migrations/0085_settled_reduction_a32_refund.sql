-- 0085 (BE-B, R3 Sprint 1 – Phản hồi & sửa, contract 0.3.8 bổ sung 3 + BR-433 (e) v0.4.3 – SEC FB-R3-SEC-FZ-02; number:
-- next after 0084 on local `main` 0281e20 – ORC to confirm at merge). Drafted by drizzle-kit from the .ts schema (head
-- snapshot 0084 → prevId), completed by hand (RLS + grants). Runs as ottimo_owner inside the migrator's single transaction.
-- - folio_settled_reduction: every A32 that REDUCES a line of a `settled` folio (reduction, who, role at the time) –
--   append-only (SELECT, INSERT only). A reduction by someone below the owner counts in the stay's Σ of ESC-026.
-- - approval_request.origin_actor_id: on a `refund` the server made from such an A32 (and on the one that replaces it,
--   `superseded`) – the person who made the A32: Σ of A32 refunds per folio (> protected basis → owner) and never its
--   approver (CHECK below, the app answers 403 SELF_APPROVAL_FORBIDDEN first). Written at INSERT only (SM-10).
CREATE TABLE "folio_settled_reduction" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"folio_id" uuid NOT NULL,
	"folio_line_id" uuid NOT NULL,
	"reduced_vnd" bigint NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_role" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "folio_settled_reduction_amount_check" CHECK ("folio_settled_reduction"."reduced_vnd" > 0),
	CONSTRAINT "folio_settled_reduction_role_check" CHECK ("folio_settled_reduction"."actor_role" IN ('front_desk', 'front_desk_lead', 'manager', 'owner'))
);
--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "origin_actor_id" uuid;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_folio_fk" FOREIGN KEY ("property_id","folio_id") REFERENCES "public"."folio"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_line_fk" FOREIGN KEY ("property_id","folio_line_id") REFERENCES "public"."folio_line"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_actor_fk" FOREIGN KEY ("organization_id","actor_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "folio_settled_reduction_folio_idx" ON "folio_settled_reduction" USING btree ("folio_id");--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_origin_check" CHECK ("approval_request"."origin_actor_id" IS NULL OR ("approval_request"."type" = 'refund' AND ("approval_request"."approver_id" IS NULL OR "approval_request"."approver_id" <> "approval_request"."origin_actor_id")));

--> statement-breakpoint
ALTER TABLE folio_settled_reduction ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_settled_reduction FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON folio_settled_reduction USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT ON folio_settled_reduction TO ottimo_app;
