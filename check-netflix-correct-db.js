const sqlite3 = require('sqlite3').verbose();

console.log(' CHECKING NETFLIX IN CORRECT DATABASE...\n');

const db = new sqlite3.Database('./data/prospectpi.db');

// Check Netflix dossier in prospectpi.db
db.get('SELECT * FROM dossiers WHERE request_id = ?', ['req_lm7bpetnwt'], (err, dossier) => {
  if (err) {
    console.log(' Error:', err);
    return;
  }
  
  if (!dossier) {
    console.log(' Netflix dossier not found in prospectpi.db');
    return;
  }
  
  console.log(' NETFLIX DOSSIER FOUND!');
  console.log('   Company:', dossier.company_name);
  console.log('   Status:', dossier.status);
  console.log('   Confidence:', dossier.confidence_score);
  
  // Check if intelligence_sections table exists
  db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="intelligence_sections"', [], (err, result) => {
    if (result && result.length > 0) {
      console.log(' intelligence_sections table exists');
      
      // Check sections for this dossier
      db.all('SELECT * FROM intelligence_sections WHERE dossier_id = ?', [dossier.id], (err, sections) => {
        console.log('   Sections:', sections ? sections.length : 'ERROR');
        
        // Check data_sources
        db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="data_sources"', [], (err, result) => {
          if (result && result.length > 0) {
            db.all('SELECT * FROM data_sources WHERE dossier_id = ?', [dossier.id], (err, sources) => {
              console.log('   Sources:', sources ? sources.length : 'ERROR');
              
              const status = (sections && sections.length > 0 && sources && sources.length > 0) ? ' ALREADY FIXED' : ' NEEDS REPAIR';
              console.log('\n STATUS:', status);
              
              db.close();
            });
          } else {
            console.log(' data_sources table does not exist');
            db.close();
          }
        });
      });
    } else {
      console.log(' intelligence_sections table does not exist');
      db.close();
    }
  });
});
