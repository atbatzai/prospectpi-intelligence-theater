// Simple test to check database state
async function testDatabase() {
  try {
    // Import database manager from compiled JS
    const { DatabaseManager } = require('./dist/database/DatabaseManager.js');
    
    console.log('🔍 Testing database connection and tables...');
    
    const db = DatabaseManager.getInstance();
    
    // Check what tables exist
    console.log('\n📋 Checking existing tables...');
    try {
      const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('Available tables:', tables.map(t => t.name));
    } catch (error) {
      console.log('❌ Error getting tables:', error.message);
    }
    
    // Check if request exists
    console.log('\n🔍 Checking if our test request exists...');
    try {
      const request = await db.queryOne('SELECT * FROM research_requests WHERE request_id = ?', ['req_5995b8dfce1c']);
      console.log('Request found:', request ? 'YES' : 'NO');
      if (request) {
        console.log('Request details:', request);
      }
    } catch (error) {
      console.log('❌ Error checking request:', error.message);
    }
    
    // Check if dossier exists
    console.log('\n📄 Checking if dossier exists...');
    try {
      const dossiers = await db.query('SELECT * FROM dossiers WHERE request_id = ?', ['req_5995b8dfce1c']);
      console.log('Dossiers found:', dossiers.length);
      if (dossiers.length > 0) {
        console.log('Dossier details:', dossiers[0]);
      }
    } catch (error) {
      console.log('❌ Error checking dossiers:', error.message);
    }
    
    // Check if dossier_content exists
    console.log('\n📋 Checking if dossier_content exists...');
    try {
      const content = await db.query('SELECT * FROM dossier_content WHERE request_id = ?', ['req_5995b8dfce1c']);
      console.log('Content found:', content.length);
      if (content.length > 0) {
        console.log('Content details:', content[0]);
      }
    } catch (error) {
      console.log('❌ Error checking dossier_content:', error.message);
    }
    
    // Check data_sources table
    console.log('\n🔍 Checking data_sources table structure...');
    try {
      const schema = await db.query("PRAGMA table_info(data_sources)");
      console.log('data_sources table schema:', schema);
    } catch (error) {
      console.log('❌ Error checking data_sources schema:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();