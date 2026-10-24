#!/usr/bin/env bash
# CI guard on the RESOLVED compose files (docker compose config --format json), dev and staging/production
# (FB-R2-SEC-OPS-03, blocker verification 17/10: "blobdata not in web" had no automated check). Fails when:
#   - the blob volume (`blobdata`) is mounted in any service other than api and worker, or is missing there,
#     or BLOBSTORE_LOCAL_PATH of api/worker is not the absolute path where it is mounted (SEC C2, SR-FILE-04)
#   - web (Caddy) gets any volume other than its Caddyfile (+ certificate volumes in prod), or any secret
#   - prod: a service other than web publishes a port; web publishes anything but 80/443; postgres is not only on
#     the internal `db` network; a container is not read_only / cap_drop ALL / no-new-privileges; api/worker get a
#     secret as a plain variable instead of *_FILE; a retired PAYMENT_VIETQR_* account variable is passed
#   - dev + demo (UXR 17/10 #1): api and worker do not receive the same key material (DATA_KEK_CURRENT,
#     DATA_KEK_VERSION, ID_HASH_KEY, SESSION_SECRET, LOG_IP_HMAC_KEY, GUEST_CODE_SIGNING_KEY) from the env file, seed
#     not the same keyring (KEK + ID_HASH_KEY); the demo overlay resolves although the keys are missing; prod api/worker
#     lack DATA_KEK_CURRENT_FILE / ID_HASH_KEY_FILE
#   check-compose.sh                (from anywhere; uses product/.env.example and infra/server/env.example)
# Exit 0 = ok, 1 = a rule is broken, 2 = usage / tooling.
set -Eeuo pipefail

here=$(cd "$(dirname "$0")" && pwd)
product=$(cd "$here/../.." && pwd)
DEV_FILE="${DEV_COMPOSE:-$product/infra/docker-compose.yml}"
PROD_FILE="${PROD_COMPOSE:-$product/infra/docker-compose.prod.yml}"
command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 2; }

DEMO_FILE="${DEMO_COMPOSE:-$product/infra/demo/docker-compose.demo.yml}"
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 2; }

