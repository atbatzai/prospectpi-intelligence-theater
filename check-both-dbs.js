const sqlite3 = require('sqlite3').verbose();

console.log(' CHECKING BOTH DATABASES...\n');

// Check database.sqlite
const db1 = new sqlite3.Database('./data/database.sqlite');
db1.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables1) => {
  console.log(' database.sqlite tables:', tables1 ? tables1.length : 'ERROR');
  if (tables1) tables1.forEach(t => console.log('  -', t.name));
  
  // Check prospectpi.db
  const db2 = new sqlite3.Database('./data/prospectpi.db');
  db2.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables2) => {
    console.log('\n prospectpi.db tables:', tables2 ? tables2.length : 'ERROR');
    if (tables2) tables2.forEach(t => console.log('  -', t.name));
    
    console.log('\n The system should use the database with existing tables!');
    
    db1.close();
    db2.close();
  });
});
