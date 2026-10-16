#!/usr/bin/env bash
# Periodic checks of one server – systemd timer ottimo-ops-check.timer (every 30 min), as the deploy user.
#   ops-check.sh            run every check, alert on failures
#   ops-check.sh j16        one check only (j16 | backup | disk | tls | containers)
#
#   j16         SEC C6 / SR-RET-03: for every active property, the last retention_run of policy J16 with
#               status done must be < 26 h old (a property younger than 26 h without any run is fine), and no J16 run
#               may have status failed in the last 26 h. J16 runs hourly in the worker; one missed hour is normal,
#               a whole day means the worker or the job is broken – documents would outlive their deletion date.
#   backup      last successful backup.sh < 26 h (state/backup.last_ok)
#   disk        root filesystem < 80 % (hosting-plan 8)
#   tls         certificate of DESK/STAFF/GUEST host valid > 14 days (Caddy renews at 30 days; this means renewal fails)
#   containers  postgres, api, worker, web running (api healthy)
#
# Alerts (no personal data – only check names, property ids, ages): always to the journal
# (journalctl -t ottimo-alert -p err); plus ALERT_WEBHOOK_URL from /opt/ottimo/.env if set, sent when a check
# changes state (OK→FAIL, FAIL→OK) and again every 6 h while it stays failing. Exit 1 when any check fails.
# Note: with CLOCK_MODE=mutable (staging time-travel tests) run_at follows the fake clock – a J16 alert during such a
# test is expected.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
state="$OTTIMO_HOME/state/ops-check"
mkdir -p "$state"
dc() { "$here/dc" "$@"; }
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }

J16_MAX_HOURS="${J16_MAX_HOURS:-26}"
BACKUP_MAX_HOURS="${BACKUP_MAX_HOURS:-26}"
DISK_MAX_PCT="${DISK_MAX_PCT:-80}"
TLS_MIN_DAYS="${TLS_MIN_DAYS:-14}"
REMIND_SECONDS="${REMIND_SECONDS:-21600}"
for v in J16_MAX_HOURS BACKUP_MAX_HOURS DISK_MAX_PCT TLS_MIN_DAYS REMIND_SECONDS; do
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

check_j16() {
  local out bad=""
  if ! out=$(psql_admin <<SQL 2>&1
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
    notify j16 FAIL "query failed: $(head -n 1 <<<"$out")"
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

check_tls() {
  local h end days bad="" port
  port=$(envval PUBLIC_HTTPS_PORT); port="${port:-443}"
  for h in "$(envval DESK_HOST)" "$(envval STAFF_HOST)" "$(envval GUEST_HOST)"; do
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
  local s missing=""
  for s in postgres api worker web; do
    [ -n "$(dc ps --status running --quiet "$s" 2>/dev/null)" ] || missing+=" $s"
  done
  if [ -n "$missing" ]; then notify containers FAIL "not running:$missing"; return 1; fi
  if ! dc exec -T api wget -qO- http://127.0.0.1:3000/health 2>/dev/null | grep -q '"status":"ok"'; then
    notify containers FAIL "api /health not ok"; return 1
  fi
  notify containers OK "postgres api worker web running, api healthy"
}

if [ "$#" -gt 0 ]; then checks=("$@"); else checks=(containers j16 backup disk tls); fi
rc=0
for c in "${checks[@]}"; do
  case "$c" in
    j16) check_j16 || rc=1 ;;
    backup) check_backup || rc=1 ;;
    disk) check_disk || rc=1 ;;
    tls) check_tls || rc=1 ;;
    containers) check_containers || rc=1 ;;
    *) echo "unknown check: $c" >&2; rc=2 ;;
  esac
done
exit "$rc"
