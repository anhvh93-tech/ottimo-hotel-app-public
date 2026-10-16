-- 0012 (custom, hand-written – erd 16; BE-B Sprint 2): RLS + grants for the tables of 0011.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts). All tables are property-level (erd 2.3).

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['channel', 'channel_commission_rate', 'channel_fee', 'commission',
                           'deposit_notice', 'folio', 'folio_line', 'payment', 'lead', 'quote'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (property_id = app_current_property()) '
      'WITH CHECK (property_id = app_current_property())', t);
  END LOOP;
END $$;
--> statement-breakpoint
-- Business rows: never DELETE (erd 1 "Xóa").
GRANT SELECT, INSERT, UPDATE ON channel, channel_commission_rate, channel_fee, commission, deposit_notice,
  folio, lead, quote TO ottimo_app;
--> statement-breakpoint
-- K8 / BR-008: money lines are append-only. Amounts are never rewritten (a correction is a reversal + a new
-- line); only the approval state of a FOC/discount line moves (SM-10 A3/A5 → posted / rejected).
GRANT SELECT, INSERT ON folio_line TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (line_state, approval_request_id) ON folio_line TO ottimo_app;
--> statement-breakpoint
-- Payment: amount/type/method/folio are immutable; status (SM-12), reconciliation (BR-527) and the VietQR
-- confirmation move (reversal = its own row, refund = its own negative row).
GRANT SELECT, INSERT ON payment TO ottimo_app;
--> statement-breakpoint
GRANT UPDATE (status, expires_at, reconciliation, reconciled_at, reconciled_by, reconciliation_note,
  confirmed_at, confirmed_by, updated_at, version) ON payment TO ottimo_app;
