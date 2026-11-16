#!/usr/bin/env bash
# Test of the shared edge (infra/edge, infra/server/bin/edge.sh – R3 v1.0: staging + production on one VPS):
#   (a) edge.sh render: routing table from two stacks' .env, nginx -t on the pinned image; refuses a host name used
#       twice, a malformed host name, a wrong PROXY_PROTOCOL_ALLOW; ignores a stack in direct mode
#   (b) end to end on Docker (Caddy backends with Caddy's internal CA, *.localhost names, the real
#       docker-compose.edge.yml on 127.0.0.1:28080/28443):
#       SNI → right stack (production web / production landing / staging landing), the backend sees the CLIENT address
#       (PROXY protocol), not the edge's; unknown SNI → connection closed; :80 by Host → the backend's 308; unknown
#       Host on :80 → 404; a PROXY header from any address other than the edge is ignored (no address spoofing);
#       the staging landing preview answers 401 without its password, the production landing 200 + headers;
#       FB-R3-SEC-OPS-01: one address holding EDGE_CONN_PER_IP (test: 5) idle connections is refused more, another
#       address still gets in, and idle connections that never send a ClientHello are closed after preread_timeout.
#   Secondary static site (infra/static, R5 16/11), names example-like *.localhost:
#   (a) no static site (no .env, or empty names) → nginx.conf byte-identical to fixtures/edge-nginx.ottimo-only.conf
#       (rendered by edge.sh before the feature); with the site: exactly 4 lines added, all other bytes identical;
#       refuses a static name used by a stack, a malformed one, apex without www, an unreadable .env; `plan` changes
#       nothing and shows only the static lines
#   (b) the real infra/static compose (image built from Dockerfile.static, read_only, uid 10001, cap_drop ALL) behind
#       the edge with docker-compose.edge-static.yml: apex 200 with the site's own CSP / headers / cache, https www →
#       301 apex, http apex and www → 301 https apex, 405 on POST, dot files 404 with the same headers, the backend
#       logs a client address that is not the edge's; all OTTIMO checks above run with the static site present.
# Needs Docker. Uses the fixed network names ottimo-link-staging/production/static: do NOT run on the VPS.
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
# EDGE_TEST_JSON_LOGS=1: a Docker host without journald (Docker Desktop / OrbStack) – the containers log to json-file
# instead of the journald driver of the real compose files. CI (Ubuntu runner) runs with journald, as on the VPS.
local_logs=()
if [ "${EDGE_TEST_JSON_LOGS:-}" = 1 ]; then
  printf 'services:\n  %s:\n    logging: !override\n      driver: json-file\n' edge > "$work/logs-edge.yml"
  printf 'services:\n  %s:\n    logging: !override\n      driver: json-file\n' static > "$work/logs-static.yml"
fi
edc() {
  [ "${EDGE_TEST_JSON_LOGS:-}" = 1 ] && local_logs=(-f "$work/logs-edge.yml")
  EDGE_CONF="$work/edge5/nginx.conf" docker compose --project-name ottimo-edge-test -f "$infra/edge/docker-compose.edge.yml" \
    -f "$infra/edge/docker-compose.edge-static.yml" ${local_logs[@]+"${local_logs[@]}"} "$@"
}
sdc() {
  [ "${EDGE_TEST_JSON_LOGS:-}" = 1 ] && local_logs=(-f "$work/logs-static.yml")
  docker compose --project-name ottimo-static-test --env-file "$work/static/.env" -f "$infra/static/docker-compose.static.yml" \
    ${local_logs[@]+"${local_logs[@]}"} "$@"
}

cleanup() {
  edc down --remove-orphans >/dev/null 2>&1 || true
  sdc down --volumes --remove-orphans >/dev/null 2>&1 || true
  docker rm -f et-prod-web et-prod-landing et-stg-landing >/dev/null 2>&1 || true
  for n in staging production static; do
    if docker network inspect "ottimo-link-$n" --format '{{index .Labels "ottimo.test"}}' 2>/dev/null | grep -q edge-test; then
      docker network rm "ottimo-link-$n" >/dev/null 2>&1 || true
    fi
  done
  rm -rf "$work"
}
trap cleanup EXIT

