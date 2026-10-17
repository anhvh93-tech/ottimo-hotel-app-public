#!/usr/bin/env bash
# Throw the demo data away and seed the scenario again around TODAY (no rebuild; new passwords and guest link).
#   bash product/infra/demo/demo-reset.sh
set -Eeuo pipefail
# shellcheck source=lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
need_tools
[ -f "$ENV_FILE" ] && [ -d "$SRC/product" ] || die "chưa có demo – chạy demo-up.sh"
umask 077
seed_all
say "XONG – dữ liệu demo mới. Tài khoản/mật khẩu mới: $OUT/demo-accounts.md"
