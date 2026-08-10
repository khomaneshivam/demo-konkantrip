const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { insertLoginLog } = require("./propertyOwnerLoginLogs");
const tokenCache = require("../../utils/tokenCache");
require("dotenv").config();

const createToken = (user) => {
    return jwt.sign(
        {
            p_owner_id: user.p_owner_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: "owner"
        },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: process.env.JWT_EXPIRE || "1d" }
    );
};

const loginUser = async (req, res) => {
    try {
        const email = req.body?.email?.toString().trim().toLowerCase();
        const password = req.body?.password;
        const sessionId = req.headers["x-session-id"] || null;
        const jwtId = req.headers["x-jwt-id"] || null;

        if (!email || !password) {
            await insertLoginLog(req, {
                p_owner_id: null,
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
            "SELECT p_owner_id, first_name, last_name, email, phone, password FROM property_owners WHERE email = ? AND delete_status = FALSE LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            await insertLoginLog(req, {
                p_owner_id: null,
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
            await insertLoginLog(req, {
                p_owner_id: user.p_owner_id,
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

        const token = createToken(user);
        
        // Cache token in memory with user payload
        tokenCache.set(token, {
            p_owner_id: user.p_owner_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: "owner"
        });

        await insertLoginLog(req, {
            p_owner_id: user.p_owner_id,
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

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                p_owner_id: user.p_owner_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                role: "owner"
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const logoutUser = async (req, res) => {
    try {
        const token = req.token || req.headers.authorization?.split(" ")[1] || req.cookies?.token;
        if (token) {
            tokenCache.revoke(token);
        }
        res.clearCookie("token");
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to logout"
        });
    }
};

module.exports = {
    loginUser,
    logoutUser
};
