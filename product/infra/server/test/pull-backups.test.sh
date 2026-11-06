#!/usr/bin/env bash
# Test of bin/pull-backups.sh (SEC FB-R4-SEC-OPS-OR-01, TM-52): the off-site copy never loses or replaces a file it
# already holds, whatever the server sends under the same name, and says so (WARNING + exit 3, no .last_pull).
# No VPS: a fake `ssh` first in PATH hands the remote command to the real rrsync, exactly as the server's forced
# command does (`rrsync -ro /var/backups/<stack>`, bootstrap-vps.sh --backup-pull-key), over a temporary "server" dir.
#   bash infra/server/test/pull-backups.test.sh      (CI ubuntu runner; on macOS: needs rsync 3 + rrsync + GNU date –
#   e.g. docker run --rm -v "$PWD/product/infra:/infra:ro" ubuntu:24.04 \
#        bash -c 'apt-get update -qq && apt-get install -y -qq rsync python3 >/dev/null && bash /infra/server/test/pull-backups.test.sh')
# Cases: first pull (only *.age + *.age.sha256, 0700/0600, .last_pull) · a new server file is pulled · the server
# rewrites an old file AND its .sha256 → local bytes kept, WARNING for both names, exit 3, no .last_pull, new files still
# pulled, server untouched · same size + same mtime rewrite still caught (--checksum) · time-only change and a file the
# server deleted → no warning, local copy kept · a server file that fails its own checksum → exit 1 · local retention
# 35 days · server unreachable → exit 2, nothing changed · openrsync refused · --keep-days over 35 refused.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
src=$(cd "$here/.." && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
rrsync_bin=$(command -v rrsync 2>/dev/null || true)
[ -n "$rrsync_bin" ] || [ ! -r /usr/share/doc/rsync/scripts/rrsync ] || rrsync_bin=/usr/share/doc/rsync/scripts/rrsync
if ! rsync --version 2>/dev/null | sed -n 1p | grep -q 'rsync  *version 3' || [ -z "$rrsync_bin" ] \
  || ! command -v python3 >/dev/null || ! command -v sha256sum >/dev/null || ! date -u -d 2026-01-01 +%s >/dev/null 2>&1; then
  echo "skipped: needs rsync 3, rrsync, python3, sha256sum and GNU date – see the header for the docker command" >&2; exit 0
fi

T=$(mktemp -d "${TMPDIR:-/tmp}/pull-test.XXXXXX")
trap 'rm -rf "$T"' EXIT
srv="$T/server" loc="$T/local"
mkdir -p "$srv" "$T/bin" "$T/openrsync"
rrsync_run="$rrsync_bin"; [ -x "$rrsync_bin" ] || rrsync_run="python3 $rrsync_bin"
echo "not a real key" > "$T/key"

cat > "$T/bin/ssh" <<STUB
#!/usr/bin/env bash
# fake ssh: [options] [-l user] host <remote command> → what the restricted key gets on the VPS: rrsync -ro <dir>
while [ \$# -gt 0 ]; do
  case "\$1" in
    -i|-o|-l|-p) shift 2 ;;
    -*) shift ;;
    *) break ;;
  esac
done
[ -z "\${FAKE_SSH_DOWN:-}" ] || { echo "ssh: connect to host \$1 port 22: Connection refused" >&2; exit 255; }
shift
echo "\$*" >> "$T/ssh.log"
SSH_ORIGINAL_COMMAND="\$*" exec $rrsync_run -ro "$srv"
STUB
cat > "$T/openrsync/rsync" <<'STUB'
#!/usr/bin/env bash
echo "openrsync: protocol version 29"
STUB
chmod +x "$T/bin/ssh" "$T/openrsync/rsync"

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
pull() { PATH="$T/bin:$PATH" bash "$src/bin/pull-backups.sh" --host backup.invalid --key "$T/key" --to "$loc" "$@" 2>&1; }
# put <name> <bytes>: a backup file and its checksum on the fake server, as backup.sh writes them.
put() { printf '%s' "$2" > "$srv/$1"; (cd "$srv" && sha256sum "$1" > "$1.sha256"); }
state() { (cd "$1" && find . -type f -printf '%P %s %T@\n' | sort && find . -type f -exec sha256sum {} + | sort); }

