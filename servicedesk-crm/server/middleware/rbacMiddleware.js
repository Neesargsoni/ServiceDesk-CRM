// server/middleware/rbacMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// Check if user has required role
export const requireRole = (roles) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                role: decoded.role || "user"
            };

            // Check if user has required role
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    error: "Access denied. Insufficient permissions.",
                    requiredRole: roles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (err) {
            console.error("RBAC middleware error:", err);
            return res.status(401).json({ error: "Invalid token" });
        }
    };
};

// Admin only
export const adminOnly = requireRole(["admin"]);

// Admin or Agent
export const agentOrAdmin = requireRole(["admin", "agent"]);

// Any authenticated user
export const authenticated = requireRole(["user", "agent", "admin"]);