-- 0097 (hand-written – BE, R5 v1.0.5 V5-17: BUG-R4-043, FB-R4-SEC-OPS-ROPACK-06). No column changes: the snapshot is
-- 0095's plus one index (stay_night_reservation_idx, also in src/db/schema/reservations.ts). Journal idx 72, after
-- 0095 at idx 71. 0096 is never used (ARC P404-02, decision-log 04/11); the number is provisional until ORC confirms
-- it (journal rule s3-contract 4.2).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction. Additive only: one
-- index, three functions, two triggers, one data correction of a derived flag. The v1.0.4 image runs on this database
-- unchanged (it writes the flag by channel; the triggers below store the value of the rule instead – no write is
-- refused).
--
-- Rule (BR-904 v0.5.5, DOM lượt 6 05/11 in rounds/round-04/reviews/DOM-on-v104-pr68-docs.md; DATA metrics Q-05,
-- K-02, K-04): the complimentary flag follows the money, not the channel, in every channel.
--   * Night: stay_night.is_complimentary = (room_revenue_vnd = 0) – the room money of the night after its
--     discounts (room_revenue_vnd = room_revenue_gross_vnd − discount_vnd, CHECK stay_night_money_check). So:
--       - an Internal night at 0 ₫ (booked, typed 0 on B13/B9a/B18, or A31 back to 0 by OWN/MGR) → true;
--       - an "Internal with a charge" night (> 0 ₫, BR-421 v0.5.3 (b)) → false: a sold night with money, in ADR;
--       - FOC / special discount of 100 % on the night's room line (BR-431…434: discount = gross) → true; any
--         partial FOC / discount, and the reversal or refusal of one → false (the night stays a sold night; ADR
--         takes its net money);
--       - OTA nights (the OTA total split per night, Q-12), lease nights (`lease_allocation`, Q-10) and every other
--         night: the same rule – only a night whose room money is 0 is complimentary.
--     The BR-110 extra-person fee (extra_person_fee_vnd), early/late surcharges, minibar and services are "other
--     revenue" (metrics Q-05, BR-904): they never make a night complimentary or not.
--   * Booking: reservation.is_complimentary = the stay's room money is 0 = reservation_is_complimentary(id):
--       - a booking with a live night (hold / sold): Σ room_revenue_vnd of its live nights = 0;
--       - a booking without a live night (cancelled, no-show, hold expired, relocated, channel cancelled): Σ
--         room_revenue_vnd of the nights it closed with (void, void_reason ≠ date_change – the nights of earlier
--         dates are left out) = 0 – voiding moves no money, so closing a booking never changes its flag;
--       - a booking without any night (a manual long stay before its lease nights exist): false.
--     total_room_vnd is NOT the basis: it is Σ GROSS (A31 / extension write it) and stays 0 for a manual long stay
--     whose rent lives in its lease nights.
--
-- What this migration does:
--   (0) index stay_night_reservation_idx (reservation_id): every night of one booking, void ones too. The only index
--       on reservation_id so far is partial (stay_night_reservation_date_uk, not void), so the booking rule below
--       would read the whole table on each night write without it. Plain CREATE INDEX: a SHARE lock on stay_night
--       for the build, inside the maintenance window (writes wait, reads go on); the table is small (10 units);
--   (1) reservation_is_complimentary(uuid): the booking rule above, one source for the trigger and the back-fill;
--   (2) the back-fill (BUG-R4-043 "tính lại dữ liệu trước báo cáo ADR đầu tiên"): every stay_night row (void ones
--       too, for one invariant) and every reservation row whose flag differs from the rule. Idempotent: rows that
--       already follow the rule are not written; a second run writes 0 rows. updated_at is NOT touched (a derived
--       flag, not a change of the booking; no API field shows it). Prints COUNTS only (RAISE NOTICE – no id, no
--       code, no amount, no guest column) and stops (RAISE EXCEPTION, whole migration rolled back) if a row still
--       differs afterwards;
--   (3) trigger stay_night_complimentary_follows_revenue (BEFORE INSERT OR UPDATE, row): NEW.is_complimentary :=
--       NEW.room_revenue_vnd = 0 – every write path, today's and later ones, and the v1.0.4 image after a rollback;
--   (4) trigger stay_night_reservation_complimentary (AFTER INSERT OR UPDATE, row): when a night's money, state,
--       void reason or booking changes, the booking's flag is recomputed (written only when it changes).
--       Locks: every writer of stay_night already holds its booking row (lock order reservation → room → folio,
--       folio.service lockStay / BE-A use cases, FOR NO KEY UPDATE); the UPDATE here takes the same row lock in the
--       same mode, so it adds no new wait. A night's commission / channel-fee / extra-person write changes none of
--       the four columns: no booking write.
-- The application writes the same value itself (reservation-store insertNights, setNightRate, the allocation
-- service, lease-nights, the re-price / move writers); the triggers make it hold for every path.
-- Measured from outside by the read-only count scripts/v5-17-complimentary-check.sql (runbook v1.0.5 M4d: "before"
-- in P2 step 3, "after" in K12) – expected after: 0|0 and 0|0.
-- Functions: SECURITY INVOKER (RLS applies as for the caller), fixed search_path, schema-qualified tables (pattern
-- 0094/0095); EXECUTE revoked from PUBLIC; ottimo_app may run reservation_is_complimentary (the trigger body calls it
-- as the writing role). Triggers ENABLE (origin), like 0090/0094: the e2e reset under session_replication_role =
-- replica and pg_restore (COPY, triggers created post-data) are unaffected.
CREATE INDEX "stay_night_reservation_idx" ON "stay_night" USING btree ("reservation_id");
--> statement-breakpoint
CREATE FUNCTION reservation_is_complimentary(p_reservation_id uuid) RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY INVOKER
  SET search_path = pg_catalog, pg_temp
