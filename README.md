# Task Management Platform

A full-stack, secure, beginner-friendly Task Management Platform built with **React**, **Express.js**, and **PostgreSQL**.

---

## 1. Overview

The Task Management Platform allows authenticated users to organize, manage, and track tasks. Each user has full CRUD (Create, Read, Update, Delete) capability over their tasks, with complete data isolation and ownership enforcement. The platform includes a visual dashboard summarizing task metrics, status, priority breakdowns, and overdue alerts, plus search, filter, sort, and pagination capabilities.

---

## 2. Features

### Authentication & Authorization
* **User Registration & Login**: Secured with `bcrypt` (10 salt rounds) and JSON Web Tokens (JWT).
* **Route Protection**: JWT authentication middleware protects all backend API endpoints; React Context and `ProtectedRoute` protect private frontend pages.
* **Data Ownership Enforcement**: Users can only read, create, update, or delete their own tasks. Cross-user operations are strictly forbidden (HTTP 403).
* **Duplicate Email & Invalid Token Handling**: Clear, friendly error messages and proper HTTP status codes.

### Task Management
* **Complete CRUD**: Create, read, edit, and delete tasks.
* **Task Fields**: `id`, `title`, `description`, `status` (`pending`, `in_progress`, `completed`), `priority` (`low`, `medium`, `high`), `due_date`, `created_at`, `updated_at`.
* **Search**: Case-insensitive substring search matching task titles and descriptions.
* **Filters**: Filter by status and priority.
* **Sorting**: Sort by allowlisted fields (`created_at`, `due_date`, `priority`, `status`, `title`) in ascending or descending order.
* **Pagination**: Configurable page and limit with total count and total page indicators.
* **Delete Confirmation**: Modal dialog preventing accidental deletion.

### Visual Dashboard
* **Metric Cards**: Total tasks, pending, in progress, completed, and overdue tasks.
* **CSS Visuals**: Pure CSS completion progress bar and priority breakdown bars (no heavy external chart libraries).
* **Overdue Alert**: Highlights tasks with past due dates that are not yet completed.

### System Health
* **Health Check**: `GET /api/health` returns `200` when application and PostgreSQL database are healthy, and `503` when connectivity fails.

---

## 3. Technology Stack

### Frontend
* **React 18**
* **Vite**
* **JavaScript (ES Modules)**
* **React Router v6**
* **React Context API**
* **Native `fetch`** (Centralized API client)
* **Plain CSS** (Semantic, responsive, variables-based)
* **Vitest & React Testing Library**

### Backend
* **Node.js**
* **Express.js** (CommonJS)
* **PostgreSQL & `pg`** (Connection pooling, parameterized SQL queries, no ORM)
* **JWT (`jsonwebtoken`)**
* **`bcrypt`**
* **`express-validator`**
* **`helmet` & `cors`**
* **`express-rate-limit`**
* **`morgan` & `pino`**
* **Jest & Supertest**

---

## 4. Project Structure

```text
.
├── backend/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── migrate.js
│   ├── seed/
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── dashboardModel.js
│   │   │   ├── taskModel.js
│   │   │   └── userModel.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   └── taskRoutes.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── dashboardService.js
│   │   │   └── taskService.js
│   │   ├── utils/
│   │   │   └── logger.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── dashboard.test.js
│   │   ├── health.test.js
│   │   ├── setup.js
│   │   └── tasks.test.js
│   ├── .env.example
│   ├── .eslintrc.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── CreateTask.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditTask.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── TaskList.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── tests/
│   │   │   ├── auth.test.jsx
│   │   │   ├── dashboard.test.jsx
│   │   │   ├── protectedRoute.test.jsx
│   │   │   ├── taskInteractions.test.jsx
│   │   │   └── taskList.test.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── setupTests.js
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── master.md
├── package.json
└── README.md
```

---

## 5. Prerequisites

* **Node.js** >= 18 (Tested on v24)
* **npm** >= 9
* **PostgreSQL** >= 14 (Running locally on port 5432)

