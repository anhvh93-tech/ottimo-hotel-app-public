#!/usr/bin/env bash
# Deploy one image tag built and pushed by CI (hosting-plan 6) – run as the deploy user (member of `docker`).
#   deploy.sh <tag>               e.g. sha-1a2b3c4d5e6f (tag written by the CI job publish-images)
#   deploy.sh <tag> --no-pull     images already on this host (local rehearsal, offline re-deploy)
#   deploy.sh <tag> --rollback    used by rollback.sh: the database may be ahead of this image's migrations
# Steps: pull → postgres up → 02-roles.sh (SEC H3: role limits re-applied on an existing database) → migrate
# (separate one-shot, ottimo_migrator → SET ROLE ottimo_owner; erd 16 point 5) → migration count check (ARC s3 4.2-7)
# → api/worker/web on the new tag → smoke (health, role limits, worker, Caddy headers, blob probe).
# A failure after the containers changed puts the previous tag back (images only: migrations are forward-only and
# written "expand first, contract later", so the previous image runs on the newer schema – hosting-plan 6.3).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
state="$OTTIMO_HOME/state"
export OTTIMO_HOME

tag="${1:-}"
shift || true
pull=1
rollback=0
for arg in "$@"; do
  case "$arg" in
    --no-pull) pull=0 ;;
    --rollback) rollback=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done
if ! [[ "$tag" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
  echo "usage: $0 <image tag> [--no-pull] [--rollback]" >&2
  exit 2
fi

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

# ---- 1. images ----
if [ "$pull" -eq 1 ]; then
  dc --profile deploy pull --quiet migrate api worker web
fi

# ---- 2. database + roles (H3) ----
dc up --detach --wait --wait-timeout 180 postgres
dc exec -T postgres bash /docker-entrypoint-initdb.d/02-roles.sh >/dev/null
log "02-roles.sh applied (ottimo_app limits verified by the script)"

psql_admin() { # read-only SQL from stdin, as the superuser over the container's local socket
  dc exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'
}

# ---- 3. migrations (one-shot, before any api/worker runs the new code) ----
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

dc up --detach --wait --wait-timeout 240 --remove-orphans api worker web || fail "containers did not become healthy"

health=$(dc exec -T api wget -qO- http://127.0.0.1:3000/health) || fail "api /health"
case "$health" in *'"status":"ok"'*) ;; *) fail "api /health: $health" ;; esac

cfg=$(psql_admin <<<"SELECT array_to_string(rolconfig, ',') FROM pg_roles WHERE rolname = 'ottimo_app';")
case ",$cfg," in *,idle_in_transaction_session_timeout=30s,*) ;; *) fail "ottimo_app idle_in_transaction_session_timeout missing ($cfg)" ;; esac
case ",$cfg," in *,statement_timeout=15s,*) ;; *) fail "ottimo_app statement_timeout missing ($cfg)" ;; esac

sleep 5
[ -n "$(dc ps --status running --quiet worker)" ] || fail "worker is not running"

# Caddy, from this host (the Docker gateway is a private address, so /health is allowed). PUBLIC_HTTPS_PORT,
# SMOKE_ADDR and SMOKE_INSECURE=1 exist for a local rehearsal (Caddy's internal CA); on the VPS the real
# certificate is checked against 127.0.0.1.
port=$(envval PUBLIC_HTTPS_PORT); port="${port:-443}"
addr="${SMOKE_ADDR:-127.0.0.1}"
curl_opts=(--silent --show-error --max-time 20 --retry 6 --retry-delay 5 --retry-all-errors)
[ "${SMOKE_INSECURE:-0}" = "1" ] && curl_opts+=(--insecure)
check_site() { # host  expected Referrer-Policy
  local host="$1" referrer="$2" headers code
  headers=$(curl "${curl_opts[@]}" --resolve "$host:$port:$addr" -o /dev/null -D - "https://$host:$port/") \
    || fail "https://$host/ unreachable"
  code=$(printf '%s' "$headers" | head -n 1 | awk '{print $2}')
  [ "$code" = "200" ] || fail "https://$host/ answered $code"
  printf '%s' "$headers" | grep -qi "^content-security-policy: default-src 'self'" || fail "$host: CSP header missing"
  printf '%s' "$headers" | grep -qi "^strict-transport-security: max-age=31536000" || fail "$host: HSTS missing"
  printf '%s' "$headers" | grep -qi "^referrer-policy: $referrer" || fail "$host: Referrer-Policy is not $referrer"
  code=$(curl "${curl_opts[@]}" --resolve "$host:$port:$addr" -o /dev/null -w '%{http_code}' "https://$host:$port/health")
  [ "$code" = "200" ] || fail "$host/health through Caddy answered $code"
  # SEC C2 / FB-R2-SEC-OPS-03 (4): the blob volume is not served – such paths are a 404, never a file.
  for probe in /var/lib/ottimo/blobs/00/0000 /blobs/x /.env; do
    code=$(curl "${curl_opts[@]}" --resolve "$host:$port:$addr" -o /dev/null -w '%{http_code}' "https://$host:$port$probe")
    [ "$code" = "404" ] || fail "$host: probe $probe answered $code (expected 404)"
  done
}
check_site "$(envval DESK_HOST)" same-origin
check_site "$(envval STAFF_HOST)" same-origin
check_site "$(envval GUEST_HOST)" no-referrer

# FB-R2-SEC-OPS-03 (4) / SR-LOG-03: open a fake guest link, then the Caddy log must show /g/[redacted], never the token.
guest_host=$(envval GUEST_HOST)
fake_token="smoke$(openssl rand -hex 19)"
since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
curl "${curl_opts[@]}" --resolve "$guest_host:$port:$addr" -o /dev/null "https://$guest_host:$port/g/$fake_token?x=$fake_token" \
  || fail "guest link page unreachable"
sleep 2
web_log=$(dc logs --no-color --since "$since" web 2>&1)
if grep -qF "$fake_token" <<<"$web_log"; then fail "Caddy log contains a /g/ token (SR-LOG-03)"; fi
grep -qF '/g/[redacted]' <<<"$web_log" || fail "Caddy access log has no masked /g/ entry (logging off?)"

# ---- 5. record ----
if [ -n "$prev" ] && [ "$prev" != "$tag" ]; then echo "$prev" > "$state/previous_tag"; fi
echo "$tag" > "$state/current_tag"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $tag" >> "$state/deploy-history.log"
# Free disk: unused images older than 7 days (the previous tag can always be pulled again from the registry).
docker image prune --all --force --filter "until=168h" >/dev/null 2>&1 || true
log "OK: $tag is live"
