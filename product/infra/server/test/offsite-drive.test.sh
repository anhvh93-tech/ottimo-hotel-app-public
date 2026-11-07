#!/usr/bin/env bash
# Test of the Google Drive off-site copy (INV 07/11/2026): push-backups-drive.sh against a fake rclone (a local
# directory stands for the folder "Nhận"), the token-file rules, the pinned rclone version, ops-check `offsite`, the
# systemd units, and the rule that the server side never deletes, moves or syncs anything on Drive.
#   bash infra/server/test/offsite-drive.test.sh   (CI ubuntu runner; on macOS: GNU stat/date needed –
#   docker run --rm -v "$PWD/product/infra:/infra:ro" ubuntu:24.04 bash -c 'apt-get update -qq && apt-get install -y -qq jq >/dev/null && bash /infra/server/test/offsite-drive.test.sh')
# No network, no Google account: every Drive call goes to the stub.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/.." && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if [ "${BASH_VERSINFO[0]}" -lt 4 ] || ! date -u -d 2026-01-01 +%s >/dev/null 2>&1 || ! stat -c %a / >/dev/null 2>&1 \
  || ! command -v jq >/dev/null; then
  echo "skipped: needs bash ≥ 4, GNU date/stat and jq – see the header for the docker command" >&2; exit 0
fi

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
T=$(mktemp -d)
trap 'chmod -R u+w "$T" 2>/dev/null; rm -rf "$T"' EXIT
push="$src/bin/push-backups-drive.sh"

# ── fake rclone: version, lsf, lsjson, mkdir, copy --files-from-raw, copyto; every call logged ──
mkdir -p "$T/bin" "$T/drive/inbox" "$T/drive/root"
cat > "$T/bin/rclone" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "$*" >> "$FAKE_DRIVE/calls.log"
[ "${1:-}" = version ] && { echo "rclone ${FAKE_RCLONE_VERSION:-v1.75.2}"; exit 0; }
[ -n "${FAKE_RCLONE_FAIL:-}" ] && { echo "$FAKE_RCLONE_FAIL" >&2; exit 1; }
args=() files="" immutable=0
while [ $# -gt 0 ]; do
  case "$1" in
    --retries | --low-level-retries | --stats | --log-level | --bwlimit) shift 2 ;;
    --files-from-raw) files="$2"; shift 2 ;;
    --immutable) immutable=1; shift ;;
    --no-traverse | --files-only | --dirs-only | --no-modtime) shift ;;
    *) args+=("$1"); shift ;;
  esac
