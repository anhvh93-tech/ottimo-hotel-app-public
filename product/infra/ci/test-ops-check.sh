#!/usr/bin/env bash
# Test of ops-check.sh check `email_dead` (SEC SEC-on-B2-readiness.md 1.5 OPS (a), BUG-R3-032) without a server:
# the real script runs from a temp bin dir next to a stub `dc` that answers the psql call (count only).
# + ARC FB-R3-ARC-OPS-CWD-03: a failing query (email_dead and j16) is reported as a fixed category, never with the raw
# error text (an .env parse error quotes a line of .env; a SQL error quotes names) – stdout, alert state, webhook.
# + v1.0.3 (ARC v1.0.3 tech plan 2.10 / PR-2): check `email_missing` – active OWN/MGR without e-mail, READ ONLY,
# count only, report only until EMAIL_NO_RECIPIENT_ALERT=1, same error categories.
# + v1.0.3 PR-2 bis: check `email_changes` (SEC FB-R4-SEC-OPS-PR31-01: e-mail changes per user / in total in 24 h, age
# of the oldest waiting staff e-mail; tunable limits that cannot be switched off) and `email_ascii` (INT
# FB-R4-INT-BE-31-04: stored addresses outside the API's ASCII rule). READ ONLY, numbers only.
# + v1.0.4 (P4-04): every DB check runs as ottimo_readonly behind a guard row (SEC PR32-S1, ARC PR30-09) – a session
# that is not that role answers no number and FAILs; email_missing counts locked users too (ARC PR30-08);
# email_changes prints `via owner: <n>` (SEC PR32-02 (b)); email_ascii FAILs above 0 (v1.0.4 adapter); new checks
# email_config (.env mail settings, same address rule as email_ascii) and db_triggers (PN-01 + 0094 triggers).
# + v1.0.5 (V5-65, SEC FB-R4-SEC-OPS-OR-03): check `sshkeys` – every key line of the deploy user's authorized_keys
# (+ authorized_keys2) has command="…" and restrict; counts only, never a key or a comment in the output.
# + SEC FB-R5-SEC-OPS-93-02: only the two known forced commands (deploy-from-ci.sh, rrsync -ro of a stack's backup
# directory); pty / port-forwarding / agent-forwarding / X11-forwarding / user-rc after restrict → FAIL; authorized_keys
# or .ssh writable by group or others → FAIL.
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
# psql_ro sends the 2-line guard first: kept apart, so last.sql is the check's own SQL.
cat > "$OTTIMO_HOME/last.all"
head -n 2 "$OTTIMO_HOME/last.all" > "$OTTIMO_HOME/last.guard"
tail -n +3 "$OTTIMO_HOME/last.all" > "$OTTIMO_HOME/last.sql"
[ -n "${FAKE_SLEEP:-}" ] && sleep "$FAKE_SLEEP"
case "${FAKE_FAIL:-0}" in
  1) echo 'ERROR:  relation "outbox_message" does not exist' >&2; exit 3 ;;
  db) echo 'psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: No such file or directory' >&2; exit 2 ;;
  pg) echo 'service "postgres" is not running' >&2; exit 1 ;;
  env) echo 'failed to read /opt/ottimo/.env: line 7: unexpected character "/" in variable name "ALERT_WEBHOOK_URL=https://chat.example/v1/spaces/X/messages?key=k&token=secret-token"' >&2; exit 15 ;;
esac
# The guard row: ro-ok unless FAKE_GUARD says otherwise (a session that is not ottimo_readonly answers ro-bad).
echo "${FAKE_GUARD:-ro-ok}"
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
    "$T/home/state/ops-check/email_changes" "$T/home/state/ops-check/email_ascii" \
    "$T/home/state/ops-check/email_config" "$T/home/state/ops-check/db_triggers" "$T/home/state/ops-check/j16"
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
CHECK=email_missing run "missing: 0, report only"        0 '^ok   email_missing: 0 active/locked OWN/MGR .*report only' FAKE_COUNT=0
CHECK=email_missing run "missing: 1, report only"        0 '^ok   email_missing: 1 active/locked OWN/MGR .*report only' FAKE_COUNT=1
envfile 'EMAIL_NO_RECIPIENT_ALERT=1
'
CHECK=email_missing run "missing: armed, 0 -> ok"        0 '^ok   email_missing: 0 active/locked OWN/MGR user\(s\) without e-mail$' FAKE_COUNT=0
CHECK=email_missing run "missing: armed, 2 -> FAIL"      1 '^FAIL email_missing: 2 active/locked OWN/MGR .*reach nobody' FAKE_COUNT=2
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
for want in "SELECT count(*) FROM app_user u WHERE" "u.status IN ('active', 'locked')" "u.email IS NULL OR u.email::text = ''" \
  "FROM user_property_role r" "r.user_id = u.id" "r.role IN ('owner', 'manager')" "r.revoked_at IS NULL"; do
  if grep -qF "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL email_missing sql lacks: $want"; fi
