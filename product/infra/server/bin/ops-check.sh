#!/usr/bin/env bash
# Periodic checks of one server – systemd timer ottimo-ops-check.timer (every 30 min), as the deploy user.
#   ops-check.sh            run every check, alert on failures
#   ops-check.sh j16        one check only (j16 | backup | disk | mem | tls | containers | http5xx | email_dead |
#                           email_missing | email_changes | email_ascii | email_config | pricelimit | pricegap |
#                           priceswitch | db_triggers | sshkeys | journal)
#
# R4 v1.0.4 (P4-04; SEC FB-R4-SEC-OPS-PR32-S1, ARC FB-R4-ARC-OPS-PR30-09): EVERY database check (j16, email_*,
# pricegap (static part), priceswitch, db_triggers) runs as the role ottimo_readonly (NOLOGIN, BYPASSRLS, SELECT only – taken at connect with
# PGOPTIONS "-c role=ottimo_readonly") inside a READ ONLY transaction. Each session first answers a guard row: current
# role = ottimo_readonly, BYPASSRLS, not superuser, transaction read only. Anything else (role missing, a role without
# BYPASSRLS whose counts would silently read 0) is never parsed: the check FAILs "unexpected answer". No check uses
# the superuser role any more. "-c role=" guards against mistakes, it is NOT a security boundary: the session is the
# superuser's, and SQL that resets the role (SET ROLE NONE, RESET ROLE, SESSION AUTHORIZATION) or turns READ ONLY off
# would escape it (SEC FB-R4-SEC-OPS-P404R1-S1). So every SQL here is constant text; test-ops-check.sh refuses such
# statements in this file.
#
#   j16         SEC C6 / SR-RET-03: for every active property, the last retention_run of policy J16 with
#               status done must be < 26 h old (a property younger than 26 h without any run is fine), and no J16 run
#               may have status failed in the last 26 h. J16 runs hourly in the worker; one missed hour is normal,
#               a whole day means the worker or the job is broken – documents would outlive their deletion date.
#   backup      last successful backup.sh < BACKUP_MAX_HOURS (default 14 h – v1.0.5 V5-62: runs at 03:00 + 15:00,
#               staging 03:30 + 15:30, 12 h apart; one missed run is a FAIL within about 2 h) (state/backup.last_ok)
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
#   email_missing  active or locked users (the dispatcher writes to both – ARC FB-R4-ARC-OPS-PR30-08, v1.0.4) holding
#               a non-revoked OWN or MGR role who have no e-mail address (BUG-R3-032, ARC
#               v1.0.3 tech plan 2.10 condition 2): their security notices would die NO_RECIPIENT. READ ONLY
#               transaction, count only – no address, name or id is selected or printed. Report only until
#               EMAIL_NO_RECIPIENT_ALERT=1 (same switch as email_dead); armed, a count > 0 is a FAIL.
#   email_changes  v1.0.3 (SEC FB-R4-SEC-OPS-PR31-01, condition of the production deploy): no hard limit on successful
#               e-mail changes until v1.0.4, and the dispatcher sends 10 staff e-mails / min / property in FIFO order –
#               a flood of changes delays every other security notice. Counts, in a READ ONLY transaction, from
#               user_email_change (0091): changes in the last 24 h, in total and for the most-changed user; and from
#               outbox_message: staff.email rows still waiting (pending | failed | in_flight) and the age of the oldest.
#               v1.0.4 (SEC FB-R4-SEC-OPS-PR32-02 (b)): also `via owner: <n>` = changes of the 24 h made by an owner
#               (user_email_change.via = 'owner'), count only – tells ORC which branch of runbook F applies.
#               FAIL (always, no switch) when one user > EMAIL_CHANGES_USER_MAX (5), or the total >
#               EMAIL_CHANGES_TOTAL_MAX (20) in 24 h, or the oldest waiting staff e-mail > STAFF_EMAIL_QUEUE_MAX_MIN (30)
#               min. The three limits can be tuned in .env (wins over the environment) but not switched off: each
#               must be a whole number in its range (1-20, 1-200, 5-240), otherwise the check FAILs. Numbers only – no
#               address, user id or payload is selected. Before 0091 (no table yet) the change counts read "not
#               present" and only the queue is judged. What to do on FAIL: runbook v1.0.3 "email_changes FAIL".
#   email_ascii  INT FB-R4-INT-BE-31-04: stored app_user.email values (not blank) outside the ASCII rule of the API
#               (integrations/notification/email-address.ts: local [a-z0-9._%+-]{1,64}, >= 2 labels [a-z0-9-]{1,63},
#               letter TLD, 3-254 – EMAIL_RULE_RE below, shared with email_config). READ ONLY, count only. v1.0.4: the
#               SMTP adapter enforces the rule, so a count > 0 is a FAIL (security e-mails to that person fail).
#   email_config v1.0.4 (SEC V104-04 items 3-4, runbook v1.0.4 P2c/P2d): the mail settings of .env checked with the SAME
#               rule as email_ascii – EMAIL_FROM (or EMAIL_SMTP_USER when empty) and EMAIL_SMTP_USER as given (case
#               free, no surrounding space: isEmailAddress), every entry of EMAIL_SHARED_MAILBOXES after trim + lower
#               case (split on space , ;). Only words and counts are printed – never an address. FAIL: a setting or
#               an entry outside the rule (worker / api v1.0.4 would stop at start), or EMAIL_SHARED_MAILBOXES set on
#               more than one line. Unset EMAIL_SHARED_MAILBOXES is ok (the default rule applies; api warns – K5b).
#               Only when EMAIL_PROVIDER=smtp.
#   db_triggers  v1.0.4 (plan P4-04, P4-13 PN-01; P4-11 ED-02): the guard triggers are there and enabled ('O'):
#               privacy_notice_version_append_only + privacy_notice_version_no_truncate (both required), and
#               room_list_price_append_only (migration 0094 – absent before it: reported, not a FAIL; present but not
#               'O' or SECURITY DEFINER: FAIL). Also ottimo_app may only SELECT privacy_notice_version. READ ONLY,
#               names and flags only. Disabling a trigger by hand is never the fix (README 13.7).
#   pricelimit  R4 LP-v2 (SEC SR-PE-16, C9; ARC FB-R4-ARC-OPS-LPV2-01 (7)): answers 429 + 503 of the landing route
#               GET /v1/public/properties/<slug>/price-estimate in the last 60 min < PRICE_REFUSED_MAX (default 200)
#               – a scraper or a flood keeps the price block hidden for real guests (the form itself keeps working).
#               Only when a landing is deployed. Counted from the landing Caddy access log (query already masked)
#   pricegap    R4 LP-v2 (ARC L9 – no Desk notification in LP-v2), two independent parts – FAIL when either is > 0:
#               log: the api logged `public_price_missing` in the last 24 h = a room without a list price for a night
#               was left out of the website estimate (BE logs it once per room and business day);
#               static (v1.0.5 V5-73, SEC FB-R4-SEC-OPS-S6D-01, SEC-on-lp-v2-s6d.md 6.4): READ ONLY count of rooms
#               that are sellable, have a website room type, start within 365 days (the web arrival window, BR-112)
#               and have not ended, yet have NO list price row effective on their first sellable day from today
#               (greatest(active_from, today), today in the property's time zone) – such a gap only shows in the log
#               when a guest happens to ask for that type and date. Prices are append-only and a later row replaces
#               an earlier one, so one row on that day covers every later night. One number only – no id selected.
#               The alert says only how many rooms; a failed query or an answer that is not a number is a FAIL,
#               never read as 0
#   priceswitch R4 LP-v2 (SEC SR-PE-16, Should; SEC FB-R4-SEC-OPS-LPV2-04): the Desk switch `public_show_prices` was
#               changed since the last run (audit `config.changed`, entity config_parameter, followed by audit id in
#               state/ops-check/priceswitch.last_id – no time window, so a late or skipped timer run misses nothing).
#               Every run that finds new changes sends its own webhook (the 6 h de-duplication does not apply): the
#               number of changes and the newest value (true/false/other) only. First run: the newest id becomes the
#               mark, nothing is reported. The next run without a change sends the recovery once
#   sshkeys     v1.0.5 V5-65 (SEC FB-R4-SEC-OPS-OR-03): every key line of the deploy user's authorized_keys (and
#               authorized_keys2, which sshd also reads by default) has a forced command – both `command="…"` and
#               `restrict` in its options, like the CI key (deploy-from-ci.sh) and the backup-pull key (rrsync -ro).
#               A person key (bootstrap --deploy-key, first boot only) gives a shell in the docker group = root
#               without a sudo log line: people go through ottimo-admin + sudo. Counts only – no key, fingerprint or
#               comment is printed. authorized_keys missing or unreadable is a FAIL. OPS_CHECK_SSH_DIR = another
#               .ssh directory (tests)
#   journal     v1.0.5 V5-63 (ARC contract 0.3.13 1.15; SEC FB-R5-SEC-ARC-07): container logs live in the host journal
#               (Docker log driver journald, journald.conf.d/50-ottimo.conf: MaxRetentionSec=90day, MaxFileSec=1day).
#               FAIL when: a running container of this stack does not log to journald; the journal cannot be read
#               (the ops-check unit runs with SupplementaryGroups=systemd-journal); the oldest entry is > 91 days old
#               (the 90-day cap is not applied); /var/log/journal is not root:systemd-journal or a journal file is
#               readable by everyone; a group that can read the logs (adm, systemd-journal; docker through
#               `docker logs`) has a member outside the allowed list (LOG_READER_USERS in .env, default
#               "syslog ottimo-admin"; docker: the deploy user only). WARN (alert once, run still passes) when: the
#               oldest entry is younger than min(90, days since state/journald_since) − 1 – rotated early, i.e.
#               SystemMaxUse reached or a log flood (reset state/journald_since after looking); journald wrote
#               "Suppressed N messages" in the last 24 h (RateLimitBurst reached – lines were dropped). Counts and ages
#               only. OPS_CHECK_JOURNALCTL / _JOURNAL_DIR / _JOURNAL_OWNER / _GETENT = stand-ins (tests)
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
BACKUP_MAX_HOURS="${BACKUP_MAX_HOURS:-14}"
DISK_MAX_PCT="${DISK_MAX_PCT:-80}"
TLS_MIN_DAYS="${TLS_MIN_DAYS:-14}"
REMIND_SECONDS="${REMIND_SECONDS:-21600}"
HTTP5XX_MAX="${HTTP5XX_MAX:-5}"
MEM_MIN_AVAIL_PCT="${MEM_MIN_AVAIL_PCT:-10}"
EMAIL_DEAD_HOURS="${EMAIL_DEAD_HOURS:-24}"
PRICE_REFUSED_MAX="${PRICE_REFUSED_MAX:-200}"
for v in J16_MAX_HOURS BACKUP_MAX_HOURS DISK_MAX_PCT TLS_MIN_DAYS REMIND_SECONDS HTTP5XX_MAX MEM_MIN_AVAIL_PCT EMAIL_DEAD_HOURS \
  PRICE_REFUSED_MAX; do
  [[ "${!v}" =~ ^[0-9]+$ ]] || { echo "$v must be a number" >&2; exit 2; }
