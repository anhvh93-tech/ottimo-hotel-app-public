#!/usr/bin/env bash
# Test of the twice-a-day backup (v1.0.5 V5-62, ARC OR-M2 (a), SEC SR-BAK-01/03): the timers, the services they start
# and the retention of bin/backup.sh by age. No server, no database: a copy of backup.sh next to a stub `dc` and a stub
# `age` (copies stdin – encryption is not under test here), and a `date` wrapper that moves "now" (FAKE_DATE_OFFSET,
# seconds) so 45 days of runs take a few seconds.
#   bash infra/server/test/backup-schedule.test.sh   (CI ubuntu runner; on macOS: needs bash ≥ 4, flock, GNU date –
#   e.g. docker run --rm -v "$PWD/product/infra:/infra:ro" ubuntu:24.04 bash /infra/server/test/backup-schedule.test.sh)
# Cases: production timer 03:00 + 15:00, staging 03:30 + 15:30 (Asia/Ho_Chi_Minh), 12 h apart, staging 30 min after
# production, Persistent, ≤ 5 min random delay, the timers start the backup service itself · both services run as
# ottimo:ottimo the same backup.sh · first run creates the backup directory 0700 and every file 0600 · retention at
# the boundaries (6 d 23 h kept, 7 d 1 h gone; Sunday 32 d 23 h kept, 33 d 1 h gone; purge-journal 39 d 23 h kept,
# 40 d 1 h gone; a .sha256 goes with its file; a name without a full stamp is left alone) · 45 simulated days of runs
# every 12 h (and once with two runs missed in a row): no file but purge-journal ever older than 35 days, 14 daily
# sets + the Sunday sets kept · ops-check backup: default limit 14 h – 13 h ok, 15 h FAIL.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/.." && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if [ "${BASH_VERSINFO[0]}" -lt 4 ] || ! command -v flock >/dev/null || ! date -u -d 2026-01-01 +%s >/dev/null 2>&1; then
  echo "skipped: needs bash ≥ 4 (coproc), flock and GNU date – see the header for the docker command" >&2; exit 0
fi

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
H=3600 D=86400

