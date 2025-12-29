const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.get('SELECT COUNT(*) as sections FROM intelligence_sections WHERE dossier_id = (SELECT id FROM dossiers WHERE request_id = ?)', ['req_lm7bpetnwt'], (err, result) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('Netflix sections:', result.sections);
  }
  
  db.get('SELECT COUNT(*) as sources FROM data_sources WHERE dossier_id = (SELECT id FROM dossiers WHERE request_id = ?)', ['req_lm7bpetnwt'], (err, result) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Netflix sources:', result.sources);
    }
    db.close();
  });
});