const express = require("express");
const router = express.Router();
const auditController = require("../../controllers/audit/auditController");
const authMiddleware = require("../../middlewares/authMiddleware");
const { requireManagementAccess } = require("../../middlewares/roleMiddleware");

// All audit trail endpoints require authentication and management access
router.use(authMiddleware);

// View audit logs (Owners automatically, or Staff with audit:read permission)
router.get("/", requireManagementAccess("audit:read"), auditController.getAuditLogs);
router.get("/:id", requireManagementAccess("audit:read"), auditController.getAuditLogById);

module.exports = router;
