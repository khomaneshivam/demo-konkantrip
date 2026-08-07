const express = require('express');
const router = express.Router();
const { getPropertyOwnerLoginLogs } = require('../../controller/propertyOwnerController/loginLogs');
const authMiddleware = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/requireAdmin');

router.get('/', authMiddleware, requireAdmin, getPropertyOwnerLoginLogs);

module.exports = router;
