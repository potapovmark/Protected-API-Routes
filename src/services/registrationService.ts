import { User, IUser } from '../models/User';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { emailService } from '../utils/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  profile: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    bio: Joi.string().max(500).optional()
  }).required()
});

export interface RegistrationResult {
  success: boolean;
  data?: Partial<IUser>;
  error?: string;
}

export interface VerificationResult {
  success: boolean;
  data?: {
    verificationToken?: string;
    message?: string;
    isEmailVerified?: boolean;
  };
  error?: string;
}

export const registrationService = {
  async registerUser(userData: any): Promise<RegistrationResult> {
    try {
      const { error, value } = registrationSchema.validate(userData);
      if (error) {
        return { success: false, error: error.details[0].message };
      }

      const existingUser = await User.findOne({
        $or: [{ email: value.email }, { username: value.username }]
      });

      if (existingUser) {
        return { success: false, error: 'User with this email or username already exists' };
      }

      const verificationToken = jwt.sign({ email: value.email }, JWT_SECRET, { expiresIn: '24h' });

      const user = new User({
        ...value,
        emailVerificationToken: verificationToken
      });

      await user.save();

      // await emailService.sendVerificationEmail(value.email, verificationToken);

      return {
        success: true,
        data: {
          email: user.email,
          username: user.username,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile
        }
      };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  },

  async verifyEmail(token: string): Promise<VerificationResult> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        return { success: false, error: 'Invalid verification token' };
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      return { success: true, data: { isEmailVerified: true } };
    } catch (error) {
      return { success: false, error: 'Invalid or expired token' };
    }
  },

  async resendVerification(email: string): Promise<VerificationResult> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.isEmailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
      user.emailVerificationToken = verificationToken;
      await user.save();

      // await emailService.sendVerificationEmail(email, verificationToken);

      return {
        success: true,
        data: {
          verificationToken,
          message: 'Verification token generated successfully'
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to resend verification' };
    }
  }
};
