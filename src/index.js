"use strict";

console.log("Starting Squid Proxy Log UI...");

const http = require("http");
const getConfig = require("./services/getConfig.service");
const { routeRequest } = require("./routes");
const { createWebSocket } = require("./services/websocket.service");

getConfig();

const port = getConfig().PORT || 3000;

const server = http.createServer((req, res) => {
	routeRequest(req, res);
});

createWebSocket(server);

server.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});
