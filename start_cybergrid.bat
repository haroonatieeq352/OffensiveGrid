@echo off
title OffensiveGrid — Development Launcher
echo ========================================================
echo   OffensiveGrid — Starting Full Stack Platform...
echo ========================================================
echo.

echo [1/2] Starting Backend Daphne / Django ASGI Server (Port 8000)...
start "OffensiveGrid Backend" cmd /k ".\.venv\Scripts\activate.bat && cd backend && python manage.py runserver 8000"

echo [2/2] Starting Frontend Vite Dev Server (Port 5173)...
start "OffensiveGrid Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  All systems launched successfully!
echo  - Frontend Web App:  http://localhost:5173/
echo  - Backend API:       http://127.0.0.1:8000/api/v1/
echo  - Django Admin:      http://127.0.0.1:8000/admin/
echo ========================================================
pause
