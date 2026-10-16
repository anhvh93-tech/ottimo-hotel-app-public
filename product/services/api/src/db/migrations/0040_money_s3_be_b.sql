-- 0040 (custom, hand-written – ARC s3-contract 4.2; BE-B Sprint 3): money side of stay/checkout (OpenAPI 0.3.6).
-- folio_line: room_change_difference (E04-05), adjustment/evidence/post-checkout columns, one reversal per line.
-- payment: recorded_by_role snapshot (A-40), refund → approval_request (A-33, SEC F8, CHECK payer ≠ requester),
--   reconciliation separation (SEC F5: reconciler ≠ recorder ≠ confirmer; OWN self-reconcile flagged; cash
--   handed over by SAL/CTV never self-confirmed – A46a), VietQR over-balance reason (E15-03), bank reference.
-- approval_request: refund destination (masked parts + C3 envelope), refunded_vnd, no self-approval of refunds.
-- reservation: deposit shortfall accepted by MGR+ (B-29 / DOM BE-11 – logic in payments.confirmDeposit).
-- invoice_request (US-039, D16). c3_access_log.subject_type + refund_account. Catalogue keys
-- payment_receiving_account (SEC F3, owner only, re-auth), damage_catalog (BR-512).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts).

ALTER TABLE folio_line DROP CONSTRAINT folio_line_category_check;
--> statement-breakpoint
ALTER TABLE folio_line ADD CONSTRAINT folio_line_category_check CHECK (category IN ('room', 'early_checkin',
  'late_checkout', 'extra_person', 'minibar', 'fnb', 'laundry', 'cleaning', 'service_fee', 'utilities', 'penalty',
  'damage', 'cancellation_fee', 'no_show_fee', 'early_departure_fee', 'deposit_forfeit', 'discount', 'foc',
  'adjustment', 'room_change_difference'));
--> statement-breakpoint
ALTER TABLE folio_line
  ADD COLUMN charge_code text,
  ADD COLUMN reason text,
  ADD COLUMN note text,
  ADD COLUMN evidence_attachment_ids uuid[],
  ADD COLUMN post_checkout boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE folio_line ADD CONSTRAINT folio_line_reason_check
  CHECK (reason IS NULL OR char_length(reason) BETWEEN 3 AND 500);
--> statement-breakpoint
-- BR-008: a line is reversed at most once (two concurrent adjustments cannot both reverse it).
CREATE UNIQUE INDEX folio_line_one_reversal_key ON folio_line (reversal_of_id) WHERE reversal_of_id IS NOT NULL;
--> statement-breakpoint

ALTER TABLE payment
  ADD COLUMN recorded_by_role text,
  ADD COLUMN approval_requested_by uuid,
  ADD COLUMN self_reconciled boolean NOT NULL DEFAULT false,
  ADD COLUMN received_amount_vnd bigint,
  ADD COLUMN over_balance_reason text,
  ADD COLUMN bank_reference text;
--> statement-breakpoint
-- Snapshot of the recorder's role for the rows written before 0.3.6 (highest role in the property).
UPDATE payment p SET recorded_by_role = (
  SELECT upr.role FROM user_property_role upr
   WHERE upr.user_id = p.recorded_by AND upr.property_id = p.property_id
   ORDER BY array_position(ARRAY['owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff',
                                 'collaborator', 'housekeeping', 'maintenance'], upr.role)
   LIMIT 1)
 WHERE p.recorded_by IS NOT NULL AND p.recorded_by_role IS NULL;
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_recorded_by_role_check CHECK (recorded_by_role IS NULL OR
  recorded_by_role IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff', 'collaborator',
                       'housekeeping', 'maintenance'));
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_received_amount_check
  CHECK (received_amount_vnd IS NULL OR received_amount_vnd >= 0);
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_bank_reference_check
  CHECK (bank_reference IS NULL OR bank_reference ~ '^[A-Za-z0-9./_-]{1,64}$');
--> statement-breakpoint
-- SEC F8 / BR-522: a refund row always points at its approved `refund` request (reversal rows excepted),
-- and the request points only at refund rows.
ALTER TABLE payment ADD CONSTRAINT payment_refund_approval_check CHECK (
  (type = 'refund' AND (approval_request_id IS NOT NULL OR reversal_of_id IS NOT NULL))
  OR (type <> 'refund' AND approval_request_id IS NULL));
--> statement-breakpoint
-- A47a / PO 16/10: the person who pays a refund out is never the person who created the request.
ALTER TABLE payment ADD CONSTRAINT payment_refund_not_requester_check CHECK (
  approval_request_id IS NULL
  OR (approval_requested_by IS NOT NULL AND recorded_by IS NOT NULL AND recorded_by <> approval_requested_by));
--> statement-breakpoint
-- SEC F5: the reconciler differs from the recorder AND from the confirmer (user ids); only an owner may
-- reconcile what they recorded, flagged self_reconciled (audit + report).
ALTER TABLE payment ADD CONSTRAINT payment_reconcile_separation_check CHECK (
  reconciled_by IS NULL OR self_reconciled
  OR (reconciled_by IS DISTINCT FROM recorded_by AND reconciled_by IS DISTINCT FROM confirmed_by));
--> statement-breakpoint
-- A46a: cash a sale/CTV handed over is confirmed by someone else – no exception, owner included.
ALTER TABLE payment ADD CONSTRAINT payment_cash_handover_not_self_check CHECK (
  NOT self_reconciled OR NOT (method = 'cash' AND recorded_by_role IN ('sales_staff', 'collaborator')));
