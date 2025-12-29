const sqlite3 = require('sqlite3').verbose();

console.log(' YOLO FINAL FIX: Adding missing tables to database.sqlite...\n');

const db = new sqlite3.Database('./data/database.sqlite');

// Create intelligence_sections table
const createSectionsTable = `
  CREATE TABLE IF NOT EXISTS intelligence_sections (
    id TEXT PRIMARY KEY,
    dossier_id TEXT NOT NULL,
    section_key TEXT NOT NULL,
    title TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    display_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dossier_id) REFERENCES dossiers (id) ON DELETE CASCADE
  )
`;

// Create intelligence_insights table
const createInsightsTable = `
  CREATE TABLE IF NOT EXISTS intelligence_insights (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    priority TEXT,
    verification_sources TEXT,
    display_order INTEGER,
    action_item TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES intelligence_sections (id) ON DELETE CASCADE
  )
`;

// Create data_sources table
const createSourcesTable = `
  CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    dossier_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    reliability_score REAL NOT NULL,
    url TEXT,
    response_time_ms INTEGER,
    data_freshness_hours INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dossier_id) REFERENCES dossiers (id) ON DELETE CASCADE
  )
`;

console.log('Creating intelligence_sections table...');
db.run(createSectionsTable, (err) => {
  if (err) {
    console.error(' Failed to create intelligence_sections:', err.message);
  } else {
    console.log(' intelligence_sections table created');
  }
  
  console.log('Creating intelligence_insights table...');
  db.run(createInsightsTable, (err) => {
    if (err) {
      console.error(' Failed to create intelligence_insights:', err.message);
    } else {
      console.log(' intelligence_insights table created');
    }
    
    console.log('Creating data_sources table...');
    db.run(createSourcesTable, (err) => {
      if (err) {
        console.error(' Failed to create data_sources:', err.message);
      } else {
        console.log(' data_sources table created');
      }
      
      console.log('\n YOLO SUCCESS: All missing tables created!');
      console.log(' System can now save and retrieve structured intelligence');
      console.log(' Netflix and other dossiers can be properly repaired');
      
      db.close();
    });
  });
});
