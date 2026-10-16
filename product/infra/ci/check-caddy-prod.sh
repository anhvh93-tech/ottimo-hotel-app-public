#!/usr/bin/env bash
# CI guard for infra/caddy/Caddyfile.prod (FB-R2-SEC-OPS-03 point 4, hosting-plan 9 "curl -I kiểm header trong CI").
# Starts the web image with the PRODUCTION Caddyfile on *.localhost names (Caddy's internal CA, no Internet, no api)
# and checks what SEC verifies on staging:
#   - 3 origins answer 200 with CSP (no unsafe-*, worker-src per app), HSTS, Referrer-Policy (guest no-referrer),
#     X-Frame-Options, nosniff, no Server header; guest index.html is no-store
#   - blob/dot-file/source-map probes → 404 (SEC C2); a declared body over 1 MB → 413 (ARC S3-18)
#   - the access log masks /g/<token> and drops query strings (SR-LOG-02/03, SR-GST-03)
#   check-caddy-prod.sh <web image>        e.g. ottimo-web:ci
# Exit 0 = all checks passed, 1 = a check failed, 2 = usage.
set -Eeuo pipefail

image="${1:-}"
[ -n "$image" ] || { echo "usage: $0 <web image>" >&2; exit 2; }
here=$(cd "$(dirname "$0")" && pwd)
caddyfile="$here/../caddy/Caddyfile.prod"
name="ottimo-caddy-prod-check-$$"
port="${CHECK_PORT:-18443}"
fails=0

cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$name" \
  --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  --sysctl net.ipv4.ip_unprivileged_port_start=0 \
  --tmpfs /tmp --tmpfs /home/caddy/data:uid=10001,gid=10001 --tmpfs /home/caddy/config:uid=10001,gid=10001 \
  -e DESK_HOST=desk.localhost -e STAFF_HOST=staff.localhost -e GUEST_HOST=g.localhost \
  -e ACME_EMAIL=ops@example.invalid -e HEALTH_ALLOW_IPS= -e TEST_SUPPORT_ALLOW_IPS=127.0.0.1/32 \
  -v "$caddyfile:/etc/caddy/Caddyfile:ro" \
  -p "127.0.0.1:$port:443" "$image" >/dev/null

c() { # host path [curl args…]
  local host="$1" path="$2"; shift 2
  curl --silent --insecure --max-time 10 --resolve "$host:$port:127.0.0.1" "$@" "https://$host:$port$path"
}
for _ in $(seq 1 30); do c desk.localhost / -o /dev/null && break; sleep 1; done

ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fails=$((fails + 1)); }
expect_header() { # label headers regex
  if grep -qiE "$3" <<<"$2"; then ok "$1"; else bad "$1 (no match for: $3)"; fi
}

for spec in "desk.localhost same-origin 'none' no-cache" "staff.localhost same-origin 'self' no-cache" "g.localhost no-referrer 'none' no-store"; do
  read -r host referrer worker cache <<<"$spec"
  h=$(c "$host" / -o /dev/null -D -) || { bad "$host unreachable"; continue; }
  expect_header "$host 200" "$h" "^HTTP/[0-9.]+ 200"
  expect_header "$host CSP" "$h" "^content-security-policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:;.* worker-src $worker; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
  if grep -qiE "^content-security-policy:.*unsafe-" <<<"$h"; then bad "$host CSP allows unsafe-*"; fi
  expect_header "$host HSTS" "$h" "^strict-transport-security: max-age=31536000; includeSubDomains"
  expect_header "$host Referrer-Policy $referrer" "$h" "^referrer-policy: $referrer"
  expect_header "$host X-Frame-Options" "$h" "^x-frame-options: DENY"
  expect_header "$host nosniff" "$h" "^x-content-type-options: nosniff"
  expect_header "$host Cache-Control $cache" "$h" "^cache-control: $cache"
  if grep -qi "^server:" <<<"$h"; then bad "$host sends a Server header"; else ok "$host no Server header"; fi
  for probe in /var/lib/ottimo/blobs/00/0000 /blobs/x /.env /.git/config /assets/index.js.map; do
    code=$(c "$host" "$probe" -o /dev/null -w '%{http_code}')
    [ "$code" = "404" ] && ok "$host $probe 404" || bad "$host $probe answered $code (expected 404)"
  done
  code=$(head -c 1100000 /dev/zero | c "$host" /v1/auth/login -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data-binary @-)
  [ "$code" = "413" ] && ok "$host 1.1 MB body 413" || bad "$host 1.1 MB body answered $code (expected 413)"
done

token="ciTOKEN$(openssl rand -hex 16)"
c g.localhost "/g/$token?utm=$token" -o /dev/null || true
sleep 1
logs=$(docker logs "$name" 2>&1)
if grep -qF "$token" <<<"$logs"; then bad "Caddy log contains the /g/ token"; else ok "no /g/ token in the Caddy log"; fi
grep -qF '"uri":"/g/[redacted]"' <<<"$logs" && ok "access log shows /g/[redacted]" || bad "no masked /g/ entry in the access log"
if grep -qiE '"(Cookie|Authorization)"' <<<"$logs"; then bad "request headers in the access log"; else ok "no request headers in the access log"; fi

if [ "$fails" -ne 0 ]; then
  echo "::error::Caddyfile.prod: $fails check(s) failed"
  docker logs --tail 30 "$name" 2>&1 | grep -v '"level":"info"' || true
  exit 1
fi
echo "OK: Caddyfile.prod headers, probes, body limit and log masking"