done
grep -q '^\[ottimoinbox\]' "$RCLONE_CONFIG" || { echo "no remote" >&2; exit 1; }
grep -q '^scope = drive.file$' "$RCLONE_CONFIG" || { echo "wrong scope" >&2; exit 1; }
dir() { case "$1" in ottimoinbox:*) [ "$(sed -n 's/^root_folder_id = //p' "$RCLONE_CONFIG" | head -n 1)" = "" ] && echo "$FAKE_DRIVE/root" || echo "$FAKE_DRIVE/inbox" ;; esac; }
case "${args[0]}" in
  lsf) ls -1 "$(dir "${args[1]}")" ;;
  lsjson) d=$(dir "${args[1]}"); printf '['; first=1; for x in "$d"/*/; do [ -d "$x" ] || continue; n=$(basename "$x"); [ $first = 1 ] || printf ','; first=0; printf '{"Name":"%s","ID":"inboxFolderId0001","IsDir":true}' "$n"; done; echo ']' ;;
  mkdir) mkdir -p "$(dir "${args[1]}")/${args[1]#*:}" ;;
  copy) d=$(dir "${args[2]}"); while IFS= read -r n; do
          if [ -e "$d/$n" ] && ! cmp -s "${args[1]}/$n" "$d/$n"; then [ $immutable = 1 ] && { echo "immutable: $n modified" >&2; exit 1; }; fi
          cp "${args[1]}/$n" "$d/$n"; done < "$files" ;;
  copyto) cp "${args[1]}" "$(dir "${args[2]}")/${args[2]#*:}" ;;
  *) echo "fake rclone: unsupported ${args[0]}" >&2; exit 3 ;;
esac
EOF
chmod +x "$T/bin/rclone"
export FAKE_DRIVE="$T/drive" RCLONE_BIN="$T/bin/rclone"

H=3600
now=$(date -u +%s)
home="$T/opt/ottimo-prod"; bdir="$T/backups"; tokd="$T/etc/ottimo-offsite/ottimo-prod"
mkdir -p "$home/state" "$bdir" "$tokd"
chmod 750 "$tokd"
tok="$tokd/drive-oauth.json"
jq -n '{type: "ottimo_drive_oauth", client_id: "1-a.apps.googleusercontent.com", client_secret: "x", refresh_token: "r", scope: "drive.file"}' > "$tok"
chmod 400 "$tok"
setenv() { printf '%s\n' "APP_ENV=production" "$@" > "$home/.env"; }
run() { OTTIMO_HOME="$home" BACKUP_DIR="$bdir" bash "$push" "$@" > "$T/out" 2>&1; }
mkset() { # epoch – one backup set (fake bytes)
  local s; s=$(date -u -d "@$1" +%Y%m%dT%H%M%SZ)
  for n in "db-$s.dump.age" "blobs-$s.tar.age" "counts-$s.txt.age" "purge-journal-$s.csv.age"; do
    echo "bytes $n" > "$bdir/$n"; (cd "$bdir" && sha256sum "$n" > "$n.sha256")
  done
}

# ── 1. not configured ──
setenv
if run && grep -q 'not configured' "$T/out" && [ ! -e "$home/state/offsite" ]; then ok "1 no OFFSITE_* → exit 0, nothing pushed, no state"; else ko "1 not configured: $(cat "$T/out")"; fi

# ── 2. configuration and token file rules ──
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok"
run && ko "2a token without inbox id accepted" || { [ $? = 2 ] && ok "2a token without inbox id → exit 2"; } || true
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
chmod 600 "$tok"; set +e; run; rc=$?; set -e; chmod 400 "$tok"
[ "$rc" = 2 ] && grep -q 'mode 0400' "$T/out" && ok "2b token mode 0600 → refused" || ko "2b mode: rc=$rc $(cat "$T/out")"
cp -p "$tok" "$home/drive-oauth.json"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$home/drive-oauth.json" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
set +e; run; rc=$?; set -e
[ "$rc" = 2 ] && grep -q 'outside' "$T/out" && ok "2c token inside the project directory → refused" || ko "2c inside: rc=$rc $(cat "$T/out")"
ln -s "$tok" "$tokd/link.json"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tokd/link.json" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
set +e; run; rc=$?; set -e
[ "$rc" = 2 ] && grep -q 'not a link' "$T/out" && ok "2d token as a symlink → refused" || ko "2d link: rc=$rc"
jq -n '{type: "service_account", private_key: "k"}' > "$tokd/sa.json"; chmod 400 "$tokd/sa.json"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tokd/sa.json" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
set +e; run; rc=$?; set -e
[ "$rc" = 2 ] && grep -q 'drive.file token' "$T/out" && ok "2e a file that is not the drive.file token → refused" || ko "2e type: rc=$rc"
chmod 770 "$tokd"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
set +e; run; rc=$?; set -e; chmod 750 "$tokd"
[ "$rc" = 2 ] && grep -q 'not be writable' "$T/out" && ok "2f token directory writable by the group → refused" || ko "2f dir: rc=$rc"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001" "OFFSITE_PUSH_DAYS=9"
set +e; run; rc=$?; set -e
[ "$rc" = 2 ] && ok "2g OFFSITE_PUSH_DAYS > 6 → refused" || ko "2g push days: rc=$rc"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
set +e; FAKE_RCLONE_VERSION=v1.70.0 run; rc=$?; set -e
[ "$rc" = 2 ] && grep -q 'v1.75.2 expected' "$T/out" && ok "2h other rclone version → refused" || ko "2h version: rc=$rc"

# ── 3. push: recent complete pairs only, data before checksum, never twice ──
mkset $((now - 1 * H)); mkset $((now - 13 * H)); mkset $((now - 8 * 86400))
echo "half" > "$bdir/db-$(date -u -d "@$((now - 2 * H))" +%Y%m%dT%H%M%SZ).dump.age"   # no .sha256 yet
: > "$FAKE_DRIVE/calls.log"
if run; then
  n=$(ls "$FAKE_DRIVE/inbox" | wc -l)
  [ "$n" = 16 ] && ok "3a 2 recent sets pushed (8 files + 8 .sha256); the 8-day set and the file without .sha256 not" || ko "3a pushed $n: $(ls "$FAKE_DRIVE/inbox")"
else ko "3a push failed: $(cat "$T/out")"; fi
first_copy=$(grep -n '^.*copy ' "$FAKE_DRIVE/calls.log" | head -n 1)
grep -q -- '--immutable' <<<"$first_copy" && ok "3b uploads use --immutable" || ko "3b no --immutable"
dline=$(grep -n -- '--bwlimit' "$FAKE_DRIVE/calls.log" | head -n 1 | cut -d: -f1); sline=$(grep -n 'copy' "$FAKE_DRIVE/calls.log" | tail -n 1 | cut -d: -f1)
[ -n "$dline" ] && [ "$dline" -lt "$sline" ] && ok "3c data files uploaded before their .sha256" || ko "3c order"
: > "$FAKE_DRIVE/calls.log"
run && ! grep -q ' copy ' "$FAKE_DRIVE/calls.log" && ! grep -q '^copy' "$FAKE_DRIVE/calls.log" && ok "3d second run: nothing pushed again" || ko "3d re-push: $(cat "$FAKE_DRIVE/calls.log")"
[ "$(cat "$home/state/offsite/vault_newest")" = 0 ] && ok "3e nothing taken by the mover yet → vault_newest 0" || ko "3e vault_newest"

# mover takes the newest set (copy to Kho + delete the originals): the server sees it gone from Nhận
newest_s=$(date -u -d "@$((now - 1 * H))" +%Y%m%dT%H%M%SZ)
rm -f "$FAKE_DRIVE/inbox/"*"$newest_s"*
run
want=$(date -u -d "${newest_s:0:4}-${newest_s:4:2}-${newest_s:6:2} ${newest_s:9:2}:${newest_s:11:2}:${newest_s:13:2}" +%s)
[ "$(cat "$home/state/offsite/vault_newest")" = "$want" ] && ok "3f set gone from Nhận after the push = taken to Kho → vault_newest" || ko "3f vault_newest $(cat "$home/state/offsite/vault_newest")"
left=$(find "$FAKE_DRIVE/inbox" -name "*$newest_s*" | wc -l)
[ "$left" = 0 ] && ok "3g a set the mover took is not pushed again" || ko "3g re-pushed after the move"
[ "$(cat "$home/state/offsite/inbox_stale")" = 8 ] && ok "3h 13-h-old set still in Nhận (4 files + 4 .sha256) → inbox_stale 8 (mover stopped)" || ko "3h stale $(cat "$home/state/offsite/inbox_stale")"

# changed bytes under a name already in Nhận: never overwritten
old_s=$(date -u -d "@$((now - 13 * H))" +%Y%m%dT%H%M%SZ)
rm -f "$home/state/offsite/pushed.lst"
echo "tampered" > "$FAKE_DRIVE/inbox/db-$old_s.dump.age"
run || true
grep -qx tampered "$FAKE_DRIVE/inbox/db-$old_s.dump.age" && ok "3i a name already in Nhận is never overwritten" || ko "3i overwritten"

# ── 4. failure → fixed category in state, no raw text ──
set +e; FAKE_RCLONE_FAIL='googleapi: Error 403: insufficientFilePermissions, secret-folder-id x@y.z' run; rc=$?; set -e
if [ "$rc" = 1 ] && grep -q 'permission refused by Drive' "$home/state/offsite/last_fail" && ! grep -q 'secret-folder-id\|@' "$home/state/offsite/last_fail" "$T/out"; then
  ok "4 rclone error → exit 1, fixed category, no ids or address in state or output"
else ko "4 failure: rc=$rc $(cat "$home/state/offsite/last_fail" 2>/dev/null)"; fi

# ── 5. --init creates the server's folder and prints its id ──
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok"
if run --init && grep -q 'OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001' "$T/out" && [ -d "$FAKE_DRIVE/root/OTTIMO server - Nhan" ]; then
  ok "5 --init: folder created in My Drive, id printed for .env"; else ko "5 init: $(cat "$T/out")"; fi

# ── 6. static rules ──
calls=$(grep -oE '\brc [a-z]+' "$push" | awk '{print $2}' | sort -u | tr '\n' ' ')
[ "$calls" = "copy copyto lsf lsjson mkdir " ] && ok "6a push-backups-drive.sh only lists, creates and copies (rclone: $calls)" || ko "6a rclone commands: $calls"
if grep -nE 'rclone[^#]*\b(delete|deletefile|purge|sync|move|moveto|rmdir|rmdirs|cleanup|dedupe)\b' "$push" "$src/bin/fetch-backups-drive.sh" | grep -v '^\s*#'; then
  ko "6b a destructive rclone command"; else ok "6b no delete/purge/sync/move/cleanup in the server scripts"; fi
fcalls=$(grep -oE '\brc [a-z]+' "$src/bin/fetch-backups-drive.sh" | awk '{print $2}' | sort -u | tr '\n' ' ')
[ "$fcalls" = "copy lsf " ] && grep -q 'scope = drive.readonly' "$src/bin/fetch-backups-drive.sh" && grep -q '/revoke' "$src/bin/fetch-backups-drive.sh" \
  && ok "6c fetch-backups-drive.sh: read-only scope, list + download only, token revoked at exit" || ko "6c fetch: $fcalls"
pins=$(grep -h '^RCLONE_PIN=' "$push" "$src/bin/fetch-backups-drive.sh" "$src/bin/install-rclone.sh" | sed -E 's/^RCLONE_PIN=([^ ]+).*/\1/' | sort -u | wc -l)
[ "$pins" = 1 ] && grep -qE '^SHA256_amd64=[0-9a-f]{64}$' "$src/bin/install-rclone.sh" && grep -qE '^SHA256_arm64=[0-9a-f]{64}$' "$src/bin/install-rclone.sh" \
  && ok "6d one rclone version pinned in all three scripts, both zip checksums present" || ko "6d pins"
