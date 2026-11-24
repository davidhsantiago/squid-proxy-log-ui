# Proxmox VE LXC installation

Run from a copy of this repository on a Proxmox VE node as root.

```bash
bash install/lxc/install.sh
```

The installer creates an unprivileged Debian 13 container, installs Squid and the log UI as systemd services, and prints the UI address. It defaults to DHCP on `vmbr0`, an 8 GiB root disk on `local-lvm`, and HTTP port `3000`. The `local` storage holds the Debian template. The container needs network access to the Debian and npm repositories during installation.

Squid listens on `127.0.0.1:3128` inside the container, and the UI reads that Squid instance's logs. Restrict access to the UI port to trusted clients. The UI serves logs over HTTP without authentication.

Override the defaults as needed. For example, this command uses a static address and a different root disk storage pool.

```bash
CT_STORAGE=zfs-pool CT_IP=192.168.1.50/24 CT_GATEWAY=192.168.1.1 \
  bash install/lxc/install.sh
```

Run `bash install/lxc/install.sh --help` for all overrides. To inspect the services from the Proxmox node, substitute the printed container ID for `100` below.

```bash
pct exec 100 -- journalctl -u squid -u squid-proxy-log-ui --no-pager
```
