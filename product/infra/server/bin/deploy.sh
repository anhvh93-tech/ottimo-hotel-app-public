#!/usr/bin/env bash
# Deploy one image tag built and pushed by CI (hosting-plan 6) – run as the deploy user (member of `docker`).
#   deploy.sh <tag>               e.g. sha-1a2b3c4d5e6f (tag written by the CI job publish-images)
#   deploy.sh <tag> --no-pull     images already on this host (local rehearsal, offline re-deploy)
#   deploy.sh <tag> --rollback    used by rollback.sh: the database may be ahead of this image's migrations
#   deploy.sh <tag> --api-digest sha256:<64 hex> --web-digest sha256:<64 hex>
#                                 the pulled images must have exactly these registry digests (the digests CI read when
#                                 the tag was released – SEC E.10.2 (4)); REQUIRED when APP_ENV=production (a rollback
#                                 re-checks the digests recorded at the earlier deploy in state/digests/<tag>)
# Production guard (APP_ENV=production, step `config`): MFA_ENFORCED=true, CLOCK_MODE=system, no test image / test
# switches (SEC E.10.2 (2)); every secret file the compose project needs exists; edge mode: the link network exists.
# Steps: pull → postgres up → 02-roles.sh (SEC H3: role limits re-applied on an existing database) → migrate
# (separate one-shot, ottimo_migrator → SET ROLE ottimo_owner; erd 16 point 5) → migration count check (ARC s3 4.2-7)
# → api/worker/web on the new tag → smoke (health, role limits, worker, Caddy headers, blob probe).
# A failure after the containers changed puts the previous tag back (images only: migrations are forward-only and
# written "expand first, contract later", so the previous image runs on the newer schema – hosting-plan 6.3).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
state="$OTTIMO_HOME/state"
export OTTIMO_HOME

tag="${1:-}"
shift || true
pull=1
rollback=0
api_digest=""
web_digest=""
while [ $# -gt 0 ]; do
  case "$1" in
    --no-pull) pull=0; shift ;;
    --rollback) rollback=1; shift ;;
    --api-digest) api_digest="${2:-}"; shift 2 || true ;;
    --web-digest) web_digest="${2:-}"; shift 2 || true ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
if ! [[ "$tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
  echo "usage: $0 <image tag> [--no-pull] [--rollback] [--api-digest sha256:… --web-digest sha256:…]" >&2
  exit 2
fi
for d in "$api_digest" "$web_digest"; do
  [ -z "$d" ] || [[ "$d" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo "digest must be sha256:<64 hex>" >&2; exit 2; }
done

# Fixed step names for deploy-from-ci.sh (the CI sees only "failed (step=<name>)" – SEC E.8).
step() { if [ -n "${OTTIMO_STEP_FILE:-}" ]; then printf '%s\n' "$1" > "$OTTIMO_STEP_FILE"; fi; }
step lock
mkdir -p "$state"
exec 9>"$state/deploy.lock"
if ! flock -n 9; then echo "another deploy is running" >&2; exit 3; fi

log() {
  echo "[deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  logger -t ottimo-deploy -- "$*" 2>/dev/null || true
}
dc() { "$here/dc" "$@"; }
envval() { # value of KEY in the server .env (non-secret settings only)
  sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'
}

prev=""
[ -r "$state/current_tag" ] && prev=$(cat "$state/current_tag")
export IMAGE_TAG="$tag"
log "deploy $tag (previous: ${prev:-none}, pull=$pull, rollback=$rollback)"

# ---- 0. configuration guard (before anything changes) ----
step config
app_env=$(envval APP_ENV)
# FB-R3-SEC-OPS-03: the production stack is recognised by its home (marker written by bootstrap-vps.sh --env
# production, /opt/ottimo-prod) or EDGE_NAME – a mistyped APP_ENV there must not switch the production guard off.
if [ "$(cat "$OTTIMO_HOME/.ottimo-home" 2>/dev/null)" = "production" ] || [ "$(envval EDGE_NAME)" = "production" ] \
  || [ "$(basename "$OTTIMO_HOME")" = "ottimo-prod" ]; then
  [ "$app_env" = "production" ] || { log "FAIL: this is the production stack but APP_ENV=${app_env:-<empty>}"; exit 1; }
fi
if [ "$rollback" -eq 1 ] && [ -z "$api_digest$web_digest" ] && [ -r "$state/digests/$tag" ]; then
  api_digest=$(sed -n 's/^api=//p' "$state/digests/$tag"); web_digest=$(sed -n 's/^web=//p' "$state/digests/$tag")
fi
if [ "$app_env" = "production" ]; then
  problems=""
  [ "$(envval MFA_ENFORCED)" = "true" ] || problems+=" MFA_ENFORCED must be true;"
  case "$(envval CLOCK_MODE)" in ''|system) ;; *) problems+=" CLOCK_MODE must be system;" ;; esac
  case "$(envval INCLUDE_TEST_SUPPORT)" in ''|0) ;; *) problems+=" INCLUDE_TEST_SUPPORT must be 0;" ;; esac
  [ -z "$(envval API_TAG_SUFFIX)" ] || problems+=" API_TAG_SUFFIX must be empty (no -test image);"
  [ -z "$(envval TEST_SUPPORT_TOKEN)" ] || problems+=" TEST_SUPPORT_TOKEN must be empty;"
  case "$tag" in *-test) problems+=" a -test tag cannot run in production;" ;; esac
  if [ -z "$api_digest" ] || [ -z "$web_digest" ]; then
    problems+=" production needs --api-digest and --web-digest (CI release job, or state/digests/<tag> on rollback);"
  fi
  [ -z "$problems" ] || { log "FAIL: production guard:$problems"; exit 1; }
