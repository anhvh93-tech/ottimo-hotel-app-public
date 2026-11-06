#!/usr/bin/env bash
# CI guard for infra/caddy/Caddyfile.landing – the public form proxy of US-155 (SEC s1-SEC-on-us155 condition 2,
# FB-R3-SEC-US155-02) and the LP-v2 price estimate + languages (ARC lp-v2-design 2.6/3.2, SEC SR-PE-10, SR-LC-06,
# ARC FB-R4-ARC-OPS-LPV2-01). Stock caddy image, Caddy's internal CA on *.localhost, a stub "api" (Caddy answering
# with what it received) on a private Docker network. Checks, with LANDING_PUBLIC_API=on:
#   - GET  /v1/public/properties/<slug>/form-token       → proxied (stub answers), X-Forwarded-For set by Caddy
#   - POST /v1/public/properties/<slug>/booking-requests → proxied
#   - GET  /v1/public/properties/<slug>/price-estimate?… → proxied with its query; a client X-Forwarded-For is
#     replaced by the address Caddy saw (the api trusts only this container – TRUST_PROXY); query of 256 bytes ok,
#     257 bytes → 404; raw UTF-8 in the query (≤ 256 characters, > 256 bytes) → 404, the same text %-encoded is
#     proxied; POST/HEAD, a sub-path, upper-case slug → 404 – none of these reach the api
#   - POST with Content-Length > 16 KB                   → 413, nothing reaches the api
#   - POST chunked 64 KB (no Content-Length)             → 413, nothing reaches the api
#   - any other /v1/* (other operation, wrong method, bad slug, /v1/me, /v1/public/…/availability) → 404
#   - languages: /ru/, /ko/ served (no /ru block any more); 404 page of the path's language (/vi/x, /ko/x, /ru/x),
#     English 404 when the build has no 404 page for it (/zh/x here) or for an unknown prefix (/ja/x)
#   - Authorization never reaches the api (SEC FB-R4-SEC-OPS-054-01, V5-67), with both access snippets of
#     /run/secrets/landing_access: production (no restriction) – a client Basic or Bearer header on each of the three
#     operations arrives empty at the stub; staging (basic auth with a throw-away password made by this run + X-Robots-Tag)
#     – the right password passes on all three operations and the api still sees no Authorization; no or a wrong
#     password → 401 with X-Robots-Tag noindex, nothing reaches the api
# and with LANDING_PUBLIC_API unset (the default): form-token and price-estimate → 404.
# Needs Docker + curl. Exit 0 = ok, 1 = a rule is broken. CHECK_LANDING_CADDYFILE runs the checks on another file
# (only to show that a check goes red on an older Caddyfile).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
caddyfile="${CHECK_LANDING_CADDYFILE:-$here/../caddy/Caddyfile.landing}"
CADDY_IMAGE=caddy:2-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f
port="${CHECK_LANDING_PORT:-28643}"
port_off="${CHECK_LANDING_PORT_OFF:-28644}"
port_stg="${CHECK_LANDING_PORT_STG:-28645}"
net="ottimo-landing-check-$$"
work=$(mktemp -d "${TMPDIR:-/tmp}/landing-check.XXXXXX")
fails=0
ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fails=$((fails + 1)); }
cleanup() {
  docker rm -f "$net-api" "$net-on" "$net-off" "$net-stg" >/dev/null 2>&1 || true
  docker network rm "$net" >/dev/null 2>&1 || true
  rm -rf "$work"
}
[ -n "${KEEP:-}" ] || trap cleanup EXIT

