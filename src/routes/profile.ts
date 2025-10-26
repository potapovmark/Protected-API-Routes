import express from 'express';
import Joi from 'joi';
import { User } from '../models/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  profile: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    bio: Joi.string().max(500).allow('')
  })
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId)
      .select('-password -refreshTokens -emailVerificationToken -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

router.put('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    if (value.username) {
      const existingUser = await User.findOne({
        username: value.username,
        _id: { $ne: req.user!.userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      value,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -emailVerificationToken -loginAttempts -lockUntil');

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email profile.firstName profile.lastName profile.bio createdAt isEmailVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

export default router;
