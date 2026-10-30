#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
DIST_DIR="$REPO_ROOT/dist"
INSTALL_DIR=/opt/squid-proxy-log-ui
SERVICE_NAME=squid-proxy-log-ui.service
SERVICE_SRC="$SCRIPT_DIR/squidLogUi.service"
SERVICE_DEST="/etc/systemd/system/$SERVICE_NAME"

if [ "$(id -u)" -ne 0 ]; then
    echo "This installer must be run as root. Try: sudo $0" >&2
    exit 1
fi

for command in node npm systemctl; do
    if ! command -v "$command" >/dev/null 2>&1; then
        echo "Required command '$command' was not found in PATH." >&2
        exit 1
    fi
done

if [ ! -f "$SERVICE_SRC" ]; then
    echo "Service file not found: $SERVICE_SRC" >&2
    exit 1
fi

if [ -d "$INSTALL_DIR" ]; then
    echo "Directory $INSTALL_DIR already exists. Please remove it before installing." >&2
    exit 1
fi

echo "Preparing Squid Proxy Log UI build artifacts..."

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

cp -R "$REPO_ROOT/src" "$DIST_DIR/src"
cp "$REPO_ROOT/package.json" "$DIST_DIR/package.json"

if [ -f "$REPO_ROOT/package-lock.json" ]; then
    cp "$REPO_ROOT/package-lock.json" "$DIST_DIR/package-lock.json"
fi

cp -R "$REPO_ROOT/public" "$DIST_DIR/public"
cp "$REPO_ROOT/startup.sh" "$DIST_DIR/startup.sh"
chmod +x "$DIST_DIR/startup.sh"

if [ -f "$REPO_ROOT/.nvmrc" ]; then
    cp "$REPO_ROOT/.nvmrc" "$DIST_DIR/.nvmrc"
fi

ENV_SRC="$SCRIPT_DIR/.env"
if [ ! -f "$ENV_SRC" ]; then
    ENV_SRC="$REPO_ROOT/.env"
fi

if [ -f "$ENV_SRC" ]; then
    cp "$ENV_SRC" "$DIST_DIR/.env"
else
    echo "Warning: no .env file found. The application will use its defaults." >&2
fi

echo "Installing dependencies..."
npm --prefix "$DIST_DIR" ci --omit=dev

echo "Installing application to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp -R "$DIST_DIR/." "$INSTALL_DIR/"

echo "Enabling systemd service..."
install -m 0644 "$SERVICE_SRC" "$SERVICE_DEST"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl --no-pager status "$SERVICE_NAME" || true

echo "Installation completed successfully."
