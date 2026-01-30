// Raw Intelligence Analysis Script
const http = require('http');
const fs = require('fs');
const requestId = '04dd5109-9f94-41c8-b5de-edb0edb7bb73';

http.get('http://localhost:3001/api/v1/research/' + requestId + '/raw-intelligence/all', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    fs.writeFileSync('raw-intelligence-analysis.json', JSON.stringify(json, null, 2));
    
    // Generate analysis report
    const report = [];
    report.push('# RAW INTELLIGENCE SOURCE ANALYSIS');
    report.push('## Company: Stripe | Request ID: ' + requestId);
    report.push('');
    
    if (!json.success) {
      report.push('ERROR: ' + JSON.stringify(json));
      fs.writeFileSync('source-analysis-report.md', report.join('\n'));
      return;
    }
    
    report.push('| Source | Status | Conf | Size | Cost | Key Data |');
    report.push('|--------|--------|------|------|------|----------|');
    
    const sources = json.sources;
    let goodSources = [];
    let badSources = [];
    
    Object.keys(sources).sort().forEach(name => {
      const s = sources[name];
      const size = (s.dataSize / 1024).toFixed(1) + 'KB';
      const conf = (s.confidence * 100).toFixed(0) + '%';
      const cost = '$' + s.cost.toFixed(4);
      
      let keyData = '';
      if (s.confidence > 0.5) {
        keyData = Object.keys(s.data).slice(0, 3).join(', ');
        goodSources.push({name, conf: s.confidence, size: s.dataSize, data: s.data});
      } else {
        keyData = s.data.error || s.data.note || 'No data';
        badSources.push({name, reason: keyData});
      }
      
      report.push('| ' + name + ' | ' + s.status + ' | ' + conf + ' | ' + size + ' | ' + cost + ' | ' + keyData + ' |');
    });
    
    report.push('');
    report.push('## HIGH-VALUE SOURCES (' + goodSources.length + ')');
    report.push('');
    
    goodSources.sort((a,b) => b.conf - a.conf).forEach(s => {
      report.push('### ' + s.name.toUpperCase() + ' (Confidence: ' + (s.conf*100).toFixed(0) + '%)');
      report.push('');
      
      const d = s.data;
      if (Array.isArray(d)) {
        report.push('- Array with ' + d.length + ' items');
      } else {
        Object.keys(d).forEach(key => {
          const val = d[key];
          if (Array.isArray(val)) {
            report.push('- **' + key + '**: Array[' + val.length + ']');
            if (val.length > 0 && typeof val[0] === 'object') {
              report.push('  - Fields: ' + Object.keys(val[0]).join(', '));
            }
          } else if (typeof val === 'object' && val !== null) {
            report.push('- **' + key + '**: ' + JSON.stringify(val).substring(0, 100) + '...');
          } else {
            report.push('- **' + key + '**: ' + String(val).substring(0, 100));
          }
        });
      }
      report.push('');
    });
    
    report.push('## FAILED/LOW-VALUE SOURCES (' + badSources.length + ')');
    report.push('');
    badSources.forEach(s => {
      report.push('- **' + s.name + '**: ' + s.reason);
    });
    
    fs.writeFileSync('source-analysis-report.md', report.join('\n'));
    console.log('Analysis complete! See source-analysis-report.md');
  });
}).on('error', (e) => console.error('Error:', e.message));
