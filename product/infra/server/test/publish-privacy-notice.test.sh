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
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
infra=$(cd "$here/../.." && pwd)
product=$(cd "$infra/.." && pwd)
API_IMAGE_REF="${API_IMAGE_REF:?set API_IMAGE_REF (api image with migrations ≥ 0086)}"
LANDING_IMAGE_REF="${LANDING_IMAGE_REF:?set LANDING_IMAGE_REF (landing image built with the form, slug dlt)}"
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
  rm -rf "$home"; docker image rm ottimo-landing:pn-other ottimo-landing:pn-next >/dev/null 2>&1 || true; }
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
grep -q '^system privacy_notice_version 2026-10-24 .* \["vi", "en"\] operator: ops.test' <<<"$aud" && ok "4 audit row: system, version, locales, operator" || { ko "4 audit"; echo "$aud"; }

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
rm -rf "$prod"

out=$(dc exec -T postgres sh -c 'psql -X -q -U "$POSTGRES_USER" -d ottimo -v slug=dlt -v version=2026-12-01 -v sha_vi=$(printf a%.0s $(seq 64)) -v sha_en=$(printf b%.0s $(seq 64)) -v operator=ops.test -v landing_tag=t -v landing_digest= -v apply=true -f -' \
  < "$infra/server/publish-privacy-notice.sql" 2>&1) && ko "14 superuser run accepted" || { grep -q 'superuser' <<<"$out" && [ "$(rows)" = "4/2" ] && ok "14 SQL run by the superuser → refused" || { ko "14"; echo "$out"; }; }

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
