const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userModel = require('../models/userModel');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication token is missing or malformed',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT.secret);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'The user belonging to this token no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      error: 'Invalid authentication token',
    });
  }
};

module.exports = {
  authenticate,
};
