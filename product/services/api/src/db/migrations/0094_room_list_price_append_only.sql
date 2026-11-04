-- 0094 (BE-C, R4 v1.0.4 P4-11 – FB-R4-ARC-BE-A-ED-02, SEC ED-02 "cần": rounds/round-04/reviews/SEC-on-plan-v1.0.4.md 3.2).
-- No schema change: the snapshot is 0093's (pattern 0064/0084/0090; FB-R4-ARC-BE-C-P411-01). Journal idx 70, after
-- 0093 (P4-10, PR-F) at idx 69.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction. Additive only.
--
-- `room_list_price` is the history of list prices (basis for reconciling quotes – Tampering/Repudiation). ottimo_app
-- has DELETE on the table (0089) for ONE path: rooms.service cancelScheduledListPrice, which removes a row whose date
-- has not come (after the business date) and never the only / first row of a room (409 only_price / first_price).
-- Defence in depth: the database refuses to delete a row whose effective_from is today or earlier in the PROPERTY's
-- time zone (calendar date, stricter than the business date between 00:00 and the rollover). The service checks
-- first, so this only fires on a programming error or an injected statement → generic 500, the message names no
-- id, price or date. The "first/only row of a room" rule stays in the service (it reads other rows → races at DB
-- level; SEC 3.2 (3)).
-- No property row (or a time zone the server cannot read) → refused (fail closed).
-- Notes for the runbook (SEC 3.2 (4)): the previous app `sha-da6d6f3dc22b` (v1.0.3) only deletes rows dated after the
-- BUSINESS date, so a rollback of the app without rolling the DB back keeps working, except between 00:00 and the
-- business-day rollover: there, cancelling the price of today's calendar date is refused by this trigger (generic 500,
-- no data lost). v1.0.4 checks the calendar date in the service first → 409 `effective` (FB-R4-SEC-BE-P411-01).
-- The trigger reads the database's real now(), not the app clock: on staging with CLOCK_MODE=mutable set to the past,
-- a row between the fake today and the real today passes the service and is refused here (FB-R4-ARC-BE-C-P411-02).
-- TRUNCATE (test clean-up) fires no row trigger.
-- A real data fix that must delete an applied row is a migration that runs `ALTER TABLE room_list_price DISABLE
-- TRIGGER room_list_price_append_only` as the table owner and enables it again, reviewed by SEC – no bypass flag for
-- ottimo_app.
CREATE FUNCTION room_list_price_append_only() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  tz text;
BEGIN
  SELECT p.timezone INTO tz FROM public.property p WHERE p.id = OLD.property_id;
  IF tz IS NULL OR OLD.effective_from <= (now() AT TIME ZONE tz)::date THEN
    RAISE EXCEPTION 'room_list_price: applied price row is append-only'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION room_list_price_append_only() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER room_list_price_append_only BEFORE DELETE ON room_list_price
  FOR EACH ROW EXECUTE FUNCTION room_list_price_append_only();
