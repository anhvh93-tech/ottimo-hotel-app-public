-- 0071 (hand-written data check – BE-B, R2 Sprint 4 tuần Ổn định, before the QC gate; number from ORC 18/10). No
-- schema change: the snapshot is 0070's (pattern 0064/0067). BUG-R2-197 (recheck 6 R6FIX-01, ARC 16.17 mục 3 bổ
-- sung): a fridge damaged by BUG-R2-164 on ce90d19…8819c2d – a count of 365486f without a period (fill_id NULL)
-- and its re-count in the `check_in` period written since, both live – charges the minibar twice; 0067 skipped it
-- silently (its guard against a second live count of one period). This migration REPAIRS NOTHING (policy of
-- 0067): it runs K1 and K1b and RAISEs with the list of fridges (booking code, room, each live count with its
-- amount) – OPS/DATA + BE-B handle each one by hand, with a record in the decision-log (ARC 16.17 mục 3 bổ sung:
-- void the lines of the count without a period, mark it replaced by the right count, cancel the extra refill
-- task, K1/K1b/K2/K3 = 0). A demo/test database without real data may be rebuilt instead.
--   K1  – a live count without a period of a stay in house;
--   K1b – a fridge (any stay state) with more than one live count, one of them without a period.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) in the migrator's single transaction; FORCE RLS binds the
-- owner too, so RLS is off for the read only.
ALTER TABLE minibar_check NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
DECLARE bad text;
BEGIN
  WITH live AS (
    SELECT c.id, c.reservation_id, c.room_id, c.fill_id, c.total_vnd, c.created_at, r.status
      FROM minibar_check c JOIN reservation r ON r.id = c.reservation_id
     WHERE c.mode = 'checkout' AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)
  ), k1 AS (
    SELECT DISTINCT reservation_id, room_id FROM live WHERE status = 'in_house' AND fill_id IS NULL
  ), k1b AS (
    SELECT reservation_id, room_id FROM live
     GROUP BY reservation_id, room_id
    HAVING count(*) > 1 AND bool_or(fill_id IS NULL)
  ), fridges AS (
    SELECT reservation_id, room_id FROM k1 UNION SELECT reservation_id, room_id FROM k1b
  )
  SELECT string_agg(
           format('%s room %s: %s', r.code, rm.room_no,
                  (SELECT string_agg(format('count %s (%s, %s VND)', l.id,
                                            COALESCE(l.fill_id::text, 'no period'), l.total_vnd),
                                     ', ' ORDER BY l.created_at, l.id)
                     FROM live l WHERE l.reservation_id = f.reservation_id AND l.room_id = f.room_id)),
           '; ' ORDER BY r.code, rm.room_no)
    INTO bad
    FROM fridges f
    JOIN reservation r ON r.id = f.reservation_id
    JOIN room rm ON rm.id = f.room_id;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION '0071: minibar counts charged twice or without a period (BUG-R2-197, K1/K1b – handle by hand, ARC 16.17 mục 3): %', bad;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check FORCE ROW LEVEL SECURITY;
