#!/usr/bin/env bash
# Test of bin/requeue-email-changed.sh (INT FB-R4-INT-BE-31-02 (b), ARC FB-R4-ARC-BE-31-02, runbook v1.0.3 R9) with a
# stub `dc` (RQ_TEST_DC): no docker, no database. The stub records every psql script it is handed.
# Cases: usage · production refuses the stub · lock held · current_tag / worker tag / worker template checks · no
# 0091 table · dry run writes nothing · --expect must match · the UPDATE (conditions, 7 days, one transaction, exact
# row count) · a refused write says "nothing written" without the raw error · output has counts only.
#   bash infra/server/test/requeue-email-changed.test.sh        (workstation or CI)
set -Eeuo pipefail
here=$(cd "$(dirname "$0")" && pwd)
script="$here/../bin/requeue-email-changed.sh"
T=$(mktemp -d "${TMPDIR:-/tmp}/rq-test.XXXXXX"); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/home/state" "$T/bin"
TAG=sha-0123456789ab
cat > "$T/bin/dc" <<'STUB'
#!/usr/bin/env bash
# stub of bin/dc: `ps … worker` → FAKE_IMG; `exec -T worker node …` → exit FAKE_NODE_RC;
# `exec -T postgres sh -c '<psql>'` → keep the script, answer the count (FAKE_ROWS, then FAKE_ROWS_AFTER) or fail.
log="$OTTIMO_HOME/calls"
if [ "$1" = ps ]; then
  echo "ps $*" >> "$log"
  [ "${FAKE_PS_FAIL:-0}" = 1 ] && { echo 'Cannot connect to the Docker daemon' >&2; exit 1; }
  printf '%b' "${FAKE_IMG:-}"; exit 0
fi
case "$1 $2 $3" in
  "exec -T worker") echo "worker $*" >> "$log"; echo 'internal detail' >&2; exit "${FAKE_NODE_RC:-0}" ;;
  "exec -T postgres")
    n=$(( $(ls "$OTTIMO_HOME"/sql.* 2>/dev/null | wc -l) + 1 ))
    printf '%s\n' "$*" > "$OTTIMO_HOME/cmd.$n"
    cat > "$OTTIMO_HOME/sql.$n"
    if grep -q 'UPDATE outbox_message' "$OTTIMO_HOME/sql.$n"; then
      [ "${FAKE_WRITE_FAIL:-0}" = 1 ] && { echo 'ERROR:  requeue: 1 rows, expected 2 (owner@example.test)' >&2; exit 3; }
      touch "$OTTIMO_HOME/written"; exit 0
    fi
    [ "${FAKE_COUNT_FAIL:-0}" = 1 ] && { echo 'ERROR:  relation "outbox_message" does not exist' >&2; exit 3; }
    if [ -e "$OTTIMO_HOME/written" ]; then echo "rows|${FAKE_ROWS_AFTER:-0}|${FAKE_OLDER:-0}"
    else echo "rows|${FAKE_ROWS:-0}|${FAKE_OLDER:-0}"; fi
    exit 0 ;;
esac
echo "stub dc: unexpected $*" >&2; exit 9
STUB
chmod +x "$T/bin/dc"
pass=0 fail=0
reset() {
  rm -f "$T/home/calls" "$T/home"/sql.* "$T/home"/cmd.* "$T/home/written"
  printf 'APP_ENV=staging\n' > "$T/home/.env"
  echo "$TAG" > "$T/home/state/current_tag"
}
rq() { # env… -- args…
  local envs=()
  while [ "$1" != -- ]; do envs+=("$1"); shift; done; shift
  env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" RQ_TEST_DC="$T/bin/dc" FAKE_IMG="ghcr.io/example/ottimo-api:$TAG\n" \
    ${envs[@]+"${envs[@]}"} bash "$script" "$@" 2>&1
}
check() { # name expected_rc regex output rc
  if [ "$5" = "$2" ] && grep -Eq -- "$3" <<<"$4"; then pass=$((pass + 1)); echo "ok   $1"
  else fail=$((fail + 1)); echo "FAIL $1 (rc=$5): $4"; fi
}
nowrite() { # name
  if [ ! -e "$T/home/written" ] && ! grep -qs 'UPDATE' "$T/home"/sql.* ; then pass=$((pass + 1)); echo "ok   $1: nothing written"
  else fail=$((fail + 1)); echo "FAIL $1: an UPDATE was sent"; fi
}
case_() { # name expected_rc regex env… -- args…
  local name="$1" want="$2" re="$3" out rc=0; shift 3
  reset
  out=$(rq "$@") || rc=$?
  check "$name" "$want" "$re" "$out" "$rc"
  LAST="$out"
}

