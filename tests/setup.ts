import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
