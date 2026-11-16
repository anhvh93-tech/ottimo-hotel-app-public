#!/usr/bin/env bash
# Shared edge of the VPS (infra/edge/docker-compose.edge.yml – R3 v1.0, v1-production.md 2): one nginx owns 80/443
# and routes by host name to the stacks (staging /opt/ottimo, production /opt/ottimo-prod) that run with
# EDGE_MODE=edge. Run as root or the deploy user (member of `docker`).
#   edge.sh render      write $EDGE_HOME/nginx.conf from the stacks' .env (host names only) and check it (nginx -t)
#   edge.sh up          create the link networks, move edge-mode stacks off 80/443 (recreate their web), start edge
#   edge.sh plan        render into $EDGE_HOME/nginx.conf.plan (nginx -t) and print the diff with the nginx.conf in
#                       use – changes nothing the edge reads (check before `up`, e.g. that the OTTIMO lines do not move)
#   edge.sh status      container state + the routing table in use
# Environment: EDGE_HOME (default /opt/ottimo-edge), EDGE_STACKS (default "/opt/ottimo /opt/ottimo-prod" – homes
# whose .env has EDGE_MODE=edge are routed, the others ignored), EDGE_COMPOSE (default: next to this script's bundle).
# Host names are validated (lower-case DNS names only) and must be unique across stacks – nothing else from the .env
# reaches nginx.conf.
# Secondary static site (infra/static – a small static site of another business on the same VPS, R5 16/11): routed
# only when $EDGE_STATIC_HOME/.env (default /opt/ottimo-static/.env) sets STATIC_HOST and STATIC_WWW_HOST (both or
# none). The two names go to static-site:443 / :80 on the network ottimo-link-static (edge 172.31.3.2, overlay
# infra/edge/docker-compose.edge-static.yml). Its lines come AFTER the OTTIMO lines: without a static site the
# rendered file is byte-identical to the one before this feature (infra/ci/test-edge.sh, golden file).
# The names are read from that file, not from a variable of the shell running edge.sh: a later `sudo edge.sh up` for
# an OTTIMO change cannot drop the static route by forgetting a variable (sudo resets the environment anyway).
# Limits (FB-R3-SEC-OPS-01 – the edge is the single entry of every stack, one client must not starve the others):
#   EDGE_CONN_PER_IP   (default 100) simultaneous connections per client address on 443 – a hotel NAT with ~15 staff
#                      devices (HTTP/2: one connection per site + SSE) and guest phones stays far below it
#   EDGE_CONN_PER_IP_HTTP (default 20) on port 80 (redirects / ACME only)
#   worker_processes auto (= vCPUs), worker_connections 8192, nofile 32768; TLS preread (SNI) must arrive in 5 s,
#   HTTP headers in 10 s.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
EDGE_HOME="${EDGE_HOME:-/opt/ottimo-edge}"
EDGE_STACKS="${EDGE_STACKS:-/opt/ottimo /opt/ottimo-prod}"
EDGE_COMPOSE="${EDGE_COMPOSE:-$here/../../edge/docker-compose.edge.yml}"
EDGE_CONN_PER_IP="${EDGE_CONN_PER_IP:-100}"
EDGE_CONN_PER_IP_HTTP="${EDGE_CONN_PER_IP_HTTP:-20}"
EDGE_STATIC_HOME="${EDGE_STATIC_HOME:-/opt/ottimo-static}"
EDGE_STATIC_COMPOSE="${EDGE_STATIC_COMPOSE:-$(dirname "$EDGE_COMPOSE")/docker-compose.edge-static.yml}"
for v in EDGE_CONN_PER_IP EDGE_CONN_PER_IP_HTTP; do
  [[ "${!v}" =~ ^[1-9][0-9]{0,3}$ ]] || { echo "$v must be a number 1..9999" >&2; exit 2; }
done
NGINX_IMAGE=$(sed -n 's/^ *image: *\(nginx:[^ ]*\)$/\1/p' "$EDGE_COMPOSE" | head -n 1)
conf="$EDGE_HOME/nginx.conf"

log() { echo "[edge $(date -u +%H:%M:%S)] $*"; logger -t ottimo-edge -- "$*" 2>/dev/null || true; }
die() { log "FAIL: $*"; exit 1; }
envval() { # file key
  sed -n "s/^$2=//p" "$1" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'
}
# name → subnet / edge address (fixed: PROXY_PROTOCOL_ALLOW of each stack names the edge address)
subnet_of() { case "$1" in staging) echo 172.31.1.0/24 ;; production) echo 172.31.2.0/24 ;; static) echo 172.31.3.0/24 ;; *) return 1 ;; esac; }
# Containers joining the link network get addresses from the upper half only, so the edge's fixed .2 is never taken.
range_of() { case "$1" in staging) echo 172.31.1.128/25 ;; production) echo 172.31.2.128/25 ;; static) echo 172.31.3.128/25 ;; *) return 1 ;; esac; }
edge_ip_of() { case "$1" in staging) echo 172.31.1.2 ;; production) echo 172.31.2.2 ;; *) return 1 ;; esac; }

