-- 0085 (BE-B, R3 Sprint 1 – Phản hồi & sửa, contract 0.3.8 bổ sung 3 + BR-433 (e) v0.4.3 – SEC FB-R3-SEC-FZ-02, then
-- ARC/SEC ADD3-01 (rewritten in place – not merged yet, ARC: no 0086); number confirmed by ARC 24/10). Drafted by drizzle-kit
-- from the .ts schema (head snapshot 0084 → prevId), completed by hand (RLS, grants, trigger). Runs as ottimo_owner inside
-- the migrator's single transaction.
-- - folio_settled_reduction: every A32 that REDUCES a line of a `settled` folio below its amount at check-out (waiver part,
--   who, role at the time) – append-only (SELECT, INSERT only). Below the owner it counts in the stay's Σ of ESC-026.
-- - approval_request.origin_actor_ids: on a `refund` of a folio with such an A32 below the owner – every person who made
--   one (and the one whose A32 made it); none of them ever approves it (CHECK below; the app answers 403 first).
-- - approval_request.refund_source: `a32` (made by the server from an A32 reduction) | `other`; NULL before 0085.
-- Both are written at INSERT only: the app has column-level UPDATE on approval_request (0042) without them, and the
-- trigger below refuses a change even by the owner role (SEC FB-R3-SEC-ADD3-03).
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
ALTER TABLE "approval_request" ADD COLUMN "origin_actor_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_request" ADD COLUMN "refund_source" text;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_property_fk" FOREIGN KEY ("organization_id","property_id") REFERENCES "public"."property"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_folio_fk" FOREIGN KEY ("property_id","folio_id") REFERENCES "public"."folio"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_line_fk" FOREIGN KEY ("property_id","folio_line_id") REFERENCES "public"."folio_line"("property_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folio_settled_reduction" ADD CONSTRAINT "folio_settled_reduction_actor_fk" FOREIGN KEY ("organization_id","actor_id") REFERENCES "public"."app_user"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "folio_settled_reduction_folio_idx" ON "folio_settled_reduction" USING btree ("folio_id");--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_origin_scope_check" CHECK (cardinality("approval_request"."origin_actor_ids") = 0 OR "approval_request"."type" = 'refund');--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_origin_check" CHECK ("approval_request"."approver_id" IS NULL OR NOT ("approval_request"."approver_id" = ANY("approval_request"."origin_actor_ids")));--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_refund_source_check" CHECK ("approval_request"."refund_source" IS NULL OR ("approval_request"."type" = 'refund' AND "approval_request"."refund_source" IN ('a32', 'other')));

--> statement-breakpoint
ALTER TABLE folio_settled_reduction ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio_settled_reduction FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON folio_settled_reduction USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT ON folio_settled_reduction TO ottimo_app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION approval_request_refund_origin_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.origin_actor_ids IS DISTINCT FROM OLD.origin_actor_ids
     OR NEW.refund_source IS DISTINCT FROM OLD.refund_source THEN
    RAISE EXCEPTION 'approval_request.origin_actor_ids / refund_source are written at INSERT only (BR-433 (e))'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER approval_request_refund_origin_immutable BEFORE UPDATE ON approval_request
  FOR EACH ROW EXECUTE FUNCTION approval_request_refund_origin_immutable();
