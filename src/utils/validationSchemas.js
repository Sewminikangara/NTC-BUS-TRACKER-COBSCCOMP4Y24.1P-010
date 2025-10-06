const Joi = require('joi');

exports.registerSchema = {
    body: Joi.object({
        name: Joi.string().required().trim().max(50),
        email: Joi.string().required().email().lowercase(),
        password: Joi.string().required().min(6),
        role: Joi.string().valid('admin', 'operator', 'commuter').default('commuter'),
        phone: Joi.string().pattern(/^[0-9]{10}$/),
        operatorId: Joi.string().when('role', {
            is: 'operator',
            then: Joi.required(),
            otherwise: Joi.optional(),
        }),
    }),
};

exports.loginSchema = {
    body: Joi.object({
        email: Joi.string().required().email().lowercase(),
        password: Joi.string().required(),
    }),
};

exports.createRouteSchema = {
    body: Joi.object({
        routeNumber: Joi.string().required().trim().uppercase(),
        name: Joi.string().required().trim(),
        origin: Joi.string().required().trim(),
        destination: Joi.string().required().trim(),
        distance: Joi.number().required().min(0),
        estimatedDuration: Joi.number().required().min(0),
        stops: Joi.array().items(
            Joi.object({
                name: Joi.string().required().trim(),
                order: Joi.number().required(),
                coordinates: Joi.object({
                    lat: Joi.number().required().min(-90).max(90),
                    lng: Joi.number().required().min(-180).max(180),
                }).required(),
            }),
        ).min(2),
        operatorId: Joi.string().required(),
    }),
};

exports.updateRouteSchema = {
    body: Joi.object({
        routeNumber: Joi.string().trim().uppercase(),
        name: Joi.string().trim(),
        origin: Joi.string().trim(),
        destination: Joi.string().trim(),
        distance: Joi.number().min(0),
        estimatedDuration: Joi.number().min(0),
        operatorId: Joi.string(),
    }).min(1),
};

exports.createBusSchema = {
    body: Joi.object({
        registrationNumber: Joi.string().required().trim().uppercase(),
        model: Joi.string().required().trim(),
        capacity: Joi.number().required().min(1).max(200),
        routeId: Joi.string().required(),
        operatorId: Joi.string().required(),
        status: Joi.string().valid('active', 'inactive', 'maintenance').default('active'),
    }),
};

exports.updateBusSchema = {
    body: Joi.object({
        registrationNumber: Joi.string().trim().uppercase(),
        model: Joi.string().trim(),
        capacity: Joi.number().min(1).max(200),
        routeId: Joi.string(),
        operatorId: Joi.string(),
        status: Joi.string().valid('active', 'inactive', 'maintenance'),
    }).min(1),
};

exports.createTripSchema = {
    body: Joi.object({
        tripNumber: Joi.string().required().trim(),
        busId: Joi.string().required(),
        routeId: Joi.string().required(),
        scheduledDeparture: Joi.date().required(),
        scheduledArrival: Joi.date().required(),
    }),
};

exports.updateTripSchema = {
    body: Joi.object({
        tripNumber: Joi.string().trim(),
        busId: Joi.string(),
        routeId: Joi.string(),
        scheduledDeparture: Joi.date(),
        scheduledArrival: Joi.date(),
        actualDeparture: Joi.date(),
        actualArrival: Joi.date(),
        status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled'),
    }).min(1),
};

exports.createOperatorSchema = {
    body: Joi.object({
        name: Joi.string().required().trim().max(100),
        email: Joi.string().required().email().lowercase(),
        phone: Joi.string().required().pattern(/^[0-9]{10}$/),
        address: Joi.string().required().trim(),
        licenseNumber: Joi.string().required().trim(),
        licenseExpiry: Joi.date().required().greater('now'),
    }),
};

exports.updateOperatorSchema = {
    body: Joi.object({
        name: Joi.string().trim().max(100),
        email: Joi.string().email().lowercase(),
        phone: Joi.string().pattern(/^[0-9]{10}$/),
        address: Joi.string().trim(),
        licenseNumber: Joi.string().trim(),
        licenseExpiry: Joi.date().greater('now'),
        status: Joi.string().valid('active', 'inactive', 'suspended'),
    }).min(1),
};

exports.locationUpdateSchema = {
    body: Joi.object({
        busId: Joi.string().required(),
        tripId: Joi.string(),
        coordinates: Joi.object({
            lat: Joi.number().required().min(-90).max(90),
            lng: Joi.number().required().min(-180).max(180),
        }).required(),
        speed: Joi.number().min(0).max(200).default(0),
        bearing: Joi.number().min(0).max(360),
    }),
};

exports.querySchema = {
    query: Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10),
        sort: Joi.string(),
        fields: Joi.string(),
        search: Joi.string().trim(),
        status: Joi.string(),
    }),
};

exports.paramsSchema = {
    params: Joi.object({
        id: Joi.string().required().length(24).hex(),
    }),
};