today=$(date -u +%Y%m%d); yday=$(date -u -d yesterday +%Y%m%d)
a="db-${yday}T030000Z.dump.age" b="blobs-${yday}T030000Z.tar.age" c="db-${today}T030000Z.dump.age"
d="purge-journal-${today}T030000Z.csv.age" e="privacy-notice-${today}T030000Z.log.age"

echo "== cases"
put "$a" "dump bytes A, encrypted"; put "$b" "blob tar B, encrypted"
echo "not a backup" > "$srv/notes.txt"; echo "half written" > "$srv/.tmp-db-x.dump.age.part"
out=$(pull) && rc=0 || rc=$?
files=$(cd "$loc" && find . -type f ! -name .last_pull -printf '%P\n' | sort | tr '\n' ' ')
want=$(printf '%s\n' "$b" "$b.sha256" "$a" "$a.sha256" | sort | tr '\n' ' ')
if [ "$rc" -eq 0 ] && [ "$files" = "$want" ] && [ -s "$loc/.last_pull" ] && [ "$(stat -c %a "$loc")" = 700 ] \
  && ! find "$loc" -type f ! -perm 600 | grep -q . && grep -q -- '--server --sender' "$T/ssh.log"; then
  ok "1 first pull: only *.age + *.age.sha256, dir 0700, files 0600, .last_pull written (through rrsync -ro)"
else ko "1 first pull (rc=$rc, files: $files)"; echo "$out"; fi

put "$c" "dump bytes C, encrypted"
out=$(pull) && rc=0 || rc=$?
if [ "$rc" -eq 0 ] && cmp -s "$srv/$c" "$loc/$c" && cmp -s "$srv/$c.sha256" "$loc/$c.sha256" && ! grep -q WARNING <<<"$out"; then
  ok "2 a new server file is pulled, no warning"
else ko "2 new file (rc=$rc)"; echo "$out"; fi

cp -a "$srv" "$T/server.good"
cp "$loc/$a" "$T/a.kept"; cp "$loc/$a.sha256" "$T/a.sha256.kept"
put "$a" "planted bytes from a compromised server, other size"; put "$d" "purge journal D, encrypted"
echo "sentinel" > "$loc/.last_pull"; before=$(state "$srv")
out=$(pull) && rc=0 || rc=$?
if [ "$rc" -eq 3 ] && cmp -s "$loc/$a" "$T/a.kept" && cmp -s "$loc/$a.sha256" "$T/a.sha256.kept" \
  && grep -qF "WARNING: server copy changed: $a – local copy kept" <<<"$out" \
  && grep -qF "WARNING: server copy changed: $a.sha256 – local copy kept" <<<"$out" \
  && [ "$(grep -c WARNING <<<"$out")" -eq 2 ] && ! grep -q 'checksum mismatch' <<<"$out" \
  && [ "$(cat "$loc/.last_pull")" = sentinel ]; then
  ok "3 TM-52: server rewrites an old file + its .sha256 → local bytes kept, WARNING for both, exit 3, no .last_pull"
else ko "3 rewritten old file (rc=$rc)"; echo "$out"; fi
if cmp -s "$srv/$d" "$loc/$d" && [ "$(state "$srv")" = "$before" ]; then
  ok "3b new files still pulled in the same run, the server dir is unchanged by the pull"
else ko "3b new file next to a rewrite / server unchanged"; echo "$out"; fi

