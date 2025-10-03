/**
 * Validation Schemas
 * 
 * Joi validation schemas for request data validation.
 * 
 * @module utils/validationSchemas
 */

const Joi = require('joi');

/**
 * Auth Validation Schemas
 */
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

/**
 * Route Validation Schemas
 */
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
        fare: Joi.number().required().min(0),
        status: Joi.string().valid('active', 'inactive', 'suspended'),
    }),
};

exports.updateRouteSchema = {
    params: Joi.object({
        id: Joi.string().required().length(24).hex(),
    }),
    body: Joi.object({
        routeNumber: Joi.string().trim().uppercase(),
        name: Joi.string().trim(),
        origin: Joi.string().trim(),
        destination: Joi.string().trim(),
        distance: Joi.number().min(0),
        estimatedDuration: Joi.number().min(0),
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
        fare: Joi.number().min(0),
        status: Joi.string().valid('active', 'inactive', 'suspended'),
    }).min(1),
};

/**
 * Bus Validation Schemas
 */
exports.createBusSchema = {
    body: Joi.object({
        registrationNumber: Joi.string()
            .required()
            .trim()
            .uppercase()
            .pattern(/^[A-Z]{2,3}-\d{4}$/),
        make: Joi.string().required().trim(),
        model: Joi.string().required().trim(),
        year: Joi.number()
            .required()
            .min(1990)
            .max(new Date().getFullYear() + 1),
        capacity: Joi.number().required().min(20).max(100),
        routeId: Joi.string().required().length(24).hex(),
        operatorId: Joi.string().required().length(24).hex(),
        status: Joi.string().valid('active', 'inactive', 'maintenance', 'retired'),
        features: Joi.array().items(
            Joi.string().valid('AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Rest Room'),
        ),
        lastMaintenance: Joi.date(),
        nextMaintenance: Joi.date(),
    }),
};

exports.updateBusSchema = {
    params: Joi.object({
        id: Joi.string().required().length(24).hex(),
    }),
    body: Joi.object({
        registrationNumber: Joi.string()
            .trim()
            .uppercase()
            .pattern(/^[A-Z]{2,3}-\d{4}$/),
        make: Joi.string().trim(),
        model: Joi.string().trim(),
        year: Joi.number().min(1990).max(new Date().getFullYear() + 1),
        capacity: Joi.number().min(20).max(100),
        routeId: Joi.string().length(24).hex(),
        operatorId: Joi.string().length(24).hex(),
        status: Joi.string().valid('active', 'inactive', 'maintenance', 'retired'),
        features: Joi.array().items(
            Joi.string().valid('AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Rest Room'),
        ),
        lastMaintenance: Joi.date(),
        nextMaintenance: Joi.date(),
    }).min(1),
};

/**
 * Trip Validation Schemas
 */
exports.createTripSchema = {
    body: Joi.object({
        tripNumber: Joi.string().required().trim().uppercase(),
        busId: Joi.string().required().length(24).hex(),
        routeId: Joi.string().required().length(24).hex(),
        scheduledDepartureTime: Joi.date().required(),
        scheduledArrivalTime: Joi.date().required(),
        fare: Joi.number().required().min(0),
        driver: Joi.object({
            name: Joi.string().trim(),
            licenseNumber: Joi.string().trim(),
            phone: Joi.string().pattern(/^[0-9]{10}$/),
        }),
        estimatedPassengers: Joi.number().min(0),
    }),
};

exports.updateTripSchema = {
    params: Joi.object({
        id: Joi.string().required().length(24).hex(),
    }),
    body: Joi.object({
        status: Joi.string().valid(
            'scheduled',
            'boarding',
            'in-transit',
            'delayed',
            'completed',
            'cancelled',
        ),
        actualDepartureTime: Joi.date(),
        actualArrivalTime: Joi.date(),
        delayReason: Joi.string().trim(),
        estimatedPassengers: Joi.number().min(0),
    }).min(1),
};

/**
 * Location Update Validation Schemas
 */
exports.createLocationUpdateSchema = {
    body: Joi.object({
        busId: Joi.string().required().length(24).hex(),
        tripId: Joi.string().length(24).hex(),
        coordinates: Joi.object({
            lat: Joi.number().required().min(-90).max(90),
            lng: Joi.number().required().min(-180).max(180),
        }).required(),
        speed: Joi.number().min(0).max(120),
        heading: Joi.number().min(0).max(360),
        accuracy: Joi.number().min(0),
        timestamp: Joi.date(),
    }),
};

/**
 * Operator Validation Schemas
 */
exports.createOperatorSchema = {
    body: Joi.object({
        name: Joi.string().required().trim(),
        registrationNumber: Joi.string().required().trim().uppercase(),
        contactPerson: Joi.object({
            name: Joi.string().required().trim(),
            phone: Joi.string().required().pattern(/^[0-9]{10}$/),
            email: Joi.string().required().email().lowercase(),
        }).required(),
        address: Joi.object({
            street: Joi.string(),
            city: Joi.string(),
            province: Joi.string(),
            postalCode: Joi.string(),
        }),
        licenseNumber: Joi.string().required().trim(),
        licenseExpiry: Joi.date().required(),
        status: Joi.string().valid('active', 'inactive', 'suspended'),
    }),
};

exports.updateOperatorSchema = {
    params: Joi.object({
        id: Joi.string().required().length(24).hex(),
    }),
    body: Joi.object({
        name: Joi.string().trim(),
        registrationNumber: Joi.string().trim().uppercase(),
        contactPerson: Joi.object({
            name: Joi.string().trim(),
            phone: Joi.string().pattern(/^[0-9]{10}$/),
            email: Joi.string().email().lowercase(),
        }),
        address: Joi.object({
            street: Joi.string(),
            city: Joi.string(),
            province: Joi.string(),
            postalCode: Joi.string(),
        }),
        licenseNumber: Joi.string().trim(),
        licenseExpiry: Joi.date(),
        status: Joi.string().valid('active', 'inactive', 'suspended'),
    }).min(1),
};

/**
 * Common Parameter Validation
 */
exports.idParamSchema = {
    params: Joi.object({
        id: Joi.string().required().length(24).hex(),
    }),
};

exports.querySchema = {
    query: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
        sort: Joi.string(),
        fields: Joi.string(),
    }).unknown(true),
};
