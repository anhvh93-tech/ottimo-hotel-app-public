#!/usr/bin/env bash
# DEMO 1 for the investor on this Mac (localhost) – separate stack `ottimo-demo`, the dev stack keeps running.
#   bash product/infra/demo/demo-up.sh            build from git HEAD, seed the OTTIMO scenario around TODAY, start
#   bash product/infra/demo/demo-up.sh --smoke    same, plus an automatic smoke test (every role logs in, rack,
#                                                 check-in, check-out + VietQR, guest link) – then reseeds a clean demo
#   bash product/infra/demo/demo-up.sh --ref <git ref>   build another commit (default HEAD)
#   bash product/infra/demo/demo-up.sh --no-build        reuse the images already built (only reseed)
# Addresses: desk http://localhost:8181 (EVERY staff role logs in here, housekeeping/maintenance/sales/CTV included)
#            · guest web http://localhost:8183 · :8182 = staff PWA shell only (no business screens in Demo 1)
# Accounts (random passwords), guest link, device fallback: product/infra/demo/.out/demo-accounts.md (0600, never
# committed, never printed). Guide: rounds/round-02/outputs/OPS/demo-1.md
# A build needs the front desk number VITE_DESK_PHONE in product/.env (UXR P-15, format in .env.example) – the script
# stops before building without it. --no-build does not need it (the web image keeps the number it was built with).
set -Eeuo pipefail
# shellcheck source=lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"

ref=HEAD smoke=0 build=1
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="$2"; shift 2 ;;
    --smoke) smoke=1; shift ;;
    --no-build) build=0; shift ;;
    *) die "tham số không hiểu: $1" ;;
  esac
done

need_tools
ports_free
umask 077
mkdir -p "$WORK" "$OUT"
chmod 700 "$WORK" "$OUT"

# Front desk number for the "Gọi lễ tân" button of the staff PWA and the guest web (UXR P-15), baked into the web
# image at build time. Public number, but it lives only in product/.env of this Mac (never committed); an exported
# VITE_DESK_PHONE wins. Never printed. Checked BEFORE the slow build with the same script the Dockerfile runs.
desk_phone() {
  local v="${VITE_DESK_PHONE:-}"
  [ -n "$v" ] || v=$(env_value VITE_DESK_PHONE "$PRODUCT_DIR/.env")
  case "$v" in \"*\") v="${v#\"}"; v="${v%\"}" ;; \'*\') v="${v#\'}"; v="${v%\'}" ;; esac
  printf '%s' "$v"
}

if [ "$build" -eq 1 ]; then
  VITE_DESK_PHONE=$(desk_phone)
  export VITE_DESK_PHONE
  WEB_BUILD_PROFILE=demo sh "$PRODUCT_DIR/infra/docker/check-web-build-config.sh" >/dev/null \
    || die "cần số lễ tân cho nút \"Gọi lễ tân\": thêm 1 dòng VITE_DESK_PHONE=<số> vào product/.env (chỉ chữ số và dấu cách, ví dụ dạng 0xx xxxx xxxx – không dấu chấm, không gạch), KHÔNG commit tệp .env, rồi chạy lại"
  sha=$(git -C "$REPO_DIR" rev-parse --short "$ref") || die "không thấy git ref $ref"
  say "lấy mã nguồn $ref ($sha) bằng git archive (chỉ thư mục product/)"
  rm -rf "$SRC" && mkdir -p "$SRC"
  # The source copy keeps git's modes (0644/0755): under this script's umask 077 it came out 0600 and the PWA's
  # manifest.webmanifest / sw.js reached the web image unreadable for Caddy, which answered index.html for them
  # (UXR P-24 – Dockerfile.web now normalises the modes too). $WORK stays 0700, so nobody else can read the copy;
  # demo.env, state and accounts are still written under umask 077.
  ( umask 022; git -C "$REPO_DIR" archive "$ref" product | tar -x -C "$SRC" )
  echo "$sha" > "$WORK/built-from"
  build_image() { # tag  dockerfile  [build-arg …] – a bare NAME takes its value from the environment (not argv)
    local tag="$1" file="$2" try a
    local -a args=()
    shift 2
    for a in "$@"; do args+=(--build-arg "$a"); done
    for try in 1 2 3; do
      if docker build -q -f "$SRC/product/infra/docker/$file" ${args[@]+"${args[@]}"} -t "$tag" "$SRC/product" >"$WORK/build-$tag.log" 2>&1; then
        return 0
      fi
      say "build $tag lỗi (lần $try, thường do mạng tải gói) – thử lại"
    done
    tail -30 "$WORK/build-$tag.log"; die "không build được $tag"
  }
  say "build image api (demo, không có endpoint kiểm thử) – vài phút ở lần đầu"
  build_image ottimo-api:demo Dockerfile.api INCLUDE_TEST_SUPPORT=0
  say "build image api cho pha dựng dữ liệu (có đồng hồ giả)"
  build_image ottimo-api:demo-seed Dockerfile.api INCLUDE_TEST_SUPPORT=1
  say "build image web (desk, staff, guest) – kèm số lễ tân từ product/.env"
  build_image ottimo-web:demo Dockerfile.web WEB_BUILD_PROFILE=demo VITE_DESK_PHONE
  # Fresh secrets for every build (random DB passwords, test token, seed password) – same generator as CI. The key
  # material (KEK, HMAC keys, session secret) is generated once and kept across rebuilds (ensure_demo_keys, lib.sh).
  prev_env=""
  if [ -f "$ENV_FILE" ]; then prev_env="$WORK/demo.env.prev" && cp -p "$ENV_FILE" "$prev_env"; fi
  CI_STAFF_RPM=600 bash "$SRC/product/infra/ci/make-ci-env.sh" "$SRC/product/.env.example" "$ENV_FILE" >/dev/null
  {
    echo "API_ADMIN_BASE_URL=$DEMO_DESK_URL"
    echo "API_STAFF_BASE_URL=$DEMO_STAFF_URL"
    echo "API_GUEST_BASE_URL=$DEMO_GUEST_URL"
  } >> "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  ensure_demo_keys "$prev_env"
  [ -z "$prev_env" ] || rm -f "$prev_env"
else
  [ -f "$ENV_FILE" ] && [ -d "$SRC/product" ] || die "chưa build lần nào – bỏ --no-build"
  docker image inspect ottimo-api:demo ottimo-api:demo-seed ottimo-web:demo >/dev/null 2>&1 || die "thiếu image demo – bỏ --no-build"
  ensure_demo_keys
fi

seed_all
if [ "$smoke" -eq 1 ]; then
  say "smoke test: mọi vai đăng nhập, rack, nhận phòng, trả phòng + VietQR, link khách"
  DEMO_STATE="$STATE_FILE" node "$DEMO_DIR/smoke-demo.mjs" || die "smoke test lỗi – xem thông báo ở trên"
  say "smoke đạt – dựng lại dữ liệu sạch cho buổi demo"
  seed_all
fi

say "XONG – demo từ commit $(cat "$WORK/built-from" 2>/dev/null || echo '?'):"
say "  Mọi vai nhân viên (desk): $DEMO_DESK_URL  (cả buồng phòng, kỹ thuật, sale, CTV)"
say "  Web khách (guest):        $DEMO_GUEST_URL  (link trong tệp tài khoản)"
say "  Tài khoản + mật khẩu:     $OUT/demo-accounts.md  (chỉ mở bằng: open -e \"$OUT/demo-accounts.md\")"
say "  Tắt: bash product/infra/demo/demo-down.sh · Làm mới dữ liệu: bash product/infra/demo/demo-reset.sh"
