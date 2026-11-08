@echo off
cd /d "%~dp0"

start "Railwatch backend" cmd /k "cd backend && uv run uvicorn api:app --reload --port 8000"
start "Railwatch frontend" cmd /k "cd frontend\railwatch && npm run dev"
