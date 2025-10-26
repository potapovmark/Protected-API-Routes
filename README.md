JWT Authentication System with React & Express

## Quick Start

```bash
npm install
npm run dev          # Backend (port 3000)
npm run client:dev   # Frontend (port 3001)
```

## Test Accounts

- **User:** `testuser@example.com` / `TestPass123!`
- **Admin:** `admin@example.com` / `Admin123!`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/resend-verification` - Resend email verification token
- `GET /api/auth/verify-email` - Verify email with token
- `POST /api/auth/unlock-account` - Unlock user account (admin only)

### Profile
- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update user profile (protected)
- `GET /api/profile/:id` - Get public profile by ID

### Todos
- `GET /api/protected/todos` - Get all todos (email verified required)
- `POST /api/protected/todos` - Create new todo
- `PUT /api/protected/todos/:id` - Update todo
- `DELETE /api/protected/todos/:id` - Delete todo
- `GET /api/protected/todos/stats` - Get todo statistics

### Admin
- `GET /api/admin/users` - Get all users with pagination and search (admin only)
- `PUT /api/admin/users/:id/role` - Update user role (admin only)
- `GET /api/admin/users/:id/todos` - View user todos (admin only)
- `PUT /api/admin/users/:id/status` - Activate/deactivate user (admin only)
- `GET /api/admin/statistics` - Get system statistics (admin only)

## Security & Authorization

### Protected Endpoints

- `/api/profile/*` - Requires valid JWT token
- `/api/protected/todos/*` - Requires JWT + email verification
- `/api/admin/*` - Requires JWT + admin role

### Security Features

- Account lockout after 5 failed login attempts
- User activation/deactivation
- Logging of authentication failures and admin actions
- Email verification system
- JWT access and refresh tokens
