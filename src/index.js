"use strict";

console.log("Starting Squid Proxy Log UI...");

const http = require("http");
const getConfig = require("./services/getConfig.service");
const { routeRequest } = require("./routes");
const { createWebSocket } = require("./services/websocket.service");

const port = getConfig().httpPort;


const server = http.createServer((req, res) => {
	routeRequest(req, res);
});

createWebSocket(server);

server.listen(port, () => {
	console.log(`Server listening on http://${getConfig().host}:${port}`);
});
