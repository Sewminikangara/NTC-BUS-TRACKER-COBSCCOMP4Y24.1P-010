const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
            maxlength: [50, 'Name cannot be more than 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'operator', 'commuter'],
                message: 'Role must be either admin, operator, or commuter',
            },
            default: 'commuter',
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        operatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Operator',
            required: function () {
                return this.role === 'operator';
            },
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

/**
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

/**
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '7d',
        },
    );
};

/**
userSchema.methods.updateLastLogin = async function () {
    this.lastLogin = Date.now();
    await this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

module.exports = User;

