const db = require("../config/db");

/**
 * Check if the user has an admin role
 * @param {object} user 
 * @returns {boolean}
 */
const isAdmin = (user = {}) => {
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
const isOwner = (user = {}) => {
    return Boolean(user.p_owner_id);
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
 * Middleware to verify that the logged-in user owns the property
 * (or is an admin who can manage any property)
 */
const requirePropertyOwnership = async (req, res, next) => {
    try {
        const propertyId = Number(req.params.propertyId || req.params.id || req.body.property_id);
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: "Property ID is required"
            });
        }

        if (isAdmin(req.user)) {
            return next();
        }

        const ownerId = Number(req.user?.p_owner_id);
        if (!ownerId) {
            return res.status(403).json({
                success: false,
                message: "Property owner identity required"
            });
        }

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
        next();
    } catch (error) {
        console.error("Property ownership check error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authorization check"
        });
    }
};

module.exports = {
    isAdmin,
    isOwner,
    requireAdmin,
    requireOwner,
    requireOwnerOrAdmin,
    requirePropertyOwnership
};
