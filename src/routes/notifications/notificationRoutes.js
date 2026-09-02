const express = require("express");
const router = express.Router();
const { whatsappWebhook, testEmail, getNotificationLogs } = require("../../controllers/notifications/notificationWebhookController");
const authMiddleware = require("../../middlewares/authMiddleware");

// Test email endpoint
router.post("/test-email", testEmail);

// Notification audit logs
router.get("/logs", authMiddleware, getNotificationLogs);

module.exports = router;
