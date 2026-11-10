# squid-proxy-log-ui
A simple Node.js-based log viewer for Squid Proxy.

This project is intended for testing and verifying whether requests are flowing through the proxy.

## Installation

- Docker installation guide: [docs/DOCKER.md](docs/DOCKER.md)
- Linux installation guide: [docs/LINUX.md](docs/LINUX.md)
- Development setup: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

## Development mode

Set the environment variables in a `.env` file before starting the app:

```bash
npm install
npm run dev
```

The app listens on the configured `PORT` and `HOST` values, and reads Squid log files from the configured log directories or file paths.

## Disclaimer

I am not responsible for any damages that might occur while using this software.

----

This project is in no way affiliated with the Squid Proxy project (https://www.squid-cache.org).

## External sources

[External sources are documented here](EXTERNAL_SOURCES.md)