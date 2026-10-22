#!/usr/bin/env bash
# Prepare a fresh Ubuntu LTS VPS (22.04 / 24.04) for OTTIMO staging or production – run as root, idempotent.
# Copy the bundle first (from product/ on the OPS laptop – infra/server/README.md step 2):
#   tar --exclude .out --exclude .work --exclude '.env*' -czf ottimo-infra.tgz infra tests/fixtures/seed/ds-e.json
#   scp ottimo-infra.tgz root@<IP>:/root/ && ssh root@<IP> 'mkdir -p /root/ottimo-bundle && tar -xzf /root/ottimo-infra.tgz -C /root/ottimo-bundle'
#   ssh root@<IP> 'bash /root/ottimo-bundle/infra/server/bootstrap-vps.sh --deploy-key /root/ops_key.pub [options]'
# Options:
#   --deploy-key <file>   SSH public key(s) of the OPS person(s) for the deploy user `ottimo` (required the first time)
#   --ci-key <file>       public key of the CI deploy job – installed with a forced command (deploy-from-ci.sh only)
#   --admin-user <name>   existing sudo user with SSH keys: then root login is turned off completely
#                         (otherwise root keeps key-only login – PermitRootLogin prohibit-password)
#   --ssh-allow <cidr>    allow SSH only from this address range (default: anywhere, key-only)
#   --no-swap             do not create /swapfile (default: 2 GB when the VPS has no swap)
# What it does (hosting-plan 5): OS updates + automatic security updates (reboot 02:30 Vietnam time), Docker Engine
# from Docker's apt repository (key fingerprint checked), daemon.json (log rotation, live-restore, no userland proxy,
# no-new-privileges), deploy user `ottimo` (uid 2001, group docker – NOT uid 1000, which the api container uses),
# firewall (22, 80, 443 only), SSH key-only, directories under /opt/ottimo, the bundle in /opt/ottimo/infra, systemd
# timers for backup + ops checks. It does NOT create secrets (bin/init-secrets.sh), log in to the registry or deploy.
set -Eeuo pipefail

deploy_key="" ci_key="" admin_user="" ssh_allow="" swap=1
while [ $# -gt 0 ]; do
  case "$1" in
    --deploy-key) deploy_key="$2"; shift 2 ;;
    --ci-key) ci_key="$2"; shift 2 ;;
    --admin-user) admin_user="$2"; shift 2 ;;
    --ssh-allow) ssh_allow="$2"; shift 2 ;;
    --no-swap) swap=0; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

DEPLOY_USER=ottimo
DEPLOY_UID=2001
OTTIMO_HOME=/opt/ottimo
BACKUP_DIR=/var/backups/ottimo
bundle_infra=$(cd "$(dirname "$0")/.." && pwd)   # …/infra of the copied bundle
bundle_root=$(cd "$bundle_infra/.." && pwd)
DOCKER_GPG_FPR=9DC858229FC7DD38854AE2D88D81803C0EBFCD88

log() { echo "[bootstrap] $*"; }
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 2; }
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || { echo "Ubuntu LTS expected (found ${ID:-?})" >&2; exit 2; }
case "${VERSION_ID:-}" in 22.04|24.04) ;; *) log "WARNING: tested for Ubuntu 22.04/24.04, found $VERSION_ID" ;; esac
[ -f "$bundle_infra/docker-compose.prod.yml" ] || { echo "bundle incomplete: $bundle_infra/docker-compose.prod.yml" >&2; exit 2; }
if ! id "$DEPLOY_USER" >/dev/null 2>&1 && [ -z "$deploy_key" ]; then
  echo "--deploy-key <public key file> is required the first time (or you could lock yourself out)" >&2; exit 2
fi
for f in "$deploy_key" "$ci_key"; do
  [ -z "$f" ] || [ -r "$f" ] || { echo "cannot read $f" >&2; exit 2; }
  if [ -n "$f" ] && grep -q 'PRIVATE KEY' "$f"; then echo "$f is a PRIVATE key – give the .pub file" >&2; exit 2; fi
done

export DEBIAN_FRONTEND=noninteractive

# ---- 1. base system ----
log "apt update/upgrade + base packages"
apt-get update -q
apt-get -y -q -o Dpkg::Options::=--force-confold upgrade
apt-get -y -q install ca-certificates curl gnupg ufw unattended-upgrades age jq openssl rsync util-linux
timedatectl set-timezone Asia/Ho_Chi_Minh || true

# Automatic security updates; reboot (only when a patch needs it) at 02:30 Vietnam time – outside check-in/out hours.
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
cat > /etc/apt/apt.conf.d/52ottimo-unattended <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:30";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

