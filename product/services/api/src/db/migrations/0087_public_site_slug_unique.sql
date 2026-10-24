-- 0087 (BE-D, R3 – US-155 review fixes, v1.0). No schema change: the snapshot is 0086's (pattern 0064/0084).
-- (1) FB-R3-ARC-US155-01 (Major, multi-tenant): `property.code` is unique only inside an organisation
--     (`property_org_code_key`), so two organisations may own the same slug. The entry function now answers ONLY
--     when exactly one active property of the whole system matches the slug – otherwise no row, and the app
--     answers 404 like an unknown property (`PublicBookingService.resolve`: rows.length !== 1 → null). A website
--     request can never land in another tenant's property. Long-term: `property.public_slug` unique (0.3.9).
-- (2) FB-R3-ARC-US155-02 (Minor, defence in depth – same class as Q51-02): the app keeps DELETE on
--     `website_booking_request` only for the T19 job that removes `spam` rows past retention.web_request_spam_days;
--     a trigger refuses deleting any other row (a bug or an injected statement cannot erase a live request or the
--     trace of a converted one). Test: test/integration/architecture.test.ts + public-site-r3-bed.test.ts.
-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts) inside the migrator's single transaction.
CREATE OR REPLACE FUNCTION public_resolve_property(p_slug text)
  RETURNS TABLE (organization_id uuid, property_id uuid, timezone text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH m AS (
    SELECT p.organization_id, p.id, p.timezone
      FROM property p
     WHERE lower(p.code) = p_slug AND p.status = 'active'
  )
  SELECT m.organization_id, m.id, m.timezone FROM m WHERE (SELECT count(*) FROM m) = 1
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public_resolve_property(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public_resolve_property(text) TO ottimo_app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION website_booking_request_delete_spam_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'spam' THEN
    RAISE EXCEPTION 'website_booking_request: only a spam row may be deleted (T19)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END $$;
--> statement-breakpoint
CREATE TRIGGER website_booking_request_delete_spam_only BEFORE DELETE ON website_booking_request
  FOR EACH ROW EXECUTE FUNCTION website_booking_request_delete_spam_only();
