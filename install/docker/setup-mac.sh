
#!/bin/sh

set -eu

# Determine script directory and repository root
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

# Check Docker installation
if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker is not installed or not in PATH." >&2
    echo "Install Docker Desktop for macOS." >&2
    exit 1
fi

# Check Docker Compose
if ! docker compose version >/dev/null 2>&1; then
    echo "Error: Docker Compose v2 is required." >&2
    exit 1
fi

# Check Docker daemon
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running." >&2
    echo "Start Docker Desktop and try again." >&2
    exit 1
fi

echo "Preparing Squid Proxy Log UI build artifacts..."

# Create dist directory
mkdir -p "$REPO_ROOT/dist"

# Copy application files
cp -R "$REPO_ROOT/src" "$REPO_ROOT/dist/"
cp "$REPO_ROOT/package.json" "$REPO_ROOT/dist/"
cp -R "$REPO_ROOT/public" "$REPO_ROOT/dist/"

# Docker Compose configuration
COMPOSE_FILE="$REPO_ROOT/install/docker/assets/docker-compose.yml"

echo "Building and starting the Squid + log UI stack..."

docker compose -f "$COMPOSE_FILE" up --build -d

echo ""
echo "Setup complete."
echo "Web UI: http://localhost:3000"
echo "Squid proxy: http://localhost:3128"
echo "Logs: docker compose -f \"$COMPOSE_FILE\" logs -f"
echo ""

# Change to build directory
cd "$REPO_ROOT/dist"

# Run application container
docker compose -f "$COMPOSE_FILE" run --rm squid-proxy-log-ui
