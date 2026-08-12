const express = require("express");
const router = express.Router();
const { loginUser, logoutUser } = require("../../controllers/auth/propertyOwnerLogin");
const authMiddleware = require("../../middlewares/authMiddleware");
const { validateLogin } = require("../../middlewares/authValidation");

router.post("/", validateLogin, loginUser);
router.post("/logout", authMiddleware, logoutUser);

module.exports = router;
