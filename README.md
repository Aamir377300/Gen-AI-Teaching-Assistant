# 🎓 Class Assistant — AI-Powered Teaching Platform

> A full-stack platform that helps teachers do more and students learn better — powered by AI, built for the classroom.

---

## What is this?

Class Assistant is a web app built for teachers and students. Teachers can generate study materials, create assignments, run live Google Meet sessions, and chat with an AI assistant trained on their own PDFs. Students get a clean space to access everything their teacher shares, attempt quizzes (once!), submit assignments, and join live classes.

No more copy-pasting from ChatGPT into Word docs. Everything lives in one place.

---

## Features

### 👩‍🏫 For Teachers
- **AI Content Generation** — Generate detailed notes, presentation slides, and MCQ quizzes on any topic using Groq (Llama 3.1)
- **PDF Export** — Download generated notes and slides as beautifully formatted PDFs, uploaded to Cloudinary
- **Assignments** — Create assignments with file attachments, set deadlines, and review student submissions
- **Live Classes** — Connect your Google account and instantly spin up a Google Meet link for your students
- **Chat Assistant (RAG)** — Upload your own PDFs and ask questions — the AI answers strictly from your documents using Pinecone vector search
- **Quiz Results** — See every student's score in a modal, download a full results sheet as a PDF

### 🧑‍🎓 For Students
- **Access shared materials** — Notes and slides published by your teacher, ready to read or download
- **Attempt quizzes** — One attempt per quiz, results saved permanently to MongoDB
- **Submit assignments** — Upload files directly from the browser
- **Join live classes** — See your teacher's active Google Meet link the moment it goes live (auto-refreshes every 30s)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, React Router |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT |
| AI / LLM | Groq API (Llama 3.1 8B) |
| RAG | Python FastAPI, Pinecone, sentence-transformers |
| File Storage | Cloudinary |
| Google Integration | Google Calendar API (per-user OAuth) |
| PDF Generation | PDFKit |

---

## Project Structure

```
.
├── frontend/               # React + Vite app
│   └── src/
│       ├── pages/          # All page components
│       ├── components/     # Reusable UI components
│       ├── context/        # Auth context
│       ├── services/       # Axios API client
│       └── layouts/        # Dashboard layout + sidebar
│
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   ├── middleware/      # JWT auth middleware
│   │   └── server.js       # Entry point
│   │
│   └── RAG/                # Python FastAPI RAG service
│       ├── api/api.py      # FastAPI endpoints
│       └── rag_app/        # PDF loader, embeddings, vector store
│
└── package.json            # Root scripts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- A [Groq API key](https://console.groq.com)
- A [Pinecone account](https://pinecone.io)
- A [Cloudinary account](https://cloudinary.com)
- A Google Cloud project with Calendar API enabled

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/class-assistant.git
cd class-assistant
```

### 2. Install dependencies

```bash
# Install everything at once
npm run install:all

# Or manually
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment variables

**Backend** — copy and fill in `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080

GROQ_API_KEY=your_groq_api_key
AI_MODEL=llama-3.1-8b-instant

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5002/api/gauth/callback

PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
```

**RAG service** — copy and fill in `backend/RAG/.env`:

```bash
cp backend/RAG/.env.example backend/RAG/.env  # or create manually
```

```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
```

**Frontend** — copy and fill in `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_BASE_URL=http://localhost:5002/api
```

---

### 4. Set up the Python RAG service

```bash
cd backend/RAG
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

### 5. Run the app

The backend `npm run dev` starts both the Node.js server and the Python FastAPI service together:

```bash
# Terminal 1 — Backend (Node + FastAPI)
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Node API | http://localhost:5002 |
| RAG API | http://localhost:8000 |

---

## Google Meet Integration (per-teacher OAuth)

Each teacher connects their own Google account — Meet links are created under their Calendar, not a shared admin account.

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:5002/api/gauth/callback` as an authorized redirect URI
4. Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`
5. Teachers click **"Connect Google"** on the Live Class page — done

---

## User Roles

| Role | How they're created |
|---|---|
| **Teacher** | Signs up directly via `/signup` |
| **Student** | Generated by a teacher from the dashboard (auto-gets credentials) |

Students log in with a generated Student ID + password. They can only see content created by the teacher who generated their account.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Teacher registration |
| POST | `/api/auth/login` | Login (email or student ID) |
| POST | `/api/content/generate` | Generate notes |
| POST | `/api/content/generate/quiz` | Generate quiz |
| POST | `/api/content/quiz/:id/attempt` | Submit quiz attempt (students, once only) |
| GET | `/api/content/quiz/:id/results` | Get all student results (teacher) |
| GET | `/api/content/quiz/:id/results/pdf` | Download results as PDF |
| POST | `/api/live/start` | Start a live class (creates Google Meet) |
| GET | `/api/live/active` | Get active class for a student |
| GET | `/api/gauth/connect` | Initiate Google OAuth for a teacher |
| POST | `/api/assignments` | Create assignment |
| POST | `/api/assignments/:id/submit` | Submit assignment |

---

