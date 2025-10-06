/**
 * ETag Middleware
 * Generates and validates ETags for caching
 */

const crypto = require('crypto');

/**
 * Generate ETag hash from data
 * @param {Object} data - Data to generate ETag for
 * @returns {String} ETag hash
 */
const generateETag = (data) => {
    const hash = crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
    return `"${hash}"`;
};

/**
 * ETag middleware for conditional requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const etagMiddleware = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }

    const originalJson = res.json.bind(res);

    res.json = function (data) {
        const etag = generateETag(data);

        res.setHeader('ETag', etag);

        res.setHeader('Cache-Control', 'private, must-revalidate, max-age=300');

        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === etag) {
            return res.status(304).end();
        }

        return originalJson(data);
    };

    next();
};

module.exports = etagMiddleware;

