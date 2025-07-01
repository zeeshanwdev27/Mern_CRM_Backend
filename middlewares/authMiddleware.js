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
        
        // Populate the role when finding the user
        req.user = await User.findById(decoded.id)
            .select('-password')
            .populate('role', 'name'); // Only populate the role name

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


// @desc    Admin-only middleware
const admin = asyncHandler(async (req, res, next) => {
    // Make sure the user is populated with role
    if (!req.user.role) {
        res.status(401);
        throw new Error("User role not found");
    }

    // Check if the role name is "Administrator"
    if (req.user.role.name === "Administrator") {
        next();
    } else {
        res.status(403);
        throw new Error("Not authorized as admin");
    }
});


export { protect, admin };