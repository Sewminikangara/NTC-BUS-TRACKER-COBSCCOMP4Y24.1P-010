/**
 * Location Update Controller
 * 
 * Handles real-time GPS location updates for buses.
 * Provides location history and tracking features.
 * 
 * @module controllers/locationController
 */

const mongoose = require('mongoose');
const LocationUpdate = require('../models/LocationUpdate');
const Bus = require('../models/Bus');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * Create new location update
 * 
 * @route POST /api/locations
 * @access Private (Operator only)
 */
exports.createLocationUpdate = asyncHandler(async (req, res) => {
    const { busId, tripId, coordinates, speed, heading, accuracy } = req.body;

    // Verify bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
        throw new ApiError('Bus not found', 404);
    }

    // Create location update
    const locationUpdate = await LocationUpdate.create({
        busId,
        tripId,
        coordinates,
        speed,
        heading,
        accuracy,
        timestamp: new Date(),
    });

    logger.info(`Location updated for bus: ${bus.registrationNumber}`);

    res.status(201).json({
        status: 'success',
        message: 'Location updated successfully',
        data: {
            locationUpdate,
        },
    });
});

/**
 * Get latest location for a specific bus
 * 
 * @route GET /api/locations/bus/:busId/latest
 * @access Public
 */
exports.getLatestLocation = asyncHandler(async (req, res) => {
    const location = await LocationUpdate.getLatestLocation(req.params.busId);

    if (!location) {
        throw new ApiError('No location data found for this bus', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            location,
        },
    });
});

/**
 * Get location history for a bus
 * 
 * @route GET /api/locations/bus/:busId/history
 * @access Public
 * @query {date} startTime - Start time (default: 24 hours ago)
 * @query {date} endTime - End time (default: now)
 * @query {number} limit - Limit results (default: 100)
 */
exports.getLocationHistory = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;

    // Default to last 24 hours
    const endTime = req.query.endTime ? new Date(req.query.endTime) : new Date();
    const startTime = req.query.startTime
        ? new Date(req.query.startTime)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const locations = await LocationUpdate.getLocationHistory(busId, startTime, endTime);

    // Limit results
    const limitedLocations = locations.slice(0, limit);

    res.status(200).json({
        status: 'success',
        results: limitedLocations.length,
        data: {
            busId,
            startTime,
            endTime,
            locations: limitedLocations,
        },
    });
});

/**
 * Get location updates for a specific trip
 * 
 * @route GET /api/locations/trip/:tripId
 * @access Public
 */
exports.getLocationsByTrip = asyncHandler(async (req, res) => {
    const locations = await LocationUpdate.find({
        tripId: req.params.tripId,
    }).sort('timestamp').select('coordinates speed timestamp status');

    res.status(200).json({
        status: 'success',
        results: locations.length,
        data: {
            locations,
        },
    });
});

/**
 * Get all buses' latest locations
 * 
 * @route GET /api/locations/all-buses
 * @access Public
 */
exports.getAllBusesLatestLocation = asyncHandler(async (req, res) => {
    const buses = await Bus.find({ status: 'active' }).select('_id registrationNumber routeId');

    const locationsPromises = buses.map(async (bus) => {
        const location = await LocationUpdate.findOne({ busId: bus._id })
            .sort({ timestamp: -1 })
            .select('coordinates speed timestamp status')
            .limit(1);

        return {
            busId: bus._id,
            registrationNumber: bus.registrationNumber,
            routeId: bus.routeId,
            lastLocation: location,
        };
    });

    const busesWithLocations = await Promise.all(locationsPromises);

    // Filter out buses without location data
    const activeBuses = busesWithLocations.filter((bus) => bus.lastLocation !== null);

    res.status(200).json({
        status: 'success',
        results: activeBuses.length,
        data: {
            buses: activeBuses,
        },
    });
});

/**
 * Get buses near a specific location
 * 
 * @route GET /api/locations/nearby
 * @access Public
 * @query {number} lat - Latitude
 * @query {number} lng - Longitude
 * @query {number} radius - Radius in kilometers (default: 5)
 */
exports.getNearbyBuses = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    const radius = parseFloat(req.query.radius) || 5;

    if (!lat || !lng) {
        throw new ApiError('Please provide latitude and longitude', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Get recent locations (last 10 minutes)
    const recentTime = new Date(Date.now() - 10 * 60 * 1000);

    const locations = await LocationUpdate.find({
        timestamp: { $gte: recentTime },
    }).populate({
        path: 'busId',
        select: 'registrationNumber routeId status',
    });

    // Calculate distances and filter by radius
    const nearbyBuses = locations
        .map((loc) => {
            const distance = LocationUpdate.calculateDistance(
                latitude,
                longitude,
                loc.coordinates.lat,
                loc.coordinates.lng,
            );

            return {
                bus: loc.busId,
                location: {
                    coordinates: loc.coordinates,
                    speed: loc.speed,
                    timestamp: loc.timestamp,
                },
                distance: distance.toFixed(2),
            };
        })
        .filter((item) => parseFloat(item.distance) <= radius)
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.status(200).json({
        status: 'success',
        results: nearbyBuses.length,
        data: {
            searchLocation: { lat: latitude, lng: longitude },
            radius,
            buses: nearbyBuses,
        },
    });
});

/**
 * Get location statistics for a bus
 * 
 * @route GET /api/locations/bus/:busId/stats
 * @access Public
 */
exports.getBusLocationStats = asyncHandler(async (req, res) => {
    const { busId } = req.params;

    const stats = await LocationUpdate.aggregate([
        {
            $match: { busId: mongoose.Types.ObjectId(busId) },
        },
        {
            $group: {
                _id: null,
                avgSpeed: { $avg: '$speed' },
                maxSpeed: { $max: '$speed' },
                minSpeed: { $min: '$speed' },
                totalUpdates: { $sum: 1 },
            },
        },
    ]);

    const latestLocation = await LocationUpdate.getLatestLocation(busId);

    res.status(200).json({
        status: 'success',
        data: {
            busId,
            stats: stats[0] || null,
            latestLocation,
        },
    });
});

/**
 * Delete old location data (Admin only)
 * 
 * @route DELETE /api/locations/cleanup
 * @access Private (Admin only)
 * @query {number} days - Delete data older than this many days
 */
exports.cleanupOldLocations = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await LocationUpdate.deleteMany({
        timestamp: { $lt: cutoffDate },
    });

    logger.info(`Cleaned up ${result.deletedCount} location records older than ${days} days`);

    res.status(200).json({
        status: 'success',
        message: `Deleted ${result.deletedCount} old location records`,
        data: {
            deletedCount: result.deletedCount,
            cutoffDate,
        },
    });
});

module.exports = exports;
