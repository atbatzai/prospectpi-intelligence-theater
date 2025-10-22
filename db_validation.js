const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./intelligence_theater.db");

console.log("DATABASE VALIDATION REPORT");
console.log("========================");

db.all("SELECT name FROM sqlite_master WHERE type=\"table\"", [], (err, tables) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  
  console.log("Tables:", tables.map(t => t.name).join(", "));
  
  db.all("SELECT request_id, company_name, status, created_at FROM dossiers ORDER BY created_at DESC LIMIT 3", [], (err, dossiers) => {
    if (err) {
      console.error("Dossiers error:", err);
    } else {
      console.log(`\nRecent Dossiers (${dossiers.length}):`);
      dossiers.forEach((d, i) => {
        console.log(`${i + 1}. ${d.request_id} - ${d.company_name || "Unknown"} (${d.status})`);
      });
    }
    
    db.get("SELECT * FROM dossiers WHERE status = \"completed\" AND dossier_data IS NOT NULL ORDER BY created_at DESC LIMIT 1", [], (err, completedDossier) => {
      if (err) {
        console.error("Completed dossier check error:", err);
      } else if (completedDossier) {
        console.log("\nLATEST COMPLETED DOSSIER:");
        console.log(`Company: ${completedDossier.company_name}`);
        console.log(`Request ID: ${completedDossier.request_id}`);
        
        if (completedDossier.dossier_data) {
          try {
            const dossier = JSON.parse(completedDossier.dossier_data);
            const sections = [
              "executiveSummary", "companyOverview", "technologyStack", 
              "competitiveIntelligence", "budgetAndProcurement", "keyPersonnel",
              "salesIntelligence", "riskAssessment", "strategicRecommendations"
            ];
            
            let completedSections = 0;
            let totalWords = 0;
            
            console.log("\nCONTENT SECTIONS:");
            sections.forEach(section => {
              if (dossier[section]) {
                completedSections++;
                const content = typeof dossier[section] === "string" ? 
                  dossier[section] : JSON.stringify(dossier[section]);
                const words = content.split(" ").length;
                totalWords += words;
                console.log(` ${section}: ${words} words`);
              } else {
                console.log(` ${section}: Missing`);
              }
            });
            
            const completeness = Math.round((completedSections / sections.length) * 100);
            const avgWords = Math.round(totalWords / completedSections);
            
            console.log(`\nQUALITY METRICS:`);
            console.log(`Completeness: ${completeness}% (${completedSections}/${sections.length})`);
            console.log(`Average words per section: ${avgWords}`);
            console.log(`Total content: ${totalWords} words`);
            
            if (completeness >= 80 && avgWords >= 100) {
              console.log(" EXCELLENT - High quality dossier!");
            } else if (completeness >= 60 && avgWords >= 50) {
              console.log(" GOOD - Solid content quality");
            } else {
              console.log(" NEEDS IMPROVEMENT - Content quality below standards");
            }
            
          } catch (e) {
            console.log("Invalid JSON in dossier data");
          }
        }
      } else {
        console.log("\nNo completed dossiers found");
        console.log("Ready to generate fresh dossier for testing");
      }
      
      db.close();
    });
  });
});
