const { query } = require('../config/db');

// Explicit allowlist of sortable columns to prevent SQL injection
const SORTABLE_FIELDS = {
  title: 'title',
  status: 'status',
  priority: 'priority',
  due_date: 'due_date',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

/**
 * Find task by ID regardless of owner (used for ownership verification)
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const result = await query(
    `SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
     FROM tasks
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Find task by ID and user ID
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
const findByIdAndUserId = async (id, userId) => {
  const result = await query(
    `SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
     FROM tasks
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
};

/**
 * Create a new task
 * @param {Object} taskData
 * @returns {Promise<Object>}
 */
const create = async ({ userId, title, description, status = 'pending', priority = 'medium', dueDate = null }) => {
  const result = await query(
    `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
    [userId, title, description, status, priority, dueDate]
  );
  return result.rows[0];
};

/**
 * Update an existing task
 * @param {number} id
 * @param {number} userId
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
const update = async (id, userId, { title, description, status, priority, dueDate }) => {
  const result = await query(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         due_date = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 AND user_id = $7
     RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
    [title, description, status, priority, dueDate, id, userId]
  );
  return result.rows[0] || null;
};

/**
 * Delete a task
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
const deleteById = async (id, userId) => {
  const result = await query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rowCount > 0;
};

/**
 * Query tasks with search, filtering, sorting and pagination
 * @param {Object} options
 * @returns {Promise<{ tasks: Array, total: number }>}
 */
const findMany = async ({
  userId,
  search = '',
  status = null,
  priority = null,
  sortBy = 'created_at',
  order = 'DESC',
  page = 1,
  limit = 10,
}) => {
  const values = [userId];
  const conditions = ['user_id = $1'];
  let paramIndex = 2;

  // Search filter across title and description
  if (search && search.trim() !== '') {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${search.trim()}%`);
    paramIndex += 1;
  }

  // Status filter
  if (status && status.trim() !== '') {
    conditions.push(`status = $${paramIndex}`);
    values.push(status.trim());
    paramIndex += 1;
  }

  // Priority filter
  if (priority && priority.trim() !== '') {
    conditions.push(`priority = $${paramIndex}`);
    values.push(priority.trim());
    paramIndex += 1;
  }

  const whereClause = conditions.join(' AND ');

  // Count total matching tasks
  const countSql = `SELECT COUNT(*) AS total FROM tasks WHERE ${whereClause}`;
  const countResult = await query(countSql, values);
  const total = parseInt(countResult.rows[0].total, 10);

  // Sorting with explicit allowlist
  const validSortField = SORTABLE_FIELDS[sortBy] || 'created_at';
  const validOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

  // Pagination parameters
  const offset = (page - 1) * limit;
  values.push(limit);
  const limitPlaceholder = `$${paramIndex}`;
  paramIndex += 1;

  values.push(offset);
  const offsetPlaceholder = `$${paramIndex}`;

  const dataSql = `
    SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
    FROM tasks
    WHERE ${whereClause}
    ORDER BY ${validSortField} ${validOrder}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const dataResult = await query(dataSql, values);

  return {
    tasks: dataResult.rows,
    total,
  };
};

module.exports = {
  findById,
  findByIdAndUserId,
  create,
  update,
  deleteById,
  findMany,
  SORTABLE_FIELDS,
};
