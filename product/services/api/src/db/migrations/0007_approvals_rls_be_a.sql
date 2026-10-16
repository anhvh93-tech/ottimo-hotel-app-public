-- 0007 (custom, hand-written – erd 16): RLS + grants for approval_request (SM-10, US-007).
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts). Property-level table (erd 2.3).
ALTER TABLE approval_request ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE approval_request FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON approval_request
  USING (property_id = app_current_property())
  WITH CHECK (property_id = app_current_property());
--> statement-breakpoint
-- Business row: no DELETE (decisions are kept – BR-434 "mọi yêu cầu, kể cả bị từ chối, vào báo cáo").
GRANT SELECT, INSERT, UPDATE ON approval_request TO ottimo_app;
