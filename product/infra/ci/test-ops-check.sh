#!/usr/bin/env bash
# Test of ops-check.sh check `email_dead` (SEC SEC-on-B2-readiness.md 1.5 OPS (a), BUG-R3-032) without a server:
# the real script runs from a temp bin dir next to a stub `dc` that answers the psql call (count only).
# + ARC FB-R3-ARC-OPS-CWD-03: a failing query (email_dead and j16) is reported as a fixed category, never with the raw
# error text (an .env parse error quotes a line of .env; a SQL error quotes names) – stdout, alert state, webhook.
# + v1.0.3 (ARC v1.0.3 tech plan 2.10 / PR-2): check `email_missing` – active OWN/MGR without e-mail, READ ONLY,
# count only, report only until EMAIL_NO_RECIPIENT_ALERT=1, same error categories.
# + v1.0.3 PR-2 bis: check `email_changes` (SEC FB-R4-SEC-OPS-PR31-01: e-mail changes per user / in total in 24 h, age
# of the oldest waiting staff e-mail; tunable limits that cannot be switched off) and `email_ascii` (INT
# FB-R4-INT-BE-31-04: stored addresses outside the API's ASCII rule, report only). READ ONLY, numbers only.
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
if [ -n "${FAKE_OUT:-}" ]; then printf '%b\n' "$FAKE_OUT"; else echo "${FAKE_COUNT:-0}"; fi
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
  rm -f "$T/home/state/ops-check/email_dead" "$T/home/state/ops-check/email_missing" \
    "$T/home/state/ops-check/email_changes" "$T/home/state/ops-check/email_ascii"
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
  for c in email_dead j16 email_missing email_changes email_ascii; do
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

# v1.0.3 email_changes (SEC PR31-01): FAIL when one user > 5, total > 20 changes in 24 h, or the oldest waiting
# staff e-mail > 30 min. Stub answer = the two result lines of the READ ONLY session ("changes|total|max", "queue|n|s").
envfile ''
CHECK=email_changes run "changes: before 0091, empty queue -> ok"  0 '^ok   email_changes: e-mail changes: table not present yet \(before migration 0091\); staff.email queue: 0 waiting, oldest 0 min \(limit 30 min\)$' FAKE_OUT='changes|-1|-1\nqueue|0|0'
CHECK=email_changes run "changes: before 0091, old queue -> FAIL"  1 '^FAIL email_changes: oldest waiting staff e-mail 45 min old \(limit 30 min\)' FAKE_OUT='changes|-1|-1\nqueue|3|2700'
CHECK=email_changes run "changes: none -> ok"                      0 '^ok   email_changes: 0 e-mail change\(s\) in 24 h, max 0 for one user \(limits 5 / user, 20 total\)' FAKE_OUT='changes|0|0\nqueue|0|0'
CHECK=email_changes run "changes: 5 for one user, 20 total -> ok"  0 '^ok   email_changes: 20 e-mail change\(s\) in 24 h, max 5 ' FAKE_OUT='changes|20|5\nqueue|1|1800'
CHECK=email_changes run "changes: 6 for one user -> FAIL"          1 '^FAIL email_changes: 6 e-mail changes for one user in 24 h \(limit 5\) – runbook v1.0.3: lock the flooding account, tell SEC$' FAKE_OUT='changes|6|6\nqueue|0|0'
CHECK=email_changes run "changes: 21 in total -> FAIL"             1 '^FAIL email_changes: 21 e-mail changes in 24 h \(limit 20\) – runbook' FAKE_OUT='changes|21|3\nqueue|0|0'
CHECK=email_changes run "queue: 31 min -> FAIL"                    1 '^FAIL email_changes: oldest waiting staff e-mail 31 min old \(limit 30 min\) – security notices delayed' FAKE_OUT='changes|1|1\nqueue|2|1860'
CHECK=email_changes run "queue: 30 min exactly -> ok"              0 '^ok   email_changes: 1 .*oldest 30 min' FAKE_OUT='changes|1|1\nqueue|2|1800'
CHECK=email_changes run "all three -> one FAIL line with all"      1 '^FAIL email_changes: 30 e-mail changes for one user in 24 h \(limit 5\); 30 e-mail changes in 24 h \(limit 20\); oldest waiting staff e-mail 60 min old' FAKE_OUT='changes|30|30\nqueue|40|3600'
CHECK=email_changes run "queue: negative age (clock) -> 0 min"     0 '^ok   email_changes: .*1 waiting, oldest 0 min' FAKE_OUT='changes|0|0\nqueue|1|-5'
envfile 'EMAIL_CHANGES_USER_MAX=2
EMAIL_CHANGES_TOTAL_MAX=8
STAFF_EMAIL_QUEUE_MAX_MIN=10
'
CHECK=email_changes run "limits from .env: 3 for one user -> FAIL" 1 '^FAIL email_changes: 3 e-mail changes for one user in 24 h \(limit 2\)' FAKE_OUT='changes|3|3\nqueue|0|0'
CHECK=email_changes run "limits from .env: 9 in total -> FAIL"     1 '^FAIL email_changes: 9 e-mail changes in 24 h \(limit 8\)' FAKE_OUT='changes|9|1\nqueue|0|0'
CHECK=email_changes run "limits from .env: queue 11 min -> FAIL"   1 '^FAIL email_changes: oldest waiting staff e-mail 11 min old \(limit 10 min\)' FAKE_OUT='changes|0|0\nqueue|1|660'
CHECK=email_changes run "limits from .env shown in ok line"        0 '\(limits 2 / user, 8 total\); .*\(limit 10 min\)$' FAKE_OUT='changes|2|2\nqueue|0|0'
envfile 'EMAIL_CHANGES_USER_MAX=3
'
CHECK=email_changes run ".env limit beats the environment"         1 '^FAIL email_changes: 4 e-mail changes for one user in 24 h \(limit 3\)' FAKE_OUT='changes|4|4\nqueue|0|0' EMAIL_CHANGES_USER_MAX=20
envfile ''
CHECK=email_changes run "limit from the environment"               1 '\(limit 1\)' FAKE_OUT='changes|2|2\nqueue|0|0' EMAIL_CHANGES_USER_MAX=1
# Tunable, never switched off: 0, a word, a negative or a huge number is refused – a FAIL, not a silent pass.
for bad in 'EMAIL_CHANGES_USER_MAX=0' 'EMAIL_CHANGES_USER_MAX=off' 'EMAIL_CHANGES_USER_MAX=21' 'EMAIL_CHANGES_TOTAL_MAX=0' \
  'EMAIL_CHANGES_TOTAL_MAX=99999' 'EMAIL_CHANGES_TOTAL_MAX=-1' 'STAFF_EMAIL_QUEUE_MAX_MIN=0' 'STAFF_EMAIL_QUEUE_MAX_MIN=4' \
  'STAFF_EMAIL_QUEUE_MAX_MIN=241' 'STAFF_EMAIL_QUEUE_MAX_MIN=30m'; do
  envfile "$bad
