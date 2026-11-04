#!/usr/bin/env bash
# Test of bin/mail-test.sh (v1.0.3, plan-v1.0.3 V3-05): the recipient address of a test e-mail never appears in an
# argument (Mac shell history, ssh argv, the VPS process list) nor in the script's output. v1.0.4 (ARC
# FB-R4-ARC-OPS-PR30-10): it is the ONLY line of the ssh stdin and mail-test.mjs reads it from its own stdin – no
# `read` into a variable on the VPS, no `-e MAIL_TEST_TO` (container environment); mail-test.mjs travels base64 in the
# ssh command. A fake `ssh` first in PATH records argv + stdin and answers like the one-off worker. No network, no
# server. Part 2 runs mail-test.mjs itself with node against stub modules (stdin first line, MAIL_TEST_TO refused).
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
if [ "$(cat "$T/stdin")" = "$addr" ] && [ "$(wc -l < "$T/stdin" | tr -d ' ')" = 1 ]; then
  ok "1c stdin = exactly one line, the address"; else ko "1c stdin: $(wc -l < "$T/stdin") lines"; fi
remote=$(tail -n 1 "$T/argv")
prog=$(sed -nE 's/.*-e "\$\(printf %s ([A-Za-z0-9+\/=]+) \| base64 -d\)".*/\1/p' <<<"$remote")
if [ -n "$prog" ] && printf %s "$prog" | base64 -d 2>/dev/null | cmp -s - "$mjs"; then
  ok "1d program in the ssh command = mail-test.mjs byte for byte (base64)"; else ko "1d program: ${prog:0:40}…"; fi
if ! grep -qF "$addr" <<<"$out"; then ok "1e address not in the output"; else ko "1e address printed: $out"; fi
if grep -qF "sudo -n -u ottimo sh -c 'exec /opt/ottimo-prod/infra/server/bin/dc run --rm --no-deps -T --entrypoint node worker --input-type=module -e " <<<"$remote" \
  && ! grep -q 'MAIL_TEST_TO' <<<"$remote" && ! grep -q 'read ' <<<"$remote"; then
  ok "1f remote: no read, no MAIL_TEST_TO, stdin straight to the one-off worker of the production stack"; else ko "1f remote: ${remote:0:200}"; fi
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
# SEC PR30-06: the test door alone (MAIL_TEST_READ_STDIN=1 without the fake ssh dir MTS_DIR) does not open a pipe.
rc=0; out=$(printf '%s\n' "$addr" | env -u MTS_DIR PATH="$T/bin:$PATH" MAIL_TEST_READ_STDIN=1 bash "$script" --ssh ottimo-admin@desk.example.test --key "$T/key" --stack production --send 2>&1) || rc=$?
if [ "$rc" = 2 ] && grep -q 'interactive terminal' <<<"$out" && [ ! -e "$T/argv" ]; then
  ok "4b MAIL_TEST_READ_STDIN=1 without MTS_DIR → still refused"; else ko "4b test door rc=$rc: $out"; fi
# SEC FB-R4-SEC-OPS-PR30-10: both variables set, but the ssh first in PATH is not $MTS_DIR/bin/ssh (here another
# program standing for the real ssh, which also records its call) → still refused, nothing reaches any ssh.
mkdir -p "$T/realssh"; cp "$T/bin/ssh" "$T/realssh/ssh"
rm -f "$T/argv" "$T/stdin"
rc=0; out=$(printf '%s\n' "$addr" | env PATH="$T/realssh:$T/bin:$PATH" MTS_DIR="$T" MAIL_TEST_READ_STDIN=1 bash "$script" --ssh ottimo-admin@desk.example.test --key "$T/key" --stack production --send 2>&1) || rc=$?
if [ "$rc" = 2 ] && grep -q 'interactive terminal' <<<"$out" && [ ! -e "$T/argv" ] && [ ! -e "$T/stdin" ]; then
  ok "4c both test variables but ssh in PATH is not the fake one → refused, no ssh call"; else ko "4c rc=$rc: $out"; fi
rm -f "$T/argv" "$T/stdin"
rc=0; out=$(printf '%s\n' "$addr" | env PATH="/usr/bin:/bin" MTS_DIR="$T" MAIL_TEST_READ_STDIN=1 /bin/bash "$script" --ssh ottimo-admin@desk.example.test --key "$T/key" --stack production --send 2>&1) || rc=$?
if [ "$rc" = 2 ] && grep -q 'interactive terminal' <<<"$out" && [ ! -e "$T/argv" ]; then
  ok "4d both test variables, system PATH only (real or no ssh) → refused"; else ko "4d rc=$rc: $out"; fi

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

# SEC PR30-02: the runbooks call the script directly – it must be executable and work without `bash`.
FAKE=()
if [ -x "$script" ]; then ok "8 bin/mail-test.sh is executable"; else ko "8 bin/mail-test.sh has no execute bit"; fi
rm -f "$T/argv" "$T/stdin"
rc=0; out=$(env PATH="$T/bin:$PATH" MTS_DIR="$T" "$script" --ssh ottimo-admin@desk.example.test --key "$T/key" --stack production --verify-only 2>&1 </dev/null) || rc=$?
if [ "$rc" = 0 ] && grep -qx 'mail-test: verified' <<<"$out"; then ok "8b run directly (not via bash) → verified"; else ko "8b direct rc=$rc: $out"; fi

