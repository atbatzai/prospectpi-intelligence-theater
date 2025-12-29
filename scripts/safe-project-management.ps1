# Safe Multi-Project Docker Management
# Protects both Cosellus and ProspectPI projects from conflicts

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("cosellus", "prospectpi", "status", "stop-all", "check-conflicts")]
    [string]$Action
)

# Project configurations
$CosellusPath = "C:\Users\jeffr\dev-bmc\new-digest-service\deploy"
$ProspectPIPath = "C:\Users\jeffr\dev-prospectpi\new-digest-service"

function Write-SafeLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $(if($Level -eq "ERROR"){"Red"} elseif($Level -eq "WARN"){"Yellow"} else{"Green"})
}

function Check-PortConflicts {
    Write-SafeLog "Checking for port conflicts..."
    
    # Check critical ports
    $ports = @(3000, 3001, 5432, 5434, 6379, 6380, 7474, 7687)
    $conflicts = @()
    
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $conflicts += "Port $port is in use by PID: $($connection.OwningProcess)"
        }
    }
    
    if ($conflicts.Count -gt 0) {
        Write-SafeLog "PORT CONFLICTS DETECTED:" "ERROR"
        $conflicts | ForEach-Object { Write-SafeLog $_ "ERROR" }
        return $false
    } else {
        Write-SafeLog "No port conflicts detected ✓" "INFO"
        return $true
    }
}

function Stop-AllProjects {
    Write-SafeLog "Safely stopping all project containers..." "WARN"
    
    # Stop Cosellus (deploy project)
    if (Test-Path $CosellusPath) {
        Set-Location $CosellusPath
        Write-SafeLog "Stopping Cosellus containers..."
        docker-compose -f docker-compose.test.yml down --remove-orphans 2>$null
    }
    
    # Stop ProspectPI
    if (Test-Path $ProspectPIPath) {
        Set-Location $ProspectPIPath
        Write-SafeLog "Stopping ProspectPI containers..."
        docker-compose down --remove-orphans 2>$null
    }
    
    Write-SafeLog "All projects stopped safely ✓"
}

function Start-Cosellus {
    Write-SafeLog "Starting Cosellus project..." "INFO"
    
    if (!(Test-Path $CosellusPath)) {
        Write-SafeLog "Cosellus path not found: $CosellusPath" "ERROR"
        return
    }
    
    # Stop other projects first
    Stop-AllProjects
    
    Set-Location $CosellusPath
    Write-SafeLog "Building and starting Cosellus services..."
    docker-compose -f docker-compose.test.yml up -d --build
    
    # Wait and check
    Start-Sleep 10
    docker-compose -f docker-compose.test.yml ps
    Write-SafeLog "Cosellus started. Check above for service status."
}

function Start-ProspectPI {
    Write-SafeLog "Starting ProspectPI project..." "INFO"
    
    if (!(Test-Path $ProspectPIPath)) {
        Write-SafeLog "ProspectPI path not found: $ProspectPIPath" "ERROR"
        return
    }
    
    # Stop other projects first
    Stop-AllProjects
    
    Set-Location $ProspectPIPath
    Write-SafeLog "Building and starting ProspectPI services..."
    docker-compose up -d --build
    
    # Wait and check
    Start-Sleep 10
    docker-compose ps
    Write-SafeLog "ProspectPI started. Check above for service status."
}

function Show-Status {
    Write-SafeLog "=== PROJECT STATUS REPORT ===" "INFO"
    
    # Check running containers
    Write-SafeLog "Running Docker Containers:" "INFO"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
    
    Write-SafeLog "`n=== PORT USAGE ===" "INFO"
    Check-PortConflicts
    
    Write-SafeLog "`n=== PROJECT LOCATIONS ===" "INFO"
    Write-SafeLog "Cosellus: $CosellusPath $(if(Test-Path $CosellusPath){'✓'} else {'✗'})"
    Write-SafeLog "ProspectPI: $ProspectPIPath $(if(Test-Path $ProspectPIPath){'✓'} else {'✗'})"
}

# Main execution
switch ($Action) {
    "cosellus" { Start-Cosellus }
    "prospectpi" { Start-ProspectPI }
    "status" { Show-Status }
    "stop-all" { Stop-AllProjects }
    "check-conflicts" { Check-PortConflicts }
}