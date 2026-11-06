#!/usr/bin/env bash
# Test of ops-check `journal` (v1.0.5 V5-63, ARC contract 0.3.13 1.15, SEC FB-R5-SEC-ARC-07) and of the journald
# switch in the bundle. No server, no journal: a copy of ops-check.sh next to a stub `dc` (ps --quiet), and stub
# `docker` (inspect → log driver), `journalctl` (oldest entry, "Suppressed" lines) and `getent` (groups, passwd).
#   bash infra/server/test/ops-check-journal.test.sh   (CI ubuntu runner; on macOS: needs bash ≥ 4 and GNU date –
#   e.g. docker run --rm -v "$PWD/product/infra:/infra:ro" ubuntu:24.04 bash /infra/server/test/ops-check-journal.test.sh)
# Cases: all good → ok · a container on another driver → FAIL · journal unreadable → FAIL · oldest entry 92 / 95 days
# → FAIL, 91 → ok · early rotation (since 40 d, oldest 20 d; since 200 d, oldest 88 d) → WARN and the run passes,
# 39 of 40 → ok · journald_since missing → WARN · "Suppressed" lines in 24 h → WARN · extra member of adm (listed or
# by primary group), of docker → FAIL, allowed through LOG_READER_USERS → ok · wrong owner / world-readable journal
# file → FAIL · output and state hold no member name · `journal` in the full run · bundle: compose + edge on journald
# without max-size/max-file, postgres log_error_verbosity=terse, daemon.json journald, 50-ottimo.conf caps, the
# ops-check units get the group.
# + SEC FB-R5-SEC-OPS-93-01: a WARN that is already lit ("rotated early") and then gains a new cause ("Suppressed")
# sends a second webhook; the same causes again send nothing; the state file keeps fixed reason keys, no numbers.
# + SEC FB-R5-SEC-OPS-93-04: an extra member of sudo / wheel → FAIL; a named user or another group in the ACL of the
# journal directory → FAIL, Ubuntu's own adm/wheel ACL → ok.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/.." && pwd)
infra=$(cd "$src/.." && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if [ "${BASH_VERSINFO[0]}" -lt 4 ] || ! date -u -d 2026-01-01 +%s >/dev/null 2>&1; then
  echo "skipped: needs bash ≥ 4 and GNU date – see the header for the docker command" >&2; exit 0
fi

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
D=86400

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/bin" "$T/fake" "$T/home/state" "$T/journal/m1"
cp "$src/bin/ops-check.sh" "$T/bin/ops-check.sh"
cat > "$T/bin/dc" <<'STUB'
#!/usr/bin/env bash
[ "$*" = "ps --quiet" ] || { echo "stub dc: unexpected $*" >&2; exit 9; }
[ "${FAKE_DC_FAIL:-0}" = 1 ] && { echo 'Cannot connect to the Docker daemon' >&2; exit 1; }
printf '%s\n' ${FAKE_IDS:-c1 c2 c3}
STUB
cat > "$T/fake/docker" <<'STUB'
#!/usr/bin/env bash
[ "$1" = inspect ] || { echo "stub docker: unexpected $*" >&2; exit 9; }
id="${*: -1}"; v="FAKE_DRIVER_$id"; echo "${!v:-journald}"
STUB
cat > "$T/fake/journalctl" <<'STUB'
#!/usr/bin/env bash
case " $* " in *" --system "*) ;; *) echo "stub journalctl: --system missing" >&2; exit 9 ;; esac
[ "${FAKE_JOURNAL:-}" = unreadable ] && { echo 'No journal files were opened due to insufficient permissions.' >&2; exit 1; }
case " $* " in
  *" -t systemd-journald "*)
    echo "Journal started"
    for _ in $(seq 1 "${FAKE_SUP:-0}"); do echo "Suppressed 1234 messages from docker.service"; done ;;
  *)
    now=$(date -u +%s)
    echo "$((now - ${FAKE_OLDEST_DAYS:-30} * 86400 - 3600)).123456 host systemd[1]: first entry"
    echo "$((now - 60)).000001 host dockerd[9]: later entry" ;;
esac
STUB
cat > "$T/fake/getent" <<'STUB'
#!/usr/bin/env bash
case "$1 ${2:-}" in
  "group adm") echo "adm:x:4:${FAKE_ADM-syslog,ottimo-admin}" ;;
  "group systemd-journal") echo "systemd-journal:x:999:${FAKE_SJ-}" ;;
  "group docker") echo "docker:x:998:${FAKE_DOCKER-ottimo}" ;;
  "group sudo") echo "sudo:x:27:${FAKE_SUDO-ottimo-admin}" ;;
  "group wheel") [ -n "${FAKE_WHEEL:-}" ] || exit 2; echo "wheel:x:10:$FAKE_WHEEL" ;;
  "passwd ")
    printf 'root:x:0:0::/root:/bin/bash\nsyslog:x:104:110::/home/syslog:/usr/sbin/nologin\nottimo:x:2001:2001::/home/ottimo:/bin/bash\n'
    [ -n "${FAKE_PASSWD_EXTRA:-}" ] && printf '%s\n' "$FAKE_PASSWD_EXTRA" ;;
  *) exit 2 ;;
