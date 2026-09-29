const pino = require('pino');
const config = require('../config/env');

const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.NODE_ENV === 'development'
    ? undefined
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
