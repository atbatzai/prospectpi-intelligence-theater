const { execSync } = require('child_process');
const net = require('net');

const PORTS = { backend: 3001, frontend: 3000 };

async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port, '127.0.0.1');
  });
}

async function killProcessOnPort(port) {
  try {
    const output = execSync('netstat -ano | findstr :' + port + ' | findstr LISTENING', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const pids = new Set();
    output.trim().split('\n').forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(parseInt(pid))) pids.add(parseInt(pid));
    });
    
    if (pids.size === 0) { console.log('Port ' + port + ' is free'); return true; }
    
    console.log('Port ' + port + ' in use by: ' + Array.from(pids).join(', '));
    for (const pid of pids) {
      try {
        execSync('taskkill /PID ' + pid + ' /T /F', { stdio: 'ignore' });
        console.log('  Killed PID ' + pid);
      } catch (e) {}
    }
    
    await new Promise(r => setTimeout(r, 1000));
    return !(await isPortInUse(port));
  } catch (e) {
    console.log('Port ' + port + ' is free');
    return true;
  }
}

async function main() {
  const port = process.argv[2] ? parseInt(process.argv[2]) : null;
  if (port) {
    await killProcessOnPort(port);
  } else {
    for (const [name, p] of Object.entries(PORTS)) {
      console.log('[' + name + '] Port ' + p + ':');
      await killProcessOnPort(p);
    }
  }
}

module.exports = { killProcessOnPort, isPortInUse };
if (require.main === module) main();
