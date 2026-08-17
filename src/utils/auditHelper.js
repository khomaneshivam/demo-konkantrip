/**
 * Extracts the relevant User/Actor ID from the authenticated request token.
 * Priority: Property Owner ID -> Admin ID -> Employee ID -> null
 * @param {object} req - Express request object
 * @returns {number|null}
 */
const getUserIdFromRequest = (req) => {
    const user = req?.user;
    if (!user) return null;

    if (user.p_owner_id !== undefined && user.p_owner_id !== null) {
        return Number(user.p_owner_id);
    }

    if (user.admin_id !== undefined && user.admin_id !== null) {
        return Number(user.admin_id);
    }

    if (user.employee_id !== undefined && user.employee_id !== null) {
        return Number(user.employee_id);
    }

    return null;
};

/**
 * Returns the actor type of the authenticated user
 * @param {object} req 
 * @returns {"owner"|"admin"|"employee"|"system"}
 */
const getUserTypeFromRequest = (req) => {
    const user = req?.user;
    if (!user) return "system";

    if (user.admin_id || user.role === "admin" || user.role === "super_admin") {
        return "admin";
    }

    if (user.p_owner_id || user.role === "owner") {
        return "owner";
    }

    if (user.employee_id || user.role === "employee") {
        return "employee";
    }

    return "system";
};

module.exports = {
    getUserIdFromRequest,
    getUserTypeFromRequest
};