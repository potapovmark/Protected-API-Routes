import {User, IUser} from '../models/User';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

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
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const {error} = loginSchema.validate({email, password});
      if (error) return {success: false, error: 'Invalid email or password'};

      const user = await User.findOne({email: email.toLowerCase()});
      if (!user || !await user.comparePassword(password)) {
        return {success: false, error: 'Invalid email or password'};
      }

      const accessToken = jwt.sign({userId: user._id}, JWT_SECRET, {expiresIn: '15min'});
      const refreshToken = jwt.sign({userId: user._id}, JWT_REFRESH_SECRET, {expiresIn: '7d'});

      user.refreshTokens.push(refreshToken);
      await user.save();

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
  verifyAccessToken(token: string): { userId: string; email: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
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
  }
}