# ── 1. timers and services ──
calendar() { sed -n 's/^OnCalendar=//p' "$1"; }
minutes() { local h=${1%%:*} m=${1#*:}; m=${m%%:*}; echo $((10#$h * 60 + 10#$m)); }
check_timer() { # file want1 want2 label
  local f="$src/systemd/$1" got want
  got=$(calendar "$f" | sort | tr '\n' ' ')
  want=$(printf '*-*-* %s Asia/Ho_Chi_Minh\n*-*-* %s Asia/Ho_Chi_Minh\n' "$2" "$3" | sort | tr '\n' ' ')
  if [ "$got" = "$want" ] && grep -qx 'Persistent=true' "$f" && grep -qx 'RandomizedDelaySec=5min' "$f" \
    && ! grep -q '^Unit=' "$f"; then
    ok "1 $4 timer: $2 + $3 Asia/Ho_Chi_Minh, Persistent, ≤ 5 min delay, starts its own backup service"
  else ko "1 $4 timer: got '$got'"; fi
  local a b gap
  a=$(minutes "$2"); b=$(minutes "$3"); gap=$(( (b - a + 1440) % 1440 ))
  [ "$gap" = 720 ] && ok "1b $4 runs 12 h / 12 h apart" || ko "1b $4 gap $gap min (want 720)"
  if command -v systemd-analyze >/dev/null; then
    local c bad=0
    while IFS= read -r c; do systemd-analyze calendar "$c" >/dev/null 2>&1 || bad=1; done < <(calendar "$f")
    [ "$bad" = 0 ] && ok "1c $4 calendar lines parse (systemd-analyze)" || ko "1c $4 calendar does not parse"
  fi
}
check_timer 'ottimo-backup@.timer' 03:00:00 15:00:00 production
check_timer 'ottimo-backup.timer' 03:30:00 15:30:00 staging
p1=$(calendar "$src/systemd/ottimo-backup@.timer" | sort | head -n 1 | awk '{print $2}')
s1=$(calendar "$src/systemd/ottimo-backup.timer" | sort | head -n 1 | awk '{print $2}')
[ $(( $(minutes "$s1") - $(minutes "$p1") )) = 30 ] && ok "1d staging runs 30 min after production (dumps never overlap)" \
  || ko "1d staging/production offset"
svc_ok=1
for s in 'ottimo-backup@.service' 'ottimo-backup.service'; do
  f="$src/systemd/$s"
  grep -qx 'User=ottimo' "$f" && grep -qx 'Group=ottimo' "$f" && grep -qx 'Type=oneshot' "$f" \
    && grep -qE '^ExecStart=/opt/(%i|ottimo)/infra/server/bin/backup.sh$' "$f" || { svc_ok=0; echo "  $s"; }
done
[ "$svc_ok" = 1 ] && ok "1e both runs start the same service: ottimo:ottimo, backup.sh (same owner, umask, age recipients)" \
  || ko "1e services"

# ── 2. backup.sh with stubs ──
T=$(mktemp -d "${TMPDIR:-/tmp}/bsch-test.XXXXXX")
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/infra/server/bin" "$T/home/state" "$T/home/backup" "$T/stubs"
cp "$src/bin/backup.sh" "$T/infra/server/bin/backup.sh"
cp "$src/backup-counts.sql" "$T/infra/server/backup-counts.sql"
echo "sha-test" > "$T/home/state/current_tag"
echo "age1testrecipientpublickeyonly" > "$T/home/backup/recipients.txt"
cat > "$T/infra/server/bin/dc" <<'STUB'
#!/usr/bin/env bash
# stub of bin/dc for backup.sh – fake bytes only
case "$1 ${*: -1}" in
  "run "*) echo "FAKE-BLOB-TAR"; exit 0 ;;
esac
cmd="${*: -1}"
case "$cmd" in
  *pg_dump*) echo "FAKE-DUMP" ;;
  *"-tA -F"*)
    while IFS= read -r line; do
      case "$line" in
        *pg_export_snapshot*) echo "00000003-0000001B-1" ;;
        *end-of-counts*) for t in a b c d e f g h i j k; do echo "table_$t 1"; done; echo "end-of-counts 0" ;;
        '\q') exit 0 ;;
      esac
    done ;;
  *) cat > /dev/null; echo "id,purged_at" ;;
esac
STUB
cat > "$T/stubs/age" <<'STUB'
#!/usr/bin/env bash
out=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && out="$2"; shift; done
cat > "$out"
STUB
real_date=$(command -v date)
cat > "$T/stubs/date" <<STUB
#!/usr/bin/env bash
# "now" moved by FAKE_DATE_OFFSET seconds; every other use of date (parsing a stamp) is the real one.
if [ "\$#" -eq 2 ] && [ "\$1" = -u ] && [ "\${2:0:1}" = + ]; then
  exec "$real_date" -u -d "@\$(( \$("$real_date" -u +%s) + \${FAKE_DATE_OFFSET:-0} ))" "\$2"
fi
exec "$real_date" "\$@"
STUB
chmod +x "$T/infra/server/bin/dc" "$T/infra/server/bin/backup.sh" "$T/stubs/age" "$T/stubs/date"
B="$T/backups"
bk() { PATH="$T/stubs:$PATH" OTTIMO_HOME="$T/home" BACKUP_DIR="$B" bash "$T/infra/server/bin/backup.sh" 2>&1; }
stamp_at() { date -u -d "@$1" +%Y%m%dT%H%M%SZ; }   # epoch → backup.sh stamp
put() { # name – a fake encrypted file + its checksum
  echo x > "$B/$1"; echo "x  $1" > "$B/$1.sha256"
}

out=$(bk) && rc=0 || rc=$?
perm_dir=$(stat -c %a "$B"); perm_bad=$(find "$B" -type f ! -perm 0600 | wc -l | tr -d ' ')
if [ "$rc" -eq 0 ] && [ "$perm_dir" = 700 ] && [ "$perm_bad" = 0 ] && find "$B" -name 'db-*.dump.age' | grep -q .; then
  ok "2 first run: backup directory 0700, every file 0600"
