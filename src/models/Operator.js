const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide operator name'],
            trim: true,
            unique: true,
        },
        registrationNumber: {
            type: String,
            required: [true, 'Please provide registration number'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        contactPerson: {
            name: {
                type: String,
                required: [true, 'Please provide contact person name'],
                trim: true,
            },
            phone: {
                type: String,
                required: [true, 'Please provide contact phone'],
                match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
            },
            email: {
                type: String,
                required: [true, 'Please provide contact email'],
                lowercase: true,
                trim: true,
                match: [
                    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    'Please provide a valid email',
                ],
            },
        },
        address: {
            street: String,
            city: String,
            province: String,
            postalCode: String,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        licenseNumber: {
            type: String,
            required: [true, 'Please provide license number'],
            unique: true,
            trim: true,
        },
        licenseExpiry: {
            type: Date,
            required: [true, 'Please provide license expiry date'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

operatorSchema.index({ status: 1 });

operatorSchema.virtual('buses', {
    ref: 'Bus',
    localField: '_id',
    foreignField: 'operatorId',
});

/**
 * Check if operator's license is expired
 * @returns {Boolean} True if license is expired
 */
operatorSchema.methods.isLicenseExpired = function () {
    return this.licenseExpiry < new Date();
};

/**
 * Pre-save middleware to update status based on license expiry
 */
operatorSchema.pre('save', function (next) {
    if (this.isLicenseExpired() && this.status === 'active') {
        this.status = 'suspended';
    }
    next();
});

const Operator = mongoose.model('Operator', operatorSchema);

module.exports = Operator;

