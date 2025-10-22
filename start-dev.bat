@echo off
REM ProspectPI Intelligence Theater - Development Startup Script
echo  ProspectPI Intelligence Theater - Development Environment
echo ===============================================

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo  Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if we are in the correct directory
if not exist "package.json" (
    echo  package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo  Checking system health...
call npm run health

echo.
echo  Choose startup method:
echo [1] Stable Development (Recommended) - Auto-restart with file watching
echo [2] PM2 Process Manager - Professional process management
echo [3] Simple Development - Basic npm scripts
echo [4] Health Check Only
echo [5] Stop All Services
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo  Starting stable development environment...
    call npm run dev:both:stable
) else if "%choice%"=="2" (
    echo  Starting PM2 process manager...
    call npm run dev:api:pm2
    timeout /t 3 >nul
    cd frontend
    start /b npm run dev
    cd ..
    echo  Services started with PM2. Use "npm run logs" to view logs.
    echo  Use "npm run stop:pm2" to stop all services.
) else if "%choice%"=="3" (
    echo  Starting simple development environment...
    call npm run dev
) else if "%choice%"=="4" (
    echo  Running health check...
    call npm run health
) else if "%choice%"=="5" (
    echo  Stopping all services...
    call npm run stop:pm2
    taskkill /F /IM node.exe /T >nul 2>&1
    echo  All services stopped.
) else (
    echo  Invalid choice. Please select 1-5.
)

echo.
echo  Development URLs:
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:3001
echo Health Check: http://localhost:3001/health
echo API Docs: http://localhost:3001/api-docs
echo.
pause
