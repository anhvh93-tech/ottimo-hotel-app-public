#!/usr/bin/env bash
# Periodic checks of one server – systemd timer ottimo-ops-check.timer (every 30 min), as the deploy user.
#   ops-check.sh            run every check, alert on failures
#   ops-check.sh j16        one check only (j16 | backup | disk | mem | tls | containers | http5xx | email_dead |
#                           email_missing | email_changes | email_ascii)
#
#   j16         SEC C6 / SR-RET-03: for every active property, the last retention_run of policy J16 with
#               status done must be < 26 h old (a property younger than 26 h without any run is fine), and no J16 run
#               may have status failed in the last 26 h. J16 runs hourly in the worker; one missed hour is normal,
#               a whole day means the worker or the job is broken – documents would outlive their deletion date.
#   backup      last successful backup.sh < 26 h (state/backup.last_ok)
#   disk        root filesystem < 80 % (hosting-plan 8)
#   mem         MemAvailable ≥ MEM_MIN_AVAIL_PCT (default 10 %) of RAM – staging + production share 4.8 GB (v1-production 3)
#   tls         certificate of DESK/STAFF/GUEST host valid > 14 days (Caddy renews at 30 days; this means renewal fails)
#   containers  postgres, api, worker, web running (api healthy); + landing when a landing tag is deployed. A failing
#               `docker compose` itself is reported as "docker compose failed, container state unknown: <category>", not
#               as "not running" (same for http5xx); j16 / email_dead report "query failed: <category>" – never the
#               raw error text (ARC CWD-03); email_missing, email_changes, email_ascii the same
#   http5xx     server errors answered by Caddy (web + landing) in the last 35 min < HTTP5XX_MAX (default 5): a
#               crashing api, a 502 from a dead upstream – before guests or staff report it
#   email_dead  staff e-mails (outbox topic staff.email: security notices – SEC 06.15 / 06.33 / Q51-6) that died with
#               NO_RECIPIENT in the last 24 h (the user has no e-mail address, so the notice reached nobody). Count only,
#               nothing from the payload is read. BUG-R3-032: until users can have an e-mail this is expected, so
#               it only reports. Set EMAIL_NO_RECIPIENT_ALERT=1 in .env only when ALL FOUR hold (ARC v1.0.3 tech plan
#               2.10, README 13.8): v1.0.3 (BUG-R3-032) runs on production; email_missing = 0; INV confirmed the
#               `email_changed` notice arrived; email_dead = 0 over the last 24 h. Then every such e-mail becomes a FAIL
#               (SEC `SEC-on-B2-readiness.md` 1.5 OPS (a); ARC PR23-02).
#   email_missing  active users holding a non-revoked OWN or MGR role who have no e-mail address (BUG-R3-032, ARC
#               v1.0.3 tech plan 2.10 condition 2): their security notices would die NO_RECIPIENT. READ ONLY
#               transaction, count only – no address, name or id is selected or printed. Report only until
#               EMAIL_NO_RECIPIENT_ALERT=1 (same switch as email_dead); armed, a count > 0 is a FAIL.
#   email_changes  v1.0.3 (SEC FB-R4-SEC-OPS-PR31-01, condition of the production deploy): no hard limit on successful
#               e-mail changes until v1.0.4, and the dispatcher sends 10 staff e-mails / min / property in FIFO order –
#               a flood of changes delays every other security notice. Counts, in a READ ONLY transaction, from
#               user_email_change (0091): changes in the last 24 h, in total and for the most-changed user; and from
#               outbox_message: staff.email rows still waiting (pending | failed | in_flight) and the age of the oldest.
#               FAIL (always, no switch) when one user > EMAIL_CHANGES_USER_MAX (5), or the total >
#               EMAIL_CHANGES_TOTAL_MAX (20) in 24 h, or the oldest waiting staff e-mail > STAFF_EMAIL_QUEUE_MAX_MIN (30)
#               min. The three limits can be tuned in .env (wins over the environment) but not switched off: each
#               must be a whole number in its range (1-20, 1-200, 5-240), otherwise the check FAILs. Numbers only – no
#               address, user id or payload is selected. Before 0091 (no table yet) the change counts read "not
#               present" and only the queue is judged. What to do on FAIL: runbook v1.0.3 "email_changes FAIL".
#   email_ascii  INT FB-R4-INT-BE-31-04: stored app_user.email values (not blank) outside the ASCII rule of the API
#               (normalizeSecurityEmail: local [a-z0-9._%+-]{1,64}, >= 2 labels [a-z0-9-]{1,63}, letter TLD, 3-254).
#               READ ONLY, count only, always report only: the SMTP adapter is tightened in v1.0.4 only at 0.
#
# Alerts (no personal data – only check names, property ids, ages): always to the journal
# (journalctl -t ottimo-alert -p err); plus ALERT_WEBHOOK_URL from /opt/ottimo/.env if set, sent when a check
# changes state (OK→FAIL, FAIL→OK) and again every 6 h while it stays failing. Exit 1 when any check fails.
# HEARTBEAT_URL (optional, .env – e.g. a free healthchecks.io check): pinged after every full run, `<url>/fail` when a
# check failed. The service e-mails INV/OPS when a ping says fail OR when pings stop (server down, timer stopped) –
# the alert path that does not depend on this server being alive. Only check names are sent.
# Note: with CLOCK_MODE=mutable (staging time-travel tests) run_at follows the fake clock – a J16 alert during such a
# test is expected.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
# Run by hand as `sudo -u ottimo …/ops-check.sh` the cwd is often a home the deploy user cannot enter: docker compose
# then fails with "stat .: permission denied" and every container looked "not running" (false FAIL alert 30/10 23:39).
# Nothing here uses a relative path – always start from /.
cd /
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
state="$OTTIMO_HOME/state/ops-check"
mkdir -p "$state"
dc() { "$here/dc" "$@"; }
# stderr of the docker compose / psql call being checked: a private file per run (mktemp = 0600), removed at exit –
# the raw message (an .env parse error can quote a line of .env) never stays on disk or leaves the server (ARC CWD-03,
# CWD-04 1). compose.stderr is the shared file of the 30/10 version: remove a leftover.
# A run killed with SIGKILL cannot clean up: files of runs older than 60 min are removed (a parallel run by hand keeps
# its own). SIGTERM/SIGINT (systemd stop, shutdown, Ctrl+C) end through exit, so the EXIT trap runs (SEC PR23-06).
rm -f "$state/compose.stderr"
find "$state" -maxdepth 1 -name 'cmd-stderr.*' -type f -mmin +60 -delete 2>/dev/null || true
cmd_err=$(mktemp "$state/cmd-stderr.XXXXXX")
trap 'rm -f "$cmd_err"' EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
# Why a docker compose or psql call failed, as a fixed category (ARC FB-R3-ARC-OPS-CWD-03): its raw message is never
# forwarded to the journal or the webhook. Order matters: the psql socket error also says "No such file or directory".
# Details: run the check by hand (`…/bin/dc ps`, `…/ops-check.sh j16`) and read the error on the terminal.
cmd_failed() {
  if grep -qi 'permission denied' "$cmd_err" 2>/dev/null; then echo "permission denied (current directory or stack files)"
  elif grep -qiE 'cannot connect to the docker daemon|docker\.sock' "$cmd_err" 2>/dev/null; then echo "Docker daemon unreachable"
  elif grep -qiE 'service "?postgres"? is not running|no container found' "$cmd_err" 2>/dev/null; then echo "postgres container not running"
  elif grep -qiE 'could not connect|connection to server .*failed|connection refused|database system is (starting up|shutting down|in recovery)|server closed the connection' "$cmd_err" 2>/dev/null; then echo "database unreachable"
  elif grep -qE 'ERROR:' "$cmd_err" 2>/dev/null; then echo "query error"
  elif grep -qiE 'no such file|not found' "$cmd_err" 2>/dev/null; then echo "stack file missing"
  else echo "other error – run it by hand"
  fi
}
compose_failed() { echo "docker compose failed, container state unknown: $(cmd_failed)"; }
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }

