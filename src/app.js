/**
 * 
 * 
 * 
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const busRoutes = require('./routes/busRoutes');
const tripRoutes = require('./routes/tripRoutes');
const locationRoutes = require('./routes/locationRoutes');
const operatorRoutes = require('./routes/operatorRoutes');

const app = express();

// Trust proxy - important for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Security Headers - Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS Configuration - Allow cross-origin requests
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body Parser Middleware - Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Compression Middleware - Compress all responses
app.use(compression());

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }));
}

// Rate Limiting - Limit repeated requests to public APIs
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Information Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'NTC Bus Tracker API',
        version: '1.0.0',
        description: 'Real-Time Bus Tracking System for Inter-Provincial Services',
        student: 'COBSCCOMP24.1P-010',
        documentation: '/api-docs',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            routes: '/api/routes',
            buses: '/api/buses',
            trips: '/api/trips',
            locations: '/api/locations',
            operators: '/api/operators',
        },
    });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/operators', operatorRoutes);

// 404 Handler - Handle undefined routes
app.use(notFound);

// Global Error Handler - Catch all errors
app.use(errorHandler);

module.exports = app;
