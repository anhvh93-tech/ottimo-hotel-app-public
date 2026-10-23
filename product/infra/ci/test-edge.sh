#!/usr/bin/env bash
# Test of the shared edge (infra/edge, infra/server/bin/edge.sh – R3 v1.0: staging + production on one VPS):
#   (a) edge.sh render: routing table from two stacks' .env, nginx -t on the pinned image; refuses a host name used
#       twice, a malformed host name, a wrong PROXY_PROTOCOL_ALLOW; ignores a stack in direct mode
#   (b) end to end on Docker (Caddy backends with Caddy's internal CA, *.localhost names, the real
#       docker-compose.edge.yml on 127.0.0.1:28080/28443):
#       SNI → right stack (production web / production landing / staging landing), the backend sees the CLIENT address
#       (PROXY protocol), not the edge's; unknown SNI → connection closed; :80 by Host → the backend's 308; unknown
#       Host on :80 → 404; a PROXY header from any address other than the edge is ignored (no address spoofing);
#       the staging landing preview answers 401 without its password, the production landing 200 + headers.
# Needs Docker. Uses the fixed network names ottimo-link-staging/production: do NOT run on the VPS.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
infra=$(cd "$here/.." && pwd)
CADDY_IMAGE=caddy:2-alpine@sha256:d8542f48d34a9cf4e4c11a478865229840e87e4c96ea3f439101f31a5d35f75f
CURL_IMAGE=curlimages/curl:8.11.1@sha256:c1fe1679c34d9784c1b0d1e5f62ac0a79fca01fb6377cdd33e90473c6f9f9a69
HTTP_PORT="${EDGE_TEST_HTTP_PORT:-28080}"
HTTPS_PORT="${EDGE_TEST_HTTPS_PORT:-28443}"
work=$(mktemp -d "${TMPDIR:-/tmp}/edge-test.XXXXXX")
fails=0
ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fails=$((fails + 1)); }

cleanup() {
  EDGE_CONF="$work/edge/nginx.conf" docker compose --project-name ottimo-edge-test -f "$infra/edge/docker-compose.edge.yml" \
    down --remove-orphans >/dev/null 2>&1 || true
  docker rm -f et-prod-web et-prod-landing et-stg-landing >/dev/null 2>&1 || true
  for n in staging production; do
    if docker network inspect "ottimo-link-$n" --format '{{index .Labels "ottimo.test"}}' 2>/dev/null | grep -q edge-test; then
      docker network rm "ottimo-link-$n" >/dev/null 2>&1 || true
    fi
  done
  rm -rf "$work"
}
trap cleanup EXIT

for n in staging production; do
  if docker network inspect "ottimo-link-$n" >/dev/null 2>&1; then
    echo "network ottimo-link-$n already exists – this test must not run next to a real edge" >&2; exit 2
  fi
done

# ---------- (a) render ----------
mk_env() { # dir name mode allow desk landing www
  mkdir -p "$1"
  cat > "$1/.env" <<EOF
APP_ENV=$2
EDGE_MODE=$3
EDGE_NAME=$2
PROXY_PROTOCOL_ALLOW=$4
DESK_HOST=$5
STAFF_HOST=staff.$5
GUEST_HOST=g.$5
LANDING_HOST=$6
LANDING_WWW_HOST=$7
EOF
}
mk_env "$work/prod" production edge 172.31.2.2/32 desk.localhost landing.localhost www.landing.localhost
mk_env "$work/stg" staging edge 172.31.1.2/32 desk.stg.localhost preview.localhost www.preview.localhost
mk_env "$work/old" staging direct 127.0.0.1/32 desk.old.localhost old.localhost www.old.localhost
render() { EDGE_HOME="$work/edge" EDGE_STACKS="$*" bash "$infra/server/bin/edge.sh" render; }

if out=$(render "$work/prod $work/stg $work/old" 2>&1); then
  ok "(a) render + nginx -t: $(tail -n 1 <<<"$out")"
else
  bad "(a) render failed: $out"
