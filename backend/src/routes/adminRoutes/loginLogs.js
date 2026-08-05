const express = require('express');
const router = express.Router();
const { getPropertyOwnerLoginLogs } = require('../controller/adminController/adminLogs');

router.get('/', getAdminLoginLogs);

module.exports = router;
