const Trip = require('../models/Trip');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

exports.getAllTrips = asyncHandler(async (req, res) => {
    const totalTrips = await Trip.countDocuments();

    const features = new APIFeatures(Trip.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const trips = await features.query;

    const pagination = features.getPaginationMeta(totalTrips);

    const lastModified = trips.length > 0
        ? new Date(Math.max(...trips.map((t) => new Date(t.updatedAt || t.createdAt))))
        : new Date();

    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const responseData = {
        status: 'success',
        results: trips.length,
        pagination,
        data: trips,
        _links: {
            self: { href: `${baseUrl}/trips`, method: 'GET' },
            create: { href: `${baseUrl}/trips`, method: 'POST' },
            active: { href: `${baseUrl}/trips/active`, method: 'GET' },
            upcoming: { href: `${baseUrl}/trips/upcoming`, method: 'GET' },
        },
    };

    if (pagination.page > 1) {
        responseData._links.first = { href: `${baseUrl}/trips?page=1&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.prev = { href: `${baseUrl}/trips?page=${pagination.page - 1}&limit=${pagination.limit}`, method: 'GET' };
    }
    if (pagination.page < pagination.pages) {
        responseData._links.next = { href: `${baseUrl}/trips?page=${pagination.page + 1}&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.last = { href: `${baseUrl}/trips?page=${pagination.pages}&limit=${pagination.limit}`, method: 'GET' };
    }

    res.status(200).json(responseData);
});

exports.getTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
        throw new ApiError('Trip not found', 404);
    }

    const lastModified = new Date(trip.updatedAt || trip.createdAt);
    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const responseData = {
        status: 'success',
        data: trip,
        _links: {
            self: { href: `${baseUrl}/trips/${trip._id}`, method: 'GET' },
            update: { href: `${baseUrl}/trips/${trip._id}`, method: 'PUT' },
            patch: { href: `${baseUrl}/trips/${trip._id}`, method: 'PATCH' },
            delete: { href: `${baseUrl}/trips/${trip._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
            related: {
                route: { href: `${baseUrl}/routes/${trip.routeId}`, method: 'GET' },
                bus: { href: `${baseUrl}/buses/${trip.busId}`, method: 'GET' },
                locations: { href: `${baseUrl}/locations/trip/${trip._id}`, method: 'GET' },
            },
        },
    };

    res.status(200).json(responseData);
});

exports.createTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.create(req.body);

    logger.info(`New trip created: ${trip.tripNumber} by user ${req.user.email}`);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const resourceUrl = `${baseUrl}/trips/${trip._id}`;
    res.set('Content-Location', resourceUrl);

    res.status(201).json({
        status: 'success',
        message: 'Trip created successfully',
        data: trip,
        _links: {
            self: { href: resourceUrl, method: 'GET' },
            update: { href: resourceUrl, method: 'PUT' },
            patch: { href: resourceUrl, method: 'PATCH' },
            delete: { href: resourceUrl, method: 'DELETE' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        message: 'Trip updated successfully',
        data: trip,
        _links: {
            self: { href: `${baseUrl}/trips/${trip._id}`, method: 'GET' },
            update: { href: `${baseUrl}/trips/${trip._id}`, method: 'PUT' },
            patch: { href: `${baseUrl}/trips/${trip._id}`, method: 'PATCH' },
            delete: { href: `${baseUrl}/trips/${trip._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        message: 'Trip updated successfully',
        data: trip,
        _links: {
            self: { href: `${baseUrl}/trips/${trip._id}`, method: 'GET' },
            update: { href: `${baseUrl}/trips/${trip._id}`, method: 'PUT' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

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

exports.getActiveTrips = asyncHandler(async (req, res) => {
    const trips = await Trip.find({
        status: { $in: ['boarding', 'in-transit'] },
    }).sort('scheduledDepartureTime');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: trips,
        _links: {
            self: { href: `${baseUrl}/trips/active`, method: 'GET' },
            upcoming: { href: `${baseUrl}/trips/upcoming`, method: 'GET' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: trips,
        _links: {
            self: { href: `${baseUrl}/trips/upcoming?days=${days}`, method: 'GET' },
            active: { href: `${baseUrl}/trips/active`, method: 'GET' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

exports.getTripsByRoute = asyncHandler(async (req, res) => {
    const trips = await Trip.find({
        routeId: req.params.routeId,
        scheduledDepartureTime: { $gte: new Date() },
    }).sort('scheduledDepartureTime').limit(20);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: trips,
        _links: {
            self: { href: `${baseUrl}/trips/route/${req.params.routeId}`, method: 'GET' },
            route: { href: `${baseUrl}/routes/${req.params.routeId}`, method: 'GET' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

exports.getTripsByBus = asyncHandler(async (req, res) => {
    const trips = await Trip.find({
        busId: req.params.busId,
    }).sort('-scheduledDepartureTime').limit(10);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: trips.length,
        data: trips,
        _links: {
            self: { href: `${baseUrl}/trips/bus/${req.params.busId}`, method: 'GET' },
            bus: { href: `${baseUrl}/buses/${req.params.busId}`, method: 'GET' },
            collection: { href: `${baseUrl}/trips`, method: 'GET' },
        },
    });
});

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
