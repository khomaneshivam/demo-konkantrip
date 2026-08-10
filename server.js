require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
<<<<<<< HEAD
const helmet = require("helmet");
const morgan = require("morgan");

// Auth Routes
const propertyOwnerRegisterRoutes = require("./src/routes/auth/propertyOwnerRegisterRoutes");
const propertyOwnerLoginRoutes = require("./src/routes/auth/propertyOwnerLoginRoutes");
const propertyOwnerLoginLogsRoutes = require("./src/routes/auth/propertyOwnerLoginLogsRoutes");
const propertyOwnerUpdatePasswordRoutes = require("./src/routes/auth/propertyOwnerUpdatePasswordRoutes");
const adminAuthRoutes = require("./src/routes/auth/adminAuthRoutes");

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

// Inventory Routes
const inventoryRoutes = require("./src/routes/inventory/inventoryRoutes");

// Middlewares
const authMiddleware = require("./src/middlewares/authMiddleware");

// Documentation
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const app = express();

// Global Middlewares
app.use(helmet({
    contentSecurityPolicy: false // Allows Swagger UI to load scripts properly
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

// Swagger Documentation
app.get("/api-docs.json", (req, res) => res.status(200).json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint (Both Root and API v1)
const healthHandler = (req, res) => {
    res.status(200).json({
        success: true,
        message: "KonkanTrip Hospitality API v1 is running",
        timestamp: new Date().toISOString()
    });
};
app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// Authentication & Account Routes (v1)
app.use("/api/v1/register", propertyOwnerRegisterRoutes);
app.use("/api/v1/login", propertyOwnerLoginRoutes);
app.use("/api/v1/update-password", propertyOwnerUpdatePasswordRoutes);
app.use("/api/v1/property_owner_login_logs", propertyOwnerLoginLogsRoutes);
app.use("/api/v1/admin", adminAuthRoutes);

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

// User / Admin Profile Endpoint (v1 & Root)
const profileHandler = (req, res) => {
=======
const registerUser = require("./src/routes/propertyOwnerRoutes/RegisterRoutes");
const loginUser = require("./src/routes/propertyOwnerRoutes/LoginRoutes");
const propertyOwnerLoginLogsRoutes = require("./src/routes/propertyOwnerRoutes/PropertyOwnerLoginLogsRoutes");
const updatePasswordRoutes = require("./src/routes/propertyOwnerRoutes/UpdatePasswordRoutes");
const propertiesRoutes = require("./src/routes/properties/PropertiesRoutes");
const propertyLocationRoutes = require("./src/routes/properties/PropertyLocationRoutes");
const adminAuthRoutes = require("./src/routes/adminRoutes/index");
const authMiddleware = require("./src/middleware/authMiddleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/api-docs.json", (req, res) => res.status(200).json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/propertyowner/register", registerUser);
app.use("/api/propertyowner/login", loginUser);
app.use("/api/propertyowner/update-password", updatePasswordRoutes);
app.use("/api/propertyowner/login_logs", propertyOwnerLoginLogsRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/properties", propertyLocationRoutes);
app.use("/api/admin", adminAuthRoutes);

app.get("/profile", authMiddleware, (req, res) => {
>>>>>>> c91ab28b7a65ab40129a5b1399ce760388fa3d4b
    res.status(200).json({
        success: true,
        data: req.user
    });
<<<<<<< HEAD
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
    console.error("Unhandled API Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
=======
>>>>>>> c91ab28b7a65ab40129a5b1399ce760388fa3d4b
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
<<<<<<< HEAD
        console.log(`Server is running on port ${port}`);
        console.log(`API Documentation available at http://localhost:${port}/api-docs`);
=======
        console.log(`server is running on port ${port}`);
>>>>>>> c91ab28b7a65ab40129a5b1399ce760388fa3d4b
    });
}

module.exports = app;
