-- 0067 (hand-written data migration – BE-B, R2 Sprint 4 tuần Ổn định, vòng sửa 5; number from ORC 18/10; ARC
-- `openapi-0.3.7.md` 16.3, 16.17 mục 3). No schema change: the snapshot is 0066's (pattern 0064).
-- BUG-R2-164 (recheck 5 R5MINI-03): a count recorded by 365486f (0065 code) on a fridge never filled wrote no
-- `minibar_fill`; 0066 found no fill in force and left its `fill_id` NULL – the next count of the same numbers then
-- opened the fridge's first period (`check_in`), had no history in it and charged the beers again.
-- BUG-R2-159: a re-count in one period gave the fridge a second open refill task.
-- (b) a fridge with more than one live count without a period (BUG-R2-158 data) → RAISE with the list: money is
--     never repaired here (OPS/QA rebuild the test data or follow ARC's manual steps);
-- (a) every fridge (stay × room) of a stay in house with a `checkout` count and no fill gets a `backfill` fill =
--     the mark (`standard_qty`) and price snapshots of its FIRST count, `filled_at` = `created_at` = that count
--     − 1 ms (a period before every count – the next count of the same level is a re-count, R6); then every
--     count without `fill_id` gets the fill in force when it was taken (0066 rule – the fill of (a) for those);
-- (c) an open system `minibar_refill` task of a stay in house that no live count points to (a duplicate left by a
--     re-count) is cancelled: `reservation_changed`, note `minibar_duplicate_refill_0067`.
-- Checks K1–K3 (ARC 16.17 mục 3) must return 0 rows afterwards – s4-be-b.md mục 17 (OPS/DATA).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
-- Back-fill (pattern 0065/0066): FORCE RLS binds the owner too, so RLS is off for these tables only.
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill_line NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill_line DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE hk_task NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE hk_task DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- (b) never two live counts without a period in one fridge
DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(format('reservation %s room %s (%s live counts)', reservation_id, room_id, n), '; ')
    INTO bad
    FROM (SELECT c.reservation_id, c.room_id, count(*) AS n
            FROM minibar_check c
           WHERE c.mode = 'checkout' AND c.fill_id IS NULL
             AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)
           GROUP BY c.reservation_id, c.room_id
          HAVING count(*) > 1) x;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION '0067: fridges with more than one live minibar count without a period (BUG-R2-158 data – not repaired automatically): %', bad;
  END IF;
END $$;
--> statement-breakpoint
-- (a) the fill of every unfilled fridge of a stay in house that has a checkout count, with its lines
WITH fridge AS (
  SELECT DISTINCT ON (c.reservation_id, c.room_id)
         c.organization_id, c.property_id, c.reservation_id, c.room_id, c.id AS first_check_id,
         c.created_at - interval '1 millisecond' AS at
    FROM minibar_check c JOIN reservation r ON r.id = c.reservation_id
   WHERE c.mode = 'checkout' AND r.status = 'in_house'
     AND NOT EXISTS (SELECT 1 FROM minibar_fill f
                      WHERE f.reservation_id = c.reservation_id AND f.room_id = c.room_id)
   ORDER BY c.reservation_id, c.room_id, c.created_at, c.id
), filled AS (
  INSERT INTO minibar_fill (id, organization_id, property_id, reservation_id, room_id, source, filled_at,
    created_by, created_at)
  SELECT gen_random_uuid(), organization_id, property_id, reservation_id, room_id, 'backfill', at, NULL, at
    FROM fridge
  RETURNING id, reservation_id, room_id
)
INSERT INTO minibar_fill_line (id, organization_id, property_id, fill_id, item_id, qty, unit_price_vnd_snapshot,
  unit_cost_vnd_snapshot)
SELECT gen_random_uuid(), l.organization_id, l.property_id, f.id, l.item_id, l.standard_qty,
       l.unit_price_vnd_snapshot, l.unit_cost_vnd_snapshot
  FROM filled f
  JOIN fridge x ON x.reservation_id = f.reservation_id AND x.room_id = f.room_id
  JOIN minibar_check_line l ON l.check_id = x.first_check_id
 WHERE l.standard_qty >= 1;
--> statement-breakpoint
-- … and the period of every count without one = the fill in force when it was taken (the 0066 rule – the fills of
-- (a) are before every count of their fridge; a `check_in` fill written since by registerFridge is too); never a
-- second live count in one period (minibar_check_live_checkout_key)
UPDATE minibar_check c
   SET fill_id = t.fill_id
  FROM (SELECT k.id, (SELECT f.id FROM minibar_fill f
                       WHERE f.reservation_id = k.reservation_id AND f.room_id = k.room_id
                         AND f.filled_at <= k.created_at
                       ORDER BY f.filled_at DESC, f.id DESC LIMIT 1) AS fill_id
          FROM minibar_check k
         WHERE k.fill_id IS NULL) t
 WHERE c.id = t.id AND t.fill_id IS NOT NULL
   AND NOT (c.mode = 'checkout' AND c.replaced_by_check_id IS NULL
            AND EXISTS (SELECT 1 FROM minibar_check o
                         WHERE o.reservation_id = c.reservation_id AND o.room_id = c.room_id
                           AND o.mode = 'checkout' AND o.replaced_by_check_id IS NULL
                           AND o.fill_id = t.fill_id AND o.id <> c.id));
--> statement-breakpoint
-- (c) open system refill tasks of a stay in house that no live count points to
UPDATE hk_task t
   SET status = 'cancelled', cancel_reason_code = 'reservation_changed',
       cancel_note = 'minibar_duplicate_refill_0067', updated_at = now(), version = t.version + 1
  FROM reservation r
 WHERE r.id = t.reservation_id AND r.status = 'in_house'
   AND t.type = 'minibar_refill' AND t.source = 'system' AND t.status IN ('open', 'in_progress')
   AND NOT EXISTS (SELECT 1 FROM minibar_check c
                    WHERE c.refill_task_id = t.id AND c.mode = 'checkout'
                      AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id));
--> statement-breakpoint
ALTER TABLE hk_task ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE hk_task FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill_line FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check_line FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
