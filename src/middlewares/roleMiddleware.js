const db = require("../config/db");

/**
 * Check if the user has an admin role
 * @param {object} user 
 * @returns {boolean}
 */
const isAdmin = (user) => {
    if (!user || typeof user !== "object") return false;
    const role = String(user.role || user.user_type || user.type || "").toLowerCase();
    return Boolean(
        user.admin_id ||
        user.is_admin === true ||
        user.isAdmin === true ||
        ["admin", "super_admin", "superadmin"].includes(role)
    );
};

/**
 * Check if the user is a property owner
 * @param {object} user 
 * @returns {boolean}
 */
const isOwner = (user) => {
    if (!user || typeof user !== "object") return false;
    return Boolean(user.p_owner_id);
};

/**
 * Check if the user is an employee
 * @param {object} user 
 * @returns {boolean}
 */
const isEmployee = (user) => {
    if (!user || typeof user !== "object") return false;
    const role = String(user.role || user.user_type || "").toLowerCase();
    return Boolean(user.employee_id || role === "employee");
};

/**
 * Require Administrator privileges
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || !isAdmin(req.user)) {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required"
        });
    }
    next();
};

/**
 * Require Property Owner privileges
 */
const requireOwner = (req, res, next) => {
    if (!req.user || (!isOwner(req.user) && !isAdmin(req.user))) {
        return res.status(403).json({
            success: false,
            message: "Property owner access is required"
        });
    }
    next();
};

/**
 * Require either Owner or Administrator
 */
const requireOwnerOrAdmin = (req, res, next) => {
    if (!req.user || (!isOwner(req.user) && !isAdmin(req.user))) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Property owner or administrator required."
        });
    }
    next();
};

/**
 * Require Employee privileges
 */
const requireEmployee = (req, res, next) => {
    if (!req.user || !isEmployee(req.user)) {
        return res.status(403).json({
            success: false,
            message: "Employee access is required"
        });
    }
    next();
};

/**
 * Check if user matches any of the given roles
 * @param  {...string} allowedRoles 
 */
const requireRole = (...allowedRoles) => {
    const normalized = allowedRoles.map(r => r.toLowerCase());
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        if (isAdmin(req.user)) return next();

        const role = String(req.user.role || "").toLowerCase();
        if (normalized.includes(role) || (isOwner(req.user) && normalized.includes("owner")) || (isEmployee(req.user) && normalized.includes("employee"))) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${allowedRoles.join(" or ")}`
        });
    };
};

/**
 * RBAC Permission Middleware
 * Property owners and super-admins bypass this check.
 * Employees must have the permission in their role permissions.
 * @param {string} permissionCode 
 */
const requirePermission = (permissionCode) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        // Owners and Admins bypass permission checks
        if (isAdmin(req.user) || isOwner(req.user)) {
            return next();
        }

        // Check employee permissions array
        const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
        if (userPermissions.includes(permissionCode) || userPermissions.includes("*")) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Forbidden. You do not have permission: '${permissionCode}'`
        });
    };
};

/**
 * Middleware to verify that the logged-in user owns or is assigned to manage the property
 * (or is an admin who can manage any property)
 */
const requirePropertyOwnership = async (req, res, next) => {
    try {
        const propertyId = Number(req.params.propertyId || req.params.id || req.body.property_id || req.query.property_id);
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

        // Admin bypass
        if (isAdmin(req.user)) {
            return next();
        }

        // Check Property Owner
        if (isOwner(req.user)) {
            const ownerId = Number(req.user.p_owner_id);
            const [rows] = await db.query(
                "SELECT property_id, p_owner_id FROM properties WHERE property_id = ? AND delete_status = FALSE LIMIT 1",
                [propertyId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Property not found"
                });
            }

            if (Number(rows[0].p_owner_id) !== ownerId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to manage this property"
                });
            }

            req.property = rows[0];
            return next();
        }

        // Check Employee Assigned Property
        if (isEmployee(req.user)) {
            const employeeId = Number(req.user.employee_id);
            const assignedList = Array.isArray(req.user.assigned_properties) ? req.user.assigned_properties.map(Number) : [];

            if (assignedList.includes(propertyId)) {
                return next();
            }

            // Fallback DB verification for assigned property
            const [mapping] = await db.query(
                `SELECT mapping_id, property_id, employee_id 
                 FROM property_employees 
                 WHERE property_id = ? AND employee_id = ? AND status = 'Active' AND delete_status = FALSE 
                 LIMIT 1`,
                [propertyId, employeeId]
            );

            if (mapping.length > 0) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: "You are not assigned to manage this property"
            });
        }

        return res.status(403).json({
            success: false,
            message: "Property management identity required"
        });
    } catch (error) {
        console.error("Property authorization check error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authorization check"
        });
    }
};

module.exports = {
    isAdmin,
    isOwner,
    isEmployee,
    requireAdmin,
    requireOwner,
    requireOwnerOrAdmin,
    requireEmployee,
    requireRole,
    requirePermission,
    requirePropertyOwnership
};
