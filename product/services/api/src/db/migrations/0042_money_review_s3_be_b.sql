-- 0042 (custom, hand-written – ARC s3-contract 4.2 / 4.2a; BE-B Sprint 3 Response & fix). Runs as ottimo_owner.
-- (1) DOM BE-21: folio_line.label_params – params of the printable label (`labelKey` bill.line.*).
-- (2) FB-R2-ARC-BE-S3-10: 0040's backfill of payment.recorded_by_role matched 0 rows under FORCE RLS
--     (app_current_property() is NULL while migrating) – redone with RLS off (pattern of 0016/0018), then
--     every recorded payment must carry the role snapshot.
-- (3) FB-R2-ARC-BE-S3-12 / FB-R2-SEC-BE-42 (SEC F5): separation of duties held by the DB, not only by code:
--     reconciler's role snapshot, self_reconciled derived from the user ids and allowed to the owner only,
--     a reconciled/disputed receipt names its reconciler, NULL roles no longer slip through the cash-handover
--     CHECK, a payment is reversed at most once (FB-R2-ARC-BE-S3-02).
-- (4) FB-R2-ARC-BE-S3-12 (SEC F8): approval_request refund account CHECK without the NULL hole; column-level
--     UPDATE (requested_by / amount_vnd / type / target… are never rewritten – SM-10).
-- (5) FB-R2-ARC-BE-S3-32: column-level UPDATE on item and invoice_request (least privilege).
-- (6) PO 17/10 (decision-log, SEC-37): on a TRANSFER refund an OWN may set the destination, approve and pay the
--     same refund; everyone else keeps requester ≠ approver-of-destination ≠ payer. Cash refunds unchanged.

ALTER TABLE folio_line ADD COLUMN label_params jsonb;
--> statement-breakpoint
ALTER TABLE folio_line ADD CONSTRAINT folio_line_label_params_check
  CHECK (label_params IS NULL OR jsonb_typeof(label_params) = 'object');
--> statement-breakpoint

ALTER TABLE payment ADD COLUMN reconciled_by_role text;
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_reconciled_by_role_check CHECK (reconciled_by_role IS NULL OR
  reconciled_by_role IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff', 'collaborator',
                         'housekeeping', 'maintenance'));
--> statement-breakpoint

-- FORCE RLS binds the table owner too: backfill with RLS off (no app session is connected while migrating).
ALTER TABLE payment NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_property_role NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payment DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_property_role DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Highest role of the user in the property (live roles first). A user with no role left there is recorded
-- as 'collaborator': the strictest snapshot (cash handed over is confirmed by someone else – A46a).
UPDATE payment p SET recorded_by_role = COALESCE((
  SELECT upr.role FROM user_property_role upr
   WHERE upr.user_id = p.recorded_by AND upr.property_id = p.property_id
   ORDER BY upr.revoked_at IS NOT NULL,
            array_position(ARRAY['owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff',
                                 'collaborator', 'housekeeping', 'maintenance'], upr.role)
   LIMIT 1), 'collaborator')
 WHERE p.recorded_by IS NOT NULL AND p.recorded_by_role IS NULL;
--> statement-breakpoint
-- Only the owner ever reconciled their own entry (0040 code rule) → 'owner' for flagged rows.
UPDATE payment p SET reconciled_by_role = CASE WHEN p.self_reconciled THEN 'owner' ELSE COALESCE((
  SELECT upr.role FROM user_property_role upr
   WHERE upr.user_id = p.reconciled_by AND upr.property_id = p.property_id
   ORDER BY upr.revoked_at IS NOT NULL,
            array_position(ARRAY['owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff',
                                 'collaborator', 'housekeeping', 'maintenance'], upr.role)
   LIMIT 1), 'front_desk') END
 WHERE p.reconciled_by IS NOT NULL AND p.reconciled_by_role IS NULL;
--> statement-breakpoint
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_property_role ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payment FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_property_role FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

-- A payment written by a person carries that person's role (system rows – OTA collect – have neither).
ALTER TABLE payment ADD CONSTRAINT payment_recorded_by_role_required_check
  CHECK (recorded_by IS NULL OR recorded_by_role IS NOT NULL);
--> statement-breakpoint
-- A reconciled / disputed receipt names who reconciled it and that person's role.
ALTER TABLE payment ADD CONSTRAINT payment_reconciled_by_check CHECK (
  (reconciliation NOT IN ('reconciled', 'disputed') OR reconciled_by IS NOT NULL)
  AND (reconciled_by IS NULL OR reconciled_by_role IS NOT NULL));
