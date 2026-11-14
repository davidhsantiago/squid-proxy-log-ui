"use strict";

const { serviceStatus } = require("../services/systemd.service.js");
const getConfig = require("../services/getConfig.service");

function handleHealthRoute(_req, res) {
	const config = getConfig();

	let statusCode;

	// Determine the status code based on the environment (Docker (service) or systemd)
	if (config.isDocker === true) {
		statusCode = serviceStatus("squid");
	} else {
		statusCode = serviceStatus("squid.service");
	}

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
