const taskService = require('../services/taskService');

const listTasks = async (req, res, next) => {
  try {
    const result = await taskService.listTasks(req.user.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await taskService.getTaskById(taskId, req.user.id);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await taskService.updateTask(taskId, req.user.id, req.body);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const result = await taskService.deleteTask(taskId, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
