import {User, IUser} from '../models/User';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

export interface LoginResult {
  success: boolean;
  data?: {
    user: Partial<IUser>;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
  accountLocked?: boolean;
  accountDeactivated?: boolean;
  remainingAttempts?: number;
}

export interface TokenResult {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

const loginSchema = Joi.object({
  email:Joi.string().email().required(),
  password: Joi.string().required()
});

export const authService = {
  async login(email: string, password: string, ip?: string, userAgent?: string): Promise<LoginResult> {
    try {
      const {error} = loginSchema.validate({email, password});
      if (error) return {success: false, error: 'Invalid email or password'};

      const user = await User.findOne({email: email.toLowerCase()});
      if (!user) {
        logger.logAuthFailure(email, 'User not found', ip, userAgent);
        return {success: false, error: 'Invalid email'};
      }

      if (!user.isActive) {
        logger.logAuthFailure(email, 'Account deactivated', ip, userAgent);
        return {
          success: false,
          error: 'Account is deactivated. Please contact administrator.',
          accountDeactivated: true
        };
      }

      if (user.isLocked) {
        const lockTime = user.lockUntil ? Math.round((user.lockUntil.getTime() - Date.now()) / 1000 / 60) : 0;
        return {
          success: false,
          error: `Account locked. Try again in ${lockTime} minutes.`,
          accountLocked: true
        };
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        user.loginAttempts += 1;

        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await user.save();

        const remainingAttempts = 5 - user.loginAttempts;
        if (remainingAttempts > 0) {
          logger.logAuthFailure(email, `Invalid password - ${remainingAttempts} attempts remaining`, ip, userAgent);
          return {
            success: false,
            error: `Invalid password. ${remainingAttempts} attempts remaining.`,
            remainingAttempts: remainingAttempts
          };
        } else {
          logger.logAuthFailure(email, 'Account locked due to too many failed attempts', ip, userAgent);
          return {
            success: false,
            error: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
            accountLocked: true
          };
        }
      }

      if (user.loginAttempts > 0 || user.lockUntil) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      const accessToken = jwt.sign({userId: user._id}, JWT_SECRET, {expiresIn: '15min'});
      const refreshToken = jwt.sign({userId: user._id}, JWT_REFRESH_SECRET, {expiresIn: '7d'});

      user.refreshTokens.push(refreshToken);
      await user.save();

      logger.logAuthSuccess(user._id.toString(), user.email, ip, userAgent);
      return {success: true, data: {user: { _id: user._id, email: user.email, username: user.username, role: user.role }, accessToken, refreshToken}};
    } catch (error) {
      return {success: false, error: 'Login failed'};
    }
  },

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {userId: string};
      const user = await User.findById(decoded.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return {success: false, error: 'Invalid refresh token'};
      }

      const newAccessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15min' });
      const newRefreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      user.refreshTokens.push(newRefreshToken);
      await user.save();

      return { success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } };
    } catch (error) {
      return { success: false, error: 'Invalid refresh token' };
    }
  },
  async verifyAccessToken(token: string): Promise<{ userId: string; email: string; role: string, isEmailVerified: boolean } | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      const user = await User.findById(decoded.userId).select('email role isEmailVerified');
      if (!user) {
        return null;
      }

      return {
        userId: decoded.userId,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    } catch (error) {
      return null;
    }
  },

  async logout(refreshToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (user) {
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  },

  generateAccessToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  },

  generateRefreshToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  },

  async getUserProfile(userId: string) {
    try {
      const user = await User.findById(userId).select('-password -refreshTokens -emailVerificationToken');

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: user };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { success: false, error: 'Failed to get user profile' };
    }
  },

  async unlockAccount(userId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const admin = await User.findById(adminUserId);
      if (!admin || admin.role !== 'admin') {
        return { success: false, error: 'Unauthorized. Admin access required.' };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to unlock account' };
    }
  }
}