tmp=$(mktemp -d "${TMPDIR:-/tmp}/compose-check.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
docker compose -p ottimo-compose-check --env-file "$product/.env.example" -f "$DEV_FILE" \
  --profile seed config --format json > "$tmp/dev.json"
IMAGE_TAG=ci SECRETS_DIR=/nonexistent docker compose -p ottimo-compose-check \
  --env-file "$product/infra/server/env.example" -f "$PROD_FILE" \
  --profile deploy --profile seed --profile landing config --format json > "$tmp/prod.json"
# R3 v1.0: the production template behind the shared edge (overlay docker-compose.edge-link.yml) – same rules, and
# with the overlay no service may publish a port at all (the edge owns 80/443).
IMAGE_TAG=ci SECRETS_DIR=/nonexistent docker compose -p ottimo-compose-check \
  --env-file "$product/infra/server/env.production.example" -f "$PROD_FILE" \
  -f "$product/infra/docker-compose.edge-link.yml" \
  --profile deploy --profile landing config --format json > "$tmp/prodedge.json"
# Key wiring (UXR 17/10 #1): the template with throw-away random keys (never printed – only names are reported)
umask 077
sed -e "s|^DATA_KEK_CURRENT=$|DATA_KEK_CURRENT=$(openssl rand -base64 32)|" \
    -e "s|^ID_HASH_KEY=$|ID_HASH_KEY=$(openssl rand -hex 32)|" \
    -e "s|^SESSION_SECRET=$|SESSION_SECRET=$(openssl rand -hex 32)|" \
    -e "s|^LOG_IP_HMAC_KEY=$|LOG_IP_HMAC_KEY=$(openssl rand -hex 32)|" \
    -e "s|^GUEST_CODE_SIGNING_KEY=$|GUEST_CODE_SIGNING_KEY=$(openssl rand -hex 32)|" \
    "$product/.env.example" > "$tmp/keys.env"
docker compose -p ottimo-compose-check --env-file "$tmp/keys.env" -f "$DEV_FILE" \
  --profile seed config --format json > "$tmp/devk.json"
DEMO_API_IMAGE=ottimo-api:demo docker compose -p ottimo-compose-check --env-file "$tmp/keys.env" \
  -f "$DEV_FILE" -f "$DEMO_FILE" --profile seed config --format json > "$tmp/demo.json"
if DEMO_API_IMAGE=ottimo-api:demo docker compose -p ottimo-compose-check --env-file "$product/.env.example" \
  -f "$DEV_FILE" -f "$DEMO_FILE" --profile seed config --quiet >/dev/null 2>&1; then
  echo "FAIL demo: docker-compose.demo.yml resolves without DATA_KEK_CURRENT/ID_HASH_KEY (must refuse – UXR #1)"
  echo "::error::compose rules: demo overlay accepts missing key material"
  exit 1
fi

python3 - "$tmp/dev.json" "$tmp/prod.json" "$tmp/devk.json" "$tmp/demo.json" "$tmp/prodedge.json" <<'PY'
import json, sys

fails = []
def bad(msg): fails.append(msg)

BLOB = 'blobdata'
BLOB_USERS = {'api', 'worker'}
PLAIN_SECRETS = {'DATABASE_URL', 'MIGRATION_DATABASE_URL', 'SESSION_SECRET', 'DATA_KEK_CURRENT', 'ID_HASH_KEY',
                 'LOG_IP_HMAC_KEY', 'GUEST_CODE_SIGNING_KEY', 'QA_SEED_PASSWORD', 'POSTGRES_PASSWORD',
                 'OTTIMO_APP_DB_PASSWORD', 'OTTIMO_MIGRATOR_DB_PASSWORD', 'EMAIL_SMTP_PASSWORD'}
RETIRED = {'PAYMENT_VIETQR_BANK_BIN', 'PAYMENT_VIETQR_ACCOUNT_NO', 'PAYMENT_VIETQR_ACCOUNT_NAME', 'EMAIL_SMTP_URL'}

def check_blob(label, cfg):
    services = cfg['services']
    for name, svc in services.items():
        vols = svc.get('volumes') or []
        blob = [v for v in vols if v.get('type') == 'volume' and v.get('source') == BLOB]
        if name in BLOB_USERS:
            if len(blob) != 1:
                bad(f'{label}: {name} must mount {BLOB} exactly once (found {len(blob)})')
                continue
            target = blob[0]['target']
            env = svc.get('environment') or {}
            if env.get('BLOBSTORE_LOCAL_PATH') != target or not target.startswith('/'):
                bad(f'{label}: {name} BLOBSTORE_LOCAL_PATH={env.get("BLOBSTORE_LOCAL_PATH")!r} != mount {target!r}')
            if blob[0].get('read_only'):
                bad(f'{label}: {name} needs {BLOB} writable')
        elif blob:
            bad(f'{label}: {name} mounts {BLOB} – only api and worker may (SEC C2)')
    web = services.get('web')
    if not web:
        bad(f'{label}: no web service'); return
    for v in web.get('volumes') or []:
        if v.get('type') == 'bind':
            if v.get('target') != '/etc/caddy/Caddyfile' or not v.get('read_only'):
                bad(f'{label}: web bind mount {v.get("source")} → {v.get("target")} (only the Caddyfile, read-only)')
        elif v.get('type') == 'volume':
            if label == 'dev' or v.get('source') not in ('caddydata', 'caddyconfig'):
                bad(f'{label}: web mounts volume {v.get("source")} (only caddydata/caddyconfig in prod)')
        else:
            bad(f'{label}: web mount type {v.get("type")}')
    if web.get('secrets'):
        bad(f'{label}: web gets secrets {[s.get("source") for s in web["secrets"]]}')

KEYS = ['DATA_KEK_CURRENT', 'DATA_KEK_VERSION', 'ID_HASH_KEY', 'SESSION_SECRET', 'LOG_IP_HMAC_KEY',
        'GUEST_CODE_SIGNING_KEY']
KEYRING = ['DATA_KEK_CURRENT', 'DATA_KEK_VERSION', 'ID_HASH_KEY']

def check_keys(label, cfg):
    """api/worker: same non-empty key material; seed: the same keyring (values compared, never printed)."""
    services = cfg['services']
    envs = {n: (services.get(n) or {}).get('environment') or {} for n in ('api', 'worker', 'seed')}
    for name in ('api', 'worker'):
        missing = [k for k in KEYS if not envs[name].get(k)]
        if missing:
            bad(f'{label}: {name} does not receive {missing} from the env file (random per-process keys – UXR #1)')
    differ = [k for k in KEYS if envs['api'].get(k) != envs['worker'].get(k)]
    if differ:
        bad(f'{label}: api and worker get different {differ}')
    if 'seed' in services:
        seed_differ = [k for k in KEYRING if envs['seed'].get(k) != envs['api'].get(k)]
        if seed_differ:
            bad(f'{label}: seed keyring differs from api {seed_differ}')

dev = json.load(open(sys.argv[1]))
prod = json.load(open(sys.argv[2]))
check_keys('dev', json.load(open(sys.argv[3])))
check_keys('demo', json.load(open(sys.argv[4])))
check_blob('dev', dev)
check_blob('prod', prod)

# ---- prod only ----
prodedge = json.load(open(sys.argv[5]))
check_blob('prod-edge', prodedge)
for name, svc in prodedge['services'].items():
    if svc.get('ports'):
        bad(f'prod-edge: {name} publishes ports {svc["ports"]} (the shared edge owns 80/443)')
    if svc.get('environment', {}).get('MFA_ENFORCED') not in (None, 'true') and name in ('api', 'worker'):
        bad(f'prod-edge: {name} MFA_ENFORCED is not true in env.production.example')
lan = prodedge['services'].get('landing') or {}
if lan.get('volumes') and any(v.get('source') in ('pgdata', 'blobdata') for v in lan['volumes']):
    bad('prod-edge: landing mounts application data')
if sorted((lan.get('networks') or {}).keys()) != ['edge', 'landing', 'link']:
    bad(f'prod-edge: landing networks {sorted((lan.get("networks") or {}).keys())} (only edge + landing + link)')
if 'db' in (lan.get('networks') or {}) or lan.get('secrets') and [x for x in lan['secrets'] if x.get('source') != 'landing_access']:
    bad('prod-edge: landing must not reach the database network nor get application secrets')
api_tp = ((prodedge['services'].get('api') or {}).get('environment') or {}).get('TRUST_PROXY', '')
lan_ip = ((lan.get('networks') or {}).get('edge') or {}).get('ipv4_address')
if not lan_ip or lan_ip not in api_tp.split(','):
    bad(f'prod-edge: api TRUST_PROXY {api_tp!r} does not name the landing address {lan_ip!r} (US-155 client address)')
nets = prod.get('networks', {})
if not (nets.get('db') or {}).get('internal'):
    bad('prod: network db must be internal')
for name, svc in prod['services'].items():
    ports = svc.get('ports') or []
    if name == 'web':
        targets = sorted(int(p['target']) for p in ports)
        if targets != [80, 443]:
            bad(f'prod: web publishes {targets} (only 80, 443)')
    elif ports:
        bad(f'prod: {name} publishes ports {ports}')
    if not svc.get('read_only'):
        bad(f'prod: {name} is not read_only')
    if 'ALL' not in (svc.get('cap_drop') or []):
        bad(f'prod: {name} does not drop ALL capabilities')
    if 'no-new-privileges:true' not in (svc.get('security_opt') or []):
        bad(f'prod: {name} lacks no-new-privileges')
    env = svc.get('environment') or {}
    plain = sorted(k for k in env if k in PLAIN_SECRETS)
    if plain:
        bad(f'prod: {name} gets secrets as plain variables {plain} (use *_FILE + secrets)')
    retired = sorted(k for k in env if k in RETIRED)
    if retired:
        bad(f'prod: {name} passes retired variables {retired} (SEC-INT-06)')
    if name in ('api', 'worker'):
        no_file = [k for k in KEYS if k != 'DATA_KEK_VERSION' and not env.get(f'{k}_FILE')]
        if no_file:
            bad(f'prod: {name} lacks {[k + "_FILE" for k in no_file]}')
pg = prod['services'].get('postgres', {})
if sorted((pg.get('networks') or {}).keys()) != ['db']:
    bad(f'prod: postgres networks {sorted((pg.get("networks") or {}).keys())} (only db)')
extra_caps = set(pg.get('cap_add') or []) - {'CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'SETGID', 'SETUID'}
if extra_caps:
    bad(f'prod: postgres cap_add {sorted(extra_caps)}')

if fails:
    for f in fails:
        print('FAIL ' + f)
    print(f'::error::compose rules: {len(fails)} problem(s)')
    sys.exit(1)
print('OK: compose rules (blob volume only in api/worker, web without blob/secrets, prod hardening, no plain secrets, '
      'one keyring for api/worker/seed in dev + demo, demo refuses missing keys)')
PY
