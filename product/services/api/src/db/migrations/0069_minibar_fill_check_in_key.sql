-- 0069 (drizzle draft from schema/inventory.ts, completed by hand – BE-B, R2 Sprint 4 tuần Ổn định, vòng sửa 5b;
-- number from ORC 18/10). K11-02 (recheck 5b, ARC 16.19): ONE `check_in` fill per fridge (stay × room). The
-- copy-on-write of a catalogue change (createItem/updateItem) does not take the fridge lock: racing the first count
-- of a fridge never filled it wrote a second `check_in`, the count stayed in the older period and was charged
-- again. With this index both writers use INSERT … ON CONFLICT DO NOTHING and read the winner back.
-- Before the index: a fridge that already has more than one `check_in` → RAISE with the list (money is never
-- repaired here – OPS/QA follow ARC's manual steps). Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the
-- migrator's single transaction; FORCE RLS binds the owner too, so RLS is off for the check only.
ALTER TABLE minibar_fill NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(format('reservation %s room %s (%s check_in fills)', reservation_id, room_id, n), '; ')
    INTO bad
    FROM (SELECT reservation_id, room_id, count(*) AS n
            FROM minibar_fill
           WHERE source = 'check_in'
           GROUP BY reservation_id, room_id
          HAVING count(*) > 1) x;
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION '0069: fridges with more than one check_in fill (K11-02 data – not repaired automatically): %', bad;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE minibar_fill ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE minibar_fill FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE UNIQUE INDEX "minibar_fill_check_in_key" ON "minibar_fill" USING btree ("reservation_id","room_id") WHERE "minibar_fill"."source" = 'check_in';
