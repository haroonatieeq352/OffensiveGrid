"""
Production settings for OffensiveGrid.
Hardened for Google Cloud (Cloud Run / GCE) & NGINX Reverse Proxy Deployments.
"""
import os
from urllib.parse import urlparse, unquote
from .base import *

DEBUG = False

# Strict host headers in production
allowed_hosts_raw = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,.vercel.app')
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_raw.split(',') if host.strip()]
# Ensure localhost, vercel domains and healthcheck hosts are allowed
if '.vercel.app' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.vercel.app')
if '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')
if '127.0.0.1' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('127.0.0.1')
if 'localhost' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('localhost')

# Database Configuration for Production (Supabase / Neon / Google Cloud SQL / Managed PostgreSQL)
database_url = os.getenv('DATABASE_URL', '').strip()
db_host = os.getenv('DB_HOST', '').strip()
db_password = os.getenv('DB_PASSWORD', '').strip()

if database_url:
    url = urlparse(database_url)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': unquote(url.username or 'postgres'),
            'PASSWORD': unquote(url.password or ''),
            'HOST': url.hostname or '',
            'PORT': str(url.port or '5432'),
            'CONN_MAX_AGE': 0,
            'OPTIONS': {
                'sslmode': 'require',
            }
        }
    }
elif db_host:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'postgres'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
        }
    }
else:
    # Graceful fallback for container builds / migrations before DB attachment
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Reverse Proxy & SSL Configuration (Crucial for GCP & NGINX)
# Prevents infinite 301 redirect loops behind NGINX / GCP Load Balancers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# Production Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 't')
SESSION_COOKIE_SECURE = SECURE_SSL_REDIRECT
CSRF_COOKIE_SECURE = SECURE_SSL_REDIRECT
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

# HTTP Strict Transport Security (HSTS)
if SECURE_SSL_REDIRECT:
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = False
cors_origins_raw = os.getenv('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_raw.split(',') if origin.strip()]
CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins (Mandatory for Django 4+ and 5+ over HTTPS)
csrf_origins_raw = os.getenv('CSRF_TRUSTED_ORIGINS', cors_origins_raw)
CSRF_TRUSTED_ORIGINS = [
    origin.strip() if origin.strip().startswith(('http://', 'https://')) else f"https://{origin.strip()}"
    for origin in csrf_origins_raw.split(',')
    if origin.strip()
]
if 'https://*.vercel.app' not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append('https://*.vercel.app')

