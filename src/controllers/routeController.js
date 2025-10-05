const Route = require('../models/Route');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

exports.getAllRoutes = asyncHandler(async (req, res) => {
    const totalRoutes = await Route.countDocuments();

    const features = new APIFeatures(Route.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const routes = await features.query;

    const pagination = features.getPaginationMeta(totalRoutes);

    const lastModified = routes.length > 0
        ? new Date(Math.max(...routes.map((r) => new Date(r.updatedAt || r.createdAt))))
        : new Date();

    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const responseData = {
        status: 'success',
        results: routes.length,
        pagination,
        data: routes,
    };

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    responseData._links = {
        self: { href: `${baseUrl}/routes`, method: 'GET' },
        create: { href: `${baseUrl}/routes`, method: 'POST' },
    };

    if (pagination.page > 1) {
        responseData._links.first = { href: `${baseUrl}/routes?page=1&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.prev = { href: `${baseUrl}/routes?page=${pagination.page - 1}&limit=${pagination.limit}`, method: 'GET' };
    }
    if (pagination.page < pagination.pages) {
        responseData._links.next = { href: `${baseUrl}/routes?page=${pagination.page + 1}&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.last = { href: `${baseUrl}/routes?page=${pagination.pages}&limit=${pagination.limit}`, method: 'GET' };
    }

    res.status(200).json(responseData);
});

exports.getRoute = asyncHandler(async (req, res) => {
    const route = await Route.findById(req.params.id);

    if (!route) {
        throw new ApiError('Route not found', 404);
    }

    const lastModified = new Date(route.updatedAt || route.createdAt);
    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const responseData = {
        status: 'success',
        data: route,
        _links: {
            self: { href: `${baseUrl}/routes/${route._id}`, method: 'GET' },
            update: { href: `${baseUrl}/routes/${route._id}`, method: 'PUT' },
            delete: { href: `${baseUrl}/routes/${route._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/routes`, method: 'GET' },
            related: {
                buses: { href: `${baseUrl}/buses?routeId=${route._id}`, method: 'GET' },
                trips: { href: `${baseUrl}/trips/route/${route._id}`, method: 'GET' },
            },
        },
    };

    res.status(200).json(responseData);
});

exports.createRoute = asyncHandler(async (req, res) => {
    const route = await Route.create(req.body);

    logger.info(`New route created: ${route.routeNumber} by user ${req.user.email}`);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const resourceUrl = `${baseUrl}/routes/${route._id}`;
    res.set('Content-Location', resourceUrl);

    res.status(201).json({
        status: 'success',
        message: 'Route created successfully',
        data: route,
        _links: {
            self: { href: resourceUrl, method: 'GET' },
            update: { href: resourceUrl, method: 'PUT' },
            delete: { href: resourceUrl, method: 'DELETE' },
            collection: { href: `${baseUrl}/routes`, method: 'GET' },
        },
    });
});

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        message: 'Route updated successfully',
        data: route,
        _links: {
            self: { href: `${baseUrl}/routes/${route._id}`, method: 'GET' },
            update: { href: `${baseUrl}/routes/${route._id}`, method: 'PUT' },
            delete: { href: `${baseUrl}/routes/${route._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/routes`, method: 'GET' },
        },
    });
});

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: routes.length,
        data: routes,
        _links: {
            self: { href: `${baseUrl}/routes/search?origin=${origin}&destination=${destination}`, method: 'GET' },
            collection: { href: `${baseUrl}/routes`, method: 'GET' },
        },
    });
});

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
