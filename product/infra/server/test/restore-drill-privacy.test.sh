#!/usr/bin/env bash
# Test of restore-drill.sh step 7 (ARC FB-R4-ARC-OPS-PR23-01): privacy-notice.log vs privacy_notice_version of the
# restored database, through infra/server/privacy-log-check.sh (the function restore-drill.sh sources).
# No database, no container: a stub `docker` answers the `docker exec … psql` query (STUB_DB = versions, STUB_DB_FAIL=1 =
# the query fails with an error on stderr).
#   bash infra/server/test/restore-drill-privacy.test.sh        (workstation or CI)
# Cases: log = DB → "khớp DB" (0) · DB has a version the log lacks → CẢNH BÁO (1) · query fails with a log → "không đối
# chiếu được", never "khớp DB" (2) · query fails without a log → "không đối chiếu được", never "DB chưa có version" (2)
# · no log + DB has a version → CẢNH BÁO (1) · no log + empty DB → "không có" (0) · the query uses ON_ERROR_STOP and
# psql's error text is not printed · restore-drill.sh sources the function and no longer swallows the query error.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/.." && pwd)
T=$(mktemp -d "${TMPDIR:-/tmp}/rdp-test.XXXXXX")
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/stubs"
cat > "$T/stubs/docker" <<'STUB'
#!/usr/bin/env bash
echo "docker $*" >> "$STUB_CALLS"
if [ "${STUB_DB_FAIL:-0}" = 1 ]; then
  echo 'ERROR:  relation "privacy_notice_version" does not exist LEAKMARK-db-error' >&2; exit 3
fi
[ -z "${STUB_DB:-}" ] || printf '%s\n' $STUB_DB
STUB
chmod +x "$T/stubs/docker"
export STUB_CALLS="$T/calls.log"
: > "$STUB_CALLS"
# shellcheck source=../privacy-log-check.sh
. "$src/privacy-log-check.sh"

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
log="$T/privacy-notice.log"
printf '%s\n' "2026-10-30T10:39:53Z apply operator=owner landing=sha-1 version=2026-10-24 sha_en=aa sha_vi=bb rc=0" \
  "  NOTICE:  RESULT: published (inserted: vi,en, already present: -)" \
  "2026-10-31T09:00:00Z apply operator=owner landing=sha-2 version=2026-10-31 sha_en=cc sha_vi=dd rc=1" > "$log"
check() { # STUB_DB  STUB_DB_FAIL  log-or-empty  → out, rc
  rc=0
  out=$(PATH="$T/stubs:$PATH" STUB_DB="$1" STUB_DB_FAIL="$2" privacy_log_report ottimo-restore-x-pg "$3" 2>&1) || rc=$?
}

check "2026-10-24" 0 "$log"
if [ "$rc" -eq 0 ] && [[ "$out" == *"version đã ghi: 2026-10-24 – khớp DB" ]]; then ok "1 log = DB → khớp DB (rc=0); rc=1 line ignored"
else ko "1 rc=$rc: $out"; fi

check "2026-10-24 2026-11-01" 0 "$log"
if [ "$rc" -eq 1 ] && [[ "$out" == *"CẢNH BÁO: DB có version không có trong log: 2026-11-01 "* ]] && [[ "$out" != *"khớp DB"* ]]; then
  ok "2 DB has a version the log lacks → CẢNH BÁO (rc=1)"
else ko "2 rc=$rc: $out"; fi

check "" 1 "$log"
if [ "$rc" -eq 2 ] && [[ "$out" == *"không đối chiếu được"* ]] && [[ "$out" != *"khớp DB"* ]] && [[ "$out" != *LEAKMARK* ]]; then
  ok "3 query fails, log present → 'không đối chiếu được' (rc=2), no 'khớp DB', no psql text"
else ko "3 rc=$rc: $out"; fi

check "" 1 ""
if [ "$rc" -eq 2 ] && [[ "$out" == *"không đối chiếu được"* ]] && [[ "$out" != *"DB chưa có version"* ]] && [[ "$out" != *LEAKMARK* ]]; then
  ok "4 query fails, no log → 'không đối chiếu được' (rc=2), not 'DB chưa có version'"
else ko "4 rc=$rc: $out"; fi

check "2026-10-24" 0 ""
if [ "$rc" -eq 1 ] && [[ "$out" == "KHÔNG có trong bộ – CẢNH BÁO: DB có version 2026-10-24 "* ]]; then ok "5 no log, DB has a version → CẢNH BÁO (rc=1)"
else ko "5 rc=$rc: $out"; fi

check "" 0 ""
if [ "$rc" -eq 0 ] && [ "$out" = "không có (DB chưa có version thông báo nào)" ]; then ok "6 no log, empty DB → không có (rc=0)"
else ko "6 rc=$rc: $out"; fi

if grep -q -- 'exec -i ottimo-restore-x-pg psql -X -v ON_ERROR_STOP=1 ' "$STUB_CALLS"; then ok "7 query runs with ON_ERROR_STOP=1"
else ko "7 query: $(tail -n 1 "$STUB_CALLS")"; fi

drill="$src/bin/restore-drill.sh"
if grep -q '^\. "\$pn_check"' "$drill" && grep -q 'privacy_log_report "\$name-pg" "\$pn_log"' "$drill" \
  && ! grep -q 'privacy_notice_version ORDER BY 1" 2>/dev/null || true' "$drill"; then
  ok "8 restore-drill.sh sources privacy-log-check.sh and no longer swallows the query error"
else ko "8 restore-drill.sh does not use privacy_log_report"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
