-- 0068 (hand-written data migration – BE-A, R2 Sprint 4 tuần Ổn định, vòng sửa 5; number from ORC 18/10; ARC
-- `openapi-0.3.7.md` 16.18). No schema change: the snapshot is 0067's (pattern 0064). No amount changes.
-- BR-417 appendix 5A step 3 (DOM 18/10 – BUG-R2-161/162): the reference night of an added night is a night TYPED by a
-- person, bound to the room the guest bought when it was typed. From this release the operations record it in
-- `reservation.pricing_snapshot.nights[]`: `source` = `manual` (typed) | `default` (the suggested price written
-- untouched) | `calendar`, and `anchorRoomId` (typed nights only; absent = the stay's origin room). Before it, B9a /
-- B13 / B18 wrote `manual` whenever the default differed from the calendar and nothing recorded the room bought.
-- This back-fills the stays that are not over (hold / confirmed / in house – primary bookings; the direct child
-- nights of an OTA stay are never a reference: an OTA stay is not agreed), night by night, from the audit:
-- 1. `manual` already anchored, or not `manual` → unchanged.
-- 2. typed at booking (`reservation.priced`, `after.rateSource = manual`, the date in `after.nightlyRates`) → kept,
--    no anchor (the origin room).
-- 3. typed later – S4-35 (`reservation.repriced` with the date in `before.nightlyRates`) or a B13 with typed prices
--    (`reservation.extended`, `after.rateSource = manual`, the date in `after.nightlyRates`) → kept, anchored to the
--    room bought at the LAST such audit: the new room of the latest `guest_request` room change before it (none,
--    or the origin room → no anchor). A guest request "into the lane" and the S4-09 return are not replayed here
--    (BE-A assumption r5-4 – no such stay is expected to be open at release).
-- 4. anything else `manual` (a B9a / B13 / B18 night written at its suggested price) → `default`.
-- Check for DATA after the run: nights `manual` of open stays typed after booking without `anchorRoomId` whose room
-- bought differs from the origin = 0 (query in `outputs/BE/s4-be-a.md` mục 17).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction. FORCE RLS binds
-- the owner too (pattern 0016/0055/0060/0064): RLS is off for the back-fill only.
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation_change NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation_change DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
WITH nights AS (
  SELECT r.id, r.property_id, r.origin_room_id, t.n, t.ord,
         EXISTS (
           SELECT 1 FROM audit_event e
            WHERE e.entity_type = 'reservation' AND e.entity_id = r.id::text
              AND e.action = 'reservation.priced' AND e.after ->> 'rateSource' = 'manual'
              AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(e.after -> 'nightlyRates', '[]'::jsonb)) x
                           WHERE x ->> 'date' = t.n ->> 'date')) AS at_booking,
         (SELECT max(e.occurred_at) FROM audit_event e
           WHERE e.entity_type = 'reservation' AND e.entity_id = r.id::text
             AND ((e.action = 'reservation.repriced'
                   AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(e.before -> 'nightlyRates', '[]'::jsonb)) x
                                WHERE x ->> 'date' = t.n ->> 'date'))
               OR (e.action = 'reservation.extended' AND e.after ->> 'rateSource' = 'manual'
                   AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(e.after -> 'nightlyRates', '[]'::jsonb)) x
                                WHERE x ->> 'date' = t.n ->> 'date')))) AS typed_at
    FROM reservation r
   CROSS JOIN LATERAL jsonb_array_elements(r.pricing_snapshot -> 'nights') WITH ORDINALITY AS t(n, ord)
   WHERE r.status IN ('hold', 'confirmed', 'in_house') AND r.parent_reservation_id IS NULL
     AND jsonb_typeof(r.pricing_snapshot -> 'nights') = 'array'
),
fixed AS (
  SELECT x.id,
         jsonb_agg(
           CASE
             WHEN x.n ->> 'source' IS DISTINCT FROM 'manual' OR x.n ? 'anchorRoomId' THEN x.n
             WHEN x.typed_at IS NOT NULL THEN
               CASE WHEN g.room_id IS NOT NULL AND g.room_id IS DISTINCT FROM x.origin_room_id
                    THEN x.n || jsonb_build_object('anchorRoomId', g.room_id::text)
                    ELSE x.n END
             WHEN x.at_booking THEN x.n
             ELSE x.n || '{"source": "default"}'::jsonb
           END ORDER BY x.ord) AS nights
    FROM nights x
    LEFT JOIN LATERAL (
      SELECT rm.id AS room_id FROM reservation_change c
        JOIN room rm ON rm.property_id = c.property_id AND (rm.room_no = c.new_value OR rm.id::text = c.new_value)
       WHERE c.reservation_id = x.id AND c.field = 'room' AND c.reason = 'guest_request'
         AND c.new_value IS NOT NULL AND x.typed_at IS NOT NULL AND c.changed_at <= x.typed_at
       ORDER BY c.changed_at DESC, c.id DESC LIMIT 1
    ) g ON true
   GROUP BY x.id
)
UPDATE reservation r
   SET pricing_snapshot = jsonb_set(r.pricing_snapshot, '{nights}', f.nights)
  FROM fixed f
 WHERE r.id = f.id AND r.pricing_snapshot -> 'nights' IS DISTINCT FROM f.nights;
--> statement-breakpoint
ALTER TABLE audit_event ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_event FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation_change ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation_change FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
