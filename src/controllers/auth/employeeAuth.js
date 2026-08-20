const db = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tokenCache = require("../../utils/tokenCache");
const { getRequestMetadata } = require("../../utils/requestMetadata");
const SessionService = require("../../services/sessionService");
const AuditService = require("../../services/auditService");
require("dotenv").config();

const buildEmployeeTokenPayload = (employee, permissions = [], assignedProperties = []) => ({
    employee_id: employee.employee_id,
    uuid: employee.uuid,
    p_owner_id: employee.p_owner_id,
    role_id: employee.role_id,
    role_name: employee.role_name,
    role_slug: employee.role_slug,
    role: "employee",
    email: employee.email,
    first_name: employee.first_name,
    last_name: employee.last_name,
    phone: employee.phone,
    designation: employee.designation,
    department: employee.department,
    permissions: Array.isArray(permissions) ? permissions : [],
    assigned_properties: Array.isArray(assignedProperties) ? assignedProperties.map(Number) : []
});

const createEmployeeToken = (employee, permissions = [], assignedProperties = [], rememberMe = false) => {
    const expiresIn = rememberMe
        ? (process.env.JWT_REMEMBER_EXPIRE || "30d")
        : (process.env.JWT_EXPIRE || "1d");

    return jwt.sign(
        buildEmployeeTokenPayload(employee, permissions, assignedProperties),
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn }
    );
};

