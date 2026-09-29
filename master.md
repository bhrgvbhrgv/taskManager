# Task Management Platform — Master Specification

## 1. Mission

Build a complete, working **Task Management Platform** for local development.

You are responsible ONLY for the application:

**React → Express API → PostgreSQL**

The application must be complete, secure, tested, readable, and beginner-friendly.

Do not implement infrastructure or deployment.

---

## 2. Fixed Stack

### Frontend

* React
* Vite
* JavaScript
* React Router
* React Context
* Native `fetch`
* Plain CSS
* Vitest
* React Testing Library

### Backend

* Node.js
* Express.js
* CommonJS
* PostgreSQL
* `pg`
* JWT
* bcrypt
* express-validator
* helmet
* cors
* express-rate-limit
* morgan
* pino
* Jest
* Supertest

### Database

* PostgreSQL
* Raw SQL through `pg`
* No ORM

Do not substitute technologies without a strong technical reason.

---

## 3. Strict Exclusions

DO NOT CREATE:

* Dockerfiles
* `.dockerignore`
* Docker Compose files
* Nginx configuration
* GitHub Actions workflows
* CI/CD configuration
* AWS/EC2 deployment configuration
* Kubernetes
* Terraform
* Jenkins
* Prometheus/Grafana
* cloud deployment scripts
* production infrastructure

This project is local application code only.

---

## 4. Required Features

### Authentication

Implement:

* registration
* login
* logout
* JWT authentication
* bcrypt password hashing
* `GET /api/auth/me`
* protected frontend routes
* protected backend routes
* duplicate-email handling
* invalid/expired-token handling

Never return password hashes.

### Tasks

Each task contains:

* id
* user_id
* title
* description
* status
* priority
* due_date
* created_at
* updated_at

Status:

* pending
* in_progress
* completed

Priority:

* low
* medium
* high

Implement complete CRUD.

Every task operation MUST be restricted to the authenticated user's own tasks.

### Dashboard

Display:

* total tasks
* pending
* in progress
* completed
* priority breakdown
* overdue count

Use simple CSS visuals. No chart library.

### Task List

Implement:

* title/description search
* status filter
* priority filter
* sorting
* ascending/descending order
* pagination
* total count/pages

Sortable fields must use an explicit backend allowlist.

---

## 5. Required API

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Tasks

```text
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Dashboard

```text
GET /api/dashboard/stats
```

### Health

```text
GET /api/health
```

Health returns:

* `200` when the application/database are healthy
* `503` when database connectivity fails

---

## 6. Database

### users

```text
id
name
email UNIQUE
password_hash
created_at
```

### tasks

```text
id
user_id → users.id
title
description
status
priority
due_date
created_at
updated_at
```

Use:

* foreign-key constraints
* appropriate status/priority constraints
* `ON DELETE CASCADE`
* indexes for email, user_id, status, priority and due_date

Use parameterized SQL everywhere.

---

## 7. Project Structure

Use a clear layered backend:

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── migrations/
├── seed/
└── tests/
```

Frontend:

```text
frontend/
└── src/
    ├── components/
    ├── pages/
    ├── context/
    ├── services/
    ├── hooks/
    ├── utils/
    ├── App.jsx
    └── main.jsx
```

Keep the structure simple. Do not over-engineer.

---

## 8. Frontend Pages

Create:

* Login
* Register
* Dashboard
* Task List
* Create Task
* Edit Task

Include:

* responsive UI
* loading states
* error states
* empty states
* validation
* delete confirmation
* logout
* protected routes

Use a centralized `fetch` API client.

Default API base:

```text
/api
```

Do not hardcode backend URLs throughout the frontend.

---

## 9. Configuration

Use environment variables for:

* server port
* database host
* database port
* database name
* database user
* database password
* JWT secret
* JWT expiration
* CORS origin
* log level
* frontend API base URL

Provide `.env.example`.

Never commit real secrets.

---

## 10. Backend Quality

Implement:

* centralized error handling
* consistent JSON errors
* input validation
* authentication middleware
* authorization
* parameterized SQL
* database connection pooling
* graceful shutdown
* startup database handling
* configurable logging

Security requirements:

* bcrypt
* JWT
* helmet
* CORS
* authentication rate limiting
* ownership checks
* no secrets in source code

---

## 11. Testing

### Backend

Use Jest + Supertest.

Test:

* registration
* duplicate email
* login
* invalid credentials
* authentication
* invalid JWT
* task CRUD
* validation
* authorization
* cross-user access prevention
* dashboard
* health endpoint

### Frontend

Use Vitest + React Testing Library.

Test important:

* authentication forms
* protected routes
* task list
* task interactions
* dashboard

Tests MUST use a separate test database.

Never silently use the development database during tests.

---

## 12. Database Commands

Provide npm scripts for:

```text
npm run migrate
npm run seed
```

Seed:

* one demo user
* multiple tasks
* different statuses
* different priorities
* different due dates

Document demo credentials in README.

---

## 13. NPM Scripts

Backend:

```text
start
dev
migrate
seed
test
lint
```

Frontend:

```text
dev
build
preview
test
lint
```

---

## 14. Code Standards

Write:

* readable code
* meaningful names
* small functions
* clear separation of concerns
* minimal duplication
* minimal dependencies
* no dead code
* no placeholder core functionality

Prefer straightforward beginner-readable solutions.

Do not introduce unnecessary abstractions.

---

## 15. README

Include:

* overview
* features
* stack
* structure
* prerequisites
* PostgreSQL setup
* environment variables
* installation
* migrations
* seed
* local run instructions
* API documentation
* testing
* linting
* troubleshooting
* demo credentials

README must cover local application usage only.

---

## 16. Git

`.gitignore` must exclude:

```text
node_modules/
.env
coverage/
dist/
logs/
*.log
```

Keep `.env.example`.

Do not include generated dependencies/build artifacts.

---

# 17. Definition of Done

Do not consider the project complete until:

* dependencies install successfully
* PostgreSQL connection works
* migrations work
* seed works
* backend starts
* frontend starts
* registration works
* login works
* logout works
* JWT protection works
* task CRUD works
* cross-user access is prevented
* dashboard works
* search works
* filters work
* sorting works
* pagination works
* health endpoint works
* backend tests pass
* frontend tests pass
* lint passes
* frontend build passes
* no forbidden infrastructure files exist

Build the complete application. Do not leave core features as placeholders.
