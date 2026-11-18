#!/usr/bin/env bash
# Install Playwright OS dependencies on a GitHub-hosted Ubuntu runner, bounded in time.
# Order (R5, 18/11: two stalls of 17 and 26 min cancelled the E2E job at its 30-min cap):
#   1. .deb cache (PW_APT_CACHE_DIR, restored by actions/cache, keyed on runner image + Playwright version):
#      dpkg -i the cached packages, then `playwright install-deps --dry-run` (offline `apt-get install -s`) must
#      report nothing missing – otherwise fall through to the network.
#   2. Network on the runner's default (Azure) mirror, capped at PW_DEPS_TIMEOUT_1 seconds (normal run ≈ 45 s).
#   3. On timeout/failure: stop the stuck apt, switch every mirror source (incl. the runner's mirror list) to
#      archive.ubuntu.com and retry, capped at PW_DEPS_TIMEOUT_2 seconds. Still failing = the step fails (no skip).
# After a network install the downloaded .debs are copied to PW_APT_CACHE_DIR and `saved=true` is written to
# $GITHUB_OUTPUT so the workflow saves the cache for the next run.
# Usage: playwright-deps.sh <browser>...
set -euo pipefail

T1="${PW_DEPS_TIMEOUT_1:-240}"
T2="${PW_DEPS_TIMEOUT_2:-360}"
CACHE_DIR="${PW_APT_CACHE_DIR:-}"

pw() {
  pnpm --filter @ottimo/tests exec playwright "$@"
}

deps_present() {
  pw install-deps --dry-run "$@" >/dev/null 2>&1
}

output() {
  [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1" >>"$GITHUB_OUTPUT"
  return 0
}

# 1. Cached packages
if [ -n "$CACHE_DIR" ] && compgen -G "$CACHE_DIR/*.deb" >/dev/null; then
  echo "Installing $(find "$CACHE_DIR" -name '*.deb' | wc -l) cached .deb packages from $CACHE_DIR"
  sudo dpkg -i --skip-same-version --refuse-downgrade "$CACHE_DIR"/*.deb >/dev/null || true
  if deps_present "$@"; then
    echo "All Playwright OS dependencies installed from the cache (no network)."
    exit 0
  fi
  echo "::warning::cached .deb packages incomplete – installing from the network"
  sudo dpkg --configure -a || true
fi

# Keep the downloaded packages so they can be cached (apt-get keeps them by default; make it explicit).
echo 'APT::Keep-Downloaded-Packages "true"; Binary::apt-get::APT::Keep-Downloaded-Packages "true";' |
  sudo tee /etc/apt/apt.conf.d/99ottimo-keep-debs >/dev/null
sudo apt-get clean

save_cache() {
  [ -n "$CACHE_DIR" ] || return 0
  mkdir -p "$CACHE_DIR"
  if compgen -G "/var/cache/apt/archives/*.deb" >/dev/null; then
    cp /var/cache/apt/archives/*.deb "$CACHE_DIR"/
    echo "Saved $(find "$CACHE_DIR" -name '*.deb' | wc -l) .deb packages to $CACHE_DIR"
    output saved=true
  fi
}

# 2. Default mirror
if timeout "$T1" bash -c "$(declare -f pw); pw install-deps $*"; then
  save_cache
  exit 0
fi

# 3. archive.ubuntu.com
echo "::warning::playwright install-deps timed out (${T1}s) or failed – retrying on archive.ubuntu.com"
sudo pkill -x apt-get || true
sudo pkill -x dpkg || true
# Wait for apt/dpkg locks instead of failing on them in the retry.
echo 'DPkg::Lock::Timeout "120";' | sudo tee /etc/apt/apt.conf.d/99ottimo-lock-timeout >/dev/null
sudo dpkg --configure -a || true
for f in /etc/apt/apt-mirrors.txt /etc/apt/sources.list /etc/apt/sources.list.d/*.sources; do
  [ -f "$f" ] && sudo sed -i 's#azure\.archive\.ubuntu\.com#archive.ubuntu.com#g' "$f"
done
if timeout "$T2" bash -c "$(declare -f pw); pw install-deps $*"; then
  save_cache
  exit 0
fi
echo "::error::playwright install-deps failed on both mirrors (${T1}s + ${T2}s)"
exit 1
