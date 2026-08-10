const express = require("express");
const router = express.Router();

const { registerAdmin, loginAdmin, logoutAdmin } = require("../../controllers/auth/adminAuth");
const { getAdminLoginLogs } = require("../../controllers/auth/adminLogs");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireAdmin } = require("../../middlewares/roleMiddleware");
const { validateRegister, validateLogin } = require("../../middlewares/authValidation");

router.post("/register", validateRegister, registerAdmin);
router.post("/login", validateLogin, loginAdmin);
router.post("/logout", authMiddleware, requireAdmin, logoutAdmin);
router.get("/login-logs", authMiddleware, requireAdmin, getAdminLoginLogs);

module.exports = router;
