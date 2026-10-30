#!/usr/bin/env bash
# US-155 production smoke, step L point 5 (FE-B us155-enable-readiness 3.1; SEC FB-R3-SEC-OPS-US155-02): after the
# test request ("TEST OTTIMO", info@ottimo.vn, channel Email) was erased with WR8, prove with COUNTS ONLY that its
# personal data is gone and that the test strings are in no other table. Run as the deploy user:
#   us155-smoke-counts.sh --ref REQ-XXXXXXXX --since 2026-10-31T07:40:00+07:00
# READ ONLY transaction, rolled back (infra/server/us155-smoke-counts.sql); values passed with psql -v, never in SQL
# text; no column of any row is printed – only "check | number | expected | OK/FAIL". Exit 0 = every check OK.
# Copy the whole output into the OPS report (it holds no personal data: the ref code and table names only).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
sql_file="$here/../us155-smoke-counts.sql"
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }
is_prod=0
if [ "$(envval APP_ENV)" = "production" ] || [ "$(cat "$OTTIMO_HOME/.ottimo-home" 2>/dev/null)" = "production" ] \
  || [ "$(basename "$OTTIMO_HOME")" = "ottimo-prod" ]; then is_prod=1; fi
if [ -n "${PN_TEST_DC:-}" ] && [ "$is_prod" -eq 1 ]; then echo "refused: PN_TEST_DC is not allowed on production" >&2; exit 2; fi
dc() { "${PN_TEST_DC:-$here/dc}" "$@"; }

# The test strings of the smoke (FE-B 3.1 point 2, SEC SEC-on-OPS-us155-enable 3) – fixed, not arguments.
N1='TEST OTTIMO'
N2='info@ottimo.vn'

ref="" since=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="${2:-}"; shift 2 || true ;;
    --since) since="${2:-}"; shift 2 || true ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[[ "$ref" =~ ^(REQ-)?[0-9A-HJKMNP-TV-Z]{8}$ ]] || { echo "usage: $0 --ref REQ-XXXXXXXX --since <YYYY-MM-DDTHH:MM[:SS]+07:00>" >&2; exit 2; }
[[ "$since" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}[T\ ][0-9]{2}:[0-9]{2}(:[0-9]{2})?([+-][0-9]{2}(:?[0-9]{2})?|Z)$ ]] \
  || { echo "--since must be a timestamp WITH time zone, e.g. 2026-10-31T07:40:00+07:00" >&2; exit 2; }
[ -r "$sql_file" ] || { echo "$sql_file missing (copy the whole infra bundle)" >&2; exit 1; }

# shellcheck disable=SC2016 # $1…$4 and $POSTGRES_* expand inside the container's shell
out=$(dc exec -T postgres sh -c 'psql -X -q -tA -F " | " -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ref="$1" -v since="$2" -v n1="$3" -v n2="$4" -f -' sh "$ref" "$since" "$N1" "$N2" < "$sql_file" 2>&1) \
  || { printf '%s\n' "$out" | grep -E '^(psql:.*)?ERROR' | head -n 3 >&2; echo "FAIL: query error (nothing was written – READ ONLY)" >&2; exit 1; }
echo "US-155 smoke counts – ref ${ref#REQ-} since $since – $(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '%s\n' "$out"
if grep -q ' | FAIL$' <<<"$out"; then echo "RESULT: FAIL"; exit 1; fi
[ "$(grep -c ' | OK$' <<<"$out")" -eq 14 ] || { echo "RESULT: FAIL (expected 14 checks)"; exit 1; }
echo "RESULT: OK – 14/14"
