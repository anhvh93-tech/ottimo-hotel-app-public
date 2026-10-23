#!/usr/bin/env bash
# Off-site copy of the encrypted backups (SR-BAK-04, R3 v1.0) – runs on the OPS/INV machine (macOS or Linux), NOT on
# the VPS. Pulls with a dedicated key that the server forces to `rrsync -ro /var/backups/<stack>` (bootstrap-vps.sh
# --backup-pull-key): read-only, that directory only, no shell. The files stay age-encrypted; the private key is not
# needed here.
#   pull-backups.sh --host <vps address> --key ~/.ssh/ottimo_backup_pull --to ~/.ottimo/backups/ottimo-prod
# Never deletes what the server deleted (a compromised server cannot wipe this copy); prunes LOCAL files older than
# 35 days itself (SR-BAK-03 cap applies to every copy). Writes <to>/.last_pull (UTC) – check it in the weekly review.
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

umask 077
mkdir -p "$to"
# Only the encrypted files and their checksums; partial files are not kept.
rsync -rt --chmod=F600,D700 --include '*.age' --include '*.age.sha256' --exclude '*' \
  -e "ssh -i $key -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20" \
  "ottimo@$host:./" "$to/"

# Verify every checksum that arrived (a corrupted copy is worse than none – it hides the gap).
bad=0
for sum in "$to"/*.age.sha256; do
  [ -e "$sum" ] || continue
  (cd "$to" && { sha256sum -c "$(basename "$sum")" >/dev/null 2>&1 || shasum -a 256 -c "$(basename "$sum")" >/dev/null 2>&1; }) \
    || { echo "checksum mismatch: $(basename "$sum")" >&2; bad=1; }
done

# Local retention by the date in the file name (…-YYYYMMDDTHHMMSSZ…).
now=$(date -u +%s)
for f in "$to"/*.age "$to"/*.age.sha256; do
  [ -e "$f" ] || continue
  d=$(basename "$f" | sed -E 's/^.*-([0-9]{8})T[0-9]{6}Z\..*$/\1/')
  [[ "$d" =~ ^[0-9]{8}$ ]] || continue
  t=$(date -u -d "$d" +%s 2>/dev/null || date -u -j -f '%Y%m%d' "$d" +%s 2>/dev/null) || continue
  [ $(( (now - t) / 86400 )) -lt "$keep_days" ] || rm -f -- "$f"
done
date -u +%Y-%m-%dT%H:%M:%SZ > "$to/.last_pull"
n=$(find "$to" -name '*.age' | wc -l | tr -d ' ')
echo "pull-backups: $n encrypted files in $to"
exit "$bad"
