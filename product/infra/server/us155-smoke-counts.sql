-- US-155 production smoke, step L (FE-B us155-enable-readiness 3.1 point 5; SEC FB-R3-SEC-OPS-US155-02): proof that
-- the test request was erased (WR8) and that the test strings are nowhere else. READ ONLY, COUNTS ONLY: no column of
-- any row is ever selected – the output is check name | number | expected | OK/FAIL. Run ONLY through
-- infra/server/bin/us155-smoke-counts.sh (never retype it): it passes every value with psql -v.
--   ref    the test request code shown on the thank-you page (REQ-XXXXXXXX or XXXXXXXX)
--   since  timestamptz just before the test request was sent (e.g. 2026-10-31T07:40:00+07:00)
--   n1, n2 the test strings ("TEST OTTIMO", "info@ottimo.vn") – searched in the WHOLE row text (row::text)
-- Superuser over the container socket, like every read-only check of ops-check/deploy.sh: it sees every tenant
-- (RLS bypassed) inside a READ ONLY transaction that is rolled back.
\set ON_ERROR_STOP on
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

WITH p AS (
  SELECT upper(regexp_replace(:'ref', '^REQ-', '', 'i')) AS ref, (:'since')::timestamptz AS since,
         '%' || :'n1' || '%' AS n1, '%' || :'n2' || '%' AS n2
), req AS (
  SELECT r.* FROM website_booking_request r, p WHERE r.ref_code = p.ref
), hits AS (
  -- Every table of schema public (partitioned parents once, no partitions), searched for n1 in the whole row text.
  SELECT c.relname,
         (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM public.%I t WHERE t::text ILIKE %L',
                                                     c.relname, (SELECT n1 FROM p)), false, true, '')))[1]::text::bigint AS n
    FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
   WHERE s.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
), checks (ord, name, value, expected, ok) AS (
  SELECT 1, 'website_booking_request: rows with this ref', (SELECT count(*) FROM req), '1',
         (SELECT count(*) FROM req) = 1
  UNION ALL
  SELECT 2, 'website_booking_request: erased (name/phone/email/note/decline_note/contact_hmac/ip_hmac NULL, pii_purged_at set, declined/erased_on_request)',
         c, '1', c = 1
    FROM (SELECT count(*) AS c FROM req
           WHERE guest_name IS NULL AND phone_e164 IS NULL AND email IS NULL AND note IS NULL AND decline_note IS NULL
             AND contact_hmac IS NULL AND ip_hmac IS NULL AND pii_purged_at IS NOT NULL
             AND status = 'declined' AND decline_reason_code = 'erased_on_request') x
  UNION ALL
  SELECT 3, 'website_booking_request: this row contains a test string', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM req r, p WHERE r::text ILIKE p.n1 OR r::text ILIKE p.n2) x
  UNION ALL
  SELECT 4, 'purge_journal: dsr_erase null_columns for this request', c, '1', c = 1
    FROM (SELECT count(*) AS c FROM purge_journal j JOIN req ON j.subject_id = req.id
           WHERE j.subject_type = 'website_booking_request' AND j.policy_key = 'dsr_erase' AND j.action = 'null_columns') x
  UNION ALL
  SELECT 5, 'audit_event: security website_request.erased for this request', c, '1', c = 1
    FROM (SELECT count(*) AS c FROM audit_event a JOIN req ON a.entity_id = req.id::text, p
           WHERE a.occurred_at >= p.since AND a.category = 'security' AND a.action = 'website_request.erased') x
  UNION ALL
  SELECT 6, 'audit_event since: test string in a row', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM audit_event a, p
           WHERE a.occurred_at >= p.since AND (a::text ILIKE p.n1 OR a::text ILIKE p.n2)) x
  UNION ALL
  SELECT 7, 'idempotency_key since: test string (response_body or row)', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM idempotency_key k, p
           WHERE k.created_at >= p.since AND (k::text ILIKE p.n1 OR k::text ILIKE p.n2)) x
  UNION ALL
  SELECT 8, 'outbox_message since: test string (payload or row)', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM outbox_message o, p
           WHERE o.created_at >= p.since AND (o::text ILIKE p.n1 OR o::text ILIKE p.n2)) x
  UNION ALL
  SELECT 9, 'staff_notification: notifications for this request (website_request_new …)', c, '>=1', c >= 1
    FROM (SELECT count(*) AS c FROM staff_notification n JOIN req ON n.ref_id = req.id
           WHERE n.ref_type = 'website_booking_request') x
  UNION ALL
  SELECT 10, 'staff_notification since: test string in a row', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM staff_notification n, p
           WHERE n.created_at >= p.since AND (n::text ILIKE p.n1 OR n::text ILIKE p.n2)) x
  UNION ALL
  SELECT 11, 'attention_event since: test string in a row', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM attention_event e, p
           WHERE e.created_at >= p.since AND (e::text ILIKE p.n1 OR e::text ILIKE p.n2)) x
  UNION ALL
  SELECT 12, 'state_transition SM-18: history rows of this request', c, '>=1', c >= 1
    FROM (SELECT count(*) AS c FROM state_transition t JOIN req ON t.entity_id = req.id
           WHERE t.machine = 'SM-18') x
  UNION ALL
  SELECT 13, 'state_transition SM-18 of this request: test string in a row', c, '0', c = 0
    FROM (SELECT count(*) AS c FROM state_transition t JOIN req ON t.entity_id = req.id, p
           WHERE t.machine = 'SM-18' AND (t::text ILIKE p.n1 OR t::text ILIKE p.n2)) x
  UNION ALL
  SELECT 14, 'all public tables: rows containing test string 1 – ' ||
             coalesce((SELECT string_agg(relname, ',' ORDER BY relname) FROM hits WHERE n > 0), 'none'),
         (SELECT coalesce(sum(n), 0) FROM hits), '0', (SELECT coalesce(sum(n), 0) FROM hits) = 0
)
SELECT ord || '. ' || name, value, expected, CASE WHEN ok THEN 'OK' ELSE 'FAIL' END FROM checks ORDER BY ord;

ROLLBACK;
