const SessionService = require("../../services/sessionService");
const AuditService = require("../../services/auditService");
const { isAdmin, isOwner } = require("../../middlewares/roleMiddleware");

const getEmployeeSessions = async (req, res) => {
    try {
        const employeeId = Number(req.params.id || req.query.employee_id || req.user.employee_id);
        const ownerId = isAdmin(req.user) ? null : req.user.p_owner_id;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: "Employee ID is required" });
        }

        const sessions = await SessionService.getEmployeeSessions(employeeId, ownerId);

        return res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        console.error("Error fetching employee sessions:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve employee sessions" });
    }
};

const revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const revokedBy = req.user.employee_id || req.user.p_owner_id || req.user.admin_id;

        const success = await SessionService.revokeSession(sessionId, revokedBy);
        if (!success) {
            return res.status(404).json({ success: false, message: "Session not found or already revoked" });
        }

        await AuditService.logAudit({
            req,
            module: "Auth",
            action: "LOGOUT",
            description: `Terminated active staff session #${sessionId}`
        });

        return res.status(200).json({
            success: true,
            message: "Session terminated successfully"
        });
    } catch (error) {
        console.error("Error revoking session:", error);
        return res.status(500).json({ success: false, message: "Failed to terminate session" });
    }
};

const revokeAllEmployeeSessions = async (req, res) => {
    try {
        const employeeId = Number(req.params.id);
        const revokedBy = req.user.employee_id || req.user.p_owner_id || req.user.admin_id;

        if (!employeeId) {
            return res.status(400).json({ success: false, message: "Employee ID is required" });
        }

        const count = await SessionService.revokeAllEmployeeSessions(employeeId, revokedBy);

        await AuditService.logAudit({
            req,
            module: "Auth",
            action: "LOGOUT",
            description: `Revoked all active sessions for Employee #${employeeId}`
        });

        return res.status(200).json({
            success: true,
            message: "All active sessions for this employee have been terminated"
        });
    } catch (error) {
        console.error("Error revoking all sessions:", error);
        return res.status(500).json({ success: false, message: "Failed to revoke all sessions" });
    }
};

module.exports = {
    getEmployeeSessions,
    revokeSession,
    revokeAllEmployeeSessions
};
