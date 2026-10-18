#!/usr/bin/env bash
# CI guard for infra/caddy/Caddyfile.prod (FB-R2-SEC-OPS-03 point 4, hosting-plan 9 "curl -I kiểm header trong CI";
# tightened after the blocker verification of 17/10 – every case below can fail).
# Starts the web image with the PRODUCTION Caddyfile on *.localhost names (Caddy's internal CA, no Internet, no api)
# and checks what SEC verifies on staging:
#   - 3 origins: every security header compared EXACTLY with the oracle infra/caddy/expected-headers.sh (one header
#     line, whole value: CSP directive list, Referrer-Policy no-referrer for guest-web, HSTS, …), no Server/Via
#   - probes against REAL files bind-mounted into the bundle (so a 404 proves the Caddy rule, not a missing file):
#     source map, dot-file, blob-volume-looking paths → 404, while a control .js/.txt next to them → 200 (SEC C2)
#   - a declared body over 1 MB → 413 (ARC S3-18)
#   - real image only: the staff PWA's manifest.webmanifest and sw.js are served as themselves (UXR P-24)
#   - logs (access log, HTTP→HTTPS redirect on port 80, error log of a failed proxy) never contain a /g/ token, a
#     query value or a request header value – the probe requests carry Cookie, Authorization, X-CSRF-Token,
#     X-Test-Token and Referer with marker values (SR-LOG-02/03, SR-GST-03)
#   check-caddy-prod.sh <web image>        e.g. ottimo-web:ci – the real bundle, hardened like production
#   check-caddy-prod.sh --stub             pinned caddy base image + stub index.html (no app build needed: runs in the
#                                          infra-scripts job even when build-test is red)
#   CADDYFILE=<path> check-caddy-prod.sh … (mutation tests of the guard itself)
# Exit 0 = all checks passed, 1 = a check failed, 2 = usage.
set -Eeuo pipefail

image="${1:-}"
[ -n "$image" ] || { echo "usage: $0 <web image> | --stub" >&2; exit 2; }
stub=0
if [ "$image" = "--stub" ]; then
  stub=1
  # Same base as infra/docker/Dockerfile.web (keep the digest in step – Dependabot updates both).
  image="caddy:2-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f"
fi
here=$(cd "$(dirname "$0")" && pwd)
caddyfile="${CADDYFILE:-$here/../caddy/Caddyfile.prod}"
caddyfile=$(cd "$(dirname "$caddyfile")" && pwd)/$(basename "$caddyfile")
# shellcheck source=../caddy/expected-headers.sh
. "$here/../caddy/expected-headers.sh"
name="ottimo-caddy-prod-check-$$"
port="${CHECK_PORT:-18443}"
http_port="${CHECK_HTTP_PORT:-18080}"
fails=0
probe_dir=$(mktemp -d "${TMPDIR:-/tmp}/caddy-probe.XXXXXX")

cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$probe_dir"; }
trap cleanup EXIT