done
host_name=$(hostname -s 2>/dev/null || echo server)
app_env=$(envval APP_ENV)

notify() { # check status message [force – send the webhook even if the status did not change, e.g. a new event]
  local check="$1" status="$2" msg="$3" force="${4:-}" file="$state/$1" prev="" last=0 now
  now=$(date -u +%s)
  if [ -r "$file" ]; then read -r prev last < "$file" || true; fi
  if [ "$status" = "FAIL" ]; then
    logger -t ottimo-alert -p user.err -- "[$app_env] $check FAIL: $msg" 2>/dev/null || true
    echo "FAIL $check: $msg"
  elif [ "$status" = "WARN" ]; then
    # v1.0.5 (journal): worth a look, not an outage – alerted when it starts, no 6-hourly reminder, run still passes.
    logger -t ottimo-alert -p user.warning -- "[$app_env] $check WARN: $msg" 2>/dev/null || true
    echo "WARN $check: $msg"
  else
    echo "ok   $check: $msg"
  fi
  local send=0
  if [ "$status" != "${prev:-OK}" ]; then send=1; fi
  if [ "$force" = force ]; then send=1; fi
  if [ "$status" = "FAIL" ] && [ $((now - ${last:-0})) -ge "$REMIND_SECONDS" ]; then send=1; fi
  local url
  url=$(envval ALERT_WEBHOOK_URL)
  if [ "$send" -eq 1 ] && [ -n "$url" ] && { [ "$status" != "OK" ] || [ -n "$prev" ]; }; then
    local text="OTTIMO $app_env ($host_name): $check $status – $msg"
    curl --silent --show-error --max-time 10 -H 'Content-Type: application/json' \
      --data "$(jq -cn --arg t "$text" '{text: $t}')" "$url" >/dev/null || logger -t ottimo-alert -- "webhook failed" || true
    last=$now
  fi
  echo "$status ${last:-0}" > "$file"
}

