-- 0075 (hand-written data migration – BE-B, R2 Sprint 4 tuần Ổn định, vòng sửa 7; ARC `openapi-0.3.7.md` 16.27 (3),
-- R7MIG-01). No schema change: the snapshot is 0074's (pattern 0064/0067).
-- Step (a) of 0067 back-filled only fridges WITHOUT any `minibar_fill`: a count of 365486f (`fill_id` NULL) whose
-- fridge got a `carry` (B13) or `refill` (HK done) period afterwards on ce90d19/f04052d stayed without a period – K1
-- ≠ 0, 0071 (old body) stopped `migrate` on valid data. Now EVERY `checkout` count without a period (live or
-- replaced, every stay state) gets one:
-- (1) the period of each such count (ARC 16.27 (3) as revised 18/10): the latest `carry` / `refill` / `backfill`
--     fill written (`created_at`) before the count, else the fridge's `check_in` fill (always its FIRST period,
--     whatever its times), else the period before any fill;
-- (2) K1b′ – a fridge with more than one live count in ONE period (computed as in (1), before any write) is a
--     double charge (BUG-R2-197 shape) → RAISE with the list; never repaired here (ARC 16.17 mục 3 bổ sung, by hand);
-- (3) a fridge with a count in "the period before any fill" gets a `backfill` fill: `filled_at` = `created_at` =
--     its earliest count without a period − 1 ms, lines = that count's `standard_qty` (≥ 1) and price snapshots;
--     then every count without a period gets the fill of (1) (the backfill for those before any fill). The
--     `carry`/`refill` fills written since keep their order (16.16 (x));
-- (4) K1 – a live `checkout` count still without a period → RAISE (must be 0).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction; FORCE RLS binds
-- the owner too, so RLS is off for these tables only (pattern 0065–0067).
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room DISABLE ROW LEVEL SECURITY;
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
-- (1) + (2) K1b′ on the periods computed before any write
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
    RAISE EXCEPTION '0075: minibar counted twice in one period (BUG-R2-197, K1b′ – handle by hand, ARC 16.17 mục 3): %', bad;
  END IF;
END $$;
--> statement-breakpoint
-- (3) the backfill fill (with its lines) of every fridge that has a count before any fill
WITH nul AS (
  SELECT c.id, c.organization_id, c.property_id, c.reservation_id, c.room_id, c.created_at,
         EXISTS (SELECT 1 FROM minibar_fill f
                  WHERE f.reservation_id = c.reservation_id AND f.room_id = c.room_id
                    AND (f.source = 'check_in'
                         OR (f.source IN ('carry', 'refill', 'backfill') AND f.created_at <= c.created_at)))
           AS has_period
    FROM minibar_check c
   WHERE c.mode = 'checkout' AND c.fill_id IS NULL
), fridge AS (
  SELECT DISTINCT ON (n.reservation_id, n.room_id)
         n.organization_id, n.property_id, n.reservation_id, n.room_id, n.id AS first_check_id,
         n.created_at - interval '1 millisecond' AS at
    FROM nul n
   WHERE EXISTS (SELECT 1 FROM nul x
                  WHERE x.reservation_id = n.reservation_id AND x.room_id = n.room_id AND NOT x.has_period)
   ORDER BY n.reservation_id, n.room_id, n.created_at, n.id
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
-- … and the period of every count without one (rule (1); the backfill is written before each of its counts)
UPDATE minibar_check c
   SET fill_id = t.fill_id
  FROM (SELECT k.id, COALESCE((SELECT f.id FROM minibar_fill f
                                WHERE f.reservation_id = k.reservation_id AND f.room_id = k.room_id
                                  AND f.source IN ('carry', 'refill', 'backfill') AND f.created_at <= k.created_at
                                ORDER BY f.created_at DESC, f.id DESC LIMIT 1),
                               (SELECT f.id FROM minibar_fill f
                                 WHERE f.reservation_id = k.reservation_id AND f.room_id = k.room_id
                                   AND f.source = 'check_in' LIMIT 1)) AS fill_id
          FROM minibar_check k
         WHERE k.mode = 'checkout' AND k.fill_id IS NULL) t
 WHERE c.id = t.id AND t.fill_id IS NOT NULL;
--> statement-breakpoint
-- (4) K1 = 0: no live count left without a period
DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(format('%s room %s: count %s', r.code, rm.room_no, c.id), '; ' ORDER BY r.code, rm.room_no)
    INTO bad
    FROM minibar_check c
    JOIN reservation r ON r.id = c.reservation_id
    JOIN room rm ON rm.id = c.room_id
   WHERE c.mode = 'checkout' AND c.fill_id IS NULL
     AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id);
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION '0075: minibar counts still without a period (K1): %', bad;
  END IF;
END $$;
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
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE room FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
