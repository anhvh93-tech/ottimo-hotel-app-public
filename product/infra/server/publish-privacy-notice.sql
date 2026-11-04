-- Publish the website privacy notice version of one landing release – every language of the build (en, vi; since
-- LP-v2 also ko, zh, ru) – into `privacy_notice_version` (US-155, SEC C-3 (a), FB-R3-SEC-OPS-US155-01; R4 LP-v2: ARC
-- lp-v2-design 3.6, SEC SR-LC-04). THE ONLY WAY this table is written on staging/production: never type SQL by hand
-- for it. Run ONLY through infra/server/bin/publish-privacy-notice.sh, which takes the languages and hashes from the
-- RUNNING landing container (digest checked) and from the live pages – no value here is typed by a person.
--
-- NOT the Desk parameter `config_parameter.privacy_notice_version` (= the staying-guest notice privacy-2026-10-v1/v2,
-- set by OWN on Desk H05). Same name, different thing – this file never touches config_parameter.
--
-- psql variables (all required; quoted with :'var' – never concatenated into SQL):
--   slug            property slug = lower(property.code), e.g. dlt
--   version         notice version as on the pages, ^YYYY-MM-DD(.N)?$ (the form's consentVersion)
--   locales         comma list of the languages of the build, e.g. en,vi,ko,zh,ru (each en|vi|ko|zh|ru, no repeat)
--   shas            comma list, same order: sha256 (64 hex) of the WHOLE file /privacy/index.html (en) or
--                   /<xx>/privacy/index.html of the image – pairwise different
--   required        comma list = LANDING_LOCALES of the api (languages on sale); each must be in `locales`
--   operator        staff identifier of the person running it (no e-mail)
--   landing_tag     landing image tag being served; landing_digest  sha256:<64 hex> of that image ('' = test only)
--   apply           true = COMMIT; false (default of the wrapper) = dry run: same checks, ROLLBACK, no audit row
-- Database role: ottimo_migrator (socket inside the postgres container, NOT a superuser) → SET LOCAL ROLE
-- ottimo_owner (owner of the table), with the organisation/property context set so FORCE RLS still applies.
-- One transaction: every language or nothing. Append-only: rows are only INSERTed; `superseded_at` of the previous
-- version of a language is set once (only while NULL); content (sha, url, published_at) is never UPDATEd, nothing is
-- DELETEd. Re-run: same version + same hash → "already present", nothing written; same version + other hash → refused.
\set ON_ERROR_STOP on
\set VERBOSITY terse

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
SET LOCAL ROLE ottimo_owner;
SELECT set_config('ottimo_pn.slug', :'slug', true),
       set_config('ottimo_pn.version', :'version', true),
       set_config('ottimo_pn.locales', :'locales', true),
       set_config('ottimo_pn.shas', :'shas', true),
       set_config('ottimo_pn.required', :'required', true),
       set_config('ottimo_pn.operator', :'operator', true),
       set_config('ottimo_pn.landing_tag', :'landing_tag', true),
       set_config('ottimo_pn.landing_digest', :'landing_digest', true),
       set_config('ottimo_pn.apply', :'apply', true) \gset ignored_

DO $publish$
DECLARE
  v_slug    text := current_setting('ottimo_pn.slug');
  v_version text := current_setting('ottimo_pn.version');
  v_locs    text[] := string_to_array(current_setting('ottimo_pn.locales'), ',');
  v_shas    text[] := string_to_array(current_setting('ottimo_pn.shas'), ',');
  v_req     text[] := string_to_array(current_setting('ottimo_pn.required'), ',');
  v_op      text := current_setting('ottimo_pn.operator');
  v_tag     text := current_setting('ottimo_pn.landing_tag');
  v_digest  text := current_setting('ottimo_pn.landing_digest');
  v_apply   boolean := current_setting('ottimo_pn.apply')::boolean;
  v_n       int;
  v_i       int;
  v_org     uuid;
  v_prop    uuid;
  v_loc     text;
  v_path    text;
  v_sha     text;
  v_row     record;
  v_inserted text[] := '{}';
  v_present  text[] := '{}';
  v_superseded jsonb := '[]'::jsonb;
  v_cnt     int;
  v_missing text[];
  v_ver_key numeric;
  v_check   text;
BEGIN
  -- ── inputs (the wrapper checks them too; this is the last line of defence) ──
  IF v_slug !~ '^[a-z0-9-]{2,40}$' THEN RAISE EXCEPTION 'refused: slug invalid'; END IF;
  IF v_version !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[1-9][0-9]?)?$' THEN RAISE EXCEPTION 'refused: version invalid'; END IF;
  IF coalesce(cardinality(v_locs), 0) = 0 OR cardinality(v_locs) > 5 OR cardinality(v_locs) <> coalesce(cardinality(v_shas), 0) THEN
    RAISE EXCEPTION 'refused: languages/hashes lists invalid (% languages, % hashes)', coalesce(cardinality(v_locs), 0), coalesce(cardinality(v_shas), 0);
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_locs) l WHERE l !~ '^(en|vi|ko|zh|ru)$')
     OR (SELECT count(DISTINCT l) FROM unnest(v_locs) l) <> cardinality(v_locs) THEN
    RAISE EXCEPTION 'refused: languages invalid or repeated (%)', array_to_string(v_locs, ',');
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(v_shas) h WHERE h !~ '^[0-9a-f]{64}$') THEN RAISE EXCEPTION 'refused: sha256 invalid'; END IF;
  IF (SELECT count(DISTINCT h) FROM unnest(v_shas) h) <> cardinality(v_shas) THEN
    RAISE EXCEPTION 'refused: two languages have the same hash – one (version, locale) = one text';
  END IF;
  IF coalesce(cardinality(v_req), 0) = 0 OR NOT (v_req <@ v_locs) THEN
    RAISE EXCEPTION 'refused: languages on sale (%) not all in the build (%)', array_to_string(v_req, ','), array_to_string(v_locs, ',');
  END IF;
  IF v_op !~ '^[a-z0-9][a-z0-9._-]{1,39}$' THEN RAISE EXCEPTION 'refused: operator must be a staff id (a-z 0-9 . _ -), not an e-mail'; END IF;
  IF v_tag !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$' THEN RAISE EXCEPTION 'refused: landing tag invalid'; END IF;
  IF v_digest <> '' AND v_digest !~ '^sha256:[0-9a-f]{64}$' THEN RAISE EXCEPTION 'refused: landing digest invalid'; END IF;
  IF current_user <> 'ottimo_owner' THEN RAISE EXCEPTION 'refused: must run as ottimo_owner (got %)', current_user; END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) THEN
    RAISE EXCEPTION 'refused: connected as a superuser – use ottimo_migrator';
  END IF;
  -- A database before the LP-v2 migration (0092_lp_v2_price_estimate_locales; 0091 is v1.0.3 user_email_change) only takes vi/en/ru:
  -- say so instead of a constraint error.
  SELECT pg_get_constraintdef(c.oid) INTO v_check FROM pg_constraint c
   WHERE c.conrelid = 'privacy_notice_version'::regclass AND c.conname = 'privacy_notice_version_locale_check';
  FOREACH v_loc IN ARRAY v_locs LOOP
    IF v_check IS NOT NULL AND position(quote_literal(v_loc) IN v_check) = 0 THEN
      RAISE EXCEPTION 'refused: this database does not accept language % yet – deploy the api with the LP-v2 migration first (README 12.3 LP-v2 step a)', v_loc;
    END IF;
  END LOOP;

  -- ── organisation / property: exactly one active property with this slug (same entry function as the api) ──
  SELECT count(*) INTO v_n FROM public_resolve_property(v_slug);
  IF v_n <> 1 THEN RAISE EXCEPTION 'refused: % active properties match slug %, expected exactly 1', v_n, v_slug; END IF;
  SELECT r.organization_id, r.property_id INTO v_org, v_prop FROM public_resolve_property(v_slug) r;
  -- Tenant context for FORCE RLS (privacy_notice_version: organisation; audit_event: organisation + property).
  PERFORM set_config('app.organization_id', v_org::text, true),
          set_config('app.property_id', v_prop::text, true),
          set_config('app.user_id', '', true),
          set_config('app.actor_type', 'system', true);

  -- Serialise two runs (second one waits ≤ lock_timeout, then fails – re-run it).
  LOCK TABLE privacy_notice_version IN SHARE ROW EXCLUSIVE MODE;

  v_ver_key := split_part(v_version, '.', 1)::date - date '2000-01-01'
               + coalesce(nullif(split_part(v_version, '.', 2), ''), '0')::numeric / 100;

  -- ── checks for every language BEFORE any write ──
  FOR v_i IN 1 .. cardinality(v_locs) LOOP
    v_loc := v_locs[v_i];
    v_sha := v_shas[v_i];
    v_path := CASE v_loc WHEN 'en' THEN '/privacy/' ELSE '/' || v_loc || '/privacy/' END;
    SELECT * INTO v_row FROM privacy_notice_version
     WHERE organization_id = v_org AND version = v_version AND locale = v_loc;
    IF FOUND THEN
      IF v_row.body_sha256 <> v_sha OR v_row.url_path <> v_path THEN
        RAISE EXCEPTION 'refused: version % (%) already published with ANOTHER text (stored sha %…, this page %…) – a changed text needs a new version',
          v_version, v_loc, left(v_row.body_sha256, 12), left(v_sha, 12);
      END IF;
      IF v_row.superseded_at IS NOT NULL THEN
        RAISE EXCEPTION 'refused: version % (%) was superseded at % – publish a new version instead', v_version, v_loc, v_row.superseded_at;
      END IF;
      v_present := v_present || v_loc;
    END IF;
    -- No going back: an active LATER version blocks publishing an older one (LP-v2 version > 2026-10-31).
    PERFORM 1 FROM privacy_notice_version p
     WHERE p.organization_id = v_org AND p.locale = v_loc AND p.superseded_at IS NULL AND p.version <> v_version
       AND (split_part(p.version, '.', 1)::date - date '2000-01-01'
            + coalesce(nullif(split_part(p.version, '.', 2), ''), '0')::numeric / 100) > v_ver_key;
    IF FOUND THEN RAISE EXCEPTION 'refused: a later version is active for % – nothing to do with %', v_loc, v_version; END IF;
  END LOOP;

  -- ── writes (insert-only; supersede the previous active version of the same language once) ──
  FOR v_i IN 1 .. cardinality(v_locs) LOOP
    v_loc := v_locs[v_i];
    CONTINUE WHEN v_loc = ANY (v_present);
    v_sha := v_shas[v_i];
    v_path := CASE v_loc WHEN 'en' THEN '/privacy/' ELSE '/' || v_loc || '/privacy/' END;
    RAISE NOTICE '% INSERT privacy_notice_version (organization=<property %>, version=%, locale=%, body_sha256=%, url_path=%, published_at=now())',
      CASE WHEN v_apply THEN 'apply:' ELSE 'dry-run (would):' END, upper(v_slug), v_version, v_loc, v_sha, v_path;
    INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
    VALUES (v_org, v_version, v_loc, v_sha, v_path, now());
    v_inserted := v_inserted || v_loc;
    FOR v_row IN
      UPDATE privacy_notice_version SET superseded_at = now()
       WHERE organization_id = v_org AND locale = v_loc AND version <> v_version AND superseded_at IS NULL
      RETURNING version
    LOOP
      RAISE NOTICE '% supersede version % (%)', CASE WHEN v_apply THEN 'apply:' ELSE 'dry-run (would):' END, v_row.version, v_loc;
      v_superseded := v_superseded || jsonb_build_object('locale', v_loc, 'version', v_row.version);
    END LOOP;
  END LOOP;

  IF cardinality(v_present) > 0 THEN
    RAISE NOTICE 'already present (same hash, active): version % %', v_version, array_to_string(v_present, ',');
  END IF;

  -- ── audit (security), same transaction; only when something was written and only on apply ──
  -- (a dry run writes no audit row: it would also consume an id of audit_event_id_seq, which ROLLBACK does not undo)
  IF cardinality(v_inserted) > 0 THEN
    IF v_apply THEN
      INSERT INTO audit_event (organization_id, property_id, occurred_at, actor_type, actor_user_id, category, action,
                               entity_type, entity_id, before, after, reason)
      VALUES (v_org, v_prop, now(), 'system', NULL, 'security', 'privacy_notice.published',
              'privacy_notice_version', v_version, NULL,
              jsonb_build_object('version', v_version, 'locales', to_jsonb(v_inserted),
                                 'hashes', jsonb_object(v_locs, v_shas),
                                 -- same keys as before LP-v2 (null when the language is not in the build)
                                 'shaVi', v_shas[array_position(v_locs, 'vi')], 'shaEn', v_shas[array_position(v_locs, 'en')],
                                 'landingTag', v_tag, 'landingDigest', nullif(v_digest, ''),
                                 'superseded', v_superseded),
              'operator: ' || v_op || ' (infra/server/bin/publish-privacy-notice.sh)');
      RAISE NOTICE 'apply: audit_event security privacy_notice.published (operator %)', v_op;
    ELSE
      RAISE NOTICE 'dry-run (would): audit_event security privacy_notice.published version % locales % operator % landing % %',
        v_version, array_to_string(v_inserted, ','), v_op, v_tag, coalesce(nullif(v_digest, ''), '(no digest)');
    END IF;
  END IF;

  -- ── after-check = the server''s readiness rule (public-booking.service.ts readiness()): an active row for every
  --    language on sale (LANDING_LOCALES) ──
  SELECT array_agg(l) INTO v_missing FROM unnest(v_req) l
   WHERE NOT EXISTS (SELECT 1 FROM privacy_notice_version p
                      WHERE p.organization_id = v_org AND p.locale = l AND p.superseded_at IS NULL);
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'refused: readiness still misses privacy_notice_version.%', v_missing; END IF;
  -- Every language of the build now has exactly this version active (a language not in the build keeps its own).
  SELECT count(*) INTO v_cnt FROM privacy_notice_version p
   WHERE p.organization_id = v_org AND p.locale = ANY (v_locs) AND p.superseded_at IS NULL AND p.version <> v_version;
  IF v_cnt > 0 THEN RAISE EXCEPTION 'refused: % other active version row(s) left – check the table', v_cnt; END IF;
  RAISE NOTICE 'readiness: privacy_notice_version % active = % (on sale: %; PUBLIC_FORM_NOT_READY no longer lists them)',
    array_to_string(v_locs, '+'), v_version, array_to_string(v_req, ',');
  RAISE NOTICE 'RESULT: % (inserted: %, already present: %)',
    CASE WHEN cardinality(v_inserted) = 0 THEN 'already-present'
         WHEN v_apply THEN 'published' ELSE 'dry-run-ok' END,
    coalesce(nullif(array_to_string(v_inserted, ','), ''), '-'), coalesce(nullif(array_to_string(v_present, ','), ''), '-');
END
$publish$;

\if :apply
COMMIT;
\else
ROLLBACK;
\endif