--> statement-breakpoint
-- erd 0.3.6: refund request owner snapshot is verified by a composite FK (cannot drift from the request).
ALTER TABLE approval_request ADD CONSTRAINT approval_request_requester_key UNIQUE (property_id, id, requested_by);
--> statement-breakpoint
ALTER TABLE payment ADD CONSTRAINT payment_approval_request_fk
  FOREIGN KEY (property_id, approval_request_id, approval_requested_by)
  REFERENCES approval_request (property_id, id, requested_by);
--> statement-breakpoint
CREATE INDEX payment_approval_request_idx ON payment (approval_request_id) WHERE approval_request_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX payment_list_idx ON payment (property_id, received_at, id);
--> statement-breakpoint

ALTER TABLE approval_request
  ADD COLUMN refund_method text,
  ADD COLUMN refund_bank_bin text,
  ADD COLUMN refund_account_last4 text,
  ADD COLUMN refund_account_key_id uuid,
  ADD COLUMN refund_destination_set_at timestamp with time zone,
  ADD COLUMN refund_destination_set_by uuid,
  ADD COLUMN refunded_vnd bigint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_method_check CHECK (
  refund_method IS NULL OR (type = 'refund' AND refund_method IN ('cash', 'bank_transfer', 'original_method')));
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_account_check CHECK (
  (refund_method = 'bank_transfer') OR (refund_account_enc IS NULL AND refund_account_last4 IS NULL));
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_last4_check CHECK (
  refund_account_last4 IS NULL OR refund_account_last4 ~ '^[0-9]{4}$');
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_bin_check CHECK (
  refund_bank_bin IS NULL OR refund_bank_bin ~ '^[0-9]{6}$');
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refunded_check CHECK (
  refunded_vnd >= 0 AND refunded_vnd <= amount_vnd AND (type = 'refund' OR refunded_vnd = 0));
--> statement-breakpoint
-- SEC F8: a refund is never approved by the person who requested it (no owner/manager exception).
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_no_self_approval CHECK (
  type <> 'refund' OR approver_id IS NULL OR approver_id <> requested_by);
--> statement-breakpoint

ALTER TABLE reservation
  ADD COLUMN deposit_shortfall_vnd bigint,
  ADD COLUMN deposit_shortfall_accepted_at timestamp with time zone,
  ADD COLUMN deposit_shortfall_accepted_by uuid,
  ADD COLUMN deposit_shortfall_reason text;
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_deposit_shortfall_check CHECK (
  (deposit_shortfall_accepted_at IS NULL AND deposit_shortfall_vnd IS NULL AND deposit_shortfall_accepted_by IS NULL
     AND deposit_shortfall_reason IS NULL)
  OR (deposit_shortfall_accepted_at IS NOT NULL AND deposit_shortfall_vnd > 0
     AND deposit_shortfall_accepted_by IS NOT NULL AND char_length(deposit_shortfall_reason) BETWEEN 3 AND 500));
--> statement-breakpoint

CREATE TABLE invoice_request (
  id uuid PRIMARY KEY NOT NULL,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  folio_id uuid NOT NULL,
  buyer_type text NOT NULL,
  company_name text,
  tax_code text,
  address text,
  email text,
  einvoice_status text NOT NULL DEFAULT 'not_requested',
  created_at timestamp with time zone NOT NULL,
  created_by uuid,
  updated_at timestamp with time zone NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT invoice_request_property_id_key UNIQUE (property_id, id),
  CONSTRAINT invoice_request_folio_key UNIQUE (folio_id),
  CONSTRAINT invoice_request_property_fk FOREIGN KEY (organization_id, property_id)
    REFERENCES property (organization_id, id),
  CONSTRAINT invoice_request_folio_fk FOREIGN KEY (property_id, folio_id) REFERENCES folio (property_id, id),
  CONSTRAINT invoice_request_buyer_type_check CHECK (buyer_type IN ('company', 'individual', 'retail')),
  CONSTRAINT invoice_request_company_check CHECK (buyer_type <> 'company'
    OR (company_name IS NOT NULL AND tax_code IS NOT NULL AND email IS NOT NULL)),
  CONSTRAINT invoice_request_tax_code_check CHECK (tax_code IS NULL OR tax_code ~ '^[0-9]{10}(-?[0-9]{3})?$'),
  CONSTRAINT invoice_request_status_check CHECK (einvoice_status IN ('not_requested', 'pending', 'issued', 'failed'))
);
--> statement-breakpoint
ALTER TABLE invoice_request ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE invoice_request FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON invoice_request USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON invoice_request TO ottimo_app;
--> statement-breakpoint

ALTER TABLE c3_access_log DROP CONSTRAINT c3_access_log_subject_type_check;
--> statement-breakpoint
ALTER TABLE c3_access_log ADD CONSTRAINT c3_access_log_subject_type_check CHECK (subject_type IN ('guest_document',
  'document_image', 'door_credential', 'payee_account', 'portal_data', 'mfa_secret', 'refund_account'));
--> statement-breakpoint

-- K8 / BR-008: new state columns only (amounts stay immutable). received_at/note/attachment_id are filled
-- when a pending VietQR is confirmed (confirmPaymentReceived – the money arrived then).
GRANT UPDATE (self_reconciled, received_amount_vnd, received_at, note, attachment_id) ON payment TO ottimo_app;
--> statement-breakpoint

INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('payment_receiving_account', 'json', '{owner}', 'BR-521', false, NULL, NULL),
  ('damage_catalog', 'json', '{owner,manager}', 'BR-512', false, NULL, NULL)
ON CONFLICT (key) DO NOTHING;
