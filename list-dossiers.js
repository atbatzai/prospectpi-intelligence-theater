const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

console.log(' CHECKING ALL DOSSIERS...\n');

db.all('SELECT request_id, company_name, confidence_score, created_at FROM dossiers ORDER BY created_at DESC', [], (err, dossiers) => {
  if (err) {
    console.log(' Error:', err);
  } else {
    console.log(`Found ${dossiers.length} dossiers:`);
    dossiers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.request_id} - ${d.company_name} (${Math.round(d.confidence_score * 100)}%)`);
    });
  }
  db.close();
});
