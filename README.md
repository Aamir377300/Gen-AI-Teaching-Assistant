# Class Assistant

AI-powered class assistant application with React frontend and Node.js backend.

## Project Structure

```
.
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── README.md
└── SETUP.md
```

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:8080`

## Features

- User authentication (signup/login)
- JWT token authorization
- MongoDB database
- Password hashing
- React dashboard
- Tailwind CSS styling

## Tech Stack

**Frontend:**
- React 18 + Vite
- React Router
- Tailwind CSS
- Axios

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- CORS

## API Endpoints

- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update` - Update profile

See `SETUP.md` for detailed setup instructions.
