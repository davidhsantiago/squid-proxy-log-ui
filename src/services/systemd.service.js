"use strict";

const { spawnSync } = require("node:child_process");
const { executeCommand } = require("./sshHandler.service");
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

    let result;

    if (config.useSSH) {
        const sshResult = executeCommand(`systemctl is-active --quiet ${serviceName}`);
        console.log(`SSH command executed for service ${serviceName}, exit code: ${sshResult.exitCode}`);
        console.log(`SSH command stdout: ${sshResult.stdout}`);
        console.log(`SSH command stderr: ${sshResult.catch(err => console.error('SSH command error:', err))}`);
        console.log(`SSH command stderr: ${sshResult.stderr}`);
        result = { status: sshResult.exitCode };
    } else {
        result = spawnSync("systemctl", ["is-active", "--quiet", serviceName], {
            encoding: "utf-8"
        });
    }

    if (typeof result.status === "number") {
        return result.status;
    }

    return 1;
}

module.exports = {
    serviceStatus
};