const dashboardModel = require('../models/dashboardModel');

const getStats = async (userId) => {
  return dashboardModel.getStatsByUserId(userId);
};

module.exports = {
  getStats,
};
