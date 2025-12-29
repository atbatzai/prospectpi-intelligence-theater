console.log(' PIPELINE REPAIR TOOL');
console.log('Fixing existing dossiers with empty sections and data sources');

const http = require('http');

// Test repair on Netflix dossier
const requestId = 'req_cd32e910ae3c';

function repairDossier(requestId) {
  console.log(\ Attempting to repair dossier: \\);
  
  const postData = JSON.stringify({
    requestId: requestId,
    action: 'repair_pipeline'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/research/repair',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(\ Repair response (\):\, data);
    });
  });
  
  req.on('error', (err) => {
    console.error(' Repair request failed:', err.message);
  });
  
  req.write(postData);
  req.end();
}

repairDossier(requestId);