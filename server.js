require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
    res.status(200).json({
        success: true,
        data: req.user
    });
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`server is running on port ${port}`);
    });
}

module.exports = app;
