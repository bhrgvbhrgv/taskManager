const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const config = require('../config/env');

const SALT_ROUNDS = 10;

/**
 * Generate JWT token for a user
 * @param {Object} user
 * @returns {string}
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.JWT.secret,
    { expiresIn: config.JWT.expiresIn }
  );
};

/**
 * Register a new user
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
const register = async ({ name, email, password }) => {
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
  });

  const token = generateToken(user);
  return { user, token };
};

/**
 * Authenticate user with email and password
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
const login = async ({ email, password }) => {
  const userRecord = await userModel.findByEmail(email);
  if (!userRecord) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, userRecord.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    created_at: userRecord.created_at,
  };

  const token = generateToken(user);
  return { user, token };
};

/**
 * Get user profile by ID
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getCurrentUser = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
};

module.exports = {
  register,
  login,
  getCurrentUser,
  generateToken,
};