const insertEmployeeLoginLog = async (req, { employeeId, email, loginStatus, failureReason, sessionId, jwtId }) => {
    try {
        const meta = getRequestMetadata(req);

        await db.query(
            `INSERT INTO employee_login_logs (
                employee_id, email, login_status, failure_reason,
                ip_address, user_agent, device_type, browser,
                operating_system, session_id, jwt_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employeeId || null,
                email || null,
                loginStatus,
                failureReason || null,
                meta.ip_address,
                meta.user_agent,
                meta.device_type,
                meta.browser,
                meta.operating_system,
                sessionId || null,
                jwtId || null
            ]
        );
    } catch (err) {
        console.error("Failed to insert employee login log:", err.message);
    }
};

const loginEmployee = async (req, res) => {
    try {
        const email = req.body?.email?.toString().trim().toLowerCase();
        const password = req.body?.password?.toString();
        const sessionId = req.headers["x-session-id"] || null;
        const jwtId = req.headers["x-jwt-id"] || null;

        if (!email || !password) {
            await insertEmployeeLoginLog(req, {
                employeeId: null,
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

        // Fetch employee with role and owner check
        const [rows] = await db.query(
            `SELECT e.*, r.role_name, r.role_slug, r.is_system_role, po.email AS owner_email
             FROM employees e
             INNER JOIN employee_roles r ON r.role_id = e.role_id
             INNER JOIN property_owners po ON po.p_owner_id = e.p_owner_id
             WHERE e.email = ? AND e.delete_status = FALSE AND po.delete_status = FALSE AND r.delete_status = FALSE
             LIMIT 1`,
            [email]
        );

        if (rows.length === 0) {
            await insertEmployeeLoginLog(req, {
                employeeId: null,
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

        const employee = rows[0];

        if (employee.status !== "Active") {
            await insertEmployeeLoginLog(req, {
                employeeId: employee.employee_id,
                email,
                loginStatus: "FAILED",
                failureReason: `Account is ${employee.status}`,
                sessionId,
                jwtId
            });
            return res.status(403).json({
                success: false,
                message: `Your employee account is ${employee.status}. Please contact your property administrator.`
            });
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            await insertEmployeeLoginLog(req, {
                employeeId: employee.employee_id,
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

        // Fetch permissions for the role
        const [permRows] = await db.query(
            `SELECT p.permission_code
             FROM role_permissions rp
             INNER JOIN permissions p ON p.permission_id = rp.permission_id
             WHERE rp.role_id = ? AND p.is_active = TRUE`,
            [employee.role_id]
        );
        const permissions = permRows.map(r => r.permission_code);

        // Fetch assigned properties
        const [propRows] = await db.query(
            `SELECT pe.property_id, pe.is_primary, p.property_name, p.property_type, p.property_slug
             FROM property_employees pe
             INNER JOIN properties p ON p.property_id = pe.property_id
             WHERE pe.employee_id = ? AND pe.status = 'Active' AND pe.delete_status = FALSE AND p.delete_status = FALSE`,
            [employee.employee_id]
        );
        const assignedProperties = propRows.map(r => r.property_id);

        const rememberMe = Boolean(req.body?.remember_me ?? req.body?.rememberMe);
        const token = createEmployeeToken(employee, permissions, assignedProperties, rememberMe);
        const tokenPayload = buildEmployeeTokenPayload(employee, permissions, assignedProperties);
        const maxAgeMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        // Cache token
        tokenCache.set(token, tokenPayload, maxAgeMs);

        await insertEmployeeLoginLog(req, {
            employeeId: employee.employee_id,
            email: employee.email,
            loginStatus: "SUCCESS",
            failureReason: null,
            sessionId,
            jwtId
        });

        // Record enterprise session
        await SessionService.createSession({
            employee_id: employee.employee_id,
            p_owner_id: employee.p_owner_id,
            token,
            req,
            expires_at: new Date(Date.now() + maxAgeMs)
        });

        // Record to Audit Trail
        await AuditService.logAudit({
            req,
            p_owner_id: employee.p_owner_id,
            employee_id: employee.employee_id,
            user_name: `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.email,
            user_role: employee.role_name || "Staff",
            user_type: "employee",
            module: "Auth",
            action: "LOGIN",
            description: `Staff member logged in successfully (${employee.email})`
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: maxAgeMs
        });

        const { password: _p, ...safeEmployee } = employee;

        return res.status(200).json({
            success: true,
            message: "Employee login successful",
            token,
            user: tokenPayload,
            employee: safeEmployee,
            assigned_properties_details: propRows,
            remember_me: rememberMe
        });
    } catch (error) {
        console.error("Employee login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
};

const getEmployeeProfile = async (req, res) => {
    try {
        const employeeId = req.user?.employee_id;
        if (!employeeId) {
            return res.status(401).json({ success: false, message: "Employee authentication required" });
        }

        const [rows] = await db.query(
            `SELECT e.employee_id, e.uuid, e.p_owner_id, e.role_id, e.first_name, e.last_name,
                    e.email, e.phone, e.avatar_url, e.gender, e.date_of_birth, e.joining_date,
                    e.salary, e.designation, e.department, e.employment_type, e.emergency_contact_name,
                    e.emergency_contact_phone, e.address, e.id_proof_type, e.id_proof_number,
                    e.status, e.created_at, e.updated_at,
                    r.role_name, r.role_slug, r.is_system_role,
                    po.first_name AS owner_first_name, po.last_name AS owner_last_name
             FROM employees e
             INNER JOIN employee_roles r ON r.role_id = e.role_id
             INNER JOIN property_owners po ON po.p_owner_id = e.p_owner_id
             WHERE e.employee_id = ? AND e.delete_status = FALSE AND po.delete_status = FALSE
             LIMIT 1`,
            [employeeId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Employee profile not found" });
        }

        const employee = rows[0];

        // Fetch permissions
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
            [employeeId]
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
        console.error("Error fetching employee profile:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch employee profile" });
    }
};

const updateEmployeePassword = async (req, res) => {
    try {
        const employeeId = req.user?.employee_id;
        const { currentPassword, newPassword, confirmPassword } = req.body || {};

        if (!employeeId) {
            return res.status(401).json({ success: false, message: "Employee authentication required" });
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password, new password, and confirm password are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        const [rows] = await db.query(
            "SELECT password FROM employees WHERE employee_id = ? AND delete_status = FALSE",
            [employeeId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, rows[0].password);
        if (!isCurrentValid) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            "UPDATE employees SET password = ?, updated_by = ? WHERE employee_id = ? AND delete_status = FALSE",
            [hashedPassword, employeeId, employeeId]
        );

        // Terminate all sessions on password reset for security
        await SessionService.revokeAllEmployeeSessions(employeeId, employeeId);

        await AuditService.logAudit({
            req,
            p_owner_id: rows[0].p_owner_id,
            employee_id: employeeId,
            user_name: `${rows[0].first_name || ""} ${rows[0].last_name || ""}`.trim() || rows[0].email,
            user_type: "employee",
            module: "Auth",
            action: "UPDATE",
            description: "Staff member updated account password (all active sessions revoked)"
        });

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Error updating employee password:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const logoutEmployee = async (req, res) => {
    try {
        const token = req.token || req.headers.authorization?.split(" ")[1] || req.cookies?.token;
        if (token) {
            tokenCache.revoke(token);
            await SessionService.revokeSessionByToken(token, req.user?.employee_id);
        }

        if (req.user) {
            await AuditService.logAudit({
                req,
                p_owner_id: req.user.p_owner_id,
                employee_id: req.user.employee_id,
                user_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim() || req.user.email,
                user_role: req.user.role_name || "Staff",
                user_type: "employee",
                module: "Auth",
                action: "LOGOUT",
                description: `Staff member logged out (${req.user.email})`
            });
        }

        res.clearCookie("token");
        return res.status(200).json({
            success: true,
            message: "Employee logged out successfully"
        });
    } catch (error) {
        console.error("Employee logout error:", error);
        return res.status(500).json({ success: false, message: "Failed to logout employee" });
    }
};

module.exports = {
    buildEmployeeTokenPayload,
    createEmployeeToken,
    insertEmployeeLoginLog,
    loginEmployee,
    getEmployeeProfile,
    updateEmployeePassword,
    logoutEmployee
};