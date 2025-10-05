/**

const { ApiError } = require('./errorHandler');

/**
const notFound = (req, res, next) => {
    const message = `Cannot find ${req.originalUrl} on this server!`;
    next(new ApiError(message, 404));
};

module.exports = notFound;