esac
STUB
cat > "$T/fake/getfacl" <<'STUB'
#!/usr/bin/env bash
[ "$1 $2" = "-p --omit-header" ] || { echo "stub getfacl: unexpected $*" >&2; exit 9; }
printf '%s\n' user::rwx group::r-x group:adm:r-x group:wheel:r-x mask::r-x other::r-x \
  default:user::rwx default:group::r-x default:group:adm:r-x default:group:wheel:r-x default:mask::r-x default:other::r-x
[ -n "${FAKE_ACL_EXTRA:-}" ] && printf '%s\n' "$FAKE_ACL_EXTRA"; exit 0
STUB
# fake curl: keeps what would go to the alert webhook (one line per post)
cat > "$T/fake/curl" <<STUB
#!/usr/bin/env bash
while [ "\$#" -gt 0 ]; do [ "\$1" = --data ] && { printf '%s\n' "\$2" >> "$T/webhook.log"; shift; }; shift; done
STUB
if ! command -v jq >/dev/null; then # ubuntu:24.04 has no jq: enough of it for notify's one call
  printf '#!/usr/bin/env bash\nprintf '"'"'{"text":"%%s"}\\n'"'"' "$4"\n' > "$T/fake/jq"
fi
chmod +x "$T/bin/dc" "$T/bin/ops-check.sh" "$T/fake/"*
touch "$T/journal/m1/system.journal"; chmod 0640 "$T/journal/m1/system.journal"
owner=$(stat -c '%U:%G' "$T/journal")
printf 'APP_ENV=production\nALERT_WEBHOOK_URL=\nHEARTBEAT_URL=\n' > "$T/home/.env"
since() { date -u -d "@$(( $(date -u +%s) - $1 * D ))" +%F > "$T/home/state/journald_since"; }

out="" rc=0
jrun() { # env… → $out, $rc
  rc=0
  out=$(env -i PATH="$T/fake:$PATH" HOME="$T" OTTIMO_HOME="$T/home" OPS_CHECK_JOURNALCTL="$T/fake/journalctl" \
    OPS_CHECK_GETENT="$T/fake/getent" OPS_CHECK_GETFACL="$T/fake/getfacl" OPS_CHECK_JOURNAL_DIR="$T/journal" \
    OPS_CHECK_JOURNAL_OWNER="$owner" "$@" \
    bash "$T/bin/ops-check.sh" journal 2>&1) || rc=$?
}
expect() { # name rc regex env…
  local name="$1" want_rc="$2" want="$3"; shift 3
  jrun "$@"
  if [ "$rc" = "$want_rc" ] && grep -Eq "$want" <<<"$out"; then ok "$name"; else ko "$name (rc=$rc): $out"; fi
}

