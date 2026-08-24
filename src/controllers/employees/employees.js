const db = require("../../config/db");
const bcrypt = require("bcrypt");
const { getUserIdFromRequest } = require("../../utils/auditHelper");
const { isAdmin } = require("../../middlewares/roleMiddleware");
const { withTransaction } = require("../../utils/dbTransaction");

const getEmployees = async (req, res) => {
    try {
        const {
            property_id,
            role_id,
            status,
            search,
            page = 1,
            limit = 50
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        const params = [];

        let query = `
            SELECT e.employee_id, e.uuid, e.p_owner_id, e.role_id, e.first_name, e.last_name,
                   e.email, e.phone, e.avatar_url, e.gender, e.date_of_birth, e.joining_date,
                   e.salary, e.designation, e.department, e.employment_type, e.emergency_contact_name,
                   e.emergency_contact_phone, e.address, e.id_proof_type, e.id_proof_number,
                   e.status, e.created_by, e.updated_by, e.created_at, e.updated_at,
                   r.role_name, r.role_slug, r.is_system_role
            FROM employees e
            INNER JOIN employee_roles r ON r.role_id = e.role_id
            WHERE e.delete_status = FALSE AND r.delete_status = FALSE
        `;

        // Scope to owner if not admin
        if (!isAdmin(req.user)) {
            const ownerId = Number(req.user.p_owner_id);
            query += " AND e.p_owner_id = ?";
            params.push(ownerId);
        } else if (req.query.p_owner_id) {
            query += " AND e.p_owner_id = ?";
            params.push(Number(req.query.p_owner_id));
        }

        if (role_id) {
            query += " AND e.role_id = ?";
            params.push(Number(role_id));
        }

        if (status) {
            query += " AND e.status = ?";
            params.push(status);
        }

        if (search) {
            query += " AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR e.designation LIKE ?)";
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        if (property_id) {
            query += ` AND e.employee_id IN (
                SELECT pe.employee_id FROM property_employees pe
                WHERE pe.property_id = ? AND pe.status = 'Active' AND pe.delete_status = FALSE
            )`;
            params.push(Number(property_id));
        }

        query += " ORDER BY e.created_at DESC LIMIT ? OFFSET ?";
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(query, params);

        // Fetch assigned properties for each employee
        if (rows.length > 0) {
            const empIds = rows.map(e => e.employee_id);
            const [propRows] = await db.query(
                `SELECT pe.employee_id, pe.property_id, pe.is_primary, pe.status,
                        p.property_name, p.property_type, p.property_slug
                 FROM property_employees pe
                 INNER JOIN properties p ON p.property_id = pe.property_id
                 WHERE pe.employee_id IN (?) AND pe.delete_status = FALSE AND p.delete_status = FALSE`,
                [empIds]
            );

            const propMap = new Map();
            for (const pr of propRows) {
                if (!propMap.has(pr.employee_id)) propMap.set(pr.employee_id, []);
                propMap.get(pr.employee_id).push(pr);
            }

            for (const emp of rows) {
                emp.assigned_properties = propMap.get(emp.employee_id) || [];
            }
        }

        return res.status(200).json({
            success: true,
            count: rows.length,
            page: Number(page),
            limit: Number(limit),
            data: rows
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch employees" });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = Number(id);

        if (!employeeId || Number.isNaN(employeeId) || employeeId <= 0) {
            return res.status(400).json({ success: false, message: "Valid employee ID is required" });
        }

        let query = `
            SELECT e.employee_id, e.uuid, e.p_owner_id, e.role_id, e.first_name, e.last_name,
                   e.email, e.phone, e.avatar_url, e.gender, e.date_of_birth, e.joining_date,
                   e.salary, e.designation, e.department, e.employment_type, e.emergency_contact_name,
                   e.emergency_contact_phone, e.address, e.id_proof_type, e.id_proof_number,
                   e.status, e.created_by, e.updated_by, e.created_at, e.updated_at,
                   r.role_name, r.role_slug, r.is_system_role,
                   po.first_name AS owner_first_name, po.last_name AS owner_last_name
            FROM employees e
            INNER JOIN employee_roles r ON r.role_id = e.role_id
            INNER JOIN property_owners po ON po.p_owner_id = e.p_owner_id
            WHERE e.employee_id = ? AND e.delete_status = FALSE
        `;
        const params = [employeeId];

        if (!isAdmin(req.user)) {
            query += " AND e.p_owner_id = ?";
            params.push(Number(req.user.p_owner_id));
        }

        const [rows] = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const employee = rows[0];

        // Fetch permissions for the role
        const [permRows] = await db.query(
            `SELECT p.permission_code, p.module, p.action, p.description
             FROM role_permissions rp
             INNER JOIN permissions p ON p.permission_id = rp.permission_id
             WHERE rp.role_id = ? AND p.is_active = TRUE`,
            [employee.role_id]
        );

        // Fetch assigned properties
        const [propRows] = await db.query(
            `SELECT pe.mapping_id, pe.property_id, pe.is_primary, pe.status,
                    p.property_name, p.property_slug, p.property_type
             FROM property_employees pe
             INNER JOIN properties p ON p.property_id = pe.property_id
             WHERE pe.employee_id = ? AND pe.delete_status = FALSE AND p.delete_status = FALSE`,
            [employee.employee_id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...employee,
                permissions: permRows,
                assigned_properties: propRows
            }
        });
    } catch (error) {
        console.error("Error fetching employee by ID:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch employee details" });
    }
};

const createEmployee = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            password,
            role_id,
            p_owner_id,
            avatar_url,
            gender,
            date_of_birth,
            joining_date,
            salary,
            designation,
            department,
            employment_type = "Full-Time",
            emergency_contact_name,
            emergency_contact_phone,
            address,
            id_proof_type,
            id_proof_number,
            status = "Active",
            property_ids = [],
            primary_property_id
        } = req.body || {};

        if (!first_name || !last_name || !email || !phone || !password || !role_id) {
            return res.status(400).json({
                success: false,
                message: "first_name, last_name, email, phone, password, and role_id are required"
            });
        }

        const ownerId = Number(isAdmin(req.user) && p_owner_id ? p_owner_id : req.user?.p_owner_id);
        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: "Property owner ID is required to create an employee"
            });
        }

        const normalizedEmail = email.toString().trim().toLowerCase();
        const normalizedPhone = phone.toString().trim();

        // Check if employee with email or phone already exists
        const [existing] = await db.query(
            "SELECT employee_id FROM employees WHERE (email = ? OR phone = ?) AND delete_status = FALSE LIMIT 1",
            [normalizedEmail, normalizedPhone]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "An active employee with this email or phone already exists"
            });
        }

        // Verify role exists and is accessible
        const [roleRows] = await db.query(
            "SELECT role_id, role_name, role_slug FROM employee_roles WHERE role_id = ? AND (p_owner_id IS NULL OR p_owner_id = ?) AND delete_status = FALSE LIMIT 1",
            [role_id, ownerId]
        );

        if (roleRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected role does not exist or is not available for this owner"
            });
        }

        const assignedProps = Array.isArray(property_ids) ? property_ids.map(Number) : [];

        // Enforce: each property can only have one Property Manager assigned
        const isPropertyManagerRole =
            roleRows[0].role_slug === "property-manager" ||
            roleRows[0].role_name?.toLowerCase().includes("property manager");

        if (isPropertyManagerRole && assignedProps.length > 0) {
            const [conflicts] = await db.query(
                `SELECT pe.property_id, p.property_name, e.first_name, e.last_name, e.employee_id
                 FROM property_employees pe
                 INNER JOIN properties p ON p.property_id = pe.property_id
                 INNER JOIN employees e ON e.employee_id = pe.employee_id
                 INNER JOIN employee_roles r ON r.role_id = e.role_id
                 WHERE pe.property_id IN (?)
                   AND (r.role_slug = 'property-manager' OR LOWER(r.role_name) LIKE '%property manager%')
                   AND e.delete_status = FALSE
                   AND pe.delete_status = FALSE
                   AND pe.status = 'Active'
                 LIMIT 1`,
                [assignedProps]
            );

            if (conflicts.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Property '${conflicts[0].property_name}' already has an active Property Manager (${conflicts[0].first_name} ${conflicts[0].last_name}). Each property can only have one assigned Property Manager.`
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password.toString(), 10);
        const userId = getUserIdFromRequest(req);

        const savedEmployee = await withTransaction(async (conn) => {
            const [insertResult] = await conn.query(
                `INSERT INTO employees (
                    p_owner_id, role_id, first_name, last_name, email, phone, password,
                    avatar_url, gender, date_of_birth, joining_date, salary,
                    designation, department, employment_type, emergency_contact_name,
                    emergency_contact_phone, address, id_proof_type, id_proof_number,
                    status, delete_status, created_by, updated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?)`,
                [
                    ownerId,
                    role_id,
                    first_name.toString().trim(),
                    last_name.toString().trim(),
                    normalizedEmail,
                    normalizedPhone,
                    hashedPassword,
                    avatar_url || null,
                    gender || null,
                    date_of_birth || null,
                    joining_date || null,
                    salary ? Number(salary) : null,
                    designation || null,
                    department || null,
                    employment_type || "Full-Time",
                    emergency_contact_name || null,
                    emergency_contact_phone || null,
                    address || null,
                    id_proof_type || null,
                    id_proof_number || null,
                    status || "Active",
                    userId,
                    userId
                ]
            );

            const employeeId = insertResult.insertId;

            // Assign properties if provided
            const assignedProps = Array.isArray(property_ids) ? property_ids : [];
            for (const propId of assignedProps) {
                const isPrimary = Number(primary_property_id) === Number(propId);
                await conn.query(
                    `INSERT INTO property_employees (
                        property_id, employee_id, is_primary, status, delete_status, created_by, updated_by
                    ) VALUES (?, ?, ?, 'Active', FALSE, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        is_primary = VALUES(is_primary),
                        status = 'Active',
                        delete_status = FALSE,
                        updated_by = VALUES(created_by)`,
                    [propId, employeeId, isPrimary, userId, userId]
                );
            }

            const [saved] = await conn.query(
                `SELECT e.employee_id, e.uuid, e.p_owner_id, e.role_id, e.first_name, e.last_name,
                        e.email, e.phone, e.avatar_url, e.designation, e.department, e.status, e.created_at
                 FROM employees e WHERE e.employee_id = ? AND e.delete_status = FALSE LIMIT 1`,
                [employeeId]
            );

            return saved[0];
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: savedEmployee
        });
    } catch (error) {
        console.error("Error creating employee:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to create employee" });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = Number(id);

        const [existing] = await db.query(
            "SELECT * FROM employees WHERE employee_id = ? AND delete_status = FALSE LIMIT 1",
            [employeeId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const current = existing[0];
        if (!isAdmin(req.user) && Number(current.p_owner_id) !== Number(req.user?.p_owner_id)) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this employee" });
        }

        const {
            first_name,
            last_name,
            email,
            phone,
            password,
            role_id,
            avatar_url,
            gender,
            date_of_birth,
            joining_date,
            salary,
            designation,
            department,
            employment_type,
            emergency_contact_name,
            emergency_contact_phone,
            address,
            id_proof_type,
            id_proof_number,
            status,
            property_ids,
            primary_property_id
        } = req.body || {};

        const userId = getUserIdFromRequest(req);
        let passwordToSet = current.password;
        if (password) {
            passwordToSet = await bcrypt.hash(password.toString(), 10);
        }

        const normalizedEmail = email ? email.toString().trim().toLowerCase() : current.email;
        const normalizedPhone = phone ? phone.toString().trim() : current.phone;

        if (email || phone) {
            const [duplicate] = await db.query(
                "SELECT employee_id FROM employees WHERE (email = ? OR phone = ?) AND employee_id != ? AND delete_status = FALSE LIMIT 1",
                [normalizedEmail, normalizedPhone, employeeId]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ success: false, message: "Another active employee with this email or phone already exists" });
            }
        }

        // Enforce: each property can only have one Property Manager assigned
        const assignedProps = Array.isArray(property_ids) ? property_ids.map(Number) : null;
        const targetRoleId = role_id !== undefined ? Number(role_id) : current.role_id;
        const [roleCheck] = await db.query("SELECT role_name, role_slug FROM employee_roles WHERE role_id = ? LIMIT 1", [targetRoleId]);
        const isPropertyManagerRole =
            roleCheck[0]?.role_slug === "property-manager" ||
            roleCheck[0]?.role_name?.toLowerCase().includes("property manager");

        if (isPropertyManagerRole && (status === undefined || status === "Active")) {
            let checkProps = assignedProps;
            if (!checkProps) {
                const [currentAssigned] = await db.query(
                    "SELECT property_id FROM property_employees WHERE employee_id = ? AND delete_status = FALSE AND status = 'Active'",
                    [employeeId]
                );
                checkProps = currentAssigned.map(p => p.property_id);
            }

            if (checkProps.length > 0) {
                const [conflicts] = await db.query(
                    `SELECT pe.property_id, p.property_name, e.first_name, e.last_name, e.employee_id
                     FROM property_employees pe
                     INNER JOIN properties p ON p.property_id = pe.property_id
                     INNER JOIN employees e ON e.employee_id = pe.employee_id
                     INNER JOIN employee_roles r ON r.role_id = e.role_id
                     WHERE pe.property_id IN (?)
                       AND (r.role_slug = 'property-manager' OR LOWER(r.role_name) LIKE '%property manager%')
                       AND e.employee_id != ?
                       AND e.delete_status = FALSE
                       AND pe.delete_status = FALSE
                       AND pe.status = 'Active'
                     LIMIT 1`,
                    [checkProps, employeeId]
                );

                if (conflicts.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Property '${conflicts[0].property_name}' already has an active Property Manager (${conflicts[0].first_name} ${conflicts[0].last_name}). Each property can only have one assigned Property Manager.`
                    });
                }
            }
        }

        const updatedEmployee = await withTransaction(async (conn) => {
            await conn.query(
                `UPDATE employees SET
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone = ?,
                    password = ?,
                    role_id = ?,
                    avatar_url = ?,
                    gender = ?,
                    date_of_birth = ?,
                    joining_date = ?,
                    salary = ?,
                    designation = ?,
                    department = ?,
                    employment_type = ?,
                    emergency_contact_name = ?,
                    emergency_contact_phone = ?,
                    address = ?,
                    id_proof_type = ?,
                    id_proof_number = ?,
                    status = ?,
                    updated_by = ?
                 WHERE employee_id = ? AND delete_status = FALSE`,
                [
                    first_name !== undefined ? first_name.toString().trim() : current.first_name,
                    last_name !== undefined ? last_name.toString().trim() : current.last_name,
                    normalizedEmail,
                    normalizedPhone,
                    passwordToSet,
                    role_id !== undefined ? Number(role_id) : current.role_id,
                    avatar_url !== undefined ? avatar_url : current.avatar_url,
                    gender !== undefined ? gender : current.gender,
                    date_of_birth !== undefined ? date_of_birth : current.date_of_birth,
                    joining_date !== undefined ? joining_date : current.joining_date,
                    salary !== undefined ? Number(salary) : current.salary,
                    designation !== undefined ? designation : current.designation,
                    department !== undefined ? department : current.department,
                    employment_type !== undefined ? employment_type : current.employment_type,
                    emergency_contact_name !== undefined ? emergency_contact_name : current.emergency_contact_name,
                    emergency_contact_phone !== undefined ? emergency_contact_phone : current.emergency_contact_phone,
                    address !== undefined ? address : current.address,
                    id_proof_type !== undefined ? id_proof_type : current.id_proof_type,
                    id_proof_number !== undefined ? id_proof_number : current.id_proof_number,
                    status !== undefined ? status : current.status,
                    userId,
                    employeeId
                ]
            );

            // Update assigned properties if provided
            if (Array.isArray(property_ids)) {
                // Soft deactivate unlisted properties
                if (property_ids.length > 0) {
                    await conn.query(
                        `UPDATE property_employees
                         SET status = 'Inactive', delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
                         WHERE employee_id = ? AND property_id NOT IN (?) AND delete_status = FALSE`,
                        [userId, employeeId, property_ids]
                    );
                } else {
                    await conn.query(
                        `UPDATE property_employees
                         SET status = 'Inactive', delete_status = TRUE, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
                         WHERE employee_id = ? AND delete_status = FALSE`,
                        [userId, employeeId]
                    );
                }

                // Upsert selected properties
                for (const propId of property_ids) {
                    const isPrimary = Number(primary_property_id) === Number(propId);
                    await conn.query(
                        `INSERT INTO property_employees (
                            property_id, employee_id, is_primary, status, delete_status, created_by, updated_by
                        ) VALUES (?, ?, ?, 'Active', FALSE, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            is_primary = VALUES(is_primary),
                            status = 'Active',
                            delete_status = FALSE,
                            updated_by = VALUES(updated_by)`,
                        [propId, employeeId, isPrimary, userId, userId]
                    );
                }
            }

            const [updated] = await conn.query(
                `SELECT e.employee_id, e.uuid, e.p_owner_id, e.role_id, e.first_name, e.last_name,
                        e.email, e.phone, e.avatar_url, e.designation, e.department, e.status, e.updated_at
                 FROM employees e WHERE e.employee_id = ? AND e.delete_status = FALSE LIMIT 1`,
                [employeeId]
            );

            return updated[0];
        });

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: updatedEmployee
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to update employee" });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = Number(id);

        const [existing] = await db.query(
            "SELECT * FROM employees WHERE employee_id = ? AND delete_status = FALSE LIMIT 1",
            [employeeId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const current = existing[0];
        if (!isAdmin(req.user) && Number(current.p_owner_id) !== Number(req.user?.p_owner_id)) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this employee" });
        }

        const userId = getUserIdFromRequest(req);

        await withTransaction(async (conn) => {
            // Soft delete employee
            await conn.query(
                `UPDATE employees
                 SET status = 'Inactive',
                     delete_status = TRUE,
                     deleted_at = CURRENT_TIMESTAMP,
                     deleted_by = ?
                 WHERE employee_id = ? AND delete_status = FALSE`,
                [userId, employeeId]
            );

            // Soft delete property mappings
            await conn.query(
                `UPDATE property_employees
                 SET status = 'Inactive',
                     delete_status = TRUE,
                     deleted_at = CURRENT_TIMESTAMP,
                     deleted_by = ?
                 WHERE employee_id = ? AND delete_status = FALSE`,
                [userId, employeeId]
            );
        });

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return res.status(500).json({ success: false, message: "Failed to delete employee" });
    }
};

const assignEmployeeProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = Number(id);
        const { property_id, is_primary = false } = req.body || {};

        if (!property_id) {
            return res.status(400).json({ success: false, message: "property_id is required" });
        }

        const [emp] = await db.query(
            "SELECT employee_id, p_owner_id FROM employees WHERE employee_id = ? AND delete_status = FALSE LIMIT 1",
            [employeeId]
        );

        if (emp.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        if (!isAdmin(req.user) && Number(emp[0].p_owner_id) !== Number(req.user?.p_owner_id)) {
            return res.status(403).json({ success: false, message: "Unauthorized to manage this employee" });
        }

        const userId = getUserIdFromRequest(req);

        await db.query(
            `INSERT INTO property_employees (
                property_id, employee_id, is_primary, status, delete_status, created_by, updated_by
            ) VALUES (?, ?, ?, 'Active', FALSE, ?, ?)
            ON DUPLICATE KEY UPDATE
                is_primary = VALUES(is_primary),
                status = 'Active',
                delete_status = FALSE,
                updated_by = VALUES(updated_by)`,
            [Number(property_id), employeeId, Boolean(is_primary), userId, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Property assigned to employee successfully"
        });
    } catch (error) {
        console.error("Error assigning property to employee:", error);
        return res.status(500).json({ success: false, message: error.sqlMessage || "Failed to assign property" });
    }
};

