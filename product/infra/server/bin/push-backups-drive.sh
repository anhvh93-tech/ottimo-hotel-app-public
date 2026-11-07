#!/usr/bin/env bash
# Off-site copy of the encrypted backups on the company Google Drive (INV 07/11/2026: replaces the Mac copy of
# SR-BAK-04; pull-backups.sh stays as an optional second copy). Runs ON the server, as the deploy user, from the
# systemd timer ottimo-offsite@<stack>.timer (04:00 + 16:00 Vietnam time, one hour after each backup.sh run). By hand:
#   push-backups-drive.sh                       push the new backup files, record the state ops-check `offsite` reads
#   push-backups-drive.sh --init                install pass, once: create the server's own inbox folder in "My Drive"
#                                               and print its id (INV then drags it into "OTTIMO App/Sao lưu")
#   push-backups-drive.sh --check [--vault-folder <id of Kho>]
#                                               install check: config, token file, rclone version, granted scope is
#                                               exactly drive.file, the inbox folder is reachable and writable, and –
#                                               with --vault-folder – that the server CANNOT see Kho
#
# Why the server cannot wipe old backups (no Shared Drive, so no "Contributor" role – INV 07/11):
#   - The server holds an OAuth token of the company account with the scope drive.file ONLY (offsite-authorize.sh
#     refuses any broader grant). drive.file = the server sees and can change only the files it created itself through
#     its own OAuth client "ottimo-server-upload". Nothing else in the Drive exists for it.
#   - It uploads into its own folder "Nhận" (created by --init, kept inside "OTTIMO App/Sao lưu" in My Drive).
#   - The Apps Script mover (infra/drive/apps-script/Code.gs), running inside Google as the same company account but as
#     ANOTHER OAuth client, checks each file against its .sha256, makes a COPY in "OTTIMO App/Sao lưu/Kho" and then
#     deletes the server's original. The copy was created by the Apps Script, so the server's drive.file token cannot
#     see, change or delete it. Window of exposure: a file is deletable by the server only while it waits in Nhận
#     (normally < 1 h; > 6 h is an alert). The 35-day retention of Kho is done by the Apps Script, never by the server.
#   - This script itself never runs a delete, move, purge or sync command (test: offsite-drive.test.sh) and uploads
#     with `copy --immutable` (a name already in Nhận is never overwritten).
#
# What is pushed: the *.age files of $BACKUP_DIR (already age-encrypted by backup.sh – no new encryption here) whose
# UTC stamp is younger than OFFSITE_PUSH_DAYS (default 6, max 6: Kho never removes a file younger than 7 days) and that
# were not pushed before (state/offsite/pushed.lst) and are not in Nhận. The data file first, its .sha256 after it.
#
# Settings (.env of the stack, NOT secret, never in the repository – typed at the install pass):
#   OFFSITE_DRIVE_TOKEN_FILE       absolute path of the token file written by offsite-authorize.sh (client id, client
#                                  secret, refresh token). Mode 0400, owner = deploy user, outside $OTTIMO_HOME, /opt
#                                  and /var/backups (no backup set, no bundle copy ever holds it), parent directory not
#                                  writable by others. Default: /etc/ottimo-offsite/<stack>/drive-oauth.json
#   OFFSITE_DRIVE_INBOX_FOLDER_ID  id of the folder made by --init (part after /folders/ in the browser address)
#   OFFSITE_PUSH_DAYS              optional, 1..6 (default 6)
#   OFFSITE_BWLIMIT                optional rclone --bwlimit (default 8M = 8 MiB/s, keeps the guest pages fast)
# Neither set = not configured: exit 0, nothing pushed (staging). Only one set = configuration error.
#
# State (ops-check `offsite` reads it; no id, path, account or error text – only times, counts, fixed words):
#   state/offsite/last_ok        UTC epoch of the last successful push run
#   state/offsite/last_fail      "<UTC epoch> <fixed category>" of the last failed run
#   state/offsite/vault_newest   UTC stamp (epoch) of the newest db dump the mover has taken from Nhận (pushed earlier,
#                                gone from Nhận together with its .sha256 = copied to Kho; the mover deletes only after
#                                a verified copy). 0 = none yet
#   state/offsite/inbox_stale    backup files waiting in Nhận for more than 6 h (the mover stopped or refused them)
#   state/offsite/pushed.lst     "<name> <epoch pushed>" for the last 8 days
# The raw rclone error goes to a private file removed at exit; the journal and the webhook only get the category.
# Exit: 0 ok / not configured · 1 push or check failed · 2 usage, configuration, token file or rclone version.
set -Eeuo pipefail

