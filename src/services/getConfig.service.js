require('dotenv').config();

/**
 * Get configuration from environment variables
 */
const getConfig = () => {
    return {
        isDocker: process.env.IS_DOCKER === 'true',
        squidHost: process.env.SQUID_HOST,
        squidPort: process.env.SQUID_PORT,
        squidLogPath: process.env.LOG_PATH,
        isDev: process.env.NODE_ENV === 'development'
    };
};

module.exports = getConfig;