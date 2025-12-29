const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

db.all('SELECT request_id, company_name, confidence_score FROM dossiers ORDER BY generated_at DESC', [], (err, dossiers) => {
  if (err) {
    console.log(' Error:', err);
  } else {
    console.log(` Found ${dossiers.length} dossiers in database.sqlite:`);
    dossiers.forEach((d, i) => {
      console.log(`${i + 1}. ${d.request_id} - ${d.company_name} (${Math.round(d.confidence_score * 100)}%)`);
    });
  }
  db.close();
});
