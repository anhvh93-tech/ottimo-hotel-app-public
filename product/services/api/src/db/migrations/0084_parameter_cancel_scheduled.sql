-- 0084 (BE-B, R3 Sprint 1 – R3-Q51; number from ORC 23/10: 0079 2FA, 0081 BE-C q17, 0082 BE-B step 4, 0083 BE-D T13;
-- rebased on main 8e0b08c: journal `when` after 0083, snapshot regenerated on 0083 – ARC s1-contracts 7).
-- No schema change: the snapshot is 0083's (pattern 0064/0067/0071/0073).
-- OpenAPI 0.3.8 `cancelScheduledParameter` (SEC Q51-5): a parameter row NOT yet in force may be removed. The app role
-- had no DELETE on config_parameter (0001 – rows are history); ParametersService.cancelScheduled deletes only a row of
-- the caller's property (RLS) whose effective_from is after the business date (checked in the same transaction, the
-- row locked FOR UPDATE), with an audit `config.changed` (`cancelledEffectiveFrom`).
GRANT DELETE ON config_parameter TO ottimo_app;
