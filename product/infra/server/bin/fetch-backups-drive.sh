#!/usr/bin/env bash
# Download ONE backup set from "OTTIMO App/Sao lưu/Kho" (company Google Drive) for a restore drill or a rebuild
# (README infra/server 10, runbook-vps-moi.md) – on the drill machine or the new server. No Mac needed. TYPED BY INV
# (it signs in to the company account), in an SSH session opened with a tunnel so the browser of INV's computer can
# finish the Google sign-in:
#   ssh -L 53682:127.0.0.1:53682 <admin>@<drill machine>          (any computer with ssh, Windows included)
#   fetch-backups-drive.sh --vault-folder <id of Kho> --to <empty dir> [--stamp 20261107T080000Z]
# It asks (hidden) for the Client ID and Client secret of the OAuth client "ottimo-restore" (type "Desktop app",
# consent screen INTERNAL), then runs rclone's sign-in: answer "y" ("use web browser"), open the link it prints in the
# browser of INV's computer, check the company account at the top right, allow READ-ONLY Drive access.
# The server's own upload token (drive.file) cannot do this: it never sees Kho (push-backups-drive.sh header).
# Without --stamp: the newest COMPLETE set in Kho (db, blobs, counts, purge-journal, each with its .sha256;
# privacy-notice when the set has it). Read only: lists and downloads, never writes, moves or deletes on Drive. Files
# stay age-encrypted; the age identity is not needed here. Every .sha256 is verified locally (exit 1 on a mismatch).
# At the end – also on failure – the read-only token is REVOKED at Google and the private rclone config is removed,
# so nothing that can read the Drive stays on the machine.
# Exit: 0 set downloaded and verified · 1 checksum mismatch / incomplete set · 2 usage, rclone, Drive or sign-in error.
set -Eeuo pipefail

RCLONE_PIN=v1.75.2   # same as install-rclone.sh
RCLONE_BIN="${RCLONE_BIN:-/usr/local/bin/rclone}"
OAUTH="${OFFSITE_OAUTH_BASE:-https://oauth2.googleapis.com}"
vault="" to="" stamp=""
while [ $# -gt 0 ]; do
  case "$1" in
    --vault-folder) vault="$2"; shift 2 ;;
    --to) to="$2"; shift 2 ;;
    --stamp) stamp="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$vault" ] && [ -n "$to" ] || { echo "usage: $0 --vault-folder <id> --to <dir> [--stamp <stamp>]" >&2; exit 2; }
[[ "$vault" =~ ^[A-Za-z0-9_-]{10,128}$ ]] || { echo "--vault-folder has an unexpected form" >&2; exit 2; }
[ -z "$stamp" ] || [[ "$stamp" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || { echo "--stamp must look like 20261107T080000Z" >&2; exit 2; }
[ -x "$RCLONE_BIN" ] && [ "$("$RCLONE_BIN" version 2>/dev/null | sed -n '1s/^rclone //p')" = "$RCLONE_PIN" ] \
  || { echo "rclone $RCLONE_PIN required (install-rclone.sh)" >&2; exit 2; }
command -v jq >/dev/null && command -v curl >/dev/null && command -v sha256sum >/dev/null \
  || { echo "jq, curl and sha256sum are required" >&2; exit 2; }

umask 077
mkdir -p "$to"
work=$(mktemp -d "${TMPDIR:-/tmp}/ottimo-fetch.XXXXXX")
conf="$work/rclone.conf"
revoke() { # the refresh token rclone saved in the private config → revoked at Google, then the config is removed
  local t
  t=$(sed -n 's/^token = //p' "$conf" 2>/dev/null | jq -r '.refresh_token // .access_token // empty' 2>/dev/null || true)
  if [ -n "$t" ]; then
    if printf 'token=%s' "$t" | curl -sS --max-time 20 --proto '=https' --data-binary @- -o /dev/null -w '%{http_code}' \
      "$OAUTH/revoke" 2>/dev/null | grep -q '^200$'; then echo "read-only Drive access revoked" >&2
    else echo "WARNING: could not revoke – remove 'ottimo-restore' in the account's Google security settings" >&2; fi
  fi
  rm -rf "$work"
}
trap revoke EXIT

ask() { local v; if [ -t 0 ]; then IFS= read -rs -p "$1: " v; echo >&2; else IFS= read -r v; fi; printf '%s' "$v" | tr -d '[:space:]'; }
client_id=$(ask "Client ID of ottimo-restore")
client_secret=$(ask "Client secret")
[[ "$client_id" =~ ^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$ ]] || { echo "that is not a Google OAuth Client ID" >&2; exit 2; }
[[ "$client_secret" =~ ^[A-Za-z0-9_-]{20,64}$ ]] || { echo "the Client secret has an unexpected form" >&2; exit 2; }
printf '[ottimovault]\ntype = drive\nscope = drive.readonly\nclient_id = %s\nclient_secret = %s\nroot_folder_id = %s\n' \
  "$client_id" "$client_secret" "$vault" > "$conf"
export RCLONE_CONFIG="$conf" RCLONE_CACHE_DIR="$work/cache" TZ=UTC
echo "Sign-in: answer y, open the printed http://127.0.0.1:53682/… link in the browser of YOUR computer (ssh -L tunnel)." >&2
"$RCLONE_BIN" config reconnect ottimovault: --auth-no-open-browser </dev/tty || { echo "sign-in failed" >&2; exit 2; }
rc() { "$RCLONE_BIN" --retries 3 --low-level-retries 10 --stats 0 --log-level ERROR "$@" 2>>"$work/rclone.err"; }

rc lsf --files-only ottimovault: > "$work/vault.lst" || { echo "could not list Kho (folder id or sign-in account)" >&2; exit 2; }
complete() { # stamp → 0 when db, blobs, counts and purge-journal of that stamp are in Kho with their .sha256
  local s="$1" b
  for b in "db-$s.dump.age" "blobs-$s.tar.age" "counts-$s.txt.age" "purge-journal-$s.csv.age"; do
    grep -qxF "$b" "$work/vault.lst" && grep -qxF "$b.sha256" "$work/vault.lst" || return 1
  done
}
if [ -z "$stamp" ]; then
  while IFS= read -r s; do
    if complete "$s"; then stamp=$s; fi
  done < <(sed -nE 's/^db-([0-9]{8}T[0-9]{6}Z)\.dump\.age$/\1/p' "$work/vault.lst" | sort)
  [ -n "$stamp" ] || { echo "no complete backup set in Kho" >&2; exit 1; }
fi
complete "$stamp" || { echo "set $stamp is not complete in Kho" >&2; exit 1; }
grep -E -- "-$stamp\.[a-z]+\.age(\.sha256)?$" "$work/vault.lst" > "$work/want.lst"
rc copy --ignore-existing --no-traverse --files-from-raw "$work/want.lst" ottimovault: "$to" \
  || { echo "download failed (files already in $to are unchanged)" >&2; exit 2; }
chmod 700 "$to"; find "$to" -type f -exec chmod 600 {} +

bad=0 n=0
while IFS= read -r f; do
  case "$f" in *.sha256) ;; *) continue ;; esac
  n=$((n + 1))
  (cd "$to" && sha256sum -c --status "$f") || { echo "checksum mismatch: $f" >&2; bad=1; }
done < "$work/want.lst"
[ "$bad" -eq 0 ] || exit 1
echo "fetch-backups-drive: set $stamp – $n file(s) downloaded and verified in $to"