mkdir -p "$work/site"
printf '<!doctype html><title>landing</title>\n' > "$work/site/index.html"
printf '<!doctype html><title>404</title>\n' > "$work/site/404.html"
# LP-v2 languages: vi, ko, ru with their own 404 page; zh without one (an older build) → English 404.
for l in vi ko zh ru; do mkdir -p "$work/site/$l"; printf '<!doctype html><title>home %s</title>\n' "$l" > "$work/site/$l/index.html"; done
for l in vi ko ru; do mkdir -p "$work/site/$l/404"; printf '<!doctype html><title>404 %s</title>\n' "$l" > "$work/site/$l/404/index.html"; done
printf '# production: no access restriction\n' > "$work/access"
# Staging snippet, same shape as init-secrets.sh writes it: a password made for this run only (never stored), its
# bcrypt hash from the same Caddy image.
stg_pw="check-$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')"
stg_hash=$(docker run --rm "$CADDY_IMAGE" caddy hash-password --plaintext "$stg_pw")
printf '# staging preview: basic auth (user ottimo) + noindex\nbasic_auth {\n\tottimo %s\n}\nheader X-Robots-Tag "noindex, nofollow"\n' \
  "$stg_hash" > "$work/access-stg"
# Stub api: tells what arrived – method, path, forwarded client, body length actually received.
cat > "$work/api.caddy" <<'EOF'
{
	admin off
}
:3000 {
	respond "api {method} {path} xff={header.X-Forwarded-For} cl={header.Content-Length} q={query} auth={header.Authorization}" 200
	log {
		output stdout
		format json
	}
}
EOF
chmod -R a+rX "$work"
docker network create "$net" >/dev/null
docker run -d --name "$net-api" --network "$net" --network-alias api -v "$work/api.caddy:/etc/caddy/Caddyfile:ro" "$CADDY_IMAGE" >/dev/null
run_landing() { # name host-port api-switch [access-snippet]
  docker run -d --name "$1" --network "$net" -e LANDING_HOST=landing.localhost -e LANDING_WWW_HOST=www.landing.localhost \
    -e ACME_EMAIL=ops@example.invalid -e LANDING_PUBLIC_API="$3" \
    -v "$caddyfile:/etc/caddy/Caddyfile:ro" -v "$work/site:/srv/landing:ro" -v "${4:-$work/access}:/run/secrets/landing_access:ro" \
    -p "127.0.0.1:$2:443" "$CADDY_IMAGE" >/dev/null
}
run_landing "$net-on" "$port" on
run_landing "$net-off" "$port_off" ''
run_landing "$net-stg" "$port_stg" on "$work/access-stg"
sleep 4

req() { # port method path [curl args…] → "<code> <body>"
  local p="$1" m="$2" path="$3"; shift 3
  curl --silent --insecure --max-time 15 --retry 5 --retry-delay 1 --retry-all-errors \
    --resolve "landing.localhost:$p:127.0.0.1" -X "$m" -o "$work/body" -w '%{http_code}' "$@" "https://landing.localhost:$p$path" \
    || true
  printf ' '; head -c 200 "$work/body" 2>/dev/null || true
}
api_hits() { docker logs "$net-api" 2>/dev/null | grep -c '"uri":"/v1/public/properties/dlt/booking-requests"' || true; }
price_hits() { docker logs "$net-api" 2>/dev/null | grep -c '"uri":"/v1/public/properties/[^"]*price-estimate' || true; }

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

# ── LP-v2 price estimate (ARC lp-v2-design 2.6, SEC SR-PE-10) ──
pq='roomType=studio&stayType=short&arrival=2026-12-01&departure=2026-12-03&adults=2&children=0&infants=0'
out=$(req "$port" GET "/v1/public/properties/dlt/price-estimate?$pq")
case "$out" in "200 api GET /v1/public/properties/dlt/price-estimate xff="[0-9]*" q=$pq"*) ok "price-estimate proxied with its query, X-Forwarded-For set" ;;
  *) bad "price-estimate: $out" ;; esac
# A guest-supplied X-Forwarded-For never reaches the api as the client address (the api keys its limits on it).
out=$(req "$port" GET "/v1/public/properties/dlt/price-estimate?$pq" -H 'X-Forwarded-For: 203.0.113.66')
case "$out" in "200 api GET /v1/public/properties/dlt/price-estimate xff="*203.0.113.66*) bad "client X-Forwarded-For passed on: $out" ;;
  "200 api GET /v1/public/properties/dlt/price-estimate xff="[0-9]*) ok "client X-Forwarded-For replaced by the address Caddy saw" ;;
  *) bad "price-estimate with X-Forwarded-For: $out" ;; esac
