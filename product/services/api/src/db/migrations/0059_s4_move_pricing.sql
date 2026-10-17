-- 0059 (custom, hand-written – erd 16, ARC s3-contract 4.2a; BE-A, R2 Sprint 4, number handed out by ORC 17/10).
-- Room moves priced by who asked (one calculation for the preview and the write – OpenAPI 0.3.7 D1, ARC 10.4):
--   S4-07 (BUG-R2-058, BR-429 v0.3.4): BR-110 fee per night re-priced on B7/B7a/B14 by the cause;
--   S4-05 (BUG-R2-057, BR-424): the OTA difference is always against the ORIGIN room, reversed and re-posted;
--   S4-21 (ESC-019 A, BR-429 v0.3.5): catalogue key `room_move_pricing`.
-- Columns, constraints and one catalogue row ONLY – every default keeps the behaviour before 0.3.7.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.

-- ───────────── (1) stay_night.extra_person_base (BR-429 v0.3.4, BR-424 property_fault) ─────────────
-- The standard occupancy that prices the BR-110 fee of the night when it is NOT the base of the night's room:
-- a move caused by OTTIMO (property_fault, overbooking, upgrade, inventory_optimize, other, B7a) keeps
-- min(old fee, new fee) per night = the fee at max(old base, new base) (the fee only falls when the base
-- rises), so a later change of the people keeps that protection ("khách không bao giờ trả thêm vì OTTIMO đổi
-- căn"). NULL = the base occupancy of the night's room (every night before 0.3.7). A guest request resets it.
ALTER TABLE stay_night ADD COLUMN extra_person_base smallint;
--> statement-breakpoint
ALTER TABLE stay_night ADD CONSTRAINT stay_night_extra_person_base_check
  CHECK (extra_person_base IS NULL OR extra_person_base >= 0);
--> statement-breakpoint

-- ───────────── (2) reservation.origin_room_id (BR-424 v0.3.5, BR-429 (c)) ─────────────
-- "Căn gốc" of the OTA difference: the room the booking was sold for. Set once, on the FIRST room move of the
-- booking (B7, B7a, B14 – any cause): the room before that move; a conflict booking without a room takes its
-- assigned room when reassigned in the same group, and the REQUESTED room when OTTIMO upgrades it (BR-424
-- "căn trước nâng hạng"). Never changed afterwards – neither a guest request (before or during the stay) nor
-- an OTTIMO move changes the origin. NULL = never moved: the first room of the booking is its origin.
ALTER TABLE reservation ADD COLUMN origin_room_id uuid;
--> statement-breakpoint
ALTER TABLE reservation ADD CONSTRAINT reservation_origin_room_fk
  FOREIGN KEY (property_id, origin_room_id) REFERENCES room (property_id, id);
--> statement-breakpoint

-- ───────────── (3) catalogue: room_move_pricing (erd 9, OWN – BR-429, BR-424; INV ESC-019 A) ─────────────
-- guestRequest: price of the nights when the guest asks to move to another room (before arrival – BR-429 (a);
-- in house – BR-424): `new_room_rate` (INV 17/10) or `keep_booked_rate` (behaviour before 0.3.7). OTTIMO causes
-- and `other` always keep the booked prices (BR-429 (b)); OTA bookings always keep the OTA price and collect
-- the difference against the origin room (BR-429 (c)) – not configurable.
INSERT INTO config_parameter_def (key, value_schema, edit_roles, br_ref, is_security, bounds, default_value)
VALUES ('room_move_pricing', 'json', '{owner}', 'BR-429', false, NULL,
        '{"guestRequest":"new_room_rate"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
