"use strict";

const { execFileSync } = require("node:child_process");
const getConfig = require("./getConfig.service");

/**
 * Test Squid HTTP proxy by making a request to it
 */
function testSquidHttp() {
    const config = getConfig();
    const host = config.squidHost;
    const port = config.squidPort;
    const url = `http://${host}:${port}`;

    try {
        const statusText = execFileSync(
            "curl",
            ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "4", url],
            { encoding: "utf-8" }
        ).trim();

        const status = Number.parseInt(statusText, 10);
        if (Number.isNaN(status)) {
            return { status: 0 };
        }

        return { status };
    } catch (_error) {
        return { status: 0 };
    }
}

module.exports = testSquidHttp;