-- 0055 (custom, hand-written – erd 16, ARC s3-contract 4.2a; BE-B, R2 Sprint 4 D1 freeze): the ONE shared
-- migration of OpenAPI 0.3.7 (+ D1 freeze) – ORC decision 17/10 #4. Every new column / CHECK of erd 0.3.7
-- on tables that already exist: 4.1 room, 4.4 guest, 4.5 reservation, 4.6 folio + approval_request,
-- 4.8 hk_task, 4.9 room_block, BE-ARC-06 staff_notification (OpenAPI StaffNotification.kind/refType 0.3.7).
-- Columns, defaults, constraints and grants ONLY – no behaviour: every default keeps the pre-0.3.7 meaning.
-- Not here (owner stream, next number from ORC): the tables work_order / inspection / guest_request (R2
-- tables never migrated – erd 4.8/4.9/4.11 incl. their 0.3.7 columns), catalogue keys of erd 9.x
-- (wo_done_photo_required_severities, room_move_pricing; document_profile_retention_months = A.3, BE-C + ARC
-- with OpenAPI x-security-parameters in the same PR). attention_event.kind has no DB CHECK (allow-listed in
-- code, events.service.ts) – the new kinds ota_no_show_report / closed_reservation_credit need no DDL.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.

-- ───────────── 4.1 room.public_room_type (BR-012 (1), (4); S4-52) ─────────────
ALTER TABLE room ADD COLUMN public_room_type text;
--> statement-breakpoint
ALTER TABLE room ADD CONSTRAINT room_public_room_type_check
  CHECK (public_room_type IS NULL OR char_length(public_room_type) BETWEEN 1 AND 60);
--> statement-breakpoint

-- ───────────── 4.4 guest: profiles "from documents" (draft A.2, SEC s3 mục 7) ─────────────
ALTER TABLE guest
  ADD COLUMN source text NOT NULL DEFAULT 'desk',
  ADD COLUMN last_stay_checkout_at timestamptz;
--> statement-breakpoint
ALTER TABLE guest ADD CONSTRAINT guest_source_check
  CHECK (source IN ('desk', 'ota', 'document', 'guest_app', 'import'));
--> statement-breakpoint
-- Backfill (pattern 0016): FORCE RLS binds the owner too, so RLS is off for the backfill and the counts only.
ALTER TABLE guest NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE guest DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- A live profile without phone and e-mail can only come from an OTA booking (createGuest requires a contact).
UPDATE guest SET source = 'ota'
 WHERE phone_e164 IS NULL AND email_norm IS NULL AND anonymized_at IS NULL AND merged_into_id IS NULL;
--> statement-breakpoint
DO $$
DECLARE n bigint;
BEGIN
  SELECT count(*) INTO n FROM guest
   WHERE NOT (source <> 'desk' OR phone_e164 IS NOT NULL OR email_norm IS NOT NULL OR anonymized_at IS NOT NULL
              OR merged_into_id IS NOT NULL);
  IF n > 0 THEN RAISE EXCEPTION '0055: % guest rows violate guest_contact_source_check', n; END IF;
  SELECT count(*) INTO n FROM guest
   WHERE id_doc_hmac IS NOT NULL AND (crm_consent <> 'granted' OR id_doc_hmac !~ '^v1:[0-9a-f]{64}$');
  IF n > 0 THEN
    RAISE EXCEPTION '0055: % guest rows violate guest_id_doc_hmac_consent_check / _format_check', n;
  END IF;
  SELECT count(*) INTO n FROM guest WHERE source = 'document';
  IF n > 0 THEN RAISE EXCEPTION '0055: % guest rows already have source = document', n; END IF;
END $$;
--> statement-breakpoint
ALTER TABLE guest ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE guest FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- v1 blind index of the ID number (SEC s3 7.3): 'v1:' + HMAC-SHA256 hex.
ALTER TABLE guest ADD CONSTRAINT guest_id_doc_hmac_format_check
  CHECK (id_doc_hmac IS NULL OR id_doc_hmac ~ '^v1:[0-9a-f]{64}$') NOT VALID;
--> statement-breakpoint
-- CHECK 1: a desk profile always has a contact (anonymised / merged profiles excepted).
ALTER TABLE guest ADD CONSTRAINT guest_contact_source_check
  CHECK (source <> 'desk' OR phone_e164 IS NOT NULL OR email_norm IS NOT NULL OR anonymized_at IS NOT NULL
         OR merged_into_id IS NOT NULL) NOT VALID;
