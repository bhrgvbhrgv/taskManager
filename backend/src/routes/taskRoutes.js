const express = require('express');
const { body, param } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Protect all task routes
router.use(authenticate);

const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a valid positive integer'),
];

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title cannot exceed 255 characters'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Status must be pending, in_progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('due_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),
];

const updateTaskValidation = [
  ...idParamValidation,
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title cannot exceed 255 characters'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Status must be pending, in_progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('due_date')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      if (isNaN(Date.parse(val))) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    }),
];

router.get('/', taskController.listTasks);
router.get('/:id', idParamValidation, validate, taskController.getTask);
router.post('/', createTaskValidation, validate, taskController.createTask);
router.put('/:id', updateTaskValidation, validate, taskController.updateTask);
router.delete('/:id', idParamValidation, validate, taskController.deleteTask);

module.exports = router;
