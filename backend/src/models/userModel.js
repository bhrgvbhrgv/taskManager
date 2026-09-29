const { query } = require('../config/db');

/**
 * Find user by email address
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findByEmail = async (email) => {
  const result = await query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find user by ID (excludes password_hash)
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  const result = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Create a new user
 * @param {Object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.passwordHash
 * @returns {Promise<Object>}
 */
const create = async ({ name, email, passwordHash }) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, LOWER($2), $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
};

module.exports = {
  findByEmail,
  findById,
  create,
};
