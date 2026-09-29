const { query } = require('../config/db');

/**
 * Get dashboard statistics for a given user
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getStatsByUserId = async (userId) => {
  const sql = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS pending,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END)::int AS in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed,
      COUNT(CASE WHEN status != 'completed' AND due_date IS NOT NULL AND due_date < CURRENT_TIMESTAMP THEN 1 END)::int AS overdue,
      COUNT(CASE WHEN priority = 'low' THEN 1 END)::int AS priority_low,
      COUNT(CASE WHEN priority = 'medium' THEN 1 END)::int AS priority_medium,
      COUNT(CASE WHEN priority = 'high' THEN 1 END)::int AS priority_high
    FROM tasks
    WHERE user_id = $1
  `;

  const result = await query(sql, [userId]);
  const row = result.rows[0];

  return {
    total: row.total || 0,
    pending: row.pending || 0,
    in_progress: row.in_progress || 0,
    completed: row.completed || 0,
    overdue: row.overdue || 0,
    priority: {
      low: row.priority_low || 0,
      medium: row.priority_medium || 0,
      high: row.priority_high || 0,
    },
  };
};

module.exports = {
  getStatsByUserId,
};
