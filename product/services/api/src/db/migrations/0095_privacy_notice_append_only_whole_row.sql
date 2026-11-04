-- 0095 (BE-D, R4 v1.0.4 P4-13 – PN-01 Minor: FB-R4-ARC-BE-PR29-01/02/S1/S2, FB-R4-SEC-BE-PN01-01/02/03).
-- No schema change: the snapshot is 0094's (pattern 0064/0084/0090/0094). Journal idx 71, after 0094 (P4-11, PR-G)
-- at idx 70. 0090 is NOT edited: this migration only replaces the BODY of its function.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
--
-- What stays exactly as 0090 (ops-check P4-04 and the production check K3 read them by name):
--   * trigger names: privacy_notice_version_append_only (BEFORE UPDATE OR DELETE, FOR EACH ROW) and
--     privacy_notice_version_no_truncate (BEFORE TRUNCATE, FOR EACH STATEMENT) – not dropped, not recreated: CREATE OR
--     REPLACE FUNCTION keeps the function's oid, so both triggers run the new body;
--   * the function name, owner (ottimo_owner) and the error (check_violation, message prefix
--     "privacy_notice_version is append-only");
--   * privileges: ottimo_app has SELECT only on privacy_notice_version (0086) – no GRANT/REVOKE here.
--
-- What changes (the only UPDATE still let through = publish-privacy-notice.sql "SET superseded_at = now()"):
--   (1) whole row compared except superseded_at (to_jsonb(NEW) - 'superseded_at' = to_jsonb(OLD) - 'superseded_at'),
--       instead of 6 columns listed by hand: a column added later is covered without editing this function
--       (ARC PR29-01; the test also pins the 7 columns, so adding one is a red test and a review);
--   (2) superseded_at must lie in [OLD.published_at, now()] (ARC PR29-02, SEC PN01-03). In a trigger now() is the
--       transaction start = the now() of the publish statement in the same transaction, so the script passes; a
--       value typed by hand in the future (which would keep the old text inside the 7-day grace window of
--       public-booking.service for ever) or before published_at is refused. clock_timestamp() is later than now()
--       and is refused too – use now();
--   (3) SECURITY INVOKER + fixed search_path (same as 0094); the body reads no table.
--
-- Scope (SEC PN01-02): append-only for every role, ottimo_owner included, AT THE DML LEVEL (UPDATE, DELETE, TRUNCATE).
-- INSERT is not trapped: it relies on privileges (ottimo_app SELECT only; the only writer is OPS
-- publish-privacy-notice as ottimo_owner). The table owner can still ALTER TABLE … DISABLE TRIGGER, DROP TRIGGER or
-- CREATE OR REPLACE FUNCTION (DDL): reviewed migrations only, and ops-check (P4-04) reads both triggers READ ONLY
-- (tgenabled = 'O') so a disabled trigger is visible.
-- ENABLE (not ALWAYS) on purpose (ARC PR29-S1): the disposable e2e stack resets rows as superuser under
-- session_replication_role = replica (tests/e2e/ui/us155-website-requests.r3.spec.ts), where an origin-mode trigger
-- does not fire. Do not "harden" with ENABLE ALWAYS without changing that spec.
-- pg_restore is unaffected (ARC PR29-S2): COPY only INSERTs (not trapped here) and pg_dump creates triggers in
-- post-data, after the data.
CREATE OR REPLACE FUNCTION privacy_notice_version_append_only() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  -- Statement-level TRUNCATE has no OLD/NEW: only the UPDATE branch reads them.
  IF TG_OP = 'UPDATE' THEN
    IF OLD.superseded_at IS NULL
       AND NEW.superseded_at IS NOT NULL
       AND NEW.superseded_at >= OLD.published_at
       AND NEW.superseded_at <= now()
       AND (to_jsonb(NEW) - 'superseded_at') = (to_jsonb(OLD) - 'superseded_at') THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'privacy_notice_version is append-only (only superseded_at may be set, once, between published_at and now()): % refused', TG_OP
    USING ERRCODE = 'check_violation';
END
$$;
