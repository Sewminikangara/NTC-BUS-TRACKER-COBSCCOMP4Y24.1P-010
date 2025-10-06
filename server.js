require('dotenv').config();
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
        console.log('🔍 Starting server initialization...');

        console.log('🔍 Loading app module...');
        const app = require('./src/app');

        console.log('🔍 Connecting to database...');
        await connectDB();
        logger.info('Database connection established');
        console.log('✅ Database connected successfully!');

        console.log('🔍 Starting HTTP server...');
        server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`✅ Server running on port ${PORT}!`);
        });

        console.log('🔍 Server startup completed!');
    } catch (error) {
        console.error('❌ Server startup error:', error.message);
        logger.error('Failed to connect to database:', error.message);
        logger.error('Starting server without database connection...');

        // Start server even if database fails (for debugging)
        const app = require('./src/app');
        server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} (WITHOUT DATABASE)`);
        });
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
