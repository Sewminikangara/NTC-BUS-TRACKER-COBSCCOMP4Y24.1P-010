/**
 * Route Model
 * 
 * Represents inter-provincial bus routes in Sri Lanka.
 * Contains information about origin, destination, and stops.
 * 
 * @module models/Route
 */

const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
    {
        routeNumber: {
            type: String,
            required: [true, 'Please provide a route number'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: [true, 'Please provide a route name'],
            trim: true,
        },
        origin: {
            type: String,
            required: [true, 'Please provide origin city'],
            trim: true,
        },
        destination: {
            type: String,
            required: [true, 'Please provide destination city'],
            trim: true,
        },
        distance: {
            type: Number,
            required: [true, 'Please provide route distance in kilometers'],
            min: [0, 'Distance cannot be negative'],
        },
        estimatedDuration: {
            type: Number, // in minutes
            required: [true, 'Please provide estimated duration in minutes'],
            min: [0, 'Duration cannot be negative'],
        },
        stops: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                order: {
                    type: Number,
                    required: true,
                },
                coordinates: {
                    lat: {
                        type: Number,
                        required: true,
                        min: [-90, 'Latitude must be between -90 and 90'],
                        max: [90, 'Latitude must be between -90 and 90'],
                    },
                    lng: {
                        type: Number,
                        required: true,
                        min: [-180, 'Longitude must be between -180 and 180'],
                        max: [180, 'Longitude must be between -180 and 180'],
                    },
                },
            },
        ],
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        fare: {
            type: Number,
            required: [true, 'Please provide base fare'],
            min: [0, 'Fare cannot be negative'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// Indexes for performance
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ status: 1 });

// Virtual for buses on this route
routeSchema.virtual('buses', {
    ref: 'Bus',
    localField: '_id',
    foreignField: 'routeId',
});

// Virtual for trips on this route
routeSchema.virtual('trips', {
    ref: 'Trip',
    localField: '_id',
    foreignField: 'routeId',
});

/**
 * Pre-save middleware to validate stops order
 */
routeSchema.pre('save', function (next) {
    if (this.stops && this.stops.length > 0) {
        // Sort stops by order
        this.stops.sort((a, b) => a.order - b.order);

        // Validate unique order numbers
        const orders = this.stops.map((stop) => stop.order);
        const uniqueOrders = new Set(orders);

        if (orders.length !== uniqueOrders.size) {
            return next(new Error('Stop order numbers must be unique'));
        }
    }
    next();
});

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
