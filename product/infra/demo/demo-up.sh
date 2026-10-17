#!/usr/bin/env bash
# DEMO 1 for the investor on this Mac (localhost) – separate stack `ottimo-demo`, the dev stack keeps running.
#   bash product/infra/demo/demo-up.sh            build from git HEAD, seed the OTTIMO scenario around TODAY, start
#   bash product/infra/demo/demo-up.sh --smoke    same, plus an automatic smoke test (every role logs in, rack,
#                                                 check-in, check-out + VietQR, guest link) – then reseeds a clean demo
#   bash product/infra/demo/demo-up.sh --ref <git ref>   build another commit (default HEAD)
#   bash product/infra/demo/demo-up.sh --no-build        reuse the images already built (only reseed)
# Addresses: desk http://localhost:8181 · staff app http://localhost:8182 · guest web http://localhost:8183
# Accounts (random passwords), guest link, device fallback: product/infra/demo/.out/demo-accounts.md (0600, never
# committed, never printed). Guide: rounds/round-02/outputs/OPS/demo-1.md
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

if [ "$build" -eq 1 ]; then
  sha=$(git -C "$REPO_DIR" rev-parse --short "$ref") || die "không thấy git ref $ref"
  say "lấy mã nguồn $ref ($sha) bằng git archive (chỉ thư mục product/)"
  rm -rf "$SRC" && mkdir -p "$SRC"
  git -C "$REPO_DIR" archive "$ref" product | tar -x -C "$SRC"
  echo "$sha" > "$WORK/built-from"
  build_image() { # tag  dockerfile  [build-arg]
    local tag="$1" file="$2" arg="${3:-}" try
    for try in 1 2 3; do
      # shellcheck disable=SC2086
      if docker build -q -f "$SRC/product/infra/docker/$file" ${arg:+--build-arg $arg} -t "$tag" "$SRC/product" >"$WORK/build-$tag.log" 2>&1; then
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
  say "build image web (desk, staff, guest)"
  build_image ottimo-web:demo Dockerfile.web
  # Fresh secrets for every build (random DB passwords, test token, seed password) – same generator as CI.
  CI_STAFF_RPM=600 bash "$SRC/product/infra/ci/make-ci-env.sh" "$SRC/product/.env.example" "$ENV_FILE" >/dev/null
  {
    echo "API_ADMIN_BASE_URL=$DEMO_DESK_URL"
    echo "API_STAFF_BASE_URL=$DEMO_STAFF_URL"
    echo "API_GUEST_BASE_URL=$DEMO_GUEST_URL"
  } >> "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  [ -f "$ENV_FILE" ] && [ -d "$SRC/product" ] || die "chưa build lần nào – bỏ --no-build"
  docker image inspect ottimo-api:demo ottimo-api:demo-seed ottimo-web:demo >/dev/null 2>&1 || die "thiếu image demo – bỏ --no-build"
fi

seed_all
if [ "$smoke" -eq 1 ]; then
  say "smoke test: mọi vai đăng nhập, rack, nhận phòng, trả phòng + VietQR, link khách"
  DEMO_STATE="$STATE_FILE" node "$DEMO_DIR/smoke-demo.mjs" || die "smoke test lỗi – xem thông báo ở trên"
  say "smoke đạt – dựng lại dữ liệu sạch cho buổi demo"
  seed_all
fi

say "XONG – demo từ commit $(cat "$WORK/built-from" 2>/dev/null || echo '?'):"
say "  Lễ tân / quản lý (desk):  $DEMO_DESK_URL"
say "  App nhân viên (staff):    $DEMO_STAFF_URL"
say "  Web khách (guest):        $DEMO_GUEST_URL  (link trong tệp tài khoản)"
say "  Tài khoản + mật khẩu:     $OUT/demo-accounts.md  (chỉ mở bằng: open -e \"$OUT/demo-accounts.md\")"
say "  Tắt: bash product/infra/demo/demo-down.sh · Làm mới dữ liệu: bash product/infra/demo/demo-reset.sh"
