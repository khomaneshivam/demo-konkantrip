const crypto = require("crypto");
const db = require("../config/db");
const { parseUserAgent } = require("../utils/deviceParser");

function hashToken(token) {
    if (!token) return "";
    return crypto.createHash("sha256").update(token).digest("hex");
}

class SessionService {
    /**
     * Create an active session record on login
     */
    static async createSession({ employee_id, p_owner_id, token, req, expires_at = null }) {
        try {
            const tokenHash = hashToken(token);
            const userAgent = req?.headers?.["user-agent"] || "";
            const ipAddress = req?.ip || req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || null;
            const { browser, os, deviceType } = parseUserAgent(userAgent);

            const [result] = await db.query(
                `INSERT INTO employee_sessions 
                 (employee_id, p_owner_id, token_hash, ip_address, user_agent, device_type, browser, os, expires_at, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    Number(employee_id),
                    Number(p_owner_id),
                    tokenHash,
                    ipAddress,
                    userAgent,
                    deviceType,
                    browser,
                    os,
                    expires_at
                ]
            );

            return {
                session_id: result.insertId,
                employee_id,
                p_owner_id,
                browser,
                os,
                device_type: deviceType,
                ip_address: ipAddress
            };
        } catch (error) {
            console.error("Error creating employee session:", error);
            return null;
        }
    }

    /**
     * Check if token has an active session
     */
    static async isSessionActive(token) {
        if (!token) return false;
        try {
            const tokenHash = hashToken(token);
            const [rows] = await db.query(
                `SELECT session_id, employee_id, is_active, expires_at 
                 FROM employee_sessions 
                 WHERE token_hash = ? AND is_active = 1 LIMIT 1`,
                [tokenHash]
            );

            if (rows.length === 0) return false;

            const session = rows[0];
            if (session.expires_at && new Date(session.expires_at) < new Date()) {
                await this.revokeSession(session.session_id);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error validating session active status:", error);
            return true; // fail open on DB transient error
        }
    }

    /**
     * Update last_active_at timestamp
     */
    static async touchSession(token) {
        if (!token) return;
        try {
            const tokenHash = hashToken(token);
            await db.query(
                `UPDATE employee_sessions 
                 SET last_active_at = CURRENT_TIMESTAMP 
                 WHERE token_hash = ? AND is_active = 1`,
                [tokenHash]
            );
        } catch (error) {
            console.error("Error updating session timestamp:", error);
        }
    }

    /**
     * Terminate a specific session by ID
     */
    static async revokeSession(sessionId, revokedBy = null) {
        try {
            const [result] = await db.query(
                `UPDATE employee_sessions 
                 SET is_active = 0, revoked_at = CURRENT_TIMESTAMP, revoked_by = ? 
                 WHERE session_id = ?`,
                [revokedBy, Number(sessionId)]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error revoking session:", error);
            return false;
        }
    }

    /**
     * Revoke session by token (e.g. on explicit logout)
     */
    static async revokeSessionByToken(token, revokedBy = null) {
        if (!token) return false;
        try {
            const tokenHash = hashToken(token);
            const [result] = await db.query(
                `UPDATE employee_sessions 
                 SET is_active = 0, revoked_at = CURRENT_TIMESTAMP, revoked_by = ? 
                 WHERE token_hash = ? AND is_active = 1`,
                [revokedBy, tokenHash]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error revoking session by token:", error);
            return false;
        }
    }

    /**
     * Terminate all active sessions for an employee
     */
    static async revokeAllEmployeeSessions(employeeId, revokedBy = null) {
        try {
            const [result] = await db.query(
                `UPDATE employee_sessions 
                 SET is_active = 0, revoked_at = CURRENT_TIMESTAMP, revoked_by = ? 
                 WHERE employee_id = ? AND is_active = 1`,
                [revokedBy, Number(employeeId)]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error revoking all employee sessions:", error);
            return false;
        }
    }

    /**
     * List all sessions for an employee
     */
    static async getEmployeeSessions(employeeId, pOwnerId = null) {
        try {
            let query = `
                SELECT session_id, uuid, employee_id, p_owner_id, ip_address, 
                       device_type, browser, os, login_at, last_active_at, 
                       expires_at, is_active, revoked_at
                FROM employee_sessions
                WHERE employee_id = ?
            `;
            const params = [Number(employeeId)];

            if (pOwnerId) {
                query += " AND p_owner_id = ?";
                params.push(Number(pOwnerId));
            }

            query += " ORDER BY is_active DESC, last_active_at DESC LIMIT 50";

            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error("Error retrieving employee sessions:", error);
            return [];
        }
    }
}

module.exports = SessionService;
