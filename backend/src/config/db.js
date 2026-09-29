const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  host: config.DB.host,
  port: config.DB.port,
  database: config.DB.database,
  user: config.DB.user,
  password: config.DB.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

/**
 * Execute parameterized SQL query
 * @param {string} text - SQL query string with $1, $2 placeholders
 * @param {Array} params - Array of parameter values
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug({ text, duration, rows: res.rowCount }, 'Executed query');
    return res;
  } catch (err) {
    logger.error({ text, err: err.message }, 'Database query error');
    throw err;
  }
};

/**
 * Check database connectivity
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
  try {
    const res = await pool.query('SELECT 1 AS healthy');
    return res.rows.length > 0;
  } catch (err) {
    logger.error({ err: err.message }, 'Database health check failed');
    return false;
  }
};

/**
 * Gracefully close the database pool
 */
const close = async () => {
  logger.info('Closing database pool');
  await pool.end();
};

module.exports = {
  pool,
  query,
  checkHealth,
  close,
};