fi
conf="$work/edge/nginx.conf"
grep -qE '^\s+landing\.localhost production-landing:443;$' "$conf" && grep -qE '^\s+desk\.localhost production-web:443;$' "$conf" \
  && grep -qE '^\s+preview\.localhost staging-landing:443;$' "$conf" && ok "(a) SNI map: hosts → <env>-web / <env>-landing" \
  || bad "(a) SNI map content"
grep -q 'old.localhost' "$conf" && bad "(a) a direct-mode stack was routed" || ok "(a) direct-mode stack ignored"
cp "$conf" "$work/good.conf"

mk_env "$work/dup" staging edge 172.31.1.2/32 desk.localhost x.localhost www.x.localhost
render "$work/prod $work/dup" >/dev/null 2>&1 && bad "(a) duplicate host accepted" || ok "(a) duplicate host refused"
mk_env "$work/badhost" staging edge 172.31.1.2/32 'desk.localhost;evil' x.localhost www.x.localhost
render "$work/badhost" >/dev/null 2>&1 && bad "(a) malformed host accepted" || ok "(a) malformed host refused"
mk_env "$work/badallow" production edge 0.0.0.0/0 desk.y.localhost y.localhost www.y.localhost
render "$work/badallow" >/dev/null 2>&1 && bad "(a) wrong PROXY_PROTOCOL_ALLOW accepted" || ok "(a) wrong PROXY_PROTOCOL_ALLOW refused"
cmp -s "$conf" "$work/good.conf" && ok "(a) refused renders left the previous nginx.conf untouched" || bad "(a) nginx.conf changed by a refused render"

# ---------- (b) end to end ----------
for n in staging production; do
  sub=172.31.1; [ "$n" = production ] && sub=172.31.2
  docker network create --label ottimo.test=edge-test --subnet "$sub.0/24" --ip-range "$sub.128/25" "ottimo-link-$n" >/dev/null
done
# Web stub: the same listener block as Caddyfile.prod, answering with the client address Caddy sees.
cat > "$work/web.caddy" <<'EOF'
{
	admin off
	servers :443 {
		listener_wrappers {
			proxy_protocol {
				timeout 5s
				allow {$PROXY_PROTOCOL_ALLOW:127.0.0.1/32}
				fallback_policy ignore
			}
			tls
		}
	}
}
desk.localhost, staff.desk.localhost, g.desk.localhost {
	tls internal
	respond "web-production {remote_host}"
}
EOF
printf '# production\n' > "$work/access-prod"
hash=$(printf 'edge-test-pw\n' | docker run --rm -i --network none --entrypoint caddy "$CADDY_IMAGE" hash-password | tail -n 1)
printf 'basic_auth {\n\tottimo %s\n}\nheader X-Robots-Tag "noindex, nofollow"\n' "$hash" > "$work/access-stg"
mkdir -p "$work/site" && printf '<!doctype html><title>landing</title>\n' > "$work/site/index.html"
chmod -R a+rX "$work"
docker run -d --name et-prod-web --network ottimo-link-production --network-alias production-web \
  -e PROXY_PROTOCOL_ALLOW=172.31.2.2/32 -v "$work/web.caddy:/etc/caddy/Caddyfile:ro" "$CADDY_IMAGE" >/dev/null
for l in prod stg; do
  net=production alias=production-landing host=landing.localhost allow=172.31.2.2/32
  [ "$l" = stg ] && { net=staging; alias=staging-landing; host=preview.localhost; allow=172.31.1.2/32; }
  docker run -d --name "et-$l-landing" --network "ottimo-link-$net" --network-alias "$alias" \
    -e LANDING_HOST="$host" -e LANDING_WWW_HOST="www.$host" -e ACME_EMAIL=ops@example.invalid -e PROXY_PROTOCOL_ALLOW="$allow" \
    -v "$infra/caddy/Caddyfile.landing:/etc/caddy/Caddyfile:ro" -v "$work/site:/srv/landing:ro" \
    -v "$work/access-$l:/run/secrets/landing_access:ro" "$CADDY_IMAGE" >/dev/null