"
  CHECK=email_changes run "limit $bad refused -> FAIL"             1 "^FAIL email_changes: ${bad%%=*} must be a whole number [0-9]+-[0-9]+$" FAKE_OUT='changes|0|0\nqueue|0|0'
done
envfile ''
CHECK=email_changes run "changes: query error -> category"         1 '^FAIL email_changes: query failed: query error$' FAKE_FAIL=1
CHECK=email_changes run "changes: db down -> category"             1 '^FAIL email_changes: query failed: database unreachable$' FAKE_FAIL=db
CHECK=email_changes run "changes: one line missing -> FAIL"        1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|1|1'
CHECK=email_changes run "changes: half the table answer -> FAIL"   1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|-1|3\nqueue|0|0'
CHECK=email_changes run "changes: a line twice -> FAIL"            1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|1|1\nqueue|0|0\nqueue|0|0'
out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_OUT='changes|1|1\nqueue|0|0\nowner@example.test' bash "$T/bin/ops-check.sh" email_changes 2>&1 || true)
if grep -q '^FAIL email_changes: unexpected answer$' <<<"$out" && ! grep -q '@' <<<"$out$(cat "$T/home/state/ops-check/email_changes" 2>/dev/null)"; then
  pass=$((pass + 1)); echo "ok   email_changes never prints a stray address"
else fail=$((fail + 1)); echo "FAIL email_changes forwards a non-number answer: $out"; fi
# The SQL: READ ONLY transaction, 24 h window by user_id, waiting = pending | failed | in_flight of staff.email, table
# guard for DB 67, only numbers selected (no email / old_email / payload / id / changed_by column anywhere).
envfile ''
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_OUT='changes|0|0\nqueue|0|0' bash "$T/bin/ops-check.sh" email_changes >/dev/null
sql=$(tr -s ' \n' ' ' < "$T/home/last.sql")
for want in "to_regclass('public.user_email_change') IS NOT NULL AS has_uec \\gset" '\if :has_uec' \
  "SELECT 'changes', coalesce(sum(n), 0), coalesce(max(n), 0) FROM (" "SELECT count(*) AS n FROM user_email_change" \
  "changed_at > now() - interval '24 hours' GROUP BY user_id" "SELECT 'changes', -1, -1;" \
  "SELECT 'queue', count(*), coalesce(extract(epoch FROM now() - min(created_at))::bigint, 0) FROM outbox_message" \
  "topic = 'staff.email' AND status IN ('pending', 'failed', 'in_flight')"; do
  if grep -qF -- "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL email_changes sql lacks: $want"; fi