stacks=()   # "home|edge_name"
collect() {
  local home f mode name
  for home in $EDGE_STACKS; do
    f="$home/.env"
    [ -r "$f" ] || continue
    mode=$(envval "$f" EDGE_MODE)
    [ "$mode" = "edge" ] || continue
    name=$(envval "$f" EDGE_NAME)
    subnet_of "$name" >/dev/null || die "$f: EDGE_NAME must be staging or production (found '${name}')"
    [ "$(envval "$f" PROXY_PROTOCOL_ALLOW)" = "$(edge_ip_of "$name")/32" ] \
      || die "$f: PROXY_PROTOCOL_ALLOW must be $(edge_ip_of "$name")/32 (the edge address on ottimo-link-$name)"
    stacks+=("$home|$name")
  done
  [ "${#stacks[@]}" -gt 0 ] || die "no stack with EDGE_MODE=edge in: $EDGE_STACKS"
}

# Secondary static site: sets the array static_hosts (empty = none) to exactly (apex, www.apex). A .env that exists
# but cannot be read stops the render (the new nginx.conf would silently lose the site's route). Each value is checked
# on its own, quoted (SEC FB-R5-SEC-OPS-167: "a.test b.test" is refused, never split into two names, no glob).
static_hosts=()
collect_static() {
  local f="$EDGE_STATIC_HOME/.env" host www
  static_hosts=()
  [ -e "$f" ] || return 0
  [ -r "$f" ] || die "$f exists but cannot be read (run as root)"
  host=$(envval "$f" STATIC_HOST)
  www=$(envval "$f" STATIC_WWW_HOST)
  [ -n "$host$www" ] || return 0
  { [ -n "$host" ] && [ -n "$www" ]; } || die "$f: STATIC_HOST and STATIC_WWW_HOST go together (both set or both empty)"
  valid_host "$host" || die "$f: STATIC_HOST is not a host name"
  valid_host "$www" || die "$f: STATIC_WWW_HOST is not a host name"
  [ "$www" = "www.$host" ] || die "$f: STATIC_WWW_HOST must be www.<STATIC_HOST>"
  static_hosts=("$host" "$www")
}

# SEC FB-R5-SEC-OPS-168: a static name may not be, or end in, an OTTIMO domain: ottimo.vn (hard-coded, also covers
# names no stack routes yet) or the apex of any loaded stack's DESK_HOST / LANDING_HOST (a leading "www." dropped).
OTTIMO_APEX=ottimo.vn
static_name_owned() { # name apex...
  local n="$1" a
  shift
  for a in "$OTTIMO_APEX" "$@"; do
    [ "$n" = "$a" ] && return 0
    case "$n" in *".$a") return 0 ;; esac
  done
  return 1
}

valid_host() { [[ "$1" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; }

render() { # [output file] (default: $conf, the file the edge uses)
  local out="${1:-$conf}"
  collect
  collect_static
  local tls="" http="" seen=" " entry home name f key host target apexes=()
  for entry in "${stacks[@]}"; do
    home=${entry%%|*}; name=${entry##*|}; f="$home/.env"
    for key in DESK_HOST STAFF_HOST GUEST_HOST LANDING_HOST LANDING_WWW_HOST; do
      host=$(envval "$f" "$key")
      [ -n "$host" ] || continue
      valid_host "$host" || die "$f: $key is not a host name"
      case "$seen" in *" $host "*) die "$host is configured twice (each host belongs to one stack)" ;; esac
      seen+="$host "
      case "$key" in DESK_HOST | LANDING_HOST) apexes+=("${host#www.}") ;; esac
      case "$key" in LANDING_*) target="$name-landing" ;; *) target="$name-web" ;; esac
      tls+="		$host $target:443;"$'\n'
      http+="		$host $target;"$'\n'
    done
  done
  for host in ${static_hosts[@]+"${static_hosts[@]}"}; do
    valid_host "$host" || die "$EDGE_STATIC_HOME/.env: '$host' is not a host name"
    if static_name_owned "$host" ${apexes[@]+"${apexes[@]}"}; then
      die "$EDGE_STATIC_HOME/.env: $host belongs to an OTTIMO domain – a static site may not take it"
    fi
    case "$seen" in *" $host "*) die "$host is configured twice (each host belongs to one stack or to the static site)" ;; esac
    seen+="$host "
    tls+="		$host static-site:443;"$'\n'
    http+="		$host static-site;"$'\n'
  done
  install -d -m 0755 "$EDGE_HOME"
  umask 022
  cat > "$out.new" <<EOF
# GENERATED by infra/server/bin/edge.sh render – do not edit (source: EDGE_MODE=edge stacks in $EDGE_STACKS).
worker_processes auto;
worker_rlimit_nofile 32768;
pid /tmp/nginx.pid;
# crit only: connection errors would log full client addresses (the stacks' Caddy logs are masked /24 – SR-LOG-02).
error_log /dev/stderr crit;
# Each proxied connection uses two (client + upstream).
events { worker_connections 8192; }