J16_MAX_HOURS="${J16_MAX_HOURS:-26}"
BACKUP_MAX_HOURS="${BACKUP_MAX_HOURS:-26}"
DISK_MAX_PCT="${DISK_MAX_PCT:-80}"
TLS_MIN_DAYS="${TLS_MIN_DAYS:-14}"
REMIND_SECONDS="${REMIND_SECONDS:-21600}"
HTTP5XX_MAX="${HTTP5XX_MAX:-5}"
MEM_MIN_AVAIL_PCT="${MEM_MIN_AVAIL_PCT:-10}"
EMAIL_DEAD_HOURS="${EMAIL_DEAD_HOURS:-24}"
for v in J16_MAX_HOURS BACKUP_MAX_HOURS DISK_MAX_PCT TLS_MIN_DAYS REMIND_SECONDS HTTP5XX_MAX MEM_MIN_AVAIL_PCT EMAIL_DEAD_HOURS; do
  [[ "${!v}" =~ ^[0-9]+$ ]] || { echo "$v must be a number" >&2; exit 2; }
done
host_name=$(hostname -s 2>/dev/null || echo server)
app_env=$(envval APP_ENV)

notify() { # check status message
  local check="$1" status="$2" msg="$3" file="$state/$1" prev="" last=0 now
  now=$(date -u +%s)
  if [ -r "$file" ]; then read -r prev last < "$file" || true; fi
  if [ "$status" = "FAIL" ]; then
    logger -t ottimo-alert -p user.err -- "[$app_env] $check FAIL: $msg" 2>/dev/null || true
    echo "FAIL $check: $msg"
  else
    echo "ok   $check: $msg"
  fi
  local send=0
  if [ "$status" != "${prev:-OK}" ]; then send=1; fi
  if [ "$status" = "FAIL" ] && [ $((now - ${last:-0})) -ge "$REMIND_SECONDS" ]; then send=1; fi
  local url
  url=$(envval ALERT_WEBHOOK_URL)
  if [ "$send" -eq 1 ] && [ -n "$url" ] && { [ "$status" = "FAIL" ] || [ -n "$prev" ]; }; then
    local text="OTTIMO $app_env ($host_name): $check $status – $msg"
    curl --silent --show-error --max-time 10 -H 'Content-Type: application/json' \
      --data "$(jq -cn --arg t "$text" '{text: $t}')" "$url" >/dev/null || logger -t ottimo-alert -- "webhook failed" || true
    last=$now
  fi
  echo "$status ${last:-0}" > "$file"
}

