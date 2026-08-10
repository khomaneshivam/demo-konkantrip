const express = require("express");
const router = express.Router();

const { registerAdmin, loginAdmin } = require("../../controller/adminController/adminAuthController");
const { getAdminLoginLogs } = require("../../controller/adminController/adminLogs");
const authMiddleware = require("../../middleware/authMiddleware");
const { requireAdmin } = require("../../middleware/requireAdmin");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/login-logs", authMiddleware, requireAdmin, getAdminLoginLogs);

module.exports = router;