else ko "2 perms (rc=$rc dir=$perm_dir files-not-0600=$perm_bad)"; echo "$out"; fi

# Boundaries, at exact ages from now (a weekday stamp for the daily limit).
now=$(date -u +%s)
rm -rf "$B"; mkdir -m 0700 "$B"
weekday=$(( now - 7 * D - H )); while [ "$(date -u -d "@$weekday" +%u)" = 7 ]; do weekday=$(( weekday - D )); done
d_keep="db-$(stamp_at $(( now - 7 * D + H ))).dump.age"
d_gone="db-$(stamp_at "$weekday").dump.age"
j_keep="purge-journal-$(stamp_at $(( now - 40 * D + H ))).csv.age"
j_gone="purge-journal-$(stamp_at $(( now - 40 * D - H ))).csv.age"
odd="db-manual-copy.dump.age"
for n in "$d_keep" "$d_gone" "$j_keep" "$j_gone" "$odd"; do put "$n"; done
# Sunday boundary: any Sunday set younger than 33 d is kept, older is removed – pick stamps on Sundays at those ages.
sun_keep="" sun_gone=""
for t in $(seq $(( now - 33 * D + H )) "$H" $(( now - 26 * D ))); do
  [ "$(date -u -d "@$t" +%u)" = 7 ] && { sun_keep="blobs-$(stamp_at "$t").tar.age"; break; }
done
for t in $(seq $(( now - 33 * D - H )) "-$H" $(( now - 40 * D ))); do
  [ "$(date -u -d "@$t" +%u)" = 7 ] && { sun_gone="blobs-$(stamp_at "$t").tar.age"; break; }
done
put "$sun_keep"; put "$sun_gone"
out=$(bk) && rc=0 || rc=$?
gone() { [ ! -e "$B/$1" ] && [ ! -e "$B/$1.sha256" ] && grep -q "retention: removed $1" <<<"$out"; }
kept() { [ -e "$B/$1" ] && [ -e "$B/$1.sha256" ]; }
if [ "$rc" -eq 0 ] && kept "$d_keep" && gone "$d_gone"; then ok "3 daily sets: 6 d 23 h kept, a weekday set of 7 d 1 h removed with its .sha256"
else ko "3 daily boundary (rc=$rc)"; ls "$B"; echo "$out"; fi
if kept "$sun_keep" && gone "$sun_gone"; then ok "3b Sunday sets: younger than 33 d kept, older removed"
else ko "3b Sunday boundary ($sun_keep / $sun_gone)"; ls "$B"; fi
if kept "$j_keep" && gone "$j_gone"; then ok "3c purge-journal: 39 d 23 h kept, 40 d 1 h removed (SR-BAK-06)"
else ko "3c purge-journal boundary"; ls "$B"; fi
kept "$odd" && ok "3d a name without a full stamp is left alone" || ko "3d odd name removed"

