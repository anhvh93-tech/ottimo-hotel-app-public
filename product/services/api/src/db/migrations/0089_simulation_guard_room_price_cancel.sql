-- 0089 (drizzle draft from schema/infra.ts, completed by hand – BE-A, R3 Phản hồi & sửa, patch v1.0.1 / OpenAPI 0.3.9).
-- Number: next after 0088 (journal `when` = 0088 + 2000 ms, snapshot = 0088 + simulation_guard only).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
--
-- (1) ADR-015 / FB-R3-SEC-ARC-01 (3): the database-level guarantee of the B16 dry run. Database.simulate inserts one
--     row as its first write; the DEFERRABLE INITIALLY DEFERRED constraint trigger below ALWAYS raises, so the
--     transaction can never be committed whatever the code does (stand-in for READ ONLY of the SEC A3 dry runs).
--     The table is empty outside an open simulation. ottimo_app: INSERT only (no SELECT/UPDATE/DELETE).
CREATE TABLE "simulation_guard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE simulation_guard ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE simulation_guard FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON simulation_guard
  USING (property_id = app_current_property()) WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
CREATE FUNCTION simulation_guard_refuse_commit() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'a simulation transaction must never be committed (ADR-015)'
    USING ERRCODE = 'P0001';
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION simulation_guard_refuse_commit() FROM PUBLIC;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER simulation_guard_no_commit
  AFTER INSERT ON simulation_guard
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION simulation_guard_refuse_commit();
--> statement-breakpoint
GRANT INSERT ON simulation_guard TO ottimo_app;
--> statement-breakpoint
-- (2) BUG-R3-018 part 1 (OpenAPI 0.3.9 `cancelScheduledRoomListPrice`): a scheduled list price row (effective_from
--     after the business date) can be removed by OWN/MGR. The service only deletes a row whose date has not come
--     and never the only row of a room; the past price history stays (no UPDATE of a past row either – writePrice).
GRANT DELETE ON room_list_price TO ottimo_app;
