/**
 * 
 * 
 * @module middleware/notFound
 */

const { ApiError } = require('./errorHandler');

/**
 * Handle 404 - Route not found
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
    const message = `Cannot find ${req.originalUrl} on this server!`;
    next(new ApiError(message, 404));
};

module.exports = notFound;
