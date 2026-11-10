# File Structure

This document describes the repository layout for `squid-proxy-log-ui`.

## High-level tree

```text
.
├── docs/
│   ├── DEVELOPMENT.md
│   ├── DOCKER.md
│   ├── ENV.md
│   ├── FILE-STRUCTURE.md
│   └── LINUX.md
├── install/
│   ├── docker/
│   │   ├── assets/
│   │   │   ├── docker-compose.yml
│   │   │   ├── Dockerfile
│   │   │   └── squid.conf
│   │   ├── setup-linux.sh
│   │   ├── setup-mac.sh
│   │   └── setup-windows.cmd
│   └── linux/
│       ├── .env
│       ├── installer.sh
│       └── squidLogUi.service
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css
│   │   └── js/
│   │       ├── getSystemdStatus.js
│   │       ├── logViewer.js
│   │       ├── squidHttpTest.js
│   │       └── webSocket.js
│   ├── index.html
│   └── log-viewer.html
├── src/
│   ├── routes/
│   │   ├── health.js
│   │   ├── index.js
│   │   ├── logs.js
│   │   ├── squidhttptest.js
│   │   └── static.js
│   ├── services/
│   │   ├── getConfig.service.js
│   │   ├── readLogFiles.service.js
│   │   ├── systemd.service.js
│   │   ├── testSquidHttp.service.js
│   │   └── websocket.service.js
│   └── index.js
├── test/
│   └── systemd.service.test.js
├── .env
├── .gitignore
├── .nvmrc
├── EXTERNAL_SOURCES.md
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
└── startup.sh
```

## Root files

- `.env`: local runtime configuration for host, port, and Squid log locations.
- `.gitignore`: git ignore rules.
- `.nvmrc`: Node.js version hint for `nvm` users.
- `EXTERNAL_SOURCES.md`: attribution for external assets and references.
- `LICENSE`: project license.
- `package.json`: project metadata, scripts, and runtime dependencies.
- `package-lock.json`: dependency lockfile for reproducible installs.
- `README.md`: project overview and quick start links.
- `startup.sh`: minimal startup entry script used by installer output.

## docs/

- `DEVELOPMENT.md`: local development workflow.
- `DOCKER.md`: Docker-based setup instructions.
- `ENV.md`: environment variable reference.
- `FILE-STRUCTURE.md`: this file.
- `LINUX.md`: Linux installer and systemd setup.

## install/

Contains platform installation assets.

### install/docker/

- `setup-linux.sh`, `setup-mac.sh`, `setup-windows.cmd`: platform launchers for Docker setup.
- `assets/docker-compose.yml`: compose definition used by setup scripts.
- `assets/Dockerfile`: container image definition.
- `assets/squid.conf`: Squid config used by containerized setup.

### install/linux/

- `.env`: installer environment defaults.
- `installer.sh`: root installer that builds `dist`, installs app to `/opt`, and enables systemd service.
- `squidLogUi.service`: systemd unit for the app service.

## public/

Static frontend served directly by backend route handling.

- `index.html`: dashboard/home page.
- `log-viewer.html`: log viewer page with pagination and file selection.
- `assets/css/main.css`: shared styling for both pages.
- `assets/js/getSystemdStatus.js`: polls `/health` and updates status indicator.
- `assets/js/logViewer.js`: handles log file list, paginated log fetch, and live stream rendering.
- `assets/js/squidHttpTest.js`: triggers Squid HTTP test endpoint from UI.
- `assets/js/webSocket.js`: generic WebSocket connection logger and reconnect helper.

## src/

Node.js backend (CommonJS) with route handlers and service modules.

- `index.js`: HTTP server bootstrap and WebSocket attachment.

### src/routes/

- `index.js`: central request router and fallback responses.
- `health.js`: `/health` endpoint returning Squid/systemd status.
- `logs.js`: `/api/logs` and `/api/log-files` handlers.
- `squidhttptest.js`: `/api/squidhttptest` handler.
- `static.js`: static file resolution/serving from `public/`.

### src/services/

- `getConfig.service.js`: reads env config and exposes runtime settings.
- `readLogFiles.service.js`: discovers log files, resolves active log path, and paginates file reads.
- `systemd.service.js`: checks Squid availability via `systemctl` (or Docker-mode process/network checks).
- `testSquidHttp.service.js`: performs Squid HTTP connectivity test.
- `websocket.service.js`: WebSocket server setup and per-client live `tail -F` stream handling.

## test/

- `systemd.service.test.js`: basic Node test coverage for Docker-mode service status behavior.

## Generated/runtime directories

These may appear locally but are not part of the maintained source structure:

- `node_modules/`: installed dependencies.
- `dist/`: installer build output assembled by `install/linux/installer.sh`.