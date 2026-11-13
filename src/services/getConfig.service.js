"use strict";

require('dotenv').config();

/**
 * Get configuration from environment variables
 */
const getConfig = () => {
    return {
        isDocker: ["1", "true", "yes", "on"].includes(String(process.env.IS_DOCKER).toLowerCase()),
        port: process.env.PORT || 3000,
        host: process.env.HOST || '127.0.0.1',
        squidHost: process.env.SQUID_HOST,
        squidPort: process.env.SQUID_PORT,
        squidLogPath: process.env.LOG_PATH,
        httpPort: process.env.PORT ?? '3000',
        isDev: process.env.NODE_ENV === 'development'
    };
};

console.log('Configuration:', getConfig());

module.exports = getConfig;