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
        isDev: process.env.NODE_ENV === 'development',
        useSSH: ["1", "true", "yes", "on"].includes(String(process.env.USE_SSH).toLowerCase()),
        sshHost: process.env.SSH_HOST,
        sshPort: process.env.SSH_PORT || 22,
        sshUser: process.env.SSH_USER,
        sshPassword: process.env.SSH_PASSWORD ?? undefined,
    };
};

console.log('Configuration:', getConfig());

module.exports = getConfig;