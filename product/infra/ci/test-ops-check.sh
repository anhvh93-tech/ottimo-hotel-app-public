#!/usr/bin/env bash
# Test of ops-check.sh check `email_dead` (SEC SEC-on-B2-readiness.md 1.5 OPS (a), BUG-R3-032) without a server:
# the real script runs from a temp bin dir next to a stub `dc` that answers the psql call (count only).
# + ARC FB-R3-ARC-OPS-CWD-03: a failing query (email_dead and j16) is reported as a fixed category, never with the raw
# error text (an .env parse error quotes a line of .env; a SQL error quotes names) – stdout, alert state, webhook.
# + v1.0.3 (ARC v1.0.3 tech plan 2.10 / PR-2): check `email_missing` – active OWN/MGR without e-mail, READ ONLY,
# count only, report only until EMAIL_NO_RECIPIENT_ALERT=1, same error categories.
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
printf '%s\n' "$*" > "$OTTIMO_HOME/last.cmd"
cat > "$OTTIMO_HOME/last.sql"
[ -n "${FAKE_SLEEP:-}" ] && sleep "$FAKE_SLEEP"
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
envfile() {
  printf 'APP_ENV=production\nALERT_WEBHOOK_URL=\nHEARTBEAT_URL=\n%s' "$1" > "$T/home/.env"
  rm -f "$T/home/state/ops-check/email_dead" "$T/home/state/ops-check/email_missing"
}

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

# v1.0.3 email_missing: active OWN/MGR without e-mail (count only), report only until armed (same switch).
envfile ''
CHECK=email_missing run "missing: 0, report only"        0 '^ok   email_missing: 0 active OWN/MGR .*report only' FAKE_COUNT=0
CHECK=email_missing run "missing: 1, report only"        0 '^ok   email_missing: 1 active OWN/MGR .*report only' FAKE_COUNT=1
envfile 'EMAIL_NO_RECIPIENT_ALERT=1
'
CHECK=email_missing run "missing: armed, 0 -> ok"        0 '^ok   email_missing: 0 active OWN/MGR user\(s\) without e-mail$' FAKE_COUNT=0
CHECK=email_missing run "missing: armed, 2 -> FAIL"      1 '^FAIL email_missing: 2 active OWN/MGR .*reach nobody' FAKE_COUNT=2
envfile 'EMAIL_NO_RECIPIENT_ALERT=0
'
CHECK=email_missing run "missing: .env 0 beats env 1"    0 '^ok   email_missing: 3 .*report only' FAKE_COUNT=3 EMAIL_NO_RECIPIENT_ALERT=1
envfile 'EMAIL_NO_RECIPIENT_ALERT=on
'
CHECK=email_missing run "missing: bad switch -> FAIL"    1 '^FAIL email_missing: EMAIL_NO_RECIPIENT_ALERT must be 0 or 1' FAKE_COUNT=0
envfile ''
CHECK=email_missing run "missing: query error -> category" 1 '^FAIL email_missing: query failed: query error$' FAKE_FAIL=1
CHECK=email_missing run "missing: db down -> category"   1 '^FAIL email_missing: query failed: database unreachable$' FAKE_FAIL=db
CHECK=email_missing run "missing: odd answer -> FAIL"    1 '^FAIL email_missing: unexpected answer$' FAKE_COUNT='a@b.test'
for f in 1 db pg env; do
  for c in email_dead j16 email_missing; do
    rm -f "$T/home/state/ops-check/$c"
    out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_FAIL=$f bash "$T/bin/ops-check.sh" "$c" 2>&1 || true)
    if grep -qE 'secret-token|outbox_message|PGSQL|socket|/opt/ottimo' <<<"$out$(cat "$T/home/state/ops-check/$c" 2>/dev/null)"; then
      fail=$((fail + 1)); echo "FAIL raw error text forwarded ($c, $f): $out"
    else pass=$((pass + 1)); fi
  done
