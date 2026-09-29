const authService = require('../services/authService');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    logger.info({ userId: result.user.id }, 'User registered successfully');
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    logger.info({ userId: result.user.id }, 'User logged in successfully');
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