psql_admin() {
  dc exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -F "|"'
}
# Same, in a READ ONLY transaction (any write is refused by the server): checks that only count.
psql_ro() {
  dc exec -T postgres sh -c 'PGOPTIONS="-c default_transaction_read_only=on" psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -F "|"'
}
# EMAIL_NO_RECIPIENT_ALERT: .env wins over the environment only when set there (the timer has no environment of its own).
email_alert_armed() {
  local armed
  armed=$(envval EMAIL_NO_RECIPIENT_ALERT); echo "${armed:-${EMAIL_NO_RECIPIENT_ALERT:-0}}"
}

# A limit of email_changes: .env wins over the environment, then the default; a whole number in [min, max] (SEC PR31-01:
# tunable, never switched off – 0, a word or a huge number is refused, and the check FAILs instead of passing).
email_limit() { # name default min max
  local v
  v=$(envval "$1"); v="${v:-${!1:-$2}}"
  if [[ "$v" =~ ^[0-9]{1,4}$ ]] && [ "$((10#$v))" -ge "$3" ] && [ "$((10#$v))" -le "$4" ]; then echo "$((10#$v))"; else echo ERR; fi
}

check_j16() {
  local out bad=""
  if ! out=$(psql_admin <<SQL 2>"$cmd_err"
SELECT p.id,
       COALESCE(EXTRACT(EPOCH FROM now() - max(r.run_at) FILTER (WHERE r.status = 'done'))::bigint, -1),
       EXTRACT(EPOCH FROM now() - p.created_at)::bigint,
       count(*) FILTER (WHERE r.status = 'failed' AND r.run_at > now() - interval '$J16_MAX_HOURS hours')
  FROM property p
  LEFT JOIN retention_run r ON r.property_id = p.id AND r.policy_key = 'J16'
 WHERE p.status = 'active'
 GROUP BY p.id, p.created_at;
SQL
  ); then
    notify j16 FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  local limit=$((J16_MAX_HOURS * 3600)) n=0
  while IFS='|' read -r pid age prop_age failed; do
    [ -n "$pid" ] || continue
    n=$((n + 1))
    if [ "$age" -lt 0 ]; then
      [ "$prop_age" -ge "$limit" ] && bad+=" property $pid: J16 never ran;"
    elif [ "$age" -ge "$limit" ]; then
      bad+=" property $pid: last J16 $((age / 3600)) h ago;"
    fi
    [ "$failed" -gt 0 ] && bad+=" property $pid: $failed failed J16 run(s);"
  done <<<"$out"
  if [ -n "$bad" ]; then bad="${bad# }"; notify j16 FAIL "${bad%;}"; return 1; fi
  notify j16 OK "$n active propert(y/ies), last J16 < ${J16_MAX_HOURS} h"
}