done
# Only one SELECT list may name a column: count(*) and the EXISTS constant – never the e-mail, a name or an id.
if [ "$(grep -o 'SELECT [^ ]*' <<<"$sql" | tr '\n' ' ')" = "SELECT count(*) SELECT 1 " ]; then pass=$((pass + 1)); echo "ok   email_missing selects only count(*)"
else fail=$((fail + 1)); echo "FAIL email_missing selects more than count(*): $sql"; fi
if grep -qiE 'insert|update|delete|truncate|alter|drop|grant|create' <<<"$sql"; then fail=$((fail + 1)); echo "FAIL email_missing sql writes"
else pass=$((pass + 1)); fi
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" psql' "$T/home/last.cmd"; then
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
CHECK=email_changes run "changes: before 0091, empty queue -> ok"  0 '^ok   email_changes: e-mail changes: table not present yet \(before migration 0091\); staff.email queue: 0 waiting, oldest 0 min \(limit 30 min\)$' FAKE_OUT='changes|-1|-1|-1\nqueue|0|0'
CHECK=email_changes run "changes: before 0091, old queue -> FAIL"  1 '^FAIL email_changes: oldest waiting staff e-mail 45 min old \(limit 30 min\)' FAKE_OUT='changes|-1|-1|-1\nqueue|3|2700'
CHECK=email_changes run "changes: none -> ok"                      0 '^ok   email_changes: 0 e-mail change\(s\) in 24 h, max 0 for one user, via owner: 0 \(limits 5 / user, 20 total\)' FAKE_OUT='changes|0|0|0\nqueue|0|0'
CHECK=email_changes run "changes: 5 for one user, 20 total -> ok"  0 '^ok   email_changes: 20 e-mail change\(s\) in 24 h, max 5 ' FAKE_OUT='changes|20|5|0\nqueue|1|1800'
CHECK=email_changes run "changes: 6 for one user -> FAIL"          1 '^FAIL email_changes: 6 e-mail changes for one user in 24 h \(limit 5\); via owner: 0 – runbook F branch 2: lock the flooding account \(self changes\), tell SEC$' FAKE_OUT='changes|6|6|0\nqueue|0|0'
CHECK=email_changes run "changes: 21 in total -> FAIL"             1 '^FAIL email_changes: 21 e-mail changes in 24 h \(limit 20\); via owner: 0 – runbook' FAKE_OUT='changes|21|3|0\nqueue|0|0'
CHECK=email_changes run "queue: 31 min -> FAIL"                    1 '^FAIL email_changes: oldest waiting staff e-mail 31 min old \(limit 30 min\) – security notices delayed' FAKE_OUT='changes|1|1|0\nqueue|2|1860'
CHECK=email_changes run "queue: 30 min exactly -> ok"              0 '^ok   email_changes: 1 .*oldest 30 min' FAKE_OUT='changes|1|1|0\nqueue|2|1800'
CHECK=email_changes run "all three -> one FAIL line with all"      1 '^FAIL email_changes: 30 e-mail changes for one user in 24 h \(limit 5\); 30 e-mail changes in 24 h \(limit 20\); oldest waiting staff e-mail 60 min old' FAKE_OUT='changes|30|30|0\nqueue|40|3600'
CHECK=email_changes run "queue: negative age (clock) -> 0 min"     0 '^ok   email_changes: .*1 waiting, oldest 0 min' FAKE_OUT='changes|0|0|0\nqueue|1|-5'
envfile 'EMAIL_CHANGES_USER_MAX=2
EMAIL_CHANGES_TOTAL_MAX=8
STAFF_EMAIL_QUEUE_MAX_MIN=10
'
CHECK=email_changes run "limits from .env: 3 for one user -> FAIL" 1 '^FAIL email_changes: 3 e-mail changes for one user in 24 h \(limit 2\)' FAKE_OUT='changes|3|3|0\nqueue|0|0'
CHECK=email_changes run "limits from .env: 9 in total -> FAIL"     1 '^FAIL email_changes: 9 e-mail changes in 24 h \(limit 8\)' FAKE_OUT='changes|9|1|0\nqueue|0|0'
CHECK=email_changes run "limits from .env: queue 11 min -> FAIL"   1 '^FAIL email_changes: oldest waiting staff e-mail 11 min old \(limit 10 min\)' FAKE_OUT='changes|0|0|0\nqueue|1|660'
CHECK=email_changes run "limits from .env shown in ok line"        0 '\(limits 2 / user, 8 total\); .*\(limit 10 min\)$' FAKE_OUT='changes|2|2|0\nqueue|0|0'
envfile 'EMAIL_CHANGES_USER_MAX=3
'
CHECK=email_changes run ".env limit beats the environment"         1 '^FAIL email_changes: 4 e-mail changes for one user in 24 h \(limit 3\)' FAKE_OUT='changes|4|4|0\nqueue|0|0' EMAIL_CHANGES_USER_MAX=20
envfile ''
CHECK=email_changes run "limit from the environment"               1 '\(limit 1\)' FAKE_OUT='changes|2|2|0\nqueue|0|0' EMAIL_CHANGES_USER_MAX=1
# Tunable, never switched off: 0, a word, a negative or a huge number is refused – a FAIL, not a silent pass.
for bad in 'EMAIL_CHANGES_USER_MAX=0' 'EMAIL_CHANGES_USER_MAX=off' 'EMAIL_CHANGES_USER_MAX=21' 'EMAIL_CHANGES_TOTAL_MAX=0' \
  'EMAIL_CHANGES_TOTAL_MAX=99999' 'EMAIL_CHANGES_TOTAL_MAX=-1' 'STAFF_EMAIL_QUEUE_MAX_MIN=0' 'STAFF_EMAIL_QUEUE_MAX_MIN=4' \
  'STAFF_EMAIL_QUEUE_MAX_MIN=241' 'STAFF_EMAIL_QUEUE_MAX_MIN=30m'; do
  envfile "$bad
"
  CHECK=email_changes run "limit $bad refused -> FAIL"             1 "^FAIL email_changes: ${bad%%=*} must be a whole number [0-9]+-[0-9]+$" FAKE_OUT='changes|0|0|0\nqueue|0|0'
done
envfile ''
CHECK=email_changes run "changes: query error -> category"         1 '^FAIL email_changes: query failed: query error$' FAKE_FAIL=1
CHECK=email_changes run "changes: db down -> category"             1 '^FAIL email_changes: query failed: database unreachable$' FAKE_FAIL=db
CHECK=email_changes run "changes: one line missing -> FAIL"        1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|1|1|0'
CHECK=email_changes run "changes: half the table answer -> FAIL"   1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|-1|3|-1\nqueue|0|0'
CHECK=email_changes run "changes: a line twice -> FAIL"            1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|1|1|0\nqueue|0|0\nqueue|0|0'
out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_OUT='changes|1|1|0\nqueue|0|0\nowner@example.test' bash "$T/bin/ops-check.sh" email_changes 2>&1 || true)
if grep -q '^FAIL email_changes: unexpected answer$' <<<"$out" && ! grep -q '@' <<<"$out$(cat "$T/home/state/ops-check/email_changes" 2>/dev/null)"; then
  pass=$((pass + 1)); echo "ok   email_changes never prints a stray address"
