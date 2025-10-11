const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const etagMiddleware = require('./middleware/etag');

const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const busRoutes = require('./routes/busRoutes');
const tripRoutes = require('./routes/tripRoutes');
const locationRoutes = require('./routes/locationRoutes');
const operatorRoutes = require('./routes/operatorRoutes');

const app = express();

app.set('trust proxy', 1);
app.set('etag', false);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://web-production-5bd5.up.railway.app'],
        },
    },
}));

const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }));
}

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(etagMiddleware);

// Serve static files (Frontend Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
    // Fast health check for Railway
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        environment: process.env.NODE_ENV || 'development',
    });
});

// Alternative health check for Railway (just returns OK)
app.get('/ping', (req, res) => {
    res.status(200).send('OK');
});

app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/api', (req, res) => {
    res.status(200).json({
        name: 'NTC Bus Tracker API',
        version: '1.0.0',
        description: 'Real-Time Bus Tracking System for Inter-Provincial Services',
        student: 'COBSCCOMP24.1P-010',
        documentation: '/api-docs',
        dashboard: '/dashboard',
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

// Serve dashboard (frontend)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/operators', operatorRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
