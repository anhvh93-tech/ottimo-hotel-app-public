-- V5-25 (BUG-R5-001 / BUG-R5-003; DOM rules-v1.0.5 8.4 and 12.1–12.4; ARC 0.3.13 bổ sung 1, 1.24) – READ-ONLY
-- shape check of the structured parameters that got a save rule in V5-25: are the values already stored valid
-- under the new rules?
--
-- Prints ONLY three columns – key, effective_from, ok (true = the new rule accepts it) – never a value, a property
-- name or any guest column. Rows covered, per property and key: the row in force on the property's business date
-- (BR-010: local time minus business_day_rollover, 06:00 when absent) and every row scheduled after it.
-- The rules mirror `src/modules/platform/public/parameter-shapes.ts` (test: test/integration/v5-25-parameter-save
-- .test.ts runs this file against every case of test/helpers/parameter-shape-cases.ts); min_stay ↔
-- short_stay_max_nights is checked both ways over the period each row is in force (DOM 12.2).
--
-- Run (ORC; role ottimo_readonly = BYPASSRLS + SELECT, inside a READ ONLY transaction, like ops-check):
--   PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" \
--     psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f v5-25-parameter-shape-check.sql
-- Needs Postgres ≥ 16 (pg_input_is_valid). Nothing is changed. A row with ok = false is fixed on the Desk
-- (setParameter of a corrected value, or cancel-scheduled for a scheduled row) – never by an UPDATE.

BEGIN TRANSACTION READ ONLY;

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
      WHEN 'cancel_policy_direct' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('minDays', 'refundPct'))
        AND (CASE WHEN jsonb_typeof(el.eo->'minDays') = 'number' THEN (el.eo->'minDays')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(el.eo->'minDays') = 'number' THEN (el.eo->'minDays')::numeric END)
        AND (CASE WHEN jsonb_typeof(el.eo->'minDays') = 'number' THEN (el.eo->'minDays')::numeric END)
            BETWEEN 0 AND 365
        AND (CASE WHEN jsonb_typeof(el.eo->'refundPct') = 'number' THEN (el.eo->'refundPct')::numeric END)
            BETWEEN 0 AND 100
      WHEN 'early_checkin_tiers' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('from', 'to', 'pct'))
        AND (SELECT g.lo < g.hi FROM rg g
              WHERE g.property_id = el.property_id AND g.key = el.key AND g.s = el.s AND g.i = el.i)
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number' THEN (el.eo->'pct')::numeric END) BETWEEN 0 AND 100
      WHEN 'late_checkout_tiers' THEN
        jsonb_typeof(el.el) = 'object'
        AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(el.eo) AS k(k) WHERE k NOT IN ('after', 'until', 'pct'))
        AND (SELECT g.lo < g.hi FROM rg g
              WHERE g.property_id = el.property_id AND g.key = el.key AND g.s = el.s AND g.i = el.i)
        AND (CASE WHEN jsonb_typeof(el.eo->'pct') = 'number' THEN (el.eo->'pct')::numeric END) BETWEEN 0 AND 100
      WHEN 'lease_terms' THEN
        jsonb_typeof(el.el) = 'object'
        AND (CASE WHEN jsonb_typeof(el.eo->'months') = 'number' THEN (el.eo->'months')::numeric END)
            = trunc(CASE WHEN jsonb_typeof(el.eo->'months') = 'number' THEN (el.eo->'months')::numeric END)
        AND (CASE WHEN jsonb_typeof(el.eo->'months') = 'number' THEN (el.eo->'months')::numeric END)
            BETWEEN 1 AND 60
        AND (NOT el.eo ? 'discountPct'
             OR (CASE WHEN jsonb_typeof(el.eo->'discountPct') = 'number'
                      THEN (el.eo->'discountPct')::numeric END) BETWEEN 0 AND 100)
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
        jsonb_typeof(x.v) = 'array' AND jsonb_array_length(x.a) <= 10
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
        AND (NOT x.o ? 'collaborator'
             OR ((CASE WHEN jsonb_typeof(x.o->'collaborator') = 'number' THEN (x.o->'collaborator')::numeric END)
                   = trunc(CASE WHEN jsonb_typeof(x.o->'collaborator') = 'number'
                                THEN (x.o->'collaborator')::numeric END)
                 AND (CASE WHEN jsonb_typeof(x.o->'collaborator') = 'number'
                           THEN (x.o->'collaborator')::numeric END) BETWEEN 0 AND 50))
        AND (NOT x.o ? 'sales_staff'
             OR ((CASE WHEN jsonb_typeof(x.o->'sales_staff') = 'number' THEN (x.o->'sales_staff')::numeric END)
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

ROLLBACK;
