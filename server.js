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
        server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`✅ Server running on port ${PORT}!`);
            console.log('🔥 SERVER IS READY FOR REQUESTS!');

            // Signal Railway that we're ready
            if (process.env.RAILWAY_ENVIRONMENT) {
                console.log('🚂 Railway deployment detected - server ready!');
            }
            
            // Log memory usage every 30 seconds for debugging
            setInterval(() => {
                const memUsage = process.memoryUsage();
                console.log(`💾 Memory: ${Math.round(memUsage.heapUsed/1024/1024)}MB / ${Math.round(memUsage.rss/1024/1024)}MB RSS`);
            }, 30000);
        });

        // Set server timeouts for Railway
        server.keepAliveTimeout = 61000;
        server.headersTimeout = 62000;
        server.timeout = 120000;

        console.log('🔍 Server startup completed!');
    } catch (error) {
        console.error('❌ Server startup error:', error.message);
        logger.error('Failed to connect to database:', error.message);

        // Exit on critical errors in production
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ Critical error in production, exiting...');
            process.exit(1);
        }
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

// Graceful shutdown for Railway
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Railway is trying to stop the container...');
    logger.info('SIGTERM received from Railway');
    
    // In Railway, sometimes SIGTERM is sent prematurely
    // Let's try to stay alive for a bit longer
    console.log('⏳ Attempting to stay alive for Railway health checks...');
    
    setTimeout(() => {
        console.log('🔄 Still alive after SIGTERM - continuing to serve requests');
        
        // Only actually shutdown if we receive another SIGTERM
        process.once('SIGTERM', () => {
            console.log('🛑 Second SIGTERM received - now shutting down gracefully...');
            if (server) {
                server.close(() => {
                    console.log('✅ Server closed gracefully');
                    logger.info('Server closed gracefully');
                    process.exit(0);
                });
                
                setTimeout(() => {
                    console.log('❌ Forced shutdown after timeout');
                    process.exit(1);
                }, 5000);
            } else {
                process.exit(0);
            }
        });
    }, 2000);
});

// Additional signal handlers for Railway
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received');
    if (server) {
        server.close(() => process.exit(0));
    } else {
        process.exit(0);
    }
});

module.exports = server;
