/**
 * Trip Controller
 * 
 * Handles all trip-related operations including scheduling and real-time updates.
 * Implements filtering, sorting, and pagination.
 * 
 * @module controllers/tripController
 */

const Trip = require('../models/Trip');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

/**
 * Get all trips with filtering, sorting, and pagination
 * 
 * @route GET /api/trips
 * @access Public
 * 
 * @query {string} routeId - Filter by route ID
 * @query {string} busId - Filter by bus ID
 * @query {string} status - Filter by status
 * @query {date} scheduledDepartureTime[gte] - From date
 * @query {date} scheduledDepartureTime[lte] - To date
 * @query {string} sort - Sort fields
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 */
exports.getAllTrips = asyncHandler(async (req, res) => {
    const totalTrips = await Trip.countDocuments();

    const features = new APIFeatures(Trip.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const trips = await features.query;

    const pagination = features.getPaginationMeta(totalTrips);

    res.status(200).json({
        status: 'success',
        results: trips.length,
        pagination,
        data: {
            trips,
        },
    });
});

/**
 * Get single trip by ID
 * 
 * @route GET /api/trips/:id
 * @access Public
 */
exports.getTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        throw new ApiError('Trip not found', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            trip,
        },
    });
});

/**
 * Create new trip
 * 
 * @route POST /api/trips
 * @access Private (Admin only)
 */
exports.createTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.create(req.body);

    logger.info(`New trip created: ${trip.tripNumber} by user ${req.user.email}`);

    res.status(201).json({
        status: 'success',
        message: 'Trip created successfully',
        data: {
            trip,
        },
    });
});

/**
 * Update trip
 * 
 * @route PUT /api/trips/:id
 * @access Private (Admin/Operator)
 */
exports.updateTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!trip) {
        throw new ApiError('Trip not found', 404);
    }

    logger.info(`Trip updated: ${trip.tripNumber} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Trip updated successfully',
        data: {
            trip,
        },
    });
});

/**
 * Partially update trip (PATCH)
 * 
 * @route PATCH /api/trips/:id
 * @access Private (Operator)
 */
exports.patchTrip = asyncHandler(async (req, res) => {
    const allowedUpdates = ['status', 'actualDepartureTime', 'actualArrivalTime', 'delayReason', 'estimatedPassengers'];
    const updates = {};

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    if (Object.keys(updates).length === 0) {
        throw new ApiError('No valid fields to update', 400);
    }

    const trip = await Trip.findByIdAndUpdate(
        req.params.id,
        updates,
        {
            new: true,
            runValidators: true,
        },
    );

    if (!trip) {
        throw new ApiError('Trip not found', 404);
    }

    logger.info(`Trip status updated: ${trip.tripNumber} - ${trip.status}`);

    res.status(200).json({
        status: 'success',
        message: 'Trip updated successfully',
        data: {
            trip,
        },
    });
});

/**
 * Delete trip
 * 
 * @route DELETE /api/trips/:id
 * @access Private (Admin only)
 */
exports.deleteTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
        throw new ApiError('Trip not found', 404);
    }

    logger.info(`Trip deleted: ${trip.tripNumber} by user ${req.user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Trip deleted successfully',
        data: null,
    });
});

/**
 * Get active trips (in-transit or boarding)
 * 
 * @route GET /api/trips/active
 * @access Public
 */
exports.getActiveTrips = asyncHandler(async (req, res) => {
    const trips = await Trip.find({
        status: { $in: ['boarding', 'in-transit'] },
    }).sort('scheduledDepartureTime');

    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: {
            trips,
        },
    });
});

/**
 * Get upcoming trips (scheduled for future)
 * 
 * @route GET /api/trips/upcoming
 * @access Public
 * @query {number} days - Number of days ahead (default: 7)
 */
exports.getUpcomingTrips = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 7;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const trips = await Trip.find({
        scheduledDepartureTime: {
            $gte: startDate,
            $lte: endDate,
        },
        status: 'scheduled',
    }).sort('scheduledDepartureTime');

    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: {
            trips,
        },
    });
});

/**
 * Get trips by route
 * 
 * @route GET /api/trips/route/:routeId
 * @access Public
 */
exports.getTripsByRoute = asyncHandler(async (req, res) => {
    const trips = await Trip.find({
        routeId: req.params.routeId,
        scheduledDepartureTime: { $gte: new Date() },
    }).sort('scheduledDepartureTime').limit(20);

    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: {
            trips,
        },
    });
});

/**
 * Get trips by bus
 * 
 * @route GET /api/trips/bus/:busId
 * @access Public
 */
exports.getTripsByBus = asyncHandler(async (req, res) => {
    const trips = await Trip.find({
        busId: req.params.busId,
    }).sort('-scheduledDepartureTime').limit(10);

    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: {
            trips,
        },
    });
});

/**
 * Get trip statistics
 * 
 * @route GET /api/trips/stats
 * @access Public
 */
exports.getTripStats = asyncHandler(async (req, res) => {
    const stats = await Trip.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgFare: { $avg: '$fare' },
                totalPassengers: { $sum: '$estimatedPassengers' },
            },
        },
        {
            $sort: { count: -1 },
        },
    ]);

    const totalTrips = await Trip.countDocuments();
    const completedTrips = await Trip.countDocuments({ status: 'completed' });
    const delayedTrips = await Trip.countDocuments({ status: 'delayed' });

    res.status(200).json({
        status: 'success',
        data: {
            totalTrips,
            completedTrips,
            delayedTrips,
            stats,
        },
    });
});

module.exports = exports;
