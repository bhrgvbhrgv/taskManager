const { pool, query } = require('../src/config/db');
const config = require('../src/config/env');

// Safety assertion: guarantee tests NEVER run on dev database
if (config.NODE_ENV !== 'test' || config.DB.database !== 'taskmanager_test') {
  throw new Error(`CRITICAL: Tests attempted to run against non-test database: ${config.DB.database}`);
}

const clearDatabase = async () => {
  await query('DELETE FROM tasks');
  await query('DELETE FROM users');
};

const closeDatabase = async () => {
  await pool.end();
};

module.exports = {
  clearDatabase,
  closeDatabase,
};
