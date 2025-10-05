const Bus = require('../models/Bus');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

exports.getAllBuses = asyncHandler(async (req, res) => {
    const totalBuses = await Bus.countDocuments();

    const features = new APIFeatures(Bus.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const buses = await features.query;

    const pagination = features.getPaginationMeta(totalBuses);

    const lastModified = buses.length > 0
        ? new Date(Math.max(...buses.map((b) => new Date(b.updatedAt || b.createdAt))))
        : new Date();

    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const responseData = {
        status: 'success',
        results: buses.length,
        pagination,
        data: buses,
        _links: {
            self: { href: `${baseUrl}/buses`, method: 'GET' },
            create: { href: `${baseUrl}/buses`, method: 'POST' },
        },
    };

    if (pagination.page > 1) {
        responseData._links.first = { href: `${baseUrl}/buses?page=1&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.prev = { href: `${baseUrl}/buses?page=${pagination.page - 1}&limit=${pagination.limit}`, method: 'GET' };
    }
    if (pagination.page < pagination.pages) {
        responseData._links.next = { href: `${baseUrl}/buses?page=${pagination.page + 1}&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.last = { href: `${baseUrl}/buses?page=${pagination.pages}&limit=${pagination.limit}`, method: 'GET' };
    }

    res.status(200).json(responseData);
});

exports.getBus = asyncHandler(async (req, res) => {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
        throw new ApiError('Bus not found', 404);
    }

    const lastModified = new Date(bus.updatedAt || bus.createdAt);
    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const responseData = {
        status: 'success',
        data: bus,
        _links: {
            self: { href: `${baseUrl}/buses/${bus._id}`, method: 'GET' },
            update: { href: `${baseUrl}/buses/${bus._id}`, method: 'PUT' },
            delete: { href: `${baseUrl}/buses/${bus._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/buses`, method: 'GET' },
            related: {
                route: { href: `${baseUrl}/routes/${bus.routeId}`, method: 'GET' },
                operator: { href: `${baseUrl}/operators/${bus.operatorId}`, method: 'GET' },
                trips: { href: `${baseUrl}/trips/bus/${bus._id}`, method: 'GET' },
                location: { href: `${baseUrl}/locations/bus/${bus._id}/latest`, method: 'GET' },
            },
        },
    };

    res.status(200).json(responseData);
});

exports.createBus = asyncHandler(async (req, res) => {
    const bus = await Bus.create(req.body);

    logger.info(`New bus created: ${bus.registrationNumber} by user ${req.user.email}`);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const resourceUrl = `${baseUrl}/buses/${bus._id}`;
    res.set('Content-Location', resourceUrl);

    res.status(201).json({
        status: 'success',
        message: 'Bus created successfully',
        data: bus,
        _links: {
            self: { href: resourceUrl, method: 'GET' },
            update: { href: resourceUrl, method: 'PUT' },
            delete: { href: resourceUrl, method: 'DELETE' },
            collection: { href: `${baseUrl}/buses`, method: 'GET' },
        },
    });
});

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

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        message: 'Bus updated successfully',
        data: bus,
        _links: {
            self: { href: `${baseUrl}/buses/${bus._id}`, method: 'GET' },
            update: { href: `${baseUrl}/buses/${bus._id}`, method: 'PUT' },
            delete: { href: `${baseUrl}/buses/${bus._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/buses`, method: 'GET' },
        },
    });
});

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

exports.getBusesByRoute = asyncHandler(async (req, res) => {
    const buses = await Bus.find({
        routeId: req.params.routeId,
        status: { $in: ['active', 'maintenance'] },
    }).sort('registrationNumber');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: buses,
        _links: {
            self: { href: `${baseUrl}/buses/route/${req.params.routeId}`, method: 'GET' },
            route: { href: `${baseUrl}/routes/${req.params.routeId}`, method: 'GET' },
            collection: { href: `${baseUrl}/buses`, method: 'GET' },
        },
    });
});

exports.getBusesByOperator = asyncHandler(async (req, res) => {
    const buses = await Bus.find({
        operatorId: req.params.operatorId,
    }).sort('-createdAt');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: buses,
        _links: {
            self: { href: `${baseUrl}/buses/operator/${req.params.operatorId}`, method: 'GET' },
            operator: { href: `${baseUrl}/operators/${req.params.operatorId}`, method: 'GET' },
            collection: { href: `${baseUrl}/buses`, method: 'GET' },
        },
    });
});

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

exports.getMaintenanceDue = asyncHandler(async (req, res) => {
    const buses = await Bus.find({
        nextMaintenance: { $lte: new Date() },
        status: { $ne: 'retired' },
    }).sort('nextMaintenance');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: buses,
        _links: {
            self: { href: `${baseUrl}/buses/maintenance/due`, method: 'GET' },
            collection: { href: `${baseUrl}/buses`, method: 'GET' },
        },
    });
});

module.exports = exports;
