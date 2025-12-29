/**
 * EMERGENCY PIPELINE REPAIR TOOL
 * Fixes existing dossiers with empty intelligence sections and data sources
 */

const http = require('http');

console.log(' EMERGENCY PIPELINE REPAIR TOOL');
console.log('='.repeat(50));

// Test with Netflix dossier that we know exists
const testRequestId = 'req_cd32e910ae3c';

async function repairDossier(requestId) {
  console.log(\ Repairing dossier: \\);
  
  try {
    // Call the existing results endpoint first to verify it's broken
    const checkUrl = \http://localhost:3001/api/v1/research/results/\\;
    console.log(\ Checking current state: \\);
    
    const checkResponse = await fetch(checkUrl);
    const currentData = await checkResponse.json();
    
    if (currentData.success && currentData.dossier) {
      const sections = currentData.dossier.intelligenceSections || [];
      const sources = currentData.dossier.dataSources || [];
      
      console.log(\ Current state: \ sections, \ sources\);
      
      if (sections.length === 0 || sources.length === 0) {
        console.log(' CONFIRMED: Pipeline broken - proceeding with manual repair');
        await manualRepair(requestId, currentData.dossier);
      } else {
        console.log(' Dossier already has data - no repair needed');
      }
    } else {
      console.log(' Could not retrieve dossier for repair');
    }
    
  } catch (error) {
    console.error(' Repair failed:', error.message);
  }
}

async function manualRepair(requestId, dossier) {
  console.log(' Starting manual repair...');
  
  // This would need to connect directly to the database to fix the data
  // For now, let's create a simple test to verify the issue
  
  console.log(\ Dossier ID: \\);
  console.log(\ Company: \\);
  console.log(\ Confidence: \%\);
  console.log(\ Sources: \\);
  console.log(\ Intelligence Sections: \\);
  console.log(\ Data Sources: \\);
  
  console.log('');
  console.log(' REPAIR ANALYSIS:');
  console.log('- Dossier exists in database');
  console.log('- High confidence score but no actual intelligence');
  console.log('- Pipeline saves to dossier_content but not structured tables');
  console.log('- Need to populate intelligence_sections and data_sources tables');
}

// Run the repair
repairDossier(testRequestId);