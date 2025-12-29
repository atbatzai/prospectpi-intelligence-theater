const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

// Check Netflix sections and sources count
db.get('SELECT COUNT(*) as sections FROM intelligence_sections WHERE dossier_id = (SELECT id FROM dossiers WHERE request_id = ?)', ['req_8d9ae0d2a6e4'], (err, sectionResult) => {
  db.get('SELECT COUNT(*) as sources FROM data_sources WHERE dossier_id = (SELECT id FROM dossiers WHERE request_id = ?)', ['req_8d9ae0d2a6e4'], (err, sourceResult) => {
    console.log(' NETFLIX STATUS CHECK:');
    console.log('   Request ID: req_8d9ae0d2a6e4');
    console.log('   Sections:', sectionResult ? sectionResult.sections : 'ERROR');
    console.log('   Sources:', sourceResult ? sourceResult.sources : 'ERROR');
    
    const needsRepair = (!sectionResult || sectionResult.sections === 0) && (!sourceResult || sourceResult.sources === 0);
    console.log('   Status:', needsRepair ? ' NEEDS REPAIR' : ' ALREADY FIXED');
    
    db.close();
  });
});
