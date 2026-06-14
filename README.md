# CodeArena (MERN)

> **Where code meets the arena — write it, run it, prove it.**

A competitive-programming style online judge built with **MongoDB, Express, React, Node.js**.
Supports problem listing, code submission & automatic grading (C++, Python, Java),
a leaderboard of recent submissions, and JWT-based user authentication.

## Project structure

```
Online Judge/
├── backend/          Express API + Mongoose models + code execution engine
│   ├── config/       DB connection
│   ├── models/       Problem, Solution, TestCase, User
│   ├── controllers/  Route handlers
│   ├── routes/       API routes
│   ├── middleware/   Auth + error handling
│   ├── services/     Code execution engine
│   ├── docker/       Executor Dockerfile (sandbox image)
│   └── server.js
└── frontend/         React (Vite) SPA
    └── src/
        ├── api/      Axios client
        ├── context/  Auth context
        ├── components/
        └── pages/    ProblemList, ProblemDetail, Leaderboard, Login, Register
```

## Quick start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string)
- For code grading: `g++`, `python3`, and a JDK (`javac`/`java`) on PATH,
  **or** Docker (recommended for isolation — see `backend/docker/`).

### Backend
```bash
cd backend
cp .env.example .env      # then edit values
npm install
npm run dev               # starts on http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:5173
```

The frontend proxies `/api` requests to the backend (see `vite.config.js`).

## API overview

| Method | Route                     | Auth | Description                       |
|--------|---------------------------|------|-----------------------------------|
| POST   | `/api/auth/register`      | —    | Register a user                   |
| POST   | `/api/auth/login`         | —    | Login, returns JWT                |
| GET    | `/api/auth/me`            | ✓    | Current user                      |
| GET    | `/api/problems`           | —    | List problems                     |
| GET    | `/api/problems/:id`       | —    | Problem detail                    |
| POST   | `/api/problems`           | ✓    | Create problem (+ test cases)     |
| POST   | `/api/submissions`        | ✓    | Submit code for grading           |
| GET    | `/api/submissions/me`     | ✓    | My submissions                    |
| GET    | `/api/leaderboard`        | —    | Recent submissions + verdicts     |

## Grading

Submitted code is written to a temp directory, compiled (if needed), and run
against each test case with a wall-clock timeout and output comparison. Verdicts:
`Accepted`, `Wrong Answer`, `Compilation Error`, `Runtime Error`, `Time Limit Exceeded`.

> **Security note:** running untrusted code on the host is dangerous. The default
> executor runs locally for convenience in development. For any real deployment,
> use the Docker sandbox in `backend/docker/` (set `USE_DOCKER=true`).
