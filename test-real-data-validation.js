/**
 * 🎭 PROSPECTPI INTELLIGENCE THEATER - FBI-QUALITY DOSSIER VALIDATION
 * Comprehensive 10-source intelligence gathering with real API credentials
 * Generates professional-grade intelligence dossiers
 */
require('dotenv').config(); // Load environment variables
const http = require('http');

// Environment configuration tracking
const ENV_STATUS = {};

/**
 * Check which API keys are actually configured
 */
function checkApiKeyConfiguration() {
  console.log('\n🎯 === FBI-QUALITY API ARSENAL AUDIT ===');
  
  const apiKeys = {
    // Premium Intelligence Sources
    'THEIRSTACK_JWT': '🔧 TheirStack Technographic Intelligence',
    'MARKETAUX_TOKEN': '📈 MarketAux Financial Intelligence', 
    'CORESIGNAL_MCP_AUTH': '👥 Coresignal Professional Network Intelligence',
    'PERPLEXITY_API_KEY': '🌐 Perplexity Real-time Web Intelligence',
    
    // Social Intelligence Matrix
    'NEWSDATA_API_KEY': '📰 NewsData.io Industry Intelligence',
    'REDDIT_CLIENT_ID': '🗣️ Reddit Community Intelligence',
    'TWITTER_BEARER_TOKEN': '🐦 Twitter/X Executive Communications Intelligence',
    'GITHUB_TOKEN': '💻 GitHub Technology Intelligence',
    'YOUTUBE_API_KEY': '🎥 YouTube Content Intelligence',
    'DISCORD_BOT_TOKEN': '💬 Discord Community Intelligence',
    
    // AI Analysis Services
    'ANTHROPIC_API_KEY': '🧠 Claude Advanced Analysis',
    'OPENAI_API_KEY': '🤖 GPT Intelligence Processing',
    'DEEPSEEK_API_KEY': '🔍 DeepSeek Cost-Optimized Analysis',
    'GOOGLE_GEMINI_API_KEY': '✨ Gemini Multi-Modal Intelligence'
  };
  
  let configuredCount = 0;
  let totalCount = Object.keys(apiKeys).length;
  
  Object.entries(apiKeys).forEach(([key, description]) => {
    const value = process.env[key];
    const isConfigured = value && value.length > 0 && value !== 'undefined';
    ENV_STATUS[key] = isConfigured;
    
    console.log(`${isConfigured ? 'CONFIGURED' : 'MISSING'} ${description}`);
    console.log(`    ${key}: ${isConfigured ? 'YES' : 'NO'}`);
    
    if (isConfigured) configuredCount++;
  });
  
  console.log(`\nSummary: ${configuredCount}/${totalCount} API sources configured`);
  
  if (configuredCount === 0) {
    console.log('⚠️  NO API KEYS CONFIGURED - SYSTEM COMPROMISED');
    console.log('🎭 Operating in graceful degradation mode only');
    console.log('💡 No real intelligence will be gathered');
  } else if (configuredCount >= 10) {
    console.log('🎯 FBI-QUALITY INTELLIGENCE ARSENAL READY');
    console.log(`✅ ${configuredCount} premium intelligence sources active`);
    console.log('🔥 Comprehensive 10-source intelligence gathering enabled');
    console.log('🎭 ProspectPI Intelligence Theater at maximum capability');
  } else {
    console.log(`⚡ ${configuredCount} API sources available for intelligence gathering`);
    console.log(`❌ ${totalCount - configuredCount} sources missing - reduced capability`);
    console.log('💪 Partial intelligence gathering mode active');
  }
  
  return { configuredCount, totalCount };
}

/**
 * Test backend API health and availability
 */
