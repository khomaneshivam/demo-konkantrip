const jwt = require("jsonwebtoken");
const tokenCache = require("../utils/tokenCache");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        if (tokenCache.isRevoked(token)) {
            return res.status(401).json({
                success: false,
                message: "Token has been revoked. Please log in again."
            });
        }

        // Check token cache first
        let user = tokenCache.get(token);

        if (!user) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
            
            // Normalize role
            const role = decoded.role || (decoded.admin_id ? "admin" : (decoded.p_owner_id ? "owner" : (decoded.employee_id ? "employee" : "guest")));
            user = {
                ...decoded,
                role,
                permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
                assigned_properties: Array.isArray(decoded.assigned_properties) ? decoded.assigned_properties : []
            };

            // Store in cache for subsequent requests
            tokenCache.set(token, user);
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;
