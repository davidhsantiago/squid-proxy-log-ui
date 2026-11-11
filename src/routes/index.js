"use strict";

const { handleHealthRoute } = require("./health");
const { handleLogFilesRoute, handleLogsRoute, handleLogFileDownload } = require("./logs");
const { handleSquidHttpTestRoute } = require("./squidhttptest");
const { servePublicFile } = require("./static");

function writeText(res, statusCode, message) {
	res.writeHead(statusCode, { "Content-Type": "text/plain" });
	res.end(`${message}\n`);
}

function routeRequest(req, res) {
	const method = req.method || "GET";
	const origin = `http://${req.headers.host || "localhost"}`;
	const url = new URL(req.url || "/", origin);

	if (method === "GET" && url.pathname === "/") {
		if (servePublicFile(req, res, url)) {
			return;
		}

		writeText(res, 200, "squid-proxy-log-ui is running");
		return;
	}

	if (method === "GET" && url.pathname === "/health") {
		handleHealthRoute(req, res);
		return;
	}

	if (method === "GET" && url.pathname === "/api/logs") {
		handleLogsRoute(req, res, url);
		return;
	}

	if (method === "GET" && url.pathname === "/api/log-files") {
		handleLogFilesRoute(req, res);
		return;
	}

	if (method === "GET" && url.pathname === "/api/log-file") {
		handleLogFileDownload(req, res);
		return;
	}

	if (method === "GET" && url.pathname === "/api/squidhttptest") {
		handleSquidHttpTestRoute(req, res);
		return;
	}

	if (servePublicFile(req, res, url)) {
		return;
	}

	writeText(res, 404, "Route not found");
}

module.exports = {
	routeRequest
};