AS $$
  SELECT CASE
           WHEN bool_or(n.night_state <> 'void')
             THEN COALESCE(sum(n.room_revenue_vnd) FILTER (WHERE n.night_state <> 'void'), 0) = 0
           WHEN bool_or(n.night_state = 'void' AND n.void_reason IS DISTINCT FROM 'date_change')
             THEN COALESCE(sum(n.room_revenue_vnd)
                             FILTER (WHERE n.night_state = 'void' AND n.void_reason IS DISTINCT FROM 'date_change'),
                           0) = 0
           ELSE false
         END
    FROM public.stay_night n
   WHERE n.reservation_id = p_reservation_id
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION reservation_is_complimentary(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION reservation_is_complimentary(uuid) TO ottimo_app;
--> statement-breakpoint
-- (2) back-fill. FORCE RLS binds the owner too: RLS is off for these two tables for the back-fill only (pattern
-- 0068), inside the migrator's transaction.
ALTER TABLE stay_night NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- v5-17 back-fill
DO $$
DECLARE
  nights_true bigint;
  nights_false bigint;
  bookings_true bigint;
  bookings_false bigint;
  nights_left bigint;
  bookings_left bigint;
BEGIN
  WITH fixed AS (
    UPDATE stay_night SET is_complimentary = (room_revenue_vnd = 0)
     WHERE is_complimentary IS DISTINCT FROM (room_revenue_vnd = 0)
    RETURNING is_complimentary
  )
  SELECT count(*) FILTER (WHERE is_complimentary), count(*) FILTER (WHERE NOT is_complimentary)
    INTO nights_true, nights_false
    FROM fixed;
  WITH fixed AS (
    UPDATE reservation r SET is_complimentary = reservation_is_complimentary(r.id)
     WHERE r.is_complimentary IS DISTINCT FROM reservation_is_complimentary(r.id)
    RETURNING r.is_complimentary
  )
  SELECT count(*) FILTER (WHERE is_complimentary), count(*) FILTER (WHERE NOT is_complimentary)
    INTO bookings_true, bookings_false
    FROM fixed;
  SELECT count(*) INTO nights_left FROM stay_night WHERE is_complimentary IS DISTINCT FROM (room_revenue_vnd = 0);
  SELECT count(*) INTO bookings_left
    FROM reservation r WHERE r.is_complimentary IS DISTINCT FROM reservation_is_complimentary(r.id);
  IF nights_left <> 0 OR bookings_left <> 0 THEN
    RAISE EXCEPTION '0097: is_complimentary still differs from the rule on % night(s) and % booking(s)',
      nights_left, bookings_left;
  END IF;
  RAISE NOTICE '0097 is_complimentary recomputed: nights % (to true %, to false %), bookings % (to true %, to false %)',
    nights_true + nights_false, nights_true, nights_false,
    bookings_true + bookings_false, bookings_true, bookings_false;
END $$;
--> statement-breakpoint
ALTER TABLE reservation ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reservation FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stay_night FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- (3) the night follows its money on every write.
CREATE FUNCTION stay_night_complimentary_follows_revenue() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  NEW.is_complimentary := NEW.room_revenue_vnd = 0;
  RETURN NEW;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION stay_night_complimentary_follows_revenue() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER stay_night_complimentary_follows_revenue BEFORE INSERT OR UPDATE ON stay_night
  FOR EACH ROW EXECUTE FUNCTION stay_night_complimentary_follows_revenue();
--> statement-breakpoint
-- (4) the booking follows the money of its nights.
CREATE FUNCTION stay_night_reservation_complimentary() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.reservation_id = NEW.reservation_id
     AND OLD.room_revenue_vnd = NEW.room_revenue_vnd
     AND OLD.night_state = NEW.night_state
     AND OLD.void_reason IS NOT DISTINCT FROM NEW.void_reason THEN
    RETURN NULL;
  END IF;
  UPDATE public.reservation r SET is_complimentary = public.reservation_is_complimentary(r.id)
   WHERE r.id = NEW.reservation_id
     AND r.is_complimentary IS DISTINCT FROM public.reservation_is_complimentary(r.id);
  IF TG_OP = 'UPDATE' AND OLD.reservation_id <> NEW.reservation_id THEN
    UPDATE public.reservation r SET is_complimentary = public.reservation_is_complimentary(r.id)
     WHERE r.id = OLD.reservation_id
       AND r.is_complimentary IS DISTINCT FROM public.reservation_is_complimentary(r.id);
  END IF;
  RETURN NULL;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION stay_night_reservation_complimentary() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER stay_night_reservation_complimentary AFTER INSERT OR UPDATE ON stay_night
  FOR EACH ROW EXECUTE FUNCTION stay_night_reservation_complimentary();
