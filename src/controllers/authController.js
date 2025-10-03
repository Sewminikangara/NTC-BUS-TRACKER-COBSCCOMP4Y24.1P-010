/**
 * Authentication Controller
 * 
 * 
 * 
 * @module controllers/authController
 */

const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * Register a new user
 * 
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = asyncHandler(async (req, res) => {
    const {
        name, email, password, role, phone, operatorId,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError('User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role,
        phone,
        operatorId,
    });

    // Generate token
    const token = user.generateAuthToken();

    logger.info(`New user registered: ${email} with role: ${role}`);

    // Remove password from response
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

/**
 * Login user
 * 
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new ApiError('Invalid email or password', 401);
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        throw new ApiError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
        throw new ApiError('Your account is not active. Please contact support.', 401);
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = user.generateAuthToken();

    logger.info(`User logged in: ${email}`);

    // Remove password from response
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

/**
 * Get current user profile
 * 
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

/**
 * Update user profile
 * 
 * @route PUT /api/auth/me
 * @access Private
 */
exports.updateMe = asyncHandler(async (req, res) => {
    // Don't allow password update here
    if (req.body.password) {
        throw new ApiError('This route is not for password updates', 400);
    }

    // Don't allow role update
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

/**
 * Change password
 * 
 * @route PUT /api/auth/change-password
 * @access Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError('Please provide current and new password', 400);
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
        throw new ApiError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
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
