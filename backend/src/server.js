const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // Verify database connectivity on startup
    const isDbConnected = await db.checkHealth();
    if (!isDbConnected) {
      logger.error('Initial database connectivity check failed! Check PostgreSQL credentials and host.');
    } else {
      logger.info(`Connected to PostgreSQL database: ${config.DB.database} on ${config.DB.host}:${config.DB.port}`);
    }

    const server = app.listen(config.PORT, () => {
      logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await db.close();
          logger.info('Database pool closed. Exiting process.');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during database pool shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if still hanging
      setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing termination.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;
