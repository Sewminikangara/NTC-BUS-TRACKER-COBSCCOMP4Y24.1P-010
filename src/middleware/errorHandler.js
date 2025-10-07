/**
 * Error Handler Middleware
 * NTC Bus Tracker API - COBSCCOMP24.1P-10
 */
const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        logger.error('ERROR ', err);
        console.error(' API Error:', err.message);
        console.error(' Stack:', err.stack);
        res.status(500).json({
            status: 'error',
            message: err.message || 'Something went wrong!',
            error: process.env.NODE_ENV === 'production' ? err.message : err.stack,
        });
    }

const logger = require('../config/logger');

/**
 * Custom API Error Class
 */
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle MongoDB CastError
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ApiError(message, 400);
};

/**
 * Handle MongoDB duplicate fields error
 */
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ApiError(message, 400);
};

/**
 * Handle MongoDB validation error
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ApiError(message, 400);
};

/**
 * Handle JWT token error
 */
const handleJWTError = () => new ApiError('Invalid token. Please log in again!', 401);

/**
 * Handle JWT expired error
 */
const handleJWTExpiredError = () => new ApiError('Your token has expired! Please log in again.', 401);

/**
 * Send detailed error for development
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

/**
 * Send simplified error for production
 */
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        logger.error('ERROR ðŸ’¥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
        });
    }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev({ ...err, statusCode, status }, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err, statusCode, status };
        error.message = err.message;

        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

module.exports = errorHandler;
module.exports.ApiError = ApiError;
