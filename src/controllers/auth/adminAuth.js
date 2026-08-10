const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { insertAdminLoginLog } = require("./adminLogs");
const tokenCache = require("../../utils/tokenCache");
require("dotenv").config();

const normalizeAdminRegistrationData = (payload = {}) => {
    const trimmed = {
        first_name: payload.first_name?.toString().trim() || "",
        last_name: payload.last_name?.toString().trim() || "",
        phone: payload.phone?.toString().trim() || "",
        email: payload.email?.toString().trim().toLowerCase() || "",
        password: payload.password?.toString() || ""
    };

    return trimmed;
};

const buildAdminTokenPayload = (user) => ({
    admin_id: user.admin_id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    role: "admin"
});

const createAdminToken = (user) => {
    return jwt.sign(
        buildAdminTokenPayload(user),
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: process.env.JWT_EXPIRE || "1d" }
    );
};

const registerAdmin = async (req, res) => {
    try {
        const payload = normalizeAdminRegistrationData(req.body || {});
        const { first_name, last_name, phone, email, password } = payload;

        if (!first_name || !last_name || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const [existingAdmin] = await db.query(
            "SELECT admin_id FROM admin WHERE email = ? OR phone = ?",
            [email, phone]
        );

        if (existingAdmin.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email or phone number already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO admin (first_name, last_name, phone, email, password) VALUES (?, ?, ?, ?, ?)",
            [first_name, last_name, phone, email, hashedPassword]
        );

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const email = req.body?.email?.toString().trim().toLowerCase();
        const password = req.body?.password;
        const sessionId = req.headers["x-session-id"] || null;
        const jwtId = req.headers["x-jwt-id"] || null;

        if (!email || !password) {
            await insertAdminLoginLog(req, {
                adminId: null,
                email: email || null,
                loginStatus: "FAILED",
                failureReason: "Email and password are required",
                sessionId,
                jwtId
            });
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [rows] = await db.query(
            "SELECT admin_id, first_name, last_name, email, phone, password FROM admin WHERE email = ? AND delete_status = FALSE LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            await insertAdminLoginLog(req, {
                adminId: null,
                email,
                loginStatus: "FAILED",
                failureReason: "Invalid email or password",
                sessionId,
                jwtId
            });
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            await insertAdminLoginLog(req, {
                adminId: user.admin_id,
                email: user.email,
                loginStatus: "FAILED",
                failureReason: "Invalid email or password",
                sessionId,
                jwtId
            });
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = createAdminToken(user);
        const adminPayload = buildAdminTokenPayload(user);

        // Cache token in memory
        tokenCache.set(token, adminPayload);

        await insertAdminLoginLog(req, {
            adminId: user.admin_id,
            email: user.email,
            loginStatus: "SUCCESS",
            failureReason: null,
            sessionId,
            jwtId
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,
            user: adminPayload
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const logoutAdmin = async (req, res) => {
    try {
        const token = req.token || req.headers.authorization?.split(" ")[1] || req.cookies?.token;
        if (token) {
            tokenCache.revoke(token);
        }
        res.clearCookie("token");
        return res.status(200).json({
            success: true,
            message: "Admin logged out successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to logout admin"
        });
    }
};

module.exports = {
    normalizeAdminRegistrationData,
    buildAdminTokenPayload,
    createAdminToken,
    registerAdmin,
    loginAdmin,
    logoutAdmin
};
