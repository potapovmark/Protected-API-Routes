import express from 'express';
import Joi from 'joi';
import { Todo } from '../models/Todo';
import { authenticateToken, requireEmailVerification, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireEmailVerification);

const createTodoSchema = Joi.object({
  text: Joi.string().required().max(200),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  category: Joi.string().required().max(50),
  dueDate: Joi.date().optional()
});

const updateTodoSchema = Joi.object({
  text: Joi.string().max(200).optional(),
  completed: Joi.boolean().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  category: Joi.string().max(50).optional(),
  dueDate: Joi.date().optional()
});

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = { userId: req.user!.userId };

    if (req.query.completed !== undefined) {
      filters.completed = req.query.completed === 'true';
    }

    if (req.query.priority) {
      filters.priority = req.query.priority;
    }

    const todos = await Todo.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

    const total = await Todo.countDocuments(filters);

    res.json({
      success: true,
      data: {
        todos,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch todos',
    });
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { error, value } = createTodoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const todo = new Todo({
      ...value,
      userId: req.user!.userId
    });

    await todo.save();

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create todo'
    });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { error, value } = updateTodoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user!.userId });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    Object.assign(todo, value);
    await todo.save();

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update todo'
    });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete todo'
    });
  }
});

export default router;