check_backup() {
  local f="$OTTIMO_HOME/state/backup.last_ok" t age
  if [ ! -r "$f" ]; then notify backup FAIL "no successful backup recorded"; return 1; fi
  t=$(date -u -d "$(cat "$f")" +%s 2>/dev/null || echo 0)
  age=$(( $(date -u +%s) - t ))
  if [ "$age" -ge $((BACKUP_MAX_HOURS * 3600)) ]; then
    notify backup FAIL "last successful backup $((age / 3600)) h ago"; return 1
  fi
  notify backup OK "last backup $((age / 3600)) h ago"
}

check_disk() {
  local pct
  pct=$(df -P / | awk 'NR == 2 { gsub("%", "", $5); print $5 }')
  if [ "$pct" -ge "$DISK_MAX_PCT" ]; then notify disk FAIL "/ is ${pct}% full"; return 1; fi
  notify disk OK "/ ${pct}%"
}

check_mem() {
  local total avail pct
  total=$(awk '/^MemTotal:/ { print $2 }' /proc/meminfo)
  avail=$(awk '/^MemAvailable:/ { print $2 }' /proc/meminfo)
  pct=$(( avail * 100 / total ))
  if [ "$pct" -lt "$MEM_MIN_AVAIL_PCT" ]; then notify mem FAIL "only ${pct}% RAM available ($((avail / 1024)) MB)"; return 1; fi
  notify mem OK "${pct}% RAM available ($((avail / 1024)) MB)"
}

check_tls() {
  local h end days bad="" port
  port=$(envval PUBLIC_HTTPS_PORT); port="${port:-443}"
  local hosts=("$(envval DESK_HOST)" "$(envval STAFF_HOST)" "$(envval GUEST_HOST)")
  [ -s "$OTTIMO_HOME/state/landing_tag" ] && hosts+=("$(envval LANDING_HOST)" "$(envval LANDING_WWW_HOST)")
  for h in "${hosts[@]}"; do
    end=$(echo | openssl s_client -connect "${SMOKE_ADDR:-127.0.0.1}:$port" -servername "$h" 2>/dev/null \
      | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2) || true
    if [ -z "$end" ]; then bad+=" $h: no certificate;"; continue; fi
    days=$(( ($(date -u -d "$end" +%s) - $(date -u +%s)) / 86400 ))
    [ "$days" -lt "$TLS_MIN_DAYS" ] && bad+=" $h: expires in $days days;"
  done
  if [ -n "$bad" ]; then bad="${bad# }"; notify tls FAIL "${bad%;}"; return 1; fi
  notify tls OK "certificates valid > $TLS_MIN_DAYS days"
}

