const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log(' CHECKING NETFLIX DOSSIER STATUS...\n');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Check Netflix dossier
db.get('SELECT * FROM dossiers WHERE request_id = ?', ['req_lm7bpetnwt'], (err, dossier) => {
  if (err) {
    console.error(' Database error:', err);
    return;
  }
  
  if (!dossier) {
    console.log(' Netflix dossier not found');
    return;
  }
  
  console.log(' NETFLIX DOSSIER:', dossier.company_name);
  console.log('   Status:', dossier.status);
  console.log('   Confidence:', dossier.confidence_score);
  console.log('   Created:', dossier.created_at);
  
  // Check intelligence sections
  db.all('SELECT * FROM intelligence_sections WHERE dossier_id = ?', [dossier.id], (err, sections) => {
    if (err) {
      console.error(' Sections error:', err);
      return;
    }
    
    console.log('\n INTELLIGENCE SECTIONS:', sections.length);
    sections.forEach((section, i) => {
      console.log(   .  (%));
    });
    
    // Check data sources
    db.all('SELECT * FROM data_sources WHERE dossier_id = ?', [dossier.id], (err, sources) => {
      if (err) {
        console.error(' Sources error:', err);
        return;
      }
      
      console.log('\n DATA SOURCES:', sources.length);
      sources.forEach((source, i) => {
        console.log(   .  (%));
      });
      
      // Summary
      const status = sections.length > 0 && sources.length > 0 ? ' FIXED' : ' BROKEN';
      console.log(\n NETFLIX STATUS: );
      console.log(   Sections: /7 expected);
      console.log(   Sources: /6 expected);
      
      db.close();
    });
  });
});