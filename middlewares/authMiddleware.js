// authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { User } from '../models/index.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = await User.findById(decoded.id)
            .select('-password')
            .populate('role', 'name permissions');

        if (!req.user) {
            res.status(401);
            throw new Error("Not authorized, User not Found");
        }

        next();
    } catch (e) {
        console.error(e);
        res.status(401);
        throw new Error("Not Authorized, Token Failed");
    }
});

// Role-based middleware
const roleCheck = (allowedRoles = []) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user?.role) {
            res.status(401);
            throw new Error("User role not found");
        }

        if (allowedRoles.includes(req.user.role.name)) {
            next();
        } else {
            res.status(403);
            throw new Error(`Not authorized. Requires role: ${allowedRoles.join(', ')}`);
        }
    });
};

// Specific role middlewares
const admin = roleCheck(['Administrator']);
const projectManager = roleCheck(['Project Manager']);
const qaEngineer = roleCheck(['QA Engineer']);
const developer = roleCheck(['Developer']);
const designer = roleCheck(['Designer']);
const manager = roleCheck(['Manager']);
const sales = roleCheck(['Sales']);
const adminOrManager = roleCheck(['Administrator', 'Manager'])

export { protect, adminOrManager, admin, sales, projectManager, qaEngineer, developer, designer, roleCheck, manager };