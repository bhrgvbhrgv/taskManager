const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * 404 Not Found handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  // Log error (suppressed in test unless 500)
  if (status >= 500) {
    logger.error({ err, path: req.path, method: req.method }, 'Server Error');
  } else {
    logger.warn({ status, message, path: req.path, method: req.method }, 'Client Error');
  }

  const response = {
    error: message,
  };

  if (err.details) {
    response.details = err.details;
  }

  // Include stack trace in development only for debugging
  if (config.NODE_ENV === 'development' && status >= 500) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