for n in staging production static; do
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
# EDGE_STATIC_HOME: the secondary static site (infra/static) is OFF unless a test sets STATIC_HOME_UNDER_TEST.
render() {
  EDGE_HOME="${EDGE_HOME_UNDER_TEST:-$work/edge}" EDGE_STACKS="$*" EDGE_STATIC_HOME="${STATIC_HOME_UNDER_TEST:-$work/no-static}" \
    bash "$infra/server/bin/edge.sh" render
}

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
grep -qE 'limit_conn ottimo_tls_perip 100;' "$conf" && grep -q 'preread_timeout 5s;' "$conf" \
  && grep -qE 'limit_conn ottimo_http_perip 20;' "$conf" && grep -q 'worker_connections 8192;' "$conf" \
  && ok "(a) limits: 100 connections per IP on 443, 20 on 80, preread 5 s, 8192 worker connections" \
  || bad "(a) connection limits missing in nginx.conf"
cp "$conf" "$work/good.conf"

mk_env "$work/dup" staging edge 172.31.1.2/32 desk.localhost x.localhost www.x.localhost
render "$work/prod $work/dup" >/dev/null 2>&1 && bad "(a) duplicate host accepted" || ok "(a) duplicate host refused"
mk_env "$work/badhost" staging edge 172.31.1.2/32 'desk.localhost;evil' x.localhost www.x.localhost
render "$work/badhost" >/dev/null 2>&1 && bad "(a) malformed host accepted" || ok "(a) malformed host refused"
mk_env "$work/badallow" production edge 0.0.0.0/0 desk.y.localhost y.localhost www.y.localhost
render "$work/badallow" >/dev/null 2>&1 && bad "(a) wrong PROXY_PROTOCOL_ALLOW accepted" || ok "(a) wrong PROXY_PROTOCOL_ALLOW refused"
EDGE_CONN_PER_IP=abc render "$work/prod" >/dev/null 2>&1 && bad "(a) non-numeric EDGE_CONN_PER_IP accepted" \
  || ok "(a) non-numeric EDGE_CONN_PER_IP refused"
cmp -s "$conf" "$work/good.conf" && ok "(a) refused renders left the previous nginx.conf untouched" || bad "(a) nginx.conf changed by a refused render"

# ---------- (a) secondary static site (infra/static, EDGE_STATIC_HOME/.env) ----------
# The OTTIMO routing must not move by one byte when no static site is configured: the render of the fixtures above is
# compared with fixtures/edge-nginx.ottimo-only.conf, written by the edge.sh of main BEFORE the static site existed
# (temporary directory replaced by @WORK@). EDGE_TEST_WRITE_GOLDEN=1 rewrites it – only for a deliberate, reviewed
# change of the OTTIMO block.
golden="$here/fixtures/edge-nginx.ottimo-only.conf"
norm() { sed "s|$work|@WORK@|g" "$1"; }
if [ "${EDGE_TEST_WRITE_GOLDEN:-}" = 1 ]; then mkdir -p "$here/fixtures"; norm "$work/good.conf" > "$golden"; echo "golden written: $golden"; fi
cmp -s <(norm "$work/good.conf") "$golden" \
  && ok "(a) no static site: nginx.conf byte-identical to the render before the static site existed" \
  || { bad "(a) no static site: nginx.conf differs from $golden"; diff <(norm "$work/good.conf") "$golden" | head -20 || true; }
mk_static() { # dir host www
  mkdir -p "$1"
  printf 'STATIC_HOST=%s\nSTATIC_WWW_HOST=%s\nACME_EMAIL=ops@example.invalid\nSTATIC_ROOT=%s/site\n' "$2" "$3" "$1" > "$1/.env"
}
mk_static "$work/static" static.localhost www.static.localhost
mkdir -p "$work/static-empty" && printf 'STATIC_HOST=\nSTATIC_WWW_HOST=\n' > "$work/static-empty/.env"
EDGE_HOME_UNDER_TEST="$work/edge-se" STATIC_HOME_UNDER_TEST="$work/static-empty" render "$work/prod $work/stg $work/old" >/dev/null 2>&1 \
  && cmp -s "$work/edge-se/nginx.conf" "$work/good.conf" && ok "(a) static .env with empty names: same bytes as no static site" \
  || bad "(a) static .env with empty names changed nginx.conf"
if out=$(EDGE_HOME_UNDER_TEST="$work/edge-s" STATIC_HOME_UNDER_TEST="$work/static" render "$work/prod $work/stg $work/old" 2>&1); then
  ok "(a) render with static site + nginx -t: $(tail -n 1 <<<"$out")"
