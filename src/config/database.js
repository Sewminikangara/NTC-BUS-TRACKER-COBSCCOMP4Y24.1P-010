const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        console.log('🔍 Starting MongoDB connection...');
        console.log('🔍 MONGODB_URL:', process.env.MONGODB_URL ? 'SET' : 'NOT SET');
        console.log('🔍 MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

        const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;
        console.log('🔍 Using MongoDB URI:', mongoUri ? 'AVAILABLE' : 'MISSING');

        if (!mongoUri) {
            throw new Error('MongoDB connection string is missing');
        }

        // Add connection options for better reliability
        const options = {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority',
        };

        console.log('🔍 Attempting MongoDB connection...');
        const conn = await mongoose.connect(mongoUri, options);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database: ${conn.connection.name}`);
        console.log('✅ MongoDB connection successful!');

        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        logger.error('MongoDB URI:', process.env.MONGODB_URI || process.env.MONGODB_URL ? 'Set' : 'Not set');
        // Don't exit the process immediately, let the app handle it gracefully
        throw error;
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    } catch (error) {
        logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
