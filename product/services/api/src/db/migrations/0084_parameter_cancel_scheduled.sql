-- 0084 (BE-B, R3 Sprint 1 – R3-Q51; number from ORC 23/10: 0079 2FA, 0081 BE-C q17, 0082 BE-B step 4, 0083 BE-D T13;
-- rebased on main 8e0b08c: journal `when` after 0083, snapshot regenerated on 0083 – ARC s1-contracts 7).
-- No schema change: the snapshot is 0083's (pattern 0064/0067/0071/0073).
-- OpenAPI 0.3.8 `cancelScheduledParameter` (SEC Q51-5): a parameter row NOT yet in force may be removed. The app role
-- had no DELETE on config_parameter (0001 – rows are history); ParametersService.cancelScheduled deletes only a row of
-- the caller's property (RLS) whose effective_from is after the business date (checked in the same transaction, the
-- row locked FOR UPDATE), with an audit `config.changed` (`cancelledEffectiveFrom`).
GRANT DELETE ON config_parameter TO ottimo_app;
--> statement-breakpoint
-- FB-R3-SEC-Q51-02 + ARC Q51-02 (defence in depth): even with the grant, the database refuses to delete a row that
-- is in force or past – effective_from must be AFTER the property's business date (local time − business_day_rollover,
-- BR-010; '06:00' when no row/default). The app checks the same rule first (409); this trigger only stops a bug or an
-- injected statement from erasing parameter history (receiving account, security keys).
CREATE OR REPLACE FUNCTION config_parameter_delete_future_only() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  tz text;
  local_now timestamp;
  rollover text;
  biz date;
BEGIN
  SELECT p.timezone INTO tz FROM property p WHERE p.id = OLD.property_id;
  local_now := now() AT TIME ZONE COALESCE(tz, 'Asia/Ho_Chi_Minh');
  SELECT COALESCE(
           (SELECT c.value #>> '{}' FROM config_parameter c
             WHERE c.property_id = OLD.property_id AND c.key = 'business_day_rollover'
               AND c.effective_from <= local_now::date
             ORDER BY c.effective_from DESC LIMIT 1),
           (SELECT d.default_value #>> '{}' FROM config_parameter_def d WHERE d.key = 'business_day_rollover'),
           '06:00')
    INTO rollover;
  biz := (local_now - rollover::interval)::date;
  IF OLD.effective_from <= biz THEN
    RAISE EXCEPTION 'config_parameter: only a row scheduled after the business date may be deleted'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END $$;
--> statement-breakpoint
CREATE TRIGGER config_parameter_delete_future_only BEFORE DELETE ON config_parameter
  FOR EACH ROW EXECUTE FUNCTION config_parameter_delete_future_only();
