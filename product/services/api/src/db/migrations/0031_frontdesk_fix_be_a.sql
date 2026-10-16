-- 0031 (custom, hand-written – BE-A Sprint 3 Response & fix; ARC s3-contract 4.2 / 4.2a). Runs as ottimo_owner.
-- (1) Extra-person fee per night (FB-R2-ARC-BE-S3-01, DOM BE-16 / S3-13): stay_night.extra_person_fee_vnd –
--     NULL = the booking-level fee of pricing_snapshot (every night alike, the B2/B4 case); a value = this night's
--     own fee (people changed mid-stay from `effectiveFrom`, room change). The folio sync posts one
--     `extra_person` line per night from it.
-- (2) FB-R2-ARC-BE-S3-22: FKs left open in 0030 (child DEK → data_key now on main; user columns), CHECK pairs,
--     column-level UPDATE grants (least privilege).
-- (3) FB-R2-SEC-BE-37: a refund is never approved by the person who set its destination.
-- (4) BR-414 v0.3.4 / OpenAPI 0.3.6 bổ sung 2 (E03-07): parameter `manual_time_tolerance_minutes` (NGÀNH 30) –
--     typed check-in/check-out time vs the server clock. Default value in the catalogue (DS-E has no row yet).

ALTER TABLE stay_night ADD COLUMN extra_person_fee_vnd bigint;
--> statement-breakpoint
ALTER TABLE stay_night ADD CONSTRAINT stay_night_extra_person_fee_check
  CHECK (extra_person_fee_vnd IS NULL OR extra_person_fee_vnd >= 0);
--> statement-breakpoint

ALTER TABLE reservation_guest ADD CONSTRAINT reservation_guest_child_key_fk
  FOREIGN KEY (child_data_key_id) REFERENCES data_key (id);
--> statement-breakpoint
ALTER TABLE reservation_guest ADD CONSTRAINT reservation_guest_created_by_fk
  FOREIGN KEY (organization_id, created_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE reservation_guest ADD CONSTRAINT reservation_guest_removed_by_fk
  FOREIGN KEY (organization_id, removed_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE reservation_guest ADD CONSTRAINT reservation_guest_removed_check
  CHECK (removed_by IS NULL OR removed_at IS NOT NULL);
--> statement-breakpoint
-- SEC-BE-41: the keyed hash of a removed child is erased with its DEK.
ALTER TABLE reservation_guest ADD CONSTRAINT reservation_guest_removed_hmac_check
  CHECK (removed_at IS NULL OR child_name_hmac IS NULL);
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_document_override_by_fk
  FOREIGN KEY (organization_id, checkin_document_override_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_room_override_by_fk
  FOREIGN KEY (organization_id, checkin_room_override_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE room_status ADD CONSTRAINT room_status_updated_by_fk
  FOREIGN KEY (organization_id, updated_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE checkout_confirmation ADD CONSTRAINT checkout_confirmation_recorded_by_fk
  FOREIGN KEY (organization_id, recorded_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE attention_event ADD CONSTRAINT attention_event_resolved_by_fk
  FOREIGN KEY (organization_id, resolved_by) REFERENCES app_user (organization_id, id);
--> statement-breakpoint
ALTER TABLE attention_event ADD CONSTRAINT attention_event_resolved_check
  CHECK (resolved_by IS NULL OR resolved_at IS NOT NULL);
--> statement-breakpoint
ALTER TABLE attention_event ADD CONSTRAINT attention_event_ref_check
  CHECK ((ref_type IS NULL) = (ref_id IS NULL));
--> statement-breakpoint
ALTER TABLE staff_notification ADD CONSTRAINT staff_notification_ref_check
  CHECK ((ref_type IS NULL) = (ref_id IS NULL));
--> statement-breakpoint

-- Column-level UPDATE (erd 1: business rows never deleted; only these columns ever change).
REVOKE UPDATE ON reservation_guest, staff_notification, attention_event FROM ottimo_app;
--> statement-breakpoint
GRANT UPDATE (removed_at, removed_by, child_name_hmac) ON reservation_guest TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (read_at) ON staff_notification TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (resolved_at, resolved_by, resolution_note) ON attention_event TO ottimo_app;
--> statement-breakpoint

-- SEC-BE-37 (F8): whoever (re)set where the money goes never approves that refund.
ALTER TABLE approval_request ADD CONSTRAINT approval_request_refund_destination_not_approver
  CHECK (type <> 'refund' OR approver_id IS NULL OR refund_destination_set_by IS NULL
         OR approver_id <> refund_destination_set_by);
--> statement-breakpoint

INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('manual_time_tolerance_minutes', 'int', '{owner,manager}', 'BR-414', false, '{"min":5,"max":240}'::jsonb,
   '30'::jsonb);
