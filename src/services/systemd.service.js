"use strict";

const { spawnSync } = require("node:child_process");
const getConfig = require("./getConfig.service");

/**
 * Get the status of a systemd service.
 * @param {string} serviceName - The name of the service.
 * @returns {number} - 0 when active, 1 when inactive or unavailable.
 */
function serviceStatus(serviceName) {
    const config = getConfig();

    if (config.isDocker === true) {
        const result = spawnSync("service", [serviceName, "status"], {
            encoding: "utf-8"
        });

        if (typeof result.status === "number") {
            return result.status;
        }

        return 1;
    }

    const result = spawnSync("systemctl", ["is-active", "--quiet", serviceName], {
        encoding: "utf-8"
    });

    if (typeof result.status === "number") {
        return result.status;
    }

    return 1;
}

module.exports = {
    serviceStatus
};