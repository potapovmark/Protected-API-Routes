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
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
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

router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const stats = await Todo.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: { $sum: { $cond: ['$completed', 1, 0] } },
          pendingTodos: { $sum: { $cond: ['$completed', 0, 1] } },
          highPriorityTodos: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriorityTodos: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowPriorityTodos: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Todo.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const overdueTodos = await Todo.countDocuments({
      userId,
      dueDate: { $lt: new Date() },
      completed: false
    });

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalTodos: 0,
          completedTodos: 0,
          pendingTodos: 0,
          highPriorityTodos: 0,
          mediumPriorityTodos: 0,
          lowPriorityTodos: 0
        },
        categories: categoryStats,
        overdueTodos,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch todo statistics'
    });
  }
});

export default router;