since 30
expect "1 all good → ok" 0 '^ok   journal: oldest entry 30 days \(cap 90\), no dropped lines in 24 h, containers on journald, log readers as allowed$'
expect "2 a container on the local driver → FAIL" 1 '^FAIL journal: 1 running container\(s\) of the stack do not log to journald' FAKE_DRIVER_c2=local
expect "2b docker compose fails → FAIL, not 'unreadable'" 1 '^FAIL journal: docker compose failed, container state unknown' FAKE_DC_FAIL=1
expect "3 journal unreadable → FAIL" 1 '^FAIL journal: journal unreadable \(the ops-check unit needs SupplementaryGroups=systemd-journal\)$' FAKE_JOURNAL=unreadable
since 120
expect "4 oldest entry 95 days → FAIL" 1 '^FAIL journal: oldest journal entry is 95 days old \(cap 90 days' FAKE_OLDEST_DAYS=95
expect "4b oldest entry 92 days → FAIL" 1 '^FAIL journal: oldest journal entry is 92 days old' FAKE_OLDEST_DAYS=92
expect "4c oldest entry 91 days → ok" 0 '^ok   journal: oldest entry 91 days' FAKE_OLDEST_DAYS=91
since 40
expect "5 since 40 d, oldest 20 d → WARN, run passes" 0 '^WARN journal: journal rotated early: oldest entry 20 days old, expected at least 39 ' FAKE_OLDEST_DAYS=20
if grep -q '^WARN ' "$T/home/state/ops-check/journal"; then ok "5b WARN is kept in the state file (alert once)"; else ko "5b state: $(cat "$T/home/state/ops-check/journal")"; fi
expect "6 since 40 d, oldest 39 d → ok" 0 '^ok   journal: oldest entry 39 days' FAKE_OLDEST_DAYS=39
since 200
expect "7 since 200 d, oldest 88 d → WARN (expected 89)" 0 '^WARN journal: journal rotated early: oldest entry 88 days old, expected at least 89 ' FAKE_OLDEST_DAYS=88
expect "7b since 200 d, oldest 89 d → ok" 0 '^ok   journal: oldest entry 89 days' FAKE_OLDEST_DAYS=89
rm -f "$T/home/state/journald_since"
expect "8 journald_since missing → WARN" 0 '^WARN journal: state/journald_since missing or not YYYY-MM-DD' FAKE_OLDEST_DAYS=10
since 30
expect "9 two Suppressed lines in 24 h → WARN" 0 '^WARN journal: journald dropped lines 2 time\(s\) in 24 h' FAKE_SUP=2
expect "10 adm has a member outside the list → FAIL, count only" 1 '^FAIL journal: group adm has 1 member\(s\) outside the allowed list' FAKE_ADM=syslog,ottimo-admin,guestops
if grep -q 'guestops' <<<"$out$(cat "$T/home/state/ops-check/journal")"; then ko "10b a member name is printed: $out"; else ok "10b output and state hold no member name"; fi
printf 'LOG_READER_USERS=syslog ottimo-admin guestops\n' >> "$T/home/.env"
expect "11 the same member allowed through LOG_READER_USERS → ok" 0 '^ok   journal:' FAKE_ADM=syslog,ottimo-admin,guestops
printf 'APP_ENV=production\nALERT_WEBHOOK_URL=\nHEARTBEAT_URL=\n' > "$T/home/.env"
expect "12 systemd-journal member by primary group → FAIL" 1 '^FAIL journal: group systemd-journal has 1 member\(s\)' FAKE_PASSWD_EXTRA='reader:x:1500:999::/home/reader:/bin/bash'
expect "13 docker has another member → FAIL" 1 '^FAIL journal: group docker has 1 member\(s\)' FAKE_DOCKER=ottimo,ottimo-admin
expect "14 journal directory owner wrong → FAIL" 1 '^FAIL journal: .* \(must be root:systemd-journal\)' OPS_CHECK_JOURNAL_OWNER=root:systemd-journal
chmod 0644 "$T/journal/m1/system.journal"
expect "15 a journal file readable by everyone → FAIL" 1 '^FAIL journal: journal file\(s\) readable by everyone' FAKE_OLDEST_DAYS=10
chmod 0640 "$T/journal/m1/system.journal"
expect "16 FAIL and WARN together → FAIL with both" 1 '^FAIL journal: 1 running container.*; journald dropped lines 1 time' FAKE_DRIVER_c1=local FAKE_SUP=1

# SEC 93-04: sudo, wheel, ACL
expect "25 sudo has a member besides ottimo-admin → FAIL" 1 '^FAIL journal: group sudo has 1 member\(s\) outside the allowed list' FAKE_SUDO=ottimo-admin,ubuntu
expect "25b wheel (when it exists) has a member → FAIL" 1 '^FAIL journal: group wheel has 1 member\(s\)' FAKE_WHEEL=ubuntu
expect "25c wheel with ottimo-admin only → ok" 0 '^ok   journal:' FAKE_WHEEL=ottimo-admin
expect "26 a named user in the journal ACL → FAIL, count only" 1 '^FAIL journal: 1 ACL entr\(y/ies\) on .* for a named user or another group' FAKE_ACL_EXTRA=user:guestops:r-x
expect "26b another group in the default ACL → FAIL" 1 '^FAIL journal: 1 ACL entr' FAKE_ACL_EXTRA=default:group:staff:r-x
if grep -q 'guestops' <<<"$out$(cat "$T/home/state/ops-check/journal")"; then ko "26c an ACL user name is printed: $out"; else ok "26c ACL: output and state hold no user name"; fi

