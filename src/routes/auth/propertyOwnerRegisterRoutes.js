const express = require("express");
const router = express.Router();
const { registerUser } = require("../../controllers/auth/propertyOwnerRegister");
const { validateRegister } = require("../../middlewares/authValidation");

router.post("/", validateRegister, registerUser);

module.exports = router;