---

## 6. PostgreSQL Setup

1. Start the PostgreSQL service if it is not already running:
   ```bash
   sudo systemctl start postgresql
   ```

2. Create the development and test databases:
   ```bash
   psql -U postgres -c "CREATE DATABASE taskmanager_dev;"
   psql -U postgres -c "CREATE DATABASE taskmanager_test;"
   ```

---

## 7. Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `DB_HOST` | PostgreSQL hostname | `127.0.0.1` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Development database name | `taskmanager_dev` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `brgv` |
| `DB_TEST_NAME` | Dedicated test database | `taskmanager_test` |
| `JWT_SECRET` | Secret key for JWT signing | `super_secret_jwt_key_for_development...` |
| `JWT_EXPIRES_IN`| Token validity period | `24h` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:5173` |
| `LOG_LEVEL` | Pino log level | `info` |

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base path/URL for backend API calls | `/api` |

---

## 8. Installation

Install dependencies for both backend and frontend:

```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

---

## 9. Database Migrations & Seed

Run the migrations to create the required tables, foreign keys, constraints, and indexes:

```bash
cd backend
npm run migrate
```

Populate the database with demo users and realistic seed tasks across all statuses and priorities:

```bash
npm run seed
```

---

## 10. Demo Credentials

The database seed provides a pre-configured demo user with sample tasks:

* **Email:** `demo@example.com`
* **Password:** `Password123!`

---

## 11. Local Run Instructions

### 1. Start the Backend API

```bash
cd backend
npm run dev
# Or for production start:
npm start
```
The backend API starts on `http://localhost:5000`.

### 2. Start the Frontend Application

In a separate terminal:

```bash
cd frontend
npm run dev
```
The React frontend starts on `http://localhost:5173`. Open your browser and navigate to `http://localhost:5173`.

---

## 12. API Documentation

All endpoints (except health and public auth) require the `Authorization: Bearer <token>` header.

### Authentication Endpoints

* **`POST /api/auth/register`**
  * Body: `{ "name": "Alice", "email": "alice@example.com", "password": "Password123!" }`
  * Response: `201 Created` with `{ "user": { ... }, "token": "..." }`
* **`POST /api/auth/login`**
  * Body: `{ "email": "alice@example.com", "password": "Password123!" }`
  * Response: `200 OK` with `{ "user": { ... }, "token": "..." }`
* **`GET /api/auth/me`**
  * Headers: `Authorization: Bearer <token>`
  * Response: `200 OK` with `{ "user": { "id": 1, "name": "...", "email": "..." } }`
* **`POST /api/auth/logout`**
  * Response: `200 OK` with `{ "message": "Logged out successfully" }`

### Task Endpoints

* **`GET /api/tasks`**
  * Query parameters:
    * `search`: Search substring matching `title` or `description`
    * `status`: Filter by `pending`, `in_progress`, or `completed`
    * `priority`: Filter by `low`, `medium`, or `high`
    * `sortBy`: `created_at`, `due_date`, `priority`, `status`, or `title` (allowlisted)
    * `order`: `ASC` or `DESC`
    * `page`: Page number (default: 1)
    * `limit`: Page size (default: 10)
  * Response: `200 OK` with `{ "tasks": [...], "total": 8, "page": 1, "limit": 10, "totalPages": 1 }`
* **`GET /api/tasks/:id`**
  * Response: `200 OK` with `{ "task": { ... } }` (or `403` if owned by another user, `404` if not found)
* **`POST /api/tasks`**
  * Body: `{ "title": "...", "description": "...", "status": "pending", "priority": "medium", "due_date": "2026-10-15T00:00:00.000Z" }`
  * Response: `201 Created` with `{ "task": { ... } }`
* **`PUT /api/tasks/:id`**
  * Body: `{ "title": "...", "status": "completed", ... }`
  * Response: `200 OK` with `{ "task": { ... } }`
