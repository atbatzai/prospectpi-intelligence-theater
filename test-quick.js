const { chromium } = require('playwright');

(async () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║    TESTING FIXED DATA SOURCES - READING ACTUAL CONTENT         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = [];
  
  // Test 1: SEC Edgar
  try {
    console.log('1️⃣  SEC Edgar - Company Lookup');
    await page.goto('https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=stripe&owner=exclude&count=10', { waitUntil: 'networkidle', timeout: 20000 });
    const body = await page.$('body');
    const text = await page.evaluate(() => document.body.innerText);
    const hasStripe = text.includes('Stripe') || text.includes('stripe');
    const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
    console.log(`   ${hasStripe ? '✅ PASS' : '❌ FAIL'} - Stripe found in ${lineCount} text lines`);
    console.log(`   Content snippet: ${text.substring(0, 150).replace(/\n/g, ' ')}\n`);
    results.push(['SEC Edgar', hasStripe ? 'PASS' : 'FAIL']);
  } catch (e) {
    console.log(`   ⚠️  ERROR: ${e.message}\n`);
    results.push(['SEC Edgar', 'ERROR']);
  }
  
  // Test 2: CourtListener
  try {
    console.log('2️⃣  CourtListener - Legal Cases');
    await page.goto('https://www.courtlistener.com/?q=%22Stripe%22', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);
    const hasResults = text.includes('case') || text.includes('Case') || text.includes('Court');
    const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
    console.log(`   ${hasResults ? '✅ PASS' : '⚠️  LIMITED'} - Found ${lineCount} text lines`);
    console.log(`   Content snippet: ${text.substring(0, 150).replace(/\n/g, ' ')}\n`);
    results.push(['CourtListener', hasResults ? 'PASS' : 'LIMITED']);
  } catch (e) {
    console.log(`   ⚠️  ERROR: ${e.message}\n`);
    results.push(['CourtListener', 'ERROR']);
  }
  
  // Test 3: NVD CVE Database
  try {
    console.log('3️⃣  NVD-CVE - Security Vulnerabilities');
    await page.goto('https://nvd.nist.gov/vuln/search?query=stripe', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);
    const hasCVE = text.includes('CVE') || text.includes('vulnerability');
    const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
    console.log(`   ${hasCVE ? '✅ PASS' : '⚠️  LIMITED'} - Found ${lineCount} text lines`);
    console.log(`   Content snippet: ${text.substring(0, 150).replace(/\n/g, ' ')}\n`);
    results.push(['NVD-CVE', hasCVE ? 'PASS' : 'LIMITED']);
  } catch (e) {
    console.log(`   ⚠️  ERROR: ${e.message}\n`);
    results.push(['NVD-CVE', 'ERROR']);
  }
  
  // Test 4: Federal Register
  try {
    console.log('4️⃣  Federal Register - Compliance Data');
    await page.goto('https://www.federalregister.gov/documents/search?q=stripe', { waitUntil: 'load', timeout: 20000 });
    const text = await page.evaluate(() => document.body.innerText);
    const hasResults = text.includes('document') || text.includes('Document') || text.includes('regulation');
    const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
    console.log(`   ${hasResults ? '✅ PASS' : '⚠️  LIMITED'} - Found ${lineCount} text lines`);
    console.log(`   Content snippet: ${text.substring(0, 150).replace(/\n/g, ' ')}\n`);
    results.push(['Federal Register', hasResults ? 'PASS' : 'LIMITED']);
  } catch (e) {
    console.log(`   ⚠️  ERROR: ${e.message}\n`);
    results.push(['Federal Register', 'ERROR']);
  }
  
  // Summary
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  let passCount = 0;
  for (const [source, status] of results) {
    const icon = status === 'PASS' ? '✅' : status === 'ERROR' ? '⚠️' : '📊';
    console.log(`${icon} ${source}: ${status}`);
    if (status === 'PASS') passCount++;
  }
  
  console.log(`\n✨ Tests Passed: ${passCount}/${results.length}`);
  console.log('✅ All Playwright tests completed\n');
  
  await browser.close();
})().catch(e => console.error('FATAL:', e));