else fail=$((fail + 1)); echo "FAIL email_changes forwards a non-number answer: $out"; fi
# The SQL: READ ONLY transaction, 24 h window by user_id, waiting = pending | failed | in_flight of staff.email, table
# guard for DB 67, only numbers selected (no email / old_email / payload / id / changed_by column anywhere).
envfile ''
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_OUT='changes|0|0|0\nqueue|0|0' bash "$T/bin/ops-check.sh" email_changes >/dev/null
sql=$(tr -s ' \n' ' ' < "$T/home/last.sql")
for want in "to_regclass('public.user_email_change') IS NOT NULL AS has_uec \\gset" '\if :has_uec' \
  "SELECT 'changes', coalesce(sum(n), 0), coalesce(max(n), 0), coalesce(sum(o), 0) FROM (" \
  "SELECT count(*) AS n, count(*) FILTER (WHERE via = 'owner') AS o FROM user_email_change" \
  "changed_at > now() - interval '24 hours' GROUP BY user_id" "SELECT 'changes', -1, -1, -1;" \
  "SELECT 'queue', count(*), coalesce(extract(epoch FROM now() - min(created_at))::bigint, 0) FROM outbox_message" \
  "topic = 'staff.email' AND status IN ('pending', 'failed', 'in_flight')"; do
  if grep -qF -- "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL email_changes sql lacks: $want"; fi
done
if sed "s/'staff\.email'//g" <<<"$sql" | grep -qiwE 'email|old_email|payload|changed_by|display_name|username'; then
  fail=$((fail + 1)); echo "FAIL email_changes sql names a personal column: $sql"
else pass=$((pass + 1)); echo "ok   email_changes sql names no address / payload column"; fi
if grep -qiwE 'insert|update|delete|truncate|alter|drop|grant|create' <<<"$sql"; then fail=$((fail + 1)); echo "FAIL email_changes sql writes"
else pass=$((pass + 1)); fi
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" psql' "$T/home/last.cmd"; then
  pass=$((pass + 1)); echo "ok   email_changes runs in a READ ONLY transaction"
else fail=$((fail + 1)); echo "FAIL email_changes not read only: $(cat "$T/home/last.cmd")"; fi
# email_changes FAILs whatever EMAIL_NO_RECIPIENT_ALERT says (it is no report-only check).
envfile 'EMAIL_NO_RECIPIENT_ALERT=0
'
CHECK=email_changes run "changes: FAIL also when alert switch is 0" 1 '^FAIL email_changes: 6 e-mail changes for one user' FAKE_OUT='changes|6|6|0\nqueue|0|0'

# v1.0.3 email_ascii (INT 31-04): count of stored addresses outside the API rule, always report only.
envfile ''
CHECK=email_ascii run "ascii: 0 -> ok"                             0 '^ok   email_ascii: 0 stored e-mail address\(es\) outside the ASCII rule$' FAKE_COUNT=0
CHECK=email_ascii run "ascii: 2 -> FAIL (v1.0.4 adapter enforces)" 1 '^FAIL email_ascii: 2 stored e-mail address\(es\) outside the ASCII rule – security e-mails to them fail' FAKE_COUNT=2
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
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" psql' "$T/home/last.cmd"; then
  pass=$((pass + 1)); echo "ok   email_ascii runs in a READ ONLY transaction"
else fail=$((fail + 1)); echo "FAIL email_ascii not read only"; fi

# v1.0.4 (SEC PR32-S1, ARC PR30-09): every DB check runs as ottimo_readonly in a READ ONLY transaction, behind the
# guard row. A session that is not that role (no BYPASSRLS → silent 0) answers no number: FAIL, never "ok 0".
envfile ''
for c in j16 email_dead email_missing email_changes email_ascii priceswitch db_triggers; do
  CHECK=$c run "$c: guard ro-bad -> FAIL unexpected answer" 1 "^FAIL $c: unexpected answer\$" FAKE_GUARD=ro-bad FAKE_COUNT=0 FAKE_OUT=''
  if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER"' "$T/home/last.cmd" \
    && grep -qF "current_user = 'ottimo_readonly'" "$T/home/last.guard" && grep -qF "rolbypassrls AND NOT rolsuper" "$T/home/last.guard" \
    && grep -qF "current_setting('transaction_read_only') = 'on'" "$T/home/last.guard"; then
    pass=$((pass + 1)); echo "ok   $c runs as ottimo_readonly, READ ONLY, guard first"
  else fail=$((fail + 1)); echo "FAIL $c session: $(cat "$T/home/last.cmd") / $(cat "$T/home/last.guard")"; fi
done
if grep -q 'psql_admin\|-U "\$POSTGRES_USER" -d "\$POSTGRES_DB" -tA -F "|"'"'"'$' "$src"; then
  fail=$((fail + 1)); echo "FAIL ops-check still has a session without the read-only role"
else pass=$((pass + 1)); echo "ok   no superuser session left in ops-check"; fi
# j16 answer lines are checked before use (a stray value is never parsed or printed).
CHECK=j16 run "j16: good line -> ok"                        0 '^ok   j16: 1 active propert' FAKE_OUT='0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f|3600|999999|0'
CHECK=j16 run "j16: stray value -> FAIL unexpected answer"  1 '^FAIL j16: unexpected answer$' FAKE_OUT='0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f|owner@example.test|1|0'
# SEC PR32-02 (b): via owner decides the branch of runbook F.
CHECK=email_changes run "changes: via owner 4 -> branch 1 (OWN account)" 1 '^FAIL email_changes: 21 e-mail changes in 24 h \(limit 20\); via owner: 4 – runbook F branch 1: treat the OWN account as exposed' FAKE_OUT='changes|21|3|4\nqueue|0|0'
CHECK=email_changes run "changes: via owner in the ok line"              0 '^ok   email_changes: 3 e-mail change\(s\) in 24 h, max 2 for one user, via owner: 1 ' FAKE_OUT='changes|3|2|1\nqueue|0|0'
CHECK=email_changes run "changes: queue only, before 0091 -> owner -"     1 'via owner: - – runbook F branch 2' FAKE_OUT='changes|-1|-1|-1\nqueue|3|2700'
CHECK=email_changes run "changes: owner count missing -> FAIL"           1 '^FAIL email_changes: unexpected answer$' FAKE_OUT='changes|3|2|-1\nqueue|0|0'
# ARC PR30-08: locked users are counted too.
envfile ''
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT=0 bash "$T/bin/ops-check.sh" email_missing >/dev/null
if grep -qF "u.status IN ('active', 'locked')" "$T/home/last.sql" && ! grep -qF "u.status = 'active'" "$T/home/last.sql"; then
  pass=$((pass + 1)); echo "ok   email_missing counts active + locked"