# Every database check (SEC PR32-S1, ARC PR30-09): role ottimo_readonly, READ ONLY transaction (any write is refused
# by the server and by the role's grants). The SQL of the check comes on stdin; the guard row is sent first and must
# answer exactly "ro-ok" – then only the check's own rows are passed on. Otherwise "ro-guard" is passed on instead (no
# number), so every check FAILs "unexpected answer". An ERROR (e.g. role ottimo_readonly missing) is a query failure.
RO_GUARD_SQL="SELECT CASE WHEN current_user = 'ottimo_readonly' AND current_setting('transaction_read_only') = 'on'
  AND (SELECT rolbypassrls AND NOT rolsuper FROM pg_roles WHERE rolname = current_user) THEN 'ro-ok' ELSE 'ro-bad' END;"
psql_ro() {
  local sql out
  sql=$(cat)
  out=$(printf '%s\n%s\n' "$RO_GUARD_SQL" "$sql" | dc exec -T postgres sh -c \
    'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly" psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -F "|"') \
    || return
  if [ "$(head -n 1 <<<"$out")" != ro-ok ]; then echo ro-guard; return 0; fi
  tail -n +2 <<<"$out"
}
# THE e-mail address rule (INT integrations/notification/email-address.ts – change both together): after trim + lower
# case, local [a-z0-9._%+-]{1,64}, >= 2 labels [a-z0-9-]{1,63}, the last letters only, 3-254 characters. Used as is in
# the SQL of email_ascii (POSIX regex, same meaning) and by email_config in bash – one text, so the two never drift.
EMAIL_RULE_RE='^[a-z0-9._%+-]{1,64}@([a-z0-9-]{1,63}\.)+[a-z]{2,63}$'
trim() { local v="$1"; v="${v#"${v%%[![:space:]]*}"}"; printf '%s' "${v%"${v##*[![:space:]]}"}"; }  # like String.trim()
email_rule() { # address as stored / normalised (already trimmed + lower case) → 0 when it follows the rule
  [[ "$1" != *$'\n'* ]] && [ "${#1}" -ge 3 ] && [ "${#1}" -le 254 ] && LC_ALL=C grep -qE -- "$EMAIL_RULE_RE" <<<"$1"
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
  if ! out=$(psql_ro <<SQL 2>"$cmd_err"
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
  local limit=$((J16_MAX_HOURS * 3600)) n=0 line
  # Every line is "<property id>|<age s, -1 = never>|<property age s>|<failed runs>" (ages may be negative under a
  # mutable test clock) – anything else is never parsed.
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    [[ "$line" =~ ^[0-9A-Za-z-]{1,64}\|-?[0-9]+\|-?[0-9]+\|[0-9]+$ ]] || { notify j16 FAIL "unexpected answer"; return 1; }
  done <<<"$out"
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
  local s ids missing="" n_api=0 cid st n pcid pn restarted="" rfile="$state/containers.restarts" base="" i=0
  local first=()
  local services=(postgres api worker web)
  [ -s "$OTTIMO_HOME/state/landing_tag" ] && services+=(landing)
  # A failing `docker compose` (cwd, daemon, .env) is NOT "container not running": report it as such, with its error.
  for s in "${services[@]}"; do
    if ! ids=$(dc ps --status running --quiet "$s" 2>"$cmd_err"); then
      notify containers FAIL "$(compose_failed)"; return 1
    fi
    [ -n "$ids" ] || missing+=" $s"
    first+=("$(head -n 1 <<<"$ids")")
    [ "$s" != api ] || n_api=$(grep -c . <<<"$ids" || true)
  done
  if [ -n "$missing" ]; then notify containers FAIL "not running:$missing"; return 1; fi
  # US155-04 / SEC FB-R3-SEC-US155-04: the public form limits (step 0 counters, in-flight cap) live in the api
  # process – exactly ONE api replica (README infra/server 12.2 "API chạy 1 bản").
  if [ "$n_api" != "1" ]; then notify containers FAIL "$n_api api replicas running (must be exactly 1)"; return 1; fi
  # v1.0.4 (ARC FB-R4-ARC-OPS-P402-01 / P404-04, same test as worker_ok of deploy.sh): with `restart: unless-stopped`
  # a container that dies and is restarted in a loop is usually seen "running" when sampled. So compare, per service,
  # the container id and its RestartCount with the previous run (state/ops-check/containers.restarts): same container
  # and a higher count = restarted since the last check; a container first seen (new deploy) must be at 0.
  for s in "${services[@]}"; do
    cid=${first[$i]}; i=$((i + 1))
    st=$(docker inspect --format '{{.State.Running}} {{.RestartCount}}' "$cid" 2>/dev/null || true); n=${st#* }
    if [[ ! "$cid" =~ ^[0-9a-zA-Z_.-]+$ ]] || [[ ! "$st" =~ ^(true|false)\ [0-9]+$ ]]; then
      notify containers FAIL "restart count of $s unreadable (docker inspect failed)"; return 1
    fi
    # ARC P404-12 (a): died between `ps` and `inspect` – not running now (the count is still recorded below).
    [ "${st%% *}" = true ] || restarted+=" $s not running at inspect;"
    pcid="" pn=""
    [ -r "$rfile" ] && read -r pcid pn < <(sed -n "s/^$s //p" "$rfile" | tail -n 1) || true
    if [ "$pcid" = "$cid" ] && [[ "$pn" =~ ^[0-9]+$ ]]; then
      [ "$n" -le "$pn" ] || restarted+=" $s restarted $((n - pn)) time(s) since the last check;"
    elif [ "$n" -gt 0 ]; then
      restarted+=" $s restarted $n time(s) since it was created;"
    fi
    base+="$s $cid $n"$'\n'
  done
  printf '%s' "$base" > "$rfile"
  if [ -n "$restarted" ]; then
    restarted="${restarted# }"
    notify containers FAIL "${restarted%;} – crash loop? see dc logs <service> (README 5.0)"; return 1
  fi
  if ! dc exec -T api wget -qO- http://127.0.0.1:3000/health 2>/dev/null | grep -q '"status":"ok"'; then
    notify containers FAIL "api /health not ok"; return 1
  fi
  notify containers OK "${services[*]} running (no restart since the last check), api healthy"
}

check_http5xx() {
  local svc=(web) n
  [ -s "$OTTIMO_HOME/state/landing_tag" ] && svc+=(landing)
  # Caddy access log lines are JSON with "status":<code>; count 5xx answers of the last 35 minutes.
  local logs
  if ! logs=$(dc logs --no-color --no-log-prefix --since 35m "${svc[@]}" 2>"$cmd_err"); then
    notify http5xx FAIL "$(compose_failed)"; return 1
  fi
  # The price estimate's own 503 (bulkhead / cap, by design) is pricelimit's business, not a server error.
  n=$(grep '"status":5[0-9][0-9]' <<<"$logs" | grep -cvE "$PRICE_ROUTE_RE.*\"status\":503[,}]" || true)
  if [ "${n:-0}" -ge "$HTTP5XX_MAX" ]; then notify http5xx FAIL "$n server errors (5xx) in 35 min"; return 1; fi
  notify http5xx OK "${n:-0} server errors (5xx) in 35 min"
}

check_email_dead() {
  local out n armed
  armed=$(email_alert_armed)
  [[ "$armed" =~ ^[01]$ ]] || { notify email_dead FAIL "EMAIL_NO_RECIPIENT_ALERT must be 0 or 1"; return 1; }
  if ! out=$(psql_ro <<SQL 2>"$cmd_err"
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
  # active + locked: the dispatcher sends to both (ARC FB-R4-ARC-OPS-PR30-08, v1.0.4).
  if ! out=$(psql_ro <<'SQL' 2>"$cmd_err"
SELECT count(*) FROM app_user u
 WHERE u.status IN ('active', 'locked') AND (u.email IS NULL OR u.email::text = '')
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
    notify email_missing FAIL "$n active/locked OWN/MGR user(s) without e-mail – their security notices reach nobody"
    return 1
  fi
  if [ "$armed" = "1" ]; then
    notify email_missing OK "$n active/locked OWN/MGR user(s) without e-mail"
  else
    notify email_missing OK "$n active/locked OWN/MGR user(s) without e-mail (report only until EMAIL_NO_RECIPIENT_ALERT=1, BUG-R3-032)"
  fi
}

check_email_changes() {
  local out umax tmax qmax v name val range line has=0 hasq=0 total=-1 top=-1 owner=-1 waiting=0 age=0 bad="" chg
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
SELECT 'changes', coalesce(sum(n), 0), coalesce(max(n), 0), coalesce(sum(o), 0) FROM (
  SELECT count(*) AS n, count(*) FILTER (WHERE via = 'owner') AS o FROM user_email_change
   WHERE changed_at > now() - interval '24 hours' GROUP BY user_id) s;
\else
SELECT 'changes', -1, -1, -1;
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
    if [[ "$line" =~ ^changes\|(-1|[0-9]+)\|(-1|[0-9]+)\|(-1|[0-9]+)$ ]] && [ "$has" -eq 0 ]; then
      total=${BASH_REMATCH[1]}; top=${BASH_REMATCH[2]}; owner=${BASH_REMATCH[3]}; has=1
    elif [[ "$line" =~ ^queue\|([0-9]+)\|(-?[0-9]+)$ ]] && [ "$hasq" -eq 0 ]; then
      waiting=${BASH_REMATCH[1]}; age=${BASH_REMATCH[2]}; hasq=1
    else
      notify email_changes FAIL "unexpected answer"; return 1
    fi
  done <<<"$out"
  if [ "$has" -ne 1 ] || [ "$hasq" -ne 1 ] || { [ "$total" = -1 ] && { [ "$top" != -1 ] || [ "$owner" != -1 ]; }; } \
    || { [ "$total" != -1 ] && { [ "$top" = -1 ] || [ "$owner" = -1 ]; }; }; then
    notify email_changes FAIL "unexpected answer"; return 1
  fi
  [ "$age" -ge 0 ] || age=0   # clock skew between created_at and now()
  age=$((age / 60))
  if [ "$total" -ge 0 ]; then
    [ "$top" -gt "$umax" ] && bad+=" $top e-mail changes for one user in 24 h (limit $umax);"
    [ "$total" -gt "$tmax" ] && bad+=" $total e-mail changes in 24 h (limit $tmax);"
    chg="$total e-mail change(s) in 24 h, max $top for one user, via owner: $owner (limits $umax / user, $tmax total)"
  else
    chg="e-mail changes: table not present yet (before migration 0091)"
  fi
  [ "$waiting" -gt 0 ] && [ "$age" -gt "$qmax" ] && bad+=" oldest waiting staff e-mail $age min old (limit $qmax min) – security notices delayed;"
  if [ -n "$bad" ]; then
    bad="${bad# }"
    if [ "$owner" -gt 0 ]; then
      notify email_changes FAIL "${bad%;}; via owner: $owner – runbook F branch 1: treat the OWN account as exposed unless INV made them, tell SEC"
    else
      [ "$owner" -ge 0 ] || owner="-"
      notify email_changes FAIL "${bad%;}; via owner: $owner – runbook F branch 2: lock the flooding account (self changes), tell SEC"
    fi
    return 1
  fi
  notify email_changes OK "$chg; staff.email queue: $waiting waiting, oldest $age min (limit $qmax min)"
}

check_email_ascii() {
  local out n
  # Stored addresses the API rule (EMAIL_RULE_RE: trim + lower case, then the shape) would refuse – what the adapter
  # may still be handed (legacy rows, SQL by hand). Blank = no address (email_missing), not counted. Only count(*)
  # leaves the database. EMAIL_RULE_RE is a constant of this script (no outside input reaches the SQL text).
  if ! out=$(psql_ro <<SQL 2>"$cmd_err"
SELECT count(*) FROM (SELECT lower(btrim(email::text)) AS e FROM app_user WHERE email IS NOT NULL) a
 WHERE a.e <> ''
   AND NOT (char_length(a.e) BETWEEN 3 AND 254 AND a.e ~ '$EMAIL_RULE_RE');
SQL
  ); then
    notify email_ascii FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  n=$(tr -d '[:space:]' <<<"$out")
  [[ "$n" =~ ^[0-9]+$ ]] || { notify email_ascii FAIL "unexpected answer"; return 1; }
  if [ "$n" -gt 0 ]; then
    notify email_ascii FAIL "$n stored e-mail address(es) outside the ASCII rule – security e-mails to them fail (v1.0.4 adapter); tell INT, fix on Desk, no SQL"
    return 1
  fi
  notify email_ascii OK "$n stored e-mail address(es) outside the ASCII rule"
}

check_email_config() {
  local provider mode user from lines raw entries=0 bad=0 e problems="" shared said
  provider=$(envval EMAIL_PROVIDER)
  if [ "$provider" != smtp ]; then notify email_config OK "EMAIL_PROVIDER=${provider:-unset}: not smtp, nothing to check"; return 0; fi
  # Same reading as smtp.ts smtpConfigFromCredentials (INT, v104/int-email) – CHANGE TOGETHER (ARC P404-09):
  #   EMAIL_SMTP_MODE trimmed, empty = relay (compose default too), else relay|app_password;
  #   EMAIL_SMTP_USER and EMAIL_FROM trimmed (.trim()), from = EMAIL_FROM or else the user;
  #   app_password: the user must follow the rule; relay: the user is not used (not checked);
  #   from must follow the rule (isEmailAddress: no display form "Name <…>").
  mode=$(trim "$(envval EMAIL_SMTP_MODE)"); mode=${mode:-relay}
  user=$(trim "$(envval EMAIL_SMTP_USER)"); from=$(trim "$(envval EMAIL_FROM)"); [ -n "$from" ] || from=$user
  case "$mode" in
    app_password)
      if [ -z "$user" ]; then problems+=" EMAIL_SMTP_USER empty (required with EMAIL_SMTP_MODE=app_password);"
      elif ! email_rule "$(LC_ALL=C tr 'A-Z' 'a-z' <<<"$user")"; then problems+=" EMAIL_SMTP_USER outside the rule;"; fi
      said="EMAIL_SMTP_MODE=app_password: EMAIL_FROM and EMAIL_SMTP_USER follow the address rule" ;;
    relay)
      said="EMAIL_SMTP_MODE=relay: EMAIL_FROM follows the address rule"
      [ -z "$user" ] || said+=" (EMAIL_SMTP_USER ignored in relay)" ;;
    *) problems+=" EMAIL_SMTP_MODE invalid (relay|app_password);" ;;
  esac
  if [ -z "$from" ]; then problems+=" EMAIL_FROM empty;"
  elif ! email_rule "$(LC_ALL=C tr 'A-Z' 'a-z' <<<"$from")"; then problems+=" EMAIL_FROM outside the rule;"; fi
  # EMAIL_SHARED_MAILBOXES (BE-A shared-mailboxes.ts): split on space , ; – each entry trimmed + lower case.
  lines=$(grep -c '^EMAIL_SHARED_MAILBOXES=' "$OTTIMO_HOME/.env" 2>/dev/null || true)
  if [ "${lines:-0}" -gt 1 ]; then problems+=" EMAIL_SHARED_MAILBOXES on $lines lines;"; fi
  if [ "${lines:-0}" -ge 1 ]; then
    raw=$(envval EMAIL_SHARED_MAILBOXES)
    while IFS= read -r e; do
      [ -n "$e" ] || continue
      entries=$((entries + 1))
      email_rule "$(LC_ALL=C tr 'A-Z' 'a-z' <<<"$e")" || bad=$((bad + 1))
    done < <(tr ',; \t' '\n\n\n\n' <<<"$raw")
    [ "$bad" -eq 0 ] || problems+=" $bad EMAIL_SHARED_MAILBOXES entr(y/ies) outside the rule;"
    shared="EMAIL_SHARED_MAILBOXES $entries entr(y/ies), $bad outside the rule"
  else
    shared="EMAIL_SHARED_MAILBOXES unset (default rule applies; api v1.0.4 warns – runbook P2d)"
  fi
  if [ -n "$problems" ]; then
    problems="${problems# }"
    notify email_config FAIL "${problems%;} – worker/api v1.0.4 stop at start; fix .env on the server (runbook E2 pattern), tell INT"
    return 1
  fi
  notify email_config OK "$said; $shared"
}

# PN-01 guard function privacy_notice_version_append_only(): md5(pg_proc.prosrc) of the body each migration installs
# (SEC FB-R4-SEC-OPS-P413-S2, ARC FB-R4-ARC-OPS-P413-S1). Measured on Postgres 17 from the migration files:
#   0090 (v1.0.1–v1.0.3; production before v1.0.4) and 0095 (v1.0.4, P4-13, journal idx 71 → 72 rows applied).
# A migration that changes the body MUST change these constants too: that is the intended review point.
PN_FN_MD5_0090=3274031e441f1f86103783726a3e7d9b
PN_FN_MD5_0095=7a601d0ee740b1861663efa9b89473f5
PN_0095_APPLIED_AT=72  # __drizzle_migrations rows once 0095 (idx 71) is applied

check_db_triggers() {
  local out line pn=0 pn_bad="" pn_md5="" pn_mig="" want="" rlp="absent" rlp_fn="" app="" bad=""
  # Names, the enabled flag, SECURITY DEFINER and privilege flags only. to_regclass keeps the SQL valid on any DB.
  # ARC FB-R4-ARC-OPS-P404-08: "trigger absent" is ok only BEFORE migration 0094. The function of 0094 tells the two
  # apart without any new privilege: function present + trigger absent = the trigger was removed after 0094 → FAIL.
  # The trigger must also stay BEFORE DELETE FOR EACH ROW (tgtype bits ROW 1 + BEFORE 2 + DELETE 8).
  # PN-01 (P413-S1/S2): both triggers point at public.privacy_notice_version_append_only(), not SECURITY DEFINER, and
  # its body hash is the one of the migration state (0090 before 0095 is applied, 0095 after). Only the hash is
  # printed, never the body. The migration count is read only when ottimo_readonly may read it (02-roles.sh v1.0.4).
  if ! out=$(psql_ro <<'SQL' 2>"$cmd_err"
SELECT to_regclass('public.privacy_notice_version') IS NOT NULL AS has_pnv, to_regclass('public.room_list_price') IS NOT NULL AS has_rlp,
       CASE WHEN to_regnamespace('drizzle') IS NULL THEN false
            WHEN NOT has_schema_privilege('drizzle', 'USAGE') THEN false
            WHEN to_regclass('drizzle.__drizzle_migrations') IS NULL THEN false
            ELSE has_table_privilege('drizzle.__drizzle_migrations', 'SELECT') END AS can_mig \gset
\if :has_pnv
SELECT 'pn', t.tgname, t.tgenabled, p.prosecdef, md5(p.prosrc), p.oid = to_regprocedure('public.privacy_notice_version_append_only()')
  FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
 WHERE t.tgrelid = 'public.privacy_notice_version'::regclass AND NOT t.tgisinternal
   AND t.tgname IN ('privacy_notice_version_append_only', 'privacy_notice_version_no_truncate') ORDER BY 2;
\if :can_mig
SELECT 'pnmig', count(*) FROM drizzle.__drizzle_migrations;
\else
SELECT 'pnmig', 'unknown';
\endif
SELECT 'app', concat_ws(',', has_table_privilege('ottimo_app', 'public.privacy_notice_version', 'SELECT'),
       has_table_privilege('ottimo_app', 'public.privacy_notice_version', 'INSERT'),
       has_table_privilege('ottimo_app', 'public.privacy_notice_version', 'UPDATE'),
       has_table_privilege('ottimo_app', 'public.privacy_notice_version', 'DELETE'),
       has_table_privilege('ottimo_app', 'public.privacy_notice_version', 'TRUNCATE'));
\endif
SELECT 'rlpfn', to_regprocedure('public.room_list_price_append_only()') IS NOT NULL;
\if :has_rlp
SELECT 'rlp', t.tgenabled, p.prosecdef, (t.tgtype::int & 11) = 11 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
 WHERE t.tgrelid = 'public.room_list_price'::regclass AND t.tgname = 'room_list_price_append_only';
\endif
SQL
  ); then
    notify db_triggers FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  while IFS= read -r line; do
    line=$(tr -d '[:space:]' <<<"$line")
    [ -n "$line" ] || continue
    if [[ "$line" =~ ^pn\|(privacy_notice_version_append_only|privacy_notice_version_no_truncate)\|([OoRAD])\|([tf])\|([0-9a-f]{32})\|([tf])$ ]]; then
      pn=$((pn + 1)); [ "${BASH_REMATCH[2]}" = O ] || pn_bad+=" ${BASH_REMATCH[1]} not enabled (${BASH_REMATCH[2]});"
      [ "${BASH_REMATCH[3]}" = f ] || pn_bad+=" ${BASH_REMATCH[1]} function is SECURITY DEFINER;"
      [ "${BASH_REMATCH[5]}" = t ] || pn_bad+=" ${BASH_REMATCH[1]} does not call public.privacy_notice_version_append_only();"
      pn_md5+=" ${BASH_REMATCH[4]}"
    elif [[ "$line" =~ ^pnmig\|([0-9]+|unknown)$ ]] && [ -z "$pn_mig" ]; then
      pn_mig=${BASH_REMATCH[1]}
    elif [[ "$line" =~ ^app\|([tf],[tf],[tf],[tf],[tf])$ ]] && [ -z "$app" ]; then
      app=${BASH_REMATCH[1]}
    elif [[ "$line" =~ ^rlpfn\|([tf])$ ]] && [ -z "$rlp_fn" ]; then
      rlp_fn=${BASH_REMATCH[1]}
    elif [[ "$line" =~ ^rlp\|([OoRAD])\|([tf])\|([tf])$ ]] && [ "$rlp" = absent ]; then
      rlp="${BASH_REMATCH[1]}|${BASH_REMATCH[2]}|${BASH_REMATCH[3]}"
    else
      notify db_triggers FAIL "unexpected answer"; return 1
    fi
  done <<<"$out"
  [ "$pn" -eq 2 ] || bad+=" $pn of 2 PN-01 triggers on privacy_notice_version;"
  bad+="$pn_bad"
  if [ "$pn" -gt 0 ]; then
    case "$pn_mig" in
      "") notify db_triggers FAIL "unexpected answer"; return 1 ;;
      unknown) bad+=" PN-01 function body not checked: ottimo_readonly cannot read drizzle.__drizzle_migrations (02-roles.sh v1.0.4 not applied – runbook v1.0.4 P2b step 5);" ;;
      *)
        if [ "$pn_mig" -ge "$PN_0095_APPLIED_AT" ]; then want=$PN_FN_MD5_0095; else want=$PN_FN_MD5_0090; fi
        for line in $pn_md5; do
          [ "$line" = "$want" ] || { bad+=" PN-01 function body differs from migration $([ "$want" = "$PN_FN_MD5_0095" ] && echo 0095 || echo 0090) (md5 ${line:0:8}…, $pn_mig migrations applied);"; break; }
        done ;;
    esac
  fi
  [ "$app" = "t,f,f,f,f" ] || bad+=" ottimo_app privileges on privacy_notice_version are not SELECT only;"
  [ -n "$rlp_fn" ] || { notify db_triggers FAIL "unexpected answer"; return 1; }
  case "$rlp" in
    "O|f|t") ;;
    absent) [ "$rlp_fn" = f ] || bad+=" room_list_price_append_only missing (function present – migration 0094 ran);" ;;
    *) bad+=" room_list_price_append_only tgenabled|prosecdef|before-delete-row = $rlp (must be O|f|t);" ;;
  esac
  if [ -n "$bad" ]; then
    bad="${bad# }"
    notify db_triggers FAIL "${bad%;} – tell SEC + BE, never enable/disable by hand (README 13.7)"
    return 1
  fi
  local pnbody=0090; [ "$want" = "$PN_FN_MD5_0095" ] && pnbody=0095
  if [ "$rlp" = absent ]; then
    notify db_triggers OK "PN-01 triggers enabled (function of migration $pnbody, not SECURITY DEFINER), ottimo_app SELECT only; room_list_price_append_only not present yet (before migration 0094)"
  else
    notify db_triggers OK "PN-01 triggers enabled (function of migration $pnbody, not SECURITY DEFINER), ottimo_app SELECT only; room_list_price_append_only enabled"
  fi
}

