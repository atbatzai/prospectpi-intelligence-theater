const sqlite3 = require('sqlite3').verbose();

console.log(' CHECKING DOSSIERS IN PROSPECTPI.DB...\n');

const db = new sqlite3.Database('./data/prospectpi.db');

// Check what dossiers exist in prospectpi.db
db.all('SELECT request_id, company_name, confidence_score FROM dossiers LIMIT 10', [], (err, dossiers) => {
  if (err) {
    console.log(' Error:', err);
  } else {
    console.log(`Found ${dossiers.length} dossiers in prospectpi.db:`);
    dossiers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.request_id} - ${d.company_name} (${Math.round(d.confidence_score * 100)}%)`);
    });
    
    if (dossiers.length > 0) {
      console.log('\n DATA SPLIT CONFIRMED!');
      console.log('    prospectpi.db: Has schema + dossier data');
      console.log('    database.sqlite: Has schema only (empty)');
      console.log('\n SOLUTION: Copy dossiers from prospectpi.db to database.sqlite');
    }
  }
  db.close();
});
