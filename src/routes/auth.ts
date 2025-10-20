import express from 'express';
import rateLimit from 'express-rate-limit';
import { registrationService } from '../services/registrationService';
import { authService } from '../services/authService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many registration attempts, please try again later'
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many verification attempts, please try again later'
});

router.post('/register', registrationLimiter, async (req, res) => {
  const result = await registrationService.registerUser(req.body);

  if (result.success) {
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: result.data
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error
    });
  }
});

router.get('/verify-email', verificationLimiter, async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Verification token is required'
    });
  }

  const result = await registrationService.verifyEmail(token as string);

  if (result.success) {
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error
    });
  }
});

router.post('/resend-verification', verificationLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  const result = await registrationService.resendVerification(email);

  if (result.success) {
    res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: result.data
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error
    });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (result.success) {
      res.json({
        success: true,
        message: 'Login successful',
        data: result.data
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  });

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    if (result.success) {
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result.data
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  });

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const result = await authService.logout(refreshToken);

    if (result.success) {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  });

router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await authService.getUserProfile(req.user.userId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          user: result.data
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