# Real files placed where the probes point (read-only bind mounts into each SPA root).
printf 'probe-control\n' > "$probe_dir/control.txt"
printf '/* probe */\n' > "$probe_dir/control.js"
printf '{"version":3,"sources":["SECRET-SOURCE"],"mappings":""}\n' > "$probe_dir/probe.js.map"
printf 'SECRET=probe\n' > "$probe_dir/dotfile"
printf 'ciphertext-probe\n' > "$probe_dir/blob"
head -c 1100000 /dev/zero | tr '\0' 'a' > "$probe_dir/big.json"
chmod 0644 "$probe_dir"/*
printf '<!doctype html><title>stub</title>\n' > "$probe_dir/index.html"
mounts=()
for app in admin-web mobile guest-web; do
  [ "$stub" -eq 1 ] && mounts+=(-v "$probe_dir/index.html:/srv/$app/index.html:ro")
  mounts+=(-v "$probe_dir/control.txt:/srv/$app/zz-probe.txt:ro"
    -v "$probe_dir/control.js:/srv/$app/assets/zz-probe.js:ro"
    -v "$probe_dir/probe.js.map:/srv/$app/assets/zz-probe.js.map:ro"
    -v "$probe_dir/dotfile:/srv/$app/.zz-probe:ro"
    -v "$probe_dir/blob:/srv/$app/var/lib/ottimo/blobs/00/0000:ro"
    -v "$probe_dir/blob:/srv/$app/blobs/x:ro")
done

if [ "$stub" -eq 1 ]; then
  # The stock image keeps cap_net_bind_service on the binary, which cannot exec under cap_drop ALL: run it plainly
  # (this mode tests the Caddyfile rules, not the container hardening – the real-image mode does both).
  run_opts=(--tmpfs /data --tmpfs /config)
else
  # shellcheck disable=SC2054 # commas belong to the --tmpfs options, not to the array
  run_opts=(--read-only --cap-drop ALL --security-opt no-new-privileges:true
    --sysctl net.ipv4.ip_unprivileged_port_start=0
    --tmpfs /tmp --tmpfs /home/caddy/data:uid=10001,gid=10001 --tmpfs /home/caddy/config:uid=10001,gid=10001)
fi
docker run -d --name "$name" "${run_opts[@]}" \
  -e DESK_HOST=desk.localhost -e STAFF_HOST=staff.localhost -e GUEST_HOST=g.localhost \
  -e ACME_EMAIL=ops@example.invalid -e HEALTH_ALLOW_IPS= -e TEST_SUPPORT_ALLOW_IPS=127.0.0.1/32 \
  -v "$caddyfile:/etc/caddy/Caddyfile:ro" "${mounts[@]}" \
  -p "127.0.0.1:$port:443" -p "127.0.0.1:$http_port:80" "$image" >/dev/null

# Marker values in every header that must never reach a log.
m_cookie="ckMARK$(openssl rand -hex 8)"
m_auth="azMARK$(openssl rand -hex 8)"
m_csrf="csMARK$(openssl rand -hex 8)"
m_test="ttMARK$(openssl rand -hex 8)"
m_ref="rfMARK$(openssl rand -hex 8)"
c() { # host path [curl args…] – HTTPS, with the marker headers
  local host="$1" path="$2"; shift 2
  curl --silent --insecure --max-time 10 --resolve "$host:$port:127.0.0.1" \
    -H "Cookie: __Host-ottimo_sid=$m_cookie; __Host-ottimo_gsid=$m_cookie" -H "Authorization: Bearer $m_auth" \
    -H "X-CSRF-Token: $m_csrf" -H "X-Test-Token: $m_test" -H "Referer: https://evil.example/$m_ref" \
    "$@" "https://$host:$port$path"
}
for _ in $(seq 1 30); do c desk.localhost / -o /dev/null && break; sleep 1; done

ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fails=$((fails + 1)); }
expect_code() { # label expected host path [curl args]
  local label="$1" want="$2" host="$3" path="$4" code; shift 4
  code=$(c "$host" "$path" -o /dev/null -w '%{http_code}' "$@")
  [ "$code" = "$want" ] && ok "$label $code" || bad "$label answered $code (expected $want)"
}

for spec in "desk.localhost desk" "staff.localhost staff" "g.localhost guest"; do
  read -r host site <<<"$spec"
  h=$(c "$host" / -o /dev/null -D -) || { bad "$host unreachable"; continue; }
  [ "$(tr -d '\r' <<<"$h" | head -n 1 | awk '{print $2}')" = "200" ] && ok "$host / 200" || bad "$host / not 200"
  problems=$(ottimo_check_security_headers "$h" "$site")
  if [ -n "$problems" ]; then while IFS= read -r p; do bad "${p#FAIL }"; done <<<"$problems"
  else ok "$host security headers exactly as expected-headers.sh"; fi
  # control files: the bundle really serves files at those places …
  expect_code "$host /zz-probe.txt (control)" 200 "$host" /zz-probe.txt
  expect_code "$host /assets/zz-probe.js (control)" 200 "$host" /assets/zz-probe.js
  # … so these 404 come from the Caddy rules, not from a missing file
  expect_code "$host real source map" 404 "$host" /assets/zz-probe.js.map
  expect_code "$host real dot-file" 404 "$host" /.zz-probe
  expect_code "$host real file at /var/lib/ottimo/blobs/…" 404 "$host" /var/lib/ottimo/blobs/00/0000
  expect_code "$host real file at /blobs/x" 404 "$host" /blobs/x
  expect_code "$host 1.1 MB declared body" 413 "$host" /v1/auth/login -X POST -H 'Content-Type: application/json' \
    --data-binary "@$probe_dir/big.json"
done

# Real image only: the PWA files are served as themselves, not the index.html fallback (UXR P-24 – files the Caddy
# user cannot read fell through try_files to index.html, so the PWA could not install).
if [ "$stub" -eq 0 ]; then
  for spec in "/manifest.webmanifest application/manifest+json" "/sw.js text/javascript"; do
    read -r path want <<<"$spec"
    got=$(c staff.localhost "$path" -o /dev/null -w '%{http_code} %{content_type}')
    case "$got" in
      "200 $want"*) ok "staff.localhost $path 200 $want" ;;
      *) bad "staff.localhost $path answered '$got' (expected 200 $want – unreadable file served as index.html?)" ;;
    esac
  done
fi

token="ciTOKEN$(openssl rand -hex 16)"
qmark="qMARK$(openssl rand -hex 8)"
hmark="hdrprobe-$(openssl rand -hex 6)"
c g.localhost "/g/$token?utm=$qmark" -o /dev/null || true
c desk.localhost "/$hmark?secret=$qmark" -o /dev/null || true
# error log path: /v1 → api:3000 does not exist here → reverse_proxy error logs the request (default logger filter)
c desk.localhost "/v1/probe?secret=$qmark" -o /dev/null || true
# port 80: HTTP→HTTPS redirect server
r=$(curl --silent --max-time 10 --resolve "g.localhost:$http_port:127.0.0.1" -o /dev/null -D - \
  -H "Cookie: __Host-ottimo_gsid=$m_cookie" "http://g.localhost:$http_port/g/$token?utm=$qmark" | tr -d '\r')
[ "$(head -n 1 <<<"$r" | awk '{print $2}')" = "308" ] && ok "port 80 /g/<token> → 308" || bad "port 80 /g/<token> did not redirect"
grep -qi '^location: https://g.localhost/' <<<"$r" && ok "port 80 redirects to https" || bad "port 80 redirect target"
sleep 1
logs=$(docker logs "$name" 2>&1)
grep -qF "/$hmark" <<<"$logs" && ok "access log is on (probe request logged)" || bad "probe request not in the access log – logging off?"
grep -qF '"uri":"/g/[redacted]"' <<<"$logs" && ok "access log shows /g/[redacted]" || bad "no masked /g/ entry in the access log"
grep -qF '"uri":"/v1/probe?[q]"' <<<"$logs" && ok "proxy error log masks the query" || bad "no masked /v1/probe entry (error log filter)"
leaks=0
for v in "$token" "$qmark" "$m_cookie" "$m_auth" "$m_csrf" "$m_test" "$m_ref"; do
  if grep -qF "$v" <<<"$logs"; then bad "Caddy log contains a marker value (${v:0:7}…)"; leaks=1; fi
done
[ "$leaks" -eq 0 ] && ok "no token, query value or header value in any Caddy log line"

if [ "$fails" -ne 0 ]; then
  echo "::error::Caddyfile.prod: $fails check(s) failed"
  exit 1
fi
echo "OK: Caddyfile.prod headers, probes, body limit and log masking"
