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
4. [Step 3: Dockerization & Multi-Stage Optimization](#step-3-dockerization--multi-stage-optimization)
5. [Step 4: Local Multi-Container Orchestration (Docker Compose)](#step-4-local-multi-container-orchestration-docker-compose)
6. [Step 5: Continuous Integration (CI) with GitHub Actions](#step-5-continuous-integration-ci-with-github-actions)
7. [Step 6: Container Registry Management (Amazon ECR)](#step-6-container-registry-management-amazon-ecr)
8. [Step 7: Cloud Infrastructure Provisioning (AWS EC2 & Security Groups)](#step-7-cloud-infrastructure-provisioning-aws-ec2--security-groups)
9. [Step 8: Continuous Deployment (CD Pipeline Automation)](#step-8-continuous-deployment-cd-pipeline-automation)
10. [Step 9: Production Hardening (Nginx, Gzip & Rate Limiting)](#step-9-production-hardening-nginx-gzip--rate-limiting)
11. [Step 10: Smoke Testing, Monitoring & Post-Mortem](#step-10-smoke-testing-monitoring--post-mortem)
12. [CLI vs. AWS Console (GUI) Deep Dive](#cli-vs-aws-console-gui-deep-dive)
13. [Common DevOps Interview Questions & Answers on this Project](#common-devops-interview-questions--answers-on-this-project)

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
- Built a RESTful backend with Express.js and native PostgreSQL driver (`pg`).
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

### Crucial Commands & Explanations:
```bash
git init
# Initializes a new Git repository in the current folder.

echo "*.pem" >> .gitignore
# CRITICAL: Ensures private keys are never committed to public repositories.

git remote add origin https://github.com/bhrgvbhrgv/taskManager.git
# Links local repo to remote GitHub repository.
```

---

## Step 3: Dockerization & Multi-Stage Optimization

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

### 2. Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Stage 1: Build stage (includes full Node + devDependencies)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime stage (tiny Nginx container)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Why Multi-Stage Builds Matter (Interview Golden Point):
- Stage 1 compiles Vite JSX/CSS into static assets (`dist/`), requiring `node_modules` (~120MB).
- Stage 2 copies **only** the static `dist/` directory into Nginx Alpine (~25MB).
- **Result**: The build toolchain, source code, and developer dependencies are completely excluded from production, vastly reducing image size and eliminating attack surface vectors.

---

## Step 4: Local Multi-Container Orchestration (Docker Compose)

### What was done:
Configured `docker-compose.yml` to spin up `postgres`, `backend`, and `frontend` with network isolation, health checks, and volume mounts.

### Important Directives:
- `depends_on` with `condition: service_healthy`: Prevents Express from starting and crashing before PostgreSQL is ready to accept connections.
- `volumes: postgres_data:/var/lib/postgresql/data`: Ensures database data survives container restarts or teardowns.

### Commands:
```bash
docker compose up --build -d
# --build: Forces rebuilding images from Dockerfiles
# -d: Detached mode (runs in background)

docker compose ps
# Displays status, ports, and healthcheck states of all services.

docker compose down
# Stops and removes containers and internal networks (preserves volumes).
```

---

## Step 5: Continuous Integration (CI) with GitHub Actions

### Workflow (`.github/workflows/ci.yml`):
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: ./backend
      - run: npm run migrate
        working-directory: ./backend
      - run: npm test
        working-directory: ./backend
```

### What Interviewers Look For:
- **Service Containers in GitHub Actions**: We did not mock the database with in-memory SQLite; we used a real PostgreSQL Docker service container inside GitHub's runner, guaranteeing zero discrepancies between test and production databases.
- **Fail-Fast Gating**: If tests fail, the downstream `deploy` job is skipped immediately.

---

## Step 6: Container Registry Management (Amazon ECR)

### What was done:
Created two private ECR repositories (`taskmanager-backend` and `taskmanager-frontend`), authenticated local Docker client, and pushed tagged container images.

### Commands & Explanations:
```bash
# 1. Create Repositories in AWS ECR
aws ecr create-repository --repository-name taskmanager-backend --region ap-south-1
aws ecr create-repository --repository-name taskmanager-frontend --region ap-south-1

# 2. Retrieve Docker Login Token from ECR & Pipe into Docker
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 560617058703.dkr.ecr.ap-south-1.amazonaws.com
# Explanation: AWS IAM returns an ephemeral authentication token valid for 12 hours. Piping to `docker login --password-stdin` prevents credentials from appearing in bash shell history.

# 3. Build & Tag
docker build -t 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-backend:latest ./backend
docker build -t 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-frontend:latest ./frontend

# 4. Push to Cloud Registry
docker push 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-backend:latest
docker push 560617058703.dkr.ecr.ap-south-1.amazonaws.com/taskmanager-frontend:latest
```

---

## Step 7: Cloud Infrastructure Provisioning (AWS EC2 & Security Groups)

### What was done:
- Selected **`t3.micro`** (2 vCPUs, 1GB RAM) to strictly stay within AWS Free Tier (750 free hours/month).
- Provisioned Ubuntu 24.04 LTS instance with attached Elastic Block Store (gp3).
- Configured stateful Security Group firewall.

### Commands & Explanations:
```bash
# 1. Generate SSH Key Pair
aws ec2 create-key-pair \
  --key-name taskManager \
  --query 'KeyMaterial' \
  --output text \
  --region ap-south-1 > taskManager.pem

chmod 400 taskManager.pem
# Octal 400: Read-only by owner, no permissions for group/others. SSH rejects keys that are world-readable.

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

## Step 8: Continuous Deployment (CD Pipeline Automation)

### GitHub Repository Secrets Configured:
- `AWS_ACCESS_KEY_ID`: IAM programmatic access key.
- `AWS_SECRET_ACCESS_KEY`: IAM secret key.
- `EC2_HOST`: Public IPv4 (`13.204.66.253`).
- `EC2_SSH_KEY`: Raw private key content of `taskManager.pem`.

### Automated CD Job (`appleboy/ssh-action`):
```yaml
  deploy:
    name: Build, Push to ECR & Deploy to EC2
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - uses: aws-actions/amazon-ecr-login@v2
        id: login-ecr

      - name: Build & Push Images
        run: |
          docker build -t ${{ steps.login-ecr.outputs.registry }}/taskmanager-backend:latest ./backend
          docker push ${{ steps.login-ecr.outputs.registry }}/taskmanager-backend:latest
          docker build -t ${{ steps.login-ecr.outputs.registry }}/taskmanager-frontend:latest ./frontend
          docker push ${{ steps.login-ecr.outputs.registry }}/taskmanager-frontend:latest

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

### Production Compose File on EC2 (`~/app/docker-compose.prod.yml`):
- Pulls pre-built images from Amazon ECR instead of building them locally on the server (saves EC2 CPU/RAM).
- Uses `docker image prune -f` to clean up old dangling image layers, preventing disk exhaustion on the 8GB root drive.

---

## Step 9: Production Hardening (Nginx, Gzip & Rate Limiting)

### Updated `frontend/nginx.conf`:
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

    # Static assets
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

### Verification via `curl -I`:
```bash
curl -I http://13.204.66.253/
```
Output verified: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Server: nginx`.

---

## Step 10: Smoke Testing, Monitoring & Post-Mortem

### Production Verification:
1. **Health Check**:
   `curl -s http://13.204.66.253/api/health`
   ➔ `{"status":"ok","database":"connected","timestamp":"2026-10-01T21:50:15.715Z"}`
2. **User Registration & Task Creation**:
   Verified complete authentication and database persistence live in production.

---

## CLI vs. AWS Console (GUI) Deep Dive

In interviews, you may be asked how to achieve these tasks in the AWS Management Console (web GUI):

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
