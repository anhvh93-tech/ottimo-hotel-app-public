#!/usr/bin/env bash
# CI guard for infra/caddy/Caddyfile.landing – the public form proxy of US-155 (SEC s1-SEC-on-us155 condition 2,
# FB-R3-SEC-US155-02). Stock caddy image, Caddy's internal CA on *.localhost, a stub "api" (Caddy answering with what
# it received) on a private Docker network. Checks, with LANDING_PUBLIC_API=on:
#   - GET  /v1/public/properties/<slug>/form-token       → proxied (stub answers), X-Forwarded-For set by Caddy
#   - POST /v1/public/properties/<slug>/booking-requests → proxied
#   - POST with Content-Length > 16 KB                   → 413, nothing reaches the api
#   - POST chunked 64 KB (no Content-Length)             → 413, nothing reaches the api
#   - any other /v1/* (other operation, wrong method, bad slug, /v1/me, /v1/public/…/availability) → 404
# and with LANDING_PUBLIC_API unset (the default): form-token → 404.
# Needs Docker + curl. Exit 0 = ok, 1 = a rule is broken.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
caddyfile="$here/../caddy/Caddyfile.landing"
CADDY_IMAGE=caddy:2-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f
port="${CHECK_LANDING_PORT:-28643}"
port_off="${CHECK_LANDING_PORT_OFF:-28644}"
net="ottimo-landing-check-$$"
work=$(mktemp -d "${TMPDIR:-/tmp}/landing-check.XXXXXX")
fails=0
ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fails=$((fails + 1)); }
cleanup() {
  docker rm -f "$net-api" "$net-on" "$net-off" >/dev/null 2>&1 || true
  docker network rm "$net" >/dev/null 2>&1 || true
  rm -rf "$work"
}
[ -n "${KEEP:-}" ] || trap cleanup EXIT

mkdir -p "$work/site"
printf '<!doctype html><title>landing</title>\n' > "$work/site/index.html"
printf '<!doctype html><title>404</title>\n' > "$work/site/404.html"
printf '# production: no access restriction\n' > "$work/access"
# Stub api: tells what arrived – method, path, forwarded client, body length actually received.
cat > "$work/api.caddy" <<'EOF'
{
	admin off
}
:3000 {
	respond "api {method} {path} xff={header.X-Forwarded-For} cl={header.Content-Length}" 200
	log {
		output stdout
		format json
	}
}
EOF
chmod -R a+rX "$work"
docker network create "$net" >/dev/null
docker run -d --name "$net-api" --network "$net" --network-alias api -v "$work/api.caddy:/etc/caddy/Caddyfile:ro" "$CADDY_IMAGE" >/dev/null
run_landing() { # name host-port api-switch
  docker run -d --name "$1" --network "$net" -e LANDING_HOST=landing.localhost -e LANDING_WWW_HOST=www.landing.localhost \
    -e ACME_EMAIL=ops@example.invalid -e LANDING_PUBLIC_API="$3" \
    -v "$caddyfile:/etc/caddy/Caddyfile:ro" -v "$work/site:/srv/landing:ro" -v "$work/access:/run/secrets/landing_access:ro" \
    -p "127.0.0.1:$2:443" "$CADDY_IMAGE" >/dev/null
}
run_landing "$net-on" "$port" on
run_landing "$net-off" "$port_off" ''
sleep 4

req() { # port method path [curl args…] → "<code> <body>"
  local p="$1" m="$2" path="$3"; shift 3
  curl --silent --insecure --max-time 15 --retry 5 --retry-delay 1 --retry-all-errors \
    --resolve "landing.localhost:$p:127.0.0.1" -X "$m" -o "$work/body" -w '%{http_code}' "$@" "https://landing.localhost:$p$path" \
    || true
  printf ' '; head -c 200 "$work/body" 2>/dev/null || true
}
api_hits() { docker logs "$net-api" 2>/dev/null | grep -c '"uri":"/v1/public/properties/dlt/booking-requests"' || true; }

out=$(req "$port" GET /v1/public/properties/dlt/form-token)
case "$out" in "200 api GET /v1/public/properties/dlt/form-token xff="[0-9]*) ok "form-token proxied, X-Forwarded-For set ($out)" ;;
  *) bad "form-token: $out" ;; esac
out=$(req "$port" POST /v1/public/properties/dlt/booking-requests -H 'Content-Type: application/json' --data '{"a":1}')
case "$out" in "200 api POST /v1/public/properties/dlt/booking-requests"*) ok "booking-requests proxied" ;; *) bad "booking-requests: $out" ;; esac

before=$(api_hits)
head -c 20000 /dev/zero | tr '\0' 'a' > "$work/20k"
out=$(req "$port" POST /v1/public/properties/dlt/booking-requests -H 'Content-Type: application/json' --data-binary "@$work/20k")
[ "${out%% *}" = 413 ] && ok "declared 20 KB body → 413" || bad "declared 20 KB body → $out"
head -c 65536 /dev/zero | tr '\0' 'a' > "$work/64k"
out=$(req "$port" POST /v1/public/properties/dlt/booking-requests -H 'Content-Type: application/json' \
  -H 'Transfer-Encoding: chunked' --data-binary "@$work/64k")
[ "${out%% *}" = 413 ] && ok "chunked 64 KB body → 413" || bad "chunked 64 KB body → $out"
sleep 1
after=$(api_hits)
[ "$before" = "$after" ] && ok "oversized bodies never reached the api" || bad "an oversized body reached the api ($before → $after)"

for c in "POST /v1/public/properties/dlt/form-token" "GET /v1/public/properties/dlt/booking-requests" \
  "GET /v1/public/properties/dlt/availability" "POST /v1/public/properties/dlt/offers" "GET /v1/public/properties/DLT/form-token" \
  "GET /v1/public/properties/d/form-token" "GET /v1/me" "POST /v1/auth/login" "GET /v1/public/properties/dlt/form-token/x" \
  "GET /health"; do
  out=$(req "$port" ${c%% *} "${c#* }")
  [ "${out%% *}" = 404 ] && ok "404: $c" || bad "$c → $out"
done

out=$(req "$port_off" GET /v1/public/properties/dlt/form-token)
[ "${out%% *}" = 404 ] && ok "LANDING_PUBLIC_API unset → form-token 404 (proxy off by default)" || bad "proxy off: $out"

if [ "$fails" -gt 0 ]; then echo "::error::Caddyfile.landing: $fails check(s) failed"; exit 1; fi
echo "OK: Caddyfile.landing – only the two public form operations reach the api, ≤ 16 KB, everything else 404"
