#!/usr/bin/env bash
# OPTIONAL since 07/11/2026 (INV): the main off-site copy is now the company Google Drive, pushed by the server
# (push-backups-drive.sh, README infra/server 7.1). This pull stays usable as a second copy – kept in parallel for 2
# weeks after the Drive copy runs well and a drill restored from Drive; nothing on the Mac is deleted without INV.
# Off-site copy of the encrypted backups (SR-BAK-04, R3 v1.0) – runs on the OPS/INV machine (macOS or Linux), NOT on
# the VPS. Pulls with a dedicated key that the server forces to `rrsync -ro /var/backups/<stack>` (bootstrap-vps.sh
# --backup-pull-key): read-only, that directory only, no shell. The files stay age-encrypted; the private key is not
# needed here.
#   pull-backups.sh --host <vps address> --key ~/.ssh/ottimo_backup_pull --to ~/.ottimo/backups/ottimo-prod
# A compromised server can neither wipe NOR overwrite this copy (SEC FB-R4-SEC-OPS-OR-01, TM-52):
#   - never deletes what the server deleted (no --delete);
#   - never replaces a file that is already here (--ignore-existing), the .sha256 files included. backup.sh names every
#     file by its UTC second and moves it in place once complete, so a backup file is never rewritten on the server;
#     an existing name with other bytes on the server means that server copy was changed. rsync writes a new file under
#     a temporary name and renames it when complete, so an interrupted pull never leaves a cut file under a real name;
#   - before pulling, compares every name present on both sides by content (rsync --checksum --dry-run, read only on
#     the server): any difference is reported as "WARNING: server copy changed: <name> – local copy kept" and the run
#     ends with exit code 3, after the new files were pulled and checked.
# Prunes LOCAL files older than 35 days itself (SR-BAK-03 cap applies to every copy).
# Exit: 0 = new files pulled (if any) and every local checksum verifies · 1 = a local checksum does not verify ·
# 2 = usage / environment (rsync 3 missing, connection or rsync error) · 3 = a server copy differs from the local one
# (treat as a possible compromise of the server: keep this copy, tell OPS + SEC). <to>/.last_pull (UTC) is written
# only when the exit code is 0 – check it in the weekly review.
# The host is passed at run time (launchd/cron on the machine), never written into the repository.
set -Eeuo pipefail

host="" key="" to="" keep_days=35
while [ $# -gt 0 ]; do
  case "$1" in
    --host) host="$2"; shift 2 ;;
    --key) key="$2"; shift 2 ;;
    --to) to="$2"; shift 2 ;;
    --keep-days) keep_days="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$host" ] && [ -r "$key" ] && [ -n "$to" ] || { echo "usage: $0 --host <vps> --key <private key> --to <dir>" >&2; exit 2; }
[[ "$keep_days" =~ ^[0-9]+$ ]] && [ "$keep_days" -le 35 ] || { echo "--keep-days must be 0..35 (SR-BAK-03)" >&2; exit 2; }

# macOS ships openrsync (rsync 2.6.9 compatible): its server command line is refused by the server's rrsync
# ("invalid rsync-command syntax", 26/10/2026). Use rsync 3 (Homebrew `rsync`, or a Linux container – infra/server/README.md, row "Bản sao lưu ngoài máy").
if rsync --version 2>/dev/null | sed -n 1p | grep -qi openrsync; then
  echo "openrsync is not accepted by rrsync on the server – install rsync 3 (brew install rsync, first in PATH) or run this script in a Linux container" >&2
  exit 2
fi

umask 077
mkdir -p "$to"
ssh_cmd="ssh -i $key -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20"
# Only the encrypted files and their checksums. No --chmod: macOS ships openrsync (rsync 2.6.9 compatible), which
# rejects it (26/10/2026) – umask 077 above plus the chmod below give 0600/0700.
filters=(--include '*.age' --include '*.age.sha256' --exclude '*')

# 1. Names on both sides whose bytes differ (dry run: nothing is written here or there). With --checksum, rsync
#    compares the content of every file of the same size (and sizes otherwise); a new file shows as ">f+++++++++", a
#    file that would be transferred over an existing one as ">f" + change flags. A different time alone (".f..t…") is
#    not a content change.
if ! plan=$(rsync -rtn --checksum --itemize-changes "${filters[@]}" -e "$ssh_cmd" "ottimo@$host:./" "$to/" 2>&1); then
  printf '%s\n' "$plan" | tail -n 5 >&2
  echo "pull-backups: could not list the server copy – nothing pulled" >&2
  exit 2
fi
changed=$(printf '%s\n' "$plan" | awk '$1 ~ /^>f/ && $1 !~ /^>f\+\+\+/ { sub(/^[^ ]+ /, ""); print }')

# 2. Pull the new files only. An existing local file is never replaced, whatever the server holds under its name.
rsync -rt --ignore-existing "${filters[@]}" -e "$ssh_cmd" "ottimo@$host:./" "$to/" \
  || { echo "pull-backups: rsync failed – files already here are unchanged" >&2; exit 2; }

chmod 700 "$to"
find "$to" -type f -exec chmod 600 {} +

# 3. Verify every local checksum (a corrupted copy is worse than none – it hides the gap).
bad=0
for sum in "$to"/*.age.sha256; do
  [ -e "$sum" ] || continue
  (cd "$to" && { sha256sum -c "$(basename "$sum")" >/dev/null 2>&1 || shasum -a 256 -c "$(basename "$sum")" >/dev/null 2>&1; }) \
    || { echo "checksum mismatch: $(basename "$sum")" >&2; bad=1; }
done

# 4. Local retention by the date in the file name (…-YYYYMMDDTHHMMSSZ…).
now=$(date -u +%s)
for f in "$to"/*.age "$to"/*.age.sha256; do
  [ -e "$f" ] || continue
  d=$(basename "$f" | sed -E 's/^.*-([0-9]{8})T[0-9]{6}Z\..*$/\1/')
  [[ "$d" =~ ^[0-9]{8}$ ]] || continue
  t=$(date -u -d "$d" +%s 2>/dev/null || date -u -j -f '%Y%m%d' "$d" +%s 2>/dev/null) || continue
  [ $(( (now - t) / 86400 )) -lt "$keep_days" ] || rm -f -- "$f"
done

rc=$bad
if [ -n "$changed" ]; then
  while IFS= read -r name; do
    if [ -n "$name" ]; then echo "WARNING: server copy changed: $name – local copy kept" >&2; fi
  done <<<"$changed"
  echo "pull-backups: the server holds other bytes under names already copied here – keep this copy, tell OPS + SEC (possible compromise of the server)" >&2
  rc=3
fi
[ "$rc" -ne 0 ] || date -u +%Y-%m-%dT%H:%M:%SZ > "$to/.last_pull"
n=$(find "$to" -name '*.age' | wc -l | tr -d ' ')
echo "pull-backups: $n encrypted files in $to"
exit "$rc"
