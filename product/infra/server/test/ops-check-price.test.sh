#!/usr/bin/env bash
# Test of the LP-v2 checks of bin/ops-check.sh (SEC SR-PE-16 / C9, ARC FB-R4-ARC-OPS-LPV2-01 (7), ARC L9): pricelimit
# (429 + 503 of the landing price-estimate route), pricegap (api log public_price_missing), priceswitch (Desk switch
# public_show_prices changed) and http5xx without the price route's 503. Temp OTTIMO_HOME, a fake bin/dc that prints
# canned Caddy / api log lines and query results, a fake curl that keeps what would go to the alert webhook – no
# container, no network.
#   bash infra/server/test/ops-check-price.test.sh        (workstation or CI; needs jq)
# Cases: 250 refusals in 60 min → FAIL with the count only · 20 → ok · no landing deployed → ok, not read · price 503
# not counted as a server error, a 502 of the same route is · public_price_missing → FAIL with the number of rooms,
# nothing of the log line (ids, property) in the alert or the state file · no such line → ok · switch changed → FAIL
# with its new value · webhook payload is the fixed sentence only.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
bin=$(cd "$here/../bin" && pwd)
if [ -e /opt/ottimo-prod ] || [ -e /opt/ottimo/.ottimo-home ]; then
  echo "refused: this is an OTTIMO server – run this test on a workstation or in CI" >&2; exit 2
fi
command -v jq >/dev/null || { echo "jq is required" >&2; exit 2; }

home=$(mktemp -d "${TMPDIR:-/tmp}/ocp-test.XXXXXX")
mkdir -p "$home/stack/state" "$home/fake/infra/server/bin" "$home/path"
cp "$bin/ops-check.sh" "$home/fake/infra/server/bin/"
printf 'APP_ENV=staging\nOTTIMO_PROJECT=ocp-test\nALERT_WEBHOOK_URL=https://alerts.example.invalid/hook\n' > "$home/stack/.env"
trap 'rm -rf "$home"' EXIT

# Fake curl: keeps the JSON body that ops-check would post to the webhook.
cat > "$home/path/curl" <<CURL
#!/usr/bin/env bash
while [ \$# -gt 0 ]; do [ "\$1" = --data ] && printf '%s\n' "\$2" >> "$home/webhook.jsonl"; shift; done
CURL
chmod +x "$home/path/curl"

room1=6f1c2b7e-0d1a-4c55-9a77-2f9a3c1d0e11 room2=8a2d3c4f-1e2b-4d66-8b88-3a0b4d2e1f22 prop=0b9e8d7c-6a5b-4c3d-8e2f-1a2b3c4d5e6f
landing_line() { # status
  printf '{"level":"info","logger":"http.log.access","msg":"handled request","request":{"remote_ip":"203.0.113.0","method":"GET","host":"ottimo.vn","uri":"/v1/public/properties/dlt/price-estimate?[q]"},"duration":0.01,"size":120,"status":%s}\n' "$1"
}
# Fake bin/dc: `logs … landing` / `logs … web landing` → $home/landing.log, `logs … api` → $home/api.log,
# `exec -T postgres …` (psql) → $home/psql.out.
cat > "$home/fake/infra/server/bin/dc" <<DC
#!/usr/bin/env bash
case "\$1" in
  logs) case "\${*: -1}" in api) cat "$home/api.log" ;; *) cat "$home/landing.log" ;; esac ;;
  exec) cat >/dev/null; cat "$home/psql.out" ;;
esac
DC
chmod +x "$home/fake/infra/server/bin/dc"

pass=0 fail=0
ok() { echo "PASS  $*"; pass=$((pass + 1)); }
ko() { echo "FAIL  $*"; fail=$((fail + 1)); }
oc() { PATH="$home/path:$PATH" OTTIMO_HOME="$home/stack" "$home/fake/infra/server/bin/ops-check.sh" "$@" 2>&1; echo "rc=$?"; }
reset() { rm -f "$home/stack/state/ops-check/"* "$home/webhook.jsonl"; }

