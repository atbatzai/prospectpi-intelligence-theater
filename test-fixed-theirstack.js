const axios = require('axios');
require('dotenv').config();

async function testFixedTheirStack() {
  const jwt = process.env.THEIRSTACK_JWT;
  console.log(' Testing Fixed TheirStack Implementation...');
  
  try {
    // Test the exact implementation from FieldIntelligenceResearcher
    const companyName = 'Tesla';
    const response = await axios.post('https://api.theirstack.com/v1/companies/search', {
      company_name_partial_match_or: [companyName],
      company_domain_or: [`${companyName.toLowerCase().replace(/\s+/g, '')}.com`],
      page: 0,
      limit: 5,
      order_by: [{ desc: true, field: 'employee_count' }],
      include_total_results: true
    }, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(' SUCCESS:', response.status);
    console.log('Companies found:', response.data.companies?.length || 0);
    console.log('Total results:', response.data.total_results || 0);
    
    if (response.data.companies?.length > 0) {
      const company = response.data.companies[0];
      console.log('First company:', company.name);
      console.log('Domain:', company.domain);
      console.log('Employees:', company.employee_count);
      console.log('Technologies:', company.technologies?.length || 0);
    }
    
  } catch (error) {
    console.log(' ERROR:', error.response?.status, error.response?.data);
  }
}

testFixedTheirStack();