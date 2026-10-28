# squid-proxy-log-ui
A simple node.js based log viewer for squid proxy

I've created this software for testing purpose. It's meant for checking whether requests run over the proxy. 

# Installation:

### Running with squid already installed
> Just execute the shell script, install the logger ui and access your logs

Set the Squid log file path before starting the app:

```bash
export SQUID_LOG_FILE=/var/log/squid/access.log
npm run start
```

For multiple log directories, set optional discovery paths:

```bash
export SQUID_LOG_DIRS=/var/log/squid:/var/log/squid3
```

Log API endpoints:

- `GET /api/log-files` lists available Squid log files.
- `GET /api/logs?page=1&limit=50&file=squid/access.log` reads a selected log file.

### Running the docker image
> The docker image includes squid proxy

