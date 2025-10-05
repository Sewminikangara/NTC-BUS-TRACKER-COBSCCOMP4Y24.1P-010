const mongoose = require('mongoose');
const LocationUpdate = require('../models/LocationUpdate');
const Bus = require('../models/Bus');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const logger = require('../config/logger');

exports.createLocationUpdate = asyncHandler(async (req, res) => {
    const {
        busId, tripId, coordinates, speed, heading, accuracy,
    } = req.body;

    const bus = await Bus.findById(busId);
    if (!bus) {
        throw new ApiError('Bus not found', 404);
    }

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.set('Content-Location', `${baseUrl}/locations/bus/${busId}/latest`);

    res.status(201).json({
        status: 'success',
        message: 'Location updated successfully',
        data: locationUpdate,
        _links: {
            self: { href: `${baseUrl}/locations/bus/${busId}/latest`, method: 'GET' },
            history: { href: `${baseUrl}/locations/bus/${busId}/history`, method: 'GET' },
            bus: { href: `${baseUrl}/buses/${busId}`, method: 'GET' },
        },
    });
});

exports.getLatestLocation = asyncHandler(async (req, res) => {
    const location = await LocationUpdate.getLatestLocation(req.params.busId);

    if (!location) {
        throw new ApiError('No location data found for this bus', 404);
    }

    const lastModified = new Date(location.timestamp);
    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        data: location,
        _links: {
            self: { href: `${baseUrl}/locations/bus/${req.params.busId}/latest`, method: 'GET' },
            history: { href: `${baseUrl}/locations/bus/${req.params.busId}/history`, method: 'GET' },
            bus: { href: `${baseUrl}/buses/${req.params.busId}`, method: 'GET' },
            stats: { href: `${baseUrl}/locations/bus/${req.params.busId}/stats`, method: 'GET' },
        },
    });
});

exports.getLocationHistory = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;

    const endTime = req.query.endTime ? new Date(req.query.endTime) : new Date();
    const startTime = req.query.startTime
        ? new Date(req.query.startTime)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const locations = await LocationUpdate.getLocationHistory(busId, startTime, endTime);

    const limitedLocations = locations.slice(0, limit);

    const lastModified = limitedLocations.length > 0
        ? new Date(limitedLocations[0].timestamp)
        : new Date();

    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: limitedLocations.length,
        data: {
            busId,
            startTime,
            endTime,
            locations: limitedLocations,
        },
        _links: {
            self: { href: `${baseUrl}/locations/bus/${busId}/history?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`, method: 'GET' },
            latest: { href: `${baseUrl}/locations/bus/${busId}/latest`, method: 'GET' },
            bus: { href: `${baseUrl}/buses/${busId}`, method: 'GET' },
        },
    });
});

exports.getLocationsByTrip = asyncHandler(async (req, res) => {
    const locations = await LocationUpdate.find({
        tripId: req.params.tripId,
    }).sort('timestamp').select('coordinates speed timestamp status');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: locations.length,
        data: locations,
        _links: {
            self: { href: `${baseUrl}/locations/trip/${req.params.tripId}`, method: 'GET' },
            trip: { href: `${baseUrl}/trips/${req.params.tripId}`, method: 'GET' },
        },
    });
});

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

    const activeBuses = busesWithLocations.filter((bus) => bus.lastLocation !== null);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: activeBuses.length,
        data: activeBuses,
        _links: {
            self: { href: `${baseUrl}/locations/all-buses`, method: 'GET' },
            nearby: { href: `${baseUrl}/locations/nearby`, method: 'GET' },
        },
    });
});

exports.getNearbyBuses = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    const radius = parseFloat(req.query.radius) || 5;

    if (!lat || !lng) {
        throw new ApiError('Please provide latitude and longitude', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const recentTime = new Date(Date.now() - 10 * 60 * 1000);

    const locations = await LocationUpdate.find({
        timestamp: { $gte: recentTime },
    }).populate({
        path: 'busId',
        select: 'registrationNumber routeId status',
    });

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: nearbyBuses.length,
        data: {
            searchLocation: { lat: latitude, lng: longitude },
            radius,
            buses: nearbyBuses,
        },
        _links: {
            self: { href: `${baseUrl}/locations/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`, method: 'GET' },
            allBuses: { href: `${baseUrl}/locations/all-buses`, method: 'GET' },
        },
    });
});

exports.getBusLocationStats = asyncHandler(async (req, res) => {
    const { busId } = req.params;

    const stats = await LocationUpdate.aggregate([
        {
            $match: { busId: new mongoose.Types.ObjectId(busId) },
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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        data: {
            busId,
            stats: stats[0] || null,
            latestLocation,
        },
        _links: {
            self: { href: `${baseUrl}/locations/bus/${busId}/stats`, method: 'GET' },
            latest: { href: `${baseUrl}/locations/bus/${busId}/latest`, method: 'GET' },
            history: { href: `${baseUrl}/locations/bus/${busId}/history`, method: 'GET' },
            bus: { href: `${baseUrl}/buses/${busId}`, method: 'GET' },
        },
    });
});

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