if [ "$swap" -eq 1 ] && ! swapon --show | grep -q .; then
  log "creating 2 GB /swapfile (image pulls and the image pipeline on a 4 GB VPS)"
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/60-ottimo-swap.conf && sysctl -q -p /etc/sysctl.d/60-ottimo-swap.conf
fi

# ---- 2. Docker Engine (official repository, key fingerprint verified) ----
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  log "installing Docker Engine + compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc.new
  fpr=$(gpg --show-keys --with-colons /etc/apt/keyrings/docker.asc.new | awk -F: '$1 == "fpr" { print $10; exit }')
  [ "$fpr" = "$DOCKER_GPG_FPR" ] || { rm -f /etc/apt/keyrings/docker.asc.new; echo "Docker apt key fingerprint mismatch ($fpr)" >&2; exit 1; }
  mv /etc/apt/keyrings/docker.asc.new /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get -y -q install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
install -d -m 0755 /etc/docker
cat > /etc/docker/daemon.json.new <<'EOF'
{
  "log-driver": "local",
  "log-opts": { "max-size": "20m", "max-file": "5" },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
EOF
if ! cmp -s /etc/docker/daemon.json.new /etc/docker/daemon.json 2>/dev/null; then
  mv /etc/docker/daemon.json.new /etc/docker/daemon.json
  systemctl restart docker
else
  rm -f /etc/docker/daemon.json.new
fi
systemctl enable --now docker >/dev/null

# ---- 3. deploy user (not uid 1000: that uid reads the api secrets inside the containers) ----
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  getent passwd "$DEPLOY_UID" >/dev/null && { echo "uid $DEPLOY_UID already used" >&2; exit 1; }
  groupadd --gid "$DEPLOY_UID" "$DEPLOY_USER"
  useradd --uid "$DEPLOY_UID" --gid "$DEPLOY_USER" --create-home --shell /bin/bash "$DEPLOY_USER"
  passwd -l "$DEPLOY_USER" >/dev/null
fi
usermod -aG docker "$DEPLOY_USER"
if getent passwd 1000 >/dev/null; then
  log "note: host user $(getent passwd 1000 | cut -d: -f1) has uid 1000 (= api container user); /opt/ottimo/secrets is not traversable for it"
fi
ssh_dir="/home/$DEPLOY_USER/.ssh"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "$ssh_dir"
touch "$ssh_dir/authorized_keys"
ci_opts='command="/opt/ottimo/infra/server/bin/deploy-from-ci.sh",restrict'
key_blob() { awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^(ssh-|ecdsa-|sk-)/) { print $(i + 1); exit } }' <<<"$1"; }
# SEC E.8 D4: the CI key is separate from every person's key. A key may not be both a person key (unrestricted) and
# the CI key (forced command) – otherwise one of the two lines would give the CI key a shell or lock a person out.
if [ -n "$deploy_key" ]; then
  while IFS= read -r k; do
    [ -n "$k" ] || continue
    b=$(key_blob "$k")
    if [ -n "$b" ] && grep -F -- "$b" "$ssh_dir/authorized_keys" | grep -qF 'deploy-from-ci.sh'; then
      echo "a --deploy-key is already installed as the CI key – use separate keys (SEC E.8 D4)" >&2; exit 1
    fi
    grep -qxF -- "$k" "$ssh_dir/authorized_keys" || echo "$k" >> "$ssh_dir/authorized_keys"
  done < "$deploy_key"
fi
if [ -n "$ci_key" ]; then
  while IFS= read -r k; do
    [ -n "$k" ] || continue
    b=$(key_blob "$k")
    [ -n "$b" ] || { echo "cannot parse the CI public key" >&2; exit 1; }
    if grep -F -- "$b" "$ssh_dir/authorized_keys" | grep -vqF "$ci_opts"; then
      echo "the CI key is also a person's (unrestricted) key – generate a separate CI key (SEC E.8 D4)" >&2; exit 1
    fi
    grep -qF -- "$b" "$ssh_dir/authorized_keys" || echo "$ci_opts $k" >> "$ssh_dir/authorized_keys"
  done < "$ci_key"
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "$ssh_dir/authorized_keys"
chmod 0600 "$ssh_dir/authorized_keys"

