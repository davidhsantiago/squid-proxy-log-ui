# Docker Setup

This project can be run with Docker using the provided compose configuration and helper scripts.

> [!IMPORTANT]
> Docker Desktop is recommended on Windows and macOS. On Linux, use the native Docker Engine with Compose v2.

## Prerequisites

Before starting, make sure:

- Docker is installed and running
- Docker Compose v2 is available (`docker compose version`)
- the project has been cloned locally
- you have reviewed the runtime environment variables in [docs/ENV.md](docs/ENV.md)

## 1) Review the Docker configuration

The Compose configuration is located here:

- [install/docker/assets/docker-compose.yml](../install/docker/assets/docker-compose.yml)

It exposes:

- web UI: `http://localhost:3000`
- Squid proxy port: `http://localhost:3128`

The app runs with the following Docker defaults:

```env
NODE_ENV=production
PORT=3000
IS_DOCKER=true
SQUID_HOST=127.0.0.1
SQUID_PORT=3128
SQUID_LOG_DIRS=/var/log/squid
SQUID_LOG_FILE=/var/log/squid/access.log
```

## 2) Choose your platform

### Linux

Run:

```bash
bash install/docker/setup-linux.sh
```

### macOS

Run:

```bash
bash install/docker/setup-mac.sh
```

### Windows

Run:

```bat
install\docker\setup-windows.cmd
```

If you want to change the service settings, edit [install/docker/assets/docker-compose.yml](../install/docker/assets/docker-compose.yml) before starting the stack.

## 3) Start the stack

The scripts will:

- create a `dist` folder for the app build
- copy the project files needed for the container
- run `docker compose up --build`
- start the Squid Proxy Log UI container

## 4) Verify the installation

After startup, confirm the containers are running:

```bash
docker compose -f install/docker/assets/docker-compose.yml ps
```

Then open the UI in your browser:

```text
http://localhost:3000
```

You can follow the container logs with:

```bash
docker compose -f install/docker/assets/docker-compose.yml logs -f
```

## 5) Stop or remove the stack

To stop the containers:

```bash
docker compose -f install/docker/assets/docker-compose.yml down
```

To remove the named volume used for Squid logs as well:

```bash
docker compose -f install/docker/assets/docker-compose.yml down -v
```

## Troubleshooting

- If Docker says the daemon is not running, start Docker Desktop or the Docker service and try again.
- If port `3000` is already in use, change the published port in the compose file before starting the container.
- If the app cannot read logs, check that `SQUID_LOG_DIRS` and `SQUID_LOG_FILE` still point to a valid Squid log location in the container.
- If you are on Windows or macOS and the script cannot find Docker, make sure Docker Desktop is installed and running.

For a local non-container setup, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). For the Linux systemd installation, see [docs/LINUX.md](docs/LINUX.md).