# SEC 93-01: a new cause behind a WARN that is already lit is sent again
since 40; rm -f "$T/home/state/ops-check/journal" "$T/webhook.log"
printf 'APP_ENV=production\nALERT_WEBHOOK_URL=https://alerts.example.invalid/hook\nHEARTBEAT_URL=\n' > "$T/home/.env"
hooks() { if [ -f "$T/webhook.log" ]; then wc -l < "$T/webhook.log" | tr -d ' '; else echo 0; fi; }
expect "27 rotated early → WARN" 0 '^WARN journal: journal rotated early' FAKE_OLDEST_DAYS=20
[ "$(hooks)" = 1 ] && ok "27b first WARN → one webhook" || ko "27b webhooks after the first WARN: $(hooks)"
expect "27c rotated early again → WARN" 0 '^WARN journal: journal rotated early' FAKE_OLDEST_DAYS=20
[ "$(hooks)" = 1 ] && ok "27d same cause again → no new webhook" || ko "27d webhooks: $(hooks)"
expect "28 rotated early + Suppressed → WARN with both" 0 '^WARN journal: journal rotated early.*; journald dropped lines 3 time' FAKE_OLDEST_DAYS=20 FAKE_SUP=3
[ "$(hooks)" = 2 ] && grep -q 'dropped lines 3' "$T/webhook.log" && ok "28b new cause → second webhook (SEC 93-01)" || ko "28b webhooks: $(hooks)"
st=$(cat "$T/home/state/ops-check/journal")
[[ "$st" =~ ^WARN\ [0-9]+\ rotated,suppressed$ ]] && ok "28c state keeps fixed reason keys, no counts" || ko "28c state: $st"
expect "28d Suppressed count changes, same causes → WARN" 0 '^WARN journal:.*dropped lines 5 time' FAKE_OLDEST_DAYS=20 FAKE_SUP=5
[ "$(hooks)" = 2 ] && ok "28e only the count changed → no new webhook" || ko "28e webhooks: $(hooks)"
expect "29 back to good → ok" 0 '^ok   journal:' FAKE_OLDEST_DAYS=39
[ "$(hooks)" = 3 ] && ok "29b recovery → one webhook" || ko "29b webhooks: $(hooks)"
printf 'APP_ENV=production\nALERT_WEBHOOK_URL=\nHEARTBEAT_URL=\n' > "$T/home/.env"

# Wiring and bundle
ocs="$src/bin/ops-check.sh"
if grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(.* sshkeys journal\)' "$ocs" && grep -q '^    journal) check_journal' "$ocs"; then ok "17 journal in the full run"; else ko "17 journal missing from the full run"; fi
prod="$infra/docker-compose.prod.yml" edge="$infra/edge/docker-compose.edge.yml"
nocomment() { grep -Ev '^[[:space:]]*#' "$1"; }
if [ "$(grep -c '^    driver: journald$' "$prod")" = 1 ] && ! nocomment "$prod" | grep -Eq 'driver: local|max-size|max-file'; then
  ok "18 compose: the shared logging block is journald, no max-size/max-file"; else ko "18 compose logging"; fi
if grep -q '^      driver: journald$' "$edge" && ! nocomment "$edge" | grep -Eq 'driver: local|max-size|max-file'; then
  ok "19 edge compose: journald, no max-size/max-file"; else ko "19 edge logging"; fi
if grep -Eq "^    command: \['postgres', '-c', 'log_error_verbosity=terse'(, '-c', '[a-z_]+=[a-z0-9-]+')*\]$" "$prod"; then ok "20 postgres runs log_error_verbosity=terse"; else ko "20 postgres command"; fi
if grep -q '"log-driver": "journald"' "$src/bootstrap-vps.sh" && ! grep -Eq '"max-size"|"max-file"' "$src/bootstrap-vps.sh"; then
  ok "21 daemon.json: journald, no max-size/max-file (dockerd would not start)"; else ko "21 daemon.json"; fi
conf="$src/journald/50-ottimo.conf" good=1
for l in Storage=persistent MaxRetentionSec=90day MaxFileSec=1day 'SystemMaxUse=[0-9]+G' 'SystemKeepFree=[0-9]+G' 'RateLimitBurst=[0-9]+' ForwardToSyslog=no; do
  grep -Eq "^$l$" "$conf" || { good=0; ko "22 50-ottimo.conf lacks $l"; }
done
[ "$good" = 1 ] && ok "22 50-ottimo.conf: persistent, 90 days, 1 file a day, size caps, rate limit, no syslog copy"
if grep -q 'journald.conf.d/50-ottimo.conf' "$src/bootstrap-vps.sh" && grep -q 'state/journald_since' "$src/bootstrap-vps.sh"; then
  ok "23 bootstrap installs the drop-in and writes journald_since"; else ko "23 bootstrap journald"; fi
good=1
for u in "$src/systemd/ottimo-ops-check@.service" "$src/systemd/ottimo-ops-check.service"; do
  grep -q '^SupplementaryGroups=systemd-journal$' "$u" || { good=0; ko "24 $(basename "$u") lacks SupplementaryGroups=systemd-journal"; }
done
[ "$good" = 1 ] && ok "24 both ops-check units read the journal through SupplementaryGroups"

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
