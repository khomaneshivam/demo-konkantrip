const db = require("../config/db");
const { getUserIdFromRequest, getUserTypeFromRequest } = require("../utils/auditHelper");

class AuditService {
    /**
     * Compute field-level difference between old and new state
     */
    static computeDiff(oldValues = {}, newValues = {}) {
        if (!oldValues && !newValues) return null;
        if (!oldValues) return { added: newValues };
        if (!newValues) return { removed: oldValues };

        const diff = {};
        const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

        // Exclude system timestamp fields from diff noise
        const ignoreFields = new Set([
            "updated_at",
            "created_at",
            "password",
            "token",
            "token_hash",
            "updated_by",
            "created_by"
        ]);

        for (const key of allKeys) {
            if (ignoreFields.has(key)) continue;

            const oldVal = oldValues[key];
            const newVal = newValues[key];

            // Deep / JSON comparison
            const oldStr = typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal ?? "");
            const newStr = typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal ?? "");

            if (oldStr !== newStr) {
                diff[key] = {
                    from: oldVal !== undefined ? oldVal : null,
                    to: newVal !== undefined ? newVal : null
                };
            }
        }

        return Object.keys(diff).length > 0 ? diff : null;
    }

    /**
     * Generate human-readable summary string from diff
     */
    static formatDiffSummary(action, module, recordName, diff) {
        if (!diff) {
            return `${action} on ${module} "${recordName || 'Record'}"`;
        }

        const changes = Object.entries(diff)
            .slice(0, 4)
            .map(([field, { from, to }]) => `${field}: '${from ?? 'none'}' → '${to ?? 'none'}'`)
            .join(", ");

        const moreCount = Object.keys(diff).length - 4;
        const moreSuffix = moreCount > 0 ? ` (+${moreCount} more)` : "";

        return `${action} ${module} "${recordName || 'Record'}": ${changes}${moreSuffix}`;
    }

    /**
     * Log an audit trail entry
     */
    static async logAudit({
        req = null,
        p_owner_id = null,
        property_id = null,
        employee_id = null,
        user_name = null,
        user_role = null,
        user_type = null,
        module = "System",
        action = "UPDATE",
        record_id = null,
        record_name = null,
        description = null,
        old_values = null,
        new_values = null,
        changes_diff = null
    }) {
        try {
            // Extract from request context if provided
            let ownerId = p_owner_id;
            let empId = employee_id;
            let uName = user_name;
            let uRole = user_role;
            let uType = user_type;
            let ipAddress = null;
            let userAgent = null;

            if (req) {
                ipAddress = req.ip || req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || null;
                userAgent = req.headers?.["user-agent"] || null;

                if (req.user) {
                    ownerId = ownerId || req.user.p_owner_id;
                    empId = empId || req.user.employee_id;
                    uName = uName || `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.email;
                    uRole = uRole || req.user.role_name || (req.user.p_owner_id ? "Property Owner" : "Staff");
                    uType = uType || getUserTypeFromRequest(req);
                }
            }

            if (!ownerId && req?.user?.p_owner_id) {
                ownerId = req.user.p_owner_id;
            }

            // Compute diff if not provided
            const finalDiff = changes_diff || this.computeDiff(old_values, new_values);
            const finalDescription = description || this.formatDiffSummary(action, module, record_name, finalDiff);

            const [result] = await db.query(
                `INSERT INTO audit_trail 
                 (p_owner_id, property_id, employee_id, user_name, user_role, user_type,
                  module, action, record_id, record_name, description, 
                  old_values, new_values, changes_diff, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    Number(ownerId) || 1,
                    property_id ? Number(property_id) : null,
                    empId ? Number(empId) : null,
                    uName || "System",
                    uRole || "Staff",
                    uType || "employee",
                    module,
                    action,
                    record_id ? String(record_id) : null,
                    record_name ? String(record_name) : null,
                    finalDescription,
                    old_values ? JSON.stringify(old_values) : null,
                    new_values ? JSON.stringify(new_values) : null,
                    finalDiff ? JSON.stringify(finalDiff) : null,
                    ipAddress,
                    userAgent
                ]
            );

            return {
                audit_id: result.insertId,
                description: finalDescription,
                changes_diff: finalDiff
            };
        } catch (error) {
            console.error("Failed to write audit trail entry:", error);
            return null;
        }
    }
}

module.exports = AuditService;
