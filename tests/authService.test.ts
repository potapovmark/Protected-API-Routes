import { authService } from '../src/services/authService';
import { User } from '../src/models/User';
import mongoose from 'mongoose';

describe('AuthService', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test-user-registration');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      await User.create({
        ...userData,
        isEmailVerified: true
      });

      const result = await authService.login(userData.email, userData.password);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid credentials', async () => {
      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        isEmailVerified: true
      });

      const refreshToken = authService.generateRefreshToken(user);
      user.refreshTokens.push(refreshToken);
      await user.save();

      const result = await authService.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        isEmailVerified: true
      });

      const refreshToken = authService.generateRefreshToken(user);
      user.refreshTokens.push(refreshToken);
      await user.save();

      const result = await authService.logout(refreshToken);

      expect(result.success).toBe(true);
    });
  });
});
