#!/usr/bin/env bash
# Bootstrap a fresh Cubepath gp.nano host for TrueRisk.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/javierdejesusda/TrueRisk/main/scripts/migrate-to-nano/bootstrap-host.sh | sudo bash
#
# Or copy the file and run:
#   sudo bash bootstrap-host.sh
#
# What it does (idempotent — safe to re-run):
#   1. apt update + install Docker Engine + compose plugin
#   2. Create a 2 GB swap file if /swapfile does not already exist
#   3. Install Dokploy via the official installer
#
# Exits non-zero on any failure. No secrets are written; you supply env vars
# through Dokploy after this script finishes.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "This script must run as root (use sudo)." >&2
  exit 1
fi

log() { printf '\n[bootstrap] %s\n' "$*"; }

log "1/3 Installing Docker Engine + compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker already installed: $(docker --version)"
fi

log "2/3 Creating 2 GB swap if missing"
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q "^/swapfile " /etc/fstab; then
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
  fi
  log "Swap created and enabled."
else
  log "/swapfile already exists; skipping."
fi

log "3/3 Installing Dokploy"
if ! command -v dokploy >/dev/null 2>&1 && [[ ! -d /etc/dokploy ]]; then
  curl -sSL https://dokploy.com/install.sh | sh
else
  log "Dokploy install detected; skipping."
fi

log "Done. Swap: $(free -h | awk '/^Swap/ {print $2}'). Open the Dokploy panel at http://<this-host>:3000 to finish setup."
