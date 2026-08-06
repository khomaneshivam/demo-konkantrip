const db = require("../../config/db");
const { getRequestMetadata } = require("../../utils/requestMetadata");

const buildLoginLogPayload = (req, { p_owner_id, email, loginStatus, failureReason, sessionId, jwtId }) => ({
    p_owner_id: p_owner_id || null,
    email: email || null,
    login_status: loginStatus,
    failure_reason: failureReason || null,
    ...getRequestMetadata(req),
    session_id: sessionId || null,
    jwt_id: jwtId || null
});

const insertLoginLog = async (req, data) => {
    const payload = buildLoginLogPayload(req, data);

    await db.query(
        `INSERT INTO property_owner_login_logs (
            p_owner_id, email, login_status, failure_reason, ip_address, user_agent,
            device_type, browser, operating_system, session_id, jwt_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            payload.p_owner_id,
            payload.email,
            payload.login_status,
            payload.failure_reason,
            payload.ip_address,
            payload.user_agent,
            payload.device_type,
            payload.browser,
            payload.operating_system,
            payload.session_id,
            payload.jwt_id
        ]
    );
};

const getPropertyOwnerLoginLogs = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM property_owner_login_logs ORDER BY created_at DESC, id DESC"
        );

        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to fetch property owner login logs" });
    }
};

module.exports = {
    buildLoginLogPayload,
    insertLoginLog,
    getPropertyOwnerLoginLogs
};
