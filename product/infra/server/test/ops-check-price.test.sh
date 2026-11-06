#!/usr/bin/env bash
# Test of the LP-v2 checks of bin/ops-check.sh (SEC SR-PE-16 / C9, ARC FB-R4-ARC-OPS-LPV2-01 (7), ARC L9): pricelimit
# (429 + 503 of the landing price-estimate route), pricegap (api log public_price_missing), priceswitch (Desk switch
# public_show_prices changed) and http5xx without the price route's 503. Temp OTTIMO_HOME, a fake bin/dc that prints
# canned Caddy / api log lines and query results, a fake curl that keeps what would go to the alert webhook – no
# container, no network.
#   bash infra/server/test/ops-check-price.test.sh        (workstation or CI; needs jq)
# Cases: 250 refusals in 60 min → FAIL with the count only · 20 → ok · no landing deployed → ok, not read · price 503
# not counted as a server error, a 502 of the same route is · public_price_missing → FAIL with the number of rooms,
# nothing of the log line (ids, property) in the alert or the state file · no such line → ok · priceswitch (SEC
# FB-R4-SEC-OPS-LPV2-04): first run sets the audit-id mark without an alert · a change → FAIL with its new value,
# webhook = that sentence, the query asks for ids above the mark · a second change while still FAIL → its own webhook
# · no change → ok, recovery once · an empty window never moves the mark back · an odd value → "other" · a broken
# mark file → never put into the SQL, treated as a first run.
# v1.0.5 V5-73 (SEC FB-R4-SEC-OPS-S6D-01): pricegap has a static part – a READ ONLY count of sellable rooms with a
# website room type and no list price from their first sellable day (365 days). Static 1 → FAIL with the number only
# (no id anywhere), the SQL is the one count of SEC-on-lp-v2-s6d.md 6.4 · static 0 + no log line → ok · log and static
# both > 0 → one FAIL naming both counts · a stray answer, a guard that is not ottimo_readonly, a query error or an
# unreadable api log → FAIL with a fixed category, never read as 0, the other part still reported.
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
# `exec -T postgres …` (psql) → the guard row, then $home/psql.out.
# Switch files (v1.0.5 cases): logs.fail → `dc logs` fails, psql.fail → psql answers an ERROR, guard.bad → the session
# answers the guard like a role that is not ottimo_readonly.
cat > "$home/fake/infra/server/bin/dc" <<DC
#!/usr/bin/env bash
case "\$1" in
  logs) [ -e "$home/logs.fail" ] && { echo "permission denied" >&2; exit 1; }
        case "\${*: -1}" in api) cat "$home/api.log" ;; *) cat "$home/landing.log" ;; esac ;;
  exec) cat > "$home/psql.in"
        printf '%s\n' "\$*" > "$home/psql.cmd"
        [ -e "$home/psql.fail" ] && { echo 'ERROR:  relation "room_list_price" does not exist' >&2; exit 3; }
        # v1.0.4: psql_ro sends the ottimo_readonly guard row first (SEC PR32-S1) – answer it like the real role.
        if [ -e "$home/guard.bad" ]; then echo ro-bad
        else grep -qF "current_user = 'ottimo_readonly'" "$home/psql.in" && echo ro-ok; fi
        cat "$home/psql.out" ;;
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
: > "$home/api.log"; printf '0|0|-\n' > "$home/psql.out"
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
printf '0\n' > "$home/psql.out"   # static part: no gap (v1.0.5)
reset; out=$(oc pricegap)
if grep -q '^FAIL pricegap: 2 room(s) left out of the website price estimate in 24 h' <<<"$out" && grep -q '^rc=1$' <<<"$out"; then
  ok "5 public_price_missing for 2 rooms → FAIL with the number of rooms"; else ko "5"; echo "$out"; fi
if ! grep -qE "$room1|$room2|$prop|room=|property=" "$home/webhook.jsonl" "$home/stack/state/ops-check/pricegap" \
  && ! grep -qE "$room1|$room2|$prop|room=|property=" <<<"$out"; then
  ok "5b no log text (room / property id) in the output, the webhook or the state file"; else ko "5b leak"; cat "$home/webhook.jsonl"; fi
echo '{"level":30,"msg":"request completed"}' > "$home/api.log"
reset; out=$(oc pricegap)
grep -q '^ok   pricegap: every room had a list price' <<<"$out" && ok "6 no public_price_missing → ok" || { ko "6"; echo "$out"; }