--> statement-breakpoint
-- CHECK 2 (SEC F03 at DB level): the ID blind index only with the P05 consent.
ALTER TABLE guest ADD CONSTRAINT guest_id_doc_hmac_consent_check
  CHECK (id_doc_hmac IS NULL OR crm_consent = 'granted') NOT VALID;
--> statement-breakpoint
-- CHECK 3 (last safety net, SEC 7.1): a `document` profile without P05 keeps no extra personal data.
ALTER TABLE guest ADD CONSTRAINT guest_document_minimal_check
  CHECK (source <> 'document' OR crm_consent = 'granted'
         OR (date_of_birth IS NULL AND gender IS NULL AND id_doc_last4 IS NULL AND id_doc_hmac IS NULL
             AND free_note IS NULL AND coalesce(cardinality(tags), 0) = 0
             AND coalesce(cardinality(service_notes), 0) = 0)) NOT VALID;
--> statement-breakpoint
ALTER TABLE guest VALIDATE CONSTRAINT guest_id_doc_hmac_format_check;
--> statement-breakpoint
ALTER TABLE guest VALIDATE CONSTRAINT guest_contact_source_check;
--> statement-breakpoint
ALTER TABLE guest VALIDATE CONSTRAINT guest_id_doc_hmac_consent_check;
--> statement-breakpoint
ALTER TABLE guest VALIDATE CONSTRAINT guest_document_minimal_check;
--> statement-breakpoint
CREATE UNIQUE INDEX guest_id_doc_hmac_uk ON guest (organization_id, id_doc_hmac)
  WHERE id_doc_hmac IS NOT NULL AND merged_into_id IS NULL AND anonymized_at IS NULL;
--> statement-breakpoint
-- Job J25 (T05): document profiles without P05 by last check-out.
CREATE INDEX guest_document_profile_retention_idx ON guest (organization_id, last_stay_checkout_at)
  WHERE source = 'document' AND crm_consent <> 'granted' AND anonymized_at IS NULL;
--> statement-breakpoint

-- ───────────── 4.5 reservation.room_disclosed_to_guest (BR-012 (4), BR-429) ─────────────
-- Default true = behaviour before 0.3.7 (inventory_optimize is gated on it by BE-A, not here).
ALTER TABLE reservation ADD COLUMN room_disclosed_to_guest boolean NOT NULL DEFAULT true;
--> statement-breakpoint
-- Backfill (erd 4.5): `false` for OTA bookings not yet in house whose room the guest was never told – R2 has
-- no group auto-assignment (channel manager = R3), so these are the conflict bookings (erd 7): unassigned or
-- assigned afterwards by B7a. Everything else keeps `true`.
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE reservation SET room_disclosed_to_guest = false
 WHERE status IN ('hold', 'confirmed') AND conflict_state <> 'none';
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
--> statement-breakpoint

-- ───────────── 4.6 folio.settled_room_names (BR-012 (5)) ─────────────
-- Written in the settling transaction; NULL on folios settled before 0.3.7 (readers fall back to the room).
ALTER TABLE folio ADD COLUMN settled_room_names jsonb;
--> statement-breakpoint
ALTER TABLE folio ADD CONSTRAINT folio_settled_room_names_check
  CHECK (settled_room_names IS NULL OR jsonb_typeof(settled_room_names) = 'object');
--> statement-breakpoint

-- ───────────── 4.6 approval_request: FOC v0.3.5 (BR-434, BR-315 (g), BR-433; S4-02/S4-18/S4-22) ─────────────
ALTER TABLE approval_request
  ADD COLUMN foc_state text,
  ADD COLUMN foc_cancel_reason text,
  ADD COLUMN line_change jsonb,
  ADD COLUMN auto_cancel_reason text;
--> statement-breakpoint
-- Every approved foc / special_discount so far counts in the monthly limit and reduces its line: `applied`.
ALTER TABLE approval_request NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE approval_request DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE approval_request SET foc_state = 'applied'
 WHERE type IN ('foc', 'special_discount') AND status = 'approved';
--> statement-breakpoint
ALTER TABLE approval_request ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE approval_request FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_foc_state_check
  CHECK (foc_state IS NULL OR foc_state IN ('applied', 'dormant', 'suspended', 'cancelled'));
