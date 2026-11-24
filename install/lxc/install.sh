#!/usr/bin/env bash
# Copyright (c) 2021-2026 community-scripts ORG
# Author: Michel Roegl-Brunner (michelroegl-brunner) | MickLesk (CanbiZ)
# License: MIT
# Source: https://github.com/davidhsantiago/squid-proxy-log-ui

set -Eeuo pipefail

usage() {
    cat <<'EOF'
Usage: bash install/lxc/install.sh [--help]

Run as root on a Proxmox VE node from a checkout of this repository.
Environment overrides (defaults shown):

  CT_ID             Next available cluster ID
  CT_HOSTNAME       squid-log-ui
  CT_STORAGE        local-lvm (container root disk)
  TEMPLATE_STORAGE  local (container template cache)
  CT_TEMPLATE       Latest Debian 13 standard template for the host architecture
                    Set to a compatible Debian 13 Proxmox template volume ID to reuse it.
  CT_BRIDGE         vmbr0
  CT_IP             dhcp (or an IPv4 address with CIDR prefix)
  CT_GATEWAY        Empty (set for static IPv4 networks that require a gateway)
  CT_CORES          1
  CT_MEMORY         1024 (MiB)
  CT_DISK           8 (GiB)
  UI_PORT           3000
EOF
}

die() {
    printf '%s\n' "$*" >&2
    exit 1
}

case "${1:-}" in
    -h|--help) usage; exit 0 ;;
    '') ;;
    *) usage >&2; exit 2 ;;
esac
[[ $# -eq 0 ]] || die "Use --help to see supported options."
[[ $EUID -eq 0 ]] || die "Run this installer as root on the Proxmox VE node."

for command in pct pvesh pveam pvesm ip dpkg; do
    command -v "$command" >/dev/null || die "Required Proxmox host command missing: $command"
done

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
ct_hostname=${CT_HOSTNAME:-squid-log-ui}
ct_storage=${CT_STORAGE:-local-lvm}
template_storage=${TEMPLATE_STORAGE:-local}
template=${CT_TEMPLATE:-}
bridge=${CT_BRIDGE:-vmbr0}
ct_ip=${CT_IP:-dhcp}
gateway=${CT_GATEWAY:-}
cores=${CT_CORES:-1}
memory=${CT_MEMORY:-1024}
disk=${CT_DISK:-8}
port=${UI_PORT:-3000}
ct_id=${CT_ID:-$(pvesh get /cluster/nextid)}

[[ $ct_id =~ ^[1-9][0-9]{2,8}$ ]] || die "CT_ID must be between 100 and 999999999."
[[ $port =~ ^[1-9][0-9]{0,4}$ ]] && (( port >= 1024 && port <= 65535 )) ||
    die "UI_PORT must be between 1024 and 65535."
[[ $ct_ip != dhcp || -z $gateway ]] || die "CT_GATEWAY requires a static CT_IP."
ip link show dev "$bridge" >/dev/null || die "Network bridge $bridge does not exist."
pct config "$ct_id" >/dev/null 2>&1 && die "Container $ct_id already exists."

work_dir=$(mktemp -d)
created=false
cleanup() {
    local result=$?
    rm -rf -- "$work_dir"
    if (( result != 0 )) && [[ $created == true ]]; then
        printf 'Installation failed. Container %s was kept for inspection.\n' "$ct_id" >&2
        printf 'Inspect with: pct exec %s -- journalctl -u squid -u squid-proxy-log-ui --no-pager\n' "$ct_id" >&2
    fi
}
trap cleanup EXIT

tar -C "$repo_root" -czf "$work_dir/app.tar.gz" \
    src public package.json package-lock.json startup.sh \
    install/linux/installer.sh install/linux/squidLogUi.service

if [[ -z $template ]]; then
    arch=$(dpkg --print-architecture)
    pveam update
    available=$(pveam available --section system)
    template_name=$(awk -v arch="$arch" '$2 ~ ("^debian-13-standard_.*_" arch "\\.tar\\.(zst|gz)$") {print $2}' \
        <<< "$available" | sort -V | tail -n 1)
    [[ -n $template_name ]] || die "No Debian 13 standard template found for $arch."
    template="$template_storage:vztmpl/$template_name"
    template_path=$(pvesm path "$template")
    if [[ ! -f $template_path ]]; then
        pveam download "$template_storage" "$template_name"
    fi
fi

network="name=eth0,bridge=$bridge,ip=$ct_ip"
if [[ -n $gateway ]]; then
    network+=",gw=$gateway"
fi

printf 'Creating container %s (%s)\n' "$ct_id" "$ct_hostname"
pct create "$ct_id" "$template" \
    --hostname "$ct_hostname" --unprivileged 1 \
    --cores "$cores" --memory "$memory" --swap 512 \
    --rootfs "$ct_storage:$disk" --net0 "$network"
created=true
pct start "$ct_id"
pct push "$ct_id" "$work_dir/app.tar.gz" /tmp/squid-log-ui.tar.gz

pct exec "$ct_id" -- bash -se -- "$port" <<'GUEST'
set -o pipefail
export DEBIAN_FRONTEND=noninteractive
port=$1

apt-get -o Acquire::Retries=5 -o APT::Update::Error-Mode=any update
apt-get -o Acquire::Retries=5 install -y --no-install-recommends ca-certificates curl nodejs npm squid

# Retain the distribution access rules and restrict the proxy listener to loopback.
sed -i -E 's/^[[:space:]]*http_port[[:space:]]+3128[[:space:]]*$/http_port 127.0.0.1:3128/' /etc/squid/squid.conf
grep -qx 'http_port 127.0.0.1:3128' /etc/squid/squid.conf
squid -k parse
systemctl enable squid.service
systemctl restart squid.service

source_dir=$(mktemp -d)
trap 'rm -rf -- "$source_dir" /tmp/squid-log-ui.tar.gz' EXIT
tar -xzf /tmp/squid-log-ui.tar.gz -C "$source_dir"

useradd --system --gid proxy --no-create-home --shell /usr/sbin/nologin squid-log-ui
sed -i 's/^User=root$/User=squid-log-ui/; s/^Group=root$/Group=proxy/' \
    "$source_dir/install/linux/squidLogUi.service"
cat > "$source_dir/install/linux/.env" <<ENV
NODE_ENV=production
HOST=0.0.0.0
PORT=$port
SQUID_HOST=127.0.0.1
SQUID_PORT=3128
SQUID_LOG_DIRS=/var/log/squid
SQUID_LOG_FILE=/var/log/squid/access.log
ENV

sh "$source_dir/install/linux/installer.sh"
systemctl is-active --quiet squid.service
systemctl is-active --quiet squid-proxy-log-ui.service
url="http://127.0.0.1:$port"
curl --fail --silent --show-error --max-time 5 --retry 10 --retry-connrefused --retry-delay 1 "$url/" >/dev/null
curl --fail --silent --show-error --max-time 5 "$url/api/logs" >/dev/null
GUEST

pct set "$ct_id" --onboot 1
address=$(pct exec "$ct_id" -- ip -4 -o addr show dev eth0 scope global |
    awk 'NR == 1 {split($4, parts, "/"); print parts[1]}')
printf 'Squid Proxy Log UI is running in container %s.\n' "$ct_id"
if [[ -n $address ]]; then
    printf 'Open http://%s:%s\n' "$address" "$port"
else
    printf 'Open port %s on the container IPv4 address shown in Proxmox.\n' "$port"
fi