RCLONE_PIN=v1.75.2   # same as install-rclone.sh (test: offsite-drive.test.sh)
here=$(cd "$(dirname "$0")" && pwd)
cd /
if [ -z "${OTTIMO_HOME:-}" ] && [ -f "$here/../../../.ottimo-home" ]; then OTTIMO_HOME=$(cd "$here/../../.." && pwd); fi
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/$(basename "$OTTIMO_HOME")}"
RCLONE_BIN="${RCLONE_BIN:-/usr/local/bin/rclone}"
OAUTH="${OFFSITE_OAUTH_BASE:-https://oauth2.googleapis.com}"
state="$OTTIMO_HOME/state/offsite"
INBOX_STALE_HOURS=6
INBOX_NAME="OTTIMO server - Nhan"
NAME_RE='^(db|blobs|counts|purge-journal|privacy-notice)-([0-9]{8})T([0-9]{6})Z\.(dump|tar|txt|csv|log)\.age$'

mode=push vault_probe=""
while [ $# -gt 0 ]; do
  case "$1" in
    --init) mode=init; shift ;;
    --check) mode=check; shift ;;
    --vault-folder) vault_probe="$2"; shift 2 ;;
    *) echo "usage: $0 [--init | --check [--vault-folder <id>]]" >&2; exit 2 ;;
  esac
done

