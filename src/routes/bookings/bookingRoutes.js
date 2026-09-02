const express = require("express");
const router = express.Router();
const { createBooking, getBookings, getBookingById, updateBookingStatus } = require("../../controllers/bookings/bookingController");
const authMiddleware = require("../../middlewares/authMiddleware");

// Optional auth for creating booking: guests who verified OTP send Bearer token; if not provided, guest info is used
router.post("/", (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authMiddleware(req, res, next);
    }
    next();
}, createBooking);

router.get("/", authMiddleware, getBookings);
router.get("/:idOrUuid", authMiddleware, getBookingById);
router.put("/:idOrUuid/status", authMiddleware, updateBookingStatus);

module.exports = router;
