/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Async handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Protect middleware - requires valid JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization
        && req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new ApiError('You are not logged in! Please log in to get access.', 401),
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = await User.findById(decoded.id).select('-password');
        if (!currentUser) {
            return next(
                new ApiError('The user belonging to this token no longer exists.', 401),
            );
        }

        if (currentUser.status !== 'active') {
            return next(
                new ApiError('Your account is not active. Please contact support.', 401),
            );
        }

        req.user = currentUser;
        next();
    } catch (error) {
        return next(new ApiError('Invalid token. Please log in again!', 401));
    }
});

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
exports.restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next(
            new ApiError('You do not have permission to perform this action', 403),
        );
    }
    next();
};

/**
 * Optional authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
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
        // Silently ignore invalid tokens for optional auth
    }

    next();
});

module.exports.asyncHandler = asyncHandler;

