# shellcheck shell=bash
# Shared helpers of the investor DEMO scripts (demo-up.sh, demo-reset.sh, demo-down.sh). Sourced, not run.
# Everything secret (DB passwords, accounts, guest link, device token) stays in .work/ and .out/ (gitignored, 0700/0600)
# and is never printed.

DEMO_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PRODUCT_DIR=$(cd "$DEMO_DIR/../.." && pwd)
# shellcheck disable=SC2034 # used by demo-up.sh (git archive)
REPO_DIR=$(cd "$PRODUCT_DIR/.." && pwd)
# Working files OUTSIDE the repository (a full source copy inside product/ would be linted, formatted and sent into
# docker build contexts): ~/.ottimo-demo by default.
WORK="${OTTIMO_DEMO_WORK:-$HOME/.ottimo-demo}"
OUT="$DEMO_DIR/.out"
SRC="$WORK/src"                 # git archive of the demo ref (product/ only)
ENV_FILE="$WORK/demo.env"       # per build: random DB passwords, test token, origins; keys generated once (0600)
STATE_FILE="$WORK/state.json"   # ids + demo passwords between the seeding phases (0600)
# Key material of the api/worker (keyring.ts, config.ts). Generated ONCE into demo.env and reused by every later
# dc call, demo-reset.sh and rebuild – without it the api falls back to a random key per process (dev design) and
# every restart or phase switch made earlier ID documents unreadable (UXR 17/10 #1).
DEMO_KEYS="DATA_KEK_CURRENT ID_HASH_KEY SESSION_SECRET LOG_IP_HMAC_KEY GUEST_CODE_SIGNING_KEY"
export DEMO_PROJECT="${DEMO_PROJECT:-ottimo-demo}"
export DEMO_API_URL="${DEMO_API_URL:-http://127.0.0.1:3100}"
export DEMO_DESK_URL="http://localhost:8181" DEMO_STAFF_URL="http://localhost:8182" DEMO_GUEST_URL="http://localhost:8183"

for d in "$HOME/.local/node/bin" "$HOME/.local/bin" /Applications/OrbStack.app/Contents/MacOS/xbin /opt/homebrew/bin /usr/local/bin; do
  case ":$PATH:" in *":$d:"*) ;; *) [ -d "$d" ] && PATH="$d:$PATH" ;; esac
done
export PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0