* **`DELETE /api/tasks/:id`**
  * Response: `200 OK` with `{ "message": "Task deleted successfully" }`

### Dashboard Endpoint

* **`GET /api/dashboard/stats`**
  * Response: `200 OK`
  ```json
  {
    "total": 8,
    "pending": 4,
    "in_progress": 2,
    "completed": 2,
    "overdue": 1,
    "priority": {
      "low": 1,
      "medium": 3,
      "high": 4
    }
  }
  ```

### Health Endpoint

* **`GET /api/health`**
  * Response: `200 OK` with `{ "status": "ok", "database": "connected", "timestamp": "..." }`
  * Returns `503 Service Unavailable` if database connectivity fails.

---

## 13. Testing

### Backend Tests (Jest + Supertest)

Backend tests run against a dedicated, isolated test database (`taskmanager_test`):

```bash
cd backend
npm test
```

Tests verify:
- Registration, validation, and duplicate email rejection (409)
- Login with valid and invalid credentials (401)
- JWT generation, validation, and expiration handling (401)
- Task CRUD operations
- Input validation (missing title, invalid enum values)
- Authorization and strict cross-user access prevention (403)
- Search, filter, sorting allowlist, and pagination
- Dashboard stats aggregation
- Health endpoint status (200 / 503)

### Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend
npm test
```

Tests verify:
- Login and registration form rendering and validation
- Form submission and authentication service calls
- `ProtectedRoute` redirection of unauthenticated users
- Task list rendering with data and empty state handling
- Task creation and interactive delete confirmation modal
- Dashboard stats card rendering and completion rate calculations

---

## 14. Linting

Verify code quality and standards:

```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint
```

---

## 15. Troubleshooting

1. **`connection to server at "localhost", port 5432 failed`**:
   Ensure PostgreSQL is running (`sudo systemctl status postgresql`) and that credentials in `backend/.env` match your local PostgreSQL configuration.

2. **`database "taskmanager_dev" does not exist`**:
   Run `psql -U postgres -c "CREATE DATABASE taskmanager_dev;"` and execute `npm run migrate`.

3. **`Tests failing with database error`**:
   Ensure the test database exists: `psql -U postgres -c "CREATE DATABASE taskmanager_test;"` and migrate it: `NODE_ENV=test npm run migrate`.

---

## 16. DevOps & Production Architecture

### System Architecture
```
                  Internet (Port 80)
                          │
                          ▼
            ┌───────────────────────────┐
            │   Nginx (Reverse Proxy)   │  <-- Rate limiting (10r/s)
            │      Frontend (React)     │  <-- Security headers (HSTS, CSP, XSS)
            └─────────────┬─────────────┘
                          │
             /api/* proxy │ (Internal Docker Bridge)
                          ▼
            ┌───────────────────────────┐
            │   Express.js Backend      │  <-- Node 20 Alpine (Non-root user)
            └─────────────┬─────────────┘
                          │
              PostgreSQL  │ (Internal Docker Bridge)
                          ▼
            ┌───────────────────────────┐
            │   PostgreSQL 16 Alpine    │  <-- Persistent Docker Volume
            └───────────────────────────┘
```

### Infrastructure Highlights
* **Docker Multi-stage Builds**: Minimal production image footprint using Alpine Linux.
* **Amazon ECR**: Container registry storing tagged immutable release images.
* **AWS EC2 (`t3.micro`)**: Hosted on free-tier Ubuntu 24.04 LTS instance with strict security group egress/ingress rules.
* **GitHub Actions CI/CD Pipeline**:
  1. **Continuous Integration**: Spawns isolated PostgreSQL service container, runs database migrations, executes backend (26 Jest tests) and frontend (12 Vitest tests).
  2. **Continuous Delivery**: Upon merge to `main`, builds multi-arch Docker images, authenticates and pushes to Amazon ECR.
  3. **Continuous Deployment**: Secure SSH deployment to EC2 pulling latest images, executing database migrations, and executing zero-downtime rolling restart with container pruning.