--> statement-breakpoint
-- SEC F5: self_reconciled is a fact (reconciler = recorder or confirmer), not a flag the app may set…
ALTER TABLE payment ADD CONSTRAINT payment_self_reconciled_fact_check CHECK (
  self_reconciled = (COALESCE(reconciled_by = recorded_by, false) OR COALESCE(reconciled_by = confirmed_by, false)));
--> statement-breakpoint
-- …and only an owner may reconcile what they recorded/confirmed (flagged for the report).
ALTER TABLE payment ADD CONSTRAINT payment_self_reconcile_owner_check
  CHECK (NOT self_reconciled OR reconciled_by_role = 'owner');
--> statement-breakpoint
-- A46a without the NULL hole of 0040 (a NULL role made `IN (…)` unknown → the CHECK passed).
ALTER TABLE payment DROP CONSTRAINT payment_cash_handover_not_self_check;
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_cash_handover_not_self_check CHECK (
  NOT self_reconciled
  OR NOT (method = 'cash' AND COALESCE(recorded_by_role, '') IN ('sales_staff', 'collaborator')));
--> statement-breakpoint
-- BR-008 / G-12: a payment is reversed at most once (two concurrent reversals cannot both pass).
CREATE UNIQUE INDEX payment_one_reversal_key ON payment (reversal_of_id) WHERE reversal_of_id IS NOT NULL;
--> statement-breakpoint
GRANT UPDATE (reconciled_by_role) ON payment TO ottimo_app;
--> statement-breakpoint
-- (6) A47a / PO 16/10 + 17/10: the requester never pays a refund out – except an OWN paying a transfer.
ALTER TABLE payment DROP CONSTRAINT payment_refund_not_requester_check;
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_refund_not_requester_check CHECK (
  approval_request_id IS NULL
  OR (approval_requested_by IS NOT NULL AND recorded_by IS NOT NULL
      AND (recorded_by <> approval_requested_by OR (recorded_by_role = 'owner' AND method <> 'cash'))));
--> statement-breakpoint

-- SEC F8: an encrypted account (or its last 4 digits) only with refund_method = bank_transfer – a NULL method
-- no longer passes.
ALTER TABLE approval_request DROP CONSTRAINT approval_request_refund_account_check;
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_account_check CHECK (
  refund_method IS NOT DISTINCT FROM 'bank_transfer'
  OR (refund_account_enc IS NULL AND refund_account_last4 IS NULL));
--> statement-breakpoint
-- (6) 0031 (BE-A) SEC-37 rule with the OWN exception of PO 17/10: who set the destination does not approve it,
-- unless an OWN approved a refund that is not paid in cash.
ALTER TABLE approval_request DROP CONSTRAINT approval_request_refund_destination_not_approver;
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_destination_not_approver CHECK (
  type <> 'refund' OR approver_id IS NULL OR refund_destination_set_by IS NULL
  OR approver_id <> refund_destination_set_by
  OR (approver_role_snapshot = 'owner' AND COALESCE(refund_method, 'cash') <> 'cash'));
--> statement-breakpoint
-- SM-10: what was asked (type, amount, requester, target, reason) never changes after submission; only the
-- decision, escalation and the refund columns written by payments (ARC B-4) move.
REVOKE UPDATE ON approval_request FROM ottimo_app;
--> statement-breakpoint
GRANT UPDATE (status, required_role, escalated_at, approver_id, approver_role_snapshot, approver_limit_snapshot,
  auth_method, decided_at, decision_note, refund_method, refund_bank_bin, refund_account_last4, refund_account_enc,
  refund_account_key_id, refund_destination_set_at, refund_destination_set_by, refunded_vnd, updated_at, version)
  ON approval_request TO ottimo_app;
--> statement-breakpoint

-- FB-R2-ARC-BE-S3-32: catalogue item – code/kind/property never move; invoice request – only the buyer data.
REVOKE UPDATE ON item FROM ottimo_app;
--> statement-breakpoint
GRANT UPDATE (name, unit, cost_price_vnd, sale_price_vnd, minibar_standard_qty, min_stock_qty, is_active,
  updated_at, version) ON item TO ottimo_app;
--> statement-breakpoint
REVOKE UPDATE ON invoice_request FROM ottimo_app;
--> statement-breakpoint
GRANT UPDATE (buyer_type, company_name, tax_code, address, email, einvoice_status, updated_at, version)
  ON invoice_request TO ottimo_app;
