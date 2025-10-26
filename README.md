JWT Authentication System with React & Express

## Quick Start

```bash
npm install
npm run dev          # Backend (port 3000)
npm run client:dev   # Frontend (port 3002)
```

## Test Accounts

- **User:** `testuser@example.com` / `TestPass123!`
- **Admin:** `admin@example.com` / `Admin123!`

## API Endpoints

**Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
**Profile:** `/api/profile` (protected)
**Todos:** `/api/protected/todos` (email verified required)
**Admin:** `/api/admin/users` (admin role required)

## Security & Authorization

### Protected Endpoints

- `/api/profile/*` - Requires valid JWT token
- `/api/protected/todos/*` - Requires JWT + email verification
- `/api/admin/*` - Requires JWT + admin role