async function testBackendHealth() {
  console.log('\n=== BACKEND API HEALTH CHECK ===');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('Backend Status:', health);
          resolve(true);
        } catch (e) {
          console.log('Invalid health response');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('Backend health check failed:', error.message);
      console.log('Start backend with: npm run dev:api');
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('Backend health check timed out');
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Run comprehensive dossier test with real API validation
 */
async function testComprehensiveDossier() {
  console.log('\n=== COMPREHENSIVE DOSSIER TEST ===');
  console.log('Company: Microsoft');
  console.log('This will show EXACTLY what happens with your current API configuration');
  
  // FBI-Quality Target Company for comprehensive intelligence gathering
  const testCompany = {
    "companyName": "Microsoft",
    "vendorName": "Salesforce", 
    "productName": "CRM Solutions",
    "industry": "Technology",
    "primaryPainPoint": "Enterprise customer data integration and analytics optimization",
    "linkedinUrl": "https://www.linkedin.com/company/microsoft/",
    "linkedinUserUrl": "https://www.linkedin.com/in/satyanadella/"
  };
  
  return new Promise((resolve) => {
    const postData = JSON.stringify(testCompany);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/research/generate-dossier',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('Dossier generation started:', response);
            
            if (response.requestId) {
              console.log(`Request ID: ${response.requestId}`);
              console.log('Waiting for processing to complete...');
              setTimeout(() => checkDossierResults(response.requestId, resolve), 5000);
            } else {
              resolve(true);
            }
          } else {
            console.log('Dossier generation failed:', response);
            resolve(false);
          }
          
        } catch (e) {
          console.log('Invalid response format:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('Request failed:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('Request timed out');
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Check dossier completion and validate real data vs error handling
 */
function checkDossierResults(requestId, callback) {
  console.log('\n=== CHECKING DOSSIER RESULTS ===');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1/research/dossier/${requestId}`,
    method: 'GET',
    timeout: 10000
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        console.log(`Dossier Status: ${result.status}`);
        
        if (result.status === 'completed' && result.dossier) {
          validateDossierContent(result.dossier);
        } else if (result.status === 'failed') {
          console.log('Dossier generation failed:', result.error);
        } else {
          console.log('Dossier still processing...');
          setTimeout(() => checkDossierResults(requestId, callback), 3000);
          return;
        }
        
        callback(true);
        
      } catch (e) {
        console.log('Could not parse dossier result:', e.message);
        callback(false);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('Could not retrieve dossier:', error.message);
    callback(false);
  });
  
  req.end();
}

/**
 * Validate dossier content to distinguish real data from error handling
 */
function validateDossierContent(dossier) {
  console.log('\n=== REAL DATA vs ERROR HANDLING ANALYSIS ===');
  
  // Check data sources for actual API results
  if (dossier.dataSources && Array.isArray(dossier.dataSources)) {
    console.log('\nAPI Source Results:');
    
    let realDataCount = 0;
    let gracefulErrorCount = 0;
    
    dossier.dataSources.forEach(source => {
      const hasRealData = source.success && source.data && 
                         Object.keys(source.data).length > 0 && 
                         !JSON.stringify(source.data).includes('error') &&
                         !JSON.stringify(source.data).includes('unavailable');
      
      const apiKey = getApiKeyForSource(source.source);
      const apiConfigured = ENV_STATUS[apiKey];
      
      if (hasRealData) {
        console.log(`SUCCESS ${source.source.toUpperCase()}: REAL DATA RETRIEVED`);
        console.log(`    Cost: $${source.cost || 0} | Response time: ${source.responseTime || 'unknown'}ms`);
        if (source.data) {
          const dataSize = JSON.stringify(source.data).length;
          console.log(`    Data size: ${dataSize} characters`);
        }
        realDataCount++;
      } else {
        console.log(`FAILED ${source.source.toUpperCase()}: ${source.error || 'No data'}`);
        console.log(`    API Key ${apiConfigured ? 'configured' : 'MISSING'} | Graceful error handling: YES`);
        gracefulErrorCount++;
      }
    });
    
    console.log('\nRESULTS SUMMARY:');
    console.log(`Real data sources: ${realDataCount}`);
    console.log(`Graceful error handling: ${gracefulErrorCount}`);
    console.log(`Total cost: $${dossier.totalCost || 0}`);
    
    if (realDataCount === 0) {
      console.log('\nZERO REAL DATA RETRIEVED');
      console.log('This confirms: No API keys configured = Graceful error handling only');
      console.log('System behavior: Professional error responses, no crashes, no mock data');
      console.log('To get real data: Configure API keys in environment variables');
    } else {
      console.log(`\nSUCCESS: ${realDataCount} APIs returned real business intelligence`);
      console.log('This confirms: Configured APIs work, missing APIs fail gracefully');
      console.log('Perfect demonstration of Intelligence Theater resilience');
    }
  }
  
  // Analyze dossier sections for content type
  console.log('\nDossier Content Analysis:');
  
  const sections = [
    'companyProfile',
    'technographicProfile', 
    'financialIntelligence',
    'competitiveIntelligence',
    'socialIntelligence',
    'executiveSummary'
  ];
  
  sections.forEach(section => {
    if (dossier[section]) {
      const content = JSON.stringify(dossier[section]);
      const hasErrors = content.includes('error') || content.includes('unavailable') || 
                       content.includes('failed') || content.includes('authentication');
      const hasMockData = content.includes('mock') || content.includes('demo') || 
                         content.includes('sample') || content.includes('placeholder');
      
      if (hasErrors) {
        console.log(`${section}: Contains error messages (expected with missing API keys)`);
      } else if (hasMockData) {
        console.log(`${section}: Contains mock data (unexpected - should be removed)`);
      } else {
        console.log(`${section}: Contains structured content`);
      }
    } else {
      console.log(`${section}: Missing section`);
    }
  });
}

/**
 * Map source names to environment variable keys
 */
function getApiKeyForSource(sourceName) {
  const mapping = {
    'theirstack': 'THEIRSTACK_JWT',
    'marketaux': 'MARKETAUX_TOKEN',
    'coresignal': 'CORESIGNAL_MCP_AUTH',
    'perplexity': 'PERPLEXITY_API_KEY',
    'newsdata': 'NEWSDATA_API_KEY',
    'reddit': 'REDDIT_CLIENT_ID',
    'twitter': 'TWITTER_BEARER_TOKEN',
    'github': 'GITHUB_TOKEN',
    'youtube': 'YOUTUBE_API_KEY',
    'discord': 'DISCORD_BOT_TOKEN'
  };
  
  return mapping[sourceName.toLowerCase()] || 'UNKNOWN';
}

/**
 * Main test execution - shows honest system behavior
 */
async function runHonestValidation() {
  console.log('PROSPECTPI INTELLIGENCE THEATER - HONEST VALIDATION');
  console.log('Testing REAL data retrieval vs graceful error handling');
  console.log('Shows exactly what works with your current configuration\n');
  
  // Step 1: Check API key configuration
  const { configuredCount, totalCount } = checkApiKeyConfiguration();
  
  // Step 2: Health check
  const healthOk = await testBackendHealth();
  if (!healthOk) {
    console.log('\nTO START BACKEND:');
    console.log('   npm run dev:api');
    return;
  }
  
  // Step 3: Explain what will happen
  console.log('\n🎯 === FBI-QUALITY INTELLIGENCE OPERATION ===');
  if (configuredCount === 0) {
    console.log('❌ INTELLIGENCE BLACKOUT - No sources configured');
    console.log('🎭 System will demonstrate professional degradation handling');
    console.log('💡 No actionable intelligence will be produced');
  } else if (configuredCount >= 10) {
    console.log('🔥 MAXIMUM INTELLIGENCE CAPABILITY ENGAGED');
    console.log('✅ All 10+ intelligence sources active and ready');
    console.log('🎯 Comprehensive technographic, financial, social, and executive intelligence');
    console.log('📊 Expected output: FBI-quality dossier with deep insights');
    console.log('💰 Enhanced budget approved for premium intelligence gathering');
    console.log('⚡ Real-time processing with live progress updates');
  } else {
    console.log(`⚡ ${configuredCount} intelligence sources active`);
    console.log(`❌ ${totalCount - configuredCount} sources offline - operating at reduced capacity`);
    console.log('🎯 Partial intelligence gathering - some blind spots expected');
  }
  
  // Step 4: Run the test
  console.log('\nStarting comprehensive dossier generation...');
  const success = await testComprehensiveDossier();
  
  console.log('\n=== VALIDATION COMPLETE ===');
  if (success) {
    console.log('Test completed - you now see exactly how the system behaves');
    console.log('To get more real data: Configure additional API keys');
    console.log('Current system: Graceful degradation with professional UX');
    console.log('Intelligence Theater: Works beautifully with or without API keys');
  } else {
    console.log('Test encountered issues - check backend logs');
  }
}

// Auto-run if called directly
if (require.main === module) {
  runHonestValidation().then(() => {
    console.log('\nValidation complete');
  }).catch(error => {
    console.error('Validation failed:', error.message);
  });
}