# Caddy access log line of the price route (uri without query: Caddyfile.landing masks it as "?[q]").
PRICE_ROUTE_RE='"uri":"/v1/public/properties/[a-z0-9-]+/price-estimate[?"]'

check_pricelimit() {
  local logs n
  if [ ! -s "$OTTIMO_HOME/state/landing_tag" ]; then notify pricelimit OK "no landing deployed"; return 0; fi
  if ! logs=$(dc logs --no-color --no-log-prefix --since 60m landing 2>"$cmd_err"); then
    notify pricelimit FAIL "$(compose_failed)"; return 1
  fi
  n=$(grep -cE "$PRICE_ROUTE_RE.*\"status\":(429|503)[,}]" <<<"$logs" || true)
  if [ "${n:-0}" -ge "$PRICE_REFUSED_MAX" ]; then
    notify pricelimit FAIL "website price estimate refused $n times (429/503) in 60 min – guests may not see prices (scraping or flood; the form still works)"
    return 1
  fi
  notify pricelimit OK "${n:-0} price estimates refused (429/503) in 60 min"
}

check_pricegap() {
  local logs n rooms="" out static="" err_log="" err_static=""
  # Part 1 – log of the last 24 h. Only counts leave this function: the log line itself (internal ids) is never forwarded.
  if logs=$(dc logs --no-color --no-log-prefix --since 24h api 2>"$cmd_err"); then
    n=$(grep -c 'public_price_missing' <<<"$logs" || true)
    if [ "${n:-0}" -gt 0 ]; then
      rooms=$(grep 'public_price_missing' <<<"$logs" | grep -oE 'room=[0-9a-zA-Z-]+' | sort -u | grep -c . || true)
      rooms=${rooms:-0}
    fi
  else
    err_log="api log unreadable – $(compose_failed)"
  fi
  # Part 2 – static (SEC-on-lp-v2-s6d.md 6.4): one count, READ ONLY as ottimo_readonly. Constant SQL text.
  if out=$(psql_ro <<'SQL' 2>"$cmd_err"
SELECT count(*)
  FROM room r
  JOIN property p ON p.id = r.property_id
 CROSS JOIN LATERAL (SELECT (now() AT TIME ZONE p.timezone)::date AS today) d
 WHERE r.is_sellable
   AND r.public_room_type IS NOT NULL
   AND r.active_from <= d.today + 365
   AND (r.active_to IS NULL OR r.active_to >= d.today)
   AND NOT EXISTS (SELECT 1 FROM room_list_price lp
                    WHERE lp.room_id = r.id AND lp.effective_from <= greatest(r.active_from, d.today));
SQL
  ); then
    static=$(tail -n 1 <<<"$out")
    [[ "$static" =~ ^[0-9]{1,6}$ ]] || { static=""; err_static="static check: unexpected answer"; }
  else
    err_static="static check query failed: $(cmd_failed)"
  fi
  local fails=()
  [ -n "$rooms" ] && fails+=("${rooms} room(s) left out of the website price estimate in 24 h: no list price for a night")
  [ -n "$static" ] && [ "$static" -gt 0 ] \
    && fails+=("${static} sellable room(s) with a website room type have no list price from their first sellable day (next 365 days)")
  [ -n "$err_log" ] && fails+=("$err_log")
  [ -n "$err_static" ] && fails+=("$err_static")
  if [ "${#fails[@]}" -gt 0 ]; then
    local msg="" f
    for f in "${fails[@]}"; do msg+="${msg:+; }$f"; done
    if [ -n "$rooms" ] || { [ -n "$static" ] && [ "$static" -gt 0 ]; }; then
      msg+=" – OWN: enter the list price of that room on Desk; OPS: find where the room came from (bootstrap or direct DB edit)"
    fi
    notify pricegap FAIL "$msg"
    return 1
  fi
  notify pricegap OK "every room had a list price for the website estimate (24 h); 0 sellable rooms without a list price (365 days)"
}

