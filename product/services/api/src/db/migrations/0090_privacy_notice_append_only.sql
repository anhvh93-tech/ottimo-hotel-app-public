-- 0090 (BE, R3 v1.0.1 – SEC FB-R3-SEC-ARC-PN-01, ARC-on-OPS-us155-enable "Trả lời OPS" 1). No schema change: the
-- snapshot is 0088's (pattern 0064/0084/0087). Number 0090: 0089 is BE-A v1.0.1's (not on main yet) – this file
-- must be applied AFTER it (its `when` is newer); merge order is noted in the PR.
-- `privacy_notice_version` is the proof of "which text the guest agreed to" (FK website_booking_request.consent_fk):
-- append-only for EVERY role, ottimo_owner included (ottimo_app already has SELECT only). Allowed:
--   INSERT (OPS publish-privacy-notice, the only writer);
--   UPDATE that only sets superseded_at from NULL to a value (the next version replaces this one) – every other
--   column unchanged (IS NOT DISTINCT FROM);
-- refused: any other UPDATE, DELETE, TRUNCATE (check_violation). pg_restore (COPY) fires none of these triggers.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
CREATE OR REPLACE FUNCTION privacy_notice_version_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.superseded_at IS NULL AND NEW.superseded_at IS NOT NULL
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id
     AND NEW.version IS NOT DISTINCT FROM OLD.version
     AND NEW.locale IS NOT DISTINCT FROM OLD.locale
     AND NEW.body_sha256 IS NOT DISTINCT FROM OLD.body_sha256
     AND NEW.url_path IS NOT DISTINCT FROM OLD.url_path
     AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'privacy_notice_version is append-only (only superseded_at may be set, once): % refused', TG_OP
    USING ERRCODE = 'check_violation';
END $$;
--> statement-breakpoint
CREATE TRIGGER privacy_notice_version_append_only BEFORE UPDATE OR DELETE ON privacy_notice_version
  FOR EACH ROW EXECUTE FUNCTION privacy_notice_version_append_only();
--> statement-breakpoint
CREATE TRIGGER privacy_notice_version_no_truncate BEFORE TRUNCATE ON privacy_notice_version
  FOR EACH STATEMENT EXECUTE FUNCTION privacy_notice_version_append_only();
