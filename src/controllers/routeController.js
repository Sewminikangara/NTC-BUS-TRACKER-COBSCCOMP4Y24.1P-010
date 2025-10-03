/**
 * Route Controller
 * 
 * Handles all route-related operations for inter-provincial bus routes.
 * Implements full CRUD with filtering, sorting, and pagination.
 * 
 * @module controllers/routeController
 */

const Route = require('../models/Route');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

/**
 * Get all routes with filtering, sorting, and pagination
 * 
 * @route GET /api/routes
 * @access Public
 * 
 * @query {string} origin - Filter by origin city
 * @query {string} destination - Filter by destination city
 * @query {string} status - Filter by status (active/inactive/suspended)
 * @query {number} distance[gte] - Filter by minimum distance
 * @query {number} distance[lte] - Filter by maximum distance
 * @query {string} sort - Sort fields (e.g., 'distance,-fare')
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @query {string} fields - Select specific fields
 */
exports.getAllRoutes = asyncHandler(async (req, res) => {
    // Get total count for pagination
    const totalRoutes = await Route.countDocuments();

    // Build query with filtering, sorting, pagination
    const features = new APIFeatures(Route.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const routes = await features.query;

    // Get pagination metadata
    const pagination = features.getPaginationMeta(totalRoutes);

    res.status(200).json({
        status: 'success',
        results: routes.length,
        pagination,
        data: {
            routes,
        },
    });
});

/**
 * Get single route by ID
 * 
 * @route GET /api/routes/:id
 * @access Public
 */
exports.getRoute = asyncHandler(async (req, res) => {
    const route = await Route.findById(req.params.id);

    if (!route) {
        throw new ApiError('Route not found', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            route,
        },
    });
});

/**
 * Create new route
 * 
 * @route POST /api/routes
 * @access Private (Admin only)
 */
exports.createRoute = asyncHandler(async (req, res) => {
    const route = await Route.create(req.body);

    logger.info(`New route created: ${route.routeNumber} by user ${req.user.email}`);

    res.status(201).json({
        status: 'success',
        message: 'Route created successfully',
        data: {
            route,
        },
    });
});

/**
 * Update route
 * 
 * @route PUT /api/routes/:id
 * @access Private (Admin only)
 */
exports.updateRoute = asyncHandler(async (req, res) => {
    const route = await Route.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!route) {
        throw new ApiError('Route not found', 404);
    }

    logger.info(`Route updated: ${route.routeNumber} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Route updated successfully',
        data: {
            route,
        },
    });
});

/**
 * Delete route
 * 
 * @route DELETE /api/routes/:id
 * @access Private (Admin only)
 */
exports.deleteRoute = asyncHandler(async (req, res) => {
    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
        throw new ApiError('Route not found', 404);
    }

    logger.info(`Route deleted: ${route.routeNumber} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Route deleted successfully',
        data: null,
    });
});

/**
 * Get routes by origin and destination
 * 
 * @route GET /api/routes/search
 * @access Public
 * @query {string} origin - Origin city (required)
 * @query {string} destination - Destination city (required)
 */
exports.searchRoutes = asyncHandler(async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
        throw new ApiError('Please provide both origin and destination', 400);
    }

    const routes = await Route.find({
        origin: new RegExp(origin, 'i'),
        destination: new RegExp(destination, 'i'),
        status: 'active',
    }).sort('distance');

    res.status(200).json({
        status: 'success',
        results: routes.length,
        data: {
            routes,
        },
    });
});

/**
 * Get route statistics
 * 
 * @route GET /api/routes/stats
 * @access Public
 */
exports.getRouteStats = asyncHandler(async (req, res) => {
    const stats = await Route.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgDistance: { $avg: '$distance' },
                avgFare: { $avg: '$fare' },
                totalDistance: { $sum: '$distance' },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);

    const totalRoutes = await Route.countDocuments();

    res.status(200).json({
        status: 'success',
        data: {
            totalRoutes,
            stats,
        },
    });
});

module.exports = exports;
