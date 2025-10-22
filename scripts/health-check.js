const http = require("http");
const fs = require("fs");
const path = require("path");

console.log(" ProspectPI Health Check System");
console.log("=".repeat(40));

const services = [
  {
    name: "Backend API",
    url: "http://localhost:3001/health",
    critical: true
  },
  {
    name: "Frontend Dev Server", 
    url: "http://localhost:3000",
    critical: false
  }
];

function checkService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "GET",
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        resolve({
          name: service.name,
          status: res.statusCode < 400 ? "HEALTHY" : "UNHEALTHY",
          statusCode: res.statusCode,
          response: data.substring(0, 200),
          critical: service.critical
        });
      });
    });

    req.on("error", (error) => {
      resolve({
        name: service.name,
        status: "DOWN",
        error: error.message,
        critical: service.critical
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        name: service.name,
        status: "TIMEOUT",
        error: "Request timeout",
        critical: service.critical
      });
    });

    req.end();
  });
}

async function runHealthCheck() {
  const results = await Promise.all(services.map(checkService));
  
  console.log("\\n HEALTH CHECK RESULTS:");
  console.log("-".repeat(30));
  
  let allHealthy = true;
  let criticalDown = false;
  
  results.forEach(result => {
    const statusIcon = result.status === "HEALTHY" ? "" : 
                      result.status === "DOWN" ? "" : "";
    
    console.log(`${statusIcon} ${result.name}: ${result.status}`);
    
    if (result.statusCode) {
      console.log(`   Status Code: ${result.statusCode}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.status !== "HEALTHY") {
      allHealthy = false;
      if (result.critical) {
        criticalDown = true;
      }
    }
  });
  
  console.log("\\n" + "=".repeat(40));
  
  if (allHealthy) {
    console.log(" ALL SYSTEMS OPERATIONAL");
    process.exit(0);
  } else if (criticalDown) {
    console.log(" CRITICAL SERVICES DOWN - Requires immediate attention");
    console.log("\\n Restart commands:");
    console.log("   Backend API: npm run restart:api");
    console.log("   Both services: npm run dev:both:stable");
    process.exit(1);
  } else {
    console.log(" NON-CRITICAL SERVICES DOWN - System partially operational");
    process.exit(0);
  }
}

runHealthCheck().catch(error => {
  console.error(" Health check failed:", error);
  process.exit(1);
});
