#!/usr/bin/env bash
# Test of infra/server/bin/publish-privacy-notice.sh + infra/server/publish-privacy-notice.sql (FB-R3-SEC-OPS-US155-01)
# on a THROWAWAY stack shaped like staging/production: the real docker-compose.prod.yml (postgres with 02-roles.sh,
# migrate, seed DS-E, landing with the real Caddyfile.landing), project `ottimo-pn-test`, landing published on
# 127.0.0.1:58160 only. Fake data and random test passwords in a temp dir; everything is removed at the end.
#   API_IMAGE_REF=ghcr.io/<owner>/ottimo-api:sha-…-test   (any api image whose migrations include 0086)
#   LANDING_IMAGE_REF=ottimo-landing:qa155                 (built WITH the form: LANDING_BOOKING_FORM=true, slug dlt)
#   bash infra/server/test/publish-privacy-notice.test.sh
# Cases: dry run writes nothing · apply writes 2 rows + 1 audit · the api role sees them (RLS) · re-run = already present · wrong tag · version on the
# page ≠ --version · same version with another text (hash) refused · next version supersedes the old one once ·
# superseded version cannot come back · operator e-mail refused · PN_TEST_* refused on production · superuser refused.
# R4 LP-v2 (ARC lp-v2-design 3.6, SEC SR-LC-04, ARC FB-R4-ARC-OPS-LPV2-01) – variants built locally from the given
# landing image with ko/zh/ru pages and <meta name="ottimo-notice-version">: database before migration 0091 → refused
# with a clear message · (CHECK widened exactly like 0091_lp_v2_price_estimate_locales; 0090 is PN-01) 5 languages in ONE transaction, en/vi superseded, one audit
# with the 5 hashes, url_path per language, sha_<xx> in the log · re-run already present · a ko page without the meta
# tag → refused · hreflang lists ru but the build has no ru page → refused · two languages with the same bytes →
# refused · LANDING_LOCALES has a language the running build lacks → refused · SEC LPV2-S3: an LP-v2 build (meta tag)
# without hreflang on /privacy/ → refused · SEC LPV2-S1: --version with a leading-zero suffix (.01) → refused.
# Nothing written by any refused run.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
infra=$(cd "$here/../.." && pwd)
product=$(cd "$infra/.." && pwd)
API_IMAGE_REF="${API_IMAGE_REF:?set API_IMAGE_REF (api image with migrations ≥ 0086)}"
LANDING_IMAGE_REF="${LANDING_IMAGE_REF:?set LANDING_IMAGE_REF (landing image built with the form, slug dlt)}"
# SEC FB-R3-SEC-OPS-US155-04 (1): this test starts a Docker stack on the machine it runs on – never on a server.
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ] || [ "$(cat "$infra/../.ottimo-home" 2>/dev/null)" != "" ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation" >&2; exit 2
fi
project=ottimo-pn-test
port=58160

home=$(mktemp -d "${TMPDIR:-/tmp}/pn-test.XXXXXX")
mkdir -p "$home/secrets" "$home/state" "$home/seed"
cp "$product/tests/fixtures/seed/ds-e.json" "$home/seed/"
rnd() { openssl rand -hex 24; }
app_pw=$(rnd); mig_pw=$(rnd)
printf '%s' "$(rnd)" > "$home/secrets/postgres_password"
printf '%s' "$app_pw" > "$home/secrets/ottimo_app_db_password"
printf '%s' "$mig_pw" > "$home/secrets/ottimo_migrator_db_password"
printf '%s' "postgres://ottimo_app:${app_pw}@postgres:5432/ottimo" > "$home/secrets/database_url"
printf '%s' "postgres://ottimo_migrator:${mig_pw}@postgres:5432/ottimo" > "$home/secrets/migration_database_url"
printf '%s' "$(rnd)" > "$home/secrets/qa_seed_password"
printf '# production: public site – no access restriction\n' > "$home/secrets/landing_access"
for s in session_secret data_kek_current id_hash_key log_ip_hmac_key guest_code_signing_key web_push_vapid_public_key \
  web_push_vapid_private_key public_form_signing_key email_smtp_password; do : > "$home/secrets/$s"; done
chmod 0644 "$home/secrets/"*   # test-only random values; Docker Desktop file sharing must let uid 70/1000/10001 read them
unset app_pw mig_pw

api_repo=${API_IMAGE_REF%:*}; api_tag=${API_IMAGE_REF##*:}
landing_repo=${LANDING_IMAGE_REF%:*}; landing_tag=${LANDING_IMAGE_REF##*:}
cat > "$home/.env" <<ENV
APP_ENV=staging
OTTIMO_PROJECT=$project
API_IMAGE=$api_repo
WEB_IMAGE=ottimo-web
LANDING_IMAGE=$landing_repo
DESK_HOST=desk.pn-test.invalid
STAFF_HOST=staff.pn-test.invalid
GUEST_HOST=guest.pn-test.invalid
ACME_EMAIL=ops@example.invalid
LANDING_HOST=landing.localhost
LANDING_WWW_HOST=www.landing.localhost
EDGE_SUBNET=172.30.160.0/24
WEB_IP=172.30.160.10
LANDING_IP=172.30.160.11
ENV
cat > "$home/override.yml" <<YML
services:
  landing:
    pull_policy: never
    ports: ['127.0.0.1:$port:443']
YML
# The compose wrapper the script uses in this test (PN_TEST_DC): same files as bin/dc + the port override.
cat > "$home/dc" <<DC
#!/usr/bin/env bash
export IMAGE_TAG=$api_tag API_TAG_SUFFIX= SECRETS_DIR=$home/secrets SEED_DIR=$home/seed
export LANDING_TAG=\${LANDING_TAG:-\$(cat $home/state/landing_tag 2>/dev/null || echo none)}
exec docker compose --project-name $project --project-directory $infra --env-file $home/.env \
  --file $infra/docker-compose.prod.yml --file $home/override.yml "\$@"
DC
chmod +x "$home/dc"
dc() { "$home/dc" "$@"; }
cleanup() { dc --profile landing --profile deploy --profile seed down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$home"; docker image rm ottimo-landing:pn-other ottimo-landing:pn-next ottimo-landing:pn-v5 ottimo-landing:pn-v5-nometa \
    ottimo-landing:pn-v5-noru ottimo-landing:pn-v5-dup >/dev/null 2>&1 || true; }
trap cleanup EXIT

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
sqlsu() { dc exec -T postgres sh -c 'psql -X -tA -U "$POSTGRES_USER" -d ottimo' <<<"$1"; }
rows() { sqlsu "SELECT count(*) || '/' || count(*) FILTER (WHERE superseded_at IS NULL) FROM privacy_notice_version;"; }
audits() { sqlsu "SELECT count(*) FROM audit_event WHERE category = 'security' AND action = 'privacy_notice.published';"; }
pn() { OTTIMO_HOME=$home PN_TEST_DC=$home/dc PN_TEST_NO_DIGEST=1 SMOKE_HTTPS_PORT=$port SMOKE_INSECURE=1 \
  bash "$infra/server/bin/publish-privacy-notice.sh" --property DLT --operator ops.test "$@" 2>&1; }
deploy_landing() { echo "$1" > "$home/state/landing_tag"; LANDING_TAG=$1 dc --profile landing up -d --wait --wait-timeout 90 landing >/dev/null 2>&1; }

echo "== stack: postgres + migrate + seed DS-E + landing ($LANDING_IMAGE_REF)"
dc up -d --wait postgres >/dev/null 2>&1
dc --profile deploy run --rm migrate >/dev/null 2>&1
dc --profile seed run --rm seed >/dev/null 2>&1
# Two variants of the landing image (built locally from the given one – no download):
#   pn-other = same version 2026-10-24, one word changed on /privacy/ (another text, same version)
#   pn-next  = version 2026-11-05 on both pages and on the form (a correct next release)
printf 'FROM %s\nUSER root\nRUN sed -i "s/Earlier versions/Older versions/" /srv/landing/privacy/index.html\nUSER 10001:10001\n' \
  "$LANDING_IMAGE_REF" | docker build -q -t ottimo-landing:pn-other - >/dev/null
printf 'FROM %s\nUSER root\nRUN sed -i "s/2026-10-24/2026-11-05/g" /srv/landing/index.html /srv/landing/vi/index.html /srv/landing/privacy/index.html /srv/landing/vi/privacy/index.html\nUSER 10001:10001\n' \
  "$LANDING_IMAGE_REF" | docker build -q -t ottimo-landing:pn-next - >/dev/null
[ "$landing_repo" = "ottimo-landing" ] || { docker tag "$LANDING_IMAGE_REF" "ottimo-landing:$landing_tag"; sed -i.bak "s#^LANDING_IMAGE=.*#LANDING_IMAGE=ottimo-landing#" "$home/.env"; }
deploy_landing "$landing_tag"

echo "== cases"
out=$(pn --landing-tag "$landing_tag" --version 2026-10-24)
[ -z "${VERBOSE:-}" ] || sed 's/^/      /' <<<"$out"
if grep -q 'DRY RUN OK' <<<"$out" && [ "$(rows)" = "0/0" ] && [ "$(audits)" = "0" ]; then ok "1 dry run: checks pass, nothing written"; else ko "1 dry run"; echo "$out"; fi

out=$(pn --landing-tag "$landing_tag" --version 2026-10-24 --apply)
[ -z "${VERBOSE:-}" ] || sed 's/^/      /' <<<"$out"
if grep -q 'OK: version 2026-10-24 published' <<<"$out" && [ "$(rows)" = "2/2" ] && [ "$(audits)" = "1" ]; then ok "2 apply: 2 rows (vi, en) + 1 audit security"; else ko "2 apply"; echo "$out"; fi
sha_db=$(sqlsu "SELECT string_agg(locale || '=' || body_sha256 || '@' || url_path, ' ' ORDER BY locale) FROM privacy_notice_version;")
sha_img=$(docker run --rm --entrypoint sh "$LANDING_IMAGE_REF" -c 'printf "en=%s@/privacy/ vi=%s@/vi/privacy/" "$(sha256sum /srv/landing/privacy/index.html | cut -d" " -f1)" "$(sha256sum /srv/landing/vi/privacy/index.html | cut -d" " -f1)"')
[ "$sha_db" = "$sha_img" ] && ok "3 body_sha256 + url_path in DB = sha256 of the files in the image" || { ko "3 hashes"; echo "db: $sha_db"; echo "img: $sha_img"; }
# What the api sees (ottimo_app + tenant context, FORCE RLS) = readiness() of public-booking.service.ts.
app_view=$(sqlsu "BEGIN; SELECT set_config('app.organization_id', (SELECT organization_id::text FROM property WHERE code = 'DLT'), true) \\gset
SET LOCAL ROLE ottimo_app; SELECT string_agg(DISTINCT locale, ',' ORDER BY locale) FROM privacy_notice_version WHERE superseded_at IS NULL; ROLLBACK;")
grep -qx 'en,vi' <<<"$app_view" && ok "3b api role (ottimo_app, RLS) sees an active row for vi + en → readiness no longer lists them" || { ko "3b app view"; echo "$app_view"; }
aud=$(sqlsu "SELECT actor_type || ' ' || entity_type || ' ' || entity_id || ' ' || (after->>'landingTag') || ' ' || (after->'locales')::text || ' ' || reason FROM audit_event WHERE action = 'privacy_notice.published';")
grep -q '^system privacy_notice_version 2026-10-24 .* \["en", "vi"\] operator: ops.test' <<<"$aud" && ok "4 audit row: system, version, locales, operator" || { ko "4 audit"; echo "$aud"; }

out=$(pn --landing-tag "$landing_tag" --version 2026-10-24 --apply)
if grep -q 'already present' <<<"$out" && [ "$(rows)" = "2/2" ] && [ "$(audits)" = "1" ]; then ok "5 re-run: already present, nothing written"; else ko "5 re-run"; echo "$out"; fi

out=$(pn --landing-tag landing-v9.9.9 --version 2026-10-24 --apply) && ko "6 wrong tag accepted" || { grep -q 'is not the deployed one' <<<"$out" && ok "6 tag ≠ deployed landing → refused" || { ko "6"; echo "$out"; }; }

out=$(pn --landing-tag "$landing_tag" --version 2026-10-31 --apply) && ko "7 version mismatch accepted" || { grep -q 'shows version' <<<"$out" && [ "$(rows)" = "2/2" ] && ok "7 --version ≠ version on the page → refused, nothing written" || { ko "7"; echo "$out"; }; }

out=$(pn --landing-tag "$landing_tag" --version 2026-10-24 --operator someone@example.com) && ko "8 e-mail operator accepted" || ok "8 operator e-mail → refused"

deploy_landing pn-other
out=$(pn --landing-tag pn-other --version 2026-10-24 --apply) && ko "9 other text accepted" || { grep -q 'ANOTHER text' <<<"$out" && [ "$(rows)" = "2/2" ] && [ "$(audits)" = "1" ] && ok "9 same version, other text (hash) → refused, nothing written" || { ko "9"; echo "$out"; }; }

deploy_landing pn-next
out=$(pn --landing-tag pn-next --version 2026-11-05 --apply)
active=$(sqlsu "SELECT string_agg(DISTINCT version, ',') FROM privacy_notice_version WHERE superseded_at IS NULL;")
if grep -q 'supersede version 2026-10-24' <<<"$out" && [ "$(rows)" = "4/2" ] && [ "$active" = "2026-11-05" ] && [ "$(audits)" = "2" ]; then
  ok "10 next version: 2 rows added, 2026-10-24 superseded once, 1 more audit"; else ko "10 next version"; echo "$out"; fi
sup1=$(sqlsu "SELECT string_agg(superseded_at::text, ',') FROM privacy_notice_version WHERE version = '2026-10-24';")
pn --landing-tag pn-next --version 2026-11-05 --apply >/dev/null
sup2=$(sqlsu "SELECT string_agg(superseded_at::text, ',') FROM privacy_notice_version WHERE version = '2026-10-24';")
[ "$sup1" = "$sup2" ] && ok "11 re-run of next version: superseded_at unchanged" || ko "11 superseded_at changed"

deploy_landing "$landing_tag"
out=$(pn --landing-tag "$landing_tag" --version 2026-10-24 --apply) && ko "12 superseded version re-activated" || { grep -q 'superseded at' <<<"$out" && [ "$(rows)" = "4/2" ] && ok "12 superseded version cannot come back" || { ko "12"; echo "$out"; }; }

prod=$(mktemp -d "${TMPDIR:-/tmp}/pn-prod.XXXXXX"); cp "$home/.env" "$prod/.env"; sed -i.bak 's/^APP_ENV=.*/APP_ENV=production/' "$prod/.env"
out=$(OTTIMO_HOME=$prod PN_TEST_DC=$home/dc bash "$infra/server/bin/publish-privacy-notice.sh" --landing-tag x --version 2026-10-24 --property DLT --operator ops.test 2>&1) \
  && ko "13 PN_TEST_DC accepted on production" || { grep -q 'not allowed on production' <<<"$out" && ok "13 test overrides refused on production" || { ko "13"; echo "$out"; }; }
out=$(OTTIMO_HOME=$prod SMOKE_INSECURE=1 bash "$infra/server/bin/publish-privacy-notice.sh" --landing-tag x --version 2026-10-24 --property DLT --operator ops.test 2>&1) \
  && ko "13b SMOKE_INSECURE accepted on production" || { grep -q 'not allowed on production' <<<"$out" && ok "13b SMOKE_INSECURE / SMOKE_ADDR refused on production" || { ko "13b"; echo "$out"; }; }
rm -rf "$prod"

out=$(dc exec -T postgres sh -c 'psql -X -q -U "$POSTGRES_USER" -d ottimo -v slug=dlt -v version=2026-12-01 -v locales=en,vi -v required=en,vi -v shas=$(printf b%.0s $(seq 64)),$(printf a%.0s $(seq 64)) -v operator=ops.test -v landing_tag=t -v landing_digest= -v apply=true -f -' \
  < "$infra/server/publish-privacy-notice.sql" 2>&1) && ko "14 superuser run accepted" || { grep -q 'superuser' <<<"$out" && [ "$(rows)" = "4/2" ] && ok "14 SQL run by the superuser → refused" || { ko "14"; echo "$out"; }; }

echo "== LP-v2: 5 languages (variants of $LANDING_IMAGE_REF: ko/zh/ru pages + meta tag, version 2026-11-20)"
# pn-v5: what an LP-v2 build looks like to the tool – 5 privacy pages, one meta tag each, hreflang of the 5 languages,
# the form's data-consent-version on the 5 home pages. Built locally from the given image (no download).
cat > "$home/v5.Dockerfile" <<DF
FROM $LANDING_IMAGE_REF
USER root
RUN set -e; cd /srv/landing; sed -i 's/2026-10-24/2026-11-20/g' index.html vi/index.html privacy/index.html vi/privacy/index.html; \
  for l in ko zh ru; do mkdir -p \$l/privacy; sed "s/lang=\"vi\"/lang=\"\$l\"/" vi/privacy/index.html > \$l/privacy/index.html; \
    echo "<!-- \$l -->" >> \$l/privacy/index.html; sed "s/lang=\"vi\"/lang=\"\$l\"/" vi/index.html > \$l/index.html; done; \
  for f in privacy/index.html vi/privacy/index.html ko/privacy/index.html zh/privacy/index.html ru/privacy/index.html; do \
    sed -i 's#</head>#<meta name="ottimo-notice-version" content="2026-11-20"><link rel="alternate" hreflang="ko" href="/ko/privacy/"><link rel="alternate" hreflang="zh" href="/zh/privacy/"><link rel="alternate" hreflang="ru" href="/ru/privacy/"></head>#' \$f; done
USER 10001:10001
DF
docker build -q -t ottimo-landing:pn-v5 - < "$home/v5.Dockerfile" >/dev/null
v5var() { # tag RUN-commands – version 2026-11-25 + one change
  printf 'FROM ottimo-landing:pn-v5\nUSER root\nRUN set -e; cd /srv/landing; for f in index.html */index.html privacy/index.html */privacy/index.html; do sed -i "s/2026-11-20/2026-11-25/g" $f; done; %s\nUSER 10001:10001\n' "$2" \
    | docker build -q -t "ottimo-landing:$1" - >/dev/null
}
v5var pn-v5-nometa "sed -i 's#<meta name=\"ottimo-notice-version\"[^>]*>##' ko/privacy/index.html"
v5var pn-v5-noru 'rm -rf ru'
v5var pn-v5-dup 'cp ko/privacy/index.html zh/privacy/index.html'
v5var pn-v5-nohref "sed -i 's/hreflang=\"[a-z-]*\"//g' privacy/index.html"
deploy_landing pn-v5

chk=$(sqlsu "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'privacy_notice_version_locale_check';")
if grep -q "'ko'" <<<"$chk"; then
  ok "21 (skipped: the api image already has migration 0091 – ko/zh/ru accepted)"
else
  out=$(pn --landing-tag pn-v5 --version 2026-11-20 --apply) && ko "21 ko accepted by a database without 0091" || {
    grep -q 'does not accept language ko yet' <<<"$out" && [ "$(rows)" = "4/2" ] \
      && ok "21 database before migration 0091 → refused, says to deploy the api first, nothing written" || { ko "21"; echo "$out"; }; }
  # What migration 0091 (lp-v2-be) does to this table – widen the CHECK only.
  sqlsu "ALTER TABLE privacy_notice_version DROP CONSTRAINT privacy_notice_version_locale_check;
         ALTER TABLE privacy_notice_version ADD CONSTRAINT privacy_notice_version_locale_check CHECK (locale IN ('vi', 'en', 'ru', 'ko', 'zh'));" >/dev/null
fi

out=$(pn --landing-tag pn-v5 --version 2026-11-20)
[ -z "${VERBOSE:-}" ] || sed 's/^/      /' <<<"$out"
if grep -q 'DRY RUN OK' <<<"$out" && grep -q 'in 5 language(s): en .* vi .* ko .* zh .* ru ' <<<"$out" && [ "$(rows)" = "4/2" ]; then
  ok "22 dry run, 5 languages from the image: checks pass, nothing written"; else ko "22 dry run 5"; echo "$out"; fi
out=$(pn --landing-tag pn-v5 --version 2026-11-20 --apply)
[ -z "${VERBOSE:-}" ] || sed 's/^/      /' <<<"$out"
active=$(sqlsu "SELECT string_agg(locale || '=' || version, ',' ORDER BY locale) FROM privacy_notice_version WHERE superseded_at IS NULL;")
if grep -q 'OK: version 2026-11-20 published (en vi ko zh ru)' <<<"$out" && [ "$(rows)" = "9/5" ] && [ "$(audits)" = "3" ] \
  && [ "$active" = "en=2026-11-20,ko=2026-11-20,ru=2026-11-20,vi=2026-11-20,zh=2026-11-20" ] \
  && grep -q 'supersede version 2026-11-05 (en)' <<<"$out" && grep -q 'supersede version 2026-11-05 (vi)' <<<"$out"; then
  ok "23 apply: 5 rows in one transaction, 2026-11-05 en/vi superseded, 1 audit"; else ko "23 apply 5"; echo "$out"; echo "$active"; fi
sha_db=$(sqlsu "SELECT string_agg(locale || '=' || body_sha256 || '@' || url_path, ' ' ORDER BY locale) FROM privacy_notice_version WHERE version = '2026-11-20';")
sha_img=""
for l in en ko ru vi zh; do
  f=$([ "$l" = en ] && echo privacy/index.html || echo "$l/privacy/index.html")
  sha_img+="$l=$(docker run --rm --entrypoint sha256sum ottimo-landing:pn-v5 "/srv/landing/$f" | cut -d' ' -f1)@/${f%index.html} "
done
[ "$sha_db" = "${sha_img% }" ] && ok "24 body_sha256 + url_path of the 5 rows = the files in the image" || { ko "24 hashes 5"; echo "db: $sha_db"; echo "img: $sha_img"; }
aud=$(sqlsu "SELECT (after->'locales')::text || ' ' || (SELECT count(*) FROM jsonb_object_keys(after->'hashes')) FROM audit_event WHERE action = 'privacy_notice.published' AND entity_id = '2026-11-20';")
logl=$(grep ' apply .* version=2026-11-20 ' "$home/state/privacy-notice.log" | tail -n 1)
if [ "$aud" = '["en", "vi", "ko", "zh", "ru"] 5' ] && grep -q 'sha_en=[0-9a-f]\{64\} sha_vi=[0-9a-f]\{64\} sha_ko=[0-9a-f]\{64\} sha_zh=[0-9a-f]\{64\} sha_ru=[0-9a-f]\{64\} rc=0$' <<<"$logl"; then
  ok "25 audit lists the 5 languages + 5 hashes; log line has sha_<xx> for each (deploy-landing.sh reads it)"; else ko "25 audit/log"; echo "$aud"; echo "$logl"; fi
out=$(pn --landing-tag pn-v5 --version 2026-11-20 --apply)
if grep -q 'already present' <<<"$out" && [ "$(rows)" = "9/5" ] && [ "$(audits)" = "3" ]; then ok "26 re-run (5 languages): already present, nothing written"; else ko "26"; echo "$out"; fi

deploy_landing pn-v5-nometa
out=$(pn --landing-tag pn-v5-nometa --version 2026-11-25 --apply) && ko "27 page without meta tag accepted" || {
  grep -q '/ko/privacy/ has no <meta name="ottimo-notice-version">' <<<"$out" && [ "$(rows)" = "9/5" ] \
    && ok "27 ko page without the meta tag → refused, nothing written" || { ko "27"; echo "$out"; }; }
deploy_landing pn-v5-noru
out=$(pn --landing-tag pn-v5-noru --version 2026-11-25 --apply) && ko "28 missing ru page accepted" || {
  grep -q "lists the languages 'en ko ru vi zh' (hreflang of /privacy/) but has privacy pages for 'en ko vi zh'" <<<"$out" && [ "$(rows)" = "9/5" ] \
    && ok "28 hreflang lists ru, no /ru/privacy/ in the build → refused (whole run)" || { ko "28"; echo "$out"; }; }
deploy_landing pn-v5-dup
out=$(pn --landing-tag pn-v5-dup --version 2026-11-25 --apply) && ko "29 identical pages accepted" || {
  grep -q 'byte-identical privacy pages' <<<"$out" && [ "$(rows)" = "9/5" ] \
    && ok "29 two languages with the same bytes → refused" || { ko "29"; echo "$out"; }; }
deploy_landing "$landing_tag"
sed -i.bak 's/^LANDING_LOCALES=.*//' "$home/.env"; echo 'LANDING_LOCALES=en,vi,ko,zh,ru' >> "$home/.env"
out=$(pn --landing-tag "$landing_tag" --version 2026-12-01 --apply) && ko "30 LANDING_LOCALES without pages accepted" || {
  grep -q "LANDING_LOCALES has 'ko' but the running landing has no /ko/privacy/ page" <<<"$out" && [ "$(rows)" = "9/5" ] \
    && ok "30 LANDING_LOCALES has ko,zh,ru, running build has en+vi only → refused" || { ko "30"; echo "$out"; }; }
sed -i.bak 's/^LANDING_LOCALES=.*//' "$home/.env"
deploy_landing pn-v5-nohref
out=$(pn --landing-tag pn-v5-nohref --version 2026-11-25 --apply) && ko "31 LP-v2 build without hreflang accepted" || {
  grep -q 'no hreflang list on /privacy/' <<<"$out" && [ "$(rows)" = "9/5" ] \
    && ok "31 LP-v2 build (meta tag) without hreflang on /privacy/ → refused, nothing written (SEC LPV2-S3)" || { ko "31"; echo "$out"; }; }
deploy_landing "$landing_tag"
out=$(pn --landing-tag "$landing_tag" --version 2026-11-20.01 --apply 2>&1) && ko "32 version .01 accepted" || {
  grep -q 'version must be YYYY-MM-DD' <<<"$out" && [ "$(rows)" = "9/5" ] \
    && ok "32 --version 2026-11-20.01 (leading zero) → refused (SEC LPV2-S1)" || { ko "32"; echo "$out"; }; }

echo "== smoke counts, step L (bin/us155-smoke-counts.sh – SEC FB-R3-SEC-OPS-US155-02), synthetic rows (fake data)"
since=$(sqlsu "SELECT to_char(now() - interval '1 minute', 'YYYY-MM-DD\"T\"HH24:MI:SS') || '+00:00';")
# An erased test request as WR8 leaves it (C2 NULL, purge_journal, audit, notification, SM-18 history) – columns as
# website-requests.service.ts writes them; one owner of DS-E receives the notification.
sqlsu "BEGIN;
WITH ctx AS (SELECT p.organization_id AS org, p.id AS prop, gen_random_uuid() AS id,
                    (SELECT u.id FROM app_user u WHERE u.organization_id = p.organization_id ORDER BY u.username LIMIT 1) AS usr
               FROM property p WHERE p.code = 'DLT'),
r AS (INSERT INTO website_booking_request (id, organization_id, property_id, ref_code, status, arrival_date, departure_date,
        stay_kind, adults, locale, preferred_channel, consent_version, consent_at, reply_by, last_activity_at, created_at,
        updated_at, decline_reason_code, pii_purged_at)
      SELECT id, org, prop, 'K7P9QXA2', 'declined', current_date + 20, current_date + 22, 'short', 1, 'en', 'email',
             '2026-11-05', now(), now() + interval '1 hour', now(), now(), now(), 'erased_on_request', now() FROM ctx
      RETURNING id, organization_id AS org, property_id AS prop),
j AS (INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action, purged_at)
      SELECT org, prop, 'website_booking_request', id, 'dsr_erase', 'null_columns', now() FROM r),
a AS (INSERT INTO audit_event (organization_id, property_id, occurred_at, actor_type, category, action, entity_type, entity_id, after)
      SELECT org, prop, now(), 'user', 'security', 'website_request.erased', 'website_booking_request', id::text,
             '{\"verificationMethod\":\"same_contact\",\"status\":\"declined\"}'::jsonb FROM r),
n AS (INSERT INTO staff_notification (id, organization_id, property_id, user_id, kind, ref_type, ref_id, ref_code, created_at)
      SELECT gen_random_uuid(), r.org, r.prop, ctx.usr, 'website_request_new', 'website_booking_request', r.id, 'K7P9QXA2', now()
        FROM r, ctx)
INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state, event_code, actor_type, occurred_at)
SELECT org, prop, 'SM-18', id, NULL, 'new', 'create_website_request', 'guest', now() FROM r
UNION ALL SELECT org, prop, 'SM-18', id, 'new', 'declined', 'erase_website_request', 'user', now() FROM r;
COMMIT;" >/dev/null
sc() { OTTIMO_HOME=$home PN_TEST_DC=$home/dc bash "$infra/server/bin/us155-smoke-counts.sh" "$@" 2>&1; }
out=$(sc --ref REQ-K7P9QXA2 --since "$since")
[ -z "${VERBOSE:-}" ] || sed 's/^/      /' <<<"$out"
grep -q 'RESULT: OK – 14/14' <<<"$out" && ok "15 erased request, no test string anywhere → 14/14 OK, exit 0" || { ko "15"; echo "$out"; }
before=$(sqlsu "SELECT (SELECT count(*) FROM website_booking_request) || '/' || (SELECT count(*) FROM audit_event);")
[ "$(sqlsu "SELECT (SELECT count(*) FROM website_booking_request) || '/' || (SELECT count(*) FROM audit_event);")" = "$before" ] \
  && ok "16 counts query changed nothing (READ ONLY + ROLLBACK)" || ko "16"
sqlsu "INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key, created_at)
       SELECT gen_random_uuid(), organization_id, id, 'test.leak', '{\"name\":\"TEST OTTIMO\"}'::jsonb, 'pn-test-leak', now()
         FROM property WHERE code = 'DLT';" >/dev/null
out=$(sc --ref REQ-K7P9QXA2 --since "$since") && ko "17 leak in outbox accepted" || {
  grep -q '^8\. outbox_message.* | FAIL$' <<<"$out" && grep -q '^14\. .*outbox_message.* | FAIL$' <<<"$out" \
    && ok "17 test string left in outbox_message → checks 8 + 14 FAIL, exit 1" || { ko "17"; echo "$out"; }; }
sqlsu "DELETE FROM outbox_message WHERE dedupe_key = 'pn-test-leak';" >/dev/null
sqlsu "INSERT INTO website_booking_request (id, organization_id, property_id, ref_code, status, arrival_date, departure_date,
         stay_kind, adults, locale, preferred_channel, guest_name, email, contact_hmac, consent_version, consent_at, reply_by,
         last_activity_at, created_at, updated_at)
       SELECT gen_random_uuid(), organization_id, id, 'M3N4P5Q6', 'new', current_date + 20, current_date + 22, 'short', 1, 'en',
              'email', 'TEST OTTIMO', 'info@ottimo.vn', 'x', '2026-11-05', now(), now() + interval '1 hour', now(), now(), now()
         FROM property WHERE code = 'DLT';" >/dev/null
out=$(sc --ref M3N4P5Q6 --since "$since") && ko "18 not erased accepted" || {
  [ "$(grep -c ' | FAIL$' <<<"$out")" -ge 5 ] && grep -q '^2\. .* | FAIL$' <<<"$out" && grep -q '^3\. .* | FAIL$' <<<"$out" \
    && ok "18 request NOT erased → checks 2, 3, 4, 5, 14 … FAIL, exit 1" || { ko "18"; echo "$out"; }; }
out=$(sc --ref REQ-ZZZZZZZZ --since "$since") && ko "19 unknown ref accepted" || { grep -q '^1\. .* | 0 | 1 | FAIL$' <<<"$out" && ok "19 unknown ref → check 1 FAIL" || { ko "19"; echo "$out"; }; }
out=$(sc --ref REQ-K7P9QXA2 --since "2026-10-31 07:40") && ko "20 since without time zone accepted" || ok "20 --since without time zone → refused"

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