log() {
  echo "[offsite $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  logger -t ottimo-offsite -- "$*" 2>/dev/null || true
}
envval() { sed -n "s/^$1=//p" "$OTTIMO_HOME/.env" 2>/dev/null | tail -n 1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'; }
die_cfg() { log "CONFIG: $*"; mkdir -p "$state" 2>/dev/null && echo "$(date -u +%s) configuration" > "$state/last_fail"; exit 2; }
id_ok() { [[ "$1" =~ ^[A-Za-z0-9_-]{10,128}$ ]]; }

tokf=$(envval OFFSITE_DRIVE_TOKEN_FILE)
inbox=$(envval OFFSITE_DRIVE_INBOX_FOLDER_ID)
push_days=$(envval OFFSITE_PUSH_DAYS); push_days=${push_days:-6}
bwlimit=$(envval OFFSITE_BWLIMIT); bwlimit=${bwlimit:-8M}

if [ -z "$tokf$inbox" ] && [ "$mode" = push ]; then
  log "not configured (no OFFSITE_DRIVE_* in .env) – nothing pushed"
  exit 0
fi
umask 077
mkdir -p "$state"
[ -n "$tokf" ] || die_cfg "OFFSITE_DRIVE_TOKEN_FILE must be set (offsite-authorize.sh writes the file)"
if [ "$mode" != init ]; then
  [ -n "$inbox" ] || die_cfg "OFFSITE_DRIVE_INBOX_FOLDER_ID must be set (push-backups-drive.sh --init prints it)"
  id_ok "$inbox" || die_cfg "the inbox folder id has an unexpected form"
fi
[ -z "$vault_probe" ] || id_ok "$vault_probe" || die_cfg "--vault-folder has an unexpected form"
[[ "$push_days" =~ ^[1-6]$ ]] || die_cfg "OFFSITE_PUSH_DAYS must be 1..6 (Kho keeps every file < 7 days)"
[[ "$bwlimit" =~ ^[0-9]+[KMG]?$ ]] || die_cfg "OFFSITE_BWLIMIT must look like 8M"

# ---- the token file: where it is and who can read it (its content is only parsed, never printed) ----
case "$tokf" in /*) ;; *) die_cfg "the token file path must be absolute" ;; esac
[ -e "$tokf" ] || die_cfg "the token file is missing (offsite-authorize.sh)"
[ ! -L "$tokf" ] && [ -f "$tokf" ] || die_cfg "the token file must be a regular file, not a link"
home_real=$(cd "$OTTIMO_HOME" 2>/dev/null && pwd -P || echo "$OTTIMO_HOME")
tok_real=$(cd "$(dirname "$tokf")" && pwd -P)/$(basename "$tokf")
for bad in "$home_real" "$OTTIMO_HOME" /opt /var/backups "$BACKUP_DIR"; do
  case "$tok_real/" in "$bad"/*) die_cfg "the token file must live outside $bad (project, bundle and backup directories)" ;; esac
done
read -r kmode kuid < <(stat -c '%a %u' "$tokf")
[ "$kmode" = 400 ] || die_cfg "the token file must have mode 0400 (found $kmode)"
[ "$kuid" = "$(id -u)" ] || die_cfg "the token file must belong to the deploy user"
dmode=$(stat -c '%a' "$(dirname "$tok_real")")
[ $(( 8#$dmode & 8#022 )) -eq 0 ] || die_cfg "the token directory must not be writable by group or others"
jq -e '.type == "ottimo_drive_oauth" and .scope == "drive.file" and (.client_id | type == "string")
  and (.client_secret | type == "string") and (.refresh_token | type == "string")' "$tokf" >/dev/null 2>&1 \
  || die_cfg "the token file is not the drive.file token of offsite-authorize.sh"

# ---- rclone: the pinned version (installed by install-rclone.sh from the checked release zip) ----
[ -x "$RCLONE_BIN" ] || die_cfg "rclone is not installed (infra/server/bin/install-rclone.sh)"
have=$("$RCLONE_BIN" version 2>/dev/null | sed -n '1s/^rclone //p')
[ "$have" = "$RCLONE_PIN" ] || die_cfg "rclone ${have:-?} found, $RCLONE_PIN expected (install-rclone.sh)"

work=$(mktemp -d "${TMPDIR:-/tmp}/ottimo-offsite.XXXXXX")
err="$work/rclone.err"
: > "$err"
trap 'rm -rf "$work"' EXIT
# A private rclone.conf for this run only (0600 in a private temp dir – the unit has PrivateTmp): rclone refreshes the
# access token from the refresh token and may write the new access token here; it is removed at exit.
write_conf() { # root folder id ("" = My Drive root, --init only) [vault probe id]
  jq -r --arg root "$1" --arg vroot "${2:-}" '
    def remote(name; root): "[\(name)]\ntype = drive\nscope = drive.file\nclient_id = \(.client_id)\n" +
      "client_secret = \(.client_secret)\ntoken = " +
      ({access_token: "", token_type: "Bearer", refresh_token: .refresh_token, expiry: "2000-01-01T00:00:00Z"} | tojson) +
      "\nroot_folder_id = \(root)\n";
    remote("ottimoinbox"; $root) + (if $vroot != "" then "\n" + remote("ottimovaultprobe"; $vroot) else "" end)
  ' "$tokf" > "$work/rclone.conf"
}
export RCLONE_CONFIG="$work/rclone.conf" RCLONE_CACHE_DIR="$work/cache" TZ=UTC
rc() { "$RCLONE_BIN" --retries 3 --low-level-retries 10 --stats 0 --log-level ERROR "$@" 2>>"$err"; }

# Why an rclone call failed, as a fixed word (the raw text can carry ids and the account address).
category() {
  if grep -qiE 'invalid_grant|unauthorized_client|invalid_client|token (has been )?(expired|revoked)|oauth2' "$err"; then echo "authorisation rejected - run offsite-authorize.sh again"
  elif grep -qiE 'storageQuotaExceeded|quota' "$err"; then echo "Drive storage full or quota"
  elif grep -qiE 'insufficient(File)?Permissions|forbidden|403|permission' "$err"; then echo "permission refused by Drive"
  elif grep -qiE 'notFound|not found|404' "$err"; then echo "inbox folder not found"
  elif grep -qiE 'no such host|dial tcp|timeout|connection refused|network is unreachable|tls' "$err"; then echo "network"
  else echo "other error - run push-backups-drive.sh by hand"
  fi
}
fail() { # what
  local c; c=$(category)
  echo "$(date -u +%s) $1: $c" > "$state/last_fail"
  log "FAIL: $1: $c"
  exit 1
}
stamp_epoch() { # name → epoch of its UTC stamp (nothing when the name is not a backup file)
  [[ "$1" =~ -([0-9]{4})([0-9]{2})([0-9]{2})T([0-9]{2})([0-9]{2})([0-9]{2})Z\. ]] || return 0
  date -u -d "${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]} ${BASH_REMATCH[4]}:${BASH_REMATCH[5]}:${BASH_REMATCH[6]}" +%s 2>/dev/null || true
}

if [ "$mode" = init ]; then
  write_conf ""
  rc lsjson --dirs-only --no-modtime ottimoinbox: > "$work/root.json" || fail "init: listing My Drive"
  id=$(jq -r --arg n "$INBOX_NAME" '[.[] | select(.Name == $n)] | if length == 1 then .[0].ID else "" end' "$work/root.json")
  if [ -z "$id" ]; then
    [ "$(jq --arg n "$INBOX_NAME" '[.[] | select(.Name == $n)] | length' "$work/root.json")" = 0 ] \
      || { echo "several folders" > "$err"; fail "init: more than one folder named '$INBOX_NAME' made by the server"; }
    rc mkdir "ottimoinbox:$INBOX_NAME" || fail "init: creating the inbox folder"
    rc lsjson --dirs-only --no-modtime ottimoinbox: > "$work/root.json" || fail "init: listing My Drive"
    id=$(jq -r --arg n "$INBOX_NAME" '[.[] | select(.Name == $n)][0].ID // ""' "$work/root.json")
  fi
  id_ok "$id" || { echo "no id" > "$err"; fail "init: folder id not found"; }
  log "init: inbox folder '$INBOX_NAME' ready. Put this line in .env:  OFFSITE_DRIVE_INBOX_FOLDER_ID=$id"
  log "init: then INV drags the folder from 'My Drive' into 'OTTIMO App/Sao lưu' and renames it 'Nhận' (the id stays)"
  exit 0
fi

write_conf "$inbox" "$vault_probe"
list_inbox() { rc lsf --files-only ottimoinbox: > "$work/inbox.lst" || fail "listing Nhận (inbox)"; }

if [ "$mode" = check ]; then
  # 1. Scope: ask Google which scopes the refresh token carries – anything beyond drive.file (+ openid/email) = FAIL.
  at=$(jq -r '"client_id=\(.client_id)&client_secret=\(.client_secret)&refresh_token=\(.refresh_token)&grant_type=refresh_token"' "$tokf" \
    | curl -sS --max-time 20 --proto '=https' --data-binary @- "$OAUTH/token" 2>>"$err" | jq -r '.access_token // empty') || at=""
  [ -n "$at" ] || { echo "invalid_grant" >> "$err"; fail "check: refreshing the token"; }
  scopes=$(printf 'access_token=%s' "$at" | curl -sS --max-time 20 --proto '=https' --data-binary @- "$OAUTH/tokeninfo" 2>>"$err" \
    | jq -r '.scope // empty') || scopes=""
  [ -n "$scopes" ] || fail "check: reading the token scope"
  for s in $scopes; do
    case "$s" in
      https://www.googleapis.com/auth/drive.file | openid | email | https://www.googleapis.com/auth/userinfo.email) ;;
      *) echo "$(date -u +%s) check: token scope broader than drive.file" > "$state/last_fail"
         log "FAIL: check: the token carries a scope beyond drive.file – revoke it and run offsite-authorize.sh --replace"; exit 1 ;;
    esac
  done
  log "check: token scope is drive.file only – ok"
  # 2. The inbox is reachable and writable (probe file: the mover removes it within the hour).
  list_inbox
  probe="probe-$(date -u +%Y%m%dT%H%M%SZ).txt"
  echo "OTTIMO off-site probe - the Apps Script mover removes it" > "$work/$probe"
  rc copyto --immutable "$work/$probe" "ottimoinbox:$probe" || fail "check: upload to Nhận (inbox)"
  log "check: Nhận readable and writable ($(wc -l < "$work/inbox.lst" | tr -d ' ') file(s) waiting) – ok"
  # 3. Optional: the server must not see Kho (drive.file: files copied by the Apps Script do not exist for it).
  if [ -n "$vault_probe" ]; then
    : > "$err"
    if rc lsf --files-only ottimovaultprobe: > "$work/vault.lst" && [ -s "$work/vault.lst" ]; then
      echo "$(date -u +%s) check: the server CAN SEE Kho" > "$state/last_fail"
      log "FAIL: check: the server lists $(wc -l < "$work/vault.lst" | tr -d ' ') file(s) in Kho – the token or the mover is wrong (Kho must hold Apps Script copies only)"
      exit 1
    fi
    log "check: Kho is invisible to the server – ok"
  fi
  log "check: OK"
  exit 0
fi

[ -d "$BACKUP_DIR" ] || { echo "no backup dir" > "$err"; fail "backup directory missing"; }
list_inbox
now=$(date -u +%s)
touch "$state/pushed.lst"
# keep 8 days of push records
awk -v min=$((now - 8 * 86400)) 'NF == 2 && $2 >= min' "$state/pushed.lst" > "$work/pushed.lst"

# Local candidates: every complete pair (file + .sha256) younger than push_days, never pushed, not in Nhận.
: > "$work/data.lst"; : > "$work/sums.lst"
shopt -s nullglob
for f in "$BACKUP_DIR"/*.age; do
  base=$(basename "$f")
  [[ "$base" =~ $NAME_RE ]] || continue
  [ -s "$f.sha256" ] || continue
  t=$(stamp_epoch "$base"); [ -n "$t" ] || continue
  [ $(( now - t )) -lt $(( push_days * 86400 )) ] || continue
  for n in "$base" "$base.sha256"; do
    if ! awk -v n="$n" '$1 == n { found = 1 } END { exit !found }' "$work/pushed.lst" && ! grep -qxF "$n" "$work/inbox.lst"; then
      case "$n" in *.sha256) echo "$n" >> "$work/sums.lst" ;; *) echo "$n" >> "$work/data.lst" ;; esac
    fi
  done
done
n_data=$(wc -l < "$work/data.lst" | tr -d ' ')
n_sums=$(wc -l < "$work/sums.lst" | tr -d ' ')
if [ "$n_data" -gt 0 ]; then
  rc copy --immutable --no-traverse --bwlimit "$bwlimit" --files-from-raw "$work/data.lst" "$BACKUP_DIR" ottimoinbox: \
    || fail "upload to Nhận (inbox)"
fi
if [ "$n_sums" -gt 0 ]; then
  rc copy --immutable --no-traverse --files-from-raw "$work/sums.lst" "$BACKUP_DIR" ottimoinbox: \
    || fail "upload of the .sha256 files to Nhận (inbox)"
fi
cat "$work/data.lst" "$work/sums.lst" | awk -v t="$now" 'NF { print $1, t }' >> "$work/pushed.lst"

# rclone checks the MD5 Google reports for every uploaded file against the local one; a file no longer listed in Nhận
# right after the upload was taken by the mover (it runs hourly), which is what the next lines count as "in Kho".
list_inbox
cp "$work/pushed.lst" "$state/pushed.lst"

# State for ops-check: newest db dump taken by the mover; files waiting too long in Nhận.
newest=0
while read -r n _; do
  [[ "$n" =~ ^db-.*\.dump\.age$ ]] || continue
  grep -qxF "$n" "$work/inbox.lst" && continue
  grep -qxF "$n.sha256" "$work/inbox.lst" && continue
  t=$(stamp_epoch "$n"); [ -n "$t" ] && [ "$t" -gt "$newest" ] && newest=$t
done < "$work/pushed.lst"
prev=$(head -n 1 "$state/vault_newest" 2>/dev/null || echo 0); [[ "$prev" =~ ^[0-9]+$ ]] || prev=0
[ "$newest" -ge "$prev" ] || newest=$prev
stale=0
while IFS= read -r n; do
  [[ "$n" =~ \.age(\.sha256)?$ ]] || continue
  t=$(stamp_epoch "$n"); [ -n "$t" ] || continue
  [ $(( now - t )) -lt $(( INBOX_STALE_HOURS * 3600 )) ] || stale=$((stale + 1))
done < "$work/inbox.lst"
echo "$newest" > "$state/vault_newest"
echo "$stale" > "$state/inbox_stale"
date -u +%s > "$state/last_ok"
if [ "$newest" -gt 0 ]; then age_h=$(( (now - newest) / 3600 )); else age_h="-"; fi
log "OK: pushed $n_data file(s) + $n_sums checksum(s); newest backup taken to Kho ${age_h} h old; $stale file(s) waiting > ${INBOX_STALE_HOURS} h in Nhận"
