# Environment configuration

All environment variables are imported in `src/services/getConfig.service.js`

Following variables can be set:

--- Application Settings ---

`IS_DOCKER` Tells the application if it should start the docker version

`PORT` Sets the port for the webserver (Default value 3000)

`NODE_ENV` doesn't need to be set, but can be set to "development"

`SQUID_HOST` should be set to the hostname of your squid proxy server (For sending HTTP Requests)

`SQUID_PORT` should be set to the port of your squid proxy server (For sending HTTP Requests)

`LOG_PATH` The log path where your squid proxy logs are stored. 

>  The log path is meant to be set to the squid logging directory not your access log