const db = require("../../config/db");
const { getUserIdFromRequest } = require("../../utils/auditHelper");
const { isAdmin } = require("../../middlewares/roleMiddleware");
const { withTransaction } = require("../../utils/dbTransaction");

const slugifyRole = (name = "") => {
    return name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const getRoles = async (req, res) => {
    try {
        const { active_only = "true" } = req.query;
        let query = `
            SELECT r.role_id, r.p_owner_id, r.role_name, r.role_slug,
                   r.role_description, r.is_system_role, r.is_active,
                   r.created_by, r.updated_by, r.created_at, r.updated_at
            FROM employee_roles r
            WHERE r.delete_status = FALSE
        `;
        const params = [];

        if (active_only === "true") {
            query += " AND r.is_active = TRUE";
        }

        // Return system roles + owner specific roles
        if (!isAdmin(req.user)) {
            const ownerId = Number(req.user.p_owner_id);
            query += " AND (r.p_owner_id IS NULL OR r.p_owner_id = ?)";
            params.push(ownerId);
        } else if (req.query.p_owner_id) {
            query += " AND (r.p_owner_id IS NULL OR r.p_owner_id = ?)";
            params.push(Number(req.query.p_owner_id));
        }

        query += " ORDER BY r.is_system_role DESC, r.role_name ASC";

        const [roles] = await db.query(query, params);

        if (roles.length > 0) {
            const roleIds = roles.map(r => r.role_id);
            const [permRows] = await db.query(
                `SELECT rp.role_id, p.permission_id, p.permission_code, p.module, p.action, p.description
                 FROM role_permissions rp
                 INNER JOIN permissions p ON p.permission_id = rp.permission_id
                 WHERE rp.role_id IN (?) AND p.is_active = TRUE`,
                [roleIds]
            );

            const permMap = new Map();
            for (const p of permRows) {
                if (!permMap.has(p.role_id)) permMap.set(p.role_id, []);
                permMap.get(p.role_id).push(p);
            }

            for (const r of roles) {
                r.permissions = permMap.get(r.role_id) || [];
            }
        }

        return res.status(200).json({
            success: true,
            count: roles.length,
            data: roles
        });
    } catch (error) {
        console.error("Error fetching roles:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch roles" });
    }
};

const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const roleId = Number(id);

        let query = `
            SELECT r.role_id, r.p_owner_id, r.role_name, r.role_slug,
                   r.role_description, r.is_system_role, r.is_active,
                   r.created_by, r.updated_by, r.created_at, r.updated_at
            FROM employee_roles r
            WHERE r.role_id = ? AND r.delete_status = FALSE
        `;
        const params = [roleId];

        if (!isAdmin(req.user)) {
            query += " AND (r.p_owner_id IS NULL OR r.p_owner_id = ?)";
            params.push(Number(req.user.p_owner_id));
        }

        const [rows] = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        const role = rows[0];

        const [permissions] = await db.query(
            `SELECT p.permission_id, p.permission_code, p.module, p.action, p.description
             FROM role_permissions rp
             INNER JOIN permissions p ON p.permission_id = rp.permission_id
             WHERE rp.role_id = ? AND p.is_active = TRUE
             ORDER BY p.module ASC, p.action ASC`,
            [roleId]
        );

        role.permissions = permissions;

        return res.status(200).json({
            success: true,
            data: role
        });
    } catch (error) {
        console.error("Error fetching role by ID:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch role" });
    }
};

const createRole = async (req, res) => {
    try {
        const {
            role_name,
            role_slug,
            role_description,
            p_owner_id,
            permission_ids = []
        } = req.body || {};

        if (!role_name) {
            return res.status(400).json({ success: false, message: "role_name is required" });
        }

        const ownerId = Number(isAdmin(req.user) && p_owner_id ? p_owner_id : req.user?.p_owner_id);
        if (!ownerId) {
            return res.status(400).json({ success: false, message: "Property owner ID required to create custom role" });
        }

        const slug = (role_slug || slugifyRole(role_name)).trim();

        // Check if role name / slug already exists for this owner
        const [existing] = await db.query(
            "SELECT role_id FROM employee_roles WHERE (role_name = ? OR role_slug = ?) AND p_owner_id = ? AND delete_status = FALSE LIMIT 1",
            [role_name.trim(), slug, ownerId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "A custom role with this name or slug already exists" });
        }

        const userId = getUserIdFromRequest(req);

        const createdRole = await withTransaction(async (conn) => {
            const [insertResult] = await conn.query(
                `INSERT INTO employee_roles (
                    p_owner_id, role_name, role_slug, role_description, is_system_role, is_active, delete_status, created_by, updated_by
                ) VALUES (?, ?, ?, ?, FALSE, TRUE, FALSE, ?, ?)`,
                [ownerId, role_name.trim(), slug, role_description || null, userId, userId]
            );

            const roleId = insertResult.insertId;

            // Assign permissions
            const perms = Array.isArray(permission_ids) ? permission_ids : [];
            for (const p of perms) {
                let permId = Number(p);
                if (isNaN(permId)) {
                    const [pRow] = await conn.query("SELECT permission_id FROM permissions WHERE permission_code = ? LIMIT 1", [p]);
                    if (pRow.length > 0) permId = pRow[0].permission_id;
                }

                if (permId) {
                    await conn.query(
                        "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                        [roleId, permId]
                    );
                }
            }

            const [created] = await conn.query(
                "SELECT * FROM employee_roles WHERE role_id = ? LIMIT 1",
                [roleId]
            );

            return created[0];
        });

        return res.status(201).json({
            success: true,
            message: "Custom role created successfully",
            data: createdRole
        });
    } catch (error) {
        console.error("Error creating custom role:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create role" });
    }
};

