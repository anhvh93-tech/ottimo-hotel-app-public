-- 0030 (custom, hand-written – ARC s3-contract 4.2 rule 2; BE-A Sprint 3): front desk stay flows (EP03-05),
-- party (US-022), events hub (staff_notification, attention_event), room status (SM-03 store).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts). Schema .ts mirrors this file (src/db/schema/frontdesk.ts,
-- reservations.ts). No drizzle snapshot is added in Sprint 3 (s3-contract 4.2 rule 2).

-- ───────────── reservation: check-in / stay / check-out facts (erd 0.3.3 + 0.3.6) ─────────────
ALTER TABLE reservation
  ADD COLUMN cards_issued smallint,
  ADD COLUMN house_rules_sent_at timestamptz,
  ADD COLUMN house_rules_sent_by uuid,
  ADD COLUMN checkin_document_override_reason text,
  ADD COLUMN checkin_document_override_by uuid,
  ADD COLUMN checkin_room_override_reason text,
  ADD COLUMN checkin_room_override_by uuid,
  ADD COLUMN checkin_room_status_before text,
  ADD COLUMN door_access_handed_over_at timestamptz,
  ADD COLUMN door_access_handed_over_by uuid,
  ADD COLUMN checkout_mode text,
  ADD COLUMN debt_due_date date,
  ADD COLUMN debt_reason text,
  ADD COLUMN early_departure_notice_at timestamptz,
  ADD COLUMN late_checkout_requested_time time,
  ADD COLUMN party_version integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_cards_issued_check
  CHECK (cards_issued IS NULL OR cards_issued BETWEEN 0 AND 2);
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_checkout_mode_check
  CHECK (checkout_mode IS NULL OR checkout_mode IN ('desk', 'self_service', 'debt'));
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_debt_check
  CHECK ((debt_due_date IS NULL AND debt_reason IS NULL)
         OR (checkout_mode = 'debt' AND debt_due_date IS NOT NULL AND debt_reason IS NOT NULL));
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_room_status_before_check
  CHECK (checkin_room_status_before IS NULL
         OR checkin_room_status_before IN ('VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO'));
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_door_access_by_fk
  FOREIGN KEY (organization_id, door_access_handed_over_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_house_rules_by_fk
  FOREIGN KEY (organization_id, house_rules_sent_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
-- B9a / B13 child bookings share the parent's folio: the OTA → direct child of an extension (BR-422).
CREATE INDEX reservation_parent_idx ON reservation (property_id, parent_reservation_id)
  WHERE parent_reservation_id IS NOT NULL;
--> statement-breakpoint

-- ───────────── room_status (SM-03, erd 4.1): one row per room, written by front desk now, HK in Sprint 4 ─────────────
CREATE TABLE room_status (
  room_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  status text NOT NULL,
  since timestamptz NOT NULL,
  updated_by uuid,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT room_status_room_fk FOREIGN KEY (property_id, room_id) REFERENCES room (property_id, id),
  CONSTRAINT room_status_property_fk FOREIGN KEY (organization_id, property_id)
    REFERENCES property (organization_id, id),
  CONSTRAINT room_status_status_check CHECK (status IN ('VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO'))
);
--> statement-breakpoint

-- ───────────── checkout_confirmation (US-030): "{channel} – guest leaves at {time}", append-only ─────────────
CREATE TABLE checkout_confirmation (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  reservation_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  recorded_by uuid,
  channel text NOT NULL,
  reply_type text NOT NULL,
  confirmed_time time,
  note text,
  CONSTRAINT checkout_confirmation_reservation_fk FOREIGN KEY (property_id, reservation_id)
    REFERENCES reservation (property_id, id),
  CONSTRAINT checkout_confirmation_channel_check CHECK (channel IN ('phone', 'app', 'zalo_copy', 'in_person')),
  CONSTRAINT checkout_confirmation_reply_check CHECK (reply_type IN ('on_time', 'time', 'late', 'extend')),
  CONSTRAINT checkout_confirmation_time_check
    CHECK (reply_type NOT IN ('time', 'late') OR confirmed_time IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX checkout_confirmation_reservation_idx ON checkout_confirmation (reservation_id, recorded_at);
--> statement-breakpoint

-- ───────────── reservation_guest (US-022, erd 4.5): people of a booking (booker is the reservation column) ─────────────
-- Child data is C3: only ciphertext (CryptoService of BE-C, DEK per row). child_data_key_id gets its FK to
-- data_key in a later migration, once BE-C's crypto tables are on main (s3-contract 4.2 rule 6).
CREATE TABLE reservation_guest (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  reservation_id uuid NOT NULL,
  guest_id uuid,
  role text NOT NULL,
  relationship text,
  child_name_enc bytea,
  child_birth_year_enc bytea,
  child_name_hmac text,
  child_data_key_id uuid,
  is_minor_data boolean NOT NULL DEFAULT false,
  price_age_band text NOT NULL,
  effective_from date,
  created_at timestamptz NOT NULL,
  created_by uuid,
  removed_at timestamptz,
  removed_by uuid,
  CONSTRAINT reservation_guest_property_id_key UNIQUE (property_id, id),
  CONSTRAINT reservation_guest_reservation_fk FOREIGN KEY (property_id, reservation_id)
    REFERENCES reservation (property_id, id),
  CONSTRAINT reservation_guest_guest_fk FOREIGN KEY (organization_id, guest_id)
    REFERENCES guest (organization_id, id),
  CONSTRAINT reservation_guest_role_check CHECK (role IN ('companion', 'child')),
  CONSTRAINT reservation_guest_relationship_check CHECK (relationship IS NULL
    OR relationship IN ('spouse', 'partner', 'family', 'friend', 'colleague', 'unknown')),
  CONSTRAINT reservation_guest_band_check CHECK (price_age_band IN ('adult', 'child_6_11', 'child_under_6')),
  CONSTRAINT reservation_guest_subject_check CHECK (
    (role = 'companion' AND guest_id IS NOT NULL AND child_name_enc IS NULL)
    OR (role = 'child' AND guest_id IS NULL AND child_name_enc IS NOT NULL AND child_data_key_id IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX reservation_guest_guest_uk ON reservation_guest (reservation_id, guest_id)
  WHERE removed_at IS NULL AND guest_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX reservation_guest_child_uk ON reservation_guest (reservation_id, child_name_hmac)
  WHERE removed_at IS NULL AND child_name_hmac IS NOT NULL;
--> statement-breakpoint
CREATE INDEX reservation_guest_reservation_idx ON reservation_guest (reservation_id) WHERE removed_at IS NULL;
--> statement-breakpoint

-- ───────────── staff_notification (erd BE-ARC-06): inbox per user, kinds = OpenAPI StaffNotification.kind ─────────────
CREATE TABLE staff_notification (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  ref_type text,
  ref_id uuid,
  ref_code text,
  created_at timestamptz NOT NULL,
  read_at timestamptz,
  CONSTRAINT staff_notification_user_fk FOREIGN KEY (organization_id, user_id)
    REFERENCES app_user (organization_id, id),
  CONSTRAINT staff_notification_property_fk FOREIGN KEY (organization_id, property_id)
    REFERENCES property (organization_id, id),
  CONSTRAINT staff_notification_kind_check CHECK (kind IN ('hold_expired', 'hold_expiring', 'deposit_notice',
    'deposit_after_cancel', 'guest_request_new', 'guest_request_overdue', 'work_order_overdue',
    'approval_requested', 'approval_decided', 'registration_due', 'checkout_call_needed', 'security_alert',
    'account_security_change', 'online_checkin_completed', 'payment_disputed', 'deposit_shortfall_accepted',
    'receiving_account_changed', 'refund_ready')),
  CONSTRAINT staff_notification_ref_type_check CHECK (ref_type IS NULL OR ref_type IN ('reservation',
    'guest_request', 'work_order', 'approval_request', 'registration', 'user', 'payment', 'property')),
  CONSTRAINT staff_notification_ref_code_check CHECK (ref_code IS NULL OR length(ref_code) <= 40)
);
--> statement-breakpoint
CREATE INDEX staff_notification_inbox_idx
  ON staff_notification (user_id, read_at NULLS FIRST, created_at DESC, id DESC);
--> statement-breakpoint

-- ───────────── attention_event (erd BE-ARC-06): "Cần chú ý" items that cannot be computed from state ─────────────
CREATE TABLE attention_event (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  property_id uuid NOT NULL,
  kind text NOT NULL,
  severity text NOT NULL,
  ref_type text,
  ref_id uuid,
  ref_code text,
  dedupe_key text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_note text,
  CONSTRAINT attention_event_property_fk FOREIGN KEY (organization_id, property_id)
    REFERENCES property (organization_id, id),
  CONSTRAINT attention_event_severity_check CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT attention_event_ref_code_check CHECK (ref_code IS NULL OR length(ref_code) <= 40)
);
--> statement-breakpoint
CREATE UNIQUE INDEX attention_event_open_uk ON attention_event (property_id, dedupe_key) WHERE resolved_at IS NULL;
--> statement-breakpoint
CREATE INDEX attention_event_open_idx ON attention_event (property_id, created_at) WHERE resolved_at IS NULL;
--> statement-breakpoint

-- ───────────── RLS (erd 2.3): every new table is property-level ─────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['room_status', 'checkout_confirmation', 'reservation_guest', 'staff_notification',
                           'attention_event'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- ───────────── Grants: business rows never DELETEd (erd 1); confirmations append-only ─────────────
GRANT SELECT, INSERT, UPDATE ON room_status, reservation_guest, staff_notification, attention_event TO ottimo_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON checkout_confirmation TO ottimo_app;
--> statement-breakpoint

-- ───────────── Catalogue: BR-428 early departure refund (INV ESC-006: notice ≥ 1 day → 50 % of unstayed nights) ─────────────
-- Value per property in config_parameter (DS-E seed – QA adds it): {"minNoticeDays": 1, "refundPct": 50}.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('early_departure_refund', 'json', '{owner,manager}', 'BR-428', false, NULL, NULL)
ON CONFLICT (key) DO NOTHING;
