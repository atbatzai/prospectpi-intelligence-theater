const axios = require('axios');

async function testSources() {
  console.log('\n=== SOURCE CONTENT VALIDATION TEST ===\n');
  
  const results = {};

  // Test 1: GitHub API - should return repos with actual data
  try {
    console.log('Testing GitHub...');
    const res = await axios.get('https://api.github.com/search/repositories?q=stripe+in:name&sort=stars&per_page=5');
    const data = res.data;
    const hasRepos = data.items && data.items.length > 0;
    const hasDetails = hasRepos && data.items[0].stargazers_count !== undefined;
    results.GitHub = {
      passed: hasRepos && hasDetails,
      data: hasRepos ? `${data.items.length} repos found. Top: ${data.items[0].name} (${data.items[0].stargazers_count} stars)` : 'No data'
    };
    console.log(` ${results.GitHub.data}\n`);
  } catch (e) {
    results.GitHub = { passed: false, data: e.message };
    console.log(` Error: ${e.message}\n`);
  }

  // Test 2: HackerNews - should return stories with content
  try {
    console.log('Testing HackerNews...');
    const res = await axios.get('https://hn.algolia.com/api/v1/search?query=stripe&hitsPerPage=5');
    const data = res.data;
    const hasStories = data.hits && data.hits.length > 0;
    const hasContent = hasStories && data.hits[0].title;
    results.HackerNews = {
      passed: hasStories && hasContent,
      data: hasStories ? `${data.hits.length} stories. Top: "${data.hits[0].title.substring(0, 50)}..." (${data.hits[0].points} points)` : 'No data'
    };
    console.log(` ${results.HackerNews.data}\n`);
  } catch (e) {
    results.HackerNews = { passed: false, data: e.message };
    console.log(` Error: ${e.message}\n`);
  }

  // Test 3: NVD CVE - should return CVEs with severity data
  try {
    console.log('Testing NVD-CVE...');
    const res = await axios.get('https://services.nvd.nist.gov/rest/json/cves/1.0?keyword=stripe&limit=5');
    const data = res.data;
    const hasCVEs = data.result && data.result.CVE_Items && data.result.CVE_Items.length > 0;
    const hasDetails = hasCVEs && data.result.CVE_Items[0].cve;
    results['NVD-CVE'] = {
      passed: hasCVEs && hasDetails,
      data: hasCVEs ? `${data.result.CVE_Items.length} CVEs found. First: ${data.result.CVE_Items[0].cve.CVE_data_meta.ID}` : 'No data'
    };
    console.log(` ${results['NVD-CVE'].data}\n`);
  } catch (e) {
    results['NVD-CVE'] = { passed: false, data: e.message };
    console.log(` Error: ${e.message}\n`);
  }

  // Test 4: OpenAlex - Academic citations
  try {
    console.log('Testing OpenAlex...');
    const res = await axios.get('https://api.openalex.org/works?search=stripe&per_page=5');
    const data = res.data;
    const hasWorks = data.results && data.results.length > 0;
    const hasContent = hasWorks && data.results[0].title;
    results.OpenAlex = {
      passed: hasWorks && hasContent,
      data: hasWorks ? `${data.results.length} papers. Top: "${data.results[0].title.substring(0, 50)}..."` : 'No data'
    };
    console.log(` ${results.OpenAlex.data}\n`);
  } catch (e) {
    results.OpenAlex = { passed: false, data: e.message };
    console.log(` Error: ${e.message}\n`);
  }

  // Summary
  console.log('=== SUMMARY ===\n');
  let passing = 0;
  for (const [source, result] of Object.entries(results)) {
    const icon = result.passed ? '' : '';
    console.log(`${icon} ${source}: ${result.passed ? 'USABLE' : 'LIMITED/ERROR'}`);
    if (result.passed) passing++;
  }
  console.log(`\nUsable Sources: ${passing}/${Object.keys(results).length}\n`);
}

testSources();
