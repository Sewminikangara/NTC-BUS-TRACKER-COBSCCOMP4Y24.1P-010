/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */

const { ApiError } = require('./errorHandler');

/**
 * Handle undefined routes and send 404 error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
    const message = `Cannot find ${req.originalUrl} on this server!`;
    next(new ApiError(message, 404));
};

module.exports = notFound;

