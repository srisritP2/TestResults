#!/usr/bin/env node
/**
 * Rename Report Files to Short Format
 * Converts long descriptive names to clean, short format
 * 
 * Old: Admin-Client-Settings-Page-Test-Scenarios-2025-10-28T12-46-18-396Z.json
 * New: gct-20251028-124618.json
 */

const fs = require('fs');
const path = require('path');

const reportsDir = __dirname;

// Parse ISO timestamp from filename
function parseTimestamp(filename) {
  // Match ISO timestamp pattern: YYYY-MM-DDTHH-MM-SS-MSSZ
  const match = filename.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-\d{3}Z/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return { year, month, day, hour, minute, second };
  }
  return null;
}

// Generate new short filename
function generateShortName(timestamp) {
  const { year, month, day, hour, minute, second } = timestamp;
  return `gct-${year}${month}${day}-${hour}${minute}${second}.json`;
}

// Main rename function
function renameReports() {
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith('.json') && 
                 f !== 'index.json' && 
                 f !== 'stats.json' &&
                 !f.startsWith('gct-')); // Skip already renamed files

  console.log(`\n📁 Found ${files.length} files to rename\n`);

  let renamed = 0;
  let skipped = 0;
  const renames = [];

  files.forEach(oldFilename => {
    const timestamp = parseTimestamp(oldFilename);
    
    if (!timestamp) {
      console.log(`⚠️  Skipped: ${oldFilename} (no timestamp found)`);
      skipped++;
      return;
    }

    const newFilename = generateShortName(timestamp);
    const oldPath = path.join(reportsDir, oldFilename);
    const newPath = path.join(reportsDir, newFilename);

    // Check if new file already exists
    if (fs.existsSync(newPath)) {
      console.log(`⚠️  Skipped: ${oldFilename} (${newFilename} already exists)`);
      skipped++;
      return;
    }

    try {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ ${oldFilename}`);
      console.log(`   → ${newFilename}\n`);
      renamed++;
      renames.push({ old: oldFilename, new: newFilename });
    } catch (error) {
      console.error(`❌ Failed to rename ${oldFilename}: ${error.message}`);
      skipped++;
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`   ✅ Renamed: ${renamed} files`);
  console.log(`   ⚠️  Skipped: ${skipped} files`);
  console.log(`${'='.repeat(60)}\n`);

  // Save rename log
  if (renames.length > 0) {
    const logPath = path.join(reportsDir, '.rename-log.json');
    const existingLog = fs.existsSync(logPath) 
      ? JSON.parse(fs.readFileSync(logPath, 'utf8')) 
      : [];
    
    const newLog = {
      timestamp: new Date().toISOString(),
      renames: renames
    };
    
    existingLog.push(newLog);
    fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));
    console.log(`📝 Rename log saved to .rename-log.json\n`);
  }

  return { renamed, skipped };
}

// Run if called directly
if (require.main === module) {
  console.log('\n🔄 Starting Report Rename Process...\n');
  const result = renameReports();
  
  if (result.renamed > 0) {
    console.log('✨ Done! Remember to regenerate the index:');
    console.log('   node generate-index-enhanced.js\n');
  }
}

module.exports = { renameReports, parseTimestamp, generateShortName };
