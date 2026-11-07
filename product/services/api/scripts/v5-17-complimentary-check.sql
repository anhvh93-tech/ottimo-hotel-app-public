-- V5-17 (BUG-R4-043, FB-R4-SEC-OPS-ROPACK-06; DOM BR-904 v0.5.5, DATA Q-05) – READ-ONLY count of the
-- complimentary flags that differ from the money: the M4d step of the v1.0.5 runbook
-- (rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md 1.6), run "before" right before the release that carries
-- migration 0097 (P2 step 3; again before Đợt C if it is another day) and "after" it (K12).
--
-- Output, in this order (nothing else – never an id, a booking code, a room, a date, an amount or a guest column):
--   1. the guard: no row when the run is right; otherwise the run STOPS with "v5-17 check stopped: …";
--   2. one line co_mien_phi_ma_co_tien|khong_co_mien_phi_ma_0d – nights that are not void: flag true while the
--      night's room money (room_revenue_vnd, after discounts) is > 0 | flag false while it is 0. Exactly the M4d
--      query SEC approved for security (SEC-on-ops-prs-92-93-95.md 1.4), unchanged;
--   3. one line don_mien_phi_ma_co_tien|don_khong_mien_phi_ma_0d – bookings: flag true while the stay's room money is
--      > 0 | flag false while it is 0. The booking rule is the one of migration 0097 (function
--      reservation_is_complimentary), written out here so the same file runs BEFORE 0097 exists (v1.0.4):
--        live nights (hold / sold) → Σ room_revenue_vnd of the live nights = 0;
--        no live night → Σ of the void nights other than void_reason = date_change (the nights it closed with) = 0;
--        no night at all → false.
--      Test: test/integration/v5-17-complimentary-follows-revenue.test.ts compares it with the function.
-- Reading: after 0097 both lines are 0|0. Before it, line 2 counts at least the "Internal with a charge" nights and
-- the Internal nights an A31 raised above 0 (BUG-R4-043); line 3 the "Internal with a charge" bookings (true → false)
-- and the bookings whose every live night was FOC'd 100 % (false → true). Only the numbers go in the repo.
-- After 0097, a number other than 0 → STOP, report BE + DATA (the triggers of 0097 are missing or disabled: K3).
--
-- Columns read: stay_night (is_complimentary, room_revenue_vnd, night_state, void_reason, reservation_id),
-- reservation (id, is_complimentary). Money columns only inside WHERE / FILTER / an aggregate compared with 0 – no
-- value is printed. All exist in v1.0.4. Nothing is changed: BEGIN READ ONLY … ROLLBACK, no DO, no SET, no write.
--
-- Run (ORC; same channel as the SQLRO block of the runbook – role ottimo_readonly, BYPASSRLS + SELECT, inside a READ
-- ONLY transaction). The file goes in on STDIN from the repo on the Mac (one source, compare its SHA-256 first), e.g.
-- from `product/` on a checkout of the commit to deploy:
--   docker compose --env-file .env -f infra/docker-compose.yml exec -T \
--     -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" \
--     postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -f -' \
--     < services/api/scripts/v5-17-complimentary-check.sql
-- On production OPS writes the pinned block into the runbook (P2 step 3, K12) and SEC pins its SHA-256.

BEGIN TRANSACTION READ ONLY;

-- Guard: stop with an error that names the cause – never print 0|0 that only means "nothing visible". Plain SQL,
-- no DO block: the failing branch casts its own constant message to boolean, so psql stops (ON_ERROR_STOP) with
-- `invalid input syntax for type boolean: "v5-17 check stopped: …"`. On success it prints nothing (no row).
SELECT 1 AS guard
 WHERE (CASE
          WHEN NOT COALESCE((SELECT r.rolbypassrls OR r.rolsuper FROM pg_roles r WHERE r.rolname = current_user), false)
               AND COALESCE(current_setting('app.property_id', true), '') = ''
            THEN 'v5-17 check stopped: run as ottimo_readonly (BYPASSRLS) - under RLS without a tenant nothing shows'
          WHEN NOT EXISTS (SELECT 1 FROM property)
            THEN 'v5-17 check stopped: no property is visible'
          ELSE 'false'
        END)::boolean;

SELECT count(*) FILTER (WHERE is_complimentary AND room_revenue_vnd > 0)      AS co_mien_phi_ma_co_tien,
       count(*) FILTER (WHERE NOT is_complimentary AND room_revenue_vnd = 0)  AS khong_co_mien_phi_ma_0d
  FROM stay_night
 WHERE night_state <> 'void';

WITH b AS (
  SELECT r.is_complimentary AS flag,
         CASE
           WHEN bool_or(n.night_state <> 'void')
             THEN COALESCE(sum(n.room_revenue_vnd) FILTER (WHERE n.night_state <> 'void'), 0) = 0
           WHEN bool_or(n.night_state = 'void' AND n.void_reason IS DISTINCT FROM 'date_change')
             THEN COALESCE(sum(n.room_revenue_vnd)
                             FILTER (WHERE n.night_state = 'void' AND n.void_reason IS DISTINCT FROM 'date_change'),
                           0) = 0
           ELSE false
         END AS by_money
    FROM reservation r
    LEFT JOIN stay_night n ON n.reservation_id = r.id
   GROUP BY r.id, r.is_complimentary
)
SELECT count(*) FILTER (WHERE flag AND NOT by_money) AS don_mien_phi_ma_co_tien,
       count(*) FILTER (WHERE NOT flag AND by_money) AS don_khong_mien_phi_ma_0d
  FROM b;

ROLLBACK;
