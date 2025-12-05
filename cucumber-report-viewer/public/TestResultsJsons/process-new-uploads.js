const fs = require('fs');
const path = require('path');

const reportsDir = __dirname;

// Find all report-*.json files (uploaded via UI)
const uploadedFiles = fs.readdirSync(reportsDir)
  .filter(f => f.startsWith('report-') && f.endsWith('.json') && !f.includes('100percent'));

if (uploadedFiles.length === 0) {
  console.log('✅ No new uploaded reports to process');
  process.exit(0);
}

console.log(`\n📤 Found ${uploadedFiles.length} uploaded report(s) to process:\n`);

uploadedFiles.forEach(file => {
  console.log(`Processing: ${file}`);
  
  const filePath = path.join(reportsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  try {
    const data = JSON.parse(content);
    
    // Check if it's valid Cucumber JSON
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`   ❌ Invalid format - not a Cucumber report array`);
      return;
    }
    
    // Check if it's a rename log
    if (data[0].timestamp && data[0].renames) {
      console.log(`   ❌ Rename log file - deleting`);
      fs.unlinkSync(filePath);
      return;
    }
    
    // Extract timestamp from first scenario
    let timestamp = null;
    if (data[0].elements && data[0].elements[0] && data[0].elements[0].start_timestamp) {
      timestamp = new Date(data[0].elements[0].start_timestamp);
    }
    
    if (!timestamp) {
      console.log(`   ⚠️  No timestamp found - using current time`);
      timestamp = new Date();
    }
    
    // Generate new filename in gct format
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hours = String(timestamp.getHours()).padStart(2, '0');
    const minutes = String(timestamp.getMinutes()).padStart(2, '0');
    const seconds = String(timestamp.getSeconds()).padStart(2, '0');
    
    const newFilename = `gct-${year}${month}${day}-${hours}${minutes}${seconds}.json`;
    const newPath = path.join(reportsDir, newFilename);
    
    // Rename the file
    fs.renameSync(filePath, newPath);
    console.log(`   ✅ Renamed to: ${newFilename}`);
    
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
});

console.log('\n✨ Processing complete! Now regenerate the index:\n   node generate-index-enhanced.js\n');