check_priceswitch() {
  local out maxid n val mark="$state/priceswitch.last_id" last=""
  [ -r "$mark" ] && read -r last < "$mark" || true
  [[ "${last:-}" =~ ^[0-9]{1,18}$ ]] || last=""
  # $last is digits only (checked above) – the one value put into the SQL text. The 7-day bound only lets Postgres
  # skip old monthly partitions: a change older than that would have been seen by one of the ~336 runs since.
  if ! out=$(psql_ro <<SQL 2>"$cmd_err"
SELECT coalesce(max(id), 0),
       count(*) FILTER (WHERE id > ${last:-0}),
       coalesce((array_agg(CASE WHEN after->>'value' IN ('true', 'false') THEN after->>'value' ELSE 'other' END
                           ORDER BY id DESC) FILTER (WHERE id > ${last:-0}))[1], '-')
  FROM audit_event
 WHERE action = 'config.changed' AND entity_type = 'config_parameter' AND entity_id = 'public_show_prices'
   AND occurred_at > now() - interval '7 days';
SQL
  ); then
    notify priceswitch FAIL "query failed: $(cmd_failed)"
    return 1
  fi
  IFS='|' read -r maxid n val <<<"$(tail -n 1 <<<"$out")"
  { [[ "${maxid:-}" =~ ^[0-9]+$ ]] && [[ "${n:-}" =~ ^[0-9]+$ ]]; } || { notify priceswitch FAIL "unexpected answer"; return 1; }
  case "${val:-}" in true | false | other | -) ;; *) val=other ;; esac
  if [ -z "$last" ]; then
    echo "$maxid" > "$mark"
    notify priceswitch OK "public_show_prices: first run, changes are reported from now on"
    return 0
  fi
  [ "$maxid" -gt "$last" ] || maxid=$last
  if [ "$n" -gt 0 ]; then
    notify priceswitch FAIL "Desk switch public_show_prices changed $n time(s) since the last check (now: $val) – check it was intended (Desk H05, OWN)" force
    echo "$maxid" > "$mark"
    return 1
  fi
  notify priceswitch OK "public_show_prices not changed since the last check"
}

