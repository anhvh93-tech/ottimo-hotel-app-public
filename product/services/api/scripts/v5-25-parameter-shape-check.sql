-- V5-25 (BUG-R5-001 / BUG-R5-003 / BUG-R5-004; DOM rules-v1.0.5 8.4, 12.1–12.4, 13.1–13.4; ARC 0.3.13
-- bổ sung 1, 1.24) – READ-ONLY shape check of the structured parameters that got a save rule in V5-25: are the
-- values already stored valid under the new rules? Run once, right before the deploy of v1.0.5 (ARC review #96 ĐK-2).
--
-- Output, in this order (nothing else – never a value, a property name, a booking id or any guest column):
--   1. the guard: no row when the run is right; otherwise the run STOPS with "v5-25 check stopped: …" (see below);
--   2. key | effective_from | ok – one line per row of a checked key (ok = true: the new save rule accepts it). Rows
--      covered, per property and key: the row in force on the property's business date (BR-010: local time minus
--      business_day_rollover, 06:00 when absent) and every row scheduled after it;
--   3. open_bookings_cancel_policy_broken | n – how many OPEN bookings (status hold, confirmed, in_house) carry a
--      cancel policy copied into pricing_snapshot.cancelPolicy that breaks the cancel_policy_direct rule (DOM 13.2,
--      card FB-R5-DOM-BE-PR96-02 (a)); a booking without a copy (absent or null: the policy in force is used) is not
--      counted;
--   4. damage_catalog_rows_broken | n – how many damage_catalog ROWS break its save rule (DOM 13.4, card 02 (b), QA
--      BUG-R5-004): EVERY row is counted, the one in force on the business date AND every row scheduled for a later
--      day (a broken scheduled row starts the incident on its own date).
-- The rules mirror `src/modules/platform/public/parameter-shapes.ts` (test: test/integration/v5-25-parameter-save
-- .test.ts runs this file against the shared cases of test/helpers/parameter-shape-cases.ts); min_stay ↔
-- short_stay_max_nights is checked both ways over the period each row is in force (DOM 12.2, ARC review #96 1).
-- damage_catalog: rule of the stacked PR (BUG-R5-004) – code ^[a-z0-9_]{1,40}$ and name not repeated (name compared
-- with lower() after trimming spaces, tabs and line breaks at both ends: the database collation decides case for
-- non-ASCII letters), name 1–100 characters, priceVnd whole 1.000–20.000.000, at most 100 items, no other key.
--
-- Run (ORC; ARC FB-R5-ARC-BE-03): the file is NOT inside the postgres container – it goes in on STDIN. Role
-- ottimo_readonly (BYPASSRLS + SELECT) inside a READ ONLY transaction, like ops-check. From `product/` on the server:
--   docker compose --env-file .env -f infra/docker-compose.yml exec -T \
--     -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" \
--     postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -f -' \
--     < services/api/scripts/v5-25-parameter-shape-check.sql
-- On production use the block pinned by SEC (rounds/round-05/reviews/SEC-on-pr-96-v5-25.md 4.3, same stdin and role,
-- SHA-256 of this file compared first); OPS puts it in the v1.0.5 runbook before the switch to SHA_V105.
-- Needs Postgres ≥ 16 (pg_input_is_valid). Nothing is changed (no DO, no SET, no write; ends with ROLLBACK).
--
-- Reading the result (ARC review #96 ĐK-2, card 03):
--   * "v5-25 check stopped: …" – nothing was checked (wrong role, RLS without a tenant, no property or no parameter
--     row visible): fix the run; never read it as "all ok";
--   * every property shows at least min_stay, weekend_nights and short_stay_max_nights; missing → the run is wrong;
--   * ok = false on min_stay or weekend_nights → STOP the deploy; fix the value on the Desk first;
--   * ok = false on another key → note key and date, fix on the Desk after the deploy (DOM 13.2);
--   * open_bookings_cancel_policy_broken or damage_catalog_rows_broken other than 0 → STOP the deploy, wait for DOM.
-- A row with ok = false is fixed on the Desk (setParameter of a corrected value, or cancel-scheduled for a scheduled
-- row) – never by an UPDATE.

BEGIN TRANSACTION READ ONLY;

-- Guard (ARC FB-R5-ARC-BE-02): stop with an error that names the cause – never print an empty result that looks like
-- "nothing broken". Plain SQL, no DO block: the failing branch casts its own constant message to boolean, so psql
-- stops (ON_ERROR_STOP) with `invalid input syntax for type boolean: "v5-25 check stopped: …"`. On success it prints
-- nothing (no row).
SELECT 1 AS guard
 WHERE (CASE
          WHEN NOT COALESCE((SELECT r.rolbypassrls OR r.rolsuper FROM pg_roles r WHERE r.rolname = current_user), false)
               AND COALESCE(current_setting('app.property_id', true), '') = ''
            THEN 'v5-25 check stopped: run as ottimo_readonly (BYPASSRLS) - under RLS without a tenant nothing shows'
          WHEN NOT EXISTS (SELECT 1 FROM property)
            THEN 'v5-25 check stopped: no property is visible'
          WHEN NOT EXISTS (SELECT 1 FROM config_parameter
                            WHERE key IN ('min_stay', 'weekend_nights', 'short_stay_max_nights'))
            THEN 'v5-25 check stopped: no row of min_stay, weekend_nights, short_stay_max_nights is visible'
          ELSE 'false'
        END)::boolean;

WITH
keys(key) AS (
  VALUES ('min_stay'), ('weekend_nights'), ('short_stay_max_nights'), ('special_dates'), ('los_discount'),
         ('cancel_policy_direct'), ('early_checkin_tiers'), ('late_checkout_tiers'), ('early_departure_refund'),
         ('checkout_reminders'), ('weekend_uplift_channels'), ('special_uplift_channels'),
         ('max_open_holds_per_user'), ('lease_terms')
),
-- Every row of these keys (+ business_day_rollover) with the period it is in force: [s, e), e = next row's date.
cp AS (
  SELECT c.property_id, c.key, c.effective_from AS s,
         lead(c.effective_from) OVER (PARTITION BY c.property_id, c.key ORDER BY c.effective_from) AS e,
         c.value AS v
    FROM config_parameter c
   WHERE c.key IN (SELECT key FROM keys) OR c.key = 'business_day_rollover'
),
-- Business date of each property (BR-010).
bd AS (
  SELECT pr.id AS property_id,
         ((now() AT TIME ZONE pr.timezone) - COALESCE(
            (SELECT CASE WHEN jsonb_typeof(o.v) = 'string'
                          AND (o.v #>> '{}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
                         THEN (o.v #>> '{}')::interval END
               FROM cp o
              WHERE o.property_id = pr.id AND o.key = 'business_day_rollover'
                AND o.s <= (now() AT TIME ZONE pr.timezone)::date
              ORDER BY o.s DESC LIMIT 1),
            interval '6 hours'))::date AS d
    FROM property pr
),
-- The rows checked: in force on the business date, or scheduled after it. s2 = start of the part still to come.
r AS (
  SELECT cp.property_id, cp.key, cp.s, cp.e, cp.v, greatest(cp.s, bd.d) AS s2
    FROM cp JOIN bd USING (property_id)
   WHERE cp.key <> 'business_day_rollover' AND (cp.e IS NULL OR cp.e > bd.d)
),
-- What a row's rule depends on, over its own period [s2, e):
--   cap  – min_stay: min(7, every whole short_stay_max_nights in force meanwhile), 7 when none;
--   need – short_stay_max_nights: the largest whole `nights` of a min_stay rule in force meanwhile (0 when none);
--   roll – late_checkout_tiers: business_day_rollover in minutes on its first day (0 when absent or broken).
x AS (
  SELECT r.*,
    COALESCE((
      SELECT CASE WHEN min(n) >= 1 THEN least(7, min(n)) END
        FROM (SELECT CASE WHEN jsonb_typeof(o.v) = 'number'
                          THEN CASE WHEN (o.v)::numeric = trunc((o.v)::numeric) THEN (o.v)::numeric END END AS n
                FROM cp o
               WHERE o.property_id = r.property_id AND o.key = 'short_stay_max_nights'
                 AND o.s < COALESCE(r.e, 'infinity'::date) AND COALESCE(o.e, 'infinity'::date) > r.s2) q
    ), 7) AS cap,
    COALESCE((
      SELECT max(n)
        FROM (SELECT CASE WHEN jsonb_typeof(m.rule->'nights') = 'number'
                          THEN (m.rule->'nights')::numeric END AS n
                FROM cp o
                CROSS JOIN LATERAL jsonb_array_elements(
                  CASE WHEN jsonb_typeof(o.v) = 'array' THEN o.v ELSE '[]'::jsonb END) AS m(rule)
               WHERE o.property_id = r.property_id AND o.key = 'min_stay' AND jsonb_typeof(m.rule) = 'object'
                 AND o.s < COALESCE(r.e, 'infinity'::date) AND COALESCE(o.e, 'infinity'::date) > r.s2) q
       WHERE n = trunc(n)
    ), 0) AS need,
    COALESCE((
      SELECT CASE WHEN jsonb_typeof(o.v) = 'string' AND (o.v #>> '{}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
                  THEN split_part(o.v #>> '{}', ':', 1)::int * 60 + split_part(o.v #>> '{}', ':', 2)::int END
        FROM cp o
       WHERE o.property_id = r.property_id AND o.key = 'business_day_rollover' AND o.s <= r.s2
       ORDER BY o.s DESC LIMIT 1
    ), 0) AS roll,
    CASE WHEN jsonb_typeof(r.v) = 'array' THEN r.v ELSE '[]'::jsonb END AS a,
    CASE WHEN jsonb_typeof(r.v) = 'object' THEN r.v ELSE '{}'::jsonb END AS o
    FROM r
),
-- Elements of a list value, with safe typed views (NULL when the type is wrong – nothing here can raise an error).
el AS (
  SELECT x.property_id, x.key, x.s, t.i, t.e AS el,
         CASE WHEN jsonb_typeof(t.e) = 'object' THEN t.e ELSE '{}'::jsonb END AS eo
    FROM x CROSS JOIN LATERAL jsonb_array_elements(x.a) WITH ORDINALITY AS t(e, i)
),
-- Times of the tier keys in minutes (NULL when not "HH:mm").
tm AS (
  SELECT el.*,
    CASE WHEN jsonb_typeof(el.eo->k1) = 'string' AND (el.eo->>k1) ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         THEN split_part(el.eo->>k1, ':', 1)::int * 60 + split_part(el.eo->>k1, ':', 2)::int END AS t1,
    CASE WHEN jsonb_typeof(el.eo->k2) = 'string' AND (el.eo->>k2) ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
         THEN split_part(el.eo->>k2, ':', 1)::int * 60 + split_part(el.eo->>k2, ':', 2)::int END AS t2
    FROM el
    CROSS JOIN LATERAL (SELECT CASE el.key WHEN 'late_checkout_tiers' THEN 'after' ELSE 'from' END AS k1,
                               CASE el.key WHEN 'late_checkout_tiers' THEN 'until' ELSE 'to' END AS k2) kk
   WHERE el.key IN ('early_checkin_tiers', 'late_checkout_tiers')
),
-- Tier ranges on their axis (late check-out: a time before the rollover belongs to the next calendar day).
rg AS (
  SELECT tm.property_id, tm.key, tm.s, tm.i,
         CASE WHEN tm.key = 'late_checkout_tiers' AND tm.t1 < x.roll THEN tm.t1 + 1440 ELSE tm.t1 END AS lo,
         CASE WHEN tm.key = 'late_checkout_tiers' AND tm.t2 < x.roll THEN tm.t2 + 1440 ELSE tm.t2 END AS hi
    FROM tm JOIN x USING (property_id, key, s)
),
-- One verdict per element (true = accepted). Missing pieces give NULL → read as false.
ev AS (
  SELECT el.property_id, el.key, el.s, el.i, COALESCE(
    CASE el.key
      WHEN 'min_stay' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k)
                         WHERE k NOT IN ('nights', 'channels', 'arrivalWeekdays', 'arrivalOnSpecialDates'))
        AND jsonb_typeof(el.eo->'nights') = 'number'
        AND (CASE WHEN jsonb_typeof(el.eo->'nights') = 'number' THEN (el.eo->'nights')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(el.eo->'nights') = 'number' THEN (el.eo->'nights')::numeric END)
        AND (CASE WHEN jsonb_typeof(el.eo->'nights') = 'number' THEN (el.eo->'nights')::numeric END)
            BETWEEN 1 AND x.cap
        AND (el.eo->'channels' = '"all"'::jsonb
             OR (jsonb_typeof(el.eo->'channels') = 'array'
                 AND (SELECT count(*) > 0 AND count(*) = count(DISTINCT g)
                             AND bool_and(g IN ('"direct"'::jsonb, '"agent"'::jsonb, '"ota"'::jsonb))
                        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(el.eo->'channels') = 'array'
                                                       THEN el.eo->'channels' ELSE '[]'::jsonb END) AS g(g))))
        AND (NOT el.eo ? 'arrivalWeekdays'
             OR (jsonb_typeof(el.eo->'arrivalWeekdays') = 'array'
                 AND (SELECT count(*) = count(DISTINCT d)
                             AND COALESCE(bool_and(d IN ('"MON"'::jsonb, '"TUE"'::jsonb, '"WED"'::jsonb,
                                                          '"THU"'::jsonb, '"FRI"'::jsonb, '"SAT"'::jsonb,
                                                          '"SUN"'::jsonb)), true)
                        FROM jsonb_array_elements(CASE WHEN jsonb_typeof(el.eo->'arrivalWeekdays') = 'array'
                                                       THEN el.eo->'arrivalWeekdays' ELSE '[]'::jsonb END) AS d(d))))
        AND (NOT el.eo ? 'arrivalOnSpecialDates' OR jsonb_typeof(el.eo->'arrivalOnSpecialDates') = 'boolean')
        AND ((jsonb_typeof(el.eo->'arrivalWeekdays') = 'array' AND jsonb_array_length(
               CASE WHEN jsonb_typeof(el.eo->'arrivalWeekdays') = 'array'
                    THEN el.eo->'arrivalWeekdays' ELSE '[]'::jsonb END) > 0)
             OR el.eo->'arrivalOnSpecialDates' = 'true'::jsonb)
      WHEN 'special_dates' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('name', 'from', 'to'))
        AND (NOT el.eo ? 'name'
             OR (jsonb_typeof(el.eo->'name') = 'string' AND char_length(el.eo->>'name') <= 100))
        AND jsonb_typeof(el.eo->'from') = 'string' AND (el.eo->>'from') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        AND pg_input_is_valid(el.eo->>'from', 'date')
        AND jsonb_typeof(el.eo->'to') = 'string' AND (el.eo->>'to') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        AND pg_input_is_valid(el.eo->>'to', 'date')
        AND (CASE WHEN pg_input_is_valid(el.eo->>'from', 'date') AND pg_input_is_valid(el.eo->>'to', 'date')
                  THEN (el.eo->>'to')::date - (el.eo->>'from')::date END) BETWEEN 1 AND 31
      WHEN 'los_discount' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('minNights', 'pct'))
        AND (CASE WHEN jsonb_typeof(el.eo->'minNights') = 'number' THEN (el.eo->'minNights')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(el.eo->'minNights') = 'number' THEN (el.eo->'minNights')::numeric END)
        AND (CASE WHEN jsonb_typeof(el.eo->'minNights') = 'number' THEN (el.eo->'minNights')::numeric END)
            BETWEEN 1 AND 89
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number' THEN (el.eo->'pct')::numeric END) BETWEEN 0 AND 100
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number'
                  THEN (el.eo->'pct')::numeric = round((el.eo->'pct')::numeric, 2) END)
      WHEN 'cancel_policy_direct' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('minDays', 'refundPct'))
        AND (CASE WHEN jsonb_typeof(el.eo->'minDays') = 'number' THEN (el.eo->'minDays')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(el.eo->'minDays') = 'number' THEN (el.eo->'minDays')::numeric END)
        AND (CASE WHEN jsonb_typeof(el.eo->'minDays') = 'number' THEN (el.eo->'minDays')::numeric END)
            BETWEEN 0 AND 365
        AND (CASE WHEN jsonb_typeof(el.eo->'refundPct') = 'number' THEN (el.eo->'refundPct')::numeric END)
            BETWEEN 0 AND 100
        AND (CASE WHEN jsonb_typeof(el.eo->'refundPct') = 'number'
                  THEN (el.eo->'refundPct')::numeric = round((el.eo->'refundPct')::numeric, 2) END)
      WHEN 'early_checkin_tiers' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('from', 'to', 'pct'))
        AND (SELECT g.lo < g.hi FROM rg g
              WHERE g.property_id = el.property_id AND g.key = el.key AND g.s = el.s AND g.i = el.i)
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number' THEN (el.eo->'pct')::numeric END) BETWEEN 0 AND 100
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number'
                  THEN (el.eo->'pct')::numeric = round((el.eo->'pct')::numeric, 2) END)
      WHEN 'late_checkout_tiers' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('after', 'until', 'pct'))
        AND (SELECT g.lo < g.hi FROM rg g
              WHERE g.property_id = el.property_id AND g.key = el.key AND g.s = el.s AND g.i = el.i)
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number' THEN (el.eo->'pct')::numeric END) BETWEEN 0 AND 100
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number'
                  THEN (el.eo->'pct')::numeric = round((el.eo->'pct')::numeric, 2) END)
      WHEN 'lease_terms' THEN
        jsonb_typeof(el.el) = 'object'
        AND (CASE WHEN jsonb_typeof(el.eo->'months') = 'number' THEN (el.eo->'months')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(el.eo->'months') = 'number' THEN (el.eo->'months')::numeric END)
        AND (CASE WHEN jsonb_typeof(el.eo->'months') = 'number' THEN (el.eo->'months')::numeric END)
            BETWEEN 1 AND 60
        AND (NOT el.eo ? 'discountPct'
             OR ((CASE WHEN jsonb_typeof(el.eo->'discountPct') = 'number'
                       THEN (el.eo->'discountPct')::numeric END) BETWEEN 0 AND 100
                 AND (CASE WHEN jsonb_typeof(el.eo->'discountPct') = 'number'
                           THEN (el.eo->'discountPct')::numeric = round((el.eo->'discountPct')::numeric, 2) END)))
      ELSE true
    END, false) AS ok
    FROM el JOIN x USING (property_id, key, s)
),
-- One verdict per row.
v AS (
  SELECT x.key, x.s, COALESCE(
    CASE x.key
      WHEN 'weekend_nights' THEN
        jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) > 0
        AND (SELECT count(*) = count(DISTINCT d)
                    AND bool_and(d IN ('"MON"'::jsonb, '"TUE"'::jsonb, '"WED"'::jsonb, '"THU"'::jsonb,
                                       '"FRI"'::jsonb, '"SAT"'::jsonb, '"SUN"'::jsonb))
               FROM jsonb_array_elements(x.a) AS d(d))
      WHEN 'min_stay' THEN jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) <= 20
      WHEN 'short_stay_max_nights' THEN
        (CASE WHEN jsonb_typeof(x.v) = 'number' THEN (x.v)::numeric END)
          = trunc(CASE WHEN jsonb_typeof(x.v) = 'number' THEN (x.v)::numeric END)
        AND (CASE WHEN jsonb_typeof(x.v) = 'number' THEN (x.v)::numeric END) BETWEEN greatest(1, x.need) AND 89
      WHEN 'special_dates' THEN jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) <= 100
      WHEN 'los_discount' THEN
        jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) <= 10
        AND (SELECT count(*) = count(DISTINCT j->'minNights') FROM jsonb_array_elements(x.a) AS t(j))
      WHEN 'cancel_policy_direct' THEN
        jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) BETWEEN 1 AND 10
        AND (SELECT count(*) = count(DISTINCT j->'minDays') FROM jsonb_array_elements(x.a) AS t(j))
      WHEN 'early_checkin_tiers' THEN jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) <= 10
      WHEN 'late_checkout_tiers' THEN jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) <= 10
      WHEN 'lease_terms' THEN
        jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) BETWEEN 1 AND 12
        AND (SELECT count(*) = count(DISTINCT j->'months') FROM jsonb_array_elements(x.a) AS t(j))
      WHEN 'early_departure_refund' THEN
        jsonb_typeof(x.v) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(x.o) AS k(k) WHERE k NOT IN ('minNoticeDays', 'refundPct'))
        AND (CASE WHEN jsonb_typeof(x.o->'minNoticeDays') = 'number' THEN (x.o->'minNoticeDays')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(x.o->'minNoticeDays') = 'number'
                         THEN (x.o->'minNoticeDays')::numeric END)
        AND (CASE WHEN jsonb_typeof(x.o->'minNoticeDays') = 'number' THEN (x.o->'minNoticeDays')::numeric END)
            BETWEEN 0 AND 365
        AND (CASE WHEN jsonb_typeof(x.o->'refundPct') = 'number' THEN (x.o->'refundPct')::numeric END)
            BETWEEN 0 AND 100
        AND (CASE WHEN jsonb_typeof(x.o->'refundPct') = 'number'
                  THEN (x.o->'refundPct')::numeric = round((x.o->'refundPct')::numeric, 2) END)
      WHEN 'checkout_reminders' THEN
        jsonb_typeof(x.v) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(x.o) AS k(k)
                         WHERE k NOT IN ('before', 'overdueWithSameDayArrival', 'overdueOtherwise'))
        AND jsonb_typeof(x.o->'before') = 'array'
        AND (SELECT count(*) <= 6 AND count(*) = count(DISTINCT b)
                    AND COALESCE(bool_and(jsonb_typeof(b) = 'string'
                                          AND (b #>> '{}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9](-1d)?$'), true)
               FROM jsonb_array_elements(CASE WHEN jsonb_typeof(x.o->'before') = 'array'
                                              THEN x.o->'before' ELSE '[]'::jsonb END) AS b(b))
        AND jsonb_typeof(x.o->'overdueWithSameDayArrival') = 'string'
        AND (x.o->>'overdueWithSameDayArrival') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND jsonb_typeof(x.o->'overdueOtherwise') = 'string'
        AND (x.o->>'overdueOtherwise') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      WHEN 'weekend_uplift_channels' THEN
        jsonb_typeof(x.v) = 'string' AND (x.v #>> '{}') IN ('all', 'direct', 'agent', 'ota')
      WHEN 'special_uplift_channels' THEN
        jsonb_typeof(x.v) = 'string' AND (x.v #>> '{}') IN ('all', 'direct', 'agent', 'ota')
      WHEN 'max_open_holds_per_user' THEN
        jsonb_typeof(x.v) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(x.o) AS k(k) WHERE k NOT IN ('collaborator', 'sales_staff'))
        AND (x.o ? 'collaborator'
             AND ((CASE WHEN jsonb_typeof(x.o->'collaborator') = 'number' THEN (x.o->'collaborator')::numeric END)
                   = trunc(CASE WHEN jsonb_typeof(x.o->'collaborator') = 'number'
                                THEN (x.o->'collaborator')::numeric END)
                 AND (CASE WHEN jsonb_typeof(x.o->'collaborator') = 'number'
                           THEN (x.o->'collaborator')::numeric END) BETWEEN 0 AND 50))
        AND (x.o ? 'sales_staff'
             AND ((CASE WHEN jsonb_typeof(x.o->'sales_staff') = 'number' THEN (x.o->'sales_staff')::numeric END)
                   = trunc(CASE WHEN jsonb_typeof(x.o->'sales_staff') = 'number'
                                THEN (x.o->'sales_staff')::numeric END)
                 AND (CASE WHEN jsonb_typeof(x.o->'sales_staff') = 'number'
                           THEN (x.o->'sales_staff')::numeric END) BETWEEN 0 AND 50))
      ELSE false
    END
    -- every element accepted, and tier ranges of the same row never overlap
    AND NOT EXISTS (SELECT 1 FROM ev WHERE ev.property_id = x.property_id AND ev.key = x.key AND ev.s = x.s
                                       AND NOT ev.ok)
    AND NOT EXISTS (SELECT 1 FROM rg g1 JOIN rg g2 USING (property_id, key, s)
                     WHERE g1.property_id = x.property_id AND g1.key = x.key AND g1.s = x.s AND g1.i < g2.i
                       AND g1.lo < g2.hi AND g2.lo < g1.hi),
    false) AS ok
    FROM x
)
SELECT key, s AS effective_from, ok
  FROM v
 ORDER BY key, effective_from;

-- (a) DOM 13.2, card FB-R5-DOM-BE-PR96-02 (a): open bookings whose COPIED cancel policy
-- (pricing_snapshot.cancelPolicy, read when the booking is cancelled or moved) breaks the cancel_policy_direct rule –
-- fixing the parameter never fixes a copy. Same rule as the parameter: 1–10 tiers, each exactly {minDays whole 0–365,
-- refundPct 0–100 with at most 2 decimals}, minDays not repeated. A number only.
SELECT 'open_bookings_cancel_policy_broken' AS count_of, count(*) AS n
  FROM (SELECT rv.pricing_snapshot -> 'cancelPolicy' AS c
          FROM reservation rv
         WHERE rv.status IN ('hold', 'confirmed', 'in_house')) b
 WHERE b.c IS NOT NULL AND jsonb_typeof(b.c) <> 'null'
   AND NOT COALESCE(
     jsonb_typeof(b.c) = 'array'
     AND jsonb_array_length(CASE WHEN jsonb_typeof(b.c) = 'array' THEN b.c ELSE '[]'::jsonb END) BETWEEN 1 AND 10
     AND (SELECT count(*) = count(DISTINCT t.j->'minDays')
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(b.c) = 'array' THEN b.c ELSE '[]'::jsonb END) AS t(j))
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_array_elements(CASE WHEN jsonb_typeof(b.c) = 'array' THEN b.c ELSE '[]'::jsonb END) AS t(j)
         CROSS JOIN LATERAL (SELECT CASE WHEN jsonb_typeof(t.j) = 'object' THEN t.j ELSE '{}'::jsonb END AS o) eo
         CROSS JOIN LATERAL (
           SELECT CASE WHEN jsonb_typeof(eo.o->'minDays') = 'number' THEN (eo.o->'minDays')::numeric END AS d,
                  CASE WHEN jsonb_typeof(eo.o->'refundPct') = 'number' THEN (eo.o->'refundPct')::numeric END AS p) n
        WHERE NOT COALESCE(
          jsonb_typeof(t.j) = 'object'
          AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(eo.o) AS k(k) WHERE k NOT IN ('minDays', 'refundPct'))
          AND n.d = trunc(n.d) AND n.d BETWEEN 0 AND 365
          AND n.p BETWEEN 0 AND 100 AND n.p = round(n.p, 2),
          false)),
     false);

