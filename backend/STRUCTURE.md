# Backend Structure Overview

## File Organization

```
backend/src/
├── server.js (18 lines)           # Main entry point
├── config/
│   └── db.js (13 lines)           # Database connection
├── models/
│   └── User.js (25 lines)         # User schema + password hashing
├── controllers/
│   └── authController.js (91 lines) # Auth business logic
├── middleware/
│   └── auth.js (23 lines)         # JWT verification
└── routes/
    └── authRoutes.js (12 lines)   # Route definitions
```

**Total: 182 lines of code**

## Flow Diagram

```
Request → server.js → routes → middleware → controller → model → database
                                    ↓
Response ← server.js ← routes ← controller ← model ← database
```

## File Responsibilities

### server.js
- Initialize Express app
- Setup middleware (CORS, JSON parser)
- Connect routes
- Start server

### config/db.js
- Connect to MongoDB
- Handle connection errors

### models/User.js
- Define user schema
- Hash passwords before saving
- Compare password method

### controllers/authController.js
- `signup()` - Create new user
- `login()` - Authenticate user
- `getMe()` - Get current user
- `updateProfile()` - Update user info

### middleware/auth.js
- `protect()` - Verify JWT token
- Attach user to request

### routes/authRoutes.js
- Define API endpoints
- Apply middleware to protected routes

## Request Flow Example

**Login Request:**
```
POST /api/auth/login
↓
server.js (receives request)
↓
authRoutes.js (matches route)
↓
authController.login() (handles logic)
↓
User.findOne() (queries database)
↓
user.comparePassword() (verifies password)
↓
generateToken() (creates JWT)
↓
Response sent back
```

**Protected Request:**
```
GET /api/auth/me
↓
server.js
↓
authRoutes.js
↓
auth.protect() (middleware - verifies token)
↓
authController.getMe() (gets user data)
↓
Response sent back
```

## Why This Structure?

✅ **Separation of Concerns** - Each file has one job
✅ **Easy to Understand** - Clear file names and structure
✅ **Maintainable** - Easy to find and modify code
✅ **Scalable** - Easy to add new features
✅ **Professional** - Industry-standard MVC pattern
✅ **Minimal** - No unnecessary code or files