case_ "no tag → usage"                 2 '^usage: ' --
case_ "bad tag → usage"                2 '^usage: ' -- --tag 'x;rm'
case_ "--apply without --expect"       2 'needs --expect' -- --tag "$TAG" --apply
case_ "--expect not a number"          2 'needs --expect' -- --tag "$TAG" --apply --expect two
case_ "--expect without --apply"       2 'only used with --apply' -- --tag "$TAG" --expect 2
reset; printf 'APP_ENV=production\n' > "$T/home/.env"; rc=0
out=$(env -i PATH="$PATH" HOME="$T" OTTIMO_HOME="$T/home" RQ_TEST_DC="$T/bin/dc" bash "$script" --tag "$TAG" 2>&1) || rc=$?
check "production refuses the test stub" 2 'RQ_TEST_DC is not allowed on production' "$out" "$rc"

case_ "current_tag is another tag"     1 'REFUSED: state/current_tag is not sha-ffffffffffff – run this only on the tag that is live now' -- --tag sha-ffffffffffff
nowrite "current_tag is another tag"
case_ "worker on another tag"          1 'REFUSED: the running worker is not on image tag' FAKE_IMG='ghcr.io/example/ottimo-api:sha-e5fffe05ed55\n' -- --tag "$TAG"
case_ "worker tag + suffix accepted"   0 'dry run' FAKE_IMG="ghcr.io/example/ottimo-api:$TAG-test\n" FAKE_ROWS=1 -- --tag "$TAG"
case_ "no worker running"              1 'REFUSED: expected exactly one running worker container' FAKE_IMG='' -- --tag "$TAG"
case_ "two workers running"            1 'REFUSED: expected exactly one running worker container' FAKE_IMG="a:$TAG\nb:$TAG\n" -- --tag "$TAG"
case_ "docker compose fails"           1 'REFUSED: docker compose failed – worker state unknown$' FAKE_PS_FAIL=1 -- --tag "$TAG"
case_ "worker image without email_changed (v1.0.2)" 1 'REFUSED: the worker image sha-0123456789ab does not know the template email_changed' FAKE_NODE_RC=1 FAKE_ROWS=2 -- --tag "$TAG" --apply --expect 2
nowrite "worker v1.0.2"
case_ "worker probe cannot tell"       1 'REFUSED: could not ask the worker image which templates it knows \(exit 3\)' FAKE_NODE_RC=3 -- --tag "$TAG"
if grep -q 'internal detail' <<<"$LAST"; then fail=$((fail + 1)); echo "FAIL probe stderr forwarded"; else pass=$((pass + 1)); fi
case_ "no user_email_change table"     1 'REFUSED: table user_email_change is missing' FAKE_ROWS=-1 FAKE_OLDER=-1 -- --tag "$TAG"
case_ "count query fails"              1 'REFUSED: count query failed – nothing written$' FAKE_COUNT_FAIL=1 -- --tag "$TAG"

# Dry run: counts, the exact --apply line to use, nothing written; READ ONLY session; payload only compared.
case_ "dry run prints counts"          0 'dead BAD_TEMPLATE email_changed: 2 within 7 days \(to requeue\), 1 older \(left as they are\)' FAKE_ROWS=2 FAKE_OLDER=1 -- --tag "$TAG"
if grep -q -- "--tag $TAG --apply --expect 2\$" <<<"$LAST" && grep -q 'INV consent' <<<"$LAST"; then pass=$((pass + 1)); echo "ok   dry run names the --apply line"
else fail=$((fail + 1)); echo "FAIL dry run line: $LAST"; fi
nowrite "dry run"
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on" psql' "$T/home/cmd.1"; then pass=$((pass + 1)); echo "ok   count runs READ ONLY"
else fail=$((fail + 1)); echo "FAIL count not read only"; fi
sql=$(tr -s ' \n' ' ' < "$T/home/sql.1")
for want in "to_regclass('public.user_email_change') IS NOT NULL AS has_uec \\gset" \
  "count(*) FILTER (WHERE created_at > now() - interval '7 days')" "count(*) FILTER (WHERE created_at <= now() - interval '7 days')" \
  "FROM outbox_message WHERE topic = 'staff.email' AND status = 'dead' AND last_error = 'BAD_TEMPLATE' AND payload->>'template' = 'email_changed';"; do
  if grep -qF -- "$want" <<<"$sql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL count sql lacks: $want"; fi
