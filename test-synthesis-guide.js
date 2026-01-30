// Test Synthesis Guide
const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'prospectpi.db');
const db = new sqlite3.Database(dbPath);

// Source-to-Section mapping
const SOURCE_SECTION_MAP = {
  'sec-edgar': { sections: ['Company Overview', 'Financial Health'], valueScore: 9 },
  'sec-formd': { sections: ['Funding History', 'Financial Health'], valueScore: 9 },
  'github': { sections: ['Technology Stack', 'Engineering Culture'], valueScore: 9 },
  'nvd-cve': { sections: ['Security Risk', 'Technology Assessment'], valueScore: 8 },
  'sec-8k': { sections: ['Executive Changes', 'Material Events'], valueScore: 8 },
  'courtlistener': { sections: ['Legal Risk', 'Litigation History'], valueScore: 8 },
  'greenhouse-jobs': { sections: ['Hiring Trends', 'Technology Stack'], valueScore: 8 },
  'wikidata': { sections: ['Company Overview', 'Executive Summary'], valueScore: 8 },
  'hackernews': { sections: ['Market Sentiment', 'Industry Perception'], valueScore: 7 },
  'googlenews': { sections: ['Recent News', 'Market Position'], valueScore: 7 },
  'web-fingerprint': { sections: ['Technology Stack', 'Infrastructure'], valueScore: 7 },
  'gdelt': { sections: ['Global Media Coverage'], valueScore: 6 },
  'marketaux': { sections: ['Financial News'], valueScore: 6 },
  'stackexchange': { sections: ['Developer Sentiment'], valueScore: 6 },
  'federalregister': { sections: ['Regulatory Exposure'], valueScore: 5 },
  'openalex': { sections: ['Research & Innovation'], valueScore: 5 },
  'wikimedia-pageviews': { sections: ['Public Interest'], valueScore: 4 },
  'cloud-attribution': { sections: [], valueScore: 2 },
  'prnewswire': { sections: [], valueScore: 2 },
  'businesswire': { sections: [], valueScore: 2 },
  'globenewswire': { sections: [], valueScore: 2 },
  'sec-xbrl': { sections: [], valueScore: 2 },
  'sam-gov': { sections: [], valueScore: 1 },
  'usaspending': { sections: [], valueScore: 1 },
  'openai-realtime': { sections: [], valueScore: 1 },
};

function calculateTier(confidence, valueScore) {
  if (confidence >= 0.8 && valueScore >= 7) return 1;
  if (confidence >= 0.5 && valueScore >= 4) return 2;
  return 3;
}

db.all('SELECT source, confidence, data_size FROM raw_intelligence ORDER BY confidence DESC', [], (err, rows) => {
  if (err) { console.error(err); return; }
  
  console.log('============================================================');
  console.log('       STEP 3: GUIDED SYNTHESIS PREVIEW');
  console.log('============================================================');
  console.log('');
  
  const tier1 = [];
  const tier2 = [];
  const tier3 = [];
  
  rows.forEach(row => {
    const mapping = SOURCE_SECTION_MAP[row.source] || { sections: [], valueScore: 3 };
    const tier = calculateTier(row.confidence, mapping.valueScore);
    
    const info = {
      source: row.source,
      confidence: row.confidence,
      valueScore: mapping.valueScore,
      sections: mapping.sections,
      size: row.data_size
    };
    
    if (tier === 1) tier1.push(info);
    else if (tier === 2) tier2.push(info);
    else tier3.push(info);
  });
  
  console.log('TIER 1 - PRIORITY SOURCES (' + tier1.length + ')');
  console.log('Detective will prioritize these for dossier sections:');
  console.log('');
  tier1.forEach(s => {
    console.log('  ' + s.source.toUpperCase());
    console.log('    Confidence: ' + (s.confidence * 100) + '% | Value: ' + s.valueScore + '/10 | Size: ' + (s.size/1024).toFixed(1) + 'KB');
    console.log('    Best for: ' + s.sections.join(', '));
    console.log('');
  });
  
  console.log('');
  console.log('TIER 2 - SUPPORTING SOURCES (' + tier2.length + ')');
  console.log('Detective will use these for validation:');
  tier2.forEach(s => {
    console.log('  ' + s.source + ': ' + (s.confidence * 100) + '% conf');
  });
  
  console.log('');
  console.log('TIER 3 - SKIP SOURCES (' + tier3.length + ')');
  console.log('Detective will NOT cite these:');
  console.log('  ' + tier3.map(s => s.source).join(', '));
  
  console.log('');
  console.log('============================================================');
  console.log('DETECTIVE SYNTHESIS INSTRUCTIONS PREVIEW');
  console.log('============================================================');
  console.log('');
  console.log('For each dossier section, the Detective will be told:');
  console.log('');
  console.log('1. EXECUTIVE SUMMARY: Use wikidata, sec-edgar, googlenews');
  console.log('2. TECHNOLOGY STACK: Use github, web-fingerprint, greenhouse-jobs');
  console.log('3. FINANCIAL HEALTH: Use sec-formd, sec-edgar, sec-8k');
  console.log('4. RISK ASSESSMENT: Use nvd-cve, courtlistener, sec-8k');
  console.log('5. MARKET POSITION: Use googlenews, hackernews, gdelt');
  console.log('');
  console.log('QUALITY RULES injected into prompt:');
  console.log('- Never cite Tier 3 sources');
  console.log('- Cross-validate with 2+ Tier 1/2 sources');
  console.log('- State "Insufficient data" if primary sources empty');
  
  db.close();
});
