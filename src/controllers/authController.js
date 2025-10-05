const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const logger = require('../config/logger');

exports.register = asyncHandler(async (req, res) => {
    const {
        name, email, password, role, phone, operatorId,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError('User already exists with this email', 400);
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
        operatorId,
    });

    const token = user.generateAuthToken();

    logger.info(`New user registered: ${email} with role: ${role}`);

    user.password = undefined;

    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
            user,
            token,
        },
    });
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new ApiError('Invalid email or password', 401);
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        throw new ApiError('Invalid email or password', 401);
    }

    if (user.status !== 'active') {
        throw new ApiError('Your account is not active. Please contact support.', 401);
    }

    await user.updateLastLogin();

    const token = user.generateAuthToken();

    logger.info(`User logged in: ${email}`);

    user.password = undefined;

    res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
            user,
            token,
        },
    });
});

exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

exports.updateMe = asyncHandler(async (req, res) => {
    if (req.body.password) {
        throw new ApiError('This route is not for password updates', 400);
    }

    if (req.body.role) {
        throw new ApiError('You cannot update your role', 400);
    }

    const allowedUpdates = ['name', 'phone'];
    const updates = {};

    allowedUpdates.forEach((field) => {
        if (req.body[field]) {
            updates[field] = req.body[field];
        }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
            user,
        },
    });
});

exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError('Please provide current and new password', 400);
    }

    const user = await User.findById(req.user.id).select('+password');

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
        throw new ApiError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    const token = user.generateAuthToken();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
        data: {
            token,
        },
    });
});

module.exports = exports;
