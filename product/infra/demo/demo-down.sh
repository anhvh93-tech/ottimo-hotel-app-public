#!/usr/bin/env bash
# Stop the investor demo stack (the dev stack ottimo-dev is not touched).
#   bash product/infra/demo/demo-down.sh           stop and delete the demo containers + demo data (fake data only)
#   bash product/infra/demo/demo-down.sh --keep    only stop the containers (data kept; start them again with
#                                                  `docker start` from OrbStack or simply run demo-reset.sh)
#   bash product/infra/demo/demo-down.sh --purge   also delete the demo images, the source copy and .out (accounts)
set -Eeuo pipefail
# shellcheck source=lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
mode=down
case "${1:-}" in
  "") ;;
  --keep) mode=stop ;;
  --purge) mode=purge ;;
  *) die "tham số không hiểu: $1" ;;
esac
command -v docker >/dev/null || die "cần Docker"
if [ ! -f "$ENV_FILE" ]; then say "không có demo nào"; exit 0; fi
if [ "$mode" = stop ]; then
  dc stop >/dev/null && say "đã dừng demo (dữ liệu giữ lại)"
  exit 0
fi
dc down --volumes --remove-orphans >/dev/null 2>&1 || true
say "đã tắt và xóa dữ liệu demo"
if [ "$mode" = purge ]; then
  docker image rm ottimo-api:demo ottimo-api:demo-seed ottimo-web:demo >/dev/null 2>&1 || true
  rm -rf "$WORK" "$OUT"
  say "đã xóa image demo, bản sao mã nguồn và tệp tài khoản"
fi