else bad "(a) render with static site failed: $out"; fi
sconf="$work/edge-s/nginx.conf"
grep -qE '^\s+static\.localhost static-site:443;$' "$sconf" && grep -qE '^\s+www\.static\.localhost static-site:443;$' "$sconf" \
  && grep -qE '^\s+static\.localhost static-site;$' "$sconf" && grep -qE '^\s+www\.static\.localhost static-site;$' "$sconf" \
  && ok "(a) static names → static-site (SNI map and Host map)" || bad "(a) static names missing in nginx.conf"
# Removing exactly the four static lines gives back the OTTIMO-only file byte for byte (nothing else moved).
[ "$(grep -c 'static-site' "$sconf")" = 4 ] && cmp -s <(grep -v 'static-site' "$sconf") "$work/good.conf" \
  && ok "(a) static site on: every other line identical to the OTTIMO-only render (only 4 lines added)" \
  || { bad "(a) static site changed OTTIMO lines"; diff <(grep -v 'static-site' "$sconf") "$work/good.conf" | head -20 || true; }
mk_static "$work/static-dup" desk.localhost www.static.localhost
STATIC_HOME_UNDER_TEST="$work/static-dup" render "$work/prod" >/dev/null 2>&1 && bad "(a) static name = an OTTIMO name accepted" \
  || ok "(a) static name already used by a stack refused"
mk_static "$work/static-bad" 'static.localhost;evil' www.static.localhost
STATIC_HOME_UNDER_TEST="$work/static-bad" render "$work/prod" >/dev/null 2>&1 && bad "(a) malformed static name accepted" \
  || ok "(a) malformed static name refused"
mk_static "$work/static-half" static.localhost ''
STATIC_HOME_UNDER_TEST="$work/static-half" render "$work/prod" >/dev/null 2>&1 && bad "(a) STATIC_HOST without STATIC_WWW_HOST accepted" \
  || ok "(a) STATIC_HOST without STATIC_WWW_HOST refused"
# SEC FB-R5-SEC-OPS-167: one name per variable, www = www.<apex>, no word splitting / glob.
mk_static "$work/static-two" 'static.localhost other.localhost' www.static.localhost
STATIC_HOME_UNDER_TEST="$work/static-two" render "$work/prod" >/dev/null 2>&1 && bad "(a) two names in STATIC_HOST accepted" \
  || ok "(a) STATIC_HOST with two names refused (not split into extra routes)"
mk_static "$work/static-glob" '*' 'www.*'
STATIC_HOME_UNDER_TEST="$work/static-glob" render "$work/prod" >/dev/null 2>&1 && bad "(a) glob static name accepted" \
  || ok "(a) glob in STATIC_HOST refused"
mk_static "$work/static-www" static.localhost www.other.localhost
STATIC_HOME_UNDER_TEST="$work/static-www" render "$work/prod" >/dev/null 2>&1 && bad "(a) STATIC_WWW_HOST of another apex accepted" \
  || ok "(a) STATIC_WWW_HOST other than www.<STATIC_HOST> refused"
# SEC FB-R5-SEC-OPS-168: no name of an OTTIMO domain – ottimo.vn (hard) or under a loaded stack's apex.
mk_static "$work/static-ov" api.ottimo.vn www.api.ottimo.vn
STATIC_HOME_UNDER_TEST="$work/static-ov" render "$work/prod" >/dev/null 2>&1 && bad "(a) static name under ottimo.vn accepted" \
  || ok "(a) static name under ottimo.vn refused"
mk_static "$work/static-ov2" ottimo.vn www.ottimo.vn
STATIC_HOME_UNDER_TEST="$work/static-ov2" render "$work/prod" >/dev/null 2>&1 && bad "(a) static name ottimo.vn accepted" \
  || ok "(a) static name ottimo.vn refused"
mk_static "$work/static-sub" shop.landing.localhost www.shop.landing.localhost
STATIC_HOME_UNDER_TEST="$work/static-sub" render "$work/prod" >/dev/null 2>&1 && bad "(a) static name under a stack's apex accepted" \
  || ok "(a) static name under a loaded stack's apex (landing.localhost) refused"
