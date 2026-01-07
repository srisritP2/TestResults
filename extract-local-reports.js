#!/usr/bin/env node
/**
 * Extract Local Reports from Browser localStorage
 * This script helps you get reports from localStorage and prepare them for GitHub upload
 */

console.log('🔍 Local Reports Extraction Guide');
console.log('=====================================\n');

console.log('Since your new report is stored in browser localStorage, follow these steps:\n');

console.log('1. Open Browser Developer Tools (F12)');
console.log('2. Go to Application/Storage → Local Storage → your localhost URL');
console.log('3. Look for keys that start with "uploaded-report-"');
console.log('4. Also check "uploaded-reports-index" for the list of reports\n');

console.log('5. For each new report you want to publish:');
console.log('   - Copy the JSON content from "uploaded-report-XXXXXX"');
console.log('   - Save it as a .json file in cucumber-report-viewer/public/TestResultsJsons/');
console.log('   - Use the format: gct-YYYYMMDD-HHMMSS.json\n');

console.log('6. After adding the files, run:');
console.log('   cd cucumber-report-viewer/public/TestResultsJsons');
console.log('   node generate-index-enhanced.js');
console.log('   git add .');
console.log('   git commit -m "add new report"');
console.log('   git push\n');

console.log('Alternative: Use the "Publish to GitHub Pages" feature in the web UI');
console.log('This will automatically download the files you need to upload.\n');

// Check if we can access any report files that might have been created
const fs = require('fs');
const path = require('path');

const reportsDir = './cucumber-report-viewer/public/TestResultsJsons';
if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir)
        .filter(f => f.startsWith('report-') && f.endsWith('.json'))
        .sort()
        .reverse()
        .slice(0, 5);
    
    if (files.length > 0) {
        console.log('📁 Recent report-* files found:');
        files.forEach(file => {
            const stats = fs.statSync(path.join(reportsDir, file));
            console.log(`   ${file} (${stats.mtime.toISOString()})`);
        });
        console.log('\nThese might be reports that need to be renamed to gct-* format.\n');
    }
}

console.log('💡 Quick Test:');
console.log('Upload a small test report locally, then use the publish feature');
console.log('to see how the process works before publishing your main report.');