check_containers() {
  local s ids missing="" n_api=0
  local services=(postgres api worker web)
  [ -s "$OTTIMO_HOME/state/landing_tag" ] && services+=(landing)
  # A failing `docker compose` (cwd, daemon, .env) is NOT "container not running": report it as such, with its error.
  for s in "${services[@]}"; do
    if ! ids=$(dc ps --status running --quiet "$s" 2>"$cmd_err"); then
      notify containers FAIL "$(compose_failed)"; return 1
    fi
    [ -n "$ids" ] || missing+=" $s"
    [ "$s" != api ] || n_api=$(grep -c . <<<"$ids" || true)
  done
  if [ -n "$missing" ]; then notify containers FAIL "not running:$missing"; return 1; fi
  # US155-04 / SEC FB-R3-SEC-US155-04: the public form limits (step 0 counters, in-flight cap) live in the api
  # process – exactly ONE api replica (README infra/server 12.2 "API chạy 1 bản").
  if [ "$n_api" != "1" ]; then notify containers FAIL "$n_api api replicas running (must be exactly 1)"; return 1; fi
  if ! dc exec -T api wget -qO- http://127.0.0.1:3000/health 2>/dev/null | grep -q '"status":"ok"'; then
    notify containers FAIL "api /health not ok"; return 1
  fi
  notify containers OK "${services[*]} running, api healthy"
}

check_http5xx() {
  local svc=(web) n
  [ -s "$OTTIMO_HOME/state/landing_tag" ] && svc+=(landing)
  # Caddy access log lines are JSON with "status":<code>; count 5xx answers of the last 35 minutes.
  local logs
  if ! logs=$(dc logs --no-color --no-log-prefix --since 35m "${svc[@]}" 2>"$cmd_err"); then
    notify http5xx FAIL "$(compose_failed)"; return 1
  fi
  n=$(grep -c '"status":5[0-9][0-9]' <<<"$logs" || true)
  if [ "${n:-0}" -ge "$HTTP5XX_MAX" ]; then notify http5xx FAIL "$n server errors (5xx) in 35 min"; return 1; fi
  notify http5xx OK "${n:-0} server errors (5xx) in 35 min"
}

check_email_dead() {
  local out n armed
  armed=$(email_alert_armed)
  [[ "$armed" =~ ^[01]$ ]] || { notify email_dead FAIL "EMAIL_NO_RECIPIENT_ALERT must be 0 or 1"; return 1; }
  if ! out=$(psql_admin <<SQL 2>"$cmd_err"
SELECT count(*) FROM outbox_message
 WHERE topic = 'staff.email' AND status = 'dead' AND last_error = 'NO_RECIPIENT'
   AND created_at > now() - interval '$EMAIL_DEAD_HOURS hours';
SQL
  ); then
    notify email_dead FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  n=$(tr -d '[:space:]' <<<"$out")
  [[ "$n" =~ ^[0-9]+$ ]] || { notify email_dead FAIL "unexpected answer"; return 1; }
  if [ "$n" -gt 0 ] && [ "$armed" = "1" ]; then
    notify email_dead FAIL "$n staff e-mail(s) dead NO_RECIPIENT in ${EMAIL_DEAD_HOURS} h – a security notice reached nobody"
    return 1
  fi
  if [ "$armed" = "1" ]; then
    notify email_dead OK "$n staff e-mail(s) dead NO_RECIPIENT in ${EMAIL_DEAD_HOURS} h"
  else
    notify email_dead OK "$n staff e-mail(s) dead NO_RECIPIENT in ${EMAIL_DEAD_HOURS} h (report only until EMAIL_NO_RECIPIENT_ALERT=1, BUG-R3-032)"
  fi
}

