/**
 * LocationUpdate Model
 * 
 * Stores real-time GPS location updates from buses.
 * Tracks bus movement history for monitoring and analytics.
 * 
 * @module models/LocationUpdate
 */

const mongoose = require('mongoose');

const locationUpdateSchema = new mongoose.Schema(
    {
        busId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bus',
            required: [true, 'Please provide bus ID'],
            index: true,
        },
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            index: true,
        },
        coordinates: {
            lat: {
                type: Number,
                required: [true, 'Please provide latitude'],
                min: [-90, 'Latitude must be between -90 and 90'],
                max: [90, 'Latitude must be between -90 and 90'],
            },
            lng: {
                type: Number,
                required: [true, 'Please provide longitude'],
                min: [-180, 'Longitude must be between -180 and 180'],
                max: [180, 'Longitude must be between -180 and 180'],
            },
        },
        speed: {
            type: Number, // in km/h
            min: [0, 'Speed cannot be negative'],
            max: [120, 'Speed cannot exceed 120 km/h'],
            default: 0,
        },
        heading: {
            type: Number, // direction in degrees (0-360)
            min: [0, 'Heading must be between 0 and 360'],
            max: [360, 'Heading must be between 0 and 360'],
        },
        accuracy: {
            type: Number, // GPS accuracy in meters
            min: [0, 'Accuracy cannot be negative'],
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['moving', 'stopped', 'idle'],
            default: 'moving',
        },
    },
    {
        timestamps: true,
    },
);

// Compound indexes for efficient queries
locationUpdateSchema.index({ busId: 1, timestamp: -1 });
locationUpdateSchema.index({ tripId: 1, timestamp: -1 });
locationUpdateSchema.index({ timestamp: -1 });
locationUpdateSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

// TTL index to auto-delete old location data after 30 days
locationUpdateSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
locationUpdateSchema.statics.calculateDistance = function (lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(lat1 * (Math.PI / 180))
        * Math.cos(lat2 * (Math.PI / 180))
        * Math.sin(dLng / 2)
        * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

/**
 * Get latest location for a specific bus
 * 
 * @param {ObjectId} busId - Bus ID
 * @returns {Promise<Object|null>} Latest location or null
 */
locationUpdateSchema.statics.getLatestLocation = async function (busId) {
    return this.findOne({ busId })
        .sort({ timestamp: -1 })
        .populate('busId', 'registrationNumber routeId')
        .populate('tripId', 'tripNumber status');
};

/**
 * Get location history for a bus within a time range
 * 
 * @param {ObjectId} busId - Bus ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Promise<Array>} Array of location updates
 */
locationUpdateSchema.statics.getLocationHistory = async function (
    busId,
    startTime,
    endTime,
) {
    return this.find({
        busId,
        timestamp: { $gte: startTime, $lte: endTime },
    })
        .sort({ timestamp: 1 })
        .select('coordinates speed timestamp status');
};

/**
 * Pre-save middleware to auto-determine status based on speed
 */
locationUpdateSchema.pre('save', function (next) {
    if (this.speed === 0) {
        this.status = 'stopped';
    } else if (this.speed > 0 && this.speed < 5) {
        this.status = 'idle';
    } else {
        this.status = 'moving';
    }
    next();
});

/**
 * Pre-find middleware to populate references
 */
locationUpdateSchema.pre(/^find/, function (next) {
    if (!this.getOptions().skipPopulate) {
        this.populate({
            path: 'busId',
            select: 'registrationNumber routeId status',
        });
    }
    next();
});

const LocationUpdate = mongoose.model('LocationUpdate', locationUpdateSchema);

module.exports = LocationUpdate;
