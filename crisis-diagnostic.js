console.log(' CRISIS DIAGNOSTIC: Pipeline failure analysis');
const { DatabaseManager } = require('./src/database/DatabaseManager');

async function diagnoseCrisis() {
  try {
    const db = DatabaseManager.getInstance();
    
    console.log('1. CHECKING RECENT DOSSIERS:');
    const dossiers = await db.query('SELECT * FROM dossiers ORDER BY generated_at DESC LIMIT 5');
    console.log(\Found \ dossiers\);
    
    for (const d of dossiers) {
      console.log(\- \ (\): confidence \\);
      
      const sections = await db.query('SELECT * FROM intelligence_sections WHERE dossier_id = ?', [d.id]);
      const sources = await db.query('SELECT * FROM data_sources WHERE dossier_id = ?', [d.id]);
      
      console.log(\   Sections: \, Sources: \\);
    }
    
    if (dossiers.length > 0) {
      const latest = dossiers[0];
      const sections = await db.query('SELECT * FROM intelligence_sections WHERE dossier_id = ?', [latest.id]);
      const sources = await db.query('SELECT * FROM data_sources WHERE dossier_id = ?', [latest.id]);
      
      console.log(\\n CRISIS CONFIRMED: Latest dossier \ has \ sections and \ sources\);
      
      if (sections.length === 0 && sources.length === 0) {
        console.log(' PIPELINE COMPLETELY BROKEN - NO INTELLIGENCE DATA SAVED');
      }
    }
    
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
  }
}

diagnoseCrisis();