# SEC FB-R5-SEC-OPS-166: static-site.sh refuses a web root with a symlink (file_server would follow it).
mkdir -p "$work/static-ln/site" "$work/static-ln/edge"
printf 'STATIC_HOST=static.localhost\nSTATIC_WWW_HOST=www.static.localhost\nACME_EMAIL=ops@example.invalid\nSTATIC_ROOT=%s/site\n' \
  "$work/static-ln" > "$work/static-ln/.env"
printf 'x\n' > "$work/static-ln/site/index.html" && chmod 644 "$work/static-ln/site/index.html"
sout=$(STATIC_HOME="$work/static-ln" EDGE_HOME="$work/static-ln/edge" bash "$infra/server/bin/static-site.sh" up 2>&1 || true)
grep -q 'the edge does not route' <<<"$sout" && ok "(a) static-site.sh: clean web root passes the content checks" \
  || bad "(a) static-site.sh clean web root: $sout"
ln -s /home/caddy/data/k.key "$work/static-ln/site/k.txt"
sout=$(STATIC_HOME="$work/static-ln" EDGE_HOME="$work/static-ln/edge" bash "$infra/server/bin/static-site.sh" up 2>&1 || true)
grep -q 'symlink in the web root' <<<"$sout" && ok "(a) static-site.sh: symlink in the web root refused" \
  || bad "(a) static-site.sh symlink: $sout"
printf 'STATIC_HOST=static.localhost\nSTATIC_WWW_HOST=www.other.localhost\nACME_EMAIL=ops@example.invalid\n' > "$work/static-ln/.env"
sout=$(STATIC_HOME="$work/static-ln" EDGE_HOME="$work/static-ln/edge" bash "$infra/server/bin/static-site.sh" up 2>&1 || true)
grep -q 'must be www' <<<"$sout" && ok "(a) static-site.sh: www not matching the apex refused" || bad "(a) static-site.sh www rule: $sout"
if [ "$(id -u)" != 0 ]; then
  mk_static "$work/static-locked" static.localhost www.static.localhost && chmod 000 "$work/static-locked/.env"
  STATIC_HOME_UNDER_TEST="$work/static-locked" render "$work/prod" >/dev/null 2>&1 && bad "(a) unreadable static .env silently skipped" \
    || ok "(a) unreadable static .env stops the render (route not dropped silently)"
  chmod 600 "$work/static-locked/.env"
fi
cmp -s "$conf" "$work/good.conf" && ok "(a) refused static renders left the previous nginx.conf untouched" || bad "(a) nginx.conf changed by a refused static render"
# plan: writes nginx.conf.plan only, the file in use keeps its bytes; prints the 4 added lines.
cp "$work/good.conf" "$work/edge-s/nginx.conf"
pout=$(EDGE_HOME="$work/edge-s" EDGE_STACKS="$work/prod $work/stg $work/old" EDGE_STATIC_HOME="$work/static" \
  bash "$infra/server/bin/edge.sh" plan 2>&1 || true)
cmp -s "$work/edge-s/nginx.conf" "$work/good.conf" && [ "$(grep -c '^+.*static-site' <<<"$pout")" = 4 ] \
  && [ "$(grep -cE '^[-+]\s' <<<"$pout")" = 4 ] && ok "(a) plan: diff shows only the 4 static lines, nginx.conf in use unchanged" \
  || bad "(a) plan output / side effect: $pout"
[ "${EDGE_TEST_ONLY_RENDER:-}" = 1 ] && { [ "$fails" -eq 0 ] || exit 1; echo "OK (render part only)"; exit 0; }

# ---------- (b) end to end ----------
for n in staging production static; do
  sub=172.31.1; [ "$n" = production ] && sub=172.31.2; [ "$n" = static ] && sub=172.31.3
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
# The end-to-end run uses a low per-IP limit (5) so the limit can be reached with a handful of idle connections.
# Static site: the real compose file and image (built here from Dockerfile.static), a two-file site like the hand-over.
mkdir -p "$work/static/site/img" "$work/static/site/.git"
printf '<!doctype html><title>static</title>\n' > "$work/static/site/index.html"
printf 'GIF89a' > "$work/static/site/img/a.gif"
printf 'secret\n' > "$work/static/site/.git/config"
chmod -R a+rX "$work/static/site"
sdc build --quiet static >/dev/null
sdc up --detach --wait --wait-timeout 90 static >/dev/null
EDGE_CONN_PER_IP=5 EDGE_HOME="$work/edge5" EDGE_STACKS="$work/prod $work/stg" EDGE_STATIC_HOME="$work/static" \
  bash "$infra/server/bin/edge.sh" render >/dev/null