say() { printf '[demo %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { say "LỖI: $*" >&2; exit 1; }

need_tools() {
  command -v docker >/dev/null || die "cần Docker (OrbStack/Docker Desktop) đang chạy"
  docker info >/dev/null 2>&1 || die "Docker chưa chạy – mở OrbStack/Docker Desktop rồi chạy lại"
  command -v node >/dev/null || die "cần Node 22 (xem product/docs/dev-setup.md mục 1)"
  command -v git >/dev/null || die "cần git"
  command -v openssl >/dev/null || die "cần openssl"
}

# docker compose of the demo project. Phase variables (exported before calling):
#   DEMO_API_IMAGE  ottimo-api:demo (default, no test endpoints) | ottimo-api:demo-seed (seeding phase only)
#   CLOCK_MODE      system (default) | mutable (seeding phase only)
#   INCLUDE_TEST_SUPPORT 0 (default) | 1 (seeding phase only)
dc() {
  [ -f "$ENV_FILE" ] || die "chưa có $ENV_FILE – chạy demo-up.sh trước"
  # docker-compose.demo.yml refuses to resolve without the keys: a demo.env from before 17/10 gets them here
  ensure_demo_keys
  DEMO_API_IMAGE="${DEMO_API_IMAGE:-ottimo-api:demo}" \
    CLOCK_MODE="${CLOCK_MODE:-system}" INCLUDE_TEST_SUPPORT="${INCLUDE_TEST_SUPPORT:-0}" \
    docker compose -p "$DEMO_PROJECT" --env-file "$ENV_FILE" \
    -f "$SRC/product/infra/docker-compose.yml" -f "$DEMO_DIR/docker-compose.demo.yml" "$@"
}

ports_free() {
  local p busy=""
  for p in 8181 8182 8183 3100; do
    if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
      # ours (a previous demo still running) is fine
      docker ps --filter "label=com.docker.compose.project=$DEMO_PROJECT" --format '{{.Ports}}' | grep -q ":$p->" || busy+=" $p"
    fi
  done
  [ -z "$busy" ] || die "cổng đang bị chương trình khác dùng:$busy – tắt nó rồi chạy lại"
}

# value of KEY in the demo env file (never printed by callers); $2 = another env file
env_value() { sed -n "s/^$1=//p" "${2:-$ENV_FILE}" 2>/dev/null | tail -n 1; }

# set KEY=VALUE in the demo env file (replaces every KEY= line, else appends); values travel through the environment,
# never through a command line or the log
set_env_value() {
  local tmp
  tmp=$(mktemp "$WORK/.demo.env.XXXXXX")
  K="$1" V="$2" awk 'BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"]; done = 0 }
    index($0, k "=") == 1 { if (!done) print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }' "$ENV_FILE" > "$tmp"
  chmod 600 "$tmp" && mv -f "$tmp" "$ENV_FILE"
}

# ensure_demo_keys [previous demo.env]: every key of DEMO_KEYS gets, in this order, its value in the previous file (a
# rebuild keeps the keys), the value already in demo.env, or a new random one – written once, reused afterwards.
# DATA_KEK_VERSION follows the KEK it belongs to. Nothing is printed.
# shellcheck disable=SC2120 # demo-up.sh passes the previous demo.env on a rebuild
ensure_demo_keys() {
  local prev="${1:-}" k v from
  if [ -n "$prev" ] && [ ! -f "$prev" ]; then prev=""; fi
  for k in $DEMO_KEYS; do
    v="" from=new
    if [ -n "$prev" ]; then v=$(env_value "$k" "$prev"); fi
    if [ -n "$v" ]; then
      from=prev
    else
      v=$(env_value "$k")
      if [ -n "$v" ]; then from=current; fi
    fi
    if [ "$from" = new ]; then
      case "$k" in
        DATA_KEK_CURRENT) v=$(openssl rand -base64 32) ;; # exactly 32 bytes (keyring.ts)
        *) v=$(openssl rand -hex 32) ;;                   # >= 32 characters, one key per purpose (config.ts)
      esac
    fi
    if [ "$from" != current ]; then set_env_value "$k" "$v"; fi
    if [ "$k" = DATA_KEK_CURRENT ]; then
      case "$from" in
        prev) v=$(env_value DATA_KEK_VERSION "$prev") ;;
        current) v=$(env_value DATA_KEK_VERSION) ;;
        *) v=1 ;;
      esac
      if [ "$(env_value DATA_KEK_VERSION)" != "${v:-1}" ]; then set_env_value DATA_KEK_VERSION "${v:-1}"; fi
    fi
  done
}

# The throw-away copy of the QA fixture DS-E for the demo (never the repository file), $1 = its path:
#   - every parameter takes effect 120 days before today (the QA fixture dates them from 2026-10-01; the demo stays
#     start up to 5 weeks before TODAY);
#   - no QA trusted devices (qa-desk-01, qa-tablet-night): the demo's device list shows only the devices issued in
#     the demo (seed-demo.mjs issues "Máy quầy lễ tân (demo)" itself).
demo_fixture() {
  node -e '
    const fs = require("fs"); const f = process.argv[1];
    const d = JSON.parse(fs.readFileSync(f, "utf8"));
    const from = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
    for (const p of d.parameters) p.effectiveFrom = from;
    d.devices = [];
    fs.writeFileSync(f, JSON.stringify(d, null, 2));
  ' "$1"
}

