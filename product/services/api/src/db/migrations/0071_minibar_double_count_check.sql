-- 0071 (hand-written data CHECK only – BE-B, R2 Sprint 4 tuần Ổn định; number from ORC 18/10). No schema change:
-- the snapshot is 0070's (pattern 0064/0067). Body rewritten 18/10 (ARC `openapi-0.3.7.md` 16.27 (3), R7MIG-01 –
-- no environment with real data ran it): it now runs K1b′ only, so that it never stops `migrate` before 0075 on
-- valid data (a count of 365486f without a period followed by a `carry`/`refill` period is not a double charge).
-- BUG-R2-197: a fridge with MORE THAN ONE live `checkout` count in the SAME period charges the minibar twice
-- (ce90d19…8819c2d: the 365486f count without a period + its re-count in the `check_in` period registerFridge
-- wrote, back-dated to just before the first count). This migration REPAIRS NOTHING (policy of 0067): it RAISEs
-- with the list of fridges (booking code, room, period, each live count with its amount) – OPS/DATA + BE-B handle
-- each one by hand (ARC 16.17 mục 3 bổ sung), with a record in the decision-log.
-- Period of a count (ARC 16.27 (3) as revised 18/10 – same rule as 0075): its `fill_id`; without one: (1) the latest
-- `carry` / `refill` / `backfill` fill written (`created_at`) before the count, else (2) the fridge's `check_in`
-- fill – always the FIRST period of the fridge, whatever its times (registerFridge back-dates it; a catalogue
-- copy-on-write dates it when the catalogue changed), else (3) the period before any fill (the `backfill` 0075
-- writes). Live = `replaced_by_check_id` NULL or the count itself.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) in the migrator's single transaction; FORCE RLS binds the
-- owner too, so RLS is off for the read only.
ALTER TABLE minibar_check NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill DISABLE ROW LEVEL SECURITY;
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
    SELECT c.id, c.reservation_id, c.room_id, c.total_vnd, c.created_at,
           COALESCE(c.fill_id, (
             SELECT f.id FROM minibar_fill f
              WHERE f.reservation_id = c.reservation_id AND f.room_id = c.room_id
                AND f.source IN ('carry', 'refill', 'backfill') AND f.created_at <= c.created_at
              ORDER BY f.created_at DESC, f.id DESC LIMIT 1), (
             SELECT f.id FROM minibar_fill f
              WHERE f.reservation_id = c.reservation_id AND f.room_id = c.room_id AND f.source = 'check_in'
              LIMIT 1)) AS period
      FROM minibar_check c
     WHERE c.mode = 'checkout' AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)
  ), dup AS (
    SELECT reservation_id, room_id, period FROM live
     GROUP BY reservation_id, room_id, period
    HAVING count(*) > 1
  )
  SELECT string_agg(
           format('%s room %s period %s: %s', r.code, rm.room_no, COALESCE(d.period::text, 'before any fill'),
                  (SELECT string_agg(format('count %s (%s VND)', l.id, l.total_vnd), ', ' ORDER BY l.created_at, l.id)
                     FROM live l
                    WHERE l.reservation_id = d.reservation_id AND l.room_id = d.room_id
                      AND l.period IS NOT DISTINCT FROM d.period)),
           '; ' ORDER BY r.code, rm.room_no)
    INTO bad
    FROM dup d
    JOIN reservation r ON r.id = d.reservation_id
    JOIN room rm ON rm.id = d.room_id;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION '0071: minibar counted twice in one period (BUG-R2-197, K1b′ – handle by hand, ARC 16.17 mục 3): %', bad;
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
ALTER TABLE minibar_fill ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_check FORCE ROW LEVEL SECURITY;
