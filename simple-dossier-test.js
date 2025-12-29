const axios = require('axios');

const testCompany = {
  name: 'Netflix Inc',
  vendorName: 'Amazon Web Services', 
  productName: 'AWS Media Services',
  industry: 'Streaming Entertainment',
  primaryPainPoint: 'Content delivery optimization'
};

const requestBody = {
  companyName: testCompany.name,
  vendorName: testCompany.vendorName,
  productName: testCompany.productName,
  industry: testCompany.industry,
  primaryPainPoint: testCompany.primaryPainPoint,
  additionalContext: 'Single test validation',
  competitorAnalysis: true,
  budgetIntelligence: true,
  technologyStackFocus: true
};

console.log('🧪 Testing single dossier request...');
console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

axios.post('http://localhost:3001/api/v1/research/generate-dossier', requestBody, {
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
}).then(response => {
  console.log('✅ SUCCESS! Status:', response.status);
  console.log('📝 Response:', response.data);
}).catch(error => {
  console.log('❌ ERROR! Status:', error.response?.status);
  console.log('📝 Error:', error.response?.data || error.message);
});