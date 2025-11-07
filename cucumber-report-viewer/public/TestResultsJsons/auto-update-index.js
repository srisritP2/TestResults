#!/usr/bin/env node

/**
 * Auto-Update Index Script
 * 
 * This script watches for new report files and automatically:
 * 1. Regenerates index.json
 * 2. Updates stats.json
 * 3. Commits changes to git
 * 4. Pushes to GitHub
 * 
 * Usage:
 *   node auto-update-index.js
 * 
 * Or add to package.json scripts:
 *   "auto-index": "node public/TestResultsJsons/auto-update-index.js"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = __dirname;
const INDEX_FILE = path.join(REPORTS_DIR, 'index.json');
const STATS_FILE = path.join(REPORTS_DIR, 'stats.json');

console.log('🔍 Checking for new reports...');

// Check if there are any uncommitted JSON files
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
  const hasNewReports = gitStatus.split('\n').some(line => 
    line.includes('.json') && line.includes('TestResultsJsons')
  );

  if (!hasNewReports) {
    console.log('✅ No new reports found. Index is up to date.');
    process.exit(0);
  }

  console.log('📊 New reports detected! Updating index...');

  // Run the index generator
  execSync('node generate-index-enhanced.js', { 
    cwd: REPORTS_DIR,
    stdio: 'inherit'
  });

  console.log('✅ Index updated successfully!');

  // Check if user wants to auto-commit
  const args = process.argv.slice(2);
  if (args.includes('--commit')) {
    console.log('📝 Committing changes...');
    
    execSync('git add .', { cwd: path.join(REPORTS_DIR, '../..'), stdio: 'inherit' });
    execSync('git commit -m "Auto-update: Add new test report and regenerate index"', { 
      cwd: path.join(REPORTS_DIR, '../..'),
      stdio: 'inherit'
    });

    if (args.includes('--push')) {
      console.log('🚀 Pushing to GitHub...');
      execSync('git push origin main', { 
        cwd: path.join(REPORTS_DIR, '../..'),
        stdio: 'inherit'
      });
      console.log('✅ Changes pushed to GitHub!');
      console.log('⏳ Wait 2-3 minutes for GitHub Pages deployment');
    } else {
      console.log('✅ Changes committed. Run "git push origin main" to deploy.');
    }
  } else {
    console.log('💡 Tip: Run with --commit to auto-commit, or --commit --push to auto-push');
    console.log('   Example: node auto-update-index.js --commit --push');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
