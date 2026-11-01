#!/usr/bin/env bash
# Test of bin/backup.sh step 4 (ARC FB-R3-ARC-OPS-CWD-02): state/privacy-notice.log goes into the encrypted backup set
# as privacy-notice-<stamp>.log.age (+ .sha256), follows the same retention, and its absence is not an error.
# No server, no database: a copy of backup.sh next to a stub `dc` (answers the psql coprocess, pg_dump, COPY and the
# blob tar with fake bytes) and a stub `age` (copies stdin – encryption itself is not under test here).
#   bash infra/server/test/backup-privacy-log.test.sh      (CI ubuntu runner; on macOS: needs bash ≥ 4, flock, GNU date –
#   e.g. docker run --rm -v "$PWD/product/infra:/infra:ro" ubuntu:24.04 bash /infra/server/test/backup-privacy-log.test.sh)
# Cases: log present → privacy-notice-<stamp>.log.age with the same bytes + valid checksum · no log → no file, backup ok
# · a privacy-notice set older than 35 days is removed by retention, a recent one kept · psql dying at once ends the
# backup with a clear FAIL line, not "unbound variable" (SEC PR23-S1).
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/.." && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
if [ "${BASH_VERSINFO[0]}" -lt 4 ] || ! command -v flock >/dev/null || ! date -u -d 2026-01-01 +%s >/dev/null 2>&1; then
  echo "skipped: needs bash ≥ 4 (coproc), flock and GNU date – see the header for the docker command" >&2; exit 0
fi

T=$(mktemp -d "${TMPDIR:-/tmp}/bpl-test.XXXXXX")
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/infra/server/bin" "$T/home/state" "$T/home/backup" "$T/stubs" "$T/backups"
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
  *"-tA -F"*)  # the coprocess: snapshot id, then the counts until the end marker
    [ -n "${FAKE_PSQL_DEAD:-}" ] && { echo "service postgres is not running" >&2; exit 1; }
    while IFS= read -r line; do
      case "$line" in
        *pg_export_snapshot*) echo "00000003-0000001B-1" ;;
        *end-of-counts*) for t in a b c d e f g h i j k; do echo "table_$t 1"; done; echo "end-of-counts 0" ;;
        '\q') exit 0 ;;
      esac
    done ;;
  *) cat > /dev/null; echo "id,purged_at" ;;  # COPY purge_journal
esac
STUB
cat > "$T/stubs/age" <<'STUB'
#!/usr/bin/env bash
# stub: age --encrypt --recipients-file <f> -o <out>  → stdin copied to <out>
out=""; while [ $# -gt 0 ]; do [ "$1" = "-o" ] && out="$2"; shift; done
cat > "$out"
STUB
chmod +x "$T/infra/server/bin/dc" "$T/infra/server/bin/backup.sh" "$T/stubs/age"

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
bk() { PATH="$T/stubs:$PATH" OTTIMO_HOME="$T/home" BACKUP_DIR="$T/backups" bash "$T/infra/server/bin/backup.sh" 2>&1; }

echo "== cases"
printf '%s\n' "2026-10-30T10:39:53Z apply operator=owner landing=sha-1 version=2026-10-24 sha_en=aa sha_vi=bb rc=0" \
  "  NOTICE:  RESULT: published (inserted: vi,en, already present: -)" > "$T/home/state/privacy-notice.log"
out=$(bk) && rc=0 || rc=$?
f=$(find "$T/backups" -name 'privacy-notice-*.log.age' | head -n 1)
if [ "$rc" -eq 0 ] && [ -n "$f" ] && cmp -s "$f" "$T/home/state/privacy-notice.log" \
  && (cd "$T/backups" && sha256sum -c "$(basename "$f").sha256" >/dev/null) && grep -q 'privacy-notice.log saved (2 lines)' <<<"$out"; then
  ok "1 privacy-notice.log → $(basename "$f") with the same bytes and a valid checksum"
else ko "1 log saved (rc=$rc)"; echo "$out"; fi
if find "$T/backups" -name 'db-*.dump.age' | grep -q . && grep -q 'OK: ' <<<"$out"; then ok "1b the rest of the set is still written"
else ko "1b rest of the set"; echo "$out"; fi

rm -rf "$T/backups"; mkdir -p "$T/backups"; rm -f "$T/home/state/privacy-notice.log"
out=$(bk) && rc=0 || rc=$?
if [ "$rc" -eq 0 ] && ! find "$T/backups" -name 'privacy-notice-*' | grep -q . && grep -q 'no state/privacy-notice.log' <<<"$out"; then
  ok "2 no privacy-notice.log → no file, backup still ok"
else ko "2 no log (rc=$rc)"; echo "$out"; fi

# 2020-01-05 is a Sunday, far past 35 days → removed; yesterday → kept.
old="privacy-notice-20200105T033000Z.log.age"; y=$(date -u -d yesterday +%Y%m%d)
recent="privacy-notice-${y}T033000Z.log.age"
for n in "$old" "$recent"; do echo x > "$T/backups/$n"; echo "x  $n" > "$T/backups/$n.sha256"; done
out=$(bk) && rc=0 || rc=$?
if [ "$rc" -eq 0 ] && [ ! -e "$T/backups/$old" ] && [ ! -e "$T/backups/$old.sha256" ] && [ -e "$T/backups/$recent" ] \
  && grep -q "retention: removed $old" <<<"$out"; then
  ok "3 retention: a privacy-notice set older than 35 days is removed, yesterday's kept"
else ko "3 retention (rc=$rc)"; echo "$out"; fi

out=$(FAKE_PSQL_DEAD=1 bk) && rc=0 || rc=$?
if [ "$rc" -ne 0 ] && grep -qE 'FAIL: (psql did not start|no snapshot from psql|unexpected snapshot id)' <<<"$out" && ! grep -q 'unbound variable' <<<"$out"; then
  ok "4 psql dies at once → clear FAIL line, no 'unbound variable'"
else ko "4 psql dead (rc=$rc)"; echo "$out"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