check_sshkeys() {
  local dir="${OPS_CHECK_SSH_DIR:-}" f line opts n=0 bad=0 files=()
  if [ -z "$dir" ]; then dir="$(getent passwd ottimo | cut -d: -f6)/.ssh"; fi
  if [ ! -r "$dir/authorized_keys" ]; then notify sshkeys FAIL "authorized_keys of the deploy user missing or unreadable"; return 1; fi
  files=("$dir/authorized_keys"); [ -e "$dir/authorized_keys2" ] && files+=("$dir/authorized_keys2")
  for f in "${files[@]}"; do
    [ -r "$f" ] || { notify sshkeys FAIL "authorized_keys2 of the deploy user unreadable"; return 1; }
    while IFS= read -r line || [ -n "$line" ]; do
      line=${line%$'\r'}; line="${line#"${line%%[![:space:]]*}"}"
      case "$line" in '' | '#'*) continue ;; esac
      n=$((n + 1))
      # Options = everything before the first space outside quotes; quoted values are blanked first, so a command
      # text that happens to contain ",restrict," is never read as the option itself.
      opts=$(sed -E 's/"[^"]*"/Q/g; s/[[:space:]].*$//' <<<"$line")
      case "$opts" in ssh-* | ecdsa-* | sk-*) bad=$((bad + 1)); continue ;; esac
      case ",$opts," in *,command=Q,*) ;; *) bad=$((bad + 1)); continue ;; esac
      case ",$opts," in *,restrict,*) ;; *) bad=$((bad + 1)) ;; esac
    done < "$f"
  done
  if [ "$bad" -gt 0 ]; then
    notify sshkeys FAIL "$bad of $n key line(s) of the deploy user have no forced command (command=…,restrict) – person keys go through ottimo-admin + sudo; remove the line (runbook v1.0.5)"
    return 1
  fi
  notify sshkeys OK "$n key line(s) of the deploy user, all with a forced command"
}