--> statement-breakpoint
-- erd 4.6: foc_state not null ⇔ type IN (foc, special_discount) AND status = approved.
ALTER TABLE approval_request ADD CONSTRAINT approval_request_foc_state_scope_check
  CHECK ((foc_state IS NOT NULL) = (type IN ('foc', 'special_discount') AND status = 'approved'));
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_foc_cancel_reason_check
  CHECK (foc_cancel_reason IS NULL
         OR foc_cancel_reason IN ('night_removed', 'reservation_cancelled', 'settled_while_dormant'));
--> statement-breakpoint
-- erd 4.6: foc_cancel_reason not null ⇔ foc_state = cancelled.
ALTER TABLE approval_request ADD CONSTRAINT approval_request_foc_cancelled_check
  CHECK ((foc_cancel_reason IS NOT NULL) = (foc_state IS NOT DISTINCT FROM 'cancelled'));
--> statement-breakpoint
ALTER TABLE approval_request ADD CONSTRAINT approval_request_line_change_check
  CHECK (line_change IS NULL OR jsonb_typeof(line_change) = 'object');
--> statement-breakpoint
-- erd 4.6: auto_cancel_reason not null ⇒ status = cancelled.
ALTER TABLE approval_request ADD CONSTRAINT approval_request_auto_cancel_reason_check
  CHECK (auto_cancel_reason IS NULL
         OR (auto_cancel_reason IN ('line_removed', 'reservation_cancelled', 'reservation_no_show', 'superseded')
             AND status = 'cancelled'));
--> statement-breakpoint
-- 0042 keeps UPDATE column-level (SM-10): the FOC state columns move with the request, what was asked does not.
GRANT UPDATE (foc_state, foc_cancel_reason, line_change, auto_cancel_reason) ON approval_request TO ottimo_app;
--> statement-breakpoint

-- ───────────── 4.8 hk_task (B-04, B-05) ─────────────
ALTER TABLE hk_task
  ADD COLUMN cancel_reason_code text,
  ADD COLUMN cancel_note text,
  ADD COLUMN linen_change boolean NOT NULL DEFAULT false,
  ADD COLUMN carried_over boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE hk_task ADD CONSTRAINT hk_task_cancel_reason_code_check
  CHECK (cancel_reason_code IS NULL OR cancel_reason_code IN ('guest_refused', 'dnd', 'other', 'day_ended',
                                                              'reservation_changed', 'room_blocked'));
--> statement-breakpoint
ALTER TABLE hk_task ADD CONSTRAINT hk_task_cancel_note_check
  CHECK (cancel_reason_code IS DISTINCT FROM 'other' OR (cancel_note IS NOT NULL AND btrim(cancel_note) <> ''));
--> statement-breakpoint

-- ───────────── 4.9 room_block.expected_done_date (B-10) ─────────────
ALTER TABLE room_block ADD COLUMN expected_done_date date;
--> statement-breakpoint

-- ───────────── 4.7 guest_document: S4-39 renumbers the unclaimed slots ("dồn số") in one transaction ─────────────
-- person_index is a slot number, not C3; 0053 left it out of the column-level UPDATE grant.
GRANT UPDATE (person_index) ON guest_document TO ottimo_app;
--> statement-breakpoint

-- ───────────── staff_notification: OpenAPI 0.3.7 StaffNotification.kind (+B-08 ×6, +D1 ×3), refType hk_task ─────────────
ALTER TABLE staff_notification DROP CONSTRAINT staff_notification_kind_check;
--> statement-breakpoint
ALTER TABLE staff_notification ADD CONSTRAINT staff_notification_kind_check CHECK (kind IN ('hold_expired',
  'hold_expiring', 'deposit_notice', 'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue',
  'work_order_overdue', 'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed',
  'security_alert', 'account_security_change', 'online_checkin_completed', 'payment_disputed',
  'deposit_shortfall_accepted', 'receiving_account_changed', 'refund_ready', 'work_order_new',
  'work_order_high_new', 'work_order_block_requested', 'hk_task_urgent', 'room_awaiting_inspection',
  'hk_task_cancelled', 'approval_cancelled', 'no_show_marked', 'no_show_restored'));
--> statement-breakpoint
ALTER TABLE staff_notification DROP CONSTRAINT staff_notification_ref_type_check;
--> statement-breakpoint
ALTER TABLE staff_notification ADD CONSTRAINT staff_notification_ref_type_check CHECK (ref_type IS NULL
  OR ref_type IN ('reservation', 'guest_request', 'work_order', 'approval_request', 'registration', 'user',
                  'payment', 'property', 'hk_task'));
