const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { updatePassword } = require("../controller/updatePassword");

router.put("/", authMiddleware, updatePassword);

module.exports = router;