check_email_missing() {
  local out n armed
  armed=$(email_alert_armed)
  [[ "$armed" =~ ^[01]$ ]] || { notify email_missing FAIL "EMAIL_NO_RECIPIENT_ALERT must be 0 or 1"; return 1; }
  # Columns of 0000 (app_user.email citext NULL, status; user_property_role.role, revoked_at): works before and after 0091.
  if ! out=$(psql_ro <<'SQL' 2>"$cmd_err"
SELECT count(*) FROM app_user u
 WHERE u.status = 'active' AND (u.email IS NULL OR u.email::text = '')
   AND EXISTS (SELECT 1 FROM user_property_role r
                WHERE r.user_id = u.id AND r.role IN ('owner', 'manager') AND r.revoked_at IS NULL);
SQL
  ); then
    notify email_missing FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  n=$(tr -d '[:space:]' <<<"$out")
  [[ "$n" =~ ^[0-9]+$ ]] || { notify email_missing FAIL "unexpected answer"; return 1; }
  if [ "$n" -gt 0 ] && [ "$armed" = "1" ]; then
    notify email_missing FAIL "$n active OWN/MGR user(s) without e-mail – their security notices reach nobody"
    return 1
  fi
  if [ "$armed" = "1" ]; then
    notify email_missing OK "$n active OWN/MGR user(s) without e-mail"
  else
    notify email_missing OK "$n active OWN/MGR user(s) without e-mail (report only until EMAIL_NO_RECIPIENT_ALERT=1, BUG-R3-032)"
  fi
}

check_email_changes() {
  local out umax tmax qmax v name val range line has=0 hasq=0 total=-1 top=-1 waiting=0 age=0 bad="" chg
  umax=$(email_limit EMAIL_CHANGES_USER_MAX 5 1 20)
  tmax=$(email_limit EMAIL_CHANGES_TOTAL_MAX 20 1 200)
  qmax=$(email_limit STAFF_EMAIL_QUEUE_MAX_MIN 30 5 240)
  for v in "EMAIL_CHANGES_USER_MAX|$umax|1-20" "EMAIL_CHANGES_TOTAL_MAX|$tmax|1-200" "STAFF_EMAIL_QUEUE_MAX_MIN|$qmax|5-240"; do
    IFS='|' read -r name val range <<<"$v"
    if [ "$val" = ERR ]; then notify email_changes FAIL "$name must be a whole number $range"; return 1; fi
  done
  # One READ ONLY session. user_email_change exists from 0091 on: \if keeps the script valid on DB 67 (v1.0.2).
  # Only counts and an age in seconds leave the database – no address, id or payload.
  if ! out=$(psql_ro <<'SQL' 2>"$cmd_err"
SELECT to_regclass('public.user_email_change') IS NOT NULL AS has_uec \gset
\if :has_uec
SELECT 'changes', coalesce(sum(n), 0), coalesce(max(n), 0) FROM (
  SELECT count(*) AS n FROM user_email_change
   WHERE changed_at > now() - interval '24 hours' GROUP BY user_id) s;
\else
SELECT 'changes', -1, -1;
\endif
SELECT 'queue', count(*), coalesce(extract(epoch FROM now() - min(created_at))::bigint, 0) FROM outbox_message
 WHERE topic = 'staff.email' AND status IN ('pending', 'failed', 'in_flight');
SQL
  ); then
    notify email_changes FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  # Exactly one "changes" and one "queue" line of numbers; anything else (a stray value) is never printed.
  while IFS= read -r line; do
    line=$(tr -d '[:space:]' <<<"$line")
    [ -n "$line" ] || continue
    if [[ "$line" =~ ^changes\|(-1|[0-9]+)\|(-1|[0-9]+)$ ]] && [ "$has" -eq 0 ]; then
      total=${BASH_REMATCH[1]}; top=${BASH_REMATCH[2]}; has=1
    elif [[ "$line" =~ ^queue\|([0-9]+)\|(-?[0-9]+)$ ]] && [ "$hasq" -eq 0 ]; then
      waiting=${BASH_REMATCH[1]}; age=${BASH_REMATCH[2]}; hasq=1
    else
      notify email_changes FAIL "unexpected answer"; return 1
    fi
  done <<<"$out"
  if [ "$has" -ne 1 ] || [ "$hasq" -ne 1 ] || { [ "$total" = -1 ] && [ "$top" != -1 ]; } \
    || { [ "$total" != -1 ] && [ "$top" = -1 ]; }; then
    notify email_changes FAIL "unexpected answer"; return 1
  fi
  [ "$age" -ge 0 ] || age=0   # clock skew between created_at and now()
  age=$((age / 60))
  if [ "$total" -ge 0 ]; then
    [ "$top" -gt "$umax" ] && bad+=" $top e-mail changes for one user in 24 h (limit $umax);"
    [ "$total" -gt "$tmax" ] && bad+=" $total e-mail changes in 24 h (limit $tmax);"
    chg="$total e-mail change(s) in 24 h, max $top for one user (limits $umax / user, $tmax total)"
  else
    chg="e-mail changes: table not present yet (before migration 0091)"
  fi
  [ "$waiting" -gt 0 ] && [ "$age" -gt "$qmax" ] && bad+=" oldest waiting staff e-mail $age min old (limit $qmax min) – security notices delayed;"
  if [ -n "$bad" ]; then
    bad="${bad# }"
    notify email_changes FAIL "${bad%;} – runbook v1.0.3: lock the flooding account, tell SEC"
    return 1
  fi
  notify email_changes OK "$chg; staff.email queue: $waiting waiting, oldest $age min (limit $qmax min)"
}

