const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { getPropertyOwnerLoginLogs } = require("../../controllers/auth/propertyOwnerLoginLogs");

router.get("/", authMiddleware, getPropertyOwnerLoginLogs);

module.exports = router;