else fail=$((fail + 1)); echo "FAIL email_missing status filter: $(cat "$T/home/last.sql")"; fi
# email_ascii SQL uses the one rule constant of the script (EMAIL_RULE_RE), the same text email_config uses.
rule=$(sed -n "s/^EMAIL_RULE_RE='\(.*\)'\$/\1/p" "$src")
if [ -n "$rule" ] && grep -qF "a.e ~ '$rule'" "$T/home/last.sql" 2>/dev/null || { env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_COUNT=0 bash "$T/bin/ops-check.sh" email_ascii >/dev/null; grep -qF "a.e ~ '$rule'" "$T/home/last.sql"; }; then
  pass=$((pass + 1)); echo "ok   email_ascii SQL = EMAIL_RULE_RE"
else fail=$((fail + 1)); echo "FAIL email_ascii SQL does not use EMAIL_RULE_RE"; fi

# v1.0.4 email_config (SEC V104-04 3-4): .env mail settings with the same rule; words and counts only, never an address.
cfg() { # name rc regex env-lines…
  local name="$1" rc="$2" re="$3"; shift 3
  envfile "$(printf '%s\n' "$@")
"
  CHECK=email_config run "config: $name" "$rc" "$re"
}
cfg "mock provider -> not checked"         0 '^ok   email_config: EMAIL_PROVIDER=mock: not smtp' 'EMAIL_PROVIDER=mock' 'EMAIL_FROM=bad'
cfg "app_password, shared unset -> ok"     0 '^ok   email_config: EMAIL_SMTP_MODE=app_password: EMAIL_FROM and EMAIL_SMTP_USER follow the address rule; EMAIL_SHARED_MAILBOXES unset' \
  'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=app_password' 'EMAIL_SMTP_USER=Ops@Example.test' 'EMAIL_FROM='
cfg "good, 3 shared entries -> ok"         0 'EMAIL_SHARED_MAILBOXES 3 entr\(y/ies\), 0 outside the rule$' \
  'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=app_password' 'EMAIL_SMTP_USER=ops@example.test' 'EMAIL_FROM="info@example.test"' 'EMAIL_SHARED_MAILBOXES=info@example.test, Booking@example.test;team+x@example.test'
cfg "relay mode without user -> ok"        0 '^ok   email_config: EMAIL_SMTP_MODE=relay: EMAIL_FROM follows the address rule; ' 'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=relay' 'EMAIL_FROM=info@example.test'
# ARC FB-R4-ARC-OPS-P404-09: the four cases ARC ran against smtp.ts.
cfg "ARC09 mode unset + user empty -> ok"  0 '^ok   email_config: EMAIL_SMTP_MODE=relay: EMAIL_FROM follows the address rule; ' 'EMAIL_PROVIDER=smtp' 'EMAIL_FROM=info@example.test'
cfg "ARC09 relay + user not an address -> ok" 0 '^ok   email_config: EMAIL_SMTP_MODE=relay: EMAIL_FROM follows the address rule \(EMAIL_SMTP_USER ignored in relay\); ' \
  'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=relay' 'EMAIL_SMTP_USER=relay-account' 'EMAIL_FROM=info@example.test'
cfg "ARC09 EMAIL_FROM trailing space -> ok" 0 '^ok   email_config: EMAIL_SMTP_MODE=relay: ' 'EMAIL_PROVIDER=smtp' 'EMAIL_FROM=info@example.test '
cfg "ARC09 EMAIL_FROM display form -> FAIL" 1 '^FAIL email_config: EMAIL_FROM outside the rule – worker/api v1.0.4 stop at start' \
  'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=app_password' 'EMAIL_SMTP_USER=ops@example.test' 'EMAIL_FROM=OTTIMO <info@example.test>'
cfg "mode value with spaces trimmed -> ok" 0 '^ok   email_config: EMAIL_SMTP_MODE=app_password: ' 'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE= app_password ' 'EMAIL_SMTP_USER=ops@example.test '
cfg "app_password without user -> FAIL"    1 '^FAIL email_config: EMAIL_SMTP_USER empty \(required with EMAIL_SMTP_MODE=app_password\)' 'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=app_password' 'EMAIL_FROM=info@example.test'
cfg "unknown mode -> FAIL"                 1 '^FAIL email_config: EMAIL_SMTP_MODE invalid' 'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=oauth' 'EMAIL_FROM=info@example.test'
cfg "relay, no FROM, no user -> FAIL"      1 '^FAIL email_config: EMAIL_FROM empty' 'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=relay'
cfg "non-ASCII user (app_password) -> FAIL" 1 '^FAIL email_config: EMAIL_SMTP_USER outside the rule' 'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_MODE=app_password' 'EMAIL_SMTP_USER=nguyễn@example.test'
cfg "one bad shared entry -> FAIL count"   1 '^FAIL email_config: 1 EMAIL_SHARED_MAILBOXES entr\(y/ies\) outside the rule' \
  'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_USER=ops@example.test' 'EMAIL_SHARED_MAILBOXES=info@example.test,x@localhost'
cfg "shared on two lines -> FAIL"          1 '^FAIL email_config: EMAIL_SHARED_MAILBOXES on 2 lines' \
  'EMAIL_PROVIDER=smtp' 'EMAIL_SMTP_USER=ops@example.test' 'EMAIL_SHARED_MAILBOXES=info@example.test' 'EMAIL_SHARED_MAILBOXES=booking@example.test'
