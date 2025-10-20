import { registrationService } from '../src/services/registrationService';
import { User } from '../src/models/User';
import mongoose from 'mongoose';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/user-registration-test');
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('RegistrationService', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'Password123!',
    username: 'testuser',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      bio: 'Test user bio'
    }
  };

  test('should register a new user successfully', async () => {
    const result = await registrationService.registerUser(validUserData);

    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('test@example.com');
    expect(result.data?.isEmailVerified).toBe(false);
    expect(result.data?.username).toBe('testuser');
  });

  test('should reject duplicate email', async () => {
    await registrationService.registerUser(validUserData);

    const duplicateData = { ...validUserData, username: 'differentuser' };
    const result = await registrationService.registerUser(duplicateData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  test('should reject duplicate username', async () => {
    await registrationService.registerUser(validUserData);

    const duplicateData = { ...validUserData, email: 'different@example.com' };
    const result = await registrationService.registerUser(duplicateData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  test('should reject invalid email format', async () => {
    const invalidData = { ...validUserData, email: 'invalid-email' };
    const result = await registrationService.registerUser(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });

  test('should reject weak password', async () => {
    const invalidData = { ...validUserData, password: 'weak' };
    const result = await registrationService.registerUser(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('password');
  });

  test('should verify email successfully', async () => {
    const registrationResult = await registrationService.registerUser(validUserData);
    expect(registrationResult.success).toBe(true);

    const user = await User.findOne({ email: validUserData.email });
    const token = user?.emailVerificationToken;

    const verificationResult = await registrationService.verifyEmail(token!);

    expect(verificationResult.success).toBe(true);
    expect(verificationResult.data?.isEmailVerified).toBe(true);
  });

  test('should reject invalid verification token', async () => {
    const result = await registrationService.verifyEmail('invalid-token');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid or expired token');
  });

  test('should resend verification email', async () => {
    await registrationService.registerUser(validUserData);

    const result = await registrationService.resendVerification(validUserData.email);

    expect(result.success).toBe(true);
  });

  test('should reject resend for non-existent user', async () => {
    const result = await registrationService.resendVerification('nonexistent@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('User not found');
  });
});


