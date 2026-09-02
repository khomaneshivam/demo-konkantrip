const express = require("express");
const router = express.Router();
const { requestOtp, verifyOtp, getMe } = require("../../controllers/customer/customerAuthController");
const authMiddleware = require("../../middlewares/authMiddleware");
const { authLimiter } = require("../../middlewares/rateLimiter");

router.post("/request-otp", authLimiter, requestOtp);
router.post("/verify-otp", authLimiter, verifyOtp);
router.get("/me", authMiddleware, getMe);

module.exports = router;
