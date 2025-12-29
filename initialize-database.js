const { DatabaseManager } = require('./src/database/DatabaseManager');

async function initializeDatabase() {
  console.log(' YOLO MODE: INITIALIZING DATABASE...\n');
  
  try {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.connect();
    
    console.log(' Database connected, creating tables...');
    
    // This will call createTables() which initializes all the schema
    await dbManager.createTables();
    
    console.log(' DATABASE INITIALIZATION COMPLETE!');
    
    // Now check if tables exist
    const db = dbManager.getSQLiteDatabase();
    db.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables) => {
      if (err) {
        console.error(' Error checking tables:', err);
      } else {
        console.log('\n CREATED TABLES:');
        tables.forEach(table => {
          console.log('  ', table.name);
        });
        console.log('');
      }
      
      process.exit(0);
    });
    
  } catch (error) {
    console.error(' Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