fi
# US-155 (SEC s1-SEC-on-us155 condition 2): LANDING_BASE_URL is empty or an https origin; the landing form proxy
# (LANDING_PUBLIC_API=on) needs it to be exactly https://<LANDING_HOST>.
lb=$(envval LANDING_BASE_URL)
if [ -n "$lb" ] && ! [[ "$lb" =~ ^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]]; then
  log "FAIL: LANDING_BASE_URL must be https://<host> without path (found '$lb')"; exit 1
fi
if [ "$(envval LANDING_PUBLIC_API)" = "on" ] && [ "$lb" != "https://$(envval LANDING_HOST)" ]; then
  log "FAIL: LANDING_PUBLIC_API=on needs LANDING_BASE_URL=https://$(envval LANDING_HOST)"; exit 1
fi
# The landing container joins the stack's `edge` network at LANDING_IP (trusted by the api): it must lie in EDGE_SUBNET
# (production 172.30.1.0/24 – an .env written before 24/10 lacks LANDING_IP and would fall back to staging's address).
es=$(envval EDGE_SUBNET); li=$(envval LANDING_IP); li=${li:-172.30.0.11}  # compose default
if [ -n "$es" ] && [ "${es##*/}" = "24" ] && [ "${li%.*}" != "${es%.*/*}" ]; then
  log "FAIL: LANDING_IP='${li:-<unset>}' (default when unset) is not in EDGE_SUBNET=$es – add LANDING_IP=${es%.*/*}.11 to $OTTIMO_HOME/.env"; exit 1
fi
# Every secret file of the project must exist (a new secret in compose = run init-secrets.sh first). The deploy user
# can test the paths (directory 0710 root:ottimo) but not read them.
missing=$(dc --profile deploy config --format json | jq -r '.secrets // {} | to_entries[] | .value.file' \
  | while IFS= read -r f; do [ -e "$f" ] || basename "$f"; done | tr '\n' ' ')
[ -z "$missing" ] || { log "FAIL: secret file(s) missing: ${missing}– run: sudo $here/init-secrets.sh"; exit 1; }
if [ "$(envval EDGE_MODE)" = "edge" ]; then
  docker network inspect "ottimo-link-$(envval EDGE_NAME)" >/dev/null 2>&1 \
    || { log "FAIL: network ottimo-link-$(envval EDGE_NAME) missing – start the edge first: $here/edge.sh up"; exit 1; }
fi

# ---- 1. images ----
step pull
if [ "$pull" -eq 1 ]; then
  dc --profile deploy pull --quiet migrate api worker web
fi
# Registry digest check (SEC E.10.2 (4)): the image under this tag must be the one CI released.
digest_ok() { # image-ref expected-digest
  docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$1" 2>/dev/null | grep -q "@$2\$"
}
if [ -n "$api_digest$web_digest" ]; then
  api_ref="$(envval API_IMAGE):$tag$(envval API_TAG_SUFFIX)"
  web_ref="$(envval WEB_IMAGE):$tag"
  digest_ok "$api_ref" "$api_digest" || { log "FAIL: $api_ref does not have the released digest"; exit 1; }
  digest_ok "$web_ref" "$web_digest" || { log "FAIL: $web_ref does not have the released digest"; exit 1; }
  log "image digests match the release"
