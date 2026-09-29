const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.NODE_ENV === 'test', // Skip in testing
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

module.exports = {
  authLimiter,
};
