const express = require("express");
const router = express.Router();
const employeeAuth = require("../../controllers/auth/employeeAuth");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireEmployee } = require("../../middlewares/roleMiddleware");
const { authLimiter } = require("../../middlewares/rateLimiter");

// Public Employee Auth
router.post("/login", authLimiter, employeeAuth.loginEmployee);

// Protected Employee Routes
router.get("/me", authMiddleware, requireEmployee, employeeAuth.getEmployeeProfile);
router.put("/update-password", authMiddleware, requireEmployee, employeeAuth.updateEmployeePassword);
router.post("/logout", authMiddleware, employeeAuth.logoutEmployee);

module.exports = router;