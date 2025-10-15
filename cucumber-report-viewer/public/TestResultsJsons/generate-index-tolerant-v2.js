#!/usr/bin/env node

/**
 * Ultra-Tolerant Index Generation
 * This script will include reports even if they have validation issues
 */

const fs = require('fs');
const path = require('path');

function isReportFile(filename) {
  return filename.endsWith('.json') && 
         filename !== 'index.json' && 
         filename !== 'stats.json' &&
         filename !== 'package.json' &&
         !filename.startsWith('index-') &&
         !filename.startsWith('.deleted');
}

function safeParseReport(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      console.log(`⚠️ ${filename}: Not an array, skipping`);
      return null;
    }
    
    // Basic report structure with defaults
    const report = {
      filename: filename,
      name: extractReportName(filename),
      timestamp: extractTimestamp(filename),
      features: data.length || 0,
      scenarios: 0,
      steps: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      size: fs.statSync(filename).size,
      validationIssues: []
    };
    
    // Count scenarios and steps with error handling
    data.forEach((feature, featureIndex) => {
      if (!feature || typeof feature !== 'object') return;
      
      if (feature.elements && Array.isArray(feature.elements)) {
        report.scenarios += feature.elements.length;
        
        feature.elements.forEach((scenario, scenarioIndex) => {
          if (!scenario || typeof scenario !== 'object') return;
          
          // Handle missing scenario names
          if (!scenario.name) {
            report.validationIssues.push(`Feature ${featureIndex}, Scenario ${scenarioIndex}: Missing name`);
            scenario.name = `Unnamed Scenario ${scenarioIndex + 1}`;
          }
          
          if (scenario.steps && Array.isArray(scenario.steps)) {
            report.steps += scenario.steps.length;
            
            scenario.steps.forEach(step => {
              if (!step || !step.result) return;
              
              const status = step.result.status;
              switch (status) {
                case 'passed': report.passed++; break;
                case 'failed': report.failed++; break;
                case 'skipped': report.skipped++; break;
              }
              
              if (step.result.duration) {
                report.duration += step.result.duration;
              }
            });
          }
        });
      }
    });
    
    return report;
    
  } catch (error) {
    console.log(`❌ ${filename}: Parse error - ${error.message}`);
    return null;
  }
}

function extractReportName(filename) {
  // Extract meaningful name from filename
  if (filename.startsWith('Admin-Client-Settings')) {
    return 'Admin Client Settings Tests';
  } else if (filename.startsWith('report-')) {
    return `Test Report ${filename.replace('report-', '').replace('.json', '')}`;
  } else {
    return filename.replace('.json', '').replace(/-/g, ' ');
  }
}

function extractTimestamp(filename) {
  // Extract timestamp from filename - handle multiple formats
  
  // Format 1: ISO timestamp (2025-07-17T11-06-24-735Z)
  let match = filename.match(/(\d{4}-\d{2}-\d{2}T[\d-:.]+Z)/);
  if (match) {
    try {
      // Convert dashes to colons in time part for proper ISO format
      const isoString = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z');
      const date = new Date(isoString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.log(`⚠️ Failed to parse ISO timestamp from ${filename}: ${error.message}`);
    }
  }
  
  // Format 2: Unix timestamp in milliseconds (report-1756993559697.json)
  match = filename.match(/report-(\d{13})\.json/);
  if (match) {
    try {
      const timestamp = parseInt(match[1]);
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.log(`⚠️ Failed to parse Unix timestamp from ${filename}: ${error.message}`);
    }
  }
  
  // Format 3: Unix timestamp in seconds (report-1756993559.json)
  match = filename.match(/report-(\d{10})\.json/);
  if (match) {
    try {
      const timestamp = parseInt(match[1]) * 1000; // Convert to milliseconds
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.log(`⚠️ Failed to parse Unix timestamp (seconds) from ${filename}: ${error.message}`);
    }
  }
  
  // Fallback to file modification time
  try {
    const stats = fs.statSync(filename);
    return stats.mtime.toISOString();
  } catch (error) {
    console.log(`⚠️ Failed to get file stats for ${filename}, using current time`);
    return new Date().toISOString();
  }
}

function generateIndex() {
  console.log('🔄 Generating tolerant index...');
  
  const files = fs.readdirSync('.').filter(isReportFile);
  console.log(`📁 Found ${files.length} potential report files`);
  
  const reports = [];
  const errors = [];
  
  files.forEach(file => {
    console.log(`📊 Processing: ${file}`);
    const report = safeParseReport(file);
    
    if (report) {
      reports.push(report);
      if (report.validationIssues.length > 0) {
        errors.push({
          file: file,
          errors: report.validationIssues
        });
      }
      console.log(`  ✅ Added: ${report.scenarios} scenarios, ${report.steps} steps`);
    } else {
      errors.push({
        file: file,
        errors: ['Failed to parse file']
      });
      console.log(`  ❌ Skipped due to parse errors`);
    }
  });
  
  // Sort reports by timestamp (newest first)
  reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    totalFeatures: reports.reduce((sum, r) => sum + r.features, 0),
    totalScenarios: reports.reduce((sum, r) => sum + r.scenarios, 0),
    totalSteps: reports.reduce((sum, r) => sum + r.steps, 0),
    totalPassed: reports.reduce((sum, r) => sum + r.passed, 0),
    totalFailed: reports.reduce((sum, r) => sum + r.failed, 0),
    totalSkipped: reports.reduce((sum, r) => sum + r.skipped, 0),
    totalErrors: 0,
    totalDuration: reports.reduce((sum, r) => sum + r.duration, 0),
    totalSize: reports.reduce((sum, r) => sum + r.size, 0),
    totalValidationIssues: errors.reduce((sum, e) => sum + e.errors.length, 0),
    averageDuration: 0,
    passRate: 0,
    failRate: 0,
    skipRate: 0,
    errorRate: 0,
    oldestReport: reports.length > 0 ? reports[reports.length - 1].timestamp : null,
    newestReport: reports.length > 0 ? reports[0].timestamp : null,
    allTags: [],
    environments: [],
    tools: []
  };
  
  // Calculate rates
  const totalTests = stats.totalPassed + stats.totalFailed + stats.totalSkipped;
  if (totalTests > 0) {
    stats.passRate = Math.round((stats.totalPassed / totalTests) * 100 * 100) / 100;
    stats.failRate = Math.round((stats.totalFailed / totalTests) * 100 * 100) / 100;
    stats.skipRate = Math.round((stats.totalSkipped / totalTests) * 100 * 100) / 100;
  }
  
  if (reports.length > 0) {
    stats.averageDuration = Math.round(stats.totalDuration / reports.length);
  }
  
  // Create index
  const index = {
    generated: new Date().toISOString(),
    version: '2.1.0',
    reports: reports,
    deletionInfo: {
      deletedCount: 0,
      pendingCleanup: 0,
      lastDeletionAt: null
    },
    statistics: stats,
    errors: errors
  };
  
  // Write index
  fs.writeFileSync('index.json', JSON.stringify(index, null, 2));
  
  console.log('✅ Index generation completed successfully!');
  console.log(`📊 Reports: ${reports.length}`);
  console.log(`⚠️  Errors: ${errors.length}`);
  console.log(`📈 Pass rate: ${stats.passRate}%`);
  
  return index;
}

// Run if called directly
if (require.main === module) {
  generateIndex();
}

module.exports = { generateIndex };