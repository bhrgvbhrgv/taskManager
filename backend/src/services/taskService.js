const taskModel = require('../models/taskModel');

/**
 * Create a new task
 */
const createTask = async (userId, data) => {
  const { title, description, status, priority, due_date } = data;
  return taskModel.create({
    userId,
    title: title.trim(),
    description: description !== undefined ? description : null,
    status: status || 'pending',
    priority: priority || 'medium',
    dueDate: due_date || null,
  });
};

/**
 * Get single task by ID with ownership verification
 */
const getTaskById = async (taskId, userId) => {
  const task = await taskModel.findById(taskId);
  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  if (task.user_id !== userId) {
    const error = new Error('Forbidden: You do not have permission to access this task');
    error.status = 403;
    throw error;
  }

  return task;
};

/**
 * Update task with ownership verification
 */
const updateTask = async (taskId, userId, data) => {
  const existing = await taskModel.findById(taskId);
  if (!existing) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  if (existing.user_id !== userId) {
    const error = new Error('Forbidden: You do not have permission to modify this task');
    error.status = 403;
    throw error;
  }

  const { title, description, status, priority, due_date } = data;

  const updated = await taskModel.update(taskId, userId, {
    title: title ? title.trim() : existing.title,
    description: description !== undefined ? description : existing.description,
    status: status || existing.status,
    priority: priority || existing.priority,
    dueDate: due_date !== undefined ? due_date : existing.due_date,
  });

  return updated;
};

/**
 * Delete task with ownership verification
 */
const deleteTask = async (taskId, userId) => {
  const existing = await taskModel.findById(taskId);
  if (!existing) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  if (existing.user_id !== userId) {
    const error = new Error('Forbidden: You do not have permission to delete this task');
    error.status = 403;
    throw error;
  }

  await taskModel.deleteById(taskId, userId);
  return { message: 'Task deleted successfully' };
};

/**
 * List tasks with search, filter, sort and pagination
 */
const listTasks = async (userId, queryParams) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 10));
  const search = queryParams.search || queryParams.q || '';
  const status = queryParams.status || null;
  const priority = queryParams.priority || null;
  const sortBy = queryParams.sortBy || queryParams.sort || 'created_at';
  const order = queryParams.order || 'DESC';

  const { tasks, total } = await taskModel.findMany({
    userId,
    search,
    status,
    priority,
    sortBy,
    order,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    tasks,
    total,
    page,
    limit,
    totalPages,
  };
};

module.exports = {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  listTasks,
};
