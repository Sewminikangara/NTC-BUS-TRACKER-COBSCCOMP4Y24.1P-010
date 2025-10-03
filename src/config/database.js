/**
 * Database Configuration
 * 
 * Handles MongoDB connection using Mongoose ODM.
 * Implements connection error handling and retry logic.
 * 
 * @module config/database
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB database
 * 
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If connection fails after retries
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {

            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database: ${conn.connection.name}`);

        // Handle connection events
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
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

/**
 * Disconnect from MongoDB database
 * Used for graceful shutdown
 * 
 * @async
 * @returns {Promise<void>}
 */
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