done
EDGE_CONF="$work/good.conf" EDGE_BIND_PREFIX=127.0.0.1: EDGE_HTTP_PORT="$HTTP_PORT" EDGE_HTTPS_PORT="$HTTPS_PORT" \
  docker compose --project-name ottimo-edge-test -f "$infra/edge/docker-compose.edge.yml" up --detach --wait --wait-timeout 60 >/dev/null
sleep 3

c() { curl --silent --insecure --max-time 10 --retry 5 --retry-delay 2 --retry-all-errors "$@"; }
r() { echo "--resolve $1:$HTTPS_PORT:127.0.0.1 --resolve $1:$HTTP_PORT:127.0.0.1"; }
# shellcheck disable=SC2046
body=$(c $(r desk.localhost) "https://desk.localhost:$HTTPS_PORT/" || true)
case "$body" in
  "web-production 172.31.2.2") bad "(b) backend sees the EDGE address – PROXY protocol not applied" ;;
  "web-production "*) ok "(b) desk → production web, backend sees the client address (${body#web-production })" ;;
  *) bad "(b) desk → '$body'" ;;
esac
# shellcheck disable=SC2046
code=$(c $(r landing.localhost) -o /dev/null -D "$work/h" -w '%{http_code}' "https://landing.localhost:$HTTPS_PORT/" || true)
if [ "$code" = 200 ] && grep -qi '^content-security-policy:' "$work/h" && ! grep -qi '^x-robots-tag' "$work/h"; then
  ok "(b) landing.localhost → production landing: 200, CSP, no X-Robots-Tag"
else bad "(b) production landing answered $code"; fi
# shellcheck disable=SC2046
code=$(c $(r preview.localhost) -o /dev/null -D "$work/h" -w '%{http_code}' "https://preview.localhost:$HTTPS_PORT/" || true)
[ "$code" = 401 ] && grep -qi '^x-robots-tag: noindex' "$work/h" && ok "(b) staging preview: 401 without password, noindex" \
  || bad "(b) staging preview answered $code"
# shellcheck disable=SC2046
code=$(c $(r preview.localhost) --config <(printf 'user = "ottimo:edge-test-pw"\n') -o /dev/null -w '%{http_code}' "https://preview.localhost:$HTTPS_PORT/" || true)
[ "$code" = 200 ] && ok "(b) staging preview with password: 200" || bad "(b) staging preview with password: $code"
# shellcheck disable=SC2046
if curl --silent --insecure --max-time 5 $(r unknown.localhost) -o /dev/null "https://unknown.localhost:$HTTPS_PORT/"; then
  bad "(b) unknown SNI got an answer"
else ok "(b) unknown SNI → connection closed"; fi
# shellcheck disable=SC2046
code=$(c $(r www.landing.localhost) -o /dev/null -w '%{http_code} %{redirect_url}' "http://www.landing.localhost:$HTTP_PORT/x/" || true)
case "$code" in 30[18]\ https://www.landing.localhost/x/) ok "(b) :80 by Host → backend redirect ($code)" ;; *) bad "(b) :80 www.landing → $code" ;; esac
# shellcheck disable=SC2046
code=$(c $(r unknown.localhost) -o /dev/null -w '%{http_code}' "http://unknown.localhost:$HTTP_PORT/" || true)
[ "$code" = 404 ] && ok "(b) :80 unknown Host → 404" || bad "(b) :80 unknown Host → $code"
spoof=$(docker run --rm --network ottimo-link-production --ip 172.31.2.77 "$CURL_IMAGE" --silent --insecure --max-time 10 \
  --haproxy-protocol --haproxy-clientip 203.0.113.9 --resolve desk.localhost:443:"$(docker inspect -f '{{(index .NetworkSettings.Networks "ottimo-link-production").IPAddress}}' et-prod-web)" \
  https://desk.localhost/ 2>/dev/null || true)
[ "$spoof" = "web-production 172.31.2.77" ] && ok "(b) forged PROXY header (203.0.113.9) from a non-edge address ignored – backend saw 172.31.2.77" \
  || bad "(b) PROXY header from a non-edge address: '$spoof'"

if [ "$fails" -gt 0 ]; then echo "FAILED: $fails check(s)"; exit 1; fi
echo "OK: shared edge – render guards, SNI/Host routing, client address via PROXY protocol, no spoofing"
