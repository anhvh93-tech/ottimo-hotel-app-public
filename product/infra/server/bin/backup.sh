#!/usr/bin/env bash
# Daily encrypted backup of one server (SR-BAK-01…03, hosting-plan 7) – systemd timer ottimo-backup.timer, 03:30
# Asia/Ho_Chi_Minh, as the deploy user. By hand: /opt/ottimo/infra/server/bin/backup.sh
#
#   db-<UTC stamp>.dump.age            pg_dump -Fc of the whole database (superuser over the local socket)
#   blobs-<UTC stamp>.tar.age          the encrypted blob volume (ciphertext already; useless without the KEK)
#   purge-journal-<UTC stamp>.csv.age  purge_journal only (ids, no personal data) – re-applied after a restore
#                                      (SR-BAK-06), so it is kept longer than the rest (40 days)
#   <file>.sha256                      checksum of the encrypted file
# Every file is encrypted with `age` to the PUBLIC key(s) in $OTTIMO_HOME/backup/recipients.txt (SR-BAK-02). The
# private key never lives on this server (INV + OPS password manager) – so nothing here can read a backup, and the
# script refuses to write anything unencrypted. KEK/secrets are NOT in any backup (SR-KEY-10).
# Retention (SR-BAK-03 hard cap 35 days): keep everything < 7 days, Sunday sets < 35 days, delete the rest.
# Off-site copy (SR-BAK-04, R3): the second VPS PULLS $BACKUP_DIR read-only; this server cannot delete it.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
OTTIMO_HOME="${OTTIMO_HOME:-/opt/ottimo}"
export OTTIMO_HOME
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ottimo}"
recipients="$OTTIMO_HOME/backup/recipients.txt"
state="$OTTIMO_HOME/state"

log() {
  echo "[backup $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  logger -t ottimo-backup -- "$*" 2>/dev/null || true
}
die() { log "FAIL: $*"; exit 1; }
dc() { "$here/dc" "$@"; }

command -v age >/dev/null || die "age is not installed (apt install age)"
[ -s "$recipients" ] || die "$recipients missing – add the age PUBLIC key(s) (age1…), never a private key"
if grep -q 'AGE-SECRET-KEY' "$recipients"; then die "$recipients contains a PRIVATE key – remove it from this server"; fi
[ -r "$state/current_tag" ] || die "nothing deployed yet"

umask 077
mkdir -p "$BACKUP_DIR" "$state"
exec 9>"$state/backup.lock"
flock -n 9 || die "another backup is running"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
tmp="$BACKUP_DIR/.tmp-$stamp"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' EXIT

encrypt_to() { # name – stdin → $tmp/<name>.age (kept only if the whole pipeline succeeded: publish)
  age --encrypt --recipients-file "$recipients" -o "$tmp/$1.age"
}
publish() { # name – checksum + atomic move into $BACKUP_DIR
  local name="$1"
  [ -s "$tmp/$name.age" ] || die "$name: empty output"
  (cd "$tmp" && sha256sum "$name.age" > "$name.age.sha256")
  mv "$tmp/$name.age" "$tmp/$name.age.sha256" "$BACKUP_DIR/"
}

# 1. database – custom format (pg_restore can restore selectively); pipefail catches a pg_dump error.
dc exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=6' \
  | encrypt_to "db-$stamp.dump" || die "pg_dump"
publish "db-$stamp.dump"
log "database dumped"

# 2. purge_journal separately (SR-BAK-06): what was deleted after a backup must be deleted again after a restore.
dc exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  <<<'COPY (SELECT * FROM purge_journal ORDER BY purged_at) TO STDOUT WITH (FORMAT csv, HEADER)' \
  | encrypt_to "purge-journal-$stamp.csv" || die "purge_journal export"
publish "purge-journal-$stamp.csv"

# 3. blob volume – read by a throw-away container of the api image (runs as `node`, owner of the volume).
dc run --rm --no-deps -T --entrypoint tar api -C /var/lib/ottimo/blobs -cf - . \
  | encrypt_to "blobs-$stamp.tar" || die "blob archive"
publish "blobs-$stamp.tar"
log "blobs archived"

# 4. retention: < 7 days everything; Sunday (UTC) sets < 35 days; purge-journal < 40 days; nothing older.
now=$(date -u +%s)
shopt -s nullglob
for f in "$BACKUP_DIR"/db-*.age "$BACKUP_DIR"/blobs-*.age "$BACKUP_DIR"/purge-journal-*.age; do
  base=$(basename "$f")
  s=$(sed -E 's/^.*-([0-9]{8})T[0-9]{6}Z\..*$/\1/' <<<"$base")
  [[ "$s" =~ ^[0-9]{8}$ ]] || continue
  t=$(date -u -d "$s" +%s 2>/dev/null) || continue
  age_days=$(( (now - t) / 86400 ))
  keep=0
  case "$base" in
    purge-journal-*) [ "$age_days" -lt 40 ] && keep=1 ;;
    *)
      if [ "$age_days" -lt 7 ]; then keep=1
      elif [ "$age_days" -lt 35 ] && [ "$(date -u -d "$s" +%u)" = "7" ]; then keep=1
      fi ;;
  esac
  if [ "$keep" -eq 0 ]; then rm -f "$f" "$f.sha256"; log "retention: removed $base"; fi
done

date -u +%Y-%m-%dT%H:%M:%SZ > "$state/backup.last_ok"
files=("$BACKUP_DIR"/*.age)
log "OK: ${#files[@]} encrypted files in $BACKUP_DIR"
