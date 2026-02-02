@echo off
echo ========================================
echo Starting VaxTrack Full Development Environment
echo ========================================

echo Starting backend server in new window...
start "VaxTrack Backend" cmd /k "cd /d %~dp0 && start-backend.bat"

echo Waiting 10 seconds for backend to start...
timeout /t 10 /nobreak >nul

echo Starting frontend server in new window...
start "VaxTrack Frontend" cmd /k "cd /d %~dp0 && start-frontend.bat"

echo.
echo ✅ Both servers are starting...
echo.
echo Backend: http://localhost:8080/api
echo Frontend: http://localhost:4200
echo.
echo Test Credentials:
echo - Username: health.worker     Password: Password123!
echo - Username: facility.manager  Password: Password123!
echo - Username: gov.official      Password: Password123!
echo.
echo Press any key to exit...
pause >nul