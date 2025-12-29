# Safe Multi-Project Docker Management Guide

## 🛡️ PROTECTING BOTH COSELLUS & PROSPECTPI

This guide ensures both projects remain safe and functional without conflicts.

## Quick Commands

### Check Status (Always run this first)
```powershell
.\scripts\safe-project-management.ps1 -Action status
```

### Start Cosellus (Safely)
```powershell
.\scripts\safe-project-management.ps1 -Action cosellus
```

### Start ProspectPI (Safely)
```powershell
.\scripts\safe-project-management.ps1 -Action prospectpi
```

### Emergency Stop All
```powershell
.\scripts\safe-project-management.ps1 -Action stop-all
```

## Project Isolation Details

### Cosellus Project (dev-bmc)
- **Location**: `C:\Users\jeffr\dev-bmc\new-digest-service\deploy\`
- **Compose File**: `docker-compose.test.yml`
- **Containers**: deploy-frontend-1, deploy-backend-1, deploy-postgres-1, deploy-redis-1, deploy-neo4j-1
- **Ports**: Standard (3000, 8000, 5432, 6379, 7474, 7687)
- **Network**: deploy_default

### ProspectPI Project (dev-prospectpi) 
- **Location**: `C:\Users\jeffr\dev-prospectpi\new-digest-service\`
- **Compose File**: `docker-compose.yml`
- **Containers**: prospectpi-fresh-* 
- **Ports**: Isolated (3000, 3001, 5434, 6380)
- **Network**: prospectpi-fresh-network-2025

## Safety Features

### ✅ What Protects You:
1. **Different project names**: `deploy` vs `prospectpi-fresh-2025`
2. **Different networks**: Complete network isolation
3. **Different ports**: ProspectPI uses 5434, 6380 to avoid standard ports
4. **Safe startup**: Script always stops other project first
5. **Status monitoring**: Always check before starting

### 🚨 Emergency Procedures

#### If Something Goes Wrong:
```powershell
# 1. Stop everything immediately
.\scripts\safe-project-management.ps1 -Action stop-all

# 2. Check what's still running
docker ps

# 3. Nuclear option (stops ALL Docker containers)
docker stop $(docker ps -q)
docker container prune -f

# 4. Check port conflicts
netstat -an | findstr "3000 3001 5432 5434 6379 6380"
```

#### If Ports Are Conflicted:
```powershell
# Find what's using the port
netstat -ano | findstr ":<PORT>"

# Kill the process if necessary (be careful!)
taskkill /PID <PID> /F
```

## Best Practices

### Before Starting Any Project:
1. ✅ Run status check
2. ✅ Ensure other project is stopped
3. ✅ Check for port conflicts
4. ✅ Start your desired project

### Project Switching:
```powershell
# From Cosellus to ProspectPI
.\scripts\safe-project-management.ps1 -Action stop-all
.\scripts\safe-project-management.ps1 -Action prospectpi

# From ProspectPI to Cosellus  
.\scripts\safe-project-management.ps1 -Action stop-all
.\scripts\safe-project-management.ps1 -Action cosellus
```

### Daily Workflow:
1. Start your day: `.\scripts\safe-project-management.ps1 -Action status`
2. Work on one project at a time
3. Switch safely when needed
4. End your day: `.\scripts\safe-project-management.ps1 -Action stop-all`

## Manual Commands (If Script Fails)

### Cosellus (Manual):
```powershell
cd "C:\Users\jeffr\dev-bmc\new-digest-service\deploy"
docker-compose -f docker-compose.test.yml down --remove-orphans
docker-compose -f docker-compose.test.yml up -d
```

### ProspectPI (Manual):
```powershell
cd "C:\Users\jeffr\dev-prospectpi\new-digest-service"
docker-compose down --remove-orphans  
docker-compose up -d
```

## 🎯 Recommendation: START HERE

1. **First, check current status**:
   ```powershell
   cd C:\Users\jeffr\dev-prospectpi\new-digest-service
   .\scripts\safe-project-management.ps1 -Action status
   ```

2. **Then start the project you want to work on**:
   ```powershell
   # For ProspectPI
   .\scripts\safe-project-management.ps1 -Action prospectpi
   
   # OR for Cosellus
   .\scripts\safe-project-management.ps1 -Action cosellus
   ```

This approach ensures both projects remain protected and you can work confidently on either one!