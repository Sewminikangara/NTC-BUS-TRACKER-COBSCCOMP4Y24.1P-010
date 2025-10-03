/**
 * Bus Controller
 * 
 * Handles all bus-related operations including CRUD and advanced queries.
 * Implements filtering, sorting, and pagination for Level 5 compliance.
 * 
 * @module controllers/busController
 */

const Bus = require('../models/Bus');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

/**
 * Get all buses with filtering, sorting, and pagination
 * 
 * @route GET /api/buses
 * @access Public
 * 
 * @query {string} routeId - Filter by route ID
 * @query {string} operatorId - Filter by operator ID
 * @query {string} status - Filter by status
 * @query {number} capacity[gte] - Min capacity
 * @query {string} sort - Sort fields
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 */
exports.getAllBuses = asyncHandler(async (req, res) => {
    const totalBuses = await Bus.countDocuments();

    const features = new APIFeatures(Bus.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const buses = await features.query;

    const pagination = features.getPaginationMeta(totalBuses);

    res.status(200).json({
        status: 'success',
        results: buses.length,
        pagination,
        data: {
            buses,
        },
    });
});

/**
 * Get single bus by ID
 * 
 * @route GET /api/buses/:id
 * @access Public
 */
exports.getBus = asyncHandler(async (req, res) => {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
        throw new ApiError('Bus not found', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            bus,
        },
    });
});

/**
 * Create new bus
 * 
 * @route POST /api/buses
 * @access Private (Admin only)
 */
exports.createBus = asyncHandler(async (req, res) => {
    const bus = await Bus.create(req.body);

    logger.info(`New bus created: ${bus.registrationNumber} by user ${req.user.email}`);

    res.status(201).json({
        status: 'success',
        message: 'Bus created successfully',
        data: {
            bus,
        },
    });
});

/**
 * Update bus
 * 
 * @route PUT /api/buses/:id
 * @access Private (Admin only)
 */
exports.updateBus = asyncHandler(async (req, res) => {
    const bus = await Bus.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!bus) {
        throw new ApiError('Bus not found', 404);
    }

    logger.info(`Bus updated: ${bus.registrationNumber} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Bus updated successfully',
        data: {
            bus,
        },
    });
});

/**
 * Delete bus
 * 
 * @route DELETE /api/buses/:id
 * @access Private (Admin only)
 */
exports.deleteBus = asyncHandler(async (req, res) => {
    const bus = await Bus.findByIdAndDelete(req.params.id);

    if (!bus) {
        throw new ApiError('Bus not found', 404);
    }

    logger.info(`Bus deleted: ${bus.registrationNumber} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Bus deleted successfully',
        data: null,
    });
});

/**
 * Get buses by route
 * 
 * @route GET /api/buses/route/:routeId
 * @access Public
 */
exports.getBusesByRoute = asyncHandler(async (req, res) => {
    const buses = await Bus.find({
        routeId: req.params.routeId,
        status: { $in: ['active', 'maintenance'] },
    }).sort('registrationNumber');

    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: {
            buses,
        },
    });
});

/**
 * Get buses by operator
 * 
 * @route GET /api/buses/operator/:operatorId
 * @access Public
 */
exports.getBusesByOperator = asyncHandler(async (req, res) => {
    const buses = await Bus.find({
        operatorId: req.params.operatorId,
    }).sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: {
            buses,
        },
    });
});

/**
 * Get bus statistics
 * 
 * @route GET /api/buses/stats
 * @access Public
 */
exports.getBusStats = asyncHandler(async (req, res) => {
    const stats = await Bus.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgCapacity: { $avg: '$capacity' },
                totalCapacity: { $sum: '$capacity' },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);

    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });

    res.status(200).json({
        status: 'success',
        data: {
            totalBuses,
            activeBuses,
            stats,
        },
    });
});

/**
 * Check buses due for maintenance
 * 
 * @route GET /api/buses/maintenance/due
 * @access Private (Admin/Operator)
 */
exports.getMaintenanceDue = asyncHandler(async (req, res) => {
    const buses = await Bus.find({
        nextMaintenance: { $lte: new Date() },
        status: { $ne: 'retired' },
    }).sort('nextMaintenance');

    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: {
            buses,
        },
    });
});

module.exports = exports;
