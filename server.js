const { env, validateEnv } = require("./src/config/env");
validateEnv();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./src/utils/logger");

// Auth Routes
const propertyOwnerRegisterRoutes = require("./src/routes/auth/propertyOwnerRegisterRoutes");
const propertyOwnerLoginRoutes = require("./src/routes/auth/propertyOwnerLoginRoutes");
const propertyOwnerLoginLogsRoutes = require("./src/routes/auth/propertyOwnerLoginLogsRoutes");
const propertyOwnerUpdatePasswordRoutes = require("./src/routes/auth/propertyOwnerUpdatePasswordRoutes");
const adminAuthRoutes = require("./src/routes/auth/adminAuthRoutes");
const adminDashboardRoutes = require("./src/routes/admin/adminDashboardRoutes");
const employeeAuthRoutes = require("./src/routes/auth/employeeAuthRoutes");

// Lookup Routes
const masterLookupRoutes = require("./src/routes/lookups/masterLookupRoutes");
const amenityRoutes = require("./src/routes/lookups/amenityRoutes");
const roomLookupRoutes = require("./src/routes/lookups/roomLookupRoutes");

// Property Routes
const propertiesRoutes = require("./src/routes/properties/propertiesRoutes");
const propertyLocationRoutes = require("./src/routes/properties/propertyLocationRoutes");
const propertySubResourceRoutes = require("./src/routes/properties/propertySubResourceRoutes");

// Room Routes
const roomRoutes = require("./src/routes/rooms/roomRoutes");

// CRM & Employees Routes
const employeeRoutes = require("./src/routes/employees/employeeRoutes");
const employeeSessionRoutes = require("./src/routes/employees/sessionRoutes");
const auditRoutes = require("./src/routes/audit/auditRoutes");
const { initEnterpriseTables } = require("./src/db/initEnterpriseTables");
initEnterpriseTables();

const path = require("path");

// Inventory Routes
const inventoryRoutes = require("./src/routes/inventory/inventoryRoutes");

// Upload Routes
const uploadRoutes = require("./src/routes/upload/uploadRoutes");
const db = require("./src/config/db");

// Middlewares
const authMiddleware = require("./src/middlewares/authMiddleware");
const requestIdMiddleware = require("./src/middlewares/requestIdMiddleware");
const { authLimiter, uploadLimiter, apiLimiter } = require("./src/middlewares/rateLimiter");

// Documentation
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// Request Tracing & Correlation Header
app.use(requestIdMiddleware);

// Global Middlewares
app.use(helmet({
    contentSecurityPolicy: false // Allows Swagger UI to load scripts properly
}));
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
if (!env.isTest) {
    app.use(morgan("dev"));
}

// Swagger Documentation
app.get("/api-docs.json", (req, res) => res.status(200).json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint (Both Root and API v1) with Active Database Probe
const healthHandler = async (req, res) => {
    try {
        await db.query("SELECT 1");
        return res.status(200).json({
            success: true,
            status: "healthy",
            database: "connected",
            message: "KonkanTrip Hospitality API v1 is running",
            timestamp: new Date().toISOString(),
            requestId: req.id
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            status: "unhealthy",
            database: "disconnected",
            message: "Database connection unavailable",
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.id
        });
    }
};
app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// General API Rate Limiter
app.use("/api/", apiLimiter);

// Authentication & Account Routes (v1)
app.use("/api/v1/register", authLimiter, propertyOwnerRegisterRoutes);
app.use("/api/v1/login", authLimiter, propertyOwnerLoginRoutes);
app.use("/api/v1/update-password", propertyOwnerUpdatePasswordRoutes);
app.use("/api/v1/property_owner_login_logs", propertyOwnerLoginLogsRoutes);
app.use("/api/v1/admin", adminAuthRoutes);
app.use("/api/v1/auth/employee", employeeAuthRoutes);

// Admin Dashboard Routes (v1)
const { requireAdmin } = require("./src/middlewares/roleMiddleware");
app.use("/api/v1/admin/dashboard", authMiddleware, requireAdmin, adminDashboardRoutes);

// CRM Employees, Roles, Sessions & Enterprise Audit Trail (v1)
app.use("/api/v1", employeeRoutes);
app.use("/api/v1/crm", employeeRoutes);
app.use("/api/v1/employees/sessions", employeeSessionRoutes);
app.use("/api/v1/audit-trail", auditRoutes);

// Master Lookups & Catalogs (v1)
app.use("/api/v1/lookups/master", masterLookupRoutes);
app.use("/api/v1/lookups/amenities", amenityRoutes);
app.use("/api/v1/lookups/rooms", roomLookupRoutes);

// Property Management & Sub-resources (v1)
app.use("/api/v1/properties", propertiesRoutes);
app.use("/api/v1/properties", propertyLocationRoutes);
app.use("/api/v1/properties", propertySubResourceRoutes);

// Room Management & Room Sub-resources (v1)
app.use("/api/v1/rooms", roomRoutes);

// Inventory, Calendar & Booking Controls (v1)
app.use("/api/v1/inventory", inventoryRoutes);

// Direct File Upload & Media Storage (v1)
const { ensureUploadDirectories } = require("./src/middlewares/uploadMiddleware");
ensureUploadDirectories();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/upload", uploadLimiter, uploadRoutes);

// User / Admin Profile Endpoint (v1 & Root)
const profileHandler = (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
};
app.get("/profile", authMiddleware, profileHandler);
app.get("/api/profile", authMiddleware, profileHandler);
app.get("/api/v1/profile", authMiddleware, profileHandler);

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err && (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE")) {
        return res.status(400).json({
            success: false,
            message: err.code === "LIMIT_FILE_SIZE" ? "File size exceeds allowed limit" : `Upload error: ${err.message}`
        });
    }
    logger.error("Unhandled API Error:", { error: err.message, stack: err.stack, requestId: req.id });
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

if (require.main === module) {
    const { initializeEmployeeTables } = require("./src/config/createEmployeeTables");
    const { initializePricingTables } = require("./src/config/createPricingTables");
    
    initializeEmployeeTables().catch(err => {
        logger.warn("Employee tables initialization warning:", { error: err.message });
    });
    initializePricingTables().catch(err => {
        logger.warn("Pricing tables initialization warning:", { error: err.message });
    });

    const port = env.PORT;
    const server = app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
        logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
    });

    const shutdown = async (signal) => {
        logger.info(`Received ${signal}. Gracefully shutting down server...`);
        server.close(async () => {
            logger.info("HTTP server closed. Draining database connection pool...");
            try {
                if (db.end) {
                    await db.end();
                }
            } catch (err) {
                logger.error("Error closing DB pool:", { error: err.message });
            }
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = app;

