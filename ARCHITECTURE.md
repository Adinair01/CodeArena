# CodeArena — Architecture (Viva Cheat Sheet)

A plain-English guide to how CodeArena is built and how a submission flows through it.
Read this top-to-bottom before a demo and you can explain the whole project.

---

## 1. What is the MERN stack?

MERN = four technologies that together let you build a full web app in JavaScript:

- **M — MongoDB**: the database. Stores data as flexible JSON-like documents (users, problems, submissions).
- **E — Express**: the backend web framework (runs on Node.js). Defines the API routes the frontend calls.
- **R — React**: the frontend library. Builds the user interface that runs in the browser.
- **N — Node.js**: the JavaScript runtime that lets us run JS on the server (not just in the browser).

So: **React** (browser) talks to **Express/Node** (server), which talks to **MongoDB** (data).
The same language — JavaScript — is used end to end.

---

## 2. How a submission flows end-to-end

This is the most important story to know:

```
 You (browser)                Backend (Express)              Sandbox (Docker)
 ─────────────                ─────────────────              ────────────────
 1. Pick a problem,
    write code, click
    "Submit"
        │  POST /api/submissions  (with JWT)
        ▼
                       2. Auth middleware verifies
                          your JWT token
                       3. Saves the submission as
                          "Pending" in MongoDB
                       4. Loads the problem's hidden
                          test cases
                       5. Calls the grader (codeExecutor)
                                   │
                                   ▼
                                                 6. Code is written to a temp
                                                    folder and compiled + run
                                                    INSIDE a locked-down Docker
                                                    container (one run per test):
                                                    - no network
                                                    - capped CPU & memory
                                                    - dropped privileges
                                                 7. Output of each run is compared
                                                    to the expected output
                                   ▼
                       8. Grader returns a verdict
                          (Accepted / Wrong Answer /
                           TLE / Runtime Error / CE)
                       9. Verdict saved to MongoDB
        │  JSON response with the verdict
        ▼
 10. UI shows the result
     (✅ / ❌ / ⏱️ / 💥 / ⚠️)
```

**One-sentence version:** the frontend sends your code to the backend, the backend runs it
safely inside Docker against hidden test cases, compares the output, and sends back a verdict.

---

## 3. What each folder does (one line each)

### Backend (`backend/`)
| Folder / file | Role |
|---|---|
| `server.js` | App entry point — sets up Express, mounts routes, connects to MongoDB, starts listening. |
| `config/` | Database connection (Mongoose → MongoDB). |
| `models/` | Mongoose schemas: `User`, `Problem`, `TestCase`, `Solution`. |
| `controllers/` | The actual logic for each route (auth, problems, submissions). |
| `routes/` | Maps URLs (e.g. `/api/problems`) to controller functions. |
| `middleware/` | Cross-cutting logic: JWT auth guard + error handling. |
| `services/` | `codeExecutor.js` — the grading engine that compiles/runs code. |
| `docker/` | The `Dockerfile` for the sandbox image (g++, python3, JDK). |
| `seed.js` | Fills the DB with an admin user + sample problems. |

### Frontend (`frontend/src/`)
| Folder / file | Role |
|---|---|
| `main.jsx` | React entry point — mounts the app with Router + providers. |
| `App.jsx` | Navbar + all routes + the auth route-guard. |
| `pages/` | One file per screen: Landing, ProblemList, ProblemDetail, Leaderboard, Login, Register. |
| `context/` | Global state: `AuthContext` (login) and `ThemeContext` (dark/light). |
| `api/` | `client.js` — shared axios instance that auto-attaches the JWT. |

---

## 4. The role of JWT, bcrypt, and Docker

### JWT (JSON Web Token) — *"how the app knows who you are"*
When you log in, the server creates a **signed token** and sends it to the browser, which saves it
in `localStorage`. On every later request the browser sends the token back, and the server verifies
the signature to confirm it's really you — **no need to store sessions on the server**.

### bcrypt — *"how passwords are kept safe"*
We never store your actual password. bcrypt runs it through a **one-way hash** (with salt) before
saving. At login, it hashes your attempt and compares the hashes. Even if the database leaked,
the real passwords stay hidden.

### Docker — *"how we run untrusted code safely"*
Submitted code is run inside a **Docker container**: an isolated, throwaway mini-environment.
We lock it down with **no network access**, a **memory cap**, a **CPU cap**, and **dropped
privileges**, so a malicious or buggy submission can't harm the host machine or other users.

---

## 5. Quick facts for questions

- **Languages supported:** C++, Python, Java.
- **Verdicts:** Accepted, Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded.
- **Output comparison:** trailing whitespace/blank lines are normalized before comparing.
- **Why a separate `TestCase` collection?** So one problem can have many test cases, and hidden
  ones never get sent to the browser.
- **Local vs Docker grading:** controlled by the `USE_DOCKER` env flag; Docker is the safe default
  for anything beyond local development.
