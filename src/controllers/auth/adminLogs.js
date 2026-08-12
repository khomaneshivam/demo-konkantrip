const db = require("../../config/db");
const { getRequestMetadata } = require("../../utils/requestMetadata");

const insertAdminLoginLog = async (req, { adminId, email, loginStatus, failureReason, sessionId, jwtId }) => {
    const metadata = getRequestMetadata(req);

    await db.query(
        `INSERT INTO admin_logs (
            admin_id, email, login_status, failure_reason, ip_address, user_agent,
            device_type, browser, operating_system, session_id, jwt_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            adminId || null,
            email || null,
            loginStatus,
            failureReason || null,
            metadata.ip_address,
            metadata.user_agent,
            metadata.device_type,
            metadata.browser,
            metadata.operating_system,
            sessionId || null,
            jwtId || null
        ]
    );
};

const getAdminLoginLogs = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM admin_logs ORDER BY created_at DESC, id DESC");
        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to fetch administrator login logs" });
    }
};

module.exports = {
    getAdminLoginLogs,
    insertAdminLoginLog
};
