#!/usr/bin/env node

/**
 * Report Cleanup Utility
 * Removes unused reports, old backups, and regenerates index
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting report cleanup...');

// Files to keep (system files)
const systemFiles = [
  'index.json',
  'stats.json',
  'generate-index.js',
  'generate-index-enhanced.js',
  'generate-index-smart.js',
  'safe-index-regeneration.js',
  'index-monitor.js',
  'cleanup-reports.js',
  'package.json',
  '.deleted-reports.json'
];

// Directories to keep
const systemDirs = ['.backups', 'uploads'];

function getFileAge(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const now = new Date();
    const fileDate = stats.mtime;
    const ageInDays = (now - fileDate) / (1000 * 60 * 60 * 24);
    return ageInDays;
  } catch (error) {
    return 0;
  }
}

function isReportFile(filename) {
  return filename.endsWith('.json') && 
         !systemFiles.includes(filename) &&
         !filename.startsWith('index-');
}

function cleanupOldBackups() {
  const backupDir = '.backups';
  if (!fs.existsSync(backupDir)) return;
  
  console.log('🗂️ Cleaning up old backups...');
  
  const backupFiles = fs.readdirSync(backupDir);
  let removedCount = 0;
  
  backupFiles.forEach(file => {
    const filePath = path.join(backupDir, file);
    const age = getFileAge(filePath);
    
    // Remove backups older than 30 days
    if (age > 30) {
      try {
        fs.unlinkSync(filePath);
        console.log(`  ❌ Removed old backup: ${file} (${Math.round(age)} days old)`);
        removedCount++;
      } catch (error) {
        console.warn(`  ⚠️ Could not remove ${file}: ${error.message}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} old backup files`);
}

function analyzeReports() {
  console.log('📊 Analyzing current reports...');
  
  const files = fs.readdirSync('.');
  const reportFiles = files.filter(isReportFile);
  
  console.log(`📁 Found ${reportFiles.length} report files:`);
  
  const reportAnalysis = reportFiles.map(file => {
    const age = getFileAge(file);
    let size = 0;
    let isValid = false;
    
    try {
      const stats = fs.statSync(file);
      size = stats.size;
      
      // Quick validation check
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      isValid = Array.isArray(data) && data.length > 0;
    } catch (error) {
      isValid = false;
    }
    
    return {
      name: file,
      age: Math.round(age),
      size: Math.round(size / 1024), // KB
      isValid
    };
  });
  
  // Sort by age (newest first)
  reportAnalysis.sort((a, b) => a.age - b.age);
  
  reportAnalysis.forEach(report => {
    const status = report.isValid ? '✅' : '❌';
    console.log(`  ${status} ${report.name} - ${report.age} days old, ${report.size}KB`);
  });
  
  return reportAnalysis;
}

function promptForCleanup(reports) {
  console.log('\n🤔 Cleanup recommendations:');
  
  const oldReports = reports.filter(r => r.age > 90); // 3 months
  const invalidReports = reports.filter(r => !r.isValid);
  const duplicateReports = findDuplicates(reports);
  
  if (oldReports.length > 0) {
    console.log(`📅 Found ${oldReports.length} reports older than 90 days`);
  }
  
  if (invalidReports.length > 0) {
    console.log(`❌ Found ${invalidReports.length} invalid/corrupted reports`);
  }
  
  if (duplicateReports.length > 0) {
    console.log(`🔄 Found ${duplicateReports.length} potential duplicate reports`);
  }
  
  return { oldReports, invalidReports, duplicateReports };
}

function findDuplicates(reports) {
  // Group by similar names (same test suite, different timestamps)
  const groups = {};
  
  reports.forEach(report => {
    // Extract base name without timestamp
    const baseName = report.name.replace(/-\d{4}-\d{2}-\d{2}T[\d-:.]+Z\.json$/, '');
    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(report);
  });
  
  // Find groups with multiple reports
  const duplicates = [];
  Object.values(groups).forEach(group => {
    if (group.length > 5) { // Keep only 5 most recent
      // Sort by age and mark older ones as duplicates
      group.sort((a, b) => a.age - b.age);
      duplicates.push(...group.slice(5)); // Remove all but 5 newest
    }
  });
  
  return duplicates;
}

function performCleanup(toRemove) {
  if (toRemove.length === 0) {
    console.log('✅ No files to remove');
    return;
  }
  
  console.log(`\n🗑️ Removing ${toRemove.length} files...`);
  
  let removedCount = 0;
  toRemove.forEach(report => {
    try {
      fs.unlinkSync(report.name);
      console.log(`  ❌ Removed: ${report.name}`);
      removedCount++;
    } catch (error) {
      console.warn(`  ⚠️ Could not remove ${report.name}: ${error.message}`);
    }
  });
  
  console.log(`✅ Successfully removed ${removedCount} files`);
}

function regenerateIndex() {
  console.log('\n🔄 Regenerating index...');
  
  try {
    // Use the safe regeneration if available
    if (fs.existsSync('safe-index-regeneration.js')) {
      require('./safe-index-regeneration.js').safeRegenerate();
    } else if (fs.existsSync('generate-index-enhanced.js')) {
      require('./generate-index-enhanced.js');
    } else {
      require('./generate-index.js');
    }
    
    console.log('✅ Index regenerated successfully');
  } catch (error) {
    console.error('❌ Failed to regenerate index:', error.message);
  }
}

// Main cleanup process
async function main() {
  try {
    // Step 1: Clean old backups
    cleanupOldBackups();
    
    // Step 2: Analyze current reports
    const reports = analyzeReports();
    
    // Step 3: Get cleanup recommendations
    const { oldReports, invalidReports, duplicateReports } = promptForCleanup(reports);
    
    // Step 4: Automatic cleanup (conservative approach)
    const toRemove = [
      ...invalidReports, // Always remove invalid reports
      ...duplicateReports // Remove duplicates
    ];
    
    // Only remove old reports if there are many
    if (reports.length > 20 && oldReports.length > 0) {
      console.log('📦 Large number of reports detected, removing old ones...');
      toRemove.push(...oldReports);
    }
    
    // Step 5: Perform cleanup
    performCleanup(toRemove);
    
    // Step 6: Regenerate index
    regenerateIndex();
    
    // Step 7: Final summary
    const remainingFiles = fs.readdirSync('.').filter(isReportFile);
    console.log(`\n📊 Cleanup complete!`);
    console.log(`📁 Remaining reports: ${remainingFiles.length}`);
    console.log(`🗑️ Files removed: ${toRemove.length}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };