const otpService = require("../../services/otpService");
const notificationService = require("../../services/notificationService");
const db = require("../../config/db");

/**
 * POST /api/v1/customer/request-otp
 * Requests a mobile or email OTP for guest booking verification
 */
const requestOtp = async (req, res) => {
    try {
        const { identifier, otp_type = "Mobile", purpose = "Booking Verification" } = req.body || {};

        if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid mobile number or email address is required"
            });
        }

        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
        const result = await otpService.requestOtp({
            identifier,
            otp_type,
            purpose,
            ip
        });

        // Dispatch OTP via Notification Channel
        if (result.otpType === "Email") {
            await notificationService.sendOtpEmail(result.identifier, result.otpCode);
        } else {
            await notificationService.sendOtpWhatsApp(result.identifier, result.otpCode);
        }

        return res.status(200).json({
            success: true,
            message: `OTP sent successfully to ${result.identifier}`,
            data: {
                identifier: result.identifier,
                otp_type: result.otpType,
                expires_in_seconds: result.expiresInSeconds,
                // dev_otp returned for instant Swagger / Postman testing
                dev_otp: process.env.NODE_ENV !== "production" ? result.otpCode : undefined
            }
        });
    } catch (error) {
        console.error("Error in requestOtp:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to request OTP"
        });
    }
};

/**
 * POST /api/v1/customer/verify-otp
 * Verifies the customer's OTP and issues a JWT token
 */
const verifyOtp = async (req, res) => {
    try {
        const { identifier, otp, full_name, mobile_number, email } = req.body || {};

        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                message: "Both identifier (phone/email) and OTP code are required"
            });
        }

        const authResult = await otpService.verifyOtp({
            identifier,
            otp,
            full_name,
            mobile_number,
            email
        });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully. Authenticated customer session created.",
            token: authResult.token,
            data: authResult.customer
        });
    } catch (error) {
        console.error("Error in verifyOtp:", error);
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message || "OTP verification failed"
        });
    }
};

/**
 * GET /api/v1/customer/me
 * Retrieves current authenticated customer profile and active bookings
 */
const getMe = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: "Customer authentication required"
            });
        }

        const [customers] = await db.query(
            "SELECT customer_id, customer_uuid, full_name, mobile_number, email, is_mobile_verified, is_email_verified, created_at FROM customers WHERE customer_id = ?",
            [customerId]
        );

        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const [bookings] = await db.query(
            `SELECT b.*, p.property_name, pl.city, pl.state, pl.district,
                    (SELECT ri.cdn_url FROM property_images ri WHERE ri.property_id = b.property_id AND ri.is_active = TRUE ORDER BY ri.is_cover_image DESC LIMIT 1) as property_cover_image
             FROM bookings b
             INNER JOIN properties p ON p.property_id = b.property_id
             LEFT JOIN property_locations pl ON pl.property_id = p.property_id AND pl.delete_status = FALSE
             WHERE b.customer_id = ?
             ORDER BY b.created_at DESC`,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            data: {
                profile: customers[0],
                bookings
            }
        });
    } catch (error) {
        console.error("Error in getMe:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer profile"
        });
    }
};

module.exports = {
    requestOtp,
    verifyOtp,
    getMe
};
