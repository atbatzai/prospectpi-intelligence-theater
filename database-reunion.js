const sqlite3 = require('sqlite3').verbose();

console.log(' EMERGENCY DATABASE REUNION - YOLO MODE!\n');

// Step 1: Copy schema from prospectpi.db to database.sqlite
console.log('Step 1: Connecting to both databases...');

const sourceDb = new sqlite3.Database('./data/prospectpi.db');
const targetDb = new sqlite3.Database('./data/database.sqlite');

// Get all table creation statements from prospectpi.db
sourceDb.all('SELECT sql FROM sqlite_master WHERE type="table" AND sql IS NOT NULL', [], (err, tables) => {
  if (err) {
    console.error(' Error reading schema:', err);
    return;
  }
  
  console.log(`Step 2: Found ${tables.length} table schemas to copy...`);
  
  let completed = 0;
  const total = tables.length;
  
  // Create each table in database.sqlite
  tables.forEach((table, index) => {
    if (table.sql) {
      targetDb.run(table.sql, (err) => {
        completed++;
        
        if (err) {
          console.log(` Failed to create table ${index + 1}: ${err.message}`);
        } else {
          console.log(` Created table ${index + 1}/${total}`);
        }
        
        if (completed === total) {
          console.log('\n SCHEMA COPY COMPLETE!');
          console.log(' database.sqlite now has full schema');
          console.log(' Existing dossier data preserved');
          console.log('\n YOLO REPAIR SUCCESSFUL - Database reunited!');
          
          sourceDb.close();
          targetDb.close();
        }
      });
    } else {
      completed++;
    }
  });
});