fi

# ---- 2. database + roles (H3) ----
step roles
dc up --detach --wait --wait-timeout 180 postgres
dc exec -T postgres bash /docker-entrypoint-initdb.d/02-roles.sh >/dev/null
log "02-roles.sh applied (ottimo_app limits verified by the script)"

psql_admin() { # read-only SQL from stdin, as the superuser over the container's local socket
  dc exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'
}

# ---- 3. migrations (one-shot, before any api/worker runs the new code) ----
step migrate
dc --profile deploy run --rm --no-deps migrate
journal=$(dc --profile deploy run --rm --no-deps --entrypoint node migrate \
  -e "process.stdout.write(String(require('/app/dist/db/migrations/meta/_journal.json').entries.length))")
applied=$(psql_admin <<<'SELECT count(*) FROM drizzle.__drizzle_migrations;')
if [ "$rollback" -eq 1 ]; then
  [ "$applied" -ge "$journal" ] || { log "FAIL: database has $applied migrations, image $tag expects $journal"; exit 1; }
elif [ "$applied" -ne "$journal" ]; then
  log "FAIL: __drizzle_migrations=$applied but the image journal has $journal entries (skipped migration?)"
  exit 1
fi
log "migrations: $applied applied / $journal in the image journal"

# ---- 4. switch containers + smoke ----
restore_previous() {
  if [ -n "$prev" ] && [ "$prev" != "$tag" ] && [ "$rollback" -eq 0 ]; then
    log "putting previous tag $prev back"
    IMAGE_TAG="$prev" dc up --detach --wait --wait-timeout 180 api worker web || log "WARNING: previous tag did not come back healthy – see dc ps / dc logs"
  fi
}
fail() {
  log "FAIL: $*"
  dc ps --all || true
  dc logs --no-color --tail 80 api worker web || true
  restore_previous
  exit 1
}

step switch
dc up --detach --wait --wait-timeout 240 --remove-orphans api worker web || fail "containers did not become healthy"

step smoke
health=$(dc exec -T api wget -qO- http://127.0.0.1:3000/health) || fail "api /health"
case "$health" in *'"status":"ok"'*) ;; *) fail "api /health: $health" ;; esac

cfg=$(psql_admin <<<"SELECT array_to_string(rolconfig, ',') FROM pg_roles WHERE rolname = 'ottimo_app';")
case ",$cfg," in *,idle_in_transaction_session_timeout=30s,*) ;; *) fail "ottimo_app idle_in_transaction_session_timeout missing ($cfg)" ;; esac
case ",$cfg," in *,statement_timeout=15s,*) ;; *) fail "ottimo_app statement_timeout missing ($cfg)" ;; esac

sleep 5
[ -n "$(dc ps --status running --quiet worker)" ] || fail "worker is not running"

# SEC C2: the blob volume is mounted in api + worker and NOT in web (checked on the running containers).
# shellcheck disable=SC2016
mounts_of() { docker inspect --format '{{range .Mounts}}{{.Type}}:{{.Name}}:{{.Destination}} {{end}}' "$(dc ps -q "$1")"; }
for s in api worker; do
  mounts_of "$s" | grep -q 'volume:[^ ]*blobdata:/var/lib/ottimo/blobs' || fail "$s has no blobdata volume at /var/lib/ottimo/blobs"
done
if mounts_of web | grep -q 'blobdata'; then fail "web (Caddy) mounts the blob volume (SEC C2)"; fi

# Caddy, from this host (the Docker gateway is a private address, so /health is allowed). PUBLIC_HTTP(S)_PORT,
# SMOKE_ADDR and SMOKE_INSECURE=1 exist for a local rehearsal (Caddy's internal CA); on the VPS the real
# certificate is checked against 127.0.0.1. Headers are compared EXACTLY with infra/caddy/expected-headers.sh.
# shellcheck source=../../caddy/expected-headers.sh
. "$here/../../caddy/expected-headers.sh"
port=$(envval PUBLIC_HTTPS_PORT); port="${port:-443}"
http_port=$(envval PUBLIC_HTTP_PORT); http_port="${http_port:-80}"
addr="${SMOKE_ADDR:-127.0.0.1}"
# Marker values sent in headers/query that must never appear in a Caddy log line (SR-LOG-01…03).
m_cookie="ckMARK$(openssl rand -hex 8)"; m_csrf="csMARK$(openssl rand -hex 8)"; m_ref="rfMARK$(openssl rand -hex 8)"
m_query="qMARK$(openssl rand -hex 8)"; fake_token="smoke$(openssl rand -hex 19)"
curl_opts=(--silent --show-error --max-time 20 --retry 6 --retry-delay 5 --retry-all-errors
  -H "Cookie: __Host-ottimo_sid=$m_cookie" -H "X-CSRF-Token: $m_csrf" -H "Referer: https://smoke.invalid/$m_ref")
