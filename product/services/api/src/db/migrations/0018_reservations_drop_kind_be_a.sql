-- 0018 (drizzle-kit draft + hand-written – BE-A Sprint 2 response & fix, OpenAPI 0.3.5 §8.1, §8.3):
-- conflict_kind of 0015 is replaced by the capacity_* columns of 0017 (A-20 keeps conflict_state for the
-- unassigned lane only); calendar price of existing nights; parameters ota_base_rate + rounding.ota_rate.
ALTER TABLE "reservation" DROP COLUMN "conflict_kind";--> statement-breakpoint
-- Existing short-stay nights (dev/test data): calendar price = current gross (ARC §8.3 A-22). OTA nights stay NULL.
ALTER TABLE stay_night NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE stay_night n SET calendar_rate_vnd = n.room_revenue_gross_vnd
  FROM channel c WHERE c.id = n.channel_id AND c.channel_group IN ('direct', 'agent')
   AND n.calendar_rate_vnd IS NULL AND n.stay_type = 'short';
--> statement-breakpoint
ALTER TABLE stay_night ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- BR-103 OTA base price per room-group code (ARC §8.1, INV-004) and BR-005 OTA rounding.
-- Bounds (erd 9.1a): each value 100.000–20.000.000; the setParameter validator also requires every active
-- room_group.code and no unknown code.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value) VALUES
  ('ota_base_rate', 'json', '{owner,manager}', 'BR-103', false, '{"min": 100000, "max": 20000000}'::jsonb, NULL),
  ('rounding.ota_rate', 'int', '{owner,manager}', 'BR-005', false, NULL, NULL)
ON CONFLICT (key) DO NOTHING;