# ── v1.0.5 V5-73: static part (SEC-on-lp-v2-s6d.md 6.4) ──
nolog() { echo '{"level":30,"msg":"request completed"}' > "$home/api.log"; }
leak_free() { # no room / property id, no SQL text in the output, the webhook or the state file
  ! grep -qE "$room1|$room2|$prop|room=|property=|room_list_price|SELECT" "$home/webhook.jsonl" "$home/stack/state/ops-check/pricegap" \
    && ! grep -qE "$room1|$room2|$prop|room=|property=|room_list_price|SELECT" <<<"$1"
}
nolog; printf '1\n' > "$home/psql.out"; rm -f "$home/psql.in" "$home/psql.cmd"
reset; out=$(oc pricegap)
if grep -q '^FAIL pricegap: 1 sellable room(s) with a website room type have no list price from their first sellable day (next 365 days) – OWN: enter the list price of that room on Desk; OPS: find where the room came from' <<<"$out" \
  && grep -q '^rc=1$' <<<"$out" && [ -s "$home/webhook.jsonl" ] && leak_free "$out"; then
  ok "16 static count 1, no log line → FAIL with the number of rooms only, webhook sent, no id anywhere"; else ko "16"; echo "$out"; fi
sql=$( { tail -n +3 "$home/psql.in" 2>/dev/null || true; } | tr -s ' \n' ' ')
want_ok=1
for want in "SELECT count(*) FROM room r JOIN property p ON p.id = r.property_id" "(now() AT TIME ZONE p.timezone)::date AS today" \
  "WHERE r.is_sellable" "AND r.public_room_type IS NOT NULL" "AND r.active_from <= d.today + 365" \
  "AND (r.active_to IS NULL OR r.active_to >= d.today)" \
  "AND NOT EXISTS (SELECT 1 FROM room_list_price lp WHERE lp.room_id = r.id AND lp.effective_from <= greatest(r.active_from, d.today));"; do
  grep -qF -- "$want" <<<"$sql" || { want_ok=0; echo "  missing: $want"; }
done
if [ "$want_ok" = 1 ] && [ "$(grep -o ';' <<<"$sql" | wc -l | tr -d ' ')" = 1 ] \
  && ! grep -qiwE 'insert|update|delete|truncate|alter|drop|grant|create|set|reset' <<<"$sql" \
  && grep -qF 'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly"' "$home/psql.cmd" 2>/dev/null \
  && grep -qF "current_user = 'ottimo_readonly'" "$home/psql.in" 2>/dev/null; then
  ok "16b static SQL = one count(*) (6.4 filters, 365 days, greatest(active_from, today) in the property time zone), READ ONLY as ottimo_readonly behind the guard"
else ko "16b static SQL"; echo "$sql"; cat "$home/psql.cmd" 2>/dev/null || true; fi
nolog; printf '0\n' > "$home/psql.out"
reset; out=$(oc pricegap)
grep -q '^ok   pricegap: every room had a list price for the website estimate (24 h); 0 sellable rooms without a list price (365 days)$' <<<"$out" \
  && grep -q '^rc=0$' <<<"$out" && ok "17 static count 0 and no log line → ok" || { ko "17"; echo "$out"; }
{ echo "{\"level\":40,\"msg\":\"public_price_missing property=$prop room=$room1 day=2026-11-02 – no list price\"}"; } > "$home/api.log"
printf '3\n' > "$home/psql.out"
reset; out=$(oc pricegap)
grep -q '^FAIL pricegap: 1 room(s) left out of the website price estimate in 24 h: no list price for a night; 3 sellable room(s) with a website room type have no list price' <<<"$out" \
  && [ "$(grep -c '^FAIL' <<<"$out")" = 1 ] && leak_free "$out" && ok "18 log 1 room + static 3 → one FAIL naming both counts" || { ko "18"; echo "$out"; }
nolog; printf '%s\n' "$room1" > "$home/psql.out"
reset; out=$(oc pricegap)
grep -q '^FAIL pricegap: static check: unexpected answer$' <<<"$out" && leak_free "$out" \
  && ok "19 a stray answer (an id instead of a count) → FAIL unexpected answer, the id never printed" || { ko "19"; echo "$out"; }
printf '0\n' > "$home/psql.out"; touch "$home/guard.bad"
reset; out=$(oc pricegap)
grep -q '^FAIL pricegap: static check: unexpected answer$' <<<"$out" && ok "20 guard not ottimo_readonly → FAIL, never read as 0" || { ko "20"; echo "$out"; }
rm -f "$home/guard.bad"; touch "$home/psql.fail"
{ echo "{\"level\":40,\"msg\":\"public_price_missing property=$prop room=$room2 day=2026-11-02 – no list price\"}"; } > "$home/api.log"
reset; out=$(oc pricegap)
grep -q '^FAIL pricegap: 1 room(s) left out of the website price estimate in 24 h: no list price for a night; static check query failed: query error – OWN' <<<"$out" \
  && leak_free "$out" && ok "21 static query error → category, the log part still reported" || { ko "21"; echo "$out"; }
rm -f "$home/psql.fail"; touch "$home/logs.fail"; printf '2\n' > "$home/psql.out"
reset; out=$(oc pricegap)
grep -q '^FAIL pricegap: 2 sellable room(s) with a website room type have no list price .*; api log unreadable – docker compose failed, container state unknown: permission denied' <<<"$out" \
  && ok "22 api log unreadable → category, the static count still reported" || { ko "22"; echo "$out"; }
