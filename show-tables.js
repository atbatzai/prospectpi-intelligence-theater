const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

db.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log('EXISTING TABLES:');
    tables.forEach(table => {
      console.log('-', table.name);
    });
  }
  db.close();
});
