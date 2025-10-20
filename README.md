Production-ready JWT authentication with React frontend.

## 🚀 Start

```bash
npm install
npm run dev          # Backend (port 3000)
npm run client:dev   # Frontend (port 3001)
```

## 🧪 Test

**Registration & Login:**

- Open http://localhost:3001
- Register with password: `Password123!`
- Login: `testuser@example.com` / `Password123!`

**Email Verification:**

- New users: verify in profile
- One-click verification

**Protected Routes:**

- Try `/profile` without login - blocked
- Auto token refresh works

## 🔧 API

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Profile (protected)
- `POST /api/auth/resend-verification` - Email verification