stream {
	resolver 127.0.0.11 valid=10s ipv6=off;
	# One client address may not hold more than EDGE_CONN_PER_IP connections (slow / idle connection floods).
	limit_conn_zone \$binary_remote_addr zone=ottimo_tls_perip:10m;
	limit_conn ottimo_tls_perip $EDGE_CONN_PER_IP;
	map \$ssl_preread_server_name \$ottimo_tls_backend {
		hostnames;
$tls		default 127.0.0.1:9;
	}
	server {
		listen 443;
		ssl_preread on;
		# The TLS ClientHello (SNI) must arrive within 5 s, or the connection is closed.
		preread_timeout 5s;
		proxy_pass \$ottimo_tls_backend;
		proxy_protocol on;
		proxy_connect_timeout 5s;
		# SSE (notifications) keeps a connection open; the api sends a heartbeat well inside this.
		proxy_timeout 1h;
	}
}

http {
	access_log off;
	server_tokens off;
	client_body_temp_path /tmp/client_body;
	proxy_temp_path /tmp/proxy;
	fastcgi_temp_path /tmp/fastcgi;
	uwsgi_temp_path /tmp/uwsgi;
	scgi_temp_path /tmp/scgi;
	resolver 127.0.0.11 valid=10s ipv6=off;
	limit_conn_zone \$binary_remote_addr zone=ottimo_http_perip:5m;
	limit_conn ottimo_http_perip $EDGE_CONN_PER_IP_HTTP;
	limit_conn_status 429;
	client_header_timeout 10s;
	client_body_timeout 10s;
	send_timeout 10s;
	keepalive_timeout 15s;
	map \$host \$ottimo_http_backend {
		hostnames;
$http		default "";
	}
	server {
		listen 80 default_server;
		client_max_body_size 1k;
		location / {
			if (\$ottimo_http_backend = "") { return 404; }
			proxy_pass http://\$ottimo_http_backend:80;
			proxy_set_header Host \$host;
			proxy_connect_timeout 5s;
		}
	}
}
EOF
  # Syntax check with the same image (resolver/upstreams are looked up at request time, so stacks may be down).
  if ! docker run --rm --network none -u 101:101 --read-only --tmpfs /tmp --entrypoint nginx \
    -v "$out.new:/etc/ottimo-edge/nginx.conf:ro" "$NGINX_IMAGE" -t -q -c /etc/ottimo-edge/nginx.conf; then
    rm -f "$out.new"; die "generated nginx.conf does not pass nginx -t"
  fi
  mv "$out.new" "$out"
  log "$(basename "$out") rendered: $(grep -c ':443;' "$out") host(s) for ${#stacks[@]} stack(s)$([ "${#static_hosts[@]}" -eq 0 ] || echo ' + static site')"
}

networks() {
  local n list="staging production"
  [ "${#static_hosts[@]}" -eq 0 ] || list+=" static"
  for n in $list; do
    docker network inspect "ottimo-link-$n" >/dev/null 2>&1 \
      || docker network create --driver bridge --subnet "$(subnet_of "$n")" --ip-range "$(range_of "$n")" "ottimo-link-$n" >/dev/null
  done
}

compose() {
  local files=(-f "$EDGE_COMPOSE")
  # The static overlay follows the rendered file in use (not the .env), so `status` and `up` match what nginx routes.
  if [ -r "$conf" ] && grep -qE '^\s+[a-z0-9.-]+ static-site:443;$' "$conf"; then files+=(-f "$EDGE_STATIC_COMPOSE"); fi
  EDGE_CONF="$conf" docker compose --project-name ottimo-edge "${files[@]}" "$@"
}

up() {
  render
  networks
  local entry home cid
  # A stack still in direct mode publishes 80/443 itself: recreate its web with the edge-link overlay (bin/dc adds it
  # because the .env now says EDGE_MODE=edge) – a few seconds without that stack's site.
  for entry in "${stacks[@]}"; do
    home=${entry%%|*}
    cid=$(OTTIMO_HOME="$home" "$here/dc" ps -q web 2>/dev/null || true)
    if [ -n "$cid" ] && [ -n "$(docker port "$cid" 2>/dev/null)" ]; then
      log "moving $home web behind the edge"
      OTTIMO_HOME="$home" "$here/dc" up --detach --no-deps web
    fi
  done
  # The config is a bind-mounted file replaced by mv (new inode): recreate, not reload (≈ 1–2 s for every site).
  compose up --detach --wait --wait-timeout 60 --force-recreate edge
  log "edge running"
  [ "${#static_hosts[@]}" -eq 0 ] || log "static site routed: start it now if it is not running – infra/server/bin/static-site.sh up"
}

plan() {
  render "$EDGE_HOME/nginx.conf.plan"
  if [ -r "$conf" ] && diff -u "$conf" "$EDGE_HOME/nginx.conf.plan"; then log "plan: no change to $conf"; fi
  return 0
}

case "${1:-}" in
  render) render ;;
  plan) plan ;;
  up) up ;;
  status)
    compose ps
    [ -r "$conf" ] && grep -E '^\s+[a-z0-9.-]+ [a-z-]+:443;' "$conf" | sed 's/^\s*//' || true ;;
  *) echo "usage: $0 render|plan|up|status" >&2; exit 2 ;;
esac
