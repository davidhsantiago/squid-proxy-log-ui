"use strict";

const { spawnSync } = require("node:child_process");

/**
 * Get the status of a systemd service.
 * @param {string} serviceName - The name of the service.
 * @returns {number} - The exit status of the systemctl command (0 if active, 1 if inactive, etc.).
 */
function serviceStatus(serviceName) {
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