const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const { updatePassword } = require("../../controllers/auth/propertyOwnerUpdatePassword");
const { validateUpdatePassword } = require("../../middlewares/authValidation");

router.post("/", authMiddleware, validateUpdatePassword, updatePassword);
router.put("/", authMiddleware, validateUpdatePassword, updatePassword);

module.exports = router;
