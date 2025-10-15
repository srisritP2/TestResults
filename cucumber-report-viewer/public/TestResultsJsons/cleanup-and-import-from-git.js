#!/usr/bin/env node

/**
 * Cleanup and Import Script
 * 
 * This script:
 * 1. Cleans up all local reports and localStorage
 * 2. Imports all reports from the Git repository TestResultsJsons folder
 * 3. Regenerates the index.json file
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = __dirname;
const INDEX_FILE = path.join(REPORTS_DIR, 'index.json');

console.log('🧹 Starting cleanup and import process...');

// Step 1: Clean up existing files (except this script and generate scripts)
function cleanupExistingFiles() {
  console.log('🗑️  Cleaning up existing files...');
  
  const files = fs.readdirSync(REPORTS_DIR);
  const filesToKeep = [
    'cleanup-and-import-from-git.js',
    'generate-index-enhanced.js',
    'generate-index-tolerant-v2.js',
    'cleanup-reports.js',
    '.gitkeep'
  ];
  
  files.forEach(file => {
    if (!filesToKeep.includes(file) && !file.startsWith('.git')) {
      const filePath = path.join(REPORTS_DIR, file);
      try {
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`   ✅ Deleted: ${file}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not delete ${file}:`, error.message);
      }
    }
  });
}

// Step 2: Find all JSON report files in the directory
function findReportFiles() {
  console.log('🔍 Finding report files...');
  
  const files = fs.readdirSync(REPORTS_DIR);
  const reportFiles = files.filter(file => 
    file.endsWith('.json') && 
    file !== 'index.json' && 
    !file.includes('backup')
  );
  
  console.log(`   📊 Found ${reportFiles.length} report files`);
  return reportFiles;
}

// Step 3: Process each report file and extract metadata
function processReportFiles(reportFiles) {
  console.log('⚙️  Processing report files...');
  
  const reports = [];
  
  reportFiles.forEach(filename => {
    try {
      const filePath = path.join(REPORTS_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const reportData = JSON.parse(fileContent);
      
      // Extract report metadata
      const report = extractReportMetadata(reportData, filename);
      if (report) {
        reports.push(report);
        console.log(`   ✅ Processed: ${filename} -> ${report.name || 'Untitled'}`);
      }
    } catch (error) {
      console.warn(`   ⚠️  Error processing ${filename}:`, error.message);
    }
  });
  
  return reports;
}

// Step 4: Extract metadata from report data
function extractReportMetadata(reportData, filename) {
  try {
    const reportId = filename.replace('.json', '');
    
    // Handle both array and object formats
    const features = Array.isArray(reportData) ? reportData : [reportData];
    
    let totalScenarios = 0;
    let totalSteps = 0;
    let passedSteps = 0;
    let failedSteps = 0;
    let skippedSteps = 0;
    let totalDuration = 0;
    let reportName = '';
    let reportDate = null;
    const tags = new Set();
    
    features.forEach(feature => {
      if (!feature || !feature.elements) return;
      
      // Extract feature name for report name
      if (feature.name && !reportName) {
        reportName = feature.name;
      }
      
      // Extract tags
      if (feature.tags) {
        feature.tags.forEach(tag => {
          if (tag.name) tags.add(tag.name.replace('@', ''));
        });
      }
      
      feature.elements.forEach(scenario => {
        if (scenario.type === 'scenario') {
          totalScenarios++;
          
          if (scenario.steps) {
            scenario.steps.forEach(step => {
              totalSteps++;
              
              if (step.result) {
                const status = step.result.status;
                const duration = step.result.duration || 0;
                totalDuration += duration;
                
                switch (status) {
                  case 'passed':
                    passedSteps++;
                    break;
                  case 'failed':
                    failedSteps++;
                    break;
                  case 'skipped':
                  case 'pending':
                  case 'undefined':
                    skippedSteps++;
                    break;
                }
                
                // Extract timestamp from step if available
                if (step.result.timestamp && !reportDate) {
                  reportDate = new Date(step.result.timestamp);
                }
              }
            });
          }
        }
      });
    });
    
    // Fallback date extraction from filename or current time
    if (!reportDate) {
      const timestampMatch = reportId.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (timestampMatch) {
        const [, year, month, day, hour, minute, second] = timestampMatch;
        reportDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
      } else {
        reportDate = new Date();
      }
    }
    
    return {
      id: reportId,
      name: reportName || 'Test Report',
      date: reportDate.toISOString(),
      timestamp: reportDate.toISOString(),
      features: features.length,
      scenarios: totalScenarios,
      steps: totalSteps,
      passed: passedSteps,
      failed: failedSteps,
      skipped: skippedSteps,
      duration: Math.round(totalDuration / 1000000), // Convert nanoseconds to milliseconds
      tags: Array.from(tags),
      size: JSON.stringify(reportData).length
    };
    
  } catch (error) {
    console.error(`Error extracting metadata from ${filename}:`, error);
    return null;
  }
}

// Step 5: Generate index.json
function generateIndex(reports) {
  console.log('📝 Generating index.json...');
  
  // Sort reports by date (oldest first for consistent numbering)
  reports.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Calculate statistics
  const statistics = {
    totalReports: reports.length,
    totalScenarios: reports.reduce((sum, r) => sum + r.scenarios, 0),
    totalSteps: reports.reduce((sum, r) => sum + r.steps, 0),
    totalPassed: reports.reduce((sum, r) => sum + r.passed, 0),
    totalFailed: reports.reduce((sum, r) => sum + r.failed, 0),
    totalSkipped: reports.reduce((sum, r) => sum + r.skipped, 0),
    passRate: '0.00',
    failRate: '0.00',
    skipRate: '0.00'
  };
  
  if (statistics.totalSteps > 0) {
    statistics.passRate = (statistics.totalPassed / statistics.totalSteps * 100).toFixed(2);
    statistics.failRate = (statistics.totalFailed / statistics.totalSteps * 100).toFixed(2);
    statistics.skipRate = (statistics.totalSkipped / statistics.totalSteps * 100).toFixed(2);
  }
  
  const indexData = {
    reports: reports,
    statistics: statistics,
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    generatedBy: 'cleanup-and-import-from-git.js'
  };
  
  // Write index file
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
  console.log(`   ✅ Generated index.json with ${reports.length} reports`);
  
  return indexData;
}

// Step 6: Clear localStorage (instructions for browser)
function generateCleanupInstructions() {
  console.log('🌐 Browser cleanup instructions:');
  console.log('   To complete the cleanup, run this in your browser console:');
  console.log('   localStorage.clear(); location.reload();');
}

// Main execution
function main() {
  try {
    console.log('🚀 Cleanup and Import from Git Repository');
    console.log('==========================================');
    
    // Step 1: Cleanup existing files
    cleanupExistingFiles();
    
    // Step 2: Find report files
    const reportFiles = findReportFiles();
    
    if (reportFiles.length === 0) {
      console.log('⚠️  No report files found in the directory');
      console.log('   Make sure you have .json report files in:', REPORTS_DIR);
      return;
    }
    
    // Step 3: Process reports
    const reports = processReportFiles(reportFiles);
    
    if (reports.length === 0) {
      console.log('❌ No valid reports could be processed');
      return;
    }
    
    // Step 4: Generate index
    const indexData = generateIndex(reports);
    
    // Step 5: Show cleanup instructions
    generateCleanupInstructions();
    
    console.log('');
    console.log('✅ Cleanup and import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Reports processed: ${reports.length}`);
    console.log(`   - Total scenarios: ${indexData.statistics.totalScenarios}`);
    console.log(`   - Total steps: ${indexData.statistics.totalSteps}`);
    console.log(`   - Pass rate: ${indexData.statistics.passRate}%`);
    console.log('');
    console.log('🔄 Refresh your browser to see the updated reports');
    
  } catch (error) {
    console.error('❌ Error during cleanup and import:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, cleanupExistingFiles, findReportFiles, processReportFiles, generateIndex };