check_email_ascii() {
  local out n
  # Stored addresses the v1.0.3 API rule (shared/email.ts normalizeSecurityEmail: trim + lower case, then the shape)
  # would refuse – what the adapter may still be handed (legacy rows, SQL by hand). Blank = no address (email_missing),
  # not counted. Only count(*) leaves the database.
  if ! out=$(psql_ro <<'SQL' 2>"$cmd_err"
SELECT count(*) FROM (SELECT lower(btrim(email::text)) AS e FROM app_user WHERE email IS NOT NULL) a
 WHERE a.e <> ''
   AND NOT (char_length(a.e) BETWEEN 3 AND 254 AND a.e ~ '^[a-z0-9._%+-]{1,64}@([a-z0-9-]{1,63}\.)+[a-z]{2,63}$');
SQL
  ); then
    notify email_ascii FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  n=$(tr -d '[:space:]' <<<"$out")
  [[ "$n" =~ ^[0-9]+$ ]] || { notify email_ascii FAIL "unexpected answer"; return 1; }
  notify email_ascii OK "$n stored e-mail address(es) outside the ASCII rule (report only – INT v1.0.4 tightens the adapter only at 0)"
}

if [ "$#" -gt 0 ]; then checks=("$@"); full=0; else checks=(containers j16 backup disk mem tls http5xx email_dead email_missing email_changes email_ascii); full=1; fi
rc=0
failed=""
for c in "${checks[@]}"; do
  ok=1
  case "$c" in
    j16) check_j16 || ok=0 ;;
    backup) check_backup || ok=0 ;;
    disk) check_disk || ok=0 ;;
    mem) check_mem || ok=0 ;;
    tls) check_tls || ok=0 ;;
    containers) check_containers || ok=0 ;;
    http5xx) check_http5xx || ok=0 ;;
    email_dead) check_email_dead || ok=0 ;;
    email_missing) check_email_missing || ok=0 ;;
    email_changes) check_email_changes || ok=0 ;;
    email_ascii) check_email_ascii || ok=0 ;;
    *) echo "unknown check: $c" >&2; rc=2; continue ;;
  esac
  if [ "$ok" -eq 0 ]; then failed+=" $c"; [ "$rc" -eq 2 ] || rc=1; fi
done
hb=$(envval HEARTBEAT_URL)
if [ "$full" -eq 1 ] && [ -n "$hb" ]; then
  if [ "$rc" -eq 0 ]; then
    curl -fsS --max-time 10 --retry 3 -o /dev/null "$hb" || logger -t ottimo-alert -- "heartbeat ping failed" || true
  else
    curl -fsS --max-time 10 --retry 3 -o /dev/null --data-raw "failed:$failed" "$hb/fail" \
      || logger -t ottimo-alert -- "heartbeat fail ping failed" || true
  fi
fi
exit "$rc"
