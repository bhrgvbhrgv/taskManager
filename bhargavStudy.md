# DevOps & Cloud Engineering Master Study Guide
**Project: Full-Stack Task Management Platform CI/CD & AWS Deployment**  
**Author:** Bhargav  
**Target Audience:** DevOps / SRE / Cloud Engineer Interview Preparation  

---

## 📌 Executive Summary & Interview Pitch

> *"In this project, I engineered an end-to-end automated DevOps pipeline for a full-stack containerized web application (React, Node.js/Express, PostgreSQL). I containerized the services using Docker multi-stage builds with Alpine Linux, implemented a robust GitHub Actions CI/CD pipeline featuring automated service containers for database integration testing, pushed versioned immutable images to Amazon ECR, and orchestrated zero-downtime continuous deployment via SSH to an AWS EC2 instance (`t3.micro`) operating completely within the AWS Free Tier. Finally, I hardened production traffic using an Nginx reverse proxy with rate limiting, Gzip compression, and security headers."*

---

# Table of Contents
1. [Core Architectural Overview](#1-core-architectural-overview)
2. [Step 1: Application Architecture & State Management](#step-1-application-architecture--state-management)
3. [Step 2: Version Control Strategy (Git & GitHub)](#step-2-version-control-strategy-git--github)
4. [Step 3: Deep-Dive: Dockerfiles Line-by-Line Breakdown](#step-3-deep-dive-dockerfiles-line-by-line-breakdown)
5. [Step 4: Deep-Dive: Docker Compose Files Line-by-Line](#step-4-deep-dive-docker-compose-files-line-by-line)
6. [Step 5 & 8: Deep-Dive: GitHub Actions CI/CD Workflow (`ci.yml`) Line-by-Line](#step-5--8-deep-dive-github-actions-cicd-workflow-ciyml-line-by-line)
7. [Step 6: Container Registry Management (Amazon ECR)](#step-6-container-registry-management-amazon-ecr)
8. [Step 7: Cloud Infrastructure Provisioning (AWS EC2 & Security Groups)](#step-7-cloud-infrastructure-provisioning-aws-ec2--security-groups)
9. [Step 9: Deep-Dive: Production Nginx Configuration (`nginx.conf`)](#step-9-deep-dive-production-nginx-configuration-nginxconf)
10. [Step 10: Smoke Testing, Monitoring & Post-Mortem](#step-10-smoke-testing-monitoring--post-mortem)
11. [CLI vs. AWS Console (GUI) Deep Dive](#cli-vs-aws-console-gui-deep-dive)
12. [Common DevOps Interview Questions & Answers on this Project](#common-devops-interview-questions--answers-on-this-project)

---

## 1. Core Architectural Overview

```
                      [ Internet Traffic: Port 80 ]
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       Nginx Reverse Proxy & Static SPA    │
             │           (Docker: Alpine Linux)          │
             │  • Security Headers (CSP, XSS, Frame)     │
             │  • Gzip Compression (1024 bytes min)     │
             │  • Rate Limiting (10 req/s, burst 20)     │
             └─────────────────────┬─────────────────────┘
                                   │
                     Proxy `/api/` │ (Docker Internal Bridge Network)
                                   ▼
             ┌───────────────────────────────────────────┐
             │           Express.js REST API             │
             │           (Docker: Node 20 Alpine)        │
             │  • Non-root user execution (`USER node`)  │
             │  • JWT Auth & Input Validation            │
             │  • Connection Pooling (`pg`)              │
             └─────────────────────┬─────────────────────┘
                                   │
                     SQL (Port 5432)│ (Docker Internal Bridge Network)
                                   ▼
             ┌───────────────────────────────────────────┐
             │             PostgreSQL 16                 │
             │        (Docker: postgres:16-alpine)       │
             │  • Healthcheck: `pg_isready`              │
             │  • Persistent Docker Named Volume         │
             └───────────────────────────────────────────┘
```

---

## Step 1: Application Architecture & State Management

### What was done:
- RESTful backend with Express.js and native PostgreSQL driver (`pg`).
- Strict relational schema: `users` and `tasks` with foreign keys (`user_id REFERENCES users(id) ON DELETE CASCADE`).
- Data isolation: Every task query requires `WHERE user_id = $1` to prevent Insecure Direct Object References (IDOR).
- Frontend single-page app (SPA) built with React 18 and Vite.

### Key Concepts for Interviews:
- **Connection Pooling**: Reusing database connections instead of opening a TCP connection per HTTP request, preventing socket exhaustion.
- **Stateless Authentication**: JWT tokens containing user ID are signed by the server; the server doesn't store session states in memory, enabling horizontal scalability.

---

## Step 2: Version Control Strategy (Git & GitHub)

### What was done:
- Initialized local repository, configured `.gitignore` to prevent leaking `.env`, `node_modules`, and `.pem` SSH keys.
- Established clean commit history following Conventional Commits (`feat:`, `fix:`, `docs:`).

```bash
git init
# Initializes a new Git repository.

echo "*.pem" >> .gitignore
# CRITICAL: Ensures private keys are never committed to public repositories.

git remote add origin https://github.com/bhrgvbhrgv/taskManager.git
# Links local repo to remote GitHub repository.
```

---

## Step 3: Deep-Dive: Dockerfiles Line-by-Line Breakdown

### 1. Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Step A: Install build tools needed for native C++ compilation (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# Step B: Purge build dependencies to shrink final image size
RUN apk del python3 make g++

COPY . .

# Step C: Security best practice - switch away from root
USER node

EXPOSE 5000
CMD ["node", "src/server.js"]
```

#### Line-by-Line Explanation:
- `FROM node:20-alpine`: Uses Alpine Linux as the base image. While standard Debian-based images weigh ~1GB, Alpine is ~50MB, significantly reducing download time, network transfer costs, and vulnerability count.
- `WORKDIR /app`: Sets the current execution directory inside the container for all subsequent commands (`RUN`, `COPY`, `CMD`).
- `RUN apk add --no-cache python3 make g++`: Alpine uses `musl libc` instead of `glibc`. Native npm modules like `bcrypt` must compile C++ source code during installation, which requires Python, GNU Make, and a C++ compiler (`g++`). `--no-cache` prevents caching the index locally, saving disk space.
- `COPY package*.json ./`: Copies only dependency definition files **before** copying application code. **DevOps Concept: Docker Layer Caching.** If application source code changes but dependencies don't, Docker reuses the cached layer of `npm ci`, slashing build times from minutes to seconds.
- `RUN npm ci --omit=dev`: `npm ci` (Clean Install) requires an exact `package-lock.json` match and avoids altering dependency trees. `--omit=dev` ignores `devDependencies` (like Jest, Supertest), keeping the production image clean.
- `RUN apk del python3 make g++`: Deletes compilers after `bcrypt` is built. The compiler is no longer needed at runtime, removing ~300MB of unnecessary tools and reducing the attack surface.
- `COPY . .`: Copies the backend source code into `/app`. Files listed in `.dockerignore` (like `node_modules` and `.env`) are excluded.
- `USER node`: **Container Security Best Practice.** By default, Docker containers execute as `root`. If an attacker exploits a remote code execution vulnerability in Node.js, they would gain root privileges inside the container. Switching to the built-in unprivileged `node` user mitigates container breakouts.
- `EXPOSE 5000`: Documents that the application listens on port 5000. (Does not publish the port by itself; port publishing is handled by Docker Compose or `-p`).
- `CMD ["node", "src/server.js"]`: The default executable process for the container. Using exec form (JSON array `["node", ...]`) ensures Node receives POSIX signals (`SIGTERM`, `SIGINT`) directly for graceful shutdowns.

---

### 2. Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)

```dockerfile
# Stage 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Line-by-Line Explanation:
- `FROM node:20-alpine AS build`: Names this initial image layer `build`. This stage contains Node.js, npm, Vite, and all frontend developer dependencies.
- `RUN npm run build`: Compiles JSX, CSS, and assets into optimized, minified static HTML, CSS, and JS chunks in `/app/dist`.
- `FROM nginx:alpine`: Starts a brand new, completely separate image based on lightweight Nginx Alpine (~25MB). **Everything from the previous stage is discarded unless explicitly copied.**
- `COPY nginx.conf /etc/nginx/conf.d/default.conf`: Replaces the default Nginx configuration with our custom reverse proxy and security header config.
- `COPY --from=build /app/dist /usr/share/nginx/html`: Copies **only** the compiled production bundles from the `build` stage into Nginx's web root.
- `EXPOSE 80`: Nginx listens on standard HTTP port 80.
- `CMD ["nginx", "-g", "daemon off;"]`: Runs Nginx in the foreground. By default, Nginx daemonizes (forks to the background), which would cause Docker to think the container finished and immediately exit with code 0. `daemon off;` keeps the process in the foreground.

---

## Step 4: Deep-Dive: Docker Compose Files Line-by-Line

### 1. Local Development Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: taskmanager-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-taskmanager_dev}
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations/001_initial_schema.sql:/docker-entrypoint-initdb.d/001_initial_schema.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-taskmanager_dev}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskmanager-backend
    restart: unless-stopped
    environment:
      PORT: 5000
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-taskmanager_dev}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      JWT_SECRET: ${JWT_SECRET:-super_secret_jwt_key_for_development_purposes_only_32chars}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: taskmanager-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

#### Key Directives Explained:
- `ports: "5433:5432"`: Maps host port `5433` to container port `5432`. We did this because local host machines often already run PostgreSQL on `5432`. This avoids port collisions while maintaining standard internal `5432` communication between containers.
- `/docker-entrypoint-initdb.d/`: Official Postgres image hook. Any `.sql` mounted here executes automatically when the database container initializes for the first time.
- `healthcheck`: Runs `pg_isready` every 5 seconds. Docker marks the container `healthy` only when Postgres can accept SQL connections.
- `depends_on: postgres: condition: service_healthy`: Without this, Docker starts `backend` and `postgres` concurrently. Express would attempt to connect to Postgres before Postgres finishes initializing, causing Express to crash. `condition: service_healthy` ensures Express only launches when Postgres is 100% operational.
- `networks: app-network (bridge)`: Creates an isolated private software bridge network. Containers resolve each other using their service names (`postgres`, `backend`) as DNS hostnames.

---

### 2. Production EC2 Compose (`docker-compose.prod.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: taskmanager-postgres
    restart: always
    environment:
      POSTGRES_USER: task_user
      POSTGRES_PASSWORD: task_secure_password_2026
      POSTGRES_DB: taskmanager_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U task_user -d taskmanager_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - taskmanager-network

  backend:
    image: 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-backend:latest
    container_name: taskmanager-backend
    restart: always
    env_file:
      - .env
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - taskmanager-network

  frontend:
    image: 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-frontend:latest
    container_name: taskmanager-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - taskmanager-network

volumes:
  postgres_data:

networks:
  taskmanager-network:
    driver: bridge
```

#### Why Production Compose Differs from Dev Compose:
- **`image:` instead of `build:`**: On EC2, we pull pre-compiled images from Amazon ECR instead of compiling code locally. A `t3.micro` instance has 1GB RAM; compiling Vite and building npm modules on EC2 would trigger Out-Of-Memory (OOM) kernel panics. Building on GitHub Actions and pulling pre-built images keeps EC2 CPU and memory usage minimal.
- **`ports: "80:80"`**: In production, traffic arrives directly on standard HTTP port 80.
- **`restart: always`**: If the EC2 server reboots or a container crashes, Docker's daemon automatically restarts the containers without human intervention.

---

## Step 5 & 8: Deep-Dive: GitHub Actions CI/CD Workflow (`ci.yml`) Line-by-Line

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: task_user
          POSTGRES_PASSWORD: task_password
          POSTGRES_DB: taskmanager_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run Database Migrations for Tests
        working-directory: ./backend
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: task_user
          DB_PASSWORD: task_password
          DB_NAME: taskmanager_test
        run: npm run migrate

      - name: Run Backend Tests
        working-directory: ./backend
        env:
          PORT: 5000
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: task_user
          DB_PASSWORD: task_password
          DB_NAME: taskmanager_test
          JWT_SECRET: test_jwt_secret_key_for_ci_pipeline
        run: npm test

  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run Frontend Tests
        working-directory: ./frontend
        run: npm test

  deploy:
    name: Build, Push to ECR & Deploy to EC2
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Log in to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push Backend Image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/taskmanager-backend:latest ./backend
          docker push $ECR_REGISTRY/taskmanager-backend:latest

      - name: Build and Push Frontend Image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          docker build -t $ECR_REGISTRY/taskmanager-frontend:latest ./frontend
          docker push $ECR_REGISTRY/taskmanager-frontend:latest

      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/app
            aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${{ steps.login-ecr.outputs.registry }}
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T backend npm run migrate
            docker image prune -f
```

#### Detailed Breakdown of Key CI/CD Concepts:
1. **`services: postgres:`**: Runs an isolated Docker container alongside the runner. This enables true integration testing without mocking database queries.
2. **`cache: 'npm'`**: Caches `~/.npm` based on the hash of `package-lock.json`. Subsequent runs avoid re-downloading packages from npm registry.
3. **`needs: [test-backend, test-frontend]`**: Creates an execution dependency. The `deploy` job is strictly blocked until both test jobs succeed.
4. **`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`**: Ensures pull requests only trigger tests and do NOT deploy to production.
5. **`appleboy/ssh-action`**: Connects to the EC2 server over SSH (port 22) using the private key stored in GitHub Secrets.
6. **`docker compose exec -T backend npm run migrate`**: `-T` disables pseudo-terminal allocation, required when executing commands inside non-interactive CI/CD scripts.
7. **`docker image prune -f`**: Deletes untagged/dangling intermediate Docker images on the EC2 host after deployment, preventing server disk space exhaustion.

---

## Step 6: Container Registry Management (Amazon ECR)

```bash
# 1. Create Repositories in AWS ECR
aws ecr create-repository --repository-name taskmanager-backend --region ap-south-1
aws ecr create-repository --repository-name taskmanager-frontend --region ap-south-1

# 2. Retrieve Docker Login Token from ECR & Pipe into Docker
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 560617058703.dkr.ecr.ap-south-1.amazonaws.com

# 3. Build & Tag
docker build -t 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-backend:latest ./backend
docker build -t 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-frontend:latest ./frontend

# 4. Push to Cloud Registry
docker push 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-backend:latest
docker push 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-frontend:latest
```

---

## Step 7: Cloud Infrastructure Provisioning (AWS EC2 & Security Groups)

```bash
# 1. Generate SSH Key Pair
aws ec2 create-key-pair \
  --key-name taskManager \
  --query 'KeyMaterial' \
  --output text \
  --region ap-south-1 > taskManager.pem

chmod 400 taskManager.pem
# Octal 400: Read-only by owner. SSH rejects keys that are accessible by others.

# 2. Create Security Group
aws ec2 create-security-group \
  --group-name taskmanager-sg \
  --description "Firewall for Task Manager" \
  --region ap-south-1

# 3. Authorize Ingress Rules (Ports 22, 80, 3000, 5000)
aws ec2 authorize-security-group-ingress \
  --group-name taskmanager-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region ap-south-1

aws ec2 authorize-security-group-ingress \
  --group-name taskmanager-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region ap-south-1

# 4. Launch Free-Tier EC2 Instance
aws ec2 run-instances \
  --image-id resolve:ssm:/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id \
  --instance-type t3.micro \
  --key-name taskManager \
  --security-group-ids sg-01dfe1f8135bb03c5 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=taskmanager-server}]' \
  --region ap-south-1

# 5. SSH Connect to Server
ssh -i taskManager.pem ubuntu@13.204.66.253
```

---

## Step 9: Deep-Dive: Production Nginx Configuration (`nginx.conf`)

```nginx
# Rate limiting zone: max 10 requests/sec per client IP, storing up to 10MB of IP states
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name _;

    # Security Headers
    add_header X-Frame-Options "DENY" always;                # Mitigates Clickjacking
    add_header X-Content-Type-Options "nosniff" always;       # Mitigates MIME sniffing attacks
    add_header X-XSS-Protection "1; mode=block" always;       # Legacy browser XSS protection
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json;

    # Static SPA assets
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy with Rate Limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Detailed Breakdown of Nginx Directives:
- `limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s`: Tracks client IP addresses in a 10 Megabyte shared memory zone. `$binary_remote_addr` uses 4 bytes per IPv4 (compared to 7-15 bytes for text IPs), allowing 10MB to track ~160,000 unique client IPs simultaneously.
- `burst=20 nodelay`: Allows clients to make up to 20 sudden rapid requests without delay, but drops any subsequent requests exceeding 10 req/s with HTTP `503 Service Unavailable`. Protects backend Node process from being saturated by DoS/brute-force attacks.
- `try_files $uri $uri/ /index.html`: Essential for React Router (Single Page Applications). When a user navigates to `/dashboard` or refreshes the page, Nginx checks if a physical file named `/dashboard` exists. If not, it falls back to `/index.html`, allowing React's client-side router to handle the route.
- `proxy_pass http://backend:5000`: Proxies matching `/api/*` requests across the internal Docker network directly to the Express backend container.

---

## Step 10: Smoke Testing, Monitoring & Post-Mortem

### Production Verification:
1. **Health Check**:
   `curl -s http://13.204.66.253/api/health`
   ➔ `{"status":"ok","database":"connected","timestamp":"..."}`
2. **User Registration & Task Creation**:
   Verified complete authentication and database persistence live in production.

---

## CLI vs. AWS Console (GUI) Deep Dive

| Task | AWS CLI Command | AWS Console (GUI) Navigation |
|---|---|---|
| **Create Key Pair** | `aws ec2 create-key-pair --key-name ...` | **EC2 Console** ➔ Network & Security ➔ **Key Pairs** ➔ "Create key pair" (Choose `.pem`, RSA). |
| **Security Group** | `aws ec2 create-security-group ...` | **EC2 Console** ➔ Network & Security ➔ **Security Groups** ➔ "Create security group" ➔ Add Inbound rules for SSH (22) and HTTP (80). |
| **Launch Instance** | `aws ec2 run-instances ...` | **EC2 Console** ➔ Instances ➔ **"Launch instances"** ➔ Select Ubuntu 24.04 LTS, select `t3.micro`, attach key pair & security group. |
| **Create ECR Repo** | `aws ecr create-repository ...` | **Amazon ECR** ➔ Repositories ➔ **"Create repository"** ➔ Set Visibility to "Private", enter name. |
| **View Instance IP** | `aws ec2 describe-instances ...` | **EC2 Console** ➔ Instances ➔ Select instance ➔ Copy **Public IPv4 address**. |

---

## Common DevOps Interview Questions & Answers on this Project

### Q1: Why did you use Amazon ECR instead of Docker Hub?
> *"Amazon ECR provides seamless IAM integration within the AWS ecosystem. Using ECR allowed us to securely authenticate from GitHub Actions using short-lived IAM credentials without managing static passwords, and enabled fast, low-latency, free internal network image pulls directly to EC2 within the `ap-south-1` region."*

### Q2: Why did you choose Docker multi-stage builds for the frontend?
> *"The frontend build process requires Node.js, npm, Vite, and dozens of developer dependencies amounting to over 150MB. Multi-stage builds allowed us to use Node exclusively in Stage 1 to compile HTML/CSS/JS bundles into `dist/`, and then copy only those static files into an ultra-lean Nginx Alpine image in Stage 2. This reduced image size to ~25MB, improved download/startup times, and removed all Node.js runtime vulnerabilities from the frontend web server."*

### Q3: How did you ensure database data wasn't lost when containers were updated?
> *"I mounted a persistent Docker named volume (`postgres_data:/var/lib/postgresql/data`) to the PostgreSQL service container. When GitHub Actions deploys a new commit and restarts the stack (`docker compose up -d`), the old application containers are replaced while the volume remains intact."*

### Q4: How does your CI pipeline handle database testing without flaky in-memory mocks?
> *"In `.github/workflows/ci.yml`, I leveraged GitHub Actions Service Containers to launch a real PostgreSQL 16 Alpine container with a healthcheck (`pg_isready`). The workflow runs database migrations before executing the test suite, allowing Jest and Supertest to execute against real PostgreSQL SQL queries with real transactions and constraints."*

### Q5: How did you prevent high AWS costs?
> *"I designed the architecture strictly around AWS Free Tier parameters: using a single `t3.micro` EC2 instance (750 free hours/month), zero paid Application Load Balancers (using containerized Nginx reverse proxy instead), EBS gp3 root storage under 30GB, and direct public IP routing without costly NAT Gateways."*
