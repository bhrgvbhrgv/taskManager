const { validationResult } = require('express-validator');

/**
 * Middleware to evaluate express-validator checks
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
  }
  next();
};

module.exports = validate;
