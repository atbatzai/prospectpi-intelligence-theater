# ProspectPI Intelligence Theater - PowerShell Startup Script
Write-Host " ProspectPI Intelligence Theater - Development Environment" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to start services
function Start-StableServices {
    Write-Host " Starting stable development environment..." -ForegroundColor Green
    
    # Check if ports are available
    if (Test-Port 3001) {
        Write-Host " Port 3001 is already in use. Stopping existing processes..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    if (Test-Port 3000) {
        Write-Host " Port 3000 is already in use. This might be another frontend instance." -ForegroundColor Yellow
    }
    
    # Start backend with PM2 for better process management
    Write-Host " Starting backend API with PM2..." -ForegroundColor Blue
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "dev:api:pm2" -WindowStyle Hidden
    
    Start-Sleep -Seconds 5
    
    # Start frontend in a new window
    Write-Host " Starting frontend development server..." -ForegroundColor Blue
    Set-Location "frontend"
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "dev:stable" -WindowStyle Minimized
    Set-Location ".."
    
    Start-Sleep -Seconds 3
    
    Write-Host " Services started successfully!" -ForegroundColor Green
    Write-Host " Development URLs:" -ForegroundColor Yellow
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
    Write-Host "   Health Check: http://localhost:3001/health" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:3001/api-docs" -ForegroundColor White
    Write-Host ""
    Write-Host " Use `npm run logs` to view backend logs" -ForegroundColor Cyan
    Write-Host " Use `npm run stop:pm2` to stop all services" -ForegroundColor Cyan
}

# Function to check health
function Test-SystemHealth {
    Write-Host " Checking system health..." -ForegroundColor Blue
    
    try {
        $backendHealth = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
        Write-Host " Backend API: HEALTHY" -ForegroundColor Green
        Write-Host "   Status: $($backendHealth.status)" -ForegroundColor White
        Write-Host "   Uptime: $($backendHealth.uptime)" -ForegroundColor White
    } catch {
        Write-Host " Backend API: DOWN" -ForegroundColor Red
    }
    
    try {
        $frontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        Write-Host " Frontend: HEALTHY (Status: $($frontendTest.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host " Frontend: DOWN" -ForegroundColor Red
    }
}

# Function to stop all services
function Stop-AllServices {
    Write-Host " Stopping all services..." -ForegroundColor Red
    
    # Stop PM2 processes
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "stop:pm2" -Wait -WindowStyle Hidden
    
    # Force kill any remaining Node processes
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    
    Write-Host " All services stopped." -ForegroundColor Green
}

# Main menu
do {
    Write-Host ""
    Write-Host " Choose an action:" -ForegroundColor Yellow
    Write-Host "[1] Start Stable Development Environment (Recommended)" -ForegroundColor White
    Write-Host "[2] Check System Health" -ForegroundColor White
    Write-Host "[3] Stop All Services" -ForegroundColor White
    Write-Host "[4] Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" { Start-StableServices }
        "2" { Test-SystemHealth }
        "3" { Stop-AllServices }
        "4" { 
            Write-Host " Goodbye!" -ForegroundColor Cyan
            exit 
        }
        default { 
            Write-Host " Invalid choice. Please select 1-4." -ForegroundColor Red 
        }
    }
    
    if ($choice -ne "4") {
        Write-Host ""
        Read-Host "Press Enter to continue"
    }
    
} while ($choice -ne "4")