# ---- 4. directories + bundle ----
log "directories and bundle → $OTTIMO_HOME"
install -d -o root -g root -m 0755 "$OTTIMO_HOME"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "$OTTIMO_HOME/state"
install -d -o root -g "$DEPLOY_USER" -m 0750 "$OTTIMO_HOME/backup"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0700 "$BACKUP_DIR"
# Seed fixtures (fake data, staging): written by the seed container (uid 1000) – device tokens go to .out (0600).
install -d -o 1000 -g 1000 -m 0700 "$OTTIMO_HOME/seed"
if [ -f "$bundle_root/tests/fixtures/seed/ds-e.json" ]; then
  install -o 1000 -g 1000 -m 0600 "$bundle_root/tests/fixtures/seed/ds-e.json" "$OTTIMO_HOME/seed/ds-e.json"
fi
# The bundle is owned by root: the deploy user (and CI) can run it but not change compose/Caddy/scripts.
# Local-only files (demo .out/.work hold demo passwords, .env) never go to a server even if the tarball has them.
rsync -a --delete --delete-excluded --chown=root:root --exclude '.DS_Store' --exclude '.out' --exclude '.work' \
  --exclude '.env' --exclude '.env.*' "$bundle_infra/" "$OTTIMO_HOME/infra/"
chmod -R go-w "$OTTIMO_HOME/infra"
chmod 0755 "$OTTIMO_HOME"/infra/server/bin/* "$OTTIMO_HOME/infra/postgres/init/02-roles.sh"
if [ ! -f "$OTTIMO_HOME/.env" ]; then
  install -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 0600 "$OTTIMO_HOME/infra/server/env.example" "$OTTIMO_HOME/.env"
  log "created $OTTIMO_HOME/.env from env.example – fill the <...> values"
fi

# ---- 5. firewall: SSH, HTTP, HTTPS only. Docker publishes only 80/443 (compose) – PostgreSQL/api have no port. ----
log "firewall"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
if [ -n "$ssh_allow" ]; then ufw allow from "$ssh_allow" to any port 22 proto tcp >/dev/null; else ufw allow 22/tcp >/dev/null; fi
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
# Some provider images ship ufw.service disabled: the rules would then vanish at the next reboot.
systemctl enable --now ufw >/dev/null 2>&1
systemctl is-enabled --quiet ufw || { echo "ufw.service is not enabled at boot" >&2; exit 1; }

# ---- 6. SSH: keys only (checked before reload, so a typo cannot cut the session) ----
root_login=prohibit-password
if [ -n "$admin_user" ]; then
  id -nG "$admin_user" 2>/dev/null | grep -qw sudo || { echo "--admin-user $admin_user is not in the sudo group" >&2; exit 1; }
  [ -s "$(getent passwd "$admin_user" | cut -d: -f6)/.ssh/authorized_keys" ] || { echo "$admin_user has no SSH key" >&2; exit 1; }
  root_login=no
fi
[ -s "$ssh_dir/authorized_keys" ] || { echo "deploy user has no SSH key – refusing to turn passwords off" >&2; exit 1; }
# Some provider images ship only RSA/DSA host keys: create the missing default ones (ed25519 – used for CI known_hosts).
ssh-keygen -A >/dev/null
# sshd keeps the FIRST value it reads and the drop-ins are read in name order: provider/cloud-init files such as
# 50-cloud-init.conf ("PasswordAuthentication yes") would win over a later file – so ours sorts first (00-).
rm -f /etc/ssh/sshd_config.d/60-ottimo.conf
cat > /etc/ssh/sshd_config.d/00-ottimo.conf <<EOF
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin $root_login
X11Forwarding no
MaxAuthTries 4
EOF
sshd -t
eff=$(sshd -T 2>/dev/null)
grep -qx 'passwordauthentication no' <<<"$eff" && grep -qx "permitrootlogin $root_login" <<<"$eff" \
  || { echo "another sshd_config file overrides the OTTIMO SSH settings – check /etc/ssh/sshd_config.d" >&2; exit 1; }
systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true

# ---- 7. systemd timers (enabled once something is deployed) ----
install -m 0644 "$OTTIMO_HOME"/infra/server/systemd/ottimo-*.service "$OTTIMO_HOME"/infra/server/systemd/ottimo-*.timer /etc/systemd/system/
systemctl daemon-reload
if [ -s "$OTTIMO_HOME/state/current_tag" ]; then
  systemctl enable --now ottimo-backup.timer ottimo-ops-check.timer >/dev/null
  log "timers enabled"
else
  log "timers installed, not enabled yet (nothing deployed): after the first deploy run"
  log "  sudo systemctl enable --now ottimo-backup.timer ottimo-ops-check.timer"
fi

log "done. Next (README): age public key → $OTTIMO_HOME/backup/recipients.txt; fill $OTTIMO_HOME/.env;"
log "      sudo $OTTIMO_HOME/infra/server/bin/init-secrets.sh; registry login as $DEPLOY_USER; deploy.sh <tag>"