q256="x=$(head -c 254 /dev/zero | tr '\0' 'a')"; q257="x=$(head -c 255 /dev/zero | tr '\0' 'a')"
out=$(req "$port" GET "/v1/public/properties/dlt/price-estimate?$q256")
[ "${out%% *}" = 200 ] && ok "price-estimate query of 256 bytes → proxied" || bad "query 256 bytes → ${out:0:80}"
# Printable ASCII only (SEC FB-R4-SEC-OPS-LPV2-03): 100 × "ệ" raw = 102 characters but 302 bytes → 404; the same
# text %-encoded (what a browser sends) is plain ASCII and goes through when ≤ 256 bytes.
qutf="x=$(printf 'ệ%.0s' $(seq 1 100))"; qpct="x=$(printf '%%E1%%BB%%87%.0s' $(seq 1 20))"
out=$(req "$port" GET "/v1/public/properties/dlt/price-estimate?$qpct")
[ "${out%% *}" = 200 ] && ok "price-estimate %-encoded UTF-8 query (182 bytes) → proxied" || bad "%-encoded query → ${out:0:80}"
before=$(price_hits)
for c in "GET /v1/public/properties/dlt/price-estimate?$q257" "GET /v1/public/properties/dlt/price-estimate?$qutf" \
  "GET /v1/public/properties/dlt/price-estimate?x=%E1%BB%87&y=ệ" "POST /v1/public/properties/dlt/price-estimate" \
  "HEAD /v1/public/properties/dlt/price-estimate" "GET /v1/public/properties/dlt/price-estimate/x" \
  "GET /v1/public/properties/DLT/price-estimate" "GET /v1/public/properties/dlt/price-estimates" \
  "GET /v1/public/properties/d/price-estimate"; do
  if [ "${c%% *}" = HEAD ]; then  # a real HEAD request (curl -X HEAD would wait for a body)
    out=$(curl --silent --insecure --max-time 15 --resolve "landing.localhost:$port:127.0.0.1" --head -o /dev/null \
      -w '%{http_code}' "https://landing.localhost:$port${c#* }" || true)
  else out=$(req "$port" "${c%% *}" "${c#* }"); fi
  [ "${out%% *}" = 404 ] && ok "404: ${c:0:72}" || bad "${c:0:72} → ${out:0:80}"
done
sleep 1
[ "$(price_hits)" = "$before" ] && ok "refused price-estimate requests never reached the api" || bad "a refused price-estimate request reached the api"

# ── LP-v2 languages: /ru/ open, 404 page by language (ARC lp-v2-design 3.2, SR-LC-06) ──
for c in "/ru/ home ru" "/ko/ home ko" "/zh/ home zh" "/vi/x 404 vi" "/ko/x 404 ko" "/ru/x/y 404 ru" "/ru home ru" \
  "/zh/x 404</title>" "/ja/x 404</title>" "/x 404</title>"; do
  path=${c%% *} want=${c#* }
  out=$(req "$port" GET "$path")
  case "$want" in home*) code=200 ;; *) code=404 ;; esac
  case "$out" in "$code <!doctype html><title>$want"*) ok "$path → $code ${want%</title>} " ;; *) bad "$path → ${out:0:80} (expected $code $want)" ;; esac
done

for c in "POST /v1/public/properties/dlt/form-token" "GET /v1/public/properties/dlt/booking-requests" \
  "GET /v1/public/properties/dlt/availability" "POST /v1/public/properties/dlt/offers" "GET /v1/public/properties/DLT/form-token" \
  "GET /v1/public/properties/d/form-token" "GET /v1/me" "POST /v1/auth/login" "GET /v1/public/properties/dlt/form-token/x" \
  "GET /health"; do
  out=$(req "$port" ${c%% *} "${c#* }")
  [ "${out%% *}" = 404 ] && ok "404: $c" || bad "$c → $out"