out=$(cat "$T/home/state/ops-check/email_config" 2>/dev/null; env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" bash "$T/bin/ops-check.sh" email_config 2>&1 || true)
if grep -q '@' <<<"$out"; then fail=$((fail + 1)); echo "FAIL email_config prints an address: $out"
else pass=$((pass + 1)); echo "ok   email_config never prints an address"; fi
# Same rule both sides: an address the SQL rule refuses is refused by email_config too (TLD digits, 1 label, 65 local).
for a in 'a@b.c1' 'a@localhost' "$(printf 'x%.0s' $(seq 65))@example.test" 'a..b@example.test'; do
  envfile "EMAIL_PROVIDER=smtp
EMAIL_SMTP_USER=ops@example.test
EMAIL_SHARED_MAILBOXES=$a
"
  sql_ok=$( [[ "$a" =~ $rule ]] && [ "${#a}" -le 254 ] && echo 1 || echo 0 )
  sh_ok=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" bash "$T/bin/ops-check.sh" email_config >/dev/null 2>&1 && echo 1 || echo 0)
  if [ "$sql_ok" = "$sh_ok" ]; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL rule drift for one test address (sql $sql_ok, shell $sh_ok)"; fi
done

M90=3274031e441f1f86103783726a3e7d9b M95=7a601d0ee740b1861663efa9b89473f5  # md5(prosrc) of 0090 / 0095 (checked below)
PN2() { printf 'pn|privacy_notice_version_append_only|O|%s|%s|%s\\npn|privacy_notice_version_no_truncate|O|%s|%s|%s' "$1" "$2" "$3" "$1" "$2" "$3"; }
# v1.0.4 db_triggers (P4-13 PN-01, P4-11 0094): names + flags only, READ ONLY.
envfile ''
CHECK=db_triggers run "triggers: PN-01 both O, 0094 absent -> ok" 0 '^ok   db_triggers: PN-01 triggers enabled \(function of migration 0090, not SECURITY DEFINER\), ottimo_app SELECT only; room_list_price_append_only not present yet \(before migration 0094\)$' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: + 0094 O|f -> ok"                 0 'room_list_price_append_only enabled$' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|t"
CHECK=db_triggers run "triggers: one PN-01 disabled -> FAIL"       1 '^FAIL db_triggers: privacy_notice_version_no_truncate not enabled \(D\) – tell SEC' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|D|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: one PN-01 missing -> FAIL"        1 '^FAIL db_triggers: 1 of 2 PN-01 triggers' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: ottimo_app may INSERT -> FAIL"    1 'ottimo_app privileges on privacy_notice_version are not SELECT only' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,t,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: 0094 replica-only -> FAIL"        1 'room_list_price_append_only tgenabled\|prosecdef\|before-delete-row = R\|f\|t \(must be O\|f\|t\)' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|t\nrlp|R|f|t"
CHECK=db_triggers run "triggers: 0094 SECURITY DEFINER -> FAIL"    1 'room_list_price_append_only tgenabled\|prosecdef\|before-delete-row = O\|t\|t' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|t|t"
# ARC FB-R4-ARC-OPS-P404-08: 0094 ran (its function exists) but the trigger is gone → FAIL, not "not present yet".
CHECK=db_triggers run "triggers: 0094 function, no trigger -> FAIL" 1 '^FAIL db_triggers: room_list_price_append_only missing \(function present – migration 0094 ran\)' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|t"
CHECK=db_triggers run "triggers: 0094 not BEFORE DELETE ROW -> FAIL" 1 'before-delete-row = O\|f\|f \(must be O\|f\|t\)' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|f"
CHECK=db_triggers run "triggers: no function line -> FAIL"  1 '^FAIL db_triggers: unexpected answer$' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f"
CHECK=db_triggers run "triggers: stray line -> FAIL"               1 '^FAIL db_triggers: unexpected answer$' \
  FAKE_OUT="pn|privacy_notice_version_append_only|O|f|$M90|t\npn|privacy_notice_version_no_truncate|O|f|$M90|t\npnmig|68\napp|t,f,f,f,f\nowner@example.test"
CHECK=db_triggers run "triggers: query error -> category"          1 '^FAIL db_triggers: query failed: query error$' FAKE_FAIL=1
# PN-01 function (SEC FB-R4-SEC-OPS-P413-S2, ARC FB-R4-ARC-OPS-P413-S1): prosecdef f, md5 of the body of the migration state.
CHECK=db_triggers run "triggers: PN-01 body 0095 after 0095 (72 rows) -> ok" 0 '^ok   db_triggers: PN-01 triggers enabled \(function of migration 0095, not SECURITY DEFINER\), ottimo_app SELECT only; room_list_price_append_only enabled$' \
  FAKE_OUT="$(PN2 f $M95 t)\npnmig|72\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|t"
CHECK=db_triggers run "triggers: PN-01 body still 0090 after 0095 -> FAIL" 1 '^FAIL db_triggers: PN-01 function body differs from migration 0095 \(md5 32740[0-9a-f]{3}…, 72 migrations applied\) – tell SEC' \
  FAKE_OUT="$(PN2 f $M90 t)\npnmig|72\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|t"
CHECK=db_triggers run "triggers: PN-01 body 0095 before 0095 (68 rows) -> FAIL" 1 'PN-01 function body differs from migration 0090 \(md5 7a601d0e…, 68 migrations applied\)' \
  FAKE_OUT="$(PN2 f $M95 t)\npnmig|68\napp|t,f,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: PN-01 body replaced by hand -> FAIL" 1 'PN-01 function body differs from migration 0095 \(md5 00000000…' \
  FAKE_OUT="$(PN2 f 00000000000000000000000000000000 t)\npnmig|72\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|t"
CHECK=db_triggers run "triggers: PN-01 function SECURITY DEFINER -> FAIL" 1 'privacy_notice_version_append_only function is SECURITY DEFINER;.*privacy_notice_version_no_truncate function is SECURITY DEFINER' \
  FAKE_OUT="$(PN2 t $M95 t)\npnmig|72\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|t"
CHECK=db_triggers run "triggers: PN-01 trigger on another function -> FAIL" 1 'does not call public.privacy_notice_version_append_only\(\)' \
  FAKE_OUT="$(PN2 f $M95 f)\npnmig|72\napp|t,f,f,f,f\nrlpfn|t\nrlp|O|f|t"
CHECK=db_triggers run "triggers: migration count not readable -> FAIL" 1 'PN-01 function body not checked: ottimo_readonly cannot read drizzle.__drizzle_migrations' \
  FAKE_OUT="$(PN2 f $M90 t)\npnmig|unknown\napp|t,f,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: no pnmig line -> FAIL" 1 '^FAIL db_triggers: unexpected answer$' \
  FAKE_OUT="$(PN2 f $M90 t)\napp|t,f,f,f,f\nrlpfn|f"
CHECK=db_triggers run "triggers: old 3-field pn line -> FAIL" 1 '^FAIL db_triggers: unexpected answer$' \
  FAKE_OUT='pn|privacy_notice_version_append_only|O\npn|privacy_notice_version_no_truncate|O\npnmig|68\napp|t,f,f,f,f\nrlpfn|f'
# The constants follow the migration files: md5 of the text between the first $$ … $$ of the function = pg_proc.prosrc
# (measured equal on Postgres 17). A later migration that redefines the function must update ops-check (review point).
md5_of() { if command -v md5sum >/dev/null 2>&1; then md5sum | cut -d' ' -f1; else md5 -q; fi; }
mig="$here/../../services/api/src/db/migrations"
for pair in "0090_privacy_notice_append_only.sql:PN_FN_MD5_0090" "0095_privacy_notice_append_only_whole_row.sql:PN_FN_MD5_0095"; do
  f="$mig/${pair%%:*}"; const=${pair##*:}
  want=$(sed -n "s/^${const}=\([0-9a-f]\{32\}\)$/\1/p" "$src")
  if [ ! -f "$f" ]; then echo "skip ${pair%%:*} not on this tree (constant $const=${want:0:8}… kept)"; continue; fi
  t=$(<"$f"); body=${t#*\$\$}; body=${body%%\$\$*}
  got=$(printf '%s' "$body" | md5_of)
  if [ -n "$want" ] && [ "$got" = "$want" ]; then pass=$((pass + 1)); echo "ok   $const matches md5 of the function body in ${pair%%:*}"
  else fail=$((fail + 1)); echo "FAIL $const=$want but ${pair%%:*} gives $got"; fi
done
later=$(grep -l 'FUNCTION[[:space:]]\+privacy_notice_version_append_only' "$mig"/*.sql 2>/dev/null | grep -vE '/(0090|0095)_' || true)
if [ -z "$later" ]; then pass=$((pass + 1)); echo "ok   no migration besides 0090/0095 redefines privacy_notice_version_append_only()"
else fail=$((fail + 1)); echo "FAIL $later redefines privacy_notice_version_append_only(): add its md5 to ops-check db_triggers"; fi
# ARC FB-R4-ARC-OPS-P404-16: PN_0095_APPLIED_AT (rows of __drizzle_migrations once 0095 is applied) must follow the
# journal. With the 0095 file: its journal entry must exist and idx + 1 = the constant. Without it: the journal must
# not have reached the constant yet (another migration took idx 71 → stale threshold, false FAIL at K3/K5).
# Reads repo files only (no DB). pn_threshold_check <journal> <migrations dir> <threshold> → prints one verdict line.
pn_threshold_check() {
  local journal="$1" dir="$2" thr="$3" entries row idx tag
  [ -f "$journal" ] || { echo "FAIL journal missing: $journal"; return; }
  entries=$(awk '{ if (match($0, /"idx":[[:space:]]*[0-9]+/)) { v = substr($0, RSTART, RLENGTH); gsub(/[^0-9]/, "", v); i = v }
    if (match($0, /"tag":[[:space:]]*"[^"]*"/)) { t = substr($0, RSTART, RLENGTH); sub(/^"tag":[[:space:]]*"/, "", t); sub(/"$/, "", t); print i " " t } }' "$journal")
  row=$(grep -E '^[0-9]+ 0095_' <<<"$entries" || true)
  if ls "$dir"/0095_*.sql >/dev/null 2>&1; then
    [ -n "$row" ] || { echo "FAIL migration 0095 file present but not in _journal.json"; return; }
    idx=${row%% *}; tag=${row#* }
    if [ $((idx + 1)) -eq "$thr" ]; then echo "ok   PN_0095_APPLIED_AT=$thr = journal idx $idx ($tag) + 1"
    else echo "FAIL stale PN_0095_APPLIED_AT=$thr: journal has $tag at idx $idx (want $((idx + 1)))"; fi
  elif [ -n "$row" ]; then
    echo "FAIL _journal.json lists ${row#* } but the 0095 migration file is missing"
  elif [ "$(grep -c . <<<"$entries")" -ge "$thr" ]; then
    echo "FAIL stale PN_0095_APPLIED_AT=$thr: journal already has $(grep -c . <<<"$entries") entries without 0095"
  else
    echo "skip PN_0095_APPLIED_AT=$thr: 0095 not on this tree yet ($(grep -c . <<<"$entries") journal entries)"
  fi
}
thr=$(sed -n 's/^PN_0095_APPLIED_AT=\([0-9][0-9]*\).*/\1/p' "$src")
verdict=$(pn_threshold_check "$mig/meta/_journal.json" "$mig" "$thr")
echo "$verdict"
case "$verdict" in ok*) pass=$((pass + 1)) ;; skip*) ;; *) fail=$((fail + 1)) ;; esac
# Self-test of the check on a synthetic tree (mutation: a wrong threshold, a missing entry, a stale threshold).
jt="$T/journal-test"; mkdir -p "$jt/m/meta"
mkj() { { echo '{"entries": ['; local i; for i in $(seq 0 $(($1 - 1))); do
  local t="00${i}_x"; [ "$i" = "${2:-}" ] && t="0095_privacy_notice_append_only_whole_row"
  printf '  {"idx": %s, "version": "7", "tag": "%s", "breakpoints": true}%s\n' "$i" "$t" "$([ "$i" -lt $(($1 - 1)) ] && echo ,)"; done
  echo ']}'; } > "$jt/m/meta/_journal.json"; }
rm -f "$jt/m"/0095_*.sql; mkj 72 71; : > "$jt/m/0095_privacy_notice_append_only_whole_row.sql"
for c in "72:^ok   PN_0095_APPLIED_AT=72 = journal idx 71" "73:^FAIL stale PN_0095_APPLIED_AT=73: journal has 0095_privacy_notice_append_only_whole_row at idx 71 \(want 72\)" \
         "71:^FAIL stale PN_0095_APPLIED_AT=71"; do
  got=$(pn_threshold_check "$jt/m/meta/_journal.json" "$jt/m" "${c%%:*}")
  if grep -Eq "${c#*:}" <<<"$got"; then pass=$((pass + 1)); echo "ok   threshold self-test ${c%%:*}: $got"; else fail=$((fail + 1)); echo "FAIL threshold self-test ${c%%:*}: $got"; fi
done
mkj 73 72; got=$(pn_threshold_check "$jt/m/meta/_journal.json" "$jt/m" 72)   # 0095 pushed to idx 72
if grep -q '^FAIL stale PN_0095_APPLIED_AT=72: .* at idx 72 (want 73)' <<<"$got"; then pass=$((pass + 1)); echo "ok   threshold self-test: 0095 moved to idx 72 -> FAIL"; else fail=$((fail + 1)); echo "FAIL threshold self-test moved: $got"; fi
mkj 72; got=$(pn_threshold_check "$jt/m/meta/_journal.json" "$jt/m" 72)       # file present, journal without it
if grep -q '^FAIL migration 0095 file present but not in _journal.json' <<<"$got"; then pass=$((pass + 1)); echo "ok   threshold self-test: 0095 file without journal entry -> FAIL"; else fail=$((fail + 1)); echo "FAIL threshold self-test no-entry: $got"; fi
rm -f "$jt/m"/0095_*.sql; got=$(pn_threshold_check "$jt/m/meta/_journal.json" "$jt/m" 72)   # no 0095, journal reached 72
if grep -q '^FAIL stale PN_0095_APPLIED_AT=72: journal already has 72 entries without 0095' <<<"$got"; then pass=$((pass + 1)); echo "ok   threshold self-test: idx 71 taken by another migration -> FAIL"; else fail=$((fail + 1)); echo "FAIL threshold self-test taken: $got"; fi
mkj 69; got=$(pn_threshold_check "$jt/m/meta/_journal.json" "$jt/m" 72)
if grep -q '^skip ' <<<"$got"; then pass=$((pass + 1)); echo "ok   threshold self-test: 0095 not yet, 69 entries -> skip"; else fail=$((fail + 1)); echo "FAIL threshold self-test skip: $got"; fi
env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" FAKE_OUT='app|t,f,f,f,f' bash "$T/bin/ops-check.sh" db_triggers >/dev/null 2>&1 || true
sql=$(tr -s ' \n' ' ' < "$T/home/last.sql")
for want in "to_regclass('public.privacy_notice_version') IS NOT NULL AS has_pnv" \
  "t.tgname IN ('privacy_notice_version_append_only', 'privacy_notice_version_no_truncate')" \
  "t.tgname = 'room_list_price_append_only'" "to_regprocedure('public.room_list_price_append_only()') IS NOT NULL" \
  "(t.tgtype::int & 11) = 11" "has_table_privilege('ottimo_app', 'public.privacy_notice_version', 'TRUNCATE')" \
  "t.tgenabled, p.prosecdef, md5(p.prosrc), p.oid = to_regprocedure('public.privacy_notice_version_append_only()')" \
  "SELECT 'pnmig', count(*) FROM drizzle.__drizzle_migrations" "has_schema_privilege('drizzle', 'USAGE')"; do
  if grep -qF -- "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL db_triggers sql lacks: $want"; fi
done
if grep -qiwE 'insert into|update [a-z_]+ set|delete from|truncate table|alter|drop|grant|create|disable|enable' <<<"$sql"; then
  fail=$((fail + 1)); echo "FAIL db_triggers sql writes"
else pass=$((pass + 1)); fi

# Part of the full run (timer) list.
# LP-v2 merge (lp-v2-main): the price checks (pricelimit pricegap priceswitch) follow the e-mail checks.
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(containers j16 backup disk mem tls http5xx email_dead email_missing email_changes email_ascii( [a-z0-9_]+)*\)' "$src"; then
  pass=$((pass + 1)); echo "ok   email_dead + email_missing + email_changes + email_ascii in the full run"
else fail=$((fail + 1)); echo "FAIL an e-mail check is missing from the full run"; fi
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(.* pricelimit pricegap priceswitch( [a-z0-9_]+)*\)' "$src"; then
  pass=$((pass + 1)); echo "ok   pricelimit + pricegap + priceswitch in the full run (LP-v2)"
else fail=$((fail + 1)); echo "FAIL an LP-v2 price check is missing from the full run"; fi
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(.* email_config db_triggers( [a-z0-9_]+)*\)' "$src"; then
  pass=$((pass + 1)); echo "ok   email_config + db_triggers in the full run (v1.0.4)"
else fail=$((fail + 1)); echo "FAIL a v1.0.4 check is missing from the full run"; fi
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(.* db_triggers sshkeys( [a-z0-9_]+)*\)' "$src"; then
  pass=$((pass + 1)); echo "ok   sshkeys in the full run (v1.0.5)"
else fail=$((fail + 1)); echo "FAIL sshkeys is missing from the full run"; fi

# v1.0.5 sshkeys (V5-65, SEC FB-R4-SEC-OPS-OR-03). Test keys are made-up base64, never real ones.
sk="$T/ssh"; mkdir -p "$sk"; chmod 0700 "$sk"; um=$(umask); umask 077
ci_line='command="/opt/ottimo-prod/infra/server/bin/deploy-from-ci.sh",restrict ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICIci ci-prod'
pull_line='command="/usr/bin/rrsync -ro /var/backups/ottimo-prod",restrict ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPull pull-mac'
person_line='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPerson ottimo-ops-secret-comment'
envfile ''
printf '%s\n' "# keys of the deploy user" "$ci_line" "" "$pull_line" > "$sk/authorized_keys"
CHECK=sshkeys run "sshkeys: CI + pull keys only -> ok" 0 '^ok   sshkeys: 2 key line\(s\) of the deploy user, all a known forced command with restrict$' OPS_CHECK_SSH_DIR="$sk"
printf '%s\n' "$ci_line" "$person_line" "$pull_line" > "$sk/authorized_keys"
CHECK=sshkeys run "sshkeys: a person key -> FAIL, count only" 1 '^FAIL sshkeys: 1 of 3 key line\(s\) of the deploy user are not a known forced command with restrict \(0 unknown command\(s\), 0 option' OPS_CHECK_SSH_DIR="$sk"
out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" OPS_CHECK_SSH_DIR="$sk" bash "$T/bin/ops-check.sh" sshkeys 2>&1 || true)
if grep -qE 'AAAA|ottimo-ops-secret-comment|ci-prod|pull-mac|ed25519' <<<"$out$(cat "$T/home/state/ops-check/sshkeys")"; then
  fail=$((fail + 1)); echo "FAIL sshkeys prints a key or a comment: $out"
else pass=$((pass + 1)); echo "ok   sshkeys output and state hold numbers only"; fi
for c in "restrict without command:restrict ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a" \
  "command without restrict:command=\"/usr/bin/true\" ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a" \
  "restrict only inside the command text:command=\"/x ,restrict, y\",no-pty ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a" \
  "other options only:no-pty,no-port-forwarding ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a" \
  "indented person key:   ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYx a"; do
  printf '%s\n%s\n' "$ci_line" "${c#*:}" > "$sk/authorized_keys"
  CHECK=sshkeys run "sshkeys: ${c%%:*} -> FAIL" 1 '^FAIL sshkeys: 1 of 2 key line' OPS_CHECK_SSH_DIR="$sk"
done
printf '%s\r\n%s\r\n' "$ci_line" 'restrict,command="/usr/bin/rrsync -ro /var/backups/ottimo" ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIy b' > "$sk/authorized_keys"
CHECK=sshkeys run "sshkeys: options in any order, CRLF -> ok" 0 '^ok   sshkeys: 2 key line' OPS_CHECK_SSH_DIR="$sk"
printf '%s\n' "$ci_line" > "$sk/authorized_keys"; printf '%s\n' "$person_line" > "$sk/authorized_keys2"
CHECK=sshkeys run "sshkeys: person key in authorized_keys2 -> FAIL" 1 '^FAIL sshkeys: 1 of 2 key line' OPS_CHECK_SSH_DIR="$sk"
# SEC 93-02
printf '%s\n' "$ci_line" 'command="/bin/bash",restrict ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a' > "$sk/authorized_keys"; rm -f "$sk/authorized_keys2"
CHECK=sshkeys run "sshkeys: unknown forced command (a shell) -> FAIL" 1 '^FAIL sshkeys: 1 of 2 key line\(s\) .*\(1 unknown command\(s\), 0 option' OPS_CHECK_SSH_DIR="$sk"
printf '%s\n' "$ci_line" 'command="/opt/ottimo/infra/server/bin/deploy-from-ci.sh.bak",restrict ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a' > "$sk/authorized_keys"
CHECK=sshkeys run "sshkeys: near-miss command path -> FAIL" 1 '^FAIL sshkeys: 1 of 2 key line\(s\) .*\(1 unknown command' OPS_CHECK_SSH_DIR="$sk"
for o in pty port-forwarding agent-forwarding X11-forwarding user-rc; do
  printf '%s\n' "$ci_line" "command=\"/usr/bin/rrsync -ro /var/backups/ottimo-prod\",restrict,$o ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIx a" > "$sk/authorized_keys"
  CHECK=sshkeys run "sshkeys: restrict then $o -> FAIL" 1 '^FAIL sshkeys: 1 of 2 key line\(s\) .*\(0 unknown command\(s\), 1 option\(s\) re-opening' OPS_CHECK_SSH_DIR="$sk"
done
printf '%s\n' "$ci_line" "$pull_line" > "$sk/authorized_keys"; chmod 0664 "$sk/authorized_keys"
CHECK=sshkeys run "sshkeys: authorized_keys mode 0664 -> FAIL" 1 '^FAIL sshkeys: authorized_keys or .ssh of the deploy user writable by group or others \(1\)' OPS_CHECK_SSH_DIR="$sk"
chmod 0600 "$sk/authorized_keys"; chmod 0770 "$sk"
CHECK=sshkeys run "sshkeys: .ssh mode 0770 -> FAIL" 1 '^FAIL sshkeys: authorized_keys or .ssh of the deploy user writable' OPS_CHECK_SSH_DIR="$sk"
chmod 0700 "$sk"
CHECK=sshkeys run "sshkeys: modes fixed -> ok" 0 '^ok   sshkeys: 2 key line' OPS_CHECK_SSH_DIR="$sk"
rm -f "$sk/authorized_keys2" "$sk/authorized_keys"
CHECK=sshkeys run "sshkeys: no authorized_keys -> FAIL" 1 '^FAIL sshkeys: authorized_keys of the deploy user missing or unreadable$' OPS_CHECK_SSH_DIR="$sk"
umask "$um"


# SEC FB-R4-SEC-OPS-P404R1-S1: "-c role=" only guards against mistakes; SQL that resets the role or turns READ ONLY
# off would escape it. Static check: no such statement outside comment lines of the script.
role_escape_re='SET[[:space:]]+((LOCAL|SESSION)[[:space:]]+)?ROLE|RESET[[:space:]]+ROLE|SESSION[[:space:]]+AUTHORIZATION|set_config[[:space:]]*\([[:space:]]*.role|transaction_read_only[[:space:]]*(=|TO)[[:space:]]*.?off|READ[[:space:]]+WRITE'
if hits=$(grep -vE '^[[:space:]]*#' "$here/../server/bin/ops-check.sh" | grep -inE "$role_escape_re"); then
  fail=$((fail + 1)); echo "FAIL ops-check.sh contains a role reset / READ WRITE statement: $hits"
else pass=$((pass + 1)); echo "ok   ops-check.sh has no SET/RESET ROLE, SESSION AUTHORIZATION, set_config('role'), READ WRITE (P404R1-S1)"; fi

echo "test-ops-check: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
