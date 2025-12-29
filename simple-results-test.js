
const axios = require('axios');

async function waitAndTestResults() {
  const requestId = 'req_5995b8dfce1c'; // Netflix test
  
  console.log('⏳ Waiting 60 seconds for dossier completion...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  console.log('🔍 Testing results retrieval...');
  
  try {
    const response = await axios.get(`http://localhost:3001/api/v1/research/results/${requestId}`);
    console.log('✅ SUCCESS! Dossier retrieved:', response.status);
    console.log('📝 Dossier data:', JSON.stringify(response.data, null, 2));
    
    // Test dossier quality
    const dossier = response.data.dossier;
    if (dossier) {
      console.log('\n📊 DOSSIER QUALITY ASSESSMENT:');
      console.log(`Company: ${dossier.companyName || dossier.company_name}`);
      console.log(`Confidence: ${dossier.confidence || dossier.confidence_score}`);
      console.log(`Sections: ${Object.keys(dossier.structuredSections || {}).length}`);
      console.log(`Sources: ${dossier.sourceCount || dossier.source_count}`);
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status, error.response?.data || error.message);
    
    // If 500 error, the database issue persists
    if (error.response?.status === 500) {
      console.log('\n🚨 CONFIRMED: Database results retrieval blocker still exists');
      console.log('Next action: Fix database schema or implement fallback');
    }
  }
}

waitAndTestResults();