done

# ── Authorization stays at Caddy (SEC FB-R4-SEC-OPS-054-01, V5-67), both access snippets ──
# The stub answers "… auth=<Authorization it received>", last in its body, so an empty header ends the body with "auth=".
ops3=("GET /v1/public/properties/dlt/form-token" "POST /v1/public/properties/dlt/booking-requests"
  "GET /v1/public/properties/dlt/price-estimate?$pq")
proxied_without_auth() { # label → ok when the last request got 200 from the stub and the stub saw no Authorization
  local code="$1" label="$2" body
  body=$(cat "$work/body" 2>/dev/null || true)
  case "$body" in *auth=?*) bad "$label: Authorization reached the api" ;;
    "api "*" auth=") [ "$code" = 200 ] && ok "$label: proxied, api saw no Authorization" || bad "$label → $code" ;;
    *) bad "$label → $code ${body:0:80}" ;; esac
}
for c in "${ops3[@]}"; do
  m=${c%% *} path=${c#* }
  extra=(); [ "$m" = POST ] && extra=(-H 'Content-Type: application/json' --data '{"a":1}')
  for h in 'Basic b3R0aW1vOmNsaWVudC1zZW50' 'Bearer client-sent-token'; do
    out=$(req "$port" "$m" "$path" -H "Authorization: $h" ${extra[@]+"${extra[@]}"})
    proxied_without_auth "${out%% *}" "production snippet, client ${h%% *} header, $m ${path%%\?*}"
  done
  out=$(req "$port_stg" "$m" "$path" -u "ottimo:$stg_pw" ${extra[@]+"${extra[@]}"})
  proxied_without_auth "${out%% *}" "staging snippet, right preview password, $m ${path%%\?*}"
done
before_auth=$(docker logs "$net-api" 2>/dev/null | grep -c '"uri":"/v1/' || true)
for c in "${ops3[@]}"; do
  m=${c%% *} path=${c#* }
  extra=(); [ "$m" = POST ] && extra=(-H 'Content-Type: application/json' --data '{"a":1}')
  for who in none wrong; do
    creds=(); [ "$who" = wrong ] && creds=(-u "ottimo:not-$stg_pw")
    out=$(req "$port_stg" "$m" "$path" -D "$work/hdr" ${creds[@]+"${creds[@]}"} ${extra[@]+"${extra[@]}"})
    if [ "${out%% *}" = 401 ] && grep -qi '^x-robots-tag:.*noindex' "$work/hdr"; then
      ok "staging snippet, $who password, $m ${path%%\?*} → 401 with X-Robots-Tag noindex"
    else bad "staging snippet, $who password, $m ${path%%\?*} → ${out:0:80}"; fi
  done
done
sleep 1
[ "$(docker logs "$net-api" 2>/dev/null | grep -c '"uri":"/v1/' || true)" = "$before_auth" ] \
  && ok "staging requests without the preview password never reached the api" || bad "a 401 staging request reached the api"

out=$(req "$port_off" GET /v1/public/properties/dlt/form-token)
[ "${out%% *}" = 404 ] && ok "LANDING_PUBLIC_API unset → form-token 404 (proxy off by default)" || bad "proxy off: $out"
out=$(req "$port_off" GET "/v1/public/properties/dlt/price-estimate?$pq")
[ "${out%% *}" = 404 ] && ok "LANDING_PUBLIC_API unset → price-estimate 404" || bad "proxy off, price-estimate: $out"

if [ "$fails" -gt 0 ]; then echo "::error::Caddyfile.landing: $fails check(s) failed"; exit 1; fi
echo "OK: Caddyfile.landing – only the three public operations reach the api (form ≤ 16 KB, price GET ≤ 256-byte query, no Authorization header), 404 by language, everything else 404"
