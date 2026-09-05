# OffensiveGrid - DevOps Deployment Guide

## Overview
This document provides the DevOps team with step-by-step instructions to deploy the OffensiveGrid platform on a shared VPS. 
To ensure **zero disturbance** to the existing VPS NGINX and services, this project is fully containerized using Docker Compose. The internal networking isolates the app, meaning you only need to expose a single port to your VPS's main reverse proxy.

## Technology Stack & Architecture
To assist in configuring your host server, please review the core technologies running inside the Docker network:
- **Frontend:** React (Vite, TypeScript, TailwindCSS)
- **Backend API:** Django 5.0 (Python 3.11), Django REST Framework
- **WSGI Server:** Gunicorn (Running Django with 3 workers)
- **Database:** PostgreSQL 15 (Alpine)
- **Internal Proxy:** NGINX (Alpine) — Routes internal traffic between React (static) and Django API.
- **Security Mechanisms:** JWT Authentication, OTP (SMTP-based), TOTP (Google Authenticator 2FA).

## Prerequisites
- Docker & Docker Compose installed on the VPS.
- An available port on the host machine. (Default is `8080`, but you can change this via the `HOST_PORT` variable in the `.env` file).
- Valid SMTP credentials (for Email OTPs).

---

## Deployment Steps

### Step 1: Clone Repository on VPS
First, SSH into your VPS and navigate to the directory where you want to host the project (e.g., `/var/www/`). Then, clone the repository directly from the `main` branch of GitHub:

```bash
# Navigate to web directory
cd /var/www/

# Clone the repository from the main branch
git clone -b main https://github.com/your-username/your-repo-name.git offensivegrid

# Navigate into the project folder
cd offensivegrid
```

### Step 2: Configure Environment Variables
Now that you are inside the `offensivegrid` directory, you need to set up the production environment variables by copying the example file:

```bash
cp .env.production.example .env
```

**CRITICAL - Edit the `.env` file:**
1. **`DJANGO_SECRET_KEY`**: Set a strong, random 50-character string.
2. **`ALLOWED_HOSTS`**: Add your exact production domain (e.g., `cszone.pk,www.cszone.pk`).
3. **`CORS_ALLOWED_ORIGINS`**: Add the `https://` version of your domains.
4. **`DB_PASSWORD`**: Set a strong database password.
5. **SMTP / Email Credentials**: You **MUST** provide a valid email and App Password here. Without this, the OTP feature will fail in production. 
6. **`OFFENSIVEGRID_FOUNDER_DEV`**: Set to `"TRUE"` for Haroon's official deployment. This grants lifetime Founder authorization so the zero-trust hardware gate never locks the server. (Alternatively, provide an issued `OFFENSIVEGRID_LICENSE_KEY`). 

### Step 3: Build and Spin Up Containers
Run the following command in the root directory where `docker-compose.yml` is located:
```bash
docker-compose up -d --build
```
*What this does:*
- Spins up PostgreSQL (`db`).
- Builds and starts Django + Gunicorn (`backend`), running migrations and collecting static files automatically.
- Builds React and serves it via an internal NGINX container (`frontend`), mapping port `8080` to the host.

### Step 4: Host NGINX Reverse Proxy (VPS Level)
Since the app is now running internally on port `8080`, simply add a standard reverse proxy block in your VPS's main NGINX configuration to route your domain traffic to this port.

**Example Host NGINX Block:**
```nginx
server {
    listen 80;
    server_name cszone.pk www.cszone.pk;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: Create Superuser (Admin)
Once the containers are running, generate the first Superadmin account:
```bash
docker-compose exec backend python manage.py createsuperuser
```
Follow the prompts to enter an email and password. You can now log into the `/admin` portal.

---

## 🔒 Security & Feature Validations

### 1. Gmail OTP Verification
- **Status:** Handled via Backend SMTP.
- **Production Note:** The server requires a constant connection to an SMTP server. **Do not remove the Email/Password from the `.env` file.** If removed, the server cannot send emails and users will be locked out during registration/login.

### 2. Google Authenticator (2FA / TOTP)
- **Status:** Fully functional.
- **Production Note:** Google Authenticator uses mathematical algorithms based on the current time (TOTP). It does not require any external API calls. Ensure the **VPS Server's system time is accurate** (NTP synchronization enabled, which is default on almost all Linux VPS providers). If the server time is drastically wrong, TOTP codes will fail.

### 3. JWT Authentication & CSRF
- **Status:** Protected.
- **Production Note:** Handled securely via HTTPS headers. Ensure your VPS NGINX assigns a valid SSL certificate (e.g., Let's Encrypt / Certbot) so that `HTTPS` is forced. CSRF and JWT function flawlessly over SSL.

## Troubleshooting

- **Check Backend Logs (Errors/Bugs):** `docker-compose logs -f backend`
- **Check Frontend/Nginx Logs:** `docker-compose logs -f frontend`
- **Restart App:** `docker-compose restart`
