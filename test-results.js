const axios = require('axios');

// Test the results endpoint
async function testResults() {
  const requestId = 'req_5995b8dfce1c'; // From our successful test
  
  console.log(`🔍 Testing results endpoint for: ${requestId}`);
  
  try {
    const response = await axios.get(`http://localhost:3001/api/v1/research/results/${requestId}`);
    console.log('✅ Results check SUCCESS:', response.status);
    console.log('📝 Response:', response.data);
  } catch (error) {
    console.log('❌ Results check ERROR:', error.response?.status);
    console.log('📝 Error details:', error.response?.data || error.message);
  }
}

testResults();