/**
 * Operator Controller
 * 
 * Handles bus operator/company management operations.
 * Implements full CRUD with filtering and sorting.
 * 
 * @module controllers/operatorController
 */

const Operator = require('../models/Operator');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

/**
 * Get all operators with filtering, sorting, and pagination
 * 
 * @route GET /api/operators
 * @access Public
 * 
 * @query {string} status - Filter by status
 * @query {string} sort - Sort fields
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 */
exports.getAllOperators = asyncHandler(async (req, res) => {
    const totalOperators = await Operator.countDocuments();

    const features = new APIFeatures(Operator.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const operators = await features.query;

    const pagination = features.getPaginationMeta(totalOperators);

    res.status(200).json({
        status: 'success',
        results: operators.length,
        pagination,
        data: {
            operators,
        },
    });
});

/**
 * Get single operator by ID
 * 
 * @route GET /api/operators/:id
 * @access Public
 */
exports.getOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
        throw new ApiError('Operator not found', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            operator,
        },
    });
});

/**
 * Create new operator
 * 
 * @route POST /api/operators
 * @access Private (Admin only)
 */
exports.createOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.create(req.body);

    logger.info(`New operator created: ${operator.name} by user ${req.user.email}`);

    res.status(201).json({
        status: 'success',
        message: 'Operator created successfully',
        data: {
            operator,
        },
    });
});

/**
 * Update operator
 * 
 * @route PUT /api/operators/:id
 * @access Private (Admin only)
 */
exports.updateOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!operator) {
        throw new ApiError('Operator not found', 404);
    }

    logger.info(`Operator updated: ${operator.name} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Operator updated successfully',
        data: {
            operator,
        },
    });
});

/**
 * Delete operator
 * 
 * @route DELETE /api/operators/:id
 * @access Private (Admin only)
 */
exports.deleteOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.findByIdAndDelete(req.params.id);

    if (!operator) {
        throw new ApiError('Operator not found', 404);
    }

    logger.info(`Operator deleted: ${operator.name} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Operator deleted successfully',
        data: null,
    });
});

/**
 * Get operators with expired licenses
 * 
 * @route GET /api/operators/licenses/expired
 * @access Private (Admin only)
 */
exports.getExpiredLicenses = asyncHandler(async (req, res) => {
    const operators = await Operator.find({
        licenseExpiry: { $lt: new Date() },
    }).sort('licenseExpiry');

    res.status(200).json({
        status: 'success',
        results: operators.length,
        data: {
            operators,
        },
    });
});

/**
 * Get operators with licenses expiring soon
 * 
 * @route GET /api/operators/licenses/expiring-soon
 * @access Private (Admin only)
 * @query {number} days - Days ahead to check (default: 30)
 */
exports.getExpiringLicenses = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const operators = await Operator.find({
        licenseExpiry: {
            $gte: new Date(),
            $lte: futureDate,
        },
    }).sort('licenseExpiry');

    res.status(200).json({
        status: 'success',
        results: operators.length,
        message: `Operators with licenses expiring in the next ${days} days`,
        data: {
            operators,
        },
    });
});

/**
 * Get operator statistics
 * 
 * @route GET /api/operators/stats
 * @access Public
 */
exports.getOperatorStats = asyncHandler(async (req, res) => {
    const stats = await Operator.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);

    const totalOperators = await Operator.countDocuments();
    const activeOperators = await Operator.countDocuments({ status: 'active' });
    const expiredLicenses = await Operator.countDocuments({
        licenseExpiry: { $lt: new Date() },
    });

    res.status(200).json({
        status: 'success',
        data: {
            totalOperators,
            activeOperators,
            expiredLicenses,
            stats,
        },
    });
});

module.exports = exports;
