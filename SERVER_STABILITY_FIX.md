# 🔧 Server Stability - Permanent Fix Documentation

## Problem Identified

The server was unstable due to a **PowerShell-based background launcher** (`dev:api:bg` command) that used `Start-Job` with `npx ts-node`. This approach was fundamentally unreliable because:

1. **PowerShell Job Issues**: PowerShell jobs don't properly relay signals to child processes
2. **Port Binding Problems**: Each restart attempt could fail due to lingering port bindings
3. **Process Tree Management**: Windows process management through PowerShell is unpredictable
4. **Logging Complications**: Background jobs have limited access to stdout/stderr

## Permanent Solution

### ✅ Primary Fix: Replace PowerShell with Node.js Launcher

The `dev-server-launcher.js` script is a **purpose-built Windows-resilient launcher** that handles:

- **Automatic port cleanup** before starting (prevents EADDRINUSE errors)
- **Exponential backoff retries** with Fibonacci delays (1s → 34s)
- **Process tree management** using Windows taskkill with `/T /F` flags
- **Signal handling** for graceful shutdown (double Ctrl+C protection)
- **Memory monitoring** and crash recovery

### 📝 Updated npm Commands

All scripts now use the stable Node.js launcher:

```bash
# Normal development - foreground with hot restart
npm run dev:api:win

# Stable mode with file watchers (recommended)
npm run dev:api:stable

# Background mode - uses Node.js launcher (not PowerShell)
npm run dev:api:bg

# PM2 production mode
npm run dev:api:pm2

# Full stack development
npm run dev
```

### 🚀 How to Use

#### For Standard Development (Recommended)
```bash
npm run dev:api:win
```
This starts the server in foreground mode with automatic port cleanup and intelligent restart handling.

#### For Background Execution
```bash
npm run dev:api:bg
```
This delegates to the Node.js launcher instead of PowerShell, ensuring reliability.

#### For PowerShell Preference
If you must use PowerShell, use the safe wrapper:
```powershell
./scripts/start-server-bg.ps1 -Foreground
```
or for background:
```powershell
./scripts/start-server-bg.ps1
```

### 🛠️ What Changed

| Before | After |
|--------|-------|
| `dev:api:bg` → PowerShell Start-Job | `dev:api:bg` → Node.js Launcher |
| Unreliable process management | Windows-native taskkill for cleanup |
| Random port binding failures | Automatic port verification before start |
| Silent failures with no restart | Intelligent retry with exponential backoff |

### 🔍 Verify the Fix

Run the health check:
```bash
npm run health
```

Or manually test:
```bash
# Clean ports
npm run ports:clean

# Start server
npm run dev:api:win

# In another terminal - test endpoint
curl http://localhost:3001/health
```

### 📊 Configuration Reference

The launcher uses these settings (from `ecosystem.config.js`):
- **Max restarts**: 10 attempts
- **Restart delays**: Fibonacci sequence (1s, 2s, 3s, 5s, 8s, 13s, 21s, 34s)
- **Min uptime**: 5 seconds (process must stay alive for 5s to reset retry counter)
- **Kill timeout**: 15 seconds for graceful shutdown
- **Memory cap**: 1GB (auto-restart on overflow)

### ⚠️ Troubleshooting

**Port still in use after cleanup?**
```bash
npm run ports:clean:api
# Wait 2 seconds, then
npm run dev:api:win
```

**Server keeps restarting?**
Check logs for errors:
```bash
tail -f logs/api-error.log
```

**Process stuck in zombie state?**
```bash
taskkill /F /IM node.exe
npm run ports:clean
npm run dev:api:win
```

## Summary

✅ **Problem Fixed**: Replaced unreliable PowerShell-based process management  
✅ **Solution Deployed**: All scripts now use stable Node.js launcher  
✅ **Windows Support**: Native Windows process management with taskkill  
✅ **Backward Compatible**: Same command names, better implementation  
✅ **Production Ready**: Handles edge cases and auto-recovery  

The server is now **permanently stabilized** for Windows development.