-- (b) DOM 13.2, card FB-R5-DOM-BE-PR96-02 (b), QA BUG-R5-004: damage_catalog ROWS that break the save rule (DOM 13.4)
-- – EVERY row: the one in force on the property's business date and every row scheduled for a later day. A number
-- only (the read of the stacked PR leaves a broken item out, but a row counted here still means "stop, ask DOM").
WITH
cp AS (
  SELECT c.property_id, c.key, c.effective_from AS s,
         lead(c.effective_from) OVER (PARTITION BY c.property_id, c.key ORDER BY c.effective_from) AS e,
         c.value AS v
    FROM config_parameter c
   WHERE c.key IN ('damage_catalog', 'business_day_rollover')
),
bd AS (
  SELECT pr.id AS property_id,
         ((now() AT TIME ZONE pr.timezone) - COALESCE(
            (SELECT CASE WHEN jsonb_typeof(o.v) = 'string'
                          AND (o.v #>> '{}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
                         THEN (o.v #>> '{}')::interval END
               FROM cp o
              WHERE o.property_id = pr.id AND o.key = 'business_day_rollover'
                AND o.s <= (now() AT TIME ZONE pr.timezone)::date
              ORDER BY o.s DESC LIMIT 1),
            interval '6 hours'))::date AS d
    FROM property pr
),
-- The row in force on the business date and every row scheduled after it.
r AS (
  SELECT cp.v, CASE WHEN jsonb_typeof(cp.v) = 'array' THEN cp.v ELSE '[]'::jsonb END AS a
    FROM cp JOIN bd USING (property_id)
   WHERE cp.key = 'damage_catalog' AND (cp.e IS NULL OR cp.e > bd.d)
)
SELECT 'damage_catalog_rows_broken' AS count_of, count(*) AS n
  FROM r
 WHERE NOT COALESCE(
   jsonb_typeof(r.v) = 'array' AND jsonb_array_length(r.a) <= 100
   -- code and name not repeated (name: lower() after trimming spaces, tabs and line breaks at both ends)
   AND (SELECT count(*) = count(DISTINCT t.j->'code')
               AND count(*) = count(DISTINCT lower(btrim(t.j->>'name', ' ' || chr(9) || chr(10) || chr(11) || chr(12)
                                                                       || chr(13))))
          FROM jsonb_array_elements(r.a) AS t(j))
   AND NOT EXISTS (
     SELECT 1
       FROM jsonb_array_elements(r.a) AS t(j)
       CROSS JOIN LATERAL (SELECT CASE WHEN jsonb_typeof(t.j) = 'object' THEN t.j ELSE '{}'::jsonb END AS o) eo
       CROSS JOIN LATERAL (
         SELECT CASE WHEN jsonb_typeof(eo.o->'priceVnd') = 'number' THEN (eo.o->'priceVnd')::numeric END AS p) n
      WHERE NOT COALESCE(
        jsonb_typeof(t.j) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(eo.o) AS k(k) WHERE k NOT IN ('code', 'name', 'priceVnd'))
        AND jsonb_typeof(eo.o->'code') = 'string' AND (eo.o->>'code') ~ '^[a-z0-9_]{1,40}$'
        AND jsonb_typeof(eo.o->'name') = 'string'
        AND btrim(eo.o->>'name', ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13)) <> ''
        AND char_length(eo.o->>'name') <= 100
        AND n.p = trunc(n.p) AND n.p BETWEEN 1000 AND 20000000,
        false)),
   false);

ROLLBACK;