EDGE_BIND_PREFIX=127.0.0.1: EDGE_HTTP_PORT="$HTTP_PORT" EDGE_HTTPS_PORT="$HTTPS_PORT" edc up --detach --wait --wait-timeout 60 >/dev/null
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

# Secondary static site through the edge (its own CSP: inline CSS/JS + Google Fonts, never the OTTIMO one).
static_csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
# shellcheck disable=SC2046
code=$(c $(r static.localhost) -o /dev/null -D "$work/hs" -w '%{http_code}' "https://static.localhost:$HTTPS_PORT/" || true)
hv() { grep -i "^$1:" "$work/hs" | head -n 1 | cut -d' ' -f2- | tr -d '\r'; }
if [ "$code" = 200 ] && [ "$(hv content-security-policy)" = "$static_csp" ] && [ "$(hv strict-transport-security)" = "max-age=31536000" ] \
  && [ "$(hv x-frame-options)" = DENY ] && [ "$(hv x-content-type-options)" = nosniff ] \
  && [ "$(hv cache-control)" = "public, max-age=0, must-revalidate" ] && ! grep -qi '^server:' "$work/hs"; then
  ok "(b) static.localhost → static site: 200, its own CSP, HSTS, DENY, nosniff, HTML not cached, no Server header"
else bad "(b) static apex answered $code (CSP '$(hv content-security-policy)', cache '$(hv cache-control)')"; fi
# shellcheck disable=SC2046
code=$(c $(r static.localhost) -o /dev/null -D "$work/hs" -w '%{http_code}' "https://static.localhost:$HTTPS_PORT/img/a.gif" || true)
[ "$code" = 200 ] && [ "$(hv cache-control)" = "public, max-age=604800" ] && ok "(b) static /img/*: 200, cached 7 days" \
  || bad "(b) static /img/a.gif: $code, cache '$(hv cache-control)'"
# shellcheck disable=SC2046
code=$(c $(r www.static.localhost) -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.static.localhost:$HTTPS_PORT/a?b=1" || true)
[ "$code" = "301 https://static.localhost/a?b=1" ] && ok "(b) https www → 301 https apex (path + query kept)" || bad "(b) https www → '$code'"
for h in static.localhost www.static.localhost; do
  # shellcheck disable=SC2046
  code=$(c $(r "$h") -o /dev/null -w '%{http_code} %{redirect_url}' "http://$h:$HTTP_PORT/x" || true)
  [ "$code" = "301 https://static.localhost/x" ] && ok "(b) http $h → 301 https apex (one hop)" || bad "(b) http $h → '$code'"
done
# shellcheck disable=SC2046
code=$(c $(r static.localhost) -o /dev/null -w '%{http_code}' -X POST --data x "https://static.localhost:$HTTPS_PORT/" || true)
[ "$code" = 405 ] && ok "(b) static POST → 405" || bad "(b) static POST → $code"
# shellcheck disable=SC2046
code=$(c $(r static.localhost) -o /dev/null -D "$work/hs" -w '%{http_code}' "https://static.localhost:$HTTPS_PORT/.git/config" || true)
[ "$code" = 404 ] && [ "$(hv content-security-policy)" = "$static_csp" ] && ok "(b) static dot file → 404 with the same CSP" \
  || bad "(b) static /.git/config → $code"
# The OTTIMO landing keeps its strict CSP with the static site next to it.
# shellcheck disable=SC2046
c $(r landing.localhost) -o /dev/null -D "$work/hs" "https://landing.localhost:$HTTPS_PORT/" >/dev/null || true
case "$(hv content-security-policy)" in *"script-src 'self';"*"style-src 'self';"*) ok "(b) OTTIMO landing CSP unchanged (no unsafe-inline)" ;;
  *) bad "(b) OTTIMO landing CSP: '$(hv content-security-policy)'" ;; esac
# PROXY protocol: a client at 172.31.2.70 (another network than the static one) goes through the edge; the static Caddy
# must log its (masked /24) address 172.31.2.0, not the edge's 172.31.3.0.
docker run --rm --network ottimo-link-production --ip 172.31.2.70 "$CURL_IMAGE" -sk --max-time 10 -o /dev/null \
  --resolve static.localhost:443:172.31.2.2 "https://static.localhost/?probe=1" >/dev/null 2>&1 || true