rm -rf "$srv"; cp -a "$T/server.good" "$srv"
cp "$loc/$b" "$T/b.kept"
printf '%s' "blob tar X, encrypted" > "$T/b.new"   # same length as the original bytes
touch -r "$srv/$b" "$T/b.new"; touch -r "$srv/$b.sha256" "$T/b.sum.time"
cp -p "$T/b.new" "$srv/$b"; (cd "$srv" && sha256sum "$b" > "$b.sha256"); touch -r "$T/b.sum.time" "$srv/$b.sha256"
out=$(pull) && rc=0 || rc=$?
if [ "$(stat -c %s "$srv/$b")" = "$(stat -c %s "$T/b.kept")" ] && [ "$rc" -eq 3 ] && cmp -s "$loc/$b" "$T/b.kept" \
  && grep -qF "WARNING: server copy changed: $b – local copy kept" <<<"$out"; then
  ok "4 same size + same mtime rewrite → still caught by content (--checksum), local bytes kept"
else ko "4 same size rewrite (rc=$rc)"; echo "$out"; fi

rm -rf "$srv"; cp -a "$T/server.good" "$srv"
touch -d '2026-01-01 00:00:00' "$srv/$a" "$srv/$a.sha256"; rm -f "$srv/$c" "$srv/$c.sha256"
echo "sentinel" > "$loc/.last_pull"
out=$(pull) && rc=0 || rc=$?
if [ "$rc" -eq 0 ] && ! grep -q WARNING <<<"$out" && [ -e "$loc/$c" ] && [ -e "$loc/$c.sha256" ] && cmp -s "$loc/$a" "$T/a.kept" \
  && [ "$(cat "$loc/.last_pull")" != sentinel ]; then
  ok "5 time-only change → no warning; a file the server deleted stays here; .last_pull refreshed"
else ko "5 time-only / deleted on server (rc=$rc)"; echo "$out"; fi

printf '%s' "notice log E, encrypted" > "$srv/$e"; echo "0000000000000000000000000000000000000000000000000000000000000000  $e" > "$srv/$e.sha256"
echo "sentinel" > "$loc/.last_pull"
out=$(pull) && rc=0 || rc=$?
if [ "$rc" -eq 1 ] && grep -qF "checksum mismatch: $e.sha256" <<<"$out" && ! grep -q WARNING <<<"$out" \
  && [ "$(cat "$loc/.last_pull")" = sentinel ]; then
  ok "6 a server file that fails its own checksum → exit 1, no .last_pull"
else ko "6 bad checksum (rc=$rc)"; echo "$out"; fi
rm -f "$srv/$e" "$srv/$e.sha256" "$loc/$e" "$loc/$e.sha256"

old="db-20200105T030000Z.dump.age"
echo x > "$loc/$old"; (cd "$loc" && sha256sum "$old" > "$old.sha256")
out=$(pull) && rc=0 || rc=$?
if [ "$rc" -eq 0 ] && [ ! -e "$loc/$old" ] && [ ! -e "$loc/$old.sha256" ] && [ -e "$loc/$a" ] && [ -e "$loc/$c" ]; then
  ok "7 local retention: a set older than 35 days is removed, recent ones kept"
else ko "7 retention (rc=$rc)"; echo "$out"; fi

before=$(state "$loc")
out=$(FAKE_SSH_DOWN=1 pull) && rc=0 || rc=$?
if [ "$rc" -eq 2 ] && grep -q 'could not list the server copy – nothing pulled' <<<"$out" && [ "$(state "$loc")" = "$before" ]; then
  ok "8 server unreachable → exit 2, local copy and .last_pull unchanged"
else ko "8 unreachable (rc=$rc)"; echo "$out"; fi

out=$(PATH="$T/openrsync:$T/bin:$PATH" bash "$src/bin/pull-backups.sh" --host backup.invalid --key "$T/key" --to "$T/never" 2>&1) && rc=0 || rc=$?
if [ "$rc" -eq 2 ] && grep -q 'openrsync is not accepted' <<<"$out" && [ ! -e "$T/never" ]; then
  ok "9 openrsync refused before anything is created"
else ko "9 openrsync (rc=$rc)"; echo "$out"; fi

out=$(pull --keep-days 40) && rc=0 || rc=$?
if [ "$rc" -eq 2 ] && grep -q 'SR-BAK-03' <<<"$out"; then ok "10 --keep-days over 35 refused"
else ko "10 keep-days (rc=$rc)"; echo "$out"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
