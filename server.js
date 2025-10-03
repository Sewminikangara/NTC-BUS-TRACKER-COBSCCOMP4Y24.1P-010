/**
 *
 * 
 * 
 
 * @module server
 * @requires dotenv
 * @requires ./src/app
 * @requires ./src/config/database
 * @requires ./src/config/logger
 */

require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/config/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION!  Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;

let server;

/**
 * Start the server
 * Connects to database and starts listening on specified port
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        logger.info('Database connection established successfully');

        // Start Express server
        server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION!  Shutting down...');
    logger.error(err.name, err.message);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Handle SIGTERM signal 
process.on('SIGTERM', () => {
    logger.info(' SIGTERM RECEIVED. Shutting down gracefully');
    if (server) {
        server.close(() => {
            logger.info(' Process terminated!');
        });
    }
});

module.exports = server;
