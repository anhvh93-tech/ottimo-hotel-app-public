#!/usr/bin/env bash
# Secondary static site on the OTTIMO VPS (infra/static – R5 16/11; runbook: infra/server/README.md section 14).
# One hardened Caddy container (project ottimo-static) behind the shared edge. Run as root (like edge.sh).
#   static-site.sh up       check .env + web root + edge route, build the image (local, pinned base), start, wait healthy
#   static-site.sh restart  same checks, restart the container (asks for the certificates again – after the DNS change)
#   static-site.sh status   container state, the edge lines for the site, size of the web root
#   static-site.sh down     stop and remove the container (volumes with the certificates are KEPT)
# Environment: STATIC_HOME (default /opt/ottimo-static: .env + site/), EDGE_HOME (default /opt/ottimo-edge, for the
# route check), STATIC_COMPOSE (default: next to this script's bundle).
# Order (README 14): the edge must route the names BEFORE the container starts – Caddy asks for its certificates at
# start and backs off after a failed ACME order (lesson of 06/11, README 12.3 step 4). `up` refuses otherwise.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
STATIC_HOME="${STATIC_HOME:-/opt/ottimo-static}"
EDGE_HOME="${EDGE_HOME:-/opt/ottimo-edge}"
STATIC_COMPOSE="${STATIC_COMPOSE:-$here/../../static/docker-compose.static.yml}"
env_file="$STATIC_HOME/.env"

log() { echo "[static $(date -u +%H:%M:%S)] $*"; logger -t ottimo-static -- "$*" 2>/dev/null || true; }
die() { log "FAIL: $*"; exit 1; }
envval() { sed -n "s/^$1=//p" "$env_file" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }
compose() { docker compose --project-name ottimo-static --env-file "$env_file" -f "$STATIC_COMPOSE" "$@"; }

# Compose and the build read the current directory (see bin/dc): start from a directory everybody can enter.
cd /

check() {
  [ -r "$env_file" ] || die "$env_file missing or unreadable (template: infra/static/env.example)"
  local host www root
  host=$(envval STATIC_HOST); www=$(envval STATIC_WWW_HOST); root=$(envval STATIC_ROOT)
  root="${root:-$STATIC_HOME/site}"
  [ -n "$host" ] && [ -n "$www" ] || die "STATIC_HOST and STATIC_WWW_HOST must both be set in $env_file"
  # Same name rule as edge.sh (SEC FB-R5-SEC-OPS-170): the names go into the Caddyfile through the environment.
  local re='^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  [[ "$host" =~ $re ]] || die "STATIC_HOST is not a host name"
  [ "$www" = "www.$host" ] || die "STATIC_WWW_HOST must be www.<STATIC_HOST>"
  [ -n "$(envval ACME_EMAIL)" ] || die "ACME_EMAIL missing in $env_file"
  [ -f "$root/index.html" ] || die "$root/index.html missing – copy the site first"
  # SEC FB-R5-SEC-OPS-166: file_server follows symlinks – one pointing into /home/caddy/data would publish the site's
  # TLS / ACME keys. The content comes from a third party: no symlink at all in the web root (copy with --no-links).
  local bad
  bad=$(find "$root" -type l | head -n 3)
  [ -z "$bad" ] || die "symlink in the web root (copy with rsync --no-links, README 14.1): $bad"
  # uid 10001 in the container reads the files: every dir must be world-readable+searchable, every file world-readable.
  bad=$(find "$root" \( -type d ! -perm -0005 \) -o \( -type f ! -perm -0004 \) | head -n 3)
  [ -z "$bad" ] || die "not readable by the container (chmod -R a+rX $root): $bad"
  for h in "$host" "$www"; do
    grep -qxF "		$h static-site:443;" "$EDGE_HOME/nginx.conf" 2>/dev/null \
      || die "the edge does not route $h yet – run edge.sh up first (README 14 step 3)"
  done
  docker network inspect ottimo-link-static >/dev/null 2>&1 || die "network ottimo-link-static missing – run edge.sh up first"
}

case "${1:-}" in
  up)
    check
    compose build --quiet static
    compose up --detach --wait --wait-timeout 90 static
    log "static site running ($(envval STATIC_HOST))" ;;
  status)
    compose ps
    grep -E '^\s+[a-z0-9.-]+ static-site:443;' "$EDGE_HOME/nginx.conf" 2>/dev/null | sed 's/^\s*//' || echo "(no static route in the edge)"
    root=$(envval STATIC_ROOT 2>/dev/null || true); du -sh "${root:-$STATIC_HOME/site}" 2>/dev/null || true ;;
  restart)
    # After the DNS change: Caddy retries a failed ACME order with growing pauses; a restart asks again at once.
    check
    compose restart static
    log "static site restarted" ;;
  down)
    compose down
    log "static site stopped (certificate volumes kept)" ;;
  *) echo "usage: $0 up|restart|status|down" >&2; exit 2 ;;
esac
