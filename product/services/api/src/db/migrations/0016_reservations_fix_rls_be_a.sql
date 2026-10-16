-- 0016 (custom, hand-written – erd 16; BE-A Sprint 2 response & fix). Runs as ottimo_owner.

-- ───────────── reservation.folio_id NOT NULL (FB-R2-ARC-BE-S2-04, erd 4.6) ─────────────
-- Bookings created before the folio wiring get their folio now. FORCE RLS also binds the table owner, so the
-- backfill switches it off for these two statements only (no tenant data leaves the migration).
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO folio (id, organization_id, property_id, primary_reservation_id, status, created_at, created_by, updated_at)
SELECT gen_random_uuid(), r.organization_id, r.property_id, r.id, 'open', r.created_at, r.created_by, r.created_at
  FROM reservation r
 WHERE r.folio_id IS NULL AND NOT EXISTS (SELECT 1 FROM folio f WHERE f.primary_reservation_id = r.id);
--> statement-breakpoint
UPDATE reservation r SET folio_id = f.id FROM folio f WHERE r.folio_id IS NULL AND f.primary_reservation_id = r.id;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE folio FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ALTER COLUMN folio_id SET NOT NULL;
--> statement-breakpoint

-- ───────────── folio_line → stay_night as a tenant pair (SEC-BE-30, ARC-BE-S2-09) ─────────────
ALTER TABLE folio_line DROP CONSTRAINT folio_line_stay_night_fk;
--> statement-breakpoint
ALTER TABLE folio_line ADD CONSTRAINT folio_line_stay_night_fk FOREIGN KEY (property_id, stay_night_id)
  REFERENCES stay_night (property_id, id);
--> statement-breakpoint

-- ───────────── Open holds per user (SEC-BE-28) ─────────────
-- [GIẢ ĐỊNH – PO/DOM chốt con số]: CTV 3, SAL 5 giữ chỗ đang mở; FD+ không giới hạn.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('max_open_holds_per_user', 'json', '{owner,manager}', 'SEC-BE-28', false, NULL,
        '{"collaborator": 3, "sales_staff": 5}'::jsonb)
ON CONFLICT (key) DO NOTHING;
