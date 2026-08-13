const { env } = require("../config/env");

const formatLog = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logObject = {
        timestamp,
        level,
        message,
        ...meta
    };

    if (env.isProduction) {
        return JSON.stringify(logObject);
    }

    // Development readable format
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaString}`;
};

const logger = {
    info: (message, meta) => {
        if (!env.isTest) {
            console.log(formatLog("INFO", message, meta));
        }
    },
    warn: (message, meta) => {
        if (!env.isTest) {
            console.warn(formatLog("WARN", message, meta));
        }
    },
    error: (message, meta) => {
        if (!env.isTest) {
            console.error(formatLog("ERROR", message, meta));
        }
    },
    debug: (message, meta) => {
        if (!env.isProduction && !env.isTest) {
            console.debug(formatLog("DEBUG", message, meta));
        }
    }
};

module.exports = logger;