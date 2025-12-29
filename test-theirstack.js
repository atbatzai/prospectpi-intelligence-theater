const axios = require('axios');
require('dotenv').config();

async function getTheirStackDocs() {
  const jwt = process.env.THEIRSTACK_JWT;
  console.log('� Fetching TheirStack API Documentation...');
  
  try {
    const response = await axios.get('https://api.theirstack.com/', {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ TheirStack API Documentation Retrieved');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('\n--- DOCUMENTATION CONTENT ---');
    
    // Extract API endpoints from the HTML documentation
    const htmlContent = response.data;
    const endpointMatches = htmlContent.match(/\/api\/[^"'\s<>]+/g) || [];
    const uniqueEndpoints = [...new Set(endpointMatches)];
    
    console.log('📡 Found API Endpoints:');
    uniqueEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint}`);
    });
    
    // Also look for any mention of authentication or base URLs
    const lines = htmlContent.split('\n');
    const relevantLines = lines.filter(line => 
      line.toLowerCase().includes('api') ||
      line.toLowerCase().includes('endpoint') ||
      line.toLowerCase().includes('bearer') ||
      line.toLowerCase().includes('auth')
    );
    
    console.log('\n🔍 Relevant Documentation Lines:');
    relevantLines.slice(0, 10).forEach(line => {
      console.log(`  ${line.trim()}`);
    });
    
  } catch (error) {
    console.log('❌ Error fetching documentation:', error.message);
  }
}

getTheirStackDocs();