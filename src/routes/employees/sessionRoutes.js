const express = require("express");
const router = express.Router();
const sessionController = require("../../controllers/employees/sessionController");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireManagementAccess } = require("../../middlewares/roleMiddleware");

router.use(authMiddleware);

// View employee active sessions
router.get("/:id", requireManagementAccess("employees:read"), sessionController.getEmployeeSessions);

// Terminate a specific session
router.delete("/single/:sessionId", requireManagementAccess("employees:update"), sessionController.revokeSession);

// Terminate all sessions for an employee
router.delete("/all/:id", requireManagementAccess("employees:update"), sessionController.revokeAllEmployeeSessions);

module.exports = router;
