#!/usr/bin/env node
/**
 * Cleanup Reports - Remove duplicates and empty reports
 * 
 * This script:
 * 1. Finds reports with 0 tests (empty/invalid)
 * 2. Finds duplicate reports (same date/time)
 * 3. Deletes them and updates the index
 */

const fs = require('fs');
const path = require('path');

const reportsDir = __dirname;

// Find all report files
function getAllReports() {
  return fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('gct-') && f.endsWith('.json'))
    .map(filename => {
      const filePath = path.join(reportsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        path: filePath,
        size: stats.size
      };
    });
}

// Check if report is empty (has no tests)
function isEmptyReport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Check if it's an array
    if (!Array.isArray(data)) {
      return true;
    }
    
    // Check if it has any features
    if (data.length === 0) {
      return true;
    }
    
    // Count total scenarios and steps
    let totalScenarios = 0;
    let totalSteps = 0;
    
    data.forEach(feature => {
      if (feature.elements && Array.isArray(feature.elements)) {
        totalScenarios += feature.elements.length;
        feature.elements.forEach(scenario => {
          if (scenario.steps && Array.isArray(scenario.steps)) {
            totalSteps += scenario.steps.length;
          }
        });
      }
    });
    
    // Report is empty if it has no scenarios or steps
    return totalScenarios === 0 || totalSteps === 0;
    
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return true; // Consider it empty if we can't read it
  }
}

// Find duplicates based on date/time
function findDuplicates(reports) {
  const dateMap = new Map();
  const duplicates = [];
  
  reports.forEach(report => {
    // Extract date-time from filename: gct-YYYYMMDD-HHMMSS.json
    const match = report.filename.match(/gct-(\d{8})-(\d{6})\.json/);
    if (match) {
      const dateTime = `${match[1]}-${match[2]}`;
      
      if (dateMap.has(dateTime)) {
        // This is a duplicate - keep the larger file
        const existing = dateMap.get(dateTime);
        if (report.size > existing.size) {
          duplicates.push(existing);
          dateMap.set(dateTime, report);
        } else {
          duplicates.push(report);
        }
      } else {
        dateMap.set(dateTime, report);
      }
    }
  });
  
  return duplicates;
}

// Main cleanup function
function cleanupReports() {
  console.log('\n🧹 Starting Report Cleanup...\n');
  
  const reports = getAllReports();
  console.log(`📊 Found ${reports.length} total reports\n`);
  
  // Find empty reports
  console.log('🔍 Checking for empty reports...');
  const emptyReports = reports.filter(r => isEmptyReport(r.path));
  console.log(`   Found ${emptyReports.length} empty reports\n`);
  
  // Find duplicates
  console.log('🔍 Checking for duplicates...');
  const duplicates = findDuplicates(reports);
  console.log(`   Found ${duplicates.length} duplicate reports\n`);
  
  // Combine all reports to delete
  const toDelete = [...new Set([...emptyReports, ...duplicates])];
  
  if (toDelete.length === 0) {
    console.log('✅ No reports to delete. Everything looks good!\n');
    return { deleted: 0, remaining: reports.length };
  }
  
  console.log(`🗑️  Deleting ${toDelete.length} reports:\n`);
  
  let deleted = 0;
  toDelete.forEach(report => {
    try {
      fs.unlinkSync(report.path);
      console.log(`   ✅ Deleted: ${report.filename}`);
      deleted++;
    } catch (error) {
      console.error(`   ❌ Failed to delete ${report.filename}:`, error.message);
    }
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Cleanup Summary:`);
  console.log(`   🗑️  Deleted: ${deleted} reports`);
  console.log(`   📁 Remaining: ${reports.length - deleted} reports`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (deleted > 0) {
    console.log('✨ Done! Remember to regenerate the index:');
    console.log('   node generate-index-enhanced.js\n');
  }
  
  return { deleted, remaining: reports.length - deleted };
}

// Run if called directly
if (require.main === module) {
  cleanupReports();
}

module.exports = { cleanupReports, isEmptyReport, findDuplicates };