# ---------- part 2: mail-test.mjs itself (node, stub @ottimo/integrations + dist/config.js; no SMTP) ----------
echo "== mail-test.mjs"
if ! command -v node >/dev/null; then
  echo "SKIP mail-test.mjs part: node is not installed"
  if [ "${CI:-}" = true ]; then ko "CI=true: node missing, mail-test.mjs not tested"; fi
else
  app="$T/app"; mkdir -p "$app/dist" "$app/node_modules/@ottimo/integrations"
  printf 'exports.resolveFileSecrets = (e) => ({ ...e });\n' > "$app/dist/config.js"
  printf '{"name":"@ottimo/integrations","type":"module","exports":{"./common":"./common.js","./notification":"./notification.js"}}\n' \
    > "$app/node_modules/@ottimo/integrations/package.json"
  printf 'export class EnvCredentialProvider { constructor(e) { this.e = e; } async get() { return {}; } }\n' \
    > "$app/node_modules/@ottimo/integrations/common.js"
  cat > "$app/node_modules/@ottimo/integrations/notification.js" <<'NOTIF'
import { appendFileSync } from 'node:fs';
const rec = (s) => appendFileSync(process.env.MTS_SENT, s + '\n');
export const isEmailAddress = (v) => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const mapSmtpError = () => ({ code: 'SMTP_STUB' });
export const smtpConfigFromCredentials = (c, o) => ({ from: o.from ?? 'no-reply@example.test', fromName: 'OTTIMO' });
export const createSmtpTransport = () => ({
  verify: async () => rec('verify'),
  sendMail: async (m) => rec('to=' + m.to),
  close: () => {},
});
NOTIF
  sent="$T/sent"
  mjs_run() { # stdin-text env… → out, rc (as in the one-off worker: cwd = app, program = mail-test.mjs via -e)
    local input="$1"; shift
    rm -f "$sent"; : > "$sent"; rc=0
    out=$(cd "$app" && printf '%b' "$input" | env -i PATH="$PATH" MTS_SENT="$sent" EMAIL_PROVIDER=smtp "$@" \
      node --input-type=module -e "$(cat "$mjs")" 2>&1) || rc=$?
  }
  mjs_run "$addr\n"
  if [ "$rc" = 0 ] && [ "$out" = 'mail-test: sent' ] && grep -qxF "to=$addr" "$sent"; then
    ok "M1 address read from the first stdin line → sent to it"; else ko "M1 rc=$rc: $out / $(cat "$sent")"; fi
  mjs_run "$addr\r\nsecond.line@example.test\n"
  if [ "$rc" = 0 ] && grep -qxF "to=$addr" "$sent" && ! grep -q 'second.line' "$sent"; then
    ok "M2 only line 1 is used (CRLF trimmed, line 2 ignored)"; else ko "M2 rc=$rc: $out / $(cat "$sent")"; fi
  mjs_run "$addr\n" MAIL_TEST_TO="$addr"
  if [ "$rc" = 2 ] && [ "$out" = 'mail-test: failed (MAIL_TEST_TO must not be set - the address is read from stdin)' ] \
    && [ ! -s "$sent" ]; then ok "M3 MAIL_TEST_TO in the environment → refused, nothing sent"; else ko "M3 rc=$rc: $out"; fi
  if grep -Eq '^mail-test: (verified|sent|failed \([A-Za-z0-9_ .-]*\))$' <<<"$out"; then
    ok "M3b that line passes the output filter of mail-test.sh"; else ko "M3b filtered out: $out"; fi
  mjs_run "\n"
  if [ "$rc" = 2 ] && [ "$out" = 'mail-test: failed (address on stdin is missing or invalid)' ] && [ ! -s "$sent" ]; then
    ok "M4 empty first line → failed, nothing sent"; else ko "M4 rc=$rc: $out"; fi
  mjs_run "not-an-address\n"
  if [ "$rc" = 2 ] && ! grep -q 'not-an-address' <<<"$out" && [ ! -s "$sent" ]; then
    ok "M5 invalid address → failed, input not echoed"; else ko "M5 rc=$rc: $out"; fi
  long=$(head -c 300 /dev/zero | tr '\0' a)
  mjs_run "$long@example.test\n"
  if [ "$rc" = 2 ] && [ ! -s "$sent" ]; then ok "M6 first line longer than 256 → failed"; else ko "M6 rc=$rc: $out"; fi
  mjs_run "" MAIL_TEST_VERIFY_ONLY=1
  if [ "$rc" = 0 ] && [ "$out" = 'mail-test: verified' ] && [ "$(cat "$sent")" = verify ]; then
    ok "M7 --verify-only: verify only, no address needed"; else ko "M7 rc=$rc: $out"; fi
  mjs_run "$addr\n" EMAIL_PROVIDER=mock
  if [ "$rc" = 2 ] && [ "$out" = 'mail-test: failed (EMAIL_PROVIDER is not smtp)' ]; then
    ok "M8 EMAIL_PROVIDER not smtp → failed"; else ko "M8 rc=$rc: $out"; fi
  # the only code line naming MAIL_TEST_TO is the refusal (comments left out)
  if [ -z "$(grep -v '^ *//' "$mjs" | grep 'MAIL_TEST_TO' | grep -v 'process.env.MAIL_TEST_TO !== undefined) out(')" ]; then
    ok "M9 mail-test.mjs never reads the address from the environment"
  else ko "M9 mail-test.mjs still reads MAIL_TEST_TO"; fi
fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
