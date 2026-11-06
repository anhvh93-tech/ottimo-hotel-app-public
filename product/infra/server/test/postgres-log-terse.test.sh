#!/usr/bin/env bash
# Test of SEC FB-R5-SEC-ARC-08 (v1.0.5, with V5-63): the Postgres server's own error lines carry no row values.
# Runs the image of docker-compose.prod.yml with the `command` of its postgres service (read from the file, not
# copied), on a throw-away container without network, and provokes the three errors whose DETAIL quotes data:
# unique ("Key (email)=(…) already exists"), CHECK and NOT NULL ("Failing row contains (…)"). The statements use the
# extended protocol with bound parameters, like the api (node-postgres), so STATEMENT lines hold `$1`, not values.
# Control run: the same errors WITHOUT the setting must show the values – otherwise the test proves nothing.
# SEC FB-R5-SEC-OPS-93-03: the container also answers pg_settings for the five pinned settings – each must have its
# pinned value AND source "command line" (the control run shows "default", e.g. log_parameter_max_length = -1).
#   bash infra/server/test/postgres-log-terse.test.sh   (needs docker; PG_IMAGE=postgres:17-alpine PG_PULL=never
#   to use a local image instead of the pinned digest)
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
prod="$here/../../docker-compose.prod.yml"
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
command -v docker >/dev/null || { echo "skipped: docker is required" >&2; exit 0; }

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }

# image + command of the postgres service, as written in the compose file
svc=$(awk '/^  postgres:$/ { on = 1; next } on && /^  [a-z]/ { exit } on' "$prod")
image="${PG_IMAGE:-$(sed -n 's/^    image: //p' <<<"$svc" | head -n 1)}"
# flow list on one line (`command: ['postgres', …]`) or wrapped by prettier over several lines up to `]`
cmdline=$(awk '/^    command:/ { on = 1; sub(/^    command: */, "") } on { buf = buf $0; if ($0 ~ /\]/) { print buf; exit } }' <<<"$svc" |
  sed -E 's/^ *\[//; s/\] *$//')
[ -n "$cmdline" ] || { ko "postgres service has no command"; echo "== $pass passed, $fail failed"; exit 1; }
args=()
while IFS= read -r a; do [ -n "$a" ] && args+=("$a"); done < <(tr ',' '\n' <<<"$cmdline" | sed -E "s/^ +//; s/ +$//; s/^'//; s/'$//")
[ "${args[0]}" = postgres ] && ok "compose: postgres command = ${args[*]}" || ko "compose: command does not start postgres: ${args[*]}"
case " ${args[*]} " in *" log_error_verbosity=terse "*) ok "compose: log_error_verbosity=terse" ;; *) ko "compose: no log_error_verbosity=terse" ;; esac
pins="log_error_verbosity=terse log_min_duration_statement=-1 log_parameter_max_length=0 log_parameter_max_length_on_error=0 log_statement=none"