echo "== cases"
echo sha-test > "$home/stack/state/landing_tag"
: > "$home/api.log"; printf '0|-\n' > "$home/psql.out"
{ for _ in $(seq 150); do landing_line 429; done; for _ in $(seq 100); do landing_line 503; done; landing_line 200; } > "$home/landing.log"
reset; out=$(oc pricelimit)
if grep -q '^FAIL pricelimit: website price estimate refused 250 times (429/503) in 60 min' <<<"$out" && grep -q '^rc=1$' <<<"$out"; then
  ok "1 250 refusals (429 + 503) in 60 min → FAIL with the count"; else ko "1"; echo "$out"; fi
if [ -s "$home/webhook.jsonl" ] && ! grep -qE 'price-estimate|203\.0\.113|dlt' "$home/webhook.jsonl"; then
  ok "1b webhook gets the sentence only – no path, slug or address"; else ko "1b webhook"; cat "$home/webhook.jsonl" 2>/dev/null; fi

{ for _ in $(seq 20); do landing_line 429; done; } > "$home/landing.log"
reset; out=$(oc pricelimit)
grep -q '^ok   pricelimit: 20 price estimates refused' <<<"$out" && grep -q '^rc=0$' <<<"$out" && ok "2 20 refusals → ok" || { ko "2"; echo "$out"; }

rm -f "$home/stack/state/landing_tag"
reset; out=$(oc pricelimit)
grep -q '^ok   pricelimit: no landing deployed' <<<"$out" && ok "3 no landing deployed → ok, log not read" || { ko "3"; echo "$out"; }
echo sha-test > "$home/stack/state/landing_tag"

{ for _ in $(seq 10); do landing_line 503; done; landing_line 502; } > "$home/landing.log"
reset; out=$(oc http5xx)
grep -q '^ok   http5xx: 1 server errors (5xx) in 35 min' <<<"$out" && ok "4 price route 503 (bulkhead) not a server error, its 502 is" || { ko "4"; echo "$out"; }

{ echo "{\"level\":40,\"msg\":\"public_price_missing property=$prop room=$room1 day=2026-11-02 – no list price for a night; the room is left out of the website estimate\"}"
  echo "{\"level\":40,\"msg\":\"public_price_missing property=$prop room=$room2 day=2026-11-02 – no list price\"}"
  echo "{\"level\":40,\"msg\":\"public_price_missing property=$prop room=$room1 day=2026-11-03 – no list price\"}"
  echo '{"level":30,"msg":"request completed"}'; } > "$home/api.log"
reset; out=$(oc pricegap)
if grep -q '^FAIL pricegap: 2 room(s) left out of the website price estimate in 24 h' <<<"$out" && grep -q '^rc=1$' <<<"$out"; then
  ok "5 public_price_missing for 2 rooms → FAIL with the number of rooms"; else ko "5"; echo "$out"; fi
if ! grep -qE "$room1|$room2|$prop|room=|property=" "$home/webhook.jsonl" "$home/stack/state/ops-check/pricegap" \
  && ! grep -qE "$room1|$room2|$prop|room=|property=" <<<"$out"; then
  ok "5b no log text (room / property id) in the output, the webhook or the state file"; else ko "5b leak"; cat "$home/webhook.jsonl"; fi
echo '{"level":30,"msg":"request completed"}' > "$home/api.log"
reset; out=$(oc pricegap)
grep -q '^ok   pricegap: every room had a list price' <<<"$out" && ok "6 no public_price_missing → ok" || { ko "6"; echo "$out"; }

printf '1|false\n' > "$home/psql.out"
reset; out=$(oc priceswitch)
if grep -q '^FAIL priceswitch: Desk switch public_show_prices changed 1 time(s) in 35 min (now: false)' <<<"$out" \
  && [ "$(jq -r .text "$home/webhook.jsonl")" = "OTTIMO staging ($(hostname -s 2>/dev/null || echo server)): priceswitch FAIL – Desk switch public_show_prices changed 1 time(s) in 35 min (now: false) – check it was intended (Desk H05, OWN)" ]; then
  ok "7 public_show_prices changed → FAIL with its new value, webhook = that sentence"; else ko "7"; echo "$out"; cat "$home/webhook.jsonl"; fi
printf '0|-\n' > "$home/psql.out"
out=$(oc priceswitch)
grep -q '^ok   priceswitch: public_show_prices not changed' <<<"$out" && [ "$(wc -l < "$home/webhook.jsonl" | tr -d ' ')" = 2 ] \
  && ok "8 next run unchanged → ok, recovery sent once" || { ko "8"; echo "$out"; }

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
