const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const OTP_SECRET_SALT = process.env.OTP_SECRET_SALT || "konkantrip_otp_salt_secret_2026";
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

/**
 * Computes a secure SHA-256 hash of the OTP
 */
const hashOtp = (otp, identifier) => {
    return crypto
        .createHash("sha256")
        .update(`${otp}:${identifier.trim().toLowerCase()}:${OTP_SECRET_SALT}`)
        .digest("hex");
};

/**
 * Generates a random 6-digit OTP
 */
const generateOtpCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Requests an OTP for a given mobile number or email address
 */
const requestOtp = async ({ identifier, otp_type = "Mobile", purpose = "Booking Verification", ip = null }) => {
    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
        throw new Error("Phone number or email is required");
    }

    const cleanIdentifier = identifier.trim();
    const type = (otp_type && otp_type.toLowerCase().includes("email")) || cleanIdentifier.includes("@") ? "Email" : "Mobile";

    // 1. Rate limiting check: max 5 OTP requests per 10 minutes for this identifier
    const [recentRequests] = await db.query(
        `SELECT COUNT(*) as request_count 
         FROM customer_otp_verifications 
         WHERE identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
        [cleanIdentifier]
    );

    if (Number(recentRequests[0]?.request_count || 0) >= 6) {
        const error = new Error("Too many OTP requests. Please wait a few minutes before trying again.");
        error.statusCode = 429;
        throw error;
    }

    // 2. Invalidate previous active unverified OTPs
    await db.query(
        "UPDATE customer_otp_verifications SET is_verified = TRUE WHERE identifier = ? AND is_verified = FALSE",
        [cleanIdentifier]
    );

    // 3. Generate secure OTP and hash
    const otpCode = generateOtpCode();
    const otpHash = hashOtp(otpCode, cleanIdentifier);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 4. Save record
    const [insertResult] = await db.query(
        `INSERT INTO customer_otp_verifications (
            identifier, otp_type, otp_hash, purpose, expires_at, attempt_count, max_attempts, ip_address
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [cleanIdentifier, type, otpHash, purpose, expiresAt, MAX_ATTEMPTS, ip]
    );

    return {
        otpId: insertResult.insertId,
        identifier: cleanIdentifier,
        otpType: type,
        otpCode, // used by notification service to dispatch
        expiresInSeconds: OTP_EXPIRY_MINUTES * 60
    };
};

/**
 * Verifies an OTP entered by the customer and establishes a customer session
 */
const verifyOtp = async ({ identifier, otp, full_name, mobile_number, email }) => {
    if (!identifier || !otp) {
        throw new Error("Identifier and OTP are required");
    }

    const cleanIdentifier = identifier.trim();
    const cleanOtp = String(otp).trim();

    // 1. Find latest active unverified OTP
    const [rows] = await db.query(
        `SELECT * FROM customer_otp_verifications 
         WHERE identifier = ? AND is_verified = FALSE AND expires_at > NOW() 
         ORDER BY otp_id DESC LIMIT 1`,
        [cleanIdentifier]
    );

    if (rows.length === 0) {
        const error = new Error("Invalid or expired OTP. Please request a new one.");
        error.statusCode = 400;
        throw error;
    }

    const record = rows[0];

    // 2. Check attempt limits
    if (record.attempt_count >= record.max_attempts) {
        await db.query("UPDATE customer_otp_verifications SET is_verified = TRUE WHERE otp_id = ?", [record.otp_id]);
        const error = new Error("Maximum attempts exceeded. This OTP is now locked. Please request a new OTP.");
        error.statusCode = 429;
        throw error;
    }

    // 3. Compare hash
    const incomingHash = hashOtp(cleanOtp, cleanIdentifier);
    if (incomingHash !== record.otp_hash) {
        // Increment attempt count
        await db.query(
            "UPDATE customer_otp_verifications SET attempt_count = attempt_count + 1 WHERE otp_id = ?",
            [record.otp_id]
        );
        const remaining = record.max_attempts - (record.attempt_count + 1);
        const error = new Error(`Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}`);
        error.statusCode = 400;
        throw error;
    }

    // 4. Mark OTP as verified
    await db.query(
        "UPDATE customer_otp_verifications SET is_verified = TRUE, verified_at = NOW() WHERE otp_id = ?",
        [record.otp_id]
    );

    // 5. Create or Update Customer record
    const isEmail = record.otp_type === "Email";
    const resolvedMobile = mobile_number || (!isEmail ? cleanIdentifier : null) || "0000000000";
    const resolvedEmail = email || (isEmail ? cleanIdentifier : null);
    const resolvedName = full_name || "Guest Customer";

    let customerId = null;
    let customerUuid = null;

    // Check if customer exists by mobile or email
    const [existingCust] = await db.query(
        "SELECT * FROM customers WHERE mobile_number = ? OR (email IS NOT NULL AND email = ?) LIMIT 1",
        [resolvedMobile, resolvedEmail]
    );

    if (existingCust.length > 0) {
        const cust = existingCust[0];
        customerId = cust.customer_id;
        customerUuid = cust.customer_uuid;

        await db.query(
            `UPDATE customers 
             SET full_name = COALESCE(?, full_name),
                 email = COALESCE(?, email),
                 is_mobile_verified = CASE WHEN ? = FALSE THEN TRUE ELSE is_mobile_verified END,
                 is_email_verified = CASE WHEN ? = TRUE THEN TRUE ELSE is_email_verified END
             WHERE customer_id = ?`,
            [full_name || null, resolvedEmail || null, isEmail, isEmail, customerId]
        );
    } else {
        const [insertCust] = await db.query(
            `INSERT INTO customers (
                full_name, mobile_number, email, is_mobile_verified, is_email_verified, status
            ) VALUES (?, ?, ?, ?, ?, 'Active')`,
            [resolvedName, resolvedMobile, resolvedEmail, !isEmail, isEmail]
        );
        customerId = insertCust.insertId;

        const [createdCust] = await db.query("SELECT customer_uuid FROM customers WHERE customer_id = ?", [customerId]);
        customerUuid = createdCust[0]?.customer_uuid;
    }

    // Link customer to OTP verification record
    await db.query("UPDATE customer_otp_verifications SET customer_id = ? WHERE otp_id = ?", [customerId, record.otp_id]);

    // 6. Fetch updated customer details
    const [custDetails] = await db.query("SELECT * FROM customers WHERE customer_id = ?", [customerId]);
    const customer = custDetails[0];

    // 7. Issue authenticated customer JWT
    const token = jwt.sign(
        {
            customer_id: customer.customer_id,
            customer_uuid: customer.customer_uuid,
            full_name: customer.full_name,
            mobile_number: customer.mobile_number,
            email: customer.email,
            role: "customer",
            user_type: "customer"
        },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: "7d" }
    );

    return {
        token,
        customer: {
            customer_id: customer.customer_id,
            customer_uuid: customer.customer_uuid,
            full_name: customer.full_name,
            mobile_number: customer.mobile_number,
            email: customer.email,
            is_mobile_verified: Boolean(customer.is_mobile_verified),
            is_email_verified: Boolean(customer.is_email_verified)
        }
    };
};

module.exports = {
    requestOtp,
    verifyOtp,
    hashOtp
};
