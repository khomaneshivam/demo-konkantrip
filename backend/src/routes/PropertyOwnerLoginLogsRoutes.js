const express = require('express');
const router = express.Router();
const { getPropertyOwnerLoginLogs } = require('../controller/loginLogs');

router.get('/', getPropertyOwnerLoginLogs);

module.exports = router;
