-- OPS T3/D-T6 (j15-folio-close-check.md mục 15): read-only check of the 6 scheduled worker jobs.
-- Run: dc exec -T -e PGOPTIONS='-c default_transaction_read_only=on' postgres psql -X -tA ... < this file.
-- Dates are for staging slot 30/10; for D-T6 (production) change 2026-10-28/30 and 18:57:50 to the slot 31/10 and 07:51:00 30/10.
\set ON_ERROR_STOP on
SET TIME ZONE 'Asia/Ho_Chi_Minh';
BEGIN TRANSACTION READ ONLY;
SHOW transaction_read_only;
SELECT now();
\echo == job_run 6 jobs (since 28/10)
SELECT job_key, business_date, slot, to_char(run_at,'DD/MM HH24:MI:SS') AS run_at, status, stats
  FROM job_run
 WHERE job_key IN ('hk.daily','lease.nights','log.partitions','guest.document_profile_anonymize','web_request.purge','web_request.stale')
   AND business_date >= '2026-10-28'
 ORDER BY job_key, business_date, slot;
\echo == daily_clean_status_time
SELECT key, value, effective_from FROM config_parameter WHERE key IN ('daily_clean_status_time') ORDER BY effective_from;
\echo == partitions
SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid JOIN pg_class p ON p.oid=i.inhparent
 WHERE p.relname IN ('audit_event','c3_access_log') ORDER BY 1;
\echo == hk_task created/changed by hk.daily on 30/10
SELECT type, status, source, count(*) FROM hk_task WHERE due_date = '2026-10-30' GROUP BY 1,2,3 ORDER BY 1,2,3;
SELECT count(*) AS created_0700_window FROM hk_task WHERE created_at BETWEEN '2026-10-30 07:00' AND '2026-10-30 07:02';
\echo == audit system since rc.6 start
SELECT category, action, count(*), to_char(min(occurred_at),'DD/MM HH24:MI:SS'), to_char(max(occurred_at),'DD/MM HH24:MI:SS')
  FROM audit_event WHERE occurred_at >= '2026-10-29 18:57:50' AND actor_type='system' GROUP BY 1,2 ORDER BY 1,2;
\echo == audit all since 02:55 30/10 by actor_type
SELECT actor_type, action, count(*) FROM audit_event WHERE occurred_at >= '2026-10-30 02:55' GROUP BY 1,2 ORDER BY 1,2;
ROLLBACK;

-- hk.daily cross-check (in-house stays with a stay-over night, tasks by due date)
-- \echo == in_house by stay_type, arrival/departure relative to 30/10
-- SELECT r.stay_type, (r.arrival_date < '2026-10-30' AND r.departure_date > '2026-10-30') AS stayover_night, (r.departure_date <= '2026-10-30') AS due_out, count(*) FROM reservation r WHERE r.status = 'in_house' GROUP BY 1,2,3;
-- \echo == hk_task open on due_date >= 29/10
-- SELECT due_date, type, status, count(*) FROM hk_task WHERE due_date >= '2026-10-29' GROUP BY 1,2,3 ORDER BY 1,2,3;
