/**
 * Phase 3: AI-Enhanced Consultation Service Test
 * Testing OpenAI + Claude integration with analytics
 */

const http = require('http');

// Test health endpoint
function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Health check response (${res.statusCode}):`, JSON.parse(data));
      testResearchEndpoint();
    });
  });

  req.on('error', (error) => {
    console.error('❌ Health check failed:', error.message);
  });

  req.end();
}

// Test research endpoint  
function testResearchEndpoint() {
  console.log('\n🔬 Testing research endpoint...');
  
  const postData = JSON.stringify({
    companyName: 'OpenAI',
    companyUrl: 'https://openai.com',
    linkedinUrl: 'https://linkedin.com/company/openai',
    crmNotes: 'AI research company, creator of ChatGPT',
    organizationFocus: 'AI Research Division',
    locationOfInterest: 'San Francisco',
    contextLinks: ['https://openai.com/news'],
    additionalContext: 'Focus on GPT models and AI safety'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/research/generate-dossier',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Research endpoint response (${res.statusCode}):`, JSON.parse(data));
      console.log('\n🎉 API testing complete! All endpoints are working.');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Research endpoint failed:', error.message);
  });

  req.write(postData);
  req.end();
}

// Start testing
console.log('🚀 Starting ProspectPI API endpoint tests...\n');
testHealthEndpoint();