const https = require('https');

const data = JSON.stringify({
  companyName: 'Microsoft',
  vendorName: 'ProspectPI',
  productName: 'Test'
});

const req = https.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/research/generate-dossier',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  rejectUnauthorized: false
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const r = JSON.parse(body);
    console.log('\n REQUEST ACCEPTED');
    console.log('   Request ID:', r.requestId);
    console.log('   Status:', r.status);
    console.log('\nCheck backend logs for Claude API call result...\n');
  });
});

req.on('error', e => {
  console.log('\n FAILED:', e.message, '\n');
});

req.write(data);
req.end();
