const db = require("../../config/db");
const { isAdmin, isOwner } = require("../../middlewares/roleMiddleware");

const safeJsonParse = (val) => {
    if (!val || typeof val !== "string") return val;
    try {
        return JSON.parse(val);
    } catch {
        return val;
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const {
            property_id,
            employee_id,
            module: moduleFilter,
            action: actionFilter,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 25
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        let whereClause = "WHERE 1=1";
        const params = [];

        // Scope to owner unless admin
        if (!isAdmin(req.user)) {
            whereClause += " AND a.p_owner_id = ?";
            params.push(Number(req.user.p_owner_id));
        }

        if (property_id) {
            whereClause += " AND a.property_id = ?";
            params.push(Number(property_id));
        }

        if (employee_id) {
            whereClause += " AND a.employee_id = ?";
            params.push(Number(employee_id));
        }

        if (moduleFilter) {
            whereClause += " AND a.module = ?";
            params.push(moduleFilter);
        }

        if (actionFilter) {
            whereClause += " AND a.action = ?";
            params.push(actionFilter);
        }

        if (startDate) {
            whereClause += " AND a.created_at >= ?";
            params.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            whereClause += " AND a.created_at <= ?";
            params.push(`${endDate} 23:59:59`);
        }

        if (search) {
            whereClause += " AND (a.user_name LIKE ? OR a.record_name LIKE ? OR a.description LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        // Count total
        const countQuery = `SELECT COUNT(*) AS total FROM audit_trail a ${whereClause}`;
        const [countResult] = await db.query(countQuery, params);
        const total = countResult[0]?.total || 0;

        // Fetch logs
        const selectQuery = `
            SELECT a.audit_id, a.uuid, a.p_owner_id, a.property_id, a.employee_id,
                   a.user_name, a.user_role, a.user_type, a.module, a.action,
                   a.record_id, a.record_name, a.description, a.changes_diff,
                   a.ip_address, a.user_agent, a.created_at,
                   p.property_name
            FROM audit_trail a
            LEFT JOIN properties p ON p.property_id = a.property_id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await db.query(selectQuery, [...params, Number(limit), Number(offset)]);

        // Format and parse JSON fields safely
        const formatted = rows.map(r => ({
            ...r,
            changes_diff: safeJsonParse(r.changes_diff)
        }));

        return res.status(200).json({
            success: true,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
            data: formatted
        });
    } catch (error) {
        console.error("Error fetching audit trail logs:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve audit logs"
        });
    }
};

const getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = `
            SELECT a.*, p.property_name
            FROM audit_trail a
            LEFT JOIN properties p ON p.property_id = a.property_id
            WHERE (a.audit_id = ? OR a.uuid = ?)
        `;
        const params = [isNaN(Number(id)) ? 0 : Number(id), id];

        if (!isAdmin(req.user)) {
            query += " AND a.p_owner_id = ?";
            params.push(Number(req.user.p_owner_id));
        }

        const [rows] = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Audit log entry not found" });
        }

        const log = rows[0];
        log.old_values = safeJsonParse(log.old_values);
        log.new_values = safeJsonParse(log.new_values);
        log.changes_diff = safeJsonParse(log.changes_diff);

        return res.status(200).json({
            success: true,
            data: log
        });
    } catch (error) {
        console.error("Error fetching audit log detail:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve audit log details"
        });
    }
};

module.exports = {
    getAuditLogs,
    getAuditLogById
};
