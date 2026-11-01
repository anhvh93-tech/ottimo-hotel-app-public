#!/usr/bin/env bash
# Test of ops-check.sh check `email_dead` (SEC SEC-on-B2-readiness.md 1.5 OPS (a), BUG-R3-032) without a server:
# the real script runs from a temp bin dir next to a stub `dc` that answers the psql call (count only).
# + ARC FB-R3-ARC-OPS-CWD-03: a failing query (email_dead and j16) is reported as a fixed category, never with the raw
# error text (an .env parse error quotes a line of .env; a SQL error quotes names) – stdout, alert state, webhook.
#   bash product/infra/ci/test-ops-check.sh
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
src="$here/../server/bin/ops-check.sh"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/home/state" "$T/bin"
cp "$src" "$T/bin/ops-check.sh"
cat > "$T/bin/dc" <<'STUB'
#!/usr/bin/env bash
# stub: `dc exec -T postgres sh -c '<psql>'` – keep the SQL, answer FAKE_COUNT or fail
[ "$1 $2 $3" = "exec -T postgres" ] || { echo "stub dc: unexpected $*" >&2; exit 9; }
cat > "$OTTIMO_HOME/last.sql"
case "${FAKE_FAIL:-0}" in
  1) echo 'ERROR:  relation "outbox_message" does not exist' >&2; exit 3 ;;
  db) echo 'psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: No such file or directory' >&2; exit 2 ;;
  pg) echo 'service "postgres" is not running' >&2; exit 1 ;;
  env) echo 'failed to read /opt/ottimo/.env: line 7: unexpected character "/" in variable name "ALERT_WEBHOOK_URL=https://chat.example/v1/spaces/X/messages?key=k&token=secret-token"' >&2; exit 15 ;;
esac
echo "${FAKE_COUNT:-0}"
STUB
chmod +x "$T/bin/dc" "$T/bin/ops-check.sh"
pass=0 fail=0
run() { # name expected_rc expected_regex env…   (CHECK=j16 to run another check than email_dead)
  local name="$1" want_rc="$2" want="$3"; shift 3
  local out rc=0
  out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" "$@" bash "$T/bin/ops-check.sh" "${CHECK:-email_dead}" 2>&1) || rc=$?
  if [ "$rc" = "$want_rc" ] && grep -Eq "$want" <<<"$out"; then pass=$((pass + 1)); echo "ok   $name"
  else fail=$((fail + 1)); echo "FAIL $name (rc=$rc): $out"; fi
}
envfile() { printf 'APP_ENV=production\nALERT_WEBHOOK_URL=\nHEARTBEAT_URL=\n%s' "$1" > "$T/home/.env"; rm -f "$T/home/state/ops-check/email_dead"; }

envfile ''
run "0 dead, report only"            0 '^ok   email_dead: 0 .*report only'  FAKE_COUNT=0
run "3 dead, report only (pre-1.0.1)" 0 '^ok   email_dead: 3 .*report only' FAKE_COUNT=3
envfile 'EMAIL_NO_RECIPIENT_ALERT=1
'
run "armed in .env, 0 dead"          0 '^ok   email_dead: 0 staff'          FAKE_COUNT=0
run "armed in .env, 2 dead -> FAIL"  1 '^FAIL email_dead: 2 staff .*reached nobody' FAKE_COUNT=2
run "query error -> FAIL"            1 '^FAIL email_dead: query failed: query error$' FAKE_FAIL=1
envfile ''
run "armed by environment, 1 dead"   1 '^FAIL email_dead: 1 '               FAKE_COUNT=1 EMAIL_NO_RECIPIENT_ALERT=1
envfile 'EMAIL_NO_RECIPIENT_ALERT=yes
'
run "bad switch value -> FAIL"       1 'must be 0 or 1'                       FAKE_COUNT=0
run "bad window -> exit 2"           2 'EMAIL_DEAD_HOURS must be a number'    FAKE_COUNT=0 EMAIL_DEAD_HOURS=1d

# ARC CWD-03: fixed categories, no raw text anywhere (stdout, alert state file, a stderr file left behind).
envfile ''
run "db down -> database unreachable"  1 '^FAIL email_dead: query failed: database unreachable$' FAKE_FAIL=db
run "postgres stopped -> category"     1 '^FAIL email_dead: query failed: postgres container not running$' FAKE_FAIL=pg
run "broken .env -> other error"       1 '^FAIL email_dead: query failed: other error' FAKE_FAIL=env
CHECK=j16 run "j16 broken .env -> other error" 1 '^FAIL j16: query failed: other error' FAKE_FAIL=env
CHECK=j16 run "j16 query error -> category"    1 '^FAIL j16: query failed: query error$' FAKE_FAIL=1
for f in 1 db pg env; do
  for c in email_dead j16; do
    rm -f "$T/home/state/ops-check/$c"
    out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_FAIL=$f bash "$T/bin/ops-check.sh" "$c" 2>&1 || true)
    if grep -qE 'secret-token|outbox_message|PGSQL|socket|/opt/ottimo' <<<"$out$(cat "$T/home/state/ops-check/$c" 2>/dev/null)"; then
      fail=$((fail + 1)); echo "FAIL raw error text forwarded ($c, $f): $out"
    else pass=$((pass + 1)); fi
  done
done
if find "$T/home/state/ops-check" -name '*stderr*' | grep -q .; then fail=$((fail + 1)); echo "FAIL a stderr file is left in state/ops-check"
else pass=$((pass + 1)); echo "ok   no stderr file left behind"; fi

# The SQL only counts: right topic/status/reason, time window, nothing read from the payload.
envfile ''
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT=0 EMAIL_DEAD_HOURS=24 bash "$T/bin/ops-check.sh" email_dead >/dev/null
sql=$(tr -s ' \n' ' ' < "$T/home/last.sql")
for want in "SELECT count(*) FROM outbox_message" "topic = 'staff.email'" "status = 'dead'" "last_error = 'NO_RECIPIENT'" "interval '24 hours'"; do
  if grep -qF "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL sql lacks: $want"; fi
done
if grep -qi payload <<<"$sql"; then fail=$((fail + 1)); echo "FAIL sql reads payload"; else pass=$((pass + 1)); fi
# Part of the full run (timer) list.
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(containers j16 backup disk mem tls http5xx email_dead\)' "$src"; then
  pass=$((pass + 1)); echo "ok   email_dead in the full run"
else fail=$((fail + 1)); echo "FAIL email_dead missing from the full run"; fi

echo "test-ops-check: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
