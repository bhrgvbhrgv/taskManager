const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/config/db');
const logger = require('../src/utils/logger');
const config = require('../src/config/env');

const runMigrations = async () => {
  logger.info(`Running migrations against database: ${config.DB.database} on ${config.DB.host}:${config.DB.port}...`);
  try {
    const migrationFile = path.resolve(__dirname, '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Execute the SQL migration
    await query(sql);
    logger.info('Migrations applied successfully!');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to apply migrations');
    process.exitCode = 1;
    throw err;
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration process complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigrations;
