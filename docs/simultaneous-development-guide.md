# Simultaneous Project Management Guide

## 🎉 SUCCESS! Both Projects Running Simultaneously

### **Current Configuration:**

#### **Cosellus Project** ✅
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Neo4j**: http://localhost:7474 / bolt://localhost:7687

#### **ProspectPI Project** ✅
- **Frontend**: http://localhost:3002 ⭐ (Changed from 3000)
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5434
- **Redis**: localhost:6380

---

## 🚀 **Quick Access URLs**

### Development Interfaces:
- **Cosellus App**: http://localhost:3000
- **ProspectPI App**: http://localhost:3002
- **Cosellus API**: http://localhost:8000
- **ProspectPI API**: http://localhost:3001

### Database Interfaces:
- **Neo4j Browser**: http://localhost:7474
- **PostgreSQL (Cosellus)**: localhost:5432
- **PostgreSQL (ProspectPI)**: localhost:5434

---

## 📝 **Daily Workflow Commands**

### Check Status of Both Projects:
```powershell
# Check all running containers
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Check port usage
netstat -an | findstr "3000 3001 3002 8000 5432 5434"
```

### Start Both Projects:
```powershell
# Start Cosellus
cd "C:\Users\jeffr\dev-bmc\new-digest-service\deploy"
docker-compose -f docker-compose.test.yml up -d

# Start ProspectPI
cd "C:\Users\jeffr\dev-prospectpi\new-digest-service"
docker-compose up -d
```

### Stop Both Projects:
```powershell
# Stop Cosellus
cd "C:\Users\jeffr\dev-bmc\new-digest-service\deploy"
docker-compose -f docker-compose.test.yml down

# Stop ProspectPI  
cd "C:\Users\jeffr\dev-prospectpi\new-digest-service"
docker-compose down
```

### Restart Individual Projects:
```powershell
# Restart just Cosellus
cd "C:\Users\jeffr\dev-bmc\new-digest-service\deploy"
docker-compose -f docker-compose.test.yml restart

# Restart just ProspectPI
cd "C:\Users\jeffr\dev-prospectpi\new-digest-service"
docker-compose restart
```

---

## 💡 **Development Tips**

### **Working with Both Projects:**
1. **Use different browser profiles/windows** for each project to avoid cookie conflicts
2. **ProspectPI frontend is now on port 3002** (updated from 3000)
3. **All backend APIs remain on their original ports** (8000 for Cosellus, 3001 for ProspectPI)
4. **Databases are completely isolated** with different ports

### **Code Development:**
- **Frontend changes** will hot-reload in their respective containers
- **Backend changes** may require container restart depending on setup
- **Database changes** are persistent via Docker volumes

### **Port Reference:**
```
Cosellus:    Frontend:3000  Backend:8000  DB:5432    Redis:6379  Neo4j:7474,7687
ProspectPI:  Frontend:3002  Backend:3001  DB:5434    Redis:6380
```

---

## 🎯 **You're Now Set Up For:**
✅ **Simultaneous development** on both projects  
✅ **No port conflicts** - each service has unique ports  
✅ **Complete isolation** - separate networks and databases  
✅ **Hot reloading** - changes reflect immediately  
✅ **Safe operations** - projects don't interfere with each other  

**Both Cosellus and ProspectPI are now running side by side!** 🚀