done
if sed "s/'staff\.email'//g" <<<"$sql" | grep -qiwE 'email|old_email|payload|changed_by|display_name|username'; then
  fail=$((fail + 1)); echo "FAIL email_changes sql names a personal column: $sql"
else pass=$((pass + 1)); echo "ok   email_changes sql names no address / payload column"; fi
if grep -qiwE 'insert|update|delete|truncate|alter|drop|grant|create' <<<"$sql"; then fail=$((fail + 1)); echo "FAIL email_changes sql writes"
else pass=$((pass + 1)); fi
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on" psql' "$T/home/last.cmd"; then
  pass=$((pass + 1)); echo "ok   email_changes runs in a READ ONLY transaction"
else fail=$((fail + 1)); echo "FAIL email_changes not read only: $(cat "$T/home/last.cmd")"; fi
# email_changes FAILs whatever EMAIL_NO_RECIPIENT_ALERT says (it is no report-only check).
envfile 'EMAIL_NO_RECIPIENT_ALERT=0
'
CHECK=email_changes run "changes: FAIL also when alert switch is 0" 1 '^FAIL email_changes: 6 e-mail changes for one user' FAKE_OUT='changes|6|6\nqueue|0|0'

# v1.0.3 email_ascii (INT 31-04): count of stored addresses outside the API rule, always report only.
envfile ''
CHECK=email_ascii run "ascii: 0 -> ok"                             0 '^ok   email_ascii: 0 stored e-mail address\(es\) outside the ASCII rule \(report only' FAKE_COUNT=0
CHECK=email_ascii run "ascii: 2 -> still ok (report only)"         0 '^ok   email_ascii: 2 stored ' FAKE_COUNT=2
CHECK=email_ascii run "ascii: query error -> category"             1 '^FAIL email_ascii: query failed: query error$' FAKE_FAIL=1
CHECK=email_ascii run "ascii: odd answer -> FAIL"                  1 '^FAIL email_ascii: unexpected answer$' FAKE_COUNT='x@example.test'
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT=0 bash "$T/bin/ops-check.sh" email_ascii >/dev/null
sql=$(tr -s ' \n' ' ' < "$T/home/last.sql")
for want in "SELECT count(*) FROM (SELECT lower(btrim(email::text)) AS e FROM app_user WHERE email IS NOT NULL) a" \
  "a.e <> ''" "char_length(a.e) BETWEEN 3 AND 254" "a.e ~ '^[a-z0-9._%+-]{1,64}@([a-z0-9-]{1,63}\.)+[a-z]{2,63}\$'"; do
  if grep -qF -- "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL email_ascii sql lacks: $want"; fi
done
# One statement, and its outer SELECT list is count(*) only (the address stays inside the sub-select).
if [ "$(grep -o ';' <<<"$sql" | wc -l | tr -d ' ')" = 1 ] && grep -q '^SELECT count(\*) FROM (SELECT ' <<<"$sql"; then
  pass=$((pass + 1)); echo "ok   email_ascii returns only count(*)"
else fail=$((fail + 1)); echo "FAIL email_ascii returns more than count(*): $sql"; fi
if grep -qiwE 'insert|update|delete|truncate|alter|drop|grant|create' <<<"$sql"; then fail=$((fail + 1)); echo "FAIL email_ascii sql writes"
else pass=$((pass + 1)); fi
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on" psql' "$T/home/last.cmd"; then
  pass=$((pass + 1)); echo "ok   email_ascii runs in a READ ONLY transaction"
else fail=$((fail + 1)); echo "FAIL email_ascii not read only"; fi

# Part of the full run (timer) list.
# LP-v2 merge (lp-v2-main): the price checks (pricelimit pricegap priceswitch) follow the e-mail checks.
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(containers j16 backup disk mem tls http5xx email_dead email_missing email_changes email_ascii( [a-z0-9_]+)*\)' "$src"; then
  pass=$((pass + 1)); echo "ok   email_dead + email_missing + email_changes + email_ascii in the full run"
else fail=$((fail + 1)); echo "FAIL an e-mail check is missing from the full run"; fi
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(.* pricelimit pricegap priceswitch\)' "$src"; then
  pass=$((pass + 1)); echo "ok   pricelimit + pricegap + priceswitch in the full run (LP-v2)"
else fail=$((fail + 1)); echo "FAIL an LP-v2 price check is missing from the full run"; fi

echo "test-ops-check: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