# 45 simulated days of runs every 12 h (+ up to 5 min random delay), from an empty directory.
simulate() { # label skip1 skip2 – run indexes to skip (missed runs)
  local i off maxage=0 n f t a worst=""
  rm -rf "$B" "$T/home/state/backup.lock"
  for i in $(seq 0 89); do
    if [ "$i" = "$2" ] || [ "$i" = "$3" ]; then continue; fi
    off=$(( i * 12 * H + (i * 37 % 300) ))
    # Ages just BEFORE the run: a file lives until the run that removes it, so this is its longest life.
    n=$(( $(date -u +%s) + off ))
    for f in "$B"/*.age; do
      [ -e "$f" ] || continue
      case "$f" in */purge-journal-*) continue ;; esac
      [[ "$(basename "$f")" =~ -([0-9]{8})T([0-9]{2})([0-9]{2})([0-9]{2})Z\. ]] || continue
      t=$(date -u -d "${BASH_REMATCH[1]} ${BASH_REMATCH[2]}:${BASH_REMATCH[3]}:${BASH_REMATCH[4]}" +%s)
      a=$(( n - t )); if [ "$a" -gt "$maxage" ]; then maxage=$a; worst=$(basename "$f"); fi
    done
    FAKE_DATE_OFFSET=$off bk >/dev/null || { ko "$1: run $i failed"; return; }
  done
  local dbs sundays
  dbs=$(find "$B" -name 'db-*.dump.age' | wc -l | tr -d ' ')
  sundays=$(find "$B" -name 'db-*.dump.age' | while read -r f; do
    s=$(basename "$f" | sed -E 's/^db-([0-9]{8})T.*/\1/'); if [ "$(date -u -d "$s" +%u)" = 7 ]; then echo x; fi; done | wc -l | tr -d ' ')
  if [ "$maxage" -lt $(( 35 * D )) ]; then
    ok "$1: oldest file seen just before a run $(( maxage / D )) d $(( maxage % D / H )) h – always < 35 days; $dbs db sets kept ($sundays on Sundays)"
  else ko "$1: $worst reached $(( maxage / D )) d $(( maxage % D / H )) h"; fi
}
# The two missed runs are the ones at which the first Sunday set reaches 33 days: its removal waits 24 h more.
first_sun=0; while [ "$(date -u -d "@$(( $(date -u +%s) + first_sun * 12 * H ))" +%u)" != 7 ]; do first_sun=$((first_sun + 1)); done
simulate "4b 45 days, a run every 12 h, the two runs due to remove the first Sunday set missed" $((first_sun + 66)) $((first_sun + 67))
simulate "4 45 days, a run every 12 h" x x
# Daily sets (state of case 4): the 14 runs of the last 7 days, the last run included.
last=$(( $(date -u +%s) + 89 * 12 * H ))
recent=$(find "$B" -name 'db-*.dump.age' | while read -r f; do
  [[ "$(basename "$f")" =~ -([0-9]{8})T([0-9]{2})([0-9]{2})([0-9]{2})Z\. ]]
  t=$(date -u -d "${BASH_REMATCH[1]} ${BASH_REMATCH[2]}:${BASH_REMATCH[3]}:${BASH_REMATCH[4]}" +%s)
  if [ $(( last - t )) -lt $(( 7 * D )) ]; then echo x; fi; done | wc -l | tr -d ' ')
[ "$recent" -ge 14 ] && ok "4d the last 7 days keep every run ($recent db sets)" || ko "4d only $recent db sets of the last 7 days"

# ── 3. ops-check backup: limit 14 h by default (12 h between runs + margin) ──
O="$T/oc"; mkdir -p "$O/infra/server/bin" "$O/home/state"
cp "$src/bin/ops-check.sh" "$O/infra/server/bin/ops-check.sh"
printf '#!/usr/bin/env bash\nexit 0\n' > "$O/infra/server/bin/dc"; chmod +x "$O/infra/server/bin/dc" "$O/infra/server/bin/ops-check.sh"
printf 'APP_ENV=staging\nALERT_WEBHOOK_URL=\nHEARTBEAT_URL=\n' > "$O/home/.env"
ocb() { env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$O/home" bash "$O/infra/server/bin/ops-check.sh" backup 2>&1 || true; }
date -u -d "@$(( $(date -u +%s) - 13 * H ))" +%Y-%m-%dT%H:%M:%SZ > "$O/home/state/backup.last_ok"
out=$(ocb); grep -q '^ok   backup: last backup 13 h ago' <<<"$out" && ok "5 ops-check backup: 13 h → ok" || { ko "5 13 h"; echo "$out"; }
date -u -d "@$(( $(date -u +%s) - 15 * H ))" +%Y-%m-%dT%H:%M:%SZ > "$O/home/state/backup.last_ok"
out=$(ocb); grep -q '^FAIL backup: last successful backup 15 h ago' <<<"$out" && ok "5b ops-check backup: 15 h → FAIL (default limit 14 h)" \
  || { ko "5b 15 h"; echo "$out"; }

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
