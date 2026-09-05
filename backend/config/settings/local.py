"""
Local development settings for OffensiveGrid.
"""
import os
from .base import *

DEBUG = True

# CORS Configuration for local frontend (Vite React @ port 5173 / 3000)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000'
    ).split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# Database Configuration
# Seamlessly checks for Supabase PostgreSQL configuration.
# If credentials are not provided or empty, gracefully falls back to local SQLite.
db_host = os.getenv('DB_HOST', '').strip()
db_password = os.getenv('DB_PASSWORD', '').strip()
database_url = os.getenv('DATABASE_URL', '').strip()

if db_host and db_password:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'postgres'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': 60,
        }
    }
else:
    # Local SQLite fallback for zero-block instant local development & testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
