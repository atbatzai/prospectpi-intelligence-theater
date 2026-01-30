const { chromium } = require('playwright');

async function testSourcesWithPlaywright() {
  console.log('\n');
  console.log('           TESTING FIXED DATA SOURCES WITH PLAYWRIGHT              ');
  console.log('\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  const results = {};
  
  // Test 1: SEC Edgar - Search for Stripe
  console.log(' Test 1: SEC Edgar - Company Search for Stripe');
  try {
    await page.goto('https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=stripe&type=&dateb=&owner=exclude&count=100', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    const content = await page.textContent('body');
    const hasStripe = content.includes('Stripe') || content.includes('Payment Processing') || content.includes('stripe.com');
    const filingCount = (content.match(/\d+\s*Filings?/gi) || []).length;
    
    results['SEC Edgar'] = {
      status: hasStripe ? ' PASS' : ' FAIL',
      details: Found  filing references, Stripe mentioned: 
    };
    console.log(   Result: );
    console.log(   Details: \n);
  } catch (error) {
    results['SEC Edgar'] = {
      status: '  ERROR',
      details: error.message
    };
    console.log(   Result: ERROR - \n);
  }

  // Test 2: CourtListener - Search for legal cases
  console.log(' Test 2: CourtListener - Search for company legal cases');
  try {
    await page.goto('https://www.courtlistener.com/?q=%22Stripe%22', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    const content = await page.textContent('body');
    const caseMatches = content.match(/\d+\s*case[s]?/gi) || [];
    const hasResults = content.includes('case') || content.includes('Court') || caseMatches.length > 0;
    
    results['CourtListener'] = {
      status: hasResults ? ' PASS' : '  NO RESULTS',
      details: Found  case references
    };
    console.log(   Result: );
    console.log(   Details: \n);
  } catch (error) {
    results['CourtListener'] = {
      status: '  ERROR',
      details: error.message
    };
    console.log(   Result: ERROR - \n);
  }

  // Test 3: BusinessWire - Search for company announcements
  console.log(' Test 3: BusinessWire - Search for company press releases');
  try {
    await page.goto('https://www.businesswire.com/cgi-bin/open_news_search.cgi?query=%22Stripe%22&sort=rating&date_select=last_30_days', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    const content = await page.textContent('body');
    const pressReleaseMatches = (content.match(/press\s*release/gi) || []).length;
    const newsMatches = (content.match(/news/gi) || []).length;
    const hasResults = pressReleaseMatches > 0 || newsMatches > 5;
    
    results['BusinessWire'] = {
      status: hasResults ? ' PASS' : '  LIMITED RESULTS',
      details: Found  press release mentions,  news references
    };
    console.log(   Result: );
    console.log(   Details: \n);
  } catch (error) {
    results['BusinessWire'] = {
      status: '  ERROR',
      details: error.message
    };
    console.log(   Result: ERROR - \n);
  }

  // Test 4: Federal Register - Search for compliance
  console.log(' Test 4: Federal Register - Search for compliance data');
  try {
    await page.goto('https://www.federalregister.gov/documents/search?q=stripe&agencies=&type=&president=&agency=&section=&sub_agency=&dates[]=', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    const content = await page.textContent('body');
    const documentMatches = (content.match(/\d+\s*document/gi) || []).length;
    const regulationMatches = (content.match(/regulation/gi) || []).length;
    const hasResults = documentMatches > 0 || regulationMatches > 0;
    
    results['Federal Register'] = {
      status: hasResults ? ' PASS' : '  LIMITED RESULTS',
      details: Found  document references,  regulations
    };
    console.log(   Result: );
    console.log(   Details: \n);
  } catch (error) {
    results['Federal Register'] = {
      status: '  ERROR',
      details: error.message
    };
    console.log(   Result: ERROR - \n);
  }

  // Test 5: NVD CVE - Search for vulnerabilities
  console.log(' Test 5: NVD-CVE - Search for security vulnerabilities');
  try {
    await page.goto('https://nvd.nist.gov/vuln/search?query=stripe', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    const content = await page.textContent('body');
    const cveMatches = (content.match(/CVE-\d+-\d+/gi) || []).length;
    const vulnMatches = (content.match(/vulnerability|vulnerabilities/gi) || []).length;
    const hasResults = cveMatches > 0 || vulnMatches > 0;
    
    results['NVD-CVE'] = {
      status: hasResults ? ' PASS' : '  LIMITED RESULTS',
      details: Found  CVE references,  vulnerability mentions
    };
    console.log(   Result: );
    console.log(   Details: \n);
  } catch (error) {
    results['NVD-CVE'] = {
      status: '  ERROR',
      details: error.message
    };
    console.log(   Result: ERROR - \n);
  }

  // Print Summary
  console.log('\n');
  console.log('                         TEST SUMMARY                              ');
  console.log('\n');
  
  let passCount = 0;
  for (const [source, result] of Object.entries(results)) {
    console.log(${result.status} );
    console.log(   );
    if (result.status.includes('')) passCount++;
  }
  
  console.log(\n Tests Passed: /\n);

  await browser.close();
}

testSourcesWithPlaywright().catch(console.error);
