#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 server, run with root rights from the Mac.
# USER is root, or ubuntu on images (like OVH's) that log in as ubuntu with sudo:
#
#   scp -i ~/.ssh/gloki_node1 compose.yml Caddyfile setup.sh USER@SERVER_IP:
#   ssh -i ~/.ssh/gloki_node1 USER@SERVER_IP 'sudo bash setup.sh node1.globaldemocracyinitiative.org'
#
# Safe to run again: every step checks or overwrites rather than appends.
set -euo pipefail

NODE_HOST="${1:?usage: setup.sh <hostname>}"
SRC="$(cd "$(dirname "$0")" && pwd)"
DIR=/opt/ibc-node

# MongoDB 5+ needs AVX on x86; without it mongo crash-loops with no clear error.
if [ "$(uname -m)" = "x86_64" ] && ! grep -qw avx /proc/cpuinfo; then
  echo "This CPU has no AVX, so mongo:7 will not run. Stop here." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq docker.io docker-compose-v2 ufw unattended-upgrades
systemctl enable --now docker

# Security updates install themselves.
dpkg-reconfigure -f noninteractive unattended-upgrades

# Key-only SSH. The provider put our public key in place at order time; refuse to
# turn passwords off if no key is there, or we would lock ourselves out.
# grep -qs: a missing file (often root's on OVH) is not an error if another file matches.
grep -qs "gloki-node1" /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys || {
  echo "The gloki-node1 SSH key is not installed on this server. Stop here." >&2
  exit 1
}
cat > /etc/ssh/sshd_config.d/10-gloki.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
sshd -t
systemctl reload ssh

# Firewall: SSH and web only. Docker publishes only Caddy's ports (compose.yml).
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443
ufw --force enable

mkdir -p "$DIR"
install -m 644 "$SRC/compose.yml" "$SRC/Caddyfile" "$DIR"/
echo "NODE_HOST=$NODE_HOST" > "$DIR/.env"

cd "$DIR"
docker compose pull -q
docker compose up -d
docker compose ps
