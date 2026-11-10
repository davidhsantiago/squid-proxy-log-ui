# Linux Setup

> [!IMPORTANT]
> This installation method requires Squid Proxy to already be installed and configured on the system.
>
> The installer copies the application files to `/opt/squid-proxy-log-ui` and registers a `systemd` service for it.

## Prerequisites

Before running the installer, make sure the following are available on the machine:

- `node` and `npm` installed
- `systemctl` available (Linux with `systemd`)
- root privileges via `sudo`
- a working Squid Proxy installation and log directory

## 1) Configure the environment

Create a `.env` file in the project root and set the values described in [docs/ENV.md](docs/ENV.md).

Example:

```env
PORT=3000
NODE_ENV=production
SQUID_HOST=localhost
SQUID_PORT=3128
LOG_PATH=/var/log/squid
```

You can adjust the values to match your environment. The app uses these variables at runtime to determine which port to expose, where Squid is reachable, and where the log directory lives.

## 2) Run the installer

From the project root, execute:

```bash
sudo bash install/linux/installer.sh
```

The script will:

- check that required tools are installed
- build a production copy of the app into a temporary `dist` folder
- install dependencies with `npm ci --omit=dev`
- copy the app to `/opt/squid-proxy-log-ui`
- install the systemd service file
- enable and start the service

## 3) Verify the installation

Check the service status:

```bash
sudo systemctl status squid-proxy-log-ui.service
```

If you need to inspect logs:

```bash
sudo journalctl -u squid-proxy-log-ui.service -f
```

By default, the web UI is exposed on the configured `PORT` value, which defaults to `3000` unless you set another value in `.env`.

Open the app in a browser at:

```text
http://localhost:3000
```

If you changed the port in `.env`, use that port instead.

## 4) Troubleshooting

- If the installer says a command is missing, install `node`, `npm`, and `systemctl` support for your Linux distribution.
- If the service fails to start, check the `.env` values and confirm that `SQUID_HOST`, `SQUID_PORT`, and `LOG_PATH` point to valid Squid settings.
- If you are using a non-standard Squid log path, make sure the application user can read the files in that directory.
