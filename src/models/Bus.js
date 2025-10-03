/**
 * Bus Model
 * 
 * Represents individual buses operating on routes.
 * Contains bus details, capacity, and current status.
 * 
 * @module models/Bus
 */

const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
    {
        registrationNumber: {
            type: String,
            required: [true, 'Please provide registration number'],
            unique: true,
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{2,3}-\d{4}$/, 'Please provide a valid registration number (e.g., WP-1234)'],
        },
        make: {
            type: String,
            required: [true, 'Please provide bus make/manufacturer'],
            trim: true,
        },
        model: {
            type: String,
            required: [true, 'Please provide bus model'],
            trim: true,
        },
        year: {
            type: Number,
            required: [true, 'Please provide manufacturing year'],
            min: [1990, 'Year must be 1990 or later'],
            max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
        },
        capacity: {
            type: Number,
            required: [true, 'Please provide seating capacity'],
            min: [20, 'Capacity must be at least 20'],
            max: [100, 'Capacity cannot exceed 100'],
        },
        routeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Route',
            required: [true, 'Please assign a route to this bus'],
        },
        operatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Operator',
            required: [true, 'Please assign an operator to this bus'],
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive', 'maintenance', 'retired'],
                message: 'Status must be active, inactive, maintenance, or retired',
            },
            default: 'active',
        },
        features: [
            {
                type: String,
                enum: ['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Rest Room'],
            },
        ],
        lastMaintenance: {
            type: Date,
        },
        nextMaintenance: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// Compound indexes for performance
busSchema.index({ registrationNumber: 1 });
busSchema.index({ routeId: 1, status: 1 });
busSchema.index({ operatorId: 1 });

// Virtual for trips assigned to this bus
busSchema.virtual('trips', {
    ref: 'Trip',
    localField: '_id',
    foreignField: 'busId',
});

// Virtual for location updates of this bus
busSchema.virtual('locationUpdates', {
    ref: 'LocationUpdate',
    localField: '_id',
    foreignField: 'busId',
});

/**
 * Check if maintenance is due
 * 
 * @returns {boolean} True if maintenance is due
 */
busSchema.methods.isMaintenanceDue = function () {
    if (!this.nextMaintenance) return false;
    return this.nextMaintenance <= new Date();
};

/**
 * Pre-save middleware to validate maintenance dates
 */
busSchema.pre('save', function (next) {
    if (this.nextMaintenance && this.lastMaintenance) {
        if (this.nextMaintenance <= this.lastMaintenance) {
            return next(new Error('Next maintenance date must be after last maintenance date'));
        }
    }
    next();
});

/**
 * Pre-find middleware to populate route and operator
 */
busSchema.pre(/^find/, function (next) {
    // Only populate if not already populating (to avoid circular references)
    if (!this.getOptions().skipPopulate) {
        this.populate({
            path: 'routeId',
            select: 'routeNumber name origin destination',
        }).populate({
            path: 'operatorId',
            select: 'name registrationNumber',
        });
    }
    next();
});

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;
