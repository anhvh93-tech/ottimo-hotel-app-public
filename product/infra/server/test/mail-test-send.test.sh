#!/usr/bin/env bash
# Test of bin/mail-test.sh (v1.0.3, plan-v1.0.3 V3-05): the recipient address of a test e-mail never appears in an
# argument (Mac shell history, ssh argv, the VPS process list) nor in the script's output – it travels as the first
# line of the ssh stdin, followed by mail-test.mjs. A fake `ssh` first in PATH records argv + stdin and answers like
# the one-off worker. No network, no server.
#   bash product/infra/server/test/mail-test-send.test.sh      (workstation or CI)
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
script="$here/../bin/mail-test.sh"
mjs="$here/../mail-test.mjs"
T=$(mktemp -d "${TMPDIR:-/tmp}/mts-test.XXXXXX"); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/bin"
: > "$T/key"
addr='probe.owner+x@example.test'
cat > "$T/bin/ssh" <<'SSH'
#!/usr/bin/env bash
# fake ssh: keep argv and stdin, answer like mail-test.mjs (FAKE_SSH=fail-silent | smtp-fail | ok)
printf '%s\n' "$@" > "$MTS_DIR/argv"
cat > "$MTS_DIR/stdin"
case "${FAKE_SSH:-ok}" in
  fail-silent) echo "ssh: connect to host: Connection refused" >&2; exit 255 ;;
  smtp-fail) echo " Container x-worker-run Creating" >&2; echo "mail-test: failed (SMTP_REJECTED)"; exit 1 ;;
esac
echo " Container x-worker-run Creating" >&2
if grep -q 'MAIL_TEST_VERIFY_ONLY=1' "$MTS_DIR/argv"; then echo "mail-test: verified"; else echo "mail-test: sent"; fi
SSH
chmod +x "$T/bin/ssh"
pass=0 fail=0
ok() { echo "ok   $*"; pass=$((pass + 1)); }
ko() { echo "FAIL $*"; fail=$((fail + 1)); }
run() { # input args… → sets out, rc
  local input="$1"; shift
  rm -f "$T/argv" "$T/stdin"
  rc=0
  out=$(printf '%s\n' "$input" | env PATH="$T/bin:$PATH" MTS_DIR="$T" MAIL_TEST_READ_STDIN=1 ${FAKE[@]+"${FAKE[@]}"} \
    bash "$script" --ssh ottimo-admin@desk.example.test --key "$T/key" "$@" 2>&1) || rc=$?
}
FAKE=()

echo "== cases"
run "$addr" --stack production --send
if [ "$rc" = 0 ] && grep -qx 'mail-test: sent' <<<"$out"; then ok "1 --send → one line 'mail-test: sent'"; else ko "1 send rc=$rc: $out"; fi
if [ -s "$T/argv" ] && ! grep -qF "$addr" "$T/argv" && ! grep -q '@example.test' "$T/argv"; then ok "1b address not in any ssh argument"
else ko "1b address in ssh argv"; fi
if [ "$(head -n 1 "$T/stdin")" = "$addr" ]; then ok "1c address is the first stdin line"; else ko "1c first stdin line"; fi
if tail -n +2 "$T/stdin" | cmp -s - "$mjs"; then
  ok "1d rest of stdin = mail-test.mjs byte for byte"; else ko "1d stdin body"; fi
if ! grep -qF "$addr" <<<"$out"; then ok "1e address not in the output"; else ko "1e address printed: $out"; fi
remote=$(tail -n 1 "$T/argv")
if grep -qF "IFS= read -r MAIL_TEST_TO; export MAIL_TEST_TO; exec /opt/ottimo-prod/infra/server/bin/dc run --rm --no-deps -T -e MAIL_TEST_TO --entrypoint node worker --input-type=module -" <<<"$remote" \
  && grep -qF "sudo -n -u ottimo" <<<"$remote" && ! grep -q 'MAIL_TEST_TO=' <<<"$remote"; then
  ok "1f remote: read line 1, -e MAIL_TEST_TO without a value, production stack"; else ko "1f remote: $remote"; fi
grep -qx -- '-o' "$T/argv" && grep -qx 'BatchMode=yes' "$T/argv" && ok "1g ssh BatchMode=yes" || ko "1g BatchMode"

run "" --stack staging --verify-only
if [ "$rc" = 0 ] && grep -qx 'mail-test: verified' <<<"$out" && [ "$(head -n 1 "$T/stdin")" = "" ] \
  && grep -qF '/opt/ottimo/infra/server/bin/dc run' "$T/argv" && grep -qF -- '-e MAIL_TEST_VERIFY_ONLY=1' "$T/argv"; then
  ok "2 --verify-only → no address (empty line 1), MAIL_TEST_VERIFY_ONLY=1, staging stack"; else ko "2 verify rc=$rc: $out"; fi

for bad in 'not-an-address' 'two words@example.test' 'a@b' ''; do
  run "$bad" --stack production --send
  if [ "$rc" = 2 ] && [ ! -e "$T/argv" ] && grep -q 'nothing sent' <<<"$out"; then ok "3 invalid address '$bad' → exit 2, ssh not called"
  else ko "3 invalid '$bad' rc=$rc: $out"; fi
done

rc=0; out=$(printf '%s\n' "$addr" | env PATH="$T/bin:$PATH" MTS_DIR="$T" bash "$script" --ssh ottimo-admin@desk.example.test --key "$T/key" --stack production --send 2>&1) || rc=$?
if [ "$rc" = 2 ] && grep -q 'interactive terminal' <<<"$out"; then ok "4 --send from a pipe (no tty) → refused"; else ko "4 no tty rc=$rc: $out"; fi

run "$addr" --stack production --send --ssh 'x;rm -rf /'
if [ "$rc" = 2 ]; then ok "5 --ssh not user@host → exit 2"; else ko "5 bad --ssh rc=$rc"; fi
run "" --stack prod --verify-only
if [ "$rc" = 2 ]; then ok "5b unknown stack → exit 2"; else ko "5b stack rc=$rc"; fi

FAKE=(FAKE_SSH=fail-silent)
run "$addr" --stack production --send
if [ "$rc" = 1 ] && grep -q 'no answer from the worker' <<<"$out" && ! grep -q 'Connection refused' <<<"$out"; then
  ok "6 ssh fails → exit 1, fixed message, raw ssh error not shown"; else ko "6 ssh fail rc=$rc: $out"; fi
FAKE=(FAKE_SSH=smtp-fail)
run "$addr" --stack production --send
if [ "$rc" = 1 ] && grep -qx 'mail-test: failed (SMTP_REJECTED)' <<<"$out" && ! grep -q 'Container' <<<"$out" \
  && ! grep -qF "$addr" <<<"$out"; then ok "7 SMTP refused → exit 1, the one mail-test line, no compose noise"
else ko "7 smtp fail rc=$rc: $out"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
