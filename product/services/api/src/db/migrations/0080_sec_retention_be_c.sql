-- 0080 (BE-C, R3 Sprint 1 – R3-Q17: SEC FB-R2-SEC-BE-74, FB-R2-SEC-BE-75; number after 0079 (2FA) on main, ARC
-- s1-contracts 7). No table change: the head snapshot is 0079's tables with a new id (prevId = 0079).
--
-- (1) guest_stay_retention(guest) – J25 (T05) needs the retention anchor and "a stay still open" of a `document`
--     profile across EVERY property of its organisation (SEC BE-75: J25 runs per property under property RLS and
--     did not see the bookings of the other properties). SECURITY DEFINER, narrow: parameter = an id, result = one
--     boolean + one instant, never a row of data; only the CURRENT organisation (app_current_org()) is read.
--     Anchor = the latest end of any stay of the person: check-out (`actual_checkout_at`), cancellation
--     (`cancelled_at`), no-show (`no_show_marked_at`), removal from the party (`removed_at`) – BE-75 (1)(2).
--     The caller adds `last_stay_checkout_at` and falls back to `created_at` (BE-75 (3)).
-- (2) Owner-only, organisation-scoped SELECT policies on reservation / reservation_guest so the definer function
--     can read the other properties of the SAME organisation (FORCE RLS binds ottimo_owner too). Never cross-org.
-- (3) BE-74 backfill: `document` profiles already anonymised before this fix lose every field outside SEC 7.1
--     (contact, company, notes, tags, date of birth, gender…). Idempotent (a second run changes nothing).
CREATE POLICY org_retention_read ON reservation FOR SELECT TO ottimo_owner
  USING (organization_id = app_current_org());
--> statement-breakpoint
CREATE POLICY org_retention_read ON reservation_guest FOR SELECT TO ottimo_owner
  USING (organization_id = app_current_org());
--> statement-breakpoint
CREATE FUNCTION guest_stay_retention(p_guest uuid)
  RETURNS TABLE (has_open boolean, last_end timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH stays AS (
    SELECT r.status, NULL::timestamptz AS removed_at, r.actual_checkout_at, r.cancelled_at, r.no_show_marked_at
      FROM public.reservation r
     WHERE r.booker_guest_id = p_guest AND r.organization_id = app_current_org()
    UNION ALL
    SELECT r.status, m.removed_at, r.actual_checkout_at, r.cancelled_at, r.no_show_marked_at
      FROM public.reservation_guest m JOIN public.reservation r ON r.id = m.reservation_id
     WHERE m.guest_id = p_guest AND m.organization_id = app_current_org()
       AND r.organization_id = app_current_org()
  )
  SELECT coalesce(bool_or(removed_at IS NULL AND status IN ('hold', 'confirmed', 'in_house')), false),
         max(CASE WHEN removed_at IS NOT NULL THEN removed_at
                  WHEN status = 'checked_out' THEN actual_checkout_at
                  WHEN status = 'cancelled' THEN cancelled_at
                  WHEN status = 'no_show' THEN no_show_marked_at END)
    FROM stays
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION guest_stay_retention(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION guest_stay_retention(uuid) TO ottimo_app;
--> statement-breakpoint
ALTER TABLE guest NO FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE guest DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE guest
   SET phone_e164 = NULL, email_norm = NULL, messaging_handles = NULL, date_of_birth = NULL, gender = NULL,
       preferred_locale = NULL, preferred_contact = NULL, company_name = NULL, tax_code = NULL, tags = NULL,
       service_notes = NULL, free_note = NULL, id_doc_last4 = NULL, id_doc_hmac = NULL
 WHERE source = 'document' AND anonymized_at IS NOT NULL
   AND (phone_e164 IS NOT NULL OR email_norm IS NOT NULL OR messaging_handles IS NOT NULL
        OR date_of_birth IS NOT NULL OR gender IS NOT NULL OR preferred_locale IS NOT NULL
        OR preferred_contact IS NOT NULL OR company_name IS NOT NULL OR tax_code IS NOT NULL
        OR tags IS NOT NULL OR service_notes IS NOT NULL OR free_note IS NOT NULL
        OR id_doc_last4 IS NOT NULL OR id_doc_hmac IS NOT NULL);
--> statement-breakpoint
ALTER TABLE guest ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE guest FORCE ROW LEVEL SECURITY;
