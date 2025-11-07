# Quick Upload Guide

## When You Click the Upload/Publish Icon

The system downloads **2 files**:

### 1. index.json
- **What it is**: Master list of all reports
- **Where to save**: `cucumber-report-viewer/public/TestResultsJsons/index.json`
- **Why needed**: Without this, reports won't appear in the collection

### 2. stats.json
- **What it is**: Aggregated statistics (pass rate, total tests, etc.)
- **Where to save**: `cucumber-report-viewer/public/TestResultsJsons/stats.json`
- **Why needed**: Powers the dashboard statistics

## Step-by-Step Process

### After Uploading a Report:

1. **Click the cloud/publish icon** on the report card
2. **Two files will download** to your Downloads folder
3. **Move both files** to the correct location:
   ```
   Downloads/index.json → cucumber-report-viewer/public/TestResultsJsons/index.json
   Downloads/stats.json → cucumber-report-viewer/public/TestResultsJsons/stats.json
   ```
4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add new report and update index"
   git push origin main
   ```
5. **Wait 2-3 minutes** for GitHub Pages to deploy
6. **Refresh** the GitHub Pages site to see your new report

## Important Notes

⚠️ **Always save BOTH files** - Missing either one will cause issues
⚠️ **Overwrite existing files** - Replace the old index.json and stats.json
⚠️ **Push to GitHub** - Local changes won't appear on GitHub Pages until pushed
⚠️ **Wait for deployment** - GitHub Pages takes 2-3 minutes to update

## Alternative: Command Line Method

If you prefer not to use the upload feature:

```bash
# 1. Copy your report to the correct directory
cp /path/to/your/report.json cucumber-report-viewer/public/TestResultsJsons/

# 2. Regenerate index
cd cucumber-report-viewer/public/TestResultsJsons
node generate-index-enhanced.js

# 3. Commit and push
cd ../../..
git add .
git commit -m "Add new test report"
git push origin main
```

## Troubleshooting

**Q: Report not showing in collection?**
A: Check that index.json was updated and pushed to GitHub

**Q: Report shows but won't load when clicked?**
A: Check that the actual report JSON file is in TestResultsJsons/ directory and pushed to GitHub

**Q: Old report count showing?**
A: Wait 2-3 minutes for GitHub Pages deployment, then hard refresh (Ctrl+F5)

**Q: Downloaded files went to wrong location?**
A: Move them from Downloads folder to `cucumber-report-viewer/public/TestResultsJsons/`
