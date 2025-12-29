const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

console.log(' CHECKING DOSSIERS TABLE SCHEMA...\n');

// First check the table structure
db.all('PRAGMA table_info(dossiers)', [], (err, columns) => {
  if (err) {
    console.log(' Error getting table info:', err);
  } else {
    console.log('Dossiers table columns:');
    columns.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });
  }
  
  // Then get all dossiers with basic fields
  db.all('SELECT * FROM dossiers LIMIT 5', [], (err, dossiers) => {
    if (err) {
      console.log(' Error selecting dossiers:', err);
    } else {
      console.log(`\nFound ${dossiers.length} dossiers:`);
      dossiers.forEach((d, i) => {
        console.log(`${i + 1}. ${d.request_id} - ${d.company_name || 'No name'}`);
      });
    }
    db.close();
  });
});
