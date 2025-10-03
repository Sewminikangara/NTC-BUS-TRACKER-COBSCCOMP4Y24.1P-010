/**
 * Request Validation Middleware
 * 
 * 
 * @module middleware/validate
 */

const Joi = require('joi');
const { ApiError } = require('./errorHandler');

/**
 * Validate request data against Joi schema
 * 
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Middleware function
 */
const validate = (schema) => (req, res, next) => {
    const validSchema = Object.keys(schema).filter(
        (key) => ['body', 'query', 'params'].includes(key),
    );

    const object = validSchema.reduce((acc, key) => {
        acc[key] = req[key];
        return acc;
    }, {});

    const { value, error } = Joi.compile(schema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

    if (error) {
        const errorMessage = error.details
            .map((details) => details.message)
            .join(', ');
        return next(new ApiError(errorMessage, 400));
    }

    Object.assign(req, value);
    return next();
};

module.exports = validate;
