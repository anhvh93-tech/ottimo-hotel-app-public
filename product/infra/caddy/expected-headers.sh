# shellcheck shell=bash
# Test oracle for the security headers of infra/caddy/Caddyfile.prod – sourced by infra/ci/check-caddy-prod.sh (every
# PR) and infra/server/bin/deploy.sh (every deploy). Deliberately a SECOND copy of the policy: whoever loosens
# Caddyfile.prod must also change this file, in the same review (FB-R2-SEC-OPS-03, blocker verification 17/10).
# Values are compared EXACTLY (whole header value, one header line), not by prefix or regex.

# CSP of the three SPAs (SR-HDR-01, SEC G5). $1 = worker-src: 'none' (admin-web, guest-web – ĐK-3), 'self' (staff PWA)
ottimo_expected_csp() {
  printf '%s' "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src $1; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
}
export OTTIMO_EXPECTED_HSTS="max-age=31536000; includeSubDomains"
export OTTIMO_EXPECTED_PERMISSIONS="camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()"

# Per origin: <Referrer-Policy> <worker-src> <Cache-Control of index.html>
ottimo_expected_site() {
  case "$1" in
    desk) printf '%s' "same-origin|'none'|no-cache" ;;
    staff) printf '%s' "same-origin|'self'|no-cache" ;;
    guest) printf '%s' "no-referrer|'none'|no-store" ;;
    *) return 1 ;;
  esac
}

# header_values <raw headers> <name> – every value of that header (one per line, CR stripped, case-insensitive name)
ottimo_header_values() {
  tr -d '\r' <<<"$1" | awk -v n="$(tr '[:upper:]' '[:lower:]' <<<"$2")" '
    { line = $0; i = index(line, ":"); if (i == 0) next
      name = tolower(substr(line, 1, i - 1)); if (name != n) next
      v = substr(line, i + 1); sub(/^[ \t]+/, "", v); print v }'
}

# ottimo_check_security_headers <raw headers> <site desk|staff|guest> – prints one "FAIL …" line per problem
ottimo_check_security_headers() {
  local h="$1" site="$2" spec referrer worker cache want got n name pair
  spec=$(ottimo_expected_site "$site") || { echo "FAIL unknown site $site"; return; }
  IFS='|' read -r referrer worker cache <<<"$spec"
  for pair in \
    "content-security-policy|$(ottimo_expected_csp "$worker")" \
    "strict-transport-security|$OTTIMO_EXPECTED_HSTS" \
    "referrer-policy|$referrer" \
    "permissions-policy|$OTTIMO_EXPECTED_PERMISSIONS" \
    "x-frame-options|DENY" \
    "x-content-type-options|nosniff" \
    "cross-origin-opener-policy|same-origin" \
    "cross-origin-resource-policy|same-origin" \
    "x-robots-tag|noindex, nofollow" \
    "cache-control|$cache"; do
    name="${pair%%|*}"; want="${pair#*|}"
    got=$(ottimo_header_values "$h" "$name")
    n=$(grep -c . <<<"$got" || true)
    if [ "$n" -ne 1 ]; then echo "FAIL $site $name: $n header line(s), expected exactly 1"; continue; fi
    [ "$got" = "$want" ] || echo "FAIL $site $name: got [$got] expected [$want]"
  done
  for name in server via; do
    [ -z "$(ottimo_header_values "$h" "$name")" ] || echo "FAIL $site sends a $name header"
  done
}
