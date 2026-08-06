const isAdmin = (user = {}) => {
    const role = String(user.role || user.user_type || user.type || "").toLowerCase();

    return Boolean(
        user.is_admin === true ||
        user.isAdmin === true ||
        user.is_super_admin === true ||
        user.super_admin === true ||
        ["admin", "super_admin", "superadmin"].includes(role)
    );
};

const requireAdmin = (req, res, next) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required"
        });
    }

    return next();
};

module.exports = {
    isAdmin,
    requireAdmin
};