const unassignEmployeeProperty = async (req, res) => {
    try {
        const { id, propertyId } = req.params;
        const employeeId = Number(id);
        const propId = Number(propertyId);

        const [emp] = await db.query(
            "SELECT employee_id, p_owner_id FROM employees WHERE employee_id = ? AND delete_status = FALSE LIMIT 1",
            [employeeId]
        );

        if (emp.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        if (!isAdmin(req.user) && Number(emp[0].p_owner_id) !== Number(req.user?.p_owner_id)) {
            return res.status(403).json({ success: false, message: "Unauthorized to manage this employee" });
        }

        const userId = getUserIdFromRequest(req);

        const [result] = await db.query(
            `UPDATE property_employees
             SET status = 'Inactive',
                 delete_status = TRUE,
                 deleted_at = CURRENT_TIMESTAMP,
                 deleted_by = ?
             WHERE employee_id = ? AND property_id = ? AND delete_status = FALSE`,
            [userId, employeeId, propId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Property assignment not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Property unassigned successfully"
        });
    } catch (error) {
        console.error("Error unassigning property from employee:", error);
        return res.status(500).json({ success: false, message: "Failed to unassign property" });
    }
};

const getPropertyEmployees = async (req, res) => {
    try {
        const propertyId = Number(req.params.propertyId || req.params.id);
        if (!propertyId) {
            return res.status(400).json({ success: false, message: "propertyId is required" });
        }

        const [rows] = await db.query(
            `SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone,
                    e.designation, e.department, e.status, e.avatar_url,
                    r.role_name, r.role_slug,
                    pe.is_primary, pe.status AS assignment_status, pe.created_at AS assigned_at
             FROM property_employees pe
             INNER JOIN employees e ON e.employee_id = pe.employee_id
             INNER JOIN employee_roles r ON r.role_id = e.role_id
             WHERE pe.property_id = ? AND pe.status = 'Active' AND pe.delete_status = FALSE
               AND e.delete_status = FALSE AND r.delete_status = FALSE
             ORDER BY pe.is_primary DESC, e.first_name ASC`,
            [propertyId]
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching property employees:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch property employees" });
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    assignEmployeeProperty,
    unassignEmployeeProperty,
    getPropertyEmployees
};