[ "${SMOKE_INSECURE:-0}" = "1" ] && curl_opts+=(--insecure)
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
check_site() { # host  desk|staff|guest
  local host="$1" site="$2" headers code problems
  headers=$(curl "${curl_opts[@]}" --resolve "$host:$port:$addr" -o /dev/null -D - "https://$host:$port/") \
    || fail "https://$host/ unreachable"
  code=$(tr -d '\r' <<<"$headers" | head -n 1 | awk '{print $2}')
  [ "$code" = "200" ] || fail "https://$host/ answered $code"
  problems=$(ottimo_check_security_headers "$headers" "$site")
  [ -z "$problems" ] || fail "$host security headers: $(tr '\n' ';' <<<"$problems")"
  code=$(curl "${curl_opts[@]}" --resolve "$host:$port:$addr" -o /dev/null -w '%{http_code}' "https://$host:$port/health")
  [ "$code" = "200" ] || fail "$host/health through Caddy answered $code"
  # SEC C2 / FB-R2-SEC-OPS-03 (4): blob-volume-looking paths, dot-files and source maps are 404 (the same rules
  # are proven against REAL files on every PR – infra/ci/check-caddy-prod.sh).
  for probe in /var/lib/ottimo/blobs/00/0000 /blobs/x /.env /assets/index.js.map; do
    code=$(curl "${curl_opts[@]}" --resolve "$host:$port:$addr" -o /dev/null -w '%{http_code}' "https://$host:$port$probe")
    [ "$code" = "404" ] || fail "$host: probe $probe answered $code (expected 404)"
  done
}
check_site "$(envval DESK_HOST)" desk
check_site "$(envval STAFF_HOST)" staff
check_site "$(envval GUEST_HOST)" guest

# FB-R2-SEC-OPS-03 (4) / SR-LOG-03: open a fake guest link over HTTPS and over port 80 (redirect server); the Caddy
# logs must show /g/[redacted] and contain neither the token, the query value nor any header marker.
guest_host=$(envval GUEST_HOST)
curl "${curl_opts[@]}" --resolve "$guest_host:$port:$addr" -o /dev/null "https://$guest_host:$port/g/$fake_token?x=$m_query" \
  || fail "guest link page unreachable"
code=$(curl --silent --max-time 20 --resolve "$guest_host:$http_port:$addr" -H "Cookie: __Host-ottimo_gsid=$m_cookie" \
  -o /dev/null -w '%{http_code}' "http://$guest_host:$http_port/g/$fake_token?x=$m_query")
[ "$code" = "308" ] || fail "port $http_port /g/<token> answered $code (expected 308 → https)"
sleep 2
web_log=$(dc logs --no-color --since "$since" web 2>&1)
for v in "$fake_token" "$m_query" "$m_cookie" "$m_csrf" "$m_ref"; do
  if grep -qF "$v" <<<"$web_log"; then fail "Caddy log contains a token/query/header value (SR-LOG-01…03)"; fi
done
grep -qF '/g/[redacted]' <<<"$web_log" || fail "Caddy access log has no masked /g/ entry (logging off?)"

# ---- 5. record ----
step record
if [ -n "$prev" ] && [ "$prev" != "$tag" ]; then echo "$prev" > "$state/previous_tag"; fi
echo "$tag" > "$state/current_tag"
if [ -n "$api_digest$web_digest" ]; then
  mkdir -p "$state/digests"
  printf 'api=%s\nweb=%s\n' "$api_digest" "$web_digest" > "$state/digests/$tag"
fi
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $tag" >> "$state/deploy-history.log"
# Free disk: unused images older than 7 days (the previous tag can always be pulled again from the registry).
docker image prune --all --force --filter "until=168h" >/dev/null 2>&1 || true
log "OK: $tag is live"
