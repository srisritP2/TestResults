# Report Upload Workflow Guide

## Current Situation

When you upload a report through the UI (upload icon), here's what happens:

### ✅ What Works
1. Report is saved to **localStorage** (browser storage)
2. **localStorage index** (`uploaded-reports-index`) is updated
3. Report appears immediately in the UI
4. You can view the report right away

### ❌ What Doesn't Work Automatically
1. Physical `index.json` file in `public/TestResultsJsons/` is **NOT updated**
2. Report JSON file is **NOT saved** to the repository
3. Changes are **NOT pushed** to GitHub
4. GitHub Pages doesn't get the new report

## Why This Happens

The upload flow has two separate storage systems:

### 1. Browser Storage (localStorage)
- **Purpose**: Immediate viewing and session persistence
- **Location**: Your browser's localStorage
- **Scope**: Only visible to you, on your machine
- **Persistence**: Until you clear browser data

### 2. Repository Storage (Git)
- **Purpose**: Permanent storage and GitHub Pages deployment
- **Location**: `cucumber-report-viewer/public/TestResultsJsons/`
- **Scope**: Visible to everyone via GitHub Pages
- **Persistence**: Permanent (until manually deleted)

## The Complete Workflow

### Option 1: Manual Workflow (Current)

1. **Upload via UI** → Saves to localStorage only
2. **Manually copy** the JSON file to `public/TestResultsJsons/`
3. **Run index generator**:
   ```bash
   cd cucumber-report-viewer/public/TestResultsJsons
   node generate-index-enhanced.js
   ```
4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add new test report"
   git push
   ```
5. **GitHub Actions** automatically deploys to GitHub Pages

### Option 2: Automated Workflow (Recommended)

We have a GitHub Actions workflow that **automatically** updates the index when you push JSON files!

#### How to Use It:

1. **Upload via UI** → Report saved to localStorage
2. **Download the report** from localStorage:
   - Click the "Manage" button in the uploader
   - Click the download icon next to your report
   - Save the JSON file
3. **Copy to repository**:
   ```bash
   # Copy the downloaded file to the reports directory
   copy Downloads\report-*.json cucumber-report-viewer\public\TestResultsJsons\
   ```
4. **Commit and push** (just the JSON file):
   ```bash
   git add cucumber-report-viewer/public/TestResultsJsons/report-*.json
   git commit -m "Add new test report"
   git push
   ```
5. **GitHub Actions automatically**:
   - Detects the new JSON file
   - Runs `generate-index-enhanced.js`
   - Updates `index.json` and `stats.json`
   - Commits and pushes the changes
   - Triggers deployment to GitHub Pages

## Improving the Workflow

### Solution 1: Add Download Button to ReportUploader

We can add a feature to automatically download the JSON file after upload, making it easier to add to the repository.

### Solution 2: Backend Server Integration

If you run the Node.js backend server (`server.js`), reports can be uploaded directly to the file system:

1. **Start the server**:
   ```bash
   cd cucumber-report-viewer
   node server.js
   ```
2. **Upload via UI** → Automatically saves to `public/TestResultsJsons/`
3. **Index is automatically updated**
4. **Just commit and push**:
   ```bash
   git add .
   git commit -m "Add new test report"
   git push
   ```

### Solution 3: GitHub Actions Workflow Trigger

The workflow is already configured to run automatically when JSON files are pushed. The trigger is:

```yaml
on:
  push:
    paths:
      - "cucumber-report-viewer/public/TestResultsJsons/*.json"
      - "!cucumber-report-viewer/public/TestResultsJsons/index.json"
      - "!cucumber-report-viewer/public/TestResultsJsons/stats.json"
```

This means:
- ✅ Runs when any `.json` file is pushed to `TestResultsJsons/`
- ❌ Ignores changes to `index.json` and `stats.json` (to avoid loops)

## Quick Reference

### Current Manual Process
```bash
# 1. Upload via UI (saves to localStorage)
# 2. Run index generator
cd cucumber-report-viewer/public/TestResultsJsons
node generate-index-enhanced.js

# 3. Commit and push
git add index.json stats.json
git commit -m "Update reports index"
git push
```

### Recommended Process with Automation
```bash
# 1. Upload via UI (saves to localStorage)
# 2. Copy JSON file to repository
copy Downloads\report-*.json cucumber-report-viewer\public\TestResultsJsons\

# 3. Commit and push (GitHub Actions handles the rest)
git add cucumber-report-viewer/public/TestResultsJsons/report-*.json
git commit -m "Add new test report"
git push

# GitHub Actions automatically:
# - Runs generate-index-enhanced.js
# - Updates index.json and stats.json
# - Commits and pushes changes
# - Deploys to GitHub Pages
```

### With Backend Server Running
```bash
# 1. Start server
cd cucumber-report-viewer
node server.js

# 2. Upload via UI (automatically saves to file system)

# 3. Commit and push
git add cucumber-report-viewer/public/TestResultsJsons/
git commit -m "Add new test report"
git push
```

## Verification

After pushing, you can verify the workflow ran successfully:

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Look for "Update Cucumber Reports Index" workflow
4. Check that it completed successfully (green checkmark)
5. Verify the commit shows updated `index.json` and `stats.json`

## Summary

**Current State**: Upload via UI only saves to localStorage, not to the repository.

**Why**: The browser can't write files directly to your file system for security reasons.

**Solution**: Either:
1. Manually run the index generator after uploading
2. Use the GitHub Actions automation (push JSON → auto-update index)
3. Run the backend server for direct file system access

**Recommendation**: Use GitHub Actions automation - just push the JSON file and let the workflow handle the index update automatically!
