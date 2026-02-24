# Backend - Class Assistant

Clean and minimal Node.js + Express backend with proper MVC structure.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/class-assistant
JWT_SECRET=your-secret-key
```

4. Start server:
```bash
npm run dev
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   └── authController.js  # Auth logic (signup, login, etc)
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── models/
│   │   └── User.js            # User schema
│   ├── routes/
│   │   └── authRoutes.js      # Auth endpoints
│   └── server.js              # Main app setup
├── .env.example
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Register user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/me | Get current user | Yes |
| PUT | /api/auth/update | Update profile | Yes |

## File Descriptions

- **server.js** - Express app setup, middleware, routes
- **config/db.js** - MongoDB connection
- **models/User.js** - User schema with password hashing
- **controllers/authController.js** - Business logic for auth
- **routes/authRoutes.js** - Route definitions
- **middleware/auth.js** - JWT token verification

## Features

✅ Clean MVC architecture
✅ JWT authentication
✅ Password hashing (bcrypt)
✅ MongoDB integration
✅ Protected routes
✅ Error handling