# Fresh database + blobs, seeding in two phases, final demo stack. $1 = 1 to run the smoke test (then reseed).
seed_all() {
  say "xóa dữ liệu demo cũ (nếu có) và dựng lại từ đầu"
  dc down --volumes --remove-orphans >/dev/null 2>&1 || true

  # Phase 1 – the fake clock (ottimo-api:demo-seed, CLOCK_MODE=mutable): stays that started in the past
  # (long stay since a month, guests in house since yesterday/2 days) are created and checked in "on their day".
  say "pha 1/2: dựng stack với đồng hồ giả để tạo các lượt ở đã bắt đầu trước hôm nay"
  DEMO_API_IMAGE=ottimo-api:demo-seed CLOCK_MODE=mutable INCLUDE_TEST_SUPPORT=1 \
    dc up --detach --wait --wait-timeout 240 postgres db-roles migrate api worker >/dev/null \
    || { dc logs --no-color --tail 60 api worker migrate db-roles; die "stack pha 1 không lên"; }
  say "nạp dữ liệu nền DS-E (10 căn OTTIMO, kênh, tham số, bảng giá)"
  mkdir -p "$SRC/product/tests/fixtures/seed/.out"
  # throw-away copy of the fixture: parameters dated 120 days back, no QA trusted devices (demo_fixture above)
  demo_fixture "$SRC/product/tests/fixtures/seed/ds-e.json"
  DEMO_API_IMAGE=ottimo-api:demo-seed CLOCK_MODE=mutable INCLUDE_TEST_SUPPORT=1 \
    dc --profile seed run --rm seed >"$WORK/seed-dse.log" 2>&1 || { tail -20 "$WORK/seed-dse.log"; die "nạp DS-E lỗi"; }
  QA_SEED_PASSWORD="$(env_value QA_SEED_PASSWORD)" TEST_SUPPORT_TOKEN="$(env_value TEST_SUPPORT_TOKEN)" \
    DEMO_STATE="$STATE_FILE" DEMO_OUT="$OUT" node "$DEMO_DIR/seed-demo.mjs" past || die "tạo dữ liệu pha 1 lỗi"

  # Phase 2 – the real demo stack: ottimo-api:demo (no /__test__ endpoints), real clock.
  say "pha 2/2: chuyển sang stack demo thật (đồng hồ thật, không có endpoint kiểm thử)"
  dc up --detach --wait --wait-timeout 240 api worker web >/dev/null \
    || { dc logs --no-color --tail 60 api worker web; die "stack demo không lên"; }
  DEMO_STATE="$STATE_FILE" DEMO_OUT="$OUT" DEMO_ENV_FILE="$PRODUCT_DIR/.env" \
    node "$DEMO_DIR/seed-demo.mjs" now || die "tạo dữ liệu pha 2 lỗi"
  sample_images
}

# Two clearly FAKE images for the scenarios that ask for "ảnh giấy tờ" / "ảnh biên nhận" (rendered by sharp inside
# the demo api image – nothing to install, nothing downloaded). Shapes only (the image has no fonts): an ID-card
# layout and a receipt layout, each crossed by a red "sample" band.
sample_images() {
  [ -f "$OUT/anh-giay-to-mau.png" ] && [ -f "$OUT/anh-bien-nhan-mau.png" ] && return 0
  docker run --rm --network none --user "$(id -u):$(id -g)" -v "$OUT:/out" --entrypoint node ottimo-api:demo -e '
    const sharp = require("sharp");
    const lines = (x, y, n, w) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * 62}" width="${w - (i % 2) * 120}" height="22" rx="11" fill="#cdbfa8"/>`).join("");
    const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="630"><rect width="1000" height="630" rx="36" fill="#d9c7a7"/>
      <rect x="40" y="40" width="920" height="550" rx="24" fill="#fffdf8"/><rect x="80" y="110" width="220" height="280" rx="16" fill="#e8dcc8"/>
      <circle cx="190" cy="210" r="56" fill="#cdbfa8"/><rect x="120" y="290" width="140" height="80" rx="40" fill="#cdbfa8"/>
      <rect x="340" y="90" width="460" height="34" rx="17" fill="#8a7454"/>${lines(340, 170, 5, 560)}
      <rect x="-80" y="420" width="1200" height="70" fill="#b0413e" opacity="0.85" transform="rotate(-12 500 455)"/></svg>`;
    const receipt = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="1000"><rect width="700" height="1000" fill="#b9cbb4"/>
      <rect x="50" y="50" width="600" height="900" rx="20" fill="#ffffff"/><circle cx="350" cy="190" r="70" fill="#5f8f5a"/>
      <rect x="150" y="300" width="400" height="40" rx="20" fill="#5f8f5a"/>${lines(110, 400, 7, 480)}
      <rect x="-100" y="600" width="900" height="70" fill="#b0413e" opacity="0.85" transform="rotate(-20 350 635)"/></svg>`;
    (async () => {
      await sharp(Buffer.from(card)).png().toFile("/out/anh-giay-to-mau.png");
      await sharp(Buffer.from(receipt)).png().toFile("/out/anh-bien-nhan-mau.png");
    })().catch((e) => { console.error(e.message); process.exit(1); });
  ' && say "ảnh mẫu (giả) cho giấy tờ / biên nhận: $OUT/anh-giay-to-mau.png, anh-bien-nhan-mau.png" \
    || say "(không tạo được ảnh mẫu – dùng ảnh chụp màn hình bất kỳ)"
}
