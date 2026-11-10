# Environment configuration

The app loads environment variables from a `.env` file in the project root using `dotenv`.

The configuration is read in [src/services/getConfig.service.js](../src/services/getConfig.service.js) and the log discovery logic is handled in [src/services/readLogFiles.service.js](../src/services/readLogFiles.service.js).

## Available variables

### Application runtime

- `PORT` — HTTP port for the web app. Default: `3000`
- `HOST` — host/interface to bind the server to. Default: `127.0.0.1`
- `NODE_ENV` — optional mode flag. Use `development` during local development.
- `IS_DOCKER` — optional flag to tell the app whether it is running in the Docker setup.

### Squid connection settings

- `SQUID_HOST` — hostname or IP used when testing the proxy connectivity.
- `SQUID_PORT` — port number used when testing the proxy connectivity.

### Squid log discovery settings

- `LOG_PATH` — legacy alias for the log directory or file path. This is read by the config service and used as a general value.
- `SQUID_LOG_FILE` — full path to a specific Squid log file to load. Example: `/var/log/squid/access.log`
- `SQUID_LOG_DIRS` — colon-separated list of directories to scan for Squid log files. Example: `/var/log/squid:/var/log/squid3`

> `SQUID_LOG_FILE` takes precedence when set. Otherwise the app scans configured directories and common Squid paths such as `/var/log/squid` and `/var/log/squid3`.

## Example `.env`

```env
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
IS_DOCKER=false
SQUID_HOST=localhost
SQUID_PORT=3128
LOG_PATH=/var/log/squid
SQUID_LOG_FILE=/var/log/squid/access.log
SQUID_LOG_DIRS=/var/log/squid:/var/log/squid3
```

## Notes

- If you only set `SQUID_LOG_DIRS`, the app scans all matching `.log` files in those directories.
- If you want a specific file to be selected automatically, prefer `SQUID_LOG_FILE`.
- For production installs, the Linux installer reads a `.env` file from the project root or its install directory before starting the service.