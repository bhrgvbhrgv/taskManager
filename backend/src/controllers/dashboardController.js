const dashboardService = require('../services/dashboardService');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.user.id);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
};