const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const roleId = Number(id);

        const [existing] = await db.query(
            "SELECT * FROM employee_roles WHERE role_id = ? AND delete_status = FALSE LIMIT 1",
            [roleId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        const current = existing[0];

        if (current.is_system_role) {
            return res.status(403).json({ success: false, message: "System predefined roles cannot be modified" });
        }

        if (!isAdmin(req.user) && Number(current.p_owner_id) !== Number(req.user?.p_owner_id)) {
            return res.status(403).json({ success: false, message: "Unauthorized to update this role" });
        }

        const {
            role_name,
            role_description,
            is_active,
            permission_ids
        } = req.body || {};

        const userId = getUserIdFromRequest(req);

        const updatedRole = await withTransaction(async (conn) => {
            await conn.query(
                `UPDATE employee_roles SET
                    role_name = ?,
                    role_description = ?,
                    is_active = ?,
                    updated_by = ?
                 WHERE role_id = ? AND delete_status = FALSE`,
                [
                    role_name !== undefined ? role_name.trim() : current.role_name,
                    role_description !== undefined ? role_description : current.role_description,
                    is_active !== undefined ? Boolean(is_active) : current.is_active,
                    userId,
                    roleId
                ]
            );

            // Update permissions if provided
            if (Array.isArray(permission_ids)) {
                await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

                for (const p of permission_ids) {
                    let permId = Number(p);
                    if (isNaN(permId)) {
                        const [pRow] = await conn.query("SELECT permission_id FROM permissions WHERE permission_code = ? LIMIT 1", [p]);
                        if (pRow.length > 0) permId = pRow[0].permission_id;
                    }

                    if (permId) {
                        await conn.query(
                            "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                            [roleId, permId]
                        );
                    }
                }
            }

            const [updated] = await conn.query(
                "SELECT * FROM employee_roles WHERE role_id = ? LIMIT 1",
                [roleId]
            );

            return updated[0];
        });

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: updatedRole
        });
    } catch (error) {
        console.error("Error updating role:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update role" });
    }
};

const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const roleId = Number(id);

        const [existing] = await db.query(
            "SELECT * FROM employee_roles WHERE role_id = ? AND delete_status = FALSE LIMIT 1",
            [roleId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        const current = existing[0];

        if (current.is_system_role) {
            return res.status(403).json({ success: false, message: "System predefined roles cannot be deleted" });
        }

        if (!isAdmin(req.user) && Number(current.p_owner_id) !== Number(req.user?.p_owner_id)) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this role" });
        }

        // Check if role is in active use by any employee
        const [assignedEmployees] = await db.query(
            "SELECT employee_id FROM employees WHERE role_id = ? AND delete_status = FALSE LIMIT 1",
            [roleId]
        );

        if (assignedEmployees.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete role while active employees are assigned to it. Please reassign those employees first."
            });
        }

        const userId = getUserIdFromRequest(req);

        // Soft delete role
        await db.query(
            `UPDATE employee_roles
             SET is_active = FALSE,
                 delete_status = TRUE,
                 deleted_at = CURRENT_TIMESTAMP,
                 deleted_by = ?
             WHERE role_id = ? AND delete_status = FALSE`,
            [userId, roleId]
        );

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting role:", error);
        return res.status(500).json({ success: false, message: "Failed to delete role" });
    }
};

const getPermissions = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT permission_id, module, action, permission_code, description, is_active
             FROM permissions
             WHERE is_active = TRUE
             ORDER BY module ASC, action ASC`
        );

        // Group by module for easy frontend CRM consumption
        const grouped = {};
        for (const p of rows) {
            if (!grouped[p.module]) grouped[p.module] = [];
            grouped[p.module].push(p);
        }

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
            grouped_by_module: grouped
        });
    } catch (error) {
        console.error("Error fetching permissions:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch permissions" });
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getPermissions
};