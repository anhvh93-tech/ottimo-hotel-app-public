#!/usr/bin/env bash
# Install Playwright OS dependencies on a GitHub-hosted Ubuntu runner.
# The Azure apt mirror sometimes stalls; on timeout, stop the stuck apt, switch
# every mirror source (incl. the runner's mirror list) to archive.ubuntu.com and retry.
# Usage: playwright-deps.sh <browser>...
set -euo pipefail

install_deps() {
  pnpm --filter @ottimo/tests exec playwright install-deps "$@"
}

if timeout 480 bash -c "$(declare -f install_deps); install_deps $*"; then
  exit 0
fi

echo "::warning::playwright install-deps timed out or failed – retrying on archive.ubuntu.com"
sudo pkill -x apt-get || true
sudo pkill -x dpkg || true
# Wait for apt/dpkg locks instead of failing on them in the retry.
echo 'DPkg::Lock::Timeout "300";' | sudo tee /etc/apt/apt.conf.d/99ottimo-lock-timeout >/dev/null
sudo dpkg --configure -a || true
for f in /etc/apt/apt-mirrors.txt /etc/apt/sources.list /etc/apt/sources.list.d/*.sources; do
  [ -f "$f" ] && sudo sed -i 's#azure\.archive\.ubuntu\.com#archive.ubuntu.com#g' "$f"
done
install_deps "$@"