grep -q 'drive.file openid email' "$src/bin/offsite-authorize.sh" && grep -q 'REFUSED: Google granted more than drive.file' "$src/bin/offsite-authorize.sh" \
  && ! grep -nE 'curl[^|]*-d "client_secret|client_secret=\$client_secret" "\$OAUTH' "$src/bin/offsite-authorize.sh" \
  && ok "6e offsite-authorize.sh asks drive.file only, refuses a broader grant, secret never in curl argv" || ko "6e authorize"
grep -q 'read -rs' "$src/bin/offsite-authorize.sh" && ok "6f client id/secret at hidden prompts" || ko "6f prompts"

# ── 7. ops-check offsite ──
oc() { OTTIMO_HOME="$home" bash "$src/bin/ops-check.sh" offsite > "$T/oc" 2>&1; }
st="$home/state/offsite"; rm -rf "$st" "$home/state/ops-check"; mkdir -p "$st"
setenv
oc && grep -q 'not configured' "$T/oc" && ok "7a ops-check offsite: not configured → ok" || ko "7a $(cat "$T/oc")"
setenv "OFFSITE_DRIVE_TOKEN_FILE=$tok" "OFFSITE_DRIVE_INBOX_FOLDER_ID=inboxFolderId0001"
set +e; oc; rc=$?; set -e
[ "$rc" = 1 ] && grep -q 'no successful push' "$T/oc" && ok "7b configured, never pushed → FAIL" || ko "7b $(cat "$T/oc")"
echo $((now - 1 * H)) > "$st/last_ok"; echo $((now - 5 * H)) > "$st/vault_newest"; echo 0 > "$st/inbox_stale"
oc && grep -q 'ok   offsite' "$T/oc" && ok "7c fresh push, newest in Kho 5 h → ok" || ko "7c $(cat "$T/oc")"
echo $((now - 37 * H)) > "$st/vault_newest"
set +e; oc; rc=$?; set -e
[ "$rc" = 1 ] && grep -q 'newest backup on Google Drive 37 h old' "$T/oc" && ok "7d newest in Kho 37 h → FAIL" || ko "7d $(cat "$T/oc")"
echo $((now - 5 * H)) > "$st/vault_newest"; echo $((now - 37 * H)) > "$st/last_ok"
set +e; oc; rc=$?; set -e
[ "$rc" = 1 ] && grep -q 'last successful push to Google Drive 37 h ago' "$T/oc" && ok "7e last push 37 h ago → FAIL" || ko "7e $(cat "$T/oc")"
echo $((now - 1 * H)) > "$st/last_ok"; echo "$now upload to Nhan: network" > "$st/last_fail"
set +e; oc; rc=$?; set -e
[ "$rc" = 1 ] && grep -q 'last push run failed: upload to Nhan: network' "$T/oc" && ok "7f last run failed after the last success → FAIL with its category" || ko "7f $(cat "$T/oc")"
echo $((now - 2 * H)) > "$st/last_fail"; echo 3 > "$st/inbox_stale"
set +e; oc; rc=$?; set -e
[ "$rc" = 1 ] && grep -q '3 file(s) waiting > 6 h' "$T/oc" && ok "7g files stuck in Nhận → FAIL (mover stopped); an older failure is not reported" \
  && ! grep -q 'last push run failed' "$T/oc" || ko "7g $(cat "$T/oc")"
grep -Eq '^if \[ "\$#" -gt 0 \].*checks=\(.* journal offsite\)' "$src/bin/ops-check.sh" && ok "7h offsite in the full run" || ko "7h full run"

# ── 8. systemd units ──
u="$src/systemd/ottimo-offsite@.service"; t="$src/systemd/ottimo-offsite@.timer"
grep -qx 'User=ottimo' "$u" && grep -qx 'ProtectSystem=strict' "$u" && grep -qx 'ReadWritePaths=/opt/%i/state' "$u" \
  && grep -qx 'ExecStart=/opt/%i/infra/server/bin/push-backups-drive.sh' "$u" && grep -qx 'PrivateTmp=yes' "$u" \
  && ok "8a service: deploy user, read-only system, writes only its state, private temp" || ko "8a service"
cal=$(sed -n 's/^OnCalendar=//p' "$t" | sort | tr '\n' ' ')
[ "$cal" = "*-*-* 04:00:00 Asia/Ho_Chi_Minh *-*-* 16:00:00 Asia/Ho_Chi_Minh " ] && grep -qx 'Persistent=true' "$t" \
  && ok "8b timer 04:00 + 16:00, one hour after the production backups" || ko "8b timer: $cal"

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
