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
- **Assignments** — Create or AI-generate assignments with file attachments, set deadlines, and review student submissions
- **Live Classes** — Connect your Google account and instantly spin up a Google Meet link for your students
- **Chat Assistant** — Persistent multi-session AI chat with image support (Llama 3.2 Vision) and conversation history
- **RAG (PDF Chat)** — Upload your own PDFs and ask questions — the AI answers strictly from your documents using Pinecone vector search. Also generate notes, slides, or quizzes directly from a PDF
- **Quiz Results** — See every student's score in a modal, download a full results sheet as a PDF

### 🧑‍🎓 For Students
- **Access shared materials** — Notes and slides published by your teacher, ready to read or download
- **Attempt quizzes** — One attempt per quiz, results saved permanently to MongoDB
- **Submit assignments** — Upload files directly from the browser
- **Join live classes** — See your teacher's active Google Meet link the moment it goes live (auto-refreshes every 30s)
- **Chat Assistant** — Ask the AI questions in a persistent chat with full conversation history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, React Router |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT |
| AI / LLM | Groq API (Llama 3.1 8B for text, Llama 3.2 11B Vision for images) |
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
PYTHON_RAG_URL=http://localhost:8000
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

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Teacher registration |
| POST | `/api/auth/login` | Login (email or student ID) |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/update` | Update profile |
| POST | `/api/auth/generate-students` | Teacher generates student accounts |

### Content
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/content/generate` | Generate notes |
| POST | `/api/content/generate/slides` | Generate slides |
| POST | `/api/content/generate/quiz` | Generate quiz |
| POST | `/api/content/saved` | Save notes |
| POST | `/api/content/saved/slides` | Save slides |
| POST | `/api/content/saved/quiz` | Save quiz |
| GET | `/api/content/saved` | Get saved notes/slides |
| GET | `/api/content/saved/quizzes` | Get saved quizzes |
| DELETE | `/api/content/saved/:id` | Delete saved content |
| DELETE | `/api/content/quiz/:id` | Delete quiz |
| POST | `/api/content/quiz/:id/attempt` | Submit quiz attempt (students, once only) |
| GET | `/api/content/quiz/:id/my-result` | Get own quiz result (student) |
| GET | `/api/content/quiz/:id/results` | Get all student results (teacher) |
| GET | `/api/content/quiz/:id/results/pdf` | Download results as PDF |

### Chat (AI Assistant)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/sessions` | List all chat sessions |
| POST | `/api/chat/sessions` | Create a new chat session |
| GET | `/api/chat/sessions/:id` | Get a session with messages |
| PUT | `/api/chat/sessions/:id/namespace` | Attach a PDF namespace to a session |
| POST | `/api/chat/sessions/:id/message` | Send a message (supports images via base64) |

### RAG (PDF Intelligence)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rag/upload` | Upload PDF → embed and store in Pinecone |
| POST | `/api/rag/ask` | Ask a question against a PDF namespace |
| POST | `/api/rag/generate-content` | Generate notes or slides from a PDF |
| POST | `/api/rag/generate-quiz` | Generate a quiz from a PDF |

### Assignments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/assignments/generate` | AI-generate an assignment |
| POST | `/api/assignments` | Create assignment (with optional file) |
| GET | `/api/assignments/teacher` | Get teacher's assignments |
| GET | `/api/assignments/student` | Get student's assignments |
| POST | `/api/assignments/:id/submit` | Submit assignment |
| GET | `/api/assignments/:id/submissions` | View submissions (teacher) |
| DELETE | `/api/assignments/:id` | Delete assignment |

### Live Classes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/live/start` | Start a live class (creates Google Meet) |
| PUT | `/api/live/:id/end` | End a live class |
| GET | `/api/live/teacher` | Get teacher's live class history |
| GET | `/api/live/active` | Get active class for a student |

### Google OAuth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/gauth/connect` | Initiate Google OAuth for a teacher |
| GET | `/api/gauth/callback` | OAuth callback (handled automatically) |
| POST | `/api/gauth/disconnect` | Disconnect Google account |
| GET | `/api/gauth/status` | Check if Google is connected |

---


---

## 🚀 Deployment & Environment Checkpoints

When moving from local development to production (e.g., Render), use this checklist to ensure all connections are correctly configured.

### Comparison Table: Local vs. Render

| Feature | Localhost Checkpoint | Render (Production) Checkpoint |
|---|---|---|
| **Frontend API URL** | `VITE_API_BASE_URL=http://localhost:5002/api` | `VITE_API_BASE_URL=https://your-backend.onrender.com/api` |
| **Backend CORS** | `FRONTEND_URL=http://localhost:8080` | `FRONTEND_URL=https://your-frontend.vercel.app` |
| **MongoDB** | `MONGODB_URI=mongodb://localhost:27017/...` | `MONGODB_URI=mongodb+srv://user:pass@cluster...` |
| **Google Redirect** | `http://localhost:5002/api/gauth/callback` | `https://your-backend.onrender.com/api/gauth/callback` |
| **Python RAG URL** | `http://localhost:8000` | `https://your-python-service.onrender.com` |
| **Node.js Port** | `5002` (manually set) | `PORT` (automatically set by Render) |

### 🛠️ Verification Commands

Once deployed, you can verify your backend's health by visiting:
`https://your-backend.onrender.com/api/health`

This will return a JSON object showing the status of your Database and Python RAG connections.

---
