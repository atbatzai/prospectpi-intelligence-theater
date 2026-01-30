const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'prospectpi.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM raw_intelligence ORDER BY source', [], (err, rows) => {
  if (err) { console.error('Error:', err); return; }
  
  console.log('============================================================');
  console.log('        RAW INTELLIGENCE SOURCE ANALYSIS - STRIPE');
  console.log('============================================================');
  console.log('Total Sources:', rows.length);
  console.log('');
  
  let totalSize = 0;
  const goodSources = [];
  const badSources = [];
  
  rows.forEach(row => {
    const data = JSON.parse(row.raw_data);
    totalSize += row.data_size;
    
    console.log('------------------------------------------------------------');
    console.log('SOURCE:', row.source.toUpperCase());
    console.log('Status:', row.status, '| Confidence:', (row.confidence * 100).toFixed(0) + '%');
    console.log('Size:', (row.data_size / 1024).toFixed(1), 'KB | Cost: $' + row.api_cost.toFixed(4));
    
    if (row.confidence >= 0.5) {
      goodSources.push({source: row.source, conf: row.confidence, size: row.data_size});
      console.log('');
      console.log('DATA FIELDS:');
      Object.keys(data).forEach(key => {
        const val = data[key];
        if (Array.isArray(val)) {
          console.log('  - ' + key + ': Array[' + val.length + ']');
          if (val.length > 0 && typeof val[0] === 'object') {
            console.log('    Fields:', Object.keys(val[0]).slice(0,6).join(', '));
          }
        } else if (typeof val === 'object' && val !== null) {
          console.log('  - ' + key + ':', JSON.stringify(val).substring(0, 80) + '...');
        } else {
          console.log('  - ' + key + ':', String(val).substring(0, 60));
        }
      });
    } else {
      badSources.push({source: row.source, reason: data.error || data.note || 'Low confidence'});
      console.log('NO USABLE DATA:', data.error || data.note || 'Low confidence');
    }
    console.log('');
  });
  
  console.log('============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log('Total Data:', (totalSize / 1024).toFixed(1), 'KB');
  console.log('Good Sources (' + goodSources.length + '):', goodSources.map(s => s.source).join(', '));
  console.log('Failed Sources (' + badSources.length + '):', badSources.map(s => s.source).join(', '));
  
  db.close();
});