done
if grep -qiE 'select[^;]*payload *(,|from)|old_email|\bemail\b *(,|from)' <<<"$sql"; then fail=$((fail + 1)); echo "FAIL count sql selects personal data: $sql"
else pass=$((pass + 1)); echo "ok   count sql selects numbers only"; fi

case_ "--expect differs from the count" 1 'REFUSED: --expect 3 but 2 row\(s\) match now – nothing written' FAKE_ROWS=2 -- --tag "$TAG" --apply --expect 3
nowrite "--expect differs"
case_ "nothing to requeue"             0 'nothing to requeue' FAKE_ROWS=0 FAKE_OLDER=4 -- --tag "$TAG" --apply --expect 0
nowrite "nothing to requeue"

# --apply: one transaction, the UPDATE of INT 02 (b) + 7 days, row count checked inside it.
case_ "apply requeues"                 0 'requeued 2 row\(s\); dead BAD_TEMPLATE email_changed within 7 days now: 0\.' FAKE_ROWS=2 FAKE_ROWS_AFTER=0 -- --tag "$TAG" --apply --expect 02
upd=$(grep -l 'UPDATE outbox_message' "$T/home"/sql.* | head -n 1)
usql=$(tr -s ' \n' ' ' < "$upd")
for want in "BEGIN; DO \$requeue\$ DECLARE k integer; BEGIN" \
  "UPDATE outbox_message SET status = 'pending', attempts = 0, next_attempt_at = NULL, last_error = NULL" \
  "WHERE topic = 'staff.email' AND status = 'dead' AND last_error = 'BAD_TEMPLATE' AND payload->>'template' = 'email_changed' AND created_at > now() - interval '7 days';" \
  "GET DIAGNOSTICS k = ROW_COUNT; IF k <> 2 THEN RAISE EXCEPTION" "END \$requeue\$; COMMIT;"; do
  if grep -qF -- "$want" <<<"$usql"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL update sql lacks: $want"; fi
done
if [ "$(grep -o 'UPDATE' <<<"$usql" | wc -l | tr -d ' ')" = 1 ] && ! grep -qiE 'delete|truncate|insert|payload *=|set payload' <<<"$usql"; then
  pass=$((pass + 1)); echo "ok   one UPDATE, nothing else written"
else fail=$((fail + 1)); echo "FAIL update sql: $usql"; fi
if grep -qF 'default_transaction_read_only' "$(sed 's/sql\./cmd./' <<<"$upd")"; then fail=$((fail + 1)); echo "FAIL the write ran read only"
else pass=$((pass + 1)); fi
case_ "write refused by the database"  1 'REFUSED: the database refused the UPDATE \(row count changed or query error\) – nothing written' FAKE_ROWS=2 FAKE_WRITE_FAIL=1 -- --tag "$TAG" --apply --expect 2
if grep -qE '@|ERROR|expected 2' <<<"$LAST"; then fail=$((fail + 1)); echo "FAIL raw database error forwarded: $LAST"
else pass=$((pass + 1)); echo "ok   raw database error not forwarded"; fi

# Lock: not while deploy.sh holds state/deploy.lock (flock is on the servers; skipped where it is missing).
if command -v flock >/dev/null; then
  reset
  exec 8>"$T/home/state/deploy.lock"; flock 8
  rc=0; out=$(rq FAKE_ROWS=1 -- --tag "$TAG" --apply --expect 1) || rc=$?
  exec 8>&-
  check "deploy lock held" 1 'REFUSED: a deploy or rollback is running' "$out" "$rc"
  nowrite "deploy lock held"
else echo "skip deploy lock case (no flock here; CI ubuntu has it)"; fi

# Every line printed is a log line with numbers / fixed words – never an address or a payload.
reset
out=$(rq FAKE_ROWS=2 FAKE_OLDER=1 -- --tag "$TAG"; rq FAKE_ROWS=2 FAKE_ROWS_AFTER=0 -- --tag "$TAG" --apply --expect 2)
if ! grep -q '@' <<<"$out" && ! grep -vq '^\[requeue-email ' <<<"$out"; then pass=$((pass + 1)); echo "ok   output: log lines only, no address"
else fail=$((fail + 1)); echo "FAIL output: $out"; fi

[ -x "$script" ] && { pass=$((pass + 1)); echo "ok   script is executable"; } || { fail=$((fail + 1)); echo "FAIL script not executable"; }
echo "requeue-email-changed: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