rm -f "$home/logs.fail"

mark="$home/stack/state/ops-check/priceswitch.last_id"
host_s=$(hostname -s 2>/dev/null || echo server)
printf '41|3|true\n' > "$home/psql.out"
reset; out=$(oc priceswitch)
if grep -q '^ok   priceswitch: public_show_prices: first run' <<<"$out" && grep -q '^rc=0$' <<<"$out" \
  && [ "$(cat "$mark")" = 41 ] && [ ! -s "$home/webhook.jsonl" ] && grep -q 'id > 0' "$home/psql.in"; then
  ok "7 first run → mark = newest audit id (41), no alert"; else ko "7"; echo "$out"; fi
printf '42|1|false\n' > "$home/psql.out"
out=$(oc priceswitch)
if grep -q '^FAIL priceswitch: Desk switch public_show_prices changed 1 time(s) since the last check (now: false)' <<<"$out" \
  && grep -q '^rc=1$' <<<"$out" && grep -q 'id > 41' "$home/psql.in" && [ "$(cat "$mark")" = 42 ] \
  && [ "$(jq -r .text "$home/webhook.jsonl")" = "OTTIMO staging ($host_s): priceswitch FAIL – Desk switch public_show_prices changed 1 time(s) since the last check (now: false) – check it was intended (Desk H05, OWN)" ]; then
  ok "8 public_show_prices changed → FAIL with its new value, ids > mark asked, mark 42, webhook = that sentence"; else ko "8"; echo "$out"; cat "$home/webhook.jsonl"; fi
printf '45|2|true\n' > "$home/psql.out"
out=$(oc priceswitch)
if grep -q '^FAIL priceswitch: Desk switch public_show_prices changed 2 time(s) since the last check (now: true)' <<<"$out" \
  && grep -q 'id > 42' "$home/psql.in" && [ "$(cat "$mark")" = 45 ] && [ "$(wc -l < "$home/webhook.jsonl" | tr -d ' ')" = 2 ] \
  && [ "$(tail -n 1 "$home/webhook.jsonl" | jq -r .text)" = "OTTIMO staging ($host_s): priceswitch FAIL – Desk switch public_show_prices changed 2 time(s) since the last check (now: true) – check it was intended (Desk H05, OWN)" ]; then
  ok "9 second change while still FAIL (inside the 6 h reminder) → its own webhook, mark 45"; else ko "9"; echo "$out"; cat "$home/webhook.jsonl"; fi
printf '45|0|-\n' > "$home/psql.out"
out=$(oc priceswitch)
grep -q '^ok   priceswitch: public_show_prices not changed since the last check' <<<"$out" && grep -q 'id > 45' "$home/psql.in" \
  && [ "$(wc -l < "$home/webhook.jsonl" | tr -d ' ')" = 3 ] && [ "$(cat "$mark")" = 45 ] \
  && ok "10 next run unchanged → ok, recovery sent once, mark kept" || { ko "10"; echo "$out"; }
out=$(oc priceswitch)
[ "$(wc -l < "$home/webhook.jsonl" | tr -d ' ')" = 3 ] && ok "11 still unchanged → no further webhook" || { ko "11"; echo "$out"; }
# Old rows out of the 7-day bound (the window's max id 0, below the mark): the mark never goes back.
printf '0|0|-\n' > "$home/psql.out"
out=$(oc priceswitch)
[ "$(cat "$mark")" = 45 ] && grep -q '^rc=0$' <<<"$out" && ok "12 empty window → mark stays 45" || { ko "12"; echo "$out"; }
printf '46|1|{"x":"y"}\n' > "$home/psql.out"
out=$(oc priceswitch)
grep -q '(now: other)' <<<"$out" && ! grep -q '"x"' "$home/webhook.jsonl" && ok "13 a value other than true/false → \"other\"" \
  || { ko "13"; echo "$out"; }
printf '46|5|true\n' > "$home/psql.out"
reset; printf '45; DROP TABLE x\n' > "$mark"; out=$(oc priceswitch)
if grep -q 'first run' <<<"$out" && grep -q 'id > 0' "$home/psql.in" && ! grep -q 'DROP' "$home/psql.in" && [ "$(cat "$mark")" = 46 ]; then
  ok "14 a broken mark file → not put into the SQL, treated as a first run (mark 46)"; else ko "14"; echo "$out"; cat "$home/psql.in"; fi
# v1.0.4 (SEC PR32-S1, ARC PR30-09): priceswitch reads audit_event as ottimo_readonly in a READ ONLY transaction.
if grep -qF 'PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly"' "$home/psql.cmd"; then
  ok "15 priceswitch runs as ottimo_readonly, READ ONLY (was the superuser session)"; else ko "15"; cat "$home/psql.cmd"; fi

echo "== $pass passed, $fail failed"
[ "$fail" -eq 0 ]
