require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;
let server;

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(`${err.name}: ${err.message}`);
    process.exit(1);
});

const startServer = async () => {
    try {
        await connectDB();
        logger.info('Database connection established');

        server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(`${err.name}: ${err.message}`);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    if (server) {
        server.close(() => logger.info('Process terminated'));
    }
});

module.exports = server;
