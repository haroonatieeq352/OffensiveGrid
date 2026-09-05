# OffensiveGrid — PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  OffensiveGrid — Starting Full Stack Platform...       " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Start Backend
Write-Host "[1/2] Starting Django ASGI Server on Port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; ..\.venv\Scripts\python.exe manage.py runserver 8000"

# 2. Start Frontend
Write-Host "[2/2] Starting Vite React Frontend on Port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  All services launched in separate windows!" -ForegroundColor Green
Write-Host "  - Web App:      http://localhost:5173/" -ForegroundColor White
Write-Host "  - Backend API:  http://127.0.0.1:8000/api/v1/" -ForegroundColor White
Write-Host "  - Django Admin: http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