sleep 1
slog=$(sdc logs --no-color static 2>/dev/null | grep '"uri":"/?\[q\]"' | grep -o '"remote_ip":"[^"]*"' | tail -n 1 || true)
[ "$slog" = '"remote_ip":"172.31.2.0"' ] && ok "(b) static backend sees the client address via PROXY protocol ($slog, masked /24), not the edge's" \
  || bad "(b) static backend client address: '${slog:-none logged}'"
# SEC FB-R5-SEC-OPS-170: a forged PROXY header sent straight to the static Caddy from another address of the static
# network is ignored – the log shows the sender's real /24 (172.31.3.0), never the forged 203.0.113.0.
docker run --rm --network ottimo-link-static --ip 172.31.3.77 "$CURL_IMAGE" -sk --max-time 10 -o /dev/null \
  --haproxy-protocol --haproxy-clientip 203.0.113.9 --resolve static.localhost:443:172.31.3.10 \
  "https://static.localhost/spoof-probe" >/dev/null 2>&1 || true
sleep 1
slog=$(sdc logs --no-color static 2>/dev/null | grep '"uri":"/spoof-probe"' | grep -o '"remote_ip":"[^"]*"' | tail -n 1 || true)
[ "$slog" = '"remote_ip":"172.31.3.0"' ] && ok "(b) forged PROXY header (203.0.113.9) from a non-edge address on the static network ignored ($slog)" \
  || bad "(b) static network PROXY spoof: '${slog:-none logged}'"
# Hardening of the running container (the real compose file).
sid=$(sdc ps -q static)
[ "$(docker inspect -f '{{.Config.User}} {{.HostConfig.ReadonlyRootfs}} {{.HostConfig.CapDrop}} {{.HostConfig.PortBindings}}' "$sid")" = "10001:10001 true [ALL] map[]" ] \
  && ok "(b) static container: uid 10001, read-only, cap_drop ALL, no published port" || bad "(b) static container hardening: $(docker inspect -f '{{.Config.User}} {{.HostConfig.ReadonlyRootfs}} {{.HostConfig.CapDrop}} {{.HostConfig.PortBindings}}' "$sid")"

# FB-R3-SEC-OPS-01: per-IP limit + preread timeout. Client A holds 6 idle TCP connections (no ClientHello) to the edge.
docker run --rm --network ottimo-link-production --ip 172.31.2.60 --entrypoint sh "$CURL_IMAGE" -c '
  for i in 1 2 3 4 5 6; do (sleep 20 | nc 172.31.2.2 443 >/dev/null 2>&1 &); done
  sleep 1
  if curl -sk --max-time 3 --resolve desk.localhost:443:172.31.2.2 -o /dev/null https://desk.localhost/; then echo A-over-limit=served; else echo A-over-limit=refused; fi
  sleep 7
  if curl -sk --max-time 5 --resolve desk.localhost:443:172.31.2.2 -o /dev/null https://desk.localhost/; then echo A-after-preread=served; else echo A-after-preread=refused; fi' \
  > "$work/limits.txt" 2>/dev/null &
pid=$!
sleep 2
other=$(docker run --rm --network ottimo-link-production --ip 172.31.2.61 "$CURL_IMAGE" -sk --max-time 5 \
  --resolve desk.localhost:443:172.31.2.2 https://desk.localhost/ 2>/dev/null || true)
wait "$pid" || true
limits=$(cat "$work/limits.txt" 2>/dev/null || true)
grep -q 'A-over-limit=refused' <<<"$limits" && ok "(b) per-IP limit: connections of one address beyond the limit (5) refused" \
  || bad "(b) per-IP limit not applied ($limits)"
case "$other" in "web-production "*) ok "(b) another address still served while the first one is at its limit" ;;
  *) bad "(b) another address not served during the flood: '$other'" ;; esac
grep -q 'A-after-preread=served' <<<"$limits" && ok "(b) idle connections without ClientHello closed after preread_timeout (address served again)" \
  || bad "(b) idle connections not closed by preread_timeout ($limits)"

if [ "$fails" -gt 0 ]; then echo "FAILED: $fails check(s)"; exit 1; fi
echo "OK: shared edge – render guards, SNI/Host routing, client address via PROXY protocol, no spoofing"
