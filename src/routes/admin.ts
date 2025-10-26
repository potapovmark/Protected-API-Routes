import express from 'express';
import { User } from '../models/User';
import { Todo } from '../models/Todo';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filters.$or = [
        { email: searchRegex },
        { username: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex }
      ];
    }

    if (req.query.role) {
      filters.role = req.query.role;
    }

    const users = await User.find(filters)
      .select('-password -refreshTokens -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filters);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

router.put('/users/:id/role', async (req: AuthenticatedRequest, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    if (req.params.id === req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -refreshTokens -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.logAdminAction(req.user!.userId, 'ROLE_UPDATE', req.params.id, { newRole: role, oldRole: user.role });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

router.get('/users/:id/todos', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = { userId: id };

    if (req.query.completed !== undefined) {
      filters.completed = req.query.completed === 'true';
    }

    if (req.query.priority) {
      filters.priority = req.query.priority;
    }

    if (req.query.category) {
      filters.category = new RegExp(req.query.category as string, 'i');
    }

    const todos = await Todo.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Todo.countDocuments(filters);

    res.json({
      success: true,
      data: {
        todos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user todos'
    });
  }
});

router.put('/users/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value'
      });
    }

    if (id === req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot change your own status'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password -refreshTokens -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.logAdminAction(req.user!.userId, 'STATUS_UPDATE', id, { isActive });

    res.json({
      success: true,
      data: user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

router.get('/statistics', async (req: AuthenticatedRequest, res) => {
  try {
    const [userStats, todoStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
            adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
          }
        }
      ]),
      Todo.aggregate([
        {
          $group: {
            _id: null,
            totalTodos: { $sum: 1 },
            completedTodos: { $sum: { $cond: ['$completed', 1, 0] } },
            pendingTodos: { $sum: { $cond: ['$completed', 0, 1] } }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: userStats[0] || {},
        todos: todoStats[0] || {},
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
