const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: isTest
      ? (process.env.DB_TEST_NAME || 'taskmanager_test')
      : (process.env.DB_NAME || 'taskmanager_dev'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'brgv',
  },
  JWT: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_for_development_purposes_only_32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  LOG_LEVEL: isTest ? 'silent' : (process.env.LOG_LEVEL || 'info'),
};