done
# SEC PR23-06: a stderr file left by a killed run (> 60 min old) is removed; a fresh one (parallel run) is kept.
touch -t 202601010000 "$T/home/state/ops-check/cmd-stderr.KILLED"
touch "$T/home/state/ops-check/cmd-stderr.PARALLEL"
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT=0 bash "$T/bin/ops-check.sh" email_dead >/dev/null 2>&1 || true
if [ ! -e "$T/home/state/ops-check/cmd-stderr.KILLED" ] && [ -e "$T/home/state/ops-check/cmd-stderr.PARALLEL" ]; then
  pass=$((pass + 1)); echo "ok   stale stderr file of a killed run removed, a fresh one kept"
else fail=$((fail + 1)); echo "FAIL stale stderr cleanup"; fi
rm -f "$T/home/state/ops-check/cmd-stderr.PARALLEL"
# SIGTERM while a command runs (systemd stop): the EXIT trap still removes this run's file.
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_SLEEP=5 bash "$T/bin/ops-check.sh" email_dead >/dev/null 2>&1 &
oc_pid=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do find "$T/home/state/ops-check" -name 'cmd-stderr.*' | grep -q . && break; sleep 0.2; done
kill -TERM "$oc_pid" 2>/dev/null || true; wait "$oc_pid" 2>/dev/null || true
if find "$T/home/state/ops-check" -name '*stderr*' | grep -q .; then fail=$((fail + 1)); echo "FAIL stderr file left after SIGTERM"
else pass=$((pass + 1)); echo "ok   SIGTERM during a check → no stderr file left"; fi
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
# email_missing SQL: one count, active users, OWN/MGR roles not revoked, nothing else selected; READ ONLY transaction.
envfile ''
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT=0 bash "$T/bin/ops-check.sh" email_missing >/dev/null
sql=$(tr -s ' \n' ' ' < "$T/home/last.sql")
for want in "SELECT count(*) FROM app_user u WHERE" "u.status = 'active'" "u.email IS NULL OR u.email::text = ''" \
  "FROM user_property_role r" "r.user_id = u.id" "r.role IN ('owner', 'manager')" "r.revoked_at IS NULL"; do
  if grep -qF "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL email_missing sql lacks: $want"; fi
done
# Only one SELECT list may name a column: count(*) and the EXISTS constant – never the e-mail, a name or an id.
if [ "$(grep -o 'SELECT [^ ]*' <<<"$sql" | tr '\n' ' ')" = "SELECT count(*) SELECT 1 " ]; then pass=$((pass + 1)); echo "ok   email_missing selects only count(*)"
else fail=$((fail + 1)); echo "FAIL email_missing selects more than count(*): $sql"; fi
if grep -qiE 'insert|update|delete|truncate|alter|drop|grant|create' <<<"$sql"; then fail=$((fail + 1)); echo "FAIL email_missing sql writes"
else pass=$((pass + 1)); fi
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on" psql' "$T/home/last.cmd"; then
  pass=$((pass + 1)); echo "ok   email_missing runs in a READ ONLY transaction"
else fail=$((fail + 1)); echo "FAIL email_missing not read only: $(cat "$T/home/last.cmd")"; fi
# The answer is a count: a stray non-number never reaches stdout, the state file or the webhook text.
envfile ''
out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT='owner@example.test' bash "$T/bin/ops-check.sh" email_missing 2>&1 || true)
if grep -q '@' <<<"$out$(cat "$T/home/state/ops-check/email_missing" 2>/dev/null)"; then
  fail=$((fail + 1)); echo "FAIL email_missing forwards a non-count answer: $out"
else pass=$((pass + 1)); echo "ok   email_missing never prints an address"; fi

# Part of the full run (timer) list.
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(containers j16 backup disk mem tls http5xx email_dead email_missing\)' "$src"; then
  pass=$((pass + 1)); echo "ok   email_dead + email_missing in the full run"
else fail=$((fail + 1)); echo "FAIL email_dead / email_missing missing from the full run"; fi

echo "test-ops-check: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
