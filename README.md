# CodeArena
> **Where code meets the arena - write it, run it, prove it.**

A competitive-programming style Online Judge built with **MongoDB, Express, React, Node.js (MERN)**.  
Supports problem listing, code submission & automatic grading (C++, Python, Java),
a leaderboard of recent submissions, and JWT-based user authentication.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                    React + Vite SPA                         │
│         (Landing → Login → Problems → Submit)               │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTP requests (/api/...)
                      │  JWT token in Authorization header
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER (Node.js)                   │
│                      Port 5001                              │
│                                                             │
│   /api/auth/*      → authController   (register, login)    │
│   /api/problems/*  → problemController (list, detail)      │
│   /api/submissions → solutionController (submit + grade)   │
│   /api/leaderboard → solutionController (recent verdicts)  │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐   ┌─────────────────────────────────────┐
│    MongoDB       │   │        codeExecutor.js              │
│                  │   │                                     │
│  users           │   │  1. Write code to /tmp/oj-xxxx/     │
│  problems        │   │  2. Compile (g++ / javac)           │
│  testcases       │   │  3. Run against each test case      │
│  solutions       │   │  4. Compare output                  │
└──────────────────┘   │  5. Return verdict                  │
                       └──────────────┬──────────────────────┘
                                      │ docker run
                                      ▼
                       ┌─────────────────────────────────────┐
                       │         Docker Container            │
                       │    online-judge-executor image      │
                       │                                     │
                       │  --network=none   (no internet)     │
                       │  --memory=256m    (RAM cap)         │
                       │  --cpus=1.0       (CPU cap)         │
                       │  --pids-limit=128 (no fork bombs)   │
                       │  --cap-drop=ALL   (no privileges)   │
                       └─────────────────────────────────────┘
```

---

### Submission Flow (End to End)

```
User types code → clicks Submit
        │
        ▼
Frontend sends POST /api/submissions
{ problemId, language, source }
+ JWT token in header
        │
        ▼
auth middleware checks JWT token
(is this a valid logged-in user?)
        │
        ▼
solutionController.submit()
  → fetch test cases from MongoDB
  → call codeExecutor.grade()
        │
        ▼
codeExecutor.grade()
  → write source to temp folder
  → if C++ or Java: compile first
  → for each test case:
       run code inside Docker container
       feed input via stdin
       capture output
       compare with expected output
  → return verdict
        │
        ▼
verdict saved to MongoDB (solutions collection)
        │
        ▼
response sent back to frontend
User sees: Accepted / Wrong Answer / TLE / RE / CE
```

---

### Auth Flow (JWT)

```
Register:
  User submits name + email + password
  → password hashed with bcrypt (salt rounds=10)
  → user saved to MongoDB
  → JWT token generated and returned

Login:
  User submits email + password
  → bcrypt compares password with stored hash
  → if match: JWT token returned
  → token stored in browser localStorage

Protected Routes:
  Every request to /api/submissions, /api/problems (POST)
  → auth middleware extracts token from header
  → verifies token with JWT_SECRET
  → attaches user to request object
  → if invalid/missing: 401 Unauthorized
```

---

## Project Structure

```
CodeArena/
├── backend/
│   ├── config/
│   │   └── db.js                   # MongoDB connection using Mongoose
│   ├── models/
│   │   ├── User.js                 # Schema: username, email, hashed password, role
│   │   ├── Problem.js              # Schema: name, code, statement, difficulty, timeLimit
│   │   ├── TestCase.js             # Schema: input, output, problem ref, isSample flag
│   │   └── Solution.js             # Schema: user, problem, language, verdict, passCount
│   ├── controllers/
│   │   ├── authController.js       # register / login / me
│   │   ├── problemController.js    # list / detail / create
│   │   └── solutionController.js   # submit / grade / leaderboard
│   ├── routes/
│   │   ├── authRoutes.js           # POST /register, POST /login, GET /me
│   │   ├── problemRoutes.js        # GET /problems, GET /problems/:id
│   │   └── solutionRoutes.js       # POST /submissions, GET /leaderboard
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware (protect)
│   │   └── errorHandler.js         # Global error handler
│   ├── services/
│   │   └── codeExecutor.js         # Core grading engine — compile, run, compare
│   ├── docker/
│   │   └── Dockerfile              # Ubuntu + g++ + python3 + JDK17 sandbox image
│   ├── seed.js                     # Seeds admin user + 12 problems with test cases
│   └── server.js                   # Express app entry point
│
└── frontend/
    └── src/
        ├── api/
        │   └── client.js           # Axios instance — auto-attaches JWT to requests
        ├── context/
        │   ├── AuthContext.jsx     # Global auth state (user, login, logout)
        │   └── ThemeContext.jsx    # Dark/light mode toggle, persisted in localStorage
        ├── pages/
        │   ├── Landing.jsx         # Public landing page with hero + features
        │   ├── Login.jsx           # Login form → stores JWT on success
        │   ├── Register.jsx        # Register form → stores JWT on success
        │   ├── ProblemList.jsx     # Lists all 12 problems with difficulty badges
        │   ├── ProblemDetail.jsx   # Problem statement + code editor + submit
        │   └── Leaderboard.jsx     # Last 10 submissions with verdicts
        ├── App.jsx                 # Routes + auth guard (unauthenticated → landing)
        └── main.jsx                # React entry point
```

---

## Key Design Decisions

**Why Docker for code execution?**
User-submitted code is untrusted. Without isolation, malicious code could delete files,
consume all RAM, or make network requests. Docker containers give each submission a sealed
environment with hard memory/CPU caps, no network, and no system privileges.

**Why JWT for auth?**
JWT (JSON Web Token) is stateless — the server doesn't need to store sessions.
The token is signed with a secret key and contains the user ID. Every protected request
sends this token; the server verifies it without hitting the database.

**Why bcrypt for passwords?**
bcrypt is a one-way hashing algorithm designed to be slow (to resist brute force).
Even if the database is leaked, raw passwords cannot be recovered.

**Why no message queue?**
For a development/demo-scale system, synchronous grading is simpler and fast enough.
A real production OJ (like Codeforces) would use a queue (e.g. RabbitMQ/Kafka) to handle
thousands of simultaneous submissions without overwhelming the grading workers.

---

## API Reference

| Method | Route                 | Auth | Description                   |
|--------|-----------------------|------|-------------------------------|
| POST   | `/api/auth/register`  | —    | Register a user               |
| POST   | `/api/auth/login`     | —    | Login, returns JWT            |
| GET    | `/api/auth/me`        | ✓    | Current user info             |
| GET    | `/api/problems`       | —    | List all problems             |
| GET    | `/api/problems/:id`   | —    | Problem detail + sample cases |
| POST   | `/api/problems`       | ✓    | Create problem (admin)        |
| POST   | `/api/submissions`    | ✓    | Submit code for grading       |
| GET    | `/api/submissions/me` | ✓    | My submission history         |
| GET    | `/api/leaderboard`    | —    | Last 10 submissions globally  |

---

## Verdicts

| Verdict | Meaning |
|---------|---------|
| ✅ Accepted | All test cases passed |
| ❌ Wrong Answer | Output didn't match expected |
| ⏱️ Time Limit Exceeded | Code ran too long (default 5s) |
| 💥 Runtime Error | Code crashed (segfault, exception) |
| ⚠️ Compilation Error | Code didn't compile |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Docker (recommended for safe code execution)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed      # seeds admin user + 12 problems
npm start         # starts on http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

### Enable Docker Sandbox
```bash
# Build the executor image once
docker build -t online-judge-executor backend/docker

# Set in backend/.env
USE_DOCKER=true
```

> Default admin credentials after seed: `admin@oj.local` / `admin123`
