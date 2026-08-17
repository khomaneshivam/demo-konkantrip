require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const isTest = NODE_ENV === "test";

const env = {
    NODE_ENV,
    isProduction,
    isTest,
    PORT: Number(process.env.PORT) || 3000,
    API_BASE_URL: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    CORS_ORIGIN: process.env.CORS_ORIGIN || true,

    // Database Configuration
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_USER: process.env.DB_USER || "root",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_NAME: process.env.DB_NAME || "konkantrip",
    DB_PORT: Number(process.env.DB_PORT) || 3306,
    DB_CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT) || 10,

    // JWT Security
    JWT_SECRET: process.env.JWT_SECRET || (isProduction ? null : "supersecretkey"),
    JWT_EXPIRE: process.env.JWT_EXPIRE || "1d",
    JWT_REMEMBER_EXPIRE: process.env.JWT_REMEMBER_EXPIRE || "30d",

    // File Upload Limits
    UPLOAD_MAX_FILE_SIZE_MB: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB) || 25,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "LOCAL"
};

/**
 * Validate essential environment variables at application boot.
 */
const validateEnv = () => {
    const errors = [];

    if (env.isProduction && (!env.JWT_SECRET || env.JWT_SECRET === "supersecretkey")) {
        errors.push("FATAL: JWT_SECRET must be set to a secure secret in production environments.");
    }

    if (!env.DB_HOST) {
        errors.push("DB_HOST is missing in environment variables.");
    }

    if (!env.DB_NAME) {
        errors.push("DB_NAME is missing in environment variables.");
    }

    if (errors.length > 0) {
        errors.forEach(err => console.error(`[CONFIG ERROR] ${err}`));
        if (env.isProduction) {
            throw new Error("Invalid Environment Configuration: " + errors.join("; "));
        }
    }
};

module.exports = {
    env,
    validateEnv
};