secret="guest.terse-$$@example.invalid" phone="0900$$"
# ARC FB-R5-ARC-OPS-11: the image's entrypoint first runs a TEMPORARY server for initdb that listens on the Unix
# socket only (listen_addresses=''). It also logs "ready to accept connections" and is stopped ~90 ms later, before
# the real server opens TCP. A socket `pg_isready` could say "ready" to the temporary server; the SQL then landed
# while the server restarted, `|| true` swallowed the psql error and the test said "control: … did not show the
# values" instead of "could not connect". So: wait for the real server over TCP loopback (`--network none` keeps
# `lo`), send every psql over TCP as well (the temporary server never answers there), and a server that cannot be
# reached is a HARNESS failure with its own message, never a finding about the log setting.
provoke() { # name args… → prints the container log, or one line `HARNESS-ERROR <what>` when postgres is not reachable
  local name="$1" up=0 rc=0 out
  shift
  docker run -d --name "$name" --network none --pull="${PG_PULL:-missing}" -e POSTGRES_PASSWORD=test-only \
    -e POSTGRES_HOST_AUTH_METHOD=trust "$image" "$@" >/dev/null
  for _ in $(seq 1 60); do
    if docker exec "$name" pg_isready -q -h 127.0.0.1 -U postgres 2>/dev/null; then up=1; break; fi
    sleep 1
  done
  if [ "$up" -ne 1 ]; then
    echo "HARNESS-ERROR no answer on 127.0.0.1:5432 after 60 s (container $(docker inspect -f '{{.State.Status}}' "$name" 2>&1))"
    docker rm -f "$name" >/dev/null; return 0
  fi
  # The provoked errors are expected: without ON_ERROR_STOP psql reports them and still exits 0.
  # Exit 1 = psql's own fatal error, 2 = connection failed or lost.
  docker exec -i "$name" psql -X -q -h 127.0.0.1 -U postgres -d postgres >/dev/null 2>&1 <<SQL || rc=$?
CREATE TABLE guest (email text UNIQUE, phone text NOT NULL CHECK (length(phone) >= 8));
INSERT INTO guest VALUES (\$1, \$2) \bind '$secret' '$phone' \g
INSERT INTO guest VALUES (\$1, \$2) \bind '$secret' '$phone' \g
INSERT INTO guest VALUES (\$1, \$2) \bind 'other-$secret' '12' \g
INSERT INTO guest (email) VALUES (\$1) \bind 'third-$secret' \g
SQL
  if [ "$rc" -ne 0 ]; then
    echo "HARNESS-ERROR psql exit $rc on the provoking statements"
    docker rm -f "$name" >/dev/null; return 0
  fi
  out=$(docker exec "$name" psql -X -q -tA -v ON_ERROR_STOP=1 -h 127.0.0.1 -U postgres -d postgres -c "SELECT 'SETTING ' || name || '=' || setting || ' ' || source
    FROM pg_settings WHERE name IN ('log_error_verbosity', 'log_min_duration_statement', 'log_parameter_max_length',
    'log_parameter_max_length_on_error', 'log_statement') ORDER BY name" 2>/dev/null) || rc=$?
  if [ "$rc" -ne 0 ] || [ "$(grep -c '^SETTING ' <<<"$out")" -ne 5 ]; then
    echo "HARNESS-ERROR pg_settings query: psql exit $rc, $(grep -c '^SETTING ' <<<"$out") of 5 rows"
    docker rm -f "$name" >/dev/null; return 0
  fi
  echo "$out"
  sleep 1
  docker logs "$name" 2>&1
  docker rm -f "$name" >/dev/null
}
harness() { # log run → stop with a harness failure when provoke could not reach postgres
  grep -q '^HARNESS-ERROR ' <<<"$1" || return 0
  ko "harness: postgres not reachable in the $2 run – $(grep -m 1 '^HARNESS-ERROR ' <<<"$1" | cut -d ' ' -f 2-) (the log setting was NOT tested)"
  echo "== $pass passed, $fail failed"; exit 1
}
trap 'docker rm -f "ottimo-terse-$$" "ottimo-verbose-$$" >/dev/null 2>&1 || true' EXIT

log=$(provoke "ottimo-terse-$$" "${args[@]}")
harness "$log" terse
grep -q 'duplicate key value violates unique constraint' <<<"$log" && ok "terse: the unique error is logged (code + message)" || ko "terse: unique error missing from the log"
grep -q 'violates check constraint' <<<"$log" && ok "terse: the CHECK error is logged" || ko "terse: CHECK error missing"
grep -q 'violates not-null constraint' <<<"$log" && ok "terse: the NOT NULL error is logged" || ko "terse: NOT NULL error missing"
if grep -Fq "$secret" <<<"$log" || grep -Fq "$phone" <<<"$log" || grep -Eq 'DETAIL:|Failing row|Key \(' <<<"$log"; then
  ko "terse: a row value or a DETAIL line reached the log"
else ok "terse: no e-mail, no phone, no DETAIL in the server log"; fi
for p in $pins; do
  if grep -Fxq "SETTING $p command line" <<<"$log"; then ok "pinned on the command line: $p"
  else ko "not pinned: $p (got: $(grep "^SETTING ${p%%=*}=" <<<"$log" || echo none))"; fi
done

ctl=$(provoke "ottimo-verbose-$$" postgres)
harness "$ctl" control
if grep -Fq "$secret" <<<"$ctl" && grep -q 'Failing row contains' <<<"$ctl"; then
  ok "control: without the setting the same errors log the e-mail and the failing row (the test can see a leak)"
else ko "control: the default run did not show the values – the test would not catch a regression"; fi
if grep -Fxq "SETTING log_parameter_max_length=-1 default" <<<"$ctl" && ! grep -q ' command line$' <<<"$ctl"; then
  ok "control: without the pins the settings come from the defaults (log_parameter_max_length -1 = bound values logged)"
else ko "control: unexpected settings in the default run: $(grep '^SETTING ' <<<"$ctl" | tr '\n' ' ')"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
