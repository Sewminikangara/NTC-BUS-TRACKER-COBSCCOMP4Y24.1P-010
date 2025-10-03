/**
 * Authentication Middleware
 * 
 * 
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Async handler wrapper to catch errors in async functions
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Protect routes - Verify JWT token
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (
        req.headers.authorization
        && req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return next(
            new ApiError('You are not logged in! Please log in to get access.', 401),
        );
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const currentUser = await User.findById(decoded.id).select('-password');
        if (!currentUser) {
            return next(
                new ApiError('The user belonging to this token no longer exists.', 401),
            );
        }

        // Check if user is active
        if (currentUser.status !== 'active') {
            return next(
                new ApiError('Your account is not active. Please contact support.', 401),
            );
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        return next(new ApiError('Invalid token. Please log in again!', 401));
    }
});

/**
 * Restrict access to specific roles
 * 
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.restrictTo = (...roles) => (req, res, next) => {
    // roles is an array: ['admin', 'operator']
    if (!roles.includes(req.user.role)) {
        return next(
            new ApiError('You do not have permission to perform this action', 403),
        );
    }
    next();
};

/**
 * Optional authentication - Attach user if token is valid but don't require it
 * Used for endpoints that have different behavior for authenticated users
 * 
 * @middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization
        && req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id).select('-password');

        if (currentUser && currentUser.status === 'active') {
            req.user = currentUser;
        }
    } catch (error) {
        // Token is invalid, but we don't throw error since auth is optional
    }

    next();
});

module.exports.asyncHandler = asyncHandler;
