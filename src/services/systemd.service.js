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

    if (config.isDocker) {
        const squidPort = Number.parseInt(config.squidPort || "3128", 10);
        const squidHost = config.squidHost || "127.0.0.1";

        const curlResult = spawnSync(
            "curl",
            ["-fsS", `http://${squidHost}:${squidPort}`, "-o", "/dev/null"],
            { encoding: "utf-8" }
        );

        if (curlResult.status === 0) {
            return 0;
        }

        const psResult = spawnSync("ps", ["-C", "squid"], { encoding: "utf-8" });
        if (psResult.status === 0) {
            return 0;
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