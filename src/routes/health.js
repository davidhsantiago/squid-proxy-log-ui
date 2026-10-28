"use strict";

const { serviceStatus } = require("../services/systemd.service.js");

function handleHealthRoute(_req, res) {
	const statusCode = serviceStatus("squid.service");

	const body = JSON.stringify({
		systemdStatusCode: statusCode,
		service: "squid"
	});

	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(body);
}

module.exports = {
	handleHealthRoute
};
