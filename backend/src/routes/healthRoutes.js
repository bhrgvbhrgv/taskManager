const express = require('express');
const { checkHealth } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  const isDbHealthy = await checkHealth();

  if (isDbHealthy) {
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'error',
    database: 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
