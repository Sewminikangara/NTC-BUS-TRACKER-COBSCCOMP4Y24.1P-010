const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
    {
        tripNumber: {
            type: String,
            required: [true, 'Please provide a trip number'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        busId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bus',
            required: [true, 'Please assign a bus to this trip'],
        },
        routeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Route',
            required: [true, 'Please assign a route to this trip'],
        },
        scheduledDepartureTime: {
            type: Date,
            required: [true, 'Please provide scheduled departure time'],
        },
        scheduledArrivalTime: {
            type: Date,
            required: [true, 'Please provide scheduled arrival time'],
        },
        actualDepartureTime: {
            type: Date,
        },
        actualArrivalTime: {
            type: Date,
        },
        status: {
            type: String,
            enum: {
                values: ['scheduled', 'boarding', 'in-transit', 'delayed', 'completed', 'cancelled'],
                message: 'Invalid trip status',
            },
            default: 'scheduled',
        },
        delayReason: {
            type: String,
            trim: true,
        },
        driver: {
            name: {
                type: String,
                trim: true,
            },
            licenseNumber: {
                type: String,
                trim: true,
            },
            phone: {
                type: String,
                match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
            },
        },
        fare: {
            type: Number,
            required: [true, 'Please provide fare amount'],
            min: [0, 'Fare cannot be negative'],
        },
        estimatedPassengers: {
            type: Number,
            min: [0, 'Estimated passengers cannot be negative'],
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

tripSchema.index({ busId: 1, scheduledDepartureTime: 1 });
tripSchema.index({ routeId: 1, scheduledDepartureTime: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledDepartureTime: 1 });

tripSchema.virtual('locationUpdates', {
    ref: 'LocationUpdate',
    localField: 'busId',
    foreignField: 'busId',
});

// Get delay in minutes
tripSchema.methods.getDelay = function () {
    if (!this.actualDepartureTime) return null;

    const scheduled = new Date(this.scheduledDepartureTime);
    const actual = new Date(this.actualDepartureTime);

    return Math.round((actual - scheduled) / (1000 * 60)); // minutes
};

// Check if trip is currently active
tripSchema.methods.isActive = function () {
    return ['boarding', 'in-transit'].includes(this.status);
};

// Check if trip is scheduled for the future
tripSchema.methods.isFuture = function () {
    return this.scheduledDepartureTime > new Date();
};

// Validate times and update status before saving
tripSchema.pre('save', function (next) {
    if (this.scheduledArrivalTime <= this.scheduledDepartureTime) {
        return next(new Error('Arrival time must be after departure time'));
    }

    if (this.actualDepartureTime && this.actualArrivalTime) {
        if (this.actualArrivalTime <= this.actualDepartureTime) {
            return next(new Error('Actual arrival time must be after actual departure time'));
        }
    }

    const now = new Date();

    if (this.actualArrivalTime && this.actualArrivalTime < now) {
        this.status = 'completed';
    } else if (this.actualDepartureTime && this.actualDepartureTime < now) {
        if (this.status !== 'completed' && this.status !== 'cancelled') {
            this.status = 'in-transit';
        }
    }

    next();
});

// Populate bus and route details
tripSchema.pre(/^find/, function (next) {
    if (!this.getOptions().skipPopulate) {
        this.populate({
            path: 'busId',
            select: 'registrationNumber capacity status features',
        }).populate({
            path: 'routeId',
            select: 'routeNumber name origin destination distance estimatedDuration',
        });
    }
    next();
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
