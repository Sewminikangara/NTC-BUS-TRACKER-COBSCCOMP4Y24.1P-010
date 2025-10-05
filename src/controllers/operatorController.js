const Operator = require('../models/Operator');
const Bus = require('../models/Bus');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const APIFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

exports.getAllOperators = asyncHandler(async (req, res) => {
    const features = new APIFeatures(Operator.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const operators = await features.query;
    const total = await Operator.countDocuments();

    const pagination = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        total,
        pages: Math.ceil(total / (parseInt(req.query.limit, 10) || 10)),
    };

    const lastModified = operators.length > 0
        ? new Date(Math.max(...operators.map((o) => new Date(o.updatedAt || o.createdAt))))
        : new Date();

    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const responseData = {
        status: 'success',
        results: operators.length,
        pagination,
        data: operators,
        _links: {
            self: { href: `${baseUrl}/operators`, method: 'GET' },
            create: { href: `${baseUrl}/operators`, method: 'POST' },
            licenses: {
                expired: { href: `${baseUrl}/operators/licenses/expired`, method: 'GET' },
                expiring: { href: `${baseUrl}/operators/licenses/expiring-soon`, method: 'GET' },
            },
        },
    };

    if (pagination.page > 1) {
        responseData._links.first = { href: `${baseUrl}/operators?page=1&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.prev = { href: `${baseUrl}/operators?page=${pagination.page - 1}&limit=${pagination.limit}`, method: 'GET' };
    }
    if (pagination.page < pagination.pages) {
        responseData._links.next = { href: `${baseUrl}/operators?page=${pagination.page + 1}&limit=${pagination.limit}`, method: 'GET' };
        responseData._links.last = { href: `${baseUrl}/operators?page=${pagination.pages}&limit=${pagination.limit}`, method: 'GET' };
    }

    res.status(200).json(responseData);
});

exports.getOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
        throw new ApiError('Operator not found', 404);
    }

    const buses = await Bus.find({ operatorId: req.params.id })
        .select('registrationNumber busType status')
        .limit(10);

    const lastModified = new Date(operator.updatedAt || operator.createdAt);
    res.set('Last-Modified', lastModified.toUTCString());

    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        data: {
            operator,
            buses,
        },
        _links: {
            self: { href: `${baseUrl}/operators/${operator._id}`, method: 'GET' },
            update: { href: `${baseUrl}/operators/${operator._id}`, method: 'PUT' },
            delete: { href: `${baseUrl}/operators/${operator._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/operators`, method: 'GET' },
            related: {
                buses: { href: `${baseUrl}/buses/operator/${operator._id}`, method: 'GET' },
            },
        },
    });
});

exports.createOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.create(req.body);

    logger.info(`New operator created: ${operator.name}`);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const resourceUrl = `${baseUrl}/operators/${operator._id}`;
    res.set('Content-Location', resourceUrl);

    res.status(201).json({
        status: 'success',
        message: 'Operator created successfully',
        data: operator,
        _links: {
            self: { href: resourceUrl, method: 'GET' },
            update: { href: resourceUrl, method: 'PUT' },
            delete: { href: resourceUrl, method: 'DELETE' },
            collection: { href: `${baseUrl}/operators`, method: 'GET' },
        },
    });
});

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

    logger.info(`Operator updated: ${operator.name}`);

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        message: 'Operator updated successfully',
        data: operator,
        _links: {
            self: { href: `${baseUrl}/operators/${operator._id}`, method: 'GET' },
            update: { href: `${baseUrl}/operators/${operator._id}`, method: 'PUT' },
            delete: { href: `${baseUrl}/operators/${operator._id}`, method: 'DELETE' },
            collection: { href: `${baseUrl}/operators`, method: 'GET' },
        },
    });
});

exports.deleteOperator = asyncHandler(async (req, res) => {
    const operator = await Operator.findById(req.params.id);

    if (!operator) {
        throw new ApiError('Operator not found', 404);
    }

    const busCount = await Bus.countDocuments({ operatorId: req.params.id });
    if (busCount > 0) {
        throw new ApiError(
            `Cannot delete operator. ${busCount} buses are still associated with this operator`,
            400,
        );
    }

    await operator.deleteOne();

    logger.info(`Operator deleted: ${operator.name}`);

    res.status(200).json({
        status: 'success',
        message: 'Operator deleted successfully',
        data: null,
    });
});

exports.getExpiredLicenses = asyncHandler(async (req, res) => {
    const operators = await Operator.find({
        licenseExpiry: { $lt: new Date() },
    }).select('name licenseNumber licenseExpiry contactPerson');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: operators.length,
        data: operators,
        _links: {
            self: { href: `${baseUrl}/operators/licenses/expired`, method: 'GET' },
            expiring: { href: `${baseUrl}/operators/licenses/expiring-soon`, method: 'GET' },
            collection: { href: `${baseUrl}/operators`, method: 'GET' },
        },
    });
});

exports.getExpiringLicenses = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const operators = await Operator.find({
        licenseExpiry: {
            $gte: new Date(),
            $lte: futureDate,
        },
    }).select('name licenseNumber licenseExpiry contactPerson');

    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    res.status(200).json({
        status: 'success',
        results: operators.length,
        data: {
            operators,
            expiringWithin: `${days} days`,
        },
        _links: {
            self: { href: `${baseUrl}/operators/licenses/expiring-soon?days=${days}`, method: 'GET' },
            expired: { href: `${baseUrl}/operators/licenses/expired`, method: 'GET' },
            collection: { href: `${baseUrl}/operators`, method: 'GET' },
        },
    });
});

exports.getOperatorStats = asyncHandler(async (req, res) => {
    const stats = await Operator.aggregate([
        {
            $facet: {
                statusDistribution: [
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                ],
                totalOperators: [
                    {
                        $count: 'total',
                    },
                ],
                licenseStatus: [
                    {
                        $project: {
                            companyName: 1,
                            expired: {
                                $cond: [{ $lt: ['$licenseExpiry', new Date()] }, 1, 0],
                            },
                            expiringSoon: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gte: ['$licenseExpiry', new Date()] },
                                            {
                                                $lte: [
                                                    '$licenseExpiry',
                                                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                                ],
                                            },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            expiredCount: { $sum: '$expired' },
                            expiringSoonCount: { $sum: '$expiringSoon' },
                        },
                    },
                ],
            },
        },
    ]);

    const busStats = await Bus.aggregate([
        {
            $group: {
                _id: '$operatorId',
                busCount: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'operators',
                localField: '_id',
                foreignField: '_id',
                as: 'operator',
            },
        },
        {
            $unwind: '$operator',
        },
        {
            $project: {
                name: '$operator.name',
                busCount: 1,
            },
        },
        {
            $sort: { busCount: -1 },
        },
        {
            $limit: 10,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            totalOperators: stats[0].totalOperators[0]?.total || 0,
            statusDistribution: stats[0].statusDistribution,
            licenseStatus: stats[0].licenseStatus[0] || { expiredCount: 0, expiringSoonCount: 0 },
            topOperators: busStats,
        },
    });
});

module.exports = exports;
