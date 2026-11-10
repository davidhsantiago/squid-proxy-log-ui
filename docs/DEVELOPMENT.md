# Development Setup

This guide is for running the app locally during development without using Docker or the Linux systemd installer.

> [!IMPORTANT]
> This workflow is intended for a local Linux/macOS/WSL environment with Node.js installed.

## Prerequisites

- Node.js and npm installed
- a working Squid Proxy installation or a readable Squid log directory
- optionally `nvm` if you want to manage the Node version used by the project

## 1) Install Node version

If you use `nvm`, run:

```bash
nvm install
nvm use
```

## 2) Install dependencies

From the project root:

```bash
npm install
```

## 3) Configure the app

Create a `.env` file in the project root, then set the environment values described in [docs/ENV.md](docs/ENV.md).

Example:

```env
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
SQUID_HOST=localhost
SQUID_PORT=3128
LOG_PATH=/var/log/squid
SQUID_LOG_FILE=/var/log/squid/access.log
SQUID_LOG_DIRS=/var/log/squid:/var/log/squid3
```

The app reads these settings at startup to decide which port to listen on and which Squid log files to read.

## 4) Start the app

Run:

```bash
npm run dev
```

This starts the server with `node --watch`, so the process restarts automatically when the source files change.

## 5) Open the app

By default the app listens on:

```text
http://127.0.0.1:3000
```

If you changed the `PORT` or `HOST` values in `.env`, use those values instead.

## 6) What the app provides

The project serves:

- the dashboard page at `/`
- the log viewer page at `/log-viewer.html`
- JSON endpoints for log listing and log paging under `/api/*`

The log viewer reads log files from Squid’s log directories and supports file selection and paging.

## 7) Troubleshooting

- If the server does not start, check the `.env` values and confirm that `PORT` is available.
- If the logs do not appear, verify that `SQUID_LOG_FILE` or `SQUID_LOG_DIRS` points to a valid Squid log location.
- If Squid is reachable through a custom hostname or port, update `SQUID_HOST` and `SQUID_PORT` to match it.

For the Linux package installer flow, see [docs/LINUX.md](docs/LINUX.md). For Docker-based setup, see [docs/DOCKER.md](docs/DOCKER.md).