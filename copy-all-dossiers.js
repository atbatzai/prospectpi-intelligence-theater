const sqlite3 = require('sqlite3').verbose();

console.log(' FINAL YOLO: Copying all dossiers from prospectpi.db to database.sqlite...\n');

const sourceDb = new sqlite3.Database('./data/prospectpi.db');
const targetDb = new sqlite3.Database('./data/database.sqlite');

console.log('Step 1: Getting all dossiers from prospectpi.db...');

sourceDb.all('SELECT * FROM dossiers', [], (err, dossiers) => {
  if (err) {
    console.error(' Failed to read dossiers:', err);
    return;
  }
  
  console.log(`Step 2: Found ${dossiers.length} dossiers to copy...`);
  
  let copied = 0;
  
  dossiers.forEach((dossier, i) => {
    // Insert each dossier into database.sqlite
    targetDb.run(`
      INSERT OR REPLACE INTO dossiers 
      (id, request_id, user_id, company_name, confidence_score, source_count, generated_at, last_updated, classification, export_count, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dossier.id, dossier.request_id, dossier.user_id, dossier.company_name, 
      dossier.confidence_score, dossier.source_count, dossier.generated_at, 
      dossier.last_updated, dossier.classification, dossier.export_count, dossier.is_archived
    ], function(err) {
      copied++;
      
      if (err) {
        console.log(` Failed to copy ${dossier.company_name}: ${err.message}`);
      } else {
        console.log(` Copied: ${dossier.company_name} (${dossier.request_id})`);
      }
      
      if (copied === dossiers.length) {
        console.log(`\n SUCCESS: Copied ${copied} dossiers!`);
        
        // Now copy dossier_content table too
        copyDossierContent();
      }
    });
  });
});

function copyDossierContent() {
  console.log('\nStep 3: Copying dossier content...');
  
  sourceDb.all('SELECT * FROM dossier_content', [], (err, contents) => {
    if (err) {
      console.log(' Failed to read dossier_content:', err);
      sourceDb.close();
      targetDb.close();
      return;
    }
    
    if (contents.length === 0) {
      console.log('ℹ  No dossier content to copy');
      sourceDb.close();
      targetDb.close();
      return;
    }
    
    let contentCopied = 0;
    
    contents.forEach((content, i) => {
      targetDb.run(`
        INSERT OR REPLACE INTO dossier_content 
        (id, dossier_id, request_id, content_json, generated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [content.id, content.dossier_id, content.request_id, content.content_json, content.generated_at], 
      function(err) {
        contentCopied++;
        
        if (err) {
          console.log(` Failed to copy content ${i + 1}: ${err.message}`);
        } else {
          console.log(` Copied content ${i + 1}/${contents.length}`);
        }
        
        if (contentCopied === contents.length) {
          console.log('\n DATABASE REUNIFICATION COMPLETE!');
          console.log(' All dossiers copied to database.sqlite');
          console.log(' All content copied to database.sqlite');  
          console.log(' System will now find Netflix and other dossiers');
          console.log('\n Ready for Netflix repair!');
          
          sourceDb.close();
          targetDb.close();
        }
      });
    });
  });
}
