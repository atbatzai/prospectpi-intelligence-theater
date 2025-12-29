const axios = require('axios');
require('dotenv').config();

async function getTheirStackAPISpec() {
  const jwt = process.env.THEIRSTACK_JWT;
  console.log(' Fetching TheirStack OpenAPI Specification...');
  
  try {
    const specResponse = await axios.get('https://api.theirstack.com/openapi.json', {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(' OpenAPI Spec Retrieved');
    const spec = specResponse.data;
    
    console.log(' API Info:');
    console.log(  Title: ${spec.info?.title});
    console.log(  Version: ${spec.info?.version});
    
    console.log('\\n Available Endpoints:');
    const paths = spec.paths || {};
    Object.keys(paths).forEach(path => {
      const methods = Object.keys(paths[path]);
      methods.forEach(method => {
        const operation = paths[path][method];
        console.log(  ${method.toUpperCase()} ${path});
        if (operation.summary) {
          console.log(    Summary: ${operation.summary});
        }
      });
    });
    
  } catch (error) {
    console.log(' Error:', error.response?.status, error.response?.data || error.message);
  }
}

getTheirStackAPISpec();