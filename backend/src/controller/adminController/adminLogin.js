const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { insertLoginLog } = require("../adminController/adminLogs");
require("dotenv").config();

const createToken = (user) => {
    return jwt.sign(
        {
            admin_id: user.admin_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone
        },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: process.env.JWT_EXPIRE || "1d" }
    );
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            await insertLoginLog(req, {
                admin_id: null,
                email: email || null,
                loginStatus: "FAILED",
                failureReason: "Email and password are required",
                sessionId: null,
                jwtId: null
            });

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [rows] = await db.query(
            "SELECT admin_id, first_name, last_name, email, phone, password FROM admin WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            await insertLoginLog(req, {
                admin_id: null,
                email,
                loginStatus: "FAILED",
                failureReason: "Invalid email or password",
                sessionId: null,
                jwtId: null
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
                admin_id: user.admin_id,
                email: user.email,
                loginStatus: "FAILED",
                failureReason: "Invalid email or password",
                sessionId: null,
                jwtId: null
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = createToken(user);
        const sessionId = req.headers["x-session-id"] || null;
        const jwtId = req.headers["x-jwt-id"] || null;

        await insertLoginLog(req, {
            admin_id: user.admin_id,
            email: user.email,
            loginStatus: "SUCCESS",
            failureReason: null,
            sessionId,
            jwtId
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                admin_id: user.admin_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone
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

module.exports = {
    loginAdmin
};
