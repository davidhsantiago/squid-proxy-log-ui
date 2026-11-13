#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
COMPOSE_FILE="$REPO_ROOT/install/docker/assets/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required but was not found in PATH." >&2
    exit 1
fi

echo "Preparing Squid Proxy Log UI build artifacts..."
mkdir -p "$REPO_ROOT/dist"

cp -r "$REPO_ROOT/src" "$REPO_ROOT/dist/src"
cp "$REPO_ROOT/package.json" "$REPO_ROOT/dist/package.json"
cp -r "$REPO_ROOT/public" "$REPO_ROOT/dist/public"

echo "Building and starting the Squid + log UI stack..."
docker compose -f "$COMPOSE_FILE" up --build --force-recreate -d

echo "Setup complete."
echo "Web UI: http://localhost:3000"
echo "Squid proxy: http://localhost:3128"
echo "Logs: docker compose -f \"$COMPOSE_FILE\" logs -f"