check_journal() {
  local jc="${OPS_CHECK_JOURNALCTL:-journalctl}" jdir="${OPS_CHECK_JOURNAL_DIR:-/var/log/journal}"
  local ge="${OPS_CHECK_GETENT:-getent}" now ids id t n_other=0 first age since_s since_d expect sup
  local g gid members m extra allowed fails=() warns=() own
  now=$(date -u +%s)
  # 1. every running container of this stack logs to journald (the switch needs a re-created container)
  if ! ids=$(dc ps --quiet 2>"$cmd_err"); then notify journal FAIL "$(compose_failed)"; return 1; fi
  for id in $ids; do
    t=$(docker inspect --format '{{.HostConfig.LogConfig.Type}}' "$id" 2>/dev/null || echo unknown)
    [ "$t" = journald ] || n_other=$((n_other + 1))
  done
  [ "$n_other" -eq 0 ] || fails+=("$n_other running container(s) of the stack do not log to journald – re-create them (runbook v1.0.5 W6)")
  # 2. age of the oldest entry: journalctl starts at the oldest one; head stops it after one line
  # (--system: without the group journalctl would fall back to this user's own journal and look "young")
  first=$( { "$jc" --system -q --no-pager -o short-unix 2>/dev/null || true; } | head -n 1 | cut -d' ' -f1 | cut -d. -f1)
  if [[ ! "$first" =~ ^[0-9]{9,11}$ ]]; then
    fails+=("journal unreadable (the ops-check unit needs SupplementaryGroups=systemd-journal)")
  else
    age=$(( (now - first) / 86400 ))
    if [ "$age" -gt 91 ]; then fails+=("oldest journal entry is $age days old (cap 90 days: MaxRetentionSec not applied)"); fi
    since_s=$(head -n 1 "$OTTIMO_HOME/state/journald_since" 2>/dev/null || true)
    if [[ "$since_s" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] && since_d=$(date -u -d "$since_s" +%s 2>/dev/null); then
      expect=$(( (now - since_d) / 86400 )); [ "$expect" -le 90 ] || expect=90
      if [ "$age" -lt $((expect - 1)) ]; then
        warns+=("journal rotated early: oldest entry $age days old, expected at least $((expect - 1)) – SystemMaxUse reached or a log flood; look, then reset state/journald_since")
      fi
    else
      warns+=("state/journald_since missing or not YYYY-MM-DD – early rotation not checked")
    fi
    sup=$( { "$jc" --system -q --no-pager --since -24h -t systemd-journald -o cat 2>/dev/null || true; } | grep -c '^Suppressed ' || true)
    [ "${sup:-0}" -eq 0 ] || warns+=("journald dropped lines $sup time(s) in 24 h (Suppressed … messages: RateLimitBurst reached)")
  fi
  # 3. who can read the logs: the journal directory and files, and the members of adm, systemd-journal, docker
  own=$(stat -c '%U:%G' "$jdir" 2>/dev/null || echo unknown)
  [ "$own" = "${OPS_CHECK_JOURNAL_OWNER:-root:systemd-journal}" ] || fails+=("$jdir is $own (must be root:systemd-journal)")
  if [ -n "$(find "$jdir" -type f -name '*.journal*' -perm -o=r 2>/dev/null | head -n 1)" ]; then
    fails+=("journal file(s) readable by everyone under $jdir")
  fi
  for g in adm systemd-journal docker; do
    if [ "$g" = docker ]; then allowed="ottimo"; else allowed="$(envval LOG_READER_USERS)"; allowed="${allowed:-syslog ottimo-admin}"; fi
    gid=$("$ge" group "$g" 2>/dev/null | cut -d: -f3) || true
    [ -n "$gid" ] || continue
    members="$("$ge" group "$g" | cut -d: -f4 | tr ',' ' ') $("$ge" passwd | awk -F: -v g="$gid" '$4 == g { print $1 }' | tr '\n' ' ')"
    extra=0
    for m in $members; do
      case " root $allowed " in *" $m "*) ;; *) extra=$((extra + 1)) ;; esac
    done
    [ "$extra" -eq 0 ] || fails+=("group $g has $extra member(s) outside the allowed list (they can read the logs)")
  done
  local msg
  if [ "${#fails[@]}" -gt 0 ]; then
    msg=$(printf '%s; ' "${fails[@]}" "${warns[@]}"); notify journal FAIL "${msg%; }"; return 1
  fi
  if [ "${#warns[@]}" -gt 0 ]; then
    msg=$(printf '%s; ' "${warns[@]}"); notify journal WARN "${msg%; }"; return 0
  fi
  notify journal OK "oldest entry $age days (cap 90), no dropped lines in 24 h, containers on journald, log readers as allowed"
}

# Full run (timer): v1.0.3 checks first, then the LP-v2 price checks (merge lp-v2-main, ARC 04/11), then v1.0.4 (P4-04),
# then v1.0.5 (sshkeys, journal).
if [ "$#" -gt 0 ]; then checks=("$@"); full=0; else checks=(containers j16 backup disk mem tls http5xx email_dead email_missing email_changes email_ascii pricelimit pricegap priceswitch email_config db_triggers sshkeys journal); full=1; fi
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
    email_config) check_email_config || ok=0 ;;
    db_triggers) check_db_triggers || ok=0 ;;
    pricelimit) check_pricelimit || ok=0 ;;
    pricegap) check_pricegap || ok=0 ;;
    priceswitch) check_priceswitch || ok=0 ;;
    sshkeys) check_sshkeys || ok=0 ;;
    journal) check_journal || ok=0 ;;
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
